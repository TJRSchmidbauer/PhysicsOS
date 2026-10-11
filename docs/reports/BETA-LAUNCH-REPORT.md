# PhysicsOS Bericht zum Start der öffentlichen Beta

- Berichtsdatum: 2026-09-27
- Basis der Anwendungs-Runtime: `63c20e6e701b1dc1e4188e66903a82a18306f2cc`
- Commit zu Branding und Entfernung des Klassenbezugs: `3d7e398a77c82209452224ee9770a46bbc8b4213`
- Neuester Commit mit Nachweisen und Screenshots: `543d7a57`
- Offizielle Adresse: <https://physics.dongsiwei.com>
- Deployment-Verzeichnis: `/opt/physicsos`
- Release-Schlussfolgerung: **Der Eintritt in eine öffentliche Beta mit einer einzelnen Replik und offener Registrierung ist möglich**. Grundlegende Nutzbarkeit, Kontoisolation, Berechtigungen für Schlüssel, Browser-Sicherheits-Header und betriebliche Beobachtung wurden in der Produktion tatsächlich erneut verifiziert; die unten aufgeführten Punkte erfüllen jedoch weiterhin nicht die Anforderungen an unbegrenzte Skalierung oder dauerhaft unbeaufsichtigten Produktionsbetrieb.

> Dieser Bericht enthält keine Klartext-Passwörter, API-Keys, Cookies, Upstream-Keys des Modells oder Secret-Inhalte. Das Administratorpasswort wird aus `/opt/physicsos/.env.admin_password` über ein Compose-Secret in die Anwendung injiziert.

## 1. Lieferumfang

Der Anwendungs-Liefercommit `63c20e6` ändert insgesamt `114` Dateien, fügt `13.528` Zeilen hinzu und löscht `297`; der Lieferumfang umfasst:

- Konten, Mandanten, Rollen, Sitzungen, Geräte-Abmeldung, Passwort-Reset, TOTP und die Admin-Audit-Oberfläche.
- Serverseitige Synchronisation persönlicher Lernantworten und gespeicherter Szenen, idempotentes Schreiben, Paginierung und geräteübergreifendes Lesen.
- Fähigkeiten für Experimente und Aufgabenbank in Mechanik, Optik, Wärmelehre, Fluiden, Schaltungen, Elektromagnetismus, zusammengesetzten Feldern, mechanischen Wellen und moderner Physik.
- Das Agent-Preset `physics-student` und sieben PhysicsOS-Physik-Tools; die Zahlenwerte des Modells stammen aus der Physik-Engine und nicht aus freier Generierung.
- Kontoprivater Workspace, nach Konten geschichtete Sitzungsspeicherung, Verweigerung des Dateisystemzugriffs auf den Host für normale Rollen.
- Admin-Betriebsbedienfeld, Metriken für Festplatte/Sitzungen/Workspace/PostgreSQL/Redis, 15-Sekunden-Cache und Alarmschwellen.
- Plattform-Modellpool, AES-GCM-Verschlüsselung der Keys, gewichtetes Round Robin, Failover, Cooldown-Wiederherstellung und lokaler OpenAI-kompatibler Proxy.
- PostgreSQL, Redis, Compose, Health-Checks, CI, Dokumentation zu Backup/Wiederherstellung/Rollback, Dokumente zu Open-Source-Zusammenarbeit und Sicherheit.
- Das Markenzeichen „Orbit-Linse“ von PhysicsOS, Browser-Favicon und PWA-Installationssymbol; das Produkt ist als persönliche Plattform für Physikexperimente und Lernen positioniert und enthält keine Klassen- oder Hausaufgabenverwaltung.
- Das Web ist der Haupteinstieg der öffentlichen Beta; die Tauri-Desktop-Shell bleibt als optionale Form erhalten, in dieser Runde gibt es keine Signierung, Notarisierung und Store-Veröffentlichung.

## 2. Deployment-Topologie und Adresse

```text
Internet
  |
  | HTTPS / TLS
  v
nginx (38.76.190.3, Let's Encrypt)
  |
  | 127.0.0.1:3080
  v
PhysicsOS app container
  |-- PostgreSQL container (internes Docker-Netz, nicht öffentlich veröffentlicht)
  |-- Redis container (internes Docker-Netz, nicht öffentlich veröffentlicht)
  `-- model-pool proxy 127.0.0.1:38972 (nur im app-Container)
          |
          v
      upstream OpenAI-compatible gateway
```

| Punkt | Aktueller Ist-Zustand |
| --- | --- |
| Öffentlicher Einstieg | `https://physics.dongsiwei.com` |
| HTTP-Verhalten | `http://physics.dongsiwei.com/` liefert `301` auf HTTPS |
| Anwendungs-Listener | Host-Loopback `127.0.0.1:3080`, Container-Port nicht offengelegt |
| Compose-Services | Die drei Container `app`, `postgres`, `redis` sind alle `healthy` |
| Persistente Daten | Benannte Volumes `app_data`, `postgres_data`, `redis_data` |
| Basis der Anwendungs-Runtime | `63c20e6e701b1dc1e4188e66903a82a18306f2cc` |
| Branding und Produktgrenze | `3d7e398a77c82209452224ee9770a46bbc8b4213` (inkrementelles Produktions-Image `physicsos-app:brand-title-fix`) |
| Neueste Nachweise und Screenshots | `543d7a57` |
| Betrieb und Dokumentation | Folgt `origin/main`; spätere Aktualisierungen von Dokumentation und nginx-Härtungsskript erfordern keinen Neubau des Anwendungs-Images |
| Admin-Mandant | `PHYSICSOS-OPEN` |
| Admin-Konto | `admin` |
| Quelle des Admin-Passworts | `/opt/physicsos/.env.admin_password`, per Secret injiziert, Klartext wird im Bericht nicht festgehalten |
| Modell-Proxy | `127.0.0.1:38972/v1`, gemessen liefert `/v1/models` `200` |
| Status des Pool-Backends | 1 aktivierter Kanal, 1 aktiver Key, `encryptionReady=true` |
| Aktuelle Replikenzahl | Einzelne `app`-Replik; vor einer Skalierung muss `PHYSICSOS_SESSIONS_ROOT` geteilt werden |

## 3. Nachweise der fünf erneuten Verifikationen

### 3.1 Deployment, Health-Check und Versionskonsistenz

Gemessene Befehle:

```sh
ssh -i ~/.ssh/id_ed25519 root@38.76.190.3 \
  'cd /opt/physicsos && docker compose ps && docker compose images'

curl -sS https://physics.dongsiwei.com/healthz
curl -sS https://physics.dongsiwei.com/readyz
curl -sS -D - -o /dev/null https://physics.dongsiwei.com/readyz
```

Gemessene Ergebnisse:

```text
Commit der Anwendungs-Runtime: 63c20e6e701b1dc1e4188e66903a82a18306f2cc
app/postgres/redis: healthy
GET /healthz: 200 {"status":"ok"}
GET /readyz: 200 {"status":"ready","checks":{"postgres":{"status":"ok"},"redis":{"status":"ok"}}}
HTTPS: gültig, HTTP-Einstieg 301-Weiterleitung auf HTTPS
```

### 3.2 Sicherheitsgrenzen von Host, Secrets und Browser

Gemessene SSH-Ergebnisse:

```text
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitRootLogin without-password
```

Gemessene Secret-Ergebnisse:

```text
app-Identität: uid=999(physicsos) gid=999(physicsos)
admin_password/database_url/deepseek_api_key/image_api_key/model_pool_secret/redis_url:
  999:999, mode 0400, von der app lesbar
uid 1000 liest model_pool_secret: DENIED
```

`scripts/deploy/install-nginx-security-headers.sh` wurde auf dem Produktions-nginx angewandt und liefert gemessen:

```text
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

Nach wiederholter Ausführung des Skripts bleiben `2` Server-Blöcke bestehen; der HTTP-Einstieg liefert weiterhin `301` auf HTTPS.

### 3.3 Isolation von Mehrbenutzerbetrieb, Agent und Workspace

Am 2026-09-27 in der Produktionsumgebung erneut ausgeführt:

```sh
PHYSICSOS_AUDIT_ADMIN_PASSWORD='<secret-injected>' \
  node tests/acceptance/isolation.mjs
```

Ergebnis:

```text
SUMMARY pass=12 fail=0 blocked=0
```

Wichtige ursprüngliche Semantik:

- Die von Schüler B angelegte Session liefert `agentPreset=physics-student`, `cwd` wird serverseitig an
  `/var/lib/physicsos/physicsos-users/794ffc...` gebunden, vom Aufrufer übergebene Pfade wie `/etc` bleiben nicht erhalten.
- Die `session.list` von Schüler A ist leer, er kann die Session von Schüler B nicht lesen.
- Lernantworten, Szenen und Sitzungsexport verweigern kontoübergreifendes Lesen nach Kontobesitz; die Hausaufgaben-API der Klasse wurde aus der Produktionskomposition entfernt.
- `host.listDirectory` / `host.pickDirectory` / `host.createDirectory` normaler Rollen
  liefern `403 HOST_FILESYSTEM_DENIED`.

Zusätzlicher Nachweis aus `preset-composition.spec.ts` ist `3/3` bestanden: `physics-student` hängt nur
`persona`, `tool-physicsos`, `tool-ask-user` ein, ohne fs, shell, web oder subagent;
die sieben Physik-Tools gelangen nur in den eigenen Scope des Schüler-Agents.

Die fs-Lesegrenze unter derselben UID ist weiterhin ein theoretischer Rest des Agent-Sicherheitsmodells von Upstream:
Das aktuelle Produktions-Preset hat keine fs-/shell-Tools, und der bash runner schlägt wegen `SANDBOX_UNAVAILABLE` fail-closed fehl,
daher hat ein Schüler keinen Zugang zu `/run/secrets` oder den Sitzungen anderer. Wird später ein fs-/shell-Preset ergänzt, ist erneut ein
per-session READ fence mit Abnahme gegen Rechteüberschreitung durchzuführen; die aktuelle Schlussfolgerung darf nicht auf alle Presets übertragen werden.

### 3.4 Modellpool und Betriebs-Bedienfeld

Messung des Pools:

```sh
docker compose exec -T app node -e \
  "fetch('http://127.0.0.1:38972/v1/models').then(async r => console.log(r.status, await r.text()))"
```

Ergebnis: HTTP `200`, die Modellliste wird über den lokalen Proxy zurückgegeben; der Admin-Aufruf
`/physicsos/model-pool/state` liefert `200`, derzeit `1` aktivierter Kanal, `1` aktiver Key,
`encryptionReady=true`. Upstream-Keys werden nur mit den letzten Stellen und bereinigtem Status angezeigt.

Gemessen bei Admin-`/physicsos/ops/metrics`:

```text
cache.ttlMs = 15000
Erster Aufruf force=1: cache.hit=false
Zweiter normaler Aufruf: cache.hit=true
health.status = ok
PostgreSQL = ok
Redis = ok
alerts = 0
Root-Platte usedPercent = 55.29092308187761 (Snapshot 2026-09-27T02:41:52Z)
```

In dieser Runde wurde kein Modellkontingent erneut für eine Chat-Completion verbraucht; die ursprünglichen Nachweise einer echten Runde `pong` / `ok` stehen im Eintrag zur Reparatur der Modellkette in
[`ISOLATION-AUDIT.md`](./ISOLATION-AUDIT.md).

### 3.5 Oberfläche der öffentlichen Beta und Screenshots für Lehrer-Demonstration

Das Werbe-Screenshot-Skript wurde mit einem echten Browser gegen die echte Produktionsseite Ende-zu-Ende ausgeführt und endete mit `exit 0`:

```sh
PHYSICSOS_SHOT_BASE='https://physics.dongsiwei.com' \
PHYSICSOS_SHOT_USER='admin' \
PHYSICSOS_SHOT_PASSWORD='<secret-injected>' \
node tests/acceptance/promo-shots.mjs
```

Beibehaltene acht `1600x1000`-Screenshots:

| Datei | Zweck |
| --- | --- |
| [`01-home.png`](./screenshots/promo/01-home.png) | Startseite der Plattform und Gesamtoptik |
| [`02-experiment-center.png`](./screenshots/promo/02-experiment-center.png) | Experimentzentrum Mittelstufe und Domänenauswahl |
| [`03-lab-series-circuit.png`](./screenshots/promo/03-lab-series-circuit.png) | Experiment Reihenschaltung |
| [`04-lab-convex-lens.png`](./screenshots/promo/04-lab-convex-lens.png) | Abbildungsgesetze der Sammellinse |
| [`05-lab-liquid-pressure.png`](./screenshots/promo/05-lab-liquid-pressure.png) | Untersuchung des Drucks im Inneren einer Flüssigkeit |
| [`06-lab-melting.png`](./screenshots/promo/06-lab-melting.png) | Untersuchung des Schmelzvorgangs eines Kristalls |
| [`07-library.png`](./screenshots/promo/07-library.png) | Ressourcenbibliothek |
| [`08-learning-record.png`](./screenshots/promo/08-learning-record.png) | Lernverlauf und Aktivitäts-Heatmap (dieses Konto hat noch keinen Selbsttest gemacht, daher Leerzustand) |
| [`09-solved-question.png`](./screenshots/promo/09-solved-question.png) | Karte einer gelösten Aufgabe: Engine-Prüfung bestanden Punkt für Punkt + interaktiver Experimentierplatz derselben Szene |

## 4. Lokale Gates und Testzahlen

Aufzeichnung des letzten vollständigen Abschlusses für den aktuellen Commit:

| Gate | Ergebnis |
| --- | --- |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0 |
| `pnpm build` | exit 0 |

Beim Abschluss des Starts erneut ausgeführte Gates:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Ergebnis:

```text
typecheck: exit 0
lint:      exit 0
Test Files  67 passed (67)
Tests       865 passed (865)

Test Files  53 passed (53)
Tests       418 passed (418)

deploy: 3 passed / 3
desktop: 26 passed / 26
build: exit 0
```

Darunter besteht `preset-composition.spec.ts` mit `3/3`. Alle vollständigen Gates wurden vor dem letzten Commit dieser Runde erneut ausgeführt,
danach wird die Release-SHA eingefroren.

## 5. Idempotenz des Overlays

Aktuelle Overlay-Abnahmeaufzeichnung:

```sh
node scripts/overlay/harness-overlay.mjs apply
git -C vendor/deepseek-harness apply --reverse --check \
  ../../overlays/harness/upstream-changes.patch
```

Festgehaltenes Ergebnis:

```text
upstream-changes.patch already applied
git apply --reverse --check: bestanden
Keine Reste von .rej / .orig
Overlay und vendor-Dateien der 17 OVERLAY_PATHS sind Byte für Byte identisch
```

Um `vendor/deepseek-harness` nicht zu verändern, wurde in der Erstellungsrunde dieses Berichts weder `apply` noch `capture` erneut ausgeführt.

## 6. Restrisiken beim Start und ausdrücklich nicht Teil

| Punkt | Aktueller Stand | Behandlung in der öffentlichen Beta | Ausdrücklich nicht Teil |
| --- | --- | --- | --- |
| Desktop-Signierung, Notarisierung, Store-Veröffentlichung | Nicht durchgeführt | Das Web ist der einzige Haupteinstieg; die Desktop-Shell ist eine optionale Entwicklungs-/Self-Hosting-Form | In dieser Runde nicht Teil |
| Content-Security-Policy | Nicht aktiviert | HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy sind aktiviert | CSP vorerst zurückgestellt, bis Allowlists für Inline-Styles, Worker, WebSocket und generierte Assets Ende-zu-Ende getestet sind |
| Multi-Replik-Skalierung | Nicht umgesetzt | Betrieb mit einer einzelnen `app`-Replik | Vor einer Skalierung muss `PHYSICSOS_SESSIONS_ROOT` auf ein gemeinsames Dateisystem zeigen und die replikaübergreifende Sichtbarkeit von Sessions sowie das Einmal-Quittungs-Ledger verifiziert werden |
| `web_search` | Zeigt weiterhin auf den offiziellen DeepSeek-Endpunkt | Keine Fähigkeit des Schüler-Presets `physics-student`; bei Nutzung durch Admin/Standard-Agent ist manuelle Bestätigung nötig | In dieser Runde keine Migration auf ein Drittanbieter-Gateway und keine Zusage zur Verfügbarkeit der Suche |
| Sensitivwortfilter des Drittanbieter-Gateways | Bei Treffer ggf. `500 / new_api_error` | Pool-Failover und Admin-Statusseite sind erhalten | In dieser Runde keine Umgehung oder automatische Umformulierung von Sensitivwörtern; nach dem Start Stichproben mit echter Aufgabenbank nötig |
| Admin-TOTP | Der Admin-Login stellt derzeit direkt eine Session aus, TOTP nicht aktiviert | Empfohlen, vor der Beta-Skalierung zu aktivieren und Wiederherstellungscodes zu sichern | „TOTP-Code wird unterstützt“ nicht als „Administrator hat 2FA aktiviert“ schreiben |
| Vollständige Disaster-Recovery-Übung | Geplantes PostgreSQL-Backup ist dokumentiert | Die öffentliche Beta führt täglich Backups fort | Verschlüsseltes Offsite-Backup von Redis + `app_data`, vollständige Wiederherstellung und RPO/RTO-Übung bleiben als „zu verifizieren“ markiert |
| Dateisystem-Lesemodell unter derselben UID | Das Lesemodell von Upstream erlaubt weiterhin Dateien, die unter derselben UID lesbar sind | Das aktuelle Produktions-Schüler-Preset hat keine fs/shell-Tools, bash runner fail-closed | Den bwrap/landlock-Runner nicht wieder einbauen, bevor ein per-session READ fence hinzugefügt wurde |

## 7. Index des Betriebshandbuchs

Hauptleitfaden: [`docs/13-DEPLOYMENT-OPERATIONS.md`](../13-DEPLOYMENT-OPERATIONS.md)

| Kapitel des Handbuchs | Inhalt |
| --- | --- |
| §1 | Produktionstopologie, Grenze der einzelnen Replik und persistente Volumes |
| §2 | Voraussetzungen für Docker, Compose, Reverse Proxy und TLS |
| §3 | Secret-Dateien, vertrauenswürdige Proxys, Vertrag der Laufzeitumgebung |
| §3.3 | Base URL des Modells, Modellname und Ausgabelimit |
| §3.4 | Modellkanal-Pool, Round Robin, Cooldown, manuelle Wiederherstellung, Verschlüsselung und Backup |
| §4 | CI-Gates |
| §5 | Build, Image und Release-Aufzeichnung |
| §6 | Deployment, Health-Check und Smoke-Test mit authentifiziertem Schreiben |
| §7 | Geplantes PostgreSQL-Backup und Vollbackup PostgreSQL + Redis + app_data |
| §8 | Wiederherstellungsschritte |
| §9 | Rollback-Grundsätze |
| §10 | SSH, Rotation der Container-Logs, nginx-Sicherheits-Header und öffentliche Selbstprüfung |
| §11 | Tägliche/wöchentliche Betriebsprüfungen und Incident Response |
| §12 | Checkliste vor der öffentlichen Beta |

Prüfung zu Isolation und Sicherheit: [`docs/reports/ISOLATION-AUDIT.md`](./ISOLATION-AUDIT.md)

## 8. Liste der Demonstrationsbilder für Physiklehrkräfte der Mittelstufe

Empfohlene Reihenfolge der Demonstration:

1. Mit `01-home.png` den Einstieg der Plattform und die Positionierung „die Physik-Engine liefert Fakten, die KI übernimmt die Erklärung“ vorstellen.
2. Mit `02-experiment-center.png` die Kategorien der Mittelstufe, die Experimentauswahl und die abgedeckten Unterrichtsthemen zeigen.
3. Mit `03-lab-series-circuit.png` Parameteränderungen der Schaltung und die Kopplung der Messwerte demonstrieren.
4. Mit `04-lab-convex-lens.png` Gegenstandsweite, Bildweite, Abbildungsgesetze und den Hauptstrahlengang demonstrieren.
5. Mit `05-lab-liquid-pressure.png` den Zusammenhang zwischen Flüssigkeitstiefe und Druck demonstrieren.
6. Mit `06-lab-melting.png` das Temperaturplateau und die Zustandsänderung beim Schmelzen eines Kristalls demonstrieren.
7. Mit `07-library.png` Aufgabenbank und Experimentressourcen zeigen.
8. Mit `08-learning-record.png` Lernverlauf und Aktivitäts-Heatmap zeigen. Beachten: Dieses Bild hängt vom Kontozustand ab – hat das Demokonto keinen Selbsttest gemacht, ist es ein **Leerzustand** (0 Übungen); für einen nicht leeren Effekt muss auf der Lösungskarte dieses Kontos zuerst ein Selbsttest abgeschlossen werden.
9. Mit `09-solved-question.png` abschließen: die vollständige Antwort auf eine Aufgabe – das Ergebnis wird von der Engine geliefert und Punkt für Punkt geprüft (Schwerkraftkomponente, Stützkraft, Szenenstruktur), rechts steht dieselbe `PhysicsScene` in interaktiver Form im Experimentierplatz.

Alle Bilder stammen von der echten Produktionsseite und enthalten weder das Administratorpasswort noch Backend-Secrets.

## 9. Schlussfolgerung zum Start und noch zu Verifizierendes

**Go**: Der aktuelle Commit kann den Betrieb einer öffentlichen Beta mit einer einzelnen Replik und offener Registrierung beginnen; der Produktionswert von `PHYSICSOS_REGISTRATION_MODE`
wurde gemessen als `open`. Bei Missbrauch oder auffälligen Modellkosten lässt sich verlustfrei auf `invite` / `closed` umschalten und
`app` neu starten.

**Noch zu verifizieren**:

- In der Erstellungsrunde dieses Berichts wurde kein Modellkontingent erneut für eine echte Chat-Completion verbraucht.
- `web_search` wurde nicht Ende-zu-Ende abgenommen und zeigt weiterhin auf den offiziellen DeepSeek-Endpunkt.
- Der Sensitivwortfilter des Drittanbieter-Gateways wurde nicht mit einer vollständigen Aufgabenbank per Stichprobe geprüft.
- Multi-Replik-Skalierung, gemeinsames Sessions-Root, Offsite-Wiederherstellung von Redis + app_data und vollständiges Disaster-Recovery-Failover wurden nicht geübt.
- Desktop-Signierung, Notarisierung, Auto-Update und Veröffentlichung des Installationspakets wurden nicht durchgeführt.
- CSP ist nicht aktiviert; der Betrieb erfolgt nur mit den derzeitigen fünf grundlegenden Sicherheits-Headern.

## 10. Nachtrag: Kontrolliertes Upgrade auf Harness `dsh-v0.1.7-rc.2` und Plugin-Plattform (Branch zur Veröffentlichung ausstehend)

Dieser Abschnitt hält die Folgearbeiten desselben Tages (2026-09-27) fest. Sie sind **noch nicht in der Produktion**: Die Schlussfolgerung aus Abschnitt 9 oben entspricht weiterhin dem aktuellen Produktionsstand, der Inhalt dieses Abschnitts liegt auf dem Branch `codex/harness-sync-ui-plugins`, hat die Gates aus Task 6 nicht durchlaufen und wurde nicht formal befördert, daher zählt er nicht als „veröffentlicht“.

### 10.1 Umfang der Synchronisation

- Einmalige kontrollierte Synchronisation: Das Harness-Submodul wird von `47f943859bef60e4160492346772ded9b24f765a` auf das Release-Tag `dsh-v0.1.7-rc.2` (`477b4f420553e8a52c2fbccc464d7561b239c443`) angehoben.
- Ausdrücklich **keine** automatische Verfolgung des Upstream-`master`: Es wird nur dieses eine Upgrade durchgeführt, nach der Verifikation der Veröffentlichung wird dieser Upstream-Commit fixiert; später wird nur bei neuen Versionen hingewiesen, manuell in einem isolierten Worktree upgegradet und nach Verifikation veröffentlicht.
- Wichtige Commits des Branches: `05c554a` (Plugin-Verzeichnis), `6b8b1ae` (einheitliche Admin-Backend-Shell), `a4e0bf1` (Admin-Backend-Plugin-Seite), `0a2a6b1` (Harness-Sync), `bc080ed` (Rotation der Plugin-Signatur), `37377a8` (Build-Grenze), `94cc797` (Protokollmigration 0.1.7 und Gate-Korrekturen).

### 10.2 Änderungen, die das Produkt erhält

- **Einheitliche Admin-Backend-Shell**: Alle Admin-Seiten verwenden gemeinsam `AdminPage` / `AdminToolbar` / `AdminStats` / `AdminCard` / `AdminEmpty` / `AdminTable`, Seitenkopf, Toolbar, Karten und Leerzustand haben dieselbe Geometrie, es gibt nicht mehr je Seite eigene äußere Ränder.
- **Plugin-Center**: Das offizielle Verzeichnis projiziert direkt das `pluginInventory` des Harness, ohne die Paketerkennung erneut zu implementieren; die PhysicsOS-Seite liest aus dem signierten Manifest `plugins/manifest.json` die 12 vorinstallierten Plugins und führt für jeden Eintrag eine Ed25519-Signaturprüfung, eine SHA-256-Digest-Prüfung, eine Prüfung des Harness-Versionsbereichs und eine Prüfung gegen die geschlossene Whitelist von Fähigkeiten durch. Die erste Version beschreibt nur die vorinstallierten Pakete und persistiert den Aktivierungs-/Deaktivierungszustand durch Administratoren, **es gibt keinen Pfad zum Herunterladen zur Laufzeit oder zum Ausführen beliebigen Codes**; `class-host` wurde aus Manifest und Verzeichnisprojektion ausgeschlossen.
- **Protokollangleichung an 0.1.7**: `api-policy` akzeptiert zugleich die alte flache Payload `namespace.method` und das Wire-Format `namespace/method` + `{ args }` von 0.1.7 und schreibt die umgeschriebene Payload in die ursprüngliche Form des Umschlags zurück, sodass das Umschreiben des Besitzes von Session/Workspace in beiden Oberflächen wirksam bleibt; der Desktop-Sidecar wechselt auf den Sitzungsstrom `remote.mux` + `session/follow` von 0.1.7.
- **Vorwärtsmigration alter Sitzungslogs**: 0.1.7 bringt eine Migrationskette des Sitzungsformats `v0 → v1 → v2 → v3 → v4` mit (`packages/session/session-format-v0-to-v1` … `-v3-to-v4`, wobei `catalog-migration.ts` für `version <= 3` den `historicalSessionFormatCatalog` wählt); vorhandene v0-Sitzungslogs sind nach dem Upgrade lesbar.

### 10.3 Vorhandene Verifikationsnachweise (Stand der Erstellung dieses Abschnitts)

Auf dem Branch `94cc797` bestehen die vier statischen Gates mit `exit 0`:

| Gate                  | Ergebnis                                                   |
| --------------------- | ---------------------------------------------------------- |
| `pnpm run typecheck`  | exit 0                                                     |
| `pnpm run lint`       | exit 0                                                     |
| `pnpm run test`       | exit 0 (core + web 872 + agent 440 + deploy + desktop)     |
| `pnpm run build`      | exit 0                                                     |

### 10.4 Unvollständiges und Zurückgestelltes (ehrliche Aufzeichnung)

- **Die echte Browser-Abnahme ist noch nicht bestanden**: `pnpm run test:acceptance` (`node tests/acceptance/glass-surfaces.mjs`) besteht bei der Erstellung dieses Abschnitts noch nicht und wird derzeit repariert (owner: web boot fix). Das ist ein Gate von Task 6 und muss vor der formalen Beförderung bestehen; dieser Abschnitt behauptet nicht, dass es besteht.
- **Alle übrigen Schritte von Task 6 sind nicht erledigt**: Produktions-Image-Build + isolierter Compose-Smoke-Test, Smoke-Tests zu Kontoisolation / Modellpool, Rollback-Image und Backup, formale Beförderung wurden alle nicht ausgeführt.
- **Vor der Beförderung ist ein Backup nötig**: 0.1.7 migriert vorhandene v0-Sitzungslogs vorwärts, daher ist vor der Beförderung ein Backup des sessions-Root-Verzeichnisses (`/var/lib/physicsos/sessions`) auf Dateisystemebene sowie ein `pg_dump` zu erstellen; das Rollback-Image (die vorherige Version `14157e1`, Submodul `47f9438`) ist nur zusammen mit diesem Backup ein echtes Rollback, beim Rollback wird nicht an Ort und Stelle herabgestuft, sondern aus dem Backup wiederhergestellt. Von den 78G Hostplatte sind etwa 23G frei, was für einen Image-Neubau reicht; vor dem Neubau sind alte Images aufzuräumen.
- **Zurückgestellte Code-Migration**: Die beiden veralteten synchronen Aufrufe `session.snapshotEvents()` in `overlays/harness/files/packages/physicsos/tool-physicsos/src/index.ts` und `src/invariant.ts` werden weiterhin mit `// oxlint-disable-next-line typescript/no-deprecated ... migration deferred.` unterdrückt und nicht auf die asynchrone Event-API von 0.1.7 migriert; sie sind als zurückgestellte Migration vermerkt, nicht als erledigt.
- **Sonstige Hinweise**: `typecheck:web` prüft nun mit `--force` den gesamten Aggregat des Harness-Clients auf Typen (langsamer, fängt aber genau Grenzverletzungen ab); beim Schreiben von `upstream-changes.patch` normalisiert `scripts/overlay/harness-overlay.mjs` Kontextzeilen mit einem einzelnen Leerzeichen, damit `git diff --check` sauber bleibt (`git apply` akzeptiert das, mit `git apply --reverse --check` verifiziert).

### 10.5 Produktionsfakten (schreibgeschützte Prüfung bei der Erstellung dieses Abschnitts)

- Produktions-HEAD: `14157e180a702d056909eabbdec0416bd21a279c` (also die oben genannte Rollback-Version).
- `app` / `postgres` / `redis`: alle `healthy`.
- `http://127.0.0.1:3080/readyz`: `{"status":"ready","checks":{"postgres":{"status":"ok"},"redis":{"status":"ok"}}}`.
- Hostplatte: von 78G etwa 23G frei.
- Im Produktions-Sessions-Verzeichnis `/var/lib/physicsos/sessions` liegen 34 Sitzungslogs, von denen das neueste noch im ältesten Disk-Format `{"type":"session","version":0,...}` vorliegt.
