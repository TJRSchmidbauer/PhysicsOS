# PhysicsOS Meilensteine

> Datei: `docs/reports/MILESTONES.md`
> Nur bereits abgenommene Meilensteine und aktuell laufende Phasen werden aufgezeichnet. Für jeden Eintrag wird die Position der Abnahmegrundlage angegeben.

---

## Abgeschlossen

### MAGNETIC_RUNTIME_VERTICAL_SLICE_COMPLETE

Kreisbewegung geladener Teilchen im homogenen Magnetfeld: Scene → SceneCommand/Revision → MagneticEngine →
Verifier → Observation → Canvas vollständig integriert, Inspector kann `q / m / v₀ / B` und
Magnetfeldrichtung bearbeiten, abgeleitete Größen (R / T / ω / F) werden von der Engine geliefert.

Abnahmegrundlage: `docs/reports/PHASE-01-FOUNDATION-REPORT.md`,
`vendor/deepseek-harness/packages/client/ui-physicsos/tests/physics-runtime-bridge.client.spec.tsx`

### QUESTION_SPACE_MAGNETIC_VERTICAL_SLICE_COMPLETE

Aufgabentext → Semantic IR → Scene → Engine → Verifier → strukturierte Lösung,
mit Unterstützung von „In der Physikwelt öffnen“ zum Übergeben derselben Szenenrevision an das Physiklabor.

Abnahmegrundlage: `docs/reports/QUESTION-SPACE-MAGNETIC-VERTICAL-SLICE-REPORT.md`

### MECHANICS_RUNTIME_PACK_V1_COMPLETE

5 Mechanikmodelle (konstantgeschwindig / gleichmäßig beschleunigt / Wurf / Newtons zweites Gesetz / schiefe Ebene) + einheitliche
`PhysicsWorkspace`-Shell + Renderer Registry + editierbarer Inspector +
Freikörperdiagramm (mg / N / f / ΣF / a und Kraftzerlegung) + Zeitleisten-Ereignismarker + Datenpanel +
Mechanik-UI für Aufgaben (Klicken auf bekannte Größen hebt hervor, strukturierte Herleitung, benannte Validierung) +
**Question → Lab-Experimentzweig** (Aufgabenfakten dürfen nicht durch Experimente verfälscht werden) +
**Runtime-aware Agent** (View-Tools und Domänenbefehle sind streng getrennt).

Abnahmegrundlage: `docs/reports/MECHANICS-RUNTIME-PACK-V1-REPORT.md`
(§19–§37, inklusive 8 Browser-Cases, Regressionsgates A–H, abschließender Screenshot-Satz)

Abnahmedaten: Root-Typecheck / Root-Tests / Harness-Build erfolgreich;
`ui-physicsos` 11 Dateien 83 Tests erfolgreich; Harness `test:gui` 283 Dateien 3842 Tests erfolgreich;
Browser-Abnahme 52 Punkte vollständig bestanden, alle fünf Gate-Zähler bei 0.

### ELECTRIC_FIELD_RUNTIME_PACK_V1_COMPLETE

Erster vertikaler Ausschnitt des elektrostatischen Felds von Punktladungen: Domain Core → Scene → Engine → Verifier →
Observation → Aufgaben-Vorschau → Lab → Agent-Hervorhebung vollständig integriert.
Domänenvertrag für Punktladungen `physics-electric-core` (E = kq/r², F = qE, Richtung, Superposition,
Newtons drittes Gesetz, expliziter Fehler bei r = 0); `createPointChargeScene` +
`PointChargeField` + Probe-Teilchen; `point-charge-model` mit `canHandle` /
`simulate` / derivedQuantities (E-Vektor und Betrag, F = qE, Richtung);
`observeElectricScene` erweitert um `electric_field_vector` und `charge_sign`;
`ElectricPointChargeRenderer` (+q / −q rote/blaue Glaskugeln + äquidistante blaue Feldlinienpfeile +
Probe + E- und F-Vektoren); 3 Gold-Aufgaben (E berechnen, F = qE berechnen, Vorzeichen/Richtung bestimmen),
gemeinsame Szene mit Testladung; **Question → Lab-Experimentzweig** ebenso für Punktladungen
(`ElectricWorkspaceRuntime` unterstützt `forkExperimentalScene` / `restoreOrigin`);
**Agent-Intentionen für Elektrizität** (E-Betrag verweist auf 1/r²-Prüfung, F = qE verweist auf F=qE-Prüfung,
Vorzeichen/Richtungsbestimmung), Hervorhebung von E/F-Vektoren ist reine View-Operation.
**Nicht durchgeführt:** Äquipotentialflächen, Kondensator, elektromagnetische Induktion (spätere Ausschnitte); Lab-Neu-Menü ergänzt um elektrisches Feld-Template
(nur Question → Lab).

Abnahmegrundlage: `docs/reports/ELECTRIC-FIELD-RUNTIME-PACK-V1-REPORT.md`
(inklusive 5 Browser-Cases E–I, 5 Gate-Zähler, abschließender Screenshot-Satz)

Abnahmedaten: Root-Typecheck erfolgreich; `test:core` vollständig grün (inkl. question-core Punktladungsaufgaben-End-to-End,
physics-electric-core, Verifier); `test:web` 97 Tests vollständig grün (inkl.
`physics-agent.client.spec.tsx` elektrische Intentionen und `electric.client.spec.tsx`);
Browser-Abnahme `electric-acceptance.mjs` 5 Cases alle PASS, 5 Gate-Zähler bei 0;
Regression `mechanics-acceptance.mjs` ohne Rückfälle.

### ELECTRIC_FIELD_RUNTIME_PACK_V2_COMPLETE

Vertiefung für Mehrquellen-Punktladungen + Äquipotentiallinien-Visualisierung + R1-Fix + Agent-Erklärung für Mehrquellen.
Mehrquellen waren bereits in V1 in Scene/Engine/Verifier/Observation/Renderer vollständig integriert
(`createPointChargeScene` akzeptiert `charges[]`, `fieldAt` führt Superposition durch,
`electric_field_superposition`-Prüfung, `traceStreamline` integriert entlang Gesamtfeld,
`pointChargeSources`-Array, Inspector entfaltet nach `sources.map`) — V2 schließt nur
Mehrquellen-Aufgabenparsing, Äquipotentiallinien und Agent-Erweiterung ab.

**A. Mehrquellen-Aufgabenparsing:** `PhysicsSemanticIR` erweitert um `sourceCharges`/`samplePosition`;
Parser ergänzt `MULTI_SOURCE_SIGNAL` (q1/q2, gleichnamig/ungleichnamig, elektrisches Dipol),
`parseMultiSource` (zwei Quellen ±separation/2, Mittelpunkt als Feldpunkt), `extractSourceCharges`
(matchAll extrahiert q1/q2 und Ladung A/B); Szenen-Builder mit Mehrquellen-Zweig; 3 Gold-Aufgaben
(gleichnamige ungleichnamige Ladungen Mittelpunkt E≈3.6e6, gleichnamig Mittelpunkt E=0, Dipol-Mittelpunkt E≈7.19e6);
`buildSolution` mit Superpositionsformel und Richtungsangabe.

**B. Äquipotentiallinien-Visualisierung:** `samplePotentialGrid` (Float64Array-Raster V, NaN überspringt Singularitäten);
`EquipotentialVisual` (level + Polygone + geschlossen); Marching Squares zur Isohypsenextraktion
(16 Cases + Sattel, Greedy-Verknüpfung zu Polylinien); Mehrquellen-Szenen zeigen standardmäßig Äquipotentiallinien (Annotation observable),
Einzelquelle standardmäßig aus; Renderer zeichnet gestrichelte Äquipotentialpfade. Äquipotentiallinien dienen als Topologiehinweis,
werden nicht in Observation/Verifier-Vertrag aufgenommen (exaktes V in abgeleitetem `potential`).

**C. R1-Fix + Agent-Erklärung für Mehrquellen:** `QuestionWorkspace` ändert probeId von hartcodiert `source-1` zu `probeParticleOf`
(ausschließt alle deklarierten Quellen, gibt für reine Feldaufgaben ohne Probe undefined zurück);
`PhysicsAgentContext` erweitert um `chargeSigns` (Signatur-Array für Mehrquellen); neue Intention
`electric-field-line-origin` (Feldlinien beginnen an positiven Ladungen, verweist auf `chargeSigns` + Richtungskontrolle,
behauptet keine Einheitsrichtung bei Mehrquellen) und `electric-superposition` (Gesamtfeld-Superposition, verweist auf
`electric_field_superposition`-Prüfung); `matchIntent`-Regeln; `resolveHighlightTarget` unterstützt
`*`-Wildcard-Präfix (`field-line` → `source-*`, Renderer hebt Stream nach sourceId hervor).

Abnahmegrundlage: `docs/reports/ELECTRIC-FIELD-RUNTIME-PACK-V2-REPORT.md`
(inklusive 4 Browser-Cases J–M, 5 Gate-Zähler, abschließender Screenshot-Satz)

Abnahmedaten: `test:core` 387 Tests vollständig grün (inkl. question-core Mehrquellen-End-to-End, engine-electric
`samplePotentialGrid`); `test:web` ui-physicsos 107 Tests vollständig grün (inkl. Äquipotentiallinien-Visual,
Agent-Mehrquellen-Intentionen 27 Tests); typecheck:core/web vollständig grün; Browser-Abnahme
`electric-acceptance-v2.mjs` 4 Cases alle PASS, 5 Gates bei 0; Regression
`electric-acceptance.mjs` und `mechanics-acceptance.mjs` ohne Rückfälle.

**Nicht durchgeführt** (klare Abgrenzung): Homogenes elektrisches Feld verfeinern / Plattenkondensator / Teilchentrajektorienintegration (V3);
Zeitleisten-Ereignismarker (Backlog); Agent-Anbindung an echtes Modell (Backlog); numerische Äquipotentiallinien-Assertionen
(nur topologischer Hinweis); Lab-Neu-Menü um Mehrquellen-Template erweitern (nur Question → Lab).

### ELECTRIC_AGENT_DYNAMIC_INTENTS_COMPLETE

Homogenes elektrisches Feld - Dynamik (bereits in V1 vollständig implementiert): Ergänzung um Agent-Dynamikintentionen + komplexe räumliche Parsing +
Browser-Abnahme. Reiner Zusatz, geringes Risiko, keine Erweiterung von Engine/Fragetypen.

**A. Agent-Text für homogenes Feld korrigiert:** `isUniformElectricField(context)`-Helper (Unterscheidung basierend auf
`electric_kinematic_consistency`-Prüfung); `electric-field-magnitude` verzweigt nach Szenentyp
(homogenes Feld: "E ist gegebener konstanter Wert", verweist auf `electric_force_consistency`, behauptet nicht Coulombsches Gesetz);
`electric-force-magnitude` fällt auf `electric_force_qE ?? electric_force_consistency` zurück.

**B. 4 Dynamikintentionen:** `electric-acceleration-constant`,
`electric-trajectory-shape`, `electric-work-energy`, `electric-velocity-evolution`,
jeweils mit Verweis auf zugehörige homogene-Feld-Prüfung + abgeleitete Größen, `available` über `isUniformElectricField`-Schranke.
`matchIntent`-Regeln vor allgemeineren Regeln platziert. `DERIVED_LABELS` um deutsche Bezeichnungen für Dynamik des homogenen Felds ergänzt
(Verschiebung/Potenzialänderung/Änderung potentielle Energie/Arbeit der elektrischen Kraft/Änderung kinetische Energie).

**C. Komplexes räumliches Parsing:** `PhysicsSemanticIR` erweitert um `sampleOffset`; Parser ergänzt
`directionalDistance`-Muster ("15 cm links davon"), hat Vorrang vor nacktem Abstand; Szenen-Builder platziert
Einzelquellen-Probe nach Achse/Vorzeichen; Gold-Aufgabe `electric-09-off-axis-field`.

**D. Abnahme:** Case N (homogenes-Feld-Wurfaufgabe → Lab-Trajektorie), Case O (Agent-Erklärung parabelförmiger Trajektorie,
verweist auf `electric_kinematic_consistency`, nicht auf Coulombsches Gesetz, Revision unverändert).

**Kritischer Bugfix:** `verificationOf` schnitt bei homogenem Feld mit `checks.slice(0, 8)` vier Dynamikprüfungen ab
(V1-Rückstand, zuvor nie durch Dynamikintentionen ausgelöst) → für beide Modelle werden jetzt alle Prüfungen angezeigt.

Abnahmegrundlage: `docs/reports/ELECTRIC-AGENT-DYNAMIC-INTENTS-REPORT.md`
(inklusive Case J–O, 5 Gate-Zähler, abschließender Screenshot-Satz)

Abnahmedaten: `test:core` vollständig grün (question-core 108); `test:web` ui-physicsos 117 vollständig grün
(inkl. 10 Tests für Dynamikintentionen homogenes Feld); typecheck:core/web vollständig grün; Bundle neu gebaut;
Browser-Abnahme `electric-acceptance-v2.mjs` Case J–O alle PASS, 5 Gates bei 0; Regression
`electric-acceptance.mjs` und `mechanics-acceptance.mjs` ohne Rückfälle.

**Nicht durchgeführt** (klare Abgrenzung): Begrenztes homogenes Feld zwischen Platten (Engine-segmentiertes Parsing, mittleres Risiko, später);
Dynamik für Punktladungen 1/r² (adaptiver Zeitschritt-Integrationsaufwand, Backlog); Zeitleisten-Ereignismarker (Backlog);
Lab-Neu-Menü um homogenes Feld-Template erweitern (wie V1, nur Question → Lab); komplexes räumliches Parsing nur für
Einzelquellen-Punktladung mit direktionalem Abstand (Mehrquellen bereits `samplePosition`).

---

## ELECTRIC_BOUNDARY_RUNTIME_COMPLETE / PHYSICSOS_PHASE4_COMPLETE

**Datum:** 2026-08-23

**Umfang:** Ablenkung geladener Teilchen im Plattenkondensator - zentraler Prüfungsstoff im elektrischen Feld der Oberstufe, zuvor vollständig fehlend.
V1/V2/Phase 3 deckten nur unbegrenztes homogenes Feld und elektrostatisches Feld von Punktladungen ab, ohne das Konzept eines Felds, das nur in einem bestimmten Bereich existiert,
und ohne diskrete Ereignisse wie Eintreten/Austreten aus dem Feldbereich oder Auftreffen auf Platten.

**A. Neue Engine:** `@physicsos/engine-electric-region` implementiert dieselbe
`PhysicsEngine<PhysicsScene, PhysicsEventLike>`-Schnittstelle (isomorph zu magnetic/mechanics,
**keine zweite Runtime**). Segmentierte Berechnung: außerhalb des Felds a=0 gleichförmige Bewegung, innerhalb a=qE/m parabelförmig,
nach Verlassen entweder gleichförmige Bewegung oder Anhalten beim Auftreffen auf Platte. Erzeugt drei
`PhysicsEventLike`-Typen: `EnterField` / `ExitField` / `HitPlate`, 14 abgeleitete Größen (inkl. `deflection` / `exit_velocity` / `hit_velocity`),
5 Prüfungen. Gegenseitiger Ausschluss mit `engine-electric` über `canHandle` (erstere erfordert gebundene Region,
letztere lehnt regions/boundaries ab).

**B. Gesamte Kette:** Szenen-Fabrik (`createParallelPlateScene`) → IR
(`charged_particle_bounded_electric_field` + Plattengeometrie) → Parser
(`parseParallelPlate` + 10 Gold-Aufgaben) → Runtime (Ereignisabbildung + Plattenbaum/
Inspector/editParameter) → Renderer (`ElectricRegionRenderer`: Metallplatten + durch clipPath
beschnittener begrenzter Feldgitter) → Agent (10 Lehrintentionen für begrenztes Feld).

**C. Abnahme:** `electric-region-acceptance.mjs` Case A–F alle PASS, 5 Gates bei 0.
Regressionsschutz in Assertions: Case A prüft Punktladungs-Frame `plates === 0`, Case B prüft unbegrenztes Feld-Frame
hat weder Platten noch Gebietsereignisse.

**Backlog geschlossen:** `ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG`. Vorhersage "null Änderung an UI" traf zu -
`TimelineMarkers`-Klassen werden dynamisch zusammengesetzt, neue Arten wirken automatisch, nur drei CSS-Regeln und
`eventsOf` in Runtime ergänzt.

**Fünf Mängel, die bei Browser-Abnahme aufgedeckt wurden, aber von Unit-Tests nicht erfasst** (siehe Bericht):

1. Aufgabenraum zeigt weißen Bildschirm - `useQuestionFrames` rief noch die alte Engine auf, warf während Render
   `EngineUnsupportedError`, React entlud den gesamten Baum. Core/Lab/Bridge an drei Stellen korrigiert,
   nur die Aufgaben-Vorschau übersehen.
2. Platten unsichtbar - Meter-basierter hartcodierter Mindestwert in `extentOf` (12/7 Szeneneinheiten) vergrößerte
   cm-Gerät um Faktor 113. Assertion `plates === 2` bestand damals (DOM vorhanden, visuell unsichtbar), nur durch Screenshot entdeckt.
3. Feldrichtung falsch gezeichnet - Richtung aus aktuellen Frame-Beobachtungen genommen, außerhalb der Platten E strikt 0 → fallback
   auf horizontal, Plattenpolarität auch vertauscht. Korrektur: aus Felddefinition der Szene lesen.
4. Widerspruch zwischen Inspector und Canvas - Engine berechnete abgeleitete Größen bei `endTime` (Teilchen bereits ausgetreten,
   E/F/a alle 0), beim Seek zwischen Platten zeigte Canvas 2000 V/m, Inspector 0.00. Korrektur: aktuellen Frame lesen.
5. Ereigniszeit als "0.00 s" angezeigt - `toFixed(2)` rundete Nanosekunden auf 0, Screenreader meldete falschen Zeitpunkt.
   Test-Assertion kopierte die Formatierung des Implementierers, wodurch die Spiegelimplementierung nicht erfasst wurde.

**Regression:** `electric-acceptance.mjs`, `electric-acceptance-v2.mjs`,
`mechanics-acceptance.mjs` - alle drei bisherigen Acceptance-Suiten bestanden vollständig, Gate-Zähler bei 0.
`HitPlate`-Pfad zusätzlich im Browser mit `electric-13` verifiziert (Eintritt in Feld bei 1.00e-9 s + Auftreffen auf Platte
bei 5.77e-9 s, kein "Austritt aus Feld").

Abnahmegrundlage: `docs/reports/ELECTRIC-BOUNDARY-RUNTIME-REPORT.md`

Abnahmedaten: `test:core` 445 Tests vollständig grün, `test:web` 163 Tests vollständig grün, `typecheck:core/web` null Fehler,
Bundle neu gebaut, Browser-Abnahme Case A–F alle PASS + 5 Gates bei 0.

**Nicht durchgeführt** (klare Abgrenzung): Kondensator/Entlade-/Ladekreise (gehören zur Schaltungsdomäne); PhysicsEvent für Plattengeometrie
(erfordert Ergänzung des eingefrorenen Befehlssatzes um `SetPlateSeparation`/`SetPlateLength`, Spec-Änderung);
visuelle Feinheiten im Aufgabenraum (kein Designbedarf, CSS-Änderungen ohne visuelle Validierungsmittel spekulativ);
gemeinsames `extentOf` nicht ändern (Regionen verwenden eigenen Frame, um bereits abgenommene alte Szenen nicht zu beeinflussen).

---

## COMPOSITE_FIELD_RUNTIME_V1_COMPLETE

**Datum:** 2026-08-24

**Umfang:** Experimentzentrum + Produktintegration des Kompositfelds. Behebung von UI/Produkt-Exposure-Gap —
fünf Runtime-Sätze waren einsatzbereit, aber das Physiklabor bot fast nur ein Magnetfeld-Experiment an. Diese Runde erweitert keine Engines, sondern verbindet
Scene → WorkspaceRuntime → Observation → Renderer → Lab → Question → Agent
vollständig mit der Composite-Domäne und schafft einen offiziellen Experimentzugang.

**A. Experimentbibliothek:** `ExperimentTemplateRegistry` (16 erstellbare Templates,
Mechanik 6 / Elektrisches Feld 4 / Magnetfeld 1 / Kompositfeld 5, jede `createScene()` ist echte Scene Factory,
SceneId aus Zeitstempel + Sequenz eindeutig) + einheitlicher `ExperimentPicker` (Suche / Kategorietabs /
Schnellstart / Zuletzt verwendet). Drei Zugänge (Sidebar "Neu", Startseite-Schnellzugriff, leerer Zustand des Labors) teilen dieselbe
Vorlagenliste; "Physiklabor" wechselt zur Experimentbibliothek, wenn keine aktive Szene existiert, lädt nicht mehr automatisch Magnetfeld-Demo;
Toolbar-Szenenname erlaubt Wechsel des Experiments, aktuelles Experiment kann wiederhergestellt werden; "Zuletzt verwendet" speichert echte PhysicsScene
(Typ-Badge Experiment/Aufgabe, Klick stellt wieder her). Zyklotron wird ehrlich als "demnächst verfügbar" markiert (fehlendes zeitabhängiges Feld).

**B. Kompositfeld-Gesamtkette:** `CompositeWorkspaceRuntime` (identischer WorkspaceRuntime-Vertrag, echte SceneCommands,
abgeleitete Größen des aktuellen Frames, Experimentzweig, EnterRegion/ExitRegion → Timeline-Marker) +
`CompositeRenderer` in RENDERERS integriert (wiederverwendet Primitive: Bereichsrechteck + clipPath-Feldgitter,
⊙/×-Glyphen, Vektoren, Trajektorie, Partikelglühen) + Geschwindigkeitsselektor /
Massenspektrometer (drei Bereiche) / E+B / E+B+g / Mehrfeldbereiche - fünf Experimente;
21 Komposit-Gold-Aufgaben (8 Selektor + 6 Massenspektrometer + 3 E+B + 3 E+B+g + 1 Zyklotron ablehnend) +
fünfstufige strukturierte Lösung (alle Zahlen stammen aus Runtime); Agent mit 13 Kompositfeld-Intentionen, verweist auf
benannte Prüfung `velocity_selection_condition`, bei einer Antwort werden hervorgehobene Ziele vereinigt.

**C. Abschlusskorrekturen** (durch Browser/Gate-Abnahme aufgedeckt): ① Drei Kompositfeld-Templates überschreiben explizit `into_page`,
korrekte Factory-Defaults, qE und qv×B gleichgerichtet, Selektor filtert alle Teilchen → auf `out_of_page` korrigiert;
② Agent setzte Highlights nacheinander (überschrieben) → Drawer aggregiert Vereinigung; ③ `trajectory`-Alias fehlte `composite-trajectory`;
④ Kopie der Highlight-Label-Tabelle im AgentDrawer fehlte Composite-Eintrag → Nutzung gemeinsamer `highlightLabel`;
⑤ impliziter Prioritätsfehler in `electric-visual-bridge` `?? 0 < 0` (Fallback bewertete jede nicht-null Ladung als
negativ) → Lint-Gate deckte auf, Klammern ergänzt;
⑥ alte E2E angepasst an Experimentbibliothek-Eingang + Aufgaben-Klick auf Questions-Panel-Bereich beschränkt (verhindert doppelten Button im "Zuletzt verwendet").

Abnahmegrundlage: `docs/reports/COMPOSITE-FIELD-RUNTIME-V1-REPORT.md`

Abnahmedaten: `test:core` vollständig grün (engine-composite 26, physics-composite-core 48,
question-core 220 inkl. 21 Komposit-Gold-Aufgaben); `test:web` 190 Tests grün;
`typecheck` und `lint` (core+web) null Fehler (inkl. Bereinigung von 24+ historischen oxlint-Verstößen);
Harness-Build erfolgreich; `test:gui` 3948/3950 (1 Upstream code-block-Flake, einzeln 15/15);
Browser-Abnahme `composite-acceptance.mjs` CASE A–I + E+B+g + Responsiv alle PASS, 5 Gates bei 0;
Regression der vier Acceptance-Suiten (mechanics/electric/electric-v2/electric-region) und Home/Lab-Screenshot-Skripte bestanden;
Overlay zurückgeschrieben.

**Nicht durchgeführt** (klare Abgrenzung): Zyklotron (benötigt zeitabhängiges Feld); Wiederherstellung aus "Zuletzt verwendet" mit Runtime-Bearbeitung
(Revision gehört Runtime, Wiederherstellung = Anfangsbedingungen); D-förmige Magnetfeldbox-Grafik für Magnetablenkbereich;
modellgestützte Agent-Antworten (Backlog unverändert).

---

## PHYSICSOS_LEARNING_RUNTIME_V1_COMPLETE

**Datum:** 2026-08-24

**Umfang:** Intelligente Didaktikebene (Learning Experience V1). Nach Kompositfeld V1 ist Physik-Fähigkeit komplett;
diese Runde erweitert keine Physik (keine neuen Experimente/Engines/Formeln), sondern wandelt "verifizierbaren Physiksimulator"
in "Studenten-Nutzungszyklus": Tutor-Modus, Fehlerdiagnose-Selbsttest, Lernverlauf, Wissensgraph, Experimentbericht.

**A. Didaktikinhaltsebene (question-core):** Wissensgraph mit 20 Knoten (Mechanik/Elektromagnetik-Lehrbaum) +
manuell geprüfte Zuordnung `QUESTION_KNOWLEDGE` für 56 Gold-Aufgaben; Selbsttest-Fragebank
`QUESTION_SELF_CHECKS` mit 19 Konzeptsonden / 55 Optionen / 36 klassifizierten Distraktoren
(Kategorien: Konzept/Richtung/Modellierung, jeder Distraktor mit Erklärung + Wiederholungsvorschlag + optionaler Verifier-Beweis-check-id).
Alles explizite Datentabellen; `learning-content.test.ts` prüft vollständige Abdeckung aller 56 Aufgaben und dass nur
deklarierte Knoten referenziert werden - Aufgaben driftet nicht stillschweigend zu falschen Wissenspunkten.

**B. Tutor-Modus:** AI-Assistent-Drawer um zwei Tabs erweitert (Fragen/Leitfaden); `physics-tutor.ts`
mit 10 Kursen (Selektor-Gleichgewicht/Ablenkung, Massenspektrometer, Drei-Felder, E+B, Kreisbahn im Magnetfeld, waagerechter Wurf, schiefe Ebene,
elektrische Kraft, Kraft und Bewegung). Struktur: Beobachtung (echte Zahlen aus aktuellen Frame-Ableitungen) → Leitfrage →
Hinweisstufen (schrittweises Aufdecken, Aufdecken hebt Canvas über gemeinsamen Toolpfad hervor, Revision unverändert) →
Antwort (verweist auf benannte Verifier-Prüfchips). Kurse werden nach Runtime-Fakten ausgewählt und bei Faktenänderung automatisch zurückgesetzt
(z. B. wenn v != E/B ändert sich Kurs sofort zu "Warum Ablenkung?").

**C. Fehlerdiagnose + Lernverlauf:** Aufgabenraum um "Fehlerdiagnose · Selbsttest" erweitert
(falsch beantwortet → Fehlertyp-Badge + Erklärung + lebender Beweis wie `magnetic_force_does_no_work` +
Wiederholungsvorschlag; richtig beantwortet → Takeaway) sowie "Wissenszusammenfassung"-Chips; jede
Antwort wird im localStorage-Lernverlauf gespeichert. Lernverlauf ist nun offizieller Bereich (Sidebar-Eingang aktiviert):
Anzahl Selbsttests/Quote/Richtig-Falsch, Verteilung der drei Fehlertypen, kürzlich falsch beantwortete Aufgaben
(inkl. eigene Antwort), Kompetenzfortschritt pro Wissensknoten (Progressbar), pro Fehleraufgabe
"Erneut üben"-Deep-Link zurück zur gleichen Aufgabe. Store zählt nur - keine physikalische Berechnung.

**D. Experimentbericht:** Toolbar "Bericht" → `buildExperimentReport(snapshot)` projiziert
aktuellen Frame auf Parameter/Engine-Ableitungen/Gebietsereignisse/physikalische Verifikation/Fazit, Anzeige im Dialog +
Markdown-Export; Zeitangabe via adaptives `formatClock` (exponentielles Format für Nanosekunden), Fazit aus Verifikationsquote generiert.

Abnahmegrundlage: `docs/reports/LEARNING-RUNTIME-V1-REPORT.md`

Abnahmedaten: `typecheck` und `lint` (core+web) null Fehler; `test:core` vollständig grün
(question-core 228 inkl. learning-content 8 Tests); `test:web` 205/16 Dateien vollständig grün
(inkl. `learning.client.spec.tsx` 15 Tests); Bundle neu gebaut; Browser-Abnahme
`learning-acceptance.mjs` CASE A–F alle PASS, 5 Gates bei 0; Regression der fünf Acceptance-Suiten
(mechanics/electric/electric-v2/electric-region/composite) alle bestanden;
Overlay zurückgeschrieben; QA der fünf Screenshots manuell geprüft.

**Nicht durchgeführt** (klare Abgrenzung): modellgestützte Tutor/Agent-Antworten (Backlog unverändert, bei Anbindung nur
Intent-Matching-Schicht ersetzen); Bild-/PDF-Erkennung (Backlog unverändert); geräteübergreifender Lernverlauf (nur
localStorage, Accounts/Server-Storage gehört zu Data Storage-Phase); semantische Korrektur subjektiver Aufgaben;
3D-Renderer.

### EXPERIMENT_LIBRARY_HOME_V1_COMPLETE

Überarbeitung der Experimentbibliothek-Startseite (im Stil des Apple Learning Centers), erster Punkt der geplanten "UI/UX-Politur".
Gleicher `ExperimentPicker` (Sidebar "Neu", Startseiten-Schnellzugriff, leerer Zustand des Labors) wird
zur Lernzentrum-Startseite aufgewertet; alle Daten aus bestehenden echten Stores, keine neuen Pseudostate.

**A. Haupttitel:** Hero-Bereich "Experimentzentrum" 30px/700 mit enger Buchstabenabstand + einzeiliger Untertitel;
Panel auf 1000px verbreitert.

**B. Letztes Experiment fortsetzen:** Einzelne vollbreite "Weiter"-Karte mit Prioritätslogik —
wenn Chooser über laufendem Experiment liegt (Experimentwechsel), Anzeige "Zurück zum aktuellen Experiment · Läuft",
Klick stellt an Ort und Stelle wieder her (Revision unverändert); sonst liest aus persistiertem `recent-scenes` den neuesten Eintrag
"Letztes Experiment fortsetzen", Metadaten: Fach · Experiment/Aufgabe · relative Zeit, Klick gibt gespeicherte PhysicsScene unverändert ans Labor zurück
(gleiche sceneId, nach vollständigem Reload wiederherstellbar).

**C. Empfehlungen für dich:** neue Pure-Function-Module `experiment-recommendations.ts` —
`recommendExperiments({attempts, excludeClassicIds, limit=3})`:
aggregiert Schwachstellen aus Lernverlauf (mehr Fehler → geringere Quote, absteigend sortiert), aus manuell geprüfter
`KNOWLEDGE_EXPERIMENT`-Tabelle (Wissensknoten → passendes Experiment, ehrliche Lücken wie "Einheiten/Größenordnung" absichtlich nicht abgedeckt)
werden Karten "Für Schwachstelle · Knotename" erzeugt;
klassische Sammlung (je eines für Mechanik/Elektrizität/Magnetismus/Komposit) füllt auf, klassische Nachbesetzung
schließt zuletzt verwendete aus, Wiederholung von Schwachstellen schließt nicht aus.
Begründung der Karte = Regel, die sie ausgewählt hat, kein Modellaufruf. Ersetzt bisherigen "Schnellstart".

**D. Fachfarben:** `chrome.ts` neue semantische Subjects-Gruppe
`--physics-subject-{mechanics,electric,magnetic,composite}` (grün/blau/violett/orange)

- gleichnamiges `-tint` für helle Hintergründe, Kommentar: "nur UI-Chrome einfärben, nicht Canvas-Physik";
  CSS Modules injizieren über `subject-*`-Modifier zwei Custom Properties `--subject/--subject-tint`;
  Hintergründe von Empfehlungskarten, Symbolblock + CTA der Weiter-Karte, Farbpunkt in Kategorietabs,
  Symbolblöcke im Raster, Domain-Label-Chips konsumieren dieselbe Variablengruppe.

Abnahmegrundlage: `apps/web/e2e/library-home-acceptance.mjs` (CASE A–D + 5 Gates),
Screenshots `experiment-library-home / -continue / -weakness -1600x900.png`

Abnahmedaten: `typecheck` und `lint` (core+web) null Fehler; `test:web` 214/17 Dateien vollständig grün
(inkl. neuer `experiment-recommendations.spec.ts` 7 Tests + Picker "Weiter"/Empfehlungen 2 Component-Tests); `test:core` vollständig grün; Bundle neu gebaut; Browser-Abnahme
`library-home-acceptance.mjs` 26 Punkte alle PASS, 5 Gates bei 0 (inkl. Haupttitel ≥28px,
drei Fach-Tint-Farben paarweise verschieden, vier Tab-Farbpunkte paarweise verschieden, exakte Wiederherstellung nach Refresh, falsch beantwortete Aufgabe →
Empfehlung für Schwachstelle mit Deep-Link); Regression der sechs Acceptance-Suiten
(mechanics/electric/electric-v2/electric-region/composite/learning) alle bestanden
(Composite CASE A: "Schnellstart"-Prüfung auf Empfehlungsleiste umgestellt); Overlay zurückgeschrieben;
drei Screenshots manuell in QA geprüft.

**Nicht durchgeführt** (klare Abgrenzung): Hero der Startseite (`conversation.hero`) und Canvas-Atmosphäre (separates geplantes Item);
Empfehlungsalgorithmus ohne Modell/Telemetrie (Regel = Begründung);
keine neuen Experiment-Templates.

### CIRCUIT_RUNTIME_PACK_V1_COMPLETE

**Datum:** 2026-08-26

**Umfang:** Roadmap Phase 13 — Circuit Engine, erster Lab-Ausschnitt der dritten systemweiten Abnahmekette "Dynamische Schaltungen".
Erste Domäne ohne räumliches Koordinatensystem: Canvas ist abstraktes Schaltschema-Raster, Wiedergabe ist
quasistatischer Schleifer-Scan, Gerüst bleibt dieselbe Kette: Scene → Engine → Verifier →
WorkspaceRuntime → Renderer.

**A. Domain Core:** `createCircuitScene` Netlist-Factory (Terminals nach Net deklariert,
Union-Find-Topologie, `metadata.layout` nur für Darstellung) + fünf Template-Factories (Reihenschaltung/Parallelschaltung/
gemischt/Schiebewiderstand/EMF mit Innenwiderstand messen); eingefrorener Befehlssatz +5 (`SetComponentResistance` /
`SetSourceVoltage` / `SetSourceInternalResistance` / `SetSwitchState` /
`SetSliderPosition`); `@physicsos/engine-circuit` MNA-Gleichstrom-Engine —
jedes zusammenhängende Gebiet unabhängig geerdet (Unterbrechung schwebt nicht), ideale Messgeräte hochohmig/Serienwiderstand 0 modelliert, singuläres System führt zu explizitem Fehler;
`stateAt(t)` löst Arbeitspunkt neu bei Schieberbewegung, 8 abgeleitete Größen mit Formeln, fünf Prüfarten
(scene_valid / KCL / Energieerhaltung/Leistungsvergleich / U = E − I·r / ideale Messgeräte nicht störend);
24 Golden Cases vorab definiert.

**B. UI Runtime Pack:** Experimentbibliothek 16 → 21 Templates, neue Kategorie "Schaltungen" mit Fachfarbe
`--physics-subject-circuit`; `CircuitWorkspaceRuntime` (Bearbeitung über echte SceneCommands, Parameteränderung setzt Scan auf Null, Fork-Semantik für Aufgabenszenen konsistent);
`circuit-visual-bridge` projiziert verifizierten Arbeitspunkt auf Schaltschema (Symbole/Verbindungen/Knoten/Strompfeile/Messwertanzeige, <1e-9 A wird als 0 angezeigt ohne falsche Präzision); `CircuitRenderer` echte SVG-Symbole
(Spannungsquelle/Widerstand/Schiebewiderstand/Schalter/Messgerät); I-t/U-t/P-t-Diagramme und Datentabelle.

**C. Abnahme und Regression:** `circuit-acceptance.mjs` CASE A–F + Responsiv + 5 Gates
alle PASS (Reihenschaltung 0.2 A/4 V, EMF-Ankopplung Revision +1, offene Schaltung alles Null, 8s Schieber-Scan,
U = E − I·r und offene Schaltung zeigt EMF direkt); sieben alte Acceptance-Suiten alle PASS — einzige Anpassung:
Library-Home "Farbpunkte" von 4 auf 5 Farben (Produktentwicklung); Screenshots zurückgeschrieben.

Abnahmegrundlage: `docs/reports/CIRCUIT-RUNTIME-PACK-V1-REPORT.md`

Abnahmedaten: `typecheck` / `lint` (core+web) null Fehler; `test:core` 20 Pakete 655 Tests vollständig grün
(engine-circuit 24, physics-scene 50); `test:web` 235/19 Dateien vollständig grün
(circuit.client.spec 10 Tests); `build:web` erfolgreich; acht Browser-Acceptance-Suiten alle PASS,
alle Gate-Zähler bei 0; Overlay zurückgeschrieben (ergänzt engine-circuit und physics-units Workspace-Link im Vendor-Lockfile).

**Nicht durchgeführt** (klare Abgrenzung): Wechselstrom/Transienten sowie Kondensatoren/Spulen (`canHandle` lehnt explizit ab);
Netzwerke mit mehreren Quellen (derzeit auf eine Quelle beschränkt, Induction bei Bedarf entsperrbar); Schaltungsaufgaben im Aufgabenraum
und Schaltungsintentionen für Agent (nächster Ausschnitt); freier Schaltungseditor; Phase 14 - Induktionsschienen (abhängig von dieser Runde, nächste Phase).

---

### WAVE_RUNTIME_PACK_V1_COMPLETE

**Datum:** 2026-09-02

**Umfang:** Roadmap Phase 33 "Remaining Physics Domains" - erstes Domäne: Mechanische Wellen. Drei geschlossene
Experimentierstationen (harmonische Transversalwelle auf Seil / Zweiquellen-Interferenz / stehende Welle auf beidseitig fest eingespanntem Seil) folgen derselben Kette:
Scene → Engine → Verifier → Observation → WorkspaceRuntime → Renderer → Lab → Didaktikebene → Question.

**A. Vertrag und Engine:** `WaveBench` mit drei Submodellen + sechs eingefrorenen Befehlen (`SetWaveAmplitude / Frequency /
Speed / PathDifference / StringLength / Harmonic`), Befehlssemantik "Medium bestimmt Wellengeschwindigkeit, Quelle bestimmt Frequenz"
(Seilwelle/Interferenz: Änderung von f oder v führt zu Neuberechnung λ=v/f; stehende Welle: Änderung von v/L/n führt zu f_n = n·v/2L),
|r₂ − r₁| > d wird auf Befehls-Ebene abgelehnt; Spezifikation akzeptiert v statt λ, f_n statt v. `@physicsos/engine-wave`
liefert Seil-Sampling (16 Punkte pro Wellenlänge adaptiv), markiert Teilchen, Triangulation von Quellen und Beobachtungspunkt P, Bestimmung Δ/λ
(interference_type ±1/0), Knoten/Bäuche, 11 eingebaute Engine-Prüfungen; destruktive Interferenz ergibt exakte Amplitudensumme 0.
`physics-observation` mit vier Wellenbeobachtungsgrößen.

**B. Labor und Didaktikebene:** Experimentzentrum um Kategorie "Mechanische Wellen" und drei Templates erweitert (insgesamt 38 erstellbar), Kategorietabs und
Fachfarben werden nun von `EXPERIMENT_TEMPLATE_GROUPS` abgeleitet (Auftrieb/Wärmelehre/elektromagnetische Induktion hatten zuvor keine Tabs, jetzt vorhanden;
Auftriebsfarbe von Schaltungfarbe unterschieden); `WaveWorkspaceRuntime` + `wave-visual-bridge` (vertikaler Skalierungsfaktor einmal deklariert,
in Achsen und Anzeigen geschrieben, Werte bleiben real); `WaveRenderer`; Tutor mit drei Lektionen, Selbsttest drei Sets (Wissensgraph Wurzel "Mechanische Wellen" + 4 Knoten, sechs Sonden), Agent-Hervorhebung,
Experimentzweig-Strategie berücksichtigt sechs Befehle.

**C. Aufgabensammlung:** `deterministic-wave-parser` (schließt Lichtinterferenz/Doppelschlitz/elektromagnetische Wellen/Echo aus),
`validateWaveIR`, `wave-scene-builder` (schreibt `sourceQuestionId`), Runtime-Wellenzuordnung und Aufgabenlösung;
6 Gold-Aufgaben (λ,f → v,T; v,f → λ; Δ=2λ konstruktiv; Δ=1.5λ destruktiv; 3. Harmonische; fehlende f führt zu Ablehnung),
Aufgabenraum 74 → 80 Aufgaben; QuestionWorkspace zeichnet Aufgaben-Canvas mittels `stateAt(t)`.

Abnahmegrundlage: `docs/reports/WAVE-RUNTIME-PACK-V1-REPORT.md`
(inkl. CASE A–G + Responsiv, 5 Gate-Zähler, Screenshot-Liste)

Abnahmedaten: `typecheck` (core + web) null Fehler; `test:core` vollständig grün (physics-scene 80, engine-wave 27,
physics-observation 24, question-core 399); `test:web` 26 Dateien 347 Tests vollständig grün (`wave.client.spec` 20 Tests);
Browser-Abnahme `wave-acceptance.mjs` alle PASS, 5 Gates bei 0; Regression aller acht Acceptance-Suiten bestanden
(library-home Farbpunkte 5→11, circuit Experimente 5→7 - zwei veraltete Assertions entsprechend Produktentwicklung aktualisiert);
Overlay zurückgeschrieben.

**Nicht durchgeführt** (klare Abgrenzung): Longitudinalwellen/Reflexion/Brechung/Beugung/Doppler (benötigen neue Submodelle); vollständige Interferenz-Intensitätsverteilung in Ebene
(nur ein Beobachtungspunkt wird bewertet und gezeichnet, Wellenfront nur schematisch); Dämpfung; Agent-Wellenfrageintentionen (Backlog unverändert); Wellenform-Erkennung (Backlog unverändert).

---

## AGENT_TOOL_RUNTIME_V1_COMPLETE

**Datum:** 2026-09-07

**Umfang:** docs/14 §19 Phase 16 Tool Runtime — ermöglicht, dass Modelle in Harness-Sitzungen tatsächlich die Physik-Engine aufrufen und von Modellen geänderte Szenen auf die Studentencanvas gespiegelt werden. Host-seitige Verkabelung (Tool-Registrierung / `physics-student`-Preset / End-to-End-Gates) war bereits im ersten Teil abgeschlossen und abgenommen (siehe unten); dieser Abschluss ergänzt Runtime-Kern und "Szenen-Push (Streaming / `SceneRevisionChanged`)".

**A. Runtime-Kern:** `PhysicsToolRuntime.sceneSnapshot` — verlustfreie Tiefenkopie der aktuellen Revision, damit Host Szene aus Prozess herausführen kann (Kopie kann Kommando-Schranke von SceneRuntime nicht umgehen); gleichzeitig Fix für strikte optionale Eigenschaften aus erstem Bericht (`domain: ir?.domain` direkte Zuweisung `undefined` durch bedingte Erweiterung ersetzt, Kompatibilität mit `exactOptionalPropertyTypes` wiederhergestellt).

**B. Szenenspiegelung (docs/04 §92):** drei Schritte bilden eine Kette.

- **Veröffentlichung:** tool-physicsos hängt nach jedem erfolgreichen `physics_create_experiment` / `physics_solve_question` / akzeptierten `physics_scene_command` einen `physics/scene`-Snapshot an das Sitzungsprotokoll des aufrufenden Agents — enthält verlustfrei vollständige `physics-scene/1.0`-Szene mit revision/cause/commandType/eventType/sourceQuestionId. Von Runtime abgelehnte Befehle werden nicht gesendet (Szene unverändert); Aufrufer ohne Agent (Tests/Code Mode) senden nicht. Typen in `src/types.ts` zentralisiert, Namensräume `./types` und `./client` ohne Duplikate.
- **Zusammenfassung:** `physicsScenes`-Session-Projektion (last-wins pro scene-id, `latest` folgt neuestem), nur im `sessionProjections`-Seam registriert (Headless ohne Seam nicht betroffen).
- **Spiegelung:** ui-physicsos `physics/agent-scene-sync.ts` wandelt Projektion in Labor-Navigation — erster Wert pro Sitzung ist Baseline (still adopt, Reload/Sitzungswechsel unterbricht aktuellen Studentenbereich nicht), nachfolgende Revisionen öffnen Labor live; strenge Shape-Prüfung (Header und eingebettete Szene müssen id/revision/schema übereinstimmen, vor Mount Szenenvalidator durchlaufen). Verkabelung in `ui-physicsos/src/client/index.ts`: Session-Listenzeilen abonnieren, `projectionValues['physicsScenes']` an Sync übergeben, `surface.open` als adopt/show-Aktionen. Zusätzlich `tool-physicsos-invariant`: jede `physics/scene` vor Schreiben ins dauerhafte Log prüft Header-Konsistenz mit eingebetteter Szene.

**C. Profilzuordnung:** `ui-physicsos/profiles.ts` - Studentenprofile (Entdecken / Lösen / Geführt) `runtimePreset` von `standard` auf `physics-student` geändert — neue Studentensitzung startet direkt im "Physik-Lernmodus" (Physik-Tools + Frage-Tools, keine Coding-Tools), fällt nicht mehr auf Coding-Agent zurück; Lehrerprofil behält `standard` bei. Assertions entsprechend aktualisiert (`overlay.client.spec`).

**D. Abnahmedaten:** `typecheck` / `lint` (core + web + agent) null Fehler; `test:agent` 22 Tests vollständig grün (inkl. 5 Szenen-Spiegelungstests: Veröffentlichung, abgelehnte Befehle werden nicht veröffentlicht, Veröffentlichung nach Lösen, ohne Agent keine Veröffentlichung, last-wins ohne Statusänderung); `test:web` 28 Dateien 360 Tests vollständig grün (inkl. `agent-scene-sync.client.spec` 5 Spiegelungs-Navigationssemantiken und `overlay.client.spec` Profil-Assertions); agent-tools 32 Tests grün; End-to-End `tests/agent/headless-physics-acceptance.mjs` mit echtem `dsh`-Prozess + Mock-LLM - **16 Gates alle PASS** (drei neue: nach Lösen genau ein `physics/scene` im Sitzungslog mit cause `solved`, eingebettete Szene entspricht registrierter Szene mit id/revision/schema `physics-scene/1.0`, keine überzähligen Veröffentlichungen). Overlay mit Vendor synchronisiert.

**Nicht durchgeführt** (klare Abgrenzung): GUI End-to-End-Skript für "Canvas folgt Modelländerungen in Echtzeit" — durch lokale Relay-Beschränkung bei echter Modellintegration (siehe Bericht) zurückgestellt; Veröffentlichung wird durch Sitzungslog-Assertions des echten dsh-Prozesses geprüft, Client-Spiegelung durch Komposition + Pure-Function-Specs abgedeckt; `physicsScenes` bereits in Sessionzeilen ins Web projiziert; Timeline-Streaming pro Zeiteinheit (Snapshots werden pro Toolaufruf publiziert, nicht pro Frame); spezielles Lehrer-Preset.

Abnahmegrundlage: `docs/reports/AGENT-TOOL-RUNTIME-V1-REPORT.md`

---

## PHYSICSOS_PERF_OPT_V1_COMPLETE

**Datum:** 2026-09-08

**Umfang:** Globale Performance-Optimierung entsprechend docs/01 §84–86 und docs/02 §26/#123/#124/#125/#150 — Entkopplung Rendering/React, begrenzte Trajektorienspeicherung und getrennte Samplingraten, Eliminierung von O(n²), Worker-Nachrichtenvertrag. Physikalische Ergebnisse und öffentliche Verträge unverändert, Standardverhalten ohne Änderung.

**A. Rendering/React-Entkopplung (#123):** Neu `ui-physicsos physics/frame-source.ts` (`createFrameSource` / `useFrameSource`, externer Store via `useSyncExternalStore`). `PhysicsWorkspace`-Animationsuhr publiziert jeden Frame an FrameSource, nur Canvas abonniert → nur Canvas rendert pro Frame neu; React-Shell aktualisiert mit 250ms-Übersichts-Throttling, Status/sceneRevision/running sofort, Interaktionen (seek/highlight/Szenenwechsel) nutzen `commit`-Doppelschreibweise für Konsistenz zwischen Panel und Canvas. `QuestionWorkspace`: Abspieluhr und frameweise visuelle Berechnungen in Canvas-Unterbaum verschoben, drawn-id-Selection meldet nur bei Mengenänderung nach oben, übergeordnete Rails rendern nicht pro Frame neu. Neu `frame-source.client.spec` (4) und `renderer-decoupling.client.spec.tsx` (2, Browser-Level-Validierung: nur Canvas-Anzeige ändert sich pro Frame).

**B. Trajektorien-Sampling/Reduktion/Chunking (#85/#124):** Neu `physics-scene trajectory-sampling.ts` — Speicherobergrenze 1024, Renderbudget 512, `outputSampleRate`-Hook (geklammert auf [2,1024], Fallback entspricht ursprünglichen Segmentierungskonstanten), Reduktion unter Beibehaltung von Anfang/Ende + `protect`-Indexmenge, Chunking-Primitiv. 6 Engines (mechanics/magnetic/electric/wave/induction/composite) angebunden; 4 Observation-Layer-Trajektorienbuilder auf 512 reduziert, Composite sammelt Phasengrenzzeiten in `protect` (kritische Wendepunkte bleiben erhalten). 14 neue Tests.

**C. Eliminierung von O(n²)-Pfaden (#150/#26):** `summarizeVerification` O(E×C)→O(E+C); Composite `phaseAt` lineare Suche → Binärsuche (O(states×phases)→O(states×log phases), semantisch äquivalent); `fieldAt` ein einziger Durchlauf zur Akkumulation ohne Zwischenzuweisungen; Electric-Verifier indiziert abgeleitete Größen pro Zustand via Map; Magnetic `assumptionsFromResult` O(A²)→O(A).

**D. Worker-Vertrag (#125):** `SimulationWorkerMessage` als diskriminiertes Union + `SimulationProgress` / `SimulationError` + `parseSimulationWorkerMessage` Strukturvalidator (Schema `simulation-worker/1.0`), rein inkrementell exportiert, zur direkten Wiederverwendung bei zukünftiger Worker-Implementierung (Produktionsimplementierung als Folgepunkt erfasst).

**E. Abschlusskorrekturen:** Web-Lint deckte 7 Probleme in neuen Dateien auf, alle behoben (eol-last ×3, `FrameSource`-Interface-Methoden `this: void` ×3, `no-unsafe-return` durch Zwischenvariable an bestehende Schreibweise angepasst), Lint vollständig null Fehler.

Abnahmegrundlage: `docs/reports/PERF-OPT-RUNTIME-V1-REPORT.md`

Abnahmedaten: `typecheck` (core + web + agent) null Fehler; `lint` (core + web + agent) null Fehler; `test:core` 27 Pakete 1090 Tests vollständig grün (physics-scene 99 inkl. 14 neue, physics-core 33 inkl. 5 neue Worker-Vertragstests, question-core 402); `test:web` 30 Dateien 366 Tests vollständig grün (inkl. 2 neue Dateien 6 Tests); `test:agent` 22 Tests grün; agent-tools 32 Tests grün; End-to-End headless-physics-acceptance 16/16 (R/T konsistent mit Baseline).

**Nicht durchgeführt** (klare Abgrenzung): Produktions-Worker-Implementierung (Vertrag vorbereitet, Composite-Phasenzerlegung und Punktladungs-Rastersampling als Kandidaten); #86 Lazy Loading; separate Samplingrate für Charts; Chunk-Lazy-Loading-Verbrauch; Vereinheitlichung von `outputSampleRate` in verbleibenden begrenzten Engines; keine Änderungen an `apps/web` (`APPS_WEB_STANDALONE_RETIREMENT_BACKLOG` unverändert).

---

## CIRCUIT_QUESTION_AGENT_SLICE_COMPLETE

**Datum:** 2026-09-08

**Umfang:** Schließt gemäß CIRCUIT_RUNTIME_PACK_V1 "Nicht durchgeführt"-Liste den nächsten Ausschnitt ab — vollständige Prüfung der Schaltungsaufgaben im Aufgabenraum + Ergänzung der Agent-Schaltungsintentionen. Circuit Engine/Szenen/Templates/Visualisierung/Labor bereits abgenommen, keine Wiederholung.

**A. Ist-Stand geprüft:** Schaltungsaufgaben im Aufgabenraum vorhanden — `deterministic-circuit-parser` (Schaltungssignale + EMK/Innenwiderstand/Widerstand/Strom/Spannung/Leistung + Topologie), `circuit-scene-builder`, `question-runtime` Schaltungszuordnung (Vorrang vor reiner Elektrizitätszuordnung), `engine-selector` leitet zu `CircuitEngine` weiter, 6 Gold-Aufgaben (Serienstrom, Parallelgesamtwiderstand, Schieberstrom, Gesamt-/Nutzleistung, Strom/Klemmenspannung, Innenwiderstand), QuestionWorkspace rendert verifizierbares Schaltschema via `resolveCircuitOperatingPoint` + `circuitSceneVisualAt` (question-core 402 Tests abdecken). Lücke nur bei Agent.

**B. Agent-Schaltungsintentionen:** `physics-agent-answers.ts` um 8 Intentionen ergänzt — `circuit-ohm-current` (I = E/(R_außen+r)), `circuit-terminal-voltage` (U = E − I·r), `circuit-internal-resistance` (r>0, P_intern = I²·r), `circuit-series-loop` (junctionCount==0), `circuit-parallel-split` (junctionCount>0, umgekehrter Teilungsverhältnis), `circuit-rheostat-sweep` (hasSlider, R_Schieber = p·R_ges), `circuit-power-balance` (P_ges = P_außen + P_intern), `circuit-meters-ideal` (Messgeräte auf Canvas). Jede Intention verweist nur auf Engine-Ableitungen (Hauptstrom I, Klemmenspannung U, Gesamtleistung Quelle, Nutzleistung, Verlustleistung Innenwiderstand, zugeschalteter Schieberwiderstand) und benannte Prüfungen (`kcl_current_conservation` / `power_balance` / `terminal_voltage_law:<id>` Präfixmatch / `ideal_meters_non_intrusive`); Topologiezuordnung liest `CircuitAgentFacts` (Innenwiderstand/Schieber/Knotenzahl), Highlight-Ziel dynamisch aus tatsächlich gezeichneten Komponenten-IDs (Vorrang Quelle, Fallback `resolveHighlightTarget`); `matchIntent`-Regeln für Schaltungen mit `domain === 'circuit'` abgegrenzt, fangen keine Strom/Spannungsfragen aus Mechanik/Elektrischem Feld/Elektromagnetischer Induktion ab.

**C. Abnahmedaten:** `typecheck:web` null Fehler; `lint:web` null Fehler; `test:web` 30 Dateien 376 Tests vollständig grün (`physics-agent.client.spec.tsx` 62 Tests, +10 Schaltungstests: Faktenveröffentlichung, Topologiezuordnung, Referenz benannter Prüfungen, Routing studentischer Formulierungen, alle vier Frames: verfügbare Intentionen mit auflösbaren Highlights, Highlights sind View-State, Domänentrennung); `test:core` vollständig grün (question-core 402 inkl. Schaltungs-Goldaufgaben-End-to-End).

Abnahmegrundlage: `docs/reports/CIRCUIT-QUESTION-AGENT-SLICE-REPORT.md`

**Nicht durchgeführt** (klare Abgrenzung): Kern der Schaltungsaufgaben im Aufgabenraum (bereits geliefert, nur geprüft); modellgestützte Agent-Antworten (`AGENT_MODEL_BACKED_ANSWERS_BACKLOG` unverändert, bei echter Modellanbindung nur `matchIntent` ersetzen); Erweiterung Circuit Engine/Prüfungen/Templates (AC/Transienten/Kondensatoren/Spulen/mehrere Quellen weiterhin von `canHandle` abgelehnt); keine Änderungen an `packages/` und Harness-Upstream.

---

### AUTH_TENANT_V1_COMPLETE / ADMIN_CONSOLE_V1_COMPLETE

**Datum:** 2026-09-18 → 09-21

**Umfang:** Kontosystem und Admin-Konsole. Produkt entwickelt sich von "Experimentwerkzeug" zu "Schüler-Lernplattform" —
Schule wird zu erstem Tenant in der Identitätsstruktur, nicht nur zu einem einfachen Profilfeld nach Anmeldung.

**A. Kontosystem** (`@deepseek-ai/dsh-auth-host`): Wiederverwendung des bewährten paper-host-Musters
(Cordis Host-Plugin + `ctx.webServer` Präfix-Routing + `ctx.storageDomain` KV-Domain),
gleicher Origin/gleicher Port → HttpOnly-Cookies funktionieren natürlich, kein neuer Prozess, keine Supabase-Anbindung.

- `users` Key = `schoolId:username` → strukturelles Nebeneinander gleicher Benutzernamen an verschiedenen Schulen
- `sessions` Key = `sha256(token)` → Token nicht auf Platte, widerrufbar
- argon2id (`node:crypto`, PHC selbstbeschreibender String, keine neuen Abhängigkeiten); bei nicht existierendem Account Dummy-Verify zur Angleichung der Antwortzeit
- IP + Account dualer Token-Bucket für Rate-Limiting; CSRF (JSON content-type + Origin/Sec-Fetch-Site);
  Body ≤ 16KB; Registrierung erzwingt `role:'STUDENT'`
- Registrierung akzeptiert **freien Schulnamen-Text**, Mapping zu aktivem Tenant über name/shortName; bei mehreren Schulen gleichen Namens Rückgabe
  `SCHOOL_AMBIGUOUS` + Kandidaten mit Regionslabel; kein Treffer → `SCHOOL_NOT_FOUND` —
  **kein stillschweigendes Anlegen von Tenants, keine fingierten Schulen**

**B. Admin-Konsole** (`/physicsos/admin`, Routing-Level `requireRole` + `requireSchoolScope`):
Schulanträge genehmigen/ablehnen, Schule anlegen, Schule aktivieren/deaktivieren, Benutzerliste/Lehrer anlegen/entsperren/deaktivieren/Passwort zurücksetzen/Sitzungen widerrufen,
Audit-Log. Für `SCHOOL_ADMIN` wird schoolId zwingend aus Session übernommen (gleichnamiges Feld im Request-Body ignoriert);
Schreiboperationen gehen in append-only `admin_audit`; Benutzerantworten über Zod-Whitelist **enthalten niemals `passwordHash`**;
API erlaubt **niemals** Erstellen/Ändern von `SUPER_ADMIN` (nur über Deploy-Seed `bootstrapAdmins`).

**C. Echter Bug behoben (falsch positives Gate):** Ursprüngliches Kriterium für `ARGON2_AVAILABLE` war
`typeof argon2Sync === 'function'`, aber **manche Builds exportieren den Eintrag obwohl OpenSSL kein argon2id unterstützt**
(z. B. vendored Node 24.18.1 auf diesem System). Folge: Plugin aktivierte sich normal, schlug dann beim Bootstrap-Seed mit
`ERR_CRYPTO_ARGON2_NOT_SUPPORTED` fehl. Jetzt wird beim Modul-Load mit minimal gültigen Parametern ein echter argon2id-Aufruf versucht;
`apply()` gibt bei Fehler Grund und tatsächliche `process.version` aus.

**D. Daten:** Schulverzeichnis der 9 Präfekturen/Städte in Guizhou (aus offiziellen Einschreibungsplänen/Bildungsamtsverzeichnissen kompiliert, nach Präfektur markiert).
Am 2026-09-21 wurde offizielles Gymnasialverzeichnis zeilenweise abgeglichen und 15 Schulen ergänzt; aktuell **1581 Zeilen**.

> **Korrektur einer Fehleinschätzung:** Zuvor wurden umgangssprachliche Kurzformen (`Kaili Nr. 1`) gegen offizielle Vollnamen (`Mittelschule Nr. 1 Kaili, Provinz Guizhou`) abgeglichen,
> was fälschlich "15 führende Schulen fehlen" ergab. Nach zeilenweiser Überprüfung waren Guiyang Nr. 1 / Exp. Nr. 3 / Nr. 6 / Nr. 9 / Tsinghua Mittelschule,
> Anshun Nr. 1, Tongren Nr. 1, Bijie Nr. 1, Kaili Nr. 1, Duyun Nr. 1 **alle bereits enthalten** — von 48 offiziell anerkannten Gymnasien in Qiandongnan waren 46 bereits im Verzeichnis.
> Tatsächliche Lücken beschränken sich u. a. auf öffentliche Gymnasien in Xingyi und Zunyi Nr. 4; siehe `GUIZHOU_SCHOOL_ROSTER_HIGH_SCHOOL_GAP` (mit Methodik-Lektion).

Abnahmegrundlage: `docs/HANDOVER.md` §2.1.1 / §2.5, `tests/acceptance/auth-acceptance.mjs`.

Abnahmedaten (erneut ausgeführt 2026-09-21): `auth-acceptance.mjs` **8 CASE / 22 Assertions +
5 Browser-Gates alle PASS** — inkl. nicht-eingeloggtes Login-Gate (zwei Textfelder in derselben Spalte, 610/380 gemessen), Registrierung mit freiem Schulnamen führt ins App,
STUDENT hat keinen Admin-Konsole-Zugriff, nach Logout alte Session 401, Disambiguierung bei mehreren Schulen gleichen Namens mit Regionslabel,
SUPER_ADMIN hat Konsolen-Tab, sowie vollständige Kette **Antrag→Genehmigung→Schule anlegen→Lehrer anlegen→Lehrer-Login→Deaktivierung→401**
(zusätzlich TEACHER erhält 403 bei Admin-API-Aufruf, Audit-Eintrag geschrieben).
`test:agent` 7 Dateien 93 Tests vollständig grün; `typecheck` / `lint` vollständig grün.

---

### RESOURCE_LIBRARY_V1_COMPLETE

**Datum:** 2026-09-18 → 09-19

**Umfang:** Ressourcenbibliothek von "wiederholter Experimentzugang" zu echter Lernmaterialansicht umgebaut. Produktgrenze klar festgelegt:
**Labor enthält Experimente, Ressourcenbibliothek enthält nur echte Prüfungen/Übungsaufgaben/Bücher/Videos**.

- Kapitelpanel zeigt nach Lehrplan der chinesischen Pflichtschulbücher (People's Education Edition) fünf Kategorien: nationale Lektionen/Qualitätslektionen/Wissens-Mikrolektionen/Unterrichtsmaterialien/zugehörige Übungstests,
  gerendert nach Art (Kind-Chip), alle Links mit echten IDs — von 281 Lektionen auf **926 offizielle begleitende Ressourcen** erweitert (Smart Education Platform `prepare_lesson`-Katalog)
- Prüfungsarchiv: Filter nach Schulstufe/Prüfungstyp/Region, Sortierung nach Relevanz, erweiterbare Aufgabenliste (Aufgabennr./Typ/Punktzahl/vollständiger Aufgabentext/Schwerpunkte/Fähigkeiten)
- `scripts/refresh-smartedu-catalog.mjs --check` stimmt mit Plattform überein (926 Einträge)

**Ehrliche Feststellung:** Für die 6 Bände der Oberstufe enthält Plattform tatsächlich keine Unterrichtsmaterial-Einträge (korrekt leer); `knowledge_micro_lesson_package` und `examinationpapers` nutzen offizielle SPA-Routen
(SPA gibt curl 403 wegen WAF, im Browser klicken funktioniert wie erwartet).

Abnahmegrundlage: Session `discovered-pirate` Abschlussbericht; `library-home-acceptance.mjs`,
`library-curriculum.client.spec.ts` (17 Tests).

---

### PAPER_STUDIO_BANK_V1_COMPLETE

**Datum:** 2026-09-14 → 09-20

**Umfang:** Regionale Prüfungsgestaltung Guizhou — nur Prüfungserstellung + Antwortanalyse, Lieferstandard druckbar A4.

Ablauf: Prüfungsschwerpunkte-Tabelle → Zweiweg-Spezifikation → AI-Entwurf → automatische Prüfung + unabhängige Lösung → Lehrer prüft jede Aufgabe → Version sperren → DOCX/PDF-Vierersatz.

- Neues Paket `@physicsos/question-paper` (reines Domänenmodell + Pure Functions, keine cordis-Abhängigkeit) und Host-Plugin `paper-host` (`/physicsos/paper`, alle Routen in dessen README)
- Vier Versorgungsstufen bei der Zusammenstellung: `verbatim` (≥0.85 Originalaufgabe direkt)/`adapt` (0.55–0.85 überarbeitetes Gerüst)/
  `generate` (kein Kandidat über Schwelle)/`gap` (ehrliche Lücke); Bewertung =
  Wissenspunkt 0.45 + Schwierigkeit 0.25 + Fähigkeit 0.15 + Quelle 0.15, mit Aktualitätsschranke
- **Provenienz nicht fälschbar:** `generated`-Aufgaben erhalten einheitlich `{mode:'generated'}` und überschreiben mögliche injizierte falsche `bankItemId`; Ledger bucht nach **tatsächlicher Provenienz der aufgenommenen Aufgaben**, Herabstufung wird falsch gebucht
- Genehmigung an Inhaltshash gebunden, jede `commitDocument`-Änderung macht Approval ungültig — Aufgabenwechsel kann dies nicht umgehen

**Behobene echte Mängel (bei dieser Runde Audit gefunden):**

- `PATCH /bank/items/:id` konnte `id` / `enteredBy` injizieren → `bankItemPatchWire.omit`
- PATCH-Änderung von stem ohne Duplikatprüfung → `DUPLICATE_ITEM` ergänzt
- `GET /bank/items?status=` nutzte `as never ?? undefined` hart, **jeder falsch geschriebene Status lieferte still die ungefilterte Gesamtheit** → Whitelist-Validierung, ungültige Werte 400
- `recordCheckResults` mit `status: hasErrors ? 'review' : 'review'` (zwei identische Ternäre, `sonarjs` erkannt) → tote Variable entfernt und physikalische Begründung "nach Prüfung immer in Lehrerprüfung" ergänzt

Abnahmegrundlage: `overlays/harness/files/packages/physicsos/paper-host/README.md`,
`paper-host/tests/routes.spec.ts`, `question-paper` 42 Tests.

---

### GATES_ALL_GREEN_AND_OVERLAY_RECOVERY

**Datum:** 2026-09-21

**Umfang:** Engineering-Abschluss. Diese Runde fügt keine Produktfähigkeiten hinzu, sondern behebt, dass "Code gesund, aber Engineering-Zustand nicht lieferbar" ist.

**A. Eine Woche Arbeit ohne Commit (schwerstes Risiko):** Alle Arbeiten nach 09-12 existierten nur im Arbeitsbereich
(335 Dateien, +16724/−5747 Zeilen). Nach Themen in 13 Commits aufgeteilt:
Engine/Domänen-Korrekturen → `question-paper` → `auth-host` → `tool-physicsos` →
ui-physicsos → Assets → Skripte und Abnahmen → Dokumentation → Repository-Hygiene → Gates → Overlay-Fix →
Lint-Abrechnung → Browser-Abnahme.

**B. `paper-host` existierte nur in Vendor (Datenverlustrisiko):** Das gesamte Backend des Prüfungsstudios
(13 Dateien) war im Submodule untracked, nicht im Overlay und im Parent-Repo unsichtbar.
HANDOVER-Abschnitt "Neue Maschine einrichten" hätte es **gar nicht vorhanden**. Nun ins Overlay aufgenommen und verifiziert,
dass `apply` byteweise wiederherstellt. Ebenso alle 6 untracked Pfade im Submodule geprüft, restliche 5
waren abgedeckt — `paper-host` war die einzige Lücke.

**C. Gate-Lücke:** Root-`pnpm test` `test:agent` **führte nur `tool-physicsos` aus**,
`auth-host` (4 Specs) und `paper-host` (1 Spec) waren in keiner täglichen Gate.
Jetzt deckt `typecheck:agent` / `lint:agent` / `test:agent` drei Pakete ab
(93 Tests, ursprünglich 20). Die Verkabelung deckte sofort 141 nie geprüfte Lint-Fehler auf, alle abgearbeitet
(inkl. 40 Non-Null-Assertions durch echte Narrowing ersetzt, `parse<T>` wobei T nur einmal verwendet wird, dynamisches delete usw.).

**D. `pnpm lint` vollständig grün** (drei Gates erstmals gleichzeitig bei 0). Vier rote Stellen abgearbeitet:

- **ui-physicsos 171 Dateien 461 Fehler → 0**. Alle stammen aus dieser Woche neu hinzugefügten Bereichen
  (PaperWorkspace 225, fluid-renderer 121, LearningRecordWorkspace 65,
  AdminWorkspace 18, AuthGate 14), nicht aus "bestehenden Upstream-Problemen" wie in HANDOVER notiert.
  Abarbeitung behob außerdem 47 durch Autofix verursachte Formatbeschädigungen (`e =>{ setX(); }`-Form)
- **`packages/question-paper` 4 Fehler:** 7 `U+3000` (Vollbreiten-Leerzeichen zur chinesischen Satztrennung) im Markdown-Prüfungsvorlage lösten `no-irregular-whitespace` aus, auf `\u3000` umgestellt — Ausgabebytes unverändert, Absicht sichtbar
- **`packages/engine-composite` 3 Fehler:** `repro-ms.test.ts` war Debug-Gerüst
  (1 `it`, **0 `expect`**, 3 `as any`), kann nicht fehlschlagen und beweist nichts,
  gelöscht; echte Abdeckung in `composite-engine.test.ts` (26 Tests / 51 Assertions)
- **Drei Host-Plugins 141 Fehler** (siehe C)

**E. Browser-Abnahme um Identität erweitert:** Neu `auth-acceptance.mjs` (siehe oben).
Nebenbei Gate-Defekt behoben, der **alle** Abnahme-Suites fälschlich rot färbte — App ruft bei jedem Start
`/physicsos/auth/me` auf, 401 für Gast ist Vertrag, aber Browser wertete es als Console-Error,
Support zählte es in `errorResponses`, jede Suite scheiterte vor dem ersten CASE.
Jetzt teilen beide Schranken dieselbe Bedingung, nur dieser eine Endpunkt wird toleriert.

**F. Audit-Altlasten entfernt:** `mechanics-templates.ts` gelöscht (geprüft, dass referenzierte Locale-Schlüssel
von aktiven Dateien benutzt werden, keine verwaisten Texte); Experimentzentrum-Badge 43 vs. Raster 44 auf
"verfügbare Experimente" vereinheitlicht; Magnetfeld-Station um `derivation` (gleiche Formel wie Verifier) und `trajectoryTimes`
(nach denselben join-Regeln wie Canvas) ergänzt, dazu 5 Tests zur Festigung des Paarungsvertrags; `paper-host` README ergänzt.

**Verifikation** (drei Befehle, gemessener exit code = 0):

| Befehl           | Abdeckung                                                         | Ergebnis      |
| ---------------- | ----------------------------------------------------------------- | ------------- |
| `pnpm typecheck` | core + web + drei Host-Plugins                                    | 0 Fehler      |
| `pnpm lint`      | core (eslint) + web (oxlint 171 Dateien) + drei Host-Plugins (30 Dateien) | **0 Fehler 0 Warnungen** |
| `pnpm test`      | core vollständig grün + web 44 Dateien **686 Tests** + agent 7 Dateien **93 Tests** | vollständig grün |

`auth-acceptance.mjs` 8 CASE / 22 Assertions + 5 Browser-Gates alle PASS.

**Nicht durchgeführt:** Verzeichnisvervollständigung und Credentials-Abweichungen sind Umgebungs-/Datenpflege, registriert als
`GUIZHOU_SCHOOL_ROSTER_HIGH_SCHOOL_GAP`, `DSH_CREDENTIALS_SCHEMA_SKEW`;
`paper-host` REAL-Composition-Test als `PAPER_HOST_COMPOSITION_TEST_GAP`.

---

### QUESTION_BANK_DATA_V1

**Datum:** 2026-09-21

**Umfang:** Die Aufgabensammlung wird von "Mustern zur Mechanismusprüfung" zu "echten nutzbaren Daten".

Bislang enthielt `bank_items` nur 4 Einträge (in den Vorrunden manuell zur Prüfung der Papiergestaltungskette eingegebene Muster),
der Papiergestaltungsalgorithmus hatte faktisch nichts zum Arbeiten. Diese Runde lädt **388 echte öffentliche Aufgaben** (4 → 392).

**Datenquelle:** C-Eval `ceval/ceval-exam`, `middle_school_physics` und
`high_school_physics` mit insgesamt 401 Multiple-Choice-Aufgaben (CC BY-NC-SA 4.0, mit dem
PolyForm Noncommercial dieses Repos kompatibel, Namensnennung siehe `NOTICE.md`). Dies ist in dieser Umgebung die einzige
**eindeutig lizenzierte und maschinenlesbare** Quelle chinesischer Schulphysikaufgaben — kommerzielle Aufgabenbanken (Xuekewang/Baidu Wenku/
Daokebb) sind kostenpflichtig und urheberrechtlich geschützt, Provinzprüfungsämter veröffentlichen keine vollständigen Bögen.

**Mapping** (`scripts/ingest-ceval-physics.mjs`, wiederholbar ausführbar, idempotente Deduplizierung):

- Jede Aufgabe erhält `sourceLabel` / `sourceUrl` / `answerTier: web-public`
- **`reuseModes: ['adapt']`, ohne `verbatim`** — die Papiergestaltung darf sie nur als Überarbeitungsgerüst nutzen,
  druckt ungeprüfte Aufgaben nicht unverändert ab
- Alle `status: pending`, nehmen erst nach einzelner Lehrerprüfung an Papiergestaltung teil
- Wissenspunkte werden aus Aufgabentext und Optionen gemäß **öffentlicher Stichwortliste** im Skript maschinell abgeleitet, Kennzeichnung
  `knowledge-derived-from-stem`; Schwierigkeit/Fähigkeit/Punktzahl sind in der Quelle nicht vorhanden, benannte Standardwerte,
  zusammen in `anomalies` registriert (in Prüfansicht direkt sichtbar)
- 13 Einträge wurden wegen doppelten Aufgabentexts vom Server mit `DUPLICATE_ITEM` abgewiesen — Deduplizierung wirkt

**Ehrliche Erklärung:** Diese Aufgaben sind **keine echten Prüfungsaufgaben aus Guizhou** und wurden mit keinem Prüfungsbogen abgeglichen. Sie lösen
"der Papiergestaltungsalgorithmus hat keine echten Aufgaben", nicht "die Prüfungsbank hat Inhalte" — **die Prüfungsbank hat weiterhin nur 4 Bögen**,
da C-Eval keine bogenbezogenen Metadaten enthält und das Hinzuerfinden von Bogennamen reine Fiktion wäre. Siehe
`PAPER_STUDIO_DATA_STATE` in `BACKLOG.md`.

**B. Massenprüfung (`POST /physicsos/paper/bank/items/review-batch`):** Ein Massenimport legt mehrere hundert `pending` an,
während die Papiergestaltung nur `verified` liest — ohne Massenpfad wären die importierten Daten **tot**
(388 Karten einzeln durchzuklicken ist kein Lehrer-Workflow). Neue Massenprüfungsroute + Servicemethode + Client +
Massenleiste im Bereich "Zu prüfen" des Papierstudios (mit Bereichsfilter, Trefferzahl und **expliziter Bestätigung
"Quelle akzeptieren heißt nicht, jede Aufgabe einzeln zu prüfen"**). Obergrenze 500 pro Anfrage; nicht vorhandene IDs werden **gemeldet, nicht still übersprungen**.

Geprüfte Inhalte **dürfen nicht still verändert werden**: `PUT /bank/items/:id` liefert für `status: 'verified'`
409 `FROZEN`. In dieser Runde stieß man praktisch auf diese Sperre — beim erneuten Tagging wurden 18 bereits verifizierte korrekt abgelehnt.

**C. Wissenspunkt-Granularität wird gemessen, nicht geraten** (zwei Messdurchläufe zur Korrektur):

1. Erste Version prüfte nur den Aufgabentext → **135/401 (34 %) fielen in "Physik gesamt"**; nach Einbezug von Text+Optionen sank es auf 4 %
2. Wirklich fatal war aber die **Granularität**: Version eins erzeugte 13 kapitelweite Eimer (`Schallphänomene`, `Licht und Optik`).
   Die Papiergestaltung vergleicht Wissenspunkte per **Teilstring**, Gewicht 0.45, die Wissenspunkte der Tabelle stammen aus **verifizierten Annotationen** mit
   feingranularer Formulierung der Fachgruppe (`Strömungsdruck und Strömungsgeschwindigkeit`, `Bildentstehung bei Konvexlinse`, `Amperekraft`).
   Messung an einem echten Plan: **15 Zeilen alle generate/gap, 0 Kandidaten** — Daten tot.
   Nach Umschreibung auf **feingranulare Stichwortliste** (49 Regeln, konkret vor allgemein) Ausgabe **44 verschiedene Wissenspunkte**.

3. **Aliase sind der entscheidende Hebel.** `knowledgeScore` prüft `item.knowledge` per **exakter Mengenübereinstimmung**
   (nicht Teilstring): Treffer von `knowledge[0]` gibt 0.6, zudem `0.4 × Trefferzahl / Bedarfszahl`.
   Somit reicht **ein beliebiger** Alias-Treffer für 0.4 → plus Schwierigkeit/Fähigkeit/Quelle ≈ 0.685, über der 0.55
   Adaptionsschwelle. Daher wurde die Wortliste von "Einzeltag" auf **Alias-Array** umgestellt (erster Eintrag ist Haupttag);
   Tagzahl der 388 Einträge stieg von 44 auf **108 verschiedene Tags, durchschnittlich 2.6 pro Eintrag**.

**End-to-End-Messung** (dieselbe echte Detailtabelle, isolierte Sonde, danach alles wieder auf pending zurückgesetzt):

|                                   | Planergebnis                                            |
| --------------------------------- | --------------------------------------------------- |
| C-Eval alle pending (Lehrer noch nicht geprüft) | **15 Zeilen alle `gap`**                                   |
| nach Prüfung von 388 Einträgen                      | **`adapt` 1 + `generate` 4 + `gap` 10**, 5 Zeilen mit Kandidaten |

`Q1` erhielt **195 Kandidaten** und wurde als `adapt` bewertet — die Papiergestaltung nutzte die importierten Daten tatsächlich; `Q2–Q5`
hatten je 194 Kandidaten, aber die Punktzahl lag unter der Schwelle, ehrlich als `generate` eingestuft; `Q6–Q15` sind Lückentext/Zeichnung/Kurzantwort/
Experiment/übergreifend, `gap` ist korrekt — **C-Eval enthält nur Multiple-Choice, solche Slots können damit nicht bedient werden**.
Also: was passt, wird gewählt; was nicht passt, wird nicht vorgetäuscht; falscher Aufgabentyp führt direkt zu gap.

**D. Retag-Modus**: `--retag` setzt nur `knowledge` per PUT, **rührt** `status` /
`reuseModes` / `verifiedBy` / Auditfelder nicht an — die Aufzeichnung des Prüfers muss unverändert bleiben.

**Verifikation**: `GET /physicsos/paper/bank/items` liefert 392 Einträge
(4 verified + 388 pending, C-Eval-Einträge alle pending);
`paper-host` 11 Tests (inkl. 2 Batch); `pnpm typecheck` / `pnpm lint` /
`pnpm test` vollständig grün (web 686 + agent 95).

---

### LAB_SEARCH_RECALL_V1

**Datum:** 2026-09-21

**Umfang:** **Auffindbarkeit** des Experimentzentrums. Keine neuen Experimente, keine Physikänderung, nur die eine Frage —
findet ein Schüler das Experiment, wenn er mit seiner eigenen Formulierung sucht.

**A. Zuerst das Audit-Werkzeug repariert**: `audit-all-domains.mjs` war vor auth geschrieben, navigierte nur zu `/`
und suchte "später konfigurieren"; nach Einführung des Anmeldegates **erreichte es nie das Experimentzentrum** (meldete 0 Templates, sah aber wie bestanden aus).
Jetzt bringt es einen isolierten Dienst + gemeinsamen `registerStudent()`-Helfer mit. Zugleich wird seine guest-401-
Fehlmeldung beseitigt (`isExpectedGuest401` aus support exportiert, Console-Gate und Response-Gate teilen dieselbe Bedingung).

**B. Vollständige Durchsicht**: 54 Templates → **53 ließen sich alle ohne Fehler öffnen/ausführen/pausieren und Inspector-Messwertseite öffnen**,
1 (Zyklotron) wird designgemäß als `comingSoon` übersprungen. Die Funktionsseite der Experimente ist gesund,
daher verlagerte sich die Optimierung auf die Qualitätsebene.

**C. Messung der Suchtrefferquote**: Von 51 umgangssprachlichen Wörtern **26 ohne Treffer**.
Für 12 Templates wurden ehrliche Aliase ergänzt (`Reflexion des Lichts`, `Brechung`, `Erstarren`, `Zustandsänderung`, `Schweben/Sinken`,
`freier Fall`, `Reihen-/Parallelschaltung`, `Schiebewiderstand`, `Generator`, `Schall` …), **26 → 18**;
die restlichen 18 sind **echte Template-Lücken**, siehe `LAB_CURRICULUM_TEMPLATE_GAPS` in `BACKLOG.md`.

> Die erste Sondenversion zählte alle Karten des Panels, und die drei Karten der Empfehlungsleiste waren bei jeder Eingabe sichtbar,
> so dass "keine Treffer" als "3 Treffer" gelesen wurde — **hätte fast 7 echte Lücken als bestanden gewertet**.
> Nur `[data-physicsos-shelf]` zu zählen ist korrekt.

**D. Auffindbarkeit über Oberflächen hinweg: 31/126 → 70/126**. Die zweite Sonde prüfte das eigene Produktversprechen —
"gerade diese Aufgabe gelöst, möchte es praktisch sehen": 126 Wissenspunkte aus **Aufgabenbank-Wissenspunkttabelle + verifizierten Annotationen** werden im
Experimentzentrum gesucht. Ergebnis: **nur 31 waren auffindbar (25 %)**. Nach Klassifikation:

- Experiment vorhanden, nur Wort nicht erkannt (Alias ergänzt): `Brechungsgesetz des Lichts`, `Bildentstehung bei Konvexlinse untersuchen`, `Linsen und ihre Anwendung`,
  `Eigenschaften der Bildentstehung am ebenen Spiegel`, `Reflexionsgesetz des Lichts`, `Schmelzen und Erstarren`, `Hebelgesetz`, `Gleitreibung`,
  `Kräftegleichgewicht`/`Gleichgewichtskraft`/`Kraftanalyse`/`Trägheit`, `EMK und Innenwiderstand der Quelle messen`, `Ohmsches Gesetz im geschlossenen Stromkreis`,
  `Berechnung in Reihenschaltung`, `Joulesches Gesetz`, `Beschreibung von Bewegung`, `Berechnung der Geschwindigkeit`, `Wellenlänge und Frequenz`, `Schallphänomene`,
  `Nutzung von Schall`, `Ultraschall und Infraschall`, `Elektromagnetische Induktion`, `Elektrische Feldstärke`, `Analyse dynamischer Schaltungen`,
  `Ablenkung geladener Teilchen`, `Bewegung geladener Teilchen im elektrischen/Kompositfeld` …
- Tatsächlich kein Experiment vorhanden (bleibt null, in BACKLOG registriert): `Druck`/`Luftdruck`/`Flüssigkeitsdruck`,
  `Elektromagnet`/`stromdurchflossene Spule`/`Magnetismus durch Strom`, `Mechanische Energie`/`Kinetische Energie`/`Energieerhaltung`, `Dichte`,
  `Haushaltsstromkreis`/`Elektrische Sicherheit`, `Innere Energie`/`Wärmekraftmaschine`, `Elektromagnetische Wellen`/`Informationsübertragung`, `Kernenergie`,
  `Gasgesetze`, `Welle-Teilchen-Dualismus`, `idealer Transformator`, `Dispersion`/`Interferenz des Lichts` …
  **Für diese werden keine Aliase ergänzt** — einen Schüler in ein Labor zu schicken, das seinen Suchbegriff nicht behandelt, ist schlimmer als ein ehrliches leeres Ergebnis.

**E. Als dauerhafte Gate etabliert**: `tests/acceptance/lab-search-recall.mjs` ist eine bidirektionale Ratsche —
**94 Wörter müssen auffindbar sein, 20 bekannte Lücken dürfen weiterhin nicht auffindbar sein**; an dem Tag, an dem das Experiment ergänzt wird, schlägt der Test fehl
und weist darauf hin, das Wort nach `FINDABLE` zu verschieben, so dass die Liste nicht verrottet.

**Verifikation**: `lab-search-recall.mjs` → auffindbar 94/94, bekannte Lücken 20/20, ALL CHECKS PASSED;
Oberflächenübergreifende Sonde → 70/126; `audit-all-domains.mjs` → 53 geöffnet / 1 übersprungen / 0 Probleme;
`experiment-summaries`-Parität 7/7.

**Nicht durchgeführt**: die 18 fehlenden Experimente ergänzen — für jedes muss zuerst das Engine-Modell ergänzt werden, ein eigenständiger Ausschnitt,
nach Contract First + Golden First, Startbedingung bereits registriert.

---

## Ausdrücklich zurückgestellt

Siehe `docs/reports/BACKLOG.md`:

- `AGENT_MODEL_BACKED_ANSWERS_BACKLOG` (Vertrag liegt vor, nur `matchIntent` ersetzen)
- `QUESTION_IMAGE_PDF_INGEST_BACKLOG`
- `APPS_WEB_STANDALONE_RETIREMENT_BACKLOG`
- `HARNESS_WINDOWS_REPLAY_GATE_DEFERRED`
- `UPSTREAM_PARALLEL_TEST_FLAKE` (Upstream-Parallel-Load-Flake, 10/10 einzeln erfolgreich)
- Canvas Camera V1: derzeit nicht geplant. viewBox folgt Container + aspect-ratio fit löst Linienbreitenvergrößerung und extreme Szenenausschnitte;
  echtes Pan/Zoom wird erst bei Himmelsmechanik, großräumigen elektromagnetischen Feldern, komplexer Schaltungstopologie benötigt
