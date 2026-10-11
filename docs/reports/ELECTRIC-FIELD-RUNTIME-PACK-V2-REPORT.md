# Electric Field Runtime Pack V2 — Mehrquellen-Punktladungen + Äquipotentiallinien

> Datei: `docs/reports/ELECTRIC-FIELD-RUNTIME-PACK-V2-REPORT.md`
> Abnahmedatum: 2026-08-22
> Vorgänger: `ELECTRIC_FIELD_RUNTIME_PACK_V1_COMPLETE` (siehe `MILESTONES.md`)

## 1. Ziel

V1 hat das elektrostatische Feld von Punktladungen von Domain Core → Scene → Engine → Verifier → Observation →
Question → Lab → Agent durchgängig verbunden, aber der Question-Einstieg konnte nur **eine einzelne Quelle** erzeugen. V2 rüstet die Engine nicht auf –
mehrere Quellen sind in Scene/Engine/core/Observation/Renderer/Verifier seit V1 in der gesamten Kette bereit – sondern:

1. **Mehrquellen-Question-Parsing**: Texte zu „gleich großen gleichnamigen/ungleichnamigen Ladungen / elektrischem Dipol“ werden in eine Mehrquellen-Scene überführt.
2. **Visualisierung von Äquipotentiallinien**: Marching Squares extrahiert Höhenlinien gleichen V, die als Skizze der Feldtopologie gerendert werden.
3. **R1-Korrektur + Agent-Erklärung für Mehrquellen**: hartkodiertes probeId `source-1` → `probeParticleOf`;
   Agent-Intentionen zu Vorzeichen bei Mehrquellen, Ursprung der Feldlinien und Überlagerung des Gesamtfelds.

## 2. Zentrale Erkenntnis

Mehrquellen sind seit V1 von Tag eins eine Architekturtatsache:

- `createPointChargeScene` akzeptiert `charges: PointChargeInput[]` (V1).
- `fieldAt(charges, at)` überlagert mit `superposeElectricFields` (V1).
- `physics-verifier` hat die Prüfung `electric_field_superposition` (V1).
- `traceStreamline` integriert entlang des **Gesamtfelds** → Feldlinien bei Mehrquellen krümmen sich von selbst (V1).
- `pointChargeSources` ist ein Array, der Inspector entfaltet über `sources.map` (V1).

V1 hat Mehrquellen nur deshalb nicht offengelegt, weil Question IR/Parser/Scene Builder nur eine einzelne Quelle erzeugten. V2 ergänzt nur diese Schicht.

## 3. Arbeitspakete

### A. Mehrquellen-Question-Parsing und Szenenaufbau

| Datei                                                         | Änderung                                                                                                                                                             |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/question-core/src/semantic-ir.ts`                   | `PhysicsSemanticIR` erhält `sourceCharges`/`samplePosition`; `SemanticRelation` erhält `multi_source_superposition`                                                  |
| `packages/question-core/src/semantic-validator.ts`            | Mehrquellen-Zweig: jede Quelle ungleich null und endlich, samplePosition erforderlich, Richtung bei Mehrquellen → Ambiguity „vom Gesamtfeld entscheiden die Feldlinien“ |
| `packages/question-core/src/deterministic-electric-parser.ts` | `MULTI_SOURCE_SIGNAL`, `isMultiSourceQuestionText`, `parseMultiSource` (±separation/2, Feldpunkt in der Mitte), `extractSourceCharges` (matchAll q1/q2, Ladung A/B); Mehrquellen haben Vorrang vor einer einzelnen Quelle |
| `packages/question-core/src/electric-scene-builder.ts`        | Mehrquellen-Zweig: `sourceCharges.map` → source-1/source-2 + probe an samplePosition                                                                                 |
| `packages/question-core/src/golden-questions.ts`              | 3 Mehrquellen-Aufgaben (electric-06 ungleichnamig Mittelpunkt, electric-07 gleichnamig Mittelpunkt, electric-08 Dipol Mittelpunkt)                                   |
| `packages/question-core/src/question-runtime.ts`              | `buildSolution` mit Titel/Beschreibung/Formel `E = Σ kqᵢ/rᵢ²` für Mehrquellen, Richtung „vom Gesamtfeld entscheiden die Feldlinien“                                  |
| `packages/question-core/tests/electric-questions.test.ts`     | 3 Mehrquellen-Aufgaben: `sourceCharges.length===2`, verification passed, E-Zahlenwert, Prüfung superposition                                                         |

### B. Visualisierung von Äquipotentiallinien

| Datei                                                           | Änderung                                                                                                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/engine-electric/src/field-solver.ts`                  | Schnittstelle `PotentialGrid` + `samplePotentialGrid` (Float64Array, NaN überspringt die Umgebung der Quellen)                                                            |
| `packages/engine-electric/src/index.ts`                         | Exportiert `samplePotentialGrid`, `PotentialGrid`                                                                                                                         |
| `packages/physics-scene/src/electric/electric-scene-builder.ts` | Bei Mehrquellen ergänzt `observableDefinitions` um `annotation: equipotential`                                                                                            |
| `vendor/.../scene-visual-model.ts`                              | `EquipotentialVisual`; `SceneVisualModel.equipotentials?`; `ObservableKey` erhält `equipotentials`                                                                        |
| `vendor/.../electric-visual-bridge.ts`                          | `potentialAt`, `contourAtLevel` (Marching Squares 16 Fälle + Sattel), `equipotentialsOf` (48×27-Gitter, automatisches Level, nur Mehrquellen), `visibilityOf` liest die Annotation equipotential |
| `vendor/.../renderers.module.css`                               | `.equipotentials` / `.equipotentialPath` (gestrichelt, Farbe measurement)                                                                                                 |
| `vendor/.../renderer-registry.tsx`                              | Rendering-Block für Äquipotentiallinien (nach den Feldlinien, vor den Vektoren)                                                                                           |
| `vendor/.../tests/electric-point-charge-visual.client.spec.tsx` | Äquipotentiallinien bei Mehrquellen nicht leer/geschlossen/visible; bei einer Quelle keine; DOM-Rendering                                                                  |
| `packages/engine-electric/tests/point-charge-runtime.test.ts`   | `samplePotentialGrid` Mittelpunkt V=0 (1×1-Gitter tastet genau den Ursprung ab), ferner Punkt stimmt mit solvePotentialAt überein                                         |

### C. R1-Korrektur + Agent-Erklärung für Mehrquellen

| Datei                                            | Änderung                                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendor/.../QuestionWorkspace.tsx`               | R1: probeId `find(p=>p.id!=='source-1')` → `probeParticleOf` (schließt alle source aus); `ELECTRIC_HIGHLIGHTS` erhält q1/q2/P → source-1/source-2/probe-1                              |
| `vendor/.../physics-agent.ts`                    | `sourceChargeSignsOf` (durchläuft alle source-Parameter); Kontext `chargeSigns`; `resolveHighlightTarget` unterstützt Wildcard mit Präfix `*`; `field-line` → `source-*`              |
| `vendor/.../physics-agent-answers.ts`            | `electric-field-direction` für Mehrquellen (behauptet keine einzelne Richtung); neu `electric-field-line-origin` (chargeSigns + Richtungsprüfung); neu `electric-superposition` (Prüfung superposition); matchIntent-Regeln |
| `vendor/.../tests/physics-agent.client.spec.tsx` | 7 Mehrquellen-Tests: chargeSigns, suggestions, Prüfung superposition, field-line-origin behauptet keine Richtung, direction bei Mehrquellen, field-line hebt source-ids hervor, R1 probeId |

## 4. Browser-Abnahme-Cases

| Case | Szenario                                  | Prüfpunkte                                                                                        | Ergebnis |
| ---- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- | -------- |
| J    | E am Mittelpunkt zweier gleich großer ungleichnamiger Punktladungen (Golden Question) | Aufgabenstellung parsen → Gegebenes hervorgehoben (q1/q2→source-1/source-2) → Überlagerungsschritte → verified | PASS |
| K    | Mehrquellen-Szenerendering + Inspector-Bearbeitung | Zwei source-Kugeln + gekrümmte Feldlinien + Äquipotentiallinien; Inspector mit mehreren source bearbeitbar; nach Bearbeitung Revision+1 weiterhin verified | PASS |
| L    | Agent „Warum gehen die Feldlinien von der positiven Ladung aus“ | Hebt stream (source-*) hervor + zitiert chargeSigns (positiv, negativ) + behauptet keine einzelne Richtung + Revision unverändert | PASS |
| M    | Agent „Wie entsteht das resultierende Feld“ | Zitiert die Prüfung `electric_field_superposition` + Überlagerungsformel + Revision unverändert    | PASS |

## 5. Gate-Zähler

| Gate                 | Anzahl |
| -------------------- | ------ |
| console errors       | 0      |
| page errors          | 0      |
| unhandled rejections | 0      |
| failed requests      | 0      |
| error responses      | 0      |

## 6. Screenshot-Liste

| Datei                                       | Inhalt                                  |
| ------------------------------------------- | --------------------------------------- |
| `question-dipole-field-1600x900.png`        | Aufgabe zum Mittelpunkt gleich großer ungleichnamiger Ladungen (Gegebenes hervorgehoben) |
| `electric-equipotential-1600x900.png`       | Mehrquellen-Lab: zwei source + gekrümmte Feldlinien + Äquipotentiallinien |
| `agent-field-line-origin-1600x900.png`      | Agent erklärt den Ursprung der Feldlinien (stream hervorgehoben) |
| `agent-superposition-1600x900.png`          | Agent erklärt die Überlagerung des Gesamtfelds |
| `question-dipole-field-final-1600x900.png`  | Endsatz: Dipolaufgabe                   |
| `electric-equipotential-final-1600x900.png` | Endsatz: Äquipotentiallinien-Lab        |
| `agent-superposition-final-1600x900.png`    | Endsatz: Überlagerung durch den Agent   |

## 7. Testdaten

- `test:core`: 387 passed (einschließlich 13 Tests der gesamten Kette der Mehrquellen-Aufgaben in question-core, 17 Tests zu engine-electric
  `samplePotentialGrid`, 13 Tests zur Mehrquellen-Überlagerung in physics-electric-core).
- `test:web` (ui-physicsos): 107 passed (einschließlich 9 Tests zum Visual der Äquipotentiallinien, 27 Mehrquellen-Tests des Agents).
- `typecheck:core` / `typecheck:web`: alles grün.
- Browser-Abnahme: `electric-acceptance-v2.mjs` 4 Cases alle PASS, 5 Gates bei 0.
- Regression: `electric-acceptance.mjs` (V1) 5 Cases alle PASS; `mechanics-acceptance.mjs` alle PASS.

## 8. Nicht Teil (ausdrückliche Grenzen)

- Ausbau des homogenen elektrischen Feldes / Plattenkondensator / Integration von Teilchentrajektorien (V3, erfordert Zeitintegration, hohes Risiko).
- Timeline-Ereignismarken (Backlog, erfordert die Modellierung diskreter Ereignisse).
- Anbindung des Agents an ein echtes Modell (Backlog, Contract ist vorhanden, `matchIntent` wird ersetzt).
- Zahlenwert-Assertions für Äquipotentiallinien (nur topologische Skizze, gehören nicht in den Contract von Observation/Verifier).
- Keine Änderung am in V1 abgenommenen Feldlinien-Rendering, an der Observation charge_sign und der Überlagerungsprüfung.
- Im Menü „Neu“ des Labors keine Mehrquellen-Vorlage (wie in V1 nur Question → Lab).
