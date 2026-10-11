# PhysicsOS Entwicklungs-Roadmap

> Datei: `docs/14-DEVELOPMENT-ROADMAP.md`  
> Dokumentzweck: Umsetzungsreihenfolge, Abhängigkeiten, Phasenziele und Abnahmekriterien für das vollständige Produkt-Engineering von PhysicsOS
>
> **Diese Roadmap ist eine Umsetzungsreihenfolge, keine Beschneidung des Produkts auf ein MVP. Der endgültige Produktumfang richtet sich weiterhin nach `00-PRODUCT-OVERVIEW.md`.**

---

# 0. Aktueller Stand der Umsetzung

Der einzige offizielle Web-Einstieg des Produkts:

```text
vendor/deepseek-harness/apps/web
        +
vendor/deepseek-harness/packages/client/ui-physicsos
```

Das `apps/web` im Wurzelverzeichnis ist ein veralteter, eigenständiger Prototyp und dient nur noch als Migrationsreferenz.

Zum aktuellen Code-Stand ist bereits eine lauffähige Kette entstanden:

```text
Harness Web Shell + PhysicsOS-Navigation und responsiver Arbeitsbereich
Magnetfeld Vertical Slice: Engine → Verifier → Observation → PhysicsCanvas
Fünf mechanische Szenentypen: Engine stateAt → Observation → PhysicsCanvas
Question Space: 16 deterministische Aufgaben → Question Runtime → Question → Lab
requestAnimationFrame-Anzeigeuhr, Pause, Geschwindigkeitsfaktor, Einzelschritt und Wiederholung bis zum Endpunkt
```

Folgendes gehört weiterhin zum nicht abgeschlossenen Umfang der Roadmap und darf nicht aufgrund vorhandener Buttons oder Platzhalteroberflächen als fertig gelten:

```text
Aufgabenerkennung aus Bild/PDF/OCR/VLM
Geschäftsabläufe des KI-Assistenten sowie der Menüs Speichern/Mehr
Vorlagenbibliothek, Lernverlauf und Persistenz
Electric / Circuit / Induction / Optics / Wave
Lehrerseite, kollaboratives Veröffentlichen und Desktop
```

---

# 1. Entwicklungsprinzipien

Einheitlich:

```text
Contract First
Physics Core First
Vertical Slice
Real Integration
Continuous Verification
```

Verboten:

```text
Zuerst alle Seiten fertig zeichnen
↓
Erst am Ende überlegen, wie die Physik-Engine angebunden wird
```

---

# 2. Gesamt-Abhängigkeitsgraph

```text
Repository Foundation
        ↓
UI Foundation + Contracts
        ↓
Units / Math / Geometry
        ↓
PhysicsScene Runtime
        ↓
Core Physics Engines
        ↓
Verifier
        ↓
Observation
        ↓
Renderer
        ↓
Physics Workspace
        ↓
Agent Runtime
        ↓
Question Pipeline
        ↓
Dynamic Question
        ↓
Learning Model
        ↓
Teacher Studio
        ↓
Desktop
```

---

# 3. Phase 0 — Repository Foundation

Ziel:

```text
Monorepo
pnpm workspace
Turborepo
TypeScript
Lint
Format
Test Runner
CI
Docs
```

Aufbau von:

```text
apps/
packages/
services/
skills/
tests/
docs/
```

Abnahme:

```text
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Alle bestehen.

---

# 4. Phase 1 — UI Foundation

Aufbau von:

```text
packages/ui
tokens
primitives
domain components
```

Zuerst fertigstellen:

```text
Top Navigation
Sidebar
Button
Input
Select
Tabs
Panel
Card
Table
Toolbar
```

Und aufbauen:

```text
Home Shell
Workspace Shell
Question Shell
```

Abnahme:

```text
1440×900
1600×900
1920×1080
```

Hohe Übereinstimmung mit dem Prototyp.

---

# 5. Phase 2 — Core Contracts

Umsetzung von:

```text
PhysicsScene
Quantity
Vector
Event
Simulation
Physics IR
Diagram IR
Tool Contract
Agent Context
```

Ausgabe:

```text
TS Types
Zod
JSON Schema
Contract Tests
```

---

# 6. Phase 3 — Units / Math / Geometry

Umsetzung von:

```text
Unit Registry
SI Conversion
Dimension
Vector
Basic Geometry
Math Runtime Interface
```

Abnahme:

```text
Unit Tests
Dimension Tests
Geometry Tests
```

---

# 7. Phase 4 — PhysicsScene Runtime

Umsetzung von:

```text
SceneGraph
CommandBus
Validation
EventStore
Reducer
Revision
Snapshot
Timeline
Branch
Query
```

Abnahme:

```text
Create
Mutate
Undo
Redo
Replay
Seek
Branch
Revision Conflict
```

---

# 8. Phase 5 — Erste Physics Engines

Vorrang:

```text
Kinematics
Mechanics
Magnetic
```

Gründe:

```text
Deckt die derzeit zentralen Prototypen ab
Eignet sich, die erste vollständige Systemkette zu bilden
```

Das bedeutet nicht, dass andere Domänen nicht umgesetzt werden.

---

# 9. Phase 6 — Physics Verifier

Umsetzung von:

```text
Schema
Unit
Dimension
Numerical
Constraint
Boundary
Trajectory
```

---

# 10. Phase 7 — Observation Runtime

Zuerst:

```text
Force
Velocity
Acceleration
Trajectory
Geometry
Measurement
Graph
```

---

# 11. Phase 8 — Renderer

Umsetzung von:

```text
Coordinate Transform
Grid
Canvas / Pixi
SVG
Vector
Trajectory
Field
Timeline
Chart Adapter
```

---

# 12. Phase 9 — Physics Workspace

Echt angebunden:

```text
Scene Tree
Canvas
Inspector
Observation
Timeline
Data
Chart
```

Mock-Scenes als Endimplementierung sind verboten.

---

# 13. Phase 10 — Erste vollständige Vertical Slice

Empfohlen:

> **Kreisbewegung eines geladenen Teilchens im homogenen Magnetfeld**

Sie deckt ab:

```text
Particle
Magnetic Field
Velocity
Lorentz Force
Trajectory
Radius
Period
Timeline
Observation
Renderer
Verifier
```

Abnahme:

```text
B ändern
q ändern
m ändern
v ändern
Trajektorie aktualisiert sich in Echtzeit
Formel und Zahlenwert stimmen überein
Timeline kann wiedergegeben werden
Golden Test besteht
```

---

# 14. Phase 11 — Zweite Vertical Slice

```text
Waagerechter Wurf
```

Deckt ab:

```text
Kinematics
Mechanics
Trajectory
x-t
v-t
a-t
```

---

# 15. Phase 12 — Electric Engine

Umsetzung von:

```text
Coulomb
Uniform Electric
Potential
Particle Deflection
```

---

# 16. Phase 13 — Circuit Engine

Umsetzung von:

```text
CircuitGraph
Series
Parallel
Mixed
Switch
Variable Resistor
Meter
Internal Resistance
```

---

# 17. Phase 14 — Induction / EM Composite

Umsetzung von:

```text
Motional EMF
Rail
Loop
Coupled Mechanics + Circuit
Electric + Magnetic
```

---

# 18. Phase 15 — Agent Runtime Foundation

Umsetzung von:

```text
PhysicsAgentRuntime Contract
DSH Adapter
Session
Run
Streaming
Cancel
Resume
Fork
```

---

# 19. Phase 16 — Tool Runtime

Zuerst umsetzen:

```text
physics.scene.*
physics.kinematics.*
physics.mechanics.*
physics.magnetic.*
physics.observe.*
physics.math.*
physics.verify.*
```

---

# 20. Phase 17 — Agent Context / Workflow

Umsetzung von:

```text
L0-L6
Working Memory
Physics Workflow
Role Registry
Context Budget
```

---

# 21. Phase 18 — Agent Roles

Der Reihe nach:

```text
Orchestrator
Scene Builder
Solver
Verifier
Observation Planner
Tutor
Diagnostic
```

---

# 22. Phase 19 — Skills

Erste Charge:

```text
kinematics
mechanics
magnetic
```

Jeder Skill enthält vollständig:

```text
concept
rules
misconceptions
visualization
verification
question patterns
```

---

# 23. Phase 20 — Context Compaction

Umsetzung von:

```text
Physics-aware Structured Compaction
Tool Result Pruning
Scene Reference Preservation
Recovery
```

---

# 24. Phase 21 — Memory

Umsetzung von:

```text
Learning Memory
Error Memory
Preference Memory
```

---

# 25. Phase 22 — Question Ingest

Umsetzung von:

```text
Upload
PDF
Image
Normalization
OCR
Document Job
```

---

# 26. Phase 23 — Question Segmentation

Umsetzung von:

```text
Zerlegung ganzer Klausuren in Aufgaben
Zuordnung der Aufgabenbilder
Teilfragen
Antwortoptionen
```

---

# 27. Phase 24 — Diagram IR

Erste unterstützte Charge:

```text
Magnetfeldbereich-Diagramme
Kräftediagramme
Schaltpläne
Koordinatendiagramme
```

---

# 28. Phase 25 — Physics IR Parser

Umsetzung von:

```text
Question
↓
Physics IR
```

Mit:

```text
Evidence
Confidence
Assumption
```

---

# 29. Phase 26 — Scene Builder

Umsetzung von:

```text
Physics IR
↓
Scene Candidate
↓
Validation
↓
PhysicsScene
```

---

# 30. Phase 27 — Question Space

Prototyp echt angebunden:

```text
Upload
Verlauf
Aufgabentext
Gegebene Bedingungen
Gesuchte Größen
Lösungsschritte
Visualisierung
Verwandte Aufgaben
```

---

# 31. Phase 28 — Question → Experiment

Formal umsetzen:

```text
In der Physikwelt öffnen
```

Öffnet direkt dieselbe PhysicsScene Runtime.

---

# 32. Phase 29 — Dynamic Question

Umsetzung von:

```text
Scene Branch
↓
Variable Policy
↓
Simulation
↓
Verify
↓
Question Generate
```

---

# 33. Phase 30 — Learning Model

Umsetzung von:

```text
Knowledge Mastery
Misconception
Attempt
Evidence
Diagnostic Update
```

---

# 34. Phase 31 — Teacher Studio Foundation

Umsetzung von:

```text
Scene Builder
Experiment Authoring
Question Authoring
Classroom Presentation
```

---

# 35. Phase 32 — Teacher Business

Erweitern um:

```text
Class
Assignment
Publish
Learning Analytics
```

---

# 36. Phase 33 — Remaining Physics Domains

Erweitern um:

```text
Gravity Advanced
Collision
Optics
Wave
Thermal
Modern Physics
```

---

# 37. Phase 34 — Curriculum Coverage

Vollständigen Aufbau für Mittel- und Oberstufe:

```text
Skills
Experiment Templates
Question Patterns
Golden Cases
```

---

# 38. Phase 35 — Desktop Shell

Aufbau von:

```text
Tauri
PlatformBridge
Native File
Window
Notification
Auto Update
```

---

# 39. Phase 36 — Local Runtime

Später:

```text
Local Physics Runtime
Local Agent Sidecar
Offline Scene
Local File Project
```

---

# 40. Aufgabenvorlage pro Phase

Jede Entwicklungsphase muss besitzen:

```text
Goal
Scope
Allowed Files
Dependencies
Contracts
Tests
Acceptance
Risks
```

---

# 41. Zusammenarbeit mehrerer Agents

Parallelisierbar:

```text
UI Components
Eigenständige Engine
Test Dataset
Docs
```

Nicht geeignet für gleichzeitige Änderungen durch mehrere:

```text
PhysicsScene Contract
Physics IR Contract
Tool Contract
SimulationResult
```

---

# 42. Shared Contract Lock

Änderungen an zentralen öffentlichen Contracts erfordern:

```text
Einen einzigen Owner
Serielles Review
Synchrone Anpassung aller Consumer
```

---

# 43. Vor Arbeitsbeginn eines AI Workers

Zu lesen sind:

```text
00
01
02
03
Zugehörige Spezialdokumente
Package README
Tests
```

---

# 44. Lieferung eines AI Workers

Zu berichten sind:

```text
Erledigte Inhalte
Geänderte Dateien
Wichtige Designentscheidungen
Tests
Risiken
Contract Change
```

---

# 45. Erste systemweite Abnahmekette

```text
Geladenes Teilchen im Magnetfeld
```

Muss tatsächlich durchgängig verbunden sein:

```text
UI
Scene
Engine
Verifier
Observation
Renderer
Timeline
Tool
Agent
```

---

# 46. Zweite systemweite Abnahmekette

```text
Waagerechter Wurf
```

---

# 47. Dritte systemweite Abnahmekette

```text
Dynamischer Schaltkreis
```

---

# 48. Vierte systemweite Abnahmekette

```text
Elektromagnetische Induktion an Schienen
```

---

# 49. Keine Fake-Demos

In keiner Phase darf Folgendes:

```text
Festes JSON
Fest verdrahtete Ergebnisse
Gefälschte Agent-Antworten
Mock Simulation
```

als offizielle Fertigstellung ausgegeben werden.

---

# 50. UI Skeleton

In frühen Phasen sind Skeletons erlaubt.

Bei der Funktionsabnahme muss jedoch die echte Runtime angebunden sein.

---

# 51. Contract First

Modulübergreifende Fähigkeiten:

```text
Contract
↓
Test
↓
Producer
↓
Consumer
```

---

# 52. Golden First

Neues Physikmodell:

```text
Golden Case
↓
Implementation
```

---

# 53. Milestone A — Physics World Foundation

Erreicht:

```text
PhysicsScene
Timeline
Kinematics
Mechanics
Magnetic
Verifier
Observation
Renderer
Workspace
```

---

# 54. Milestone B — Physics Agent

Erreicht:

```text
Agent Runtime
Harness Adapter
Tools
Context
Workflow
Tutor
```

---

# 55. Milestone C — Question World

Erreicht:

```text
Document
OCR
Diagram IR
Physics IR
Scene Builder
Question Space
Question → Experiment
```

---

# 56. Milestone D — Complete Core Domains

Erreicht:

```text
Electric
Circuit
Induction
EM Composite
Dynamic Question
Learning Model
```

---

# 57. Milestone E — Teacher / Curriculum

Erreicht:

```text
Teacher Studio
Vollständige Skills
Experimentvorlagen
Aufgabentyp-Vorlagen
```

---

# 58. Milestone F — Desktop

Erreicht:

```text
Tauri Shell
PlatformBridge
Native Files
Update
Optional Local Runtime
```

---

# 59. Abnahmekennzahlen auf Produktebene

Fortlaufend im Blick:

```text
Physics Accuracy
Scene Reliability
Question Parse Accuracy
Agent Tool Accuracy
Tutor Quality
UI Fidelity
Performance
Recovery
```

---

# 60. Dauerhaft nicht verhandelbar

Unter keinem Termindruck zu opfern:

```text
PhysicsScene als einzige Faktenquelle
Physics Engine entscheidet das Ergebnis
Tool Guard
Contract
Golden Test
Echte Integration
```

---

# 61. Erste Engineering-Aufgabe nach Abschluss der Dokumentation

```text
Monorepo initialisieren
↓
UI / Contracts / Core Skeleton aufbauen
↓
Erste Magnetic Vertical Slice aufbauen
```

---

# 62. Roadmap-Prinzip in einem Satz

> **PhysicsOS muss von stabilen Contracts und einer echten Physics Runtime aus nach oben wachsen; jede Phase soll testbare, reproduzierbare und weiter ausbaubare echte Engineering-Assets hervorbringen, statt Seiten und Mocks aufzutürmen, die nur fertig aussehen.**
