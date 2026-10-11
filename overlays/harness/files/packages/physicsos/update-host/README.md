# @deepseek-ai/dsh-update-host

Host-Plugin für den Update-Kanal von PhysicsOS (更新通道). Ein Präfix (`/physicsos/update`), aufgeteilt danach, wer es aufrufen darf – die Aufteilung ist beabsichtigt:

| Oberfläche | Wer liest | Wer schreibt |
| --- | --- | --- |
| `GET /latest.json` | jeder – der Desktop-Updater ruft sie vor der Anmeldung ohne Cookie auf | — |
| `GET /channels` | — | Super-Admin |
| `GET /releases/:channel` | — | Super-Admin |
| `POST /releases/:channel` | — | Super-Admin (Veröffentlichen) |
| `POST /releases/:channel/:version/rollback` | — | Super-Admin |
| `POST /releases/:channel/:version/yank` | — | Super-Admin |

`latest.json` antwortet in der Form des Tauri-Updaters, grenzt über `?channel=` (`stable` | `beta`) und `?platform=` (z. B. `darwin-aarch64`) ein und trägt `cache-control: public, max-age=60` – Veröffentlichen ist kein Minutenereignis. Die Signatur öffentlich auszuliefern ist von der Konstruktion her unbedenklich: Signaturen existieren, damit jeder Client sie prüfen kann, nicht damit sie geheim bleiben.

Drei Regeln haben echtes Gewicht, und jede existiert, weil die naheliegende Implementierung sie falsch macht:

1. **Signaturen müssen wie echte Signaturen aussehen.** `looksLikeSignature` weist leere Zeichenketten, Platzhalterwörter und Eingaben aus wiederholten Zeichen ab. Der Server kann eine Signatur nicht verifizieren – das kann nur der eingebettete öffentliche Schlüssel des Clients –, muss aber ablehnen, etwas zu hosten, das offensichtlich keine ist: Ein unsigniertes Artefakt in `latest.json` ist der Weg, auf dem Updater-Fehler des Typs „protokollieren und weitermachen“ ausgeliefert werden.
2. **Rollback ist ein Zeiger, kein Löschen.** Die `activeVersion` des Kanals wandert zurück auf ein älteres Release; jede Release-Zeile bleibt erhalten, sodass „haben wir jemals 0.2.0 veröffentlicht“ stets beantwortet werden kann.
3. **Yank behält die Zeile.** `yankedAt` verhindert, dass diese Version ausgeliefert wird; die Zeile bleibt in der Listenansicht der Konsole sichtbar.

Die Identität stammt aus der Sitzung über den Service `physicsosIdentity`, den `auth-host` veröffentlicht. Dieser Host wird im ausgelieferten Patch VOR `auth-host` deklariert, daher wird der Service pro Anfrage statt beim Laden aufgelöst – ein fehlender Identity-Service beantwortet jede geschützte Route mit 503, statt offen zu scheitern (fail open). `tests/composition.spec.ts` bootet die echte Kette und führt einen Rollback über eine Live-Leitung aus.

## Konfiguration

Keine Konfigurationsschlüssel. Das Plugin injiziert `webServer` und `storageDomain` und öffnet die Domäne `physicsos_update`.

## Daten

`releases` hält eine Zeile pro veröffentlichter Version, mit dem Schlüssel `channel|version` – dieselbe Version erneut zu veröffentlichen ist ein Konflikt, niemals ein Überschreiben. `channels` hält eine Zeile pro Kanal; seine einzige Aufgabe ist der Zeiger `activeVersion`, der dafür existiert, dass ein Rollback eine Verschiebung statt einer Rekonstruktion ist. Jeder Schreibvorgang legt ein Audit-Ereignis unter dem handelnden Super-Admin an.

## Verifikation

- `tests/routes.spec.ts` – die Regeln über einem echten HTTP-Server mit gestubbter Identität (27 Fälle: öffentliche `latest.json`-Lesezugriffe, Formprüfungen für Version/Signatur/Artefakt-URL, die Super-Admin-Untergrenze, Rollback- und Yank-Semantik, das 503 bei fehlender Identität und die Audit-Spur).
- `tests/composition.spec.ts` – die echte Cordis-Kette, die belegt, dass das Gate scharf geschaltet und nicht bloß vorhanden ist und dass der Rollback den Zeiger über eine Live-Sitzung verschiebt.

## Modellerfahrung

Keine, da das Paket REST-Oberflächen für Browser und Desktop-Updater bedient und nichts modellseitig Sichtbares registriert.

#### KV-Cache-Wirkung

Keine; dieses Paket stellt keine Provider-Anfrage zusammen und sendet auch keine.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Der Server verifiziert Signaturen nie – `looksLikeSignature` ist ein Formgate, keine Prüfung. Das Vertrauen endet am eingebetteten öffentlichen Schlüssel des Clients; ein kompromittierter Veröffentlichungspfad kann weiterhin eine korrekt geformte falsche Signatur hosten, die der Updater dann bei der Installation ablehnt.
- Artefakte werden per URL referenziert, nicht gehostet: Dieses Paket liefert das Manifest (`latest.json`) aus, nicht die Binärdateien.
- Kein gestuftes Ausrollen – die `activeVersion` eines Kanals springt für alle Clients gleichzeitig um; ein prozentuales Ausrollen braucht eine Auswahlregel, die diese Tabelle nicht trägt.
- Die Kanäle sind in der Domäne fest auf `stable` und `beta` gesetzt; einen dritten hinzuzufügen ist eine Codeänderung, kein Konfigurationsschlüssel.
