# Electric Agent Dynamic Intents — Agent-Intentionen zur Dynamik im homogenen elektrischen Feld + komplexes räumliches Parsing

> Datei: `docs/reports/ELECTRIC-AGENT-DYNAMIC-INTENTS-REPORT.md`
> Abnahmedatum: 2026-08-22
> Vorgänger: `ELECTRIC_FIELD_RUNTIME_PACK_V2_COMPLETE` (siehe `MILESTONES.md`)

## 1. Ziel

Nachdem V2 Mehrquellen-Punktladungen und Äquipotentiallinien fertiggestellt hat, wurde bestätigt, dass die Dynamik im homogenen elektrischen Feld (wie waagerechter Wurf / wie gleichmäßige Verzögerung) seit V1
bereits in acht Schichten vollständig umgesetzt ist (analytische Lösung 121 Zustände → Verifikation pro Zustand → Trajektorien-Observation → Animationsuhr →
Trajektorien- und Vektor-Rendering → strukturierte Lösung), es gibt aber vier blinde Flecken:

1. **Der Agent sagt im homogenen Feld Falsches**: `electric-field-magnitude` ist fest als „Coulombsches Gesetz E=kq/r²“ kodiert
   - zitiert die punktladungsspezifische Prüfung `electric_field_1_over_r2` – das homogene Feld hat keine Quellladung.
2. **Dem Agent fehlen Dynamik-Intentionen**: Er kann nicht erklären, warum die Trajektorie eine Parabel ist, warum die Beschleunigung konstant ist,
   was Arbeit der elektrischen Kraft und der Arbeitssatz der kinetischen Energie sind und wie die Endgeschwindigkeit zustande kommt.
3. **Dem Parser fehlt komplexes räumliches Parsing**: Unterstützt wird nur „im Abstand r=20cm“, nicht „15cm links davon“.
4. **Die Dynamik im homogenen Feld wurde nie im Browser abgenommen**: electric-01/02 waren nie in einem Case.

Diese Phase ist rein inkrementell und risikoarm: Engine / Aufgabentypen werden nicht erweitert, es werden nur Agent-Intentionen, räumliches Parser-Parsing,
Abnahme und Sichtbarmachung ergänzt.

## 2. Zentrale Erkenntnis (Abschneidefehler im Cap von verificationOf)

`verificationOf(simulation, pointCharge)` in `electric-workspace-runtime.ts` nimmt für das
homogene Feld `checks.slice(0, 8)` – die ersten 8 sind alle Vorabprüfungen der Szene
(schema/revision/ids/units), die vier Dynamik-Prüfungen `electric_kinematic_consistency`,
`electric_force_consistency`, `electric_acceleration_consistency`, `electric_energy_consistency`
stehen hinter Position 8 und **werden abgeschnitten**.

Folge: Die `verification` des Snapshots im homogenen Feld enthält nie Dynamik-Prüfungen → der Agent kann sie nicht zitieren →
`isUniformElectricField` kann nicht unterscheiden. Das ist ein verborgener Bug aus V1, der bisher nicht ausgelöst wurde, weil es keine Agent-
Dynamik-Intentionen gab.

Behebung: Beide Modelle zeigen alle Checks (die Inspector-Liste ist ohnehin kurz). Die Punktladung nimmt alle
(V2 war bereits so), das homogene Feld wird auf alle umgestellt. `isUniformElectricField` unterscheidet anhand von
`electric_kinematic_consistency` und ist im stationären Zustand zuverlässig.

## 3. Arbeitspakete

### A. Korrektur der Agent-Texte im homogenen Feld

| Datei                                 | Änderung                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vendor/.../physics-agent-answers.ts` | A.1 Hilfsfunktion `isUniformElectricField(context)` (unterscheidet anhand der Prüfung `electric_kinematic_consistency`, nicht aus drawnIds abgeleitet); A.2 `electric-field-magnitude` verzweigt nach Szene (im homogenen Feld heißt es „E ist ein gegebener konstanter Wert“ und zitiert `electric_force_consistency`; bei der Punktladung bleiben Coulombsches Gesetz + 1/r²); A.3 `electric-force-magnitude` mit Rückfall `electric_force_qE ?? electric_force_consistency` + Textverzweigung |

### B. Vier neue Dynamik-Intentionen für das homogene Feld

| Intent                           | Zitierte Prüfung                    | Zitierte abgeleitete Größe | highlight                      |
| -------------------------------- | ----------------------------------- | -------------------------- | ------------------------------ |
| `electric-acceleration-constant` | `electric_acceleration_consistency` | Beschleunigung             | `electric-acceleration-vector` |
| `electric-trajectory-shape`      | `electric_kinematic_consistency`    | Verschiebung               | `electric-trajectory`          |
| `electric-work-energy`           | `electric_energy_consistency`       | Arbeit der elektrischen Kraft / Änderung der kinetischen Energie | `electric-force-vector` |
| `electric-velocity-evolution`    | `electric_kinematic_consistency`    | Geschwindigkeitsbetrag     | `electric-velocity-vector`     |

- Alle `available` verwenden das Gate `isUniformElectricField(context)` (schließt versehentliches Auslösen bei Punktladungen aus).
- Das Observable `acceleration-vector` ist standardmäßig aus, das `available` von B.1 nutzt weiterhin
  `drawnIds.includes('electric-acceleration-vector')` – der Schüler muss zuerst das Observable Beschleunigung einschalten, damit die Intention erscheint (wie bei Mechanik:
  drawnIds-Gate).
- Die 4 neuen Regeln in `matchIntent` stehen vor den breiten Regeln `electric-field-magnitude` / `electric-force-magnitude`,
  damit „Arbeit der elektrischen Kraft“ nicht von `electric-force-magnitude` verschluckt wird.
- `DERIVED_LABELS` ergänzt die chinesischen Labels der Dynamik-Schlüssel des homogenen Feldes
  (`displacement_vector`→Verschiebung, `electric_potential_change`→Potenzialänderung,
  `electric_potential_energy_change`→Änderung der potenziellen Energie, `work_by_electric_field`→
  Arbeit der elektrischen Kraft, `kinetic_energy_change`→Änderung der kinetischen Energie), damit Inspector und
  `findDerived` sie auf Chinesisch zitieren.

### C. Komplexes räumliches Parsing

| Datei                                                         | Änderung                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/question-core/src/semantic-ir.ts`                   | `PhysicsSemanticIR` erhält `sampleOffset?: { axis: 'x'\|'y'; sign: 1\|-1; distance: number }`                                                                                                                                                                                                    |
| `packages/question-core/src/deterministic-electric-parser.ts` | Regex `ELECTRIC_PATTERNS.directionalDistance` (passt auf „距其/在“ + Links/Rechts/Oben/Unten + Zahlenwert + Einheit); `parsePointCharge` extrahiert bevorzugt die richtungsabhängige Entfernung und füllt `sampleOffset` nach dem Richtungswort (group 1=Richtung, 2=Wert, 3=Einheit, Einheitenumrechnung inline, um einen Konflikt mit der group-Konvention von `extractValueWithUnit` zu vermeiden); der IR-Aufbau expandiert `sampleOffset` bedingt |
| `packages/question-core/src/electric-scene-builder.ts`        | Probe-Position bei einer einzelnen Quelle: Ist `sampleOffset` vorhanden, wird nach axis/sign platziert (x-Achse `vec3(sign·d, 0, 0)`, y-Achse `vec3(0, sign·d, 0)`), sonst bleibt `vec3(d, 0, 0)`; Mehrquellen unberührt                                                                          |
| `packages/question-core/src/golden-questions.ts`              | `electric-09-off-axis-field`: q=+4μC, 15cm links davon, gesucht sind Betrag und Richtung von E                                                                                                                                                                                                   |
| `packages/question-core/tests/electric-questions.test.ts`     | Test zur richtungsabhängigen Entfernung: `sampleOffset.axis==='x' && sign===-1`, Probe `position.vector.x===-0.15`, E≈1.598×10⁶, E zeigt in -x                                                                                                                                                  |

### D. Abnahme und Sichtbarmachung der Dynamik im homogenen Feld

| Datei                                     | Änderung                                                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `apps/web/e2e/electric-acceptance-v2.mjs` | Case N (electric-01 wie waagerechter Wurf: Aufgabe→Gegebenes→strukturierte Schritte→verified→Trajektorien-Rendering im Lab); Case O (Agent „Warum ist die Trajektorie eine Parabel“→zitiert `electric_kinematic_consistency`→kein Coulomb→Revision unverändert) |
| `apps/web/e2e/final-screenshots.mjs`      | 3 Screenshots zur Dynamik im homogenen Feld: `question-electric-dynamics-final`, `electric-dynamics-trajectory-final`, `agent-trajectory-shape-final`                                            |

**D.3 Nicht Teil**: Eine Vorlage für das homogene elektrische Feld im Menü „Neu“ des Labors. Konsistent mit der V1-Entscheidung „keine Elektrofeld-
Vorlage im Menü Neu des Labors“ – das homogene Feld läuft weiterhin über Question → Lab.

## 4. Browser-Abnahme-Cases

| Case | Szenario                                  | Prüfpunkte                                                                 | Ergebnis |
| ---- | ----------------------------------------- | -------------------------------------------------------------------------- | -------- |
| J    | E am Mittelpunkt zweier gleich großer ungleichnamiger Punktladungen (Golden Question) | Aufgabenstellung→Gegebenes hervorgehoben→Überlagerungsschritte→verified | PASS |
| K    | Mehrquellen-Rendering + Inspector-Bearbeitung | Zwei Quellen + gekrümmte Feldlinien + Äquipotentiallinien; Inspector mit mehreren Quellen bearbeitbar; nach Bearbeitung verified | PASS |
| L    | Agent „Warum gehen die Feldlinien von der positiven Ladung aus“ | Hervorhebung stream + zitiert chargeSigns + behauptet keine falsche Richtung + Revision unverändert | PASS |
| M    | Agent „Wie entsteht das resultierende Feld“ | Zitiert `electric_field_superposition` + Revision unverändert              | PASS |
| N    | Dynamikaufgabe im homogenen elektrischen Feld (wie waagerechter Wurf) | Aufgabe→strukturierte Schritte→Lab verified→Trajektorien-Rendering | PASS |
| O    | Agent „Warum ist die Trajektorie eine Parabel“ | Zitiert `electric_kinematic_consistency` + kein Coulomb + Revision unverändert | PASS |

## 5. Gate-Zähler

| Gate                 | Anzahl |
| -------------------- | ------ |
| console errors       | 0      |
| page errors          | 0      |
| unhandled rejections | 0      |
| failed requests      | 0      |
| error responses      | 0      |

## 6. Screenshot-Liste

| Datei                                             | Inhalt                                          |
| ------------------------------------------------- | ----------------------------------------------- |
| `electric-dynamics-trajectory-1600x900.png`       | Lab wie waagerechter Wurf im homogenen Feld: Trajektorienlinie + E/F/v-Vektoren |
| `agent-trajectory-shape-1600x900.png`             | Agent erklärt die parabelförmige Trajektorie    |
| `question-electric-dynamics-final-1600x900.png`   | Endsatz: Dynamikaufgabe im homogenen Feld       |
| `electric-dynamics-trajectory-final-1600x900.png` | Endsatz: Trajektorien-Lab                       |
| `agent-trajectory-shape-final-1600x900.png`       | Endsatz: Agent erklärt die Parabel              |

## 7. Testdaten

- `test:core`: alles grün (question-core 108 Tests einschließlich der Aufgabe zur richtungsabhängigen Entfernung; keine Regression in allen core-Packages).
- `test:web` (ui-physicsos): 117 passed (einschließlich der neuen 10 Tests für Dynamik-Intents im homogenen Feld,
  der korrigierten Texttests zu `electric-field/force-magnitude` im homogenen Feld).
- `typecheck:core` / `typecheck:web`: alles grün (Hinweis zu Web
  `exactOptionalPropertyTypes`: `sampleOffset` verwendet bedingte Expansion und übergibt kein `undefined`).
- Client-Bundle neu gebaut.
- Browser-Abnahme: `electric-acceptance-v2.mjs` Case J-O alle PASS, 5 Gates bei 0.
- Regression: `electric-acceptance.mjs` (V1) 5 Cases alle PASS;
  `mechanics-acceptance.mjs` alle PASS.

## 8. Nicht Teil (ausdrückliche Grenzen)

- **Kein neues begrenztes elektrisches Feld zwischen Parallelplatten** (nicht vom Nutzer gewählt; abschnittsweise analytische Engine + neue Scene-Form mit mittlerem Risiko, einer späteren Phase vorbehalten).
- **Keine neue 1/r²-Dynamik der Punktladung** (erfordert Integration mit adaptiver Schrittweite, hohes Risiko, Backlog).
- **Keine neue Engine-Fähigkeit für das homogene elektrische Feld** (bereits vollständig, Engine / Scene Factory / Verifier / Observation / Visual werden nicht angefasst).
- **Keine Änderung an den in V1/V2 abgenommenen Punktladungs-Agent-Intentionen** (`electric-field-direction`,
  `electric-field-line-origin`, `electric-superposition` behalten die Mehrquellenlogik).
- **Keine Timeline-Ereignismarken** (das globale homogene Feld hat keine diskreten Ereignisse; Backlog
  `ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG` hat seine Startbedingung nicht erfüllt).
- **Im Menü „Neu“ des Labors keine Vorlage für das homogene elektrische Feld** (konsistent mit der V1-Entscheidung, nur Question → Lab).
- **Das komplexe räumliche Parsing unterstützt nur richtungsabhängige Entfernungen bei einer einzelnen Punktladung** („5cm links“), bei Mehrquellen-Szenen gibt es bereits
  `samplePosition`, keine Erweiterung.
