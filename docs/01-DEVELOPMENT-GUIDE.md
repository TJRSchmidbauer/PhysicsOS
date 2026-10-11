# PhysicsOS Entwicklungsleitfaden

> Datei: `docs/01-DEVELOPMENT-GUIDE.md`  
> Dokumentzweck: Gesamtleitfaden zur Engineering-Umsetzung von PhysicsOS  
> Produktübersicht: `00-PRODUCT-OVERVIEW.md`  
> Engineering-Standards: `02-ENGINEERING-STANDARDS.md`  
> Domänen-Contracts: `03-DOMAIN-CONTRACTS.md`

---

# 1. Zweck des Dokuments

Dieses Dokument beantwortet eine Frage:

> **Wie soll PhysicsOS tatsächlich entwickelt werden?**

Es legt fest:

- den Technologie-Stack;
- die Organisation des Monorepos;
- die Web-First-Entwicklungsstrategie;
- die Frontend-Anwendungsarchitektur;
- die Physics World Runtime;
- die PhysicsScene Runtime;
- die Physics Engine;
- Observation / Renderer;
- den Question Space;
- Physics IR / Diagram IR;
- die Agent Runtime;
- den DeepSeek Harness Adapter;
- Tools / Skills / Context / Memory;
- die Grenzen der Backend-Services;
- die Datenspeicherung;
- das Testsystem;
- die Wiederverwendungsstrategie Web → Windows EXE;
- lokale Entwicklung, Build und Deployment.

Dieses Dokument definiert nicht im Detail die Contracts auf Feldebene. Maßgeblich für Definitionen auf Feldebene ist `03-DOMAIN-CONTRACTS.md`.

---

# 2. Gesamtziele der Entwicklung

PhysicsOS ist eine **Web-First-Plattform aus digitaler Physikwelt für Mittel- und Oberstufe + KI-Agent**.

Das derzeitige erste Hauptprodukt:

```text
PhysicsOS Web
```

In Zukunft wird erweitert, ohne Geschäftscode zu kopieren:

```text
PhysicsOS Windows Desktop
```

Gesamtziel:

```text
                    PhysicsOS
                        │
          ┌─────────────┴─────────────┐
          │                           │
     Physics Lab                Question Space
      Physiklabor                 Aufgabenraum
          │                           │
          └─────────────┬─────────────┘
                        ↓
                  Physics World
                        │
        ┌───────────────┼────────────────┐
        ↓               ↓                ↓
 PhysicsScene      Physics Engine    Observation
        │               │                │
        └───────────────┼────────────────┘
                        ↓
                  Physics Agent
                        │
               DeepSeek Harness
```

---

# 3. Oberste technische Prinzipien

Bei der Entwicklung sind stets folgende Prinzipien einzuhalten.

## 3.1 Web First

Vorrangig vollständig umsetzen:

```text
Web
```

Danach über Tauri verpacken zu:

```text
Windows EXE
```

Es werden nicht zwei Frontends gepflegt.

---

## 3.2 PhysicsScene ist die Faktenquelle der Physik

Welchen Zustand die physikalische Welt gerade hat, darf nur bestimmt werden von:

```text
PhysicsScene Runtime
```

Es darf nicht ersetzt werden durch:

- React State;
- den Chat-Kontext des Agents;
- Textausgaben des LLM;
- den internen Zustand des Renderers.

---

## 3.3 Das LLM bestimmt keine physikalischen Ergebnisse

```text
LLM
├── Verstehen
├── Planen
├── Tools aufrufen
├── Erklären
└── Unterrichten
```

Die tatsächlichen:

```text
Trajektorien
Kräfte
Geschwindigkeiten
Beschleunigungen
Felder
Energien
Schaltungszustände
```

werden von der Physics Engine berechnet.

---

## 3.4 Physics Engine und UI sind entkoppelt

Die Physics Engine darf nicht abhängen von:

```text
React
DOM
Canvas
Three.js
DeepSeek Harness
Datenbank
```

---

## 3.5 Der Renderer löst nichts

Der Renderer zeichnet nur den bereits ermittelten physikalischen Zustand.

---

## 3.6 Agent Runtime und Harness sind isoliert

Der Harness ist der Agent-Host; PhysicsOS baut keine eigenständige Agent-Runtime. Modell und Harness liefern Verstehen und Bedienen:

```text
DeepSeek Harness
```

Geschäftscode bindet sich über eine Integrationsschicht an, nicht über eine eigene Agent-Runtime:

```text
PhysicsOS
    ↓
DeepSeek Harness
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: `PhysicsAgentRuntime` / `DSH Adapter` (entsprechend den gelöschten `@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter`), die früher in der Kette standen, sind stillgelegt, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Unsere eigene Runtime ist die Runtime der physikalischen Welt (Scene → Engine → Verifier), keine Agent-Schleife. Die reale Produktionskette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

---

# 4. Gesamtstruktur des Engineerings

Empfohlenes Monorepo:

```text
physics-os/
│
├── apps/
├── packages/
├── services/
├── skills/
├── content/
├── docs/
├── tests/
├── infra/
└── scripts/
```

Paketverwaltung:

```text
pnpm workspace
```

Empfohlene Task-Orchestrierung:

```text
Turborepo
```

---

# 5. Empfohlene vollständige Verzeichnisstruktur

```text
physics-os/
│
├── apps/
│   ├── web/
│   ├── teacher-web/
│   ├── admin-web/
│   └── desktop/
│
├── packages/
│   ├── ui/
│   ├── shared/
│   ├── config/
│   ├── platform-bridge/
│
│   ├── physics-core/
│   ├── physics-scene/
│   ├── physics-events/
│   ├── physics-units/
│   ├── physics-math-client/
│
│   ├── engine-mechanics/
│   ├── engine-kinematics/
│   ├── engine-gravity/
│   ├── engine-electric/
│   ├── engine-magnetic/
│   ├── engine-em/
│   ├── engine-circuit/
│   ├── engine-induction/
│   ├── engine-optics/
│   ├── engine-wave/
│   └── engine-thermal/
│
│   ├── physics-observation/
│   ├── physics-renderer/
│   ├── physics-verifier/
│
│   ├── physics-ir/
│   ├── diagram-ir/
│   ├── question-parser/
│   ├── question-engine/
│
│   ├── agent-tools/
│   ├── agent-prompt/
│   ├── agent-context/
│   ├── agent-compaction/
│   ├── agent-memory/
│   ├── agent-workflow/
│   └── agent-skills/
│
│   ├── curriculum/
│   └── learning-model/
│
├── services/
│   ├── api/
│   ├── agent/
│   ├── simulation/
│   ├── math/
│   └── document/
│
├── skills/
│   ├── junior-high/
│   └── senior-high/
│
├── content/
│   ├── experiments/
│   ├── questions/
│   └── curriculum/
│
├── tests/
│   ├── physics/
│   ├── golden/
│   ├── agent/
│   ├── question/
│   ├── simulation/
│   ├── integration/
│   └── visual/
│
├── docs/
│   ├── 00-PRODUCT-OVERVIEW.md
│   ├── 01-DEVELOPMENT-GUIDE.md
│   ├── 02-ENGINEERING-STANDARDS.md
│   └── 03-DOMAIN-CONTRACTS.md
│
├── infra/
└── scripts/
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: Die ursprünglich in der Struktur vorgesehenen Package-Plätze `agent-runtime/` und `agent-dsh-adapter/` (`@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter`) aus dem Entwurf wurden stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Der Harness ist der Agent-Host, PhysicsOS baut keine eigenständige Agent-Runtime; real produktiv ist `agent-tools/` (`@physicsos/agent-tools` → Physik-Engine / Verifier).

---

# 6. Client-Architektur

## 6.1 Offizielles Web: vendor/deepseek-harness/apps/web

Der derzeit einzige offizielle Web Runtime Host:

```text
vendor/deepseek-harness/apps/web
        +
vendor/deepseek-harness/packages/client/ui-physicsos
```

Der alte eigenständige Prototyp `apps/web` wurde gelöscht (in der Git-Historie nachvollziehbar); der offizielle Browser-Einstieg ist `dsh-client-ui-physicsos` des vendor Harness.

Hauptseiten:

```text
Startseite
Physiklabor
Experimentvorlagen-Bibliothek
Physics Workspace
Aufgabenraum
Aufgabenanalyse
Fehlerheft
Lernverlauf
Ressourcenbibliothek
Persönlicher Bereich
```

Verantwortlichkeiten:

```text
Harness Web Shell: Routing, Sitzungen, Layout und Zusammenstellung der Client-Plugins
ui-physicsos: PhysicsOS-Seiten, Nutzerinteraktion und Zusammenstellung des Arbeitsbereichs
Gemeinsame Runtime: PhysicsScene, Engine, Verifier, Observation
PhysicsCanvas: Einheitliches Rendern der visuellen Modelle für Magnetfeld und Mechanik
```

Verboten:

```text
Die Kernberechnungen der Physik in React-Komponenten implementieren
```

---

## 6.2 apps/teacher-web

Arbeitsplatz für Lehrkräfte.

Hauptfähigkeiten:

```text
Teacher Studio
Scene Builder
Experimente erstellen
Aufgaben erstellen
Unterrichtsdemonstration
Hausaufgaben
Klassen
Lernstandsanalyse
Inhalte veröffentlichen
```

---

## 6.3 apps/admin-web

Betriebs-Backend der Plattform.

Umfasst:

```text
Nutzer
Rollen und Berechtigungen
Curriculum-System
Aufgabenbank
Klausuren
Physics Skills
Experimentvorlagen
Modellkonfiguration
Agent-Konfiguration
Inhaltsprüfung
Betriebsdaten
Systemkonfiguration
```

---

## 6.4 apps/desktop

Der künftige Windows-Client.

Der Desktop entwickelt die Geschäfts-UI nicht neu.

Er bietet nur:

```text
Tauri Runtime
Native File Dialog
Local File System
Windows Notification
File Drag & Drop
Auto Update
Local Physics Runtime
Local Agent Sidecar
Offline Capability
```

---

# 7. Web-Technologie-Stack

Kernempfehlung:

```text
React
TypeScript
Vite
React Router
TanStack Query
Zustand
Tailwind CSS
Radix UI / shadcn
```

Visualisierung:

```text
SVG
Canvas
PixiJS
Three.js
ECharts
KaTeX
```

---

# 8. Warum React + Vite

Das Web von PhysicsOS ist im Wesentlichen:

> **Browser-based Desktop Application**

Sein Kern sind keine SSR-Inhaltsseiten, sondern:

```text
Physics Canvas
Echtzeit-Simulation
Drag & Drop
Scene Tree
Inspector
Timeline
Agent
Mehrpanel-Arbeitsbereich
Klausuranalyse
Datendiagramme
```

Daher kommt für die Hauptanwendung vorrangig zum Einsatz:

```text
React + TypeScript + Vite
```

Falls später eine Werbewebsite benötigt wird, kann separat eine Next.js-Anwendung angelegt werden, die nicht eng an den Physics Workspace gebunden ist.

---

# 9. Frontend-Zustandsarchitektur

Der Frontend-Zustand muss streng aufgeteilt werden.

## 9.1 UI State

Verwendet:

```text
Zustand
```

Zum Beispiel:

```text
sidebarOpen
activePanel
selectedObjectId
workspaceLayout
zoom
theme
temporaryTool
```

---

## 9.2 Server State

Verwendet:

```text
TanStack Query
```

Zum Beispiel:

```text
Nutzer
Aufgaben
Klausuren
Experimentliste
Fehleraufgaben
Kurse
Lernverlauf
Ressourcen
```

---

## 9.3 Physics World State

Verwendet:

```text
PhysicsScene Runtime
```

Zum Beispiel:

```text
Body
Particle
Field
Force
Circuit
Timeline
Revision
```

Darf nicht als zweite Faktenquelle in Zustand kopiert werden.

---

## 9.4 Agent State

Der Agent State (Session / Run / Turn / Tool Call / Agent Status / Streaming) wird vom Harness-Host verwaltet:

```text
Session
Run
Turn
Tool Call
Agent Status
Streaming
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: Die im Entwurf vorgesehene Verwaltung des Agent State durch `PhysicsAgentRuntime` (`@physicsos/agent-runtime`) wurde stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Der Harness ist der Agent-Host, PhysicsOS baut keine eigenständige Agent-Runtime.

---

# 10. PlatformBridge

Für die Wiederverwendung Web → Desktop wird frühzeitig eine Plattformabstraktion eingerichtet.

```ts
interface PlatformBridge {
  getPlatform(): 'web' | 'windows'

  openFile(options?: OpenFileOptions): Promise<FileRef | null>

  saveFile(file: BinaryFile, options?: SaveFileOptions): Promise<void>

  notify(message: NotificationMessage): Promise<void>

  supports(capability: PlatformCapability): boolean
}
```

Implementierungen:

```text
BrowserPlatformBridge
TauriPlatformBridge
```

Geschäftscode darf nicht überall prüfen:

```ts
if (window.__TAURI__) {
}
```

---

# 11. Physics Workspace

Zentrale Arbeitsseite:

```text
┌───────────────────────────────────────────────────────────────┐
│ PhysicsOS │ Szenenname │ ▶ │ ⏸ │ 1x │ Speichern │ Teilen     │
├────────────┬──────────────────────────────┬───────────────────┤
│ Scene Tree │                              │ Inspector         │
│            │                              │                   │
│ Objects    │       Physics Canvas         │ Observables       │
│            │                              │                   │
│ Layers     │                              │ Physics Agent     │
│ Tools      │                              │                   │
├────────────┴──────────────────────────────┴───────────────────┤
│ Timeline                                                      │
├───────────────────────────────────────────────────────────────┤
│ Data │ Graph │ Energy │ Velocity │ Acceleration │ Derivation  │
└───────────────────────────────────────────────────────────────┘
```

---

# 12. Module des Physics Workspace

Empfohlene Aufteilung:

```text
workspace/
├── toolbar/
├── scene-tree/
├── object-library/
├── canvas/
├── inspector/
├── observation-panel/
├── timeline/
├── data-panel/
├── graph-panel/
├── derivation-panel/
└── agent-panel/
```

Der Workspace selbst koordiniert nur diese Module.

---

# 13. Physics Canvas

Der Canvas muss als eigenständiges Laufzeit-Subsystem aufgebaut sein und nicht als eine Sammlung gewöhnlicher React-Komponenten.

Struktur:

```text
PhysicsCanvas
│
├── Camera
├── Viewport
├── CoordinateTransform
├── SelectionManager
├── HitTest
├── InteractionController
├── RenderLayerManager
└── Renderer
```

---

# 14. 2D- / 3D-Strategie

Prinzip:

> **2D als Hauptkörper, 3D als Erweiterung.**

Einsatzszenarien:

```text
SVG
→ Statische Vektorgrafik, Kräftediagramme, Formelhilfsbilder

Canvas / PixiJS
→ Hochfrequente dynamische 2D-Szenen

Three.js
→ Echte 3D-Szenen, die räumliches Verständnis erfordern

ECharts
→ Diagramme wie x-t / v-t / a-t / Energie
```

Es ist verboten, für alle Experimente einheitlich Three.js zu verwenden.

---

# 15. PhysicsScene Runtime

Kernstruktur:

```text
PhysicsSceneRuntime
│
├── SceneGraph
├── SceneCommandBus
├── EventStore
├── Reducer
├── SnapshotStore
├── Timeline
└── SceneQueryService
```

Änderungspfad:

```text
Command
   ↓
Validation
   ↓
Physics Event
   ↓
Reducer
   ↓
New PhysicsScene
   ↓
revision + 1
```

---

# 16. Scene Mutation

Verboten:

```ts
scene.particles[0].mass = 2
```

Erforderlich:

```text
ChangeParticleMass Command
        ↓
Scene Validator
        ↓
ParticleMassChanged Event
        ↓
Scene Reducer
        ↓
Scene Revision + 1
```

Nur so lassen sich unterstützen:

```text
Undo
Redo
Replay
Branch
Audit
Agent Trace
```

---

# 17. Scene EventStore

Typische Ereignisse:

```text
SceneCreated
BodyAdded
BodyRemoved
ParticleAdded
ParticleRemoved
FieldAdded
FieldChanged
ForceAdded
ConstraintAdded
ParameterChanged
TimelineSeeked
SimulationStarted
SimulationPaused
SimulationCompleted
ParticleEnteredRegion
ParticleExitedRegion
CollisionOccurred
ObservationEnabled
ObservationDisabled
```

---

# 18. SnapshotStore

Snapshots dienen für:

```text
Schnelle Wiederherstellung
Wiedergabe über große Zeitspannen
Branch
Optimierung von Undo/Redo
Wiederherstellung von Agent Sessions
Teilen von Szenen
```

Ein Snapshot ersetzt den EventStore nicht.

---

# 19. Physics Timeline

Die Timeline ist nativ mit der Scene Runtime verbunden.

```text
0s ───── 1s ───── 2s ───── 3s
                ▲
              current
```

Unterstützt:

```text
play()
pause()
seek()
stepForward()
stepBackward()
setPlaybackRate()
```

Nach dem Ziehen der Timeline durch den Nutzer müssen alle:

```text
Positionen
Geschwindigkeiten
Beschleunigungen
Kräfte
Felder
Energien
Schaltungsdaten
Trajektorien
```

auf diesen Zeitpunkt wiederhergestellt werden.

---

# 20. Physics Core

`physics-core` definiert nur die allerwichtigsten:

```text
Basistypen
Engine Interface
Simulation Contract
Öffentliche Berechnungsschnittstellen
Domain Registry
```

Muss rein bleiben.

Verboten sind Abhängigkeiten von:

```text
React
PixiJS
Three.js
Agent
Harness
Spring Boot
Datenbank
```

---

# 21. Physics Engine Registry

Einheitliche Registrierung der verschiedenen Physikdomänen.

```ts
interface PhysicsEngine<TScene = PhysicsScene, TResult = SimulationResult> {
  readonly domain: PhysicsDomain

  supports(scene: TScene): boolean

  simulate(scene: TScene, options: SimulationOptions): Promise<TResult>
}
```

Engine Registry:

```text
Mechanics
Kinematics
Gravity
Electric
Magnetic
EM
Circuit
Induction
Optics
Wave
Thermal
```

---

# 22. Mechanics Engine

Zuständig für:

```text
Kräfte
Newtonsche Gesetze
Reibung
Elastische Kräfte
Stützkräfte
Verbundene Körper
Zwangsbedingungen
Arbeit und Energie
Impuls
Stöße
```

---

# 23. Kinematics Engine

Zuständig für:

```text
Geradlinige Bewegung
Gleichmäßig beschleunigte Bewegung
Freier Fall
Senkrechter Wurf nach oben
Waagerechter Wurf
Schräger Wurf
Kreisbewegung
Trajektorien
Zeitliche Zustandsänderung
```

---

# 24. Electric Engine

Zuständig für:

```text
Coulombkraft
Elektrisches Feld
Potenzial
Elektrische potenzielle Energie
Überlagerung elektrischer Felder
Bewegung geladener Teilchen im elektrischen Feld
```

---

# 25. Magnetic Engine

Zuständig für:

```text
Lorentzkraft
Ampèrekraft
Homogenes Magnetfeld
Magnetfeldbereiche
Kreisbewegung von Teilchen
Ein- und Austritt
Randprobleme
```

---

# 26. EM Composite Engine

Behandelt:

```text
Elektrisches Feld + Magnetfeld
Elektrisches Feld + Schwerkraft
Magnetfeld + Schwerkraft
Elektrisches Feld + Magnetfeld + Schwerkraft
Geschwindigkeitsselektor
Massenspektrometer
Zyklotron
Zusammengesetzte Bewegung in mehreren Bereichen
```

---

# 27. Circuit Engine

Intern verwendet:

```text
CircuitGraph
```

und nicht „Animationszustände“.

Struktur:

```text
Node
Terminal
Component
Connection
Source
Resistor
Capacitor
Inductor
Switch
Meter
```

Ausgabe der Circuit Engine:

```text
Node Voltage
Branch Current
Component State
Energy
Power
Measurement
```

---

# 28. Induction Engine

Zuständig für:

```text
Magnetischer Fluss
Faradaysches Induktionsgesetz
Lenzsche Regel
Bewegter Leiter
Leiterrahmen
Schienen
Zwei Stäbe
Elektromagnetische Dämpfung
Selbstinduktion
Gegeninduktion
Grundlagen von Wechselstrom
```

Muss zusammenarbeiten mit:

```text
Mechanics
Circuit
Magnetic
```

---

# 29. Math Runtime

Die mathematische Fähigkeit ist eigenständig.

```text
Math Runtime
│
├── Symbolic
├── Numerical
├── Geometry
├── Equation Solver
├── ODE
├── Matrix
└── Unit System
```

Komplexe Fähigkeiten werden über einen Python-Service umgesetzt.

Empfohlen:

```text
FastAPI
SymPy
NumPy
SciPy
```

Auf der TypeScript-Seite aufgerufen über:

```text
MathRuntimeClient
```

---

# 30. Prinzipien der Math Runtime

Die Physics Engine darf nicht direkt von der HTTP-Struktur eines Python-Pakets abhängen.

Richtig:

```text
Physics Engine
      ↓
MathRuntime interface
      ↓
Math Service Adapter
      ↓
Python Math Service
```

---

# 31. Physics Units

Eigenständig:

```text
physics-units
```

Intern einheitlich SI.

Die UI kann anzeigen:

```text
cm
mm
km/h
μC
mT
ns
```

Vor dem Eintritt in die Engine wird in kanonisches SI umgerechnet.

---

# 32. Physics Verifier

Einheitliche Verifikationsschicht:

```text
Physics Verifier
│
├── Dimensional Verification
├── Symbolic Verification
├── Numerical Verification
├── Constraint Verification
├── Conservation Verification
├── Boundary Verification
├── Trajectory Verification
└── Semantic Review
```

Reihenfolge:

```text
Regeln
↓
Einheiten
↓
Mathematik
↓
Zahlenwerte
↓
Physikalische Invarianten
↓
LLM Semantic Review
```

---

# 33. Simulation Pipeline

Einheitliche Simulationspipeline:

```text
PhysicsScene
      ↓
Scene Validation
      ↓
Engine Selection
      ↓
Physics Engine
      ↓
Math Runtime
      ↓
Raw SimulationResult
      ↓
Physics Verifier
      ↓
Verified SimulationResult
```

---

# 34. Simulation Worker

Rechenintensive Simulationen im Browser dürfen die UI nicht blockieren.

Vorrang:

```text
Web Worker
```

Der Hauptthread ist zuständig für:

```text
UI
Renderer
Nutzeraktionen
```

Der Worker ist zuständig für:

```text
Numerisches Fortschreiben
Stapelberechnung von Trajektorien
Datenabtastung
```

---

# 35. Observation Runtime

Observation ist eine eigenständige Schicht.

Struktur:

```text
Observation Runtime
│
├── Vector Layer
├── Trajectory Layer
├── Field Layer
├── Energy Layer
├── Geometry Layer
├── Measurement Layer
├── Graph Layer
└── Annotation Layer
```

---

# 36. Observation Model

Die Physics Engine gibt aus:

```text
Welchen Zustand die Welt hat
```

Die Observation Runtime wandelt um in:

```text
Welche Informationen der Nutzer sehen möchte
```

Zum Beispiel:

```text
Lorentzkraft anzeigen
Momentangeschwindigkeit anzeigen
Mittelpunkt anzeigen
Bahnradius anzeigen
Koordinatensystem ausblenden
Kurve der kinetischen Energie anzeigen
```

---

# 37. Renderer-Architektur

```text
Physics Engine
      ↓
SimulationResult
      ↓
Observation Model
      ↓
Visual Scene Model
      ↓
Renderer
```

Der Renderer unterstützt:

```text
SVG Renderer
Canvas Renderer
Pixi Renderer
Three Renderer
Chart Renderer
```

---

# 38. Question Space Runtime

Vollständige Kette:

```text
Aufgabe / Bild / PDF
      ↓
Document Parser
      ↓
OCR / VLM
      ↓
Question Segmentation
      ↓
Diagram Understanding
      ↓
Physics Semantic Parser
      ↓
Physics IR
      ↓
Scene Builder
      ↓
PhysicsScene
      ↓
Verifier
      ↓
Physics Engine
      ↓
Observation
      ↓
Physics Canvas
      ↓
Tutor Agent
```

---

# 39. Document Service

Zuständig für:

```text
PDF-Analyse
Bildanalyse
Vorverarbeitung gescannter Dokumente
Seitenaufteilung
Erkennung von Aufgabennummern
Erkennung von Aufgabenbereichen
Texterkennung
Bildextraktion
Aufgabenzerlegung
```

Nicht zuständig für:

```text
Physikalisches Lösen
Scene Simulation
Agent-Unterricht
```

---

# 40. Question Segmentation

Ganze Klausur:

```text
Exam
│
├── Question 1
├── Question 2
├── Question 3
└── ...
```

Pro Aufgabe wird gespeichert:

```text
Ursprüngliche Quelle
Aufgabenstellung
Bild
Diagram IR
Physics IR
Scene
Solution
Student Attempt
Diagnostic
```

---

# 41. Physics IR

Physics IR ist die formale Zwischenschicht.

```text
Natural Language
      ↓
Physics IR
      ↓
PhysicsScene
```

Enthält hauptsächlich:

```text
domain
problemType
objects
regions
knownValues
initialConditions
constraints
relations
targets
diagramRefs
knowledgeTags
confidence
```

---

# 42. Diagram IR

Visuelle Aufgabenbilder werden zuerst umgewandelt in:

```text
Diagram IR
```

Unterstützt:

```text
Point
Line
Arc
Arrow
Label
Body
Wire
Circuit Component
Field Region
Coordinate
Boundary
```

Erst danach kann abgebildet werden:

```text
Diagram IR
    ↓
Physics Mapping
    ↓
PhysicsScene / CircuitGraph
```

---

# 43. Question → Physics World

Die Aufgabenseite bietet:

```text
In der Physikwelt öffnen
```

Ablauf:

```text
Question
↓
Physics IR
↓
Scene Builder
↓
PhysicsScene
↓
Physics Workspace
```

---

# 44. Physics World → Dynamic Question

Experimentelle Szenen können:

```text
Auf Basis der aktuellen Szene Aufgaben erzeugen
```

Die Question Engine erzeugt anhand von:

```text
Scene
Knowledge Point
Difficulty
Variable Policy
Question Pattern
```

Aufgaben der Stufen:

```text
Basis
Mittel
Umfassend
Prüfung
Variation
```

---

# 45. Physics Agent Runtime

> **Stillgelegt (ADR-0002, 2026-09-27)**: `PhysicsAgentRuntime` (`@physicsos/agent-runtime`) wurde stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Der Harness ist der Agent-Host; PhysicsOS baut keine eigenständige Agent-Runtime. Die folgende Aufteilung in „Rollen“ gilt weiterhin als Entwurfsreferenz – es sind keine dauerhaft laufenden Runtimes, sondern sie werden auf dem Harness als Prompt + Tool Scope + Context + Workflow ausgedrückt (siehe §46).

Einheitliche Abstraktion:

```text
PhysicsAgentRuntime
│
├── Orchestrator
├── Question Parser Role
├── Scene Builder Role
├── Solver Role
├── Verifier Role
├── Observation Planner
├── Tutor Role
└── Diagnostic Role
```

---

# 46. Ein Agent entspricht nicht 7 dauerhaft laufenden Modellen

„Rolle“ bedeutet:

```text
Role
+
Prompt
+
Tool Scope
+
Context
+
Workflow
```

Das System erzeugt sie je nach Aufgabe dynamisch.

---

# 47. PhysicsAgentRuntime API

> **Stillgelegt (ADR-0002, 2026-09-27)**: Diese Schnittstelle und ihr Package `@physicsos/agent-runtime` wurden stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Der Harness ist der Agent-Host; PhysicsOS baut keine eigenständige Agent-Runtime. Die folgende Schnittstelle dient nur noch als historische Entwurfsaufzeichnung.

Die obere Ebene hängt nur von der einheitlichen Schnittstelle ab.

```ts
interface AgentRuntime {
  createSession(input: CreateSessionInput): Promise<AgentSession>

  send(sessionId: string, message: AgentInput): Promise<AgentRun>

  resume(runId: string): Promise<AgentRun>

  cancel(runId: string): Promise<void>
}
```

---

# 48. DeepSeek Harness Adapter

> **Stillgelegt (ADR-0002, 2026-09-27)**: `agent-dsh-adapter` (`@physicsos/agent-dsh-adapter`), das früher als „einziges Package in Agent/Domain von PhysicsOS, das vom Harness abhängen darf“ galt, und das zugehörige `agent-runtime` (`@physicsos/agent-runtime`) wurden stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`; seine Methoden waren ein Skelett mit `Promise.reject(new UnimplementedError(...))`, ohne Produktionspfad-Import.

Der Harness ist der Agent-Host; PhysicsOS baut keine eigenständige Agent-Runtime. Die Integrationsgrenze beider ist das Tool-Plugin im Harness-Workspace:

```text
Harness tool runtime
     ↓
dsh-tool-physicsos                    (overlays/harness/files/packages/physicsos/tool-physicsos)
     ↓
@physicsos/agent-tools
     ↓
PhysicsScene → Engine → Verifier      (Runtime der physikalischen Welt: einzige Quelle der Zahlenwerte)
```

Die offizielle UI-Overlay-Schicht `vendor/deepseek-harness/packages/client/ui-physicsos` ist die Integrationsgrenze der Darstellung und darf von den deklarierten Slot-Contracts für Layout/Sidebar/Conversation des Harness-Clients abhängen; sie darf nicht von Agent-Interna des Harness abhängen und Harness-Typen nicht in die PhysicsOS-Domäne streuen.

Andere PhysicsOS-Domänenmodule dürfen den Harness nicht direkt importieren.

---

# 49. Physics Profile

Auf dem Harness zusammengesetzt:

```text
Physics Profile
│
├── Prompt
├── Tools
├── Skills
├── Workflow
├── Context
├── Compaction
├── Memory
└── Agents
```

---

# 50. Agent Roles

## Orchestrator

Zuständig für:

```text
Aufgabe erkennen
Skill auswählen
Tools auswählen
Modell auswählen
Workflow auswählen
Andere Rollen koordinieren
```

---

## Question Parser

Zuständig für:

```text
Question
↓
Physics IR
```

---

## Scene Builder

Zuständig für:

```text
Physics IR
↓
Physics Tools
↓
PhysicsScene
```

---

## Solver

Zuständig für:

```text
Lösungsweg aufbauen
Physics Tools aufrufen
Math Runtime aufrufen
Deterministische Ergebnisse erhalten
```

---

## Verifier

Zuständig für die Verifikation von:

```text
Einheiten
Formeln
Zwangsbedingungen
Ergebnissen
Trajektorien
Randbedingungen
```

---

## Observation Planner

Zuständig für die Entscheidung:

```text
Welche physikalischen Größen angezeigt werden sollen
Wann pausiert wird
Welche Vektoren angezeigt werden
Welche Diagramme angezeigt werden
```

---

## Tutor

Zuständig für:

```text
Hinweise
Anleitung
Fragen stellen
Erklären
Schrittweises Unterrichten
Zusammenfassung von Gesetzmäßigkeiten
```

---

## Diagnostic

Zuständig für:

```text
Fehlermuster der Schüler erkennen
Learning State aktualisieren
```

---

# 51. Agent Workflow

Agent Loop und Physics Workflow sind getrennt.

Der Harness verwaltet:

```text
Turn
↓
Step
↓
Model Request
↓
Tool Call
↓
Tool Result
↓
Next Step
```

PhysicsOS verwaltet:

```text
INGEST
↓
UNDERSTAND
↓
FORMALIZE
↓
BUILD_SCENE
↓
VERIFY_SCENE
↓
SOLVE
↓
SIMULATE
↓
VERIFY_RESULT
↓
OBSERVE
↓
TEACH
↓
INTERACT
↓
REFINE
```

---

# 52. Tool Runtime

Einheitliche Benennung:

```text
physics.*
```

Zum Beispiel:

```text
physics.scene.create
physics.scene.get
physics.scene.patch
physics.scene.seek

physics.mechanics.net_force
physics.mechanics.acceleration

physics.kinematics.trajectory

physics.electric.field
physics.electric.particle_motion

physics.magnetic.lorentz_force
physics.magnetic.radius

physics.circuit.solve

physics.observe.force
physics.observe.velocity
physics.observe.trajectory
physics.observe.graph
```

---

# 53. Tool Call Pipeline

```text
Agent
↓
Tool Registry
↓
Schema Validation
↓
Permission Guard
↓
Unit Validation
↓
Domain Validation
↓
Physics Constraint Validation
↓
Tool Handler
↓
Physics Runtime
↓
Scene Event / Result
↓
Tool Result
```

---

# 54. Tool Result

Alle Tool Results müssen strukturiert sein.

Es darf nicht nur ein Freitext zurückgegeben werden.

Mindestens enthalten:

```text
ok
data/error
traceId
```

Fehler enthalten:

```text
code
message
retryable
details
```

---

# 55. Skills Runtime

Verzeichnis:

```text
skills/
├── junior-high/
└── senior-high/
```

Skills werden nach Wissenspunkten aufgeteilt.

Zum Beispiel:

```text
senior-high/
└── magnetic/
    └── charged-particle-magnetic-field/
```

---

# 56. Skill-Struktur

```text
charged-particle-magnetic-field/
├── SKILL.md
├── concepts.yaml
├── rules.yaml
├── misconceptions.yaml
├── teaching-strategies.yaml
├── visualization.yaml
├── verification.yaml
├── question-patterns.yaml
├── scene-templates/
└── examples/
```

---

# 57. Skill Progressive Loading

Wenn der Agent gerade ein Magnetfeldproblem bearbeitet:

Werden nur geladen:

```text
Magnetfeldbezogene Skills
Zugehörige Tools
Zugehörige Formeln
Zugehörige Fehlermuster
```

Nicht das gesamte Physikwissen der Mittel- und Oberstufe auf einmal injizieren.

---

# 58. Prompt Assembly

Der Prompt wird modular dynamisch zusammengesetzt:

```text
Identity
+
Physics Constitution
+
Current Mode
+
Grade
+
Current Skill
+
Current Scene Reference
+
Current Objective
+
Student State
+
Tool Policy
+
Teaching Policy
+
Recent Context
```

Eine einzelne überlange `system_prompt.txt` ist verboten.

---

# 59. Context-Architektur

Schichtung:

```text
L0 Constitution
L1 Domain
L2 User Learning State
L3 Physics Scene
L4 Task Working Memory
L5 Recent Conversation
L6 Retrieval
```

---

# 60. Context Compression

Die Physics-aware Compaction gibt mindestens aus:

```text
Aktuelle Aufgabe
Scene ID
Scene Revision
Bereits bestätigte Fakten
Bereits hergeleitete Ergebnisse
Bereits abgeschlossene Schritte
Aktuelles Ziel
Fehlvorstellungen des Schülers
Wichtige Event IDs
```

Die Scene selbst wird nicht durch eine Zusammenfassung in natürlicher Sprache ersetzt.

---

# 61. Memory-Architektur

```text
Memory
│
├── Session Memory
├── Learning Memory
├── Scene Memory
├── Error Memory
├── Knowledge Memory
└── Preference Memory
```

---

# 62. Model Router

Die Modellschicht ist nicht an einen einzelnen Provider gebunden.

```text
Model Router
│
├── Reasoning Model
├── Fast Model
├── Vision Model
├── OCR
├── Embedding Model
└── Optional Local Model
```

Der Agent wählt je nach Aufgabe.

---

# 63. Backend-Geschäftsservices

Empfohlenes Geschäfts-Backend:

```text
Spring Boot
```

Zuständig für:

```text
Auth
User
Curriculum
Question
Exam
Learning
Teacher
Class
Assignment
Content
Permission
Analytics
```

---

# 64. Service-Grenzen

Logisch:

```text
API Gateway
│
├── Business API
├── Agent Service
├── Simulation Service
├── Math Service
└── Document Service
```

Anfangs müssen nicht alle unabhängig deployt werden, die Code-Grenzen müssen aber existieren.

---

# 65. Datenspeicherung

## PostgreSQL

Speichert:

```text
User
Question
Exam
Question Attempt
Learning Record
Scene Metadata
Scene Events
Scene Snapshot Metadata
Skill Metadata
Curriculum
Class
Assignment
Permission
```

---

## Object Storage

Speichert:

```text
PDF
Images
Scene Assets
Large Snapshots
Export
Generated Files
```

---

## Redis

Verwendet für:

```text
Cache
Lock
Rate Limit
Queue
Temporary Runtime State
```

Darf nicht als einzige dauerhafte Faktenquelle dienen.

---

## Vector Store

Verwendet für:

```text
Curriculum Retrieval
Question Retrieval
Knowledge Retrieval
```

Speichert nicht den realen Zustand von PhysicsScene.

---

# 66. Zwei Event Streams

PhysicsOS hat gleichzeitig:

```text
Agent Event Stream
+
Physics Event Stream
```

Agent Stream:

```text
Prompt
Message
Model
Tool
Context
```

Physics Stream:

```text
Scene
Mutation
Simulation
Interaction
```

---

# 67. Trace-Verknüpfung

Einheitlich verknüpft:

```text
trace_id
session_id
run_id
turn_id
tool_call_id
scene_id
scene_revision
physics_event_id
```

Damit wird ein vollständiger Trace unterstützt:

```text
Nutzerfrage
↓
Agent
↓
Tool
↓
Physics Event
↓
Scene Revision
↓
Simulation
↓
Observation
↓
Assistant
```

---

# 68. API-Versionen

Business:

```text
/api/v1/*
```

Agent:

```text
/agent/v1/*
```

Simulation:

```text
/simulation/v1/*
```

Document:

```text
/document/v1/*
```

Math:

```text
/math/v1/*
```

---

# 69. Streaming

Empfohlen:

```text
Agent-Textstrom → SSE
```

Bei Bedarf an bidirektionaler hochfrequenter Zusammenarbeit:

```text
WebSocket
```

Zum Beispiel:

```text
Mehrbenutzer-Scene-Collaboration
Hochfrequente Scene Event Sync
```

---

# 70. Lokale Entwicklung

Empfohlen:

```text
Docker Compose
```

stellt bereit:

```text
PostgreSQL
Redis
Object Storage
Vector Store
```

Die Anwendungsservices werden lokal gestartet.

---

# 71. Empfohlene Root-Befehle

```bash
pnpm install

pnpm dev
pnpm dev:web
pnpm dev:teacher
pnpm dev:agent

pnpm typecheck
pnpm lint

pnpm test
pnpm test:physics
pnpm test:agent
pnpm test:e2e

pnpm build
```

Java-Services:

```bash
./mvnw test
./mvnw spring-boot:run
```

Python:

```bash
uv sync
uv run pytest
```

---

# 72. Umgebungsvariablen

Beispiel:

```env
APP_ENV=
LOG_LEVEL=

DATABASE_URL=
REDIS_URL=

OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_ACCESS_KEY=
OBJECT_STORAGE_SECRET_KEY=

AGENT_SERVICE_URL=
SIMULATION_SERVICE_URL=
MATH_SERVICE_URL=
DOCUMENT_SERVICE_URL=

MODEL_PROVIDER=
MODEL_API_KEY=
```

Das Repository committet nur:

```text
.env.example
```

Echte Secrets dürfen nicht committet werden.

---

# 73. Testsystem

PhysicsOS umfasst mindestens:

```text
Unit Test
Physics Golden Test
Agent Contract Test
Integration Test
E2E Test
Visual Regression
```

---

# 74. Unit Test

Geeignet für:

```text
Units
Vector
Scene Reducer
Geometry
Formula
Parser
Tool Guard
```

---

# 75. Physics Golden Test

Der wichtigste Test.

Für klassische Modelle müssen Golden Cases angelegt werden:

```text
Freier Fall
Waagerechter Wurf
Schräger Wurf
Kreisbewegung
Kräfte an der schiefen Ebene
Reibung
Impulserhaltung
Coulombkraft
Ablenkung im elektrischen Feld
Bewegung geladener Teilchen im Magnetfeld
Geschwindigkeitsselektor
Reihen- und Parallelschaltung
Elektromagnetische Induktion
```

---

# 76. Agent Contract Test

Testen:

```text
Tool Schema
Tool Permission
Tool Result
Ausgabe von Physics IR
Scene Builder
Compaction
Role Tool Scope
```

Es darf nicht hauptsächlich getestet werden, ob das Modell „schön spricht“.

---

# 77. Integration Test

Die vollständige Pipeline testen:

```text
Question
↓
Physics IR
↓
Scene
↓
Simulation
↓
Verifier
↓
Observation
```

---

# 78. E2E

Zentrale Abläufe:

```text
Labor betreten
Experiment auswählen
Parameter ändern
Ausführen
Pausieren
Timeline ziehen
Observable öffnen
Agent fragen
```

Sowie:

```text
Aufgabe hochladen
Aufgabe analysieren
Physics IR erzeugen
Scene aufbauen
Visualisieren
Lösung ansehen
In die Experimentierwelt wechseln
```

---

# 79. Visual Regression

Gilt für:

```text
Physics Workspace
Wichtige physikalische Diagramme
Kraftpfeile
Trajektorien
Feldlinien
Magnetfeldbereiche
Schaltpläne
```

Visuelle Regression wird durchgeführt.

---

# 80. CI

Ein PR führt mindestens aus:

```text
format check
typecheck
lint
unit tests
physics golden tests
agent contract tests
build
```

Bei Änderungen an Kernmodulen zusätzlich:

```text
integration tests
e2e
visual regression
```

---

# 81. Web → Windows EXE

Künftige Desktop-Struktur:

```text
PhysicsOS Shared React UI
        ↓
PlatformBridge
        ↓
Tauri Adapter
        ↓
Windows Native APIs
```

Voraussichtlich gemeinsam genutzt:

```text
UI
Physics Workspace
Physics Canvas
PhysicsScene
Physics Engine
Observation
Question Space
Agent UI
Skills
API Client
```

Desktop-spezifisch:

```text
Dateisystem
Native Dialog
Auto Update
Systembenachrichtigungen
Lokale Runtime
Local Harness Sidecar
```

---

# 82. Desktop-Lokalmodus

Künftig unterstützbar:

```text
PhysicsOS.exe
│
├── Shared Web UI
├── Local Physics Runtime
├── Local File System
└── Local Harness Sidecar
```

und das Umschalten zwischen:

```text
Cloud Agent
Local Agent
```

erlauben.

---

# 83. Richtung der UI-Entwicklung

Insgesamt:

```text
Warmweiß
Nebelweiß
Eisblau transparent
Natürliches Blau
Wenig Türkisgrün
Dunkelgraue Schrift
Wenig Warnorange
```

Vermeiden:

```text
Dunkle Tech-Optik
Starre violette Verläufe
Cyberpunk
Klassisches Bildungs-Backend
Mit Karten überfüllte Seiten
```

Schlüsselprinzip:

> **Die physikalische Welt ist das Hauptmotiv, die UI ist der Container.**

---

# 84. Performance-Strategie

Hochfrequente Simulation:

```text
Web Worker
```

Renderer und React-Zustandsaktualisierung sind entkoppelt.

Nicht bei jedem Physics Frame den gesamten React-Baum aktualisieren.

---

# 85. Simulation Sampling

Trajektorien speichern nicht unbegrenzt alle Integrationsschritte.

Zu unterscheiden:

```text
solver timestep
storage sample rate
render sample rate
chart sample rate
```

Sicherzustellen ist:

```text
Rechengenauigkeit
≠
Speicherfrequenz
≠
Anzeige-Framerate
```

---

# 86. Lazy Loading

Folgende Fähigkeiten werden bei Bedarf geladen:

```text
Three.js-Szenen
Große Physik-Skills
Komplexe Aufgabenressourcen
Erweiterte Diagramme
Teacher Studio
```

Das verringert die Größe beim ersten Laden.

---

# 87. Sicherheit

Datei-Upload:

```text
MIME-Validierung
Größenbeschränkung
Prüfung auf Schadsoftware
Isolierte Verarbeitung
```

Agent:

```text
Tool Permission
Rate Limit
Timeout
Audit
```

---

# 88. Observability

Jeder Service gibt einheitlich aus:

```text
timestamp
level
service
traceId
userId
sessionId
runId
sceneId
event
```

Das Entwickler-Backend soll künftig den vollständigen Ablauf einsehen können:

```text
User
↓
Agent
↓
Tool
↓
Physics Event
↓
Scene Revision
↓
Simulation
↓
Verifier
↓
Observation
```

---

# 89. Abhängigkeitsrichtung

Einzuhalten:

```text
Apps
 ↓
Application Packages
 ↓
Domain Packages
 ↓
Core Packages
```

Verboten:

```text
Core
 ↓
UI
```

---

# 90. Package README

Jedes wichtige Package sollte enthalten:

```text
README.md
```

mit Angaben zu:

```text
Verantwortung
Öffentliche API
Erlaubte Abhängigkeiten
Verbotene Abhängigkeiten
Zentrale Contracts
Beispiele
Testmethode
```

---

# 91. Lesereihenfolge der Entwicklungsdokumente

Alle Entwickler / AI Agents lesen vor Aufgabenbeginn:

```text
00-PRODUCT-OVERVIEW.md
↓
01-DEVELOPMENT-GUIDE.md
↓
02-ENGINEERING-STANDARDS.md
↓
03-DOMAIN-CONTRACTS.md
↓
README des Ziel-Packages
↓
Zugehörige Tests
```

---

# 92. Ausgabeanforderungen am Ende einer Entwicklungsphase

Nach jeder Funktionsentwicklung ist anzugeben:

```text
Was geändert wurde
Welche Dateien geändert wurden
Warum so umgesetzt
Ob ein Contract geändert wurde
Was getestet wurde
Testergebnis
Verbleibende Risiken
```

---

# 93. Definition der abgeschlossenen Entwicklung

Eine Funktion gilt nur dann als abgeschlossen, wenn alle folgenden Bedingungen erfüllt sind:

```text
Code fertig
Echte Funktion angebunden
Typprüfung bestanden
Lint bestanden
Unit Test bestanden
Zugehöriger Golden Test bestanden
Build bestanden
Notwendiges E2E bestanden
Keine zentralen Mocks
Keine Pfade mit vorgetäuschtem Erfolg
Contract synchronisiert
Dokumentation synchronisiert
```

---

# 94. Architektur-Rote-Linien

Verboten:

```text
LLM ersetzt Physics Engine
React-Komponenten berechnen direkt zentrale physikalische Ergebnisse
Renderer entscheidet selbst über physikalische Ergebnisse
Agent umgeht Tool und ändert die Scene
Physics Core hängt von React ab
Physics Core hängt vom Harness ab
PhysicsScene speichert Renderer-Objekte
Normale Chat-Zusammenfassung ersetzt die Scene
Web und Desktop kopieren zwei Code-Basen
Verschiedene Module definieren eigenmächtig doppelte Contracts
```

---

# 95. Endgültige Engineering-Gestalt

PhysicsOS muss am Ende bilden:

```text
                PhysicsOS Applications
                         │
                         ↓
                   Application Layer
                         │
       ┌─────────────────┼──────────────────┐
       ↓                 ↓                  ↓
 Question Runtime   Physics Runtime    Agent Runtime
       │                 │                  │
       ↓                 ↓                  ↓
 Physics IR        PhysicsScene      Agent Contract
       │                 │                  │
       └─────────────────┼──────────────────┘
                         ↓
                   Physics Engine
                         ↓
                     Verifier
                         ↓
                  Observation
                         ↓
                     Renderer
```

Das Endziel lautet:

> **Dieselbe Physics World kann Web, das künftige Windows EXE, das Aufgabensystem, das Experimentsystem, die Lehrerseite und den Physics Agent bedienen, ohne die Physiklogik doppelt zu implementieren.**

---

# 96. Aktuelle Hauptrichtung der Entwicklung

Aktuelle offizielle Entwicklungspriorität:

```text
Web First
```

Das heißt:

```text
vendor/deepseek-harness/apps/web
+
vendor/deepseek-harness/packages/client/ui-physicsos
+
Zentrale gemeinsame Packages
+
Agent Runtime
+
Physics Runtime
+
Question Runtime
```

Der offizielle Browser-Einstieg ist `dsh-client-ui-physicsos` des vendor Harness (der alte eigenständige Prototyp `apps/web` wurde gelöscht).

Der Desktop wird nur architektonisch vorgehalten, vorerst keine Doppelentwicklung.

---

# 97. Engineering-Ziel in einem Satz

> **PhysicsOS als digitale Physikwelt-Engineering-Plattform aufzubauen, mit klaren Modulgrenzen, verifizierbaren physikalischen Ergebnissen, austauschbarem Agent, wiederverwendbar für Web und Desktop und langfristig erweiterbar auf das vollständige Physiksystem der Mittel- und Oberstufe.**
