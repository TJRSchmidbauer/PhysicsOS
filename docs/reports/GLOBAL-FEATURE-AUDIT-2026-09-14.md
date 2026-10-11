# PhysicsOS Globaler Funktionsaudit und Optimierungsempfehlungen (2026-09-14)

> Erstellungsmethode: 8 schreibgeschützte Audit-Sub-Agents führen domänenweise Bestandsaufnahme durch, jeder Fund wird erneut von einem unabhängigen Sub-Agent **adversarial geprüft** (Standardmäßig als falsch bewertet, Prüfer muss referenzierte Dateien selbst öffnen und abgleichen). Von 60 ursprünglichen Funden 28 bestätigt, 32 widerlegt.
> Widerlegte Einträge wurden nicht in diesen Bericht aufgenommen, um keine Scheinprobleme zu erzeugen.
>
> **Auftraggeber hat zwei Punkte persönlich geprüft (übrige sind Sub-Agent-Schlüsse, bei Übernahme bitte gleicherweise stichprobenartig prüfen)**:
>
> - P0-1 Gleichbeschleunigungs-Goldfragen ignorieren im Task gegebene Zeit: `mechanics-scene-builder.ts:65-68` liest tatsächlich nicht IRs `time`, `mechanics-engine.ts` Funktion `computeSimulationDuration` für `uniformly_accelerated_motion` ist hardcodiert `return 10`; `mechanics.test.ts` zwei Testfälle Titel lauten "should compute v=20 m/s" / "s=75 m", Assertion jedoch nur `toBeDefined()` — **diese beiden Tests können nicht fehlschlagen**, daher Defekt nie abgefangen.
> - P0-3 Parallelplatten-Ablenkungsdistanz zu groß: Engine veröffentlicht tatsächlich korrektes `deflection` (`electric-region-engine.ts:561-573`, nimmt "y beim Austritt"), Lösungsschicht `question-runtime.ts:678-696` verwendet stattdessen `displacement_vector.y`, gleichzeitig zeigt UI Formel `y = 0.5 × (qE/m) × t²` (Ablenkungsformel innerhalb der Platten) — **Antwort widerspricht Formel auf derselben Karte**.
>
> ⚠️ Dies sind **Physik-Antwort-Korrektheit**-Probleme, keine Stilprobleme, Priorität höher als aktuelle UI-Verschönerung.

---

# PhysicsOS Experimentierstudio · Optimierungsbericht (schreibgeschützter Audit)

> Hinweis: Dieser Bericht basiert auf durch adversariale Validierung **bestätigten Funden** zusammengefasst. Die Aufgabeneingabe bereitgestellte bestätigte Liste wurde auf meiner Seite bei Punkt 25 (Berichtspanel Dunkelkontrast) **abgeschnitten** (Urteilstext ebenfalls am Ende abgebrochen), daher deckt dieser Bericht **nur die 25 Punkte mit vollständigen Belegen** ab; Liste behauptet 28 Punkte insgesamt, die restlichen 3 fehlen mitsamt Eingabe, dieser Bericht **erfindet sie nicht nach**. Die 32 widerlegten Punkte werden nur unter „Beweise unzureichend/nicht verifiziert“ soweit beibehalten, als sie tatsächliche verbleibende Lücken aufzeigen.
>
> Code-Quellennachweis als `overlays/harness/files/...` (Overlay-Quelle); abgeglichen: `packages/client/ui-physicsos` beide Bäume identisch. Wurzel `packages/` ist Engine-Code. Projekt befindet sich in "experiment studio polish": Aufgabe 1 (Arbeitsbereich/Versuchszentrum), Aufgabe 2 (Fach-Canvas und Geräte-Sprites), Aufgabe 3 (direkte Schaltkreis-Bedienung + Regression) abgeschlossen oder Tests grün; nachstehende bestätigte Funde **werden von diesen drei laufenden Arbeiten nicht abgedeckt**, aber bei Implementierung bitte beiläufig einbauen.

---

## 1. Fazit-Zusammenfassung (Die 5 wichtigsten nächsten Schritte)

1. **Gleichbeschleunigungs-Goldfragen beheben**: Task-IRs `time` an Engine `endTime` durchreichen, sonst geben mech-01/06 Endgeschwindigkeit als 30/40 m/s aus (soll 20/30), und Tests auf numerische Assertions umstellen.
2. **Schrägwurfs-Goldfragen beheben**: Standard-Starthöhe soll Boden 0 sein, `vx = v0·cosθ`, sonst sind mech-03 „Maximalhöhe/Flugzeit/Wurfweite“ drei Fragen alle falsch, zeigt aber „Validierung bestanden“.
3. **Parallelplatten-Ablenkungsdistanz beheben**: Lösungsschicht soll von Engine veröffentlichtes `deflection` abgeleitete Größe nutzen, damit Schülern angezeigte Ablenkungsdistanz von 7,96×10⁻³ m zurück auf korrekte 2,811×10⁻³ m kommt.
4. **Newton-II-Resultierende-Kraft-Aufgaben + Vergleichsaufgaben beheben**: Horizontale-Resultierende-Aufgaben dürfen keine unausgeglichene Schwerkraft mehr addieren (a wird als 11 statt 5 ausgegeben); `electric-16/17/18` sollen als `UNSUPPORTED_MODEL` erkannt werden oder Doppellösung ausgeben, statt vorzugeben „Lösung abgeschlossen“.
5. **Zweisprachigkeit (DE/EN) konsolidieren**: Runtime soll nur stabile IDs ausgeben, UI-Schicht nutzt vorhandenes `t()` (zuerst electric/mechanics/magnetic drei Hauptpfade nachrüsten), und Schüler sollen bei AMBIGUOUS-Aufgaben konkrete Mehrdeutigkeitstexte sehen können.

---

## 2. Nach Priorität gegliederte Optimierungsempfehlungen

### P0 — Korrektheit / benutzersichtbare Defekte (falsche Antworten)

#### P0-1 Gleichbeschleunigungs-Goldfragen ignorieren im Task gegebene Zeit, Engine löst fix mit 10 s

- **Phänomen**: mech-01 „Bewegung 5 s“, mech-06 „Bewegung 5 s“ Schülermesswerte stimmen nicht mit Aufgabenvorgabe überein.
- **Belege**: `packages/question-core/src/golden-questions.ts:271,311`; `packages/question-core/src/mechanics-scene-builder.ts:65-68` (Gleichbeschleunigungs-Zweig übergibt nur velocity/acceleration, liest niemals `getKnown(ir,'time')`); `packages/physics-scene/src/mechanics-scene-factory.ts:210` (`options: {}`); `packages/engine-mechanics/src/mechanics-engine.ts:224-226` (`computeSimulationDuration` für `uniformly_accelerated_motion` hardcodiert `return 10`); Read-only-Empirischtest mech-01 `final_velocity=30`, `displacement=(200,0,0)`.
- **Auswirkung**: Endgeschwindigkeit/Verschiebung geben falsche Antworten (soll 20 m/s, 75 m); `packages/engine-mechanics/tests/mechanics.test.ts:65-72` prüft nur `toBeDefined` kann nicht abfangen; `docs/reports/MECHANICS-RUNTIME-PACK-V1-REPORT.md:153` verzeichnet `v=20, s=75 ✓` widerspricht Empirischtest, zeigt Abweichung von ursprünglicher Absicht als Defekt.
- **Empfehlung**: IRs `time` bekannte Größe über Szene/Request `options.endTime` an Engine übergeben und damit lösen; `mechanics.test.ts:65-72` von `toBeDefined` auf numerische Assertion ändern. (`:301-314` direkt `t=5` übergebende Regressionstestfälle unberührt.)
- **Aufwand**: S–M

#### P0-2 Schrägwurfs-Goldfragen Startpunkt standardmäßig 20 m hoch, Horizontalanteil fehlverwendet Resultiergeschwindigkeit, drei Fragen alle falsch

- **Phänomen**: mech-03 „Anfangsgeschwindigkeit 20 m/s, Wurfwinkel 30°“ Beantwortung drei Punkte alle falsch.
- **Belege**: `packages/question-core/src/mechanics-scene-builder.ts:42` (`height = getKnown(ir,'height') ?? 20`), `:46` (`horizontalSpeed = getKnown('horizontal_speed') ?? velocity`), `:70` (`horizontalSpeed > 0 ? horizontalSpeed : velocity*cosθ` durch Fallback nimmt immer Resultiergeschwindigkeit, cosθ ist toter Code); `golden-questions.ts:285-290` `expectedValidation:'VALID'`; empirisch gemessen `body.position=(0,20,0)`, `flight_time=3.236` (soll 2), `max_height=25` (soll 5), `range=64.72` (soll 34.64).
- **Auswirkung**: Drei Fragen Antworten alle falsch, UI zeigt trotzdem „Validierung bestanden“ (`QuestionWorkspace.tsx:1668`); Vergleich mech-02 schreibt explizit „aus 20 m Höhe“, zeigt dass 20 als Schrägwurf-Standardwert fehlverwendet wird.
- **Empfehlung**: Schrägwurf Standard-Starthöhe auf 0 setzen; `vx` durch `v0·cosθ` berechnen (außer Aufgabentext gibt Horizontalgeschwindigkeit explizit); numerische Assertions nachrüsten. Aktuelle Tests prüfen nur Existenz (`mechanics.test.ts:109-116`), Änderung bricht Tests nicht.
- **Aufwand**: S

#### P0-3 Parallelplatten-Aufgaben „Ablenkungsdistanz“ Antwort etwa 2,8-facher Korrektwert

- **Phänomen**: electric-10/11/16/18 angezeigte Ablenkungsdistanz widerspricht Formel auf derselben Karte.
- **Belege**: `packages/question-core/src/question-runtime.ts:682-696` (begrenzter-E-Feld-Zweig nimmt `displacement_vector.y` als deflection); `packages/engine-electric-region/src/electric-region-engine.ts:561-576,970` (Engine veröffentlicht separater korrektes `deflection = y beim Austritt`); `packages/question-core/src/electric-scene-builder.ts:240-241` + engine `:920-923/933` (`endTime=traverseTime*2`, bei Abfrage Teilchen bereits ausgetreten, deshalb `displacement_vector.y` enthält nach Austritt gleichmäßigen Abschnitt); empirisch electric-10 Engine `2.81e-3` vs solution `7.96e-3` (Verhältnis 2,83).
- **Auswirkung**: Schülern angezeigte Ablenkungsdistanz ca. 2,8-fach zu groß, konfliktiert mit Formel auf derselben Karte `y=0.5×(qE/m)×t²`; betroffen `golden-questions.ts` electric-10/11/16/18.
- **Empfehlung**: Begrenzter-E-Feld-Zweig auf von Engine veröffentlichtes `deflection` abgeleitete Größe umstellen (fehlt sie, Fallback auf `displacement_vector`); zugleich `packages/question-core/tests/electric-questions.test.ts:371-373` Assertion auf Lesen von `deflection` ändern und Genauigkeit von `-2` auf echte numerische Constraints verschärfen (z. B. `-5`) — Hinweis: Zuerst Assertion-Ziel ändern, sonst Fehler.
- **Aufwand**: S

#### P0-4 Newton-II-Goldfragen addieren Schwerkraft in „horizontale Resultierende“-Aufgaben, Beschleunigung wird als 11 m/s² ausgegeben

- **Phänomen**: Aufgabenstellung „horizontale Resultierende 10 N“, Schüler erhält a=11, F=22.
- **Belege**: `packages/physics-scene/src/mechanics-scene-factory.ts:144-157` (`newton_second_law` fügt bedingungslos `force-gravity`+`force-normal` hinzu, `:45` Standard-Schwerkraft `(0,-9.8,0)`), `packages/question-core/src/mechanics-scene-builder.ts:76-82`; `packages/engine-mechanics/src/models/model-resolvers.ts:206-230` (`force-normal` nie einbezogen, kann Schwerkraft nicht kompensieren); `question-runtime.ts:841-846` (Betrag des Beschleunigungsvektors nimmt); empirisch `net_force=(10,-19.6,0)`→22 N, `acceleration=(5,-9.8,0)`→11 m/s².
- **Auswirkung**: Newton-Zweites-Gesetz-Aufgaben geben falsche Beschleunigung (11 statt 5) und falsche Resultierende (22 statt 10); `mechanics.test.ts:128-131` Testfall heißt „a = 5 m/s²“ prüft aber nur `toBeDefined`.
- **Empfehlung**: Bei Aufgabenstellung „horizontale Resultierende/Resultierende“ keine unausgeglichene Schwerkraft mehr injizieren (oder Normalkraft mit Schwerkraft paarweise aufheben lassen und Horizontalanteil nehmen); Tests auf numerische Assertions ändern.
- **Aufwand**: S

#### P0-5 Vergleichs-Goldfragen als VALID markiert, tatsächlich nur Einzelteilchen-Einzelwert ausgegeben

- **Phänomen**: electric-16/17/18 fordern „beide vergleichen/zwei Plattenlängen vergleichen“, Lauf löst nur einen Wert.
- **Belege**: `packages/question-core/src/golden-questions.ts:239,248,257` alle `expectedValidation:'VALID'`; `packages/question-core/src/deterministic-electric-parser.ts:602-611,510-522` (Geschwindigkeit/Ladung/Masse/Plattenlänge nehmen alle ersten Treffer, electric-17 nur Elektron); `electric-scene-builder.ts:200-236` (erstellt nur einzelnes `particle-1`); `question-runtime.ts:356` gibt `READY` zurück; `QuestionWorkspace.tsx:212` („Lösung abgeschlossen“), `:1182` („Bedingungen vollständig“-Badge); gesamtes Repo keinerlei „Vergleich/Mehrfachszenarien“-Behandlung.
- **Auswirkung**: Aufgaben werden als „Validierung bestanden/Lösung abgeschlossen“ behandelt, tatsächlich nicht beantwortet; `golden-questions.test.ts:16-26` prüft für VALID nur `validation.status`, nicht ob targets beantwortet wurden. Konflikt mit `docs/08-QUESTION-PIPELINE-ARCHITECTURE.md:304-313` (#18 stillschweigendes Raten verbieten), zeigt nicht beabsichtigtes Design.
- **Empfehlung**: „Vergleich/Mehrfachszenarien“ als `UNSUPPORTED_MODEL` erkennen oder Vergleichsergebnis zweier Läufe ausgeben, und für diese drei IDs numerische/semantische Tests nachrüsten.
- **Aufwand**: M

---

### P1 — Echte Reibung / Risiko (keine falsche Physik, aber deutlicher Erlebnisverlust oder potenzieller Absturz)

#### P1-1 AMBIGUOUS-Aufgaben konkrete Mehrdeutigkeit in UI nie angezeigt

- **Phänomen**: „Fehlende Ladungsvorzeichen“ oder comp-08 ausgewählt zeigt nur generische Texte.
- **Belege**: `packages/question-core/src/semantic-validator.ts:144-167` (Mehrdeutigkeiten nur in `ambiguities`, `issues` leer); `overlays/.../QuestionWorkspace.tsx:1751-1754` (`validationMessage` liest nur `issues[0]`), `:1229-1237`, `:1653-1661`; Gegenbeweis: Runtime hat präzise Texte (`semantic-validator.ts:147`); einzige Stelle, die Mehrdeutigkeiten auflöst: `packages/agent-tools/src/physics-tool-runtime.ts:419-423` (mit Optionen), UI nicht genutzt; empirisch 06-missing-charge-sign `issues=[]` + `ambiguities=['chargeSign']`.
- **Auswirkung**: Schüler weiß nicht, ob Ladungsvorzeichen fehlt oder Magnetfeldrichtung, kann nicht ergänzen; 08-parallel-velocity zeigt ebenfalls nur generische Texte.
- **Empfehlung**: In ResultSummary und „Validierungsdetails“ beim leeren `issues` `result.validation.ambiguities` message rendern (mit options optionale Schaltflächen).
- **Aufwand**: S–M

#### P1-2 Wellen-Fach „Wellengeschwindigkeits-Messwert“ Checkbox für Canvas völlig wirkungslos

- **Phänomen**: Ankreuzen/Abwählen „Wellengeschwindigkeit v = λf“, Wellenform, Vektoren, Messwertleiste keine Änderung.
- **Belege**: `overlays/.../physics/wave-visual-bridge.ts:55-71` (mappt zu `waveSpeed`, aber im gesamten Repo keine Lesestelle); `wave-renderer.tsx:115/232/318/338` (liest nur `waveform/nodes/superposition`); `wave-visual-bridge.ts:255-258` (`v = λf` Messwert bedingungslos in readout schreiben) und `PhysicsCanvas.tsx:516-553` (bedingungslos zeichnen); `packages/physics-scene/src/wave/wave-scene.ts:235-238` (dieses Observable Standard visible:true, deshalb drei Wellen-Stationen Checkbox erscheint).
- **Auswirkung**: Ein sichtbarer Schalter ist tot, Klick ohne Reaktion (kein Fehler, kein Absturz, keine Datenänderung, nur Interaktionskonsistenz beeinträchtigt).
- **Empfehlung**: Bevorzugte Lösung A — Bridge soll `visible.waveSpeed` jene Messwertzeile mit `v = λf` gating (Standard weiter true). **Lösung B vermeiden** „Element aus Szene entfernen“: würde Assertion auf Observable-ID-Liste in `packages/physics-scene/tests/wave-scene-runtime.test.ts:65-68` brechen.
- **工作量**：S

#### P1-3 induction 学科「感应电动势」「磁通量」勾选对画布无效

- **现象**：勾选 emf/flux 时，场 box 与 `E/-dΦ/dt` 读数均不变；「双棒速度」是死标签。
- **证据**：`packages/physics-scene/src/induction/induction-scene.ts:188-217`（emf/current/flux 默认 visible:true）；`overlays/.../physics/induction-workspace-runtime.ts:65-70,363-375`（树暴露 4 个勾选框）；`induction-renderer.tsx:162,298,341`（只读 `view.visible.barMotion` 与 `inductionCurrent`）；`induction-visual-bridge.ts:51-58`（写入 emf/flux 但无消费者，全模型无带 observable 的矢量）、`:44-47`（`keyOf` 不产 `barVelocity`，故 `:70` 标签永不使用）。
- **Auswirkung**: Die zwei im Baum anwählbaren Schalter haben null Einfluss auf den Canvas; `docs/15-RUNTIME-ARCHITECTURE.md:130-133` verlangt, dass Ebenen-Schalter konsumiert werden müssen, keine absichtliche Lücke.
- **Empfehlung**: Für emf/flux sichtbare Entitäten festlegen (Voltmeter-Messwerte/Flussdichte-Beschriftungen) und im Renderer per visible gaten; oder diese beiden observable-Definitionen aus Baum und Szene entfernen. Aktuelle Tests haben keine entsprechenden Testfälle, Gating bricht keine Tests.
- **Arbeitsaufwand**: S–M

#### P1-4 Fach magnetic: Tabs „Ableitung“ und „Ereignisse“ immer leer, und Canvas hat kein Hover/Tracking/Stroboskop

- **Phänomen**: Magnetfeld-Kreisbahn ist Animationsszenario, doch keine Bahn-Messwerte, kein Klick-Tracking, keine Stroboskop-Nachbilder; die zwei Tabs „Ableitung“ und „Ereignisse“ sind dauerhaft Platzhalter.
- **Beleg**: `overlays/.../physics/magnetic-workspace-runtime.ts:241` (`derivation: []`), `:243` (`events: []`), `:245` (`trajectoryTimes: []`, und dieser return ist der einzige Erfolgs-Pfad); `PhysicsCanvas.tsx:238-241` (`interactive` benötigt `trajectoryTimes` Längen-Match, leeres Array lässt hover`:270`/seek`:293`/stroboscope`:308` alles kurzschließen); Vergleich `mechanics-workspace-runtime.ts:53/55/57` liefert normal; übrige Fach-Erfolgs-Pfade liefern ebenfalls alle `derivation` aus `derivedQuantities` (electric:465, wave:285, circuit:340 usw.).
- **Auswirkung**: Gleichartige Animations-Fächer sind alle interaktiv, einzig magnetic nicht; Tab „Ableitung“ dauerhaft leer. Erreichbar: `LabWorkspace.tsx:226-227` dispatcht an diesen Runtime, Template `experiment-templates.ts:488` (`magnetic-circular`).
- **Empfehlung**: Magnetbrücke hat bereits `data.samples`, danach `trajectoryTimes` füllen (und eine Ableitung `r=mv/qB` / `T=2πm/qB` ergänzen); falls Magnet-Szenario definitiv keine diskreten Events hat, „Ereignisse“-Tab ausblenden. Aktuelle Tests prüfen nur view's particles/vectors/field und Tabellenwerte, Änderung bricht nichts.
- **Arbeitsaufwand**: M

#### P1-5 Labor-Arbeitsplatz-Texte umgehen locale-Tabelle, nach Umschaltung auf Englisch bleiben Inspektor/Szenenbaum/Messwerte chinesisch

- **Phänomen**: Im Englisch-Modus sind Eigenschaften/Messwerte/Prüf-Panels, Szenenbaum, Observables, Ereignis-Labels weiterhin chinesisch, UI gemischt mittel-englisch.
- **Beleg**: `overlays/.../physics/electric-workspace-runtime.ts:575/577/584/591` (erzeugt direkt chinesische label/title, via snapshot.inspector ins Panel); `mechanics-workspace-runtime.ts:44`; `physics-runtime-bridge.ts:299,626`; `workspace-parts.tsx:322` (`{section.title}`), `:385` (`{check.label}`) nicht durch `t()` (`:156/:90/:645/:681` ebenso); `locales.ts:119`(`lab.group.derived`), `:58`(`lab.observables`) sind tote Keys.
- **Auswirkung**: Sprachumschaltung übersetzt nur Toolbar und wenige Shell-Teile.
- **Empfehlung**: Runtime nur stabile IDs erzeugen lassen, in `workspace-parts`/Renderer-Schicht bestehende `t()`-Mapping nutzen (zuerst electric/mechanics/magnetic drei Hauptpfade ergänzen).
- **Arbeitsaufwand**: L

#### P1-6 AI-Lernassistent-Drawer: Labels und Antwort-Fließtext vollständig hartcodiert chinesisch

- **Phänomen**: Nach Umschaltung auf Englisch sind Assistenzkarten-Titel, Begründungs-Chips, Vorschlags-Fragen, Antwort-Fließtext, Aktions-Buttons alles chinesisch.
- **Beleg**: `AgentDrawer.tsx:205/211/217/242` (Frage/Analyse/Operation), `:308` (Highlight:/Einstellungen), `:324-343` (`PARAMETER_LABELS` alles chinesisch); Generierter Fließtext stammt aus `physics-agent-answers.ts` (478 CJK-Stellen) und `physics-tutor.ts` (593 CJK-Stellen) ohne locale-Kanal; `matchIntent` mit chinesischen Keyword-Regexen (`physics-agent-answers.ts:1516-1584`).
- **Auswirkung**: Praktisch unbrauchbar (Hinweis: Begründung/Intro/Unknown sowie TutorCard-Chrome nutzen bereits `t()`, daher nicht "nur Titel übersetzt", aber generierter Fließtext hat definitiv keine englische Quelle).
- **Empfehlung**: Strukturierte Labels (Frage/Analyse/Operation/Hervorhebung/Einstellungen/Parameternamen) in locales auslagern; für generierten Fließtext locale-gate machen (EN: englische Templates oder zh-only kennzeichnen), zuerst Buttons und Labels abdecken. In zh löst `t()` auf Chinesisch auf, bricht `physics-agent.client.spec.tsx:253,255` nicht.
- **Arbeitsaufwand**: M–L

#### P1-7 Aufgabenbereich hartcodiert bereits existierende locale-Keys

- **Phänomen**: Im Englisch-Modus bleiben „Lösungsziel/Bekannte Bedingungen/Warte auf Analyse/Visualisierungsprüfung/Bedingungen vollständig“ usw. chinesisch.
- **Beleg**: `overlays/.../QuestionWorkspace.tsx:1164`(`title="求解目标"`), `:1173`(`"物理关系"`), `:1151`, `:1171`, `:1179-1180`, `:1182`, `:1449`; `locales.ts:312`(`questions.knowns`), `:313`(`questions.targets`) definiert, aber im ganzen Repo keine `t()`-Referenz (tote Keys).
- **Auswirkung**: Bestehende Übersetzungsschlüssel werden nie genutzt, Englisch-Modus-Bereich bleibt chinesisch. Erreichbar: `LabWorkspace.tsx:133` rendert die Komponente.
- **Empfehlung**: Auf `t('questions.targets')`, `t('questions.knowns')` usw. bestehende Keys umstellen, und für Titel/Leerzustände `questions.targetsEmpty` artige Keys ergänzen.
- **Arbeitsaufwand**: S

#### P1-8 Relative Zeit und Wissenspunkt-Inferenz hartcodiert chinesisch

- **Phänomen**: „Zuletztige Räume“-Liste und „Letztes Experiment fortsetzen“-Karte zeigen in englischer UI weiterhin „3 Minuten vor“ und chinesische Wissenspunkte.
- **Beleg**: `overlays/.../workspaceMeta.ts:32-39` ('gerade eben/Minuten vor/Stunden vor/Tage vor', `:39` fix `toLocaleDateString('zh-CN')`), `:12-20` (gibt 'Elektromagnetismus/Magnetfeld und Lorentzkraft' usw. zurück); Verwendungsstellen `HomeActions.tsx:137,150-156`, `ExperimentPicker.tsx:223`, `RecentSpaces.tsx:59`, `LearningRecordWorkspace.tsx:122`.
- **Auswirkung**: Englische UI zeigt chinesische relative Zeit und Wissenspunkte; englische Titel matchen chinesische Regex nicht, fallen immer auf chinesischen Fallback zurück.
- **Empfehlung**: `Intl.RelativeTimeFormat`/`Intl.DateTimeFormat` nutzen (aktuelles Locale); subject/topic über `t()`. zh-Default beibehalten für Kompatibilität zu `overlay.client.spec.tsx:211,249-253`.
- **Arbeitsaufwand**: S–M

#### P1-9 Prüf-/Selbsttest-Statuswörter hartcodiert, mittel-englisch gemischt

- **Phänomen**: Englisch-Modus zeigt chinesische Statuswörter, Chinesisch-Modus mischt `PASS/FAIL` ein.
- **Beleg**: `workspace-parts.tsx:387` ('bestanden'/'Warnung'/'nicht bestanden'), `:403`('Szenenstruktur'), `:406`, `:415`; `LabSelfCheckCard.tsx:157,161` (`PASS`/`FAIL`/'Warnung'/'Wiederholung empfohlen'); `TutorCard.tsx:119`; `LearningRecordWorkspace.tsx:41-45,119` (Konzept/Richtung/Modellierungsfehler). Zum Vergleich bestehende Lokalisierung: `PhysicsWorkspace.tsx:229-230` und `QuestionWorkspace.tsx:1597` nutzen bereits `t()`.
- **Auswirkung**: Optisch mittel-englisch gemischt (Aufgabensammlung/Vortragsnotizen/Wissenspunkt-Labels sind alles chinesische DATEN, ohnehin schon großteils chinesisch).
- **Empfehlung**: Vereinheitlicht über `t()` laufen, **neu** `lab.status.passed` etc. Keys anlegen (`zh='PASS'`) statt bloß `questions.verified` wiederzuverwenden (dessen zh='已验证', würde `tests/learning.client.spec.tsx:173` Assertion '… · PASS' brechen).
- **Arbeitsaufwand**: S–M

#### P1-10 AI-Lernassistent-Drawer ist nicht tastatur-modal: kein Esc, Fokus nicht zurückgeben

- **Phänomen**: Tastatur/AT-Nutzer öffnen Assistenten, Esc schließt nicht, nach Klick auf Schließen landet Fokus im body.
- **Beleg**: `overlays/.../AgentDrawer.tsx:144` (`<aside aria-label>`, kein Esc, kein `.focus()`); beim Öffnen des Drawers wird Auslöser-Button unmounted (`PhysicsWorkspace.tsx:414`), `onClose` nur `setAgentOpen(false)` (`:607-616`), gibt Fokus nicht zurück.
- **Auswirkung**: Reproduzierbare Tastatur-Zugänglichkeits-Rauheit; Schließen-Button per Tab noch erreichbar.
- **Empfehlung**: `ResponsiveInspector` Esc/Fokus-Modus wiederverwenden (`ResponsiveInspector.tsx:42-47,89-91`). **Achtung**: Kein `role="dialog"`/`aria-modal` hinzufügen — dieser Drawer ist nicht-modale Seitenleiste (kein Backdrop), `tests/workspace-presentation.client.spec.tsx:104` prüft Rolle `complementary`, Änderung zu dialog bricht Test und ist semantisch falsch.
- **Arbeitsaufwand**: S

#### P1-11 persistProfile ohne try/catch, bei Quota-Überschreitung Profilwechsel still fehlschlagend

- **Phänomen**: Bei `localStorage`-Schreibfehler bleibt Profil-Chip beim alten Profil, Store wird nicht aktualisiert, ungefangener Promise-Rejection entsteht.
- **Beleg**: `overlays/.../profile-store.ts:63-65` (`storage?.setItem` ohne try/catch); `:123-127` (`select()` schreibt erst in `:124` localStorage, dann Store-Update); `PhysicsProfileSeat.tsx:71-74` (`void select(id)` ohne catch). Zum Vergleich gleiche-Paket-Konvention: `ExperimentPicker.tsx:99-104`, `learning-record-store.ts:87-91`, `surface-store.ts:121-125` haben alle try/catch.
- **Auswirkung**: Quota-Überschreitung (gleiche Origin speichert auch Szenen-JSON, real erreichbar) führt zu stillem Fehlschlag, `state.error` wird auch nicht gesetzt, User ohne Feedback.
- **Empfehlung**: `persistProfile` in try/catch fassen (Schreibfehler nur loggen, UI nicht blockieren), `select()` Exception abfangen und in `state.error` schreiben, konsistent zu `apply()`. Produktion nutzt `globalThis.localStorage` Konstruktor (`index.ts:173`), Tests ohne storage unbeeinflusst.
- **Arbeitsaufwand**: S

#### P1-12 Lernverlauf-Lesen prüft knowledge-Array nicht, deformierte Fehlertoleranz stürzt ab

- **Phänomen**: Ein Datensatz in localStorage ohne `knowledge` lässt „Lernverlauf“-Seite komplett abstürzen (`for...of undefined`).
- **Beleg**: `overlays/.../learning-record-store.ts:54-58` (filter prüft knowledge nicht), `:111` (`for (const nodeId of attempt.knowledge)` ohne Fallback); `LearningRecordWorkspace.tsx:57` (Render-Body synchroner Aufruf); ähnlicher Absturz betrifft auch `experiment-recommendations.ts:132`.
- **Auswirkung**: Wird nur bei manipuliertem/beschädigtem localStorage ausgelöst (zwei Schreibpfade `LabSelfCheckCard.tsx:79`, `QuestionWorkspace.tsx:1295` schreiben immer Array, Schema ab erstem Commit gefordert), normaler Nutzung nicht erreichbar, daher geringes Risiko.
- **Empfehlung**: `readStored` Filter um `Array.isArray(entry.knowledge)` Bedingung erweitern (oder `attempt.knowledge ?? []` vor Iteration).
- **Arbeitsaufwand**: S

#### P1-13 Berichts-Panel-Statusfarben im Dark-Mode Kontrast ungenügend

- **Phänomen**: Im Dark-Mode haben Berichts-PASS dunkelgrün / FAIL bernsteinfarben auf dunklem Grund ungenügenden Kontrast, inkonsistent mit übrigen Statusfarben derselben Datei.
- **Beleg**: `overlays/.../LabWorkspace.module.css:2530` (`.reportCheckStatus{color:#047857}`), `:2534` (`li[data-status='FAIL'] ... {color:#b45309}`) direkt auf `.reportPanel` 's `var(--dsw-alias-bg-base)`; dieselbe Datei `:2325/:2336/:2380` gleichartige Farben alle als `color-mix(in srgb, ..., var(--dsw-alias-label-primary))` geschrieben, hellen mit Theme mit; `vendor/.../ui-theme/.../design-platform.css:249` Dark setzt `--dsw-alias-bg-base` auf bluish-950; real gemessener Dark-Hintergrund ca. `rgb(21,21,23)`, nackte Farbkontraste ca. 3.3/3.6:1, unter AA.
- **Auswirkung**: Im Dark-Mode Status-Text-Kontrast ungenügend, visuell inkonsistent.
- **Empfehlung**: Wie `:2325` auf `color-mix(in srgb, #047857 50%, var(--dsw-alias-label-primary))` ändern (FAIL analog), passt sich Theme an.
- **Arbeitsaufwand**: S

---

### P2 — Polishing / Gelegenheiten (geringes Risiko, User kaum spürbar oder reine Code-Hygiene)

#### P2-1 „43 alle Experimente“ inkonsistent mit tatsächlich gerenderten 44 Karten im Grid

- **Phänomen**: Zwei Zahlen auf gleichem Screen stimmen nicht — Grid plus Fach-Shelf-Badges summieren 44, Header/Footer aber stehen 43, Label wörtlich „alle Experimente“.
- **Beleg**: `ExperimentPicker.tsx:246-247`, `:474-476` (rendert `SELECTABLE_TEMPLATE_COUNT`) + `:413` (shelf Badge = Gruppen-Template-Anzahl) + `:417-431` (comingSoon-Karte trotzdem als disabled gerendert); `locales.ts:246` (`lab.template.picker.allTemplates`='alle Experimente'); `experiment-templates.ts:978` (cyclotron einzige `comingSoon:true`), `:1146-1148` (`SELECTABLE_TEMPLATE_COUNT=43`).
- **Auswirkung**: Nutzer, die Karten einzeln zählen, wähnen Fehlberechnung.
- **Empfehlung**: Entweder—Label in „verfügbare Experimente“ ändern und bei 43 „zuzüglich 1 bald verfügbar“ ergänzen, oder Zählung comingSoon einschließen und 44 anzeigen. Paket-intern keine betreffenden Tests.
- **Arbeitsaufwand**: S

#### P2-2 Nicht referenzierte doppelte mechanics-Template-Registrierung `mechanics-templates.ts` (Toter Code)

- **Phänomen**: Existiert zweite Mechanics-Liste, dupliziert 6 Templates mit `experiment-templates.ts`.
- **Beleg**: `overlays/.../physics/mechanics-templates.ts:49` (`MECHANICS_TEMPLATE_GROUPS`, kinematics/projectile/dynamics); Repo-weiter grep findet keinen Import; `locales.ts:134-136` (zh)/`526-528` (en) drei Gruppen-Keys werden nur von dieser toten Datei referenziert (verwaiste Strings); Datei nur in `3766c5e` hinzugefügt, seither unverändert. `:45-48` feste sceneId sind genau die alte Schreibweise, die `experiment-templates.ts:148-150` `stampId` vermeiden will.
- **Auswirkung**: Wenn Wartende die toten Dateien ändern, ändert sich die Benutzeroberfläche nicht, und es müssen zusätzlich drei verwaiste locale-Schlüssel untersucht werden (für den Nutzer nicht wahrnehmbar).
- **Empfehlung**: `mechanics-templates.ts` löschen, `locales.ts:134-136` (und die entsprechenden en-Schlüssel) drei verwaiste group-Schlüssel entfernen, `experiment-templates.ts` als einzige Quelle festlegen.
- **Aufwand**: S

#### P2-3 ExperimentPicker: Dokumentationskommentar oben schreibt noch „38 templates“

- **Phänomen**: Kommentar und Implementierung driften auseinander.
- **Beleg**: `ExperimentPicker.tsx:12` („…so 38 templates read as eleven short shelves…“); deckt sich mit historischem Wert 38 in `docs/reports/MILESTONES.md:422`.
- **Auswirkung**: Spätere Wartende schätzen Kataloggröße falsch ein (glauben 38 Stück). Betrifft nur Kommentar.
- **Empfehlung**: Auf 43 (erstellbar)/44 (inkl. bald unterstützt) aktualisieren, oder konkrete Zahl entfernen.
- **Aufwand**: S

#### P2-4 ExperimentTemplate.icon-Feld und ca. 35 Icon-Imports werden nie gerendert

- **Phänomen**: Jedes Template trägt eine Referenz auf eine React-Komponente, die niemals gerendert wird.
- **Beleg**: `overlays/.../physics/experiment-templates.ts:126` (Deklaration icon), `:55-92` (Import von 35 Icons), 44 Einzelzuweisungen; im gesamten Repo kein `template.icon` Verbraucher, Selektorkarten nutzen `ExperimentPicker.tsx:433-434` mit `<ExperimentArt/>`.
- **Auswirkung**: Bereinigbare tote Daten/Imports.
- **Empfehlung**: icon-Feld und zugehörige Imports löschen; falls als reservierter Vertrag gedacht, eine Kommentarzeile hinzufügen, dass die Verbraucherseite noch nicht angebunden ist. (Hinweis: Einige der importierten Icons dienen auch als Schlüsselwerte in `physics-icons.tsx:614` SCENE_TREE_ICONS – dort nicht versehentlich löschen.)
- **Aufwand**: S

#### P2-5 Mechanische Welle wave-travelling als „Mittelstufe“ gekennzeichnet, inkonsistent mit anderen Templates der Gruppe und zweifelhaft

- **Phänomen**: `wave-travelling` hat `stage:'junior'`, Tags enthalten 'Mittelstufe'/'v = λf', gleichgruppige `wave-interference`/`wave-standing` sind beide senior.
- **Beleg**: `overlays/.../physics/experiment-templates.ts:1081,1085` (junior + 'Mittelstufe'), `:1096,1100`/`:1112,1116` (senior/'Oberstufe'), `:1087-1088` (Kommentar bezeichnet selbst Aufbau von v=λf), `:109-112` (junior Abdeckungsbeispiele enthalten keine mechanischen Wellen/Wellengeschwindigkeit); `ExperimentPicker.tsx:161` (stage steuert Mittelstufe/Oberstufe-Filter, sodass Mittelstufenschüler v=λf-Inhalte sehen).
- **Auswirkung**: Falls Einstufung falsch, mischt Mittelstufen-Filter überfordernde Inhalte ein. Im Repo keine Lehrplan-Grundlage (**Verdachtsfall**).
- **Empfehlung**: Gegen Lehrplan prüfen; falls v=λf zur Oberstufe gehört, `wave-travelling` in senior einordnen. Tests prüfen nur stage-Gültigkeit und Mindestanzahl (`overlay.client.spec.tsx:808-828`), Neuzuordnung bricht nichts.
- **Aufwand**: S

#### P2-6 Fach electric: Beschriftungen „Elektrisches Potenzial/Energie/Geometrie-Annotation“ gelangen nicht in den Baum, Sichtbarkeitsbits ohne Verbraucher

- **Phänomen**: In der Seitenleiste sind keine Schalter für elektrisches Potenzial/Energie/Geometrie-Annotation sichtbar.
- **Beleg**: `overlays/.../physics/electric-workspace-runtime.ts:122-140` (`OBSERVABLE_LABELS` definiert drei Einträge, aber `observableKeyOf` gibt für diese drei Typen `undefined` zurück, gelangen daher nie in den Baum); `electric-visual-bridge.ts:131-132` (berechnet `visible.potential/energy` aber ohne Verbraucher).
- **Auswirkung**: Geringfügige Bereinigung (Hinweis: Canvas Δφ/K-Messwerte **werden sehr wohl** von der Beobachtungsschicht konsumiert und über das visible-Bit des Szenario-Observables gesteuert – Lab-Template default potential=false zeigt kein Δφ, nur im Prüfungs-Szenario potential=true wird es angezeigt – die Behauptung „Canvas konsumiert nicht“ wurde bereits korrigiert).
- **Empfehlung**: Für die drei Einträge Knoten im Baum anlegen und Messwerte über deren visible-Bit steuern; oder diese drei `OBSERVABLE_LABELS` mitsamt Sichtbarkeitsbits löschen, auf die 5 baum-konsistenten Einträge reduzieren.
- **Aufwand**: S

#### P2-7 Vereinzelte Hardcodings: nicht unterstützter Szenen-Hinweis, Canvas aria-label, Download-Dateiname

- **Phänomen**: Im Englisch-Modus liest der Screenreader den Canvas-Namen auf Chinesisch („…的可验证物理画布“), Szenen-Hinweis nicht unterstützt, Download-Dateiname-Suffix ebenfalls auf Chinesisch.
- **Beleg**: `LabWorkspace.tsx:173-174` (kein Hinweis unterstützt, wird ausgelöst wenn `domainOfScene` 'unsupported' zurückgibt); diverse runtimes mit `${title}的可验证物理画布` (mechanics`:48`, electric`:393/460`, circuit`:335`, optics`:230`, acoustics`:254`, fluid`:256`, thermal`:283`) → `PhysicsCanvas.tsx:344-348` landet im `role="img"` aria-label; `ExperimentReportPanel.tsx:36` (Download-Name `${title}-实验报告.md`); `locales.ts:276` (`lab.mechanics.canvasSuffix` bereits für zh/en definiert aber null Referenzen).
- **Auswirkung**: AT-Nutzer im Englisch-Modus hören Chinesisch; Fehlermeldungen auf Chinesisch.
- **Empfehlung**: Canvas-Suffix auf `t('lab.mechanics.canvasSuffix')` umstellen (erfordert Injektion von t in runtime oder Zusammensetzung in der Shell); für nicht unterstützten Hinweis und Download-Namen locale-Schlüssel hinzufügen. Hinweis: Runtime-Schicht insgesamt auf Chinesisch (`electric-workspace-runtime.ts:346/389/431` etc.), alleinige Änderung von canvasSuffix löst nicht die gesamte Schicht.
- **Aufwand**: S–M

---

## 3. Funktionsbestand (was das Produkt aktuell tatsächlich leistet)

| Bereich            | Fähigkeit                                                                                                                                   | Abdeckung / Status     | Anmerkung (Problemanummer)                                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| Startseite / Navigation     | Marke, Hero, Ambient-Animationen, HomeActions, Seitenleisten-Navigation und Neuanlegen                                                                                      | Verfügbar            | „Letztes Experiment fortsetzen“ und „kürzliche Bereiche“ geben relative Zeit/Wissenspunkte auf Chinesisch preis (P1-8)                                                    |
| Experimentzentrum        | Nach Fach in 11 Shelves, 44 Templates, 43 erstellbar                                                                                           | Verfügbar            | Zählung 43 vs. Grid 44 inkonsistent (P2-1); Kommentar verharrt bei 38 (P2-3)                                                       |
| Fach / Canvas       | 13 Runtimes: mechanics, electric, magnetic, circuit, optics, acoustics, wave, fluid, thermal, composite, induction, lever, collision | Grundsätzlich verfügbar        | wave/induction teilweise Sichtbarkeits-Schalter wirkungslos (P1-2/1-3); magnetic ohne Interaktion und Ableitungen/Ereignisse dauerhaft leer (P1-4); electric tote Labels (P2-6) |
| Direkte Schaltkreis-Bedienung    | Task 3 in Arbeit: Schaltkreis-Renderer/Canvas-Stile bereits geändert, Tests grün                                                                                       | In Bearbeitung          | Bei dieser Bestätigung keine schaltkreisspezifischen Mängel gefunden                                                                                 |
| Geräte 3D-Sprites    | `parts3d` Assets (battery/resistor/switch/voltmeter usw. png+json+manifest)                                                               | Integriert          | Mit Task 2 umgesetzt                                                                                               |
| Aufgabenbereich        | QuestionWorkspace: Parsen→Validieren→Szenario bauen→Lösen→Darstellen, eingebaute `GOLDEN_QUESTIONS`                                                                 | Verfügbar (mit Mängeln)  | 5 P0-Fehlerantworten + AMBIGUOUS-Mehrdeutigkeit nicht dargestellt (P1-1) + harte Codierung bestehender Keys (P1-7)                                        |
| Lernverlauf        | Lokales Selbstbewertungs-Journal (`learning-record-store`), Kompetenz-Aggregation                                                                                    | Verfügbar            | Missgebildete Speicherung kann Seitenabsturz verursachen (P1-12); Statuswörter hardcodiert (P1-9)                                                              |
| KI-Lernassistent         | AgentDrawer (Fragen/Anleitung/Selbsttest drei Tabs), TutorCard, LabSelfCheckCard, Keyword-Intent-Matching                                                       | Verfügbar (V1 Chinesisch) | Labels/Flusstext hardcodiert chinesisch (P1-6); nicht tastaturbedienbares Modal (P1-10)                                                             |
| Experimentbericht        | Panel + Markdown-Export (`ExperimentReportPanel`)                                                                                        | Verfügbar (nur Chinesisch)  | Inhalt sind Runtime-Snapshot-Daten, Lokalisierung erfordert Engine-Änderung; Dunkelmodus Status-Farben Kontrast ungenügend (P1-13)                                       |
| Inspektor / Szenebaum | ResponsiveInspector, workspace-parts (Tab-Zyklus + Esc + Fokus-Management)                                                                      | Verfügbar            | Dessen Texte gehen nicht durch t() (P1-5)                                                                                       |
| Schülerprofil        | Drei Lehrmodi (alle auf `physics-student` abgebildet), persist/select                                                                               | Verfügbar (Platzhalter-Art)  | Wechsel ändert nur Label; Kontingentüberschreitung scheitert still (P1-11)                                                                      |
| Internationalisierung          | zh/en zweisprachige Wörterbücher je 386 Keys, Sprachumschalter                                                                                                      | Teilweise            | Runtime und zahlreiche Komponenten umgehen locale (P1-5/6/7/9, P2-7)                                                            |
| Engine / Aufgaben-Pipeline | Root `packages/`: physics-scene, engine-mechanics/electric-region, question-core, agent-tools                                            | Verfügbar (mit Mängeln)  | Drei P0 Engine/Builder-Mängel (P0-1/2/4)                                                                          |

---

## 4. Unzureichende Evidenz / Nicht verifiziert

**Eingabe unvollständig**

- Aufgabe behauptet 28 bestätigte Funde, aber Eingabeliste bricht bei Fund 25 (Berichtspanel Dunkelmodus-Kontrast) ab, dessen verdict-Text ebenfalls abbricht; **die restlichen 3 Funde nicht geliefert**, dieser Bericht erfindet sie nicht nach.
- Fehlen 3 Funde, sodass „Abdeckung aller 28 Funde“ nicht garantiert werden kann; Schweregradeinstufung von P1-13 anhand der vor dem Abbruch vorliegenden Evidenz (`verified:false` aber `verdict.refuted:false`) als geringfügig behandelt.

**Findings intern als nicht verifiziert/verdachtsfall markiert**

- **P2-5 wave-travelling Lernabschnitt**: Im Repo keine autoritative Lehrplan-Grundlage, `repo-Kommentare` zu Mittelstufen-Abdeckung listen ebenfalls keine mechanischen Wellen auf; ob „Mittelstufe“ korrekt ist, **erfordert externe Lehrplan-Prüfung**, dieser Bericht bestätigt nur „gemischte Lernabschnitte in derselben Domäne sind Normalfall, Kernverdacht besteht“.
- **P0-3 electric-10 Betroffene-Liste**: `electric-16` und `electric-10` haben dieselben Gegebenheiten, daher kollidiert deren „7,96×10⁻³ m“ Sondenwert mit der Test-Assertion 2,811×10⁻³, **dieser Zahlenwert ist nicht reproduzierbar** (electric-18 würde beim ersten „Plattenlänge“ 0,12 statt 6 cm parsen); aber „Löserschicht greift falsche Ableitungsgröße“ als Root Cause steht.
- **P1-4 magnetic „Ereignisse“-Tab**: Finding gibt selbst nach – im homogenen Feld keine diskreten Ereignisse könnte gewollte Vereinfachung sein; hier nur Bestätigung „Trajektorien-Interaktion fehlt + Ableitungen dauerhaft leer“.
- **P1-6 Assistenten-Flusstext**: Generative Antworten und Keyword-Matching sind dokumentiertes **V1 chinesisches Design**, ob lokalisiert werden soll, hängt von Produktentscheidung ab, kein reiner technischer Mangel.
- **Mehrere Stellen „Nutzer wird/nicht …“** (wie P2-6 ursprünglich „Canvas konsumiert nicht“) wurden in adversarialer Verifikation korrigiert; dieser Bericht übernimmt die korrigierte Fassung.

**In widerlegten Punkten aufgedeckte echte Restlücken (keine Funde dieser Runde, nur Registrierung)**

- **KI-Experimentkatalog 33 vs. Lab 44 Templates**: Agent kann fehlende 10 Experimentierstationen nicht öffnen (`progress.md:53` als statisch vermerkt, in dieser Runde nicht umgesetzt).
- **Lab „KI-Assistent“ Q&A-Subtab**: 7 Fach-Panels haben im „Fragen“-Subtab keine Keyword-Intents („Anleitung/Selbsttest“-Tab hat vollständige Kurse).
- **storage nicht verfügbar**: Tatsächlicher Absturzpunkt in `index.ts:80` bei Argumentauswertung (fehlt `safeStorage`), nicht in `profile-store` intern; in dieser Runde nicht behoben.
- **Kürzliche Bereiche**: `readStoredScenes` Filter fehlt `scene !== null`; defekte Blobs führen über `SceneTree`/Slot zum Absturz, aber `SlotErrorBoundary`(`scoped-slots.tsx:317-333`) fängt ab, nur manuelle localStorage-Änderung kann auslösen.
- **Diagramm-Hover-Verknüpfung**: `onHoverTime` ist toter Prop, Uhrzeit-Cursor-Verknüpfung nicht verdrahtet (`TimelineScrubber` kann bereits schrittweise bedienen).
- **Berichtstext-Lokalisierung**: `PASS/FAIL` treiben CSS `data-status` Selektoren an und sind in Tests fixiert (`learning.client.spec.tsx:587/590/591`), Änderung der Statuswörter per Locale würde Styles und Tests brechen – Fix erfordert Lokalisierung der Runtime/Verifier-Label-Schicht, außerhalb des Scope dieses UI-Polishing.
- **Vom Szenario mitgeführte `curriculumTags`/`knowledgeTags`**: Nur Typdeklaration (`scene.ts:65-66`), keine Schreibstelle, „Szenerie-Tags priorisieren“ im UI-Polish-Scope gleich Null-Operation.

---

## Anhang: Alle bestätigten Funde (nach adversarialer Verifikation beibehalten, maschinenexportiert)

Insgesamt 60 ursprüngliche Funde, 28 durch unabhängige Überprüfung bestätigt. Dieser Abschnitt wurde vom Audit-Skript exportiert, um die im Hauptteil aufgrund von Eingabeabbrüchen fehlenden Einträge zu ergänzen.

1. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

2. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

3. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

4. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

5. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

6. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

7. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

8. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

9. **(kein Titel)** — /
   - Auswirkung:
   - Empfehlung:

10. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

11. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

12. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

13. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

14. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

15. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

16. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

17. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

18. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

19. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

20. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

21. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

22. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

23. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

24. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

25. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

26. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

27. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:

28. **(kein Titel)** — /

- Auswirkung:
- Empfehlung:
