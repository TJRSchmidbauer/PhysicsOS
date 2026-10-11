# PhysicsOS Test- und Evaluierungsstrategie

> Datei: `docs/11-TESTING-EVALUATION-STRATEGY.md`  
> Dokumentzweck: Qualitätssicherungssystem für Code, Physik, Agent, Aufgabenanalyse, UI und System von PhysicsOS

---

# 1. Kernziel

PhysicsOS muss nicht nur testen, „ob der Code läuft“.

Es muss zugleich nachweisen:

```text
Die Physik wird richtig berechnet
Scenes sind wiederholbar abspielbar
Aufgaben werden richtig analysiert
Der Agent wählt die richtigen Tools
Der Tutor lehrt nichts Falsches
Die UI entspricht dem Prototyp
Services sind wiederherstellbar
```

---

# 2. Testebenen

```text
Unit Test
Contract Test
Physics Golden Test
Property Test
Metamorphic Test
Integration Test
Question Golden Eval
Agent Eval
E2E
Visual Regression
Performance
Security
Reliability
```

---

# 3. Unit Test

Schwerpunkte:

```text
Vector
Quantity
Unit
Dimension
Geometry
Scene Reducer
Command Validation
Parser Normalize
Tool Guard
```

---

# 4. Contract Test

Muss abdecken:

```text
PhysicsScene
Physics IR
Diagram IR
Simulation
Tool
Agent Context
API
```

---

# 5. Physics Golden Test

Dies ist eines der wichtigsten Test-Assets von PhysicsOS.

Jeder Case:

```text
Input Scene
Expected Formula
Expected Numeric Result
Tolerance
Expected Events
Expected Invariants
```

---

# 6. Mechanics Golden

Mindestens:

```text
Gleichförmige geradlinige Bewegung
Gleichmäßig beschleunigte Bewegung
Freier Fall
Senkrechter Wurf nach oben
Waagerechter Wurf
Schräger Wurf
Ruhe auf der schiefen Ebene
Gleiten auf der schiefen Ebene
Feder
Verbundene Körper
Impulserhaltung
Elastischer Stoß
Vollständig inelastischer Stoß
```

---

# 7. Electric Golden

```text
Zwei Punktladungen
Mehrfache Überlagerung
Homogenes elektrisches Feld
Potenzial
Ablenkung geladener Teilchen
```

---

# 8. Magnetic Golden

```text
v ∥ B
v ⟂ B
Positive Ladung
Negative Ladung
Radius
Periode
Halbkreis
Rechteckiger Bereich
Kreisförmiger Bereich
Kritische Probleme
```

---

# 9. Circuit Golden

```text
Reihenschaltung
Parallelschaltung
Gemischte Schaltung
Geschlossener Stromkreis
Innenwiderstand
Schiebewiderstand
Ideale Messgeräte
Nicht-ideale Messgeräte
Schalter
```

---

# 10. Induction Golden

```text
Bewegter Leiter
Leiterrahmen tritt ein
Leiterrahmen tritt aus
Schiene
Zwei Stäbe
```

---

# 11. Property-based Test

Geeignet für:

```text
Unit Conversion
Vector Algebra
Scene Serialization
Geometry
Conservation
```

---

# 12. Metamorphic Test

Beispiel: Kreisbewegung im homogenen Magnetfeld.

```text
v × 2 → r × 2
B × 2 → r ÷ 2
m × 2 → r × 2
|q| × 2 → r ÷ 2
```

Solche Relationstests sind aussagekräftiger, als nur einige feste Zahlen zu testen.

---

# 13. Boundary Test

Muss abdecken:

```text
zero
near-zero
exact boundary
just inside
just outside
tangent
critical radius
critical angle
very large
```

---

# 14. Numerical Test

Prüfen:

```text
NaN
Infinity
Convergence
Tolerance
Step Stability
```

---

# 15. Integration Test

Physics:

```text
PhysicsScene
↓
Engine
↓
Verifier
↓
Observation
```

---

# 16. Question Pipeline Test

```text
Input
↓
OCR
↓
Segmentation
↓
Diagram IR
↓
Physics IR
↓
Scene
↓
Physics Result
```

---

# 17. Question Golden Dataset

Pro Aufgabe wird gespeichert:

```text
Original Source
Ground Truth Text
Ground Truth Diagram IR
Ground Truth Physics IR
Ground Truth Scene Semantics
Expected Answer
```

---

# 18. OCR-Metriken

Zum Beispiel:

```text
CER
Formula Accuracy
Reading Order Accuracy
```

---

# 19. Parser-Metriken

```text
Question Segmentation Accuracy
Object F1
Known Value Accuracy
Constraint Accuracy
Target Accuracy
Evidence Alignment
```

---

# 20. Diagram Eval

```text
Element Detection F1
Relation Accuracy
Circuit Topology Accuracy
Boundary Geometry Accuracy
```

---

# 21. Scene Build Eval

Verglichen wird:

```text
Scene Semantics
```

und nicht die Reihenfolge der JSON-Felder.

---

# 22. Agent Contract Test

Mindestens:

```text
Role Tool Scope
Tool Schema
Permission
Error Handling
Scene Revision Conflict
Context Schema
Compaction
Resume
Fork
```

---

# 23. Agent Golden Cases

Zum Beispiel:

```text
magnetic-particle-basic
inclined-plane-force
projectile-motion
electric-deflection
circuit-dynamic
induction-rail
```

---

# 24. Agent-Eval-Dimensionen

```text
Intent Routing
Question Understanding
Tool Selection
Tool Efficiency
Scene Accuracy
Physics Accuracy
Verification
Tutor Quality
Diagnostic Quality
Context Stability
```

---

# 25. Tool Selection Eval

Prüfen:

```text
Ob korrekt
Ob wiederholt
Ob Befugnisse überschritten
Ob ein notwendiges Verify ausgelassen wurde
```

---

# 26. Tutor Eval

Prüfen:

```text
Ob die Antwort zu früh verraten wird
Ob Observation korrekt verwendet wird
Ob es mit dem Physics Result übereinstimmt
Ob es zum Niveau des Schülers passt
Ob falsche Konzepte erzeugt werden
```

---

# 27. Diagnostic Eval

Erforderlich:

```text
Ground Truth Misconception
Evidence
Confidence
```

Überdiagnose vermeiden.

---

# 28. Long Context Regression

Szenarien:

```text
10 turns
50 turns
100 turns
```

Enthalten:

```text
Compaction
Resume
Fork
Scene Revision Change
```

Zu prüfen ist, dass

```text
sceneId
revision
current goal
confirmed facts
misconceptions
```

nicht driften.

---

# 29. E2E

Zentrale Experimentkette:

```text
Labor betreten
Szene erstellen
Parameter ändern
Ausführen
Pausieren
Timeline Seek
Observable öffnen
Agent fragen
```

---

# 30. Question E2E

```text
Aufgabe hochladen
Analysieren
Bedingungen bestätigen
Scene erzeugen
Visualisieren
Lösung ansehen
In der Physikwelt öffnen
```

---

# 31. Teacher E2E

Später:

```text
Scene erstellen
Experiment veröffentlichen
Aufgaben erzeugen
Hausaufgabe zuweisen
```

---

# 32. Playwright

Web-E2E verwendet einheitlich Playwright oder eine vom Projekt festgelegte gleichwertige Lösung.

---

# 33. Visual Regression

Schwerpunkte:

```text
Home
Physics Workspace
Question Space
Scene Tree
Inspector
Force Arrow
Trajectory
Field
Circuit
Chart
```

---

# 34. Visual ersetzt nicht Physics

Identische Screenshots:

> bedeuten nicht, dass das physikalische Ergebnis korrekt ist.

---

# 35. UI Fidelity

Per Screenshot-Diff prüfbar:

```text
Layout
Maße
Farben
Zustände
```

---

# 36. Performance Test

Mindestens:

```text
Canvas FPS
Main Thread Long Task
Simulation Latency
Agent First Event
Document Parse Duration
Memory
```

---

# 37. Performance Baseline

Eine Baseline wird auf fester Hardware / festem Browser / fester Scene aufgebaut.

Vermeiden Sie vage Formulierungen wie:

```text
„fühlt sich ziemlich flüssig an“
```

---

# 38. Load Test

Services:

```text
API
Agent Sessions
Document Jobs
Simulation Jobs
```

---

# 39. Reliability

Fehlerinjektion:

```text
LLM Timeout
Math Unavailable
Object Storage Error
Simulation Cancel
Network Disconnect
```

---

# 40. Recovery Test

Testen:

```text
Agent Resume
Scene Replay
Snapshot Restore
Job Retry
```

---

# 41. Security Test

Abdecken:

```text
Authentication
RBAC
Tool Permission
Prompt Injection
Upload Validation
Rate Limit
```

---

# 42. Regression Policy

Beim Beheben eines Bugs:

> **Zuerst einen fehlschlagenden Regressionstest schreiben, dann die Implementierung ändern.**

---

# 43. CI Gate

Normaler PR:

```text
format
typecheck
lint
unit
contract
physics golden
build
```

---

# 44. Core PR

Bei Änderungen an der Kernarchitektur zusätzlich:

```text
integration
agent golden
question golden
e2e
visual
```

---

# 45. Skip Policy

Verboten:

```text
Fehlschlagende Tests löschen
Erwartungen auf falsche Ergebnisse ändern
Willkürliches .skip
```

um CI grün zu bekommen.

---

# 46. Mock Policy

Erlaubt:

```text
Externe Modelle
Externes Netzwerk
Drittanbieter-Speicher
```

in Unit-Tests zu mocken.

Verboten:

```text
Physics Engine
Tool Handler
Zentrale Geschäftslogik
```

durch Mocks zu ersetzen und so Nicht-Implementiertes als fertig auszugeben.

---

# 47. Test Data Version

Das Golden Dataset muss versioniert sein.

---

# 48. Model Eval

Nichtdeterministische Modelle werden nicht per reinem String-Abgleich bewertet.

Verwendet werden:

```text
Structured Output
Tool Trace
Fact Rubric
Score Rubric
```

---

# 49. Human Evaluation

Tutor- / didaktische Erklärungen benötigen Stichproben mit manueller Bewertung durch Lehrkräfte.

---

# 50. Release Gate

Vor einer offiziellen Version mindestens:

```text
Physics Golden
Question Golden
Agent Regression
Core E2E
Visual
Security Smoke
Performance Smoke
```

---

# 51. Test Report

Festhalten:

```text
commit
environment
dataset version
test version
result
failures
```

---

# 52. Coverage

Coverage ist eine Hilfskennzahl.

Aus hoher Zeilenabdeckung darf nicht geschlossen werden, dass die Physik stimmt.

---

# 53. Test Ownership

Jedes zentrale Package bringt seine eigenen Tests mit.

---

# 54. Definition of Done

Eine fertige Funktion muss:

```text
Tests auf der richtigen Ebene haben
Zentrale Golden-Tests dürfen nicht regredieren
Echtes E2E lauffähig sein
Keine falschen Mocks enthalten
```

---

# 55. Testprinzip in einem Satz

> **Die Tests von PhysicsOS sollen nicht beweisen, dass „die Seite sich öffnen lässt“, sondern dass die physikalische Welt richtig berechnet, die Aufgabe richtig verstanden und der Agent richtig bedient wird – und dass diese Korrektheit über lange Iterationen automatisch gehalten wird.**
