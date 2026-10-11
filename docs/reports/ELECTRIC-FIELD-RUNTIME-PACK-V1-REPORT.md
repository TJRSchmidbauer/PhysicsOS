# Electric Field Runtime Pack V1 — Report

> Datei: `docs/reports/ELECTRIC-FIELD-RUNTIME-PACK-V1-REPORT.md`
> Aufgabennummer: `ELECTRIC_FIELD_RUNTIME_PACK_V1`
> Meilenstein: `ELECTRIC_FIELD_RUNTIME_PACK_V1_COMPLETE` (siehe `MILESTONES.md`)

Der erste vertikale Slice des elektrostatischen Feldes von Punktladungen: von den Domänen-Contracts bis zur Agent-Hervorhebung ist die gesamte Kette durchgängig.
Dieser Bericht hält die Schritte 5–7 fest (Question → Lab → Agent → Browser-Abnahme),
die Schritte 1–4 (Domain Core / Scene / Engine / Observation / UI Renderer) wurden bereits in
`MILESTONES.md` festgehalten und abgenommen.

---

## 1. Umfang und Grenzen

**Tun**: Punktladung → elektrischer Feldvektor → Kraft auf das Probeteilchen → Observation → Question-Vorschau →
Lab-Experimentzweig → Agent-Hervorhebung.

**Nicht tun** (ausdrückliche Grenzen):

- Potenzialflächen, Kondensatoren, elektromagnetische Induktion (späteren Slices vorbehalten).
- Keine Elektrofeld-Vorlage im Menü „Neu“ des Labors (der Nutzer hat bestätigt, nur den Pfad Question → Lab zu gehen).
- Der bereits abgenommene `ElectricPointChargeRenderer` / `electric-visual-bridge` wird nicht verändert.
- Kein Anschluss an ein echtes Modell (der Agent bleibt deterministisch).
- Keine Timeline-Ereignismarken für Punktladungen (das statische Modell hat keine diskreten Ereignisse,
  `ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG` ist eingetragen).

**Zwei Entwurfsentscheidungen** (vom Nutzer bestätigt):

1. Nur Question → Lab, im Menü „Neu“ des Labors keine Elektrofeld-Vorlage.
2. Die drei Aufgaben teilen sich dieselbe Punktladungsszene mit Probeladung (E- und F-Vektoren werden beide gezeichnet und sind hervorhebbar,
   ohne die abgenommene Visual Bridge zu ändern).

---

## 2. Golden Questions zur Punktladung (Schritt 5)

### 2.1 Erweiterung der semantischen IR — `packages/question-core/src/semantic-ir.ts`

- `ElectricModelId` erhält `'point_charge_electrostatic_field'`.
- `SemanticTarget` erhält `'electric_field'` (E-Betrag gesucht) und
  `'electric_field_direction'` (Richtungsbestimmung).
- `SemanticRelation` erhält `'point_charge_field'`;
  `SemanticAssumption` erhält `'static_point_charge'`, `'vacuum_permittivity'`.
- `PhysicsSemanticIR` erhält das optionale `sourceDistance?: number` (Abstand r zur Quellladung, in Metern).

### 2.2 Parser — `packages/question-core/src/deterministic-electric-parser.ts`

- Neu `parsePointCharge`: Wenn das Punktladungssignal `/点电荷|距离.{0,6}(\d|r\s*=)|r\s*=\s*\d/`
  vorliegt und „匀强电场“ (homogenes elektrisches Feld) nicht enthalten ist, gilt `model = 'point_charge_electrostatic_field'`,
  relations `['point_charge_field']`, assumptions
  `['static_point_charge','electric_force_only','vacuum_permittivity',
'ignore_magnetic_field','ignore_gravity']`.
- Die vorhandenen charge/mass-Muster werden zur Extraktion der Quellladung q und der Probeladung q' wiederverwendet;
  das neue distance-Muster `/距.{0,4}(\d+(?:\.\d+)?)\s*(cm|m)/` parst r und schreibt es in
  `sourceDistance`.
- `detectTargets` erhält die Punktladungs-targets: Feldstärke / Richtung / elektrische Kraft.
- Bei Punktladungsaufgaben werden die Gegebenen `time` / `electric_field_strength` des homogenen Feldes nicht erzwungen.

### 2.3 Validator — `packages/question-core/src/semantic-validator.ts`

- `validateElectricIR` verzweigt nach `ir.model`:
  - `charged_particle_uniform_electric_field` geht in die ursprüngliche Prüfung für das homogene elektrische Feld (unverändert).
  - `point_charge_electrostatic_field` geht in `validatePointChargeIR`:
    Prüft, dass die Quellladung `charge` ungleich null und endlich ist und `sourceDistance` positiv und endlich; die Probeladung ist optional,
    muss aber, falls vorhanden, ungleich null sein; targets nicht leer. Bei `chargeSign === 'unknown'` wird eine Ambiguity gemeldet
    (Richtung nicht bestimmbar).

### 2.4 Scene Builder — `packages/question-core/src/electric-scene-builder.ts`

- `buildPointChargeSceneFromIR(ir, options)` ruft
  `createPointChargeScene` auf:
  - `charges: [{ id: 'source-1', charge: signedCharge, position: origin }]`.
  - `probe: { charge: q' ?? 1e-9, mass: 1, position: vec3(r, 0, 0) }`.
  - `samplePoint` nimmt die Probe-Position, damit der E-Vektor gezeichnet wird.

### 2.5 Runtime-Routing — `packages/question-core/src/question-runtime.ts` + `engine-selector.ts`

- `ir.domain === 'electric' && ir.model === 'point_charge_electrostatic_field'`
  ruft `buildPointChargeSceneFromIR` auf; andernfalls bleibt `buildElectricSceneFromIR`.
- In der Domäne electric liefert `model === 'point_charge_electrostatic_field'`
  `electricEngine` (teilt sich `ElectricEngine` mit dem homogenen elektrischen Feld, `canHandle` routet automatisch über
  `isPointChargeScene`).
- `buildSolution` verzweigt nach `ir.model`: Punktladung geht über E = kq/r², F = qE,
  die Richtung wird durch das Vorzeichen von q bestimmt, aus `simulation.derivedQuantities` werden
  `electric_field_magnitude` / `electric_force_magnitude` /
  `electric_field_vector` gelesen; die Schritte des homogenen elektrischen Feldes bleiben unverändert.

### 2.6 Drei Golden Questions — `packages/question-core/src/golden-questions.ts`

Sie teilen sich dieselbe Szene (Quellladung + Probeladung), nur targets/Aufgabenstellung wechseln:

| Aufgabe     | Quellladung | r     | Probeladung | Gesucht | Erwartung        |
| ----------- | ----------- | ----- | ----------- | ------- | ---------------- |
| Q1 Feldstärke | +5 μC     | 20 cm | —           | E       | ≈ 1.123×10⁶ V/m  |
| Q2 Elektrische Kraft | +5 μC | 20 cm | +2 μC     | F = qE  | ≈ 2.25 N         |
| Q3 Richtungsbestimmung | −3 μC | 10 cm | —      | Richtung | zur Ladung hin (nach innen) |

### 2.7 Tests — `packages/question-core/tests/electric-point-charge-questions.test.ts`

Jede der drei Aufgaben durchläuft `processQuestion` über die gesamte Kette und prüft `ir.model ===
'point_charge_electrostatic_field'`, `scene.fields[0].type === 'point_charge'`,
`simulation.verification.status === 'passed'` sowie die Zahlenwerte von
`electric_field_magnitude` / `electric_force_magnitude`;
Q3 prüft `chargeSign === 'negative'` und die Richtung.

---

## 3. Agent-Hervorhebung von E/q/F (Schritt 6)

### 3.1 drawnIds decken Punktladungen ab — `physics-agent.ts` und `QuestionWorkspace.tsx`

- `drawnVisualIds` hängt die ids von `view.pointChargeSources`, `view.fieldStreamlines` und
  `view.probe` an.
- `drawnIds()` in `QuestionWorkspace.tsx` wird gleich erweitert (Pfad für die Hervorhebung per Klick auf Gegebenes).
- `HIGHLIGHT_ALIASES` erhält die elektrischen Aliase `electric-field-vector` /
  `electric-force-vector` / `charge-source`;
  `HIGHLIGHT_LABELS` erhält die entsprechenden chinesischen Namen (elektrische Feldstärke / elektrische Kraft / Punktladung).

### 3.2 Elektrische Agent-Intentionen — `physics-agent-answers.ts`

Neu 3 Intents (verwenden die bestehende Schnittstelle `Intent`, `findDerived`, `findCheck`, `chip`
wieder):

| Intent                     | available-Bedingung                                  | Zitat                                                                            | Hervorhebung          |
| -------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------- |
| `electric-field-magnitude` | domain=electric und drawnIds enthält electric-field-vector | findDerived('电场强度') + findCheck('electric_field_1_over_r2')              | electric-field-vector |
| `electric-force-magnitude` | drawnIds enthält electric-force-vector               | findDerived('电场力') + findDerived('电场强度') + findCheck('electric_force_qE') | electric-force-vector |
| `electric-field-direction` | domain=electric und drawnIds enthält source-         | context.chargeSign entscheidet nach außen/innen/unbekannt; findCheck('electric_field_direction') | charge-source |

`matchIntent`-Regeln:

- `electric-field-magnitude`: `/电场强度|场强|求\s*E|\bE\s*多大|\bE\s*是怎么来的/i`
- `electric-force-magnitude`: `/电场力|求\s*F\b|\bF\s*=\s*q\s*E\b|试探电荷.*力/i`
- `electric-field-direction`: `/电场.{0,4}方向|场强.{0,4}方向|指向|向外|向内/i`

### 3.3 chargeSign-Kontext — `physics-agent.ts`

- `PhysicsAgentContext` erhält `chargeSign?: 'positive' | 'negative' | 'neutral'`.
- `sourceChargeSignOf(snapshot)` liest den ersten Parameterwert aus dem Abschnitt „Quellladung“ des Inspectors und
  gibt positive/negative/neutral zurück, für die Richtungsintention (ersetzt die unzuverlässige Beurteilung über das Label der abgeleiteten Größe).

### 3.4 Tests — `physics-agent.client.spec.tsx`

Neu 8 Testfälle: In der Punktladungsszene legt drawnIds source/streamline/probe offen;
`agentSuggestions` liefert 3 elektrische Vorschläge; der E-Intent zitiert die 1/r²-Prüfung + hebt den E-Vektor hervor;
der F-Intent zitiert die Prüfung F = qE + hebt den F-Vektor hervor; die Richtung bei negativer Ladung sagt „nach innen“; bei positiver Ladung
„nach außen“; die Hervorhebung ist reine Ansicht (Revision unverändert); Mechanikszenen haben keine elektrischen Intentionen.

---

## 4. Ergänzung der Client-Runtime (außerplanmäßig entdeckt, Voraussetzung für Schritt 7)

Beim Abnahme-Durchgang wurden drei im Plan nicht aufgeführte Lücken im Client entdeckt, die für den Kreislauf Punktladung → Question → Lab
notwendig sind und behoben wurden:

### 4.1 Punktladungs-Renderzweig in QuestionWorkspace — `QuestionWorkspace.tsx`

Der ursprüngliche Memo `electricModel` rief für **alle** electric scenes
`resolveUniformElectricModel(scene)` auf, bei Punktladungsszenen wirft das einen Fehler. Behebung:

- `electricModel` bekommt den Guard `domain === 'electric' && !isPointChargeScene(scene)`.
- Neuer Punktladungs-Renderzweig: Mit `simulation.states[0]` (Einzelzustand des statischen Modells) werden
  `observeElectricScene` + `electricSceneVisualAt` aufgerufen, engineLabel
  `'Electric Engine · Verified'`.

### 4.2 Punktladungszweig in editParameter — `electric-workspace-runtime.ts`

Das ursprüngliche `editParameter` behandelte nur ids des homogenen elektrischen Feldes (wie `electric-field-strength`),
`source-1` / `probe-q` / `probe-m` der Punktladung waren alle no-op. Behebung: neuer Punktladungszweig,
für source wird `SetParticleCharge` aufgerufen, für `probe-q` `SetParticleCharge`, für
`probe-m` `SetParticleMass`, die particleId stammt aus `sourceChargesOf` /
`probeParticleOf`.

### 4.3 Unterstützung des Experimentzweigs in ElectricWorkspaceRuntime — `electric-workspace-runtime.ts`

Der ursprünglichen Runtime fehlten `forkExperimentalScene` / `restoreOrigin`, Case H (Question →
Lab-Zweig) schlug fehl. Behebung: Spiegelung von `mechanics-runtime-bridge.ts`,

- `command()` prüft vor dem Anwenden eines Fakt-Befehls `requiresExperimentalFork` und ruft bei Bedarf
  `forkExperimentalScene` auf.
- Neues Feld `origin` (beim Konstruieren anhand von `sourceQuestionId` gespeichert), `restoreOrigin()`.
- `getSnapshot` erhält das Feld `branch` (`originQuestionTitle` /
  `parentRevision` / `canRestore`).

### 4.4 Inspector-Labels und Abschneiden der Prüfungen — `electric-workspace-runtime.ts`

- `DERIVED_LABELS` erhält die Punktladungs-Schlüssel (electric_field_vector/magnitude,
  electric_force_vector/magnitude, potential, acceleration_vector),
  damit findDerived('电场强度'/'电场力') nicht auf englische Schlüssel zurückfällt.
- `VERIFICATION_LABELS` erhält die chinesischen Namen von etwa 25 Punktladungs-Prüf-ids.
- `verificationOf` erhält den Parameter `pointCharge`: Punktladungen zeigen **alle** Prüfungen,
  das homogene elektrische Feld bleibt bei `slice(0,8)` (Punktladungen haben etwa 20 Prüfungen, das ursprüngliche Abschneiden hätte
  `electric_field_1_over_r2` verloren).

---

## 5. Browser-Abnahme (Schritt 7)

### 5.1 Abnahmeskript — `apps/web/e2e/electric-acceptance.mjs`

Nach dem Aufbau von `mechanics-acceptance.mjs` (dasselbe console/pageerror/network-Gate +
`check()` mit Assertion Punkt für Punkt). 5 Gate-Zähler: console / pageerror / rejections /
failedRequests / errorResponses.

| Case | Ablauf                                                                                             | Assertion                  |
| ---- | -------------------------------------------------------------------------------------------------- | -------------------------- |
| E    | Punktladungs-Golden-Question Q1 (E gesucht) → Aufgabenstellung → READY → Klick auf Gegebenes hebt auf dem Canvas hervor (q / r / E) → strukturierte Schritte | verified |
| F    | Q2 F = qE gesucht → wie oben, F hervorgehoben                                                      | verified                   |
| G    | Q3 Richtung positiv/negativ → Aufgabe zur Richtungsbestimmung                                      | verified                   |
| H    | Question → Lab „In der Physikwelt öffnen“ → Experimentzweig erzeugen → Lab rendert Punktladung → Inspector editierbar → weiterhin verified | Revision wird 1, Zweig vorhanden |
| I    | Agent fragt im Punktladungs-Lab „Wie groß ist die elektrische Feldstärke“ → Canvas hebt electric-field-vector hervor + zitiert 1/r²-Prüfung | Revision unverändert (reine Ansicht) |

Ergebnis: **ALL CHECKS PASSED, die 5 Gate-Zähler sind alle 0.**

### 5.2 Endgültiger Screenshot-Satz — `apps/web/e2e/final-screenshots.mjs`

Nach den vorhandenen Mechanik-Frames werden drei Punktladungs-Frames ergänzt:

| Screenshot                                     | Inhalt                                                |
| ---------------------------------------------- | ----------------------------------------------------- |
| `question-electric-field-final-1600x900.png`   | Q1 Aufgabenstellung + Gegebenes hervorgehoben + strukturierte Schritte |
| `electric-lab-point-charge-final-1600x900.png` | Question → Lab öffnet die Punktladungsszene (Glaskugel + Feldlinien + Sonde) |
| `agent-electric-highlight-final-1600x900.png`  | Agent-Intention zur elektrischen Feldstärke ausgelöst, E-Vektor hervorgehoben |

Ergebnis: **0 console / 0 page error**, alle erzeugt.

---

## 6. Verifikation (Ende-zu-Ende)

| Prüfung    | Befehl                                       | Ergebnis                                                                               |
| ---------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| Unit/Integration | `pnpm run test:core`                   | Alles grün (einschließlich der gesamten Kette der Punktladungsaufgaben in question-core, physics-electric-core, verifier) |
| Web-Tests  | `pnpm run test:web`                          | 97 Tests alle grün (einschließlich elektrischer Intentionen in `physics-agent.client.spec.tsx`, `electric.client.spec.tsx`) |
| Typen      | `pnpm run typecheck:core` / `typecheck:web`  | Alles grün                                                                             |
| Browser-Abnahme | `node apps/web/e2e/electric-acceptance.mjs` | 5 Cases alle PASS, 5 Gates bei 0                                                    |
| Screenshots | `node apps/web/e2e/final-screenshots.mjs`   | 0 console / 0 page error                                                               |
| Regression | `node apps/web/e2e/mechanics-acceptance.mjs` | Keine Regression                                                                       |

---

## 7. Liste der geänderten Dateien

**question-core**:

- `src/semantic-ir.ts` (IR-Erweiterung)
- `src/deterministic-electric-parser.ts` (Parsing-Zweig für Punktladungen)
- `src/semantic-validator.ts` (Prüfzweig für Punktladungen)
- `src/electric-scene-builder.ts` (Scene Builder für Punktladungen)
- `src/question-runtime.ts` (Verzweigung des Runtime-Routings)
- `src/engine-selector.ts` (Engine-Auswahl)
- `src/golden-questions.ts` (3 Punktladungsaufgaben)
- `tests/electric-point-charge-questions.test.ts` (neuer Test)

**ui-physicsos client**:

- `src/client/physics/physics-agent-answers.ts` (3 elektrische Intentionen + Regeln in matchIntent)
- `src/client/physics/physics-agent.ts` (chargeSign-Kontext + drawnVisualIds + Aliase)
- `src/client/physics/electric-workspace-runtime.ts` (DERIVED/VERIFICATION-Labels,
  Punktladungszweig in editParameter, Unterstützung des Experimentzweigs, Korrektur des Abschneidens in verificationOf)
- `src/client/QuestionWorkspace.tsx` (Punktladungs-Renderzweig + Erweiterung von drawnIds)
- `tests/physics-agent.client.spec.tsx` (8 elektrische Testfälle)

**e2e**:

- `apps/web/e2e/electric-acceptance.mjs` (neu)
- `apps/web/e2e/final-screenshots.mjs` (Punktladungs-Frames ergänzt)

**Dokumentation**:

- `docs/reports/MILESTONES.md` (Meilenstein in „abgeschlossen“ verschoben)
- `docs/reports/ELECTRIC-FIELD-RUNTIME-PACK-V1-REPORT.md` (dieser Bericht)
