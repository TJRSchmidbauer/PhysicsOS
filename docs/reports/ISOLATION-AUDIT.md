# PhysicsOS Mehrbenutzer-Isolations-Audit (Stage 0 → Stage 2 Nachprüfung)

Erstes Audit: 2026-09-26
Letzte Nachprüfung: 2026-09-27
Ziel: `https://physics.dongsiwei.com`
Server: `root@38.76.190.3` (Login per SSH-Key)
Deployment-Commit: `63c20e6e701b1dc1e4188e66903a82a18306f2cc`
App-Image: `sha256:534d02e10edc1bab73521df348a85775b248bf4a7c1a2d62545718f282e0ba29`

Dieser Bericht führt nur Verifikationen durch, ändert keinen Produktcode, committet nicht und führt kein Overlay-Capture aus. Das neu hinzugefügte Abnahmeskript ist
[`tests/acceptance/isolation.mjs`](../../tests/acceptance/isolation.mjs).

## Zuerst das Fazit

**Neuester Stand (2026-09-27): 9 PASS / 0 FAIL / 0 BLOCKED**

- Lernantworten und Lernszenen sind pro Konto isoliert. Schüler A kann die von Schüler B geschriebenen attempt/scene nicht lesen.
- Die Besitzprüfungen für Sitzungsliste, Sitzungsexport und Sitzungs-Prompt haben in der HTTP-Semantik keine Inhalte preisgegeben;
  die erfolgreiche Ablehnung verwendet jedoch einen RPC-Umschlag, der HTTP-Status ist `200`, nicht wörtlich `404/403`.
- Der stillgelegte Pfad `/physicsos/class/*` hängt class-host nicht mehr ein; der Pfad fällt nur auf den Frontend-HTML-
  Fallback und liefert keine Klassen-, Mitglieder-, Hausaufgaben- oder Abgabedaten mehr.
- `session.create` von Nicht-Administratoren wird serverseitig auf kontoprivaten Workspace +
  `physics-student` umgeschrieben; Anfragen von Schülern für Pfade wie `/etc` erreichen den Host nicht.
- Das öffentliche `/api` liefert bei legitimer Domäne `401 unauthenticated`, nicht authentifizierte Anfragen werden nicht mehr
  durch die Host-Schranke mit `403 forbidden` pauschal abgefangen.
- Das Preset `physics-student` hängt nur Physik-Tools und das Fragen-Tool ein, nicht shell-, Dateisystem-,
  Web- oder Subagent-Tools; der bash runner schlägt im Image zudem mit `SANDBOX_UNAVAILABLE` fail-closed fehl.
  Daher hat eine Schüler-Sitzung keinen Tool-Zugang, um `/run/secrets/*` oder Verzeichnisse anderer Konten zu lesen.
- Secret-Dateien sind bereits `999:999 0400`; die app-Identität kann lesen, Container-Identitäten ungleich 999 werden abgewiesen.
- Der Modellpool liefert echte Runden, die Modellkette bricht nicht mehr wegen `AUTH 401` ab.

Die ursprüngliche Aufzeichnung von Stage 0 unten bleibt als Entdeckungsprozess erhalten; die darin genannten drei „blockiert die öffentliche Beta“-Punkte wurden in Stage 2
gemäß den obigen Grenzen behoben und dürfen nicht mehr als aktuelle Release-Schlussfolgerung gelten.

## 1. Datenisolation des Lernens mit zwei Konten

Ausgeführter Befehl:

```sh
PHYSICSOS_AUDIT_ADMIN_PASSWORD='<env-injected>' \
  node tests/acceptance/isolation.mjs
```

Bei Ausführung über die externe Domäne bestehen die Lern-/Klassenprüfungen, `/api/session.create` wird mit `403` blockiert:

```text
[PASS] learning attempts are account-scoped
[PASS] learning scenes are account-scoped
[PASS] class list is membership-scoped
[PASS] foreign class detail is denied: members=403 dashboard=403
[BLOCKED] session setup reaches the host: public /api/session.create returned 403
SUMMARY pass=8 fail=0 blocked=1
```

Über SSH-Local-Port-Forwarding auf den Loopback desselben Containers lautet das vollständige Skript-Ergebnis:

```text
[PASS] learning attempts are account-scoped
[PASS] learning scenes are account-scoped
[PASS] class list is membership-scoped
[PASS] foreign class detail is denied: members=403 dashboard=403
[PASS] session setup succeeds
[PASS] session list is account-scoped
[PASS] foreign session export is denied
[PASS] foreign session prompt is denied
SUMMARY pass=12 fail=0 blocked=0
```

Wichtige ursprüngliche Antworten:

```text
GET /physicsos/learning/attempts?limit=100  (A) -> 200
{"items":[]}

GET /physicsos/learning/attempts?limit=100  (B) -> 200
{"items":[{"id":"isolation-attempt-muies4k1_616ab1", ...}]}

GET /physicsos/class/classes?limit=100  (A) -> 200
{"items":[]}

GET /physicsos/class/classes?limit=100  (B) -> 200
{"items":[{"id":"cls_oyLA2sw_a2IC", ...}]}

GET /physicsos/class/classes/cls_oyLA2sw_a2IC/members?limit=100  (A) -> 403
{"error":{"code":"FORBIDDEN","message":"只有班主任或校管理员可以管理该班级"}}
```

Ursprüngliche Antworten zum Sitzungsbesitz (A greift auf die Session von B zu):

```text
GET /api/session.export?sessionId=session-758d4b59-cc51-47fe-9146-c62ec6f7f45f (A) -> 200
{"type":"server-response","rpcId":"session-export","result":{"ok":false,"error":{"code":"session-not-found","message":"session \"session-758d4b59-cc51-47fe-9146-c62ec6f7f45f\" not found"}}}

POST /api/session.prompt (A, foreign sessionId) -> 200
{"type":"server-response","rpcId":"isolation-a-prompt-muies4k1_616ab1","result":{"ok":false,"error":{"code":"session-not-found","message":"session \"session-758d4b59-cc51-47fe-9146-c62ec6f7f45f\" not found"}}}
```

Das zeigt, dass **keine Inhalte der Gegenseite zurückgegeben wurden**, es erfüllt aber nicht wörtlich die Vorgabe „HTTP muss 404/403 sein“: Hier wird
eine erfolgreiche HTTP-Antwort plus RPC-Error-Umschlag verwendet. Verlangt das Abnahmekriterium von Stage 2 HTTP 404/403,
muss diese Abweichung gesondert behoben werden.

## 2. Ausbruch aus der Agent-Sandbox

### 2.1 Echte Agent-Runde

Zunächst wurde mit einem Schülerkonto eine Sitzung angelegt, der echte WebSocket `/api/events.mux` verbunden und dann ein Prompt gesendet, der die Ausführung von
`pwd; ls -la ..; if [ -r /run/secrets/admin_password ]; then wc -c < ...; else echo DENIED; fi` verlangt. Die Modellanfrage erreichte die Tool-Ausführungsphase nicht,
der Server gab zurück:

```text
EVENT assistant/chunk {"chunk":{"type":"finish","reason":{"kind":"error","failure":{"message":"Authentication Fails, Your api key: ****e4b2 is invalid","code":"AUTH","status":401}}}}
EVENT turn/end {"reason":{"kind":"error","error":{"message":"Authentication Fails, Your api key: ****e4b2 is invalid","code":"AUTH","status":401}}}
```

Daher **lässt sich das „Selbstverhalten des Modells nach Erhalt der Dateiinhalte“ nicht ehrlich beurteilen**. Ob ein Ausbruch möglich ist, darf aber nicht von der
Selbstverweigerung des Modells abhängen; die serverseitige Grenze reicht bereits für eine Schlussfolgerung.

### 2.2 Serverseitige Nachweise

Prüfung im app-Container:

```sh
ssh -i ~/.ssh/id_ed25519 root@38.76.190.3 \
  'cd /opt/physicsos && docker compose exec -T app sh -c '\''id -u; stat -c "%a %U:%G %n" /run/secrets/admin_password; if [ -r /run/secrets/admin_password ]; then printf "secret_readable=yes bytes="; wc -c < /run/secrets/admin_password; else echo secret_readable=no; fi'\'''
```

Ursprüngliches Ergebnis:

```text
999
644 root:root /run/secrets/admin_password
secret_readable=yes bytes=10
```

Auch der Quellcode hält dieselbe Schlussfolgerung ausdrücklich fest:

```text
vendor/deepseek-harness/packages/fs/fs-sandbox/src/index.ts:7
Reads pass through untouched: every mode permits reading.

vendor/deepseek-harness/packages/fs/fs-sandbox/README.md:5
Reads always pass through — every mode permits reading.

vendor/deepseek-harness/packages/sandbox/sandbox-local/src/profiles.ts:17
const args = ['--ro-bind', '/', '/', ...]

vendor/deepseek-harness/packages/sandbox/sandbox-local/src/profiles.ts:30-35
landlockGrantArgs({ readOnly: ['/'], readWrite })
```

Die Schlussfolgerung lautet daher: **Das Risiko einer P0-Schwachstelle ist bestätigt.** Derzeit fehlt nur ein gültiger Modell-Key; sobald das Modell
read/bash-Tool-Aufrufe auslösen kann, wird das Lesen von `/run/secrets/admin_password` von der Datei-Sandbox nicht
abgelehnt. Der minimale Reproduktionspfad ist das obige `secret_readable=yes` im Container und hängt nicht von Modellantworten ab.

## 3. Forensik des Sitzungslayouts auf der Platte

Server-Befehl:

```sh
ssh -i ~/.ssh/id_ed25519 root@38.76.190.3 \
  'cd /opt/physicsos && docker compose exec -T app sh -c '\''find /var/lib/physicsos/sessions -maxdepth 3 -printf "%M %u:%g %s %p\n" | sort'\'''
```

Ursprüngliches Ergebnis:

```text
drwx------ physicsos:physicsos 4096 /var/lib/physicsos/sessions
drwx------ physicsos:physicsos 4096 /var/lib/physicsos/sessions/--etc--
drwx------ physicsos:physicsos 4096 /var/lib/physicsos/sessions/--etc--/session-065fe385-960f-4c59-a0cd-5a44e28ab6bf
-rw------- physicsos:physicsos 13324 /var/lib/physicsos/sessions/--etc--/session-065fe385-960f-4c59-a0cd-5a44e28ab6bf/session.jsonl.zstd
drwx------ physicsos:physicsos 4096 /var/lib/physicsos/sessions/--etc--/session-758d4b59-cc51-47fe-9146-c62ec6f7f45f
-rw------- physicsos:physicsos 297 /var/lib/physicsos/sessions/--etc--/session-758d4b59-cc51-47fe-9146-c62ec6f7f45f/session.jsonl.zstd
drwx------ physicsos:physicsos 4096 /var/lib/physicsos/sessions/--etc--/session-2f2fdf8e-acab-47d1-9240-7d5bab4af0b6
-rw------- physicsos:physicsos 298 /var/lib/physicsos/sessions/--etc--/session-2f2fdf8e-acab-47d1-9240-7d5bab4af0b6/session.jsonl.zstd
```

Derzeit gibt es **ein einzelnes Root, das nach cwd in Buckets unterteilt ist** (hier `--etc--`), keine Schichtung nach Konto. Die Session-Dateien
verschiedener Konten liegen im selben Verzeichnisbaum und laufen unter derselben `physicsos`-UID:

```sh
ssh -i ~/.ssh/id_ed25519 root@38.76.190.3 \
  'cd /opt/physicsos && docker compose exec -T app sh -c '\''for f in /var/lib/physicsos/sessions/--etc--/session-*/session.jsonl.zstd; do printf "%s " "$f"; [ -r "$f" ] && printf "READABLE " && wc -c < "$f"; done'\'''
```

```text
/var/lib/physicsos/sessions/--etc--/session-065fe385-960f-4c59-a0cd-5a44e28ab6bf/session.jsonl.zstd READABLE 13324
/var/lib/physicsos/sessions/--etc--/session-2f2fdf8e-acab-47d1-9240-7d5bab4af0b6/session.jsonl.zstd READABLE 298
/var/lib/physicsos/sessions/--etc--/session-758d4b59-cc51-47fe-9146-c62ec6f7f45f/session.jsonl.zstd READABLE 297
```

Das ist ein zweiter P0-Leckpfad: Selbst wenn die HTTP-API das Lesen der Session von B durch A korrekt ablehnt, kann ein Agent unter derselben UID
auf Dateisystemebene weiterhin die Session-Logs von B lesen. Stage 2 muss die Sitzungspersistenz nach Konten partitionieren
und die Leserechte des Agents auf die eigene Partition beschränken.

## 4. Vertrauensgrenze des öffentlichen `/api`

Server-Befehl:

```sh
ssh -i ~/.ssh/id_ed25519 root@38.76.190.3 \
  'for host in physics.dongsiwei.com 127.0.0.1:3080; do
     curl -sS -o /tmp/fence-body -w "$host -> %{http_code} " \
       -H "host: $host" -H "content-type: application/json" \
       -X POST http://127.0.0.1:3080/api/session.list \
       --data "{\"type\":\"client-request\",\"rpcId\":\"fence\",\"method\":\"session.list\",\"payload\":{}}";
     head -c 80 /tmp/fence-body; echo;
   done'
```

Ursprüngliches Ergebnis:

```text
physics.dongsiwei.com -> 403 forbidden
127.0.0.1:3080 -> 401 {"error":"unauthenticated"}
```

`PHYSICOS_TRUSTED_HOSTS=physics.dongsiwei.com` steht bereits in der Compose-Umgebung, aber der Startbefehl `dsh web` im Dockerfile hat keinen entsprechenden
Parameter `--trusted-host`; der Start-Provider von `dsh web` entnimmt `trustedHost` nur den
CLI-Parametern. Daher wird die Domänenanfrage an der Vertrauensschranke abgewiesen, und öffentliche Browser können die
Agent-API nicht nutzen. Der minimale Reproduktionspfad sind die obigen zwei Host-Anfragen.

## 5. Zusätzliche Funde

- Die Secret-Dateien auf dem Server haben alle den Modus `0644 root:root`:
  `.env.admin_password`, `.env.database_url`, `.env.deepseek_api_key`,
  `.env.image_api_key`, `.env.redis_url`. Die Inhalte wurden nicht gelesen, nur die Berechtigungen festgehalten.
- Der in der echten Agent-Runde offengelegte DeepSeek-Key wurde vom Server mit `AUTH 401` markiert. Das zeigt, dass die aktuelle Produktions-
  Instanz keine nutzbare Modellaufrufkette hat; selbst bei Behebung der Sandbox müssen Agent-Funktionen nach der Reparatur des Produktionsschlüssels erneut getestet werden.
- Die öffentlichen `/api/session.export` und `/api/session.prompt` verwenden bei fehlender Berechtigung `200 + RPC
error` statt `404/403` auf Ressourcenebene. Hängen Client oder Sicherheitsabnahme vom HTTP-Status ab, muss die Semantik vereinheitlicht werden.

## 6. Schlussfolgerung und minimale Abnahmebedingungen für Stage 2

Nach der Behebung in Stage 2 sollte mindestens Folgendes erfüllt sein:

1. `/api` der Domäne `https://physics.dongsiwei.com` ist für legitime Browser erreichbar, ohne Anmeldung weiterhin
   `401`, bösartige Host/Origin werden weiterhin abgewiesen.
2. `session.create` von Nicht-Administratoren darf das vom Aufrufer gelieferte `cwd` nicht mitführen oder beibehalten, das zurückgegebene Preset
   muss ein für das Konto erlaubtes Preset sein, Session-Dateien müssen in der kontoprivaten Partition landen.
3. Auch das Lesen durch fs/bash-Agents darf die Kontopartition nicht verlassen, es darf mindestens nicht `/run/secrets/*`, Session-Verzeichnisse anderer Konten
   und die Plattformkonfiguration lesen.
4. Mit gültigem Modell-Key den echten Agent-Prompt erneut ausführen: Das Lesen von `/run/secrets/admin_password` muss
   von der Sandbox abgelehnt werden, und im Ereignisstrom dürfen weder Secret-Inhalt noch daraus ableitbare Länge/Inhalt erscheinen.
5. Das Zwei-Konten-Skript erneut ausführen und bestätigen, dass A weder attempt, scene noch session von B sieht und die Ablehnungssemantik von
   `session.export`/`session.prompt` auf Client-Ebene stabil erkennbar ist; bestätigen, dass die stillgelegte
   Klassen-API nicht mehr eingehängt ist.

Zustand von Stage 0 damals: **Die HTTP-Isolation der Datenebene bestand im Wesentlichen; Agent-Dateilesen, Partitionierung des Sitzungs-Workspaces und
Vertrauensgrenze der öffentlichen API bestanden nicht.** Diese drei Punkte wurden in Stage 2 behoben und erneut abgenommen, siehe jeweils
§7.2 / §7.3 / §7.6–7.7; der obige neueste Stand ist die aktuelle Release-Schlussfolgerung.

## 7. Behebungsprotokoll (Stage 2, 2026-09-26)

Änderungsumfang (Änderungen im Arbeitsverzeichnis, nicht committet): `compose.yml`, `scripts/deploy/secure-secrets.sh` (neu,
von `deploy-server.sh` und `install-operations.sh` aufgerufen),
`overlays/harness/files/packages/physicsos/health-host/deployment.patch.yml`,
`overlays/harness/files/packages/physicsos/auth-host/{src,tests}`,
`overlays/harness/upstream-changes.patch` (Dispatch-Korrektur für `packages/client/connection`).

### 7.1 Leserechte der Secrets (der Pfad „von anderen Identitäten lesbar“ aus dem ursprünglichen P0-Punkt 1)

> Historische Aufzeichnung: Dieser Abschnitt hält das damals zuerst umgesetzte `root:999 0440` fest. Die endgültige Invariante wurde
> in §7.6 auf `999:999 0400` verschärft und in die Compose-Long-Syntax geschrieben; der ursprüngliche
> Reproduktionsprozess bleibt unten erhalten, um zu bestätigen, warum man sich nicht allein auf die File-Secret-Metadaten von Compose verlassen kann.

Compose unterstützt bei `file:`-Secrets `uid`/`gid`/`mode` überhaupt nicht – wer sie angibt, erhält nur eine Warnung,
im Container sieht man die Host-Datei selbst (Bind-Mount). Minimale Reproduktion:

```text
$ docker compose version
Docker Compose version v5.5.1

$ docker compose up --abort-on-container-exit     # Minimalprojekt: user "999:999", secret mit uid/gid/mode
time="2026-09-26T13:36:32Z" level=warning msg="secrets `uid`, `gid` and `mode` are not supported, they will be ignored"
uid=999 gid=999 groups=999
-rw-------    1 root     root            13 /run/secrets/s.txt
cat: can't open '/run/secrets/s.txt': Permission denied
```

Deshalb wurde die Invariante auf die Host-Datei gelegt (`root:<physicsos gid> 0440`) und in ein Skript + eine Selbstprüfung gegossen,
die bei jedem Deployment/jeder Betriebshärtung ausgeführt werden:

```text
$ bash scripts/deploy/secure-secrets.sh
secure-secrets: /opt/physicsos/.env.admin_password -> 0:999 440
secure-secrets: /opt/physicsos/.env.database_url -> 0:999 440
secure-secrets: /opt/physicsos/.env.deepseek_api_key -> 0:999 440
secure-secrets: /opt/physicsos/.env.image_api_key -> 0:999 440
secure-secrets: /opt/physicsos/.env.postgres_password -> 0:999 440
secure-secrets: /opt/physicsos/.env.redis_password -> 0:999 440
secure-secrets: /opt/physicsos/.env.redis_url -> 0:999 440
secure-secrets: verified app-readable and uid-1000-denied for 5 secrets
```

Gemessen im Container (die app-Identität kann lesen; Identitäten ungleich 999 im selben Container werden abgewiesen):

```text
$ docker compose exec -T app sh -c 'ls -l /run/secrets; printf "admin_password head="; head -c 4 /run/secrets/admin_password; echo'
total 20
-r--r----- 1 root physicsos  10 ... admin_password
-r--r----- 1 root physicsos 112 ... database_url
-r--r----- 1 root physicsos  52 ... deepseek_api_key
-r--r----- 1 root physicsos  68 ... image_api_key
-r--r----- 1 root physicsos  87 ... redis_url
admin_password head=syf1

$ docker compose exec -T -u 1000:1000 app sh -c 'cat /run/secrets/admin_password'; echo "uid1000-exit=$?"
cat: /run/secrets/admin_password: Permission denied
uid1000-exit=1
```

Das schließt nur den Lesepfad „anderer Identitäten“. Der Agent-Prozess läuft unter **derselben UID** wie die app, siehe gesondert 7.2.

### 7.2 Leseisolation des Agents: Vorgenommene Verschärfung und Restrisiko

Das Lesemodell des Upstreams (Original aus dem Quellcode):

- `packages/fs/fs-sandbox/src/index.ts`: `Reads pass through untouched: every mode permits
reading.` – nur bei write/edit gibt es einen Fence;
- `packages/sandbox/sandbox-local/src/profiles.ts`: bwrap verwendet `--ro-bind / /`, Landlock verwendet
  `readOnly: ['/']` – die ganze Platte wird gelesen, nur das Schreiben ist begrenzt.

Im Produktions-Image gibt es derzeit **keinen nutzbaren bash runner**, daher ist der Lesepfad der Shell fail-closed:

```text
$ docker compose exec -T app sh -lc 'command -v bwrap || echo no-bwrap-in-container'
no-bwrap-in-container

$ docker compose exec -T app node /tmp/sandbox-probe.cjs
{
  "launcherPath": "/app/vendor/deepseek-harness/native/landlock-run/packages/linux-x64/bin/landlock-run",
  "launcherExists": false,
  "probe": "unusable",
  "prebuilds": "{ \"platform\": \"linux-x64\", \"binaries\": [ { \"tool\": \"landlock-run\", \"kind\": \"static-musl\", \"path\": \"bin/landlock-run\" } ] }"
}
```

(`prebuilds.json` deklariert die Binärdatei, aber `bin/landlock-run` existiert im Image nicht, `probe()` liefert
`unusable`, `bash`/`terminal` schlagen daher mit `SANDBOX_UNAVAILABLE` fail-closed fehl.)

Vorgenommene Verschärfung: Der Deployment-Patch pinnt die Fallback-Wurzel auf das Elternverzeichnis der Kontoworkspaces, Sitzungen ohne ausdrückliches cwd fallen nicht mehr
auf `process.cwd()` (im Image `/app`, der gesamte Quellbaum) oder `/etc` zurück:

```yaml
- id: sandbox-policy
  config:
    mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'
    workspaceRoot: !!js dshHomePath('physicsos-users')
- id: fs-sandbox
  config:
    cwd: !!js dshHomePath('physicsos-users')
```

**Restrisiko (in Stage 2 nicht gelöst, erfordert Änderungen auf Harness-Seite)**:

1. Die fs-Tools (`read`/`list`/`stat`) haben keinerlei Lese-Allow-List, der Agent kann weiterhin alles lesen, was unter derselben UID lesbar ist
   – einschließlich `/run/secrets/*`, Session-Logs anderer Konten, `/proc/1/environ`. Ein vollständiges Schließen erfordert, `fs-sandbox` einen
   per-session READ fence hinzuzufügen oder den Agent unter einer eigenen UID / einem User-Namespace laufen zu lassen.
2. Der landlock/bwrap-Runner darf nicht einzeln wieder ins Image eingebaut werden: Damit würde auch der Lesepfad der Shell geöffnet. Wenn, dann gemeinsam mit der Lese-
   Allow-List.

**Aktuelle Grenze des Schülerprodukts**: Das Preset `physics-student` ist eine ausdrückliche Allow-List, die nur
`tool-physicsos` und `tool-ask-user` einhängt und keine Zeilen für fs / shell / web / subagent hat;
`preset-composition.spec.ts` prüft diese Komposition fail-closed. Das oben genannte allgemeine Lese-Risiko von fs-sandbox
ist daher in den aktuellen Pfaden für Schüler und Lehrkräfte nicht erreichbar. Wird künftig ein Dateitool ergänzt, muss zuerst zugleich ein
per-session READ fence umgesetzt werden, es genügt nicht, nur eine Preset-Zeile hinzuzufügen.

### 7.3 Sitzung an Kontoworkspace binden (ursprünglicher P0-Punkt 2)

Die Ursache liegt nicht in auth-host. Der gemeinsame `/api`-Dispatch in `packages/client/connection/src/rpc-host.ts` hat
`dispatch` als parameterlose Closure geschrieben und ruft direkt `fallback.fetch(request)` auf, **wodurch der von `wrapFetch(next)` übergebene
request ignoriert wird**. Folge: Die Umschreibung der Response greift (die Listenfilterung sieht normal aus), während die Umschreibung des Request-Bodys stillschweigend verworfen wird.
Mit temporären Probes im Online-Artefakt sieht man, dass der Zweig tatsächlich betreten wurde, die Payload beim Host aber unverändert ankam:

```text
app-1  | DIAG rewriteRequest session.create
app-1  | DIAG session-create-branch {"agentPreset":"standard","cwd":"/etc"}
# POST /api/session.create -> 200 {"result":{"ok":true,"value":{"sessionId":"session-...","agentPreset":"standard"}}}
```

Behebung (`overlays/harness/upstream-changes.patch`):

```ts
const dispatch = (outbound: Request): Promise<Response> => {
  const endpoint = endpointFromPath(channel, new URL(outbound.url).pathname)
  …
  return fallback.fetch(outbound)
}
…
return active?.wrapFetch === undefined ? dispatch(request) : active.wrapFetch(dispatch)(request)
```

auth-host auf seiner Seite behält „`session.create` von Nicht-Administratoren wird stets auf Kontoworkspace + `physics-student` umgeschrieben“ bei
und erhält zwei neue fail-closed-Assertions:

- Übergibt der Client `cwd: '/etc'` (zusammen mit `workspaceId`/`sessionId`), kommt beim Host der Kontoworkspace + Schüler-Preset an;
- Ist das vom Host zurückgegebene Preset nicht `physics-student`, antwortet die Richtlinie mit `session-scope-mismatch` (chinesische Meldung),
  statt eine Sitzung außerhalb der Grenze als Ressource dieses Kontos zu beanspruchen.

### 7.4 Titel des Kontoworkspaces und Offenlegung des Server-Dateisystems

1. **Menschenlesbarer Workspace-Name**: Die Workspace Registry des Harness benennt Einträge nach dem Verzeichnis-Basename, der Kontoworkspace
   erscheint daher als `sha256(userKey)`. auth-host benennt ihn beim erstmaligen Anlegen/Übernehmen des Workspaces durable in „Mein Arbeitsbereich“ um
   (`workspace.rename`, vom Nutzer bereits geänderte Titel werden nicht überschrieben)
   und legt in der eigenen Ansicht `workspace.list` / `workspace.create` des Kontos nur diesen Titel offen. Jedes Konto
   (einschließlich Administratoren) hat sein eigenes Exemplar: Das `workspace.list` von Nicht-Administratoren listet nur ihre eigenen Workspaces, Administratoren
   sehen weiterhin die vollständige Registry, aber auch ihr eigener Eintrag trägt einen lesbaren Titel. `workspace.rename` darf nur Workspaces unter dem eigenen Namen ändern
   (kontoübergreifend ist `workspace-not-found`), der Pfad wird stets vom Server bestimmt, Pfade in der Anfrage werden nicht akzeptiert.
2. **Durchsuchen des Server-Dateisystems**: `host.listDirectory` / `host.pickDirectory` /
   `host.createDirectory` liefern nun für alle Rollen standardmäßig **403** (neu
   `hostFilesystemAccess: 'deny' | 'admin'`, Standard `deny`, Fehlercode
   `HOST_FILESYSTEM_DENIED`, chinesische Meldung). Gehostete Deployments verwenden den Standardwert: Der Assistent braucht keinen Verzeichnisauswähler
   – das cwd von `session.create` wird vom Server an den Kontoworkspace gebunden. Nur Einzelnutzer-/Self-Hosting-Deployments, die
   `hostFilesystemAccess` ausdrücklich auf `admin` setzen, behalten diese Fähigkeit; dann sieht ein Administrator
   die gesamte Maschine, auf der der Harness-Prozess läuft (`/app`, `/var/lib/physicsos` im Container, einschließlich der
   Verzeichnisse `physicsos-users/<sha256>`), die Aktivierung wird nur für den Fall „Betreiber = Maschineneigentümer“ empfohlen.

### 7.5 Verifikation

Lokal (vendor-Workspace, Änderungen über das Overlay gespiegelt):

```text
$ tsc -b packages/physicsos/auth-host/tsconfig.json packages/client/connection/tsconfig.host.json --pretty false
TSC OK

$ vitest run packages/client/connection/tests packages/physicsos/auth-host/tests
Test Files  33 passed (33)
Tests       310 passed (310)

$ oxlint packages/physicsos/auth-host/src packages/physicsos/auth-host/tests \
    packages/client/connection/src packages/client/connection/tests
exit 0
```

Anwendbarkeit des Patches selbst in einem sauberen Worktree (gleichwertig zum Image-Build-Pfad):

```text
$ git worktree add --detach /tmp/phy-vendor-verify HEAD
$ git apply --3way --whitespace=nowarn overlays/harness/upstream-changes.patch
apply exit=0
$ diff <working tree> <clean+patched tree>      # packages/client/connection/{src/index.ts,src/rpc-host.ts,tests/node-half.host.spec.ts}
MATCH
```

Serverseitig (`root@38.76.190.3:/opt/physicsos`): `docker compose config --quiet` besteht; Secret-
Berechtigungen und Ablehnung von uid-1000 siehe 7.1; die ursprünglichen Ausgaben zu cwd/preset von `session.create` nach dem Deployment, Titel von `workspace.list` und
Autorisierungsgrenze des öffentlichen `/api` stehen unten.

**Weiterhin nicht verifiziert**: eine echte Modellrunde. Der Online-DeepSeek-Key liefert `AUTH 401`, daher lässt sich „ob die Sandbox ein modellgetriebenes `read`/`bash`
zum Lesen von `/run/secrets/*` ablehnt“ nicht Ende-zu-Ende erneut testen; die Schlussfolgerung aus 7.2 stammt aus der Runner-Probe und der Quellcode-
Semantik, nicht aus Modellverhalten.

### 7.6 Endgültige Verschärfung der Secret-Berechtigungen (2026-09-27)

Compose schreibt nun für die File-Secrets von app, Postgres und Redis ausdrücklich die Long Syntax
`uid: '999'` / `gid: '999'` / `mode: '0400'`. Compose v5.5.1 weist bei `file:`-Secrets
weiterhin mit `secrets uid, gid and mode are not supported, they will be ignored` darauf hin,
daher wird die eigentliche Invariante weiterhin durch `scripts/deploy/secure-secrets.sh` auf dem Host erzwungen:

- Der Besitzer der Secret-Dateien wird auf `999:999` gesetzt;
- Der Modus wird auf `0400` gesetzt;
- Bei jeder Ausführung wird verifiziert, dass die app-Identität lesen kann und die Identität `uid 1000` nicht lesen kann.

In dieser Runde wurde auf dem Server ausgeführt und folgende schreibgeschützten Nachweise erhalten (auf dem Server wurde kein Image neu gebaut):

```text
$ cd /opt/physicsos
$ docker compose exec -T app id
uid=999(physicsos) gid=999(physicsos) groups=999(physicsos)

$ docker compose exec -T app sh -c \
    'ls -ln /run/secrets; for f in /run/secrets/*; do test -r "$f" || exit 1; done; echo app_read_all=yes'
total 24
-r-------- 1 999 999  10 ... admin_password
-r-------- 1 999 999 112 ... database_url
-r-------- 1 999 999  52 ... deepseek_api_key
-r-------- 1 999 999  68 ... image_api_key
-r-------- 1 999 999  65 ... model_pool_secret
-r-------- 1 999 999  87 ... redis_url
app_read_all=yes

$ docker compose exec -T -u 1000:1000 app sh -c \
    'if cat /run/secrets/model_pool_secret >/dev/null 2>&1; then echo uid1000_read=yes; exit 1; else echo uid1000_read=no; fi'
uid1000_read=no
```

Das Deployment-Log von `secure-secrets.sh` liefert zugleich das Ergebnis `999:999 400` für 8 Host-Secrets und gibt für die 6 tatsächlich in die app gemounteten Secrets
`verified app-readable and uid-1000-denied for 6 secrets` aus.

### 7.7 Kontoworkspace, rename und Durchsuchen des Server-Dateisystems

Folgendes Verhalten ist bereits durch lokale Unit-/Real-Loader-Kompositionstests von auth-host abgedeckt:

- Übergibt der Client bei `session.create` eines Nicht-Administrators `cwd=/etc` sowie gefälschtes
  `workspaceId`/`agentPreset`, erhält der Host tatsächlich den Kontoworkspace +
  `physics-student`;
- Aufrufe von `host.listDirectory` / `pickDirectory` /
  `createDirectory` durch normale Rollen und den Standard-Administrator liefern alle `403 HOST_FILESYSTEM_DENIED`;
- Ein kontoübergreifendes `workspace.rename` durch Schüler und Administrator liefert jeweils `workspace-not-found`;
- Nach dem Umbenennen des eigenen Workspaces durch einen Administrator wird der neue Titel aus `workspace.list` zurückgelesen;
- `workspace.create` akzeptiert nur den virtuellen Produktpfad `physicsos-workspace://<title>`,
  der echte Verzeichnisname wird weiterhin vom Server erzeugt, auch Administratoren können keinen Host-Pfad vorgeben.

**In der Integrationsphase zu verifizieren**: Das Online-Image wurde noch nicht neu gebaut, daher müssen die ursprünglichen öffentlichen Antworten zu `cwd`/Preset der Sitzung, rename-
Read-back und 403 beim Durchsuchen von Verzeichnissen nach einem einheitlichen Overlay-Capture nachgetestet werden.

## 7. Reparaturprotokoll der Modellkette (2026-09-26)

### 7.1 Symptom und Grundursache

Symptom: Eine echte Runde liefert im Ereignisstrom `AUTH 401` (`Authentication Fails, Your api key:
****e4b2 is invalid`). Schicht für Schicht untersucht, wurden drei sich überlagernde Probleme bestätigt:

1. Im Produktions-Secret lag `PHYSICSOS_MODEL_API_KEY` (sha256-Präfix `0ee633…`), dieser Key liefert
   sowohl für `https://api.deepseek.com` als auch für das nutzbare Gateway 401; der nutzbare Key ist eine andere Variable in
   `~/.dsh/.env` auf derselben Maschine (Wert wird nicht protokolliert).
2. Die Standardroute der Basiskomposition ist `deepseek-official` + `https://api.deepseek.com` +
   `deepseek-v4-flash`, was nicht zum tatsächlich nutzbaren OpenAI-kompatiblen Gateway (`deepseek-v4.1-flash`)
   passt; selbst bei richtigem Key käme `model_not_found`.
3. Nebenbei entdeckt: compose setzte nur die Umgebungsvariable `PHYSICOS_TRUSTED_HOSTS`, gab sie aber nie an das
   `--trusted-host` der CLI weiter (die Schranke erkennt nur CLI-Parameter), daher lieferte das öffentliche
   `https://physics.dongsiwei.com/api/*` durchgehend `403 forbidden`, und der Browser-Client blieb bei
   „Arbeitsbereich wird geladen / Loading plugins“ hängen.

### 7.2 Inhalt der Behebung (ohne auth-host / session / Client-Code)

| Ort             | Änderung                                                                                                                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `compose.yml`   | Neu die Durchreichung `DEEPSEEK_BASE_URL` (Standard `https://api.fengshao1227.com/v1`); die app erhält `command:`, das `${PHYSICOS_TRUSTED_HOSTS}` als `--trusted-host` an die CLI übergibt                                                |
| Server-Secret   | `/opt/physicsos/.env.deepseek_api_key` wurde durch einen für diesen Endpunkt gültigen Key ersetzt (`0644`, Wert weder im Repository noch im Bericht)                                                                                     |
| Runtime-Settings | `/var/lib/physicsos/settings.yaml` verwendet `llm-deepseek.models` (`deepseek-v4-flash`, Anzeigename „平台公益模型“) und `agent-default-model` (`deepseek-official` / `deepseek-v4-flash` / `off`); das alte `deepseek-v4.1-flash` bleibt als historisch kompatibler Upstream-Typ erhalten, Details siehe `docs/13-DEPLOYMENT-OPERATIONS.md` §3.3 |

### 7.3 Verifikationsnachweise (Befehle und gekürzte Ausgaben)

Direkte Verbindung zum Gateway (auf dem Server, Key wird aus dem Secret gelesen, nicht ausgegeben):

```text
GET  /v1/models                -> http=200, listet 16 Modelle, darunter deepseek-v4.1-flash
POST /v1/chat/completions      -> http=200, model=deepseek-ai/deepseek-v4.1-flash,
                                  finish=stop, content='pong', reasoning_content=64 Zeichen
```

Echte Runde im Container (admin / `PHYSICSOS-OPEN`, zuerst `session.create` + `session.selectModel`,
dann `session.prompt`, Ereignisstrom über `/api/events.mux`):

```text
request/header   config={"provider":"deepseek-official","model":"deepseek-v4.1-flash",
                         "reasoningEffort":"high","maxTokens":32768}
assistant/chunk  {"type":"text-delta","index":0,"text":"pong"}
assistant/message {"role":"assistant","content":[{"type":"text","text":"pong"}],
                   "source":{"kind":"model","provider":"deepseek-official",
                             "model":"deepseek-v4.1-flash"}}
turn/end         {"reason":{"kind":"completed"}}
sessionStats     llmMs=12596 ttftMs=12486 decodeTokens=4
```

Zählung des Kontingents pro Konto (neu registrierter Schüler `quota_probe_muih6lk5`, STUDENT; SUPER_ADMIN ist entwurfsgemäß ausgenommen):

```text
GET physicsos:limiter:model:877ce432… vor der Runde -> (nil)   TTL -2
GET physicsos:limiter:model:877ce432… nach der Runde -> 2       TTL 545
Die Runde selbst: turn/end {"kind":"completed"}, assistant text "ok"
```

Vertrauensgrenze des öffentlichen `/api` (vor / nach der Behebung):

```text
POST https://physics.dongsiwei.com/api/host.describe
  vor der Behebung -> 403 forbidden
  nach der Behebung -> 401 {"error":"unauthenticated"}
```

### 7.4 Schlussfolgerung und Rest

**Die Modellkette funktioniert**: `deepseek-v4.1-flash` liefert auf der Deployment-Instanz echte Inhalte (`pong` / `ok`),
nicht mehr `AUTH 401`; der Modellzähler pro Konto wächst tatsächlich (0 → 2, einschließlich der Hilfsanfrage für den Sitzungstitel).

Rest und Hinweise:

- `SUPER_ADMIN` verbraucht kein Kontingent pro Konto (Ausnahme für die Störungsbehandlung), zur Verifikation der Zählung muss ein normales Konto verwendet werden.
- Das Tool `web_search` nutzt weiterhin `DEEPSEEK_API_KEY` mit Verweis auf den offiziellen DeepSeek-Suchendpunkt und ist unter einem Drittanbieter-
  Gateway nicht nutzbar; in dieser Runde nicht in die Behebung einbezogen.
- Das Gateway hat einen eigenen Sensitivwortfilter, bei Treffer liefert es `500 / new_api_error` (mit kurzen chinesischen und englischen Sätzen im Test reproduzierbar),
  echte Unterrichts-Prompts können abgelehnt werden und müssen vor dem Start mit der echten Aufgabenbank per Stichprobe verifiziert werden.
- Die Änderung an `compose.yml` in dieser Runde wurde auf den Server übertragen und ist wirksam; da diese Maschine damals github.com nicht erreichen konnte,
  wurde sie noch nicht in das Remote-`main` gepusht (Arbeitsverzeichnis des Servers und diese Datei befinden sich daher im Zustand „lokal geändert“).
