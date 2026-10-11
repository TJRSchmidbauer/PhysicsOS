# PhysicsOS: Abgleich der Architektur-Zuständigkeiten

Dieses Dokument beantwortet eine konkrete Frage: **Was ist bei PhysicsOS gegenüber dem Upstream DeepSeek Harness eigener Code, und was wird übernommen?**
Alle Schlussfolgerungen stützen sich nur auf Dateien im Repository und lokal reproduzierbare Befehle; zu jeder Zahl wird der Prüfbefehl angegeben, sodass man sie selbst erneut ausführen kann.
Der Upstream-Stand ist das Submodul `vendor/deepseek-harness`, gepinnt auf Commit `477b4f4` (Tag `dsh-v0.1.7-rc.2`, siehe `docs/HARNESS-UPSTREAM.md`).

## Fazit

**Die Agent-Runtime kommt entwurfsgemäß vom Upstream und wird nicht selbst entwickelt; die Physikdomäne, die Ergebnisprüfung, die Aufgabensemantik und die mandantenfähige Produktschicht sind eigener Code.**
Konkret: PhysicsOS schreibt Agent Loop / Session / Tools des Harness nicht neu (`README.md:159`) und behandelt den Harness als Agent-Infrastruktur; darunter liefert der eigene Code drei Fähigkeiten, die der Upstream nicht hat – Physik-Engines und numerische Prüfung, Aufgabensemantik-Parsing und Bewertung sowie die mandantenfähigen Produkt-Hosts, die diese Fähigkeiten tragen (Konten, verschlüsselter Modellschlüssel-Pool, signierte Plugins, Paper-Pipeline). Die Behauptung „nur eine UI, die dem DeepSeek Harness ein neues Gewand gibt“ trifft daher nicht zu: Unter `packages/` liegen 84.540 Zeilen eigenes `.ts` (31 Packages), unter dem Overlay weitere 36.620 Zeilen Produkt-Hosts und 49.565 Zeilen Produkt-UI-`.ts` – alles Code, den der Upstream nicht enthält. Umgekehrt trifft auch „Agent-Runtime selbst entwickelt“ nicht zu – wir bauen und pflegen keine eigenständige Agent-Runtime (**der Harness ist der Agent-Host**); die früheren Skelette ohne Konsumenten `packages/agent-runtime` und `packages/agent-dsh-adapter` wurden am 2026-09-27 stillgelegt und gelöscht (ADR-0002), siehe Abschnitt 4.

## 1. Messtabelle zum Umfang

| Bereich                                                             | Umfang (Messweise siehe unten)                            |
| ------------------------------------------------------------------- | --------------------------------------------------------- |
| Eigene Quell-Packages `packages/*`                                  | 84.540 Zeilen `.ts`, 347 Dateien, 31 Package-Verzeichnisse |
| Eigene Produkt-Hosts `overlays/harness/files/packages/physicsos`    | 36.620 Zeilen `.ts`, 178 Dateien                          |
| Eigene Produkt-UI `overlays/harness/files/packages/client/ui-physicsos` | 49.565 Zeilen `.ts` (124 Dateien) + 40.897 Zeilen `.tsx` (120 Dateien) |
| Gevendorter Upstream-Harness `vendor/deepseek-harness` (Commit `477b4f4`) | 783.758 Zeilen `.ts`, 3.643 Dateien                |
| Unser Patch `overlays/harness/upstream-changes.patch`               | 25 Dateien, 3.383 Zeilen (1.504 hinzugefügt / 373 gelöscht) |

Prüfbefehle (im Repository-Wurzelverzeichnis auszuführen; die Ausgabe entspricht den Zahlen in der Tabelle oben):

```sh
# Eigene Quell-Packages (.ts, ohne node_modules)
find packages -name '*.ts' -not -path '*/node_modules/*' -print0 | xargs -0 cat | wc -l   # 84540
find packages -name '*.ts' -not -path '*/node_modules/*' | wc -l                          # 347
ls -d packages/*/ | wc -l                                                                 # 31

# Eigene Produkt-Hosts
find overlays/harness/files/packages/physicsos -name '*.ts' -not -path '*/node_modules/*' -print0 | xargs -0 cat | wc -l   # 36620

# Eigene Produkt-UI
find overlays/harness/files/packages/client/ui-physicsos -name '*.ts'  -not -path '*/node_modules/*' -print0 | xargs -0 cat | wc -l   # 49565
find overlays/harness/files/packages/client/ui-physicsos -name '*.tsx' -not -path '*/node_modules/*' -print0 | xargs -0 cat | wc -l   # 40897

# Gevendorter Upstream-Harness: nur von git verfolgte Upstream-Dateien zählen, um materialisierte Overlay-Kopien nicht mitzuzählen (siehe Anhang)
(cd vendor/deepseek-harness && git ls-files 'packages/**' | grep '\.ts$' | grep -v '\.d\.ts$' | xargs cat | wc -l)   # 783758
(cd vendor/deepseek-harness && git ls-files 'packages/**' | grep '\.ts$' | grep -v '\.d\.ts$' | wc -l)               # 3643

# Unser Patch
grep -c '^diff --git' overlays/harness/upstream-changes.patch   # 25
wc -l < overlays/harness/upstream-changes.patch                 # 3383
```

Messweise: Zeilen werden mit `cat | wc -l` gezählt (nach Zeilenumbrüchen), `node_modules` ist ausgeschlossen; bei den Upstream-Zeilen zusätzlich `.d.ts`. Testdateien werden standardmäßig **mitgezählt** (ohne `tests/` und `*.test.ts` ergeben `packages/` 67.021 Zeilen / 265 Dateien).

## 2. Fähigkeiten, die der Upstream nicht liefern kann (eigener Code)

Zu jedem Punkt wird der reale Pfad angegeben, der sich öffnen und prüfen lässt.

- **Physik-Engines**: `packages/engine-*`, insgesamt 15 – `engine-mechanics`, `engine-electric`, `engine-magnetic`, `engine-optics`, `engine-thermal`, `engine-wave`, `engine-acoustics`, `engine-fluid`, `engine-lever`, `engine-collision`, `engine-induction`, `engine-composite`, `engine-circuit`, `engine-modern`, `engine-electric-region`. Prüfung: `ls -d packages/engine-*`.
- **Numerische Prüfung**: `packages/physics-verifier/src/{mechanics,electric,magnetic,composite}-verifier.ts` – die vom Modell gelieferten Zahlen müssen diese Verifizierer bestehen. Prüfung: `ls packages/physics-verifier/src/*-verifier.ts`.
- **Aufgabensemantik**: `packages/question-core/src/` – 9 `deterministic-*-parser.ts`, `semantic-validator.ts`, `engine-selector.ts`, `question-runtime.ts`; bei nicht modellierbaren Aufgaben wird `UNSUPPORTED_MODEL` gemeldet, statt eine Antwort zu erfinden (`workflow.ts:16`). Prüfung: `ls packages/question-core/src/deterministic-*-parser.ts`.
- **Die Brücke, mit der Modellantworten durch die Engine abgesichert werden**: `packages/agent-tools/src/physics-tool-runtime.ts` exportiert `createPhysicsToolRuntime` (Zeile 778), verwendet von `overlays/harness/files/packages/physicsos/tool-physicsos/src/index.ts:36`. Prüfung: `grep -n createPhysicsToolRuntime packages/agent-tools/src/physics-tool-runtime.ts`.
- **Paper-Review-Pipeline (persistente Zustandsmaschine)**: Die Zustände `spec|drafting|checking|review|approved|exported|failed` stehen in `overlays/harness/files/packages/physicsos/paper-host/src/domain.ts:277`; dass nach einem Neustart verbliebene `drafting`/`checking` als fehlgeschlagen gewertet werden und Lehrkräfte es erneut versuchen dürfen (Wiederherstellung toter Prozesse), steht in `paper-host/src/index.ts:132`. Prüfung: `git grep -n "'drafting', 'checking'" HEAD -- overlays/harness/files/packages/physicsos/paper-host/src/domain.ts`.
- **Mandantenfähige Konto-/Zuordnungsisolation**: `auth-host` – Aktionen werden zuerst zu einem serverseitig maßgeblichen Actor aufgelöst, der Tenant wird nicht vom Aufrufer bestimmt (`auth-host/src/identity.ts`).
- **Verschlüsselter Modellschlüssel-Pool**: `model-pool-host/src/crypto.ts` – AES-256-GCM + HKDF-Versiegelung, fail-closed bei fehlendem/gewechseltem Secret.
- **Signiertes Plugin-Manifest**: `plugin-center/src/trust.ts` prüft jeden Plugin-Eintrag mit einem Ed25519-Public-Key (`plugin-center/src/manifest.ts` ruft `verify` aus `node:crypto` auf).

Die Pfade der letzten vier Punkte haben alle das Präfix `overlays/harness/files/packages/physicsos/`.

## 3. Grenze: Welchen Upstream wir bewusst nicht ändern

- Agent Loop, Session und Tools des Harness-Core werden **nicht** PhysicsOS-spezifisch verändert (`README.md:159`).
- Eigene UI und Produktcode liegen in `overlays/harness/` und werden per Skript auf das gepinnte Upstream-Submodul aufgelegt; das Repository ändert die Upstream-Historie nicht (`README.md:166`; `node scripts/overlay/harness-overlay.mjs apply|capture`).
- Die Änderungen am Upstream sind auf eine einzige Patch-Datei `overlays/harness/upstream-changes.patch` konzentriert: 25 Dateien, 3.383 Zeilen, rund 0,4 % der 783.758 Upstream-Zeilen. Die Änderungen betreffen überwiegend Registrierung und Konfiguration (`package.json`, `tsconfig.*`, `pnpm-workspace.yaml`, `packages/bundle/web-app/presets/physics-student.patch.yml`), dazu einige wenige Integrationsnähte (`packages/client/connection/src/*`, `packages/core/session/src/known-event-types.ts`, `packages/typert/protocol/src/types.ts`, `packages/api/gateway/src/index.ts`).

## 4. Ehrliche Hinweise / bekannte Schwächen

Dieser Abschnitt hält fest, was **nicht** erfüllt ist.

- **`packages/agent-runtime` und `packages/agent-dsh-adapter` waren Skelette ohne Konsumenten (am 2026-09-27 stillgelegt und gelöscht).**
  - Vor der Stilllegung: Der Nicht-Test-Code in `src/` von `packages/agent-runtime` umfasste 196 Zeilen (plus 47 Zeilen `contract.test.ts`); der einzige Konsument im gesamten Repository war `packages/agent-dsh-adapter`, kein Produktionspfad importierte es. `packages/agent-dsh-adapter/src/deepseek-harness-adapter.ts` war ein PHASE-01-Skelett: Methoden wie `createSession` / `send` / `resume` / `cancel` machten direkt `return Promise.reject(new UnimplementedError(...))`.
  - Zur Entsorgung siehe `docs/adr/0002-agent-runtime-adapter-disposition.md` (**Status: angenommen und umgesetzt**, Variante (b) Stilllegung). Am 2026-09-27 wurden beide Verzeichnisse samt Workspace-Mitgliedschaft und Importer-Verweisen in `pnpm-lock.yaml` gelöscht; außer den Packages selbst gibt es im gesamten Repository keinen Import-Treffer, `apps/desktop` und die übrigen `packages/**` haben keine Abhängigkeit.
  - Die tatsächlich laufende Agent-Kette ist die Upstream-Schleife: Harness Agent Loop → Harness Tool Runtime → `tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier. **Der Harness ist der Agent-Host, PhysicsOS baut keine eigenständige Agent-Runtime.**
- **Die Paper-Pipeline ruft derzeit das reine Modell auf und ist noch nicht an die Engine angebunden (in Arbeit).**
  - `callModel` in `paper-host/src/draft.ts` geht direkt über `ctx.llm.stream` (Zeilen 90 / 92); daneben gibt es eine eigenständige zweite Lösung in `paper-host/src/solve.ts`.
  - Das Package `paper-host` hat derzeit **0 Stellen**, die `@physicsos/agent-tools` importieren. Prüfung: `git grep -ln '@physicsos/agent-tools' HEAD -- overlays/harness/files/packages/physicsos/paper-host/` (keine Ausgabe).
  - Daher: **in Arbeit**. Ein eigener Workstream stellt die Paper-Pipeline auf Engine-Verifikation um; solange er nicht gelandet ist und es keinen Ende-zu-Ende-Nachweis gibt, darf nicht behauptet werden, die Paper-Ergebnisse seien von der Engine verifiziert.

## Anhang: Messweise und Hinweise zum Arbeitsverzeichnis

- **Nicht direkt `find` auf `vendor/deepseek-harness/packages` ausführen**: Das Arbeitsverzeichnis dieses Submoduls wurde durch das Overlay materialisiert (nicht verfolgte Dateien mit 87.192 Zeilen, darunter `packages/physicsos`, `ui-physicsos` unter `packages/client`, `packages/storage`). Ein direktes `find vendor/deepseek-harness/packages -name '*.ts' -not -name '*.d.ts' | xargs cat | wc -l` ergibt 870.950 – das ist ein Mischwert aus „Upstream + unser Overlay“, nicht der Upstream. Die korrekte Messweise für den Upstream ist das `git ls-files` aus der Tabelle oben (783.758 Zeilen / 3.643 Dateien, gepinnt auf `477b4f4`).
- **Zahlen driften mit dem Arbeitsverzeichnis**: Dateien wie `paper-host/src/solve.ts` werden gerade nebenläufig geändert, die mit `find` im Arbeitsverzeichnis gemessenen Zeilenzahlen ändern sich; für stabile Werte mit `git` gegen `HEAD` messen, z. B. `git grep -h '' HEAD -- ':(glob)overlays/harness/files/packages/physicsos/**/*.ts' | wc -l` (→ 36.620).
