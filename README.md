# PhysicsOS

> **Gemeinnütziges Open-Source-Projekt**: für den Physikunterricht der Mittel- und Oberstufe (Klassen 7–12), gemeinnützig ausgerichtet. Lizenz siehe [`LICENSE`](./LICENSE) (Apache License 2.0, eine von der OSI zertifizierte Open-Source-Lizenz, die Änderung, Weitergabe und kommerzielle Nutzung erlaubt). Externe Entwickler sind zur gemeinsamen Pflege willkommen; zur Beteiligung siehe [`CONTRIBUTING.md`](./CONTRIBUTING.md).
>
> **Status: öffentliche Beta (public beta)**. Der offizielle Einstieg ist <https://physics.dongsiwei.com>. Kontosystem, Prüfungsbereich zum Erstellen von Klausuren, geräteübergreifende Synchronisierung der Lernaufzeichnungen, Produktionsbetrieb, Modell-Pool und Admin-Betriebspanel sind online; Schnittstellen und Oberfläche werden weiter iteriert, und echtes Unterrichts-Feedback beeinflusst die weiteren Prioritäten unmittelbar.

PhysicsOS ist als **persönliche Plattform für Physikexperimente und Lernen** positioniert, nicht als Schul-LMS: keine Klassenverwaltung, keine Aufgabenvergabe, keine Abgabe und Korrektur, keine Unterrichtsverwaltungsabläufe. Lehrkräfte wie Lernende nutzen Experimente, Aufgabenbank, KI-Assistenz und Lernaufzeichnungen mit persönlichen Konten.

PhysicsOS ist ein gemeinnütziger, visueller intelligenter Agent für das Physiklernen in der Mittel- und Oberstufe: Er versteht Aufgaben per KI und überführt abstrakte physikalische Vorgänge mithilfe der Physik-Engine in interaktive, beobachtbare, berechenbare und überprüfbare reale Physikszenen.

Das aktuelle Produkt läuft im DeepSeek Harness Web Client; die Physics Engine liefert die Ergebnisse, Observation und die einheitliche `PhysicsCanvas` machen daraus interaktive Visualisierungen.

## Screenshots

Die folgenden Screenshots stammen von der offiziellen Produktionsseite vom 2026-09-30 und wurden von
`tests/acceptance/promo-shots.mjs` nach der Anmeldung in einem echten Browser automatisch aufgenommen (dediziertes Demo-Konto, kein Admin-Konto).

| Plattform-Startseite | Experimentzentrum |
| --- | --- |
| ![Plattform-Startseite](docs/reports/screenshots/promo/01-home.png) | ![Experimentzentrum](docs/reports/screenshots/promo/02-experiment-center.png) |

| Reihenschaltung | Abbildungsgesetze der Sammellinse |
| --- | --- |
| ![Reihenschaltung](docs/reports/screenshots/promo/03-lab-series-circuit.png) | ![Abbildungsgesetze der Sammellinse](docs/reports/screenshots/promo/04-lab-convex-lens.png) |

| Druck im Inneren einer Flüssigkeit untersuchen | Schmelzvorgang eines Kristalls untersuchen |
| --- | --- |
| ![Flüssigkeitsdruck](docs/reports/screenshots/promo/05-lab-liquid-pressure.png) | ![Kristallschmelzen](docs/reports/screenshots/promo/06-lab-melting.png) |

| Bibliothek | Lösungskarte |
| --- | --- |
| ![Bibliothek](docs/reports/screenshots/promo/07-library.png) | ![Lösungskarte](docs/reports/screenshots/promo/09-solved-question.png) |

Das letzte Bild zeigt die vollständige Antwort auf eine Aufgabe: Das Ergebnis liefert die Mechanik-Engine und prüft es Punkt für Punkt (Gewichtskomponente, Stützkraft, Szenenstruktur); rechts steht dieselbe `PhysicsScene` in ihrer interaktiven Form im Experimentiertisch – **die KI erklärt die Aufgabe, die Engine liefert das Ergebnis, die Szene ist reproduzierbar**: Das ist der gesamte Anspruch dieser Kette.

Vollständigen Live-Umfang, Produktions-Nachprüfung und die Reihenfolge der Lehrer-Demo siehe
[`docs/reports/BETA-LAUNCH-REPORT.md`](./docs/reports/BETA-LAUNCH-REPORT.md).

## Offizieller Einstieg

Der einzige offizielle Web Runtime Host:

```text
vendor/deepseek-harness/apps/web
        +
@deepseek-ai/dsh-client-ui-physicsos
```

Der alte eigenständige Prototyp `apps/web` wurde gelöscht; der offizielle Browser-Einstieg ist `dsh-client-ui-physicsos` im vendor-Harness.

## Aktuelle Fähigkeiten

- PhysicsOS-Startseite, Seitenleiste, Schülermodus und offizieller Harness-Arbeitsbereich
- Experimentzentrum: zwölf Kategorien – Mechanik/Optik/Akustik/mechanische Wellen/Fluide/Wärmelehre/elektrisches Feld/Magnetfeld/Stromkreise/zusammengesetzte Felder/elektromagnetische Induktion/moderne Physik; **das Zyklotron ist an den Löser für zeitabhängige Felder angeschlossen** (nicht mehr „demnächst unterstützt“); neu hinzugekommen sind Vorlagen für Längswellen, Reflexion/Brechung, Beugung, Doppler-Effekt und Fotoeffekt; außerdem Fortsetzen des letzten Experiments und Empfehlungen anhand der Schwächen aus den Lernaufzeichnungen
- Experiment zu geladenen Teilchen im homogenen Magnetfeld: Parameterbearbeitung, Start/Pause/Einzelschritt/Zurücksetzen, Geschwindigkeitsstufen, Zeitachse, Beobachtungsgrößen, Daten, Diagramme, Herleitung und Ereignisse
- Fünf Mechanik-Szenentypen: gleichförmige Bewegung, gleichmäßig beschleunigte Bewegung, waagerechter/schräger Wurf, zweites Newtonsches Gesetz, reibungsfreie schiefe Ebene
- Stoßexperimente: drei Vorlagen – elastisch, inelastisch (e = 0,5) und vollständig inelastisch; eigene Stoß-Engine (Impulslösung für mehrere starre Kreis-Kreis-Körper, Randreflexion, Modell mit Stoßzahl), Engine-Prüfung von Impulserhaltung und (beim elastischen Stoß) Energieerhaltung, Stoßereignisse landen auf der Zeitachse; der Hero-Bereich der Startseite ist dieselbe kleine elastische Stoßszene aus kreisförmigen starren Körpern mit Geschwindigkeitspfeilen (dekorativ, mit Spurschweif und Kontaktblitz-Ring)
- Elektrisches Feld und zusammengesetzte Felder: Punktladung/mehrere Punktladungen/homogenes Feld/Ablenkung im Plattenkondensator, Geschwindigkeitsfilter, Massenspektrometer, E+B(+g), mehrere Feldbereiche
- Dynamische Gleichstromkreise: Reihen-/Parallel-/gemischte Schaltung, Schalter, quasistatischer Durchlauf eines Schiebewiderstands, Strom-/Spannungsmesser-Anzeigen, Messung von EMK und Innenwiderstand (MNA-Gleichstrom-Engine); der KI-Assistent im Labor kennt 8 Stromkreis-Intentionen (Hauptstrom, Klemmenspannung, Innenwiderstand, Kreisstrom in der Reihenschaltung, Stromteilung in der Parallelschaltung, Schiebewiderstand-Durchlauf, Leistungserhaltung, ideale Messgeräte), und seine Antworten zitieren aus der Engine abgeleitete Größen sowie vier benannte Prüfungen: KCL / Leistung / Klemmenspannungsgesetz / ideale Messgeräte
- Elektromagnetische Induktion: zwei Experimentiertische – Leiterstab schneidet Feldlinien (E = BLv, Animation des Stabs im Magnetfeld) und Änderung des magnetischen Flusses (E = −dΦ/dt, Richtung nach der Lenzschen Regel); B/R/Stabgeschwindigkeit/Flussänderungsrate sind in Echtzeit editierbar, drei Engine-Prüfungen – Faradaysches Gesetz, Lenzsche Richtung und Ohmsches Gesetz im Kreis (31 Engine-Tests)
- Geometrisch-optische Abbildung: vier Experimentvorlagen – Planspiegel, Sammellinse, Hohlspiegel, Wölbspiegel; die Engine löst die Gleichungen für dünne Linsen/Kugelspiegel analytisch, wendet die Abbildungsgesetze der fünf Bereiche an und konstruiert den Hauptstrahlengang (23 Engine-Tests); 6 optische Goldaufgaben (Planspiegel und drei Bereiche der Sammellinse, Hohlspiegel, Wölbspiegel) sind in der Aufgabenbank
- Mechanische Wellen: drei Experimentiertische – harmonische Transversalwelle auf einem Seil (die Wellenform verschiebt sich gemäß v = λf, markierte Teilchen schwingen nur und wandern nicht), Zweiquellen-Interferenz (Verstärkung/Auslöschung nach Gangunterschied Δ = nλ / (n+½)λ, resultierende Amplitude |2A·cos(πΔ/λ)|) und stehende Welle auf einer beidseitig eingespannten Saite (L = nλ/2, f_n = n·v/2L, Knoten und Bäuche); A/f/v/Δ/L/n sind in Echtzeit editierbar, das Medium bestimmt die Wellengeschwindigkeit, die Quelle die Frequenz; 11 Engine-Prüfungen (27 Engine-Tests); 6 Goldaufgaben zu mechanischen Wellen sind in der Aufgabenbank
- Akustik/Fluide/Wärmelehre/Hebel: Echolot-Entfernungsmessung, Auftrieb nach Archimedes, Schmelzen von Kristallen und Vergleich der spezifischen Wärmekapazität, Hebelgleichgewicht – jeweils mit eigener Domänen-Engine
- Einheitliche `PhysicsCanvas`: Teilchen-Domänen teilen Koordinaten, Gitter, Bahnen, Vektoren, Beschriftungen und Interaktion; Stromkreise werden im Schaltplan-Paradigma in dieselbe Zeichenfläche eingebunden
- Question Space: 80 integrierte Aufgaben (Magnetfeld 10, elektrisches Feld 19, Mechanik 6, zusammengesetzte Felder 21, Optik 6, Stromkreise 6, elektromagnetische Induktion 6, mechanische Wellen 6) mit echter Kette aus Question Runtime, Engine, Verifier und Observation
- Question → Lab: Aufgaben öffnen das Labor mit derselben `PhysicsScene`-Revision (Fakten der Aufgabenstellung können nicht durch Experimente verfälscht werden)
- Kontinuierliche Animation auf Basis von `requestAnimationFrame`; die mikroskopische Periode im Magnetfeld nutzt eine stabile Anzeigeuhr, die Mechanik liest die Engine-Funktion `stateAt` Bild für Bild
- **Gemeinnütziges Plattformmodell**: Auf Nutzerseite wird nur ein öffentliches Modell angezeigt (`平台公益模型`, „gemeinnütziges Plattformmodell“); dahinter stehen vom Admin jederzeit änderbare **Modellkanäle und ein Konten-Pool** (`/physicsos/model-pool`) – Kanäle deklarieren Upstream-Modellaliase, rotieren nach Prioritätsstufen, rotieren Keys gewichtet und kühlen bei Ausfall ab; ein Wechsel von Pool oder Key ändert den sichtbaren Modellnamen nicht; das Kontingent stammt aus Tokens gemeinnütziger Stationen, siehe „[Danksagung](#danksagung)“
- Desktop-, schmale Desktop- und Smartphone-Layouts; die Seitenleiste klappt nach der Navigation auf dem Smartphone automatisch ein
- Das Modell in einer Harness-Sitzung kann die Physik-Engine tatsächlich aufrufen: Die Agent-Voreinstellung „Physik-Lernmodus“ (`physics-student`) bindet `@deepseek-ai/dsh-tool-physicsos` ein; das Modell öffnet über sieben Tools wie `physics_solve_question / physics_create_experiment / physics_scene_command / physics_simulate / physics_observe` Experimente, löst Aufgaben, ändert Bedingungen, simuliert und prüft, alle Zahlenwerte stammen aus der Engine (End-to-End-Gate: `node tests/agent/headless-physics-acceptance.mjs`)

## Noch nicht fertig

- Die KI-Assistenz-Schublade im Labor arbeitet weiterhin überwiegend mit deterministischem Intent-Matching; modellgestützte Antworten stehen im Backlog
  `AGENT_MODEL_BACKED_ANSWERS_BACKLOG`, der Sitzungs-Agent verwendet bereits die Voreinstellung `physics-student`
- `web_search` zeigt weiterhin auf den offiziellen DeepSeek-Endpunkt und wurde nicht auf ein Drittanbieter-Modell-Gateway migriert
- Der Sensitivwort-Filter des Drittanbieter-Gateways muss noch mit einer echten Aufgabenbank stichprobenartig getestet werden; bei Treffern kann `500 / new_api_error` zurückkommen
- Derzeit eine einzelne Replik; vor einer Skalierung muss `PHYSICSOS_SESSIONS_ROOT` auf ein gemeinsames Dateisystem umgestellt werden
- Content-Security-Policy ist zurückgestellt; aktuell aktiv sind HSTS, nosniff, X-Frame-Options,
  Referrer-Policy und Permissions-Policy
- Admin-TOTP ist implementiert, aber für die aktuellen Produktionskonten noch nicht aktiviert
- Der Desktop-Client bleibt eine optionale Hülle; Signierung, Notarisierung, Store-Veröffentlichung und automatische Updates sind vorerst nicht vorgesehen
- Erfassung von Aufgaben aus Bildern / PDF / VLM ist implementiert; der weitere Ausbau der echten Klausurbibliothek erfordert lizenzierbare Klausurquellen und Prüfung durch Lehrkräfte

Die Oberfläche kennzeichnet nicht angebundene Fähigkeiten ausdrücklich und täuscht keinen Erfolgszustand als Platzhalter vor.

## Mitwirken

In der Beta-Phase werden vor allem **echtes Nutzungs-Feedback** und **kleine, präzise Änderungen** gebraucht:

- **Probleme melden / Wünsche äußern**: Nutzen Sie die [Issue-Vorlagen](https://github.com/122-syf-wcy/PhysicsOS/issues/new/choose) (Problembericht / Feature-Wunsch / Frage). Beschreiben Sie bitte Reproduktionsschritte sowie erwartetes und tatsächliches Ergebnis; bei Oberflächenproblemen mit Screenshot, bei Physikproblemen mit dem Originalwortlaut der Aufgabe.
- **PR einreichen**: Lesen Sie zuerst [`CONTRIBUTING.md`](./CONTRIBUTING.md). Ein PR behandelt ein Thema und muss `pnpm typecheck && pnpm lint && pnpm test` bestanden haben; wenn nur das Web-Overlay geändert wird, genügt die schnellere `:web`-Variante unter „Verifikation“.
- **Einstiegspunkte finden**: Die obigen Abschnitte „Noch nicht fertig“ und „Bekannte Probleme“ sind das aktuelle Backlog. Domänen-Engines und Goldaufgaben sind am einfachsten – jede Domänen-Engine hat eigene Tests, nach der Änderung genügt `pnpm test:web` zur Verifikation.
- **Sicherheitsprobleme**: Eröffnen Sie kein öffentliches Issue, sondern melden Sie sie gemäß [`SECURITY.md`](./SECURITY.md) vertraulich.

## Bekannte Probleme

- Derzeit keine blockierenden bekannten Probleme. `pnpm typecheck:web` deckt nur `src/` ab (ohne `tests/`); zur Prüfung des Testcodes führen Sie `vitest` aus (Tests werden über esbuild transpiliert, ohne vollständige Typprüfung).

## Start

Voraussetzung: Node.js `>=24`; pnpm wird über das Feld `packageManager` des Repos verwaltet.

Der offizielle Web-Einstieg hängt vom Harness-Submodul und der Overlay-Überlagerung ab; nach dem Klonen sind drei Schritte nötig:

```sh
git submodule update --init --recursive
node scripts/overlay/harness-overlay.mjs apply
pnpm install
```

Das Repo speichert große Bilder unter `UI/` und `docs/` in Git LFS; installieren Sie vor dem Klonen `git-lfs` (ohne Installation sind diese PNGs nur Pointer-Dateien, was die Ausführung des Codes nicht beeinträchtigt).

Dann starten:

```sh
pnpm dev
```

Standardadresse: `http://127.0.0.1:3080/`

Sie können auch direkt den Harness aufrufen:

```sh
pnpm -C vendor/deepseek-harness dsh web
```

## Verifikation

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Wenn nur das offizielle Web-Overlay verifiziert werden soll:

```sh
pnpm typecheck:web
pnpm lint:web
pnpm test:web
pnpm build:web
```

## Visuelle Assets

- `UI/generated/`: 4K-/Rohassets der Generierungsmodelle samt Generierungs-Metadaten
- `UI/generated/mascot/`: transparente Originale der IP-Figur „Xiao Q“ (drei Posen: wave / think / search)
- `UI/generated/collision/`: Lehrillustrationen zum Stoßexperiment (elastisch/vollständig inelastisch/Impulserhaltungstisch/Newton-Pendel, PNG 1024×1024 mit Manifest-Metadaten)
- `vendor/deepseek-harness/apps/web/public/physicsos/`: für das Web komprimierte offizielle Laufzeit-Assets (unter `mascot/` WebP in drei Stufen: 160/320/640)
- `scripts/design/cutout-mascot.py`: schneidet Renderings mit weißem Hintergrund zu transparenten Bildern mit erhaltenen weichen Schatten und exportiert Web-Größen
- `scripts/design/imagegen-client.mjs`: OpenAI-kompatibler Bildgenerierungs-Client (Standard-Endpunkt `https://zz.211b.site`, Modell gpt-image, mit Modell-/Größen-Fallback und Backoff-Wiederholung bei 5xx, Ausgabe PNG + Metadaten-Manifest)

Der Hero-Bereich der Startseite ist eine Echtzeit-Szene eines elastischen Stoßes samt Xiao Q (dekorativ, geht nicht in die Physik-Engine ein); die Einstiegskarten verwenden weiterhin echte Bilder der Magnetfeld-Experimentiergeräte, die ursprünglichen 4K-Dateien bleiben in `UI/generated/`, die Webseite lädt die 8–10 MB großen Originale nicht direkt. Regeln für IP und Animation siehe `docs/06-UI-DESIGN-SYSTEM.md` §3.1 und §37.

## Architekturgrenzen

```text
Question / Lab
      ↓
PhysicsScene (single source of truth)
      ↓
Engine → Verifier → Observation
      ↓
SceneVisualModel → PhysicsCanvas
```

- React berechnet keine Physiklösungen.
- Der Renderer entscheidet keine physikalischen Fakten.
- Agent Loop, Session und Tools des Harness-Kerns werden nicht PhysicsOS-spezifisch verändert.
- Die Domänenpakete liegen im Wurzelverzeichnis unter `packages/`, die Anpassungsschicht der offiziellen Oberfläche unter `vendor/deepseek-harness/packages/client/ui-physicsos/`.
- Abgleich von Umfang und Zuordnung zwischen eigenem und Upstream-Code: siehe [`docs/ARCHITECTURE-OWNERSHIP.md`](./docs/ARCHITECTURE-OWNERSHIP.md).

Details zu den Grenzen siehe `docs/HARNESS-UPSTREAM.md` und `docs/HARNESS-UI-OVERLAY.md`.

## Harness-Overlay

Der Code der offiziellen Oberfläche liegt in `overlays/harness/` und wird per Skript auf das gepinnte Upstream-Submodul überlagert; das Repo verändert die Upstream-Historie nicht:

```sh
node scripts/overlay/harness-overlay.mjs apply     # overlay → vendor/deepseek-harness
node scripts/overlay/harness-overlay.mjs capture   # vendor/deepseek-harness → overlay
```

Erläuterungen siehe `overlays/harness/README.md`.

## Danksagung

Das **Kontingent des gemeinnützigen Modells** der Plattform stammt von den folgenden gemeinnützigen Stationen, und zwar werden beide Verwendungen bedient:

- **Produktionsbetrieb**: Jede Aufgabenlösung von Lernenden und Lehrkräften läuft über den Pool „gemeinnütziges Plattformmodell“, und dieser Pool ist an deren Tokens angeschlossen;
- **Projektentwicklung selbst**: Die Modellaufrufe beim Schreiben von Code, Ergänzen von Tests und Untersuchen von Produktionsproblemen stammen ebenfalls von diesen Stationen.

Dass ein gemeinnütziges Lehrprojekt laufen kann, verdankt sich diesen Stationen:

| Gemeinnützige Station | Adresse |
| --- | --- |
| 黑与白公益站 | <https://ai.hybgzs.com/panel> |
| 咕咕嘎嘎公益站 | <https://api.fengshao1227.com/> |
| lucky API 公益站 | <https://new.lucky0625.qzz.io/> |
| luckyg 公益站 | <https://luckyg.131518.xyz/> |

Diese Stationen werden jeweils unabhängig betrieben und haben keine Zugehörigkeit zu PhysicsOS: Verfügbare Modelle, Kontingente und Stabilität bestimmen sie selbst,
das Projekt gibt keinerlei Zusage zu ihrer Verfügbarkeit, und die hier genannten Adressen sollten nicht als stabile Produktionsabhängigkeit betrachtet werden.
Wenn Sie Betreiber einer dieser Stationen sind und die Nennung oder Verlinkung anpassen möchten, eröffnen Sie einfach ein Issue.

Das Projekt wurde in der Community [LINUX DO](https://linux.do) veröffentlicht und dort gebilligt; Mitglieder der Community sind herzlich eingeladen, es auszuprobieren und Feedback zu geben.

## Lizenz und Verwendung

- Eigener Code und eigene Dokumentation: [`LICENSE`](./LICENSE), **Apache License 2.0** (von der OSI zertifizierte Open-Source-Lizenz), erlaubt Nutzung, Änderung, Weitergabe und kommerzielle Nutzung; Urheberrechts-, Lizenz- und NOTICE-Hinweise müssen beibehalten werden.
- Das Projekt bleibt ein gemeinnütziges Projekt für den Physikunterricht in der Mittel- und Oberstufe; die offene Lizenz bedeutet keine Zusage zu kommerziellem Support oder SLA, zum Meldeweg für Sicherheitsprobleme siehe [`SECURITY.md`](./SECURITY.md).
- Komponenten von Drittanbietern und Upstream-Zuordnung: siehe [`NOTICE.md`](./NOTICE.md). DeepSeek Harness ist ein Upstream-MIT-Projekt, dieses Repo verteilt nur eigene Plugins und Änderungs-Patches; die darin enthaltenen C-Eval-Aufgabendaten stehen weiterhin unter CC BY-NC-SA 4.0 (nicht kommerziell) und fallen nicht unter die Apache-2.0-Lizenz dieses Repos.
- Die visuellen Assets `UI/generated/**` wurden von Bildgenerierungsmodellen erzeugt und stehen mit dem Repo unter Apache-2.0; bei kommerzieller Nutzung prüfen Sie bitte selbst die Bedingungen des Anbieters des Generierungsmodells.
