# ADR-0003: Exam Standard Runtime (Laufzeit für Prüfungsstandards)

- Status: angenommen / Umsetzung im Gange (Verträge und Verifizierer wie ExamProfile und OfficialSourceRegistry werden parallel entwickelt; dieses Dokument behauptet nicht, dass die Runtime bereits live oder nutzbar ist)
- Datum: 2026-09-27
- Entscheider: PhysicsOS Maintainer
- Zugehörige Dokumente / PRs: `docs/ROADMAP.md`, `docs/02-ENGINEERING-STANDARDS.md`, `docs/04-AGENT-ARCHITECTURE.md`, `packages/physics-verifier`

## Kontext

Die Klausurerstellungs-Pipeline läuft derzeit Gefahr, missverstanden zu werden: als „KI, die Prüfungsaufgaben schreibt“. Die Zielprovinz und Schulstufe des Owners sind **Physik der Zhongkao- und Gaokao-Prüfungen in Guizhou**. Eine erzeugte Klausur samt Aufgaben, Antworten, Lösungsweg und Bewertungsmaßstab muss durch **versionierte offizielle Standards** gesteuert werden und nicht durch das „Stilgefühl“ des Modells.

Dafür hat der Owner für das Klausursystem zwei harte Regeln festgelegt, die gleich schwer wiegen:

1. **Die physikalische Korrektheit wird von PhysicsOS Engine / Verifier bestimmt, nicht vom Sprachmodell.**
2. **Die Prüfungsnorm wird durch ein versioniertes Official Exam Profile bestimmt, nicht durch die Erinnerung des Sprachmodells.**

Diese beiden Regeln heben die „Prüfungsvertrauenswürdigkeit“ von einer weichen Fähigkeit des Modells auf eine Laufzeitverantwortung, die gleichrangig neben der „physikalischen Vertrauenswürdigkeit“ steht. Die Kosten der derzeitigen Nicht-Entscheidung: Die Klausurerstellung würde als „KI schreibt Aufgaben“ gelesen, die Legitimität jeder Klausur hinge allein an Gedächtnis und Stil des Modells, wäre weder prüfbar noch versionierbar und gegenüber Lehrkräften und Aufsicht nicht zu erklären – nämlich „auf welchem offiziellen Standard welchen Jahres diese Klausur beruht“.

Diese Entscheidung etabliert die **Exam Standard Runtime** als **dritten Burggraben** nach der Physics World Runtime und dem Physics Compiler:

- **Physics World Runtime**: Zustand und Simulation der physikalischen Welt (Scene → Engine).
- **Physics Compiler**: strukturierte Kompilierung und Verifikation physikalischer Probleme (Engine → Verifier).
- **Exam Standard Runtime**: Die Prüfungsnorm selbst wird zu versionierbaren, prüfbaren und erweiterbaren Laufzeitdaten, statt zur Erinnerung des Modells.

## Entscheidung

Die **Exam Standard Runtime** wird eingeführt; sie drückt Prüfungsnormen als versionierte Daten + zwei Verifizierer aus, und jedes Klausurerzeugnis endet als „von Lehrkräften überprüfbare Probeklausur“.

- **Versionierte Profile**: Die Hierarchie lautet `CN → Guizhou → {Zhongkao | Gaokao} → {2024 | 2025 | 2026 …}`. Ein einzelner Boolean-Schalter `guizhou: true` wird ausdrücklich **abgelehnt**, weil sich Prüfungssystem, Klausurstruktur und Aufgabenpolitik jedes Jahr ändern.
- **`ExamProfile`** (jurisdiction `CN-GZ` / stage / subject `PHYSICS` / year) trägt: `curriculumStandard`, `paperBlueprint`, `contentScope`, `questionTaxonomy`, `competencyModel`, `answerStandard`, `scoringStandard`, `officialSources`.
- **Zhongkao und Gaokao sind zwei unabhängige Profile mit unterschiedlichen Curriculum-Wurzeln**: Die Zhongkao verankert sich in den „Physik-Lehrplanstandards für die Pflichtschulbildung (Ausgabe 2022)“; die Gaokao in den „Nationalen Physik-Lehrplanstandards für die allgemeine Oberstufe“, ergänzt um die Prüfungsregelung **3+1+2** mit Wahlfächern in Guizhou (Physik als **Erstwahlfach**, seit 2024 provinzintern eigenständige Aufgabenstellung). Beide dürfen nicht als „dieselbe Vorlage + Schwierigkeitsschalter“ modelliert werden.
- **Terminologie-Entscheidung**: Verwendet wird „**Prüfungsumfang / Curriculum Scope**“, **nicht „Zhongkao-Lehrplan (大纲)“** – das Bildungsministerium hat die Aufgabenstellung nach Prüfungsprogramm (Prüfungsgrundlage „大纲“) abgeschafft und untersagt Aufgaben jenseits der Standards; die Beibehaltung des Begriffs „大纲“ würde eine politisch bereits aufgegebene Formulierung wiederbeleben.
- **`OfficialSourceRegistry` / `OfficialSourceRef`**: Jede Regel trägt eine maßgebliche Quelle (`MOE` / `GZ_EDUCATION_DEPARTMENT` / `GZ_EXAMINATION_AUTHORITY`), Titel, Datum, URL und Geltungsbereich, sodass die Admin-Oberfläche geladene und fehlende offizielle Materialien anzeigen kann (Fehlendes wird als `⚠ nicht bestätigt` angezeigt). **Das System darf nicht so tun, als kenne es nicht geladene Inhalte.**
- **`PaperBlueprint`** (Gesamtpunktzahl, Dauer, Aufgabentyp-Bereiche, Abdeckungsbedingungen, Schwierigkeitsverteilung, maximaler Wiederholungsanteil desselben Modells) stammt aus dem Profil, **niemals vom Modell**. Dieses Dokument kodiert keine Aufgabenzahlen oder Punktwerte fest – diese werden erst eingetragen, nachdem der offizielle Standard des jeweiligen Jahres eingelesen wurde.
- **Formale `QuestionTaxonomy`**: `Choice {Single, Multiple}`; `Experiment {InstrumentReading, ExperimentalDesign, DataProcessing, ErrorAnalysis, InquiryExperiment}`; `Calculation {SingleModel, MultiProcess, Comprehensive}`; `ContextualProblem`. Zusammen mit dem `CompetencyModel` trägt sie sowohl die Kernkompetenzen des Fachs (Physikalische Vorstellungen / Wissenschaftliches Denken / Wissenschaftliche Untersuchung / Wissenschaftliche Haltung und Verantwortung) als auch Wissenspunkt-Tags.
- **Drei Antwortebenen werden streng getrennt**: `FinalAnswer` / `ExamSolution` (nach Prüfungs- und Bewertungsgewohnheit: Formel → Einsetzen → Ergebnis → Einheit, abgeschlossen mit „答:“) / `LearningExplanation` (didaktische Erläuterung). **Eine Vermischung der drei ist ein Defekt.**
- **Strukturierter `ScoringPoint { id, score, criterion, evidence ∈ EQUATION | SUBSTITUTION | RESULT | UNIT | DIRECTION | REASONING }`**; die Punkteaufteilung stammt aus dem bestätigten Bewertungsstandard-Profil.
- **Zwei Verifizierer mit unterschiedlichen Aufgaben**: `PhysicsVerifier` prüft, „ob die Physik stimmt“; `ExamComplianceVerifier` prüft „im Umfang / Aufgabentyp zulässig / Punktwert zulässig / Antwortformat zulässig / Schwierigkeit im Zielbereich / Blueprint-Abdeckung erfüllt“. Er gibt einen `ExamComplianceReport` aus, der die genannten Dimensionen abdeckt und die geltende Source-Profile-ID beifügt; Endpunkt ist `READY_FOR_TEACHER_REVIEW`.
- **Prinzip gegen vermeintlich Offizielles (deutlich festgehalten)**: Erzeugte Produkte müssen als **PhysicsOS-Probeklausur / keine offizielle Klausur** gekennzeichnet sein; das System **darf** seine Ausgabe **nicht** als offizielle Klausur darstellen und **sich nicht selbst zertifizieren**. Die Prüfung durch Lehrkräfte bleibt stets im Ablauf.
- **Erweiterung per Daten**: Eine neue Provinz oder die landesweite neue Gaokao ist lediglich ein neues versioniertes **Exam Standard Pack**; **im Engine-Code gibt es keine Guizhou-spezifischen Verzweigungen**.
- **Offizielle Daten werden nie erfunden**: Jeder nicht geladene offizielle Standard, Blueprint-Wert oder Quellenmetadaten ist ausnahmslos als nicht bestätigt zu markieren (`⚠ nicht bestätigt` / `zu prüfen`) und wartet auf den Owner; Ergänzungen aus dem Gedächtnis des Modells sind unzulässig.

### Vom Owner angeführte offizielle Grundlagen (wörtlich übernommen; Einträge mit unbestätigten Metadaten sind mit `zu prüfen` markiert)

> Die folgenden Einträge sind der Wortlaut der vom Owner gelieferten Verweise. **Dieses Repository hat deren URL, Aktenzeichen und Inkrafttretensdatum noch nicht verifiziert.** Der Owner hat keine überprüfbare URL geliefert, daher wird nichts erfunden und alles mit `zu prüfen` markiert.

| Verweis (Originalwortlaut)                                                                                                                         | Ebene                                           | Metadaten                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------ |
| Bildungsministerium „Physik-Lehrplanstandards für die Pflichtschulbildung (Ausgabe 2022)“ als Wurzelgrundlage für Aufgaben der Mittelstufe          | MOE / Wurzelgrundlage für Aufgaben der Mittelstufe | zu prüfen (URL, Aktenzeichen nicht geliefert) |
| Bildungsministerium „Physik-Lehrplanstandards für die allgemeine Oberstufe“ (Revision 2020) als inhaltliche Grundlage für die Oberstufe             | MOE / Inhaltsgrundlage Oberstufe                | zu prüfen (URL, Aktenzeichen nicht geliefert) |
| Anforderung des Bildungsministeriums, dass die Abschlussprüfung der Mittelstufe nach den Lehrplanstandards gestellt wird, keine Aufgaben über die Standards hinaus gestellt werden und die Prüfungsprogramm-artige Aufgabengrundlage abgeschafft wird | MOE / Aufgabenpolitik                           | zu prüfen (URL, Aktenzeichen nicht geliefert) |
| Guizhou führt ab 2024 das System 3+1+2 ein, Physik ist Erstwahlfach, die Wahlfachprüfungen werden provinzintern eigenständig gestellt              | GZ_EDUCATION_DEPARTMENT / Gaokao-System         | zu prüfen (URL, Aktenzeichen nicht geliefert) |
| Landesweit einheitliche provinzielle Aufgabenstellung der Zhongkao in Guizhou (2024 das zweite Jahr, Fächer umfassen Physik im integrierten Naturwissenschaftsfach) | GZ_EXAMINATION_AUTHORITY / Zhongkao-System      | zu prüfen (URL, Aktenzeichen nicht geliefert) |

## Konsequenzen

- Positiv: Die Prüfungsnorm wird von der Erinnerung des Modells zu versionierbaren, prüfbaren Daten; physikalische Korrektheit und Prüfungskonformität werden von zwei unabhängigen Verifizierern jeweils abgesichert; die getrennte Behandlung von Zhongkao / Gaokao verhindert die Vermischung der Curriculum-Wurzeln; eine neue Provinz oder neue Gaokao ist nur ein neues Datenpaket; die Stelle der Lehrkraft-Prüfung ist klar (`READY_FOR_TEACHER_REVIEW`).
- Negativ: Das gesamte Exam-Standard-Pack-Datenwerk und die `OfficialSourceRegistry`-Metadaten müssen gepflegt werden und mit den jährlichen offiziellen Standards fortlaufend aktualisiert werden; nicht geladene Quellen müssen dauerhaft `⚠ nicht bestätigt` anzeigen, bis zur Ergänzung darf die betreffende Fähigkeit nicht als nutzbar gelten; zwei Verifizierer verursachen zusätzlichen Prüfaufwand.
- Nachzuverfolgen: Die Verträge `ExamProfile` / `OfficialSourceRegistry` / `PaperBlueprint` / `QuestionTaxonomy` / `AnswerStandard` / `ScoringRubric` und der `ExamComplianceVerifier` werden parallel umgesetzt; die Admin-Oberfläche muss geladene und fehlende offizielle Quellen anzeigen können; bis der offizielle Standard des jeweiligen Jahres gelesen wurde, bleiben die Blueprint-Werte unbestätigt.
- Umgesetzt: Nichts. Diese ADR hält nur die Entscheidung fest und behauptet nicht, dass die Exam Standard Runtime live ist.

## Offene Fragen (Open Questions)

Die folgenden Fragen werden in dieser ADR **aufgeführt, nicht gelöst**:

1. **Korpus offizieller Originalaufgaben (official-exam-corpus)**: Dieser Schritt erfordert echte, ordnungsgemäß lizenzierte Aufgaben früherer Jahre und berührt Urheberrechts- und Lizenzfragen. **Der Korpus wird bewusst vorerst nicht aufgenommen**; zuerst sind Autorisierung / Lizenz zu klären, bevor über die Erfassung gesprochen wird.
2. **Fehlende Blueprint-Werte für Guizhou 2026**: Im Repository liegen keinerlei Blueprint-Werte für Guizhou 2026 vor. Bis der Owner sie liefert, muss die Runtime für die betreffenden Felder **unbestätigt** melden und darf nicht mit Modellgedächtnis oder Daten früherer Jahre auffüllen.

## Alternativen

- **Einzelner Boolean-Schalter `guizhou: true` + Schwierigkeitsparameter**: verworfen. Er presst jährlich wechselndes Prüfungssystem, Klausurstruktur und Aufgabenpolitik in eine statische Markierung und würde Zhongkao und Gaokao zwingen, dieselbe Curriculum-Wurzel zu teilen, was dem Prinzip „zwei unabhängige Profile, unterschiedliche Curriculum-Wurzeln“ direkt widerspricht.
- **Dem Modell nur einen Prompt zum „Guizhou-Aufgabenstil“ geben**: verworfen. Er verlagert die Legitimität auf Gedächtnis und Stil des Modells, verstößt gegen Regel 2 der beiden harten Regeln, das Produkt wäre weder prüfbar noch versionierbar und könnte nicht belegen, auf welchem offiziellen Standard welchen Jahres es beruht.
- **Ein großes, allumfassendes ExamProfile, das per Laufzeitverzweigung an jede Provinz angepasst wird**: verworfen. Es würde provinzspezifische Verzweigungen (etwa Sonderbehandlung für Guizhou) in die Engine einführen, im Widerspruch zum Ziel „Erweiterung per Daten, keine Provinzverzweigungen in der Engine“; eine neue Provinz soll nur ein neues Exam Standard Pack sein.
- **Die Exam Standard Runtime vorerst nicht einführen und zuerst die Klausurfunktion bauen**: vorerst nicht gewählt. Es würde das Missverständnis „KI schreibt Aufgaben“ aufrechterhalten und die Kosten der Normen-Governance auf die Zeit verschieben, in der die Produkte bereits nach außen gegangen sind; die Kosten hier sind überwiegend einmalige Datenmodellierung und Quellenregistrierung, früh erledigt ist das billiger als Nacharbeit.
