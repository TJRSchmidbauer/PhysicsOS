# Agent Tool Runtime V1 — Bericht zur Harness-Anbindung

> Datum: 2026-09-02 (hostseitige Anbindung); 2026-09-07 Abschluss (Szenen-Push + Stufenzuordnung, §6)
> Status: `AGENT_TOOL_RUNTIME_V1_COMPLETE` (abgeschlossen)
> Umfang: Hostseitige Anbindung der Tool Runtime aus docs/14 §19 Phase 16 + Runtime-Kern + „vom Modell geänderte Szene auf den Canvas pushen“.
> §1–§5 halten die Hälfte der hostseitigen Anbindung fest; §6 ist die zweite Hälfte des Abschlusses dieses Berichts.

---

## 1. Ziel

Das Modell in einer Sitzung des DeepSeek Harness soll **tatsächlich die PhysicsOS-Engine aufrufen**, statt Zahlen aus dem Gedächtnis zu nennen:

```text
Modell → tool call → @deepseek-ai/dsh-tool-physicsos → @physicsos/agent-tools PhysicsToolRuntime
     → Question Runtime / Scene Factory / SceneCommand / Engine / Verifier → tool result → Modell
```

Die Randbedingungen folgen docs/02 §50 und docs/04 §5–§6: Der Harness-Kern wird nicht verändert, Tools werden nur über die öffentliche Plugin-API registriert; die gesamte Physiklogik
bleibt in `packages/*` des Root-Repositorys.

## 2. Liefergegenstände

| Pfad                                                                    | Inhalt                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overlays/harness/files/packages/physicsos/tool-physicsos/`             | Harness-Workspace-Mitglied `@deepseek-ai/dsh-tool-physicsos`: `src/index.ts` (7 `defineTool`-Registrierungen + sitzungsisolierte `PhysicsToolRuntime`), `src/invariant.ts` (Platzhalter für begleitende Invarianten), `tsdown.config.ts` (Node-Bibliotheks-Bundle, inline `@physicsos/*`), zwei vitest-Specs, README |
| `overlays/harness/files/apps/cli/config/agent-presets/physics-student/` | Agent-Preset „Physik-Lernmodus“: Persona „Physikverfassung“, Zeile `tool-physicsos`, Zeile `tool-ask-user`; ohne Shell / fs / Web / Sub-Agent                                                                                                               |
| `overlays/harness/upstream-changes.patch`                               | Zwei neue Hunks: Abhängigkeit `@deepseek-ai/dsh-tool-physicsos` in `apps/cli/package.json`, Projektreferenz in `tsconfig.host.json`; das vendor-`pnpm-lock.yaml` wird mitaktualisiert                                                                       |
| `scripts/overlay/harness-overlay.mjs`                                   | `OVERLAY_PATHS` um die beiden obigen Pfade ergänzt                                                                                                                                                                                                         |
| `package.json` (Root)                                                   | `build:agent` / `typecheck:agent` / `lint:agent` / `test:agent`; `build:web`, `typecheck`, `lint`, `test` haben sie bereits eingebunden                                                                                                                    |
| `tests/agent/`                                                          | `physics-headless.patch.yml` (dieselbe Komposition für das Headless-Profil), `headless-physics-acceptance.mjs` (13 Gates), `run-mock-llm.mjs`, `dump-session-log.mjs`                                                                                       |

## 3. Entwurfsentscheidungen

1. **Die einzige Quelle des Tool-Contracts ist die Runtime.** Namen und Beschreibungen stammen aus `PHYSICS_TOOL_NAMES / PHYSICS_TOOL_DOCS` von `@physicsos/agent-tools`,
   das Enum von `physics_scene_command.type` aus `COMMAND_TYPES`;
   das Plugin kopiert keine Beschreibung. Der Contract, den jede Harness-Anbindung dem Modell präsentiert, ist derselbe.
2. **Der kanonische Wert ist das Runtime-JSON, das Modell liest die Textprojektion der Runtime.** `output.schema` ist ein offenes Objekt / Array,
   `render` ruft `PHYSICS_TOOL_RENDERERS[name](value)` auf (`@physicsos/agent-tools/render.ts`: jede Zahl mit Einheit,
   jede Prüfung mit Urteil, vier signifikante Stellen), sodass die Formulierung, die jede Harness-Anbindung dem Modell liefert, einheitlich ist; ein von der Szenen-Runtime abgelehnter Befehl
   ist eine legitime physikalische Antwort („B muss > 0 sein“) und wird als Wert `ok: false` zurückgegeben, nicht als Tool-Fehler; kodierte Ablehnungen der Runtime
   (`SCENE_NOT_FOUND`, `UNKNOWN_EXPERIMENT`…) werden in die `HarnessError`-Unterklasse `PhysicsToolCallError` verpackt,
   `code` landet in `tool/result.error.info.code`.
3. **Szenen sind pro Sitzung isoliert.** Das Plugin hält je `exec.agent.id` eine `PhysicsToolRuntime` (`sceneScope: session`),
   Schüler sehen einander nicht; der Modus `process` ist für Einzelsitzungs-Deployments und Tests.
4. **Preset statt Host-Zeile.** Die Agent-Ebene der Web-Oberfläche liegt hinter dem Preset (`web-app/cordis.patch.yml`), daher werden die Physik-Tools
   als Preset `physics-student` geliefert: einmal eingehängt, treten alle Sitzungen bei, die es wählen; `preset.yml` liefert den für Schüler sichtbaren Namen
   „Physik-Lernmodus“, `order: 0` stellt es an die erste Stelle.
5. **Die hostseitige Lösung der DEV INTEGRATION BRIDGE.** `@physicsos/agent-tools` zeigt per `link:` auf `.ts`-Quellcode,
   den die Node-Runtime nicht direkt importieren kann; daher bindet tsdown mit `deps.alwaysBundle` den gesamten Graphen `@physicsos/*` inline in
   `lib/index.js` ein (916 kB), `@deepseek-ai/*` bleibt extern. Die tsconfig des Plugins schaltet `exactOptionalPropertyTypes` ab,
   um den eingebundenen Runtime-Quellcode im Dialekt des Root-Repositorys zu kompilieren (dessen Quellcode erfüllt derzeit an einer Stelle strikte optionale Eigenschaften nicht).

## 4. Abnahme

### 4.1 Unit / Komposition (`pnpm run test:agent`, 2 Dateien 17 Testfälle)

`tool-physicsos.spec.ts` (14): Sieben Tools registriert und Beschreibungen aus der Runtime; Katalogauflistung; Magnetfeldexperiment öffnen → `physics_simulate`
→ Engine `cyclotron_radius = mv/(qB)`; `SetMagneticFieldStrength` bringt die Revision von 0 auf 1 und halbiert den Radius;
Frequenzänderung auf der Stehwellenbank wird als `ok:false / WAVE_WRONG_SUBMODEL` abgelehnt; ungültiger Befehlstyp wird an der Schema-Grenze abgelehnt;
`physics_observe` liest die Position des waagerechten Wurfs bei t = 1 s; `physics_solve_question` löst die Aufgabe und registriert die Szene;
`SCENE_NOT_FOUND` / `UNKNOWN_EXPERIMENT` werden als `error.info.code` ausgegeben; fehlende Parameter sind ein Fehler; Isolation pro Sitzung und
`process`-Teilung; anonymer Scope; dispose meldet ab; Form des Namespace-Exports.

`preset-composition.spec.ts` (3): Die Preset-Datei besteht aus drei benannten Kompositionszeilen, die Persona enthält die sechs Punkte der Physikverfassung, keine Coding-Tools;
Metainformationen in `preset.yml`; nach dem Einhängen unter einem Agent-Scope überlagert die Persona den Deployment-Standard, die sieben Tools sind nur für diesen Scope sichtbar.

### 4.2 Ende-zu-Ende (`node tests/agent/headless-physics-acceptance.mjs`, 13 Punkte alle PASS)

Ein echter Prozess `dsh --profile headless --patch tests/agent/physics-headless.patch.yml` + Harness-Mock-LLM
(Skript: zuerst `tool_call_success(physics_solve_question)`, dann eine Textantwort). Das Sitzungslog belegt:
Die Anfrage kündigt nur die sieben `physics_*`-Tools an, keine Coding-Tools; die Persona enthält die Physikverfassung; genau ein `tool/call`;
`tool/result` ist die Textprojektion der Runtime „Gelöst (magnetic / charged_particle_uniform_magnetic_field)“,
„Prüfung: passed (63/63 Punkte bestanden)“, „Bahnradius R = 7.83 cm“, „Umlaufdauer T = 1.64×10⁻⁷ s“,
„Szene bereit: sceneId = question-agent-question-*“; `turn/end` ist `completed`.

### 4.3 Laufender Web-Host

Ohne Neustart von `pnpm dev` (3080) listet das Menü Einstellungen → Allgemeine Einstellungen → Agent-Preset bereits
„Physik-Lernmodus / Standardmodus / PTC-Modus / Minimalmodus / Kreativmodus“, das neue Preset ist nicht als broken markiert –
Erkennung und Metainformationen greifen im offiziellen Web-Host.

### 4.4 Statische Gates

`pnpm run typecheck:agent` ✓, `pnpm run lint:agent` (oxlint) ohne Fehler, `pnpm run build:agent` ✓;
`@physicsos/agent-tools` selbst `typecheck` ✓, 19 Tests ✓ (gehört einer anderen Sitzung).

## 5. Bekannte Einschränkungen / noch anzubinden

- **Die Schüler-Modus-Stufe wird weiterhin auf `standard` abgebildet.** Das `runtimePreset` in `ui-physicsos/profiles.ts` muss auf
  `physics-student` geändert werden (und die Lehrerstufe beibehalten), sonst setzt PhysicsOS beim Anlegen einer Sitzung auf der Startseite das Preset wieder auf den Coding-Agent zurück;
  diese Datei gehört der UI-Sitzung und wurde in diesem Slice nicht geändert.
- **Der Drawer des KI-Assistenten im Labor ist weiterhin deterministisches Intent-Matching** und damit eine andere Kette als die Tool-Aufrufe in der Harness-Sitzung; den Drawer auf
  `PhysicsAgentRuntime` umzustellen ist Backlog `AGENT_MODEL_BACKED_ANSWERS_BACKLOG`.
- **Vom Modell geänderte Szenen sind nicht mit dem Canvas synchron.** Die Szene der Tool-Runtime liegt im Speicher des Host-Prozesses, der Browser-Canvas ändert sich nicht mit;
  das Pushen der `sceneId` in das Lab (docs/04 §92 Streaming / §93 `SceneRevisionChanged`) ist eine spätere Phase.
- **Die Integration mit einem echten Modell ist durch das Relay blockiert.** Das auf dieser Maschine in `~/.dsh` konfigurierte Relay hat derzeit keinen Kanal für `DeepSeek-V4-Flash-0731`
  (`No available channel`), daher wurde Ende-zu-Ende mit dem Mock-LLM durchgeführt; Komposition und Tool-Kette sind unabhängig vom echten Modell.
- **Strikte optionale Eigenschaften in der Runtime der Gegenseite.** `domain: ir?.domain, model: ir?.model` in der Nähe von Zeile 465 von `packages/agent-tools/src/physics-tool-runtime.ts`
  besteht unter `exactOptionalPropertyTypes: true` nicht; auf Plugin-Seite wurde
  per tsconfig gelockert, nach der Behebung auf Runtime-Seite kann es wieder verschärft werden.
- `pnpm dsh` scheitert im Submodul, weil das `verify-deps-before-run` von pnpm ein `install` mit lefthook auslöst
  (in HARNESS-UPSTREAM dokumentiert); nach `pnpm -C vendor/deepseek-harness install --offline --ignore-scripts`
  ist es wieder behoben. Das Abnahmeskript startet direkt `node --import tsx/esm apps/cli/src/bin.ts` und umgeht diese Prüfung.

---

## 6. Abschluss: Szenenspiegel + Stufenzuordnung (2026-09-07)

Die ausstehenden Anbindungen aus §5 werden in diesem Abschluss umgesetzt (der Punkt „Drawer des KI-Assistenten im Labor“ ist ein eigenständiger Backlog und bleibt unverändert), `AGENT_TOOL_RUNTIME_V1`
wird geschlossen. Der neue Code folgt demselben Vertrag aus doc/04 §92: Die Engine-Szene ist die physikalische Wahrheit, das Ereignis `physics/scene` ist die
Benachrichtigung `SceneRevisionChanged`, die Projektion ist deren Last-wins-Faltung.

### 6.1 Runtime-Kern

- `PhysicsToolRuntime.sceneSnapshot(sceneId)`: verlustfreie tiefe Kopie der aktuellen Revision, mit der der Host die Szene aus dem Prozess herausschiebt und ins Lab spiegelt;
  die Kopie kann das Befehls-Gate der SceneRuntime nicht umgehen.
- Behebung der in §5 vermerkten Gefahr bei strikten optionalen Eigenschaften: Der solved-Zweig weist `domain: ir?.domain` / `model: ir?.model` nicht mehr direkt zu
  (eine direkte Zuweisung von `undefined` ist unter `exactOptionalPropertyTypes` unzulässig), sondern verwendet dieselbe bedingte Expansion wie der rejected-Zweig.
  Die Lockerung der Plugin-tsconfig kann damit künftig verschärft werden; in dieser Runde wurde der gesamte Graph nicht vollständig verschärft (um den übrigen inline eingebundenen Quellcode nicht mitzuziehen), das bleibt
  der nächsten Runde vorbehalten.

### 6.2 Kette des Szenenspiegels

- **Typen an einer einzigen Stelle**: `tool-physicsos/src/types.ts` – die einzige Deklarationsstelle des SessionEvents `physics/scene` und des `physicsScenes`-
  Projection-Keys, per Module Augmentation an `dsh-session` / `dsh-session-projection` angehängt; die zwei Namespaces `./types` (Host) und `./client` (der Browser holt nur Typen,
  berührt den Wertegraphen des Plugins nicht) im Package-Root haben null inhaltliche Duplikate.
- **Veröffentlichung**: `tool-physicsos/src/index.ts` – die drei execute-Stellen `physics_create_experiment` / `physics_solve_question` /
  akzeptiertes `physics_scene_command` rufen `publish(...)` auf:
  `exec.agent.session.append('physics/scene', snapshot)`. Der Snapshot bettet das von `runtime.sceneSnapshot` erzeugte vollständige
  `physics-scene/1.0`-JSON ein, versehen mit revision / cause / commandType / eventType / sourceQuestionId. Von der Runtime abgelehnte Befehle
  werden nicht veröffentlicht (Szene unverändert); Aufrufer ohne Agent veröffentlichen nicht. Die Deklaration bleibt in `./types` des Plugins, ohne Wertabhängigkeit vom Host.
- **Faltung**: Session-Projection `physicsScenes` – `foldPhysicsScene` mit Last-wins nach Szenen-ID,
  `latest` folgt dem Neuesten; nur registriert, wenn die `sessionProjections`-Naht komponiert ist (Headless-Zusammenstellungen ohne Naht bleiben unberührt).
- **Spiegel**: `ui-physicsos physics/agent-scene-sync.ts` – reiner Framework-Synchronisierer. `readAgentScenesProjection`
  führt eine defensive Form-Prüfung der vom Wire kommenden Werte durch (der Header muss zur eingebetteten Szene mit gleicher id / revision / `physics-scene/1.0` passen,
  sonst wird alles abgewiesen); `createAgentSceneSync` merkt sich pro Sitzung `sceneId@revision`: Der erste Wert der Sitzung ist die Baseline → stilles
  Adopt (Reload / Sitzungswechsel zieht den Schüler nicht von der aktuellen Oberfläche weg), spätere Revisionen → live das Lab öffnen; vor dem Einhängen läuft noch der Szenen-Validator,
  ein defekter Snapshot wird nur einmal protokolliert, die Projection bleibt unverändert ohne Wiederholung. Fünf Specs decken ab: Baseline-Adopt / Revision shown / erneutes Projizieren no-op / Sitzungswechsel /
  defekte Szene nicht eingehängt.
- **Anbindung**: `ui-physicsos/src/client/index.ts` – `surface.open` bietet zwei Oberflächenaktionen: adopt (aktuelle Oberfläche behalten) und show
  (ins Lab wechseln); es abonniert die Zeilen der Sitzungsliste und liest `projectionValues['physicsScenes']`, um den Sync zu speisen.
- **Invariante**: `tool-physicsos/src/invariant.ts` wird vom Platzhalter zu einem echten Begleiter aufgewertet – jeder `physics/scene`-Snapshot, der das Durable Log erreicht, wird vor dem Schreiben auf Übereinstimmung von Header und eingebetteter Szene geprüft,
  zusammen mit dem Projection-Schema ein doppeltes Gate.

### 6.3 Stufenzuordnung

`ui-physicsos/profiles.ts`: Die drei Schülerstufen (Erkunden / Aufgaben lösen / Anleitung) `runtimePreset` → `physics-student`,
die Lehrerstufe behält `standard`. Eine neue Sitzung geht direkt in den „Physik-Lernmodus“ (Persona Physikverfassung + sieben Tools + Fragen-Tool, keine Coding-
Tools) und fällt nicht mehr wegen der Standardstufe auf den Coding-Agent zurück. Drei Assertions in `overlay.client.spec` wurden an die Zuordnung angepasst.

### 6.4 Abnahme

- `typecheck` (core + web + agent) und `lint` (core + web + agent) ohne Fehler.
- `test:agent` 22 Testfälle (+5 scene mirroring: Veröffentlichungsfaltung / abgelehnt wird nicht veröffentlicht / solve veröffentlicht + sourceQuestionId /
  agent-less veröffentlicht nicht / fold last-wins ändert den Zustand nicht); `test:web` 28 Dateien 360 Testfälle (+`agent-scene-sync.client
.spec` 5 Fälle, Stufen-Assertions in `overlay.client.spec` aktualisiert); agent-tools 32 Testfälle.
- Ende-zu-Ende `headless-physics-acceptance.mjs` **alle 16 Gates PASS**: Mit einem echten `dsh`-Prozess + Mock-LLM erscheint nach `physics_solve_question` im Sitzungslog
  genau ein `physics/scene` (cause `solved`), die eingebettete Szene hat dieselbe id / revision wie die im Tool-Ergebnis registrierte Szene, das Schema ist `physics-scene/1.0`, in dieser Runde gab es keine Veröffentlichungen vom Typ create / command.

### 6.5 Weiterhin nicht Teil dieser Runde

- GUI-Ende-zu-Ende-Skript für „vom Modell geänderte Szene folgt in Echtzeit im Browser-Canvas“: Die Integration mit einem echten Modell ist weiterhin dadurch eingeschränkt, dass das Relay keinen Kanal für
  `DeepSeek-V4-Flash-0731` hat (§5), auf dieser Maschine lässt sich keine echte GUI-Agent-Runde ausführen. Das Veröffentlichen wird durch Assertions auf dem
  Sitzungslog des echten dsh-Prozesses abgedeckt, der Client-Spiegel durch reine Funktions-Specs + Kompositions-Specs; die `physicsScenes`-Projection wird bereits mit der Sitzungs-
  Zeile ins Web projiziert – das GUI-Skript kann nach Wiederherstellung des echten Modellkanals als nächstes Abnahme-Gate dienen und ist nicht blockierend.
- Streaming der Timeline Takt für Takt (Snapshots werden in der Granularität von Tool-Aufrufen veröffentlicht, nicht pro Frame); spezielle Presets für die Lehrerseite;
  Backlogs wie `AGENT_MODEL_BACKED_ANSWERS_BACKLOG` bleiben unverändert.
