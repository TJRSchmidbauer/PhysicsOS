# Harness Web Client × PhysicsOS Overlay

Datum: 2026-08-20

Status: `MECHANICS_RUNTIME_PACK_V1_COMPLETE`. Die drei Physikdomänen (Magnetfeld / Mechanik / homogenes elektrisches Feld) teilen sich **dieselbe** Workbench-Hülle und denselben Canvas; Question → Lab forkt beim ersten Ändern eines physikalischen Fakts einen Experimentzweig; der Agent Drawer liest die echte Runtime und hebt über Tools hervor bzw. sendet SceneCommands. Bild- / PDF-Erkennung und modellgetriebene Agent-Antworten sind weiterhin nicht angebunden (siehe `docs/reports/BACKLOG.md`).

## Produktzusammensetzung

```text
DeepSeek Harness Web Client
        │ Sidebar / Conversation Workspace / Session / Tools
        ↓
@deepseek-ai/dsh-client-ui-physicsos
        │ Home / Physics Lab / Question Space
        ↓
PhysicsOS domain packages
```

Das `apps/web` im Wurzelverzeichnis ist eine veraltete Übergangsimplementierung und kein zweiter Runtime Host.

## Erweiterungsgrenze des Harness

PhysicsOS belegt nur offizielle Slots:

| Slot                            | PhysicsOS-Inhalt                                  |
| ------------------------------- | ------------------------------------------------- |
| `sidebar.brand`                 | PhysicsOS-Marke und Rückkehr zur Startseite       |
| `sidebar.nav`                   | Startseite / Physiklabor / Aufgabenraum           |
| `sidebar.new`                   | Menü „Neu“                                        |
| `sidebar.workspaces`            | Zuletzt verwendete Räume                          |
| `sidebar.footer.action`         | Einstieg in den Lernverlauf                       |
| `conversation.hero.brand`       | Marke der Startseite                              |
| `conversation.hero.actions`     | Beispiele, Einstieg in Experimente/Aufgaben, zuletzt verwendete Räume |
| `conversation.hero.agentPreset` | Lernmodus für Schüler                             |
| `conversation.surface`          | Physics Lab / Question Space                      |

Agent Loop, Session Store, Tools und ConversationRoot des Harness werden nicht verändert.

## Einheitliche Laufzeitkette

```text
Inspector / Timeline / Scene Tree / Question
        ↓  plain callback (die Komponente weiß nicht, in welcher Physikdomäne sie sich befindet)
WorkspaceRuntime
        ↓  SceneCommand + expectedRevision
PhysicsScene + revision
        ↓
Engine (Magnetic / Mechanics / Electric)
        ↓
Verifier
        ↓
Observation
        ↓
SceneVisualModel
        ↓
PhysicsCanvas → RENDERERS[view.domain]
```

**Eine Workbench, nicht eine Seite pro Domäne.** `PhysicsSurface` (`LabWorkspace.tsx`) macht nur
Dispatch: Je nach `domainOfScene(scene)` wählt sie eine `WorkspaceRuntime` und übergibt sie der einzigen
`PhysicsWorkspace`-Hülle. Zuvor hatten `MechanicsLabWorkspace` (734 Zeilen) und
`ElectricLabWorkspace` (615 Zeilen) mit der Magnetfeld-Hülle ~80 % duplizierte Struktur; sie wurden gelöscht.
Eine neue Domäne = ein Runtime-Adapter + ein Eintrag in der Renderer Registry, keine neue Seite mehr.

```text
WorkspaceRuntime (physics/workspace-runtime.ts)
  getSnapshot / editParameter / setChoice / setObservable
  setRunning / setRate / seek / step / advance / setHighlight
        ├── MagneticWorkspaceRuntime  → MagneticRuntimeBridge (abgenommen, Semantik unverändert)
        ├── MechanicsWorkspaceRuntime → MechanicsRuntimeBridge
        └── ElectricWorkspaceRuntime  → SceneRuntime + ElectricEngine
```

`PhysicsCanvas` ist der einzige offizielle Canvas für Magnetfeld und Mechanik. Er konsumiert nur das `SceneVisualModel` und ist für Projektion, Koordinaten, Raster, Skalenstriche, Trajektorien, Vektoren, Beschriftungen und Interaktion zuständig; er importiert keine Engine und berechnet keine Antworten neu.

`lab-view-model.ts` bleibt der reine Datenvertrag für Magnetfeld-Runtime und Inspector; es entspricht keiner zweiten Canvas-Implementierung mehr.

## Physics Lab

Das Labor besteht aus Toolbar, Szenenbaum, einheitlichem Canvas, Inspector, Timeline, Datenpanel und Agent-Einstieg.

Magnetfeld-Szenen unterstützen:

- Ändern von `B / q / m / v` und der Magnetfeldrichtung
- `SceneCommand` mit Revisionsprüfung
- Ausführen, Pause, Einzelschritt, Zurücksetzen, Ziehen der Timeline und 0,25–2-fache Geschwindigkeit
- Geschwindigkeit, Lorentzkraft, Trajektorie, Mittelpunkt, Radius und Hilfslinien
- Von der Engine abgeleitete Größen, Daten, Diagramme, Herleitung und Ereignisse

Mechanik-Szenen unterstützen:

- Gleichförmige Bewegung, gleichmäßige Beschleunigung, waagerechter/schräger Wurf, zweites Newtonsches Gesetz, schiefe Ebene (mit Reibung)
- Sechs Experimentvorlagen sind über das gruppierte Popover „Neu“ erreichbar und erzeugen direkt eine echte Scene
- Editierbar sind `m / h / v₀ / θ / g / μ / F`; jede Übergabe ist ein SceneCommand mit Revisionsprüfung
- Freikörperbild mg / N / f / ΣF / a, Kräftezerlegung mg·sinθ / mg·cosθ ein- und ausschaltbar
- Schlüsselpunkte (Start / höchster Punkt / Landepunkt), Beschriftungen h und R, Neigungswinkelbogen, Ereignismarken auf der Timeline
- Datentabelle, `x(t) / y(t) / vₓ(t) / v_y(t)`, strukturierte Herleitung und Verifikation
- Aus dem Question Space mit derselben Scene-Revision geöffnet und im Lab weiter editierbar

Wichtige Implementierungsbeschränkungen:

- Die semantischen `--physics-*`-Tokens müssen von `mountPhysicsOSChrome()` auf Document-Ebene injiziert werden.
  Das Plugin-Bundle injiziert automatisch nur `*.module.css`; ein `import` einer gewöhnlichen `.css` bleibt stillschweigend wirkungslos, und
  ein nicht definiertes `var()` bei `stroke` fällt auf den geerbten Wert zurück (der Canvas-Wurzelknoten hat `fill="none"`)
  – die Folge: Der gesamte Canvas gelangt in den DOM, zeichnet aber überhaupt nichts. `tests/chrome.client.spec.ts` sichert das ab.
- Die Plot-Box von `PhysicsCanvas` ist fest 960×540, die Szene wird darin zentriert. Eine nach Inhaltsgröße erzeugte
  viewBox würde hochformatige Szenen durch `preserveAspectRatio` vergrößern (gemessen 1,52×), Linienbreiten und Schriftgrößen würden mit dicker.
- Die **Richtung** einzelner Kräfte stammt aus der Observation-Schicht (aus den bereits von der Engine berechneten Beträgen, projiziert im Schiefe-Ebene-Koordinatensystem des Modells),
  nicht aus dem Zeichencode.
- `packages/*` werden über das Protokoll `link:` eingebunden, nicht `file:`: pnpm kopiert `file:`-Abhängigkeiten und aktualisiert sie nicht mit dem
  Quellcode, sodass das Browser-Bundle eine alte Kopie kompiliert, während vitest den Quellcode liest – beide Seiten weichen still voneinander ab.

## Animationsuhr

- Der Browser verwendet `requestAnimationFrame`, jede Übergabe verwendet die echte Zeit zwischen den Frames.
- Die mikroskopische Periode im Magnetfeld wird nicht mehr direkt auf reale Sekunden abgebildet; bei 1-facher Geschwindigkeit wird etwa in 5 Sekunden ein voller Umlauf gezeigt, um Aliasing-Sprünge zu vermeiden, wenn eine Millisekundenuhr Hunderttausende Perioden überspringt.
- Verifizierte Magnetfeld-Simulation und -Verifikation werden zwischengespeichert; pro Frame werden nur das analytische `stateAt`, die Observation und die visuelle Projektion aufgerufen.
- Die Mechanik liest pro Frame direkt `MechanicsEngine.stateAt` und zeigt nicht mehr nur diskrete Simulationsstichproben.

## Question Space

Derzeit enthalten sind 16 reproduzierbare eingebaute Aufgaben. Magnetfeld- und fünf Arten von Mechanikaufgaben laufen durch die echte Question Runtime, Scene, Engine, Verifier, Observation und PhysicsCanvas.

Bild, PDF, OCR/VLM und das Zerlegen ganzer Klausuren sind noch nicht angebunden; die Oberfläche zeigt sie ausdrücklich als nicht freigeschaltet an. Dieser Teil darf nicht als fertig verbucht werden.

## Responsives Verhalten

- Desktop: dreispaltiges Labor; bei zu geringer Breite werden nacheinander Inspector und Szenenbaum ausgeblendet, damit der Canvas Vorrang behält.
- Question Space: Bei mittlerer Breite wird ein Hauptlösungsbereich in voller Höhe verwendet, Eingabe und Ergebnis werden rechts gestapelt; auf dem Handy einspaltig.
- Handy: Die Harness-Sidebar ist eine Drawer-Navigation und klappt nach Auswahl einer PhysicsOS-Seite automatisch ein.
- Der mobile Mechanik-Canvas bleibt 16:9, damit ein vertikaler Container das Physikbild nicht zu einem kleinen Punkt schrumpfen lässt.

## Experimentzweig und Agent

Die Bedingungen der Aufgabenstellung sind festgestellte Fakten, daher forkt Question → Lab bei der **ersten Änderung eines physikalischen Fakts**:

```text
scene-question-001 rev.4        (ursprüngliche Aufgabe, wird nie durch Experimente verändert)
        └── fork on first fact edit
            experiment-… rev.0 → rev.1
            metadata.lineage = { origin, branchType, originQuestionId,
                                 originSceneId, parentSceneId, parentRevision, forkedAt }
```

Abspielen / seek / Umschalten von Observation / Agent-Hervorhebung lösen **keinen** Fork aus –
sie ändern, „was man ansieht“, nicht, „was wahr ist“. Das Kriterium ist an genau einer Stelle definiert:
`FACT_COMMANDS` in `physics/experimental-branch.ts`.

Der Agent (`physics/physics-agent.ts`) liest scene / revision / simulation /
verification / observations / aktuelle Zeit / bereits gezeichnete visuelle IDs; die Antworten verweisen auf diese Fakten und zeigen
Source Chips an; er **berechnet keine physikalischen Größen neu** und sagt ausdrücklich, dass er nicht antworten kann, wenn nichts passt. Zwei Arten von Tools sind streng getrennt:

| Tool                         | Charakter          | revision  | PhysicsEvent |
| ---------------------------- | ------------------ | --------- | ------------ |
| `physics.ui.highlight`       | Reine Ansichtsinteraktion | unverändert | wird nicht erzeugt |
| `physics.scene.setParameter` | Echtes SceneCommand | +1       | wird erzeugt |

---

## Architekturbeschränkungen (nicht umgehbar)

### Das PhysicsOS Token System ist der einzige Eingang

Das Harness Client Plugin **garantiert nicht**, dass gewöhnliches globales CSS automatisch injiziert wird: Der Bundler verarbeitet nur
`*.module.css`. Der `import` einer gewöhnlichen `.css` kann stillschweigend verworfen werden, und ein nicht definiertes
`var(--physics-*)` bei `stroke` / `fill` wird in der Phase des berechneten Werts ungültig und fällt auf den geerbten Wert zurück
(der Canvas-Wurzelknoten ist `<svg fill="none">`) – das Ergebnis: Der gesamte Canvas gelangt in den DOM, zeichnet aber überhaupt nichts,
und es gibt keinerlei Fehlermeldung.

Daher gilt:

- Alle semantischen PhysicsOS-Tokens müssen über den offiziellen Installationspfad des Client Chrome
  (`mountPhysicsOSChrome()`) auf Document-Ebene injiziert werden.
- **Verboten** ist es, Dateien wie `physics-electric-tokens.css` / `physics-circuit-tokens.css`
  anzulegen und sich darauf zu verlassen, dass der `import` zufällig wirkt. Die Farbsemantik einer neuen Physikdomäne wird stets in das bestehende
  Physics Token System aufgenommen.
- `tests/chrome.client.spec.ts` und `tests/regression-gates.client.spec.ts`
  prüfen das Vorhandensein der Tokens einzeln, sodass solche Fehler nicht mehr still auftreten können.

### `link:`-Abhängigkeiten sind eine Brücke für die Entwicklungszeit (DEV INTEGRATION BRIDGE)

`packages/client/ui-physicsos` verweist per `link:` auf `packages/*`:

| Protokoll | Verhalten                                                          | Folge                                                                                                                                         |
| --------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `file:`   | pnpm **kopiert** das Package in den `.pnpm` Store und aktualisiert es danach nicht mit dem Quellcode | Das Browser-Bundle kompiliert die alte Kopie, während vitest über tsconfig paths den Quellcode liest – beide Seiten weichen still voneinander ab (gemessen: Szenentitel im Quellcode geändert, der Test sieht es, der Browser nicht) |
| `link:`   | In node_modules liegt ein Symlink auf das Quellverzeichnis         | Änderungen wirken sofort, Bundle und Tests nutzen denselben Quellcode                                                                          |

Kennzeichnung: **DEV INTEGRATION BRIDGE**. Das ist nicht die endgültige Architektur, sondern nur das minimale Mittel, um unter dem Layout
„PhysicsOS-Repository + gevendortes Harness-Submodul“ den Entwicklungskreislauf vertrauenswürdig zu machen.

Installierbarkeit:

- Windows / lokale Entwicklung: verifiziert (nach `pnpm install --filter` werden die Symlinks korrekt angelegt).
- Clean Clone / CI / künftiges Linux: Die `link:`-Abhängigkeiten werden über relative Pfade auf `packages/*` im Repository aufgelöst
  und erfordern wie `file:` nur einen vollständigen Checkout des Repositorys (einschließlich Submodul),
  ohne Abhängigkeit von einer Registry-Veröffentlichung; die Installierbarkeit ist also nicht schlechter als bei `file:`. Dennoch ist beim ersten CI-Job
  eine Installation per Clean Clone einmal praktisch zu prüfen.

Das endgültige Ziel bleibt: Das PhysicsOS-Overlay wird zu einem **PhysicsOS-eigenen Harness Client Plugin**,
das von PhysicsOS-Seite veröffentlicht wird und auf Harness-Seite nur noch die Slot-Registrierung erfordert; dann wird diese Brücke entfernt.

---

## Start und Verifikation

```sh
cd vendor/deepseek-harness
pnpm --filter @deepseek-ai/dsh-client-ui-physicsos bundle
pnpm --filter @deepseek-ai/dsh-client-ui-conversation bundle
pnpm dsh web
```

Standardadresse: `http://127.0.0.1:3080/`

Abnahme:

```sh
node tests/acceptance/mechanics-acceptance.mjs   # Fünf Produktfälle + Browser-Gates + Screenshots
node tests/acceptance/harness-lab-shot.mjs       # Screenshots in drei Auflösungen + Gates
```

Gates: Kein Schachbrettmuster (alle `pattern path` mit `fill=none`), kein vertikales Scrollen der gesamten Seite,
Canvas ≥ 55 % des internen Arbeitsbereichs, Canvas zeichnet tatsächlich (>20 Knoten mit stroke, um Token-Ausfälle zu erkennen),
console error / `pageerror` / `unhandledrejection` / fehlgeschlagene Anfragen / 4xx-5xx-Antworten sind alle 0.

Abnahmeanforderungen:

- Scene-Revision und Besitz bei Question → Lab sind konsistent
- Engine / Verifier / Observation werden in der UI nicht umgangen
- SVG-Raster `pattern path` mit ausdrücklichem `fill="none"`
- Animation ohne 50-ms-Timer, ohne erneutes simulate/verify pro Frame
- Desktop, schmaler Desktop und Handy ohne horizontalen Überlauf oder gegenseitige Verdeckung
- console, page error, unhandled rejection sind 0
