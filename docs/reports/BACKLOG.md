# PhysicsOS Backlog

> Datei: `docs/reports/BACKLOG.md`
> Zweck: Erfasst erkannte Arbeitspunkte, die ausdrücklich die aktuelle Completion Gate nicht blockieren.
> Jeder Eintrag muss klar sagen, **warum jetzt nicht** und **unter welchen Bedingungen doch**.

---

## ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG

**Status**: **Geschlossen** (2026-08-23, `ELECTRIC_BOUNDARY_RUNTIME_COMPLETE`).

Die Startbedingung „Electric Engine erzeugt diskrete Ereignisse (Betreten des Feldgebiets /
Verlassen des Feldgebiets / Treffen der Platte)" wird von `@physicsos/engine-electric-region`
erfüllt: Es wertet das begrenzte Plattenfeld abschnittsweise aus und erzeugt an den
Feldgebietsgrenzen und an den Platten `PhysicsEventLike` (`EnterField` / `ExitField` / `HitPlate`).

Die Prognose traf ebenfalls zu — **null Änderungen auf der UI-Seite**. Die Klasse von
`TimelineMarkers` wird dynamisch zusammengesetzt
(`css[\`eventMark_${event.kind}\`]`), die drei neuen kinds greifen automatisch; es kamen nur
die drei Styles `.eventMark_enter`/`.eventMark_exit`/`.eventMark_plate-impact` dazu
sowie seitens des Runtimes `eventsOf`, das `SimulationResult.events` auf `TimelineEvent` abbildet.

Browser-Abnahme: `electric-region-acceptance.mjs` Fall D — Marker-Anzahl ≥ 2 (Eintritt + Austritt),
Klick auf einen Marker setzt die Uhr (seek), die 5 Gates sind 0. Szenen mit unbegrenztem homogenem
Feld und mit Punktladung bleiben weiterhin leere Arrays (Fall B prüft
`no region events in an unbounded field`), es wurden keine erfundenen Marker erzeugt.

Hier folgt der ursprüngliche Stand vor der Schließung.

---

**Symptom**: Die Zeitleiste der Arbeitsplatte für elektrische Felder hat keine Ereignis-Marker;
`WorkspaceSnapshot.events` ist für die electric-Domäne stets ein leeres Array.

**Ursache**: `ElectricEngine` erzeugt derzeit keine diskreten Ereignisse. Das Wurfmodell der
Mechanik besitzt physikalisch echte diskrete Zeitpunkte (Abwurf / Scheitel / Aufprall), deshalb
liefert `eventsOf` launch / apex / impact; das Punktladungsmodell ist ein **statisches Modell**
(eine einzige SimulationState, keine Trajektorien-Integration), und ein geladenes Teilchen im
homogenen Feld hat im Abtastfenster ebenfalls kein gleichwertiges physikalisches Ereignis
(Grenzereignisse wie Ein- und Austritt aus dem Feldgebiet oder Plattenkollision sind noch nicht modelliert).

**Warum jetzt nicht**: Ein erfundener Marker verletzt das Grundprinzip „der Canvas zeigt nur
Tatsachen, die die Engine belegt hat" — ohne zugehöriges PhysicsEvent ein „Ereignis" zu zeichnen,
wäre Physik erfinden.
`ELECTRIC_FIELD_RUNTIME_PACK_V2` (mehrere Punktladungen + Äquipotentiallinien) ist fertig,
aber sein Umfang schließt Ereignis-Marker auf der Zeitleiste ausdrücklich aus (statisches Modell
ohne diskrete Ereignisse). Zum Nachholen muss zuerst in der Electric Engine die Feldgebietsgrenzen
und die Plattenkollision modelliert werden (homogenes Feld, V3) oder die Trajektorien-Ereignisse
bewegter Ladungen (spätere dynamische Feld-Slices).

**Startbedingung**: Die Electric Engine erzeugt diskrete Ereignisse (Eintritt ins Feldgebiet /
Verlassen des Feldgebiets / Treffen der Platte oder diskrete Zeitpunkte einer dynamischen
Punktladungs-Trajektorie). Dann reicht die UI ohne jede Änderung aus —
`TimelineMarkers` und die Ereignis-Seite von `DataPanelBody` sind bereits domänenunabhängig.

---

## QUESTION_IMAGE_PDF_INGEST_BACKLOG

**Status**: **Geschlossen (2026-09-25)**. Transkription durch das visuelle Modell, lokales
Extrahieren des Textlayers aus PDFs, seitenweises Rendern gescannter Seiten, Bild-Ingest-API,
Lehrer-Prüf-UI und die pending-Einspielkette sind umgesetzt und getestet. Es fehlt weiterhin an
lizenzierbaren echten Bogenquellen, nicht an der Erkennungsfähigkeit selbst.

**Eintrag vor der Schließung**: Damals wurde ein OCR-/VLM-Dienst samt Pipeline zum Zerlegen
ganzer Bögen für nötig gehalten — ein eigener Schritt der Question Pipeline, kein Teil der
Mechanics UI.

### Bleibende echte Lücken

- Echte Bogenquellen sind weiterhin durch Urheberrecht, Anmeldung und offizielle Veröffentlichungswege eingeschränkt.
- Automatisches Zerlegen ganzer Bögen funktioniert, aber komplexes Zweispaltenlayout, seitenübergreifende Aufgaben und handschriftliche Anmerkungen brauchen weiterhin die Bestätigung des Lehrers.

---

## AGENT_MODEL_BACKED_ANSWERS_BACKLOG

**Status**: Registriert (Nachprüfung 2026-09-25). Das Q&A im Labor-Schublade-Panel ist weiterhin
deterministisches Intent-Matching (`physics-agent-answers.ts` → `AgentDrawer`). **Der Pfad
„Modell-Antwort" existiert aber faktisch bereits**: Das Preset `physics-student` hängt an
`tool-physicsos` + Persona, und über den Haupt-Sessionspfad erhalten Schüler bereits
modellgesteuerte Antworten — die verbleibende Frage ist damit verengt auf „soll das
eingebettete Schnell-Q&A für Tokens auf Modellantworten umgestellt werden", eine
Produktentscheidung und kein blockierendes Engineering. Die deterministische Schicht selbst ist
eine Funktion (sofort, offline, kostenfrei), kein Übergangsüberrest.

**Bereits vorhandener Teil**: Agent Context Adapter (liest scene / revision / simulation /
verification / observations / time / question context), Werkzeugverträge
(`physics.ui.highlight` ist reine Sicht, `physics.scene.setParameter` läuft über SceneCommand)
sowie der Source-Chip-Mechanismus, der verlangt, dass Antworten Fakten zitieren, die der
Runtime bereits erzeugt hat.

**Startbedingung (geändert)**: Der Agent Service ist verfügbar (dsh agent + tool-physicsos);
offen ist nur noch die Produktfrage — eingebettetes Q&A auf Modellantworten umzustellen hieße
pro Anfrage einen LLM-Hin-und-Rückweg plus Kontingentverbrauch; das sollte erst nach der
Entscheidung über die Rolle der „deterministischen Sofort-Schicht" passieren.

---

## APPS_WEB_STANDALONE_RETIREMENT_BACKLOG

**Status**: **Geschlossen** (2026-09-25). Das gesamte Verzeichnis wurde gelöscht (25 Dateien, in
der Git-Historie nachvollziehbar); `pnpm-workspace.yaml` verliert den glob `apps/*`, der
Kommentar in `boundary.ts` verweist auf das Harness-Client-Paket, und README/01-Entwicklungsanleitung
formulieren beide „gelöscht, offizieller Einstieg ist `dsh-client-ui-physicsos`". Kein Code
importiert es — in `boundary.ts` steht nur ein Kommentar.

**Altlast**: In `pnpm-lock.yaml` ist noch der importer-Abschnitt von `apps/web` übrig; beim
nächsten möglichen `pnpm install` verschwindet er automatisch (die aktuelle worktree-Konfiguration macht install nicht ausführbar).

## GUIZHOU_SCHOOL_ROSTER_HIGH_SCHOOL_GAP

**Status**: Teilweise behoben (2026-09-21 um 15 Schulen ergänzt). **Weiterhin unvollständig**,
aber längst nicht so gravierend, wie die vorige Fassung dieses Dokuments schrieb — die vorige Einschätzung war falsch, sie wird zuerst korrigiert.

### Korrektur: Die vorige Fassung „15 fehlende Flaggschiff-Schulen" war ein Fehlurteil

Die vorige Fassung grep-te mit **umgangssprachlichen Kurznamen** (`Guiyang Nr. 1`, `Kaili Nr. 1`, `Duyun Nr. 1` …) und kam zu
„von 20 sind 15 nicht erfasst". Diese Schlussfolgerung ist **nicht haltbar**: Das Verzeichnis verwendet **amtliche Vollnamen**, Kurznamen lassen sich
natürlich nicht grep-en. Nach Einzelprüfung:

| Umgangsname         | Tatsächlicher Eintrag im Verzeichnis | Status   |
| ------------------- | ------------------------------------ | -------- |
| Guiyang Nr. 1       | `Mittelschule Nr. 1 Guiyang`         | erfasst  |
| Guiyang Experimentell Nr. 3 | `Dritte Experimental-Mittelschule Guiyang` | erfasst |
| Guiyang Nr. 6 / Nr. 9 | `Mittelschule Nr. 6 Guiyang` / `Mittelschule Nr. 9 Guiyang` | erfasst |
| Qinghua-Mittelschule | `Qinghua-Mittelschule Guiyang`       | erfasst  |
| Anshun Nr. 1        | `Erste Oberschule Anshun`            | erfasst  |
| Tongren Nr. 1       | `Erste Mittelschule Tongren`         | erfasst  |
| Bijie Nr. 1         | `Mittelschule Nr. 1 Bijie`           | erfasst  |
| Kaili Nr. 1         | `Erste Mittelschule der Stadt Kaili, Provinz Guizhou` | erfasst |
| Duyun Nr. 1         | `Erste Mittelschule Duyun, Bezirk Qiannan` | erfasst |
| Xingyi Nr. 1 / Xingyi Nr. 8 | —                            | **fehlt** |
| Zunyi Nr. 4         | —                                    | **fehlt** |

**Lehre der Methodik**: Beim Abgleich mit einem Verzeichnis muss man amtliche Vollnamen verwenden oder normalisiert matchen (Entfernen von „Provinz/Stadt/Bezirk",
Varianten wie „…-Mittelschule Nr. X" ↔ „… Nr. X"), sonst kommt man zum genau gegenteiligen Ergebnis. Genau deshalb
führt `resolveSchoolByName` einen zweigleisigen Abgleich über name/shortName durch.

### Unabhängige Verifikation: Die Oberschulen-Abdeckung im Bezirk Qiandongnan ist tatsächlich gut

Das Verzeichnis der Oberschulen des Bezirks Qiandongnan 2025 des Amts für Erziehung Qiandongnan wurde abgerufen und **die Tabelle ausgewertet** (sechs Spalten: Nummer/Name/
Verantwortlicher/Lehrkräfte/Lehrumgebung/Telefon, insgesamt 52 Zeilen, davon 4 Zeilen berufsbildende Schulen):

```
https://www.qdn.gov.cn/zwgk_5871642/zdlyxxgk/ggqsy_5872177/202408/t20240820_85407269.html
```

**Von 48 allgemeinbildenden Oberschulen sind 46 bereits erfasst**, ergänzt wurden nur 2 (Nationalitätenschule Wende, Kreis Zhenyuan,
Mittelschule Zhenyuan, Provinz Guizhou). Also muss auch der Eindruck „Qiandongnan hat nur 80 Einträge, deutlich zu wenig" korrigiert werden —
diese 80 sind die Lücke auf der **Mittelschul**-Seite (die Bezirksseite hat tatsächlich kein Mittelschulverzeichnis), nicht auf der Oberschul-Seite.

### Echte Lücken (in dieser Runde 15 Schulen ergänzt)

| Quelle                                                             | Abgerufen | Erfasst | Ergänzt |
| ------------------------------------------------------------------ | --------- | ------- | ------- |
| Amt für Erziehung Qiandongnan, „Verzeichnis der Oberschulen des Bezirks 2025" | 48 allg. Oberschulen | 46 | 2 |
| Amt für Erziehung Qiánxī'nán, „Bekanntmachung der Jahresprüfung 2025 der privaten Oberschulen" + Rubrik Grundbildung | 13 | 0 | 13 |

**Die Ursache ist klar**: Jene Datensätze für Qiánxī'nán stammten ursprünglich aus der „Statistik zur Schulpflichtbildung des Bezirks Qiánxī'nán" —
**Schulpflichtbildung** —, deshalb sind in Xingyi fast nur Kreis-/Straßen-Mittelschulen erfasst (Mittelschule Qishe,
Mittelschule Wantun, Mittelschule Wusha …), **und keine einzige Oberschule der Bezirkshauptstadt**.

**Weiterhin fehlend** (in dieser Runde keine offizielle Verzeichnisseite gefunden):

- **Öffentliche** Oberschulen der Stadt Xingyi: Xingyi Nr. 1, Xingyi Nr. 8, Xingyi Nr. 5 …
- Vierte Mittelschule der Stadt Zunyi (in der Provinz als vorbildliche allgemeinbildende Oberschule der Kategorie 1 eingestuft)
- **Vollständige Oberschulverzeichnisse** der übrigen Städte/Bezirke Guiyang/Zunyi/Liupanshui/Anshun/Bijie/Tongren/Qiannan —
  diese wurden nur stichprobenartig geprüft, nicht Zeile für Zeile verglichen, deshalb gibt es für „ob vollständig" derzeit **keinen Beleg**,
  und man darf nicht behaupten, sie seien in Ordnung

### Warum es nicht abgeschlossen wurde

Man braucht die offiziellen Oberschulverzeichnis-Seiten der einzelnen Stadt-/Bezirksämter. In dieser Runde wurden zwei Wege erschlossen, Qiandongnan und Qiánxī'nán
(Regierungsportal → Rubrik-Weiterleitung → Dokumentseite); für die übrigen Städte/Bezirke wurden keine entsprechenden Seiten gefunden, außerdem:

- Das Werkzeug `web_search` ist nicht konfiguriert (HTTP 401, Endpunkt nicht gesetzt)
- Suchmaschinen (Bing / DuckDuckGo / Baidu) liefern Challenge-Seiten oder 0 Ergebnisse
- Die Standortsuche des Bildungsamts der Provinz Guizhou ist rein JS-getrieben, das statische HTML enthält keinen Endpunkt
- Die Hochschuldatenbank Yangguan Gaokao lehnte im Test mit 412 ab; Wikipedia wurde auf eine nicht öffentliche IP aufgelöst

**Startbedingung**: die offiziellen Oberschulverzeichnisse der übrigen Städte/Bezirke beschaffen (der gleiche Weg „Regierungsportal → Amt-für-Erziehung-Rubrik →
Verzeichnis-/Zulassungsplanungsdokument" genügt; die URLs für Qiandongnan/Qiánxī'nán sind oben als Beispiel vermerkt).
Danach je Stadt/Bezirk Untergrenzen-Assertions in `schools-data.spec.ts` ergänzen und mit einem **Oberschul**-Namen
CASE B von `auth-acceptance.mjs` als Registrierungs-Regression laufen lassen.

### Anhang: Das Verzeichnis ist weiterhin nicht reproduzierbar

Der Kopf von `schools-data.ts` schrieb früher „regenerate from the source TSV", aber **die Quell-TSV
liegt nicht im Repository** (im ganzen Repo keine `*.tsv`), dieser Satz war ein ungedeckter Scheck. Er wurde durch eine wahrheitsgemäße Angabe ersetzt: Die 1566 Zeilen
stammen aus einer nicht im Repo befindlichen Quelltabelle und lassen sich nicht rekonstruieren; die am 2026-09-21 ergänzten 15 Zeilen tragen am Ende des Arrays
**inline die Quell-URL**, sind also einzeln nachvollziehbar. Für echte Reproduzierbarkeit müsste die Quelltabelle ins Repository gelegt und ein
Generierungsskript ergänzt werden.

---

## LAB_CURRICULUM_TEMPLATE_GAPS

**Status**: **Geschlossen** (2026-09-22, die §B-Tabelle wurde vollständig ergänzt, die bekannten Lücken von `lab-search-recall` sind auf null). Die Chargen ①②③④ und die Totalreflexion aus ⑤ sind online (Fluiddruck / die gesamte Elektromagnetismus-Gruppe /
Mechanische Energie / geradlinige Lichtausbreitung / Totalreflexion). Das Versuchszentrum hat jetzt **71 Vorlagen** (70 davon anlegbar;
`cyclotron` trägt „bald verfügbar", erscheint aber weiterhin im Regal — die 59 wurden am 2026-09-22 im Regal einzeln durchgezählt,
②b ③ ④ ⑤ haben je weitere Prüfstände ergänzt). Die verbleibenden sieben Gruppen konzentrieren sich auf die letzten Zeilen der §B-Tabelle.

**Wie es entdeckt wurde**: Es wurde eine Such-Recall-Sonde geschrieben, die Formulierungen, die Schüler/Lehrer tatsächlich eingeben, in das
Suchfeld des Versuchszentrums eingibt und nur die Durchsichts-Karten in `[data-physicsos-shelf]` betrachtet.
(**Achtung**: Die 3 Karten in der Empfehlungsleiste sind bei jeder Eingabe vorhanden, deshalb würde eine Zählung des gesamten Panels „null Treffer"
als „3 Treffer" auffassen — genau so hat die erste Version der Sonde mich getäuscht.)

In der ersten Runde waren von 51 umgangssprachlichen Wörtern **26 ohne Treffer**. Sie zerfallen in zwei Klassen:

**A. Alias-Lücken (behoben, 12 Vorlagen ergänzt)** — der Versuch deckt das Konzept tatsächlich ab, nur gelangte diese Formulierung nicht in den
Index. Ergänzt wurden `Lichtreflexion`, `Brechung`, `Erstarren`, `Zustandsänderung`, `Schweben und Sinken`, `freier Fall`,
`Reihen- und Parallelschaltung`, `Schiebewiderstand`, `Generator`, `Schall`, `Reflexionsgesetz`, `Akustik` u. a., null Treffer 26 → 18.

**B. Echte Vorlagen-Lücken (Einträge dieses Dokuments)** — die Engine enthält die entsprechende Physik nicht, **es gibt keinen ehrlichen Alias, auf den man zeigen könnte**
(ein erzwungener Verweis würde Schüler in das falsche Labor schicken):

| Fehlendes Thema                            | Bereich   | Anmerkung                                                                                                            |
| ------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------- |
| ~~Druck / Atmosphärendruck~~                | Mechanik · Fluide | ✅ **Charge ① ergänzt** (2026-09-22, siehe unten)                                                                    |
| ~~Mechanische Energie / Potentielle Energie~~ | Mechanik · Energie | ✅ **Charge ③ ergänzt** (2026-09-22, siehe unten)                                                                  |
| ~~Zentripetalkraft~~                        | Mechanik · Himmelsmechanik | ✅ **ergänzt** (2026-09-22): ein **belegter Alias** auf `magnetic-circular` — `qvB = mv²/r` und `r = mv/(qB)` sind **zwei Schreibweisen derselben Gleichung**, die Lorentzkraft ist genau die zum Kreismittelpunkt weisende resultierende Kraft |
| Gravitation                                 | Mechanik · Himmelsmechanik | 🟡 **Die Physikschicht ist umgesetzt und verifiziert** (`engine-mechanics/src/orbit.ts`, 5 Golden Tests: Raumstation 7656 m/s / 93 min, geostationäre Bahn 42164 km, Keplers drittes Gesetz als Folgerung, die Masse kürzt sich aus der Bahn heraus); **noch nicht als Versuch angeschlossen** — es fehlen die Verdrahtung des Modells `circular_orbit` + Szenen-Fabrik + Vorlage + Client |
| ~~Stromdurchflossene Spule / Ampèresche Regel / Elektromagnet / Elektromotor~~ | Elektromagnetismus | ✅ **Charge ② (a + b) ergänzt** (2026-09-22, siehe unten)                                          |
| ~~Lochkamera-Abbildung / geradlinige Lichtausbreitung~~ | Optik | ✅ **Charge ④ ergänzt** (2026-09-22, siehe unten)                                                       |
| ~~Totalreflexion~~                          | Optik     | ✅ **Charge ⑤ ergänzt** (2026-09-22, siehe unten)                                                                    |
| ~~Tonhöhe / Lautstärke~~                    | Akustik   | ✅ **ergänzt** (2026-09-22): ein **belegter Alias** auf der Transversalwellen-Arbeitsfläche — die Tonhöhe ist die Frequenz, die Lautstärke die Amplitude, beide sind dort lesbare und verstellbare Regler |
| Lärm                                        | Akustik   | ❌ **als nicht zu ergänzen befunden (2026-09-22)**: Lärmkontrolle (Schalldämmung / Schallabsorption / Schalldämpfung) ist ein Ingenieursproblem, es gibt keine ehrliche Arbeitsfläche, auf die man zeigen könnte |
| ~~Sieden (das Sieden von Wasser)~~          | Wärmelehre | ✅ **Charge ⑤ ergänzt** (2026-09-22, siehe unten): heating-curve erhielt eine **zweite Plateauphase** (isotherme Verdampfung)                        |
| Thermometer                                 | Wärmelehre | ❌ **als nicht zu ergänzen befunden (2026-09-22)**: Die entsprechende Lehrplan-Einheit behandelt ein **Instrument** (Messbereich / Teilungswert / Ablesung / besonderer Aufbau des Fieberthermometers), die Wärmelehre-Arbeitsfläche **verwendet** das Thermometer nur, statt es zu lehren — gleiches Kriterium wie bei „Lärm": Nur wenn der Versuch das Konzept wirklich abdeckt, wird ein Alias gehängt |
| ~~Transformator~~                           | Elektromagnetische Induktion | ✅ **Charge ⑤ ergänzt** (2026-09-22, siehe unten): Modell `ideal_transformer` + Vorlage `transformer`                             |
| ~~Kurzschluss~~                             | Stromkreis | ✅ **Charge ⑤ ergänzt** (2026-09-22, siehe unten) — kein Verbraucher im Kreis, `I = E/r`, Klemmenspannung 0                    |

**Charge ① (2026-09-22): Fluiddruck, drei Prüfstände** — die Engine **reichte bereits aus**
(`packages/engine-fluid/src/pressure-engine.ts` war längst da, mit abgeleiteten Größen und 6 Validierungen);
diese Charge verband sie **mit der Oberfläche**:

- `solid-pressure` untersucht die Wirkung der Druckkraft: dieselben 20 N drücken erst auf 200 cm² (1000 Pa), dann auf
  50 cm² (4000 Pa) — die Druckkraft bleibt unverändert, der Druck vervierfacht sich, `contact_force_invariant` wacht darüber
- `liquid-pressure` untersucht den Druck im Innern einer Flüssigkeit: Wasser 20 cm / 40 cm / Salzlösung bei gleicher Tiefe,
  die drei Validierungen sind „linear mit der Tiefe", „linear mit der Dichte" und „Integration des hydrostatischen Gradienten"
- `atmospheric-pressure` die Messung des Atmosphärendrucks: Torricelli-Säule `p₀/(ρ_Flüssigkeit·g)` = 760,05 mm und
  Magdeburger Halbkugeln `p₀·πr²` = 795,61 N — beide Zahlen sind nicht in der Szene gespeichert, sondern aus demselben p₀ abgeleitet

Neu hinzu kamen 2 Szenen-Befehle (`SetPressureBarometerFluidDensity` / `SetPressureHemisphereRadius`);
jeder muss **vier Stellen** durchlaufen: Befehls-Union von physics-scene + Nutzlast-Tabelle + Ereignis-Union + Nutzlast-Tabelle, danach gespiegelt
in die Befehlstabelle von agent-tools, die FACT_COMMANDS in `experimental-branch.ts` sowie die Laufzeittabelle des Prüfers —
fehlt eine davon, gilt „der Prüfer hat eine änderbare Eingabe, aber eine Änderung wird nie wirksam". Auf der Oberflächenseite kamen
vier Dateien hinzu: Renderer / visuelle Brücke / Workspace-Runtime / Client-spec.

**Die Lehre dieser Charge**: Alle drei Apparaturen wurden **zuerst rechnerisch aufgebaut und erst danach zum ersten Mal als Bild betrachtet**, und beide Bilder hatten je
einen Defekt — beim Atmosphärendruck wurden die beiden Beschriftungen „Quecksilbersäulenkuppe (Vakuum)" und „Quecksilberspiegel" außerhalb des Canvas platziert (die Führungslinie verlief
über die extent hinaus), beim Fluiddruck ging die Beschriftung „Flüssigkeitsspiegel" ganz verloren. Nach der Reparatur wurde daraus ein dauerhaftes Gate
`tests/acceptance/pressure-rigs-shot.mjs`: Screenshots in zwei Viewports + Prüfung auf Beschriftungs-Überschreitung + Rechteckmessung „Quecksilbersäule wird
im Glasrohr gezeichnet" + Überlappungsmessung „Beschriftung liegt nicht auf der Quecksilbersäule". **Die aufgebauten Koordinaten müssen vermessen werden,
mit einem bloßen Blick erkennt man es nicht.**

**Charge ②a (2026-09-22): Magnetfeld des Stroms, zwei Prüfstände** — in dieser Charge **ist die Engine neu**
(`magnetic` hatte nur einen Partikellöser für die Lorentzkraft, kein Modell für das Magnetfeld eines Stroms):

- `straight-wire-field` das Magnetfeld um einen geraden stromdurchflossenen Leiter: `B = μ₀I/(2πr)`;
  10 A sind bei 5 cm 40 µT und bei 10 cm genau 20 µT — das π in μ₀ und 2πr heben sich auf,
  beide Ablesungen sind ganze Zahlen; deshalb ist „doppelter Abstand, halbes Feld" im Bild auf einen Blick sichtbar
- `solenoid-field` das Magnetfeld im Innern einer stromdurchflossenen Spule: `B = μ₀(N/L)I`;
  n = 2000 Windungen/Meter, I = 5 A → 4π×10⁻³ T ≈ 12,57 mT, doppelte Windungszahl verdoppelt das Feld,
  und an der Spulenöffnung ist es genau die Hälfte des Inneren

Die Engine liegt in `packages/engine-magnetic/src/current*.ts` (drei Dateien: Modell / Physik / Engine);
`canHandle` schließt sich über „gibt es currentBenches" mit dem Lorentzlöser gegenseitig aus. Auf der Physikseite gibt es 4 Validierungen,
jede prüft, ob **zwei Algorithmen übereinstimmen**, statt die Formel noch einmal hinzuschreiben: der Grenzfall unendlich langer gerader Leiter gegen das
Biot-Savart-Ergebnis endlicher Länge (bei 100-facher Sondenlänge ist die Abweichung < 10⁻³), die Invariante B·r, das Feld an der Spulenöffnung ×2
und das Windungsverhältnis. Neu hinzu kamen 6 Szenen-Befehle (Strom / Sondenabstand / Vergleichsabstand / Windungszahl / Vergleichs-Windungszahl / Länge);
jeder muss **vier Stellen** durchlaufen (Befehls-Union + Nutzlast-Tabelle + Ereignis-Union + Nutzlast-Tabelle) und danach in agent-tools,
die FACT_COMMANDS und die Laufzeittabelle des Prüfers gespiegelt werden.

**Zwei Entwurfsentscheidungen tragen direkt die Physik**: Der gerade Leiter wird **senkrecht zur Papierebene** gezeichnet (⊙ aus der Ebene heraus / ⊗ in die Ebene hinein),
erst dann lässt sich das Magnetfeld als konzentrische Kreise zeichnen, und die Ampèresche Regel ist direkt aus dem Bild ablesbar (Daumen in Stromrichtung, vier Finger um das Feld, und die Pfeile
werden in genau diese Richtung gezeichnet); bei den axialen Feldlinien der Spule **ist die Reihenfolge der Scheitelpunkte die Feldrichtung**; kehrt der Strom die Richtung um, wird die ganze Linie
umgedreht, statt die Pfeile in die alte Richtung zeigen zu lassen.

**Die Lehre dieser Charge**: Beide Bilder „sahen auf den ersten Blick in Ordnung aus"; herausgemessen hat es das neue Gate
`tests/acceptance/magnetic-rigs-shot.mjs` — die Messwert-Beschriftung des Sondenpunkts **liegt auf dem Ring ihres eigenen
Messwerts** (die Beschriftung ist 37 px breit, die Lücke zwischen den Ringen 40 px, egal wo sie liegt, sie streift). Der Fix ist kein kleines Verschieben, sondern
eine geometrische Rechnung: Die Beschriftung kommt auf den Mittelpunkt des Streifens „zwischen diesem Ring und dem nächsten" und bleibt auf ihrem eigenen Strahl. Dasselbe Gate
misst außerdem, ob „die beiden Sondenpunkte wirklich auf den Ringen ihrer jeweiligen Messwerte liegen" (Mittelpunktabstand = Radius) und ob „der Messwert auf den Windungen liegt".

**Nebenbei ein echter Defekt behoben**: In `numeric-audit.client.spec.ts` war eine Scheduling-Kopie von
`buildWorkspaceRuntime` handschriftlich abgeschrieben; sobald in einer Domäne ein zweiter Prüfstand auftauchte, verrottete sie (der neue Prüfstand landete
bei der benachbarten Runtime und wurde als `failed` verurteilt). Jetzt wird direkt jene Fassung von LabWorkspace aufgerufen; die Kopie kann nicht mehr verrotten.

**Charge ②b (2026-09-22): Elektromagnet** — er **teilt dieselbe Spule** mit dem Solenoid, der Unterschied ist nur der eingeführte Eisenkern,
deshalb ist es kein neuer Prüfstand, sondern das dritte Modell desselben Prüfstands (`electromagnet`): dieselbe Spule mit 200 Windungen / 20 cm /
1 A hat mit Luftkern nur 1,257 mT, und mit einem Kern μ_r = 200 wird daraus 0,2513 T.

Wirklich gelehrt werden soll das **Quadrat**: Der Kern multipliziert das Feld mit μ_r, und die Anziehungskraft F = B²A/(2μ₀) ist proportional zum Quadrat von B, also
wächst sie mit μ_r² — eine Polfläche von 4 cm² steigt von 0,25 mN auf 10,05 N, **vierzigtausendfach**, genug, um etwa 1 kg Eisen zu heben;
mit einem Kern μ_r = 800 steigt sie um weitere 16-mal auf 160,8 N. Die drei Validierungen sichern je ein Quadrat: B_Kern/B_Luft = μ_r,
doppelter Strom vervierfacht die Kraft, der Kernwechsel ändert sich mit μ_r². In der Tabelle stehen **drei Zeilen: Luftkern / Hauptkern / Vergleichskern** —
gerade die Luftkern-Zeile ist die Antwort auf „wozu ist ein Eisenkern gut".

**Die Lehre dieser Charge**: μ_r wurde zunächst auf den Eisenkernstab geschrieben („das Material auf das Material schreiben"), das Gate maß sofort,
dass es **auf den Windungen liegt** — der Kupferdraht durchquert alle 9 px, jeder am Stab klebende Text wird durchschnitten. Der Messwert darf nur neben
der Apparatur stehen. Dasselbe Gate ergänzte zusätzlich eine Prüfung auf **sich gegenseitig überdeckende Beschriftungen**: Text kann innerhalb des Canvas und nicht auf der Apparatur liegen und trotzdem von
einer anderen Beschriftung verdeckt werden — eine Fehlerart, die die vorigen Prüfungsarten nicht sehen konnten.

**Charge ②b-2 (2026-09-22): Elektromotor** — das letzte Stück der Gruppe „aus Strom wird Magnetismus" und der Prüfstand, der gegenüber den beiden vorigen
**die entgegengesetzte Richtung** hat: Die vorigen fragten „welches Magnetfeld erzeugt ein Strom", dieser fragt „wohin treibt das Magnetfeld den Strom".

B = 0,5 T, n = 100, I = 2 A, Spule 6 cm × 4 cm: Auf jede der beiden Seiten wirkt F = B·I·L = 0,06 N,
entgegengesetzt gerichtet und um eine Spulenbreite versetzt; das resultierende Drehmoment ist τ = n·B·I·A·cosθ = 0,24 N·m. Die drei Validierungen:
Die Überlagerung der Ampèreschen Kräfte stimmt mit den beiden Algorithmen nBIA überein, bei θ = 90° ist das Drehmoment genau null, und der **Kommutator** —
beim Überschreiten der Gleichgewichtslage kehrt sich das Drehmoment der blanken Spule um, und eine einmalige Stromumkehr bringt es in die Ausgangsrichtung zurück. Hier steht das Verhalten im
Gegensatz zum Elektromagneten: **Die Anziehungskraft wächst mit B², das Drehmoment ist proportional zu B**, dasselbe Feld, zwei Geräte, zwei Arten von „stärker".

Die Zeichnung folgt der Erfahrung, die ein Prüfstand nach dem anderen ergeben hat: Der Rotor wird **axial betrachtet**, die beiden Kraftseiten sind dann zwei Punkte, und B ist horizontal,
also ist die Kraft stets vertikal — der Winkel ändert den **Kraftarm**, nicht die Kraft. Bei 90° Drehung stehen die beiden Punkte übereinander und die beiden Kräfte
ziehen auf derselben Geraden; das ist die Gleichgewichtslage, und das Gezeichnete ist klarer als eine Erklärung.

**Die Lehre dieser Charge** (vom Gate selbst gefunden, dreimal nicht von mir „gesehen"):

1. **Das Vorzeichen darf nicht in den Betrag**: Schreibt man das Drehmoment als `n·B·|I|·A·cosθ`, ändert eine Stromumkehr das Drehmoment nicht — dann
   kann die Kommutator-Validierung niemals „eine Umkehr bringt es zurück" ergeben. Der Golden Test hat es direkt gezeigt:
   `afterCommutated` und `before` haben entgegengesetztes Vorzeichen.
2. **Ein homogenes Feld darf nicht zweigeteilt gezeichnet werden**: Die B-Pfeile zeigten anfangs links und rechts nach außen, das sind **zwei** Felder, nicht **eines**.
3. **Messwert-Beschriftungen dürfen weder am Eisenkern/Kupferdraht kleben noch unter dem Panel liegen**: μ_r, auf den Kernstab geschrieben, wurde von den Windungen durchtrennt;
   die Drehmoment-Beschriftung des Motors lag über dem Rotor und wurde von der **Unterlage des Lesepanels** verdeckt — die Prüfung auf sich überdeckende Beschriftungen sieht die
   Rückwand nicht, weil der Canvas-Text des Panels sie nicht überlappt. Schließlich wurde sie nach links vom Rotor in den leeren Streifen zwischen den beiden Feldlinien verschoben.

**Charge ③ (2026-09-22): Mechanische Energie, zwei Prüfstände** — die Engine ist neu (`engine-mechanics` hatte nur Dynamik,
kein Energiebuch), sie liegt in `packages/engine-mechanics/src/energy*.ts`:

- `mechanical-energy` die Umwandlung von kinetischer und potentieller Energie: Ein 2-kg-Wagen gleitet aus 90 cm Höhe eine reibungsfreie schiefe Ebene hinab,
  Ep = mgh = **17,64 J** wird vollständig zu kinetischer Energie, unten ist **v = √(2gh) = 4,2 m/s** — beide Zahlen
  liegen auf ganzen Werten (2gh = 17,64 ist genau ein vollkommenes Quadrat), und **die Geschwindigkeit ist unabhängig von der Masse**
- `ramp-friction` wohin der Verlust mechanischer Energie geht: derselbe Wagen und dieselbe Höhe, μ = 0,2, die kinetische Energie unten verringert sich um
  3,53 J, dieser Teil wird die durch Reibung erzeugte Wärme; macht man den Neigungswinkel flacher, **nimmt die Reibung sogar mehr weg**

Drei Validierungen: beide Seiten des Energiebuchs sind gleich (Ep = Ek + Q), die Geschwindigkeit stimmt mit √(2gh) überein, und die Reibungsarbeit stimmt in beiden Formeln überein.

**Die Lehre dieser Charge (der Test hat wieder einmal meine falsche Physik korrigiert)**: Ich behauptete zunächst „die Reibungsarbeit hängt nur von der Höhe ab,
W = μmg·cosθ·L vereinfacht sich zu μmg·h" — **falsch**. Setzt man L = h/sinθ ein, erhält man
**W = μmg·h·cotθ**: Je flacher die schiefe Ebene, desto länger wird der Weg nach cotθ, während die Normalkraft nur nach cosθ kleiner wird — **die Reibung nimmt
sogar mehr weg**; nur bei θ = 45° (cot = 1) ist sie numerisch gleich μmg·h, und mein Standard-Neigungswinkel war genau
45°, deshalb „sah" dieser Fehler in der Standardszene richtig aus. Der Golden Test hat ihn bei 22,5° gezeigt
(8,517 J ≠ 3,528 J). Engine, Befehlsdokumentation, Vorlagentext und didaktische Zusammenfassung wurden an allen vier Stellen mitgeändert.

Auf der Oberflächenseite wird das Energiebuch als **ein gestapelter Balken** gezeichnet: Die Breiten der beiden Segmente kinetische Energie und Wärme sind jeweils ihr Anteil an der Gesamtenergie beim Start,
und die Summe der beiden Segmente **muss den ganzen Balken genau ausfüllen** — ob Energie erhalten bleibt, zeigt sich im Bild am Balken, deshalb prüft das dauerhafte Gate
`tests/acceptance/energy-rigs-shot.mjs` diese Aussage direkt (zwei Viewports, je einmal pro Prüfstand).

**Charge ④ (2026-09-22): Geradlinige Lichtausbreitung** — die Engine ist neu (`engine-optics` machte nur Abbildungen,
kein Modell der geradlinigen Ausbreitung), sie liegt in `packages/engine-optics/src/light*.ts`:

- `pinhole` Lochkamera-Abbildung: Ein 6 cm langer Pfeil steht 30 cm vor dem Loch, der Schirm 15 cm hinter dem Loch → **ein 3 cm großes umgekehrtes Bild**,
  Vergrößerung **v/u = 1/2** (beide Zahlen sind ganzzahlig, denn die Hälfte von 6 ist 3)

**Die Umkehrung ist kein gespeichertes Flag**: `imagePointOf` lässt die Gerade „Objektpunkt → Loch → Schirm" den Bildpunkt selbst liefern
(die Spitze landet unterhalb der Achse, der Fuß auf der Achse), und die Engine kreuzt das mit `h′ = h·v/u` ab — die drei Validierungen sind
der Bildpunkt der Geraden, das Vorzeichen der Umkehrung sowie die jeweiligen Verhältnisse der beiden Abstände (je weiter der Schirm, desto größer das Bild; je weiter das Objekt, desto kleiner das Bild).

Im Bild werden Objekt und Bild **beide in wahrer Größe gezeichnet** (6 cm gegen 3 cm): Genau das Verhältnis dieser beiden Pfeile soll das Bild zeigen;
wird eines davon skaliert, wäre dieser Versuch die einzige Stelle, die lügt. Das Gate
`tests/acceptance/light-rigs-shot.mjs` misst daher direkt die Geometrie: **beide Lichtstrahlen laufen durch das Loch** (der mittlere Scheitelpunkt der beiden
Streckenzüge ist derselbe), **das Bild steht auf dem Schirm umgekehrt** (der Auftreffpunkt des oberen Strahls liegt unterhalb des Lochs, der des unteren darüber)
und Objekt und Bild liegen auf den beiden Seiten des Lochs.

**Charge ⑤-1 (2026-09-22): Totalreflexion** — die Engine wurde zu einer unterscheidenden Union
`ResolvedPinholeModel | ResolvedRefractionModel` erweitert, dem zweiten Modell derselben optischen Bank:

- `total-reflection` Totalreflexion: Glas (n₁ = 1,5) → Luft (n₂ = 1,0), kritischer Winkel
  θ_c = arcsin(n₂/n₁) = **41,81°**. Bei 45° Einfall **ist der kritische Winkel überschritten, der gebrochene Strahl existiert nicht mehr**;
  bei 30° erscheint der gebrochene Strahl sofort bei 48,59°

**Der wichtigste Satz dieser Gruppe zur Modellierung**: Die Totalreflexion ist das **Verschwinden des gebrochenen Zweigs**, nicht eine „starke Brechung mit einem Brechungswinkel nahe 90°".
Deshalb liefert `refractedAngleOf` beim Überschreiten des kritischen Winkels `undefined` (statt auf 90° zu klemmen),
und die drei Validierungen sind alle um dieses „Fehlen" herum geschrieben (je ein Punkt auf beiden Seiten des kritischen Winkels, um zu bestätigen, dass eine Seite eine Lösung hat und die andere keine); im Bild wird
jener streifende Strahl nicht gezeichnet — ihn zu zeichnen würde den benachbarten Messwerten widersprechen.

**Ein weiteres dispatch-Leck (vom Gate gefunden)**: `OpticsDomainRenderer` kennt nur `lightRig`, während die Brechungs-Arbeitsfläche
`lightRefraction` mitführt — dadurch landete die Totalreflexionsszene stillschweigend beim Abbildungs-Renderer: **das Messwert-Panel stimmt vollständig,
aber das Bild hat keine einzige Linie**. Diese Art Fehler „der Verteiler kennt nur einen von zwei Prüfständen" ist in dieser Sitzung schon dreimal aufgetreten (die
Scheduling-Kopie der numerischen Prüfung, die Render-Verteilung der Optik und ganz am Anfang die Fluide); jeder davon ließ sich nur durch **Ausmessen des Bildes im echten Browser** zeigen.

**Charge ⑤-7 (2026-09-22): Transformator** — eine eigenständige neue Engine `engine-transformer`
(bei induction ist `flux_change` die „gleichmäßige Änderung des magnetischen Flusses", beim Transformator „zwei Wicklungen teilen denselben Fluss" — zwei verschiedene Modelle):

- Szene `TransformerBench` (Primärspannung/-strom + zwei Windungszahlen); dΦ/dt wird **nicht gespeichert**, sondern über
  `U₁ = N₁·dΦ/dt` hergeleitet
- drei Validierungen: **beide Wicklungen teilen einen Fluss** (das jeweils über `U/N` zurückgerechnete dΦ/dt muss gleich sein),
  **Leistungserhaltung** `U₁I₁ = U₂I₂`, **das Windungsverhältnis ist genau diese Maschine** (doppelte Sekundärwindungszahl → doppelte Spannung, halber Strom,
  Leistung unverändert)
- Vorlage `transformer`: 1000 Windungen hinein, 200 Windungen heraus, 220 V / 0,1 A → **Ausgang 44 V / 0,5 A,
  Leistung weiterhin 22 W**
- vier Befehle (Spannung / Strom / zwei Windungszahlen); der Client ergänzte für die induction-Domäne ein zweites Rendering (zwei Wicklungen +
  Eisenkern + drei Messwertgruppen, **die Windungszahl wird nur als Anzahl von Kreisen in Tintenfarbe gezeichnet** — tausend Windungen lassen sich nicht als tausend Kreise zeichnen)

**Charge ⑤-6 (2026-09-22): Gravitation und Zentripetalkraft** — aus „einem isolierten Stück Physik" wurde eine lauffähige Kette
(Fabrik → Selektor → Resolver → Engine → Validierung):

- Szene: `MechanicsModelId` erhält `circular_orbit`; die Fabrik deklariert GM und r als **ein observable**
  (`kind: 'orbit'`) und setzt danach den Himmelskörper auf (r, 0) mit der Tangentialgeschwindigkeit √(GM/r) —
  **die Engine rechnet aus GM und r noch einmal nach**, die Szene ist also keine zweite Faktenquelle
- Selektor: `kind === 'orbit'` ist das Signal (in dieser Szene kann nichts anderes eine Kreisbahn darstellen)
- Zustand: Position auf dem Kreis, Geschwindigkeit tangential, Beschleunigung **stets zum Kreismittelpunkt weisend** (derselbe Vektor, einmal im Kreis herum)
- abgeleitete Größen: r / v = √(GM/r) / T = 2πr/v / a = v²/r / F = GMm/r²; **Lauflänge = eine Periode**
- Validierung: ① **die von der Gravitation gelieferte Beschleunigung = die von der Geschwindigkeit geforderte Beschleunigung** (v²/r gegen GM/r²) ② Keplers drittes Gesetz als
  **Verhältnis** (r ×4 → T ×8, auf dem zweiten Radius eigens berechnet)
- Vorlage `circular-orbit`: Erde GM = 3,986×10¹⁴, r = 6,8×10⁶ m (etwa 420 km Höhe) →
  **v = 7,656 km/s, T = 93,0 min** — genau die Umlaufbahn der Internationalen Raumstation

Die wichtigste Aussage im Test ist die **geometrische Selbstkonsistenz**: An jedem Abtastpunkt ist der Betrag der Geschwindigkeit konstant, `a·v = 0`, `a·r < 0` —
erst wenn alle drei gleichzeitig gelten, liegt eine Kreisbewegung vor; stimmt nur eine, zählt es nicht.

**Charge ⑤-5 (2026-09-22): Das Sieden von Wasser** — die Wärmelehre-Engine erhielt eine **zweite Plateauphase**; eine additive Änderung,
bei der sich am Verhalten der Zweiphasen-Arbeitsfläche nichts geändert hat:

- Szene `ThermalSample` mit zwei **optionalen** Feldern: `boilingPoint` + `vaporizationHeat` (fehlen sie, bleibt
  es beim ursprünglichen Schmelzfall)
- Die Kurve erhält eine Phase `'boiling'`: **Der Heizer liefert weiterhin P, die Wärme geht vollständig in den Phasenübergang, das Thermometer bewegt sich nicht** —
  genau der Abschnitt, den „die Besonderheit der Temperaturänderung beim Sieden von Wasser untersuchen" lesen soll
- Vorlage `boiling-water`: 500 g Wasser ab 20 °C, 500 W Heizleistung, **336 s bis 100 °C, danach 2260 s
  ohne jede Temperaturänderung** (Q = mL_v = 0,5 × 2,26×10⁶ = 1,13 MJ)

**Drei echte Probleme, die von den Validierungen der Engine selbst erzwungen wurden** (keines davon war zu „sehen"):

1. **Ab wann erwärmt sich die Flüssigphase**: Die Siedezeit wurde ursprünglich ab dem **Schmelzpunkt** gerechnet, dadurch wurde 20 °C warmes Wasser so behandelt, als erwärme es sich von 0 °C
   (420 s statt 336 s) — der Test hat es bei 336 gezeigt
2. **Wo die Ausführung enden muss**: `runDuration` war auf 3600 s gesetzt, aber das Wasser war bei 2596 s bereits verdampft; das Energiebuch verglich `P·3600`
   mit einer Probe, die längst keine Wärme mehr aufnahm, und das Residuum war genau 502 kJ. Geändert zu: **die Ausführung endet, wenn die Physik endet**
3. **Die Vorbedingung „eine bereits geschmolzene Probe muss eine Dauer angeben"**: Ihr Grund war „es gibt keine Plateauphase zum Anhalten", doch das Sieden **gibt** eine
   zweite Plateauphase (das Wasser verdampft), deshalb gilt diese Einschränkung jetzt nur noch für **niemals siedende** Flüssigkeiten

Der Client ergänzte ebenfalls die Phase `'boiling'` (die Phasen-Union des visuellen Modells + beide Plateauphasen teilen dieselbe „Phasenübergang läuft"-Tintenfarbe) —
**das Typsystem hat an 4 Stellen auf die fehlenden Zweige gezeigt**.

**Charge ⑤-4 (2026-09-22): Kurzschluss** — **keine neue Engine**: Ein Kurzschluss ist ohnehin ein Kreis mit
`R = 0` in einem reinen Widerstandsnetz, und die circuit-Engine löst längst Netlists. Diese Gruppe ist also **eine neue Szenenvorlage**:
Spannungsquelle (mit Innenwiderstand) → Schalter → Amperemeter → zurück zur Quelle, **kein einziger Verbraucher** im Kreis.

E = 6 V, Innenwiderstand r = 0,5 Ω → **I = E/r = 12 A**, die Klemmenspannung fällt auf **0 V** (die gesamte EMK fällt am
Innenwiderstand ab, der Außenkreis erhält null). Die numerische Prüfung lässt es automatisch durch die echte Scheduling-Kette laufen und bestätigt, dass die Engine diesen Kreis erkennt und eine
gültige Validierung liefert — der Satz „was bleibt übrig, wenn man den Verbraucher entfernt" ist damit verifizierbar, nicht nur erklärender Text.

**Charge ⑤-3 (2026-09-22): Tonhöhe und Lautstärke (Alias, kein neuer Prüfstand)** — diese beiden Wörter gehören zur am Anfang dieses Dokuments
genannten **Lückenklasse A**: Der Versuch deckt das Konzept tatsächlich ab, nur gelangte diese Formulierung nicht in den Index. Das Kriterium ist in den Code geschrieben —
**die Tonhöhe eines Klangs wird von der Frequenz bestimmt, die Lautstärke von der Amplitude**, und die Transversalwellen-Arbeitsfläche macht `Amplitude A` und `Frequenz f` zu
lesbaren und verstellbaren Reglern (`v = λf` hängt an der Wellenlänge); geändert wird nur das Medium (ein Seil statt Luft), nicht jene Gesetzmäßigkeit.
Deshalb sind sie **belegte Aliase** auf `wave-travelling` und kein erzwungener Verweis; in der Zusammenfassung wurden außerdem zwei Lenkungsschritte ergänzt
(„Erhöhe die Frequenz: Wie würde sich bei einer klingenden Saite die Tonhöhe verhalten" und „Vergrößere die Amplitude: Der Wellenberg wird höher, die Wellenlänge bleibt gleich").
`Lärm` bleibt in der Lücke — „Lärmkontrolle" ist ein Ingenieursproblem, es gibt keine ehrliche Arbeitsfläche, auf die man zeigen könnte.

**Charge ⑤-2 (2026-09-22): Gravitation und Zentripetalkraft (Physikschicht)** — hier ging es um den Schritt **in sich geschlossene Physik + Goldene
Tests**, Szene und Client wurden nicht berührt, deshalb blieb die Hauptkette vollständig grün:

`packages/engine-mechanics/src/orbit.ts`: `v = √(GM/r)`, `T = 2πr/v`, `a_benötigt = v²/r`,
`a_geliefert = GM/r²`, `F = GMm/r²`, `GM_Erde = 3.986004418e14`.

Die Golden Tests sperren mit einem **echten Ankerpunkt** die gesamte Zahlenreihe fest — die Internationale Raumstation (r = 6,8×10⁶ m): **v = 7656 m/s,
T = 93,0 min**, der 420 t schwere Stationskörper erfährt eine Gravitationskraft von **3,62 MN**. Drei weitere Beziehungen werden dabei gegengeprüft, statt die Formel abzuschreiben:
① Die Definition der Kreisbahn ist gerade, dass die beiden unabhängigen Algorithmen `v²/r` und `GM/r²` gleich sein müssen (die ausführbare
Version von „die Zentripetalkraft wird von der Gravitation geliefert") ② Keplers drittes Gesetz ist eine **Folgerung**: r ×4 → v ÷2, T ×8 ③ Die geostationäre Bahn 42 164 km /
23,93 h / 3075 m/s wird über die Rückrechnung `GM/r³ = (2π/T)²` verifiziert. **Die Masse kürzt sich aus der Bahn heraus** (ein schwerer Satellit erfährt eine ×10-Kraft,
Geschwindigkeit und Periode bleiben exakt gleich).

**Nächster Schritt**: sie als Modell `circular_orbit` anschließen (vier Stellen: types / resolvers / selector / engine
+ Szenen-Fabrik und Vorlage + Client) und dann die beiden Suchbegriffe `Gravitation`, `Zentripetalkraft` freigeben.

**Umfang**: Nimmt man die eigene Prüfpunkttabelle des Produkts (Prüfpunkte der Aufgabensammlung + verifizierte Markierungen, insgesamt 126 Prüfpunkte) und sucht im Versuchszentrum,
so sind **nur 31 auffindbar**; nach dem Ergänzen der Aliase steigt es auf **70**, der Rest sind die in diesem Dokument registrierten Vorlagen-Lücken.
(31/70 sind die Messzahlen aus der Erhebung vom 2026-09-21; nach ① ② ③ ④ wurde **diese Statistik nie erneut durchlaufen** —
maßgeblich für die heutige Abdeckung ist `lab-search-recall.mjs`, und das zählt Wörter, nicht Prüfpunkte.)

**Sie wurde in ein dauerhaftes Gate verwandelt**: `tests/acceptance/lab-search-recall.mjs` (132 Wörter, die auffindbar sein müssen
+ **0 bekannte Lücken**). Es ist eine **beidseitige Sperrklinke** — die bekannten Lücken müssen weiterhin unauffindbar sein, und ergänzt jemand den
Versuch, schlägt der Test fehl und weist darauf hin, das Wort nach `FINDABLE` zu verschieben; so verrottet diese Liste nicht.
Jede Charge wurde von ihr erzwungen: Nach ① schlugen `Druck`, `Atmosphärendruck` von der Lückenseite her fehl, nach ②a ebenso
`stromdurchflossene Spule`, `Ampèresche Regel`, nach ②b waren dann `Elektromagnet`, `Eisenkern`, `Elektromotor`,
`Kommutator` dran — den Hinweisen folgend verschoben und neue Wörter wie `Flüssigkeitsdruck`, `Torricelli`, `Magdeburger Halbkugeln`, `Kraftfläche`,
`Wirkung der Druckkraft`, `Magnetfeld`, `Rechte-Hand-Regel` ergänzt.

```
node tests/acceptance/lab-search-recall.mjs
→ auffindbar 132/132 | bekannte Lücken 0/0 | ALL CHECKS PASSED
```

**Startbedingung**: Vorlagen nach der Priorität des Lehrplans ergänzen, **und am Ende jeder Charge `pnpm typecheck` / `lint` / `test`
grün halten**. **Aktueller Fortschritt (Stand bei Feierabend am 2026-09-22)**: ① Fluiddruck drei Prüfstände, ② Elektromagnetismus vier Prüfstände,
③ Mechanische Energie zwei Prüfstände, ④ Lochkamera-Abbildung ein Prüfstand, ⑤ Totalreflexion / Kurzschluss / Tonhöhe / Lautstärke — insgesamt **66 Vorlagen**,
Recall **132/132 Wörter | bekannte Lücken 0/0**, vier Screenshot-Gates + `typecheck` / `lint` / `test`
(web 762 + agent 95) grün.

**Charge ⑤-8 / ⑤-9 (2026-09-22): Thermometer und Lärm, sowie zwei Urteils-Kehren** — bei beiden hatte ich zunächst
„nicht zu ergänzen" geurteilt und später **mich selbst widerlegt**, weil bei einer Prüfung nach demselben Maßstab beide eine ehrliche Physik dahinter haben:

- **Thermometer** — Das Flüssigkeitsthermometer ist genau eine Beziehung: `ΔV = V₀βΔT` und `Δh = ΔV/A` zusammen ergeben
  `h = h₀ + k·t` mit der Empfindlichkeit `k = V₀β/A`. 0,1 cm³ Kugel + 0,16 mm Kapillare + β = 2×10⁻⁴ ergeben
  **k = 0,9947 mm/°C**. **Die Skala lässt sich gerade deshalb gleichmäßig zeichnen, weil die Ausdehnung linear ist**; und Eiswasser 0 °C sowie
  siedendes Wasser 100 °C sind **Fixpunkte** und nicht zwei weitere Messwerte — erst wenn ihr Abstand in 100 gleiche Teile geteilt wird, gibt es „Grad".
  Drei Validierungen: Der Anstieg der Flüssigkeitssäule stimmt mit den beiden Algorithmen zu ΔV/A überein, mehrere Anstiege in 10-°C-Abständen sind gleich lang, und die Fixpunkte legen den Messbereich fest.
- **Lärm** — `L = 10·lg(I/I₀)` und `I = P/(4πr²)` zusammen ergeben
  `L = Lw − 20·lg r − 10·lg(4π) − A`, daher **sind es bei doppeltem Abstand 6 dB weniger**, bei 10-fachem 20 dB weniger;
  und dB ist logarithmisch, 6 dB weniger bedeutet also, dass **die Schallintensität nur noch ein Viertel beträgt** — genau deshalb wirkt
  „Abschwächung während der Ausbreitung". Das Schalldämmmaß einer Barriere ist ein vom Abstand unabhängiger, eigenständiger Subtraktionsterm. Vier Validierungen: Lw und die Schallintensität stimmen in beiden Wegen überein,
  die 6-dB-Regel, die Unabhängigkeit der Barriere, und dass dB logarithmisch und keine Differenzzahl ist.

**Die Lehre aus den zwei Urteils-Kehren**: Der Satz „es gibt keine ehrliche Arbeitsfläche, auf die man zeigen könnte" lässt sich erst sagen, **nachdem man wirklich nach einem Modell gesucht hat**.
Beide Male fällte ich das Urteil aus dem Gefühl „das sieht nach einem Ingenieurs-/Anwendungsproblem aus", während beide tatsächlich je eine saubere Gesetzmäßigkeit haben.
(Dafür wurde der Einheitentabelle zusätzlich die Dimension `intensity` und `W/m^2` hinzugefügt — die Schallintensität ist die Größe, die diese Apparatur tatsächlich berechnet.)

**Zusätzliche Cover**: `total-reflection` / `short-circuit` / `boiling-water` / `circular-orbit` /
`transformer` / `thermometer` / `noise`, sieben Stück — der Bilddienst war an jenem Tag zeitweise vom lokalen Rechner aus per SSL nicht erreichbar,
danach erholte er sich, alle wurden erzeugt und veröffentlicht, und die ids wurden in `RASTER_ART` zurückgetragen.

**Endstand des Umfangs (Feierabend 2026-09-22)**: Versuchszentrum **70 anlegbare Vorlagen** (71 Regal-Karten,
`cyclotron` weiterhin mit „bald verfügbar"); Recall-Wörter **94 → 132**, **bekannte Lücken 20 → 0**.
`typecheck` / `lint` / `test` (web 767 + agent 95 + core) grün, vier Screenshot-Gates grün,
sieben zusätzliche Cover erzeugt und veröffentlicht. Dieser Abschnitt ist geschlossen.

---

## DSH_CREDENTIALS_SCHEMA_SKEW

**Status**: **Behoben (2026-09-25)** — liest beide Formate und schreibt im gelesenen Format zurück.

**Warum die ursprüngliche Einschätzung („Umgebungs-Governance statt Produktfähigkeit") falsch war**: Der Abschnitt „Starten" im README nannte
`pnpm dev` als **einzigen Einstieg**, doch auf jedem Rechner, auf dem Desktop die credentials berührt hat, **startet es zu 100 % nicht** (exit 1, Profil lädt nicht). Ein Defekt, der den dokumentierten Einstieg unstartbar macht,
ist release-blockierend. In dieser Runde wurde er zuerst reproduziert (`pnpm dev` → 3080 lauscht nicht, das Log meldet
`the value for "version" … must be a string`) und dann repariert.

**Die Reparatur** (`credentials-local/src/index.ts`, über overlay ausgeliefert):

- Beim Lesen wird zuerst die Form bestimmt: Trägt der Wurzelknoten ein **Mapping**-förmiges `refs`, liegt ein versioniertes Dokument vor (bei einem flachen Dokument sind alle Werte
  Strings, dieser Test kann also nicht zutreffen), und die Credentials kommen aus `refs`; andernfalls wird weiterhin das flache Mapping des Wurzelknotens gelesen.
- `version` / `records` werden **nicht mehr fälschlich als Credential-Referenz behandelt** — sonst entstünden zwei falsche Schlüssel.
- **Zurückschreiben in der gelesenen Form** (versionierte Dokumente werden in `refs` geschrieben): Ohne diesen Schritt würden die beiden Schreibenden bei jedem
  Start **wechselseitig das Format des jeweils anderen überschreiben**.
- Nicht-String-Werte und kaputte `refs` werfen weiterhin einen Fehler — gelockert wurde nur „auf welcher Ebene die Credentials gesucht werden", nicht „welche Werte akzeptiert werden".

**Verifikation**: `desktop-format.spec.ts` **4 Tests** (flach lesbar / versioniert lesbar, ohne
`version` und `records` zu unterschlagen / Nicht-Strings im versionierten Dokument weiterhin abgelehnt / nicht gemappte `refs` weiterhin abgelehnt);
`credentials-local` als ganzes Paket **58/58**. **Echter Startnachweis**: Nach der Reparatur startet `pnpm dev` →
Port 3080 LISTEN, `GET /` → **200** (12.416 Bytes, Titel `DeepSeek Harness`,
Seite enthält `physicsos`). Gegenprobe: Stellt man das Lesen auf „nur flach" zurück, **schlägt der Test tatsächlich fehl**
(exit 1).

**Nebenbei behobener Mechanik-Defekt**: `harness-overlay.mjs capture` verwendet `git diff`,
**sieht untracked Dateien nicht** — neue specs / Module kämen nicht in den Patch und verschwänden in einem sauberen Klon
lautlos (in diesem Fall `desktop-format.spec.ts`). Jetzt wird zuerst per
`add --intent-to-add` in den diff aufgenommen, danach per `reset` der Index wiederhergestellt und das
`maxBuffer` von `spawnSync` auf 64 MiB erhöht (der Patch überschritt die Standard-1-MiB, sonst ENOBUFS).

### Ursprünglicher Eintrag (aufbewahrt als korrigierte Entscheidungsgrundlage)

- Das im Repository gepinnte `credentials-local` behandelt den YAML-Wurzelknoten als flaches Mapping (Schlüssel → String)
  und prüft jeden Schlüsselnamen als POSIX-Identifier
- DSH Desktop 2.0.13 schreibt es in ein verschachteltes Dokument um
  `{version: 1, records: {client-connection/browser-session: …}, refs: {…}}`

Daraufhin liest der Parser `version: 1` (eine Zahl, kein String) und wirft
`the value for "version" … must be a string`, der Plugin-Baum schlägt beim Laden fehl.

**Warum jetzt nicht**: Eine Behebung verlangt entweder ein Upgrade des gepinnten harness oder eine gemeinsame Implementierung von Host und Repository;
beides erfordert einen Eingriff in den submodule-Pin bzw. den Host und ist Umgebungs-Governance statt Produktfähigkeit; außerdem **kann eine Änderung in die falsche Richtung
DSH Desktop selbst beschädigen** (es könnte auf dem neuen Format beruhen).

**Bereitgestellter Umweg**: `DSH_HOME` auf ein Spiegelverzeichnis zeigen lassen (Symlink `profiles/` +
`settings.yaml`, leeres `storages/`, nur flaches `refs` neu aufgebaut),
siehe `docs/HANDOVER.md` §2.5 und `startIsolatedServer()` in `tests/acceptance/support.mjs`.

**Startbedingung**: Klären, welche Seite für den credentials-Vertrag zwischen Host-Version und harness maßgeblich sein soll
(empfohlen: die neuere, weil sie bereits auf Platte geschrieben wurde), und dann vereinheitlichen.

---

## PAPER_STUDIO_DATA_STATE

**Status**: Die Aufgabensammlung wurde mit echten öffentlichen Daten befüllt (2026-09-21); **der Prüfungsbogen-Bestand umfasst weiterhin nur 4 Bögen**.
**Die Engine-Vorprüfung ist online (2026-09-25)**: `POST /physicsos/paper/bank/items/triage`
löst pending-Einträge einzeln blind (wiederverwendet die eigenständige Lösungskette `independentSolve`) und schreibt
`engine-check:agreed|mismatch(<Engine-Antwort>)|unresolved` in `anomalies`,
während **status unangetastet bleibt** — die Prüfung bleibt ein menschliches Urteil. Auf der Lehrerseite gibt es die Schaltfläche „Engine-Vorprüfung" +
„nur engine-einheitliche auswählen", die mit einem Klick die blind übereinstimmenden Einträge anhakt; zusammen mit der bestehenden Stapelprüfung wird die manuelle Durchsicht der 388 Einträge
zu einer einzigen Bestätigung zusammengestaucht. Die einzeleintragsweise Audit-Semantik von `review-batch` bleibt unverändert.

`scripts/ingest-ceval-physics.mjs` bildet alle 401 Einfachauswahlaufgaben der beiden Fächer `middle_school_physics` und
`high_school_physics` von C-Eval in die Aufgabensammlung ab:

```
Aufgabensammlung   4 → 392 Einträge   (195 Mittelstufen-Abschlussprüfung / 197 Hochschulaufnahmeprüfung; 388 ungeprüft + 4 vorhandene geprüfte)
Bogenbestand       4 Bögen            (unverändert)
```

**Die Natur dieser Daten muss klar ausgesprochen werden** (sowohl im NOTICE als auch in jedem `anomalies` vermerkt):

- **Keine echten Guizhou-Prüfungsaufgaben**, und mit keinem Prüfungsbogen abgeglichen. C-Eval ist ein öffentliches Evaluationsset, keine Bogenquelle.
- Alle `status: pending` → sie nehmen erst nach Einzelprüfung durch einen Lehrer im Prüfungsstudio an der Bogenerstellung teil
- `reuseModes: ['adapt']`, **ohne `verbatim`** → der Bogenerstellungsalgorithmus kann sie nur als Umschreibgerüst verwenden,
  sie werden nicht im Original als Prüfungsbogen gedruckt
- `answerTier: web-public` (die schwächste, aber noch benannte Stufe)
- Die Prüfpunkt-Labels sind **maschinell aus Aufgabentext + Optionen abgeleitet** und mit `knowledge-derived-from-stem` markiert;
  Schwierigkeit/Fähigkeit/Punktwert hat diese Datenquelle nicht; es wurden benannte Standardwerte verwendet und wahrheitsgemäß in `anomalies` erfasst
- Lizenz: CC BY-NC-SA 4.0, kompatibel mit der PolyForm Noncommercial dieses Repositories, Namensnennung siehe
  `NOTICE.md`

**Nur 2 % enthalten eine Lösungserklärung (9/388) — das blockiert die Erstellung erklärter Bögen aber nicht**. Die Kette wurde geprüft:
`questionFromBankItem` (`verbatim`) kopiert die `answer.steps` des Sammlungseintrags direkt,
während `adaptBankItem` **das Modell die Aufgabe neu lösen lässt** und neue Antworten und Schritte erzeugt. Für diesen Datenbestand wurde nur
`reuseModes: ['adapt']` aktiviert, die Bogenerstellung nimmt also ausschließlich den Adaptionspfad, und die Lösungserklärung entsteht aus Modell + eigenständigem Lösungslauf;
eine fehlende Erklärung in der Sammlung **pflanzt sich nicht** als leere Erklärung fort. Fehlende Erklärungen werden weiterhin einzeln in `anomalies` vermerkt, damit der Lehrer bei der Prüfung
darauf zurückgreifen kann (sollten für diesen Aufgabenbestand später `verbatim` aktiviert werden, müssten zuerst die Erklärungen ergänzt werden).

**Warum der Bogenbestand unangetastet blieb**: C-Eval liefert eine Aufgabensammlung, **ohne Metadaten auf Bogenebene** (welches Jahr, welche
Region, welche Schule); Bognamen aus dem Nichts zu ergänzen wäre Erfindung. Zum Erweitern des Bogenbestands braucht es weiterhin echte Bogenquellen — in dieser Runde wurde bestätigt, dass dieser Weg
in der aktuellen Umgebung nicht gangbar ist:

- Das Werkzeug `web_search` ist nicht konfiguriert (HTTP 401)
- Sogou / 360-Suche **funktionieren** (in dieser Runde wurden darüber C-Eval gefunden), aber die Suche nach „Guizhou Physik-Originalaufgaben der
  Mittelstufen-Abschlussprüfung" liefert nur kommerzielle Aggregatoren (xueke.net / Baidu Wenku / Doc88 / 51test / Toutiao /
  WeChat-Public-Account), alle kostenpflichtig oder anmeldepflichtig und urheberrechtlich geschützt
- Das **Amt für Zulassungsprüfungen der Provinz Guizhou** (`zsksy.guizhou.gov.cn`) ist **erreichbar**, veröffentlicht aber nur Politik-, Zulassungs- und
  Bekanntmachungsinformationen — ein Provinzprüfungsamt veröffentlicht keine ganzen Bögen, das ist eine institutionelle und keine technische Frage
- Offene Datensätze (C-Eval u. a.) enthalten Aufgaben, aber keine Herkunft auf Bogenebene

**Startbedingung** (zum Erweitern des Bogenbestands): eine verifizierbare Bogenquelle beschaffen (vom Prüfungsamt veröffentlicht, von einer Schule autorisiert oder vom Nutzer bereitgestellte
Scans/Transkripte). Dann über dasselbe `POST /physicsos/paper/sources` +
`.../annotations` eingeben und `evidenceTier` je nach tatsächlicher Quelle als `original-scan` /
`manual-transcript` wählen, nicht pauschal `web-public` eintragen.

---

## PNPM_FORMAT_IS_RED

**Status**: **Geschlossen** (2026-09-25). `prettier --write` wurde im gesamten Repository abgeschlossen;
`.prettierignore` erhielt `overlays` — overlay-Dateien müssen byteweise mit dem in vendor übernommenen
Stand übereinstimmen und dürfen von prettier nicht umgeschrieben werden (in dieser Runde hatte es `pdf.worker.min.js` und andere vendored
Assets umgeordnet, sie wurden aus vendor wortgleich zurückkopiert und wiederhergestellt). `pnpm format` ist jetzt grün.

---

## PHYSICSOS_CONSOLE_AND_DESKTOP_PLAN

**Status**: Phase 1 ist **abgeschlossen**; Phase 2 ist mit **vier Punkten fertig** (der aggregierte Meldekanal aus 2.2 ist online,
die erfassten Felder wurden auf „Schule / Datum / Wissenspunkt / richtig oder falsch, ohne Konto und ohne Antworttext" festgelegt; der
**Offline-Ankündigungs-Cache** aus 2.3 ist ebenfalls ergänzt — siehe unten „Der Offline-Ankündigungs-Cache aus 2.3");
in Phase 3 sind die **drei seam-Verträge umgesetzt** (reine Typen, ohne Abhängigkeit vom Tauri-Paket), die signierbare Hülle selbst ist
jedoch noch **nicht begonnen**; in Phase 4 ist die **Serverhälfte fertig** (Geräteregister / Fernwiderruf / Sitzungsinvalidierung /
Risikosignale — siehe unten „Die Serverhälfte von Phase 4"), übrig bleibt die **Client-Hälfte**, die auf die `DeviceBridge`-Implementierung aus Phase 3
wartet; in Phase 5 wurde **nur der Versionsstempel erledigt** (der Plan selbst vermerkt „auch für reines Web nötig", deshalb ist er nicht durch Zertifikate blockiert). Phase-3-Hülle und Phase-4-Client-Hälfte hängen gemeinsam an nicht-codebezogenen Vorbedingungen
— **man darf die bereits umgesetzten Verträge, den Versionsstempel und die Serverhälfte nicht so lesen, als wäre mit diesen drei Phasen insgesamt begonnen worden**. Der Plan im Original liegt in
`~/.claude/plans/merry-crafting-alpaca.md`.

**Warum dieser Abschnitt existiert**: Der Plan selbst liegt nicht im Repository, und wenn die darin festgeschriebenen Entscheidungsgrundlagen (welcher host
keinerlei Authentifizierung hat, dass der Lernverlauf nur in localStorage liegt, dass das Signaturzertifikat eine harte Vorbedingung ist) nicht ins Repository gelangen, muss die nächste
übernehmende Person alles erneut nachschlagen, oder schlimmer — sie hält die leeren Zahlen auf der Oberfläche für fertige Funktionen.

> Auch nach dem Start der zweiten Ebene **gilt** der Satz „der Lernverlauf liegt nur in localStorage" **weiterhin** (die Serverseite kann
> ihn nach wie vor nicht lesen). Geändert hat sich, dass wir zusätzlich einen aggregierten Kanal eröffnet haben, der nur vier Felder erfasst — man darf diese beiden Dinge
> nicht vermengen und nicht annehmen, jener Kanal könne Einzelpersonen zurückverfolgen.

### Die Serverhälfte von Phase 4 (abgeschlossen, 2026-09-25)

Der Plan listete Phase 4 vollständig unter „durch Zertifikate blockiert", doch **die signierbare Hülle** ist das Hindernis; Geräte-
registrierung und -widerruf auf der Serverseite brauchen überhaupt kein Zertifikat. Diese Hälfte wurde in dieser Runde fertig, und sie ist für sich genommen bereits lohnend: Der Fernwiderruf ist eine **Berechtigungs**funktion,
keine Packaging-Funktion.

- **Geräteregistrierung** `POST /physicsos/auth/devices` (bei Anmeldung / Registrierung mit `deviceId` erfolgt sie
  automatisch): Schlüssel `userKey|deviceId`, idempotent, nur `seenCount` / `lastSeenAt` werden aufaddiert.
- **Nur der Hash wird erfasst**: `deviceId` muss auf `^[a-f0-9]{16,128}$` passen. Rohe
  `IOPlatformUUID` / `MachineGuid` (mit Bindestrichen, mit Großbuchstaben) werden bereits in der Parsing-Phase abgelehnt —
  „nur der Hash wird hochgeladen" ist kein Kommentar, sondern ein Regex. Eine Anmeldung ohne `deviceId` läuft normal; die Registrierung ist ein **Zusatz und keine
  Eintrittsschwelle** (der Nutzer hat bestätigt, dass keine Sperre nach dem Muster „ein Gerät, ein Code" erfolgt).
- **Fernwiderruf** `POST /physicsos/admin/devices/:deviceId/revoked`, verbucht nach **physischer Maschine**
  (`device_revocations`, Schlüssel `scope|deviceId`), nicht nach einer Zeile. Dieser Punkt wurde umgestellt: Die erste Version verbuchte den Widerruf auf der Zeile `(Konto, Gerät)`, und dieselbe Maschine mit einem anderen Konto ergab eine saubere
  Zeile — **der Widerruf wurde umgangen**; der Testfall „ein anderes Konto ändert nichts" in `devices.spec.ts` nagelt das jetzt fest.
- **Der Widerruf wirkt sofort**: Eine neue Anmeldung erhält 403 `DEVICE_REVOKED`, und eine **bereits online befindliche Sitzung erhält bei der nächsten Auflösung
  401** — man muss nicht auf das Ablaufen des Cookies warten. Beide Mechanismen sind unabhängig (beim Widerruf die Sitzung hinauswerfen + bei der Auflösung entscheiden),
  gegenprobe durchgeführt: Nimmt man beide heraus, wird die betreffende Assertion in der Abnahme tatsächlich rot.
- **Ehrliche Zuordnung**: Der Widerruf trennt nur Sitzungen, die **dieses Gerät angegeben haben**. Eine Sitzung ohne `deviceId` wird nicht
  mitbestraft — sie könnte auf irgendeiner Maschine laufen, und die übrigen Anmeldungen des Kontos mit hinauszuwerfen wäre nicht die Bedeutung von „dieses Gerät widerrufen".
  In der Abnahme hält eine Kontrollgruppe diesen Punkt fest.
- **Mandantengrenze**: Der Widerruf durch den Plattform-Administrator ist plattformweit (`scope='*'`, wirkt für alle Schulen), ein Schulverwalter kann nur
  Geräte der eigenen Schule widerrufen; die Wiederherstellung löscht nur das eigene Schloss — **ein Schulverwalter kann einen plattformweiten Widerruf nicht aufheben**. Das Audit wird
  **pro betroffenem Mandanten in einer Zeile** geschrieben (GZU darf im eigenen Audit sehen, dass „an unserer Schule ein Gerät von der Plattform widerrufen
  wurde"), statt nur unter der Schule des Plattform-Administrators verbucht zu werden.
- **Risikosignale** (nur Aufzeichnung und Anzeige, **keine automatische Sperre**): ≥3 Geräte für dasselbe Konto innerhalb von 24 h
  (`account-multi-device`), ≥3 IPs für dasselbe Gerät innerhalb von 24 h (`device-multi-ip`). Beide werden aus **bestehenden Zeilen** abgeleitet, es wird nichts zusätzlich erfasst; in der Rückgabestruktur gibt es **keine IP**, die Adresse wurde nur beim Zählen verwendet.
- **Oberfläche**: In der Admin-Konsole gibt es einen neuen Tab „Geräte" (`AdminDeviceTab.tsx`), Liste / Widerruf / Wiederherstellung / Signale,
  plattformweite und schulbezogene Zustände getrennt dargestellt.

**Verifikation**: `packages/physicsos` **102/102** (ursprünglich 83 + neue `devices.spec.ts` 19);
`ui-physicsos` **828/828** (821 + Geräte-Tab 7); das vollständige `typecheck` / `lint` /
`test` (core 1379 / agent 164 / web 828) grün; echte Dienste + echter Browser
`tests/acceptance/devices.mjs` **24 Punkte ALL CHECKS PASSED** (zweimal hintereinander stabil,
inklusive Gegenprobe). Regression: `notice-board` / `paper-access` / `lab-search-recall` grün.

**Die noch fehlende Hälfte** (wartet auf die `DeviceBridge`-Implementierung aus Phase 3 oder ein Zertifikat): dass der Client tatsächlich
den Hash berechnet, dass `TauriPlatformBridge` `device` implementiert, sowie die Gnadenfrist-Autorisierung (Signatur + Monotonie der Uhr
— der Plan schreibt fest, dass diese beiden Punkte nicht vorgeblich gelöst werden dürfen).

### Phase 1: Sicherheitsabschluss (abgeschlossen)

- Die Authentifizierung von `paper-host` wurde durchgängig angeschlossen: `auth-host` stellt die Sitzungsauflösung bereit, `paper-host`
  injiziert sie; GET verlangt eine Anmeldung, Schreib-Routen verlangen `TEACHER` und schränken den Mandanten über `schoolId` ein,
  und jeder Schreibvorgang wird auditiert.
- `PaperWorkspace` prüft die Rolle vor dem Betreten und zeigt bei fehlender Berechtigung eine Erklärung statt eines leeren Panels; die Seitenleisten-Einträge werden je nach Rolle
  ausgeblendet.
- **Die Nachweise werden hier nicht wiederholt**: siehe „Verifikation" am Ende dieses Abschnitts.

### Phase 2: Vier Punkte in der Admin-Konsole

| Punkt                         | Status                       | Ablage                                                                                                              |
| ----------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 2.1 Inhaltsverwaltung         | Abgeschlossen                | `AdminContentTab.tsx`; legt list/filter/Veröffentlichen und Zurückziehen/Bereinigung von Anomalien von paper-host offen |
| 2.2 Daten-Dashboard           | Abgeschlossen (zwei Ebenen)  | `AdminDashboardTab.tsx` + `dashboard(actor)` in `auth-host/src/service.ts`; die zweite Ebene stammt aus der anonymen Aggregation von `reportLearning()` |
| 2.3 Feedback und Ankündigungen | Abgeschlossen               | **neues Paket** `packages/physicsos/notice-host/`; `NoticeBoard.tsx` + `AdminNoticeTab.tsx`                        |
| 2.4 Stapelbetrieb             | Abgeschlossen                | `AdminOpsTab.tsx` (CSV-Kontoanlage / Massendeaktivierung / schreibgeschützte Ratenbegrenzung)                      |

#### Die beiden Ebenen von 2.2 und die Datenschutzvorgaben der zweiten Ebene (Implementierung ist Zusage)

**Erste Ebene (serverseitig eigene Zeilen)**: Anzahl Schulen, Anzahl Nutzer und Rollenverteilung, **Anzahl auflösbarer Sitzungen**
(nicht widerrufen + nicht abgelaufen + Konto weiterhin active), 14-Tage-Neuzugangstrend, Momentaufnahme der Ratenbegrenzungs-Buckets
(`AttemptLimiter.snapshot()`, gibt nur aggregierte Zahlen aus, weder IP noch Konto).

**Zweite Ebene (Wirksamkeit von Versuchen und Selbsttests)**: Der Lernverlauf wird **weiterhin nur im Browser-localStorage gespeichert**
(`learning-record-store.ts`), die Serverseite kann ihn nach wie vor nicht lesen — das hat sich nicht geändert und sollte es auch nicht.
Deshalb läuft die zweite Ebene über einen **eigenständigen, opt-in Meldekanal**:

- Der Client meldet pro Selbsttest und Wissenspunkt genau einmal richtig/falsch: `POST /physicsos/auth/usage/learning`,
  der Request-Body enthält **nur** `{ knowledgeId, correct }`.
- Der Server addiert das in ein Feld von `learning_counts`, der Schlüssel ist
  `schoolId|date|knowledgeId` (`learningKey` in `auth-host/src/domain.ts`).
- **Genau vier erfasste Felder**: Schule (**aus der Sitzung, nicht dem Request-Body vertrauen**), Datum (**aus der lokalen Uhr des
  Servers**, nicht UTC — sonst fiele ein Selbsttest am Abend auf den Vortag), Wissenspunkt-ID, richtig/falsch.
- **Was in einer Zeile fehlt** (das ist die ausführbare Form der Zusage, durch `learning-report.spec.ts`
  Punkt für Punkt festgenagelt): kein Konto / userId / username, kein Antworttext des Schülers, kein Aufgabentext, kein
  Freitext, keine IP. Zwei Schüler melden dasselbe Feld == ein Schüler meldet zweimal, Zeilenzahl und Inhalt vollkommen gleich.
- Die Wissenspunkt-ID durchläuft die Formschranke `/^[a-z0-9-]{2,40}$/`, der Client kann „was der Schüler geschrieben hat" nicht hineinschmuggeln.
- Die Meldung wird **nicht auditiert**: Audit bedeutet „wer hat was geändert", und dieser Kanal hat bewusst kein „wer".
- Der Preis wird klar benannt: **Er kann keine individuelle Lernsituation beantworten**. Dafür bräuchte es Konten, und Konten sind genau das, worauf bewusst verzichtet wird.

Das Dashboard zeigt ohne Meldungen einen Erklärungstext statt eines Balkens bei 0 %; `data-gap="learning-analytics"`
bleibt bestehen, nur der Text wurde von „diese Ebene lässt sich nicht umsetzen" zu „es sind noch keine Meldungen eingegangen" geändert.

#### Der Offline-Ankündigungs-Cache aus 2.3 (**der vom Plan geforderte Punkt, in dieser Runde ergänzt**)

Der Plan im Wortlaut: „Ankündigungen: im Backend verfasst → vom Frontend abgerufen und angezeigt; wenn der Desktop offline ist, wird **die vorige Ankündigung zwischengespeichert**,
nichts Leeres angezeigt." Dieser Punkt war lange nicht umgesetzt — bei der Ergänzung in dieser Runde stieß man zuerst auf einen **echten Defekt**:

Die beiden Panels von `NoticeBoard` teilten sich ursprünglich ein `Promise.all`, deshalb **riss ein Fehler der Ankündigungs-Schnittstelle das
Feedback-Formular mit** (`announcements` blieb bei `undefined`, auf der ganzen Oberfläche blieb nur ein Lade-Text). Der Schüler hatte eigentlich einen Bug zu melden,
sah aber das Formular nicht, weil die Ankündigungen nicht abrufbar waren.

- **Beide Panels werden getrennt abgerechnet**: Ein Fehler der Ankündigungen beeinflusst das Feedback-Formular nicht und umgekehrt.
- **Der Cache liegt im Konto-Namensraum** (`auth.userStorage`, nicht „diese Maschine"): Die Ankündigungen der eigenen Schule sollten nicht mit einem anderen Konto angemeldet
  auf dem nächsten Bildschirm erscheinen. Schlüssel `physicsos.notice-cache`, Obergrenze 20 Einträge.
- **Es werden nur tatsächlich vom Server ausgelieferte Zeilen zwischengespeichert**, und **beim Zeichnen wird „derzeit offline, dies ist die zuletzt empfangene
  Ankündigung" vermerkt** — der Plan will „die vorige", nicht eine alte Ankündigung als die neueste ausgeben.
- Kein Speicher / kaputtes JSON / falsche Form / volles Kontingent führen ausnahmslos zu **stillem Rückfall**; eine Versionsnummer sollte die Oberfläche nicht unstartbar machen, für den Cache gilt dasselbe (die 8 Testfälle von `notice-cache.client.spec.ts` nageln das Punkt für Punkt fest).

**Verifikation**: `ui-physicsos` **821/821** (808 + Cache 8 + Panel 5); echter Browser
`notice-board.mjs` **18 Punkte ALL CHECKS PASSED**; der neue Offline-Abschnitt **zwingt die Ankündigungs-Schnittstelle tatsächlich auf 503 und lädt dann neu** — er prüft, dass die zwischengespeicherte Ankündigung weiterhin gezeichnet, als offline markiert und das Absendeformular
noch vorhanden ist; der Screenshot `docs/reports/screenshots/notice-board-offline-cache-1600x900.png`
wurde mit bloßem Auge bestätigt. Regression: das gesamte `typecheck` / `lint` / `test` grün (web 821 / agent 145 /
core 1379).

> Einer der 5 Panel-Testfälle wurde **gegengeprüft**: Setzt man die alte Form mit dem einzelnen `Promise.all` zurück und lässt erneut laufen,
> **schlägt er tatsächlich fehl** (`keeps the feedback form when only the announcements fetch
fails`, exit 1) — kein Gummistempel, der nur mit dem Code grün wird.

#### Eine semantische Entscheidung in 2.3 (leicht als Lücke fehlzudeuten)

`/feedback` ist für **jedes angemeldete Konto** aufrufbar; kehrt der Schüler nach dem Absenden zurück, **sieht er nur seine eigenen Zeilen**.
Das ist eine **Zeilenfilterung, keine Torfilterung** — die Route selbst hält Schüler nicht auf, aufgehalten werden die sichtbaren Zeilen. Antworten erfordern
`TEACHER`, das Veröffentlichen von Ankündigungen `SCHOOL_ADMIN`. Beim Veröffentlichen einer Ankündigung wird die `schoolId`
des Schulverwalters **aus der Sitzung genommen**, dem Request-Body wird nicht vertraut.

### Harte Vorbedingungen der Phasen 3–5 (nicht-codebezogen)

- **macOS-Notarisierung erfordert ein Apple-Developer-Konto (99 $/Jahr)**; Windows erfordert ein Code-Signatur-
  zertifikat. Ohne diese sieht der Nutzer beim Herunterladen die Warnung „unbekannter Entwickler". **Vor Erhalt der Zertifikatsinformationen wird nicht begonnen.**

#### Der Punkt aus Phase 5, der **doch angegangen wurde**: der Versionsstempel (der Plan vermerkt selbst „auch für reines Web nötig")

Derselbe Planabschnitt schreibt: „Die Oberfläche zeigt Versionsnummer + Build-Zeit an — **das ist auch für reines Web nötig**", deshalb ist er
nicht durch Zertifikate blockiert und wurde in dieser Runde direkt umgesetzt:

- `tsdown.config.ts` ersetzt **zur Build-Zeit** `__PHYSICSOS_VERSION__` /
  `__PHYSICSOS_BUILT_AT__` durch Literale (die Version stammt aus dem `package.json` im Repository-Wurzelverzeichnis, der einzigen
  Wahrheitsquelle; der Zeitstempel ist der Moment dieses Builds). Im Build-Artefakt **bleiben keine Platzhalter übrig** — mit
  `grep` geprüft (0 Platzhalter, `"0.1.0"` wurde injiziert).
- `build-stamp.ts` liefert eine einzeilige Zeichenkette für Fehlerberichte (`0.1.0 · 2026-09-25`); **ist nichts injiziert, fällt sie auf `dev` / `nicht injiziert` zurück, ohne eine Ausnahme zu werfen** — eine Versionsnummer sollte die Oberfläche nicht unstartbar machen.
- **Das Build-Datum wird in der lokalen Zeit der Build-Maschine berechnet und dann injiziert**, nicht im Browser aus jenem Zeitpunkt formatiert: Das Build-Datum ist
  eine **Eigenschaft des Artefakts**, nicht des Lesers. Sonst würde derselbe Build in verschiedenen Zeitzonen als zwei verschiedene Datumswerte erscheinen;
  auch ein direktes `toISOString().slice(0,10)` geht nicht — das ist die UTC-Tagesgrenze, ein um die Mitternacht der Ost-Acht-Zeitzone gebautes Paket
  würde als „gestern" markiert. (Dieselbe Lehre wie bei 2.2, wo das Datum aus der lokalen Serverzeit genommen wird.)
  Diese beiden Punkte werden von drei Testfällen in `build-stamp.client.spec.ts` bewacht.
- Angezeigt an zwei Stellen, die bei Fehlerberichten wirklich gesehen werden: **im Fußbereich der Anmeldeseite** (auch nicht angemeldete Nutzer sehen sie)
  und **unten im Kontomenü** (bereits angemeldete Nutzer). Beide Stellen sind reiner Text und nicht anklickbar — es gibt keine Aktion zu tun.

**Verifikation**: `ui-physicsos` **808/808** (auf Basis von 805 +3 — die drei Testfälle nageln je eine der oben genannten
Entscheidungen fest); die Injektion ins Build-Artefakt wurde bestätigt (`0.1.0` / `2026-09-25`, 0 Platzhalter).

#### Der Teil von Phase 3, mit dem **bereits begonnen wurde**: die Verträge der drei seams

Was „auf das Zertifikat warten" blockiert, ist die **signierbare Hülle**, nicht das Design. Die vom Plan geforderte Reihenfolge war ohnehin „zuerst die Verträge festlegen,
dann `TauriPlatformBridge` implementieren", deshalb ist diese Vertragshälfte jetzt umgesetzt, und zwar ohne Abhängigkeit von einem Tauri-
Paket (reine Typen):

- `packages/platform-bridge/src/types.ts` erhält neu `DeviceBridge` / `UpdateBridge`
  / `StorageBridge` als **optionale** Felder von `PlatformBridge`.
- **Der Gerätefingerabdruck lädt nur den Hash hoch**: `DeviceIdentity` trägt gleichzeitig `raw` (Anzeige/Fehlersuche lokal) und
  `hashed` (Meldung), und im Vertrag steht, dass `raw` niemals als Meldefeld dient. Der Zweck bleibt der vom Nutzer festgelegte
  „Geräteregistrierung / Fernwiderruf / Risikokontrolle", **nicht** eine Sperre nach dem Muster „ein Gerät, ein Code".
- **`StorageBridge` ist die Voraussetzung für Offline-Fähigkeit**: Die Lizenz muss offline lesbar sein. Der Vertrag beantwortet nur
  „wohin", nicht „wie entschieden wird" — Signaturprüfung und Monotonie der Uhr gehören zu Phase 4, und diese beiden Punkte
  (eine Signatur verhindert kein Knacken, das Ändern der Systemzeit lässt sich umgehen) werden hier nicht vorgeblich gelöst.
- Die Browserseite implementiert `storage` (localStorage, für den Ankündigungs-Cache) und stellt `device` / `updates` **absichtlich nicht bereit**:
  `undefined` zwingt die Konsumenten, zur Kompilierzeit zwei getrennte Pfade zu schreiben, statt eine Scheinimplementierung zu erhalten, die erst zur Laufzeit
  explodiert. `dataDir()` wirft auf der Browserseite `UnimplementedError` und gibt kein `''` zurück, das als echter Pfad aufgefasst werden könnte.
- `createPlatformBridge('tauri')` **wirft weiterhin UnimplementedError** — die Verträge zu haben heißt nicht, dass die Hülle läuft; diese Assertion dient gerade der Vermeidung von Fehldeutungen.

**Verifikation**: `packages/platform-bridge` **6/6** (ursprünglich 2 + neu 4);
`tsc --noEmit` und `eslint` vollständig sauber.

- Bei der Gnadenfrist-Autorisierung in Phase 4 gibt es zwei Stellen, die **in der Implementierung ausdrücklich behandelt und nicht totgeschwiegen werden müssen**:
  1. Eine Signatur erhöht nur die Hürde, **verhindert das Knacken nicht**; 2. Die Gnadenfrist hängt von der Systemzeit ab und ist durch Umstellen der Uhr umgehbar;
  nötig sind eine monotone Uhr oder eine Serverzeit-Korrektur.

### Verifikation (2026-09-25, Live-Lauf · 2.2 zweite Ebene)

- `typecheck` web + agent vollständig grün; `lint` web + auth-host vollständig grün (oxlint ohne Ausgabe).
- `test`: `packages/physicsos` **145/145** (ursprünglich 133 + neu `learning-report.spec.ts`
  12); `ui-physicsos` **805/805** (ursprünglich 804 + Dashboard neu 1).
- Echter Dienst + echter Browser: `auth-acceptance.mjs` **ALL CHECKS PASSED**, neu **CASE J**
  Schüler meldet sich echt an → übermittelt 3 Selbsttests → Dashboard zweite Ebene liefert echte Aggregation (die mit den meisten Fehlern zuerst), und im gesamten
  `learning`-JSON ist das Schülerkonto nicht auffindbar. Screenshot
  `docs/reports/screenshots/auth-admin-dashboard-learning-1600x900.png` wurde mit bloßem Auge bestätigt.
- Regression: `notice-board.mjs` / `paper-access.mjs` /
  `lab-search-recall.mjs` (**132/132 | bekannte Lücken 0/0**) alle ALL CHECKS PASSED.

**Eine echte Stolperfalle bei der Umsetzung**: Der echte Dienst lädt das tsdown-Artefakt `lib/index.js`, nicht
`src/`. Nach einer Änderung an `overlays/harness/files/...` reicht es nicht, nur `apply` laufen zu lassen — auth-host und
ui-physicsos müssen jeweils erneut `tsc -b <pkg>/tsconfig.json && tsdown` ausführen, sonst prüft die Abnahme
gegen das alte Bundle (Symptom: neue Route 404, neue UI-Elemente werden nie gefunden).

### Verifikation (2026-09-24, Live-Lauf · vier Backend-Punkte)

- `typecheck` core + web + agent (inkl. notice-host) **vollständig grün**.
- `lint` core / web / agent **vollständig grün**.
- `test`: web **804**, agent **133**, core **1375** (summiert nach den vitest-Berichten der einzelnen Pakete).
- Echter Dienst + echter Browser: `paper-access.mjs` (3 Läufe hintereinander vollständig grün), `notice-board.mjs`
  (14 Punkte, inkl. "Schüler sehen nur ihr eigenes eingereichtes Feedback"), `auth-acceptance.mjs` (inkl. Inhaltsverwaltungs-Abschnitt
  und Dashboard/Betriebs-Abschnitt CASE H/I) **alle ALL CHECKS PASSED**; `lab-search-recall.mjs`
  **132/132 | bekannte Lücken 0/0**.

**Der behobene 4. echte Defekt (Race Condition auf der Abnahmeseite)**: `paper-access.mjs` war ursprünglich **nicht stabil grün**
— dasselbe Skript schlug bei zwei aufeinanderfolgenden Läufen an unterschiedlichen Sidebar-Assertions fehl (einmal "im Lehrer-Sidebar ist der Aufgabenerstellungsbereich
— 0 Einträge", einmal "Schüler haben noch das Physiklabor"). Die Ursache lag nicht im Produkt: `registerStudent` /
`loginUser` kehrten in dem Moment zurück, in dem der **Login-Gate detach** (also reload) erfolgte, während die Produktnavigationsleiste
**einen Takt später** erst montiert wurde; das unmittelbar folgende `.count()` las dadurch 0. Gegenbeweis ist, dass der auf den Fehlschlag folgende
`.click()` (Aufgabenerstellungsbereich) umgekehrt erfolgreich war — was zeigt, dass der Button tatsächlich vorhanden war. Die Lösung bestand darin, beiden Login-Helfern
`await waitForShell(page)` hinzuzufügen (wartet, bis `role=navigation[name=PhysicsOS]` sichtbar ist), sodass
"welche Einträge dieser Rolle gegeben wurden" eine bereits montierte Navigationsleiste abfragt. Nach der Korrektur 3 Läufe hintereinander vollständig grün.

- Screenshots mit bloßem Auge bestätigt: `docs/reports/screenshots/auth-admin-content-tab-1600x900.png`,
  `notice-board-student-1600x900.png`.

> Hinweis: `pnpm install` überschreibt die vom Patch abgedeckten Dateien, danach schlägt die
> "already applied"-Rückprüfung des Overlay-`apply` fehl — mit `capture` die
> `overlays/harness/upstream-changes.patch` neu erzeugen. Diese Falle wurde bereits einmal getreten.

---

## PAPER_HOST_COMPOSITION_TEST_GAP

**Status**:**Geschlossen** (2026-09-24). `paper-host/tests/composition.spec.ts` ist umgesetzt:
echte Loader-Kette (`webserver + storage + storage-json + storage-domain + llm +
paper-host + auth-host`), echter http-Dienst, echte Sitzungen (über echte Endpunkte ausgestellt, keine gefälschten Cookies).
Die Verdrahtungsreihenfolge **kopiert die werkseitige row-Reihenfolge** — paper-host ist vor auth-host deklariert,
übereinstimmend mit `cordis.patch.yml` — weil genau diese Reihenfolge die Schreibweise "Dienst zur Ladezeit abfragen" offenlegt.

Es hat sofort bei der Inbetriebnahme **drei echte Defekte** aufgedeckt, keiner davon war ein Fehler von mir beim Testschreiben:

1. **invariant-companion-Deadlock**. `paper-host/src/invariant.ts` injizierte ursprünglich
   `['invariants', 'storageDomain']`. Von 223 companions im gesamten Repository injizieren 221 nur
   `invariants` (die einzige andere Ausnahme ist `attachment-local`, das tatsächlich
   `attachments` benötigt). Ein companion wird **innerhalb** der invariant-Barriere montiert, also wartet ein companion, der auf einen
   vom Loader verwalteten Dienst wartet, auf eine Zeile, die von derselben Barriere blockiert wird → die gesamte Kette
   `settled without becoming active`. Wurde auf `['invariants']` geändert, die Domain wird im `check`
   lazy gelesen (gleiche Bauart wie `auth-host/src/invariant.ts`).
2. **`imageApi` wurde als Pflichtfeld deklariert**. Seine inneren Felder sind alle `.required()`, weshalb schemastery
   **das gesamte Objekt** ebenfalls als Pflichtfeld behandelt — im direkten Widerspruch zum eigenen Kommentar dieses Felds ("absent → Aufgabengrafik wird als Beschreibungsplatzhalter gedruckt") und zu `export.ts`s `if (api === undefined) return files`.
   Das heißt: **Deployments ohne konfigurierten Bilderzeugungs-Endpunkt starten überhaupt nicht**, nur zufällig hatte `cordis.patch.yml`
   zur Inbetriebnahme es ihm gegeben, deshalb blieb es lange unentdeckt. Geändert zu
   `.default(undefined as unknown as {baseURL;model;apiKeyEnv;size})`.
3. **zwei Typfehler in `routes.spec.ts`, die nie von lint erfasst wurden**: importiert wurde ein gar nicht existierendes
   `IdentityRole`, sowie das selbstreferenzielle `_tables`-Feld von `fakeDomain` (alle Lesezugriffe mussten
   über `as` laufen, wodurch die gesamte Datei zu `error`/`any` degenerierte). Ersteres wurde in
   `paper-host/src/identity.ts` ergänzt (die Rollen-Union beider Hosts hat dadurch nur eine Quelle),
   Letzteres zu einer cloures-lokalen Map umgebaut.

**schemastery-Semantik real gemessen** (direkt mit `tsx` ausgeführt, nicht geschlossen): bei einem verschachtelten
Objekt, dessen innere Felder alle `.required()` sind, wirft `A({req:'x'})` `$.nested.b missing required value`,
wenn das äußere `.default()` nicht geschrieben wird; `.required(false)` ist **wirkungslos** (wirft ebenso);
`.default(undefined as unknown as T)` besteht.

**Verifikation**: `packages/physicsos` **110 Punkte vollständig grün** (ursprünglich 109 + dieser Kombinationstest 1);
`tests/acceptance/paper-access.mjs` echter Dienst + echter Browser **ALL CHECKS PASSED**
(inkl. "abgelehnte Schreibvorgänge landen nicht in der Datenbank" und "Audit landet innerhalb von 52 ms, protokolliert wird der Lehrer selbst");
`lab-search-recall` weiterhin **132/132|Lücken 0/0**.
---

## DOC_SYNC_CLEANUP

**Status**:**Teilweise geschlossen** (2026-09-25, Abschlussrunde). Die unter doc-sync zum Umfang dieser Runde gehörenden
Gates sind alle grün; eine Altlast steht weiterhin im Soll.

**In dieser Runde behoben (Belege alle aus Live-Läufen)**:

- README-Gates: `verify-package-readme-model-experience` / `-limitations`
  **225/225 Pakete bestanden**. 4 physicsos-Host-Pakete in `SENTENCE_MODEL_EXPERIENCE` registriert
  (`kind: 'none'`, Begründung: reiner serverseitiger Host, läuft nicht über das Modell); `ui-physicsos` und andere Pakete ergänzten
  die Normabschnitte `## Model Experience` / `## Known Limitations and Deferred Work`.
- `update-host/README.md` vollständig neu geschrieben — die Originalversion war eine von notice-host kopierte falsche Fassung
  (darin stand `/physicsos/notice`, Feedback und Ankündigungen).
- `verify-md-wrap` (ein Absatz pro Zeile), `verify-md-links`, `verify-doc-refs`,
  `verify-public-repository-links`, `verify-package-paths`,
  `verify-config-source-ownership` **alle grün**. Zwei `docs/...`-Verweise zeigten ursprünglich auf
  Dokumente des äußeren Repos (im vendor nicht vorhanden), geändert zu auffindbarem Text ohne `docs/`-Präfix.
- `verify-export-jsdoc`: **serverseitig drei Pakete + Grenzfall vollständig auf Null**
  (auth-host / paper-host / notice-host / update-host / ui-settings-models
  / ui-physicsos, Verzeichnisse außer `physics/`). `listExports` bekam nebenbei explizite Rückgabetypen.
- Generierte Kataloge: `gen-tool-catalog` (`tool-physicsos` in `TOOL_PACKAGES` registriert +
  tsconfig-paths-Zuordnung), `gen-config-catalog` (Prosa der physicsos Config-Felder
  ist eingetragen, 124 Zeilen neu), `gen-cordis-catalog`, `gen-client-catalog`,
  `gen-persistence-catalog`, `gen-scoped-events`, doc-graphs **alle
  up to date**.
- `upstream-changes.patch` wurde mit `capture` neu erzeugt — der alte Patch war veraltet, weil
  `pnpm install` die abgedeckten Dateien umgeschrieben hatte; das ist Index-Drift, keine Codebeschädigung.

**`physics/` 449 Stellen vollständig auf Null (zweite Runde am selben Tag)**: codemod hat `@param`/`@returns`
und fehlende Blöcke in Batches ergänzt; die Destrukturierungsparameter von 15 scene-visual-Fabriken wurden gemäß Gate
auf benannte Eingaben `(input: XxxVisualInput)` + Destrukturierung im Rumpf umgestellt (Aufrufer ohne Änderung);
`verify-export-jsdoc` vollständig grün. Einzelne `@returns`-Formulierungen sind etwas mechanisch, können später beim Berühren
der entsprechenden Dateien beiläufig poliert werden; sie sind keine Gate-Schuld mehr.

**Verifikation**: `tsc -b` (5 physicsos-/Client-Pakete) + `tsc -p ui-physicsos`,
oxlint (web 213 Dateien / agent 45 Dateien) **0 Fehler**; ui-physicsos-Tests
**828/828**; `git diff --check` sauber. Außer den 15 geänderten Signatur-Parametern alles
kommentarartig, JSDoc ohne Verhaltensfläche.

---

## V1_PRODUCT_GAP_SWEEP

**Status**:**Abgeschlossen** (2026-09-25, dritte Runde). Produktoberfläche vor dem Go-live abgeschlossen, Deployment-Paketierung nicht angerührt.

- **Erstfilterung der Aufgabenbank durch die Engine**: `POST /physicsos/paper/bank/items/triage` —
  `planBankTriage` wählt synchron pending aus (angegebene Nicht-pending-ids melden skipped, nicht existierende melden
  missing), `runTriage` löst asynchron seriell blind (`independentSolve` wiederverwendet, Fehler pro Item isoliert),
  das Ergebnis schreibt in `anomalies` `engine-check:agreed|mismatch(...)|unresolved`
  (Neulauf ersetzt, stapelt nicht), **status bewegt sich nie**. `triageBusy` 409 verhindert paralleles wiederholtes Verbrennen von Geld.
  Auf der Lehrerseite zwei Aktionen «Engine-Erstfilterung» und «Ausgewählte Engine-Stimmigkeit» + zweisprachige Einträge.
- **Gate-Oberfläche um update-host ergänzt**: `lint:agent`/`typecheck:agent`/`build:hosts`
  drei Wurzel-Skripte ließen es zuvor aus — jetzt alle abgedeckt, nebenbei die 5 Altbestände bereinigt, die nie gelintet worden waren
  (arrow-parens, member-delimiter, no-unnecessary-condition, zwei doppelte jsonCall-Helfer in Tests
  zu gemeinsamem `postJson` zusammengeführt).
- **`apps/web` stillgelegt**: siehe oben APPS_WEB_STANDALONE_RETIREMENT.
- **`pnpm format` abgeschlossen**: siehe oben PNPM_FORMAT_IS_RED.
- **physics-agent-answers eingeordnet**: die deterministische Antwortsicht bleibt erhalten (sofort/kostenlos/offline),
  der Modellpfad wird bereits vom dsh agent abgedeckt, der Rest ist eine Produktentscheidung — siehe oben.

**Verifikation**: `tsc -b` sechs Pakete (neu update-host) 0 Fehler; oxlint 266 Dateien 0 Fehler;
physicsos-Tests **195/195** (inkl. 21 neue triage-Fälle für paper-host, update-host
nach composition-Refactoring 2 echte Ketten); ui-physicsos 828/828; `verify-export-jsdoc` vollständig grün;
overlay/vendor `physics/` und geänderte Dateien byteweise identisch, `apply` idempotent.

---

## V1_PRODUCT_GAP_SWEEP_2

**Status**:**Abgeschlossen** (2026-09-25, vierte Runde). Die drei "externen Abhängigkeiten" fanden jeweils einen realen Weg, die neuen Seiten wurden einer Liquid-Glass-Überarbeitung unterzogen.

### Bild-/PDF-Aufgabenerfassung (ursprünglich registriert als "wartet auf OCR/VLM-Dienst")

**Kein neuer Dienst nötig**: Das selbst bereitgestellte Modell-Routing (luckygs deepseek-v4.1-flash) akzeptiert im Praxistest **Bildeingaben** und transkribiert chinesische Aufgabenstellungen genau — mit echten Bildern verifiziert (inkl. Einheiten, Hochzeichen, Optionsbuchstaben). Umsetzung:

- `paper-host/src/transcribe.ts`: Bilder werden über `ctx.attachments` als inhaltsadressierte Anhänge auf Platte abgelegt und dann als `ImageBlock` über `ctx.llm.stream` transkribiert; der Systemprompt verlangt wörtliche Transkription, kein Lösen, Verschriftlichung von Bildtexten und Platzhalter «□» an unklaren Stellen.
- `POST /physicsos/paper/bank/ingest-image`: base64-Bilder (≤8 Stück) → Transkription → Wiederverwendung der bestehenden Struktur-Pipeline `ingestBankText` → pending-Einträge; der Transkriptionstext wird mit der Antwort zurückgegeben, damit der Lehrer ihn gegen das Originalbild prüfen kann.
- Client `question-upload.ts` (verlorene Quelldatei, aus dem lib/-Kompilat wiederhergestellt, inkl. wichtiger Details wie CJK-cmaps): Bild → dataURL; **Textebene-PDF wird lokal mit pdf.js extrahiert** (kostet keine Modellaufrufe, der extrahierte Text wird ins Bearbeitungsfeld gefüllt); Scan-PDF → seitenweises canvas-Rendering als PNG → visuelle Transkription. Die Erfassungskarte in PaperWorkspace wurde zu drei Eingängen «Einfügen / Bild / PDF» aufgewertet.

### Schulliste vervollständigt (ursprünglich registriert als "Datenquelle nicht verfügbar")

Gefunden wurde die **öffentliche Verzeichnisseite des Bezirksregierungsportals** (Verzeichnis der Bildungsschulen 2024 des gesamten Bezirks für Oberschulen/Mittelschulen/Grundschulen, veröffentlicht am 2025-03-28 vom Bezirksamt für Erziehung) sowie die **vollständige Tabelle des Zulassungsplans 2026 für Oberschulen des Bezirksamts für Erziehung** (über das Nachrichtenportal Qiandongnan nachgedruckt, die Plantabelle ist ein offizielles Bild). Nach Einzelvergleich pro Schule wurden 6 echte Lücken ergänzt: Huaxin-Oberschule der Stadt Kaili, Dritte Mittelschule des Kreises Sansui, Gesamtoberstufe des Kreises Tianzhu, Hengcheng-Oberschule des Kreises Tianzhu, Gesamtoberstufe des Kreises Cengong, Erste Mittelschule des Kreises Taijiang. Weitere 8 Schreibvarianten «amtlicher Vollname vs. eingetragener Kurzname» wurden nicht ergänzt (um zu vermeiden, dass die namensgehashte Mandantentabelle dieselbe Schule mit zwei Mandanten führt); Quelle und Begründung stehen im Kommentar von `schools-data.ts`. Die Mittelschulverzeichnisseite lieferte beim Abruf 404 (Website-Umbau), bleibt daher unvollständig.

### Aufgabenpool erweitert (ursprünglich registriert als "benötigt verifizierbare echte Prüfungsquellen")

**Physikprüfung der Mittelschul-Abschlussprüfung der Provinz Guizhou 2024** (erstes Jahr zentraler provinzialer Aufgabenstellung, 90 Punkte, 22 Aufgaben) wurde erfasst: `scripts/ingest-gz-2024-physics.mjs` registriert nach Anmeldung die Originalprüfung + 22 Wissenspunkt-Annotationen + 8 Multiple-Choice-Aufgaben (mit offiziellen Antworten und Lösungen); Aufgabenstellung und Antworten stammen aus zwei unabhängigen öffentlichen Transkriptionsseiten und wurden kreuzgeprüft (einziger Unterschied ist bei Aufgabe 12 `8:2` vs. `4:1`, dasselbe Verhältnis). Alles landet auf **pending** und gelangt nach Prüfung durch den Lehrer im Aufgabenerstellungsbereich in den Zusammenstellungspool. Wurde auf einem isolierten Server Ende-zu-Ende verifiziert (sources=1 / annotations=22 / bank=8).
Ausführung auf einer echten Instanz: `node scripts/ingest-gz-2024-physics.mjs --username <Lehrerkonto> --password <Passwort>`.

**Physikprüfung der Mittelschul-Abschlussprüfung der Provinz Guizhou 2025** (zweites Jahr zentraler provinzialer Einheit, 90 Punkte, 22 Aufgaben) wurde erfasst: `scripts/ingest-gz-2025-physics.mjs` registriert die Originalprüfung + 22 Wissenspunkt-Annotationen + 7 Multiple-Choice-Aufgaben (6 Einfachauswahl + 1 Mehrfachauswahl, mit offiziellen Antworten und Lösungen). Quelle ist eine öffentliche Word-Version von czwlzx (0 Punkte-Guthaben) mit Textebene, Aufgabe für Aufgabe transkribiert; 3 gescannte Bilder derselben Seite decken die Aufgaben 1–15 ab und stimmen wörtlich mit der Textebene überein; ableitbare Antworten (alle Auswahlaufgaben, 18, 21, 22 usw.) stimmen nach physikalischer Nachprüfung mit den Quellantworten überein, ein Eintrag mit Lösungsversion vom Bildungsportal Jiangnan Hui dient als unabhängige Verbreitungsstütze (Mitglieder-Schranke, nicht Aufgabe für Aufgabe abgeglichen). Alles landet auf **pending**. Wurde gegen eine lokale dev-Instanz Ende-zu-Ende verifiziert (sources +1 / annotations=22 / bank=7).
Ausführung auf einer echten Instanz: `node scripts/ingest-gz-2025-physics.mjs --base https://… --username <Lehrerkonto> --password <Passwort>`.
Strukturelle Erkenntnis: Gegenüber der Prüfung 2024 ging in der Prüfung 2025 die Auswahl von 8 Aufgaben (2 Mehrfachauswahl) auf 7 Aufgaben (1 Mehrfachauswahl) und die Kurzantwort von 2 auf 3 Aufgaben zurück, Gesamtpunktzahl und Aufgabenzahl bleiben unverändert; der `ZK_PHYSICS`-Blueprint wurde gemäß den realen Messwerten 2025 aktualisiert und die Abweichung im Kommentar dokumentiert.

### Aufgabenerstellungsbereich «AI-Entwurf» korrigiert und Arbeitsprozess visualisiert (2026-10-05)

Nutzer-Praxistest: Klick auf «AI-Entwurf + automatische Prüfung» reagiert nicht, der Schritt zum Bestätigen der Spezifikationstabelle ist überflüssig, und man sieht nicht, was die AI tut. Drei Probleme in einem Rutsch behoben:

- **Die Ursache der Nichtreaktion hat zwei Ebenen**: Der Client sendet `/draft` und `/check` Rücken an Rücken, während im serverseitigen Zustandsautomaten check erst nach abgeschlossenem Entwurf (Zustand bis checking) laufen darf — zu früh ausgeführt würde die Aufgabe mit NO_DOCUMENT auf failed gesetzt; außerdem wird nach dem Klick activeJob nie aktualisiert, und der failed-Zustand löst kein Polling aus, sodass die UI komplett einfriert. Jetzt orchestriert der Client nach «draft → Polling bis checking → erst dann check senden → Polling bis Endzustand», und activeJob wird durchgehend in Echtzeit aktualisiert.
- **Das Bestätigen der Spezifikationstabelle ist kein eigener Schritt mehr**: Die einzige Schaltfläche «AI-Entwurf + automatische Prüfung» bestätigt die Spezifikationstabelle automatisch (failed-Wiederholung nimmt denselben Weg, Neubestätigung setzt das Revisionsbudget wie bisher zurück); die Spezifikationstabelle wird zu einem schreibgeschützten Info-Block herabgestuft, die Phasenleiste beginnt bei «AI-Entwurf».
- **Visualisierung des AI-Arbeitsprozesses (grokbot-artige Spielfigur)**: Die einzelnen paper-host-Treiber betten `job.progress`-Telemetrie ein (Aufgabenbank planen / abschnittsweise entwerfen / Aufgabe für Aufgabe umarbeiten / zusammenstellen / Normprüfung / Engine-Prüfung pro Aufgabe / Export pro Aufgabengrafik — auch jede Aufgabengrafik von rund 70 s wird benannt); das AiWorker-Panel des Clients wechselt mit einem rein per CSS gezeichneten Roboter je Phase den Zustand (Denken/Schreiben/Untersuchen mit der Lupe/Malen und Bebildern/Frustration), samt Phasenliste, done/total-Fortschrittsbalken und Zeitmessung. Auch der Export läuft über die runner-getriebene Visualisierung.
- `PaperJob.progress` ist ein optionales Feld, alte Aufgabenzeilen ohne dieses Feld werden normal gelesen; die zod-Zeilenvalidierung öffnet stage als String. Tests neu: Reihenfolge der Ein-Klick-Orchestrierung (confirmSpec→runDraft→Polling→runChecks genau einmal), Rendering der Spielfigur-Telemetrie; fake-timer-Fälle müssen vor dem Leck der Fake-Uhr geschützt werden (afterEach als Auffangnetz useRealTimers).

Verifikation: question-paper 42 / paper-host 39 / web 939 / vendor agent 460 vollständig grün; typecheck×2, build:lib, oxlint, prettier alle bestanden; Plugin-Manifest neu signiert (paper-host-Einstieg geändert).

### Vertrauenswürdigkeit der Lösungskette in vier Teilen (2026-10-05)

Mit der Methode «kleinste Mutation einer Goldstandard-Aufgabe» wurden im Praxistest drei kontrafaktische Blindflecken aufgedeckt und behoben, dazu der Selbstkorrektur-Kreislauf und ein strukturiertes Laufzeitprotokoll ergänzt:

- **Kontrafaktischer Wächter** (`packages/agent-tools/tests/counterfactual-guard.test.ts`): Bei einer Geschwindigkeitsselektor-Aufgabe, die «geradliniger Durchgang» behauptet, aber v≠E/B, wurde früher stillschweigend solved (32/33 bestanden, Status weiterhin passed) — jetzt sendet `question-runtime` die Warnung `PASSAGE_CLAIM_CONTRADICTED`, wenn die Behauptung der Prüfung `velocity_selection_condition` widerspricht; bei einer Schaltkreis-Aufgabe, die «Amperemeter-Anzeige beträgt X A» behauptet und dem Ohmschen Gesetz widerspricht, ergänzt der Parser einen Amperemeter-Anzeigemodus, liest den Behauptungswert in die IR ein, der von der Engine berechnete Wert bleibt unverändert, und die Kreuzprüfung sendet die Warnung `STATED_READING_INCONSISTENT` (die Antwort richtet sich immer nach der Engine). Bekannte Lücken (Massenspektrometer «gemessener Radius», Kinematik mit behaupteter Endgeschwindigkeit kommen noch nicht in die IR) sind mit docs-Fällen festgenagelt; nach der Behebung werden sie zu Wächtern migriert.
- **Selbstkorrektur-Kreislauf** (`physics-tool-runtime.ts` + `render.ts` + persona Punkt 9): rejected-Ergebnisse tragen strukturierte `retryGuidance` (je nach PARSE_FAILED/AMBIGUOUS/INVALID_SEMANTICS/UNSUPPORTED_MODEL/VERIFICATION_FAILED werden deterministische Umschreibhinweise gegeben); nach der zweiten Ablehnung derselben normalisierten Aufgabenstellung wird `STOP_RETRY_SAME_STEM` gesendet (deterministische Pipeline, unveränderte Wiederholung ist sinnlos), die persona wurde entsprechend auf «gemäß Korrekturvorschlag höchstens einmal wiederholen» geändert.
- **Strukturiertes Laufzeitprotokoll** (vendor `tool-physicsos`): neues Sitzungsereignis `physics/solve-trace` — jedes solve (solved wie rejected zählt) protokolliert {workflowState, domain, Verifikationszusammenfassung, Antwort, issues, retryGuidance, attempt, Dauer}; die `physicsScenes`-Projektion nimmt nur READY-Lösungen auf, rejected hinterließ früher keine Spur im Sitzungsprotokoll. Die Projektion `physicsSolveTraces` faltet appendierend und deckelt bei 50 Einträgen. Die bekannte Ereignistabelle und das Persistenzverzeichnis wurden über `gen-persistence-catalog` neu erzeugt; das Plugin-Manifest (tool-physicsos-Einstiegszusammenfassung+Signatur) wurde über `scripts/plugin/sign-physicsos-manifest.mjs` neu signiert. Diese capture-Runde hat außerdem den in der vorigen Runde vergessenen capture-Dokumentabschnitt des Persistenzverzeichnisses in `upstream-changes.patch` nachgetragen.
- **Regression-Set echter Prüfungen** (`packages/agent-tools/tests/real-exam-regression.test.ts`): 10 wörtliche Aufgabenteiltexte der Mittelschul-Abschlussprüfung Guizhou 2025 (Konzept/Kurzantwort) nageln den Vertrag «ehrlich ablehnen, niemals Zahlen erfinden» fest + die Wiederholungsanleitung muss existieren + Wiederholung derselben Aufgabe erhält das Stoppsignal; außerdem wacht darüber, dass berechenbare Aufgaben weiterhin die gesamte Engine-Kette durchlaufen, um ein pauschales Ablehnungsurteil zu verhindern.

Verifikation: question-core 445 / agent-tools 64 / vendor agent 460 / web 937 vollständig grün; typecheck, lint, prettier (Dateien dieser Runde) alle bestanden; `verify-persistence-catalog` up to date.


### Liquid Glass + GlassSelect

- `chrome.ts` erhielt neue liquid-glass-Materialtoken: Unschärfe (`--physics-glass-blur`), Spiegelglanz (mit sheen-Verlauf), helle Kante rim, abgehobener Schatten, Popup-Dichte, **Umgebungslicht** (ohne eine grundierende Fläche zum Brechen wäre das Glas nur eine graue Box — genau das war der Grund, warum die vier neuen Seiten zuvor «keine Haptik» hatten).
- Die vier neuen Seiten (Login-Gate / Aufgabenerstellungsbereich / Verwaltungsbackend / Lernprotokoll) sind vollständig verglast; das Login-Gate legt eine Horizontgrafik als Brechungsunterlage frei.
- **`GlassSelect` ersetzt alle nativen Dropdowns** (AuthGate 2 + AdminWorkspace 2 + AdminContentTab 3 + PaperWorkspace 13): combobox + portal-Popup (Problem des overflow-Beschneidens von Karten), Tastaturnavigation mit Pfeiltasten/Home/End/Enter/Esc, Schließen bei Außenklick, Scroll-Verfolgung, Überspringen deaktivierter Einträge, vollständiges aria.
- Abnahme: `tests/acceptance/glass-surfaces.mjs` echter Server + echter Browser, 10 Screenshots, console/pageerror/rejection/failed-request alle null; Screenshots liegen in `/tmp/physicsos-glass` (Pfad mit `GLASS_SHOTS` änderbar).

**Verifikation**: typecheck drei Linien (core/web/agent inkl. update-host) vollständig grün; oxlint 54+216 Dateien 0 Fehler; physicsos-Tests **197/197**; ui-physicsos **834/834** (inkl. 6 GlassSelect-Fälle); `verify-export-jsdoc` vollständig grün; `pnpm format` vollständig grün; overlay ↔ vendor byteweise identisch, `apply` idempotent, patch neu capture-d.

---

## P0_P2_COMPLETION_PROGRAM

**Status**:**Abgeschlossen** (2026-09-26). Plan und Aufgabengrenzen siehe
[`docs/superpowers/plans/2026-09-26-p0-p2-program.md`](../superpowers/plans/2026-09-26-p0-p2-program.md).
Die sieben Aufgaben wurden jeweils in einem isolierten worktree umgesetzt, vom Controller einheitlich verdrahtet, gecaptured und abgenommen.

### Umgesetzte Inhalte

- **Produktions-Deployment und Wurzel-CI** (Task 1): mehrstufiges `Dockerfile`, `compose.yml` (app /
  PostgreSQL / Redis, healthcheck, benannte Volumes, secret-Dateien), `/healthz` und
  `/readyz` health-host, `scripts/healthcheck.mjs`, Wurzel-CI-Workflow.
- **Container-Secret-Eingang** (vom Controller ergänzt): `scripts/docker-entrypoint.mjs` materialisiert
  `<NAME>_FILE`-Geheimnisse zu Umgebungsvariablen und startet dann die CLI; fehlende/leere Dateien schlagen direkt fehl,
  kein stiller Fallback.
- **Kontolebenszyklus** (Task 2): einmalige Passwortzurücksetzung (gehashte Speicherung, Ablauf, einmalige Nutzung,
  Ersetzen und Ungültigmachen, Admin-Warteschlange und UI-Panel), Zustellungsadapter-seam, Ratenbegrenzungs-seam
  (In-Memory-Referenzimplementierung + Redis-Grenze), CLI zur Migration der Zugehörigkeit von legacy-Sitzungen/Arbeitsbereichen.
- **Persönliche Lern-Synchronisierung** (Task 3): `/physicsos/learning` speichert nach Konto und Mandant isoliert
  persönliche Antworten und gespeicherte Szenen (Pagination, idempotentes Schreiben, geräteübergreifend), der Client ist lokal zuerst und führt
  eine localStorage-Migration durch.
- **Klassenunterricht** (Task 4): `/physicsos/class` Klassen, Mitglieder (userKey), Hausaufgaben
  (Prüfungen/Experimente), Fristen, Schüler-Einreichungen und Empfangsbestätigungen, Lehrer-Korrektur, Klassen-Abschlussrate; der Schreibpfad hat
  Same-Origin- + JSON-Content-Type-Zäune; der Client hat eine Oberfläche mit zwei Rollenflächen + Sidebar-Eingang.
- **Physik-Inhaltserweiterung** (Task 5): zeitvariabler Feld-Zyklotron, Longitudinalwelle / Reflexion-Brechung / Beugung /
  Doppler, moderne Physik (Photoeffekt) über die gesamte Kette (Engine → Szene → Aufgabe → Visualisierung →
  Experimentvorlage); nicht unterstützte Fälle geben `UNSUPPORTED_MODEL` zurück, statt ein anderes Modell anzuwenden.
- **Desktop-Hülle** (Task 6): Tauri-2-Hülle, Plattformbrücke, lokaler Sidecar-Transport, Prüfpfad für signierte Updates,
  Release-Validierung und lokales Paketierungsskript; das App-Icon wird nun von einem Bilderzeugungsmodell
  (`gpt-image-2.5-sunburst`) erzeugt und dann mit `tauri icon` in alle Größen generiert.
- **Produktionslaufzeit** (Task 7/8): `packages/storage/storage-postgres` implementiert den KV-Vertrag des
  Speicher-Hubs; `packages/physicsos/shared-state-host` bietet kopienübergreifende Ratenbegrenzung und
  ein einmaliges Ledger (memory + Redis, atomares Lua). Die Produktions-compose schaltet auf postgres/redis um,
  während die Entwicklung die json/memory-Standardwerte behält.

### Abnahmebelege

- `pnpm run typecheck` / `pnpm run lint` / `pnpm run test` /
  `pnpm run build` die vier Wurzel-Gates **alle exit 0**.
- Testzahlen: web `60` Dateien `850` Fälle, agent `36` Dateien `302` Fälle,
  deploy `3` Fälle, desktop `10` Fälle; core alle Pakete grün (question-core `445`,
  agent-tools `32` usw.). Die neuen Speicher-/Shared-State-Pakete `6` Dateien `41` Fälle (echtes Redis +
  echtes PostgreSQL wurden tatsächlich ausgeführt).
- Selbstprüfung der Produktionsform: Start einer echten Instanz mit
  `PHYSICSOS_STORAGE_BACKEND=postgres` + `PHYSICSOS_SHARED_STATE_BACKEND=redis` →
  `/healthz` `200`, `/readyz` `200` (postgres/redis beide ok);
  PostgreSQL baute `33` Domänentabellen auf; nach drei Fehlanmeldungen erschienen in Redis
  `physicsos:limiter:login:<sha256>` und `physicsos:limiter:ip:<sha256>`
  (Schlüsselnamen enthalten nur Hashes, keine Konto-/IP-Klartexte).
- overlay: `apply` idempotent (Ausgabe `upstream-changes.patch already applied`),
  `git apply --reverse --check` besteht, keine `.rej`/`.orig`-Reste.

### Weiterhin bestehende Grenzen (wahrheitsgemäß registriert)

- Das einmalige Empfangsledger von `/api/respond` ist weiterhin eine Map im auth-host-Prozess. Die gemeinsame Implementierung ist
  als Dienst `physicsosOnceLedger` bereit, aber jener Pfad von apiproxy ist noch nicht angeschlossen; bei Mehrfachkopie-
  Deployment degeneriert dieser Punkt weiterhin zur Einzelkopie-Semantik.
- Desktop-Signierung / Notarisierung / Release benötigen Zertifikate und Schlüssel, gehören zur Release-Umgebungskonfiguration, wurden lokal nicht ausgeführt.
- Auf dem lokalen Rechner gibt es keinen Docker-daemon, das Image wurde nicht tatsächlich gebaut; `docker compose config` und die compose-
  Datei wurden validiert.
- Das browserbasierte Ende-zu-Ende-Abnahmeskript `tests/acceptance/glass-surfaces.mjs` wurde in dieser Runde nicht erneut ausgeführt
  (frühere Baseline komplett null Fehler), die schnittstellennahe Verifikation ist durch die composition-Tests abgedeckt.
- `packages/ui` hat nach der Stilllegung von `apps/web` derzeit keinen Konsumenten im Repository; es bleibt eine getestete echte Komponenten-
  bibliothek und wartet auf eine Produktentscheidung.
