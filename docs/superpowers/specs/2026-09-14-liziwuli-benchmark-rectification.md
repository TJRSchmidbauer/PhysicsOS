# Nachbesserungsplan für den Experimentbereich (Benchmark gegen liziwuli.com)

Datum: 2026-09-14. Umfang: Experimentzentrum → Arbeitsbereich → Erfahrung eines einzelnen Experiments. Dieser Plan ersetzt die Linie D
(Breitenangleichung) des Nachbesserungsplans der vorigen Runde; bereits abgeschlossene Punkte der Linien A/B/C werden nicht wiederholt.

## 0. Empirische Wettbewerbsdaten (2026-09-14 erneut abgerufen, keine Wiedergabe aus zweiter Hand)

Quelle: Start-HTML + alle 20 JS-Chunks gemessen (`/tmp/lzw/`).

- **Katalogumfang**: Im Bundle 126 Experimenteinträge, davon `status:"implemented"` **106**
  (die Startseite wirbt nach außen mit 82 interaktiven Experimenten – die Katalogdaten enthalten mehr als die Werbung).
- **Organisation**: 12 Module der Oberstufe + 13 `junior-*`-Module der Mittelstufe, insgesamt 25 Familien. Die Modulnamen
  entsprechen den Kapiteln des Lehrbuchs der PEP (人教版).
- **Pro Experiment eine eigene Komponente**: Jedes der 106 Experimente wird als eigener Chunk lazy geladen
  (`UniformLinearMotionExperiment`, `ChaseEncounterExperiment` …), es ist kein
  generischer Renderer mit Parametern – Visualisierung, Interaktion und Messwerte jedes Experiments sind maßgeschneidert.
- **Pro Experiment eine strukturierte Zusammenfassung**: `summary.{coreModel, parameters[], feedback[], errors[]}`,
  oben im Arbeitsbereich werden drei Karten „Kernmodell / Wichtige Parameter / Beobachtungsrückmeldung“ gerendert; in den Daten gibt es außerdem
  `errors[]` (Messfehler/Modellnäherung) und `textbookMapping`
  (`人教版 / 高中物理 / 2019` + Pflicht-/Wahlpflichtband + Kapitel + Thema).
- **Suchaliase**: Die meisten Experimente tragen `searchAliases` (z. B. schräger Wurf: `斜上抛/射程/射高/互余角…`).
- **Toolbar**: Pro Experiment die Schaltflächen „Experimentanleitung“ und „Datenexport“.
- **Geräte vollständig im Code gezeichnet**: Die einzigen Bild-Assets der ganzen Seite sind das Favicon und der WeChat-QR-Code, die Geräte sind per CSS-Modul-
  Klassennamen gezeichnet – die Annahme der vorigen Runde „der Wettbewerber stützt sich auf Bitmaps“ ist damit widerlegt.
- **Kostenlos ohne Anmeldung**: 82 Experimente sind kostenlos nutzbar, ohne Anmeldung und ohne Mitgliedschaft.

## 1. Unser Ist-Zustand (am selben Tag gemessen)

- **43 wählbare Experimente** (44 Vorlagen, cyclotron `comingSoon`), 11 Domänenfamilien.
- **Architekturunterschied**: Wir gehen über die generische Pipeline `PhysicsScene → Engine → Verifier → Observation →
runtime → renderer` mit 13 Runtimes; die Gegenseite hat pro Experiment eine eigene Komponente.
  Unsere Stärken: Eine Engine-Korrektur an einer Stelle nützt allen Experimenten, Szenen sind serialisierbar und teilbar, der Aufgabenraum verwendet dieselbe
  Engine; Schwäche: Das Gefühl der Maßschneiderung pro Experiment ist schwach (keine experimentspezifischen Panels/Schritte/Anleitungen).
- **Bereits vorhanden, was die Gegenseite nicht hat**: direkte Bedienung auf dem Canvas (Geräte ziehen/Schalter umlegen/Schleifer schieben über offizielle Befehle),
  Engine-Verifikationsabzeichen, schrittweise Wiedergabe, Berichts-Tab, KI-Assistent, Kopplung mit dem Aufgabenraum.
- **Fehlende strukturierte Daten**: Die Vorlagen haben nur `label/hint/tags`, aber keine
  `coreModel/parameters/feedback/errors/textbookMapping/searchAliases`.
- **Formelsatz**: Das selbst gezeichnete `MathText` unterstützt nur Hoch- und Tiefstellung; die Gegenseite hat KaTeX (Brüche/Wurzeln/Integrale).
- **Geräteweg**: Wir haben gerade Bitmap-Sprites eingebunden (Schaltung 19 Teile + Mechanik 5 Teile, alle mit bestandener Qualitätskontrolle),
  die Gegenseite zeichnet rein per Code. Beide Wege haben ihre Kosten – das ist ein Entscheidungspunkt, keine feststehende Schlussfolgerung.

## 2. Lückenmatrix (auf Familienebene)

| Familie des Wettbewerbers (Anzahl implementiert) | Unsere Abdeckung                             | Lücke                                                                                                                                |
| ---------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Grundlagen der Kinematik (5) | Gleichförmig/gleichmäßig beschleunigt/freier Fall/Durchschnittsgeschwindigkeit 4 | Verfolgung und Begegnung, v-t-Flächen-Infinitesimalmethode                                                                |
| Wechselwirkungen und Newton II (11) | Newton II, schiefe Ebene, Hebel 3 | Hooke, Haft-/Gleitreibung, Zusammensetzen und Zerlegen von Kräften, Gleichgewicht konkurrierender Kräfte, Über-/Schwerelosigkeit, Förderband, Brett-Klotz, Momentanität, Parallelogramm, Seilrollen-Knoten, Messung von μ —— **8 fehlen** |
| Kurvenbewegung und Gravitation (7) | Waagerechter Wurf, schräger Wurf 2 | Zusammensetzung/Zerlegung von Bewegungen, kritische Zentripetalkraft, Himmelsmechanik, Satellitenbahnwechsel, Doppelstern —— **5 fehlen** |
| Arbeit und mechanische Energie (4) | 0                                     | Potenzielle Energie, Arbeitssatz der kinetischen Energie, mechanische Energieerhaltung, Anfahren einer Lokomotive —— **alle fehlen** |
| Elektrisches Feld und Ladung (9) | Punktladung/mehrere Punktladungen/homogenes Feld/Plattenkondensator 4 | Feldlinien und Äquipotentialflächen, Oszilloskop-Röhre, Radialfeld, elektrostatische Influenz und Abschirmung, Linearbeschleuniger —— **5 fehlen** |
| Gleichstrom (6)       | Reihe/Parallel/Gemischt/Schiebewiderstand/Strom-Spannungs-Kennlinie/Leistung/EMK 7 | Ablesen von Messgeräten, spezifischer Widerstand, Laden und Entladen eines Kondensators —— **3 fehlen, der Rest bereits übertroffen** |
| Magnetfeld und elektromagnetische Induktion (15) | Kreisbewegung im Magnetfeld, Geschwindigkeitsselektor, Massenspektrometer, Einzelstab/Doppelstab/Fluss 6 | Magnetfeldlinien, Richtung der Ampèrekraft, Lenzsche Regel, Wechselstrom, Transformator, Fernübertragung, Zyklotron, Details zum Dreifeld-Verbund, Radialmagnetfeld-Messwerk, Magnetfeld eines Stroms —— **~9 fehlen** |
| Impuls und Stoß (7)   | Elastisch/inelastisch/vollständig inelastisch 3 | Impuls und Kraftstoß, Experiment zur Erhaltung, Rückstoß-Rakete, zweidimensionaler Stoß, Kugelrinne, Federkopplung —— **4 fehlen** |
| Mechanische Schwingungen und Wellen (5) | Wanderwelle/Interferenz/stehende Welle 3 | Federpendel, Fadenpendel, erzwungene Schwingung und Resonanz, Wellenentstehung —— **4 fehlen** |
| Optik (5)             | Planspiegel/Sammellinse/Hohlspiegel/Wölbspiegel 4 | Brechung und Totalreflexion, Doppelspalt-Interferenz, Einzelspalt-Beugung, Dünnschicht-Interferenz —— **4 fehlen** |
| Wärmelehre und Gase (4) | Schmelzen/spezifische Wärmekapazität 2    | Brownsche Bewegung, Geschwindigkeitsverteilung, isotherme Zustandsänderung, Zustandsgleichung —— **4 fehlen** |
| Moderne Physik (4)    | 0                                            | Photoeffekt, Kernmodell, Energieniveaus und Spektren, Halbwertszeit —— **alle fehlen** |
| Familien der Mittelstufe insgesamt (~34) | Akustik 1, Auftrieb 1, Hebel (Mechanik) 1 | Schall 1, Aggregatzustände 1, Licht 3, Linse bereits abgedeckt, Masse und Dichte 2, Kraft und Bewegung 4, Druck 4, Auftrieb 1, Arbeit und einfache Maschinen 4, innere Energie 6, Stromkreis 2, Spannung und Widerstand 1 —— **~28 fehlen** |

**Fazit**: Von 106 decken wir tatsächlich etwa 35–40 ab, die Lücke beträgt ~65 Experimente, der Großteil liegt bei den Familien der Mittelstufe
(~28), Wechselwirkungen (8), Magnetfeld-Induktion (9), moderner Physik (4 fehlen alle),
Schwingungen und Wellen (4), Wärmelehre (4), Arbeit und Energie (4 fehlen alle).

## 3. Nachbesserungs-Workstreams (nach Abhängigkeit geordnet)

### P0 · Strukturierte Zusammenfassung pro Experiment (reine Daten + Rendering, die Trägerfläche aller späteren Chargen)

Die drei Karten oben in jedem Arbeitsbereich des Wettbewerbers sind die Hauptquelle seiner „didaktischen Anmutung“; sie sind reine Datenarbeit,
mit dem geringsten Risiko und sofort sichtbarem Nutzen.

- **P0-1 Datenmodell**: `ExperimentTemplate` erhält das Feld `summary`
  `{ coreModel: PhysicsosKey, parameters: PhysicsosKey[], feedback:
PhysicsosKey[], errors: PhysicsosKey[] }` + `textbookMapping?:
{ edition, volume, chapter, topics[] }` + `searchAliases?: string[]`.
  Die Texte laufen über locales (zh zuerst, en synchrone Schlüsselwerte).
- **P0-2 Rendering**: Die drei Karten werden unter Szenen- und Objektpanel des Arbeitsbereichs (oder in einer Infoleiste über dem Canvas) gerendert;
  die Karten im Experimentzentrum erhalten ein Eck-Abzeichen mit der Lehrbuchzuordnung.
- **P0-3 Befüllung**: Die 44 vorhandenen Vorlagen erhalten einzeln `coreModel/parameters/feedback/errors`
  — der Inhalt jedes Feldes **muss mit dem tatsächlich von der Engine gelösten Modell übereinstimmen** (die in coreModel geschriebene Formel
  muss die sein, die die Engine rechnet; ein Verstoß ist so schwerwiegend wie P0 des Audits).
- **Abnahme**: Alle 44 Vorlagen haben eine summary; Test zum Rendern der Karten; jede Abweichung eines coreModel vom
  Engine-Verhalten gilt als Fehlschlag.

### P1 · Toolbar des Arbeitsbereichs vervollständigen

- **P1-1 Experimentanleitung**: Pro Experiment ein Feld `guide` (Schrittliste + Fehlererläuterung), modal angezeigt;
  die Daten stammen aus den errors von P0 + neuen steps.
- **P1-2 Datenexport**: Die bereits in der Runtime vorhandene Tabelle des Tabs `data` wird als CSV exportiert
  (die Zeitreihentabelle liegt bereits im Snapshot, reiner Frontend-Blob-Download, ohne Abhängigkeit).
- **P1-3 Suche**: Das Experimentzentrum erhält ein Suchfeld, das auf `label` + `searchAliases` +
  `tags` passt (chinesische Aliase insgesamt als einfache Stringfelder außerhalb von locales).

### P2 · Upgrade des Formelsatzes (Entscheidungspunkt)

- Eigene Erweiterung von `MathText` auf Brüche/Wurzeln (geschätzt Umfang M, keine neue Abhängigkeit); oder Einführung von KaTeX
  (erfordert eine Abhängigkeitsausnahme mit Genehmigung + ~270KB). **Zunächst Muster nach der Eigenlösung erstellen** (v = v₀ + at,
  x = ½at², zwei Bruch-/Wurzelszenarien); wird der Standard erreicht, wird keine Abhängigkeit eingeführt.

### P3 · Breite ergänzen (in 6 Chargen, jede einzeln abnehmbar und veröffentlichbar)

Einheitlicher Arbeitsablauf pro Charge: Vorlage + `createScene` an echte Engine/neue Runtime anbinden → summary befüllen
(Vertrag aus P0) → Zahlenwerttest → Browser-Test → Screenshot. Von der Engine nicht unterstützte Modelle werden **lieber
als comingSoon gekennzeichnet, nicht gefälscht**.

| Charge          | Inhalt                                                                      | Neu             | Engine-Abhängigkeit                                               |
| --------------- | --------------------------------------------------------------------------- | --------------- | ----------------------------------------------------------------- |
| P3-a Mechanik ausbauen | Verfolgung und Begegnung, Hookesches Gesetz, Haft-/Gleitreibung, Zusammensetzen und Zerlegen von Kräften, Gleichgewicht konkurrierender Kräfte, Über-/Schwerelosigkeit, v-t-Fläche | 7 | Die vorhandene mechanics-Engine kann es lösen, meist neue Scene Builder |
| P3-b Schwingungen und Wellen | Federpendel, Fadenpendel, erzwungene Schwingung und Resonanz, Wellenentstehung | 4          | Braucht ein Modell harmonischer Schwingung (neues Modul oder Erweiterung von mechanics) |
| P3-c Impuls und Energie | Impuls und Kraftstoß, Verifikation der Impulserhaltung, Rückstoß-Rakete, Arbeitssatz der kinetischen Energie, mechanische Energieerhaltung | 5 | Die collision-Engine ist vorhanden, Energie braucht abgeleitete Größen |
| P3-d Elektromagnetik ausbauen | Visualisierung von Feldlinien/Äquipotentialflächen, Demonstration der Lenzschen Regel, Wechselstrom, Richtung der Ampèrekraft, Magnetfeldlinien | 5 | electric/induction vorhanden + Feldlinien-Sampler |
| P3-e Wärmelehre und Moderne | Brownsche Bewegung, Geschwindigkeitsverteilung, isotherme Zustandsänderung, Photoeffekt, Halbwertszeit | 5 | Braucht 2 neue kleine Engines (statistische Physik/Quantenskizze, qualitative Modelle sind erlaubt, aber summary vermerkt es) |
| P3-f Familien der Mittelstufe | Nach der Lückenliste chargenweise: Lichtbrechung und Dispersion, Druck und Auftrieb, Arbeit und einfache Maschinen, innere Energie, Schalleigenschaften, Masse und Dichte | ~20 in 2–3 Unterchargen | Meist qualitative/einfache quantitative Modelle, das vorhandene Runtime-Muster wiederverwenden |

Abschlusskriterium jeder Charge: Vorlage erstellbar + Engine löst tatsächlich + die vier summary-Teile vollständig +
Diagrammwerte korrekt + Test mit Zahlenwert-Assertions + Browser-Test ohne Fehler + Screenshots abgelegt.

### P4 · Endgültige Entscheidung zum Geräteweg (Fortsetzung von C4)

Ist-Zustand: Bitmaps für Schaltung 19 Teile + Mechanik 5 Teile sind eingebunden und abgenommen; der Wettbewerber zeichnet rein per Code.

- **Option A Bitmaps beibehalten**: Vorteil ist die realistische Anmutung; Kosten: Jede neue Domäne braucht eine Runde Erzeugen-Qualitätskontrolle-
  Ankermessung, bei ~65 neuen Experimenten ist die Menge an Geräten nicht klein.
- **Option B Zeichnen per Code** (in Richtung Wettbewerber): Die Vektorzeichnung von `primitives.tsx` wird aufgewertet
  (isometrisch/Seitenansicht-Vorgabe + einheitlicher Beleuchtungsverlauf), keine Asset-Pipeline, Geräte sind parametrisierbar
  (Länge des Schiebewiderstands folgt dem Widerstandswert – mit Bitmaps nicht machbar).
- **Option C Hybrid**: Gerätekörper per Code gezeichnet (parametrisiert), nur komplexe Materialanmutungsteile (Zifferblatt,
  Lichtquelle) mit Bitmaps.
- **Empfehlung**: B oder C. Parametrisierung ist der Killer-Vorteil des Zeichnens per Code (Schieber, Federdehnung,
  Flüssigkeitshöhe des Wettbewerbers sind alle geometrisch parametergesteuert). Vor dem Start der ersten Charge von P3 ist zu entscheiden,
  um nicht weiter in den falschen Weg zu investieren.

### P5 · Maßgeschneidertes Gefühl pro Experiment (der sinnvolle Teil von „eine Komponente pro Experiment“)

Das Vorgehen mit 106 Komponenten wird nicht kopiert (es widerspricht unserer Architektur mit Vorrang der Engine), aber die **Darstellungs-
schicht** wird übernommen:

- **P5-1 Dekorationsschicht der Szene**: `SceneVisualModel` erhält optionale `decorations` (z. B. die Keilstütze der schiefen Ebene
  ist bereits per Code gezeichnet – verallgemeinert zu einer je Experiment deklarierbaren Schicht von Hintergrundgeräten).
- **P5-2 Eigenes Anzeigepanel**: Die Runtime hat bereits readouts, Vorlagen dürfen
  `featuredReadouts` deklarieren (große Zahlen auf dem ersten Bildschirm, z. B. der „Abstand“ bei Verfolgung und Begegnung).
- **P5-3 Schrittweise Anleitung**: Die Experimentanleitung (P1-1) wird mit der schrittweisen Hervorhebung auf dem Canvas gekoppelt.

## 4. Ausführungsreihenfolge und Umfang

1. **Erste Charge**: P0 (strukturierte Zusammenfassung, alle 44 Vorlagen) + P1-3 Suche + P4 Entscheidungspunkt
2. **Zweite Charge**: P1-1/P1-2 Toolbar + P3-a Mechanik ausbauen (Engine vorhanden, liefert am schnellsten Menge)
3. **Ab der dritten Charge**: P3-b→f chargenweise voranbringen; P2 Formeln werden nach dem Test in der ersten Charge entschieden; P5 wird
   in den Chargen mit Musterexperimenten eingestreut (empfohlen je eines: Verfolgung und Begegnung / Federpendel / Photoeffekt)

Grobe Umfangsschätzung: P0 = M (44×4 Felder reine Daten + Rendering); P1 = S–M; P3 je Charge = M–L
(der Engpass liegt bei neuen Engines, nicht bei Vorlagen); P5 = M.

## 5. Grenzen und Risikokontrolle

- Von der Engine nicht unterstützte Modelle sind durchweg `comingSoon`, **gefälschte Implementierungen sind verboten**
  (Lehre aus P0 des Audits: cyclotron war richtig gekennzeichnet, Aufgaben vom Vergleichstyp nicht).
- Das Feld `summary.coreModel` führt die neue Ehrlichkeitsfläche „Text muss dem Engine-Verhalten entsprechen“ ein –
  ein Parity-Test wird ergänzt: Die in coreModel vorkommenden symbolischen Größen müssen in derived/parameters dieses Experiments existieren.
- Keine neue Abhängigkeit; die KaTeX-Ausnahme erfordert eine gesonderte Genehmigung.
- Chinesische Titel/Aliase neuer Experimente vermeiden Wort-für-Wort-Übereinstimmung mit dem Wettbewerber (Modellnamen sind öffentliche physikalische
  Fachbegriffe, das ist unproblematisch, aber die Texte von `searchAliases` werden nicht abgeschrieben).
- Vor dem Aufnehmen von Vorlagen der Mittelstufe in die Bibliothek wird die Schulstufenkennzeichnung erneut geprüft (Lehre aus P2-5).
- QuestionWorkspace bleibt schreibgeschützt, die Szenen neuer Vorlagen unterliegen ebenfalls
  `FACT_COMMANDS`.

## 6. Abnahmekriterium

Am Ende jeder Charge: typecheck / test:web / test:core / lint / build:web alle grün +
Praxistest auf localhost:3080 (einschließlich dunkel) + Screenshots. Nach Abschluss wird
`EXPERIMENT-BENCHMARK-PARITY-REPORT.md` erstellt: Die 106 Wettbewerber-Experimente werden einzeln gegenübergestellt
(abgedeckt/nicht abgedeckt/comingSoon), „vermutlich abgedeckt“ ist nicht zulässig.
