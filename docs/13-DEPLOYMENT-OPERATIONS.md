# PhysicsOS Deployment und Betrieb

Dieses Runbook behandelt die Grundlage für Produktions-Container: CI-Gates, unveränderliche
Image-Builds, Compose-Start, Health-Verifikation, Backups, Wiederherstellungsübungen
und Rollback. Es autorisiert für sich genommen weder einen Push noch ein Deployment.

## 1. Produktionstopologie

Der Compose-Stack betreibt drei zustandsbehaftete Rollen:

| Service    | Verantwortung                                                    | Persistente Daten       |
| ---------- | ---------------------------------------------------------------- | ----------------------- |
| `app`      | Harness-Web-/API-Host plus PhysicsOS-Host-Plugins                | `app_data` (`DSH_HOME`) |
| `postgres` | Relationale Speicherung von Konten, Lernverlauf und Ereignissen | `postgres_data`         |
| `redis`    | Gemeinsames Rate Limiting, Queues und kurzlebige Koordination    | `redis_data`            |

Die App wird standardmäßig nur auf dem Loopback des Hosts veröffentlicht:

```text
127.0.0.1:${PHYSICSOS_HTTP_PORT:-3080} -> app:3080
```

Für Fernzugriff ist auf dem Host ein authentifizierter TLS-Reverse-Proxy vorzuschalten. Der rohe
Harness-Web-Port darf nicht an eine öffentliche Schnittstelle gebunden werden.

Jeder Service hat einen Docker-Healthcheck. Die Route `/healthz` der App meldet die Prozess-
Liveness; `/readyz` ist die fail-closed-Readiness für PostgreSQL und Redis. Docker
startet die App erst, wenn beide Abhängigkeiten gesund sind.

Die unterstützte Topologie für die öffentliche Beta ist **eine einzelne `app`-Replik**. Session-Logs
liegen unter `DSH_HOME` (`PHYSICSOS_SESSIONS_ROOT`, Standard
`dshHomePath('sessions')` im Volume `app_data`). Eine zweite Replik sieht
nur die Sessions, die sie selbst geschrieben hat, es sei denn, das Root zeigt auf ein gemeinsames
Dateisystem; die App sollte daher erst nach einem Test dieser Änderung horizontal skaliert werden.

## 2. Voraussetzungen

- Docker Engine mit Compose v2
- Ein initialisiertes Repository, einschließlich `vendor/deepseek-harness`
- Ein Deployment-Host mit genug Festplatte für drei benannte Volumes und lokale Backups
- Ein Reverse Proxy, TLS-Zertifikat, DNS-Name und eine Netzwerk-Allowlist für die
  Deployment-Umgebung

Die lokalen Secret-Pfade `.env.*` werden von Git ignoriert. Secrets dürfen niemals im
Image, in Compose-Umgebungswerten, Quelldateien oder Frontend-Bundles stehen.

## 3. Secrets konfigurieren

Compose bindet sieben Secret-Dateien ein. `scripts/docker-entrypoint.mjs` materialisiert
jedes `<NAME>_FILE` in die einfache Variable `<NAME>`, die der Harness liest; eine
fehlende oder leere Datei bricht den Start ab, statt stillschweigend zu degradieren.

Einmal pro Umgebung anlegen:

```sh
umask 077
openssl rand -hex 32 > .env.postgres_password
openssl rand -hex 32 > .env.redis_password
# Bootstrap-SUPER_ADMIN. Es gibt keinen Self-Service-Weg zu einem Admin-Konto:
# Die Registrierung erzeugt immer nur STUDENT. Hier wird kein Standardpasswort erfunden.
openssl rand -base64 24 > .env.admin_password

postgres_password="$(cat .env.postgres_password)"
redis_password="$(cat .env.redis_password)"

printf 'postgresql://physicsos:%s@postgres:5432/physicsos\n' "$postgres_password" \
  > .env.database_url
printf 'redis://:%s@redis:6379/0\n' "$redis_password" \
  > .env.redis_url
printf '%s\n' 'replace-with-the-model-provider-key' > .env.deepseek_api_key
printf '%s\n' 'replace-with-the-question-image-api-key' > .env.image_api_key
```

Vor dem Einsetzen von Zugangsdaten in URLs sind Zeichen prozentzucodieren (Percent-Encoding). Produktions-
Secret-Manager können dieselben Dateien unter einem anderen Pfad bereitstellen, und zwar mit
`PHYSICSOS_POSTGRES_PASSWORD_FILE`, `PHYSICSOS_REDIS_PASSWORD_FILE`,
`PHYSICSOS_DATABASE_URL_FILE`, `PHYSICSOS_REDIS_URL_FILE`,
`PHYSICSOS_DEEPSEEK_API_KEY_FILE`, `PHYSICSOS_ADMIN_PASSWORD_FILE` und
`PHYSICSOS_IMAGE_API_KEY_FILE` (das `PHYSICOS_IMAGE_API_KEY_FILE` mit einem S ist ein
Alias für einen Zyklus – siehe `docs/adr/0004-image-api-env-migration.md`).

Die sieben Namen nach Rolle:

| Datei                    | Secret                            | Verhalten bei fehlender/leerer Datei         |
| ------------------------ | --------------------------------- | -------------------------------------------- |
| `.env.postgres_password` | Passwort des PostgreSQL-Superusers | Container `postgres` weigert sich zu starten |
| `.env.redis_password`    | Redis `requirepass`               | Container `redis` beendet sich               |
| `.env.database_url`      | DSN App → PostgreSQL              | `docker compose config` schlägt fehl         |
| `.env.redis_url`         | DSN App → Redis                   | `docker compose config` schlägt fehl         |
| `.env.deepseek_api_key`  | Schlüssel des Modellanbieters     | App weigert sich zu starten                  |
| `.env.admin_password`    | Passwort des Bootstrap-`SUPER_ADMIN` | App weigert sich zu starten; kein Admin wird angelegt |
| `.env.image_api_key`     | Aufgabenbild-Generierung der Paper-Pipeline | App weigert sich zu starten        |

`.env.admin_password` wird einmal beim ersten Start verwendet, um
`PHYSICSOS-OPEN:admin` anzulegen. Die Datei sollte danach erhalten bleiben, damit spätere Neustarts
konsistent bleiben, und das Kontopasswort ist über den normalen Ablauf zu rotieren, statt
die Datei zu bearbeiten. Sind Aufgabenbilder für die Beta bewusst deaktiviert, ist
das Secret `image_api_key` aus `compose.yml` zu entfernen, statt eine leere Datei zu belassen,
und diese Entscheidung in den Release Notes festzuhalten.

### 3.1 Reverse Proxy und weitergeleitete Header

`PHYSICOS_TRUSTED_PROXIES` ist auf die **exakten IP-Literale** der Proxy-Peers zu setzen,
die sich mit der App verbinden, durch Kommas getrennt. CIDR-Bereiche und Hostnamen werden
beim Start abgelehnt:

```sh
# TLS-Terminator auf demselben Docker-Host (veröffentlicht über den Loopback-Port)
PHYSICOS_TRUSTED_PROXIES=127.0.0.1,::1

# Proxy in einem anderen Container: die Bridge-Gateway-Adresse verwenden, die die App sieht
PHYSICOS_TRUSTED_PROXIES=172.18.0.1
```

Nur ein TCP-Peer aus dieser Liste darf `X-Forwarded-Proto` und
`X-Forwarded-For` liefern. Bleibt die Liste hinter einem TLS-Proxy leer, wird das Session-
Cookie ohne `Secure` ausgestellt, CSRF-Origin-Prüfungen können `https`-
Anfragen ablehnen, und alle Besucher teilen sich den Rate-Limit-Bucket des Proxys. Wird sie
zu weit gefasst (oder eine Adresse eingetragen, von der aus ein nicht vertrauenswürdiger Client zugreifen kann), können
Clients ihre IP und ihr Protokoll fälschen, wodurch das Limit pro IP und die Zuordnung im Audit unterlaufen werden.

Optionale Stellschrauben, allesamt einfache Umgebungsvariablen:

| Variable                   | Standard                      | Zweck                                                              |
| -------------------------- | ----------------------------- | ------------------------------------------------------------------ |
| `PHYSICOS_TRUSTED_PROXIES` | leer (nichts vertrauen)       | Exakte Proxy-IP-Literale für weitergeleitete Header                |
| `PHYSICSOS_SESSIONS_ROOT`  | `/var/lib/physicsos/sessions` | Gemeinsames Session-Root; erforderlich, bevor über eine Replik hinaus skaliert wird |
| `PHYSICSOS_PANDOC`         | `/usr/bin/pandoc`             | Pandoc-Binary für den A4-Export                                    |
| `PHYSICSOS_SOFFICE`        | `/usr/bin/soffice`            | LibreOffice-Binary; macOS-Dev kann auf das App-Bundle zeigen       |
| `PHYSICSOS_DATABASE_SSL`   | `false`                       | TLS für die PostgreSQL-Verbindung aktivieren                       |

### 3.2 Vertrag der Laufzeitumgebung

`Dockerfile` deklariert die Image-Standardwerte, `compose.yml` liefert dieselben
Standardwerte und bildet dabei die hostseitigen Überschreibungen ab, und `.env.example` listet jede
Überschreibung auf, die ein Operator brauchen kann. Die Produktions-Backends für Speicher und Shared State
sind in Image und Compose bewusst fest auf
`postgres`/`redis` gesetzt; es sind keine optionalen `.env`-Schalter.

| Laufzeitvariable                 | Quelle in Compose                 | Zweck                                      |
| -------------------------------- | --------------------------------- | ------------------------------------------ |
| `PHYSICSOS_STORAGE_BACKEND`      | fest `postgres`                   | Verhindert den Fallback auf JSON-Speicher  |
| `PHYSICSOS_STORAGE_SCHEMA`       | `PHYSICSOS_STORAGE_SCHEMA`        | PostgreSQL-Schema, Standard `physicsos`    |
| `PHYSICSOS_SHARED_STATE_BACKEND` | fest `redis`                      | Verhindert den Fallback auf In-Memory-Rate-Limit |
| `DATABASE_URL_FILE`              | `PHYSICSOS_DATABASE_URL_FILE`     | Wird zu `DATABASE_URL` materialisiert      |
| `REDIS_URL_FILE`                 | `PHYSICSOS_REDIS_URL_FILE`        | Wird zu `REDIS_URL` materialisiert         |
| `DEEPSEEK_API_KEY_FILE`          | `PHYSICSOS_DEEPSEEK_API_KEY_FILE` | Wird zu `DEEPSEEK_API_KEY` materialisiert  |
| `PHYSICSOS_ADMIN_PASSWORD_FILE`  | `PHYSICSOS_ADMIN_PASSWORD_FILE`   | Wird zu `PHYSICSOS_ADMIN_PASSWORD` materialisiert |
| `PHYSICSOS_IMAGE_API_KEY_FILE`   | `PHYSICSOS_IMAGE_API_KEY_FILE`    | Wird zu `PHYSICSOS_IMAGE_API_KEY` materialisiert |
| `PHYSICOS_TRUSTED_PROXIES`       | `PHYSICOS_TRUSTED_PROXIES`        | Vertrauensliste für weitergeleitete Header |

Die zusammengesetzte Konfiguration validieren, ohne Container zu starten:

```sh
docker compose config --quiet
```

### 3.3 Modellkette (Provider / Base URL / Key)

Das Standardmodell der Produktionskomposition läuft über die Route `deepseek-official` von `llm-deepseek`, aber
`DEEPSEEK_BASE_URL` zeigt nicht mehr direkt auf das Gateway eines Drittanbieters, sondern auf den Loopback-Proxy von
`model-pool-host` im Container. Der Proxy wählt dann nach Kanalpriorität und Key-Gewicht den Upstream,
sodass der Harness nicht neu gestartet werden muss, wenn ein einzelner
Key ausfällt.

| Punkt            | Produktionswert                                                             | Erläuterung                                                                      |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Harness Base URL | `http://127.0.0.1:${PHYSICSOS_MODEL_POOL_PORT:-38972}/v1`                   | Lauscht nur im App-Container; der öffentliche Port legt den Proxy nicht offen    |
| Fallback-Upstream | `PHYSICSOS_MODEL_FALLBACK_BASE_URL`, Standard `https://api.fengshao1227.com/v1` | Nur zum Befüllen eines leeren Pools; wird nicht automatisch erneut hinzugefügt, sobald im Backend ein beliebiger Kanal angelegt wurde |
| Key              | `.env.deepseek_api_key` (OpenAI-kompatibler Key)                            | Nur als Fallback-Seed für den leeren Pool; wird von `model-pool-host` verschlüsselt in `physicsos_model_pool` abgelegt |
| Hauptschlüssel der Verschlüsselung | `.env.model_pool_secret`                          | Leitet den AES-256-GCM-Schlüssel ab; muss langfristig stabil bleiben, nach einem Wechsel erzeugen alte Keys `KEY_DECRYPT_FAILED` |
| Modellname       | `deepseek-v4-flash`                                                         | Gemessen am Gateway ca. 1 Sekunde bis zum ersten Zeichen; das alte `deepseek-v4.1-flash` kann zu Spitzenzeiten 10–30 Sekunden warten |
| Ausgabelimit     | `maxTokens: 32768`                                                          | Reasoning-Modelle verbrauchen zuerst Reasoning-Tokens; ein zu kleines Limit führt zu `content:null` + `finish_reason:length` |

Modellname und Ausgabelimit stehen in `$DSH_HOME/settings.yaml` (im Container
`/var/lib/physicsos/settings.yaml`, bei Fehlen Rückfall auf die Standardwerte der Basiskomposition):

```yaml
llm-deepseek:
  maxTokens: 32768
  models:
    - id: deepseek-v4-flash
      name: 平台公益模型
      contextWindow: 1000000
      maxTokens: 32768

agent-default-model:
  provider: deepseek-official
  model: deepseek-v4-flash
  reasoningEffort: off
```

`scripts/deploy/configure-model.sh` schreibt diese Einstellungen idempotent und ersetzt nur den für Nutzer sichtbaren Namen;
die interne Modell-ID und die Pool-Route verwenden `deepseek-v4-flash`; der Anzeigename ist fest „平台公益模型“ (Gemeinnütziges Plattformmodell).

Drei häufige Stolperfallen:

1. **Berechtigungen der Secret-Dateien**: Jedes Secret wird in Compose in der langen Syntax mit
   `uid: '999'`, `gid: '999'`, `mode: '0400'` deklariert (wiederverwendet den Anker `x-secret-mount`);
   Compose schreibt danach Besitzer und Berechtigungen der eingehängten Datei um, sodass die Dateien auf dem Host auf `0600` (oder
   strenger) bleiben können und nicht auf `0644` gelockert werden müssen. Auf der Host-Seite härtet `scripts/deploy/secure-secrets.sh`
   diese Dateien weiterhin nach derselben Invariante, als Verteidigung in der Tiefe. Fehlt diese Deklaration bei einem Secret, fällt der Container
   auf die Dateiberechtigungen des Hosts zurück: Bei `0600 root:root` startet die App (uid 999) nicht und gibt aus:
   `secret file for PHYSICSOS_IMAGE_API_KEY_FILE is unreadable (EACCES)`.
2. **Die Domänen-Vertrauensschranke von `/api` erkennt nur CLI-Parameter**: `PHYSICOS_TRUSTED_HOSTS` selbst wird vom
   Harness nicht gelesen, es muss zugleich in Compose in
   `--trusted-host ${PHYSICOS_TRUSTED_HOSTS}` stehen. Fehlt es, liefert `/api/host.describe` über das öffentliche Netz
   `403 forbidden`, der Browser-Client hängt bei „Arbeitsbereich wird geladen /
   Loading plugins“, während Loopback weiterhin normal funktioniert.
3. **Auch Hilfsanfragen laufen über das Modell**: Sitzungstitel und die Lösungsaufrufe des Klausurbereichs nutzen denselben Endpunkt und Key,
   auch `session-title-first-prompt-llm` verbraucht Kontingent, daher zählt
   eine echte Runde pro Konto in der Regel +2.

Minimale Abnahme (auf dem Server auszuführen; der Key wird nur aus dem Secret gelesen und nicht ausgegeben):

```sh
cd /opt/physicsos && K=$(cat .env.deepseek_api_key)
curl -sS -o /dev/null -w '%{http_code}\n' https://api.fengshao1227.com/v1/models \
  -H "Authorization: Bearer $K"
docker compose exec -T app node -e "fetch('http://127.0.0.1:38972/v1/models').then(async r => { console.log(r.status, await r.text()) })"
docker compose exec -T app cat /var/lib/physicsos/settings.yaml
```

### 3.4 Plattform-Modellpool (model-pool)

Administratoren pflegen Kanäle und Keys unter „Admin-Backend → Modellkanäle“; der Tab zeigt nur die letzten 4 Stellen des Keys.
`model-pool-host` stellt zugleich bereit:

- einen OpenAI-kompatiblen Proxy im App-Container: `http://127.0.0.1:38972/v1`
- eine gleichursprüngliche Verwaltungsschnittstelle: `/physicsos/model-pool/*`, die nur `SUPER_ADMIN` akzeptiert

#### Strategiesemantik

| Verhalten        | Produktionssemantik                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Round Robin      | Zuerst werden Kanäle nach `priority` von klein nach groß in Stufen eingeteilt, innerhalb einer Stufe wird nach Key-Gewicht rotiert; eine einzelne Anfrage erhält weiterhin die vollständige Kandidatenkette für das Failover |
| Retry            | `retryCount` Standard 2, höchstens so viele Versuche, wie es Kandidaten-Keys gibt; bei Client-Fehlern wie 400/404/422 wird der Key nicht gewechselt |
| Cooldown         | Bei 401/403-Authentifizierungsfehlern sofort Cooldown; bei 429/5xx/Übertragungsfehlern Cooldown, sobald `failureThreshold` erreicht ist |
| Backoff          | Exponentielles Wachstum ab `cooldownBaseMs`, begrenzt durch `cooldownMaxMs`; bei `autoRecover=true` automatische Wiederherstellung nach Ablauf |
| Streaming        | Wiederholt wird nur, bevor der Upstream die Antwort-Header zurückgibt; nach Beginn des Streams wird nicht erneut abgespielt, um doppelten Inhalt zu vermeiden |
| Modell-Alias     | Der Modellname im Kanal ist der Name **beim Upstream** und ersetzt beim Weiterleiten den plattformseitigen Namen; leer gelassen wird unverändert durchgereicht. Die Routenwahl filtert nicht nach Modellnamen |
| Alle nicht verfügbar | Liefert ausdrücklich HTTP 503 mit `MODEL_POOL_EXHAUSTED`, `MODEL_POOL_EMPTY`, `MODEL_POOL_NO_KEY` oder `MODEL_POOL_ALL_COOLING`, erfindet keine Modellantwort |

#### Tägliche Abläufe

1. **Key wechseln**: Im Bereich „Modellkanäle“ den Key suchen, auf „Bearbeiten“ klicken und den neuen Key einfügen; nach erfolgreicher Anfrage wird der alte
   Geheimtext überschrieben und der Fehlerzähler zurückgesetzt. Nur im Request-Body beim Anlegen/Ersetzen erscheint der Klartext-Key, Liste und Audit
   protokollieren immer nur die letzten Stellen.
2. **Key vorübergehend deaktivieren**: „Aktiviert“ beim Key abwählen und speichern; der Proxy überspringt ihn bei der nächsten Anfrage sofort.
3. **Einen ganzen Kanal deaktivieren**: Den Kanal bearbeiten und „Kanal aktiviert“ abwählen; alle Keys dieses Kanals scheiden gemeinsam aus der Kandidatenliste aus.
4. **Alles deaktivieren**: Modellanfragen liefern das oben genannte 503; das ist ein wiederherstellbarer Konfigurationszustand und fällt nicht auf eine unverschlüsselte
   direkte Einzel-Key-Verbindung zurück.
5. **Manuelle Wiederherstellung**: Bei einem Key im Cooldown auf „Fehler zurücksetzen“ klicken oder gemäß Strategie auf die automatische Wiederherstellung warten.
6. **Einzel-Key-Probe**: Auf „Diesen Key testen“ klicken; die Seite zeigt Upstream-Status, Latenz und einen bereinigten Fehler.

#### Verschlüsselung und Backup

`model_pool_secret` muss zusammen mit `postgres_data` gesichert werden; liegt nur die Datenbank ohne Hauptschlüssel vor,
bleiben die Kanaleinträge lesbar, die Keys lassen sich aber nicht entschlüsseln, und Modellanfragen schlagen fail-closed fehl. Das Secret darf nicht in
`docs/`, Issues, Logs oder die Shell-Historie geschrieben werden.

```sh
openssl rand -hex 32 > .env.model_pool_secret
chmod 0400 .env.model_pool_secret
docker compose config --quiet
docker compose up -d app
```

## 4. Continuous Integration

`.github/workflows/ci.yml` läuft bei Pushes auf `main`, Pull Requests und manuellem
Dispatch. Der Job initialisiert das gepinnte Harness-Submodul, wendet das Overlay an,
installiert beide Lockfiles und führt aus:

```sh
docker compose config --quiet
pnpm -C vendor/deepseek-harness exec vitest run \
  --config ../../overlays/harness/files/packages/physicsos/health-host/vitest.config.ts
pnpm -C vendor/deepseek-harness run build:lib
pnpm exec prettier --check <deployment-owned paths>
pnpm exec tsc -p overlays/harness/files/packages/physicsos/health-host/tsconfig.json
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Ein Release ist nur zulässig, wenn jedes Gate auf genau dem zu deployenden Commit grün ist.
Image-Digest und Commit-SHA sind gemeinsam in der Release-Aufzeichnung festzuhalten. Das Format-Gate ist bewusst auf die vom Deployment verantworteten Pfade beschränkt,
bis die repositoryweite Prettier-Baseline bereinigt ist.

### Harness-Sync `dsh-v0.1.7-rc.2` (2026-09-27)

Der gepinnte Harness wurde von `47f943859bef60e4160492346772ded9b24f765a` auf
`477b4f420553e8a52c2fbccc464d7561b239c443` (`dsh-v0.1.7-rc.2`) umgestellt. Der
Kompatibilitäts-Patch hält diese Schnittstellenentscheidungen fest:

- `client-connection` verlangt nun den Dienst `credentials` und leitet
  gemeinsame `/api`-Aufrufe über registrierte RPC-Interceptors; der entfernte
  `apiProxy`-Fallback wird nicht wiederhergestellt. PhysicsOS ergänzt Policy-Hooks für die Autorisierung von Anfragen,
  das Umschreiben von fetch und die Zulassung weitergeleiteter Ereignisse. Das auth-host-Ledger für
  Konto/Session/Workspace-Besitz bleibt die maßgebliche Instanz für `/api`;
  kontoübergreifendes Lesen und Schreiben schlägt weiterhin fail-closed fehl.
- Die Bereitstellung privater Workspaces verwendet nun den Zieldienst `workspaceRegistry`.
  Die alte Naht `apiProxy.workspace.create/rename` wurde im Upstream entfernt.
- Die Session-Persistenz liest nun das veröffentlichte V3 (`session.v3.jsonl` oder
  `session.v3.jsonl.zstd`) und veröffentlicht bei einem ausdrücklichen Schreibvorgang einen verifizierten V4-Nachfolger. Bestehende V3-/Zstd-Logs werden bei
  rein lesendem Zugriff weder gelöscht noch umgeschrieben, und `physics/scene` wird vom historischen V3-zu-V4-Konverter zugelassen.
  Ein Rollback, der einen älteren Harness erfordert, muss das Session-Volume vor dem Upgrade wiederherstellen
  oder Schreibvorgänge gestoppt halten; keine Rückkonvertierung an Ort und Stelle.
- Der multipart-Pfad für binäre Antworten der Verbindung bleibt erhalten. Paper-Uploads und
  PhysicsOS-Bildimporte laufen weiterhin über das Anhangs-/Binär-Framing und nicht über
  Base64-JSON-Ersetzung.
- Der Modellverkehr bleibt `DEEPSEEK_BASE_URL -> 127.0.0.1:
${PHYSICSOS_MODEL_POOL_PORT}`, und der model-pool-Proxy bleibt die einzige
  Schicht zur Provider-Auswahl.
- `class-host` ist in der Web-Produktionskomposition nicht eingehängt. `plugin-center`
  wird unmittelbar nach `ops-host` eingehängt; das Package bleibt für Migration
  und ausdrückliche administrative Nutzung verfügbar.

- **Document Gate (neu in 0.1.7-rc.2).** `dsh web` verweigert nun `index.html`,
  es sei denn, der Browser legt zuerst das prozessbezogene Launch-Token vor, das beim
  Start ausgegeben wird (`dsh web: http://127.0.0.1:3080/?token=…`), und tauscht es gegen ein
  an die Autorität gebundenes, signiertes Cookie `dsh-auth-<hash>`. Zwei Fakten bestimmen das
  Deployment: Das Token ist **pro Prozess** (bei jedem Boot frische Zufallsbytes),
  und das Cookie ist an die Autorität gebunden, die es ausgestellt hat (Host **und** Port),
  sodass sich beides für gewöhnliche Besucher hinter einem Reverse Proxy nicht bereitstellen lässt –
  es gibt kein Flag, keine Umgebungsvariable und kein Konfigurationsfeld, das das
  Gate abschaltet (die CLI bietet nur `--host`, `--port`, `--trusted-host`, `--no-open`).
  PhysicsOS lockert es daher im Kompatibilitäts-Patch für die Autoritäten,
  die das Deployment in `trustedHosts` **deklariert** – dieselbe Liste, die auch die
  `/api`-Schranke bereits verwendet (`--trusted-host` / `PHYSICOS_TRUSTED_HOSTS`). Eine tokenlose
  Dokumentanfrage, deren `Host` eine deklarierte Autorität ist, wird direkt bedient;
  Loopback und nicht deklarierte Hosts behalten das Standard-Gate, und eine Anfrage mit
  Token behält den Standard-Austausch. Die Kontogrenze bleibt unverändert: Jeder
  `/api`-Aufruf durchläuft weiterhin `apiPolicy` und benötigt eine aktive Produkt-Session. Die
  Änderung liegt in `overlays/harness/upstream-changes.patch`
  (`packages/client/connection/src/api-request-trust.ts` und `rpc-host.ts`).
  Da diese Liste nun das Dokument selbst absichert, **ändert das Hinzufügen oder Entfernen eines
  Eintrags in `PHYSICOS_TRUSTED_HOSTS`, ob die öffentliche Website erreichbar ist**;
  sie ist identisch zum `server_name` des Reverse Proxy zu halten.
- Der Compose-Befehl `app` übergibt nun `--no-open`. Ein Container hat keinen Browser,
  daher startet die Standardübergabe nur einen Opener, der sicher scheitert, und protokolliert
  eine Warnung auf stderr. Die Launch-URL wird weiterhin ausgegeben (`printUrl` bleibt true) und
  ist in `docker compose logs app` sichtbar.
- `/healthz` und `/readyz` sind benannte Routen, die vor dem Frontend-
  Fallback registriert sind, sodass der Docker-Healthcheck vom Gate **nicht** betroffen ist. Ein
  Loopback-`GET /` ohne Cookie liefert absichtlich 401 – das Dokument stattdessen
  über den öffentlichen Origin per Smoke-Test prüfen (Schritt 6).

Das Rollback erfolgt zuerst auf Anwendungsebene: Vor dem Ausliefern von Verkehr sind der vorherige Image-Digest und das
Paar aus Submodul-Pointer/Overlay von `47f943859bef60e4160492346772ded9b24f765a`
wiederherzustellen, danach werden die erhaltenen PostgreSQL-/Session-Volumes wieder geöffnet.
Beim Rollback dürfen niemals vorhandene Session-Logs gelöscht werden.

## 5. Build und Release

Lokal bauen:

```sh
export PHYSICSOS_APP_IMAGE="registry.example/physicsos-app:$(git rev-parse --short=12 HEAD)"
docker compose build --pull app
docker image inspect "$PHYSICSOS_APP_IMAGE" \
  --format '{{index .RepoDigests 0}}'
```

Für ein Registry-Release mit der vollständigen Commit-SHA taggen und nach dem Push den
resultierenden Digest deployen, nicht einen beweglichen Tag:

```sh
docker push "$PHYSICSOS_APP_IMAGE"
docker image inspect "$PHYSICSOS_APP_IMAGE" \
  --format '{{index .RepoDigests 0}}'
```

Festzuhalten:

- Commit-SHA
- Image-Digest
- Compose-Revision
- Revision der Datenbankmigration, falls das Release eine hat
- Operator sowie Start-/Endzeit in UTC

## 6. Deploy

**Harte Voraussetzung für ein Harness-Upgrade, das das Format der Session-Logs hochsetzt**
(insbesondere die Beförderung auf 0.1.7). Bevor das primäre Compose-
Projekt umgeschaltet wird, ist das vorherige Image zu taggen, ein Backup des Sessions-
Roots auf Dateisystemebene zu ziehen (`/var/lib/physicsos/sessions`, `PHYSICSOS_SESSIONS_ROOT` innerhalb von
`app_data`) **und** ein `pg_dump`, und es ist zu bestätigen, dass beide lesbar sind.

Das ist eine Voraussetzung, keine Nettigkeit: Das laufende Deployment speichert Session-Logs
im ältesten On-Disk-Format (`{"type":"session","version":0,…}`). Harness
0.1.7 liefert die Migrationskette `v0 → v1 → v2 → v3 → v4`
(`packages/session/session-format-v0-to-v1` … `-v3-to-v4`, wobei
`catalog-migration.ts` für `version <= 3` den `historicalSessionFormatCatalog` auswählt),
sodass 0.1.7 diese Logs **an Ort und Stelle** vorwärts migriert. Nach der Beförderung würde das vorherige Release
(Rollback-Image `14157e1`, Submodul gepinnt auf
`47f9438`) bereits migrierte Daten lesen. Das Rollback-Image ist
daher nur **zusammen mit** den Backups von Sessions-Root
und Datenbank vor der Beförderung ein echtes Rollback. Beim Rollback niemals an Ort und Stelle rückkonvertieren – aus dem
Backup wiederherstellen.

1. Den Kandidaten-Digest und das CI-Ergebnis für denselben Commit verifizieren.
2. Vor jeder Schemamigration ein erfolgreiches Backup verifizieren.
3. Die Abhängigkeiten starten und auf den gesunden Zustand warten:

```sh
docker compose up -d postgres redis
docker compose ps
```

4. Den Migrationsschritt des Releases ausführen, bevor die neue App startet. Migrationen müssen
   zur aktuell laufenden App abwärtskompatibel sein. Schlägt die Migration
   fehl, ist das Release zu stoppen, die alte App weiterlaufen zu lassen und nicht blind zu wiederholen.

5. Die App starten:

```sh
docker compose up -d --no-build app
docker compose ps app
```

6. Readiness und den Web-Einstieg per Smoke-Test prüfen:

```sh
curl --fail --show-error http://127.0.0.1:3080/healthz
curl --fail --show-error http://127.0.0.1:3080/readyz
# Das Dokument ist abgesichert: Ein Loopback-GET/HEAD / ohne Cookie antwortet mit 401.
# Das Dokument stattdessen über den deklarierten öffentlichen Origin prüfen.
curl --fail --show-error --head "https://${PHYSICOS_TRUSTED_HOSTS:-physics.dongsiwei.com}/"
docker compose logs --since=10m app
```

`docker compose logs app` muss die Startzeile `dsh web: …` zeigen. Liefert das
Dokument am öffentlichen Origin 401 (oder das „404“ vor 0.1.7), steht der Host nicht
in `PHYSICOS_TRUSTED_HOSTS` / `--trusted-host` – siehe Abschnitt 4.

7. Über den externen Reverse Proxy einen authentifizierten Lesezugriff und einen begrenzten Schreibzugriff verifizieren.
   Den resultierenden Konto-/Mandantenbereich und das Audit-Ereignis bestätigen.

## 7. Backup

PostgreSQL, Redis und das Volume `app_data` sind gemeinsam zu sichern. Ein Datenbank-Dump
ohne das Session-/Replay-Volume ist kein vollständiges PhysicsOS-Backup.

### 7.1 Geplantes PostgreSQL-Backup

Auf einem gehärteten Host werden die Wartungsjobs installiert mit:

```sh
sudo PHYSICSOS_DIR=/opt/physicsos \
  /opt/physicsos/scripts/deploy/install-operations.sh
```

Das installiert `/etc/cron.d/physicsos-postgres-backup`; es läuft täglich um
`02:15` Hostzeit (der aktuelle Produktionshost verwendet UTC):

```text
15 2 * * * root PHYSICSOS_DIR=/opt/physicsos \
  /opt/physicsos/scripts/deploy/backup-postgres.sh \
  >>/var/log/physicsos-postgres-backup.log 2>&1
```

Ein Backup sofort ausführen und den Pfad des verifizierten Artefakts ausgeben:

```sh
sudo PHYSICSOS_DIR=/opt/physicsos \
  /opt/physicsos/scripts/deploy/backup-postgres.sh
```

Das Standard-Ausgabe-Root ist `/opt/physicsos/backups/postgres`, mit einem privaten
Zeitstempelverzeichnis pro Lauf:

```text
/opt/physicsos/backups/postgres/YYYYMMDDTHHMMSSZ/
├── manifest.txt
├── postgres.dump
├── postgres.dump.sha256
└── postgres.list
```

`postgres.list` ist die erfolgreiche Ausgabe von `pg_restore --list`. Ein bestimmtes
Archiv lässt sich erneut verifizieren, ohne die Datenbank anzufassen, danach wird die Prüfsumme kontrolliert:

```sh
backup=/opt/physicsos/backups/postgres/RECOVERY_POINT
docker run --rm --network none \
  -v "$backup:/backup:ro" \
  --entrypoint pg_restore postgres:17-bookworm \
  --list /backup/postgres.dump >/dev/null
(cd "$backup" && sha256sum -c postgres.dump.sha256)
```

Die Produktionsverifikation vom 2026-09-26 erzeugte
`/opt/physicsos/backups/postgres/20260926T112730Z`: Das 161.176 Byte große Archiv
enthielt 119 Einträge von `pg_restore --list` und bestand die SHA-256-Prüfung.

Die Aufbewahrung beträgt standardmäßig 14 Tage und lässt sich mit
`PHYSICSOS_BACKUP_RETENTION_DAYS` ändern. Geplante Dumps decken nur PostgreSQL ab;
Redis und `app_data` erfordern weiterhin das untenstehende koordinierte Vollbackup und müssen
auf verschlüsselten Speicher außerhalb des Hosts kopiert werden.

### 7.2 Koordiniertes Vollbackup

Einen UTC-Zeitstempel setzen und ein privates Backup-Verzeichnis anlegen:

```sh
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_dir="backups/$stamp"
install -d -m 0700 "$backup_dir"
```

PostgreSQL-Dump im Custom-Format:

```sh
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$(cat /run/secrets/postgres_password)" pg_dump \
    --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" --format=custom' \
  > "$backup_dir/postgres.dump"
```

Redis-Append-Only-Snapshot:

```sh
docker compose exec -T redis sh -c \
  'REDISCLI_AUTH="$(cat /run/secrets/redis_password)" \
    redis-cli --no-auth-warning BGSAVE'

docker compose stop redis
docker run --rm \
  -v physicsos_redis_data:/source:ro \
  -v "$PWD/$backup_dir:/backup" \
  alpine:3.21 tar -C /source -czf /backup/redis.tgz .
docker compose start redis
```

Anwendungs-/Session-Volume:

```sh
docker compose stop app
docker run --rm \
  -v physicsos_app_data:/source:ro \
  -v "$PWD/$backup_dir:/backup" \
  alpine:3.21 tar -C /source -czf /backup/app-data.tgz .
docker compose start app
```

Ein Manifest mit Release-Identität und Prüfsummen schreiben:

```sh
{
  printf 'commit=%s\n' "$(git rev-parse HEAD)"
  docker compose images
  sha256sum "$backup_dir"/*
} > "$backup_dir/manifest.txt"
```

Das Verzeichnis auf verschlüsselten Speicher außerhalb des Hosts kopieren. Die Wiederherstellung monatlich und
vor jeder riskanten Migration testen. RPO/RTO pro Umgebung definieren und festhalten; kein Wiederherstellungsziel
behaupten, das nicht in einer Wiederherstellungsübung gemessen wurde.

## 8. Wiederherstellung

Die Wiederherstellung ist destruktiv. Ein Wartungsfenster ankündigen, Schreibvorgänge stoppen und
den Wiederherstellungspunkt ausdrücklich freigeben, bevor fortgefahren wird.

1. Die fehlgeschlagenen Volumes zur Untersuchung erhalten:

```sh
docker compose stop app redis postgres
```

2. Das Anwendungs-Volume wiederherstellen:

```sh
docker run --rm \
  -v physicsos_app_data:/target \
  -v "$PWD/backups/RECOVERY_POINT:/backup:ro" \
  alpine:3.21 sh -c 'rm -rf /target/* && tar -C /target -xzf /backup/app-data.tgz'
```

3. PostgreSQL neu anlegen und den Dump wiederherstellen. `RECOVERY_POINT` ist das Zeitstempel-
   Verzeichnis unter `/opt/physicsos/backups/postgres`:

```sh
docker compose up -d postgres
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$(cat /run/secrets/postgres_password)" dropdb \
    --username="$POSTGRES_USER" --if-exists "$POSTGRES_DB"'
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$(cat /run/secrets/postgres_password)" createdb \
    --username="$POSTGRES_USER" "$POSTGRES_DB"'
docker compose exec -T postgres sh -c \
  'PGPASSWORD="$(cat /run/secrets/postgres_password)" pg_restore \
    --username="$POSTGRES_USER" --dbname="$POSTGRES_DB" \
    --clean --if-exists --no-owner --no-acl' \
  < /opt/physicsos/backups/postgres/RECOVERY_POINT/postgres.dump
```

4. Redis neu anlegen und seinen Snapshot wiederherstellen:

```sh
docker compose stop redis
docker run --rm \
  -v physicsos_redis_data:/target \
  -v "$PWD/backups/RECOVERY_POINT:/backup:ro" \
  alpine:3.21 sh -c 'rm -rf /target/* && tar -C /target -xzf /backup/redis.tgz'
docker compose start redis
```

5. Die App starten und validieren:

```sh
docker compose up -d app
docker compose ps
curl --fail --show-error http://127.0.0.1:3080/readyz
```

Konto-/Session-Anzahlen gegen das Backup-Manifest validieren, eine wiederhergestellte
Session öffnen, eine gespeicherte PhysicsOS-Scene abspielen und bestätigen, dass neue Schreibvorgänge nach
einem `docker compose restart app` bestehen bleiben.

Schlägt eine Validierung fehl, ist die App zu stoppen, sind Logs und wiederhergestellte Volumes zu erhalten,
und es ist ein späterer Wiederherstellungspunkt zu wählen oder die Wiederherstellung zu wiederholen. Der Verkehr darf nicht auf einer
teilweise wiederhergestellten Datenbank wieder geöffnet werden.

## 9. Rollback

Das Rollback erfolgt zuerst auf Anwendungsebene. Datenbank-Down-Migrationen sind verboten, es sei denn,
sie sind nachweislich verlustfrei und haben ein eigenes getestetes Verfahren.

Speziell für die Beförderung auf 0.1.7 ist das vorherige Image allein **kein**
Rollback: 0.1.7 hat Session-Logs an Ort und Stelle vorwärts migriert (`v0 → … → v4`), das
Rollback-Image würde also migrierte Daten lesen. Sessions-Root und
Datenbank sind aus den Backups wiederherzustellen, die gemäß der Voraussetzung aus Abschnitt 6 erstellt wurden, bevor
Verkehr ausgeliefert wird; niemals an Ort und Stelle rückkonvertieren. Ein Rollback nur des Images
genügt auch für den Befehl nicht: Der neue Compose-Befehl `app` übergibt
`--no-open`, was das vorherige Image mit `unknown option '--no-open'` ablehnt,
sodass bei jedem Rollback der Compose-Befehl gemeinsam mit dem Image-Digest zurückzusetzen ist.

So wird der vorherige Image-Digest deployt:

```sh
export PHYSICSOS_APP_IMAGE='registry.example/physicsos-app@sha256:PREVIOUS_DIGEST'
docker compose pull app
docker compose up -d --no-build app
docker compose ps app
curl --fail --show-error http://127.0.0.1:3080/readyz
```

Für Schemaänderungen ist Expand/Migrate/Contract zu verwenden, damit die vorherige App
beim Rollback kompatibel bleibt. Hat das neue Release nicht abwärtskompatible
Daten geschrieben, sind Schreibvorgänge zu stoppen und ausdrücklich zwischen Vorwärtskorrektur und destruktiver
Wiederherstellung zu entscheiden.

Nach dem Rollback:

1. `/healthz`, `/readyz`, Login, eine Wiedergabe und einen begrenzten Schreibzugriff verifizieren.
2. Den fehlgeschlagenen Image-Digest und die Logs zur Diagnose aufbewahren.
3. Rollback-Grund, Zeitstempel, Auswirkungszeitraum und die Datenentscheidung festhalten.
4. Den fehlgeschlagenen Digest erst erneut deployen, wenn ein Regressionstest den
   Fehler reproduziert und die Korrektur die Root-CI besteht.

## 10. Server-Härtung

### 10.1 Verifizierte Produktions-Baseline

Am 2026-09-26 wurde der Produktionshost anhand der effektiven OpenSSH-
Konfiguration geprüft, nicht nur anhand der sichtbaren Drop-in-Dateien:

```text
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitRootLogin without-password
```

`fail2ban` ist installiert und aktiviert, mit dem `sshd`-Jail über das systemd-
Backend (`maxretry=5`, `findtime=10m`, `bantime=1h`). Verifizierbar mit:

```sh
systemctl is-enabled fail2ban
systemctl is-active fail2ban
fail2ban-client status sshd
sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication) '
```

Jeder PhysicsOS-Container ist mit der Restart-Policy
`unless-stopped` und `json-file`-Logging mit `max-size=20m` und
`max-file=5` konfiguriert. Die effektiven Container-Einstellungen sind zu verifizieren, statt
allein der Compose-Quelle zu vertrauen:

```sh
cd /opt/physicsos
docker compose ps -q | xargs docker inspect --format \
  '{{.Name}} Restart={{.HostConfig.RestartPolicy.Name}} LogDriver={{.HostConfig.LogConfig.Type}} MaxSize={{index .HostConfig.LogConfig.Config "max-size"}} MaxFile={{index .HostConfig.LogConfig.Config "max-file"}}'
```

Die SSH-Konfiguration des Hosts ist bereits konform, daher darf
`sshd_config` im Routine-Deployment nicht umgeschrieben werden. Fehlen diese
Einstellungen auf einem künftigen Host, ist ein validiertes Drop-in hinzuzufügen, `sshd -t` auszuführen, SSH neu zu laden und die
bestehende schlüsselbasierte Sitzung offen zu halten, bis ein zweiter Key-Login erfolgreich war.

### 10.1.1 Browser-Sicherheits-Header

Die öffentliche nginx-Site wird gehärtet durch
`scripts/deploy/install-nginx-security-headers.sh`. Das Skript ist idempotent,
sichert die Site unter `/var/backups/physicsos-operations/`, validiert mit
`nginx -t` und lädt erst nach erfolgreicher Validierung neu. Es fügt hinzu:

- HSTS (`Strict-Transport-Security`) mit einem Jahr max age und Subdomains
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- eine restriktive `Permissions-Policy`

`PHYSICSOS_HSTS_MODE=report` nur für eine kontrollierte Prüfung vor HSTS verwenden; der
Standard der öffentlichen Beta ist `enforce`. Eine Content-Security-Policy wird bewusst
nicht ausgegeben, bis es für Inline-Styles, Worker, WebSockets und generierte
Assets der App eine getestete Allowlist gibt.

Die Live-Antwort von außerhalb des Hosts verifizieren:

```sh
curl -sS -o /dev/null -D - https://physics.dongsiwei.com/readyz |
  grep -Ei 'strict-transport-security|x-content-type-options|x-frame-options|referrer-policy|permissions-policy'
```

### 10.2 Nachweis der Produktions-Selbstprüfung

Die Prüfung vom 2026-09-26 ergab:

```text
GET /healthz -> 200 {"status":"ok"}
GET /readyz  -> 200 {"status":"ready","checks":{"postgres":{"status":"ok"},"redis":{"status":"ok"}}}
```

Der App-Container hatte `PHYSICSOS_STORAGE_BACKEND=postgres`,
`PHYSICSOS_SHARED_STATE_BACKEND=redis` sowie sowohl die Quellpfade `*_FILE` als auch
deren materialisierte einfache Umgebungsnamen im laufenden App-Prozess.
PostgreSQL enthielt 34 Tabellen im Schema `physicsos`, darunter
`dsh_storage_units` und `dsh_storage_globals`, mit neun aktiven Verbindungen,
identifiziert als `physicsos-storage-postgres`. Redis meldete
`total_connections_received=280` und `total_commands_processed=428` zum
Zeitpunkt der abschließenden Inspektion. Es wurde kein JSON- oder Memory-Fallback konfiguriert oder
beobachtet. Dies sind ausschließlich nicht geheime betriebliche Bezeichner; es wurden keine Produktions-
datensätze oder Secret-Werte ausgelesen.

Bevor bei einem neuen Release Verkehr freigegeben wird, ist Folgendes zu wiederholen:

```sh
docker compose exec -T app node scripts/healthcheck.mjs http://127.0.0.1:3080/readyz
curl --fail --show-error http://127.0.0.1:3080/healthz
curl --fail --show-error http://127.0.0.1:3080/readyz
```

## 11. Betriebliche Prüfungen

Täglich:

- Alle Compose-Services gesund
- `/readyz` erfolgreich und Festplattenreserve von PostgreSQL/Redis
- 5xx, Latenz, Prozessneustarts, Queue-Rückstand und Fehler des Modellanbieters
- Abschluss des Backups und Prüfsumme außerhalb des Hosts

Wöchentlich:

- Ein Backup in eine isolierte Umgebung wiederherstellen
- Session-Replay und eine PhysicsOS-Scene verifizieren
- Berechtigungen der Secret-Dateien und Rotationsstatus bestätigen
- Image-Digests mit der Release-Aufzeichnung abgleichen

Incident Response:

| Symptom                                      | Erste Maßnahme                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| App nicht gesund, obwohl Abhängigkeiten gesund | App-Logs und `/readyz` prüfen; Rollback, wenn der vorherige Digest besteht                    |
| PostgreSQL nicht verfügbar                   | Schreibvorgänge der App stoppen, `docker compose logs postgres` prüfen, Dienst oder Wiederherstellungspunkt wiederherstellen |
| Redis nicht verfügbar                        | Fail-closed-Readiness erwarten; Redis wiederherstellen, bevor der Verkehr wieder geöffnet wird |
| Migration fehlgeschlagen                     | Alte App behalten, neue App nicht starten, nur mit einer geprüften Migration vorwärts korrigieren |
| Rollback nötig                               | Vorherigen Digest deployen, Health/Login/Replay verifizieren und die Belege des fehlgeschlagenen Releases bewahren |

Die Produktion ist erst bereit, wenn Health, Logs, Metriken, Alarme, Backup, Wiederherstellung,
Rollback, Ressourcenlimits und Zuständigkeiten alle definiert und getestet sind.

## 12. Checkliste vor der öffentlichen Beta

- [ ] `.env.admin_password` ist auf ein zufälliges starkes Passwort gesetzt, und das Log des ersten Starts bestätigt, dass `PHYSICSOS-OPEN:admin`
      als `SUPER_ADMIN` angelegt wurde; während der öffentlichen Beta gibt es keine Selbstregistrierung von Administratoren.
- [ ] Der TLS-Reverse-Proxy ist aktiviert, und `PHYSICOS_TRUSTED_PROXIES` ist die exakte IP dieses Proxys (ggf. inklusive IPv6-
      Schreibweise); ist es nicht konfiguriert, nicht nach außen freigeben.
- [ ] Auf nginx wurde `scripts/deploy/install-nginx-security-headers.sh` ausgeführt, die öffentliche Antwort
      enthält HSTS und die vier grundlegenden Sicherheits-Header, und `nginx -t` besteht.
- [ ] `.env.image_api_key` ist gesetzt; wurde die Aufgabenbild-Generierung bewusst abgeschaltet, wurde das Secret
      `image_api_key` aus `compose.yml` entfernt und diese Entscheidung dokumentiert.
- [ ] Nach `docker compose up -d postgres redis` sind beide healthy, und `/readyz` liefert Erfolg.
- [ ] Das geplante PostgreSQL-Backup ist aktiviert und der letzte Lauf war erfolgreich; die vollständige Wiederherstellungsübung deckt
      das Dreigespann PostgreSQL + Redis + `app_data` ab und prüft das Manifest.
- [ ] Es ist weiterhin eine einzelne Replik; bei mehreren Repliken zeigt `PHYSICSOS_SESSIONS_ROOT` auf ein gemeinsames Dateisystem und die
      replikaübergreifende Sichtbarkeit von Sessions wurde verifiziert.
