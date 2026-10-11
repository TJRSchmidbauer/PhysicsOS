# DeepSeek Harness Upstream Pin

> PhysicsOS behandelt DeepSeek Harness als **Upstream-Infrastruktur**.  
> Die offizielle Produkt-UI ist der Harness Web Client + `@deepseek-ai/dsh-client-ui-physicsos`.
> Das `apps/web` im Wurzelverzeichnis ist ein veralteter/Übergangs-Physics-Workspace der Kategorie A, der nur noch als Migrationsreferenz und als historisches Screenshot-Asset erhalten bleibt und nicht zu einem zweiten Runtime Host weiterentwickelt wird.

## Repository

- URL: `https://github.com/deepseek-ai/deepseek-harness.git`
- Local path: `vendor/deepseek-harness`
- Integration: Git submodule

## Pinned commit

- SHA: `477b4f420553e8a52c2fbccc464d7561b239c443`
- Upstream tag: `dsh-v0.1.7-rc.2`
- Upstream branch: `master` (`origin/HEAD -> origin/master`)
- Remote: `origin` → `https://github.com/deepseek-ai/deepseek-harness.git`
- Upstream commit date: `2026-09-24`
- Upstream message: `Merge pull request #5180 from deepseek-harness/rel/dsh-0.1.7-rc.2` (`2026-09-24`)
- Upstream version field: `0.1.7-rc.2`

Der im Hauptrepository erfasste Submodul-Commit ist die verbindliche Versionssperre: `git ls-tree HEAD vendor/deepseek-harness` stimmt mit der SHA in dieser Tabelle überein.

> Änderungsprotokoll: `0.1.0-rc.5` (`47f9438…`, 2026-08) → `dsh-v0.1.7-rc.2` (`477b4f4…`, 2026-09-24). Der Landepunkt des Upgrades ist `overlays/harness/upstream-changes.patch`.

## Upstream requirements (from checkout, not guessed)

- `packageManager`: `pnpm@11.7.0`
- Node engines: `^22.19.0 || >=24.0.0`
- TypeScript in Harness: `^6.0.3` (der Workspace beschränkt auf `typescript: '>=5 <7'`)
- Official source run:

```sh
pnpm install
pnpm run build
pnpm dsh web
```

- Official Web URL: `http://127.0.0.1:3080`

## Initiale PHASE-01-Upstream-Verifikation (historische Basis)

> Die folgende Tabelle hält die Ergebnisse der initialen Verifikation des **PHASE-01-Pins** (`47f9438…` / `0.1.0-rc.5`, 2026-08-16) fest und dient nur der historischen Ablage,
> sie steht nicht für den aktuellen Pin. Den Verifikationsstand des aktuellen Pins (`477b4f4…` / `dsh-v0.1.7-rc.2`) siehe „Pinned commit“ und die Commit-Aufzeichnungen dieses Branches.

| Step              | Result       | Notes                                                                                                                                                                                                                  |
| ----------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm install`    | Abhängigkeiten erfolgreich installiert | Das standardmäßige `postinstall` von lefthook schlägt unter einem **Git-Submodul** fehl: `cannot enable extensions.worktreeConfig while core.worktree is in the common config`. Upstream-Quellcode nicht verändert. Die Installation wurde mit `pnpm install --ignore-scripts` abgeschlossen. |
| `pnpm run build`  | Erfolgreich  | Host tsc + tsdown + Client + Web frontend. exit 0.                                                                                                                                                                     |
| `pnpm dsh web`    | Erfolgreich gestartet | Tatsächliche Adresse: `http://127.0.0.1:3080`. Kein echter API Key konfiguriert.                                                                                                                              |
| Local source diff | Damals keiner | Dieser Eintrag hält nur die Verifikation des initialen Pins fest; das aktuelle Repository bindet die Physics Runtime über ein offizielles Client Plugin an.                                                           |

Lokale Verifikationsumgebung:

- Node: `v24.18.0` (erfüllt `>=24.0.0`)
- PhysicsOS-Root-pnpm: `11.9.0`
- Im Harness-Verzeichnis tatsächlich verwendet: `pnpm v11.7.0` (laut dessen Feld `packageManager`)

## PhysicsOS integration boundary

```text
Harness Web Client (Produkt-Shell)
        ↓
@deepseek-ai/dsh-client-ui-physicsos   (Client Plugin, belegt nur Slots)
        ↓
physics-runtime-bridge                 (Scene → Engine → Verifier → Observation → ViewModel)
        ↓
PhysicsOS-Packages im Root-Repository  (repository-relative file: dependencies)

Harness-Agent-Kette (**Produktionspfad**, gemessen mit 0.1.7 / `67e8444`):

Harness Agent Loop (vendor/deepseek-harness, gepinnt; Agent Loop / Session / Tools werden nicht geändert)
        ↓
Harness Tool Runtime (@deepseek-ai/dsh-tools)
        ↓
@deepseek-ai/dsh-tool-physicsos                 (overlays/harness/files/packages/physicsos/tool-physicsos/src/index.ts;
        ↓                                        registriert und leitet nur über ctx.tools weiter, importiert das defineTool des Harness)
@physicsos/agent-tools                          (PhysicsToolRuntime: Experimentkatalog / Aufgaben-Runtime / SceneCommand / Simulation / Beobachtung)
        ↓
PhysicsScene → Engine → Verifier                (einzige Quelle der Zahlenwerte)

Auf dem Desktop gibt es zusätzlich die hostseitige Brücke `apps/desktop/sidecar/bridge.mjs`.

> **Stillgelegt (ADR-0002, 2026-09-27)**: Das früher vorhandene Adapterpaar `@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter`
> (PHASE-01-Skelett, keine Produktionskonsumenten) wurde gelöscht. **Der Harness ist der Agent-Host (Agent host); PhysicsOS baut
> keine eigenständige Agent-Runtime und pflegt auch keine** – Modell und Harness liefern Verstehen und Bedienen, unsere eigene Runtime ist die Runtime der physikalischen Welt
> (Scene → Engine → Verifier), keine Agent-Schleife. Die reale Kette ist Harness Tool Runtime →
> `dsh-tool-physicsos` → `@physicsos/agent-tools` → Engine. Siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`.

Kette Harness-Modell → Physik-Engine (Phase 16 Tool Runtime):

apps/cli/config/agent-presets/physics-student   (Agent-Preset: Persona „Physikverfassung“ + Physik-Tools)
        ↓ eingebunden
@deepseek-ai/dsh-tool-physicsos                 (hostseitiges Tool-Plugin, registriert nur über ctx.tools)
        ↓ link: Quellcode-Brücke, beim Paketieren inline eingebunden
@physicsos/agent-tools                          (PhysicsToolRuntime: Experimentkatalog / Aufgaben-Runtime / SceneCommand / Simulation / Beobachtung)
        ↓
PhysicsScene → Engine → Verifier                (einzige Quelle der Zahlenwerte)
```

Tool-Plugin und Preset sind beides Overlay-Dateien (`overlays/harness/files/packages/physicsos/tool-physicsos`,
`overlays/harness/files/apps/cli/config/agent-presets/physics-student`), die über
`scripts/overlay/harness-overlay.mjs apply` auf das Submodul gelegt werden; `upstream-changes.patch` enthält nur zwei zusätzliche
Hunks: `apps/cli/package.json` deklariert eine `workspace:^`-Abhängigkeit auf das Plugin (der bloße Paketname in der Preset-Zeile wird aus der Host-Zusammenstellung aufgelöst),
`tsconfig.host.json` nimmt die Projektreferenz auf. Build / Typprüfung / Lint / Tests des Plugins laufen über
`build:agent` / `typecheck:agent` / `lint:agent` / `test:agent` im Repository-Root; das Ende-zu-Ende-Gate siehe
`tests/agent/headless-physics-acceptance.mjs` (echter `dsh`-Prozess + Mock-LLM).

Wie `ui-physicsos` ist `dsh-tool-physicsos` eine PhysicsOS-eigene Integrationsschicht im Harness-Workspace: Sie darf
öffentliche Plugin-APIs des Harness wie `defineTool` / `Context` importieren, trägt aber keinerlei Physiklogik und verändert den
Harness-Kern nicht; `@physicsos/agent-tools` selbst importiert den Harness nicht.

Hinweise zur Überlagerung der Produkt-UI siehe `docs/HARNESS-UI-OVERLAY.md`.

Verboten:

- Physics Engine / Question Parser in den Harness-Core schreiben
- Agent Loop / Session Store / Tools des Harness verbiegen
- In `@physicsos/web` oder anderen Geschäfts-Packages interne Harness-Packages direkt importieren
- Die Harness-Sidebar / das Workspace-UX durch eine zweite globale Kopfleiste ersetzen
- In `PhysicsCanvas`, Inspector oder anderen UI-Komponenten verstreut PhysicsOS-Domänen-Packages importieren
- In `dsh-tool-physicsos` physikalische Größen berechnen oder einen zweiten Szenenzustand halten: Es leitet nur an `@physicsos/agent-tools` weiter

## Upgrade procedure

1. Einen eigenen Branch eröffnen
2. Upstream-Changelog / `docs/architecture.md` lesen
3. `git -C vendor/deepseek-harness fetch && git -C vendor/deepseek-harness checkout <new-sha>`
4. Im vendor-Verzeichnis `pnpm install` gemäß offiziellem Befehl neu ausführen (schlägt z. B. lefthook im Submodul erneut fehl, weiterhin `--ignore-scripts` verwenden, den Upstream nicht verändern)
5. `pnpm run build` und `pnpm dsh web` als Smoke-Test
6. Landepunkt des Upgrades sind `overlays/harness/upstream-changes.patch` und diese Datei: Der Patch für dieses Upgrade auf `dsh-v0.1.7-rc.2` umfasst **23 Dateien / 3.309 Zeilen** und deckt Host-Packages wie `packages/client/connection`, `packages/bundle/web-app`, `apps/web`, `typert/protocol`, `core/session`, `session-format-v3-to-v4`, `ui-sidebar-browser`, voice-input sowie Build-Konfiguration ab.
7. Vor dem Upgrade ist ein **On-Box-Sessions-Snapshot + `pg_dump`** zu erstellen: 0.1.7 liest alte Sessions mit `format version: 0` und migriert sie inkrementell (Lesen schreibt die Originaldatei nicht um, nur Schreiben erzeugt v4-Dateien); nach dem Upgrade geschriebene v4-Inhalte sind für ältere Versionen unsichtbar. Details siehe `docs/10-DATA-STORAGE-ARCHITECTURE.md`.
8. Adapter Contract Tests + Agent-bezogene Regression ausführen (spätere Phase)
9. SHA / Datum / Verifikationsstatus in dieser Datei aktualisieren
10. Den Submodul-Pointer im Hauptrepository committen
