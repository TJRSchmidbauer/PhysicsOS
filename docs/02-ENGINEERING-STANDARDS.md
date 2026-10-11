# PhysicsOS Engineering Standards

> Datei: `docs/02-ENGINEERING-STANDARDS.md`  
> Dokumentrolle: PhysicsOS projektweit verbindliche Engineering-Standards  
> Upstream-Dokumente: `00-PRODUCT-OVERVIEW.md`, `01-DEVELOPMENT-GUIDE.md`  
> Downstream-Vertrag: `03-DOMAIN-CONTRACTS.md`
>
> Diese Standards gelten für manuelle Entwicklung, Codex, Cursor, Claude Code, automatisierte Agenten, Multi-Agent-Kooperation.

---

# 1. Dokumentzweck

Dieses Dokument beantwortet eine Frage:

> **Nach welchen Regeln muss der gesamte PhysicsOS-Code entwickelt werden?**

PhysicsOS ist kein gewöhnliches CRUD-Projekt.

Es vereint gleichzeitig:

```text
Physik-Domänenmodell
Echtzeit-Simulation
Visualisierung
Aufgabenanalyse
Multimodales Verständnis
Agent Runtime
Tools
Skills
Kontextkompression
Lernzustand
Web
Zukünftig Windows Desktop
```

Ohne einheitliche Engineering-Standards entstehen leicht:

```text
UI berechnet physikalische Ergebnisse selbst
Agent modifiziert Scene direkt
Renderer führt intern einen zweiten State
Jedes Modul definiert eigene Einheiten
Jeder Entwickler schreibt eigene Tools
Web- und Desktop-Code duplizieren sich
LLM erzeugt gefälschte Simulationsergebnisse
Fehlschlagende Tests werden gelöscht, um CI grün zu bekommen
```

Daher sind in diesem Dokument „verboten“, „muss“, „darf nicht“ als verbindliche Regeln zu verstehen.

---

# 2. Standard-Stufen

PhysicsOS Standards gliedern sich in vier Stufen.

## 2.1 P0 — Architektur-Redlines

Verstoß → sofortiger Merge-Stopp.

Umfasst:

```text
Physikalische Faktenquelle
Physics Engine Grenze
PhysicsScene Mutation
Agent Tool Guard
Contract
Sicherheit
Test-Echtheit
```

---

## 2.2 P1 — Verpflichtende Engineering-Regeln

Grundsätzlich nicht verletzen.

Beispiele:

```text
Benennung
State Management
Logging
Fehlerstruktur
Einheiten
Git
Tests
API
```

---

## 2.3 P2 — Empfohlene Praktiken

Ohne besonderen Grund befolgen.

Beispiele:

```text
Verzeichnisorganisation
Komponentenzerlegung
Hook-Organisation
Performance-Optimierungsweisen
```

---

## 2.4 P3 — Stil-Empfehlungen

Können angepasst werden, solange Konsistenz gewahrt bleibt.

---

# 3. Erstes Architekturprinzip: Physics Engine entscheidet physikalische Ergebnisse

PhysicsOS Kernregel:

> **LLM entscheidet nicht über echte physikalische Ergebnisse, die Physics Engine tut es.**

LLM ist zuständig für:

```text
Aufgabe verstehen
Bedingungen extrahieren
Lösungsplan erstellen
Tools auswählen
Lehrstrategie festlegen
Ergebnisse erklären
```

Physics Engine ist zuständig für:

```text
Kräfte
Bahnen / Trajektorien
Geschwindigkeit
Beschleunigung
Felder
Energie
Stromkreiszustand
Kollisionen
Bewegungszustand
```

---

# 4. LLM darf echte Simulationsergebnisse nicht fälschen

Verboten:

```text
LLM konstruiert SimulationResult direkt aus Formeln
LLM generiert Trajektorie-Koordinaten und gibt sie als Physics Engine Ergebnis aus
LLM entscheidet selbst über den finalen Scene-Zustand
```

Beispiel für verbotene Vorgehensweise:

```ts
const trajectory = await llm.generate('Erzeuge eine Kreisbewegungsbahn')
```

als echtes Scene-Ergebnis.

Erlaubt:

```text
LLM schlägt Parameter vor
↓
Tool
↓
Physics Engine
↓
SimulationResult
```

---

# 5. PhysicsScene ist die einzige physikalische Faktenquelle

Der aktuelle formelle Zustand der physikalischen Welt muss stammen aus:

```text
PhysicsScene Runtime
```

Folgendes sind **keine** Faktenquellen:

```text
React State
Zustand
Canvas Object
Pixi Sprite
Three Object3D
Agent Prompt
Chat History
Working Memory
Temporäre View in der Datenbank
```

Sie dürfen nur:

```text
referenzieren
projizieren
cachen
anzeigen
```

PhysicsScene.

---

# 6. Keine zweite Scene-State-Instanz zulassen

Verboten:

```text
Zustand speichert komplette Scene
+
PhysicsScene Runtime speichert erneut Scene
```

→ bildet „dualen Master-State“.

Zustand darf speichern:

```text
selectedObjectId
activeTool
sidebarWidth
canvasZoom
```

Nicht erlaubt: speichern und eigenständig pflegen:

```text
particle.mass
body.velocity
field.strength
```

---

# 7. Keine direkte Mutation von PhysicsScene

Verboten:

```ts
scene.particles[0].mass.value = 2
scene.fields.push(field)
scene.timeline.currentTime = 3
```

Jede Scene-Modifikation muss laufen über:

```text
Command
↓
Validation
↓
Event
↓
Reducer
↓
New Revision
```

---

# 8. Scene Command Regeln

Command drückt aus: „Was soll passieren“.

Benennung nutzt Verben:

```text
CreateScene
AddBody
AddParticle
ChangeParameter
AddMagneticField
SeekTimeline
StartSimulation
```

Command muss enthalten:

```text
commandId
sceneId
expectedRevision
type
payload
actor
traceId
```

---

# 9. Scene Event Regeln

Ein Event stellt dar, „was bereits geschehen ist“.

Ereignisnamen müssen die Vergangenheitsform verwenden:

```text
SceneCreated
BodyAdded
ParticleAdded
ParameterChanged
TimelineSeeked
SimulationStarted
```

Verboten:

```text
AddBodyEvent
ChangeThing
DoSimulation
```

---

# 10. Scene Revision

Jede gültige Scene Mutation:

```text
revision + 1
```

Die Revision muss:

```text
monoton steigend sein
nicht rückgängig gemacht werden können
nicht wiederverwendet werden können
```

Schreiboperationen tragen mit:

```text
expectedRevision
```

Bei Konflikten wird zurückgegeben:

```text
SCENE_REVISION_CONFLICT
```

---

# 11. Events dürfen nicht verändert werden

Bereits persistierte Physics Events:

> **dürfen nicht verändert werden.**

Wird ein Fehler entdeckt:

```text
einen neuen korrigierenden Event anhängen
```

Die Historie nicht manipulieren.

Dies ist die Grundlage, damit Replay, Audit, Undo, Branch funktionieren.

---

# 12. Snapshot ersetzt nicht den EventStore

Ein Snapshot dient lediglich:

```text
schneller Wiederherstellung
schnellem Seek
Branch-Basis
Beschleunigung großer Szenen
```

Nicht wegen eines Snapshots die semantisch wichtigen Events löschen.

---

# 13. Physics Core Reinheit

Die folgenden Packages:

```text
physics-core
physics-scene
physics-units
alle engine-*
physics-verifier
```

dürfen nicht abhängen von:

```text
React
DOM
PixiJS
Three.js
DeepSeek Harness
Tauri
Spring Controller
Datenbank ORM
Redis Client
konkretem HTTP Framework
```

---

# 14. UI darf keine physikalischen Kernberechnungen durchführen

Verboten in React:

```tsx
const radius = (m * v) / (q * B)
```

als offizielles Ergebnis direkt zu verwenden.

Richtig:

```text
UI
↓
Application
↓
Physics Runtime
↓
Physics Engine
↓
Result
↓
UI
```

Die UI darf durchführen:

```text
Formatierung
Einheitendarstellung
einfache Prozentwerte
Layout-Berechnung
```

Sie darf keine fachliche Berechnung übernehmen.

---

# 15. Renderer darf nicht an der physikalischen Berechnung teilnehmen

Der Renderer ist zuständig für:

```text
Zeichnen
Animationsdarstellung
Koordinatenabbildung
Camera
Viewport
Hit Test
Selection
Render Layer
```

Dem Renderer ist verboten:

```text
Richtung der Lorentzkraft bestimmen
Bahnradius berechnen
resultierende Kraft ermitteln
elektrisches Potenzial berechnen
elektrischen Strom berechnen
Geschwindigkeit nach Kollision bestimmen
```

---

# 16. Renderer darf den Domänenzustand nicht zurückschreiben

Verboten:

```text
Pixi Sprite ziehen
↓
Particle.position direkt modifizieren
```

Richtig:

```text
Pointer Interaction
↓
Interaction Controller
↓
Scene Command
↓
PhysicsScene Runtime
↓
Renderer Subscription
```

---

# 17. Trennung von Observation und Physics Engine

Die Physics Engine bestimmt:

```text
den realen Zustand
```

Die Observation bestimmt:

```text
was der Schüler aktuell sieht
```

Beispiel:

```text
Die Lorentzkraft existiert real
```

und:

```text
ob die Oberfläche den Lorentzkraft-Pfeil anzeigt
```

sind zwei unterschiedliche Dinge.

Anzeige und Ausblendung müssen durch den:

```text
Observation Layer
```

gesteuert werden.

---

# 18. Vereinheitlichung des 2D / 3D Datenmodells

Es darf nicht für 2D und 3D je ein separates PhysicsScene erstellt werden.

Die Domäne verwendet einheitlich:

```text
Vector3
```

2D-Szenen:

```text
z = 0
```

Der Renderer entscheidet, ob in 2D oder 3D dargestellt wird.

---

# 19. Oberste Regel für das Einheitensystem

PhysicsOS verwendet für interne Berechnungen einheitlich:

> **SI-Kanonische Einheiten**

Dazu gehören:

```text
Länge m
Zeit s
Masse kg
Ladung C
Strom A
Kraft N
Energie J
Spannung V
magnetische Flussdichte T
Geschwindigkeit m/s
Beschleunigung m/s²
```

Die UI darf anzeigen:

```text
cm
mm
km
km/h
μC
mC
mT
ms
μs
ns
```

Vor Eintritt in die Engine muss die Umwandlung erfolgen.

---

# 20. Verbot von nackten number-Werten für wichtige physikalische Größen

Nicht empfohlen:

```ts
interface Particle {
  mass: number
}
```

Stattdessen verwenden:

```ts
interface Quantity<D extends PhysicalDimension> {
  value: number
  unit: UnitSymbol
  dimension: D
}
```

oder Canonical Quantity.

---

# 21. Dimensionsprüfung

Jede Formel, jedes Tool und jeder Simulationseingang muss in der Lage sein, auszuführen:

```text
Dimension Validation
```

Beispiel:

```text
Masse + Zeit
```

Sollte vor dem Eintritt in die Physics Engine abgelehnt werden.

---

# 22. Gleitkomma-Vergleich

Verboten:

```ts
a === b
```

für die Beurteilung physikalischer Gleitkomma-Ergebnisse.

Einheitlich verwenden:

```text
absoluteTolerance
relativeTolerance
domainTolerance
```

Beispielhaft:

```ts
isClose(actual, expected, {
  absolute: 1e-9,
  relative: 1e-6,
})
```

---

# 23. Numerische Stabilität

Die Engine muss explizit festlegen:

```text
timeStep
solver
tolerance
maxIterations
convergence condition
```

Verboten ist die Verwendung unerklärlicher Magischer Konstanten.

---

# 24. Simulations-Determinismus

Bei identischen:

```text
Scene
Scene Revision
Engine Version
Simulation Options
Random Seed
```

müssen reproduzierbare Ergebnisse erzielt werden.

Jeder zufällige Prozess muss speichern:

```text
randomSeed
```

---

# 25. Trennung von Zeitschritt und Anzeige-Bildrate

Es muss unterschieden werden:

```text
solver timestep
storage sample rate
render frame rate
chart sample rate
```

Verboten:

```text
60fps = Physics Solver rechnet nur 60 mal pro Sekunde
```

diese Kopplung.

---

# 26. Rechenintensive Berechnungen dürfen UI nicht blockieren

Rechenintensive Browser-Simulationen:

```text
Web Worker
```

Hauptthread:

```text
UI
Interaction
Renderer
```

Worker:

```text
Physics Calculation
Trajectory Generation
Large Sampling
```

---

# 27. React-Zustandsspezifikation

Zustand wird explizit in vier Kategorien unterteilt.

## UI State

Zustand:

```text
sidebarOpen
activeTab
selectedObjectId
workspaceLayout
zoom
temporarySelection
```

---

## Server State

TanStack Query:

```text
user
questions
exams
learning records
experiments
resources
```

---

## Physics State

PhysicsScene Runtime:

```text
body
particle
field
force
circuit
timeline
revision
```

---

## Agent State

Agent State (wird vom Harness-Host verwaltet, PhysicsOS baut keine eigene Agent-Runtime):

```text
session
run
turn
tool call
stream
status
```

Verboten, in einen einzigen Store zu vermischen.

---

# 28. Zustand-Verwendungsregeln

Verboten zu erstellen:

```text
useEverythingStore
```

der das gesamte System enthält.

Stores nach UI-Domänen aufteilen.

Beispiel:

```text
useWorkspaceLayoutStore
useCanvasUIStore
useQuestionUIStore
```

---

# 29. TanStack Query-Verwendungsregeln

Backend-Ressourcen werden per Query gelesen.

Nach Abschluss einer Mutation:

```text
invalidate / update cache
```

Serverseitige Daten nicht in den Zustand kopieren, um sie dort langfristig zu pflegen.

---

# 30. React-Komponenten-Verantwortlichkeiten

Komponenten werden unterteilt in:

```text
Page
Feature
Container
Presentational
Primitive
```

Page ist für die Komposition zuständig.

In Seiten-Dateien verboten:

```text
umfangreiche Domänenlogik
komplexe Berechnungen
zahlreiche API-Details
viel Engine-Logik
```

---

# 31. React-Komponenten-Größe

Es gibt keine absolute Zeilenbegrenzung, aber bei Auftreten folgender Situationen muss aufgeteilt werden:

```text
Mehrere Geschäftsbereiche gleichzeitig verarbeiten
Mehr als 3 Ebenen verschachtelter Nebeneffekte
Große Mengen bedingter Renderings
Gleichzeitige Verwaltung von API, Canvas, Agent, Formularen
Schwer separat testbar
```

---

# 32. Hook-Spezifikation

Komplexe Logik priorisiert als Hook auslagern:

```text
usePhysicsWorkspace
useTimeline
useSceneSelection
useObservablePanel
useAgentSession
```

Verboten zu erstellen:

```text
useEverything()
```

1000-Zeilen-großer Hook.

---

# 33. TypeScript-Strict-Modus

Muss:

```json
{
  "strict": true
}
```

Grundsätzlich verboten:

```ts
any
// @ts-ignore
// @ts-nocheck
```

Bevorzugt:

```text
unknown
generic
type guard
discriminated union
```

---

# 34. any-Ausnahme

Wenn Drittanbieter-Bibliotheksgrenzen zwingend any erfordern:

Muss:

```text
Auf Adapter beschränken
Kommentar mit Begründung schreiben
So schnell wie möglich in interne sichere Typen umwandeln
```

Verboten, dass any in die Domänenschicht ausstrahlt.

---

# 35. ID-Typ

Im gesamten Projekt ist die Verwendung von einfachem:

```ts
string
```

für IDs verboten.

Empfohlen: branded type:

```ts
type SceneId = Brand<string, 'SceneId'>
type ParticleId = Brand<string, 'ParticleId'>
type FieldId = Brand<string, 'FieldId'>
type ToolCallId = Brand<string, 'ToolCallId'>
```

---

# 36. Diskriminierte Union

Domänenobjekte bevorzugt verwenden:

```ts
type Field = UniformElectricField | UniformMagneticField | GravityField
```

Mit `type` als Diskriminator.

Vermeiden:

```text
Große Mengen optionaler Felder
```

die mehrdeutige Objekte erzeugen.

---

# 37. Funktionsdesign

Eine Funktion erledigt nur eine Hauptaufgabe.

Verboten:

```text
parseQuestionAndBuildSceneAndSolveAndSave()
```

Aufteilen in:

```text
parseQuestion()
buildPhysicsIR()
buildScene()
simulateScene()
saveResult()
```

---

# 38. Reine Funktionen zuerst

Folgende Logik wird bevorzugt als reine Funktionen implementiert:

```text
Einheitenumrechnung
Vector
Geometry
Scene Reducer
Formula
Parser Normalize
Verifier
```

Erleichtert Tests und Reproduktion.

---

# 39. Magic Numbers verboten

Verboten:

```ts
if (speed > 999999) {
}
```

Ohne Erklärung.

Muss durch:

```text
benannte Konstante
Config
Domänenregel
```

definiert werden.

---

# 40. Dateinamen

TypeScript:

```text
kebab-case.ts
kebab-case.tsx
```

Beispiel:

```text
physics-workspace.tsx
scene-reducer.ts
magnetic-engine.ts
```

React-Komponenten-Exporte verwenden weiterhin PascalCase.

---

# 41. Java-Benennung

Standard Java beachten:

```text
PascalCase class
camelCase method
UPPER_SNAKE_CASE constant
```

Datenbank:

```text
snake_case
```

---

# 42. Python-Benennung

PEP 8 beachten:

```text
snake_case
PascalCase class
```

---

# 43. Package-API

Package-öffentliche API muss zentral exponiert werden.

Beispiel:

```text
packages/physics-scene/src/index.ts
```

Andere Packages dürfen keine tiefen Imports tätigen:

```ts
import x from '@physics/scene/src/internal/reducer/private'
```

---

# 44. internal-Verzeichnis

Unstabile interne Implementierungen können in `internal/` platziert werden.

Andere Packages dürfen nicht davon abhängen.

---

# 45. Zyklische Abhängigkeiten

Package-zyklische Abhängigkeiten verboten.

Korrekt:

```text
renderer
↓
observation
↓
physics contracts
```

Verboten:

```text
renderer ↔ physics-core
```

Gegenseitige Referenz.

---

# 46. Abhängigkeitsrichtung

Langfristig beibehalten:

```text
Apps
 ↓
Application
 ↓
Domain
 ↓
Core
```

Untere Schichten dürfen nicht rückwärts auf obere Schichten abhängen.

---

# 47. Platform-Isolation

Geschäftslogik-Code darf nicht direkt abhängen:

```text
Tauri API
Node fs
Browser-spezielle API
```

Einheitlich über:

```text
PlatformBridge
```

---

# 48. BrowserPlatformBridge

Behandelt:

```text
File API
Download
Clipboard
Browser-Benachrichtigung
```

---

# 49. TauriPlatformBridge

Behandelt:

```text
Native File Dialog
Local FS
Windows-Benachrichtigung
Sidecar
Auto-Update
```

---

# 50. DeepSeek Harness-Isolation

Die formale Web-Präsentations-Integrationsgrenze umfasst nur:

```text
vendor/deepseek-harness/apps/web
vendor/deepseek-harness/packages/client/ui-physicsos
```

Sie können von bereits deklarierten Harness-Client-Plugins, Layout, Sidebar und Conversation-Slot-Contract abhängen.

> **Stillgelegt (ADR-0002, 2026-09-27)**: Der ehemals „einzige im PhysicsOS Agent/Domain erlaubte direkte Abhängigkeit vom DeepSeek Harness Agent Runtime“ `agent-dsh-adapter` (`@physicsos/agent-dsh-adapter`) und `agent-runtime` (`@physicsos/agent-runtime`) wurden stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Harness ist der Agent-Host; PhysicsOS baut keine eigene Agent-Runtime, seine Runtime ist die Physikwelt-Runtime (Scene → Engine → Verifier). Die echte Produktionskette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

Verboten:

```text
physics-core
question-parser
physics-scene
physics-verifier
physics-observation
```

Nicht direkt von Harness abhängen. Der Client-Darstellungsvertrag und die interne Agent-Runtime-API dürfen nicht in die oben genannten Domänenpakete ausstrahlen.

Das Wurzelverzeichnis `apps/web` ist ein veralteter eigenständiger Prototyp; es dürfen keine weiteren offiziellen Funktionen hinzugefügt werden, noch darf er als Veröffentlichungs-Eintrittspunkt dienen.

---

# 51. Agent darf Scene nicht direkt modifizieren

Verboten:

```text
Agent
↓
SceneStore.patch()
```

Erforderlich:

```text
Agent
↓
Physics Tool
↓
Tool Guard
↓
Scene Command
↓
Scene Runtime
```

---

# 52. Tool-Benennungskonvention

Einheitlich:

```text
physics.<domain>.<action>
```

Zum Beispiel:

```text
physics.scene.create
physics.scene.seek
physics.mechanics.net_force
physics.magnetic.lorentz_force
physics.circuit.solve
physics.observe.force
```

---

# 53. Universelle Tools verboten

Verboten:

```text
physics.solve_everything
simulate_physics(prompt)
modify_scene(any)
do_physics()
```

Tools müssen:

```text
Einzelfachliche Verantwortung
Eingabe eindeutig
Ausgabe eindeutig
Nebenwirkungen eindeutig
```

---

# 54. Tool-Schema

Jedes Tool muss haben:

```text
name
description
inputSchema
outputSchema
permission
timeout
error codes
```

Eingabe, die nur definiert, ist verboten:

```json
{
  "prompt": "string"
}
```

Und intern wird dann willkürlich alles geparst.

---

# 55. Tool Guard

Alle Schreiboperationen durchlaufen mindestens:

```text
Schema-Validierung
Berechtigungsvalidierung
Einheitenvalidierung
Domänenvalidierung
Physikalische-Restriktionsvalidierung
Revisionsvalidierung
Timeout
Audit
```

---

# 56. Tool-Fehler

Einheitliche Struktur:

```json
{
  "code": "INVALID_PHYSICS_PARAMETER",
  "message": "Mass must be greater than zero.",
  "retryable": false,
  "details": {}
}
```

Standardfehler decken mindestens ab:

```text
INVALID_UNIT
INVALID_PARAMETER
OBJECT_NOT_FOUND
SCENE_REVISION_CONFLICT
PHYSICS_CONSTRAINT_VIOLATION
UNSUPPORTED_MODEL
SIMULATION_FAILED
VERIFICATION_FAILED
TOOL_PERMISSION_DENIED
TOOL_TIMEOUT
```

---

# 57. Tool-Ergebnis darf nicht freier Text sein

Das tatsächliche Tool-Ergebnis muss strukturiert sein.

Erlaubt ist das Hinzufügen:

```text
humanReadableSummary
```

Aber es darf nicht nur geben:

```text
„Der Radius beträgt etwa 2 cm.“
```

---

# 58. Prompt-Verwaltung

Verboten:

```text
Eine system_prompt.txt enthält alle Projektregeln
```

Prompts müssen modular sein:

```text
Identity
Constitution
Mode
Domain
Skill
Scene Reference
Objective
Student State
Tool Policy
Teaching Policy
Recent Context
```

---

# 59. Prompt-Versionierung

Kritische Prompts müssen haben:

```text
id
version
change log
tests
```

Bei Änderungen des Agent-Verhaltens muss Rückverfolgbarkeit gewährleistet sein.

---

# 60. Prompts nicht im Code verstreut

Dutzende davon verboten:

```ts
const prompt = `Du bist...`
```

Verstreut auf Seiten und Services.

Einheitlicher Einstieg:

```text
agent-prompt
```

---

# 61. Context-Schichtung

Streng verwenden:

```text
L0 Constitution
L1 Domain
L2 Learning State
L3 Scene Reference
L4 Working Memory
L5 Recent Conversation
L6 Retrieval
```

---

# 62. Scene nicht in den Prompt

Verbieten, jede Runde das Ganze:

```json
PhysicsScene
```

serialisiert an das Modell zu übergeben.

Context speichert nur:

```text
sceneId
revision
snapshotId
notwendige Observation
dem aktuellen Task relevante Slices
```

---

# 63. Context Compaction

Komprimierung muss strukturierte Fakten beibehalten:

```text
task
scene
confirmedFacts
derivedFacts
completedSteps
pendingSteps
misconceptions
importantEvents
```

Verbieten, nur zu generieren:

```text
Der Nutzer lernt gerade Magnetfeld.
```

---

# 64. Memory-Klassifizierung

Memory muss klassifiziert werden:

```text
Session Memory
Learning Memory
Scene Memory
Error Memory
Knowledge Memory
Preference Memory
```

Verbieten, einen Vector Store komplett hineinzustecken und es Memory zu nennen.

---

# 65. Learning Memory

Learning Memory sollte speichern:

```text
Wissenspunkt
Fehlermuster
Beherrschungsgrad
Konfidenz
Evidenz
Aktualisierungszeitpunkt
```

Nicht nur einen vagen Text speichern.

---

# 66. Trennung von Solver und Tutor

Solver antwortet:

> **Wie man das Ergebnis richtig erhält.**

Tutor antwortet:

> **Wie man dem Schüler Verständnis vermittelt.**

Verbieten, dass Solver aus „Lernerfahrung“ die echte Antwort ändert.

Verbieten, dass Tutor selbst physikalische Fakten neu herleitet, die mit Solver inkonsistent sind.

---

# 67. Verifier-Prioritätsregeln

Prüfreihenfolge:

```text
Schema
↓
Unit
↓
Math
↓
Physics Constraint
↓
Conservation / Invariant
↓
Numerical
↓
LLM Semantic Review
```

LLM darf nur die letzte Ergänzung machen.

---

# 68. Question-Parser-Prinzipien

Question Parser gibt aus:

```text
Physics IR
```

Darf nicht direkt ausgeben:

```text
finale Canvas-Koordinaten
SimulationResult
Renderer Object
```

---

# 69. Physics IR muss Evidenz beibehalten

Aus der Aufgabe extrahierte Schlüsselbedingungen möglichst verknüpfen:

```text
text range
page
bounding box
diagram element
confidence
```

Vermeiden, dass Agent nicht weiß:

> Woher kommt dieses B=0,5T.

---

# 70. Diagram-Parser-Prinzipien

Bilderkennung darf nicht bei Folgendem aufhören:

```text
„Im Bild gibt es eine schiefe Ebene und einen Ball.“
```

Muss strukturiert werden zu:

```text
Diagram IR
```

Dann auf PhysicsScene abbilden.

---

# 71. Question → Scene muss prüfbar sein

Nach Abschluss des Scene Builders muss Folgendes ausgabefähig sein:

```text
Objekte
Bedingungen
Annahmen
Unbestimmte Punkte
Abbildungsevidenz
Scene-Validierung
```

Nicht erlauben, Scene als Black Box zu generieren und direkt auszuführen.

---

# 72. Prinzipien der dynamischen Aufgabengenerierung

Dynamic Question muss basieren auf:

```text
PhysicsScene
+
Question Pattern
+
Variable Policy
```

als Basis.

Kein reines LLM-zufälliges Erfinden von Zahlen.

---

# 73. API-Pfad-Spezifikation

Business API:

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

# 74. REST-Benennung

Empfohlen:

```text
GET /api/v1/questions/{id}
POST /api/v1/scenes
PATCH /api/v1/scenes/{id}
```

Verboten:

```text
/api/getQuestion
/api/createSceneNow
```

---

# 75. API DTO

Nach außen gerichtete Schnittstellen müssen verwenden:

```text
Request DTO
Response DTO
```

Verbieten, direkt offenzulegen:

```text
Database Entity
ORM Model
Internal Scene Aggregate
```

---

# 76. API-Fehler

Einheitlich:

```json
{
  "error": {
    "code": "SCENE_REVISION_CONFLICT",
    "message": "Scene revision conflict.",
    "traceId": "trace_xxx",
    "details": {}
  }
}
```

---

# 77. HTTP-Status

Grundlegende Konventionen:

```text
200 Erfolgreiche Abfrage
201 Erfolgreich erstellt
204 Erfolg ohne Antwortkörper
400 Fehlerhafte Anfragestruktur
401 Nicht authentifiziert
403 Keine Berechtigung
404 Ressource nicht gefunden
409 Revision / Konflikt
422 Domänenvalidierung fehlgeschlagen
429 Rate Limit
500 Interner Fehler
503 Downstream nicht verfügbar
```

---

# 78. Java-Schichtung

Spring Boot Geschäftsservices:

```text
controller
application
domain
infrastructure
```

Controller ist zuständig für:

```text
HTTP
Validation
DTO-Konvertierung
```

Es ist verboten, im Controller Domänenlogik zu schreiben.

---

# 79. Java Entity

Datenbank-Entity wird nicht direkt als Response-DTO verwendet.

Domain Model und Persistence Model können je nach Komplexität isoliert werden.

---

# 80. Datenbank-Migration

Alle Schema-Änderungen müssen:

```text
migration
```

Empfohlen:

```text
Flyway
```

Es ist verboten, die Produktionsdatenbank manuell zu ändern, ohne Aufzeichnungen zu hinterlassen.

---

# 81. Datenbankbenennung

Einheitlich:

```text
snake_case
```

Beispielsweise:

```text
scene_id
scene_revision
physics_event_id
created_at
```

---

# 82. Zeitkonvention

Backend und Datenbank einheitlich:

```text
UTC
```

Client wandelt in Ortszeit um.

Feldnamen:

```text
created_at
updated_at
started_at
finished_at
```

---

# 83. Datei-Upload

Beim Upload muss geprüft werden:

```text
MIME
extension consistency
size
hash
malware / dangerous format
owner
```

Komplexe Dokumentenverarbeitung sollte isoliert ausgeführt werden.

---

# 84. Object Storage

Große Dateien nicht direkt als Datenbank-BLOB speichern.

In der Datenbank speichern:

```text
object_key
sha256
size
content_type
owner
metadata
```

---

# 85. Redis-Konvention

Redis eignet sich nur für:

```text
Cache
Lock
Queue
Rate Limit
Temporary Runtime
```

Es ist verboten, ausschließlich zu speichern:

```text
PhysicsScene Event
Question
Learning Record
```

usw. als permanente Daten.

---

# 86. Vector Store-Konvention

Vector Store wird verwendet für:

```text
Retrieval
Semantic Search
```

Er ist kein Ersatz für relationale Datenbanken.

---

# 87. Protokollstruktur

Protokolle müssen strukturiert sein.

Mindestens unterstützen:

```text
timestamp
level
service
event
traceId
userId
sessionId
runId
sceneId
sceneRevision
toolCallId
```

---

# 88. Verbot sensibler Informationen in Protokollen

Verboten ist die Ausgabe von:

```text
Password
API Key
vollständiger Access Token
Authorization Header
Personalausweis im Originaltext
vollständiger Inhalt vertraulicher Dateien
```

---

# 89. console.log

In produktivem Geschäftscode verboten ohne Kontrolle:

```ts
console.log(...)
```

Einheitlich Logger verwenden.

Browser-Entwicklungsprotokolle müssen unterstützen:

```text
level
namespace
environment control
```

---

# 90. Trace ID

Bei serviceübergreifenden Spuren muss weiterverwendet werden:

```text
traceId
```

Agent fügt hinzu:

```text
sessionId
runId
turnId
toolCallId
```

Physics fügt hinzu:

```text
sceneId
sceneRevision
physicsEventId
```

---

# 91. Fehlerbehandlung

Verboten:

```text
catch (e) {}
```

Ausnahmen verschlucken.

Es muss:

```text
behandelt
umgewandelt
protokolliert
neu geworfen
```

werden. Einer der drei oder Kombination.

---

# 92. Trennung von Benutzerfehlern und Systemfehlern

Beispielsweise:

```text
INVALID_PARAMETER
```

Gehört zu Benutzer-/Modelleingabefehler.

```text
SIMULATION_INTERNAL_ERROR
```

Gehört zu Systemfehler.

Nicht einheitlich anzeigen:

```text
Something went wrong
```

Aber das Backend hat keine nachverfolgbaren Informationen.

---

# 93. Graceful Degradation

Bei Ausfall nicht-kerniger Fähigkeiten ist Degradation erlaubt.

Beispiel:

```text
Agent vorübergehend nicht verfügbar
```

Sollte den Benutzer nicht daran hindern, bestehende PhysicsScene-Experimente manuell zu nutzen.

Aber:

```text
Physics Engine Validierung fehlgeschlagen
```

Nicht vortäuschen, dass es erfolgreich war, und gefälschte Ergebnisse weiter anzeigen.

---

# 94. Höchstes Test-Regel

Die folgenden Pakete dürfen ohne Tests nicht gemergt werden:

```text
physics-core
physics-scene
physics-units
physics-verifier
physics-ir
agent-tools
question-parser
```

---

# 95. Unit Tests

Soll abdecken:

```text
Vector
Unit Conversion
Scene Reducer
Command Validation
Geometry
Formula
Tool Guard
Parser Normalization
```

---

# 96. Physics Golden Tests

Für klassische Modelle müssen stabile Golden Cases erstellt werden.

Mindestens einschließen:

```text
Gleichförmige geradlinige Bewegung
Gleichmäßig beschleunigte Bewegung
Freier Fall
Senkrechter Wurf nach oben
Waagerechter Wurf
Schräger Wurf
Kreisbewegung
Kraftanalyse auf geneigter Ebene
Reibung
Feder
Impulserhaltung
Vollständig elastischer Stoß
Coulomb-Kraft
Ablenkung im homogenen elektrischen Feld
Bewegung geladener Teilchen im homogenen Magnetfeld
Geschwindigkeitswähler
Einfache Reihen- und Parallelschaltung
Geschlossener Stromkreis
Faradaysche elektromagnetische Induktion
```

---

# 97. Golden-Test-Prinzipien

Golden Test ist nicht nur:

```text
snapshot ein großes JSON
```

Kernphysikalische Größen müssen explizit behauptet/geprüft werden:

```text
Formel
Wertebereich
Erhaltungsgröße
Richtung
Bewegungstyp
Periode
Bahnart
```

---

# 98. Bug-Fix-Regel

Beim Fixen von Kern-Physics-Bugs:

> **Zuerst fehlschlagenden Regressionstest hinzufügen, dann Code fixen.**

Verboten, nur Code zu ändern ohne Test zu hinterlassen.

---

# 99. Agent Contract Test

Schwerpunkttests:

```text
Tool Schema
Tool Permission
Tool Output
Context Compaction
Role Tool Scope
Scene Builder Contract
Physics IR Contract
```

Nicht das Haupttestziel darauf setzen:

```text
Ob die Modellformulierung schön ist
```

---

# 100. Integration Test

Abdecken:

```text
Question
↓
Physics IR
↓
Scene Builder
↓
PhysicsScene
↓
Simulation
↓
Verifier
↓
Observation
```

---

# 101. E2E Test

Web-Kernabläufe verwenden Playwright.

Mindestens:

```text
Labor betreten
Experiment öffnen
Parameter ändern
Ausführen
Pausieren
Timeline suchen/positionieren
Observable wechseln
Agent fragen
```

Prüfungsaufgaben:

```text
Aufgabe hochladen
Analysieren
Szene generieren
Visualisierung betreten
Analyse ansehen
In der Physikwelt öffnen
```

---

# 102. Visual Regression

Geeignet für:

```text
Physics Workspace
Kraftdiagramm
Magnetfeldbereich
Elektrische Feldlinien
Bahn
Schaltplan
Kern-UI
```

Visuelle Tests ersetzen keine Physics Golden Tests.

---

# 103. Snapshot Test

Missbrauch von Snapshot Tests verboten.

Kern-Physics-Ergebnisse müssen explizit behauptet/geprüft werden.

UI-Primitiven dürfen sinnvoll gesnapshottet werden.

---

# 104. Test Mock

Mocken erlaubt:

```text
Unkontrollierbare Drittmodelle
Netzwerk
Objektspeicher
```

Mocken verboten:

```text
Eigentlich zu implementierende Physics Engine
Echte Tool Handler
Kerndomänenfunktionen
```

Und dann Entwicklung als abgeschlossen erklären.

---

# 105. Verbot, fehlschlagende Tests zu löschen

KI oder Mensch darf nicht:

```text
Tests löschen
.skip
.only
expected in falsches Ergebnis ändern
```

Nur damit CI durchläuft.

---

# 106. CI muss durchlaufen

PR mindestens:

```text
format check
typecheck
lint
unit tests
physics golden tests
agent contract tests
build
```

Bei Kernänderungen zusätzlich:

```text
integration
e2e
visual regression
```

---

# 107. Git-Hauptzweig

Langfristiger Hauptzweig:

```text
main
```

Muss beibehalten:

```text
Buildbar
Kern-Tests bestehen
```

---

# 108. Git-Zweigbenennung

```text
feat/physics-scene
feat/magnetic-engine
feat/question-parser
fix/lorentz-direction
refactor/agent-runtime
docs/domain-contract
```

---

# 109. Commit-Regeln

Conventional Commits verwenden.

Zum Beispiel:

```text
feat(scene): add field region model
feat(magnetic): support uniform field particle motion
fix(units): correct microcoulomb conversion
refactor(agent): isolate harness adapter
test(mechanics): add projectile golden cases
docs(contract): define simulation result schema
```

---

# 110. Riesen-Commits verboten

Verboten:

```text
feat: update project
```

Enthält mehrere hundert unabhängige Dateien.

Ein Commit soll einen einzelnen logischen Zweck ausdrücken.

---

# 111. PR-Inhalt

Muss angeben:

```text
What
Why
Affected Modules
Contract Changes
Tests
Risks
Screenshots / Recording
Migration
```

---

# 112. Breaking Change

Folgende Änderungen gelten als Breaking:

```text
PhysicsScene Felder
Physics IR Felder
Tool Schema
Physics Event
SimulationResult
Öffentliche Package API
Service API
```

Muss:

```text
Explizit BREAKING CHANGE kennzeichnen
Contract aktualisieren
Migration aktualisieren
Tests aktualisieren
```

---

# 113. Dokumentations-Synchronisation

Änderungen an Folgendem erfordern Dokumentationsaktualisierung:

```text
Architektur
Contract
Public Tool
Public API
Physics Domain
Zustandsmaschine
Kontext-Ebene
Wichtige Verzeichnisse
```

---

# 114. TODO-Regeln

TODO nicht als Ersatz für die Kernimplementierung verwenden und dann als fertig erklären.

TODO muss:

```text
Konkrete Beschreibung
Issue / Task verknüpfen
Aktuelle Funktionsvollständigkeit nicht beeinträchtigen
```

---

# 115. Feature Flag

Unvollendete, aber zusammenzuführende experimentelle Fähigkeiten:

Hinter Feature Flag stellen.

Halbfertige Produkte nicht direkt offiziellen Nutzern aussetzen.

---

# 116. UI-Visuelle Regeln

PhysicsOS-Hauptvisueller Stil:

```text
Warmweiß
Nebelweiß
Naturblau
Eisblau transparente Schicht
Wenig Blaugrün
Sehr wenig Warnorange
Dunkelgrauer Text
```

Verboten:

```text
Großflächiges totes Violett
Violetter Verlauf vollflächig
Dunkler Cyberpunk
Billiges Leuchten
Traditionelles Behörden-/Bildungs-Backend-Blau
```

---

# 117. UI-Ebenen

Priorität:

```text
Leerraum
Inhaltshierarchie
Physikwelt-Hauptvisueller Stil
Feine Linien
Leichte Schatten
Zurückhaltendes Glass
```

Nicht alle Inhalte als Karten gestalten.

---

# 118. Glass-Verwendung

Flüssiges Glas nur für:

```text
Navigation
Schwebende Ebenen
Inspector
Toolbar
Wichtige Overlays
```

Nicht jede Ebene mit Blur versehen.

---

# 119. Farbsemantik

Empfehlung:

```text
Blue    = Primary / Physics
Green   = Success / Valid
Orange  = Warning / Energy
Red     = Error / Danger
Gray    = Neutral
```

Farben dürfen ihre Semantik nicht seitenweise willkürlich ändern.

---

# 120. Physics-Visualisierungsfarben

Force, Velocity, Acceleration etc. sollen einheitliche Design-Tokens festlegen.

Design-Tokens werden im UI Design System definiert.

Geschäftslogik-Code darf nicht willkürlich:

```ts
color: '#ff00ff'
```

---

# 121. Barrierefreiheit

Wichtige Operationen müssen unterstützen:

```text
Keyboard
Focus
ARIA
High Contrast consideration
```

Farbe darf nicht die einzige Art der Statusdarstellung sein.

---

# 122. Responsive-Bereich

Fokus auf:

```text
1366×768
1440×900
1600×900
1920×1080
```

Physics Workspace priorisiert Desktop-Querformat-Erfahrung.

Mobile ist vorerst kein Kernarbeitsplatz-Ziel.

---

# 123. Canvas-Performance

Verboten: React bei jedem Frame den gesamten Komponentenbaum aktualisieren.

Renderer sollte eine unabhängige Aktualisierungsschleife haben.

React abonniert nur:

```text
Niedrigfrequenz-Zusammenfassung
Selection
Panel Data
Status
```

---

# 124. Große-Daten-Trajektorien

Langzeit-Simulation muss:

```text
sampling
decimation
chunk
```

Nicht jeden Solver-Schritt unbegrenzt aufbewahren.

---

# 125. Worker-Kommunikation

Worker-Nachrichten müssen explizite Contracts verwenden.

Verboten zu senden:

```text
Beliebiges Objekt
function
DOM reference
```

---

# 126. Sicherheitsberechtigungen

Tool-Berechtigungen mindestens in Kategorien unterteilt:

```text
read
scene-write
content-write
teacher-write
admin
dangerous
```

Standardmäßig minimale Berechtigungen.

---

# 127. Agent-Berechtigungsvererbung

Ein Agent besitzt keine höheren Berechtigungen als der aktuelle Benutzer.

Verboten:

```text
Schüler ruft über Agent Teacher/Admin Tool auf
```

---

# 128. Ratenbegrenzung

Mindestens für:

```text
LLM
OCR
VLM
Document Parsing
Heavy Simulation
Export
```

Angemessene Ratenbegrenzung festlegen.

---

# 129. Timeout

Alle:

```text
Tool
Model
Document Parse
Simulation
Math Service
```

Timeout muss definiert werden.

Kein unbegrenztes Warten.

---

# 130. Retry

Nur für:

```text
Wiederholbare Netzwerkfehler
Temporäre Dienstfehler
```

Automatischer Retry.

Bei Domänenvalidierungsfehlern kein unbegrenzter Retry.

---

# 131. Idempotenz

Folgende Operationen sollten Idempotenz unterstützen:

```text
Datei-Upload-Initialisierung
Aufgaben-Erstellung
Zukünftige Zahlungsfunktionen
Wichtige Scene Command
```

---

# 132. Datenschutz

Schüler:

```text
Prüfungsbogen
Lernverlauf
Chat
Hochgeladene Dateien
```

Müssen nach Benutzer und Berechtigung isoliert werden.

Entwicklungsprotokolle geben keine vollständigen privaten Inhalte aus.

---

# 133. Datenlöschung

Nach Löschung einer Ressource durch den Benutzer muss es ein klares:

```text
metadata delete
object delete
derived data cleanup
```

Strategie geben.

---

# 134. KI-Entwicklungs-Agent muss zuerst Dokumentation lesen

Jeglicher Codex / Cursor / Claude Code / Agent vor Code-Änderungen:

Muss in folgender Reihenfolge lesen:

```text
00-PRODUCT-OVERVIEW.md
01-DEVELOPMENT-GUIDE.md
02-ENGINEERING-STANDARDS.md
03-DOMAIN-CONTRACTS.md
README des Ziel-Packages
Zugehörige Tests
```

---

# 135. KI-Agent darf Gesamtarchitektur nicht eigenmächtig umstrukturieren

Ohne explizite Aufgabe nicht:

```text
Technologie-Stack austauschen
Domänenschicht löschen
Statusarchitektur ändern
Contract neu schreiben
Agent Runtime ersetzen
Mehrere Packages zu einem zusammenführen
```

---

# 136. KI-Agent darf Rad nicht neu erfinden

Vor Änderungen muss gesucht werden:

```text
Vorhandenes Package
Vorhandener Type
Vorhandenes Util
Vorhandenes Tool
Vorhandenes Schema
Vorhandener Test Helper
```

Verboten ist das Auftreten von:

```text
PhysicsScene2
NewPhysicsScene
AnotherUnitSystem
ToolRegistryV2
```

Nur weil der Code nicht zuerst gelesen wurde.

---

# 137. KI-Agent darf keine themenfremden Änderungen vornehmen

Aufgabe:

```text
Magnetfeld-Bahn korrigieren
```

Verboten, beiläufig zu:

```text
Startseite neu schreiben
Alle Abhängigkeiten aktualisieren
Gesamtes Repository formatieren
Agent umstrukturieren
```

---

# 138. KI-Agent darf nicht vorgeben, fertig zu sein

Darf nicht als abgeschlossen gelten:

```text
UI hat Button aber keine Funktion
Hard-coded Result zurückgeben
Simulation nutzt Mock
Agent nutzt vorgefertigte Antworten
Tool nicht an Runtime angebunden
Nur Happy Path implementiert
```

---

# 139. KI-Agent muss tatsächlich verifizieren

Vor Aufgabenabschluss mindestens folgende Prüfungen ausführen:

```text
typecheck
lint
unit tests
golden tests
build
```

Je nach Umfang ergänzen:

```text
integration
e2e
```

---

# 140. KI-Agent-Abschlussbericht

Muss ausgeben:

```text
Abgeschlossene Inhalte
Geänderte Dateien
Wesentliche Designentscheidungen
Ob Contract sich geändert hat
Testbefehle
Testergebnisse
Unvollständige Inhalte
Risiken
```

---

# 141. Multi-Agent-Kollaboration

Vor paralleler Entwicklung müssen folgende Punkte geklärt sein:

```text
Owner Module
Allowed Files
Shared Contracts
Integration Point
```

Vermeiden, dass mehrere Agents gleichzeitig den Kern-Contract ändern.

---

# 142. Sperre für Shared-Contract-Änderungen

Änderungen an folgenden Dateien/Modulen erfordern serielle Koordination:

```text
03-DOMAIN-CONTRACTS.md
physics-scene public API
physics-ir public API
Tool Schema
Physics Event Schema
SimulationResult
```

---

# 143. Fertigstellungsdefinition (Definition of Done)

Eine Funktion gilt nur als abgeschlossen, wenn alle folgenden Bedingungen erfüllt sind:

```text
Echter Code fertiggestellt
Echte Funktionalität angebunden
Typprüfung bestanden
Lint bestanden
```Unit-Test bestanden
Zugehörige Physics Golden Tests bestanden
Notwendige Contract-Tests bestanden
Build bestanden
Notwendige E2E-Tests bestanden
Keine Kern-Mocks
Keine Scheinerfolge
Keine versteckten Fehler
Contract synchronisiert
Dokumentation synchronisiert
```

---

# 144. Nicht als abgeschlossen geltende Situationen

Folgende Situationen gelten explizit **nicht** als abgeschlossen:

```text
Seite fertig, aber kein Backend
Tool registriert, aber execute ist TODO
Agent-Antwort sieht richtig aus, ruft aber Physics Engine nicht auf
Scene kann angezeigt werden, aber nicht speichern/replay
Tests werden übersprungen (skip)
Schnittstelle verwendet festes JSON
```

---

# 145. Package README-Anforderungen

Wichtige Pakete müssen ein README mit folgenden Angaben haben:

```text
Purpose (Zweck)
Responsibilities (Verantwortlichkeiten)
Public API
Allowed Dependencies (Erlaubte Abhängigkeiten)
Forbidden Dependencies (Verbotene Abhängigkeiten)
Contracts
Usage Example (Verwendungsbeispiel)
Test Command (Testbefehl)
```

---

# 146. Code Review Checkliste

Review prüft mindestens:

```text
Verletzung von Domänengrenzen?
Entstehung einer zweiten Faktenquelle?
Umgehung von Tools?
Einheitensicherheit (Unit Safety)?
Änderung am Contract?
Verwendung von 'any'?
Vorhandensein von Tests?
Regressionsrisiken?
Sicherheitsprobleme?
Unzusammenhängende Änderungen?
```

---

# 147. Physics Review Checkliste

Physics Engine PR zusätzlich prüfen:

```text
Formel-Gültigkeitsbedingungen
Einheiten
Richtung
Randbedingungen
Extremeingaben
Numerische Fehler
Erhaltungsbeziehungen
Golden Case
```

---

# 148. Agent Review Checkliste

Agent PR zusätzlich prüfen:

```text
Prompt Scope
Tool Scope
Permission (Berechtigung)
Structured Output (Strukturierte Ausgabe)
Context Size (Kontextgröße)
Compaction (Kompaktierung)
Retry (Wiederholung)
Trace (Verfolgung)
Ob LLM physikalische Fakten entscheidet
```

---

# 149. UI Review Checkliste

UI PR zusätzlich prüfen:

```text
Entspricht hellem visuellen Stil?
Großflächiges Violett vorhanden?
Physics Canvas als Hauptakteur?
Übermäßige Kartendarstellung (Card-Überladung)?
Tastaturbedienung möglich?
Korrekte Reaktion auf gängige Desktop-Auflösungen?
```

---

# 150. Performance Review

Hochfrequente Module prüfen:

```text
Verursacht React hochfrequente Re-Renders?
Lange Haupt-Thread-Aufgaben?
Unbegrenzte Trajektorien-Speicherung?
O(n²) unbeschränktes Wachstum vorhanden?
Worker-Auslagerung möglich?
```

---

# 151. Contract First

Prioritätsreihenfolge für neue funktionsübergreifende Fähigkeiten:

```text
Zuerst Contract definieren
↓
Contract Test schreiben
↓
Producer implementieren
↓
Consumer implementieren
```

Nicht beide Seiten raten unabhängig das Datenformat.

---

# 152. Versioning

Öffentliche Contracts müssen besitzen:

```text
schemaVersion
```

Beispiel:

```text
physics-scene/1.0
physics-ir/1.0
diagram-ir/1.0
```

---

# 153. Migration

Brechende Contract-Änderungen müssen bereitstellen:

```text
Migration
```

Darf nicht verlangen, dass alle historischen Daten sofort ungültig werden.

---

# 154. Deprecation

Vor Löschung öffentlicher APIs:

```text
deprecated (veraltet)
migration path (Migrationspfad)
removal version (Entfernungsversion)
```

Explizit kommunizieren.

---

# 155. Feature-Entwicklungsstandardprozess

Empfohlener einheitlicher Prozess:

```text
Anforderungen verstehen
↓
Domain bestätigen
↓
Contract bestätigen
↓
Abhängigkeitsrichtung bestätigen
↓
Tests nachrüsten
↓
Implementieren
↓
Verifizieren
↓
Dokumentieren
↓
Review
```

---

# 156. Physics-Funktionsentwicklungsstandardprozess

Beispiel Neuerstellung:

```text
Geladenes Teilchen betritt rechteckiges Magnetfeld
```

Entwicklungsreihenfolge:

```text
Scene-Fähigkeiten definieren
↓
Region / Boundary Contract definieren
↓
Golden Case hinzufügen
↓
Magnetic Engine implementieren
↓
Verifier implementieren
↓
Observation hinzufügen
↓
Renderer-Darstellung
↓
Tool-Schnittstelle
↓
Skill
↓
Question Pattern
↓
E2E
```

---

# 157. Question-Funktionsstandardprozess

```text
Aufgabentyp definieren
↓
Physics IR
↓
Diagram IR Unterstützung
↓
Parser
↓
Scene Builder
↓
Engine
↓
Verifier
↓
Tutor
↓
Dynamic Variation (Dynamische Variation)
```

---

# 158. Tool-Entwicklungsprozess

```text
Tool Contract
↓
Schema
↓
Permission (Berechtigung)
↓
Handler
↓
Domain Validation (Domänenvalidierung)
↓
Contract Test
↓
Agent Scope
↓
Documentation (Dokumentation)
```

---

# 159. Skill-Entwicklungsprozess

```text
Concept (Konzept)
↓
Rules (Regeln)
↓
Prerequisites (Voraussetzungen)
↓
Misconceptions (Fehlvorstellungen)
↓
Visualization (Visualisierung)
↓
Tools
↓
Teaching Strategy (Lehrstrategie)
↓
Verification (Verifikation)
↓
Question Pattern (Aufgabenmuster)
↓
Examples (Beispiele)
```

---

# 160. Endgültige Architektur-Rotlinien-Checkliste

Tritt einer der folgenden Punkte auf, muss er behoben werden:

1. LLM entscheidet direkt echte physikalische Ergebnisse;
2. UI berechnet direkt Kern-Physics-Results;
3. Renderer berechnet physikalische Gesetzmäßigkeiten;
4. Agent umgeht Tool und modifiziert PhysicsScene;
5. Physics Core hängt von React ab;
6. Physics Core hängt von DeepSeek Harness ab;
7. PhysicsScene speichert Pixi/Three-Objekte;
8. Zustand wird zum zweiten PhysicsScene;
9. Kernphysikalische Größen ohne Einheitenverwaltung;
10. 2D und 3D pflegen jeweils unterschiedliche physikalische Fakten;
11. Tool verwendet einen einzelnen prompt-Parameter für alles;
12. Context Summary ersetzt Scene;
13. Web und Desktop kopieren Business-Code;
14. Module definieren eigenmächtig doppelte Contracts;
15. Redis wird zur einzigen permanenten Daten-Faktenquelle;
16. LLM als erster Physics Verifier;
17. Fehlschlagende Tests löschen, damit CI besteht;
18. Mocks als Fertigstellung vortäuschen;
19. Agent modifiziert fremde Module;
20. Contract ändert sich, aber Dokumentation und Migration werden nicht aktualisiert.

---

# 161. Engineering-Qualitätsziele

PhysicsOS misst sich **nicht** an:

> **„Funktioniert vorerst“**

als Engineering-Standard.

Langfristig muss gelten:

```text
Correct (Korrekt)
Deterministic (Deterministisch)
Traceable (Nachvollziehbar)
Replayable (Wiederholbar/Replay-fähig)
Testable (Testbar)
Verifiable (Verifizierbar)
Extensible (Erweiterbar)
Replaceable (Austauschbar)
Maintainable (Wartbar)
```

Also:

```text
Korrekt
Deterministisch
Nachvollziehbar
Wiederholbar
Testbar
Verifizierbar
Erweiterbar
Austauschbar
Wartbar
```

---

# 162. Endgültige Spezifikationsprinzipien

Alle Module müssen zwei Fragen eindeutig beantworten können:

> **Wofür bin ich verantwortlich?**

Und:

> **Wofür bin ich absolut NICHT verantwortlich?**

Nur so kann PhysicsOS bei vollständiger Abdeckung von Mittel- und Oberstufenphysik, Agent, Prüfungsverständnis, Echtzeitsimulation und zukünftigem Desktop langfristig wartbar bleiben.

---

# 163. Ein-Satz-Engineering-Regel

> **Keine Entwicklung darf „schnelle Umsetzung“ als Begründung anführen, um die PhysicsScene als einzelne Faktenquelle, die Deterministik der Physics Engine, funktionsübergreifende Contracts sowie die Tool-Guard-Grenze zwischen Agent und physikalischer Welt zu verletzen.**
