# Composite Field Runtime V1 — Experimentzentrum + Produktintegration zusammengesetzter Felder

> Datei: `docs/reports/COMPOSITE-FIELD-RUNTIME-V1-REPORT.md`
> Abnahmedatum: 2026-08-24
> Vorgänger: `ELECTRIC_BOUNDARY_RUNTIME_COMPLETE` (siehe `MILESTONES.md`)
> Meilenstein: `COMPOSITE_FIELD_RUNTIME_V1_COMPLETE`

## 1. Ziel und Problem

Diese Runde löst eine **UI / Product Exposure Gap**: Auf unterer Ebene gibt es bereits fünf Runtimes –
Mechanics / Electric /
Electric-Region / Magnetic / Composite (engine-composite mit 26 Tests
alle grün), aber ein Schüler, der das Physiklabor betritt, sieht fast nur „die Bewegung geladener Teilchen im Magnetfeld“.
Diese Runde **erweitert die Engine nicht**, sondern macht die bestehenden Runtimes tatsächlich als erstellbare, bedienbare und beobachtbare Experimente sichtbar:

1. Das Labor hat nicht mehr nur ein Experiment – eine offizielle **Experiment Template Registry + Experimentauswahl**.
2. Fünf Experimente mit zusammengesetzten Feldern – **Geschwindigkeitsselektor**, **Massenspektrometer V1**, **E+B**, **E+B+g**, **mehrere Feldbereiche** – sind durchgängig angebunden.
3. Der Question Space erhält **21 Composite Golden Questions** und eine strukturierte Solution.
4. Der Agent erhält **13 Lehrintentionen für zusammengesetzte Felder**, die alle den Composite Verifier zitieren.

## 2. Experiment Library (Experimentzentrum)

### 2.1 Vorlagen-Registry

`vendor/.../ui-physicsos/src/client/physics/experiment-templates.ts`:

- `ExperimentTemplate { id, domain, label, hint, icon, tags, createScene, comingSoon? }`,
  gruppiert nach `mechanics / electric / magnetic / composite`.
- **16 erstellbare Vorlagen**: Mechanik 6 (gleichförmige geradlinige Bewegung, gleichmäßig beschleunigte Bewegung, waagerechter Wurf, schräger Wurf, zweites Newtonsches Gesetz, schiefe Ebene),
  Elektrik 4 (einzelne Punktladung, mehrere Punktladungen, Teilchen im homogenen elektrischen Feld, Ablenkung im Plattenkondensator), Magnetfeld 1 (Kreisbewegung im Magnetfeld),
  zusammengesetzte Felder 5 (Geschwindigkeitsselektor, Massenspektrometer, E+B, E+B+g, mehrere Feldbereiche).
- Das `createScene()` jeder Vorlage ist eine **echte Scene Factory**
  (`createMechanicsScene` / `createPointChargeScene` / `createParallelPlateScene` /
  `createMagneticScene` / `createVelocitySelectorScene` / `createMassSpectrometerScene` /
  `createCompositeFieldScene` / `createMultiRegionFieldScene`),
  ohne irgendeinen Dispatch per `if (type === ...)` und ohne gefälschten Canvas.
- **SceneId eindeutig**: `stampId = base + Date.now().toString(36) + laufende Nummer`,
  auch ein Doppelklick in derselben Millisekunde erzeugt keine ID-Kollision; feste Fixture-IDs wie `magnetic-demo-scene` treten nicht mehr auf.
- **Das Zyklotron wird nicht gefälscht**: engine-composite unterstützt nur abschnittsweise statische uniform regions, es gibt
  kein zeitveränderliches elektrisches Feld, daher ist die Vorlage mit `comingSoon: true` markiert, in der Auswahl grau mit „Demnächst unterstützt“ dargestellt,
  und `createScene()` wirft direkt eine Ausnahme.

### 2.2 Experimentauswahl (Experiment Picker)

`ExperimentPicker.tsx`: Suchfeld + Kategorie-Tabs (Alle/Mechanik/Elektrik/Magnetfeld/Zusammengesetzte Felder) +
kompakte 2–3-spaltige Experimentzeilen (SVG-Icon + Name + ein Satz Erklärung + Domänenlabel). Im Stil von Harness-Glaspanels,
keine großen SaaS-Karten; in der Auswahl werden keine Formeln gezeigt.

- **Schnellstart**: Bei erstmaliger Nutzung (kein letzter Eintrag) werden 4 repräsentative Experimente gezeigt (waagerechter Wurf, Plattenkondensator,
  Teilchen im Magnetfeld, Geschwindigkeitsselektor); sobald Einträge vorliegen, wird dieselbe Zeile zu „Zuletzt verwendet“ (localStorage, cap 3).
- **Drei Einstiege einheitlich**: Sidebar „Neu → Neues Physikexperiment“, „Neues Physikexperiment“ auf der Startseite,
  Leerzustand des Physiklabors, alle öffnen denselben Picker, es gibt nur eine Vorlagenliste.
- **Navigationsverhalten (Behebung eines Screenshot-Problems)**: Klick auf „Physiklabor“ ohne aktive Szene → Eintritt in den Leerzustand der Experimentbibliothek,
  **es wird nicht mehr automatisch eine Magnetic Scene eingefügt**; mit aktiver Szene → diese Szene wiederherstellen.
- **Experiment wechseln**: Der Szenenname in der Toolbar ist anklickbar (Name + Dropdown-Pfeil), öffnet die Auswahl, und das aktuelle
  Experiment ist **wiederherstellbar** (im Kopf der Auswahl erscheint die Schaltfläche „Zurück zum aktuellen Experiment · Szenenname“).
- **Zuletzt verwendete Räume speichern echte Scenes**: `surface-store` serialisiert jede geöffnete Szene (aus Vorlage erstellt, aus Aufgabe
  geöffnet, wiederhergestellt) in localStorage (cap 8); „Zuletzt verwendete Räume“ in Sidebar und Startseite zeigen
  Name + Typ-Badge (Experiment/Aufgabe) + Aktualisierungszeit, ein Klick stellt die gesamte PhysicsScene wieder her.

## 3. Composite Scene / Engine (wiederverwendet, nicht neu geschrieben)

Die Physikschicht verwendet vollständig die vor dieser Runde bereits abgenommenen Implementierungen:

- `physics-composite-core`: Geschlossene Lösung F = qE + qv×B + mg (48 Tests).
- `physics-scene/composite/composite-scene-factory.ts`:
  `createVelocitySelectorScene` (einzelner Bereich E⊥B), `createMassSpectrometerScene`
  (Selektorbereich → feldfreier Übergangsbereich → magnetischer Ablenkbereich, dreibereichige kontinuierliche Welt), `createCompositeFieldScene`
  (E+B, optional Schwerkraft), `createMultiRegionFieldScene`.
- `engine-composite`: Phasenzerlegung, exakte Grenzereignisse EnterRegion/ExitRegion/SwitchField, abgeleitete Größen
  (Selektionsgeschwindigkeit/Zyklotronradius/Zyklotronperiode/kinetische Energie …), Gesetzesprüfungen
  (Überlagerung der Resultierenden, Lorentzkraft verrichtet keine Arbeit, Energiekonsistenz, Periode unabhängig von der Geschwindigkeit), 26 Tests.
- `physics-verifier/composite-verifier.ts`: Prüfungen auf Geräteebene
  `velocity_selection_condition`, Betrag von elektrischer Kraft/Lorentzkraft, Radius der magnetischen Ablenkung.

**Ein in dieser Runde behobener Fehler bei der Geräteausrichtung**: Die drei Vorlagen Geschwindigkeitsselektor/E+B/E+B+g übergaben ursprünglich ausdrücklich
`magneticFieldOrientation: 'into_page'`, was bei der Anordnung q>0, v∥+x, E senkrecht nach oben
bewirkt, dass qE und qv×B **gleichgerichtet** sind (beide nach oben) und der Selektor „alle Teilchen aussortiert“. Nach der Umstellung auf `out_of_page`
sind beide Kräfte gleich groß und entgegengesetzt, bei v = E/B tritt es geradlinig durch – konsistent mit dem Fabrik-Standard und den Golden Questions.
Die Browser-Abnahme CASE B/D prüft dies direkt.

## 4. Geschwindigkeitsselektor (erstes UI-Experiment von Composite V1)

- Standardparameter: q = 1.6×10⁻¹⁹ C, m = 1.67×10⁻²⁷ kg, E = 2.0×10⁴ V/m (nach oben),
  B = 0.20 T (nach außen), v₀ = 1.0×10⁵ m/s = E/B, Bereich 0.4 m × 0.2 m.
- Der Canvas zeigt tatsächlich: Teilchen (q⁺-Halo-Kugel), E-Feldraster (im Bereich beschnitten), B-Feld-⊙/×-
  Glyphen, die Vektoren F_E / F_B / F_net / v, Trajektorie, Rechteck des Selektorbereichs + Beschriftung, Maßstab,
  Echtzeit-Readout (|v|, |E|, |B|, |F_E|, |F_B|, |F_net|).
- Der Inspector kann q / m / v₀ / E / B / Richtung des elektrischen Feldes bearbeiten; abgeleitete Größen (elektrische Kraft, Lorentzkraft,
  Schwerkraft, Resultierende, Beschleunigung, Geschwindigkeit, Selektionsgeschwindigkeit …) werden aus dem State des **aktuellen Frames** gelesen (Lehre aus Phase 4:
  nicht aus dem derived bei endTime lesen).
- Das Ändern von v₀ läuft über die echte Kette: SceneCommand → Revision +1 → Composite Engine rechnet neu →
  Verifier → Observation → Trajektorie des Canvas ändert sich; bei v₀ = E/B ist die „Geschwindigkeitsselektionsbedingung“ PASS
  und die Bahn geradlinig, bei v₀ ≠ E/B FAIL und abgelenkt (**die Physik bleibt verified** – die Geräteprüfung ist ein Messwert,
  kein Gesetzesverstoß).
- Der Abspielkopf zu Beginn liegt in der Mitte des ersten Zeitabschnitts „Feld wirksam“ im Feldbereich (`openingPlayheadTime`),
  sodass der Schüler beim Öffnen sofort sieht, wie sich die beiden Kräfte im Gleichgewicht befinden, statt eines einsamen Geschwindigkeitspfeils außerhalb des Feldes.

## 5. Massenspektrometer V1

- Dreibereichige kontinuierliche Physics World (keine drei Karten): Selektorbereich E+B (0,3×0,2 m) → feldfreier
  Übergangsbereich → magnetischer Ablenkbereich B (1,2×1,2 m). Standard E = 200 V/m, B = 2.0×10⁻³ T,
  v = E/B = 1.0×10⁵ m/s, Ablenkradius r = mv/(qB) ≈ 0.52 m liegt in derselben Größenordnung wie der Ablenkbereich,
  der Kreisbogen ist mit bloßem Auge erkennbar (per Screenshot-QA bestätigt).
- Der Scene Tree zeigt drei Bereiche (Selektorbereich E+B / feldfreier Übergangsbereich / magnetischer Ablenkbereich B, jeweils mit Abmessungen),
  ein Klick auf einen Bereich → der Canvas hebt das entsprechende Rechteck hervor.
- Die abgeleiteten Größen umfassen `Selektionsgeschwindigkeit`, `Zyklotronradius`, `Zyklotronperiode`; das spezifische Ladungs-Masse-Verhältnis wird auf der Question-Seite
  von der Runtime/den abgeleiteten Größen geliefert, der Parser rechnet nicht.

## 6. Question Space (Parser / Solution)

- `deterministic-composite-parser.ts`: Erkennt Signale wie Geschwindigkeitsselektor/Massenspektrometer/spezifische Ladung/Isotope/
  senkrecht zueinander/nicht abgelenkt/geradlinig durchtretend/Zyklotron; extrahiert q/m/v/E/B/r und Richtungswörter;
  erzeugt IR `domain: composite`, `model: velocity_selector | mass_spectrometer |
charged_particle_composite_field`. Fehlende Magnetfeldrichtung → AMBIGUOUS (comp-08),
  Zyklotron → ausdrücklich UNSUPPORTED (comp-21), es wird nicht erzwungen gelöst.
- `composite-scene-builder.ts`: IR → verwendet dieselben Scene Factories wieder, schreibt
  `sourceQuestionId`.
- **21 Golden Questions**: 8 Geschwindigkeitsselektor (einschließlich 1 Mehrdeutigkeitsprobe) + 6 Massenspektrometer +
  3 E+B + 3 E+B+g + 1 Ablehnungsprobe Zyklotron, alle in den Tests von `question-core` mit Assertions zu
  Domänen-Routing, Verifikationsstatus und Zahlenwerten (220 Tests alle grün).
- Strukturierte Solution in fünf Schritten: Richtung der elektrischen Kraft bestimmen → Richtung der Lorentzkraft bestimmen → Gleichgewichtsbedingung aufschreiben →
  verifizierte Engine-Ergebnisse lesen → Verifier-Prüfung. Die Formeln (v = E/B, r = mv/(|q|B),
  T = 2πm/(|q|B)) werden als Herleitung gezeigt, alle Zahlen-Facts stammen aus den abgeleiteten Größen der Runtime.
- **In der Physikwelt öffnen**: Composite-Aufgaben gehen wie Mechanik-/Elektrikaufgaben über denselben `openSurface('lab',
sceneRef)`, das Lab leitet durch `domainOfScene` automatisch an die CompositeWorkspaceRuntime.

## 7. Workspace Runtime / Renderer / Observation

- `CompositeWorkspaceRuntime` hält denselben
  `WorkspaceRuntime`-Contract wie die Runtimes für Magnetic/Mechanics/Electric ein; der Zweig composite in `LabWorkspace.buildRuntime` gibt eine echte
  Runtime zurück (zuvor ausdrücklich `return null`). Es gibt **kein** `CompositeLabWorkspace.tsx`,
  PhysicsWorkspace bleibt die einzige Shell.
- `CompositeRenderer` wird in die Registry `RENDERERS` aufgenommen und verwendet die bestehenden Primitive wieder: Teilchen-Halo,
  `Vectors`, Trajektorien-Path, Bereichsrechteck + per clipPath beschnittenes Feldraster (analog ElectricRegionRenderer),
  ⊙/×-Magnetfeld-Glyphen, Bereichsbeschriftungen. Der Code der Magnetic-/Electric-Renderer wurde nicht kopiert.
- Die Farben folgen den globalen semantischen Tokens (bereits in chrome.ts): Geschwindigkeit grün, E-Feld türkisblau, elektrische Kraft blau,
  Magnetfeld wenig gesättigtes Indigo, Lorentzkraft Kobaltblau, Schwerkraft Schiefergrau, Resultierende orange, Trajektorie Physics Blue.
- `observeCompositeScene` liefert die Observationen velocity/electric_force/magnetic_force/
  gravity_force/net_force/electric_field/magnetic_field/trajectory, die Checkboxen der Observables im Scene Tree und die Sichtbarkeit auf dem Canvas
  sind alle an die echte Observation angebunden
  (E2E prüft, dass Anhaken/Abwählen SVG-Vektoren hinzufügt/entfernt).

## 8. Timeline

- Die Ereignisse EnterRegion / ExitRegion / SwitchField der Composite Engine werden offiziell als Timeline-
  Marker abgebildet (`compositeEventsOf`), Beschriftung „Eintritt/Austritt + Rollenname des Bereichs“,
  Zeit ist der exakte Durchtrittszeitpunkt aus der Phasenzerlegung der Engine. Klick auf einen Marker → seek.
- Die Zeitanzeige verwendet das vorhandene adaptive Format (`formatClock` / `eventTimeText`): Im Mikrosekundenbereich wird
  `5.00e-7 s` angezeigt, und die Browser-Abnahme prüft, dass „kein einziger Marker als 0.00 Sekunden gelesen wird“.

## 9. Agent Composite Tutor

- `physics-agent-answers.ts` erhält 13 neue Intentionen für zusammengesetzte Felder: velocity-selector-balance,
  velocity-too-fast, velocity-too-slow, electric/magnetic-force-direction,
  magnetic-no-work, enter-magnetic-region, why-circular, spectrometer-radius,
  charge-to-mass, gravity-balance, net-force, region-transition.
- Die Antwort auf „Warum wird dieses Teilchen nicht abgelenkt?“ zitiert die benannte Prüfung `velocity_selection_condition` des Composite Verifiers
  + Kraftwerte der Runtime (|F_E|, |F_B|, |ΣF|),
  die Beleg-Chips zeigen [Szenen-Rev.] [Simulation verifiziert] [Geschwindigkeitsselektionsbedingung]; der Agent rechnet v = E/B nicht selbst.
- Als Tool bleibt `physics.ui.highlight` (es gibt kein highlightComposite); die Aliase wurden um
  electric-force / magnetic-force / gravity-force / net-force / selector-region /
  magnetic-region / drift-region / trajectory (einschließlich der visuellen ID `composite-trajectory`) erweitert.
- **Hervorhebung mehrerer Ziele in einer Antwort bildet die Vereinigung**: Die ursprüngliche Implementierung rief `setHighlight` einzeln auf und ersetzte jeweils; von drei Hervorhebungen blieb
  nur die letzte; nun aggregiert der Drawer `highlightIds` und wendet einmal an, elektrische Kraft und Lorentzkraft werden gleichzeitig hervorgehoben.
  Ist die Resultierende null und nicht gezeichnet, lehnt die Hervorhebung **ehrlich ab** („Der Canvas zeigt derzeit keine Resultierende“), E2E prüft,
  dass net-force im Gleichgewichts-Frame zu einer leeren Menge aufgelöst wird und nach Stören des Gleichgewichts auflösbar ist.

## 10. Experimental Branch

Wird eine Composite-Aufgabenszene im Lab mit E / B / v₀ geändert, forkt sie zuerst (`forkExperimentalScene`),
in der Toolbar erscheint das Badge „Experimentzweig · Quelle: Aufgabentitel“ und „Originalbedingungen der Aufgabe wiederherstellen“; Abspielen/seek/Umschalten von Observables
forkt nicht. E2E CASE G prüft: Öffnen forkt nicht → E ändern forkt (Revision des Zweigs zählt ab 1 neu,
weiterhin verified) → nach Wiederherstellung zurück bei den Originalbedingungen; die Gegebenen und die Lösung der Originalaufgabe werden nicht verunreinigt.

## 11. Browser-Abnahme (composite-acceptance.mjs, finaler Build alles grün)

| CASE | Inhalt                                                                                                             | Ergebnis |
| ---- | ------------------------------------------------------------------------------------------------------------------ | -------- |
| A    | Physiklabor → Experimentbibliothek (kein automatisches Magnetfeld); ≥16 Vorlagen; 5 Kategorie-Tabs; Schnellstart; Suchfilter; Zyklotron grau | PASS |
| B    | Geschwindigkeitsselektor erstellen: composite verified; Bereich/Teilchen/Trajektorie/E/F_E/F_B/v alle gezeichnet; Selektionsbedingung PASS | PASS |
| C    | v₀ → 1.5×10⁵: Revision +1, Trajektorie ändert sich, Selektionsbedingung FAIL, Physik weiterhin verified            | PASS |
| D    | v₀ → 1.0×10⁵: Selektionsbedingung wieder PASS, geradlinige Trajektorie wiederhergestellt                           | PASS |
| E    | Massenspektrometer: 3 Feldbereiche gezeichnet, Szenenbaum benennt drei Bereiche, Zyklotronradius aus der Engine    | PASS |
| F    | Timeline: ≥4 Eintritts-/Austritts-Marker, Exponentialzeitformat, Klick seek, Ereignisliste                         | PASS |
| G    | Geschwindigkeitsselektor-Aufgabe → READY → strukturierte Schritte → in der Physikwelt öffnen → Experimentzweig fork/wiederherstellen | PASS |
| H    | Massenspektrometer-Aufgabe → READY → Lab verwendet dieselbe Szene, 3 Bereiche vollständig                          | PASS |
| I    | Agent „Warum keine Ablenkung“: zitiert Geschwindigkeitsselektionsbedingung + Runtime-Zahlen, ≥2 Kräfte gleichzeitig hervorgehoben, Revision unverändert | PASS |
| +    | E+B+g: mg und F_net gezeichnet, verified; 1440/1920 responsiv (canvas ≥55 %, nicht vergrößert)                      | PASS |
| Gate | consoleErrors / pageErrors / unhandledRejections / failedRequests / errorResponses alle 0; kein Scrollbalken auf der ganzen Seite; Canvas sichtbar | PASS |

Regression (im selben finalen Build hintereinander ausgeführt): `mechanics-acceptance.mjs` (einschließlich Magnetfeld-Regression, nun über die
Experimentbibliothek erstellt), `electric-acceptance.mjs`, `electric-acceptance-v2.mjs`,
`electric-region-acceptance.mjs` — **alle ALL CHECKS PASSED**, Gates alle 0.
`harness-home-semantics.mjs`, `harness-home-shot.mjs`, `harness-lab-shot.mjs`
(nun Magnetfeld-Experiment über die Experimentbibliothek erstellt), `harness-lab-zoom.mjs`, `final-screenshots.mjs`
alle bestanden.

**Zwei notwendige Anpassungen der alten E2E**: ① Das Physiklabor lädt nicht mehr automatisch die Magnetfeld-Demo, die Magnetfeld-Regression wird nun
über die Auswahl erstellt (Änderung des Produktverhaltens, keine Aufweichung des Tests); ② Nachdem „Zuletzt verwendete Räume“ echte Szenen aufzeichnen,
erscheinen Sidebar-Schaltflächen mit demselben Namen wie die Aufgabe; alle Aufgabenklicks werden auf den Scope des `questions()`-Panels eingeengt,
damit nicht die Sidebar getroffen wird.

## 12. Screenshot QA (manuell Bild für Bild geprüft)

`docs/reports/screenshots/` (alle im finalen Build neu aufgenommen):

| Screenshot                                   | Ergebnis der manuellen Prüfung                                                               |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `experiment-library-1600x900.png`            | 16 Vorlagen + graues Zyklotron; Icons/Domänenlabels/Schnellstart/Tabs klar; kein Scrollbalken |
| `velocity-selector-lab-1600x900.png`         | F_E↑ und F_B↓ gleich groß und entgegengesetzt, Readout beider Kräfte jeweils 3.20e-15 N, Resultierende 0, geradlinige Trajektorie, Bereich erkennbar, Maßstab 20 cm |
| `velocity-selector-lab-1440x900 / 1920x1080` | Layout in drei Viewports einheitlich, Vektoren und Beschriftungen verdecken sich nicht, Canvas nicht vergrößert |
| `mass-spectrometer-lab-1600x900.png`         | Drei Bereiche erkennbar, im Selektor geradlinig, im Ablenkbereich klarer Kreisbogen (r≈0.52 m in derselben Größenordnung wie der 1,2-m-Bereich) |
| `composite-timeline-1600x900.png`            | Ereignispanel mit vier Zeilen Eintritt/Austritt + Exponentialzeitpunkten; Abspielkopf nach Klick auf Marker bei 5.00e-7 s |
| `composite-ebg-lab-1600x900.png`             | mg und F_net sichtbar; Readout \|F_net\| = 1.64e-26 N entspricht genau mg (E/B-Kräfte heben sich auf) |
| `velocity-selector-question-1600x900.png`    | Gegebene/gesuchte Größen/physikalische Beziehungen/fünf Analyseschritte/Verifikation 4/4; Zahlen stimmen mit dem Lab überein |
| `mass-spectrometer-question-1600x900.png`    | Bahnradius 0.5219 m aus der Engine; 21 Composite-Aufgaben in der Liste sichtbar              |
| `composite-agent-1600x900.png`               | Beleg-Chips + Hervorhebungs-Schaltflächen auf Chinesisch + ehrlicher Hinweis „Resultierende nicht gezeichnet“ |

Bei Szenen im Zentimeterbereich gibt es keine Vergrößerung durch ein Meter-Min-Extent (composite-visual-bridge verwendet Padding nach Inhaltsproportion,
sowohl das 1,2-m-Massenspektrometer als auch der 0,4-m-Selektor haben einen normalen Ausschnitt).

## 13. Test- und Build-Gates (Endstand)

| Gate                                                                    | Ergebnis                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| engine-composite                                                        | 26/26                                                                                                                                                 |
| physics-composite-core                                                  | 48/48                                                                                                                                                 |
| physics-scene                                                           | 39/39                                                                                                                                                 |
| physics-observation                                                     | 14/14                                                                                                                                                 |
| physics-verifier                                                        | 30/30                                                                                                                                                 |
| question-core (einschließlich 21 Composite Golden)                      | 220/220                                                                                                                                               |
| Übrige core-Packages (mechanics/electric/electric-region/magnetic/units/core…) | alles grün                                                                                                                                     |
| ui-physicsos (`test:web`)                                               | 190/190 (15 Dateien)                                                                                                                                  |
| `typecheck` (core + web)                                                | Null Fehler                                                                                                                                           |
| `lint` (core + web)                                                     | Null Fehler (dabei wurden nebenbei über 24 historische oxlint-Verstöße bereinigt)                                                                     |
| Harness build (ui-physicsos Bundle + web-frontend)                      | bestanden                                                                                                                                             |
| Harness GUI (`test:gui`, packages/client + packages/host)               | 3948/3950 bestanden, 1 übersprungen, 1 Upstream-Test `code-block` (shiki Lazy Loading) lief unter paralleler Last in ein Timeout, **einzeln erneut ausgeführt 15/15 bestanden** (gleichartig mit dem bestehenden `UPSTREAM_PARALLEL_TEST_FLAKE`) |
| overlay capture                                                         | nach `overlays/harness/files/` zurückgeschrieben                                                                                                      |

Der Harness Full Replay bleibt gemäß `HARNESS_WINDOWS_REPLAY_GATE_DEFERRED` weiterhin ausgenommen.

## 14. Liste der Abschlusskorrekturen dieser Runde (vom Browser/den Gates aufgedeckt, von Unit-Tests nicht erfasst)

1. **Geräteausrichtung des Selektors** (die Vorlage überschrieb mit ausdrücklichem into_page den korrekten Fabrik-Standard): Beide Kräfte gleichgerichtet,
   bei v = E/B wird dennoch abgelenkt – die Verifier-Assertion von CASE B hat es direkt aufgedeckt, auf out_of_page geändert.
2. **Hervorhebung mehrerer Ziele des Agents überschreibt sich gegenseitig**: Von drei highlight-Aufrufen blieb nur der letzte –
   die Assertion „≥2 Kräfte gleichzeitig“ in CASE I hat es aufgedeckt, der Drawer aggregiert die Vereinigung und wendet einmal an.
3. **Der Alias für die Hervorhebung `trajectory` enthielt `composite-trajectory` nicht**: von der Composite-Spec aufgedeckt.
4. **AgentDrawer hatte eine Kopie der Hervorhebungs-Beschriftungstabelle**: Fehlende Composite-Einträge führten dazu, dass die Schaltfläche
   die englische id `magnetic-force` zeigte – von der Screenshot-QA aufgedeckt, die Kopie wurde gelöscht und das gemeinsame `highlightLabel` verwendet.
5. **Stiller Bug durch Vorrang bei `?? 0 < 0`** (Fallback des Ladungsvorzeichens in electric-visual-bridge):
   wird als `?? (0<0)` geparst, jede Ladung ungleich null wird als negativ gewertet – vom lint-Gate aufgedeckt, durch Klammern behoben.
   Der Normalpfad wird von der Observation charge_sign abgedeckt, daher war er bisher nicht zutage getreten.
6. **Anpassung der alten E2E- und Screenshot-Skripte am Einstieg** (siehe §11) und eine veraltete Assertion in `harness-home-semantics.mjs`
   („Neue Physikwelt“ existiert in keiner Textversion, geändert zum produktkonformen
   „Neues Physikexperiment“).

## 15. Known Limitations

- **Zyklotron**: engine-composite hat keine zeitveränderlichen Felder, die Vorlage wird nur als „Demnächst unterstützt“ gezeigt.
- **Zuletzt verwendete Räume stellen die Anfangsszene wieder her**: Parameterbearbeitungen innerhalb der Runtime werden nicht in den Store zurückgeschrieben (so ist die Architektur,
  die Revision gehört der Runtime); Wiederherstellen = zurück zu den Bedingungen bei Erstellung der Szene.
- **Die E+B+g-Vorlage demonstriert mit einem Proton**: mg (1.64×10⁻²⁶ N) und die elektromagnetische Kraft (3.2×10⁻¹⁵ N) unterscheiden sich um
  11 Größenordnungen, „Schwerkraft ist für mikroskopische Teilchen vernachlässigbar“ ist selbst ein Lehrpunkt; das Dreikräfte-Gleichgewicht makroskopischer geladener Kugeln
  wird durch die drei E+B+g Golden Questions comp-18/19/20 abgedeckt (das Gleichgewicht qE = mg wird von der Engine gelöst).
- **Der magnetische Ablenkbereich ist rechteckig**: Der Kreisbogen des Teilchens kann den Bereich am unteren Rand verlassen (physikalisch korrekt), V1 baut
  kein halbrundes D-Box-Aussehen.
- **Der Agent ist weiterhin deterministisches Intent-Matching**: `AGENT_MODEL_BACKED_ANSWERS_BACKLOG` unverändert.
- **Der Upstream-Test `code-block` der GUI-Suite** läuft unter hoher paralleler Last gelegentlich in ein Timeout (einzeln alles grün),
  eingeordnet unter `UPSTREAM_PARALLEL_TEST_FLAKE`.

## 16. Beurteilung des Meilensteins

Prüfung der neunundvierzig Abschlusskriterien einzeln: Das Labor hat nicht mehr nur ein Experiment (16+ Vorlagen) ✅, Geschwindigkeitsselektor
vollständig ✅, Massenspektrometer V1 vollständig ✅, Composite E+B vollständig ✅, E+B+g vollständig ✅, Question
Composite vollständig (21 Golden + Solution in fünf Schritten) ✅, Agent Composite vollständig (13 Intentionen +
Verifier-Verweise) ✅, Timeline Regions vollständig ✅, Experimental Branch vollständig ✅,
UI Visual QA vollständig (§12) ✅, Tests alle grün (§13) ✅, Browser Gates alle grün (§11) ✅.

**Urteil: `COMPOSITE_FIELD_RUNTIME_V1_COMPLETE`.**
