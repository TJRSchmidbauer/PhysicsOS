# Beitragsleitfaden

Danke, dass du bei PhysicsOS mitmachen möchtest. Dies ist ein gemeinnütziges Projekt für den Physikunterricht der Mittel- und Oberstufe, und externe Entwickler, Lehrkräfte und Forschende sind eingeladen, es gemeinsam zu pflegen.

Mit der Teilnahme an diesem Projekt erklärst du dich bereit, den [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) einzuhalten und Beiträge gemäß den Bedingungen der [`LICENSE`](./LICENSE) (Apache License 2.0) einzureichen.

## Bevor du loslegst

- Node.js muss `>= 24` sein; große Bildressourcen laufen über Git LFS, bitte installiere vor dem Klonen `git-lfs`.
- Committe keine echten Schlüssel, IPs, Passwörter oder Zertifikate; die 7 für das Deployment relevanten Secret-Dateien stehen in [`docs/13-DEPLOYMENT-OPERATIONS.md`](./docs/13-DEPLOYMENT-OPERATIONS.md).
- Suche vor dem Start nach vorhandenen Issues und PRs, um doppelte Arbeit zu vermeiden; bei größeren Änderungen bitte zuerst ein Issue eröffnen, um den Umfang abzustimmen.

## Entwicklungsumgebung

Das Repository-Wurzelverzeichnis und `vendor/deepseek-harness` sind zwei unabhängige pnpm-Workspaces, die pnpm-Version wird vom jeweiligen Feld `packageManager` festgelegt, bitte nicht mit einer globalen Version überschreiben:

| Ort                       | pnpm-Version  | Quelle                                 |
| ------------------------- | ------------- | -------------------------------------- |
| Repository-Wurzel         | `pnpm@11.9.0` | `packageManager` in der Root-`package.json` |
| `vendor/deepseek-harness` | `pnpm@11.7.0` | `packageManager` des Upstream-Submoduls selbst |

Erstes Klonen:

```sh
git clone <your-fork>
cd PhysicsOS
git submodule update --init --recursive
node scripts/overlay/harness-overlay.mjs apply
pnpm install
```

`vendor/deepseek-harness` ist ein gepinntes Upstream-Submodul (der Upstream ist ein MIT-Projekt, siehe [`NOTICE.md`](./NOTICE.md)), dieses Repository ändert dessen Historie nicht.

Der offizielle Web-Einstieg = Upstream-Harness-Workspace + PhysicsOS-Overlay, daher ist `apply` ein notwendiger Schritt:

- `overlays/harness/files/**` wird überlagernd nach `vendor/deepseek-harness/**` kopiert;
- `overlays/harness/upstream-changes.patch` wird auf die vom Upstream verfolgten Dateien angewendet.

Ausführlichere Hinweise zur lokalen Entwicklung (einschließlich Skripttabelle, Tests einzelner Packages, Neubau des Desktop-Pakets, Compose und Fehlerbehebung) stehen in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md).

## Repository-Struktur und Quelle der Wahrheit

| Pfad                                      | Rolle                                                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `overlays/harness/files/**`               | **Quelle der Wahrheit** für den PhysicsOS-eigenen Code auf der Harness-Seite; alle Änderungen an Harness-Plugins und UI zuerst hier vornehmen |
| `overlays/harness/upstream-changes.patch` | Änderungen an vom Upstream verfolgten Dateien; wird von `capture` erzeugt, nicht von Hand ändern                    |
| `packages/**`                             | Quelle der Wahrheit der Domänen-Packages (Engines, Szenen, Aufgabenbank, Adapter usw.), direkt bearbeit- und testbar |
| `apps/desktop/**`                         | Quelle der Wahrheit für Desktop-Shell und Paketierungsskripte                                                       |
| `vendor/deepseek-harness/**`              | Upstream-Submodul + Ergebnis der Overlay-Anwendung; `lib/`, `dist/`, `node_modules/` sind generierte Artefakte, **nicht von Hand ändern**, sie werden vom nächsten `apply` überschrieben |

Der richtige Ablauf ist: `overlays/harness/files/**` ändern → `node scripts/overlay/harness-overlay.mjs apply` → im `vendor/deepseek-harness` bauen und testen. Nur wenn tatsächlich eine vom Upstream verfolgte Datei geändert werden muss, wird sie im vendor geändert und der Patch von den Maintainern per `capture` zurückgeschrieben.

## Branch- und Commit-Konventionen

- Branches erhalten das Präfix `codex/`, zum Beispiel `codex/wave-doppler-model`, `codex/fix-class-csrf`.
- Commit-Nachrichten verwenden [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat(engine-wave): add doppler frequency model
fix(auth-host): reject non-admin settings namespaces
docs: clarify deployment secret rotation
chore(deps): bump vitest to 4.1.10
```

- Ein PR sollte möglichst auf eine Sache konzentriert sein; unbeteiligte Refactorings, Formatierungen und Funktionsänderungen nicht in einem Commit vermischen.
- Keine Build-Artefakte (`lib/`, `dist/`, `*.tsbuildinfo`) oder lokalen temporären Dateien committen.

## Vor dem Einreichen zu bestehende Gates

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Je nach Änderungsumfang zusätzlich:

```sh
pnpm run test:desktop      # bei Änderungen an apps/desktop/** oder am Desktop-Adapter
pnpm run test:acceptance   # bei Änderungen an Oberfläche, Anmeldung, Klassen, Experimenten oder anderen Nutzerabläufen
```

Wie man nur ein einzelnes Package oder eine einzelne Spec ausführt, steht in [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md). Kann ein Gate aus Umgebungsgründen nicht laufen, gib im PR bitte den konkreten Befehl, die Fehlermeldung und den Grund an und überspringe es nicht stillschweigend.

## Ablauf eines Pull Requests

1. Das Repository forken und von `main` einen Branch `codex/<short-topic>` abzweigen.
2. Vor dem Einreichen die obigen Gates ausführen, `git diff --check` sollte keine Ausgabe liefern.
3. Gemäß [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) Änderungsbeschreibung, Testnachweis und Screenshots ausfüllen.
4. Warten, bis die CI grün ist und die Maintainer reviewen; auf Review-Hinweise bitte in Form von Code oder Kommentaren antworten, nicht nur mit „erledigt“.
5. Der Merge erfolgt durch die Maintainer; die Merge-Art (squash / rebase) entscheiden die Maintainer.

## Erwartungen an das Review

- Das Review achtet auf Korrektheit des Verhaltens, Randbedingungen, sichere Standardwerte und Testabdeckung, vor Stilfragen.
- Änderungen an `vendor/deepseek-harness/**` müssen zugleich die Overlay-Quelldatei und das Verifikationsergebnis nach `apply` liefern.
- Änderungen an physikalischen Berechnungen, Aufgabenparsing oder Verifizierern sollten konkrete Zahlenwert-Assertions mitbringen, nicht nur „läuft“ prüfen.
- Unfertige Fähigkeiten bitte wahrheitsgemäß als „geplant“ kennzeichnen, keine Platzhalter-Erfolgszustände als fertig ausgeben.

## Lizenzbezogenes

- Eigener Code und eigene Dokumentation dieses Repositorys stehen unter der Apache License 2.0; mit dem Einreichen eines PRs erklärst du dich einverstanden, dass dein Beitrag unter derselben Lizenz veröffentlicht wird (inbound = outbound), und dass du berechtigt bist, diese Inhalte einzureichen.
- Daten und Komponenten Dritter haben eigene Lizenzen, z. B. sind die C-Eval-Aufgabendaten CC BY-NC-SA 4.0 und DeepSeek Harness MIT, siehe [`NOTICE.md`](./NOTICE.md). Wenn du Inhalte Dritter hinzufügst, gib im PR bitte Herkunft und Lizenz an.
- **Lizenzänderungen erfordern die Zustimmung der Maintainer** (derzeit gemeinsam bestätigt vom Urheberrechtsinhaber und den Repository-Maintainern); Mitwirkende können den Lizenztext des Repositorys nicht einseitig durch einen gewöhnlichen PR ändern.
