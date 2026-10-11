# Übergabeanweisung (Wechsel des Geräts / Erste Schritte in einer neuen Umgebung)

Diese Datei richtet sich an alle, die PhysicsOS auf einem anderen Rechner weiterentwickeln möchten. Nach dem Lesen dieser Seite ist die Umgebung einsatzbereit und es ist klar, in welchem Zustand sich der Code aktuell befindet, was bereits erledigt ist und was noch offensteht.

---

## 1. Aktueller Branch und derzeitige Arbeiten

| Eintrag | Wert                                                                    |
| ------- | ----------------------------------------------------------------------- |
| Repository | `https://github.com/122-syf-wcy/PhysicsOS.git`                           |
| Branch | `codex/experiment-studio-polish` (identisch mit `main`)                  |
| Commit | `1f41b3a` (26.09.2026; Arbeiten zur Konsolidierung von P0–P2 liegen noch im Arbeitsverzeichnis und wurden noch nicht committed) |
| Inhalt | Experimentierstudio → Kontosystem → Admin-Konsole → Ressourcenbibliothek → Prüfungsstudio → Schulweite `/api`-Kontoisolation → Konsolidierung P0–P2 |

Der aktuelle Konsolidierungsplan für P0–P2 ist unter
[`docs/superpowers/plans/2026-09-26-p0-p2-program.md`](superpowers/plans/2026-09-26-p0-p2-program.md)
zu finden. Der Plan umfasst den Produktionsbetrieb, Passwortwiederherstellung, geräteübergreifenden Lernverlauf, Klassenaufgaben, Erweiterung der Physikinhalte, Desktop-Hülle und technische Zugangskontrollen.

> **Dieser Abschnitt bezog sich zuvor auf `feat/circuit-living-effects` / `794b9d0` und ist nicht mehr aktuell.**
> Dieser Branch wurde bereits per Fast-Forward in `main` integriert (zu überprüfen mit `git branch --contains 794b9d0`).
> Derzeit zeigen `main` und `codex/experiment-studio-polish` auf denselben Commit.

Da `main` bereits die vollständige Historie enthält, kann direkt wie folgt vorgegangen werden:

```bash
git clone https://github.com/122-syf-wcy/PhysicsOS.git
```

---

## 1.1 Arbeitsumfang der Woche (12.09.2026 – 21.09.2026)

In dieser Woche wurden die Arbeiten **eine ganze Woche lang nicht committed** (335 Dateien, +16.724/−5.747 Zeilen existierten ausschließlich im Arbeitsverzeichnis; ein Fehler beim `apply` oder ein Festplattenausfall hätte den gesamten Stand verloren). Am 21.09. wurden die Arbeiten dann thematisch nachgeliefert:

| Thema | Inhalt |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `fix(packages)` | Alle fünf am 14.09. überprüften P0-Fehler zur physikalischen Korrektheit behoben (vorgegebene Zeitspanne / Abwurfbedingungen beim Schrägwurf / Ablenkung zwischen parallelen Platten / Horizontale Resultierende beim zweiten Newtonschen Gesetz / ehrliches Verweigern bei Vergleichsaufgaben) |
| `feat(question-paper)` | Neues Paket für den Prüfungsbereich: Feinplan / Zusammenstellung / Prüfung / Versions-Hash / Markdown-Export |
| `feat(auth-host)` | Kontosystem mit Schulen als erster Mandantenebene: argon2id, HttpOnly-Sitzung, Ratenbegrenzung, CSRF, `/physicsos/auth` |
| Admin-Konsole | Vier Tabs: Antragsprüfung / Schule / Benutzer / Audit-Protokoll, `/physicsos/admin`, rollenbasierte Routen + Mandanteneinschränkung |
| `feat(ui)` | Anmelde- und Registrierungsportal, Schulidentität in Seitenleiste, Ressourcenbibliothek (926 begleitende Ressourcen), Prüfungsstudio, Aufgabenbankeingabe |
| Experimentierarbeitsplatz | Integration von Material-Sprites, freies Verschieben + automatisches Neuanordnen von Leitungen, direkte Bedienung von Schaltern/Schiebereglern in der Zeichenfläche |
| Assets | Material-Sprites (Stromkreis + Mechanik), Ressourcenbibliothek/Login-Seitenmaterial, KaTeX, statische Website |
| Zugangskontrollen | `auth-host`/`paper-host` in `pnpm typecheck/lint/test` integriert; `lint` und `test` vollständig erfolgreich |

**Noch offen:** Siehe `docs/reports/BACKLOG.md` (`GUIZHOU_SCHOOL_ROSTER_HIGH_SCHOOL_GAP`, `DSH_CREDENTIALS_SCHEMA_SKEW` u. a.).

---

## 2. Einrichten der Umgebung (in Reihenfolge)

### 2.1 Abhängigkeiten und Submodule

`vendor/deepseek-harness` ist ein fest verankertes Submodul. Nach dem Klonen ist es zunächst leer und muss initialisiert werden:

```bash
git submodule update --init --recursive
pnpm install
```

### 2.1.1 Node-Version: **Muss ≥ 24.7 sein und über ein OpenSSL mit argon2id verfügen**

`auth-host` verwendet argon2id aus `node:crypto` zum Hashen von Passwörtern. Ohne diese Funktion verweigert das Plugin das Laden, sodass der gesamte Web-Dienst nicht gestartet werden kann. Dies ist keine Empfehlung, sondern eine zwingende Voraussetzung. Aus diesem Grund wurde `engines.node` im Root von `>=20.19.0` auf `>=24.7.0` angehoben.

Zwei häufige Stolperfallen:

- **„Funktion vorhanden“ bedeutet nicht „funktionsfähig“.** Einige Node-Builds exportieren zwar `crypto.argon2Sync`, verfügen aber über kein OpenSSL mit argon2id. In diesem Fall wird beim Aufruf `ERR_CRYPTO_ARGON2_NOT_SUPPORTED` geworfen. Auf diesem System trat dieser Fall bei einem vendored Node 24.18.1 auf.
  `passwords.ts` prüft die Funktionsfähigkeit nun, indem es argon2id einmal mit minimal zulässigen Parametern tatsächlich ausführt. Bei einem Fehler wird eine einzeilige Meldung ausgegeben:
  `auth-host requires a working argon2id: … (Node v24.18.1; needs >= 24.7 built against an OpenSSL with argon2id)`. Der alte Prüfansatz `typeof … === 'function'` wurde daher verworfen.
- **`pnpm exec` erbt den `PATH` des aufrufenden Systems.** Wird `pnpm …` aus einer Umgebung aufgerufen, in der bereits eine andere Node-Installation im `PATH` liegt, kann `node` innerhalb von Skripten genau diese Version (und nicht die über `node -v` angezeigte) sein.
  Symptom: Tests in auth-host schlagen massenhaft fehl. Zur Überprüfung:
  Ist `pnpm -C vendor/deepseek-harness exec node -v` nicht aussagekräftig, lassen Sie `node -v` direkt im betreffenden Skript ausgeben. Falls nötig, kann der Pfad gezielt angepasst werden, z. B. `PATH="/opt/homebrew/bin:$PATH" pnpm test`.

```bash
node -v                                   # Erwartet v24.7+ mit argon2-Unterstützung
node -e "console.log(typeof require('node:crypto').argon2Sync)"   # function
```

### 2.2 Übertragen des Overlays in `vendor` (wichtiger Schritt)

In diesem Repository wird **nicht direkt in `vendor`** geändert. Der eigentliche Quellcode von PhysicsOS befindet sich in `overlays/harness/files/`. Dieses Overlay wird über ein Skript in den `vendor`-Arbeitsbereich übertragen:

```bash
node scripts/overlay/harness-overlay.mjs apply
```

`apply` führt eine überlagernde Kopie durch und löscht weder `node_modules/` noch `lib/` im `vendor`-Verzeichnis.

Werden hingegen Änderungen direkt in `vendor` vorgenommen, müssen diese zurückgespeichert werden, da sie sonst beim nächsten `apply` überschrieben würden:

```bash
node scripts/overlay/harness-overlay.mjs capture
```

**Der häufigste Stolperstein:** Es reicht nicht, nur `vendor` zu ändern.

> ⚠️ **Wird ein Paket in `OVERLAY_PATHS` vergessen, existiert es nur noch in `vendor` und geht stillschweigend verloren.**
> Genau so erging es einst `paper-host` (das gesamte Backend des Prüfungsstudios, 13 Dateien): Im Submodul war es als unverfolgte Datei (`?? packages/physicsos/`) vorhanden, nicht jedoch im Overlay, und auch im übergeordneten Repository war es nicht sichtbar (`git ls-files | grep paper-host` war leer). In der Folge fehlte nach Durchlaufen des im Handbuch beschriebenen Prozesses für neue Rechner das Backend des Prüfungsstudios **vollständig**, und `git clean -fdx` oder jeder Neuaufbau des Submoduls hätte es gelöscht. Am 21.09. wurde es in das Overlay aufgenommen und verifiziert, dass `apply` es byte-genau wiederherstellt.
>
> **Checkliste zum Hinzufügen eines neuen Host-Plugins** (alle drei Schritte sind erforderlich):
>
> 1. Verzeichnis unter `overlays/harness/files/...` erstellen (ohne `node_modules` / `lib`)
> 2. Pfad in `OVERLAY_PATHS` innerhalb von `scripts/overlay/harness-overlay.mjs` eintragen
> 3. Einbindung in `cordis.patch.yml` + Hinzufügen der Abhängigkeit zu `package.json` + Neuaufbau
>
> Selbstprüfung: Jeder Eintrag mit `??` aus `git -C vendor/deepseek-harness status --short | grep '^??'` muss einem entsprechenden Eintrag in `OVERLAY_PATHS` zugeordnet werden können.

> ⚠️ `overlays/harness/upstream-changes.patch` muss in **vollständiger Version** vorliegen (ca. 43 Upstream-Dateien, über 1860 Zeilen). Er deklariert und rendert die PhysicsOS-spezifischen Slots `sidebar.brand/nav/new`, `conversation.hero.*`, `conversation.surface` usw. In `ecc7286` wurde der Patch versehentlich auf 14 Zeilen reduziert; er wurde inzwischen wieder auf die Version `8c50de7` zurückgesetzt. Sollte `typecheck:web` auf einem neuen Rechner Fehler wie `"sidebar.nav" not in SlotMap"` melden, ist zunächst zu prüfen, ob der Patch vollständig ist.

> ⚠️ **`apply` stellt weder `lib/` noch `node_modules/` wieder her.** (`node_modules` sind Workspace-Links von pnpm, `lib/` enthält Build-Artefakte.) Wird ein gesamtes Paketverzeichnis verschoben und anschließend über `apply` wiederhergestellt, liegen nur noch die Quelldateien vor. In diesem Fall müssen sowohl `pnpm install` als auch der paketinterne Build (`pnpm run bundle`) erneut ausgeführt werden. Andernfalls kann die Typauflösung auf `any` zurückfallen und die typbewussten Regeln von `oxlint` (z. B. `no-unsafe-*`) können von einigen Dutzend auf über tausend Fehler ansteigen. Dieses Symptom ist ein klarer Hinweis auf unterbrochene Typauflösung und nicht auf fehlerhaften Code.

### 2.4 Build-Reihenfolge für einen neuen Rechner (erprobt)

Bevor `pnpm dev` den Dienst startet, müssen auf der `vendor`-Seite nach dem `apply` des Overlays folgende Artefakte vorliegen:

```bash
cd vendor/deepseek-harness
pnpm install                       # Erstellt Workspace-Links; lefthook postinstall kann bei Fehlschlag ignoriert werden
./node_modules/.bin/tsc -b tsconfig.host.json
./node_modules/.bin/tsdown --config tsdown.config.ts --env.DSH_BUILD_FACE=host
./node_modules/.bin/tsc -b tsconfig.client.json   # Vorhandene Typfehler in Upstream-Testdateien, nicht durch Overlay verursacht
./node_modules/.bin/tsdown --config tsdown.config.ts --env.DSH_BUILD_FACE=client
pnpm --filter @deepseek-ai/dsh-web-frontend exec vite build   # Frontend dist
```

Falls beim ersten `pnpm dsh dev` gemeldet wird, dass Profilpakete fehlen, zuerst `pnpm dsh plugin --profile web install` ausführen.
Initialisiert `~/.dsh/profiles/`.

### 2.3 `.env` (wird nicht mit dem Repository versioniert und muss manuell erstellt werden)

`.env` wird von `.gitignore` ausgeschlossen und enthält die Zugangsdaten für das Bildgenerierungsgateway. Kopieren Sie auf einem neuen Rechner `.env.example` und tragen Sie die erforderlichen Werte ein:

```
PHYSICSOS_IMAGE_PRIMARY_BASE_URL=
PHYSICSOS_IMAGE_PRIMARY_API_KEY=
PHYSICSOS_IMAGE_PRIMARY_MODEL=gpt-image-2.5-sunburst
PHYSICSOS_IMAGE_SECONDARY_BASE_URL=
PHYSICSOS_IMAGE_SECONDARY_API_KEY=
PHYSICSOS_IMAGE_SECONDARY_MODEL=
```

Derzeit wird als primäres Gateway `https://image.haqiuhaqiu.xyz` mit dem Modell `gpt-image-2.5-sunburst` verwendet.
Zu beachten: Die beiden Zugangsschlüssel sind **nicht domänenübergreifend austauschbar**. Ein Schlüssel für `imageapi.top` erzeugt bei `haqiuhaqiu` den Fehler `INVALID_API_KEY` und umgekehrt. `imageapi.top` kann als Backup dienen (verwendet dasselbe Modell).
Die Schlüssel werden vom jeweiligen Verantwortlichen separat übergeben und dürfen **auf keinen Fall** in Dateien geschrieben werden, die committet werden.

### 2.3.1 Agent-Modellrouting (`~/.dsh`, nicht im Repository)

Der Physik-Tutor nutzt den `llm-pi-ai`-Provider des Harness (`llm-deepseek` ist fest auf text-only verdrahtet und kann keine Bilder ausgeben). Die Konfiguration liegt im **Harness-Home** (`~/.dsh/`), nicht in der `.env` des Repositories:

- `~/.dsh/.env`: `PHYSICSOS_MODEL_API_KEY=<vom Verantwortlichen übergebener sk-…-Schlüssel>`
- `~/.dsh/settings.yaml`: Provider-Profil + Standardmodell ergänzen:

```yaml
llm-pi-ai:
  providers:
    anna:
      displayName: Anna
      api: openai-completions
      baseURL: https://ai.anna.tf/v1
      apiKeyEnv: PHYSICSOS_MODEL_API_KEY
      transport: sse
      # Gateway-WAF blockiert die Standard-UA des OpenAI SDK (OpenAI/JS * → 403), daher muss sie angepasst werden
      headers:
        User-Agent: physicsos-dev/1.0
      compat:
        thinkingFormat: deepseek
      defaultInput: [text, image]
      models:
        - id: DeepSeek V4.1 Flash # Genau diese ID muss verwendet werden (Groß-/Kleinschreibung beachten)
          name: DeepSeek V4.1 Flash
          contextWindow: 1000000
          maxTokens: 8192
          input: [text, image]
agent-default-model:
  provider: anna
  model: DeepSeek V4.1 Flash
```

Überprüfung: `node tests/agent/real-model-smoke.mjs` (benötigt die beiden obigen Dateien; vollständige Headless-Prüfung mit Assertion von anna-Routing, Aufruf von `physics_solve_question` und `physics/scene`-Ereignissen).

---

### 2.5 Schema-Abweichung in `~/.dsh/.credentials.yaml` (blockiert den Start)

**Symptom:** `pnpm dev` startet nicht und meldet:

```
credentials-local: the value for "version" in ~/.dsh/.credentials.yaml must be a string
```

**Ursache:** Diese Datei kennt zwei inkompatible Schreibweisen.

- Im in diesem Repository verwendeten (gepinnten) Harness behandelt `credentials-local` den **Wurzelknoten** der YAML als flache Tabelle (Schlüssel → String-Geheimnis) und prüft jeden Eintrag über `credentialRef()` darauf, ob der Schlüsselname ein gültiger POSIX-Bezeichner ist.
- DSH Desktop 2.x schreibt die Datei jedoch als **verschachteltes Dokument** um:

```yaml
version: 1 # ← Zahl, kein String
records:
  client-connection/browser-session: { … } # ← Schlüsselname ist kein POSIX-Bezeichner
refs:
  LUCK_API_KEY: sk-…
  CLINE_API_KEY: sk_…
```

Der alte Parser begegnet dann dem Root-Schlüssel `version: 1` und wirft einen Fehler, sodass der Dienst **gar nicht startet**. Dies ist kein Codefehler, sondern eine Abweichung zwischen Host-Version und vendored Harness – die Datei wurde offenbar von einer anderen Version überschrieben, und ein Neustart führt zu diesem Problem.

**Vorübergehende Umgehung** (die Datei der DSH-Desktop-Installation sollte nicht verändert werden, da sie möglicherweise ein neues Format verwendet):

```bash
H=/tmp/dsh-physicsos-home
mkdir -p "$H/storages"
for f in profiles settings.yaml .env .anonymous-user-id; do
  ln -s "$HOME/.dsh/$f" "$H/$f"
done
# Nur den refs-Abschnitt in eine flache Zuordnung umformen (auf 0600-Berechtigungen achten)
DSH_HOME="$H" pnpm -C vendor/deepseek-harness dsh web
```

`DSH_HOME` ist ein offiziell unterstützter Überschreibungspunkt (`packages/util/home-paths`). Beim Verlinken von `profiles/` sollte ein Symlink verwendet werden – dieses Verzeichnis enthält etwa 300 MB an `node_modules` und lässt sich nicht sinnvoll kopieren.

Genau diesen Ansatz verfolgt `startIsolatedServer()` in `tests/acceptance/support.mjs` und kann als Vorlage dienen.

**Dauerhafte Lösung (noch offen):** Das gepinnde Harness auf eine Version aktualisieren, die verschachtelte Credential-Dateien lesen kann, oder den Host und das Repository dazu bringen, dieselbe Credentials-Implementierung zu verwenden. Siehe `docs/reports/BACKLOG.md` unter `DSH_CREDENTIALS_SCHEMA_SKEW`.

---

### 2.6 Herkunft der Aufgabenbankdaten (`scripts/ingest-ceval-physics.mjs`)

Die tatsächlichen Daten der Aufgabenbank (`bank_items`) werden über ein wiederholbar ausführbares Skript importiert:

```bash
node scripts/ingest-ceval-physics.mjs --dry-run   # Nur Mapping ausführen und Beispiel anzeigen
node scripts/ingest-ceval-physics.mjs             # In :3080 schreiben
node scripts/ingest-ceval-physics.mjs --base http://127.0.0.1:3099
node scripts/ingest-ceval-physics.mjs --retag     # Nach Änderung der Schlagwortliste neu taggen
```

**Stapelüberprüfung:** Nachdem 388 Aufgaben auf einmal importiert wurden, ist eine manuelle Einzelprüfung nicht praktikabel. Im Prüfungsstudio → Ressourcensammlung „Originalprüfungen“ → Bereich „Zur Prüfung“ gibt es eine Bereichsauswahl sowie die Aktionen „Ausgewählte als geprüft übernehmen“ und „Ausgewählte zurückweisen“. In der Bestätigung wird ausdrücklich darauf hingewiesen, dass das Übernehmen der Quelle nicht einer vollständigen Prüfung jeder einzelnen Aufgabe gleichkommt. Die Schnittstelle ist `POST /physicsos/paper/bank/items/review-batch` (max. 500 Aufgaben pro Anfrage).

Wichtiger Hinweis: Aufgaben mit Status `verified` sind **gesperrt**. Ein `PUT /bank/items/:id` auf eine bereits geprüfte Aufgabe führt zu `409 FROZEN`. Zum Ändern muss die Aufgabe zunächst auf `pending` zurückgesetzt werden.

Als Datenquelle dient **C-Eval** (`ceval/ceval-exam`, CC BY-NC-SA 4.0) mit den Sets `middle_school_physics` und `high_school_physics`, insgesamt 401 Aufgaben im Multiple-Choice-Format. Diese Quelle wurde gewählt, da sie in dieser Umgebung die einzige mit klarer Lizenz und maschinenlesbarem Format für chinesische Physikaufgaben der Mittel- und Oberstufe ist. Kommerzielle Aufgabenbanken sind kostenpflichtig und urheberrechtlich geschützt, vollständige Prüfungsbögen der Provinzprüfungsämter sind nicht öffentlich zugänglich.

Das Skript ist idempotent: Der Server dedupliziert Aufgaben anhand eines Fingerabdrucks des Aufgabentexts. Ein erneuter Lauf liefert daher nur „bereits vorhanden“. Standardmäßig muss der Dienst **zuvor gestartet sein** – das Skript ist ein reiner HTTP-Client und schreibt nicht direkt in Speicherdateien.

> **Hinweis:** Bei diesen Aufgaben handelt es sich nicht um echte Prüfungen aus Guizhou und sie wurden mit keinem vorhandenen Prüfungsbogen abgeglichen. Aus diesem Grund hat jede Aufgabe den Status `pending` (muss durch Lehrkräfte geprüft werden), `reuseModes: ['adapt']` (darf nur als Gerüst zum Überarbeiten genutzt werden, nicht unverändert in Prüfungen übernommen werden), `answerTier: web-public`. Felder, die von der Quelle nicht bereitgestellt werden (offizielle Themenbereiche/Schwierigkeitsgrad/Fähigkeiten/Punkte), werden pro Aufgabe in `anomalies` vermerkt und sind direkt in der Prüfansicht sichtbar. Die Themenbereichs-Tags werden maschinell aus Aufgabentext und Antwortoptionen abgeleitet und mit `knowledge-derived-from-stem` gekennzeichnet.
>
> Details zu Auswahlkriterien finden sich in `docs/reports/MILESTONES.md` unter `QUESTION_BANK_DATA_V1` sowie in `docs/reports/BACKLOG.md` unter `PAPER_STUDIO_DATA_STATE`.

**Prüfungssammlung (`source_papers`):** Derzeit sind nur vier Prüfungsbögen erfasst. C-Eval liefert nur eine Sammlung von Aufgaben, jedoch keine metadaten auf Prüfungsbogenebene (Jahr/Region/Schule). Das willkürliche Hinzufügen von Prüfungsbogennamen wäre nicht korrekt. Für eine Erweiterung der Sammlung sind echte Prüfungsbögen als Quelle erforderlich.

> ⚠️ `pnpm format` (`prettier --check .`) schlägt derzeit für **alle 751 Dateien** im Repository fehl, darunter auch einige Skripte, die bereits vor dieser Iteration existierten. Dieser Check ist nicht Teil der Zugangskontrollen `lint`/`test` und war daher bislang nicht sichtbar. Lassen Sie sich davon nicht verunsichern und führen Sie nicht einfach `--write` aus. Ergänzen Sie stattdessen zunächst `.prettierignore`, um `vendor/` und generierte Dateien auszuschließen. Details siehe `BACKLOG.md` unter `PNPM_FORMAT_IS_RED`.

---

## 3. Häufig verwendete Befehle

```bash
pnpm dev              # Startet den Web-Entwicklungsdienst
pnpm typecheck:web    # Typprüfung (Client-Seite)
pnpm lint:web         # oxlint (Client-Seite)
pnpm test:web         # Vitest (Client-Seitige Tests)
```

`typecheck`, `lint` und `test` sind jeweils in drei Teilbereiche unterteilt (`:core`, `:web`, `:agent`). Ohne Angabe eines Teilbereichs laufen sie seriell für alle.

**Seit dem 21.09.2026 sind alle drei Zugangskontrollen vollständig erfolgreich** (zuvor wiesen `lint` und `test` bereits vorhandene Fehler auf):

| Befehl | Abdeckung | Ergebnis |
| ---------------- | ---------------------------------------------------------------- | --------- |
| `pnpm typecheck` | core + web + **tool-physicsos / auth-host / paper-host** | 0 Fehler |
| `pnpm lint` | core (eslint) + web (oxlint, 171 Dateien) + drei Host-Plugins | 0 Fehler, 0 Warnungen |
| `pnpm test` | core + web (44 Dateien, 686 Tests) + drei Host-Plugins (7 Dateien, 91 Tests) | Alle erfolgreich |

> `test:agent` lief zuvor **ausschließlich für `tool-physicsos`**. Die 4 Specs von `auth-host` und die 1 Spec von `paper-host` waren in keiner der täglichen Zugangskontrollen enthalten – sie wurden nur dann ausgeführt, wenn Vitest des Harness selbst auf `packages/*/*/tests/**` traf. Jetzt wird stattdessen `vitest run packages/physicsos` ausgeführt. `typecheck:agent` und `lint:agent` decken nun ebenfalls alle drei Pakete ab. Durch diese Erweiterung wurden 141 bisher nicht geprüfte Lint-Fehler aufgedeckt und behoben.

### 3.0 Browserakzeptanztests (`tests/acceptance/*.mjs`)

```bash
node tests/acceptance/auth-acceptance.mjs        # Kontosystem + Admin-Konsole (mit eigenem isoliertem Dienst)
node tests/acceptance/library-home-acceptance.mjs  # Erfordert vorab gestartetes `pnpm dev` (Verbindung zu Port 3080)
```

`auth-acceptance.mjs` **startet seinen eigenen Dienst**: Temporäres `DSH_HOME`, eigener Port 3099 und ein vom Skript selbst erstellter `SUPER_ADMIN` mit zufälligem Passwort. Nach Abschluss hinterlässt der Test keine Spuren, ist daher wiederholbar und beeinträchtigt weder die Entwicklungsdaten noch die Konfiguration des Rechners. Das zum Ausführen verwendete `node` muss argon2id unterstützen, andernfalls wird eine klare einzeilige Fehlermeldung ausgegeben.

Die übrigen Tests verbinden sich mit `http://127.0.0.1:3080`, daher muss `pnpm dev` zuvor gestartet sein.

### 3.1 Nach Änderungen am Frontendquellcode wird die Oberfläche nicht automatisch aktualisiert (unbedingt lesen)

Der Web-Dienst lädt **vorgepackte Build-Artefakte**, nicht den `src/`-Ordner:

```
vendor/deepseek-harness/packages/client/ui-physicsos/lib/client.js
```

Nach Änderungen an `overlays/harness/files/packages/client/ui-physicsos/src/` muss daher ein erneuter Build durchgeführt werden, da der Browser sonst weiterhin den alten Code ausführt:

```bash
pnpm -C vendor/deepseek-harness --filter @deepseek-ai/dsh-client-ui-physicsos run bundle
```

Für eine fortlaufende inkrementelle Neuerstellung kann stattdessen `run watch` im selben Verzeichnis verwendet werden. Ein Neuladen der Seite reicht dann aus. Wenn der Wert von `client.js?rev=` im `<head>` der Seite wechselt, wurde das neue Bundle erfolgreich vom Server ausgeliefert.

**Wichtiger Hinweis:** `pnpm test:web` führt Tests gegen `src/` aus (und kann daher erfolgreich sein), während die Anwendung tatsächlich `lib/` lädt. Am 14.09.2026 wurde dies bereits einmal deutlich: Eine Korrektur an den Messwertanzeigen in `circuit-renderer.tsx` war in `src/` vorhanden, aber noch nicht in `lib/`. Bei den Browserakzeptanztests wurde daher noch die alte Anzeige gezeigt und fälschlicherweise angenommen, der Fix sei fehlgeschlagen.

Dasselbe gilt für die Agent-Seite: `dsh-tool-physicsos` bindet den Quellcode von `@physicsos/*` direkt in `vendor/deepseek-harness/packages/physicsos/tool-physicsos/lib/index.js` ein. Nach Änderungen an physikbezogenem Quellcode unter `packages/` muss daher `pnpm run build:agent` ausgeführt und `pnpm dev` neu gestartet werden. Andernfalls liefern Werkzeuge wie `physics_solve_question` weiterhin das alte Verhalten (die am 14.09.2026 korrigierte `endTime`-Berechnung in der Mechanik meldete im Browser weiterhin v=30/200m – genau aus diesem Grund. Nach dem Neuaufbau wurde wieder v=20/75m angezeigt). Durch eine Suche nach dem Kommentar zu den wesentlichen Codeänderungen in `lib/index.js` lässt sich direkt feststellen, ob das Bundle aktuell ist.

**Dasselbe gilt für die drei Host-Plugins** (`auth-host` / `paper-host` / `tool-physicsos`): Der Dienst lädt jeweils `lib/index.js`, nicht `src/`. Nach Änderungen am Quellcode muss daher neu gebaut und der Dienst neu gestartet werden:

```bash
cd vendor/deepseek-harness
for p in auth-host paper-host tool-physicsos; do
  ./node_modules/.bin/tsc -b packages/physicsos/$p/tsconfig.json
  (cd packages/physicsos/$p && ../../../node_modules/.bin/tsdown)
done
```

**Reihenfolge beachten:** Der Einstiegspunkt von `tsdown` ist `lib/types/index.js` (Ergebnis von `tsc`). Es muss daher **zuerst `tsc -b` und danach `tsdown`** ausgeführt werden. Wird `tsdown` direkt aufgerufen, wird das alte Artefakt des vorherigen Durchlaufs gebündelt; die Folge sind Fehler wie „Route/Daten sind im Quellcode vorhanden, liefern aber 404 oder sind nicht auffindbar“.
(Innerhalb des Pakets führt `pnpm run bundle` beide Schritte in der richtigen Reihenfolge aus. Es löst jedoch die Abhängigkeitsprüfung von pnpm aus.)
In Umgebungen, in denen `lefthook postinstall` fehlschlägt, kann der Paketbuild unterbrochen werden – daher wird oben die direkte Ausführung verwendet.

> Am 21.09.2026 trat folgender Fall auf: 15 Schulen wurden zum Verzeichnis hinzugefügt, `apply` wurde synchronisiert und alle Unit-Tests waren erfolgreich, doch bei der Registrierung neuer Schulnamen im isolierten Dienst wurde weiterhin `SCHOOL_NOT_FOUND` zurückgegeben – weil `auth-host/lib` noch den alten Stand enthielt. Nach dem Neuaufbau wurden alle neuen Schulen korrekt mit 201 akzeptiert.
> **Erkennungsmerkmal:** Unit-Tests (gegen `src/`) und der echte Dienst (gegen `lib/`) kommen zu unterschiedlichen Ergebnissen.

Zur Fehlerdiagnose: Die Datei `lib/client.js.map` enthält in `sourcesContent` den vollständigen Quellcode zum Zeitpunkt des Bundlings. Ein Vergleich dieses Inhalts mit dem aktuellen `src/` pro Datei zeigt unmittelbar, in welchen Bereichen `lib/` veraltet ist:

```bash
node -e '
const m=require("./vendor/deepseek-harness/packages/client/ui-physicsos/lib/client.js.map");
const i=m.sources.findIndex(s=>s.includes("circuit-renderer"));
console.log(m.sourcesContent[i])' | diff - overlays/harness/files/packages/client/ui-physicsos/src/client/physics/circuit-renderer.tsx
```

---

## 4. Wo befindet sich die Darstellungsschicht?

Der Rendering-Code für den Stromkreisarbeitsplatz (und für alle anderen Bereiche) liegt unter:

```
overlays/harness/files/packages/client/ui-physicsos/src/client/physics/
```

| Datei | Funktion |
| ------------------------------- | ---------------------------------------------------- |
| `*-renderer.tsx` | SVG-Renderer je Bereich (`circuit-renderer.tsx` für den Stromkreisarbeitsplatz) |
| `renderers.module.css` | Stile für Renderer (Leitungen, Strom, Beleuchtung usw.) |
| `scene-visual-model.ts` | Vertrag des visuellen Modells für die Darstellungsschicht |
| `*-visual-bridge.ts` | Brücke zwischen Engine-Ergebnissen und dem visuellen Modell (entscheidend für numerische Korrektheit) |
| `tests/circuit.client.spec.tsx` | Tests für den Stromkreisarbeitsplatz |

Design-Tokens (`--physics-*`) werden **nicht in CSS-Dateien** definiert, sondern als Strings in das DOM injiziert. Der entsprechende Code befindet sich in:

```
overlays/harness/files/packages/client/ui-physicsos/src/client/chrome.ts
```

Neue Variablen müssen dort hinzugefügt werden. Wird in einem Stylesheet `var(--physics-xxx)` verwendet, ohne dass die Variable definiert ist, bleibt die betroffene Darstellung ohne sichtbares Ergebnis.

---

## 5. Pipeline zur Erstellung von Material-Sprites (Bildgenerierung)

Drei Skripte befinden sich unter `scripts/design/`:

```bash
# 1) Generierung (ca. 60 s pro Bild; 3 parallele Aufträge; liest Credentials aus .env; gibt keine Geheimnisse aus)
node scripts/design/generate-parts3d.mjs              # Alle
node scripts/design/generate-parts3d.mjs lamp-off     # Nur angegebene ID

# 2) Nachbearbeitung: Zuschneiden auf den Objektumriss, Normalisierung auf einheitliche Referenz, Komprimierung, Schreiben von manifest.json
python scripts/design/postprocess-parts3d.py

# 3) Pixelprüfung: Abschneiden am Rand / mehrere Objekte im selben Frame / unzulässige Konturlinien
python scripts/design/verify-parts3d.py
```

Die Ausgabedateien werden gespeichert unter:

```
overlays/harness/files/apps/web/public/physicsos/parts3d/
```

(Wichtiger Hinweis: Dies ist der `apps/web/public/`-Pfad **auf der Overlay-Seite**, nicht im Repository-Root. Werden Dateien direkt im Root-Verzeichnis abgelegt, werden sie bei `apply` nicht synchronisiert und gehen verloren.)

Gateway-Verhalten (praktisch erprobt): Liefert `data[0].url` zurück (kein Base64); `size: 1024x1024`; `background: "transparent"` wirkt tatsächlich, die erzeugten Bilder bringen bereits Alpha mit, ein Freistellen ist nicht nötig; ein Bild dauert etwa 60–120 Sekunden.

Die stilistische Einheitlichkeit beruht auf der `STYLE`-Konstante in `generate-parts3d.mjs` (3/4-Ansicht, Hauptlicht von links oben, gemeinsamer Referenzmaßstab). **Bei einer Stiländerung muss der gesamte Satz neu generiert werden**, sonst passen Kamera und Lichtrichtung alter und neuer Materialien nicht zusammen.

Erste Materialliste (10 Teile): `lamp-off`, `lamp-on`, `resistor`, `rheostat`, `battery`, `switch-open`, `switch-closed`, `ammeter`, `voltmeter`, `terminal`.

---

## 6. Aktueller Status: Erledigt / Offen

### Erledigt (mit Nachweisen)

- **Stromflussanimation:** Der dunkle Punkt wurde durch einen goldfarbenen gestrichelten Pfad ersetzt. Pro Frame wird `stroke-dashoffset` fortgeschrieben, die Geschwindigkeit ist proportional zu |I| (begrenzt auf 8–90 px/s), die Richtung folgt dem berechneten Stromvorzeichen. Die KCL-Konsistenz pro Segment bleibt unverändert – nur die Phase der gestrichelten Linie ändert sich, die Geometrie bleibt die ursprüngliche Polylinie der Leitung.
- **Mehrschichtige Glühbirnenleuchtwirkung:** Eine einzelne radiale Verlaufsscheibe wurde durch drei übereinandergelegte Schichten gleicher Farbtemperatur ersetzt (Bloom / Scheibe / Kern, die letzten beiden mit `mix-blend-mode: screen`). Zusätzlich wurde der Glühfadenpfad ergänzt. Glühfaden und Leuchtschein teilen denselben normalisierten `glow`-Wert, sodass keine Widersprüche entstehen.
- **Leitungen:** Eine 1,6 px dünne mittelgraue Linie wurde zu einer Leitung mit Glanzlicht und leichter Schattierung aufgewertet.
- **Sprite-Pipeline + 10 Materialien:** Generiert, normalisiert, per Pixelprüfung abgenommen und eingepflegt.
- **Material-Sprites in die Darstellungsschicht integriert** (diese Iteration): Der statische Katalog `parts3d-catalog.ts` bleibt mit `manifest.json` in Übereinstimmung (durch Tests abgesichert). `circuit-renderer.tsx` wählt das Sprite anhand von `kind` aus und platziert es normalisiert über `solidBox`. Vektorsymbole bleiben als Fallback erhalten (kein Mapping / `<image>`-onError; Fehler werden pro `component id` einzeln protokolliert). Schalter auf/zu, Schiebereglerzeiger, A/V-Skalenbuchstaben, Strompfeile und Leuchtmittelpunkte wurden alle im Betrieb verifiziert.
- **Freies Verschieben von Materialien + automatisches Folgen der Leitungen** (diese Iteration): Neue Szenenanweisung `SetComponentPlacement` (`physics-scene/src/scene-runtime.ts`) – prüft `circuitId`/`componentId`, endliche Koordinaten und optionale Rotation in 90°-Schritten und schreibt nach `circuit.metadata.layout.components`. Verbundene Leitungen werden nach dem Modell „physikalische Leitung“ neu angeordnet (`circuitLayoutPlace` → `rerouteWire`, `circuit/circuit-scene.ts`): Alle Knicke auf der nicht bewegten Seite bleiben erhalten, das bewegte Ende erhält an der alten Leitungsachse einen Brückenknick, und ein rechteckiger Kreislauf bleibt nach dem Verschieben rechteckig statt von diagonalen Linien zerschnitten zu werden. Es wird ein `ComponentPlacementChanged`-Ereignis ausgelöst. Diese Anweisung beschreibt Darstellungsmetadaten, keine physikalischen Fakten: Sie **forkt die Aufgabenszene nicht** (in den `FACT_COMMANDS` von `experimental-branch.ts` ausdrücklich nicht enthalten) und **spult die Zeitachse nicht zurück** (`rewind: false`). Auf der Rendererseite erfolgt das Ziehen per Pointer: Die Trefferfläche ist ein transparentes Rect über `solidBox` (Spritebild mit `pointer-events: none`); weniger als 3 px gelten als Klick. Während des Ziehens führt die Laufzeit nur eine Vorschauaufnahme durch (Viewport wird fixiert, um automatisches Zoomen zu verhindern); erst beim Loslassen wird eine formelle Anweisung übermittelt; `pointercancel` löst über `cancelComponentPlacement` ein Zurückspringen aus. Vorschau und Übermittlung rasten die Komponentenmitte auf **0,5 Raster** ein – frei verschiebbar, aber am Ziel ausgerichtet. Dies ist der Schlüssel dafür, dass das Bild nach dem Verschieben weiterhin stimmig bleibt. Die inverse Projektion `sx/sy` wird an `RendererProjection` (`PhysicsCanvas`) ergänzt; andere Bereichsrenderer sind nicht betroffen.
- **Direkte Bedienung von Schaltern/Schiebern auf der Zeichenfläche** (diese Iteration): `ComponentControlChannel` (`renderer-registry.tsx`) läuft parallel zum Drag-Kanal und wird über `PhysicsCanvas` weitergeleitet. Die Laufzeit stellt vier Methoden bereit: `setSwitchState`/`previewSliderPosition`/`commitSliderPosition`/`cancelSliderPosition` (`circuit-workspace-runtime.ts`). Die Gesten-Zustandsmaschine in `circuit-renderer.tsx`: Wird der Schiebereglerbalken gedrückt (anhand der an `sliderRail` gemessenen Geometrie), wird direkt geschoben, nicht das gesamte Bauteil gezogen. Beim Schalter gilt Loslassen unter 3 px als Umschalten, darüber als Verschieben; `pointercancel` löst über `cancelSliderPosition` ein Zurückspringen aus. Die Schiebervorschau zeichnet nur und spult nicht zurück; bei t=0 wird anhand der Griffposition gelöst (`sliderPositionAt`-Gleichung), Anzeige und Beschriftung folgen in Echtzeit. Beim Loslassen wird eine `SetSliderPosition`-Anweisung in die Version übernommen. Tastatur: `data-control="switch-*"` (role=switch, Enter/Space) und `data-control="slider-*"` (role=slider, Pfeiltasten ±5 %, Home/End). QuestionSpace verwendet diesen Kanal nicht; die Aufgabenzeichenfläche bleibt schreibgeschützt.
- **Integration der Mechanik-Material-Sprites** (diese Iteration, C1–C3): Neue Datei `mechanics-parts3d-catalog.ts`; die Ankerpunkte stammen aus den in `parts3d/mechanics/manifest.json` gemessenen Werten – `anchorLine` (Oberkante des Brettes), `anchorPoint` (unterer Kontaktpunkt von Block/Wagen/Gewichtshaken), `radius` + Mittelpunkt (Kugel). `Body` in `primitives.tsx` wählt das Sprite anhand von `kind`: Bei Kugelmittelpunkt-Anker wird die Mitte ausgerichtet, sonst wird der untere Kontaktpunkt auf die Szenengeometrie gedrückt. `Incline` dreht die `plank`-Ankerlinie auf die Schräge (die orthogonale Seitenansichtsrotation ist eine exakte Transformation). Keilauflage und Bodenlinien werden weiterhin im Code gezeichnet; Vektoren/Bahnen/Maßlinien/Punktmarkierungen bleiben alle unverändert. Ohne Mapping oder bei `<image>`-onError wird auf die ursprüngliche Vektorzeichnung zurückgegriffen. `verify-parts3d.py` führt das Mechanics-Manifest zusammen (Präfix `mechanics/`), alle 24 Teile bestanden; der Paritäts-Test erkennt Mechanikeinträge nun ebenfalls am Präfix.
- **Strukturierte Versuchsmetadaten** (P0, diese Iteration): Neue Datei `physics/experiment-summaries.ts` – 44 Vorlagen deklarieren jeweils `coreModel/parameters/feedback/errors` + Zuordnung zum Lehrbuch (Volksbildung) + Suchalias + Schritt-für-Schritt-Anleitung, getrennt vom Mapping in `experiment-templates.ts` (nach dem Vorbild von `experiment-artwork.tsx`, ohne Eingriff in die Vorlagendateien). Der Paritäts-Test `experiment-summaries.client.spec.ts` (7 Fälle) stellt sicher: jede Vorlage muss vorhanden sein und alle vier Angaben nicht leer, implementierte Vorlagen müssen Lehrbuchzuordnung und Anleitung besitzen, Aliase müssen nicht leer und innerhalb eines Eintrags eindeutig sein. Das Datenpanel des Arbeitsplatzes enthält nun den Tab „Kernpunkte“, der die vier Karten + Lehrbuchzuordnung rendert; die Suche im Versuchszentrum bezieht Aliase mit ein.
- **Versuchswerkzeuge** (P1, diese Iteration): Der Dialog „Versuchsanleitung“ in der Symbolleiste (`ExperimentGuidePanel.tsx`, Schritte + erwartete Erscheinungen + Lehrbuchzuordnung); die Schaltfläche „Datenexport“ im Kopf des Datenpanels schreibt die aktuelle Datentabelle als CSV-Download.
- **MathText → KaTeX** (P2-Entscheidung, diese Iteration): Nach der Entscheidung des Nutzers, die Darstellungsweise zu wechseln, wurde `MathText.tsx` auf die Normalisierung `toTexExpression` umgestellt (`math-symbol.ts`: Unicode-Dialekt → TeX, `½`→`\tfrac`, `ᵢ`→`_{i}`, `√`→`\sqrt`, griechische Buchstaben, Vollwinkel-Satzzeichen, CJK→`\text{}`, Fließtextwörter mit ≥4 Buchstaben→`\mathrm{}`) + `renderTexToReact` (neuer Export aus `dsh-client-ui-primitives`, KaTeX-Satz). `katex.min.css` und die Schriften werden als statische Assets unter `/physicsos/katex/` bereitgestellt (beim Mounten der Komponente wird einmalig `<link>` injiziert). Auf der SVG-Seite verwendet `MathLabel` weiterhin `parseMathSymbol` – die Beschriftungen der Zeichenfläche benötigen keine Brüche.
- **P3-a Mechanik-Erweiterungspaket** (diese Iteration, 7 neue Vorlagen):
  - `force-composition` Kräftezerlegung/Zusammensetzung: freier Körper im 3-4-5-Verhältnis, `appliedForce` + neues Feld `appliedForces` für mehrere Kräfte (`mechanics-scene-factory.ts`), resultierende Kraft 5 N direkt nachprüfbar; **kein Schwerkraftfeld** – mg/N-Kräftepaare heben sich nur gegenseitig auf und würden zwei fiktive Pfeile hinzufügen.
  - `concurrent-equilibrium` Gleichgewicht zentraler Kräfte: 8 N, drei Kräfte im 120°-Winkel, ΣF exakt null.
  - `apparent-weight` Übergewicht/Leichtigkeit: vertikale gleichförmige Beschleunigung (m=60, a=2), der Inspector leitet die Zeile „Scheingewicht“ N=m(g+a)=708 N ab, die bei vertikaler Beschleunigung ungleich null automatisch erscheint.
  - `chase-meeting` Verfolgung und Treffen: nutzt das Kollisions-Zweikörpersystem (y-Spur um 1,4 m versetzt > Summe der beiden Radien, daher nie kollidierend), Treffen bei t=2 s, x=2 m; der Schnittpunkt der x–t-Kurven ist die Lösung.
  - `vt-area` v–t-Diagramm und Weg: v₀=2, a=1,5, Trapezfläche.
  - `hooke-law` / `friction-static`: Die Engine besitzt keinen Löser für veränderliche Federkräfte oder Haft-/Gleitreibung. Ehrlich als `comingSoon` gekennzeichnet; `createScene` wirft einen Fehler, statt eine Scheinimplementierung zu liefern.
  - **Beobachtungsschicht gibt benutzerdefinierte Kräfte aus:** Zuvor fehlten Beobachtungen zu `applied`-Kräften vollständig (`FORCE_STYLES.applied` war eine tote Konfiguration). Nun wird jede Kraft aus `scene.forces` einzeln ausgegeben; die Visual Bridge nummeriert dedupliziert als F₁/F₂/F₃.
  - **Bahnerkennung der Bridge verschärft:** `isLinearModel→Bahn zeichnen` wurde zu `isHorizontalLinear` (v0y≈0 und ay≈0) – vertikale und schräge Bewegungen erhalten keine horizontale Bahn mehr. Die Wagenform wird nur bei echter eindimensionaler Horizontalbewegung als `cart` verwendet, sonst als `block`.

### Offen

- Die Ankerpunkte in `manifest.json` basieren auf **geometrischen Konventionen** (`anchorSource: "geometry-convention"`), nicht auf einer visuellen Vermessung jedes einzelnen Bauteils. Für Batterie, Schieberegler und Glühbirne wurde `axis` bereits auf `base` korrigiert (Anschlüsse befinden sich an Basis/Oberseite, nicht an den seitlichen Enden). Für noch genauere Anschlussankerpunkte ist eine Vermessung der einzelnen Bauteile erforderlich.
- `lamp-off` / `lamp-on` sind noch nicht aktiviert: Im aktuellen visuellen Modell gibt es noch keinen eigenen Typ für Glühbirnen; dissipative Lasten werden derzeit einheitlich als Widerstandskomponente dargestellt. Die Integration erfolgt, sobald die Szenenseite einen eigenen Lampentyp bereitstellt.
- Für den `terminal`-Sprite gibt es noch keinen entsprechenden Komponententyp; er ist daher noch nicht angebunden.
- Mechanik-Sprites sind bereits für `Body` und `Incline` angebunden. `Platform`, Haken mit Gewicht u. a. werden noch als Vektorgrafiken dargestellt. Andere Bereiche (Wellen, Induktion usw.) sind noch unverändert.
- Das Plank-Sprite hat an beiden Enden Metallklammern, die geringfügig über die Schrägkante des Keils hinausragen (die Ankerlinie nimmt ca. 92% der Bildbreite ein). Optisch wirkt es daher eher wie eine auf einem Keil gelagerte Platte als wie eine Platte, die direkt die Schräge bildet – ob die überstehenden Ränder beschnitten werden sollen, ist noch zu entscheiden (C4-Entscheidungspunkt).
- Die direkte Bedienung deckt derzeit nur Schalter und den Schiebereglerzeiger ab. Andere Bauteile (z. B. Messgeräte) haben noch keine bedienbaren Elemente.

### Prüfnachweise und bekannte Probleme

- `pnpm typecheck:web` läuft fehlerfrei (vorausgesetzt, der vollständige `upstream-changes.patch` wurde angewendet und das Upstream-Abhängigkeitsdiagramm ist aufgebaut).
- `circuit.client.spec.tsx`: **29/29 bestanden**, einschließlich 5 Spritespezifischer Testfälle und 7 Drag-&-Drop-spezifischer Tests (Vorschau ändert keine Revision, Viewport bleibt fixiert, halbe Rasterung, Commit am Zielort + Neuanordnung von Leitungen, Pointer-Event-Kette, Klick unter Schwellenwert, `pointercancel`-Rücksprung).
- `circuit-scene-runtime.test.ts`: **13/13 bestanden**, einschließlich Verschiebungsspeicherung bei `SetComponentPlacement`, Erhalt der Rückenlinie bei Neuanordnung, Ablehnung nicht-endlicher Koordinaten.
- **Echter Browsertest** (Chromium + Playwright, Zugangskontrolle in `tests/acceptance/support.mjs`): Reihenschaltung, alle 5 Sprite-`<image>` 200, Vektorkörper schließen sich gegenseitig aus, bei geöffnetem Schalter `switch-open.png` + Strom fällt auf null; Rheostat-Vorlage mit 6 Sprites + Schieber vorhanden; beim echten Ziehen von R1 folgt die Vorschau Frame für Frame dem Zeiger, der Zielort stimmt pixelgenau, alle 7 Leitungswege werden neu angeordnet, auch der Schalter lässt sich ziehen; console-/page-Fehler, fehlgeschlagene Anfragen und 4xx/5xx jeweils null. Screenshot-Nachweise: `docs/reports/screenshots/parts3d-{series-lab,series-switch-open,rheostat-lab,series-r1-dragged}.png`.
- **Mechanik-Sprites im Betrieb verifiziert** (diese Iteration): Mit Playwright wurden die Versuche nacheinander neu geladen (unter Umgehung des Single-Page-Navigationszustands). Bei den drei Versuchen „schiefe Ebene / schräger Wurf / gleichförmig geradlinige Bewegung“ werden die `sprite-*`-`<image>`-Elemente tatsächlich geladen und ihr `href` zeigt auf `/physicsos/parts3d/mechanics/*.png`; beim Plank stimmt `rotate=30` mit dem Neigungswinkel der Szene überein. Alle vier Zugangskontrollen null. Screenshots: `docs/reports/screenshots/parts3d-mechanics-{incline,projectile,cart}.png`.
- Der `pnpm-lock.yaml`-Abschnitt im `upstream-changes.patch` wurde entfernt – die Lockfile wird durch `pnpm install` erzeugt (enthält Link-Einträge wie `engine-collision`). Die alte Liste im Patch ist veraltet; `git apply --3way` würde darauf falsche Konflikte erzeugen.
- Ändert ein Ziehvorgang die Bounding-Box des Layouts, wird der Viewport beim Übermitteln automatisch neu eingepasst (Gesamtbild wird skaliert) – das ist beabsichtigt: Der Zielort ist im Szenenkoordinatensystem korrekt, lediglich die Projektionsskalierung hat sich geändert.
- Beim ersten Start erscheinen zwei Hinweisdialoge (Beta-Hinweis → API-Key-Einführung). Das Abnahmeskript muss nacheinander `Continue` / `Configure later` (bzw. die entsprechenden deutschen Beschriftungen) anklicken.
- `tsc -b tsconfig.client.json` für den gesamten Upstream-Baum weist vorhandene Fehler auf (Konflikt zwischen zwei Versionen von `@types/react` bei `ReactNode`/`bigint`, Strengeprüfungen von `numeric-audit`), die nichts mit dieser Änderung zu tun haben; der offizielle Bereich `typecheck:web` ist fehlerfrei.
- `pnpm lint:web` meldet Fehler, die ausschließlich Dateien betreffen, die in dieser Iteration nicht geändert wurden, und daher vorbestehen.
- Das für lokale Tests verwendete `node_modules/playwright` ist ein manuell erstellter Symlink (verweist auf den Vendor-Store) und wird über `.gitignore` ausgeschlossen; nicht committen.
- **P3-a im Browsertest** (diese Iteration): Der Picker listet alle 7 neuen Einträge; auf der Zeichenfläche der Kräftezusammensetzung sind die Pfeile F₁/F₂/ΣF vollständig und der Lesebereich zeigt „resultierende Kraft 5 N“; beim Gleichgewicht zentraler Kräfte sind drei angreifende Kraftpfeile vorhanden und kein überflüssiger resultierender Pfeil; der Lesebereich zu Übergewicht/Leichtigkeit zeigt „Scheingewicht 708 N“; bei Verfolgung und Treffen sind die beiden Kugel-Sprites vorhanden; im Register „Herleitung“ werden die MathText-Bruchknoten an 6 Stellen tatsächlich gerendert; console-/page-Fehler, fehlgeschlagene Anfragen und 4xx/5xx jeweils null. Screenshots: `docs/reports/screenshots/p3a-*.png`.
- **KaTeX im Browsertest** (diese Iteration): `tests/acceptance/katex-mathtext-acceptance.mjs` 11/11 – Stylesheet/Schriften erreichbar und nur einmal injiziert, KaTeX-Knoten im Lesebereich vorhanden, im Herleitungs-Tab von vt-area wird `.katex .mfrac` tatsächlich gerendert, keine alten `.frac`-Knoten mehr, alle vier Zugangskontrollen null Fehler. Hinweis: Die Web-Laufzeit löst `dsh-client-ui-primitives` auf `src/index.ts` auf und bindet dies in `apps/web/dist` ein. Nach Änderungen an dessen Exporten muss daher `vite build` ausgeführt und die Web-Hülle neu erstellt sowie die Seite neu geladen werden.
- **Eingestürztes Arbeitsplatz-Layout behoben** (diese Iteration): Ursache war, dass eine parallele Sitzung `conversation.surface` in `scrollBody` verschoben und mit `position:relative` versehen hatte. Nachdem `.cover` (`absolute; inset:0`) relativ zu `scrollBody` positioniert wurde, wirkt `padding-bottom: calc(--dsh-composer-height + 12px)` von `[data-conversation-scroll] .cover`. Ohne Sitzung wird beim direkten Öffnen des Labors im Composer-Sitz ein zentrierter Hero von ~956 px platziert, wodurch das Padding die Cover-Inhaltsbox auf ~10 px zusammendrückt. Behebung: `min(--dsh-composer-height, 220px)` als Obergrenze, sodass nur die tatsächliche Höhe der angedockten Eingabezeile freigehalten wird. Gemessen: `.body` 0→568 px, Canvas-SVG 450 px.
- **Vereinheitlichung des Wiedergabevertrags + Animationsoptimierung** (diese Iteration):
  - **Behebung des toten Wiederholen-Buttons**: `setRunning(true)` setzt auf null zurück und wiederholt, wenn `currentTime >= total`. Ergänzt in fünf Laufzeiten: mechanics/collision/composite/electric/circuit (wave/lever/acoustics/fluid/thermal/induction hatten dies bereits).
  - **Zyklische Modelle:** Bei `uniform_linear_motion`/`inclined_plane`/`newton_second_law` der Mechanik erfolgt am Fensterrand ein Modulo-Umlauf (das nominelle Fenster hat kein physikalisches Ende, Demonstrationsschleife); `projectile_motion` bleibt beim Aufprall stehen, `uniformly_accelerated_motion` im Endzustand (die gefüllte v–t-Fläche ist der Messwert). Die Konstante `CYCLIC_MODELS` liegt in `mechanics-runtime-bridge.ts`; Kommentar und Implementierung stimmen überein.
  - **UI nach Ende der Wiedergabe:** `ended` (total>0 und !running und time>=total) → Schaltfläche in der Symbolleiste mit der Beschriftung `lab.replay` (Wiederholen) + Transport wechselt auf Aktualisierungssymbol/aria.
  - **Tastatur:** keydown auf Dokumentebene – Space startet/pausiert, ←/→ schreitet um ±10 % vor/zurück, Home setzt zurück. Editierbare Elemente (input/textarea/select/contentEditable) nehmen nichts an; Schaltflächen/Links nur Leertaste/Enter (native Aktivierung), Pfeiltasten schreiten wie gewohnt fort.
  - **Aktuelle Zeile in der Datentabelle:** Die Zeilen sind gleichmäßig abgetastete Zeitpunkte; `round(time/total*(rows-1))` liefert die Zeile des Abspielkopfs, `.dataRowCurrent` wird mit `--physics-highlight` (semantische Farbe des Diagrammcursors) leicht eingefärbt.
  - **Einblenden beim Szenenwechsel:** `.canvas` erhält einen 24 ms `canvasIn`-Fade; der Abschnitt verwendet `domain:title` als Schlüssel und wird nur beim Versuchswechsel neu angebunden, Parameteränderungen spielen nicht neu ab; `prefers-reduced-motion` dient als Absicherung.
  - Überprüfung: `mechanics.client.spec.tsx` 4 Fälle zum Wiedergabevertrag (Schleife / Stopp beim Aufprall + Wiederholen / Stopp bei gleichförmig beschleunigter Bewegung + Wiederholen / Kollisionswiederholung), `workspace-presentation` 2 Fälle zu Tastatur + Wiederholen; Gesamtlauf 610/610; im Browser `tests/acceptance/playback-acceptance.mjs` 12/12 (Tastatur durchgängig, Wiederholen, Betriebszustand, Hervorhebung der Datenzeile, vier Zugangskontrollen null Fehler). Screenshot: `docs/reports/screenshots/animation-running-state.png`.
  - Überprüfung: `mechanics.client.spec.tsx` 4 Fälle zum Wiedergabevertrag (Schleife / Stopp beim Aufprall + Wiederholen /
    Stopp bei gleichförmig beschleunigter Bewegung + Wiederholen / Kollisionswiederholung), `workspace-presentation` 2 Fälle zu Tastatur + Wiederholen;
    Gesamtlauf 610/610; im Browser `tests/acceptance/playback-acceptance.mjs`
    12/12 (Tastatur durchgängig, Wiederholen, Betriebszustand, Hervorhebung der Datenzeile, vier Zugangskontrollen null Fehler).
    Screenshot: `docs/reports/screenshots/animation-running-state.png`.

---

## 7. Werbe-Website (neu)

Die statische Site liegt im public-Baum des Overlays, **kein Build-Schritt**:

```
overlays/harness/files/apps/web/public/physicsos/website/
```

Lokale Vorschau und Neuerzeugung der Assets:

```bash
cd overlays/harness/files/apps/web/public/physicsos/website
python3 -m http.server 4192 --bind 127.0.0.1

node scripts/design/website-shots.mjs     # erfordert vorher pnpm dev (3080)
```

Der hero-Hintergrund ist der WebGL2-Flow-Field-Shader in `lib/flow-field.js`; die
Machart ist dieselbe wie beim hero der DeepSeek-Harness-Website (dunkle Site + leuchtendes blaues Feld), die Parameter sind für PhysicsOS neu abgestimmt. Was ihn wirklich leuchten lässt, sind
die drei letzten Schritte des Shaders (bloom / Lichtquelle / Vignette), nicht das Rauschen selbst; das helle Ende der Palette muss nahezu weiß sein.
Details und Degradationsverhalten siehe `README.md` in diesem Verzeichnis.

**Eine Lektion**: In dieser Iteration wurde die Referenzseite nur im Quelltext gelesen, ohne sie zu rendern, und fälschlich als „weißer Textkörper" eingeschätzt;
das Ergebnis wich stark ab. Bevor man das Visuelle ändert, sollte man zuerst einen Screenshot der Referenzseite machen.

**Die Zahlen auf der Seite müssen mit dem Produkt abgeglichen werden**: Der hero nennt „43 ausführbare Versuchsvorlagen / 80 integrierte Aufgaben",
Grundlage sind die tatsächlichen Titel der Versuchsbibliothek und die tatsächliche Aufgabenzahl – es gibt insgesamt 45 Versuchsvorlagen; Zyklotron und stehende Saitenwelle sind
als „demnächst verfügbar" markiert und zählen daher nicht. Nach Produktänderungen das Screenshot-Skript erneut ausführen; die Bilder werden aktualisiert, die Zahlen müssen manuell geändert werden.

---

## 8. Freies Aufbauen von Stromkreisen (committet)

Schüler können selbst Geräte auswählen und selbst verdrahten; der Stromkreis wird real von der vorhandenen DC-Engine gelöst. Zwei Einstiege:
die Karte „Freies Aufbauen von Stromkreisen" im Versuchszentrum sowie der Elektrotisch (`surface.openBuilder`).

- **Aufbaumodell**: `ui-physicsos/src/client/physics/circuit-builder.ts`.
  Entwurf = Komponenten + ganzzahlige Netznamen + Platzierung; Hinzufügen/Entfernen/Verschieben/Drehen/Parameter ändern/Verbinden/Trennen sind alles reine Funktionen,
  `draftToScene` projiziert in die Eingabeparameter von `createCircuitScene`, `draftFromScene` liest umgekehrt zurück.
  **Die Szene ist die einzige Quelle der Wahrheit**, der Entwurf ist nur eine Sicht darauf; lege den Stromkreis nicht anderswo ein zweites Mal ab.
- **Struktur-Commits laufen nicht über die Befehlsliste**: `SceneCommandType` ist eine eingefrorene Menge von „Parameteränderungen", es gibt kein AddComponent/Connect.
  Strukturänderungen laufen über die Laufzeit als **In-Place-Austausch des `SceneRuntime`** (`applyDraftEdit`), **nicht** über `surface.open` –
  der `runtimeKey` von `LabWorkspace` enthält `scene.revision` und dient als React `key`; das würde den Arbeitsbereich bei jeder Bearbeitung neu einhängen.
- **Auch wenn nicht lösbar, trotzdem zeichnen**: `PhysicsWorkspace` ersetzte bei `status==='failed'` ursprünglich die ganze Zeichenfläche; im Aufbaumodus
  (`buildMode`) wird stattdessen das Schaltbild beibehalten, ohne Messwerte, der Engine-Grund wird inline angezeigt. `RuntimeErrorView.condition` bringt den
  Bedingungsnamen der Engine heraus, der von der Shell auf die zh/en-Texte von `lab.condition.*` abgebildet wird.
- **Verdrahtung**: Jeder Anschluss auf der Zeichenfläche ist ein fokussierbares Ziel (`data-terminal`). Gedrückt halten und zu einem anderen Anschluss ziehen schließt die Verbindung
  (Maus über window release, Touch/Stift über pointer capture); mit der Tastatur kann man per Enter/Space ebenfalls Anschlüsse auswählen.
- **Es gibt nur 6 Gerätetypen** (Stromquelle/Schalter/Festwiderstand/Schiebewiderstand/Amperemeter/Voltmeter) – genau die 6, die die Engine modelliert.
  Die Komponenten-ids folgen der Alias-Konvention des AI-Lernassistenten (`bat`/`sw`/`am`/`vm`/`rv`/`r0…`),
  würde man sie in `c1`/`c2` ändern, verlöre „zeig auf das Amperemeter" seine Wirkung (Alias-Tabelle in `physics-agent.ts`).
- **Überprüfung**: `tests/circuit-builder.client.spec.tsx` (32 Fälle);
  Echtgerät-Skript `scripts/design/qa-build.mjs` (einen Widerstand platzieren und zu einer Parallelschaltung ziehen, Hauptstrom 0,6 A → 1,2 A).
  Der Playwright-Browsercache stimmt möglicherweise nicht mit der im Repo gepinnten Version überein; mit `PHYSICSOS_CHROMIUM=<chrome ausführbare Datei>` darauf verweisen.

Bekannt offen: **Platzieren** neuer Komponenten per Ziehen auf der Zeichenfläche (das **Verschieben** vorhandener Komponenten per Ziehen gibt es schon lange); benanntes Speichern selbstgebauter Stromkreise / Speichern als Vorlage
(derzeit wird nur mit „letzter Bereich" eine einzige unter fester sceneId wiederhergestellt); Mobiltelefon-Größen wurden nicht separat abgenommen.

---

## 9. Vorgeschlagene Reihenfolge für die nächsten Schritte

1. Anhand echter Screenshots Stück für Stück die Verdrahtungsanker nicht-axialer Geräte kalibrieren und `anchorSource` von geometrischer Konvention auf
   gemessene Werte umstellen (die visuellen Anker von Batterie/Messgerät/Schalter haben bereits `base`-Semantik, die Genauigkeit lässt sich weiter erhöhen).
2. Bei Bedarf einen Glühlampentyp zur Szene hinzufügen und `lamp-off` / `lamp-on` aktivieren.
3. Dieselbe Pipeline auf weitere Domänen übertragen – für jede neue Domäne zuerst die Geräteliste und die Kamera-Konvention festlegen.

---

## 10. Abschluss der Lösungseinstiege: Aufgabenbereich abgeschaltet, Lösungskarte in die Sitzung (committet)

Der Aufgabenbereich (QuestionWorkspace, ~1900 Zeilen) wird vollständig abgeschaltet, seine Fähigkeiten gehen in Sitzung und Lernverlauf über;
**es gibt durchgängig nur eine Pipeline**: `processQuestion` (deterministische Analyse im question-core →
Engine-Lösung → Validierung → Szenenaufbau), gemeinsam von Hauptsitzung und altem Aufgabenbereich genutzt, es wird kein zweiter Lösungspfad hinzugefügt.

- **Das `physics/scene`-Ereignis trägt eine `solve`-Nutzlast** (`tool-physicsos/types.ts`
  `PhysicsSceneSolveSummary`): knowns/targets/answers/steps/verification/
  issues/goldenQuestionId. `physics_solve_question` wird auf dem `cause:'solved'`-
  Schnappschuss veröffentlicht; command-revidierte Schnappschüsse tragen kein solve, beim Einklappen von `scene-chat-node`
  wird das alte solve **beibehalten** (sowohl die per-scene- als auch die per-turn-Faltung).
- **Lösungskarte = `SolveSection` innerhalb von `SceneChatCard`**: Chips der bekannten Größen (Klick leuchtet die
  entsprechende Komponente auf der Zeichenfläche auf; `question-highlights.ts` aus dem alten QW als geteiltes Modul extrahiert, rein visuelles
  `setHighlight`, ohne die Szene zu verändern), Lösungsziel, Antwort, Lösungsschritte, Überprüfungs-Badge, Aufgabenstellung;
  trifft eine golden-Aufgabe die Aufgabensammlung, wird `LabSelfCheckCard` eingebettet (dieselbe Komponente wie der Labor-Selbsttest, derselbe
  `recordAttempt`-Erfassungspfad).
- **`physics_solve_question` erhält den optionalen Parameter `questionId`**: Die Übungskette übergibt die Aufgabensammlungs-id
  unverändert – das Umschreiben des Aufgabentexts durch das Modell ist kein wörtlicher Treffer; bei einem `questionId`-Treffer wird nach dem Original der Aufgabensammlung gelöst,
  erst `goldenQuestionId` reißt die Kette nicht ab (runtime `solveQuestion(text, questionId?)`).
- **Migration des Übungskreislaufs**: `practiceQuestion(questionId)` (`index.ts`) packt den Aufgabentext der Aufgabensammlung
  - den questionId-Prompt – in die aktuelle Sitzung (`submitToTutor`); bei Erfolg geht es zurück zur Gesprächsfläche und wartet auf die einströmende
    Karte; die Lernverlaufsseite stellt die Liste „Aufgabensammlungs-Übung" oben an; die Fehleraufgabenzeile teilt sich auf: Versuch-attempt →
    `Versuch wiederholen` als Deep-Link zurück zur selben Vorlagen-Lab; Aufgaben-attempt → `Übung wiederholen` läuft über practiceQuestion.
- **Flächenkonvergenz**: `openSurface` kennt nur noch `home | lab | record`; in der Sidebar bleiben Startseite/Physiklabor;
  der Lernverlaufseinstieg liegt im sidebar footer; die Portal-Karte „Aufgabe eingeben" der Startseite zeigt auf record.
- **Abnahme**: `tests/acceptance/learning-acceptance.mjs` CASE C-G alle grün –
  die echte Modellkette läuft durch „Aufgabensammlungs-Übung → tutor ruft physics_solve_question auf → Lösungskarte
  (bekannte Größen/Schritte/Überprüfung/Selbsttest + abspielbare Zeichenfläche) strömt in die Sitzung".

**Lektion zum Layoutkollaps**: Nachdem eine parallele Sitzung `conversation.surface` in `scrollBody` verschoben hatte,
verbrauchten die `padding-bottom: calc(var(--dsh-composer-height) + …)` der einzelnen surface-Wurzeln
die ~956px-Variable des hero-Zustands – an vier Stellen (LabWorkspace/ExperimentPicker/LabEmptyState/
LearningRecordWorkspace) alle auf `min(…, 220px)` gedeckelt, sodass nur die tatsächliche Höhe der angedockten Eingabezeile freigehalten wird.

---

## 11. Feder-/Pendel-/Reibungsmodelle + Mechanik-Gerätesprites (committet)

Mit liziwuli als Referenz die erste Charge, sortiert nach „Anzahl der durch die Engine je Einheit freigeschalteten Versuche": vier neue analytische Modelle
(`spring_statics`/`spring_oscillator`/`simple_pendulum`/`horizontal_friction`)

- 5 Vorlagen (hooke-law, friction-static aus Platzhaltern realisiert; spring-oscillator,
  simple-pendulum, friction-mu neu), die ganze Kette läuft über
  `PhysicsScene → Engine → Verifier → Observation → PhysicsCanvas`.

* **Szenenfakten laufen über Constraints/Observables**: Feder-k/L₀/anchor/axis hängen am `spring`-Constraint
  (`spring-1`), Pendellänge/pivot am `rope`-Constraint (`rope-1`), die Reibungsbank-μs im
  body-Material, ramp/cap im geometrischen Observablen `obs-friction-surface`. Neue Szenenbefehle
  `SetSpringConstant`/`SetPendulumLength`/`SetStaticFrictionCoefficient`
  (in `agent-tools/scene-commands.ts` synchron registriert).
* **Korrekturen der Beobachtungsschicht**: vertikal aufgehängte Körper senden keine Phantom-`normal`-Pfeile mehr (nur bei vertikalem connector
  unterdrückt; die Schienenstützkraft des horizontalen Oszillators bleibt erhalten). `spring_force` ist ein Vektor –
  die abgeleitete inspector-Zeile zeigt den Betrag.
* **Messwerte folgen dem Abspielkopf**: `buildSnapshot` bevorzugt `state.derived` des aktuellen Frames, simulationsweite
  Aggregation als Fallback – zeitabhängige Größen wie Zug-/Reibungskraft werden nicht mehr auf dem Endzustand festgenagelt.
* **Hervorhebungen an echte Element-ids gebunden**: `spring`/`pendulum`-Visuals tragen die Szenen-Constraint-id,
  die highlights des inspector zeigen sämtlich auf die gerenderten Elemente.
* **statics-Beruhigung**: beim Ändern von k/m/g wird zusätzlich zum Parameterbefehl noch einmal `SetBodyPosition`
  gesendet, um den Klotz auf den neuen Gleichgewichtspunkt zurückzusetzen – das statische Modell beschreibt den Zustand nach dem Einschwingen; zwei Befehle, zwei Ereignisse,
  die Audit-Kette ist ehrlich.

### Asset-Entscheidung (imageapi.top / gpt-image-2.5-sunburst)

Läuft über die vorhandene `generate-mechanics-parts.mjs`-Pipeline (orthogonale Seitenansicht + transparenter Hintergrund + 1 m-Basis).
Diese Charge fügt zwei **statische Geräte** hinzu:

| id              | Zweck                 | Anker (gemessene Alpha-Kontur)                           |
| --------------- | -------------------- | -------------------------------------------------------- |
| `spring-scale`  | Körper des Zugkraftmessgeräts der Reibungsbank | Hakenspitze (0.9613, 0.51), nach `flip`-Spiegelung an der Kraftangriffsfläche des Klotzes, folgt Frame für Frame |
| `support-clamp` | hooke-law/Pendelaufhängepunkt | Innenboden des Aufhängerings (0.326, 0.91), Stab ragt aus dem Bild |

- **Rendering-Pfad**: generischer Sprite-Slot `SceneVisualModel.apparatus` +
  `Apparatus`-Primitive (bei Ladefehler stiller Rückfall auf parametrisierten Aufbau). Dynamische Geometrie
  (Federwindungslänge, Fadenwinkel) bleibt parametrisiertes SVG – die Längsrichtung ist die physikalische Größe,
  dafür geht keine Bitmap.
- **Nicht generiert**: Federwindungen, Pendelkugel (vorhandener `ball`-Sprite wird direkt wiederverwendet), Kraftmesser-
  Skalenscheibe (Messwerte übernimmt die abgeleitete Zeile, Bitmap-Skalen sind tote Zahlen).
- **Hinweis**: Der dev-Server liefert `apps/web/dist` (Build-Artefakt); neue PNGs müssen
  mit ins dist synchronisiert oder das Web neu erstellt werden, um wirksam zu werden – neue Dateien unter `public/` gehen nicht automatisch online.
- Die Anker sind ins manifest geschrieben (`anchorSource: alpha-silhouette-measurement`),
  der catalog-parity-Test (`mechanics-parts3d.client.spec.tsx`) überwacht dies.

### Abnahme

- Unit-Tests: ui-physicsos 619/619 (inkl. 3 neuer Sprite-Fälle + parity-Ankerabgleich);
  engine/observation/scene-Pakete alle grün.
- Browser-Abnahme `mechanics-springs-acceptance.mjs` A–E alle grün (inkl. Sprite-
  DOM-Assertions), console/network-Gates null Fehler.

### Zweite Gerätecharge (Winkelmesser / Schiene / Lineal) + Klotz-Umrüstung

| id               | Zweck                           | Anker                                                              |
| ---------------- | ------------------------------ | ----------------------------------------------------------------- |
| `protractor`     | Winkelmesserscheibe hinter dem Pendelaufhängepunkt (Winkel ablesbar) | Mittelpunkt der Durchmesserkante (0.499, 0.129), genau gegenüber dem Scheibenachsenstift; das erzeugte Bild hat einen Sockel, weggeschnitten bis nur die Scheibe bleibt |
| `track-rail`     | Tragschiene für alle horizontalen eindimensionalen Szenen     | Mittelpunkt der Schienenoberkante (0.5, 0.388); das `width`-Feld wird auf die Schienenspannweite gedehnt               |
| `ruler-vertical` | Lineal zum Ablesen der Dehnung der Hooke-Bank             | Mittelpunkt des Messingrings am Linealkopf (0.49, 0.047)                                        |

- `ApparatusSpriteVisual.width`: explizite Szenenbreite (zum Dehnen), standardmäßig weiterhin
  aspect-adaptiv; `track-rail` füllt damit die `trackGround`-Spannweite.
- `BodyVisual.kind` erhält `'weight-hook'`: die Hooke-Bank hängt **Hakengewichte** auf (Lehrbuchdarstellung),
  der Vektor-Fallback läuft über den block-Zweig; der Federoszillator-Klotz wird zu `cart` (Luftkissenschienen-Schlitten),
  horizontale Reibung bleibt `block` (Holzklotz).
- Rendering-Reihenfolge: apparatus wird **vor** dem spring/pendulum-rig gezeichnet – die Winkelmesserscheibe liegt
  hinter dem Faden, die Schiene unter dem Klotz, der Spannring umschließt das obere Federstück.
- **Fallstrick**: Die Filterargumente von `generate-mechanics-parts.mjs` sind nackte Positionsargumente
  (`node … protractor track-rail`), `--only=x` wird als flag herausgefiltert
  und führt zu einer **vollständigen Neugenerierung**, die bereits kalibrierte Sprites überschreibt. Beim erneuten Erzeugen alter Teile muss die Nachbearbeitung separat laufen
  und die Anker neu vermessen werden; in dieser Charge wurde nach versehentlicher Auslösung die alte PNG aus vendor zurückgerollt.
- Abnahme: ui-physicsos 622/622 (+3 Fälle: Winkelmesser-/Lineal-Anker, Schienenspannweite,
  Hakengewicht/Schlitten-Umrüstung); Browser A–E alle grün, neue Assertions zählen rulers/protractors/
  rails/weightHooks/cartSprites.

### Dritte Charge: Feinschliff der Zeichenflächen-Primitive + abgerundete Schaltungsleiter + Selektor-hover

Schaltungs-Sprites (Batterie/Widerstand/Schalter/Messgerät/Glühlampe) waren längst eingebunden; diese Charge begleicht die restlichen visuellen Schulden:

- **`wirePath` (circuit-renderer.tsx)**: `M…L…`-harte Knicklinien werden zu abgerundeten Q-Segmenten
  (`WIRE_BEND_PX` als Obergrenze, beidseitige Liniensegmente je zur Hälfte beschnitten, das Minimum genommen), der Leiter wird zum Kabel;
  Vorschauleitungen und Ladungskugel-Pfade laufen durch dieselbe Funktion, die elektrischen Endpunkte bleiben unverändert.
- **`SpringCoil` als doppelgängige Spirale**: L-Zickzack → zwei Sinusstränge in gegenphasiger Phase (vorderer Strang durchgezogen
  - hinterer Strang transparent wirkend), spiralige Tiefenwirkung; die Länge bleibt pro Frame nach Szenenkoordinaten parametrisiert.
- **Kraftpfeile kräftiger**: stroke verbreitert + drop-shadow, verwandte Haptik wie die Kabel.
- **Versuchsselektor hover**: Kartenrand eingefärbt/angehoben/Schattenübergang, Abspieltaste wird gefüllt;
  `focus-visible`-Rand bleibt erhalten; bei `prefers-reduced-motion` werden alle Übergänge deaktiviert.
- Abnahme: Schaltungs-acceptance alle grün (Assertions wurden auf sprite-Zählung umgestellt, eine
  inspector-tab-Timing-Sache behoben); Mechanik-acceptance-Regression alle grün; Screenshot-Sichtprüfung:
  abgerundete Leiter, Spiralenfeder, hover-Anhebung wirken alle.
- lint: null Fehler in den Dateien dieser Charge (`no-non-null-assertion` verbietet `!` – Array-Indizes
  werden explizit mit `=== undefined` eingegrenzt).

### Korrekturen an Kartenbildern und Abspieltaste (Nutzerfeedback)

- Kartenbild `object-fit: contain → cover` (nur Raster-img): das erzeugte quadratische Bildlayout lässt
  in der 16:10-Zeichenfläche keine Ränder mehr links/rechts; die inline-SVG-Bühne bleibt bei contain, um die vollständigen Geräte zu erhalten.
- Die `entryPlay`-Abspieltaste wird von der absoluten Positionierung in `.art` ans Zeilenende von `.tagColumn`
  verschoben (`margin-left:auto`) – verdeckt nicht mehr die rechte untere Ecke des Bildes; die hover-Füllregel bleibt unverändert.
- In der Praxis ist die picker-Scrollkette in Ordnung (`.panel` overflow:auto, 5601/628 bis zum Ende gescrollt);
  „unten nicht vollständig sichtbar" war tatsächlich ein Wahrnehmungsproblem durch die auf dem Bild aufliegende Abspieltaste + Bildränder.

### Korrektur von Beschriftungskonflikten auf der Zeichenfläche (Nutzerfeedback „Text und Daten überlappen")

- `tickLabelAvoid` wird für die Mechanik erweitert: wenn der Abschusspunkt an der y-Achse klebt (|x| < 0.45·majorGrid),
  werden die y-Skalenziffern im Bereich [y−0.2Δ, y+0.6Δ] um seine Zeile ausgeblendet (Skalenstriche bleiben) – die `Startpunkt`-
  Beschriftung überlagert nicht mehr die `50`-Skala. Stabiler als das Verschieben der Beschriftung: entfernt sich die Beschriftung vom Ort, ist ihre Zugehörigkeit nicht mehr ablesbar.
- Die `Boden`-Flächenbeschriftung wandert vom rechten Ende unter das linke Ende: das rechte Ende ist ohnehin die Ecke von `x/m`-Achsname + Maßstab.
- Der `y/m`-Achsname wandert von links (auf der Skalenseite, stößt an die obere Skala) nach rechts der Achse, start-verankert,
  und wird in die rechte Grenze geklemmt (Überlaufschutz bei Szenen mit durchweg negativem x).
- `.surfaceLabel` erhält eine canvas-bg-Halo-Kontur (die übrigen Label-Klassen haben sie längst).
- DOM-Ebene-Überlappungsprüfung (alle text-bbox paarweise verglichen): dichte Szene (h=45m-Tisch+θ) und
  flacher Schrägwurf beide 0 Konflikte; 622/622-Regression, lint 0 im geänderten Umfang.

### Isolation von Versuchsfläche und Sitzungsinhalt (Nutzerfeedback „beim Versuchswechsel werden noch fremde Sitzungsinhalte angezeigt")

Das Lab ist im Slot `conversation.surface` registriert und ist eine Overlay-Schicht über der aktuellen Sitzung; der session header der Hülle
`ConversationRoot` (Titel/Brotkrumen/Ansicht-tab), die Sitzungsansicht und
der sticky composer liegen alle außerhalb der Overlay-Schicht – wählt man „Inelastischer Stoß", lugt der Titel der alten Sitzung „Schräger Wurf …“
noch oben hervor.

Lösung (`LabWorkspace.module.css`, reines CSS, null paketübergreifende Code-Abhängigkeit): Wenn
innerhalb von `[data-slot='conversation.surface']` ein `[data-physicsos-surface]` auftritt
(`:has()` liest den echten DOM-Zustand; gibt surface 'home' null zurück, hebt es sich automatisch auf), wird ausgeblendet:

- `[data-slot='conversation.session.header'] > *` – der session-Titelbereich
- `[data-slot='conversation.session'] > *` – das überdeckte Transkript/die Ansicht
- `[data-composer-seat]` – die composer-Eingabezeile

Kritischer Fallstrick: Das slot-Anker-div trägt **inline** `display: contents` (scoped-slots.tsx
`ANCHOR_STYLE`, der dokumentierte Vertrag „Positionierungsfuge für dynamische Styles"); ein Stylesheet kann nur
seine Kindelemente verbergen, nicht den Anker selbst; der composer seat hat keine Inline-Styles und kann direkt `display:none` sein.

**Warum der composer nicht beibehalten wird**: Der seat ist `position:sticky;bottom:0`; sein Ankleben am Boden
hängt davon ab, dass vorangehender Inhalt seine natürliche Position über die Viewport-Unterkante hinausschiebt – wird das Transkript verborgen, springt die natürliche Position des seat nach oben
und verdeckt die lab-Symbolleiste (blockierte in der Praxis den Klick „Zurück zum Gespräch"). Zudem hat das lab eine eigene KI-Lernassistent-Schublade,
der Nachhilfekanal geht also nicht verloren.

Überprüfung (echte Sitzung „Schräger Wurf: maximale Höhe und Flugzeit bestimmen"): vor dem Öffnen des lab header=block/
session=flex/seat=flex; nach dem Öffnen alle drei none, kein veralteter Titel, Screenshot der ganzen Seite sauber;
nach „Zurück zum Gespräch" alles wiederhergestellt, surface entladen; Gates null Fehler. Deckt picker/lab/record/
paper alle surface-Formen ab (alle mit `data-physicsos-surface`).

### Reparatur veralteter Verträge im Abnahmeskript (mechanics-acceptance.mjs)

Ein Alt-Test-Schuldenstand ohne Bezug zu dieser Änderung, nebenbei behoben, um ein sauberes Regressionssignal zu bekommen:

- `derivedRows`: Der Klassenname des Wert-Kindknotens des Zeilencontainers `.derived` ist bereits `derivedReading`
  (das Skript suchte noch das alte `derivedValue`); Namen mit eingebettetem MathText benötigen das Entfernen der math-Knoten
  (sonst hat der key einen „RRR"-Schwanz).
- Die inspector-tabs sind gegenseitig exklusiv (Eigenschaft=Parametereingabe, Messwert=abgeleitete Zeile); jede Lese-/Schreibsequenz muss zuerst den
  tab wählen; ein revision bump löst das Neuanhängen des runtimeKey aus, der inspector fällt auf Eigenschaft zurück.
- CASE H: Nach einem agent-Befehl ist die rechte Spalte vom AgentDrawer belegt; erst Esc drücken, dann den inspector lesen.
- CASE C/D/F: Der ganze Absatz hängt am bereits pensionierten Einstieg „Aufgabenbereich" (die Übungen sind in die Nachhilfesitzung migriert);
  in eine `if (entry exists)`-Wache gehüllt – fehlt der Einstieg, wird laut SKIP gemeldet statt hart abzustürzen; das Neuschreiben gemäß dem neuen Übungsfluss
  ist eine eigenständige Aufgabe (learning-acceptance CASE G deckt die Nachhilfekette bereits end-to-end ab).
- Ergebnis: E/A/B/G/H + Responsive + Browser-Gates alle grün.

**Entfernung des freigehaltenen composer-paddings** (Nutzerfeedback „Leerraum unten"): Vier surfaces
(picker/LabEmptyState/record/lab cover) behielten je ~180-250px padding-bottom
frei, um dem sticky composer Platz zu machen; nach Ausblenden des composer wurden diese Freiräume zu totem Weiß. Alle wurden entfernt
(die `[data-conversation-scroll]`-Overlay-Blöcke von `ExperimentPicker`/`LabEmptyState`/`LearningRecordWorkspace`/`LabWorkspace`)
– gemessen picker totes Weiß 250px→24px
(nur noch das symmetrische root-padding), die lab-Zeichenfläche nimmt die volle Höhe ein. Die Isolationsregeln-Regression ist alle grün.

### Direktes Ziehen des Auftriebsklotzes (Nutzerfeedback „beim Heruntergehen des Körpers ändert sich die Seite nicht")

Die Animationskette Wiedergabe/Einzelschritt/Zeitachse-Ziehen ist ohnehin gesund (Sonde gemessen blockY 195→239→301,
Messwerte laufen mit der Zeit) – die Interaktion, die der Nutzer wirklich wollte, ist **den Klotz wie bei „Herr Partikel" direkt zu greifen
und nach unten zu drücken**; die Zeichenfläche reagierte zuvor überhaupt nicht auf Ziehen.

Umsetzung: Wiederverwendung von `ComponentDragChannel` (derselbe Kanal wie beim Schaltungsziehen; die workspace erkennt am
runtime drei implementierte Methoden und verdrahtet automatisch). `FluidWorkspaceRuntime` implementiert
`previewComponentPlacement`/`commitComponentPlacement`/`cancelComponentPlacement`
– das Ziehen des Klotzes aktualisiert entlang des Absenkphads die Eintauchuhr: Zeiger scene-y → Bodenabstandstiefe → `t=depth/lowerRate`
→ `seek()`. Messwerte/Kraftpfeile/V_verdr/Phase kommen alle aus dem echten Engine-Zustand, keine UI-Fake-Animation.
`dragBaseline` zeichnet den Greifstartpunkt auf (time+running), cancel springt unverändert zurück; das Überschreiten der Grenze wird von
seek naturgemäß auf [0, settleTime] geklemmt (schwebende Szenen werden auf die Gleichgewichtstiefe geklemmt, konsistent mit dem losen-Seil-Modell).

`fluid-renderer.tsx` verbindet das Klotz-`<g>` mit pointerdown/move/up/cancel (dieselbe
`sceneAt`-Rückprojektion wie bei der Schaltung + 3px-Ziehschwelle + `setPointerCapture`-jsdom-Wächter),
`.fluidDraggable`/`.fluidDragging`-Cursorzustände.

**Kritischer Fallstrick**: Die Kraftpfeile (Vectors) sind über dem Klotz gezeichnet; die G/F_app-Pfeile verlaufen genau durch den Klotz-
mittelpunkt – beim Drücken trifft `elementFromPoint` auf `line.vectorLine`, die Klotzgruppe empfängt
niemals pointerdown. Lösung: Die Vectors-Primitive-Wurzel `<g>` erhält `pointerEvents="none"`
(Vektorannotationen sind ohnehin nur lesbar; domänenweit Treffer deaktiviert, was nebenbei denselben Fallstrick bei künftigem Anschluss von Ziehen in weiteren Domänen verhindert).

Überprüfung: Unit-Tests 623/623 (neuer Ziehfall: Nicht-Klotz-Komponenten reagieren nicht, Mitte an der Flüssigkeitsoberfläche = halb eingetaucht,
zu tief klemmt auf settle, cancel springt zurück, commit setzt ab); im Browser beidseitiges Ziehen gemessen
(t=0→4,33s eingetaucht → zurückgezogen auf t=0 nicht eingetaucht, Cursorwechsel grab/grabbing korrekt);
Mechanik-Abnahmeregression alle grün, Gates null Fehler, typecheck sauber, overlay erfasst (capture).

### Behebung „keine Veränderung" in der Standardansicht des inspector (Fortsetzung des Nutzerfeedbacks zum Auftriebsversuch)

Der Nutzer meldete zum zweiten Mal „beim Heruntergehen des Körpers ändert sich die Seite nicht". Diagnoseergebnis: Die vier Interaktionsketten
Wiedergabe/Einzelschritt/Zeitachse/Ziehen sind im aktuellen bundle alle gesund (gemessen läuft t vorwärts, der Klotz bewegt sich, Messwerte folgen);
der echte Mangel ist die **visuelle Totzone des standardmäßigen inspector-tabs „Eigenschaft"** – die Parameter sind statische Eingaben, der Abschnitt „abgeleitete Größen“
rendert nur eine leere Überschrift (seine derived-Zeilen erscheinen nur unter dem tab „Messwert"); während der Nutzer
auf das Standardpanel schaut, rührt sich der Zahlenwert tatsächlich nicht.

Lösung (`workspace-parts.tsx` InspectorTabs): Der Eigenschaft-tab rendert nun für jeden Abschnitt
unterhalb der Felder gleichzeitig die `SectionDerived`-Messwertzeilen – beim Ziehen des Klotzes/Abspielen springen die abgeleiteten Größen in Echtzeit
(Eintauchzustand „nicht eingetaucht"→„vollständig eingetaucht" gemessen umgeschaltet); nur ganz leere Abschnitte überspringen die Überschrift.
Nebenbei sind alle Domänen abgedeckt: Im Mechanik-Eigenschaft-tab sieht man standardmäßig die Live-Messwerte Flugzeit/Wurfweite/maximale Höhe,
die Parameter bleiben oben und brechen die bestehende Schichtung „erst Eingabe, dann Messwert" nicht.

Auffindbarkeit des Auftriebsklotz-Ziehens nachgerüstet: Die Klotzgruppe bettet ein SVG `<title>` ein (Hover-Hinweis „Klotz ziehen, um die
Eintauchtiefe zu ändern; Messwerte folgen in Echtzeit"), die grab/grabbing-Cursorzustände wurden in der letzten Runde umgesetzt.

Überprüfung: Unit-Tests 623/623, typecheck sauber, Eigenschaft-tab gemessen mit gefüllten abgeleiteten Größen und Aktualisierung beim Ziehen,
Mechanik-domänenübergreifendes Layout in Ordnung, Gates null Fehler, overlay erfasst (capture).

### Ziehbare Messwertkarte auf der Zeichenfläche (Behebung des Verdeckungsproblems)

Der Nutzer meldete, dass die Messwertkarte oben links (Akustik „Echo-Messwert" usw.) das Bild verdeckt. Ursache:
`PhysicsCanvas` verdrahtete die Messwertkarte hart auf `(PAD.left+8, PAD.top+8)`, ohne Ausweichen.

Lösung (`PhysicsCanvas.tsx` + `PhysicsCanvas.module.css`): Die Karte wird zu ziehbarer
Zeichenflächen-chrome – der lokale `readoutPos`-Zustand speichert viewBox-Koordinaten (kein physikalischer Zustand, läuft nicht über
Szenenbefehle); das `<g>` hängt pointer-Gesten ein (viewPoint-Rückprojektion client→viewBox,
2px-Ziehschwelle, pointer capture mit jsdom-Wächter), grab/grabbing-Cursor +
`<title>`-Hover-Hinweis. Doppelte Klemmung: Beim Ziehen wird setReadoutPos in die Zeichenfläche geklemmt, in der Renderphase
noch einmal (wird der Messwert breiter/die Zeichenfläche schmaler, zieht sich die Ablageposition automatisch zurück). Isolation: Beim Ziehen
kehrt handleMove früh zurück und jagt keinem hover nach; `suppressClickRef` verschluckt den vom Drücken-Loslassen der Karte abgeleiteten
click und löst nie versehentlich den Bahn-seek aus; pointerdown/move stopPropagation verhindert ein Durchsickern.

Überprüfung: Unit-Tests 626/626 (neue spec: unter der Schwelle keine Bewegung / Ziehen setzt ab / Klemmung in der fernen Ecke / release-click
löst kein seek aus / fremder Zeiger und cancel werden ignoriert / ohne Layout-rect kein Absturz); im Browser Ziehen/Bewegen gemessen,
Loslassen hält, Grenzüberschreitung wird in die Zeichenfläche zurückgeklemmt, cursor:grab wirkt, Gates null Fehler; typecheck
sauber, overlay erfasst (capture) (3 Dateien byteweise synchron).

### Substanzialisierung der Lernverlaufsseite (Nutzerfeedback „nicht implementiert")

Oberflächlich implementiert, aber sich wie eine leere Hülle anfühlend: nur Fehleraufgaben aufgelistet (bei 0 Einträgen ganz leer), richtige Antworten nirgends sichtbar,
das Wissenspunkt-Panel ohne Leerzustand bei null Daten, die 80 Aufgaben-Chips ohne Gruppierung zu einer Wand verklebt.

Lösung (`LearningRecordWorkspace.tsx` + `.module.css` + `locales.ts` +
question-core `golden-questions.ts`/`index.ts`):

- **Feed der letzten Selbsttests**: „letzte Fehleraufgaben" wird zu einem einheitlichen Selbsttest-Journal erweitert – alle attempts
  (richtig + falsch) zeitlich absteigend aufgelistet; richtige tragen ein grün hinterlegtes „Richtig"-Badge
  (`data-result="correct"`), falsche ein Fehlertyp-Badge; Aufgabenstellung/deine Antwort/
  „Übung wiederholen"/„Versuch wiederholen"-Tasten bleiben erhalten. Kernanliegen umgesetzt: Die Verlaufsseite zeigt endlich den „Verlauf".
- **Leerzustand der Wissenspunkt-Beherrschung**: Gibt es keine geübten Blattknoten, wird ein Hinweistext angezeigt
  „Nach Abschluss eines Selbsttests wird hier nach Wissenspunkt dein Beherrschungsstand angezeigt", kein blanker Kasten mehr.
- **Aufgabensammlung nach domain gruppiert**: question-core extrahiert die id-Präfix-Inferenz in
  `goldenQuestionDomain()` (die factory verwendet dieselbe wieder), die Aufgabensammlung teilt sich in 8 Gruppen
  (Magnetfeld und Lorentzkraft/Elektrisches Feld/Kombiniertes Feld/Mechanik/Stromkreis/Geometrische Optik/Elektromagnetische Induktion/Schwingungen und Wellen)
  mit Zwischenüberschriften, keine chip-Wand mehr.

Überprüfung: learning spec 26/26 (neu: Zeile „richtig" im Journal mit grünem Badge/Leerzustandstext für verwaiste Aufgaben/
alle 8 Gruppenüberschriften vorhanden), ui-physicsos 629/629, question-core 412/412, beide Pakete
typecheck sauber, im Browser Gruppierung/Badges/Beherrschungsbalken vollständig gerendert, Gates null Fehler,
overlay 4 Dateien byteweise synchron.

### Auth V1 Abschluss: Kompositionstest + Reparatur zweier echter Bugs + Asset-Onlinegang

**REAL-Loader-Kompositionstest** (`auth-host/tests/composition.spec.ts`, von der Paketkonvention gefordert):
cordis.yml startet webserver(port 0) + storage + storage-json(tmpdir) +
storage-domain(backend json) + auth-host als ganze Kette, echtes HTTP schlägt
`/physicsos/auth`: schools 200 → register 201+HttpOnly cookie →
me 200 (schoolId/username/role=STUDENT) → logout 200 → me 401.
`loadYaml` nutzt den `(root)=>lines`-Callback, um den Pfad nach mkdtemp zu erhalten, und rendert dann yaml.

**Nebenbei zwei echte Bugs repariert**:

- `invariant.ts`: Das fiber-level `inject=['invariants','storageDomain']` des Begleit-Plugins
  wird von der Test-Infrastruktur vor der Bereitschaft der Komposition eingehängt → schlägt fehl, weil `storageDomain` nicht bereitgestellt ist.
  Nach dem message-feedback-Muster wird fiber inject auf nur `invariants` geändert,
  `storageDomain` wandert zu `InvariantInstaller.inject` (das Sub-fiber des Prüfers
  wartet auf den Dienst) – das Object.assign-Literal verliert den Kontexttyp, Parameter müssen explizit annotiert werden.
  Zusätzlich wird in derselben Datei eine mehrzeilige `as`-Assertion korrigiert: tsc akzeptiert sie, aber der oxc-transform
  von vitest meldet einen parse error; in eine Zeile zusammengezogen.
- `index.ts`: Das Abschluss-Promise von `ctx.effect(async function*)` wird nur beim Unmount
  awaitet – bei fiber-Aktivierung ist die Route möglicherweise noch nicht registriert, beim Produktionsstart gibt es ein 404-Fenster.
  Umgestellt auf `async apply` + `await ctx.effect` (directory-picker-auto-Muster);
  die Aktivierung enthält dann die Routenregistrierung, der Kompositionstest wechselt von 404 auf 200.

**Ausrichtung des Passwortfelds** (Nutzerfeedback): `.input` hat kein `box-sizing`,
`.passwordWrap .input{width:100%}` rendert nach content-box =
100%+58px padding. `border-box` hinzugefügt (`.input` + SchoolPicker `.search`);
pixelgenau gemessene rechte Kante des Passwortfelds 847→789, völlig ausgerichtet mit Konto/Schule/Tasten.

**Asset-Präfixkonflikt**: `frontend-static` beansprucht nur nicht gematchte Pfade,
`/physicsos/auth/horizon.png` wurde von der auth-Präfixroute geschluckt und gab JSON-404 zurück.
Assets aus dem API-Präfix herausgezogen: `public/physicsos/login/horizon.png`, CSS entsprechend geändert.
Alternativbilder und manifest aus public heraus → `apps/web/design-assets/` (neuer
OVERLAY_PATHS-Eintrag, apply/capture in beide Richtungen, dist ohne redundante Assets).

**library-hero.png**: Das von LibraryWorkspace referenzierte Ressourcenbibliotheks-Kartenbild wurde generiert
(transparenter Hintergrund, Umlaufbahn+Buch+Kolben, gleiche Bildsprache wie horizon) →
`public/physicsos/library/library-hero.png`, an beiden Ports gemessen 200.
Neues Gateway `image.haqiuhaqiu.xyz` benötigt einen eigenen key: alter key meldet INVALID_API_KEY,
der vom Nutzer bereitgestellte neue key wurde mit `/v1/models` 200 + Bildausgabe normal überprüft, `.env` ist aktualisiert.

**Überprüfung**: auth-host 18/18 (17 route + 1 REAL composition),
auth.client 18/18, tsc -b sauber, client lib + web dist neu erstellt,
im Browser gate drei Ansichten/Ausrichtung/Hintergrund vollständig gerendert. Bekannte Altlasten (Nutzer-WIP,
unangetastet): die en-Textlücke bei `library.*` lässt die locales-Ausrichtungs-spec rot werden,
mehrere typecheck-Fehler in `LabWorkspace`/`LibraryWorkspace`.

### Neuentwurf des Prüfungsstudio-Arbeitsbereichs (Nutzerfeedback „UI-Layout muss neu gestaltet werden")

Überarbeitung von `PaperWorkspace.tsx` + `.module.css`, alle API-Abläufe unverändert:

- **Kopf**: 40px hoher hero → kompakte Symbolleiste (Titel + einzeilige Unterüberschrift + Prüfperson),
  das hero-Bild wird zu einem dezenten Hintergrund rechts.
- **Navigation**: vier Pill-tabs → Prozessschrittleiste (1 Prüfungsbogen anlegen → 2 Entwurf und Prüfung
  → 3 finalisiert, Unterstreichungs-Aktivzustand + Zählbadge), die „Altklausuren-Bibliothek" separat rechts platziert.
- **Prüfungsbogen anlegen**: einspaltiges Formular → Dreischritt-Assistent (Bogenstruktur wählen / Prüfungsumfang festlegen /
  Schwierigkeitsverteilung setzen, nummeriertes Badge stepCard) + rechts klebende „Bogenzusammenfassung"-Karte
  (Struktur/Punktzahl/Bogentyp/Kapitelzahl/Schwierigkeitsziel + CTA). Die Schwierigkeitsverteilung wird zu einem MixBar-
  Dreisegment-Balken (Grundniveau grün/Mittel blau/Erhöht gelb).
- **Aufgabenkarte**: Titel aus `document.title` (Fallback Bogentyp+blueprintId),
  Status-Badge oben rechts, meta-Zeile mit Versionsnummer+Datum, im `review`-Zustand wird
  ein Fortschrittsbalken „n/N Aufgaben geprüft" angezeigt.
- **Aufgabendetails**: neue StageRail-Phasenschiene (Feinplan→AI-Entwurf→automatische Prüfung
  →Aufgabe-für-Aufgabe-Review→Finalisierung/Export, erledigt mit Häkchen/aktuell hervorgehoben/fehlgeschlagen rot).
- **Bibliotheksformular**: reines placeholder-Raster → beschriftete Felder (`.fld` Zwischenüberschrift +
  `.fldWide` volle Breite); die drei Karten Erfassung Originalbogen/Aufgabe-für-Aufgabe-Prüfpunkte/CSV werden gleich mitgeändert.

Neue spec `tests/paper-workspace.client.spec.tsx` (4 Fälle: Schrittleiste/
Assistent+Zusammenfassung/Aufgabenkartenfortschritt/StageRail). 663/663 grün, typecheck sauber,
im Browser vier tabs vollständig gerendert, console null Fehler. **Hinweis**: Nach der Änderung ist zwingend
`node scripts/overlay/harness-overlay.mjs capture`——
`apply` rollt vendor auf die alte overlay-Version zurück (in dieser Runde zweimal zurückgerollt, dann capture).

### Admin-Konsole V1: Antrag → Genehmigung → Schulanlage → Schulverwalter, ganze Kette

Backend `auth-host` (kein neues Paket, einzige Schreibberechtigung derselben domain):

- `domain.ts`: zwei neue Tabellen `school_requests`/`admin_audit` +
  `schoolRequestWire`/`approveRequestWire`/`rejectRequestWire`/
  `createSchoolWire`/`schoolStatusWire`/`createUserWire`/`userStatusWire`/
  `resetPasswordWire` wire schema. Die `createUserWire.role`-Enumeration enthält kein
  `SUPER_ADMIN` – in Produktion lässt sich gar kein Superadmin erzeugen.
- `service.ts`: `AdminActor` + `ROLE_RANK`-Rollenmatrix + `manageRank`.
  Genehmigung Schulanlage + Seed-Schulverwalter, manuelle Schulanlage, Schul-Start/Stopp, Nutzerliste (Schulverwalter
  wird per schoolId-Filter zwingend auf den eigenen Mandanten eingegrenzt), Kontoanlage (Schulverwalter lässt schoolId weg
  und landet im eigenen Mandanten; wird ein anderer Mandant angegeben, 403), Deaktivierung (mit Widerruf aller session;
  self-target liefert 400 vor der Rollenprüfung), Passwort-Reset (mit Widerruf),
  Sitzungswiderruf, Audit-Anhängen/Mandanten-eingegrenztes Lesen.
- `routes.ts`: `POST /auth/school-requests` (anonym erlaubt, eigener
  `applyAttemptLimit`-IP-Eimer – belegt kein Login-Kontingent) +
  `/physicsos/admin`-Präfix mit vollständigen Verwaltungsrouten (cookie-Sitzungsauflösung →
  AdminActor → servicenahe erzwungene Rolle/Mandant).
- `index.ts` + `bootstrap.ts`: `Config.bootstrapAdmins` als idempotentes Seeding
  (nur anlegen, wenn nicht vorhanden). `cordis.patch.yml` liest mit `!!js`
  `PHYSICSOS_ADMIN_PASSWORD` und sät `PHYSICSOS-OPEN:admin` SUPER_ADMIN;
  fehlt die env, wird nicht gesät.

Frontend `ui-physicsos`:

- `auth-api.ts`: `submitSchoolRequest` + `createAdminApi()`
  (`/physicsos/admin`-Client, user-Pfad als `schoolId:username` kodiert).
- `AdminWorkspace.tsx` als neue surface: rollengetriebener tab – Superadmin sieht
  Anträge/Schulen/Nutzer/Audit, der Schulverwalter nur Nutzer/Audit (eigener Mandant);
  Nicht-Administratoren sehen einen forbidden-Text (das Ausblenden des Menüs ist nur Komfort, die Grenze liegt im host).
- Der `SchoolPicker`-Leerzustand enthält das Antragsformular (Schulname mit Suchbegriff vorbelegt,
  Kontaktangabe erforderlich, drei Zustände busy/done/error).
- Das Kontomenü in `SidebarFooter` erhält den Einstieg „Admin-Konsole" (nur
  SCHOOL_ADMIN/SUPER_ADMIN); `surface-store` erhält `'admin'`;
  `LabWorkspace` verteilt die admin surface; `index.ts` injiziert
  `adminApi`/`openAdmin`/`hooks.auth`.

**Die zwei echten Bugs dieser Runde**:

- `cookies.ts`: Nicht-merken-Sitzungen senden `Max-Age=0` = Browser läuft sofort ab →
  eine Anmeldung ohne „Dieses Gerät merken" kommt im echten Browser nie hinein (mit curl nicht messbar;
  zuvor funktionierte es, weil remember angehakt war und ein 30-Tage-cookie kam). Korrigiert zu:
  bei `maxAgeSeconds<=0` wird das Max-Age-Attribut weggelassen (Session-cookie-Semantik),
  auth.spec um ein symmetrisches Assertion ergänzt.
- `createUser`: Die Schulverwalter-UI rendert das schoolId-Feld nicht → Leerstring wird übermittelt →
  wire `min(1)` 400, der Schulverwalter kann nie ein Konto anlegen. Korrigiert: wire optional +
  fehlt es, landet die Service-Schicht im Mandanten des actor (explizit anderer Mandant bleibt 403); das Frontend lässt den Leerwert weg.

**Überprüfung**: auth-host 45/45 (auth 18 + admin 25 + composition 2,
inkl. echter Kette bootstrap→anonymer Antrag→Genehmigung→Schulverwalter-Login);
auth.client 23/23; tsc sauber; lib/dist neu erstellt. Im Browser gemessen:
anonymer Antrag 201+Erfolgstext, Superadmin-Login, Menü „Admin-Konsole", Antragsliste,
Genehmigungsformular alle Felder, UI-Genehmigung→Schulanlage+Administrator, zwei neue Schulverwalter-Logins,
Mandanteneingrenzung (sieht nur die eigene Schule/mandantenübergreifend 403/requests 403), Audit verbucht.
Beide Bäume byteweise identisch (der IDE-Pufferspeicher war mehrfach zurückgesprungen; letztlich gilt overlay
replay + diff-Abgleich).

---

## Altklausuren-Bibliothek (Ressourcenbibliothek · Upgrade des Originalbogen-Bereichs) – abgeschlossen

Der tab „Altklausuren" in der Ressourcenbibliothek wird von einem einfachen Kartenraster zu einer vollständigen Bogenbibliothek aufgewertet: Schulstufen-tab +
dynamische Filtergruppen Bogentyp/Region (aus den Daten abgeleitet, ohne Wert nicht gerendert), Sortierung nach Wertigkeit oben
→ Jahr → Erfassungszeit, Badge-Zeile (Typ/Wertigkeit/Region/Schule),
erweiterbare Aufgabe-für-Aufgabe-Liste (Aufgabennummer/Aufgabentyp/Punktzahl/Prüfpunkt/Kompetenz/vollständiger Aufgabentext).

Datenkette (alle optionalen Felder rückwärtskompatibel):

- `packages/question-paper` (Top-Level-Paket): `SourcePaper` +`region`/
  `school`/`kind`/`featured`; `SourcePaperKind` = real/mock/
  monthly/midterm/final/joint; `KnowledgeAnnotation` +`stem`.
- `paper-host`: `domain.ts` wire schema synchron, `service.ts`
  speichert durchgereicht – **nach der Änderung muss `tsdown` `lib/` neu erstellen, `dsh web`
  nimmt `lib/index.js`, nicht src** (tsx transpiliert nur die Einstiegskette).
- `paper-api.ts` wire Row synchron.
- `PaperWorkspace`-Formular zur Erfassung des Originalbogens +Region/Schule/Bogentyp/Wertigkeit;
  Aufgabe-für-Aufgabe-Prüfpunkt +Aufgabentext (erforderlich, der Altklausuren-Block zeigt je Aufgabe; CSV behält den Index-
  Import ohne Aufgabentext – eine naive Kommasplittung verträgt keine Aufgabentexte mit Kommas).
- Die Browserseite verwendet nur Bögen und Prüfpunkte mit `status==='verified'`.

**Überprüfung**: `library-papers.client.spec.tsx` 6/6 (verified-Filter/
Badges/Sortierung/Filter/Aufgabentext aufklappen/Leerzustand); `paper-workspace.client.spec.tsx`
6/6 (stub ergänzt `listBankItems` und 4 weitere Bank-Methoden); UI-Gesamtsuite
681/681; tsc sauber; im Browser Monatsklausur-Karte mit Badges+Aufgabentext gerendert, Filter-chip,
featured oben angeheftet.

**Betriebs-Fallstricke (in dieser Runde handfest erlebt)**:

- `harness-overlay.mjs apply` rollt vendor auf die alte overlay-Version zurück
  – an diesem Tag dreimal in Serie zurückgerollt (inkl. IDE-Pufferspeicher-Synchronisierung). Regel:
  **overlay-Kopie ändern → apply auf vendor → sofort per diff abgleichen**.
- Mehrere koexistierende `dsh web`-Instanzen teilen `~/.dsh/storages/
physicsos_paper.json`, frieren aber jeweils den Code beim Start ein – alte Instanzen
  verlieren still neue Felder (Keys, die das wire schema nicht kennt, werden direkt abgeschält; POST gibt
  201 zurück, speichert aber nichts). Fehlersuche-Reihenfolge: lsof alle lauschenden Ports → echte PID holen
  (nohup umhüllt eine Shell, $! ist nicht die node-PID) → kill → Neustart.
- Eine Direktänderung der Speicherdatei ist wirksam, aber erst nach Dienstneustart (der In-Memory-Zustand schreibt sie sonst zurück und überschreibt sie).

**Bekannte Grenzen**: Der Aufgabentext kann nur im Aufgabe-für-Aufgabe-Formular erfasst werden (CSV unterstützt es nicht); pending-Bögen
erscheinen nicht in der Bogenbibliothek (im Admin-Journal sichtbar); die Such-haystack enthält bereits Bogenname/
Region/Schule.

### Login-/Registrierungsvertrag V2: globale Auflösung von Konto und Passwort, Schule nun frei eintragbar (2026-09-19)

Nutzerfeedback „beim Anmelden sollte man die Schule nicht wählen, bei der Registrierung die Schule selbst eintragen; die vorbelegten Hochschulen sind falsch".
In dieser Runde wird die Schule insgesamt aus der öffentlichen wire entfernt – sie bleibt ein interner Mandant erster Ordnung, aber
die Liste wird nicht mehr nach außen exponiert:

- `loginWire` → `{username, password, rememberDevice?, schoolId?}`;
  `login()` durchläuft active Nutzer×active Schulen zur globalen Auflösung; bei eindeutigem Passworttreffer
  wird angemeldet. Nur bei gleichem Namen und gleichem Passwort über Schulen hinweg kommt `SCHOOL_REQUIRED` (409) + `error.candidates` zurück,
  und die UI zeigt eine Disambiguierungs-Dropdown für einen neuen Versuch mit `schoolId` – der Normalfall sieht die Schule nie.
  Kandidatenobergrenze 16 (argon2-Verstärkung begrenzt); der Konto-Drosselungseimer wechselt zu `acct:username`.
- `registerWire` → `{schoolName?, schoolId?, ...}` (≥1);
  exakter Schulname→eindeutiger Teilstring wird auf einen active Mandanten aufgelöst. 0 → `SCHOOL_NOT_FOUND`
  (die UI klappt automatisch das Panel „Freischaltung beantragen" auf, der Schulname wird mit dem Antrag übermittelt); mehr →
  `SCHOOL_AMBIGUOUS` + candidates → Disambiguierung erneut.
- `forgotWire` → `{username, schoolId?}`; nur ein eindeutiger Kandidat legt eine Reset-Zeile an,
  bei Mehrdeutigkeit still 200 (Enumeration-Schutz).
- Die öffentliche Liste `GET /physicsos/auth/schools` wird entfernt – die Schulliste ist nicht mehr
  aufzählbar; `AuthApiError.candidates` trägt die Disambiguierungsdaten.
- `SEED_SCHOOLS` behält nur `PHYSICSOS-OPEN` (Superadmin hängt am Betriebsmandanten);
  die sechs Hochschul-Seeds werden entfernt. dev storage ist geleert (darunter null Nutzer, null Waisen),
  verbleibende Mandanten PHYSICSOS-OPEN / SYZX-EXP / GY1Z.
- SchoolPicker-Komponente + CSS beide gelöscht; AuthGate drei Ansichten neu geschrieben (Login ohne Schule,
  Registrierung Freitext + Antragspanel, Wiederherstellung nur Konto); locales 7 Keys gelöscht, 5 Keys hinzugefügt.
- Der Speicherschlüssel bleibt `(schoolId, username)` – Mandantentrennung, session,
  admin-Eingrenzung alle unverändert; `schoolId` bleibt in allen drei wires als optionaler
  Disambiguierungsparameter (admin spec läuft unverändert durch).

**Überprüfung**: auth-host 50/50 (auth 23 inkl. REQUIRED/AMBIGUOUS/Freitext,
admin 25, composition 2 echte Kette); auth.client 23/23 (inkl. Disambiguierungsselektor
+Antragspanel); ui-physicsos 681/681; tsc sauber; lib/bundle/dist neu erstellen.
Im Browser gemessen: Login nur mit Konto und Passwort in die shell, Registrierung mit freiem Schulnamen, SCHOOL_NOT_FOUND
→Antragspanel→Antrag landet pending in der Datenbank, nach admin-Login funktioniert der Einstieg „Admin-Konsole".

**Fehlersuche-Hinweis**: Zwei dev-Instanzen `:3080/:3081` teilen `~/.dsh/storages/
physicsos_auth.json` – zum Löschen von Daten müssen die Instanzen neu gestartet werden (der In-Memory-Zustand schreibt die Datei zurück und überschreibt sie).

---

## 19.09.2026 · Registrierung mit automatischer Kontenaktivierung (Self-Provisioning)

**Änderung:** Wird bei der Registrierung ein Schulname eingegeben, der keinem vorhandenen Eintrag zugeordnet werden kann, wird automatisch ein neuer, aktiver Schulmandant mit einer ID im Präfix `s_` erstellt. Die Registrierung blockiert daher nicht mehr mit dem Hinweis „Schule noch nicht freigeschaltet“. Der Menüeintrag „Schule beantragen“ wurde vollständig aus dem Anmeldeportal entfernt.

- `service.register()`: `schoolName` 0 Treffer → `provisionSchool()`
  legt einen Mandanten an (active, Name wie eingegeben getrimmt) → reguläre Registrierung.
  `SCHOOL_NOT_FOUND` bleibt nur dem expliziten ungültigen `schoolId`-Pfad vorbehalten.
- AuthGate: applyOpen/applyContact/applyBusy/applyDone/applyError
  fünf Zustände, `submitApply`, Antragspanel-JSX, `authApi`-prop alle gelöscht;
  index.ts gate inject übergibt authApi nicht mehr.
- `AuthApi.submitSchoolRequest` gelöscht (kein Aufrufer);
  `SchoolRequestRow` bleibt (AdminApi/AdminWorkspace verwenden es weiterhin –
  der `/school-requests`-Endpunkt und der Genehmigungsfluss bleiben unangetastet; er ist der offizielle Freischaltungspfad für Institutionen).
- locales löscht 7 Keys×2 (auth.apply._, auth.school.apply_);
  AuthGate.module.css löscht applyToggle/applyPanel/applyHint.
- Der Mehrdeutigkeitsschutz bleibt unverändert: `SCHOOL_AMBIGUOUS`+candidates weiterhin vorhanden (mehrere Schulen mit gleichem Namen);
  `SCHOOL_REQUIRED`+candidates weiterhin vorhanden (schulübergreifender Login mit gleichem Namen und gleichem Passwort).

**Überprüfung:** auth-host 73/73 (zwei Fälle in `auth.spec` bestätigen nun die automatische Erstellung: unbekannter Schulname → 201 mit neuer `s_`-Mandanten-ID; deaktivierter Schulname → neue unabhängige Mandanten-ID, keine Wiederverwendung); auth.client 23/23 (neuer Testfall „kein Antragsvorgang“). `tsc` ist fehlerfrei (verbleibende Fehler betreffen ausschließlich noch nicht abgeschlossene Specs in `library/paper`). `lib/`, Bundles und `dist/` wurden neu erstellt, Dienst auf Port 3080 neu gestartet.

Praxisprüfung: `POST /register {schoolName:"Mittelschule Nr. 4 Zunyi"}` → 201, Eintrag in `s_MMVLLixqUqlz` als aktiv. Im Browser-Registrierungsformular erscheint kein Hinweis auf einen Antrag mehr.

**Hinweis:** Durch die automatische Erstellung ist jede Variante eines Schulnamens ein eigener Mandant („Guiyang Nr. 2“ und „Zweite Mittelschule Guiyang“ werden als zwei separate Schulen behandelt). Die Zusammenführung oder Umbenennung von Mandanten ist eine künftige Aufgabe im Verwaltungsbereich. Die aktuellen Mandanten im Speicher sind PHYSICSOS-OPEN/SYZX-EXP/GY1Z/s_*.
