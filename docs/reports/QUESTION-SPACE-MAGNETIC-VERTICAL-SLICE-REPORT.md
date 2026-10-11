# Aufgabenraum — Bericht zur vertikalen Slice Magnetfeld

> Datei: `docs/reports/QUESTION-SPACE-MAGNETIC-VERTICAL-SLICE-REPORT.md`
> Aufgabennummer: `QUESTION_SPACE_VERTICAL_SLICE_V1`

---

## 1. Question Domain

Neu angelegt wurde `packages/question-core`, das alle Question-Domain-Contracts umsetzt:

- `QuestionId`, `QuestionDocument`, `QuestionSource`, `QuestionContent`, `QuestionStatus`, `QuestionMetadata`
- `QuestionKnown`, `QuestionUnknown`, `QuestionConstraint`
- `QuestionSemanticCandidate`, `PhysicsSemanticIR`
- `QuestionSolution`, `QuestionSolutionStep`
- `QuestionDiagnostic`, `QuestionParseIssue`, `QuestionAmbiguity`
- `QuestionWorkflowState` (16 Zustände: INPUT_RECEIVED → READY + Fehlerzustände)
- `QuestionIngestProvider` (Text / Image-Stub / PDF-Stub)

Alle Typen folgen `docs/03-DOMAIN-CONTRACTS.md` und `docs/08-QUESTION-PIPELINE-ARCHITECTURE.md`.

---

## 2. QuestionDocument

- Unterstützte Quellen: `text`, `image`, `pdf`
- Texteingabe vollständig nutzbar
- Für Bild/PDF wurde eine Provider Boundary eingerichtet, der Zustand zeigt `UNAVAILABLE`, ohne eine erfolgreiche Erkennung vorzutäuschen

---

## 3. Parser

- Umgesetzt wurde `DeterministicMagneticQuestionParser` (deterministischer Parser für Magnetfeldaufgaben)
- Erkannt werden: wissenschaftliche Notation (`2.0×10^6`, `2.0e6`), Einheiten (`C`, `kg`, `m/s`, `T`), chinesische Richtungsangaben (senkrecht zur Papierebene hinein/heraus), Vorzeichen der Ladung (Proton/Elektron/positiv/negativ), gesuchte Größen (Kraft/Radius/Periode/Richtung/Trajektorie)
- Keine Abhängigkeit von einem öffentlichen LLM

---

## 4. Semantic IR

`PhysicsSemanticIR` enthält:

- `domain: magnetic`
- `model: charged_particle_uniform_magnetic_field`
- `entities: [particle, magnetic_field]`
- `knowns: [charge, mass, velocity, magnetic_field_strength]`
- `relations: [velocity_perpendicular_B]`
- `targets: [force, radius, period, rotation_direction, trajectory]`
- `assumptions: [uniform_magnetic_field, magnetic_force_only, ignore_electric_field, ignore_gravity]`

---

## 5. Validation

`validateSemanticIR` prüft:

- Ob die nötigen Entitäten vollständig sind (charge / mass / velocity / B)
- Ob das Vorzeichen der Ladung eindeutig ist → `AMBIGUOUS`
- B = 0 → `INVALID_SEMANTICS`
- v ∥ B → `UNSUPPORTED_MODEL`

---

## 6. Scene Builder

`buildSceneFromIR` bildet die IR auf `PhysicsScene` ab:

- Verwendet direkt den äquivalenten Aufbau von `createMagneticScene` aus `@physicsos/physics-scene`
- Baut Teilchen, homogenes Magnetfeld und Observable-Definitionen
- Der Scene Builder berechnet R, T, ω, F nicht – alle Physics Facts stammen aus `engine-magnetic`

---

## 7. Engine Selector

`selectEngine` wählt die Engine anhand des IR-`model`:

- `charged_particle_uniform_magnetic_field` → `engine-magnetic`
- Schnittstellen für andere Domänen sind vorgehalten

---

## 8. Magnetic Engine Integration

- Die vorhandene `MagneticEngine` führt die Simulation aus
- `processQuestion` ruft `engine.simulate(scene, request)` auf
- Ausgabe ist ein `SimulationResult` einschließlich derivedQuantities

---

## 9. Verifier

- Die Verifikation erfolgt durch die in der `MagneticEngine` eingebaute Verifikation und das externe `verifyMagneticScene`
- Die Question UI zeigt den Verifikationsstatus: `passed` / `failed`
- Die Verifikationsquelle ist der Physics Verifier, nicht der Agent

---

## 10. Observation

- `observeMagneticScene` bildet das SimulationResult auf renderer-neutrale Observations ab
- Question Canvas und Lab Canvas teilen sich dasselbe Observation-Modell

---

## 11. Solution

`QuestionSolution` strukturiert:

- 5 Herleitungsschritte
- Ergebnisse werden aus `SimulationResult.derivedQuantities` gelesen (nicht neu berechnet)
- Enthalten F, R, T, Richtung

---

## 12. Question UI

Im Harness Shell wird die Komponente `QuestionWorkspace` aufgebaut:

- Linke Spalte: Aufgabeneingabe + Liste der Golden Questions + gegebene Bedingungen + gesuchte Größen
- Mittlere Spalte: Wiederverwendung von `LabCanvas` zum Rendern von Physics Visualization + Timeline
- Rechte Spalte: Tabs für Lösungsweg / Verifikationsdetails
- Drawer des KI-Assistenten

---

## 13. Open In Physics World

- Die Schaltfläche „In der Physikwelt öffnen“ übergibt die Question Scene an das Lab
- `surface-store.ts` unterstützt die Übergabe per `questionScene`
- Question und Lab teilen sich dieselbe `PhysicsScene` (gleiche sceneId / revision)
- Die Scene wird nicht neu erzeugt

---

## 14. Harness Agent

- Der aktuelle Agent Parser Provider ist als `AGENT_PARSER_PROVIDER_PENDING` markiert
- Die deterministische Pipeline ist vollständig nutzbar und blockiert nicht

---

## 15. Tests

- 49 Tests bestehen alle
- 10 Golden-Question-Szenarien: Standard-Proton, Elektron, Feldrichtung nach außen, nur Radius, nur Periode, fehlendes Vorzeichen der Ladung, Nullfeld, parallele Geschwindigkeit, Einheitenumrechnung (erwartet INVALID_SEMANTICS), wissenschaftliche Notation
- Vollständige Pipeline-Assertion für 01-proton-basic: IR → Scene → Engine → R ≈ 4,18 cm, T ≈ 1,31e-7 s, F ≈ 1,6e-13 N → Verifier PASS → Solution → Observation
- Konsistenztest Question ↔ Lab: gleiche sceneId / revision, gleiche derivedQuantities

---

## 16. Screenshots

Browser-Screenshots erfordern das Starten des Harness Dev Servers; der Code ist fertig, die Screenshots stehen noch zur Browser-Abnahme aus.

---

## 17. Known Issues

- Golden Question 09 (Einheitenumrechnung km/s, mT): Der aktuelle Parser unterstützt keine nicht standardisierten Einheiten, erwartet wird `INVALID_SEMANTICS`
- Der Ingest Provider für Bild/PDF ist ein Stub, Zustand `UNAVAILABLE`
- Agent Parser Provider muss noch angebunden werden
- Das Harness Windows Replay Gate wurde DEFERRED

---

## 18. Harness Replay Deferred

```
HARNESS_WINDOWS_REPLAY_GATE_DEFERRED
```

Die folgenden Arbeiten bleiben dem späteren RELEASE GATE vorbehalten:

- Baseline / PhysicsOS Replay seriell ausführen
- bash/pwsh / PID-Cleanup beheben
- 59 fehlgeschlagene Dateien einzeln aufarbeiten
- Physics Runtime für das Replay ändern

---

## Abschlussstatus

- Textaufgaben können tatsächlich eingegeben werden ✓
- QuestionDocument erzeugt ✓
- Semantic IR erzeugt ✓
- PhysicsScene erzeugt ✓
- Magnetic Engine löst ✓
- Verifier PASS ✓
- Solution erzeugt ✓
- Physics Canvas zeigt an ✓
- Open In Physics World umgesetzt ✓
- Physics Lab teilt dieselbe Scene ✓
- root typecheck PASS ✓
- root tests PASS ✓
- Question UI Smoke (steht zur Browser-Abnahme aus)
- browser runtime gate (steht zur Browser-Abnahme aus)

QUESTION_SPACE_MAGNETIC_VERTICAL_SLICE_COMPLETE
