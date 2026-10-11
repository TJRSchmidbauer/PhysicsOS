# Wave Runtime Pack V1 — Mechanische Wellen: Seilwelle / Zweiquellen-Interferenz / stehende Welle auf der Saite

> Datei: `docs/reports/WAVE-RUNTIME-PACK-V1-REPORT.md`
> Abnahmedatum: 2026-09-02
> Vorgänger: `CIRCUIT_RUNTIME_PACK_V1_COMPLETE`, Aufgabenbanken zu elektromagnetischer Induktion / Optik / Schaltungen online (siehe `MILESTONES.md`)

## 1. Ziel

Die erste Domäne aus Roadmap Phase 33 „Remaining Physics Domains“. Mechanische Wellen laufen wie alle bisherigen Domänen
durch dieselbe Kette Scene → Engine → Verifier → Observation → WorkspaceRuntime → Renderer → Lab →
Lehrschicht → Question, es wird keine eigene Runtime aufgemacht:

1. **Vertrag des Experimentierplatzes**: Eine `WaveBench` trägt drei geschlossene Teilmodelle (harmonische Transversalwelle auf dem Seil /
   Zweiquellen-Interferenz / stehende Welle auf der beidseitig eingespannten Saite), die Szene speichert nur editierbare Fakten wie A, λ, f und Geometrie.
2. **Engine**: Abtastung von y(x, t), Interferenzurteil und Knoten der stehenden Welle werden alle von `@physicsos/engine-wave` veröffentlicht,
   der Renderer berechnet keinen einzigen sin.
3. **Labor + Lehrschicht**: Drei Experimentvorlagen, drei Tutor-Lektionen, drei Selbsttest-Sätze, Agent-Hervorhebung.
4. **Aufgabenbank**: 6 Golden Questions laufen durch die echte Question Runtime, der Question → Lab-Zweig ist konsistent.

## 2. Zentrale Entscheidungen

- **Das Medium bestimmt die Wellengeschwindigkeit, die Quelle die Frequenz**. Die ursprüngliche Befehlssemantik war „f ändern, λ halten“ (was die Wellengeschwindigkeit
  mit der Frequenz mitlaufen lässt), im Widerspruch zur Selbsttest-Aufgabe „schneller schütteln macht das Wellenbild dichter, die Welle aber nicht schneller“. Geändert: Bei Seilwelle / Interferenzplatz
  leiten sowohl das Ändern von f als auch von v λ = v/f neu ab; beim Platz mit stehender Welle bestimmt die Geometrie λ, das Ändern von v / L / n leitet f_n = n·v/(2L) neu ab.
- **Die vertikale Vergrößerung wird einmal deklariert**. Eine Amplitude von 5 cm auf einem 1,2 m langen Seil ist 1:1 ein Haar; die Visual Bridge wählt nach
  „Amplitude ≈ 12 % der Querlänge“ aus festen Stufen eine ganzzahlige Vergrößerung und schreibt sie in die Achsenbeschriftung (`y / cm (×3)`) und
  die Anzeigezeile; alle Zahlen bleiben echte Werte, nur die Tintenlinie wird gedehnt.
- **Unerreichbare Geometrie wird auf der Befehlsebene abgewiesen**. Beobachtungspunkte mit |r₂ − r₁| > d existieren in der Ebene nicht,
  `SetWavePathDifference` liefert direkt `WAVE_PATH_DIFFERENCE_UNREACHABLE`, das Labor blitzt keine
  fehlgeschlagenen Frames auf; auch die Aufgabenstellung wird im Validator abgewiesen.
- **Die Wahl λ / v überlässt man der Contract-Schicht**. Wenn die Aufgabe „v und f“ oder „n und f_n“ liefert, reicht der Scene Builder nur die Spezifikation durch,
  der Vertrag des Experimentierplatzes rechnet nach v = λf / v = 2L·f/n um – dieselbe Identität, die auch die Befehle der Runtime pflegen.
- **Die Gesamtamplitude an Auslöschungspunkten wird exakt null**. Fließkommareste von cos(π(n + ½)) erscheinen in der Aufgabenlösung nicht mehr als Amplitude von 1e-15 cm.

## 3. Arbeitspakete

### A. Contract und Engine

| Datei                                                  | Änderung                                                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/physics-units/src/unit-definition.ts`        | `kilohertz` registriert                                                                                                                                                |
| `packages/physics-scene/src/scene.ts`                  | `WaveBench` (travelling / interference / standing), optionale Sammlung `waveBenches?`                                                                                  |
| `packages/physics-scene/src/scene-runtime.ts`          | Sechs Befehle: `SetWaveAmplitude / Frequency / Speed / PathDifference / StringLength / Harmonic`, Teilmodell-Guard, Neuableitung von λ / f_n, `WAVE_PATH_DIFFERENCE_UNREACHABLE` |
| `packages/physics-scene/src/scene-validation.ts`       | Prüfung von Dimensionen und Werten des Wellenplatzes (Ordnung der Harmonischen positive ganze Zahl)                                                                    |
| `packages/physics-scene/src/wave/*`                    | Fabrik `createWaveScene`, drei Vorlagen; die Spezifikation akzeptiert `waveSpeed` statt `wavelength`, `frequency` statt `waveSpeed`                                    |
| `packages/engine-wave/*`                               | `resolveWaveModel` der drei Teilmodelle, `stateAt` (Seilform mit adaptiver Abtastung 16 Punkte je Wellenlänge, markierte Teilchen, Dreiecks-Lokalisierung von Quelle / Punkt P, Knoten / Bäuche), 11 in die Engine eingebaute Prüfungen, Ableitung `interference_type` ±1/0 |
| `packages/physics-observation/src/wave-observation.ts` | Vier Arten von Observationen: waveform / wave_speed / wave_superposition / wave_nodes                                                                                  |

### B. Labor und Lehrschicht (`overlays/harness/files/packages/client/ui-physicsos`)

| Datei                                                                                                                           | Änderung                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scene-visual-model.ts`                                                                                                         | `PhysicsDomainId` erhält `wave`; Observation-Schlüssel `waveform / waveSpeed / superposition / nodes`; Primitive `WaveProfile / Marker / Source / Point / Node / Envelope / Front` |
| `physics/wave-visual-bridge.ts`                                                                                                 | Abtastpunkte der Engine → Canvas (cm, deklarierte vertikale Vergrößerung), λ / A / L / λ/2 / r₁ / r₂ / d laufen über die gemeinsame `Dimension`, Pfeile der Quergeschwindigkeit über die gemeinsamen `Vectors` |
| `physics/wave-renderer.tsx`                                                                                                     | Gleichgewichtslinie, Hüllkurve, sich ausbreitende Wellenfront, Seilform, Knoten / Bäuche, Wellenquelle, markierte Teilchen, nach Urteil eingefärbter Punkt P  |
| `physics/wave-workspace-runtime.ts`                                                                                             | `WaveWorkspaceRuntime`: A / f / v / Δ / L / n laufen über echte SceneCommands, pro Frame `stateAt`, y–t-Diagramm und eine Messwertzeile, Experimentzweig-Semantik wie in den anderen Domänen |
| `physics/experiment-templates.ts` + `locales.ts` + `icons/*` + `experiment-artwork.tsx` + `chrome.ts`                           | Kategorie „Mechanische Wellen“, drei Vorlagen, Fachfarbe `--physics-subject-wave`, Icons und Kartenillustrationen                                            |
| `ExperimentPicker.tsx` / `.module.css`                                                                                          | Kategorie-Tabs und Liste der Fachfarben werden aus `EXPERIMENT_TEMPLATE_GROUPS` abgeleitet (Auftrieb / Wärmelehre / elektromagnetische Induktion erhalten damit Tabs), Klassen `subject-*` der drei ergänzt; die Farbe für Auftrieb wird von der Schaltung getrennt |
| `physics/physics-tutor.ts`                                                                                                      | Drei Lektionen: Teilchen schwingen nur und wandern nicht / Gangunterschied entscheidet über Verstärkung und Abschwächung (bei Urteilswechsel wird die Frage gewechselt) / Warum eine stehende Welle nicht fortschreitet |
| `physics/experiment-self-checks.ts` + `question-core/experiment-self-checks.ts`                                                 | `waveTopicOf` bestimmt das Thema anhand der Canvas-Primitive (markiertes Teilchen / Wellenquelle / Knoten); drei Selbsttest-Sätze                             |
| `physics/physics-agent.ts`, `physics/experimental-branch.ts`, `domain-of-scene.ts`, `LabWorkspace.tsx`, `renderer-registry.tsx` | Hervorhebungsziele, sechs Zweigbefehle, Domänen-Routing, Runtime-Dispatch, Renderer-Registrierung                                                            |
| `QuestionWorkspace.tsx`                                                                                                         | wave-Dispatch: `stateAt(t)` ist der aktuelle Frame, der Frame t = 0 ist die Hüllkurve                                                                         |

### C. Aufgabenbank (`packages/question-core`)

| Datei                                                           | Änderung                                                                                                                                          |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `semantic-ir.ts`                                                | `WaveModelId`, Entitäten Seil / Wellenquelle / Beobachtungspunkt / Saite, Beziehungen wie `wave_speed_relation`, strukturierte Wellenfelder       |
| `deterministic-wave-parser.ts`                                  | Signale für mechanische Wellen + Ausschluss von Lichtinterferenz / Doppelspalt / elektromagnetischen Wellen / Echo; extrahiert A, λ, f (oder T), v, d, r₁ / r₂ (oder Δ), L, chinesisch geschriebene Ordnungen der Harmonischen; Ziele werden nur nach „求 / 判断“ (gesucht / beurteilen) erkannt |
| `semantic-validator.ts`                                         | `validateWaveIR`: v = λf — von drei Größen bestimmen zwei die dritte; Δ oder zwei Wegstrecken und \|r₂ − r₁\| ≤ d; stehende Welle L / n / v (oder f_n) |
| `wave-scene-builder.ts`                                         | Einheitenumrechnung und Durchreichen der Spezifikation; ist nur Δ gegeben, wird P im Abstand eines Quellabstands von S₁ platziert; schreibt `sourceQuestionId` |
| `question-runtime.ts`                                           | wave-Dispatch nach der Induktion und vor Elektrik / Magnetfeld / Mechanik; die Lösung zitiert die abgeleiteten Größen der Engine                  |
| `golden-questions.ts` / `knowledge-graph.ts` / `self-checks.ts` | 6 Golden Questions, Fachwurzel „Mechanische Wellen“ + 4 Knoten, sechs gemeinsame Sonden                                                           |

## 4. Browser-Abnahme-Cases (`tests/acceptance/wave-acceptance.mjs`)

| Case   | Szenario           | Prüfpunkte                                                                                                                                                                | Ergebnis |
| ------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| A      | Experimentbibliothek | Tab „Mechanische Wellen“ erscheint, Vorlagen ≥ 38, 3 Experimente in der Kategorie; Tabs Auftrieb / Wärmelehre / elektromagnetische Induktion ebenfalls vorhanden       | PASS |
| B      | Harmonische Transversalwelle auf dem Seil | Seilform echt gezeichnet, markiertes Teilchen, Beschriftungen λ / A, Anzeige `v = λf = 2 m/s · T = 1/f = 0.2 s`, `y / cm (×3)`, drei Engine-Prüfungen PASS, Canvas ≥ 55 %, kein Scrollen | PASS |
| C      | Timeline-seek 0.05 s | Wellenform wandert vor, cx des markierten Teilchens bleibt unverändert, cy ändert sich, Pfeil der Quergeschwindigkeit erscheint                                          | PASS |
| D      | Bearbeiten         | f ändern → Revision +1, λ = 0.2 m, v unverändert, T = 0.1 s; v ändern → λ = 0.4 m; Amplitude null wird abgelehnt und Revision bleibt unverändert                           | PASS |
| E      | Zweiquellen-Interferenz | Zwei Quellen, ≥ 8 Wellenfronten, P grün verstärkt, `Δ = 2 λ → Schwingung verstärkt`, `A_P = 6 cm`, Beschriftungen r₁ / r₂ / d, Prüfung der Gangunterschiedsregel; Δ auf 0.1 m ziehen → P rot abgeschwächt, `A_P = 0 cm` | PASS |
| F      | Stehende Welle auf der Saite | Zwei Hüllkurven, 3 Knoten 2 Bäuche, `λ = 2L/n = 1 m · f_n = n·v/2L = 40 Hz`, Beschriftungen L und λ/2, Prüfungen L = nλ/2 und Knoten am festen Ende; auf n = 3 umschalten → 4 Knoten 60 Hz; beim Abspielen schreitet die Timeline voran | PASS |
| G      | Aufgabenraum       | Wellenaufgabe READY, `Wave Engine · Verified`, Lösung 2.0000 m/s und 0.2000 s, Seilform im Aufgabencanvas; „In der Physikwelt öffnen“ → wave-Domäne Revision 0; Frequenz ändern → Experimentzweig-Badge, Revision 1, λ = 0.2 m | PASS |
| Responsiv | Seilwelle 1440 / 1920 | Canvas ≥ 55 %, kein Scrollen, nicht vergrößert                                                                                                                         | PASS |

## 5. Gate-Zähler

| Gate                 | Anzahl |
| -------------------- | ------ |
| console errors       | 0      |
| page errors          | 0      |
| unhandled rejections | 0      |
| failed requests      | 0      |
| error responses      | 0      |

## 6. Screenshot-Liste

| Datei                                           | Inhalt                                                |
| ----------------------------------------------- | ----------------------------------------------------- |
| `wave-library-1600x900.png`                     | Kategorie „Mechanische Wellen“ der Experimentbibliothek |
| `wave-rope-lab-1600x900.png`                    | Seilwelle t = 0                                       |
| `wave-rope-seek-1600x900.png`                   | Seilwelle t = 0.05 s: Wellenform vorgerückt, Teilchen zurück in der Gleichgewichtslage, v_y-Pfeil |
| `wave-interference-lab-1600x900.png`            | Zweiquellen-Interferenz: Verstärkungspunkt            |
| `wave-interference-destructive-1600x900.png`    | Gangunterschied auf λ/2 gezogen: Abschwächungspunkt   |
| `wave-standing-lab-1600x900.png`                | Stehende Welle auf der Saite, zweite Harmonische      |
| `wave-question-1600x900.png`                    | Seilwellen-Aufgabe im Aufgabenraum                    |
| `wave-question-branch-1600x900.png`             | Experimentzweig Question → Lab (λ = 0.2 m)            |
| `wave-rope-lab-1440x900.png` / `-1920x1080.png` | Responsiv                                             |

## 7. Testdaten

- `typecheck` (core + web) ohne Fehler.
- `test:core`: physics-scene 80 (einschließlich wave-scene-runtime 14), engine-wave 27, physics-observation
  24 (einschließlich wave-observation 10), question-core 399 (einschließlich wave-questions 16, Abdeckung der Wellen-
  Knoten durch learning-content) alles grün.
- `test:web`: 26 Dateien 347 Testfälle alles grün (einschließlich `wave.client.spec` mit 20 Punkten: Domänen-Routing, Zahlenwerte der drei Experimentierplätze und Kopplung der Befehle,
  Umschalten der Observables, Auflösung von Tutor / Selbsttest, zwei Aufgaben im Question Space, Einhängen im Lab).
- `lint`: core alles grün; web: die in diesem Slice geänderten Dateien sind alle grün.
- Browser-Abnahme: `wave-acceptance.mjs` CASE A–G + Responsiv alle PASS, 5 Gates bei 0.
- Regression: Alle acht Acceptance-Suiten mechanics / electric / electric-v2 / electric-region / composite / circuit / learning /
  library-home PASS. Zwei veraltete Assertions wurden mit der Produktentwicklung aktualisiert: library-home „fünf Farbpunkte“ →
  elf Farben (Kategorie-Tabs werden aus der Registry abgeleitet), circuit „Tab Schaltung 5 Experimente“ → 7 (einschließlich zweier Messexperimente der Mittelstufe).
- Overlay ↔ vendor Datei für Datei 0 Unterschiede; `upstream-changes.patch` wurde gecaptured (im vendor-Lockfile wurden die Links auf
  engine-induction / engine-wave ergänzt).

## 8. Nicht Teil (ausdrückliche Grenzen)

- Longitudinalwellen, Reflexion / Brechung / Beugung von Wellen, Doppler-Effekt (erfordern neue Teilmodelle).
- Vollständige Intensitätsverteilung des Interferenzbildes über die gesamte Ebene (derzeit wird nur ein Beobachtungspunkt P beurteilt und gezeichnet; die Wellenfronten dienen der Veranschaulichung).
- Dämpfung und Energiedissipation (ideales Medium).
- Agent-Intentionen für Wellen (Q&A-Schicht) — wie bei den anderen neuen Domänen gehen Tutor und Selbsttest voran, modellbasierte Agent-Antworten bleiben im Backlog.
- Erkennung von Wellenaufgaben aus Bildern / Wellenformdiagrammen (Backlog `QUESTION_IMAGE_PDF_INGEST_BACKLOG` unverändert).
