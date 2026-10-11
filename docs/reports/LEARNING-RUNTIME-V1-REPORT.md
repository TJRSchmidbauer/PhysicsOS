# PhysicsOS Learning Runtime V1 — Intelligente Lehrschicht

> Datei: `docs/reports/LEARNING-RUNTIME-V1-REPORT.md`
> Abnahmedatum: 2026-08-24
> Vorgänger: `COMPOSITE_FIELD_RUNTIME_V1_COMPLETE` (siehe `MILESTONES.md`)
> Meilenstein: `PHYSICSOS_LEARNING_RUNTIME_V1_COMPLETE`

## 1. Ziel und Problem

Nach den zusammengesetzten Feldern V1 ist die physikalische Fähigkeit (Scene → Engine → Verifier → Observation → Canvas →
Agent) vollständig, aber das Produkt ist weiterhin nur ein „verifizierbarer Physiksimulator“: Der Schüler sieht PASS,
aber nicht, **warum**; bei einer falschen Antwort sagt ihm niemand, welcher Art der Fehler ist; was er gelernt hat und
bis zu welchem Grad er es beherrscht, wird nirgends festgehalten. Diese Runde **erweitert die Physik nicht** (keine Experimentvorlagen, keine Engine, keine Formeln), sondern baut nur den
**Nutzungskreislauf für Schüler**:

1. **Tutor Mode (geführter Unterricht)** – kein Chatfenster, sondern Beobachtung → Leitfrage → Hinweisleiter → Antwort.
2. **Fehlerdiagnose · Selbsttest** – Klassifikationsdiagnose in drei Fehlerklassen (Konzept/Richtung/Modellierung) mit Verweis auf Verifier-Evidenz.
3. **Lernverlauf** – Fehleraufgaben, Fehlertypen und Beherrschungsgrad der Wissenspunkte, alles aus echten Antworten aggregiert.
4. **Wissensgraph** – Kursbaum + manuell geprüfte Zuordnung Aufgabe↔Wissenspunkt.
5. **Versuchsbericht** – Parameter/abgeleitete Größen/Bereichsereignisse/Verifikation/Schlussfolgerung des aktuellen Frames, per Klick als Markdown exportierbar.

## 2. Eiserne Architekturregeln (fortgeführt, keine Ausnahme)

- **Nachgelagerte Schichten berechnen niemals Fakten neu, die vorgelagerte bereits festgestellt haben**: Jede Zahl des Tutors stammt aus
  `PhysicsAgentContext` (abgeleitete Größen der Engine + Ergebnis des Verifiers); jede Zeile des Berichts stammt aus
  dem aktuellen Frame des `WorkspaceSnapshot`; der Lernverlauf zählt nur und rechnet keine Physik.
- **Lehrinhalte sind Daten, keine Heuristik**: Wissensgraph und Selbsttest-Aufgabenbank sind manuell geprüfte explizite Tabellen,
  die Tests stellen sicher, dass alle 56 eingebauten Aufgaben zugeordnet sind und nur deklarierte Knoten/Aufgaben referenzieren –
  Aufgaben driften nie still auf falsche Wissenspunkte ab.
- **Reine Ansicht und Faktenänderung sind streng getrennt**: Beim Aufdecken eines Hinweises im Tutor läuft die Canvas-Hervorhebung über denselben Pfad
  des Tools `physics.ui.highlight` wie beim Q&A-Agent, die Revision bleibt unverändert (Browser-CASE-A-Assertion).

## 3. Question Space: Fehlerdiagnose · Selbsttest + Wissenszusammenfassung

### 3.1 Selbsttest-Aufgabenbank (`packages/question-core/src/self-checks.ts`)

- `SelfCheckItem { id, prompt, options[], takeaway }`; jede falsche Option trägt
  `mistake { type, explanation, evidenceCheckId?, review[] }`.
- **19 Selbsttest-Sonden, 55 Optionen, 36 klassifizierte falsche Optionen**, die alle 56
  Golden Questions abdecken (Magnetfeld 10 / Elektrisches Feld 19 / Mechanik 6 / Zusammengesetzte Felder 21).
- Die Fehlerklassifikation ist auf drei Klassen festgelegt: **Konzeptfehler** (z. B. „Magnetkraft verrichtet Arbeit → Geschwindigkeit nimmt zu“),
  **Richtungsfehler** (Linke-/Rechte-Hand-Regel, Beurteilung der Feldrichtung), **Modellierungsfehler** (z. B. Vernachlässigung der Schwerkraft ohne
  Größenordnungsvergleich). Jede falsche Option muss eine lesbare Erklärung und mindestens einen Hinweis „Zur Wiederholung empfohlen“ liefern,
  die Tests prüfen dies Punkt für Punkt.
- `learning-content.test.ts`: Knoten-IDs eindeutig und Elternknoten zuerst deklariert; alle 56 Aufgaben haben Zuordnung und
  Selbsttest; die Zuordnungstabelle darf keine nicht existierenden Aufgaben referenzieren; jede Aufgabe hat genau eine richtige Option, bei den falschen Optionen ist die
  Klassifikation vollständig.

### 3.2 Integration in den Question Space (`QuestionWorkspace.tsx`)

- Unterhalb des Lösungsergebnisses neu: der Bereich „**Fehlerdiagnose · Selbsttest**“ (`data-physicsos-selfcheck`):
  Falsche Antwort → Diagnosekarte (Badge der Fehlerklasse + Erklärung + `Verifier: check_id PASS/FAIL` als Live-Evidenz +
  empfohlene Wiederholungs-Chips); richtige Antwort → Karte zur Festigung des takeaway. Nach der Antwort sind die Optionen gesperrt und die richtige wird aufgedeckt.
- Die in der Diagnosekarte zitierte Verifier-Evidenz stammt aus den **aktuell gelösten Simulation-Checks**
  (`resolveEvidence`), nicht aus statischem Text – zum Beispiel verweist „Magnetkraft verrichtet keine Arbeit“ auf den Live-Status von
  `magnetic_force_does_no_work`.
- Neu ist der Bereich „**Wissenszusammenfassung**“ (`data-physicsos-knowledge`): Wissenspunkt-Chips der aktuellen Aufgabe,
  stammen aus der Zuordnung des Wissensgraphen (z. B. Protonenaufgabe → Lorentzkraft, Kreisbewegung im Magnetfeld).
- Jede Antwort wird über `recordAttempt` in den Lernverlauf geschrieben (Aufgabe, Selbsttest-Element, Option, richtig/falsch,
  Fehlerklasse, Wissenspunkte); der Question Space selbst speichert keinen Zustand.

## 4. Wissensgraph (`packages/question-core/src/knowledge-graph.ts`)

- **20 Knoten**: Mechanik (gleichmäßig beschleunigte Bewegung, Wurf, zweites Newtonsches Gesetz, Kräfteanalyse,
  schiefe Ebene, Einheiten und Größenordnungen) + Elektromagnetismus (Feldstärke, Überlagerung, elektrische Kraft, Ablenkung wie beim waagerechten Wurf,
  begrenzte Felder, Arbeit und kinetische Energie, Lorentzkraft, Kreisbewegung, E+B, Geschwindigkeitsselektor, Massenspektrometer,
  Dreifeld-Gleichgewicht).
- `QUESTION_KNOWLEDGE`: die manuelle Zuordnungstabelle für 56 Aufgaben; `knowledgeNodesOfQuestion`
  liefert die Knoten in Tabellenreihenfolge. Alles sind Daten, keine Schlüsselwort-Heuristik.

## 5. Tutor Mode (KI-Assistent → Anleitung)

### 5.1 Kursskripte (`physics/physics-tutor.ts`)

- `TutorScript { topic, observation[], question, hints[], answer, evidence[] }`; **10 Kursarten**:
  Geschwindigkeitsselektor (zwei Varianten: Gleichgewicht/Ablenkung), Massenspektrometer-Kreisbogen, Dreifeld-Resultierende,
  E+B-Resultierende, Kreisbewegung im Magnetfeld, Zerlegung beim waagerechten Wurf, Kräftezerlegung an der schiefen Ebene, elektrisches Feld und elektrische Kraft,
  allgemeines Schema Kraft und Bewegung.
- Die Kurswahl erfolgt nach **Fakten**: Bei zusammengesetzten Feldern wird das Gerät anhand der von der Runtime veröffentlichten Fakten unterschieden
  (ID der Ablenkzone des Massenspektrometers, abgeleitete Größe der Schwerkraft ungleich null, Vorhandensein von `velocity_selection_condition`),
  bei der Mechanik nach dem Szenentitel; bei `context.status === 'failed'` wird kein Kurs angeboten.
- Der Beobachtungsbereich zitiert die abgeleiteten Größen des aktuellen Frames (echte Zahlen wie `|F_E| = 3.20e-15 N`);
  der Antwortbereich zeigt die benannten Prüfungen des Verifiers als Evidenz-Chips (`Geschwindigkeitsselektionsbedingung · PASS/FAIL`). Fehlende Fakten
  werden einfach weggelassen, keine Sprosse berechnet Physik.

### 5.2 Karte (`TutorCard.tsx` + Tab „Anleitung“ in `AgentDrawer.tsx`)

- Der Drawer des KI-Assistenten erhält zwei Tabs `Fragen / Anleitung` (role=tablist).
- Die Leiter wird Stufe für Stufe aufgedeckt: Der Button für Hinweis n zeigt den Fortschritt (`Hinweis 1/3`); beim Aufdecken einer Stufe wird über das gemeinsame
  `runTools` die von ihr deklarierte Canvas-Hervorhebung ausgelöst (Regeln zum Zusammenführen und Erlöschen per Timeout wie bei Q&A).
- Ändert sich die Kurs-ID (Gerät gewechselt oder der Schüler ändert v weg von E/B, sodass das Gleichgewicht kippt), wird die Leiter automatisch zurückgesetzt –
  die Hinweise eines halb aufgedeckten alten Kurses sind eine Lüge.
- Nach dem Aufdecken der Antwort steht „Neu starten“ zur Verfügung.

## 6. Lernverlauf (`learning-record-store.ts` + `LearningRecordWorkspace.tsx`)

- `createLearningRecordController(storage)`: Persistenz in localStorage (Obergrenze 200, neueste zuerst), beschädigte Daten werden still verworfen;
  drei reine Aggregationsfunktionen `knowledgeMasteryOf` / `mistakeCountsOf` /
  `recentMistakesOf`, die **nur zählen**.
- Der Lernverlauf ist ein offizielles Surface (`data-physicsos-surface="record"`), der Einstieg „Lernverlauf“ im Sidebar-Footer wird
  vom ausgegrauten Platzhalter zur echten Navigation.
- Seite: Kennzahlenkarten für Anzahl Selbsttests / Trefferquote / Anzahl Fehleraufgaben; Verteilung der Konzept-/Richtungs-/Modellierungsfehler; Liste der letzten
  Fehleraufgaben (Aufgabe, deine Antwort, Badge der Fehlerklasse, relative Zeit); Beherrschung der Wissenspunkte (Fortschrittsbalken
  correct/total je Kursknoten, mit zugehörigem Fach).
- Jede Fehleraufgabe trägt „**Erneut üben**“: ein Deep Link zurück in den Aufgabenraum, der dieselbe Golden Question öffnet
  (`openQuestion` → `consumeQuestion`, Browser-CASE-D-Assertion zur Überschrift).

## 7. Versuchsbericht (`physics/experiment-report.ts` + `ExperimentReportPanel.tsx`)

- `buildExperimentReport(snapshot)`: projiziert den aktuellen Frame auf
  `{ title, goal, parameters, derived, events, verification, conclusion, markdown }`. Die Parameter stammen aus den editierbaren Feldern des Inspector-Baums; abgeleitete Größen und Bereichsereignisse stammen aus der Engine; die Verifikation vom
  Verifier; die Schlussfolgerung wird nach der Bestehensquote der Verifikation erzeugt (alles bestanden → „Verifikation bestanden“ + leere Liste der Fehlschläge;
  bei Fehlschlägen werden die fehlgeschlagenen Punkte genannt). Zeiten laufen stets über die adaptive `formatClock` (im Nanosekundenbereich Exponentialformat).
- In der Toolbar neu: Schaltfläche „Bericht“ (bei verification failed deaktiviert) → Dialog zur Anzeige +
  „Markdown herunterladen“ exportiert `Experimentname-Versuchsbericht.md`.
- Der Bericht zeigt die Fakten des **aktuellen Frames**: Hat das Teilchen den Selektorbereich bereits verlassen, sind elektrische Kraft/Lorentzkraft
  0,00 N – das ist eine physikalische Tatsache, kein Mangel (per Screenshot-QA bestätigt).

## 8. Browser-Abnahme (`apps/web/e2e/learning-acceptance.mjs`)

CASE A–F alle PASS, alle 5 Gates bei 0:

- **A Tutor Mode**: Die Beobachtung zitiert echte Zahlen; nach Hinweis 1 erscheint auf dem Canvas eine Hervorhebungsgruppe;
  Hinweis 2 lehrt die Linke-Hand-Regel; die Antwort enthält „Resultierende null / v = E/B“ und zitiert
  „Geschwindigkeitsselektionsbedingung · PASS“; über die gesamte Leiter bleibt die Revision unverändert; Neustart setzt zurück.
- **B Tutor liest die lebende Runtime**: Nach v₀ → 1,5e5 kippt der Kurs zu `selector-deflecting`
  („Warum wird dieses Teilchen abgelenkt?“), die Antwort zitiert FAIL; bei wiederhergestelltem v = E/B kippt er zurück zum Gleichgewichtskurs.
- **C Selbsttest-Diagnose**: Protonenaufgabe READY; Wissenszusammenfassungs-Chips stammen aus dem Graphen; Klick auf die falsche Antwort „verrichtet positive Arbeit“ →
  Badge Konzeptfehler + Erklärung „Die Richtung der Lorentzkraft steht stets senkrecht zur Geschwindigkeitsrichtung“ +
  Evidenz `magnetic_force_does_no_work` + Wiederholungsempfehlung; Optionen gesperrt und die richtige wird aufgedeckt.
- **D Lernverlauf**: Aggregat 1 Selbsttest / 0 % Trefferquote / 1 Fehleraufgabe korrekt; Fehleraufgabe trägt die Originalaufgabe und
  „Deine Antwort“; bei der Beherrschung der Wissenspunkte erscheint der Fortschrittsbalken Lorentzkraft; kein Seitenscroll;
  „Erneut üben“ führt per Deep Link zurück zur selben Aufgabe.
- **E Versuchsbericht**: Der Bericht nennt Experiment, Versuchsparameter (Elektrische Feldstärke …), abgeleitete Größen der Engine (Lorentzkraft …),
  physikalische Verifikation (Geschwindigkeitsselektionsbedingung), Versuchsschlussfolgerung (Verifikation bestanden); Markdown-Download wird angeboten; Schließen führt zurück.
- **F Persistenz**: Nach einem Neuladen der gesamten Seite sind Fehleraufgaben und Fehlerklassen weiterhin vorhanden (localStorage).

**Regression**: Alle fünf alten Acceptance-Skripte `mechanics` / `electric` / `electric-v2` / `electric-region` /
`composite` mit ALL CHECKS PASSED.

**Screenshot-QA** (manuell am Bild bestätigt): `tutor-mode-1600x900`, `tutor-deflecting-1600x900`,
`selfcheck-diagnosis-1600x900`, `learning-record-1600x900`,
`experiment-report-1600x900`.

## 9. Abnahmedaten

- `typecheck` (core + web) ohne Fehler; `lint` (eslint core + oxlint web) ohne Fehler.
- `test:core` alles grün: question-core **228** (einschließlich 8 Punkte learning-content),
  engine-composite 26, physics-composite-core 48, übrige Packages unverändert.
- `test:web` ui-physicsos **205 / 16 Dateien** alles grün (einschließlich `learning.client.spec.tsx`
  mit 15 Punkten: Tutor-Skripte, Drawer-Leiter und Hervorhebung, Aggregation und Persistenz des Record-Stores, Record-Surface,
  Sidebar-Einstieg, Selbsttest-Diagnose und Wissens-Chips, Deep Link „Erneut üben“, Berichtsaufbau und Panel).
- ui-physicsos-Bundle neu gebaut; Overlay-`capture` wurde nach `overlays/harness/files/` zurückgeschrieben.

## 10. Nicht Teil (ausdrückliche Grenzen)

- **Modellgetriebene Tutor-/Agent-Antworten**: `AGENT_MODEL_BACKED_ANSWERS_BACKLOG`
  unverändert – Kurse und Antworten sind weiterhin deterministische Skripte; beim Anbinden eines echten Modells wird die Intent-Matching-Schicht ersetzt,
  Evidenz und Tool-Vertrag des Tutors bleiben unberührt.
- **Aufgabenerkennung aus Bild / PDF**: `QUESTION_IMAGE_PDF_INGEST_BACKLOG` unverändert.
- **Geräteübergreifender Lernverlauf**: nur localStorage; Kontosystem und serverseitige Speicherung gehören zur späteren
  Data-Storage-Phase (`docs/10-DATA-STORAGE-ARCHITECTURE.md`).
- **Semantische Bewertung frei eingegebener Antworten**: Der Selbsttest ist eine konzeptionelle Sonde im Auswahlverfahren, keine Bewertung subjektiver Aufgaben.
- **3D-Renderer**: Die Architektur hält ihn vor (Renderer-Registry), in dieser Phase nicht umgesetzt.
