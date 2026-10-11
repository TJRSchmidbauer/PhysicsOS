# PhysicsOS Zentrale Domänen-Contracts

> Datei: `docs/03-DOMAIN-CONTRACTS.md`  
> Dokumentzweck: Gesamtspezifikation der modulübergreifenden zentralen Contracts / Schemas von PhysicsOS  
> Vorgelagerte Dokumente: `00-PRODUCT-OVERVIEW.md`, `01-DEVELOPMENT-GUIDE.md`, `02-ENGINEERING-STANDARDS.md`
>
> Dieses Dokument definiert die Datenverträge, die in PhysicsOS über Anwendungen, Packages, Services und Sprachen hinweg gemeinsam genutzt werden.
>
> **Die Stabilität eines Contracts steht über der internen Implementierung einzelner Module.**

---

# 1. Ziel des Dokuments

Dieses Dokument beantwortet eine Frage:

> **Welche Datenstrukturen verwenden die verschiedenen Module von PhysicsOS tatsächlich, um zusammenzuarbeiten?**

PhysicsOS umfasst:

```text
Web UI
PhysicsScene Runtime
Physics Engine
Observation Runtime
Renderer
Question Parser
Diagram Parser
Agent Runtime
DeepSeek Harness Adapter
Spring Boot API
Python Math Runtime
Künftiger Tauri Desktop
```

Diese Module dürfen nicht jeweils eigene Objekte definieren.

Sie müssen einheitliche Contracts teilen.

---

# 2. Contract First

Die modulübergreifende Funktionsentwicklung muss folgende Reihenfolge einhalten:

```text
Zuerst den Contract definieren
↓
Schema definieren
↓
Contract Test schreiben
↓
Producer implementieren
↓
Consumer implementieren
```

Verboten:

```text
Das Frontend schreibt zuerst ein JSON
Das Backend rät dann die Felder
Der Agent liefert wieder eine andere Struktur
```

---

# 3. Ausdrucksform von Contracts

Ein TypeScript-Interface ist nur eine Referenzimplementierung.

Ein formaler Contract sollte folgende erzeugen oder darauf abbildbar sein:

```text
JSON Schema
Zod Schema
OpenAPI Schema
Java DTO
Python Pydantic Model
TypeScript Type
```

Empfohlen:

```text
Schema Source of Truth
↓
Code Generation / Validation
↓
Multiple Runtimes
```

---

# 4. Schema Version

Alle wichtigen Top-Level-Contracts müssen enthalten:

```text
schemaVersion
```

Zum Beispiel:

```text
physics-scene/1.0
physics-ir/1.0
diagram-ir/1.0
simulation-result/1.0
agent-context/1.0
```

---

# 5. Breaking Change

Folgendes gilt als Breaking Change:

```text
Feld löschen
Feldsemantik ändern
Einheitensemantik ändern
Bedeutung einer ID ändern
Bedeutung eines Events ändern
Tool-Eingabe/-Ausgabe ändern
Beziehung zwischen Pflicht-/optionalen Feldern ändern
Enum-Semantik ändern
PhysicsScene-Invariante ändern
```

Ein Breaking Change muss:

```text
schemaVersion erhöhen
Migration hinzufügen
Kompatibilitätstests hinzufügen
Dieses Dokument aktualisieren
Consumer aktualisieren
```

---

# 6. ID Contract

Alle Domänenobjekte besitzen eine stabile ID.

Logische Typen:

```ts
type SceneId = string
type SnapshotId = string
type PhysicsEventId = string
type CommandId = string

type BodyId = string
type ParticleId = string
type FieldId = string
type ForceId = string
type RegionId = string
type BoundaryId = string
type ConstraintId = string
type CircuitId = string
type ComponentId = string
type ObservableId = string

type QuestionId = string
type ExamId = string
type DocumentId = string
type DiagramId = string

type SessionId = string
type RunId = string
type TurnId = string
type ToolCallId = string
type TraceId = string

type UserId = string
```

In TypeScript wird tatsächlich die Verwendung von Brands empfohlen.

```ts
type Brand<T, B extends string> = T & {
  readonly __brand: B
}

type SceneId = Brand<string, 'SceneId'>
type ParticleId = Brand<string, 'ParticleId'>
type FieldId = Brand<string, 'FieldId'>
```

---

# 7. ID-Regeln

IDs müssen:

```text
Global eindeutig oder innerhalb der Domäne stabil eindeutig sein
Nicht aus dem Anzeigenamen erzeugt werden
Sich durch Rename nicht ändern
Die ID gelöschter Objekte nicht wiederverwenden
```

Empfohlen:

```text
UUIDv7
ULID
```

Eine davon einheitlich wählen.

---

# 8. Zeit-Contract

Serviceübergreifende Zeit verwendet:

```text
ISO 8601 UTC
```

Zum Beispiel:

```text
2026-08-16T03:24:00.000Z
```

TypeScript:

```ts
type IsoDateTime = string
```

---

# 9. PhysicalDimension

Einheitliche physikalische Dimensionen.

```ts
type PhysicalDimension =
  | 'dimensionless'
  | 'length'
  | 'time'
  | 'mass'
  | 'electric_current'
  | 'temperature'
  | 'electric_charge'
  | 'velocity'
  | 'acceleration'
  | 'force'
  | 'energy'
  | 'power'
  | 'electric_field'
  | 'electric_potential'
  | 'magnetic_flux_density'
  | 'magnetic_flux'
  | 'resistance'
  | 'capacitance'
  | 'inductance'
  | 'frequency'
  | 'angle'
  | 'angular_velocity'
  | 'momentum'
  | 'pressure'
  | 'density'
```

Spätere Erweiterungen erfolgen einheitlich durch Änderung des Contracts.

---

# 10. Quantity

Alle Skalare mit physikalischer Bedeutung verwenden einheitlich:

```ts
interface Quantity<D extends PhysicalDimension = PhysicalDimension> {
  value: number

  unit: string

  dimension: D
}
```

Beispiel:

```json
{
  "value": 0.5,
  "unit": "T",
  "dimension": "magnetic_flux_density"
}
```

---

# 11. CanonicalQuantity

Die Physics Engine kann intern kanonisches SI verwenden:

```ts
interface CanonicalQuantity<D extends PhysicalDimension = PhysicalDimension> {
  valueSI: number
  dimension: D
}
```

UI-seitige Contracts können die Anzeigeeinheit beibehalten.

---

# 12. Unit Contract

Alle Einheiten müssen aus einer einheitlichen Unit Registry stammen.

Verboten ist es, folgende:

```text
"tesla"
"T "
"特斯拉"
"Tesla"
```

gleichzeitig als systeminterne Unit ID zu verwenden.

Empfohlen:

```text
m
s
kg
C
A
N
J
V
T
W
Ω
F
H
rad
Hz
```

Die Anzeigeschicht darf lokalisieren.

---

# 13. Scalar Precision

Wichtige Rechenergebnisse können mitliefern:

```ts
interface NumericMetadata {
  precision?: number
  absoluteTolerance?: number
  relativeTolerance?: number
}
```

Angezeigte Dezimalstellen sind nicht mit der Rechengenauigkeit gleichzusetzen.

---

# 14. Vector2

```ts
interface Vector2 {
  x: number
  y: number
}
```

---

# 15. Vector3

PhysicsOS verwendet für Domänenvektoren einheitlich:

```ts
interface Vector3 {
  x: number
  y: number
  z: number
}
```

2D-Welt:

```text
z = 0
```

---

# 16. QuantityVector

```ts
interface QuantityVector<D extends PhysicalDimension = PhysicalDimension> {
  vector: Vector3

  unit: string

  dimension: D
}
```

---

# 17. Angle

Winkel intern empfohlen:

```text
rad
```

Die UI kann anzeigen:

```text
°
```

Contract:

```ts
type AngleQuantity = Quantity<'angle'>
```

---

# 18. ActorRef

Jeder Akteur, der eine Scene verändert, muss seine Herkunft angeben.

```ts
interface ActorRef {
  type: 'user' | 'agent' | 'system' | 'teacher' | 'migration'

  id?: string
}
```

---

# 19. TraceContext

Modulübergreifender Trace:

```ts
interface TraceContext {
  traceId: TraceId

  userId?: UserId

  sessionId?: SessionId
  runId?: RunId
  turnId?: TurnId
  toolCallId?: ToolCallId

  sceneId?: SceneId
  sceneRevision?: number
  physicsEventId?: PhysicsEventId
}
```

---

# 20. PhysicsDomain

```ts
type PhysicsDomain =
  | 'mechanics'
  | 'kinematics'
  | 'gravity'
  | 'electric'
  | 'magnetic'
  | 'electromagnetic'
  | 'circuit'
  | 'induction'
  | 'optics'
  | 'wave'
  | 'thermal'
  | 'modern_physics'
  | 'composite'
```

---

# 21. SceneDimension

```ts
type SceneDimension = '2d' | '3d'
```

---

# 22. CoordinateSystem

```ts
interface CoordinateSystem {
  type: 'cartesian'

  origin: Vector3

  axes: {
    x: Vector3
    y: Vector3
    z: Vector3
  }

  lengthUnit: string
}
```

---

# 23. TimelineState

```ts
type TimelineState = 'idle' | 'running' | 'paused' | 'completed' | 'error'
```

---

# 24. Timeline

```ts
interface Timeline {
  currentTime: Quantity<'time'>

  startTime: Quantity<'time'>

  endTime?: Quantity<'time'>

  state: TimelineState

  playbackRate: number

  simulationTimeStep?: Quantity<'time'>
}
```

---

# 25. SceneMetadata

```ts
interface SceneMetadata {
  createdAt: IsoDateTime
  updatedAt: IsoDateTime

  createdBy?: ActorRef

  title?: string
  description?: string

  curriculumTags?: string[]
  knowledgeTags?: string[]

  sourceQuestionId?: QuestionId

  engineVersion?: string
}
```

---

# 26. PhysicsScene

Der zentralste Contract von PhysicsOS:

```ts
interface PhysicsScene {
  schemaVersion: 'physics-scene/1.0'

  id: SceneId
  revision: number

  dimension: SceneDimension

  coordinateSystem: CoordinateSystem

  timeline: Timeline

  bodies: Body[]
  particles: Particle[]
  fields: Field[]
  forces: Force[]
  regions: Region[]
  boundaries: Boundary[]
  constraints: Constraint[]
  circuits: Circuit[]

  measurementDefinitions: MeasurementDefinition[]

  observableDefinitions: ObservableDefinition[]

  annotations: SceneAnnotation[]

  metadata: SceneMetadata
}
```

---

# 27. Scene-Revision-Invariante

`revision` muss:

```text
Ganzzahl sein
>= 0
Monoton steigen
```

Bei jeder erfolgreichen Scene Mutation:

```text
revision + 1
```

---

# 28. PhysicsObjectBase

```ts
interface PhysicsObjectBase {
  id: string

  name?: string

  enabled?: boolean

  tags?: string[]

  metadata?: Record<string, unknown>
}
```

---

# 29. ShapeDefinition

```ts
type ShapeDefinition = CircleShape | RectangleShape | PolygonShape | SegmentShape | PointShape
```

Beispiel:

```ts
interface CircleShape {
  type: 'circle'
  radius: Quantity<'length'>
}
```

---

# 30. MaterialDefinition

```ts
interface MaterialDefinition {
  density?: Quantity<'density'>

  frictionCoefficient?: number

  restitution?: number

  custom?: Record<string, unknown>
}
```

---

# 31. Body

```ts
interface Body extends PhysicsObjectBase {
  type: 'rigid_body'

  mass: Quantity<'mass'>

  position: QuantityVector<'length'>

  velocity: QuantityVector<'velocity'>

  acceleration?: QuantityVector<'acceleration'>

  shape: ShapeDefinition

  material?: MaterialDefinition

  fixed?: boolean
}
```

---

# 32. Particle

```ts
interface Particle extends PhysicsObjectBase {
  type: 'particle'

  mass: Quantity<'mass'>

  charge?: Quantity<'electric_charge'>

  position: QuantityVector<'length'>

  velocity: QuantityVector<'velocity'>

  acceleration?: QuantityVector<'acceleration'>

  species?: string
}
```

---

# 33. Body- / Particle-Invariante

Erforderlich:

```text
mass > 0
position finite
velocity finite
Alle Units gültig
ID eindeutig
```

---

# 34. Field Base

```ts
interface FieldBase extends PhysicsObjectBase {
  regionId?: RegionId
}
```

---

# 35. UniformElectricField

```ts
interface UniformElectricField extends FieldBase {
  type: 'uniform_electric'

  fieldStrength: QuantityVector<'electric_field'>
}
```

---

# 36. UniformMagneticField

```ts
interface UniformMagneticField extends FieldBase {
  type: 'uniform_magnetic'

  magneticFluxDensity: QuantityVector<'magnetic_flux_density'>
}
```

---

# 37. GravityField

```ts
interface GravityField extends FieldBase {
  type: 'uniform_gravity'

  acceleration: QuantityVector<'acceleration'>
}
```

---

# 38. PointChargeField

```ts
interface PointChargeField extends FieldBase {
  type: 'point_charge'

  sourceParticleId: ParticleId
}
```

---

# 39. Field Union

```ts
type Field = UniformElectricField | UniformMagneticField | GravityField | PointChargeField
```

Künftige Erweiterungen müssen über einen neuen discriminated type erfolgen.

---

# 40. ForceType

```ts
type ForceType =
  | 'gravity'
  | 'normal'
  | 'friction'
  | 'tension'
  | 'spring'
  | 'electric'
  | 'lorentz'
  | 'ampere'
  | 'drag'
  | 'custom'
```

---

# 41. Force

```ts
interface Force extends PhysicsObjectBase {
  type: ForceType

  targetId: string

  sourceId?: string

  vector?: QuantityVector<'force'>

  derived?: boolean

  model?: string
}
```

---

# 42. Derived Force

Zum Beispiel:

```text
Lorentz Force
Gravity
Normal Force
```

können von der Engine dynamisch berechnet werden.

`vector` muss nicht persistiert werden.

Wenn `derived = true`:

```text
PhysicsScene speichert die Modellbeziehung
SimulationResult speichert das Ergebnis zu einem Zeitpunkt
```

---

# 43. RegionShape

```ts
type RegionShape = RectangleRegion | CircleRegion | PolygonRegion | HalfPlaneRegion
```

---

# 44. Region

```ts
interface Region extends PhysicsObjectBase {
  type: 'region'

  shape: RegionShape

  properties?: Record<string, unknown>
}
```

Eine Region kann darstellen:

```text
Magnetfeldbereich
Elektrofeldbereich
Medienbereich
Kollisionsbereich
Optisches Medium
```

---

# 45. BoundaryType

```ts
type BoundaryType = 'line' | 'segment' | 'circle' | 'rectangle' | 'polygon'
```

---

# 46. Boundary

```ts
interface Boundary extends PhysicsObjectBase {
  type: BoundaryType

  geometry: GeometryDefinition

  behavior?: BoundaryBehavior
}
```

---

# 47. BoundaryBehavior

```ts
type BoundaryBehavior =
  | {
      type: 'pass_through'
    }
  | {
      type: 'reflect'
      restitution?: number
    }
  | {
      type: 'stop'
    }
  | {
      type: 'custom'
      model: string
    }
```

---

# 48. ConstraintType

```ts
type ConstraintType =
  'fixed' | 'distance' | 'rope' | 'hinge' | 'surface' | 'spring' | 'track' | 'custom'
```

---

# 49. Constraint

```ts
interface Constraint extends PhysicsObjectBase {
  type: ConstraintType

  targets: string[]

  parameters: Record<string, unknown>
}
```

---

# 50. Circuit

```ts
interface Circuit extends PhysicsObjectBase {
  type: 'circuit'

  nodes: CircuitNode[]

  components: CircuitComponent[]

  connections: CircuitConnection[]
}
```

---

# 51. CircuitNode

```ts
interface CircuitNode {
  id: string
  label?: string
}
```

---

# 52. CircuitTerminal

```ts
interface CircuitTerminal {
  id: string

  componentId: ComponentId

  terminalKey: string
}
```

---

# 53. CircuitConnection

```ts
interface CircuitConnection {
  id: string

  from: CircuitTerminal

  to: CircuitTerminal
}
```

---

# 54. CircuitComponent Base

```ts
interface CircuitComponentBase {
  id: ComponentId

  name?: string

  enabled?: boolean
}
```

---

# 55. Resistor

```ts
interface Resistor extends CircuitComponentBase {
  type: 'resistor'

  resistance: Quantity<'resistance'>
}
```

---

# 56. VoltageSource

```ts
interface VoltageSource extends CircuitComponentBase {
  type: 'voltage_source'

  voltage: Quantity<'electric_potential'>

  internalResistance?: Quantity<'resistance'>
}
```

---

# 57. Switch

```ts
interface CircuitSwitch extends CircuitComponentBase {
  type: 'switch'

  state: 'open' | 'closed'
}
```

---

# 58. Ammeter

```ts
interface Ammeter extends CircuitComponentBase {
  type: 'ammeter'

  internalResistance?: Quantity<'resistance'>
}
```

---

# 59. Voltmeter

```ts
interface Voltmeter extends CircuitComponentBase {
  type: 'voltmeter'

  internalResistance?: Quantity<'resistance'>
}
```

---

# 60. VariableResistor

```ts
interface VariableResistor extends CircuitComponentBase {
  type: 'variable_resistor'

  totalResistance: Quantity<'resistance'>

  sliderPosition: number
}
```

`sliderPosition`:

```text
0 <= sliderPosition <= 1
```

---

# 61. Capacitor

```ts
interface Capacitor extends CircuitComponentBase {
  type: 'capacitor'

  capacitance: Quantity<'capacitance'>

  initialVoltage?: Quantity<'electric_potential'>
}
```

---

# 62. Inductor

```ts
interface Inductor extends CircuitComponentBase {
  type: 'inductor'

  inductance: Quantity<'inductance'>
}
```

---

# 63. CircuitComponent Union

```ts
type CircuitComponent =
  | Resistor
  | VoltageSource
  | CircuitSwitch
  | Ammeter
  | Voltmeter
  | VariableResistor
  | Capacitor
  | Inductor
```

---

# 64. MeasurementDefinition

```ts
interface MeasurementDefinition {
  id: string

  type:
    | 'position'
    | 'velocity'
    | 'acceleration'
    | 'force'
    | 'energy'
    | 'current'
    | 'voltage'
    | 'electric_field'
    | 'magnetic_field'
    | 'custom'

  targetId?: string

  componentId?: ComponentId

  enabled: boolean
}
```

---

# 65. ObservableType

```ts
type ObservableType =
  | 'force'
  | 'velocity'
  | 'acceleration'
  | 'momentum'
  | 'trajectory'
  | 'electric_field'
  | 'electric_potential'
  | 'magnetic_field'
  | 'energy'
  | 'current'
  | 'voltage'
  | 'measurement'
  | 'graph'
  | 'geometry'
  | 'annotation'
```

---

# 66. ObservableDefinition

```ts
interface ObservableDefinition {
  id: ObservableId

  type: ObservableType

  targetId?: string

  visible: boolean

  style?: ObservationStyle

  parameters?: Record<string, unknown>
}
```

---

# 67. ObservationStyle

Der Domänen-Contract speichert nur semantische Styles, keine Pixi-/Three-Objekte.

```ts
interface ObservationStyle {
  emphasis?: 'normal' | 'highlight'

  labelVisible?: boolean

  scale?: number

  token?: string
}
```

`token` entspricht einem UI Design Token.

---

# 68. SceneAnnotation

```ts
interface SceneAnnotation {
  id: string

  type: 'label' | 'formula' | 'marker' | 'guide' | 'teacher_note'

  targetId?: string

  content: string

  visible: boolean
}
```

---

# 69. SceneCommand

```ts
type SceneCommandType =
  | 'SetParticleCharge'
  | 'SetParticleMass'
  | 'SetParticleVelocity'
  | 'SetMagneticFieldStrength'
  | 'SetMagneticFieldDirection'
  | 'SetObservableEnabled'

interface SceneCommand<TType extends SceneCommandType = SceneCommandType, TPayload = unknown> {
  schemaVersion: 'scene-command/1.0'

  commandId: CommandId

  sceneId: SceneId

  expectedRevision: number

  type: TType

  payload: TPayload

  actor: ActorRef

  trace: TraceContext

  issuedAt: IsoDateTime
}
```

Die Payloads der aktuellen Magnetic Runtime sind festgelegt auf:

```ts
interface SceneCommandPayloadMap {
  SetParticleCharge: {
    particleId: string
    charge: Quantity<'electric_charge'>
  }
  SetParticleMass: {
    particleId: string
    mass: Quantity<'mass'>
  }
  SetParticleVelocity: {
    particleId: string
    velocity: QuantityVector<'velocity'>
  }
  SetMagneticFieldStrength: {
    fieldId: string
    strength: Quantity<'magnetic_flux_density'>
  }
  SetMagneticFieldDirection: {
    fieldId: string
    direction: 'into_page' | 'out_of_page'
  }
  SetObservableEnabled: {
    observableId: ObservableId
    enabled: boolean
  }
}
```

---

# 70. SceneCommandResult

```ts
type SceneCommandResult =
  | {
      ok: true

      sceneId: SceneId

      previousRevision: number

      newRevision: number

      eventIds: PhysicsEventId[]

      traceId: TraceId
    }
  | {
      ok: false

      error: DomainError

      traceId: TraceId
    }
```

---

# 71. PhysicsEvent

```ts
interface PhysicsEvent<TPayload = unknown> {
  schemaVersion: 'physics-event/1.0'

  eventId: PhysicsEventId

  commandId: CommandId

  sceneId: SceneId

  revision: number

  type: string

  payload: TPayload

  actor: ActorRef

  occurredAt: IsoDateTime

  trace: TraceContext
}
```

---

# 72. Physics-Event-Typen

Zu den zentralen Events gehören:

```text
SceneCreated

BodyAdded
BodyRemoved
BodyParameterChanged

ParticleAdded
ParticleRemoved
ParticleParameterChanged
ParticleChargeChanged
ParticleMassChanged
ParticleVelocityChanged

FieldAdded
FieldRemoved
FieldChanged
MagneticFieldStrengthChanged
MagneticFieldDirectionChanged

ForceAdded
ForceRemoved

RegionAdded
RegionChanged
RegionRemoved

BoundaryAdded
BoundaryChanged
BoundaryRemoved

ConstraintAdded
ConstraintRemoved

CircuitAdded
CircuitChanged

TimelineSeeked
SimulationStarted
SimulationPaused
SimulationCompleted
SimulationFailed

ParticleEnteredRegion
ParticleExitedRegion
CollisionOccurred

ObservableEnabled
ObservableDisabled
```

---

# 73. SceneSnapshot

```ts
interface SceneSnapshot {
  schemaVersion: 'scene-snapshot/1.0'

  id: SnapshotId

  sceneId: SceneId

  revision: number

  scene: PhysicsScene

  createdAt: IsoDateTime

  hash: string
}
```

---

# 74. Snapshot Hash

Empfohlen:

```text
SHA-256
```

Verwendet für:

```text
Integrity
Cache
Replay Verification
Export Validation
```

---

# 75. SimulationId

```ts
type SimulationId = Brand<string, 'SimulationId'>
```

---

# 76. SimulationRequest

```ts
interface SimulationRequest {
  schemaVersion: 'simulation-request/1.0'

  simulationId: SimulationId

  sceneId: SceneId

  sceneRevision: number

  requestedDomain?: PhysicsDomain

  options: SimulationOptions

  trace: TraceContext
}
```

---

# 77. SimulationOptions

```ts
interface SimulationOptions {
  startTime?: Quantity<'time'>

  endTime?: Quantity<'time'>

  timeStep?: Quantity<'time'>

  outputSampleRate?: number

  solver?: string

  tolerance?: {
    absolute: number
    relative: number
  }

  maxIterations?: number

  randomSeed?: number
}
```

---

# 78. ObjectState

```ts
interface ObjectState {
  id: string

  position?: QuantityVector<'length'>

  velocity?: QuantityVector<'velocity'>

  acceleration?: QuantityVector<'acceleration'>

  values?: Record<string, Quantity | QuantityVector>
}
```

---

# 79. SimulationState

```ts
interface SimulationState {
  time: Quantity<'time'>

  objects: ObjectState[]

  derived: DerivedQuantity[]
}
```

---

# 80. DerivedQuantity

```ts
interface DerivedQuantity {
  key: string

  targetId?: string

  value: Quantity | QuantityVector

  formula?: FormulaRef

  assumptions?: string[]

  confidence?: number
}
```

Die Modellannahmen von `SimulationResult` erhalten kein doppeltes Feld. Die Engine muss die tatsächlich verwendeten Annahmen in
`derivedQuantities[].assumptions` schreiben; der Verifier aggregiert und verifiziert sie aus diesen Physics Facts. Die aktuelle
Magnetic Runtime führt mindestens mit:

```text
uniform magnetic field
velocity perpendicular B
magnetic force only
ignore electric field
ignore gravity
```

Zum Beispiel:

```text
net_force
orbit_radius
period
angular_velocity
kinetic_energy
electric_potential_energy
branch_current
induced_emf
```

---

# 81. FormulaRef

```ts
interface FormulaRef {
  id?: string

  expression: string

  latex?: string

  variables?: Record<string, string>

  conditions?: string[]
}
```

---

# 82. Measurement

```ts
interface Measurement {
  id: string

  definitionId?: string

  time?: Quantity<'time'>

  targetId?: string

  value: Quantity | QuantityVector

  source: 'simulation' | 'derived' | 'instrument' | 'user'

  metadata?: Record<string, unknown>
}
```

---

# 83. SimulationMetadata

```ts
interface SimulationMetadata {
  engineId: string

  engineVersion: string

  solver?: string

  startedAt: IsoDateTime

  finishedAt: IsoDateTime

  durationMs: number

  deterministic: boolean

  randomSeed?: number
}
```

---

# 84. SimulationResult

```ts
interface SimulationResult {
  schemaVersion: 'simulation-result/1.0'

  simulationId: SimulationId

  sceneId: SceneId

  sceneRevision: number

  states: SimulationState[]

  events: PhysicsEvent[]

  measurements: Measurement[]

  derivedQuantities: DerivedQuantity[]

  verification: VerificationResult

  metadata: SimulationMetadata

  trace: TraceContext
}
```

---

# 85. VerificationStatus

```ts
type VerificationStatus = 'passed' | 'passed_with_warnings' | 'failed'
```

---

# 86. VerificationCheckType

```ts
type VerificationCheckType =
  | 'schema'
  | 'dimension'
  | 'symbolic'
  | 'numerical'
  | 'constraint'
  | 'conservation'
  | 'boundary'
  | 'trajectory'
  | 'continuity'
  | 'semantic'
```

---

# 87. VerificationCheck

```ts
interface VerificationCheck {
  id: string

  type: VerificationCheckType

  passed: boolean

  message?: string

  targetId?: string

  details?: Record<string, unknown>
}
```

---

# 88. VerificationIssue

```ts
interface VerificationIssue {
  code: string

  severity: 'warning' | 'error'

  message: string

  targetId?: string

  details?: Record<string, unknown>
}
```

---

# 89. VerificationResult

```ts
interface VerificationResult {
  status: VerificationStatus

  checks: VerificationCheck[]

  warnings: VerificationIssue[]

  errors: VerificationIssue[]
}
```

---

# 90. Rolle von Physics IR

Physics IR ist:

> **Die formale Zwischenschicht von der Welt der natürlichen Sprache / Klausur zur Welt von PhysicsScene.**

Verboten:

```text
Question
↓
LLM
↓
Direkt Canvas
```

Erforderlich:

```text
Question
↓
Physics IR
↓
Scene Builder
↓
PhysicsScene
```

---

# 91. PhysicsIR

```ts
interface PhysicsIR {
  schemaVersion: 'physics-ir/1.0'

  problemId: string

  domain: PhysicsDomain

  problemType: string

  objects: PhysicsObjectIR[]

  regions: PhysicsRegionIR[]

  knownValues: KnownValueIR[]

  unknownValues: UnknownValueIR[]

  initialConditions: InitialConditionIR[]

  constraints: PhysicsConstraintIR[]

  relations: PhysicsRelationIR[]

  targets: PhysicsTargetIR[]

  diagramRefs: DiagramId[]

  knowledgeTags: string[]

  assumptions: PhysicsAssumptionIR[]

  confidence: number

  source: IRSourceMetadata
}
```

---

# 92. IRSourceMetadata

```ts
interface IRSourceMetadata {
  questionId?: QuestionId

  documentId?: DocumentId

  parserVersion?: string

  createdAt: IsoDateTime
}
```

---

# 93. PhysicsObjectIR

```ts
interface PhysicsObjectIR {
  id: string

  type:
    | 'body'
    | 'particle'
    | 'field'
    | 'region'
    | 'boundary'
    | 'circuit_component'
    | 'optical_element'
    | 'wave_source'

  attributes: Record<string, unknown>

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 94. PhysicsRegionIR

```ts
interface PhysicsRegionIR {
  id: string

  type: string

  geometryRef?: string

  attributes: Record<string, unknown>

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 95. KnownValueIR

```ts
interface KnownValueIR {
  id: string

  symbol?: string

  property: string

  targetId?: string

  value: Quantity

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 96. UnknownValueIR

```ts
interface UnknownValueIR {
  id: string

  symbol?: string

  property: string

  targetId?: string

  expectedDimension?: PhysicalDimension
}
```

---

# 97. InitialConditionIR

```ts
interface InitialConditionIR {
  id: string

  targetId: string

  property: string

  value: Quantity | QuantityVector | string | boolean

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 98. PhysicsConstraintIR

```ts
interface PhysicsConstraintIR {
  id: string

  type: string

  targets: string[]

  expression?: string

  parameters?: Record<string, unknown>

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 99. PhysicsRelationIR

```ts
interface PhysicsRelationIR {
  id: string

  type: string

  targets: string[]

  expression?: string

  parameters?: Record<string, unknown>

  confidence: number
}
```

---

# 100. PhysicsTargetIR

```ts
interface PhysicsTargetIR {
  id: string

  key: string

  targetId?: string

  expectedDimension?: PhysicalDimension
}
```

---

# 101. PhysicsAssumptionIR

```ts
interface PhysicsAssumptionIR {
  id: string

  description: string

  type: 'explicit' | 'implicit' | 'modeling'

  sourceEvidence?: EvidenceRef[]

  confidence: number
}
```

---

# 102. Confidence

Einheitlich:

```text
0 <= confidence <= 1
```

Nicht vermischen:

```text
95
```

und:

```text
0.95
```

---

# 103. EvidenceRef

Zentrale Beurteilungen in Physics IR sollen möglichst nachvollziehbar sein.

```ts
interface EvidenceRef {
  source: 'text' | 'image' | 'diagram' | 'metadata'

  documentId?: DocumentId

  page?: number

  textRange?: {
    start: number
    end: number
  }

  boundingBox?: BoundingBox

  diagramElementId?: string

  excerpt?: string
}
```

---

# 104. BoundingBox

Einheitlich normalisierte Koordinaten:

```ts
interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}
```

Einschränkung:

```text
0 <= x,y,width,height <= 1
```

---

# 105. Rolle von Diagram IR

Diagram IR wandelt:

```text
Schiefe-Ebene-Diagramme
Schaltpläne
Magnetfeldbereich-Diagramme
Strahlengänge
Koordinatendiagramme
Kräftediagramme
```

in strukturierte Grafiken um.

---

# 106. DiagramIR

```ts
interface DiagramIR {
  schemaVersion: 'diagram-ir/1.0'

  id: DiagramId

  canvas: DiagramCanvas

  elements: DiagramElement[]

  relations: DiagramRelation[]

  source: DiagramSource

  confidence: number
}
```

---

# 107. DiagramCanvas

```ts
interface DiagramCanvas {
  width: number

  height: number

  coordinateSpace: 'pixel' | 'normalized'
}
```

---

# 108. DiagramSource

```ts
interface DiagramSource {
  documentId?: DocumentId

  page?: number

  boundingBox?: BoundingBox
}
```

---

# 109. DiagramPoint

```ts
interface DiagramPoint {
  id: string

  type: 'point'

  x: number
  y: number

  label?: string

  confidence: number
}
```

---

# 110. DiagramLine

```ts
interface DiagramLine {
  id: string

  type: 'line'

  start: Vector2
  end: Vector2

  style?: string

  confidence: number
}
```

---

# 111. DiagramArc

```ts
interface DiagramArc {
  id: string

  type: 'arc'

  center: Vector2

  radius: number

  startAngle?: number

  endAngle?: number

  confidence: number
}
```

---

# 112. DiagramArrow

```ts
interface DiagramArrow {
  id: string

  type: 'arrow'

  start: Vector2

  end: Vector2

  label?: string

  confidence: number
}
```

---

# 113. DiagramLabel

```ts
interface DiagramLabel {
  id: string

  type: 'label'

  text: string

  position: Vector2

  confidence: number
}
```

---

# 114. DiagramBody

```ts
interface DiagramBody {
  id: string

  type: 'body'

  shape: string

  boundingBox: BoundingBox

  label?: string

  confidence: number
}
```

---

# 115. DiagramFieldRegion

```ts
interface DiagramFieldRegion {
  id: string

  type: 'field_region'

  fieldType: 'electric' | 'magnetic' | 'unknown'

  shape: string

  boundingBox?: BoundingBox

  directionHint?: string

  confidence: number
}
```

---

# 116. DiagramWire

```ts
interface DiagramWire {
  id: string

  type: 'wire'

  points: Vector2[]

  confidence: number
}
```

---

# 117. DiagramComponent

```ts
interface DiagramComponent {
  id: string

  type: 'circuit_component'

  componentType: string

  boundingBox: BoundingBox

  label?: string

  confidence: number
}
```

---

# 118. DiagramCoordinate

```ts
interface DiagramCoordinate {
  id: string

  type: 'coordinate'

  origin: Vector2

  xDirection: Vector2

  yDirection: Vector2

  labels?: string[]

  confidence: number
}
```

---

# 119. DiagramElement Union

```ts
type DiagramElement =
  | DiagramPoint
  | DiagramLine
  | DiagramArc
  | DiagramArrow
  | DiagramLabel
  | DiagramBody
  | DiagramFieldRegion
  | DiagramWire
  | DiagramComponent
  | DiagramCoordinate
```

---

# 120. DiagramRelation

```ts
interface DiagramRelation {
  id: string

  type:
    | 'connected_to'
    | 'inside'
    | 'intersects'
    | 'parallel'
    | 'perpendicular'
    | 'tangent'
    | 'labeled_by'
    | 'points_to'
    | 'custom'

  sourceId: string

  targetId: string

  confidence: number
}
```

---

# 121. QuestionDocument

```ts
interface QuestionDocument {
  schemaVersion: 'question-document/1.0'

  id: QuestionId

  type: 'single_question' | 'exam_question'

  source: QuestionSource

  stem: string

  options?: QuestionOption[]

  images: QuestionImage[]

  diagramRefs: DiagramId[]

  physicsIR?: PhysicsIR

  solution?: QuestionSolution

  metadata: QuestionMetadata
}
```

---

# 122. QuestionSource

```ts
interface QuestionSource {
  type: 'manual' | 'image' | 'pdf' | 'scan' | 'question_bank' | 'teacher'

  documentId?: DocumentId

  examId?: ExamId

  page?: number
}
```

---

# 123. QuestionImage

```ts
interface QuestionImage {
  id: string

  objectKey: string

  contentType: string

  boundingBox?: BoundingBox

  page?: number
}
```

---

# 124. QuestionOption

```ts
interface QuestionOption {
  key: string

  content: string

  imageRefs?: string[]
}
```

---

# 125. QuestionMetadata

```ts
interface QuestionMetadata {
  grade?: string

  difficulty?: 'basic' | 'medium' | 'advanced' | 'exam'

  knowledgeTags?: string[]

  createdAt: IsoDateTime

  updatedAt: IsoDateTime
}
```

---

# 126. QuestionSolution

```ts
interface QuestionSolution {
  schemaVersion: 'question-solution/1.0'

  strategy: string[]

  steps: SolutionStep[]

  finalAnswer?: AnswerValue

  formulas: FormulaRef[]

  verification?: VerificationResult
}
```

---

# 127. AnswerValue

```ts
type AnswerValue =
  | string
  | Quantity
  | QuantityVector
  | string[]
  | {
      expression: string
      latex?: string
    }
```

---

# 128. SolutionStep

```ts
interface SolutionStep {
  id: string

  title: string

  explanation: string

  formula?: FormulaRef

  sceneRevision?: number

  observationIds?: ObservableId[]

  evidenceRefs?: EvidenceRef[]
}
```

---

# 129. ExamDocument

```ts
interface ExamDocument {
  schemaVersion: 'exam-document/1.0'

  id: ExamId

  title?: string

  sourceDocumentId: DocumentId

  questionIds: QuestionId[]

  metadata: {
    grade?: string
    subject: 'physics'
    createdAt: IsoDateTime
  }
}
```

---

# 130. StudentAttempt

```ts
interface StudentAttempt {
  id: string

  userId: UserId

  questionId: QuestionId

  answer: AnswerValue

  submittedAt: IsoDateTime

  result?: AttemptResult

  diagnosticRefs?: string[]
}
```

---

# 131. AttemptResult

```ts
interface AttemptResult {
  correct?: boolean

  score?: number

  maxScore?: number

  feedback?: string
}
```

---

# 132. DynamicQuestion

```ts
interface DynamicQuestion {
  schemaVersion: 'dynamic-question/1.0'

  baseSceneId: SceneId

  baseSceneRevision: number

  difficulty: 'basic' | 'medium' | 'advanced' | 'exam'

  variablePolicy: VariablePolicy

  questionPatternId: string

  generatedQuestionId: QuestionId
}
```

---

# 133. VariablePolicy

```ts
interface VariablePolicy {
  mutableKeys: string[]

  fixedKeys?: string[]

  ranges?: Record<
    string,
    {
      min?: number
      max?: number
      values?: unknown[]
    }
  >

  preserveDifficulty?: boolean
}
```

---

# 134. Physics Tool Definition

Alle Tools verwenden einen einheitlichen Contract.

```ts
interface PhysicsToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string

  version: string

  description: string

  inputSchema: JsonSchema

  outputSchema: JsonSchema

  permission: ToolPermission

  timeoutMs: number

  mutatesScene: boolean

  execute(context: ToolContext, input: TInput): Promise<ToolResult<TOutput>>
}
```

---

# 135. ToolPermission

```ts
type ToolPermission =
  'read' | 'scene-write' | 'content-write' | 'teacher-write' | 'admin' | 'dangerous'
```

---

# 136. ToolContext

```ts
interface ToolContext {
  userId: UserId

  sessionId: SessionId

  runId: RunId

  turnId?: TurnId

  toolCallId: ToolCallId

  sceneId?: SceneId

  sceneRevision?: number

  permissions: ToolPermission[]

  traceId: TraceId
}
```

---

# 137. ToolResult

```ts
type ToolResult<T> =
  | {
      ok: true

      data: T

      traceId: TraceId

      sceneMutation?: {
        previousRevision: number
        newRevision: number
        eventIds: PhysicsEventId[]
      }
    }
  | {
      ok: false

      error: PhysicsToolError

      traceId: TraceId
    }
```

---

# 138. PhysicsToolError

```ts
interface PhysicsToolError {
  code: ToolErrorCode

  message: string

  retryable: boolean

  details?: Record<string, unknown>
}
```

---

# 139. ToolErrorCode

```ts
type ToolErrorCode =
  | 'INVALID_UNIT'
  | 'INVALID_PARAMETER'
  | 'OBJECT_NOT_FOUND'
  | 'SCENE_NOT_FOUND'
  | 'SCENE_REVISION_CONFLICT'
  | 'PHYSICS_CONSTRAINT_VIOLATION'
  | 'UNSUPPORTED_MODEL'
  | 'SIMULATION_FAILED'
  | 'VERIFICATION_FAILED'
  | 'TOOL_PERMISSION_DENIED'
  | 'TOOL_TIMEOUT'
  | 'INTERNAL_TOOL_ERROR'
```

---

# 140. Tool Naming

Einheitlich:

```text
physics.<domain>.<action>
```

Zum Beispiel:

```text
physics.scene.create
physics.scene.seek
physics.mechanics.net_force
physics.kinematics.trajectory
physics.electric.field
physics.magnetic.lorentz_force
physics.circuit.solve
physics.observe.force
```

---

# 141. PhysicsAgentMode

```ts
type PhysicsAgentMode = 'experiment' | 'question' | 'teacher' | 'diagnostic'
```

---

# 142. AgentRole

```ts
type AgentRole =
  | 'orchestrator'
  | 'question_parser'
  | 'scene_builder'
  | 'solver'
  | 'verifier'
  | 'observation_planner'
  | 'tutor'
  | 'diagnostic'
```

---

# 143. SceneReference

Der Agent Context speichert nicht die vollständige Scene.

```ts
interface SceneReference {
  id: SceneId

  revision: number

  snapshotId?: SnapshotId
}
```

---

# 144. StructuredFact

```ts
interface StructuredFact {
  id: string

  key: string

  value: unknown

  status: 'confirmed' | 'derived' | 'hypothesis'

  evidenceRefs?: EvidenceRef[]

  sceneRevision?: number
}
```

---

# 145. PhysicsWorkingMemory

```ts
interface PhysicsWorkingMemory {
  taskType: string

  objective: string

  stage?: string

  confirmedFacts: StructuredFact[]

  derivedFacts: StructuredFact[]

  completedSteps: string[]

  pendingSteps: string[]

  misconceptions: string[]

  importantEventIds: PhysicsEventId[]
}
```

---

# 146. PhysicsAgentContext

```ts
interface PhysicsAgentContext {
  schemaVersion: 'agent-context/1.0'

  constitutionVersion: string

  mode: PhysicsAgentMode

  role: AgentRole

  grade?: string

  skillRefs: string[]

  learningStateRef?: string

  scene?: SceneReference

  workingMemory: PhysicsWorkingMemory

  recentConversationRef?: string

  retrievalRefs?: string[]

  trace: TraceContext
}
```

---

# 147. Zum Context Layer gehörender Contract

```text
L0 Constitution
→ constitutionVersion

L1 Domain
→ skillRefs

L2 Learning State
→ learningStateRef

L3 Physics Scene
→ SceneReference

L4 Working Memory
→ PhysicsWorkingMemory

L5 Recent Conversation
→ recentConversationRef

L6 Retrieval
→ retrievalRefs
```

---

# 148. CompactionResult

```ts
interface CompactionResult {
  schemaVersion: 'physics-compaction/1.0'

  sessionId: SessionId

  createdAt: IsoDateTime

  scene?: SceneReference

  task: {
    type: string
    objective: string
  }

  confirmedFacts: StructuredFact[]

  derivedFacts: StructuredFact[]

  completedSteps: string[]

  pendingSteps: string[]

  misconceptions: string[]

  importantEventIds: PhysicsEventId[]

  summaryText?: string
}
```

`summaryText` ist nur eine Ergänzung.

Die strukturierten Felder sind die eigentlichen Fakten.

---

# 149. LearningStateRef

```ts
interface LearningStateRef {
  id: string

  userId: UserId

  revision: number
}
```

---

# 150. LearningState

```ts
interface LearningState {
  schemaVersion: 'learning-state/1.0'

  id: string

  userId: UserId

  revision: number

  grade?: string

  mastery: KnowledgeMastery[]

  misconceptions: MisconceptionRecord[]

  strengths: string[]

  weaknesses: string[]

  preferences?: LearningPreference

  updatedAt: IsoDateTime
}
```

---

# 151. KnowledgeMastery

```ts
interface KnowledgeMastery {
  knowledgePointId: string

  score: number

  confidence: number

  attempts: number

  evidenceCount: number

  updatedAt: IsoDateTime
}
```

Einschränkung:

```text
0 <= score <= 1
0 <= confidence <= 1
```

---

# 152. MisconceptionRecord

```ts
interface MisconceptionRecord {
  id: string

  knowledgePointId?: string

  code: string

  description: string

  confidence: number

  evidenceQuestionIds?: QuestionId[]

  firstObservedAt: IsoDateTime

  lastObservedAt: IsoDateTime
}
```

---

# 153. LearningPreference

```ts
interface LearningPreference {
  explanationDepth?: 'brief' | 'standard' | 'detailed'

  hintStyle?: 'socratic' | 'direct' | 'visual_first'

  formulaPreference?: 'early' | 'after_intuition'

  visualizationPreference?: string[]
}
```

---

# 154. MemoryRecord Base

```ts
interface MemoryRecord {
  id: string

  userId?: UserId

  sessionId?: SessionId

  type: 'session' | 'learning' | 'scene' | 'error' | 'knowledge' | 'preference'

  createdAt: IsoDateTime

  updatedAt: IsoDateTime

  metadata?: Record<string, unknown>
}
```

---

# 155. Error Memory

Dient zur Erfassung wiederverwendbarer Fehlermuster.

```ts
interface ErrorMemory extends MemoryRecord {
  type: 'error'

  code: string

  description: string

  domain?: PhysicsDomain

  knowledgePointId?: string

  confidence: number

  occurrences: number
}
```

---

# 156. SkillReference

```ts
interface SkillReference {
  id: string

  version: string

  domain: PhysicsDomain

  gradeRange?: string[]

  path: string
}
```

---

# 157. SkillManifest

```ts
interface SkillManifest {
  schemaVersion: 'physics-skill/1.0'

  id: string

  version: string

  title: string

  domain: PhysicsDomain

  prerequisites: string[]

  concepts: string[]

  toolScopes: string[]

  observableRecommendations: string[]

  misconceptionCodes: string[]

  sceneTemplateRefs: string[]

  questionPatternRefs: string[]
}
```

---

# 158. QuestionPattern

```ts
interface QuestionPattern {
  id: string

  version: string

  domain: PhysicsDomain

  problemType: string

  difficulty: 'basic' | 'medium' | 'advanced' | 'exam'

  requiredSceneFeatures: string[]

  variablePolicy: VariablePolicy

  targets: string[]

  templateRef: string
}
```

---

# 159. ObservationPlan

Die Ausgabe des Agent Observation Planner hat eine einheitliche Struktur.

```ts
interface ObservationPlan {
  schemaVersion: 'observation-plan/1.0'

  scene: SceneReference

  actions: ObservationAction[]

  pausePoints?: TimelinePausePoint[]

  explanationGoal?: string
}
```

---

# 160. ObservationAction

```ts
type ObservationAction =
  | {
      type: 'show'
      observableId: ObservableId
    }
  | {
      type: 'hide'
      observableId: ObservableId
    }
  | {
      type: 'highlight'
      observableId: ObservableId
    }
  | {
      type: 'create_graph'
      measurementIds: string[]
    }
  | {
      type: 'focus_object'
      targetId: string
    }
```

---

# 161. TimelinePausePoint

```ts
interface TimelinePausePoint {
  time?: Quantity<'time'>

  eventId?: PhysicsEventId

  reason: string
}
```

---

# 162. Rolle von VisualSceneModel

VisualSceneModel ist die Zwischenschicht von Observation → Renderer.

Es kann enthalten:

```text
VisualPrimitive
RenderLayer
Labels
Trajectories
Vectors
Field Glyphs
Graph Data
```

Aber:

> **Es gehört nicht zum PhysicsScene Contract.**

Der Renderer Contract wird separat gepflegt und darf PhysicsScene nicht rückwirkend verunreinigen.

---

# 163. DomainError

Einheitliche Basisstruktur für Fehler aller Domänenservices.

```ts
interface DomainError {
  code: string

  message: string

  category:
    'validation' | 'not_found' | 'conflict' | 'unsupported' | 'permission' | 'timeout' | 'internal'

  retryable: boolean

  details?: Record<string, unknown>
}
```

---

# 164. API Error

Nach außen:

```ts
interface ApiErrorResponse {
  error: {
    code: string

    message: string

    traceId: TraceId

    details?: unknown
  }
}
```

---

# 165. Pagination

Einheitlich:

```ts
interface PageRequest {
  page: number
  pageSize: number
}
```

Rückgabe:

```ts
interface PageResponse<T> {
  items: T[]

  page: number
  pageSize: number

  totalItems: number
  totalPages: number
}
```

---

# 166. Cursor Pagination

Für hochfrequente Events / Logs wird Cursor empfohlen.

```ts
interface CursorPage<T> {
  items: T[]

  nextCursor?: string
}
```

---

# 167. DocumentParseJob

Langläufer verwenden einen einheitlichen Job Contract.

```ts
interface DocumentParseJob {
  id: string

  documentId: DocumentId

  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

  progress: number

  createdAt: IsoDateTime

  updatedAt: IsoDateTime

  error?: DomainError
}
```

---

# 168. AgentRun

```ts
interface AgentRun {
  id: RunId

  sessionId: SessionId

  status: 'queued' | 'running' | 'waiting_tool' | 'completed' | 'failed' | 'cancelled'

  role: AgentRole

  mode: PhysicsAgentMode

  startedAt?: IsoDateTime

  finishedAt?: IsoDateTime

  traceId: TraceId
}
```

---

# 169. AgentMessage

```ts
interface AgentMessage {
  id: string

  sessionId: SessionId

  role: 'user' | 'assistant' | 'system' | 'tool'

  content: AgentContent[]

  createdAt: IsoDateTime

  traceId: TraceId
}
```

---

# 170. AgentContent

```ts
type AgentContent =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'image_ref'
      objectKey: string
    }
  | {
      type: 'question_ref'
      questionId: QuestionId
    }
  | {
      type: 'scene_ref'
      scene: SceneReference
    }
  | {
      type: 'tool_result_ref'
      toolCallId: ToolCallId
    }
```

---

# 171. ToolCallRecord

```ts
interface ToolCallRecord {
  toolCallId: ToolCallId

  sessionId: SessionId

  runId: RunId

  toolName: string

  toolVersion: string

  input: unknown

  output?: unknown

  status: 'requested' | 'running' | 'succeeded' | 'failed'

  startedAt?: IsoDateTime

  finishedAt?: IsoDateTime

  trace: TraceContext
}
```

---

# 172. Link zwischen den zwei Event Streams

Agent Event und Physics Event werden verknüpft über:

```text
traceId
sessionId
runId
turnId
toolCallId
sceneId
sceneRevision
physicsEventId
```

---

# 173. EventTraceLink

```ts
interface EventTraceLink {
  traceId: TraceId

  sessionId?: SessionId

  runId?: RunId

  turnId?: TurnId

  toolCallId?: ToolCallId

  sceneId?: SceneId

  sceneRevision?: number

  physicsEventId?: PhysicsEventId
}
```

---

# 174. PhysicsScene-Invarianten

Jede persistierte Scene muss erfüllen:

```text
schemaVersion erkennbar
Scene-ID gültig
revision >= 0
Objekt-IDs eindeutig
Alle Referenzen existieren
Quantity-Einheit zulässig
Quantity-Dimension zulässig
Vector finite
mass > 0
Timeline gültig
Circuit Connection gültig
Region Geometry gültig
```

---

# 175. Magnetic-Invarianten

Zum Beispiel für das reine Kreisbewegungsmodell im homogenen Magnetfeld:

```text
Particle charge != 0
Particle mass > 0
B != 0
v perpendicular B
Keine zusätzliche arbeitsverrichtende Kraft
```

Nur wenn diese Bedingungen erfüllt sind, darf angewendet werden:

```text
r = mv / |q|B
T = 2πm / |q|B
```

---

# 176. Electric-Invarianten

Das Teilchenmodell im homogenen elektrischen Feld verifiziert mindestens:

```text
field uniform
charge defined
mass > 0
field vector valid
```

---

# 177. Circuit-Invarianten

Mindestens zu verifizieren:

```text
node id unique
component id unique
terminal exists
connection valid
resistance >= 0
capacitance > 0
inductance >= 0
slider position in [0,1]
```

---

# 178. Scene Builder Contract

Eingabe:

```text
PhysicsIR
```

Ausgabe:

```ts
interface SceneBuildResult {
  scene: PhysicsScene

  mapping: SceneBuildMapping[]

  unresolved: SceneBuildIssue[]

  assumptions: PhysicsAssumptionIR[]

  verification: VerificationResult
}
```

---

# 179. SceneBuildMapping

```ts
interface SceneBuildMapping {
  irObjectId: string

  sceneObjectId: string

  evidenceRefs?: EvidenceRef[]
}
```

---

# 180. SceneBuildIssue

```ts
interface SceneBuildIssue {
  code: string

  message: string

  severity: 'warning' | 'error'

  evidenceRefs?: EvidenceRef[]

  requiresUserInput?: boolean
}
```

---

# 181. Question Parser Contract

```ts
interface QuestionParseResult {
  question: QuestionDocument

  diagramIRs: DiagramIR[]

  physicsIR: PhysicsIR

  warnings: ParserWarning[]

  traceId: TraceId
}
```

---

# 182. ParserWarning

```ts
interface ParserWarning {
  code: string

  message: string

  confidence?: number

  evidenceRefs?: EvidenceRef[]
}
```

---

# 183. Grenze des OCR- / VLM-Contracts

Rohausgabe von OCR / VLM:

```text
Darf nicht selbst Physics IR sein
```

Sie muss durchlaufen:

```text
Normalization
Semantic Parsing
Validation
```

und wird erst danach zum Domänen-Contract.

---

# 184. Math Runtime Contract

Alle Mathematik-Services werden über eine einheitliche Anfrage angesprochen.

```ts
interface MathRequest<TInput = unknown> {
  operation: string

  input: TInput

  precision?: number

  traceId: TraceId
}
```

Rückgabe:

```ts
interface MathResult<TOutput = unknown> {
  ok: boolean

  output?: TOutput

  error?: DomainError

  metadata?: {
    engine: string
    version: string
    durationMs: number
  }
}
```

---

# 185. Symbolic Expression

Empfohlen einheitlich:

```ts
interface SymbolicExpression {
  source: string

  format: 'plain' | 'latex' | 'sympy'
}
```

---

# 186. Renderer Interaction Contract

Nutzerinteraktionen des Renderers dürfen die Scene nicht direkt mutieren.

Ausgabe:

```ts
interface RendererInteraction {
  type: 'select' | 'drag' | 'resize' | 'rotate' | 'seek' | 'connect'

  targetId?: string

  payload?: unknown
}
```

Die Application-Schicht wandelt sie in ein Scene Command um.

---

# 187. Platform FileRef

Web / Desktop einheitlich:

```ts
interface FileRef {
  id: string

  name: string

  size: number

  contentType?: string

  source: 'browser' | 'desktop' | 'object_storage'

  path?: string

  objectKey?: string
}
```

Der Browser sollte nicht davon ausgehen, dass ein lokaler path existiert.

---

# 188. Export Contract

```ts
interface ExportRequest {
  type: 'scene' | 'report' | 'question' | 'experiment_data'

  sourceId: string

  format: 'json' | 'pdf' | 'csv' | 'png'

  options?: Record<string, unknown>
}
```

---

# 189. Contract Test

Jeder öffentliche Contract wird mindestens getestet auf:

```text
Valid Example
Invalid Example
Backward Compatibility
Serialization
Deserialization
Unit Validation
Enum Validation
Required Fields
```

---

# 190. Schema Registry

Empfohlen einzurichten:

```text
packages/contracts/
```

oder die vorhandenen Domänen-Packages legen Schemas offen.

Es muss aber eine einheitliche Registry geben:

```text
Schema ID
Version
Owner Package
JSON Schema
Examples
Migration
```

---

# 191. Contract Owner

Jeder Contract muss genau einen Owner haben.

Zum Beispiel:

```text
PhysicsScene
→ physics-scene

Physics IR
→ physics-ir

Diagram IR
→ diagram-ir

SimulationResult
→ physics-core / simulation contracts

Tool Contract
→ agent-tools

Agent Context
→ agent-context
```

Andere Module dürfen ihn nur konsumieren, nicht kopiert definieren.

---

# 192. Speicherort der Contract-Dateien

Empfohlen:

```text
packages/physics-scene/src/contracts/
packages/physics-ir/src/contracts/
packages/diagram-ir/src/contracts/
packages/physics-core/src/contracts/
packages/agent-tools/src/contracts/
packages/agent-context/src/contracts/
```

---

# 193. Keine doppelten Typen

Verboten sind

```text
PhysicsSceneDto
PhysicsSceneData
SceneModel
SceneSchema
```

vier semantisch ähnliche Strukturen, die von Hand ineinander umgewandelt werden.

Notwendige Transport-DTOs sollten eindeutig benannt werden:

```text
PhysicsSceneApiResponse
```

und direkt auf den einheitlichen Domain Contract abbilden.

---

# 194. Persistence Model

Die Tabellenstruktur der Datenbank muss nicht vollständig mit dem Domain Contract übereinstimmen.

Es muss aber einen eindeutigen Mapper geben:

```text
Persistence
↓
Mapper
↓
Domain Contract
```

Es ist verboten, dass ORM-Entities in das gesamte System eindringen.

---

# 195. Public Contract und Internal Model

Interne Modelle dürfen abweichen.

Zum Beispiel innerhalb der Engine:

```text
CanonicalParticleState
```

Die öffentlichen Ein- und Ausgaben über Package-Grenzen hinweg müssen jedoch auf den öffentlichen Contract zurückgeführt werden.

---

# 196. Contract Compatibility

Consumer müssen mindestens sicherstellen:

```text
Die aktuelle Version lesen
Die vorherige kompatible Minor-Version lesen
```

Breaking Major Versions werden per Migration umgewandelt.

---

# 197. Minor Version

Bei Kompatibilität erlaubt:

```text
Neue optionale Felder
Neue Enums, sofern der Consumer einen Fallback hat
Neue Metadaten
```

Im Einzelnen sind weiterhin Contract Tests erforderlich.

---

# 198. Major Version

Erforderlich bei:

```text
Feld löschen
Semantikänderung
Änderung der Standardeinheit
Änderung der Pflichtbedingungen
Änderung der Interpretation eines Events
```

Die Major-Version wird erhöht.

---

# 199. Migration Contract

```ts
interface ContractMigration<TFrom, TTo> {
  fromVersion: string

  toVersion: string

  migrate(input: TFrom): TTo
}
```

---

# 200. Scene Import

Import alter Scenes:

```text
Detect Schema Version
↓
Migrate
↓
Validate
↓
Load PhysicsScene
```

Altes JSON darf nicht direkt auf den neuesten Typ gecastet werden.

---

# 201. Export-Paket für Scenes

Künftige `.physics`- / `.scene`-Dateien sollten enthalten:

```text
manifest.json
scene.json
events.jsonl
snapshot.json
assets/
```

Manifest:

```ts
interface ScenePackageManifest {
  formatVersion: string

  sceneSchemaVersion: string

  sceneId: SceneId

  revision: number

  createdAt: IsoDateTime

  hashes: Record<string, string>
}
```

---

# 202. Trennung von Domain Contract und UI-Texten

Contracts verwenden stabile englische Keys:

```text
magnetic_flux_density
```

Die UI zeigt auf Chinesisch:

```text
磁感应强度
```

Chinesische Feldnamen als serviceübergreifendes Schema sind verboten.

---

# 203. Trennung von Domain Contract und Model Provider

In Contracts dürfen nicht vorkommen:

```text
deepseek_message_id
claude_tool
openai_response
```

oder andere Provider-spezifische Strukturen.

Diese dürfen nur innerhalb des Adapters existieren.

---

# 204. Trennung von Domain Contract und Renderer

In PhysicsScene dürfen nicht vorkommen:

```text
pixiSprite
mesh
materialColorHex
cssClass
domId
```

Visuelle Semantik wird verwaltet durch:

```text
Observable
Visual Model
Design Token
```

---

# 205. Trennung von Domain Contract und Database

In PhysicsScene dürfen nicht vorkommen:

```text
hibernateLazyProxy
rowVersion
databaseId
```

oder andere persistenzspezifische Inhalte.

---

# 206. Trennung von Domain Contract und Platform

Der File Contract sollte nicht voraussetzen:

```text
Windows path
Browser Blob
```

Einheitlich über `FileRef` und PlatformBridge.

---

# 207. Die wichtigste Contract-Kette

Die zentrale Kette von PhysicsOS:

```text
QuestionDocument
        ↓
Diagram IR
        ↓
Physics IR
        ↓
SceneBuildResult
        ↓
PhysicsScene
        ↓
SimulationRequest
        ↓
SimulationResult
        ↓
VerificationResult
        ↓
ObservationPlan
        ↓
Visual Scene Model
```

Agent:

```text
PhysicsAgentContext
        ↓
ToolCall
        ↓
ToolResult
        ↓
Physics Event
        ↓
Scene Revision
```

---

# 208. Contract Debugging

Bei jeder modulübergreifenden Anomalie zuerst prüfen:

```text
schemaVersion
producer version
consumer version
traceId
scene revision
tool call id
unit
evidence
```

Nicht als Erstes im Consumer provisorischen Kompatibilitätscode schreiben.

---

# 209. Ablauf zur Änderung eines Contracts

Jede Änderung an einem öffentlichen Contract:

```text
Change vorschlagen
↓
Owner bestätigen
↓
Breaking bewerten
↓
Schema ändern
↓
Migration hinzufügen
↓
Contract Tests aktualisieren
↓
Producer aktualisieren
↓
Consumer aktualisieren
↓
Dieses Dokument aktualisieren
```

---

# 210. Regeln für Contract-Änderungen durch AI Agents

Codex / Cursor / Claude Code / automatische Agents dürfen nicht eigenmächtig ändern:

```text
PhysicsScene
Physics IR
Diagram IR
SimulationResult
Physics Event
Tool Schema
Agent Context
```

es sei denn, die Aufgabe erlaubt es ausdrücklich.

---

# 211. Contract Review

Das Review muss prüfen:

```text
Ob Felder doppelt vorkommen
Ob die Feldsemantik eindeutig ist
Ob Einheiten mitgeführt werden
Ob es serialisierbar ist
Ob Provider-spezifische Daten enthalten sind
Ob bestehende Consumer beschädigt werden
Ob eine Migration nötig ist
Ob es einen Contract Test gibt
```

---

# 212. Contract Definition of Done

Ein neuer öffentlicher Contract ist erst fertig, wenn alle folgenden Bedingungen gleichzeitig erfüllt sind:

```text
TypeScript Type
JSON Schema
Validation
Valid Example
Invalid Example
Contract Tests
Owner
Version
Documentation
Migration Strategy
```

---

# 213. Abschließendes Prinzip zu PhysicsScene

PhysicsScene drückt aus:

> **Was die Welt ist.**

Nicht:

```text
Wie die Seite zeichnet
Was der Agent sagt
Wie die Datenbank speichert
```

---

# 214. Abschließendes Prinzip zu Physics IR

Physics IR drückt aus:

> **Was die Aufgabe physikalisch-semantisch sagt.**

Nicht:

```text
Die Antwort
Die Animation
Die endgültige Simulation
```

---

# 215. Abschließendes Prinzip zu SimulationResult

SimulationResult drückt aus:

> **Wie sich die physikalische Welt unter einer eindeutigen Scene Revision und Engine Version entwickelt.**

Muss nachvollziehbar und reproduzierbar sein.

---

# 216. Abschließendes Prinzip zu Tool Contract

Ein Tool drückt aus:

> **Welche strukturierten Aktionen dem Agent an PhysicsOS erlaubt sind.**

Kein Allzweck-Prompt-Kanal.

---

# 217. Abschließendes Prinzip zu Agent Context

Der Agent Context speichert:

> **Den minimalen strukturierten kognitiven Zustand, der zur Erledigung der aktuellen Aufgabe nötig ist.**

Er kann PhysicsScene nicht ersetzen.

---

# 218. Abschließendes modulübergreifendes Prinzip

Alle modulübergreifend übertragenen Daten sollten beantworten können:

```text
Was ist es?
Wem gehört es?
Welche Version?
Welche Einheit wird verwendet?
Woher stammt es?
Was ist die aktuelle Scene Revision?
Ist es verifizierbar?
Ist es nachverfolgbar?
```

---

# 219. Domänen-Contract-Prinzip in einem Satz

> **Alle Module von PhysicsOS müssen über klare, versionierte, verifizierbare Contracts zusammenarbeiten; kein Modul darf über gemeinsam genutzten impliziten Zustand, das Raten aus Freitext oder doppelte Definition von Domänenobjekten gekoppelt sein.**
