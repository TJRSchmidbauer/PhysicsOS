# ADR-0002: Umgang mit agent-runtime und agent-dsh-adapter

- Status: angenommen (umgesetzt, 2026-09-27)
- Datum: 2026-09-27 (vorgeschlagen); 2026-09-27 (angenommen und Stilllegung durchgeführt)
- Entscheider: PhysicsOS Maintainer
- Zugehörige Dokumente / PRs: `docs/HARNESS-UPSTREAM.md`, `docs/04-AGENT-ARCHITECTURE.md`, `docs/ARCHITECTURE-OWNERSHIP.md`
- Umsetzungsvermerk: Am 2026-09-27 wurde die Stilllegung gemäß Variante (b) abgeschlossen; `packages/agent-runtime` und `packages/agent-dsh-adapter` wurden gelöscht (die ursprünglichen Verzeichnisse `packages/agent-runtime` und `packages/agent-dsh-adapter` existieren nicht mehr).

## Kontext

`docs/HARNESS-UPSTREAM.md` und `docs/04-AGENT-ARCHITECTURE.md` zeichnen die Agent-Kette als
`ui-physicsos → @physicsos/agent-runtime → @physicsos/agent-dsh-adapter → vendor/deepseek-harness`.
Die Prüfung des Codes ergibt, dass diese Kette im Repository so nicht existiert: Beide Packages liegen zwar auf der Platte, aber kein Produktionspfad verwendet sie.

Geprüfte Fakten (file:line):

- `packages/agent-runtime` (insgesamt 243 Zeilen: `src/ids.ts` 10 + `src/runtime.ts` 25 + `src/session.ts` 66 + `src/events.ts` 70 + `src/index.ts` 25 = 196, plus `src/contract.test.ts` 47) besteht nur aus Typen und einem Contract-Test.
  Der einzige Konsument im gesamten Repository ist `packages/agent-dsh-adapter` – die Fundstellen sind lediglich
  `packages/agent-dsh-adapter/package.json`, `src/deepseek-harness-adapter.ts`,
  `src/local-sidecar-transport.ts` und `src/local-sidecar-transport.test.ts`. An keiner anderen Stelle in `packages/**`,
  `overlays/**` und `apps/**` wird `@physicsos/agent-runtime` importiert.
- In `packages/agent-dsh-adapter/src/deepseek-harness-adapter.ts:26-48` geben
  `createSession` / `send` / `resume` / `cancel` / `getSession` / `forkSession` alle
  `return Promise.reject(new UnimplementedError('…'))` zurück; dasselbe gilt für
  `DeepSeekHarnessTransport` in den Zeilen 63-79 derselben Datei. Das ist das PHASE-01-Gerüst. Die Nachbardateien
  `boundary.ts` (29 Zeilen), `local-sidecar-transport.ts` (271 Zeilen) und `tauri-sidecar-rpc.ts` (132 Zeilen) sind echte Implementierungen.
  Im gesamten Repository importiert kein Produktionspfad `@physicsos/agent-dsh-adapter`: Die Fundstellen sind nur noch dessen eigene
  `package.json`, `src/adapter.contract.test.ts` und `src/boundary.ts`.
- Das Desktop-Produkt geht einen anderen Weg: `apps/desktop/sidecar/bridge.mjs` (1258 Zeilen), eine JSON-RPC-stdio-Brücke zum
  lokalen Harness-Web-Host, wurde auf den Sitzungsstrom 0.1.7 (`remote.mux` + `session/follow`) und das Slash-artige Remote-
  Protokoll migriert und implementiert `session/create`, `session/send`, `run/cancel`, `run/resume` (bridge.mjs:20-23, 640-646).
- Die tatsächlich produktiv laufende Agent-Kette ist die Schleife des Harness selbst: Harness Agent Loop → Harness Tool Runtime →
  `overlays/harness/files/packages/physicsos/tool-physicsos` (registriert Tools mit `defineTool` aus `@deepseek-ai/dsh-tools`)
  → `@physicsos/agent-tools` (`src` 2694 Zeilen) → Physik-Engine und Verifier.
- Unsere eigene Zustandsmaschine existiert wirklich, aber an anderer Stelle:
  `overlays/harness/files/packages/physicsos/paper-host/src/domain.ts:277`
  (`spec|drafting|checking|review|approved|exported|failed`, einschließlich Wiederherstellung von `drafting`/`checking`),
  `packages/physics-scene/src/scene-branch.ts` (82 Zeilen) und `scene-runtime.ts` (4839 Zeilen);
  `packages/question-core/src/workflow.ts` ist mit 18 Zeilen lediglich eine Phasen-Enumeration, keine Transitionsmaschine.

Randbedingungen und Kosten: Das Projektprinzip lautet „DeepSeek Harness ist Agent-Infrastruktur, nicht der Geschäftskern von PhysicsOS“
(`docs/04-AGENT-ARCHITECTURE.md:14`), und ausdrücklich „PhysicsOS implementiert keine allgemeinen Harness-Fähigkeiten neu“ (selbe Datei:221).
Die Kosten der derzeitigen Nicht-Entscheidung: Die Dokumentation behauptet dauerhaft zu viel; Leser nehmen an, es gebe eine stabile Agent-Contract-Grenze,
und reservieren Designspielraum für deren künftige Verdrahtung, während sie im Code null Konsumenten hat und einige Methoden direkt Fehler werfen.

## Entscheidung

**Variante (b) wird angenommen: Die beiden Packages `packages/agent-runtime` und `packages/agent-dsh-adapter` werden stillgelegt,
und die Dokumentationskette wird so geändert, dass sie den tatsächlich produktiven Pfad `tool-physicsos → @physicsos/agent-tools → Physik-Engine / Verifier` beschreibt.**

**Grenzerklärung (vom Owner am 2026-09-27 bestätigt): Der Harness ist der Agent-Host; PhysicsOS baut und pflegt keine eigene, unabhängige
Agent-Runtime. Das Modell und der Harness liefern „Verstehen und Bedienen“, unsere eigene Runtime ist die Runtime der physikalischen Welt
(Scene → Engine → Verifier), keine Agent-Schleife.**

Grenzen und Umfang:

- Der stabile Vertrag der Physik-Domäne liegt ohnehin an der Tool-Grenze – `@physicsos/agent-tools` (2694 Zeilen, bereits produktiv)
  und der Registrierungsschicht `tool-physicsos` –, nicht in einer duplizierten Abstraktion `agent-runtime`.
- `@physicsos/agent-tools` ist bereits der einzige Agent-Integrationspunkt, an dem PhysicsOS die physikalische Semantik besitzt; nach der Stilllegung bleibt es
  für die Aussage „PhysicsOS owns the physics domain“ zuständig.
- Umgesetzt (2026-09-27): Gemäß Variante (b) dieser ADR wurden beide Package-Verzeichnisse gelöscht und alle Verweise bereinigt,
  die Dokumentation wurde entsprechend korrigiert (siehe „Konsequenzen · Umgesetzt“).
- Ausdrücklich nicht getan: Der Harness wird nicht geforkt oder verändert, `vendor/deepseek-harness` wird nicht gelöscht, und
  `apps/desktop/sidecar/bridge.mjs` wird nicht angetastet – die Bridge ist derzeit der einzige nutzbare Desktop-Agent-Kanal und bleibt bestehen.

Der stärkste Einzelgrund: Beide Packages haben null Konsumenten, ihre bloße Existenz ist die einzige Quelle der überzogenen Dokumentation;
der tatsächliche Träger des Physik-Domänenvertrags (`tool-physicsos → agent-tools`) ist dagegen bereits produktiv. Die Stilllegung macht
die Dokumentation daher ohne Produktionskosten wahr und entfernt eine überflüssige Abstraktionsschicht, die dem Grundsatz „keine allgemeinen Harness-Fähigkeiten neu implementieren“ widerspricht.

## Konsequenzen

- Positiv: Dokumentation und Code stimmen überein; 777 Zeilen (243 + 534) Code und Tests ohne Konsumenten werden gelöscht; niemand reserviert mehr Entwurfsspielraum für eine
  nicht existierende Contract-Grenze; die Agent-Grenze reduziert sich auf die einzige reale (Harness-Tool-Runtime →
  `agent-tools` → Engine).
- Negativ: Eine potenzielle Naht für eine „künftig austauschbare Agent-Runtime“ geht verloren. Falls später tatsächlich eine Nicht-Harness-
  Runtime angebunden werden muss, ist eine Vertragsschicht neu einzuführen – dann nach realem Bedarf entworfen, statt die heutigen Vermutungen zu konservieren.
- Umgesetzt (2026-09-27): Die Stilllegung ist abgeschlossen. Die Verzeichnisse `packages/agent-runtime` (mit `src/` und `contract.test.ts`)
  und `packages/agent-dsh-adapter` (mit dem Gerüst `deepseek-harness-adapter.ts` und dem Sidecar-Transport) wurden gelöscht;
  die Workspace-Mitgliedsverweise (`pnpm-workspace.yaml` nutzt den Wildcard `packages/*`, wirkt automatisch) und die beiden Importer-Blöcke
  in `pnpm-lock.yaml` wurden bereinigt. Die `package.json`-Abhängigkeiten, tsconfig-Projektreferenzen
  und alle Importe im Repository verschwanden mit dem Löschen der Verzeichnisse; `apps/desktop` und die übrigen `packages/**` hängen nicht davon ab
  (`grep -rn` ohne die Packages selbst: null Treffer). Die Stilllegung selbst führt keine Fehler ein: `lint` und `test:desktop` bestehen;
  `typecheck` und `test:core` sind im selben Workspace wegen des parallel laufenden Refactorings von `packages/physics-core`
  (neues Feld in `VerificationResult`) vorübergehend rot, die Treffer liegen ausnahmslos bei Konsumenten wie `engine-*` / `agent-tools`
  und haben mit dieser Stilllegung nichts zu tun.
- Historie (vor dieser Runde, nicht-destruktiv): Zunächst wurde nur die Paketdokumentation korrigiert, ohne Verhalten zu ändern, Packages zu löschen oder zu verdrahten.

### Auswirkungen auf die Dokumentation (umgesetzt, 2026-09-27)

- Umgesetzt: Alle in diesem Abschnitt aufgeführten Dokumente (`docs/HARNESS-UPSTREAM.md`, `docs/04-AGENT-ARCHITECTURE.md`,
  `docs/00-PRODUCT-OVERVIEW.md`, `docs/01-DEVELOPMENT-GUIDE.md`, `docs/02-ENGINEERING-STANDARDS.md`,
  `docs/ARCHITECTURE-OWNERSHIP.md`, `docs/reports/PHASE-01-FOUNDATION-REPORT.md`) wurden gemäß Variante (b) korrigiert:
  Die Markierungen „nicht verdrahtet / Stilllegung vorgeschlagen“ wurden in „stillgelegt (ADR-0002)“ geändert, und dieses Adapterpaar wurde aus den Kettendiagrammen und Paketstruktur-Listen entfernt;
  die reale Kette (Harness Tool Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Engine) bleibt erhalten,
  historische Berichte behalten ihre ursprüngliche Aufzeichnung und erhalten einen Nachtrag. Nachfolgend die damalige To-do-Liste, zur Archivierung beibehalten:
- `docs/HARNESS-UPSTREAM.md`: Diese Datei wurde mit Commit `fec8132` neu geschrieben und kennzeichnet das Paar ausdrücklich als
  „nicht verdrahtet (**nicht als Produktionskette verstehen**)“ (jetzt Zeilen 85-95) – die Faktenlage ist dort korrekt. Unter Variante (b) sollte dieser
  Block „nicht verdrahtet“ (einschließlich der drei Ebenen `@physicsos/agent-runtime → @physicsos/agent-dsh-adapter →
  deepseek-harness-adapter.ts` in den Zeilen 87-92 und der Formulierung „vorgesehener stabiler Contract“) jedoch vollständig gelöscht werden, statt als
  „vorgesehen“ stehen zu bleiben; im Upgrade-Schritt in Zeile 138 sollte auch der Satz „`@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter`
  sind derzeit noch ein PHASE-01-Gerüst“ gestrichen werden.
- `docs/04-AGENT-ARCHITECTURE.md` (diese Datei war noch nicht neu geschrieben): §2.5 „Harness und PhysicsOS entkoppeln“
  (Überschrift in Zeile 157, die Bezeichnung `agent-dsh-adapter` in Zeile 168); im ASCII-Diagramm von §3 „Agent-Gesamtarchitektur“
  die beiden Ebenen „DSH Adapter → DeepSeek Harness“ (DSH Adapter in Zeile 210); in §5 „Warum den Harness-Geschäftskern nicht forken“ die Kette mit `DSH Adapter`
  (Zeile 279); in §6 „Harness Adapter Boundary“ wird `packages/agent-dsh-adapter` als direkt vom Harness abhängiges Paket aufgeführt (Zeile 305); §7 „PhysicsAgentRuntime API“
  wird als einheitliche Runtime-Schnittstelle bezeichnet (ab Zeile 325); in §152/153/154 „Agent-Paketstruktur“ die Verzeichnisse `agent-runtime/`,
  `agent-dsh-adapter/` und deren Zuständigkeitsbeschreibung (Zeilen 3501/3520/3537); §160 „agent-workflow“ mit der
  „Physics Workflow State Machine“ (Zeile 3626) – die echte Physik-Zustandsmaschine liegt in
  `overlays/harness/files/packages/physicsos/paper-host/src/domain.ts:277` und
  `packages/physics-scene/src/scene-branch.ts`, nicht in `agent-workflow`.
- Nebenverweise (nachgetragen): `docs/00-PRODUCT-OVERVIEW.md:2483-2484`,
  `docs/01-DEVELOPMENT-GUIDE.md:276-277` und `:1599`, `docs/02-ENGINEERING-STANDARDS.md:1263`
  und `:2434`, `docs/reports/PHASE-01-FOUNDATION-REPORT.md:103-104` und `:125-126`.

## Alternativen

- **Variante (a) Verdrahten: `agent-dsh-adapter` an das verifizierte Sidecar-Protokoll anbinden.**
  Vorgehen: Am Produktionseinstieg `createTauriSidecarRpc` + `createLocalSidecarAgentTransport` konstruieren, `getSession`/`forkSession`
  ergänzen und Contract-Tests hinzufügen – die Bridge implementiert bereits vier Methoden, das Mapping von `LocalSidecarAgentTransport`
  ließe sich direkt wiederverwenden. Kosten: neue RPC-Zusammenstellung und neuer Lebenszyklus im Renderer-Prozess bzw. der Desktop-Shell; zusätzliche Wartungsfläche für eine Abstraktion ohne Konsumenten.
  Nutzen: Die Dokumentationskette würde wahr; zwischen UI und Harness gäbe es eine zusätzliche stabile Vertragsschicht. Schaden: In Produktion kein Schaden, aber es entstünde ein
  zweiter Agent-Pfad parallel zur Bridge, und beide könnten auseinanderdriften. **Grund für die Ablehnung**: Sie implementiert zur „Isolation des Harness“ eine weitere Schicht für
  Session-/Run-Mapping, obwohl der Harness über Tool-Erweiterungspunkte bereits die richtige Naht bietet; das widerspricht „keine allgemeinen Harness-Fähigkeiten neu implementieren“
  und es gibt heute keinen Bedarfsträger.
- **Variante (c) `agent-runtime` als reine Contract-Grenze beibehalten und ausdrücklich als nicht verdrahtet kennzeichnen.**
  Kosten: nur Dokumentationsänderungen, minimal; es blieben aber 243 Zeilen Typen ohne Konsumenten, die langfristig von der realen Kette abweichen, und `agent-dsh-adapter`
  wäre weiterhin ein Gerüst, das Fehler wirft. Nutzen: eine billige Naht bleibt erhalten. Schaden: keiner. **Grund für die Ablehnung**: Sie behebt nicht die Grundursache „Abstraktion, die niemand nutzt“,
  sondern macht die Übertreibung nur von „implizit“ zu „explizit“ und lässt Leser weiterhin Platz für eine nicht existierende Grenze reservieren. Will der Owner ausdrücklich die Option auf künftige
  Multi-Runtime-Unterstützung behalten, kann (c) als Übergang zu (b) dienen, doch diese ADR empfiehlt nicht, dauerhaft dort zu verharren.
