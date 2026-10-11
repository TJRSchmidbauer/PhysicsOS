# PhysicsOS Roadmap

Diese Roadmap wird nach „Veröffentlicht / In Arbeit / Geplant“ gepflegt. Einträge „In Arbeit“ gelten nicht als bereits nutzbar; der konkrete Funktionsstand richtet sich nach Code, Tests und Release-Aufzeichnungen.

## Veröffentlicht

| Fähigkeit              | Aktueller Stand                                                                                      | Priorität |
| ---------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| Produktions-Deployment | Docker Compose betreibt `app + postgres + redis`, unterstützt Secret-Dateien, `/healthz`, `/readyz` und HTTPS-Reverse-Proxy | P0 |
| Kontosystem            | Schul-Mandanten, Berechtigungen für Schüler / Lehrkräfte / Administratoren, Sessions und Warteschlange für einmalige Passwort-Resets | P0 |
| Synchronisation des Lernverlaufs | Persönlicher Lernverlauf, Fehleraufgaben und Szenenzustand werden geräteübergreifend synchronisiert | P0 |
| Klausurbereich         | Intelligente Klausurzusammenstellung, Prüfung durch Lehrkräfte, A4-Export sowie Übernahme von Bildern / PDFs | P1 |
| Experimentzentrum      | 12 Physikdomänen, einschließlich Zyklotron mit zeitveränderlichem Feld und Photoeffekt-Modell der modernen Physik | P0 |
| Geräteübergreifende Nutzung | Responsive Desktop- und Handy-Layouts; die Desktop-Shell unterstützt den lokalen Harness-Servermodus | P1 |
| Runtime-Infrastruktur  | PostgreSQL-Persistenz, gemeinsames Rate Limiting über Redis und Ledger für Einmalwerte               | P0 |
| Open-Source-Governance | Apache-2.0-Lizenz, Beitragsleitfaden, Verhaltenskodex, Sicherheitsrichtlinie, Issue- / PR-Vorlagen und CI-Gates | P1 |
| Registrierung per Einladungscode | Registrierungsrichtlinie mit den drei Zuständen `open / invite / closed`, mandantenbezogene Einladungscodes, atomarer Verbrauch und Admin-Verwaltungsseite | P0 |
| TOTP-Zwei-Faktor      | TOTP-Registrierung für Administratoren / Lehrkräfte, Login-Challenge und Wiederherstellungscodes; ob Produktionskonten es aktivieren, entscheidet der Administrator | P0 |
| Persönliche API-Tokens | Hash-Speicherung, `read / write`-Scope, Klartext wird nur einmal bei der Erstellung zurückgegeben, widerrufbar | P1 |
| Audit und Betriebsoberfläche | Audit-Liste / Export-API für Administratoren, Audit des Modellschlüssel-Pools, Bedienfeld für Festplatte und Laufzeitstatus, 15-Sekunden-Cache | P1 |
| Kontobezogene Sitzungsspeicherung | Kontoprivater Workspace, Sitzungen nach `<schoolId>/<userKey>/<sessionId>` geschichtet, Besitzfilterung und Migration des alten Layouts | P0 |

## In Arbeit

| Fähigkeit                | Stand                                                                                                                                                   | Priorität |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Aufgabenstichproben für die öffentliche Beta | Mit echten Aufgaben der Mittel- und Oberstufe die Pfade für Sensitivwortfilter, Tool-Aufrufe und Verweigerungsantworten des Modell-Gateways eines Drittanbieters abdecken | P0 |
| Vollständige Notfallwiederherstellung | PostgreSQL-Backup ist vorhanden; Offsite-Backup von Redis + `app_data`, Wiederherstellung und RPO/RTO-Übung stehen noch aus | P0 |
| Signierte Desktop-Verteilung | Das Web ist in öffentlicher Beta; Signierung für macOS/Windows, Notarisierung, Stores und der Auto-Update-Kreislauf werden bei Bedarf vorangetrieben (optionale Form) | P2 |
| Migration von Harness-Ereignissen | Zwei veraltete synchrone `session.snapshotEvents()`-Aufrufe in `tool-physicsos` (`src/index.ts`, `src/invariant.ts`) sind vorläufig per oxlint-disable unterdrückt und müssen auf die asynchrone Event-API von 0.1.7 migriert werden | P2 |

## Geplant

| Fähigkeit                | Ziel                                                                                                      | Priorität |
| ------------------------ | --------------------------------------------------------------------------------------------------------- | --------- |
| SSO / OIDC               | Anbindung an Identitätsanbieter der Schulen, um die Pflege eigener Konten zu verringern                   | P1        |
| Schul-Whitelist          | Zusätzlich zu Einladungscodes Zulassung per Domäne, Liste oder Genehmigung durch Administratoren          | P1        |
| Benachrichtigungen       | Einen eindeutigen Hauptpfad ergänzen: ungelesene In-App-Hinweise, Web-Push oder E-Mail                    | P1        |
| Mobile Version           | Native oder vollständig verifizierte mobile Nutzung für Handys und Tablets                                | P1        |
| Weiterer Ausbau der Aufgabenbank | Geprüfte Originalaufgaben, Übungen und Lösungen ergänzen und dabei die Grenze „noch zu prüfen“ wahren    | P1        |
| Englische i18n           | Abdeckung von Oberfläche, Berichten und Fehlermeldungen in Chinesisch und Englisch abschließen            | P2        |
| Plugin-basierte Experimente | Eine kontrollierte Erweiterungsgrenze für Experimentmodelle von Drittanbietern bereitstellen           | P2        |
| Alarm-Weiterleitung      | Zusätzlich zu den Schwellenwerten im Bedienfeld E-Mail- / Webhook-Alarme und Bereitschaftsübergabe ergänzen | P2      |
| Manuelles Harness-Upgrade | Dem Upstream-`master` nicht automatisch folgen; nur bei neuen Versionen hinweisen, manuell in einem isolierten Worktree upgraden und erst nach bestandenem vollständigem Gate und Browser-Abnahme veröffentlichen | P2 |

## P0-Abschluss: Vertrauenswürdige Herkunft (Provenance)

> Verified is a property of evidence, not a presentation state.
> „Verifiziert“ ist eine Eigenschaft von Evidenz, kein Anzeigezustand der UI.

Daher dürfen UI, Agent, Paper und Question nicht selbst „verifiziert“ behaupten, nur die Verifikationskette von PhysicsOS (Verifier → Provenance) darf das. P0 wird mit fünf Kriterien abgeschlossen:

1. **Provenance ist ein Fakt, kein Etikett**: `verificationLevel` darf nur aus tatsächlichen Verifier-Prüfungen abgeleitet werden; fehlen `engineId`, `sceneRevision` oder Verifier-Evidenz, wird der Wert auf `UNVERIFIED` herabgestuft. `default: VERIFIED` ist verboten, die UI darf nicht selbst urteilen.
2. **Die UI für „Verifiziert“ konsumiert nur Fakten**: Es darf kein grünes Abzeichen angezeigt werden, nur weil „das Ergebnis unauffällig aussieht“; ohne Provenance wird `Unverified` angezeigt; die UI soll an ein einheitliches Standard-DTO binden, statt Felder seitenweise zusammenzusetzen.
3. **Das CI-Gate muss rot werden können**: Mindestens drei Fixtures – eine vom Modell direkt erzeugte nackte Zahl, ein Wert ohne `sceneRevision` und ein **gefälschtes** `verificationLevel: STRONGLY_VERIFIED` (unzureichende stützende Prüfungen) – das Gate muss bei allen dreien tatsächlich rot melden.
4. **Der Abgang des leeren Agent-Packages ist ausführbar**: Zuerst null Produktionskonsumenten bestätigen, dann löschen; die ADR wechselt von Proposed zu Accepted/Executed; die Dokumentation muss festhalten, dass **der Harness der Agent-Host ist**, und darf nicht andeuten, PhysicsOS pflege eine eigene Agent-Runtime.
5. **Werbetexte werden erst geändert, wenn die Kette durchläuft**: Erst wenn `Paper → Engine → Verifier → Provenance → Verified UI → CI Gate` Ende-zu-Ende wirklich nutzbar ist, wird angefasst, damit „verifizierbar“ ein lauffähiger Fakt statt einer Parole wird.

**P0-Abnahme (Definition von fertig)**:

> Jede für Nutzer sichtbare physikalische Schlussfolgerung, die „Verified“ behauptet, muss auf eine konkrete Scene Revision, Engine, Verifier und echte Prüfungsevidenz zurückverfolgbar sein; andernfalls gilt sie ausnahmslos als Unverified.

Diese Abnahme muss als **Invariante auf Code-Ebene** umgesetzt werden und nicht nur als Richtlinie. Die drei P0-Workstreams werden ohne Einschränkung parallel entwickelt, die Merge-Reihenfolge ist fest `Provenance → Gate → UI`: Die UI darf nicht zuerst landen und dann immer wieder gegen noch wechselnde Typen überarbeitet werden. Die vollständige Aufzeichnung siehe `docs/superpowers/plans/2026-09-27-p0-provenance-program.md`.

## P0.5 Prüfungsvertrauen (Exam Trust)

> Die physikalische Korrektheit wird von PhysicsOS Engine / Verifier bestimmt, nicht vom Sprachmodell.
> Die Prüfungsnorm wird durch ein versioniertes Official Exam Profile bestimmt, nicht durch die Erinnerung des Sprachmodells.

Das Prüfungsvertrauen (P0.5) steht nach dem physikalischen Vertrauen (P0) und vor dem Experiment-Kreislauf (P1): Die Klausurerstellung soll Klausuren, Antworten, Lösungswege und Bewertungsmaßstäbe liefern, die „von Lehrkräften direkt überprüft werden können“, und ihre Normen müssen aus versionierten offiziellen Standards stammen, nicht aus Gedächtnis oder Stil des Modells. Damit wird die Exam Standard Runtime als dritter Burggraben nach der Runtime der physikalischen Welt und dem Physics Compiler etabliert; die vollständige Entscheidung siehe `docs/adr/0003-exam-standard-runtime.md`.

Die Schichtenfolge lautet **P0 Physikalisches Vertrauen → P0.5 Prüfungsvertrauen → P1 Experiment-Kreislauf (Physics Lab) → P2 Lernen und Wachstum (Learning / Growth)**.

**Status: Entwurf beschlossen / Umsetzung in Arbeit** (die folgenden Verträge und Verifizierer werden parallel entwickelt und sind noch nicht veröffentlicht).

| Komponente             | Aufgabe                                                                                                                                                                                                  | Status               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| OfficialSourceRegistry | Erfasst für jede Regel die offizielle Quelle (`MOE` / `GZ_EDUCATION_DEPARTMENT` / `GZ_EXAMINATION_AUTHORITY`, Titel, Datum, URL, Geltungsbereich) und zeigt geladene und fehlende Quellen an; Fehlendes wird als `⚠ nicht bestätigt` angezeigt, das System darf nicht so tun, als kenne es nicht geladene Inhalte | Entwurf beschlossen |
| ExamProfile            | Versioniertes Prüfungsprofil `CN → Guizhou → {Zhongkao \| Gaokao} → {2024 \| 2025 \| 2026 …}` mit Lehrplanstandard, Klausur-Blueprint, Prüfungsumfang, Aufgabentaxonomie, Kompetenzmodell, Antwortstandard, Bewertungsstandard und offiziellen Quellen | Entwurf beschlossen |
| Guizhou Zhongkao Pack  | Exam Standard Pack der Zhongkao Guizhou, verankert in den „Physik-Lehrplanstandards für die Pflichtschulbildung (Ausgabe 2022)“                                                                          | Entwurf beschlossen |
| Guizhou Gaokao Pack    | Exam Standard Pack der Gaokao Guizhou, verankert in den nationalen Physik-Lehrplanstandards für die allgemeine Oberstufe und der Wahlfach-Regelung 3+1+2 in Guizhou (Physik als Erstwahlfach, provinzintern eigene Aufgabenstellung) | Entwurf beschlossen |
| PaperBlueprint         | Gesamtpunktzahl, Dauer, Aufgabentyp-Bereiche, Abdeckungsbedingungen, Schwierigkeitsverteilung, maximaler Wiederholungsanteil desselben Modells; stammt nur aus dem Profil, niemals vom Modell               | Entwurf beschlossen |
| QuestionTaxonomy       | Formale Aufgabentaxonomie: Auswahl{Einfach-, Mehrfachauswahl}, Experiment{Geräteablesung, Versuchsdesign, Datenverarbeitung, Fehleranalyse, Untersuchungsexperiment}, Rechnen{Einzelmodell, Mehrstufig, Umfassend}, Kontextaufgabe | Entwurf beschlossen |
| AnswerStandard         | Drei Antwortebenen streng getrennt: FinalAnswer / ExamSolution (Formel→Einsetzen→Ergebnis→Einheit, abgeschlossen mit „答:“) / LearningExplanation; eine Vermischung ist ein Defekt                       | Entwurf beschlossen |
| ScoringRubric          | Strukturierter `ScoringPoint { id, score, criterion, evidence ∈ EQUATION\|SUBSTITUTION\|RESULT\|UNIT\|DIRECTION\|REASONING }`, die Punkteaufteilung stammt aus dem bestätigten Bewertungsstandard          | Entwurf beschlossen |
| ExamComplianceVerifier | Arbeitsteilung mit dem PhysicsVerifier: im Umfang / Aufgabentyp zulässig / Punktwert zulässig / Antwortformat zulässig / Schwierigkeit im Zielbereich / Blueprint-Abdeckung erfüllt                        | Umsetzung in Arbeit |
| ExamComplianceReport   | Fasst die genannten Dimensionen und die geltende Source-Profile-ID zusammen, Endpunkt ist `READY_FOR_TEACHER_REVIEW`                                                                                     | Entwurf beschlossen |

**Prinzipien gegen vermeintlich Offizielles und „keine erfundenen offiziellen Daten“**: Erzeugte Produkte müssen als **PhysicsOS-Probeklausur / keine offizielle Klausur** gekennzeichnet sein; das System darf seine Ausgabe nicht als offizielle Klausur ausgeben und sich nicht selbst zertifizieren, die Prüfung durch Lehrkräfte bleibt stets im Ablauf; jeder nicht geladene offizielle Standard, Blueprint-Wert oder Quellenmetadatum wird als nicht bestätigt markiert und darf nicht mit Modellgedächtnis ergänzt werden. Aufgabenzahlen und Punktwerte im Blueprint werden nicht fest kodiert, sondern erst eingetragen, nachdem der offizielle Standard des jeweiligen Jahres eingelesen wurde. Der Korpus offizieller Originalaufgaben wird wegen ungeklärter Urheberrechte / Lizenzen **bewusst vorerst nicht aufgenommen**; da die Blueprint-Werte für Guizhou 2026 fehlen, muss die Runtime „nicht bestätigt“ melden.

## P1 Reihenfolge des Experiment-Kreislaufs

Begründung: Innerhalb von 30 Sekunden nach dem Öffnen eines Experiments sollte der Nutzer messen, sondieren, die Zeitleiste der physikalischen Ereignisse ansehen und wiedergeben können – das beweist das Vorhandensein einer echten physikalischen Runtime besser als ein weiteres KI-Panel.

`Measurement Tools → Physics Timeline → Experiment Notebook → Branch Compare → Question → World Visualisierung → Challenge`

Dabei ist das Experiment Notebook der Ort, an dem sich das obige Verhalten niederschlägt, und Challenge der spätere Wachstumseinstieg.

## Pflegeregeln

- Veröffentlichte Fähigkeiten müssen auf `main` reproduzierbare Tests oder Browser-Abnahmenachweise haben.
- Fähigkeiten in Arbeit dürfen nicht mit Platzhalter-Erfolgszuständen als fertig ausgegeben werden.
- Bevor geplante Fähigkeiten in die Entwicklung gehen, sind zuerst Issue, Abnahmekriterien und Rollback-Grenze zu ergänzen.
- Änderungen bei Sicherheit, Lizenz und Datenschutz müssen von den Maintainern geprüft werden.

## Produktgrenze

PhysicsOS ist eine persönliche Plattform für Physikexperimente und Lernen, kein Schul-LMS. Funktionen der Unterrichtsverwaltung wie Klassenverwaltung, Hausaufgabenvergabe, Abgaben der Schüler, Korrektur durch Lehrkräfte und Abschlussquoten-Dashboards gehören nicht zum Produktumfang und wurden aus Client und Runtime-Composition entfernt.
