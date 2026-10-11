# PhysicsOS Physics Engine Architekturdesign

> Datei: `docs/05-PHYSICS-ENGINE-ARCHITECTURE.md`  
> Dokumentposition: PhysicsOS Physikwelt-Laufzeit / Physics Engine / Simulation / Verifikation / Beobachtung Gesamtarchitektur  
> Upstream-Dokumente:
>
> - `00-PRODUCT-OVERVIEW.md`
> - `01-DEVELOPMENT-GUIDE.md`
> - `02-ENGINEERING-STANDARDS.md`
> - `03-DOMAIN-CONTRACTS.md`
> - `04-AGENT-ARCHITECTURE.md`
>
> Dieses Dokument definiert die Kernarchitektur von „wie die physikalische Welt in PhysicsOS wirklich läuft“.
>
> **Höchste Prinzip: LLM kann Physik verstehen, aber die Physics Engine entscheidet, was in der physikalischen Welt wirklich passiert.**

---

# 1. Dokumentziel

Dieses Dokument beantwortet folgende Fragen:

```text
Was ist PhysicsScene eigentlich
Wie wird eine Scene modifiziert
Wie wählt die Physics Engine aus
Wie arbeiten verschiedene Physikbereiche zusammen
Wie läuft die Simulation ab
Wie wird die Zeitachse zurückgespielt
Wie werden Einheiten vereinheitlicht
Wie sichert die numerische Berechnung Stabilität
Wie stellt der Verifier vertrauenswürdige Ergebnisse sicher
Wie wandelt Observation physikalische Größen in sichtbare Inhalte um
Wie werden Renderer und Engine entkoppelt
Wie teilen sich 2D / 3D dieselbe physikalische Tatsache
Wie wird die gesamte Physics Runtime getestet
```

Eine der technischen Barrieren von PhysicsOS ist:

> **Eine wirklich ausführbare, verifizierbare, rückspielbare und erweiterbare digitale Physikwelt für die Mittel- und Oberstufe aufzubauen.**

---

# 2. Physics Runtime Gesamtarchitektur

```text
                          PhysicsOS Application
                                   │
                                   ↓
                            PhysicsScene API
                                   │
                                   ↓
                       ┌─────────────────────┐
                       │ PhysicsSceneRuntime │
                       └──────────┬──────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ↓                    ↓                    ↓
       Scene Command          Scene Query         Timeline
             │                    │                    │
             ↓                    │                    │
        Validation                │                    │
             ↓                    │                    │
       Physics Event              │                    │
             ↓                    │                    │
         Reducer                  │                    │
             ↓                    │                    │
       Scene Revision ────────────┴────────────────────┘
                                  │
                                  ↓
                        Simulation Orchestrator
                                  │
                  ┌───────────────┼────────────────┐
                  ↓               ↓                ↓
              Engine Registry   Math Runtime     Units Runtime
                  │
     ┌────────────┼───────────────────────────────────────┐
     ↓            ↓            ↓            ↓             ↓
 Mechanics     Electric     Magnetic       Circuit      Induction
     │            │            │            │             │
     └────────────┴────────────┴────────────┴─────────────┘
                                  │
                                  ↓
                           SimulationResult
                                  │
                                  ↓
                           Physics Verifier
                                  │
                                  ↓
                          Observation Runtime
                                  │
                                  ↓
                         Visual Scene Model
                                  │
                                  ↓
                             Renderer
```

---

# 3. Physics Runtime Verantwortungsgrenzen

Physics Runtime ist verantwortlich für:

```text
Weltzustand
Physikalische Gesetze
Ereignisse
Zeitentwicklung
Numerisches Lösen
Szenenvalidierung
Ergebnisverifikation
Generierung beobachtbarer Daten
```

Physics Runtime ist **nicht** verantwortlich für:

```text
Seitenrouting
Schaltflächen
Chat-UI
Konto
Kursberechtigungen
Prompt
LLM Provider
Datenbank-Seiten-DTO
```

---

# 4. PhysicsScene Positionierung

PhysicsScene stellt dar:

> **Was die physikalische Welt an einer bestimmten Revision ist.**

Nicht:

```text
Wie die Seite gezeichnet wird
Wie der Benutzer bedient
Wie der Agent beschreibt
Gesamte Simulationshistorie-Daten
```

PhysicsScene speichert:

```text
Objekte
Felder
Bereiche
Grenzen
Constraints
Stromkreise
Zeitachsenkonfiguration
Messdefinitionen
Observable-Definitionen
```

---

# 5. PhysicsScene Runtime

Empfohlen:

```text
PhysicsSceneRuntime
│
├── SceneGraph
├── CommandBus
├── Validator
├── EventStore
├── Reducer
├── SnapshotStore
├── QueryService
├── TimelineRuntime
└── BranchManager
```

---

# 6. SceneGraph

SceneGraph ist die strukturierte Darstellung der aktuellen Scene.

Mindestens organisiert:

```text
Bodies
Particles
Fields
Forces
Regions
Boundaries
Constraints
Circuits
Measurements
Observables
Annotations
```

SceneGraph ist verantwortlich für:

```text
Objektindex
Referenzbeziehungen
Schnellsuche
Strukturelle Konsistenz
```

---

# 7. Scene erlaubt keine direkte Mutation

Verboten:

```ts
scene.particles[0].velocity = nextVelocity
```

Alle Änderungen müssen über folgenden Weg laufen:

```text
Command
↓
Validation
↓
Event
↓
Reducer
↓
New Scene Revision
```

---

# 8. SceneCommand

Beispiele:

```text
AddParticle
ChangeParticleMass
AddMagneticField
ChangeMagneticFieldStrength
AddBoundary
ConnectCircuit
SeekTimeline
EnableObservable
```

Command ist:

> **Eine Änderungsanfrage an die Welt.**

---

# 9. PhysicsEvent

Event ist:

> **Diese Änderung wurde verifiziert und ist erfolgt.**

Beispiele:

```text
ParticleAdded
ParticleMassChanged
MagneticFieldAdded
MagneticFieldStrengthChanged
BoundaryAdded
CircuitConnected
TimelineSeeked
ObservationEnabled
```

---

# 10. Event Sourcing Wert

PhysicsOS nutzt den Physics Event Stream, der natürlich unterstützt:

```text
Undo
Redo
Replay
Branch
Audit
Agent Trace
Teacher Playback
Debug
Scene Restore
```

---

# 11. Scene Revision

Jede gültige Scene Mutation: