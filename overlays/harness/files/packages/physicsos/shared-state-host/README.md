# PhysicsOS Shared State Host

`@deepseek-ai/dsh-shared-state-host` besitzt die beiden Teile des Laufzeitzustands,
die gemeinsam genutzt werden müssen, sobald PhysicsOS mit mehr als einer
Anwendungsreplik läuft:

- `rateLimit` – atomare Fixed-Window-Zähler, geschlüsselt über einen Namespace-
  Aufruferschlüssel;
- `once` – einmalige Claims für Freigabeantworten, idempotente Schreibvorgänge und
  andere Operationen, die höchstens einmal stattfinden dürfen.

Das Paket hat keine Redis-Abhängigkeit. Es enthält den kleinen RESP2-Client, der für
`EVAL`, `SET`, `GET` und `DEL` nötig ist, sodass der Harness-Vendor-Baum ohne neues
Paket installierbar bleibt. Änderungen an Rate-Limits und Claims laufen als einzelne
Lua-Skripte, wodurch die Lese-Änderungs-Schreib-Sequenz über Replikate hinweg atomar
bleibt.

## Cordis-Services

Das Plugin veröffentlicht drei Services:

| Service                | Form                                         | Konsument                               |
| ---------------------- | -------------------------------------------- | --------------------------------------- |
| `physicsosSharedState` | `{ rateLimit, once, close }`                 | Primitive von learning-host und class-host |
| `physicsosRateLimiter` | Kompatibilitätsadapter `consume(policy, key)` | auth-host `LIMITER_SERVICE`             |
| `physicsosOnceLedger`  | `claim`, `consume`, `release`                | apiproxy-Quittungspfad für `/api/respond` |

Der Kompatibilitätsadapter hat dieselbe Oberfläche aus `consume`, `reset` und
`snapshot` wie `auth-host/src/limiter.ts`. Die Primitive hashen die Aufruferschlüssel,
bevor sie Redis-Schlüssel bauen, sodass Benutzernamen, Tokens, IP-Adressen und
Geräte-Hashes nicht in Redis-Schlüsselnamen erscheinen:

```text
<keyPrefix>:<namespace>:<sha256(rawKey)>
<keyPrefix>:once:<sha256(rawKey)>
```

Der Auth-Kompatibilitätsadapter verwendet `limiter:<policy>` als Namespace, sodass ein
Auth-Login-Bucket als `physicsos:limiter:login:<sha256(rawKey)>` gespeichert wird.

## Konfiguration

Das Memory-Backend ist der sichere Standard für einen einzelnen Prozess. Die
Produktion sollte `backend: redis` setzen und eine Redis-URL aus der
Secret-Umgebung der Bereitstellung bereitstellen. Die Felder für URL und TLS werden
von Schemastery validiert, bevor eine Verbindung geöffnet wird.

```yaml
- id: shared-state-host
  name: '@deepseek-ai/dsh-shared-state-host'
  config:
    backend: redis
    keyPrefix: physicsos
    defaultRateLimitLimit: 60
    defaultRateLimitWindowMs: 600000
    defaultOnceTtlSeconds: 900
    redis:
      url: redis://redis:6379/0
      connectTimeoutMs: 2000
      commandTimeoutMs: 2000
      maxRetries: 3
      retryBaseDelayMs: 100
      tls:
        rejectUnauthorized: true
        servername: ''
        ca: ''
```

TLS wird über das URL-Schema `rediss://` gewählt. `tls.servername` und `tls.ca` sind
optionale Überschreibungen für private Redis-Endpunkte. Credentials in
Fehlermeldungen und Logs werden durch `<redacted>` ersetzt.

## Produktionsgrenze

`compose.yml` stellt bereits Redis 7 bereit, legt die Verbindungs-URL im Secret
`redis_url` ab und stellt der Anwendung `REDIS_URL_FILE=/run/secrets/redis_url` zur
Verfügung. Die Bereitstellungskomposition muss dieses Secret in das Feld `redis.url`
des Plugins auflösen; dieses Paket liest Secret-Dateien nicht direkt. Der Health-Host
bleibt für die Redis-Probe von `/readyz` verantwortlich.

Die Zeile muss vor `auth-host` geladen werden: auth-host löst
`physicsosRateLimiter` auf, während es seinen Service erzeugt, sodass eine spätere
Zeile den Single-Instance-Limiter an Ort und Stelle ließe. Platzieren Sie die
Shared-State-Zeile in `cordis.patch.yml` vor `learning-host`, `class-host` und
`auth-host`; diese Hosts können dann `physicsosSharedState` oder `physicsosOnceLedger`
pro Anfrage verzögert auflösen. Die apiproxy-Quittungsintegration sollte
`physicsosOnceLedger` in ihrer Komposition auflösen und die prozesslokale Map
`pendingResponses` ersetzen, die von der `/api/respond`-Richtlinie verwendet wird.

Mit einer Replik genügt das Memory-Backend. Mit mehr als einer Replik ist das
Redis-Backend erforderlich: Jede Replik muss dasselbe Schlüsselpräfix und dieselbe
Redis-Datenbank verwenden. Ist Redis nicht erreichbar, werfen Backend-Aufrufe, statt
auf einen prozesslokalen Zähler oder eine Claim-Tabelle zurückzufallen. Auth macht
daraus seine Antwort „Abhängigkeit nicht verfügbar“; apiproxy sollte ebenso
geschlossen fehlschlagen, statt eine Antwort zu akzeptieren, die es nicht verifizieren
kann.

## Verifikation

Die Paket-Tests mit dem Vitest-Binary des Repositorys ausführen:

```sh
PHYSICSOS_TEST_REDIS_URL=redis://127.0.0.1:6379/15 pnpm vitest run \
  packages/physicsos/shared-state-host/tests
```

Die Konformanz-Suite läuft gegen Memory und Redis. Redis-Fälle werden mit einem
klaren Suite-Label übersprungen, wenn `PHYSICSOS_TEST_REDIS_URL` nicht erreichbar ist.
Die Suite deckt atomare gleichzeitige Zähler und Claims, TTL-Ablauf, Memory-Verhalten
mit Fake-Uhr, Verbindungs-Timeout-/Fail-closed-Verhalten, Credential-Schwärzung und
ein geordnetes `QUIT`-Herunterfahren ab.
