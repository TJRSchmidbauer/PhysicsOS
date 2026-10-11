# PhysicsOS Question-Pipeline-Architektur

> Datei: `docs/08-QUESTION-PIPELINE-ARCHITECTURE.md`

---

# 1. Ziel

Question Space ist keine KI-Aufgabensuche.

Ziel:

> **Statische Aufgaben in eine PhysicsScene umzuwandeln, die sich verifizieren, ausführen, beobachten und interaktiv bedienen lässt.**

---

# 2. Eingaben

```text
Text
Bild
Screenshot
Foto
PDF
Gescanntes PDF
Gesamte Klausur
Aufgabenbank
Lehrer-Upload
```

---

# 3. Gesamtablauf

```text
Input
↓
Document Ingest
↓
Normalization
↓
OCR / VLM
↓
Question Segmentation
↓
Diagram Extraction
↓
Diagram IR
↓
Physics Semantic Parser
↓
Physics IR
↓
IR Validation
↓
Scene Candidate
↓
Scene Validation
↓
PhysicsScene
↓
Simulation
↓
Verification
↓
Visualization
```

---

# 4. Document Ingest

Zuständig für:

```text
Dateiprüfung
MIME
Größe
Hash
Seitenzahl
Metadaten
Object Storage
```

---

# 5. Normalization

Bilder:

```text
Ausrichtungskorrektur
Rand beschneiden
Entrauschen
Kontrastoptimierung
```

PDF:

```text
Textebenen-Erkennung
Seiten rendern
Bilder extrahieren
```

---

# 6. OCR

Priorität:

```text
Textebene vorhanden → extrahieren
Keine Textebene → OCR
```

Gespeichert werden:

```text
text
bounding boxes
page
confidence
reading order
```

---

# 7. VLM

Verwendet für:

```text
Komplexe Layouts
Aufgabenbilder
Symbolbeziehungen
Geometrische Beziehungen
Tabellen
Formeln
```

Darf nicht direkt zum Domänenfakt werden.

---

# 8. Question Segmentation

Erkennt:

```text
Aufgabennummer
Aufgabenstellung
Antwortoptionen
Teilfragen
Aufgabenbild
Antwortbereich
Lösungsbereich
```

---

# 9. Zuordnung der Aufgabenbilder

Muss verknüpft sein mit:

```text
questionId
page
boundingBox
```

---

# 10. Formula Recognition

Ausgabe:

```text
LaTeX
+
normalized symbolic form
```

---

# 11. Diagram-Klassifikation

```text
Kräftediagramm
Schiefe-Ebene-Diagramm
Magnetfeldbereich
Elektrofeldbereich
Schaltplan
Strahlengang
Koordinatendiagramm
v-t
x-t
Versuchsaufbau
```

---

# 12. Diagram IR

```text
Point
Line
Arc
Arrow
Label
Body
Wire
Component
FieldRegion
Coordinate
Boundary
```

---

# 13. Circuit Diagram

```text
symbol detection
↓
terminal detection
↓
wire tracing
↓
node merge
↓
component classification
↓
CircuitGraph
```

---

# 14. Physics Semantic Parser

Eingabe:

```text
normalized text
formula
Diagram IR
metadata
```

Ausgabe:

```text
Physics IR
```

---

# 15. Physics IR

```text
domain
problemType
objects
regions
knownValues
unknownValues
initialConditions
constraints
relations
targets
assumptions
knowledgeTags
confidence
evidence
```

---

# 16. Evidence First

Für Schlüsselbedingungen werden festgehalten:

```text
text range
page
bounding box
diagram element
```

---

# 17. Confidence

Unterhalb des Schwellenwerts:

```text
needs_review
```

Die UI verlangt eine Bestätigung durch den Nutzer.

---

# 18. Kein stilles Raten

Schlüsselbedingungen dürfen nur sein:

```text
confirmed
explicit assumption
needs review
```

---

# 19. IR Validation

```text
Schema
Unit
Reference
Dimension
Required Target
Domain Consistency
```

---

# 20. Scene Builder

Abbildung:

```text
IR Object → Scene Object
IR Region → Region
Known Value → Quantity
Initial Condition → State
Constraint → Constraint
Diagram Geometry → Geometry
```

---

# 21. SceneBuildMapping

Bewahrt:

```text
IR object ↔ Scene object
```

---

# 22. Scene Validation

```text
Referenzen
Einheiten
Modelle
Randbedingungen
Schaltungstopologie
Unterstützte Fähigkeiten
```

---

# 23. Scene Repair

Pfad:

```text
Parser Repair
Scene Builder Repair
User Review
```

---

# 24. Capability Check

Vor dem Scene Build wird geprüft:

```text
PhysicsCapabilityRegistry
```

---

# 25. Simulation / Verification

Erst nach gültiger Szene (Scene Valid):

```text
Simulation
```

Verifikation:

```text
Dimensional
Numerical
Boundary
Trajectory
Conservation
```

---

# 26. QuestionSolution

Aufgebaut auf:

```text
Physics IR
Tool Result
Simulation Result
Formula
Verification
```

---

# 27. Tutor-Kopplung

Lösungsschritte können:

```text
Step 1 → show force
Step 2 → show radius
Step 3 → seek exit
```

---

# 28. Parallelisierung ganzer Klausuren

```text
Segmentation
↓
Parallel Question Parser
↓
Independent IR
↓
Aggregate
```

---

# 29. Job-Status

```text
queued
running
needs_review
completed
failed
cancelled
```

---

# 30. Fortschritts-UI

```text
Dokument wird gelesen
Erkennung 8/20
Aufgabe 8 wird analysiert
Verifikation läuft
```

---

# 31. Manuelle Korrektur

Erlaubt:

```text
OCR-Text
Bereich des Aufgabenbilds
Zahlenwerte
Einheiten
Objekte
Randbedingungen
```

---

# 32. Question Revision

Analyseergebnisse müssen versioniert werden.

---

# 33. Persistenz

Gespeichert werden:

```text
original document
normalized assets
OCR
Diagram IR
Physics IR
Scene ref
solution
diagnostic
```

---

# 34. Parser Version

Festgehalten werden:

```text
ocrVersion
vlmVersion
parserVersion
diagramParserVersion
sceneBuilderVersion
```

---

# 35. Reprocess

Eine neue Parser-Version darf neu verarbeiten; die alten Ergebnisse bleiben erhalten.

---

# 36. Evaluation

Ground Truth:

```text
Text
Diagram IR
Physics IR
Scene
Answer
```

Metriken:

```text
OCR CER
Segmentation Accuracy
Diagram F1
Known Value Accuracy
Constraint Accuracy
Target Accuracy
Scene Accuracy
Physics Accuracy
```

---

# 37. Security

Hochgeladene Dateien werden isoliert geparst und ressourcenbegrenzt.

---

# 38. Trace

```text
documentId
questionId
parserRunId
diagramId
physicsIR version
sceneId
sceneRevision
simulationId
traceId
```

---

# 39. Question → Experiment

Schaltfläche:

```text
In der Physikwelt öffnen
```

---

# 40. Experiment → Question

Über die Question Engine.

---

# 41. Dynamic Question

Erzeugt auf Basis von:

```text
Scene
Question Pattern
Variable Policy
Difficulty
```

---

# 42. Aufgabenkette in einem Satz

> **PhysicsOS lässt das Modell nicht „Animationen nach dem Bild raten“, sondern wandelt die Aufgabe Schicht für Schicht in nachvollziehbare, verifizierbare Physics IR und PhysicsScene um, die dann von einer echten Physics Engine ausgeführt werden.**
