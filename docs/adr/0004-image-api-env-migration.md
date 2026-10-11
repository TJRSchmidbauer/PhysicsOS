# ADR-0004: Umbenennung der Umgebungsvariablen für die Bildgenerierung PHYSICOS_* → PHYSICSOS_*

- Status: akzeptiert (die Umbenennung in diesem Repository ist abgeschlossen; die alten `PHYSICOS_*`-Namen bleiben für einen Kompatibilitätszeitraum erhalten und werden danach entfernt)
- Datum: 2026-09-28
- Entscheider: PhysicsOS-Owner (umgesetzt durch die Maintainer)
- Zugehörige Dokumente / PRs: `.env.example`, `compose.yml`, `Dockerfile`, `docs/13-DEPLOYMENT-OPERATIONS.md`, `packages/image-generation/**`, `overlays/harness/upstream-changes.patch`

## Kontext

Die Zugangsvariablen für die Bildgenerierung kommen im Repository in zwei Schreibweisen vor: `PHYSICOS_IMAGE_API_KEY` mit einem einzelnen `S` (zuerst bei der Aufgabenbild-Generierung und der Verdrahtung der Deployment-Secrets aufgetaucht) und `PHYSICSOS_IMAGE_API_KEY` mit doppeltem `S` (der Name, den der Owner in den Anforderungen notiert hat). Zwei Namen für denselben Schlüssel bringen gleichzeitig drei Arten von Risiko mit sich:

1. **Konfigurationsdrift**: `compose.yml`, `Dockerfile`, Deployment-Dokumentation und das `apiKeyEnv` von paper-host müssen buchstabengleich sein; ein Fehler an einer Stelle bedeutet „der Schlüssel scheint konfiguriert, ist aber nicht abrufbar“, und ein Fehlschlag der Bildgenerierung zeigt sich auf paper-host-Seite nur als stille Degradierung und ist kaum zu bemerken.
2. **Erschwertes Auditing**: Secret-Scans und Rotation arbeiten nach Namen; zwei Namen bedeuten die doppelte Angriffsfläche für Fehlkonfigurationen.
3. **Neuer Code ohne Grundlage**: Der neue Adapter `@physicsos/image-generation` muss einen Namen wählen, und jede beliebige Wahl zementiert eine der beiden Schreibweisen.

Die Kosten der Nicht-Entscheidung: Bei jedem weiteren Bild-Konsumenten wird die Schreibweise erneut gewürfelt, und bereits konfigurierte Live-Deployments lassen sich nicht sicher umbenennen.

## Entscheidung

1. **Kanonisch ist die Schreibweise mit doppeltem `S`**: `PHYSICSOS_IMAGE_API_KEY`, `PHYSICSOS_IMAGE_API_BASE`, `PHYSICSOS_IMAGE_API_MODEL`.
2. **Die alten Namen mit einfachem `S` werden zu schreibgeschützten Aliasen herabgestuft und bleiben einen Kompatibilitätszeitraum bestehen**: `PHYSICOS_IMAGE_API_KEY` (sowie die symmetrischen `PHYSICOS_IMAGE_API_BASE` / `PHYSICOS_IMAGE_API_MODEL`) können weiterhin gelesen werden, beim ersten Treffer wird jedoch **einmalig** eine Deprecation-Warnung ausgegeben. Die Warnung nennt nur den Variablennamen, niemals den Zugangswert selbst oder irgendein Fragment davon.
3. **Jeder Leser wird auf den kanonischen Namen umgestellt**: `.env.example`, `compose.yml`, `Dockerfile`, `docs/13-DEPLOYMENT-OPERATIONS.md`, `packages/image-generation/**` sowie das `apiKeyEnv` von paper-host. Auf der Deployment-Seite werden beide Namen zugleich materialisiert (in `compose.yml` / `Dockerfile` je zwei Zeilen), sodass Deployments mit der alten `apiKeyEnv`-Schreibweise ohne synchrone Änderung weiterlaufen.
4. **Ausdrücklich nicht getan**: Die Logik der Bildabruf-/Bildausgabe-Pipeline von paper-host wird nicht geändert, nur die Verdrahtung der Umgebungsvariablennamen; es wird kein dritter Name eingeführt; der Schlüssel wird in keine von Git verfolgte Datei geschrieben.

**Auslöser für das Entfernen der alten Namen** (eine Bedingung genügt; dann wird eine neue ADR zur Dokumentation angelegt):

- Es ist bestätigt, dass die `.env`- / Secret-Dateien aller laufenden Deployments auf doppeltes `S` umgestellt sind; oder
- bei der Veröffentlichung der nächsten Minor-Version (spätestens 2026-12-31).

Entfernungsmaßnahmen: Die Legacy-Konstanten und den Fallback-Zweig in `packages/image-generation/src/config.ts` sowie die Zeilen mit einfachem `S` in `compose.yml` / `Dockerfile` entfernen und die Alias-Hinweise in `docs/13-DEPLOYMENT-OPERATIONS.md` streichen.

## Konsequenzen

- Positiv: Ein kanonischer Name zieht sich durch Code, Konfiguration und Dokumentation; Secret-Scans und Rotation müssen nur eine Variablengruppe aufzählen; Deployments können ohne Ausfallzeit umbenannt werden (beide Namen werden gleichzeitig materialisiert).
- Positiv: Die Deprecation-Warnung macht „es wird noch der alte Name verwendet“ beobachtbar, statt sich darauf zu verlassen, dass Menschen daran denken.
- Negativ: Während des Kompatibilitätszeitraums existieren im Code zwei Konstantengruppen und ein Stück Fallback-Logik, `config.ts` wird etwas länger; compose / Dockerfile erhalten je eine Zeile mehr.
- Negativ: Im Kompatibilitätszeitraum muss sichergestellt sein, dass beide Namen funktionieren; jeder neu hinzukommende Leser muss weiterhin den kanonischen Namen verwenden.
- Nachzuverfolgen: Nach dem Entfernen der alten Namen `pnpm -C packages/image-generation run scan:secrets` und `docker compose config --quiet` erneut ausführen; bestätigen, dass die produktive `.env` umbenannt wurde.

## Alternativen

1. **Direkt hart auf doppeltes `S` umschalten, ohne Alias.** Verworfen: Die `.env`- und Secret-Dateien der Live-Deployments tragen noch das einfache `S`; ein harter Wechsel ließe die Aufgabenbild-Generierung in allen nicht synchron umbenannten Umgebungen still degradieren, und die Rollback-Kosten lägen über den Kosten für das Beibehalten eines Alias.
2. **Weiterhin nur das einfache `S` behalten (Status quo).** Verworfen: Der Owner hat doppeltes `S` als kanonisch bestätigt, und der neue Bildadapter braucht einen eindeutigen Namen, der sich in Dokumentation und Scanner festschreiben lässt.
3. **Eine einmalige Start-Migration im Code (nach dem Lesen des alten Namens rückwärts den neuen schreiben).** Verworfen: Wenn sich Umgebungsvariablen innerhalb des Prozesses gegenseitig überschreiben, wird schwer nachvollziehbar, welcher Name gilt, und es verschleiert, dass die Konfiguration nicht geändert wurde; ein schreibgeschützter Alias plus Warnung liefert die Beobachtbarkeit bereits.
