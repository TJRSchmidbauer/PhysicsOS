# Leitfaden für Maintainer

Maintainer sorgen dafür, dass PhysicsOS baubar, testbar, veröffentlichbar und sicher betreibbar bleibt. Berechtigungen bedeuten Verantwortung; sie berechtigen nicht dazu, Gates zu umgehen oder Produktionsdaten direkt zu ändern.

## Aufgaben der Maintainer

- Issues, Sicherheitsmeldungen und Regressionen zeitnah bearbeiten sowie Reproduktionsbedingungen und nächste Schritte benennen.
- Beim Review Verhalten, Randbedingungen und sichere Standardwerte priorisieren, vor reinen Stilfragen.
- Die Veröffentlichungsfähigkeit von `main` sicherstellen und dafür sorgen, dass CI-Nachweise zum Kandidaten-Commit passen.
- Lizenzen, Drittanbieterdaten, Abhängigkeiten und die Grenzen der Secret-Verwaltung pflegen.
- Bei Vorfällen im öffentlichen Beta- oder Produktionsbetrieb Zeitpunkt, Auswirkungsbereich, Gegenmaßnahmen und Folgekorrekturen dokumentieren.

## Review-Schwelle

Vor jedem Merge muss der CI-Nachweis für denselben Commit vorliegen, der mindestens Folgendes abdeckt:

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Je nach Änderungsumfang kommen weitere Prüfungen hinzu:

```sh
pnpm run test:desktop
pnpm run test:acceptance
docker compose config --quiet
```

Bei Änderungen an `overlays/harness/files/**` müssen zugleich die Overlay-Quelldatei, das `apply`-Ergebnis und die zugehörigen Tests erläutert werden. Bei Änderungen an physikalischen Berechnungen, Aufgabenparsing oder Verifizierern sind konkrete numerische Assertions erforderlich; die bloße Aussage „läuft“ genügt nicht. Prüfungen, die lokal nicht ausgeführt werden können, sind im PR mit Befehl, Fehlerursache und verbleibendem Risiko anzugeben.

## Merge-Strategie

- Squash-Merge verwenden, damit die Historie von `main` lesbar bleibt.
- PR-Titel und finaler Commit-Titel folgen Conventional Commits, z. B. `fix(auth-host): reject invalid reset tokens`.
- Ein PR konzentriert sich auf eine rücknehmbare Verhaltensänderung; keine fachfremden Refactorings einschleusen.
- Bei Breaking Changes zuerst Migrations-, Rollback- und Datenkompatibilitätsstrategie klar beschreiben.

## Lizenz und Drittanbieter-Inhalte

- Der repositoryeigene Code steht unter Apache-2.0. Eine Lizenzänderung muss in einem eigenen PR erfolgen, der die vorgeschlagene Lizenz, den Grund, Kompatibilitätsrisiken und den Geltungsbereich erläutert; sie darf nicht in Feature- oder Abhängigkeits-Updates versteckt werden.
- Eine Lizenzänderung benötigt mindestens die ausdrückliche Zustimmung des Copyright-Inhabers und eines Maintainers, der die Änderung nicht selbst eingereicht hat; der Nachweis muss im PR verbleiben.
- Vor dem Merge sind die Root-`LICENSE`, `NOTICE.md`, Paketmetadaten und Drittanbieterbedingungen konsistent abzugleichen, und die Upstream-Urheberrechtsvermerke samt Required Notices sind zu erhalten.
- Drittanbieter-Inhalte wie der C-Eval-Aufgabenkatalog behalten ihre eigenen Lizenzen; die Umstellung des Repositorys auf Apache-2.0 verleiht nicht automatisch eine Erlaubnis zur kommerziellen Nutzung.
- Beim Hinzufügen neuer Abhängigkeiten, Datensätze oder generierter Assets sind Herkunft, Lizenz und Nutzungsgrenzen im PR festzuhalten.

## Rote Linien bei der Secret-Verwaltung

- Echte Schlüssel, Passwörter, Zertifikate, IP-Whitelists oder Produktionskonfigurationen dürfen niemals in Git, Logs, Screenshots, Issues oder PRs gelangen.
- In Produktion werden Compose-Secret-Dateien verwendet; lokale `.env*`-Dateien müssen in `.gitignore` bleiben, und nach einer Rotation sind die Deployment-Aufzeichnungen zu aktualisieren.
- Private Signaturschlüssel für Releases existieren nur im Secret Manager der Veröffentlichung oder in einem geschützten lokalen Verzeichnis der Maintainer.
- Bei einem Leak zuerst widerrufen bzw. rotieren und erst danach die Historie bereinigen; das bloße Löschen von Dateien im Arbeitsverzeichnis ist keine Behebung.

## Neuen Overlay-Pfad hinzufügen

1. Die Quelle der Wahrheit unter `overlays/harness/files/<relativer-pfad>` ablegen; `vendor/deepseek-harness` nicht direkt als endgültige Quelle bearbeiten.
2. Den relativen Pfad in `OVERLAY_PATHS` in `scripts/overlay/harness-overlay.mjs` aufnehmen.
3. Muss das neue Paket an Root-Skripten, Bundle-Abhängigkeiten oder der Harness-Konfiguration teilnehmen, die entsprechenden Verweise aktualisieren und Tests ergänzen.
4. `make overlay-apply` ausführen und im Vendor-Baum Typecheck, Lint, Test und Build durchlaufen lassen.
5. Wurden im Vendor-Baum Dateien geändert, die upstream bereits verfolgt werden, führt der Maintainer `make overlay-capture` aus, um den Patch zurückzuholen, und prüft per `git diff`, dass keine Build-Artefakte mitgekommen sind.
6. Vor dem Merge bestätigen, dass Overlay und Vendor-Quelldateien übereinstimmen und weder `.rej`, `.orig` noch nicht zurückgeschriebene temporäre Zustände vorhanden sind.
