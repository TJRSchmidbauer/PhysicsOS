# Verifikations-Screenshots der Sitzung 2026-09

Diese Bilder dienen der **Prozessdokumentation** und sind keine Abnahmebasis dieses Projekts.

Sie lagen ursprünglich verstreut im Wurzelverzeichnis des Repositorys (bei den mehrfachen UI-Feinschliff-Runden innerhalb einer Woche wurden
Screenshots per `playwright` nebenbei dort abgelegt) und wurden beim Abschluss am 2026-09-21 hier zusammengeführt, sodass im Wurzelverzeichnis nur noch Quellcode und Konfiguration liegen.

Nach Themen gruppiert:

| Präfix                                                       | Thema                                                          |
| ------------------------------------------------------------ | -------------------------------------------------------------- |
| `audit-*`                                                    | Domänenweites Audit (Startseite / Labor / Auswahl / Aufgabe)   |
| `authgate-*`                                                 | Login- und Registrierungsschranke                              |
| `lab-agent-*`                                                | Drawer-Formen des KI-Assistenten im Labor (angedockt / Seitenleiste / Scheitelpunkt) |
| `library-*`                                                  | Ressourcenbibliothek (Surface / v2-Kapitel / Originalklausur-Bibliothek) |
| `paper-*`                                                    | Klausurbereich (Iterationen v2–v5 / Redesign / Zustände / Verifikationsaufgaben) |
| `*-card*.png` / `old-conv-card.png` / `turn-card-docked.png` | Sitzungskarten und Rundenkarten                                |
| `answer-with-analysis.png`                                   | Antwort mit Lösungsanalyse                                     |

**Die offiziellen Abnahmenachweise liegen eine Ebene höher** (`docs/reports/screenshots/*.png`); ihre Namen tragen
die Viewport-Größe (`-1440x900` / `-1600x900` / `-1920x1080`), sie werden von den Skripten
`tests/acceptance/*-acceptance.mjs` erzeugt und in den jeweiligen Berichten einzeln zitiert.

Die Bilder in diesem Verzeichnis haben **kein** Gate-Skript und werden von keinem Bericht zitiert – im Verlauf der Iteration kann dieselbe Seite
in mehreren Versionen vorliegen (z. B. `paper-v2` → `paper-v5`); sie werden aufbewahrt, um den damaligen Zwischenstand nachvollziehen zu können.
Um zu beurteilen, „wie es jetzt aussieht“, sind die offiziellen Screenshots eine Ebene höher heranzuziehen oder das passende Acceptance-Skript lokal auszuführen.
