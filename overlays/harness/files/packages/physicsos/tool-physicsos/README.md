# @deepseek-ai/dsh-tool-physicsos

Hostseitiges Plugin (host-plane tool plugin) des Harness für die PhysicsOS-Physik-Tools. Es registriert die `PhysicsToolRuntime` aus `@physicsos/agent-tools` als sieben vom Modell aufrufbare Tools und enthält selbst keine Physikberechnung – alle Zahlenwerte stammen aus der PhysicsOS-Engine, dem Verifier und der Aufgaben-Runtime.

## Registrierte Tools

| Für das Modell sichtbarer Name | Runtime-Methode | Wirkung |
| --- | --- | --- |
| `physics_list_experiments` | `listExperiments()` | Experimentkatalog (id / Domäne / Stufe / Titel) |
| `physics_create_experiment` | `createExperiment(id, title?)` | baut anhand der Katalog-id eine echte `PhysicsScene`, gibt `sceneId` zurück |
| `physics_solve_question` | `solveQuestion(text)` | Aufgabentext → Parsen → Szene bauen → Engine-Lösung → Prüfung, gibt strukturierte Lösung und `sceneId` zurück |
| `physics_describe_scene` | `describeScene(sceneId)` | aktueller Zustand der Szene: Objekt-ids, Beobachtungsgrößen, verfügbare Befehle |
| `physics_scene_command` | `applyCommand(sceneId, type, payload)` | führt einen `SceneCommand` aus (revision +1); bei Ablehnung wird `ok: false` zurückgegeben, kein Fehler geworfen |
| `physics_simulate` | `simulate(sceneId)` | Engine-Simulation + Erhaltungsprüfung: abgeleitete Größen, Ereignisse, jede Prüfung |
| `physics_observe` | `observe(sceneId, t)` | Engine-Zustand zu einem Zeitpunkt |

Namen, Beschreibungen und der für das Modell sichtbare Text stammen aus `@physicsos/agent-tools` (`PHYSICS_TOOL_DOCS`, `PHYSICS_TOOL_RENDERERS`); der dem Modell von jeder Harness-Anbindung präsentierte Vertrag und Wortlaut sind gleich: Der kanonische Wert ist das JSON der Runtime (für Code Mode / Programme), `render` gibt die chinesische Textprojektion der Runtime aus (jeder Zahlenwert mit Einheit, jede Prüfung mit Urteil). Kodierte Ablehnungen der Runtime (`SCENE_NOT_FOUND`, `UNKNOWN_EXPERIMENT` …) werden als `PhysicsToolCallError` geworfen, der `code` landet in `error.info.code` von `tool/result`.

## Konfiguration

```yaml
- id: tool-physicsos
  name: '@deepseek-ai/dsh-tool-physicsos'
  config:
    sceneScope: session   # session (Standard) | process
    maxScenes: 64         # Obergrenze der je Runtime gehaltenen Szenen, darüber wird die älteste verworfen
```

`session`: eine `PhysicsToolRuntime` pro Agent-Sitzung, die Szenen der Lernenden sind füreinander unsichtbar; `process`: alle Sitzungen auf diesem Host teilen sich eine (Aufrufer ohne Agent – Tests, Code Mode – landen im anonymen Geltungsbereich).

## Zugehörige Kompositionen

- Web: `apps/cli/config/agent-presets/physics-student/agent.cordis.yml` (Voreinstellung „Physik-Lernmodus“: Persona mit Physik-Verfassung + dieses Plugin + `tool-ask-user`, ohne Shell-/Datei-/Web-/Subagent-Tools).
- Headless-Abnahme: `tests/agent/physics-headless.patch.yml` (dieselbe Komposition, als `--patch`-Overlay geschrieben).

## Build und Verifikation (im Wurzelverzeichnis des PhysicsOS-Repos)

```sh
pnpm run build:agent       # tsc -b + tsdown → lib/index.js (inlined @physicsos/*, externalized @deepseek-ai/*)
pnpm run typecheck:agent
pnpm run lint:agent
pnpm run test:agent        # tests/tool-physicsos.spec.ts + tests/preset-composition.spec.ts
node tests/agent/headless-physics-acceptance.mjs   # End-to-End-Gate mit echtem dsh-Prozess + Mock-LLM
```

## Modellerfahrung

### Die `physics_*`-Tool-Familie

#### Was das Modell sieht

Sieben Tool-Registrierungen – `physics_list_experiments`, `physics_create_experiment`, `physics_solve_question`, `physics_describe_scene`, `physics_scene_command`, `physics_simulate`, `physics_observe` –, deren Namen, Beschreibungen und Ergebnistexte wörtlich aus `@physicsos/agent-tools` (`PHYSICS_TOOL_DOCS` / `PHYSICS_TOOL_RENDERERS`) stammen; dieses Paket hängt sie unverändert ein.

#### Token-Wirkung

Jedes Tool fügt der Tool-Liste der Anfrage einen festen Eintrag hinzu, und jeder Aufruf liefert eine chinesische Textprojektion des kanonischen JSON der Runtime – Zahlen tragen Einheiten, jede Erhaltungsprüfung trägt ein Urteil.

#### KV-Cache-Wirkung

Die sieben Tool-Einträge sind feste Zeichenketten, daher bleibt das Prompt-Präfix über Aufrufe hinweg cache-stabil; nur die Argumente je Aufruf und der zurückgegebene Ergebnisblock erweitern den Kontext.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Dieses Paket ist das hostseitige Gegenstück der DEV INTEGRATION BRIDGE: `@physicsos/agent-tools` wird per `link:` als Quellcode eingebunden und beim Bündeln in `lib/index.js` inlined; zur Laufzeit hängt nichts von einer Auflösung von `.ts` durch tsx ab.
- Der Kern aus Harness Agent Loop / Session / Tools wird nicht verändert; es werden nur Tools registriert (docs/04 §6, §154).
- Die einzige Quelle physikalischer Fakten sind `PhysicsScene` und die Engine (docs/02 §3–§7); dieses Paket hält keinen zweiten Szenenzustand.
