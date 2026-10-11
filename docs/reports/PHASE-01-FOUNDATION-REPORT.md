# PHASE-01 Foundation Report

Datum: 2026-08-16  
Umfang: PHASE-0 / PHASE-1 Foundation  
Fazit: Infrastruktur, Harness-Pin, Adapter-Grenze und Web-UI-Shell sind umgesetzt. Physics Engine / vollständiger Agent / Question Parser sind noch nicht begonnen.

## Skill-Auswahl

- must (Rohfassung gelesen): `screenshot-to-ui`, `react-development`, `typescript-development`, `javascript-typescript-development` (Liste getroffen, dieser Schritt folgt der TS/React-Toolchain), `test-engineering`, `browser-automation`, `git-workflow`, `code-audit`
- conditional (Rohfassung nicht gelesen): `ui-design` (anti: 1:1-Nachbau, stattdessen screenshot-to-ui), `web-security`, `ai-engineering`, `document-authoring`
- skip: Spring / Zahlung / Karten / Reverse Engineering / Tauri-Implementierung / Physics Engine

## 1. Ergebnis der Projektprüfung

Fakten bei Arbeitsbeginn:

| Punkt                                | Ergebnis                                                    |
| ------------------------------------ | ----------------------------------------------------------- |
| Git                                  | Kein Repository                                             |
| Wurzelverzeichnis                    | Nur `docs/`, `UI/`                                          |
| Quellcode / package.json / pnpm workspace | Keine                                                  |
| Harness                              | Keiner                                                      |
| Node                                 | `v24.18.0`                                                  |
| pnpm                                 | `11.9.0`                                                    |
| Doppelte Dateien                     | `01-DEVELOPMENT-GUIDE.md` und `01-DEVELOPMENT_GUIDE.md` liegen nebeneinander |
| `00-PRODUCT-OVERVIEW.md`             | Fehlt                                                       |

Die beiden `01` sind **nicht dasselbe Dokument**:

- Die Version mit Bindestrich trägt den Titel „Produktübersicht und Systemarchitektur“ (40 738 Bytes)
- Die Version mit Unterstrich trägt den Titel „Entwicklungsleitfaden“ (35 577 Bytes)

Es wurde keine leere Datei als Wiederherstellung ausgegeben.

## 2. Stand der docs-Reparatur

| Aktion                                                       | Ergebnis                         |
| ------------------------------------------------------------ | -------------------------------- |
| `01-DEVELOPMENT-GUIDE.md` (Bindestrich) → `00-PRODUCT-OVERVIEW.md`  | Umbenannt, gesamter Originaltext erhalten und Dateikopf ergänzt |
| `01-DEVELOPMENT_GUIDE.md` (Unterstrich) → `01-DEVELOPMENT-GUIDE.md` | Umbenannt                        |
| Querverweise `00-PRODUCT_OVERVIEW` / `01-DEVELOPMENT_GUIDE`  | Auf die Schreibweise mit Bindestrich vereinheitlicht |
| Zusammenführung                                              | Nicht nötig: Die Zuständigkeiten beider Inhalte sind verschieden |

Aktuelle Namensgebung in docs: `Zahl-GROSSBUCHSTABEN-Englisch-Bindestrich.md`.

## 3. Upstream-Commit des Harness

- repository: `https://github.com/deepseek-ai/deepseek-harness.git`
- path: `vendor/deepseek-harness` (git submodule)
- pinned SHA: `47f943859bef60e4160492346772ded9b24f765a`
- branch: `master`
- remote: `origin`
- packageManager: `pnpm@11.7.0`
- Node requirement: `^22.19.0 || >=24.0.0`
- Aufzeichnungsdatei: `docs/HARNESS-UPSTREAM.md`

## 4. Ergebnis des Harness-Builds

In `vendor/deepseek-harness`:

```text
pnpm install --ignore-scripts
pnpm run build
```

`pnpm run build` war **erfolgreich** (Host tsc + tsdown + Client + Web frontend, exit 0).

Das lefthook-`postinstall` des Standard-`pnpm install` schlägt unter einem **Submodul** fehl:

```text
cannot enable extensions.worktreeConfig while core.worktree is in the common config
```

Der Upstream-Quellcode wurde nicht verändert. Die Installation der Abhängigkeiten wurde mit `--ignore-scripts` abgeschlossen. Das ist ein Problem der Wechselwirkung Windows + git submodule + lefthook, kein Defekt im Geschäfts-Quellcode.

## 5. Ergebnis des Harness-Starts

```text
pnpm dsh web
```

Tatsächliche Adresse: `http://127.0.0.1:3080`  
Kein echter API Key konfiguriert / keine `.env` committet.

## 6. Hat der Harness lokale Diffs

Zum Zeitpunkt der Verifikation:

```text
git status --short
git diff --stat
```

beide leer. Weder Agent Loop / Session Store / Web UI / Geschäfts-Quellcode des Harness wurden verändert.

## 7. Monorepo-Struktur

```text
apps/web
packages/ui
packages/shared
packages/platform-bridge
packages/agent-runtime
packages/agent-dsh-adapter
services/          (Platzhalter)
tests/             (Platzhalter + Erläuterung)
vendor/deepseek-harness
docs/
UI/
```

> **Nachtrag (2026-09-27)**: `packages/agent-runtime` / `packages/agent-dsh-adapter` waren seit PHASE-01 ein **nicht verdrahtetes (keine Produktionskette)** Skelett **ohne Produktionskonsumenten**; beide wurden am 2026-09-27 stillgelegt und gelöscht (ADR-0002 angenommen und umgesetzt), siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Das Folgende ist die historische Aufzeichnung von damals.

Technische Festlegung (npm-Abfrage + Harness-Kompatibilität, keine Vermutung nach alter Dokumentversion):

- React `19.2.8` / Vite `8.2.1` / TypeScript `6.0.3` (Harness beschränkt auf `<7`)
- React Router `8.3.0` / Zustand `5.0.15` / TanStack Query `5.101.4`
- Tailwind `4.3.3` / KaTeX `0.18.4` / Vitest `4.1.10` / Playwright `1.62.1`
- pnpm workspace + Turborepo; `strict: true`

## 8. Angelegte Packages

| Package                        | Verantwortung                                    | PHASE-01-Stand         |
| ------------------------------ | ------------------------------------------------ | ---------------------- |
| `@physicsos/shared`            | Brand ID / Fehler                                | Fertig                 |
| `@physicsos/platform-bridge`   | Browser Bridge; Tauri vorgehalten, wirft UnimplementedError | Fertig       |
| `@physicsos/agent-runtime`     | PhysicsAgentRuntime / Transport / Event Contract | Nur Typen + Contract-Test |
| `@physicsos/agent-dsh-adapter` | Einzige Harness-Grenze; Methoden lehnen vorgetäuschten Erfolg ab | Skelett |
| `@physicsos/ui`                | tokens / primitives / domain components          | Fertig                 |
| `@physicsos/web`               | Produkt-UI                                       | UI + Fixture           |

> **Nachtrag (2026-09-27)**: `@physicsos/agent-runtime` und `@physicsos/agent-dsh-adapter` in der obigen Tabelle waren stets **nicht verdrahtet (keine Produktionskette)** und ohne Produktionskonsumenten, sie wurden am 2026-09-27 stillgelegt und gelöscht (ADR-0002 angenommen und umgesetzt), siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`; die Methoden des Letzteren waren alle ein Skelett mit `Promise.reject(new UnimplementedError(...))`, ohne Produktionspfad-Import. Die reale Produktions-Agent-Kette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

In Geschäftskomponenten kommt kein `window.__TAURI__` vor.  
`apps/web` importiert kein `@deepseek-ai/*`.

## 9. Fertigstellungsgrad der UI-Seiten

| Seite                    | Route                              | Fertigstellungsgrad | Erläuterung                                                                  |
| ------------------------ | ---------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Startseite               | `/`                                | Hoch   | Hero, doppelter Einstieg, Zuletzt fortgesetzt / Themen / Dateien, Lernpfad, Fächer |
| Physics Workspace        | `/lab`                             | Hoch   | Scene Tree, Canvas-Hülle, Inspector, Observables, Timeline, Charts, Data, Agent |
| Question Space           | `/questions`                       | Hoch   | Drei Spalten, Aufgabe, Visualisierung, KI-Analyse, in der Physikwelt öffnen  |
| Desktop Workspace        | `/desktop`                         | Mittel bis hoch | Sidebar + Canvas + Parameter + Timeline; nicht das Web-Hauptprodukt  |
| Lernverlauf / Ressourcenbibliothek / Mein Bereich | `/history` `/resources` `/profile` | Hülle | Ausdrücklich als nicht umgesetzt vermerkt, keine gefälschte API |

Canvas: grid / Koordinatenachsen / ×-Feldsymbol / Teilchen / Trajektorie / Vektoren / viewport / toolbar / timeline.  
Die Daten stammen aus `apps/web/src/fixtures/prototype/` (Dateikopf PROTOTYPE ONLY).  
Die Komponenten implementieren keine formale Lösung physikalischer Formeln.

## 10. Zuordnung zu den Prototypen

| Semantische Datei                        | Originaldatei  | Seite        |
| ---------------------------------------- | -------------- | ------------ |
| `UI/原型图/01-home.png`                  | `11_49_34 (1)` | Startseite   |
| `UI/原型图/02-physics-lab-workspace.png` | `11_49_35 (2)` | Physiklabor  |
| `UI/原型图/03-question-space.png`        | `11_49_35 (3)` | Aufgabenraum |
| `UI/原型图/04-desktop-workspace.png`     | `11_49_35 (4)` | Desktop      |
| `UI/组件图/01-navigation-components.png` | `12_32_45 (4)` | Navigation   |
| `UI/组件图/02-workspace-components.png`  | `12_32_45 (2)` | Arbeitsbereich |
| `UI/组件图/03-question-components.png`   | `12_32_45 (3)` | Aufgaben     |
| `UI/组件图/04-content-components.png`    | `12_32_44 (1)` | Inhaltsmodule der Startseite |

Alle Originalbilder bleiben erhalten. Zuordnung siehe `UI/README.md`.

## 11. Screenshot-Pfade

Playwright `pnpm test:e2e` **12/12 bestanden** (2026-08-16). Die Screenshots werden ins Repository-Root geschrieben, auf der Platte wurden 12 PNGs mit insgesamt 2 311 048 Bytes verifiziert:

```text
docs/reports/screenshots/home-1440x900.png
docs/reports/screenshots/home-1600x900.png
docs/reports/screenshots/home-1920x1080.png
docs/reports/screenshots/physics-lab-workspace-1440x900.png
docs/reports/screenshots/physics-lab-workspace-1600x900.png
docs/reports/screenshots/physics-lab-workspace-1920x1080.png
docs/reports/screenshots/question-space-1440x900.png
docs/reports/screenshots/question-space-1600x900.png
docs/reports/screenshots/question-space-1920x1080.png
docs/reports/screenshots/desktop-workspace-1440x900.png
docs/reports/screenshots/desktop-workspace-1600x900.png
docs/reports/screenshots/desktop-workspace-1920x1080.png
```

Der e2e-Pfad wurde auf eine absolute Auflösung relativ zum Repository-Root umgestellt (`apps/web/e2e` → `docs/reports/screenshots`), damit bei einem falschen cwd nicht in das falsche Verzeichnis geschrieben wird.

Manueller Vergleich mit `UI/原型图` (Hauptbasis 1600×900; Workspace zusätzlich bei 1920×1080 geprüft):

| Dimension                              | Startseite                                                               | Workspace                                                                                | Question                                          | Desktop                                                |
| -------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------ |
| Kopfleiste / Suche / Ctrl K / Glocke / Schüler Li Ming | Übereinstimmend                                                  | Übereinstimmend                                                                          | Übereinstimmend                                   | Desktop ist eine Sidebar-Hülle, keine Web-Kopfleiste   |
| Hauptlayout                            | Hero + doppelter Einstieg + drei Inhaltsspalten + Pfad/Fächer            | Linker Baum + Canvas-Kern + Inspector + unten Diagramme/Tabelle                          | Links Verlauf/Aufgabensammlung + Mitte Aufgabe + rechts KI | Sidebar + Objektbaum + Canvas + Parameter           |
| Canvas-Anteil                          | n/a                                                                      | Bleibt visueller Kern; bei 1920 erscheint eine eigene fünfte KI-Spalte                   | Visualisierung in der mittleren Spalte vorhanden  | Kern der mittleren Spalte                              |
| Farbpalette                            | Nebelweiß + natürliches Blau, kein großflächiges Violett / Cyberpunk-Schwarz | Wie links                                                                            | Wie links                                         | Wie links                                              |
| Text/Daten                             | Hero und Statistikkarten stimmen überein (`8,600+`)                      | Szenenname, q/m/B, Semantik von Trajektorie/Vektoren stimmen überein                    | Aufgabenstellung, gegebene Bedingungen, gesuchte Größen, grüner CTA stimmen überein | Text zur bestandenen Zwangsbedingung stimmt überein |
| Offensichtliche Lücken                 | 3D-Assets des Prototyps fehlen (Glaskugel/Bahn/Aufgabenkarte); Themen sind Farbflächen statt Fotos; „Zuletzt fortgesetzt“ ohne Vorschaubild | Bei 1600 stapeln sich KI und Observables in einer Spalte (entspricht der Spezifikation 07, im Prototyp eher als eigene Spalte); Dichte der Ebenenschalter geringer als im Prototyp | Visualisierung ist 2D-SVG, kein 3D-Viewport des Prototyps; geometrisches Aufgabenbild fehlt | Vollständiges Windows-Chrome, vollständige Werkzeugleiste, 3D-Viewport-Steuerung, Trajektoriendiagramm fehlen |

**Es darf nicht als „weitgehend originalgetreu nachgebaut“ geschrieben werden.** Informationsarchitektur, Spalten, Farbpalette und zentrale Texte sind gemäß Prototyp umgesetzt; bei 3D-/Foto-Assets und dem Desktop-Chrome bestehen weiterhin Lücken auf Pixelebene.

## 12. typecheck

```text
pnpm typecheck
```

Bestanden (6 Packages).

## 13. lint

```text
pnpm lint
```

Bestanden.

## 14. test

```text
pnpm test
```

Bestanden: shared 1, ui 2, platform-bridge 2, agent-runtime 3, adapter 3, web route smoke 3.

```text
pnpm test:e2e
```

Playwright 12 passed.

## 15. build

```text
pnpm build
```

Bestanden. Der Vite-Production-Build von `apps/web` war erfolgreich.

## 16. Nicht erledigte Punkte

- Adapter nicht an die öffentliche API des Harness angebunden (absichtlich: nur die Grenze gebaut, vorgetäuschten Erfolg abgelehnt)
- Physics Engine / Scene Runtime / Verifier
- Question Parser / OCR / VLM
- Echter Agent Loop / Tools / Skills
- Spring-Boot-Geschäftsservice
- Formaler Git-Commit im Hauptrepository (Submodul wurde per add hinzugefügt, aber nicht wie von dir gewünscht automatisch committet)
- Ersatz der 3D-/Foto-Assets des Prototyps
- Interaktion des Einklappens bei 1366 nicht einzeln per Screenshot abgenommen (Layout-CSS ist gemäß Breakpoint vorgesehen)
- KaTeX `dangerouslySetInnerHTML` nur für kontrollierte Fixtures; vor der Anbindung von Nutzer-/Agent-Text ist ein Sanitizer Pflicht

## 17. Risiken

| Risiko                  | Stufe | Erläuterung                                          |
| ----------------------- | ---- | ---------------------------------------------------- |
| Schnelle Entwicklung des Harness | Hoch | SHA ist gepinnt; ein Upgrade muss über Adapter + diesen Dokumentenablauf laufen |
| Submodul + lefthook     | Mittel | Das Standard-postinstall schlägt unter Windows fehl; deswegen nicht den Upstream ändern |
| Lücke bei UI-Assets     | Mittel | Ohne 3D-/Foto-Material ist keine pixelgenaue Angleichung von Hero/Einstiegskarten möglich |
| Fixture wird für Engine gehalten | Mittel | Zentral abgelegt und mit PROTOTYPE ONLY gekennzeichnet |
| KaTeX HTML              | Niedrig | Aktuell stammt tex aus dem Repository-Fixture, nicht aus Nutzereingaben |

code-audit-Ergebnis: **Kein architektonischer Blocker**. Es wird nicht behauptet, produktionsreif zu sein. Die Physics Engine wurde nicht gemockt.

## 18. Empfehlung für die nächste Phase

Gemäß `docs/14-DEVELOPMENT-ROADMAP.md` sollte der nächste Schritt **Phase 2 Contract** sein und nicht, weiter Seiten aufzutürmen:

1. TS + Zod für `Quantity` / `Vector` / `PhysicsScene` / Event / SimulationResult
2. Contract-Tests
3. Danach weiter zu Units / Scene Runtime
4. Die erste Vertical Slice bleibt empfohlen: Kreisbewegung eines geladenen Teilchens im homogenen Magnetfeld

Diese Runde endet hier. Es wird nicht automatisch in die Entwicklung der Physics Engine übergegangen.
