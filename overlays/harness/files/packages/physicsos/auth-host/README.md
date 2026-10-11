# @deepseek-ai/dsh-auth-host

Host-Plugin für das PhysicsOS-Kontosystem (账户体系) – Registrierung und Anmeldung auf Schul-Mandanten, argon2id-Passwörter, opake Cookie-Sitzungen, Zulassung per Einladungscode, TOTP-Zwei-Faktor-Anmeldung, persönliche API-Tokens, Begrenzung von Versuchen, die REST-Oberfläche `/physicsos/auth` und die gemeinsame `/api`-Kontorichtlinie über den Service `webServer` und eine Storage-Domänen-Einheit `physicsos_auth`.

## Modell

Die Schule ist ein erstklassiger Mandant, kein Profilfeld:

```
school (tenant)
  └─ user   keyed `schoolId:username` → UNIQUE(school_id, username) is structural
       └─ session   keyed `sha256(token)` → raw tokens never persist
```

`reset_requests` ist die Wiederherstellungswarteschlange der Admins und die Lebenszyklus-Spur. Eine Anfrage kann pending, active, used, cancelled, expired, superseded oder failed delivery sein.
`password_reset_tokens` ist nach dem SHA-256 des Roh-Tokens geschlüsselt; der Rohwert
existiert nur in der Zustellnachricht oder in der einmaligen Admin-Ausstellungsantwort.

`invites`, `api_tokens`, `login_challenges` und `totp_recovery_codes` halten ebenfalls
nur SHA-256-Digests. Einladungs- und API-Token-Geheimnisse gehen bei der Erstellung
genau einmal über die Leitung; TOTP-Anmelde-Challenges und Wiederherstellungscodes
sind einmalig verwendbar.

`api_resources` ist das dauerhafte Besitz-Hauptbuch für Harness-Sitzungen und
-Arbeitsbereiche. Ein Nicht-Admin-Konto besitzt jede Sitzung, die es erstellt, und
genau einen vom Host erstellten privaten Arbeitsbereich unter `workspaceRoot`;
Legacy-/besitzerlose Ressourcen bleiben nur für einen `SUPER_ADMIN` sichtbar.

## Gemeinsame `/api`-Richtlinie

Die generische Harness-API ist eine erstklassige authentifizierte Oberfläche, sobald dieser Host eingehängt ist:

- jede `/api`-Anfrage braucht ein gültiges `physicsos_session`-Cookie oder ein gültiges persönliches Bearer-Token;
- `read`-Tokens dürfen nur lesende Methoden aufrufen; schreibende Methoden erfordern `write`;
- `session.*`-, `subagent.*`-, Goal-, Skill- und verschachtelte Typert-Payloads werden gegen `api_resources` geprüft;
- `session.list`, `session.search`, Arbeitsbereichslisten, Archivstatus und WebSocket-Mux-/Host-Frames werden auf eigene Ressourcen gefiltert;
- `/api/respond` akzeptiert die Antwort auf eine ausstehende Freigabe/Frage nur, nachdem dasselbe Konto diese `rpcId` erhalten hat; die Map der ausstehenden Einträge ist prozesslokal mit 15 Minuten TTL;
- `session.create` eines Nicht-Admins ignoriert `cwd`/beliebige Arbeitsbereichs-Wahlen des Aufrufers und verwendet stets den privaten Arbeitsbereich des Kontos plus die Voreinstellung `physics-student`;
- Host-Pfad-/Konfigurationsmethoden und das Ändern von Agent-Voreinstellungen bleiben Administratoren vorbehalten;
- host-describe meldet den privaten Arbeitsbereich des Kontos, nicht das Bereitstellungs-Root.

Die Richtlinie wird von `client-connection` als optionaler `apiPolicy`-Service
angehängt, der den gesamten gemeinsamen Dispatcher umschließt, sodass sowohl
Typert-Gateway-Methoden als auch Legacy-API-Proxy-Methoden dasselbe Gate durchlaufen.

## REST-Oberfläche (`/physicsos/auth`)

| Methode | Pfad | Body | Ergebnis |
| --- | --- | --- | --- |
| POST | `/register` | `{schoolName, schoolId?, username, displayName, password, deviceId?, inviteCode?}` | `201 {user}` + `Set-Cookie`, wenn die Zulassungsrichtlinie es erlaubt |
| POST | `/login` | `{username, password, rememberDevice?, schoolId?, deviceId?}` | `200 {user}` + `Set-Cookie` |
| POST | `/login/2fa` | `{challengeToken, code}` | schließt eine TOTP-Anmeldung ab und sendet `Set-Cookie`; `code` darf ein einmaliger Wiederherstellungscode sein |
| POST | `/logout` | — | `200 {ok}` + abgelaufenes Cookie; Sitzungszeile widerrufen |
| GET | `/me` | — | `200 {user}` oder `401 UNAUTHENTICATED`; akzeptiert Cookie oder `Authorization: Bearer <token>` |
| POST | `/usage/learning` | `{knowledgeId, correct}` | `201 {cell}` nur angemeldet; faltet die Meldung in eine `learning_counts`-Zelle mit dem Schlüssel `schoolId|date|knowledgeId` – Schule aus der Sitzung, Datum von der Serveruhr, kein Konto in der Zeile |
| POST | `/devices` | `{deviceId}` (hash-förmiges Hex) | `200 {device}` nur angemeldet; idempotentes Wiedersehen, `403 DEVICE_REVOKED` bei einem widerrufenen Gerät |
| POST | `/2fa/setup` | — | `200 {secret, uri}` für die Einrichtung durch `TEACHER`/Administrator |
| POST | `/2fa/enable` | `{code}` | aktiviert TOTP und gibt zehn einmalige Wiederherstellungscodes genau einmal zurück |
| POST | `/2fa/verify` | `{code}` | validiert ein aktuelles TOTP für das angemeldete Konto |
| POST | `/2fa/disable` | `{password, code}` | deaktiviert TOTP und löscht jede Wiederherstellungscode-Zeile |
| GET | `/api-tokens` | — | listet die Tokens des handelnden Kontos nur mit Maskierung |
| POST | `/api-tokens` | `{name, scope?: "read"\|"write", expiresAt?}` | erstellt ein Token; gibt `secret` genau einmal zurück |
| POST | `/api-tokens/:id/revoke` | — | widerruft ein eigenes Token sofort |
| POST | `/password/forgot` | `{username, schoolId?}` | `200 {ok}` einheitliche Quittung; reiht ein einmaliges Zurücksetzen ein oder stellt es direkt zu, wenn das Konto eindeutig aufgelöst wird |
| POST | `/password/reset` | `{token, newPassword}` | `200 {ok}`; Passwort geändert, jede Sitzung und jedes Geschwister-Token widerrufen |
| POST | `/school-requests` | `{schoolName, contact}` | `201 {request}` anonymer Schulantrag, IP-ratenbegrenzt |

Admin-Oberfläche (`/physicsos/auth` Fortsetzung; `SCHOOL_ADMIN` auf den eigenen Mandanten beschränkt, `SUPER_ADMIN` plattformweit):

| Methode | Pfad | Ergebnis |
| --- | --- | --- |
| GET | `/school-requests` | ausstehende Beitrittsanträge |
| POST | `/school-requests/:id/(approve\|reject)` | Antragsteller aufnehmen oder ablehnen |
| GET | `/schools` | Mandantenliste |
| POST | `/schools` | einen Mandanten anlegen (Super-Admin) |
| POST | `/schools/:id/status` | einen Mandanten sperren/reaktivieren |
| GET | `/invites` | mandantenbezogene Einladungsliste (`?schoolId&limit`), maskiert und mit Verwendungszählern |
| POST | `/invites` | 1–100 gehashte Codes für `{schoolId, count, maxUses, expiresAt?}` erzeugen |
| POST | `/invites/:id/disable` | einen Code stoppen, ohne seine Nutzungshistorie zu löschen |
| GET | `/users` | Kontenliste (`?schoolId&role&q`), für Schul-Admins mandantenbezogen |
| POST | `/users` | ein Konto anlegen (Aufruf pro Zeile des CSV-Imports) |
| POST | `/users/:key/(status\|reset-password\|revoke-sessions)` | sperren/reaktivieren, Passwort zurücksetzen, alle Sitzungen beenden |
| GET | `/devices` | registrierte Geräte mit Risikosignalen |
| POST | `/devices/:id/revoked` | pro physischem Gerät widerrufen/wiederherstellen – neue Anmeldungen 403, Live-Sitzungen 401 bei der nächsten Auflösung |
| GET | `/password-resets` | mandantenbezogene Wiederherstellungswarteschlange (`?status&schoolId&q&limit`) |
| POST | `/password-resets/:id/issue` | einen einmaligen Link erzeugen und zurückgeben; macht jedes ältere Token ungültig |
| POST | `/password-resets/:id/cancel` | die Anfrage abbrechen und ihr aktuelles Token widerrufen |
| GET | `/dashboard` | aggregierte Zähler + Zellen der Lernanalytik für die Admin-Konsole |
| GET | `/audit` | mandantenbezogene Audit-Ereignisse, einschließlich der `auth.new_login`-Zeilen für erstes Gerät/erste IP |
| POST | `/audit/export` | CSV- oder JSONL-Stream, gefiltert nach `{format, schoolId?, from?, to?, limit?}`; maximal 50.000 Zeilen |

Fehler antworten mit `{error:{code,message,...details}}` und `BAD_REQUEST`, `SCHOOL_NOT_FOUND`, `SCHOOL_AMBIGUOUS`, `SCHOOL_REQUIRED`, `USERNAME_TAKEN`, `INVALID_CREDENTIALS`, `INVALID_RESET_TOKEN`, `RATE_LIMITED`, `DEPENDENCY_UNAVAILABLE`, `DEVICE_REVOKED`, `UNAUTHENTICATED`, `FORBIDDEN`, `REGISTRATION_CLOSED`, `INVITE_REQUIRED`, `INVALID_INVITE_CODE`, `TWO_FACTOR_REQUIRED`, `INVALID_TWO_FACTOR_CHALLENGE`, `INVALID_TWO_FACTOR_CODE`, `TOKEN_SCOPE_REQUIRED`.

### Mandantenauflösung

Die Schule bleibt intern ein erstklassiger Mandant, aber die öffentliche Leitung trägt nie eine Schulliste – die Person tippt einen Namen, der Host löst ihn auf:

- **Register** löst `schoolName` gegen die feste Mandantenliste auf (`SEED_SCHOOLS`: der Ops-Mandant plus die Liste der Mittel-/Oberschulen in Guizhou in `schools-data.ts`): ein eindeutiger exakter Treffer bei `name`/`shortName` gewinnt, danach ein eindeutiger Teilstring-Treffer. Ein nicht passender Name ergibt `SCHOOL_NOT_FOUND` – die Registrierung legt nie einen Mandanten an, sodass Schreibvarianten eine Schule nicht in mehrere aufspalten können. `SCHOOL_AMBIGUOUS` gibt bis zu 16 `error.candidates` zurück (mit Regionslabel, kürzeste Namen zuerst) für einen Wiederholungsversuch zur Disambiguierung mit `schoolId`.
- **Login** löst das Konto global auf – verifiziert das Passwort gegen jedes aktive Paar `(school, username)` (begrenzt auf 16 Kandidaten). Null Treffer ergeben das einheitliche `INVALID_CREDENTIALS`; ein Treffer stellt die Sitzung für diesen Mandanten aus; mehr als ein Treffer ist der einzige Fall von `SCHOOL_REQUIRED` und gibt `error.candidates` zurück, damit der Client mit `schoolId` erneut versuchen kann.
- `schoolId` bei register/login/forgot ist daher eine Antwort zur Disambiguierung, niemals ein Feld, das die Person aus einer ausgelieferten Liste wählt.

## Sicherheitshaltung

- Passwörter werden zu selbstbeschreibenden argon2id-PHC-Strings gehasht (`node:crypto.argon2`, Node ≥ 24.7); das Plugin weigert sich, auf älteren Runtimes zu laden.
- Das Sitzungs-Cookie (`physicsos_session`) ist `HttpOnly; SameSite=Lax; Path=/`, `Secure` über https; `rememberDevice` macht daraus ein persistentes 30-Tage-Cookie, sonst ein Browsersitzungs-Cookie mit 12 h serverseitigem Ablauf.
- `registrationMode` ist standardmäßig `open`. `invite` verlangt einen gültigen gebundenen Code und schlägt geschlossen fehl, wenn er fehlt; `closed` weist jedes neue Konto ab. Einladungsnutzungen werden atomar auf der Schreibkette der Storage-Domäne erhöht; ist `physicsosOnceLedger` eingehängt, erweitert eine kurzlebige Sperre dieselbe Serialisierung über Instanzen hinweg.
- TOTP ist RFC 6238 SHA-1/6 Ziffern/30 Sekunden mit ±1 Schritt Drift; die Anmelde-Challenge läuft nach 5 Minuten ab und wird einmal verbraucht. Wiederherstellungscodes sind einmalig und nur als Hashes gespeichert.
- Persönliche Tokens verwenden `Authorization: Bearer <token>`. `read` erlaubt lesende `/api`-Methoden, `write` erlaubt schreibende Methoden, der Widerruf wirkt ab der nächsten Anfrage, und alle Token-Aufrufe verwenden den bestehenden Modellbudget-Bucket des Kontos weiter.
- Erste Anmeldungen von neuem Gerät und neuer IP hängen eine `auth.new_login`-Audit-Zeile an; Audit-Exporte streamen Zeilen und laden nie die gesamte Tabelle.
- Login-Ablehnungen werden zu `INVALID_CREDENTIALS` zusammengefasst; ein fehlendes Konto zahlt über eine Dummy-Verifikation dennoch die argon2-Kosten, sodass das Timing keine Nutzer aufzählt.
- Fixed-Window-Versuchs-Buckets begrenzen Fehlversuche pro Konto (5/10 min), pro Quell-IP (20/10 min), Registrierung (60/10 min), Lernmeldungen (120/10 min pro Konto) und forgot-/reset-Versuche (10/10 min nach IP und Subjekt).
- Reset-Tokens werden im Ruhezustand mit SHA-256 gehasht, laufen nach 30 Minuten ab, sind einmalig und werden durch eine neuere Ausstellung, einen Abbruch, das Deaktivieren des Kontos, ein Admin-Zurücksetzen oder die erfolgreiche Einlösung ungültig.
- POSTs verlangen `content-type: application/json` sowie passende `Origin`/`Sec-Fetch-Site`, sofern vorhanden – die Cookie-Sitzung trägt keine ambiente Autorität über Websites hinweg.
- Die Registrierung pinnt `role: 'STUDENT'`; `TEACHER`/`SCHOOL_ADMIN`/`SUPER_ADMIN` existieren im Schema nur für eine künftige adminseitig gesteuerte Aufnahme.
- Proxy-abgeleitete Client-IP/-Scheme wird nur vertraut, wenn der direkte Peer ein exaktes Literal in `trustedProxies` ist.
- Die generische `/api` schlägt geschlossen fehl, wenn der Identity-Host fehlt, und der Kontobesitz wird persistiert statt aus einer vom Client gelieferten ID abgeleitet.

## Konfiguration

Alle `AuthServiceConfig`-Felder (`sessionTtlMs`, `rememberTtlMs`,
`accountAttemptLimit`, `ipAttemptLimit`, `applyAttemptLimit`,
`registrationAttemptLimit`, `learningAttemptLimit`, `passwordResetAttemptLimit`,
`passwordResetTtlMs`, `registrationMode`, `totpAttemptLimit`,
`totpChallengeTtlMs`, `apiTokenLimit`, `attemptWindowMs`, `attemptBucketLimit`,
`trustedProxies`) sind mit sicheren Standardwerten in cordis.yml konfigurierbar.
`workspaceRoot` steuert, wo kontoprivate Harness-Arbeitsbereiche angelegt werden
(Standard `dshHomePath('physicsos-users')`).

## Zustellung beim Zurücksetzen von Passwörtern

Der Standardadapter ist `admin-queue`: `POST /password/forgot` legt eine ausstehende
Zeile und kein Token an. Ein Administrator stellt das Token über
`POST /physicsos/admin/password-resets/:id/issue` aus; die Antwort ist der einzige
Zeitpunkt, an dem der Rohwert existiert, und die Admin-Oberfläche muss ihn
außerhalb des Systems (out of band) zustellen.

Eine Bereitstellung kann einen Cordis-Service namens
`physicsosPasswordResetDelivery` bereitstellen:

```ts
export default {
  kind: 'smtp',
  mode: 'direct',
  async deliver({ username, token, expiresAt, resetPath }) {
    // Send resetPath (or token) to the account's verified channel. Never log it.
  },
}
```

Der Provider muss in der Komposition vor `auth-host` deklariert werden. Ein
Fehler bei der direkten Zustellung widerruft das soeben ausgestellte Token und
markiert die Anfrage als `delivery_failed`; es bleibt nie ein gültiges, aber nicht
zugestelltes Token zurück.

## Gemeinsamer Limiter und Redis-Grenze

`AuthService` konsumiert ein `LimiterBackend`; das mitgelieferte
`InMemoryLimiterBackend` ist die Referenz für einen Prozess. Eine
Multi-Instanz-Bereitstellung liefert vor `auth-host` einen Cordis-Service namens
`physicsosRateLimiter`. Der Provider-Vertrag lautet:

1. jeden Bucket als `physicsos:limiter:<policy>:<sha256(rawKey)>` schlüsseln – rohe IPs,
   Benutzernamen und Tokens erscheinen nie in Redis-Schlüsseln;
2. pro Entscheidung ein atomares Lua-Skript ausführen (`INCR`; `PEXPIRE windowMs` nur
   für einen neuen Schlüssel; Zähler und PTTL zurückgeben);
3. bei Redis-Fehlern werfen. `auth-host` übersetzt das in
   `503 DEPENDENCY_UNAVAILABLE`; es gibt keinen Fallback ohne Limit.

`snapshot()` ist für Remote-Provider optional, weil ein exakter instanzübergreifender
Bucket-Zähler für die Authentifizierung nicht nötig und möglicherweise teuer ist.

## Besitzmigration

Legacy-Harness-Sitzungen/-Arbeitsbereiche ohne `api_resources`-Zeilen werden mit einem
ausdrücklichen Manifest migriert:

```json
{
  "ownership": [
    { "kind": "session", "resourceId": "sess_123", "schoolId": "GZU", "username": "2023123456" },
    { "kind": "workspace", "resourceId": "ws_123", "schoolId": "GZU", "username": "2023123456" }
  ]
}
```

```sh
pnpm --filter @deepseek-ai/dsh-auth-host run migrate:ownership -- \
  --storage-root "$DSH_HOME/storages" \
  --manifest ./ownership.json

# Re-run with --apply after reviewing the dry-run summary.
```

Unbekannte Besitzer oder fehlerhafte Einträge brechen vor dem ersten Schreibvorgang
ab. Eine bestehende Ressource mit einem anderen Besitzer wird als Konflikt gemeldet
und nie überschrieben; der Befehl beendet sich mit 2, wenn Konflikte bestehen.

## Zusammenführung von Schul-Mandanten

Zwei Mandanten, die dieselbe reale Schule beschreiben, lassen sich nicht über die
Registrierungs-/Admin-Oberfläche reparieren, weil jede Nutzer-, Klassen-, Abgabe- und
Lernzeile nach der Mandanten-ID geschlüsselt ist. Verwenden Sie das Merge-CLI nur für
Operatoren mit dem ausdrücklichen Paar aus Quelle/Ziel (der Befehl rät nie eine
Namenszuordnung):

```sh
pnpm --filter @deepseek-ai/dsh-auth-host run merge:schools -- \
  --storage-root "$DSH_HOME/storages" \
  --source gz_source \
  --target gz_target \
  --operator 'PHYSICSOS-OPEN:ops-admin'

# Review the deterministic JSON plan and row counts first. Then repeat the
# target in --confirm:
pnpm --filter @deepseek-ai/dsh-auth-host run merge:schools -- \
  --storage-root "$DSH_HOME/storages" \
  --source gz_source \
  --target gz_target \
  --operator 'PHYSICSOS-OPEN:ops-admin' \
  --confirm gz_target \
  --apply
```

Der Dry-Run schreibt nichts. Apply weist ein fehlendes/abweichendes `--confirm`,
den Plattform-Mandanten als Quelle, ein fehlendes/deaktiviertes Ziel, eine bereits
anderswohin zusammengeführte Quelle, Zielschlüssel-Kollisionen, Präfix-Abweichungen,
unbekannte Quellreferenzen, unbekannte Storage-Tabellen und ein Zeilenlimit pro
Tabelle zurück (Standard 10.000; mit `--max-rows-per-table` senken). Stoppen Sie den
Dienst vor Apply: Das Merge-Journal macht einen Absturz wiederaufnehmbar, ist aber
keine prozessübergreifende Sperre. Das Journal wird geschrieben, bevor die erste
Zeile verschoben wird. Ein Absturz hinterlässt ein Journal im Zustand `applying`;
ein späterer Dry-Run meldet `resume-required`, und ein späteres Apply setzt
idempotent fort. Eine abgeschlossene Zusammenführung meldet `already-merged` und
hinterlässt eine `school.merge`-Audit-Zeile mit `operatorKey`, Mandantenpaar,
Zeitstempel, Zählern pro Tabelle und Gesamtzeilenzahl.

Die Historie von `admin_audit` wird bewusst nicht umgeschrieben. `school_requests`,
die auf den Quellmandanten verweisen, werden bewusst abgelehnt, statt zu raten, ob
sie historisch oder aktionsrelevant sind. Die Quell-Schulzeile bleibt als
deaktivierter Grabstein mit `mergedInto`/`mergedAt` bestehen; die Registrierung löst
auf das überlebende aktive Ziel auf.

Prüfen Sie nach einem Apply die Invariante, indem Sie den Befehl ohne `--apply`
erneut ausführen; er muss `status: "already-merged"` ausgeben. Beim direkten
Inspizieren des JSON-Backends prüfen Sie die Tabellen jeder Einheit auf Schlüssel,
die mit der Quell-ID plus `:` oder `|` beginnen, und bestätigen, dass die
Quell-Schulzeile `"status": "disabled"` hat.

## Invariante

`auth-host-invariant` stellt sicher, dass jede Sitzungszeile zu einem lebenden Nutzerschlüssel `(schoolId, username)` mit passender `userId` aufgelöst wird und dass jeder Nutzer auf eine existierende Schule verweist – eine Verletzung bedeutet, dass ein Schreibvorgang `AuthService` umgangen hat.

## Modellerfahrung

Keine, da das Paket Browser-REST-Oberflächen bedient und nichts modellseitig Sichtbares registriert.

#### KV-Cache-Wirkung

Keine; dieses Paket stellt keine Provider-Anfrage zusammen und sendet auch keine.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Der Besitz ausstehender `/api/respond`-Einträge ist prozesslokal; eine Multi-Instanz-Bereitstellung braucht ein gemeinsames Einmal-Antwort-Hauptbuch.
- Der mitgelieferte Limiter ist prozesslokal; eine Multi-Instanz-Bereitstellung muss den dokumentierten Redis-kompatiblen Service `physicsosRateLimiter` bereitstellen.
- Reset-Tokens sind in der Auth-Domäne dauerhaft, aber das prozessübergreifende Compare-and-Set hängt von den Limits des gemeinsamen Storage der Bereitstellung ab; die Besitzmigration bleibt eine ausdrückliche, manifestgesteuerte Operation.
- Serverseitiger Besitz von PhysicsOS-Szenen/-Aufgaben/-Lernaufzeichnungen ist nicht verdrahtet; V1 begrenzt diese clientseitig, und Spalten `userId`/`schoolId` pro Ressource bleiben zurückgestellt.
- Rollen jenseits von `STUDENT` haben noch keine Aufnahme- oder Berechtigungsoberfläche.
