# PhysicsOS Handbuch für die lokale Entwicklung

> Datei: `docs/DEVELOPMENT.md`
> Dokumentzweck: Ein Handbuch, dessen Befehle man einfach nachtippen kann; Ablauf und Zusammenarbeit siehe [`CONTRIBUTING.md`](../CONTRIBUTING.md), technische Standards siehe [`02-ENGINEERING-STANDARDS.md`](./02-ENGINEERING-STANDARDS.md).

## 1. Voraussetzungen

| Abhängigkeit | Version / Hinweis                                                             |
| ------------ | ----------------------------------------------------------------------------- |
| Node.js      | `>= 24` (aktuelle Verifikationsbasis `24.x`)                                  |
| pnpm         | Vom `packageManager` des Repositorys festgelegt; Root `11.9.0`, `vendor/deepseek-harness` `11.7.0` |
| Git LFS      | Große Bilder unter `UI/` und `docs/` laufen über LFS; ohne Installation sind diese PNGs nur Pointer-Dateien |
| Docker       | Nur nötig, um Compose / Container-Deployment zu verifizieren                  |

## 2. Erstes Klonen

```sh
git clone <your-fork>
cd PhysicsOS
git lfs install
git submodule update --init --recursive
node scripts/overlay/harness-overlay.mjs apply
```

`apply` legt `overlays/harness/files/**` auf `vendor/deepseek-harness` und wendet `overlays/harness/upstream-changes.patch` auf die vom Upstream verfolgten Dateien an. Ohne diesen Schritt läuft der offizielle Web-Einstieg nicht.

## 3. Abhängigkeiten installieren

Der Root-Workspace (`apps/*`, `packages/*`, `tests/*`) und `vendor/deepseek-harness` sind zwei getrennte Workspaces und müssen jeweils separat installiert werden:

```sh
# Repository-Root
pnpm install

# Harness-Submodul (das postinstall von lefthook schlägt im Submodul fehl, der offizielle Umweg ist, die Skripte abzuschalten)
pnpm -C vendor/deepseek-harness install --ignore-scripts
```

In Linux- / Container-Umgebungen gibt es für `node-pty` keine vorkompilierten Artefakte, es muss lokal kompiliert werden:

```sh
pnpm -C vendor/deepseek-harness rebuild node-pty
```

Das Vorgehen im Docker-Image steht im `Dockerfile` im Repository-Root: `python3 make g++` installieren und danach mit `onlyBuiltDependencies: [node-pty]` neu bauen.

## 4. Arbeitszyklus mit dem Overlay

`overlays/harness/files/**` ist die Quelle der Wahrheit für den PhysicsOS-Code auf der Harness-Seite; `lib/`, `dist/` und `node_modules/` in `vendor/deepseek-harness/**` sind generierte Artefakte.

```sh
# Quelle der Wahrheit → vendor (nach Änderungen am Code im Overlay auszuführen)
node scripts/overlay/harness-overlay.mjs apply

# vendor → Overlay (nachdem im vendor vom Upstream verfolgte Dateien geändert wurden, von den Maintainern auszuführen)
node scripts/overlay/harness-overlay.mjs capture
```

Wer Code nur von Hand im vendor ändert und nicht per `capture` zurückschreibt, dessen Änderung wird beim nächsten `apply` überschrieben. Den Ablauf zum Aktualisieren des Upstream-Pins siehe [`HARNESS-UPSTREAM.md`](./HARNESS-UPSTREAM.md).

## 5. Häufig genutzte Skripte

| Befehl                             | Wirkung                                                       |
| ---------------------------------- | ------------------------------------------------------------- |
| `pnpm dev`                         | Startet den offiziellen Web-Einstieg (`dsh web`, standardmäßig `http://127.0.0.1:3080/`) |
| `pnpm build`                       | Baut Core-Packages + Agent-Tools + Hosts + Client-Plugin + Frontend |
| `pnpm typecheck`                   | Typprüfung in den drei Abschnitten core / web / agent         |
| `pnpm lint`                        | Lint in den drei Abschnitten core / web / agent               |
| `pnpm test`                        | Tests für core / web / agent / deploy / desktop               |
| `pnpm run test:web`                | Nur die `ui-physicsos`-Clienttests                            |
| `pnpm run test:agent`              | Nur die Host-Plugin-Tests unter `packages/physicsos/**`       |
| `pnpm run test:acceptance`         | Browser-Abnahme (das Skript startet selbst einen isolierten Server, Standardport 3095) |
| `pnpm run test:desktop`            | Tests für Desktop-Paketierungsskripte und die Sidecar-Bridge  |
| `pnpm run desktop:dev`             | Startet die Desktop-Shell im lokalen Entwicklungsmodus        |
| `pnpm run desktop:build`           | Lokaler Build (Development-Fallback, nicht für Releases)      |
| `pnpm run desktop:sidecar`         | Baut und sammelt die Sidecar-Laufzeitressourcen               |
| `pnpm run desktop:release`         | Offizieller Release-Build (erfordert Signatur- und Updater-Konfiguration) |
| `pnpm run format` / `format:write` | Prettier-Prüfung / -Schreiben                                 |

## 6. Kontobasierte Sitzungsspeicherung und Migration

JSONL-Sitzungen werden, sobald der Auflösungsdienst `physicsosSessionOwnership` aktiviert ist, nach
`<root>/<schoolId>/<encoded-userKey>/<encoded-sessionId>/` geschrieben. Die maßgebliche Datenquelle des Auflösungsdienstes ist
`api_resources` der Speicherdomäne `physicsos_auth`; der Hash-Digest des Workspace-Pfads lässt sich nicht auf das Konto zurückführen und darf nicht als Owner verwendet werden.

Das alte Layout `<root>/<project>/<sessionId>/` bleibt lesbar. Existiert dieselbe Sitzung im neuen und im alten Layout, verweigert das Backend
das Laden und meldet einen Layout-Konflikt; es wählt nicht für den Aufrufer eine Variante aus.

Das Migrationsskript führt standardmäßig nur einen Dry-Run aus:

```sh
node scripts/migrate/sessions-to-account-layout.mjs --root "$DSH_HOME/sessions"

# Nach Prüfung von plans / skipped ausführen:
node scripts/migrate/sessions-to-account-layout.mjs --root "$DSH_HOME/sessions" --apply

node --test scripts/migrate/sessions-to-account-layout.test.mjs
```

Die Zuordnungsquelle kann mit `--ownership <physicsos_auth.json-or-manifest>` überschrieben werden; standardmäßig wird
`<sessions-root>/../storages/physicsos_auth.json` gelesen. Einträge ohne Zuordnung, mit widersprüchlicher Zuordnung, ungültigem Header oder bereits vorhandener Zieldatei landen nur in
`skipped`, das Skript errät keine Zuordnung. Bei Deployments mit PostgreSQL-Speicher muss eine spätere Composition einen gleichwertigen Ownership-Provider bereitstellen.

## 7. Nur ein Package oder eine Spec ausführen

Die Domänen-Packages bringen jeweils eigene Skripte mit und lassen sich gezielt ausführen:

```sh
pnpm -C packages/engine-wave test
pnpm -C packages/engine-wave typecheck
pnpm -C packages/engine-wave exec vitest run tests/wave-model.spec.ts
```

Host-Plugins im Overlay werden im vendor-Workspace ausgeführt:

```sh
pnpm -C vendor/deepseek-harness exec vitest run packages/physicsos/auth-host/tests
pnpm -C vendor/deepseek-harness exec tsc -b packages/physicsos/auth-host/tsconfig.json --pretty false
```

Die Root-Skripte schlagen gelegentlich wegen der Abhängigkeitsstatus-Prüfung von `verify-deps-before-run` direkt fehl; in diesem Fall kann man vor den einzelnen Befehl setzen:

```sh
pnpm_config_verify_deps_before_run=false pnpm -C vendor/deepseek-harness --filter <pkg> run build
```

Das ist ein Umweg für die Fehlersuche, nicht der Normalfall; wird es zum Normalfall, muss der Abhängigkeitsstatus mit `pnpm install` neu hergestellt werden.

## 8. Desktop

```sh
pnpm run desktop:dev        # Lokale Entwicklung
pnpm run desktop:build      # Lokaler Build (Entwicklungskonfiguration)
pnpm run desktop:sidecar    # Erzeugt resources/agent-sidecar
pnpm run desktop:release    # Offizielle Paketierung (macOS-/Windows-Installationspakete)
pnpm run test:desktop       # Paketierungsskripte + Bridge-Tests
```

Vor dem offiziellen Release sind der öffentliche Updater-Schlüssel samt Endpoint, `TAURI_SIGNING_PRIVATE_KEY` sowie Apple- / Windows-Signaturmaterial bereitzustellen; `desktop:config` und `desktop:release-config` prüfen die Konfigurationsdateien, die Release-Konfiguration lehnt Entwicklungsschlüssel, Platzhalter-Endpoints wie `example.invalid` und Builds ab, die noch auf eine Platzhalterseite zeigen. Details zum Desktop siehe [`../apps/desktop/README.md`](../apps/desktop/README.md).

## 9. Lokalen Server mit Docker Compose starten

Compose benötigt 7 Secret-Dateien, deren Standardpfade alle im Repository-Root liegen (von `.gitignore` ignoriert):

```text
.env.postgres_password   .env.redis_password
.env.database_url        .env.redis_url
.env.deepseek_api_key    .env.admin_password
.env.image_api_key
```

Die Dateinamen lassen sich mit den Umgebungsvariablen `PHYSICSOS_*_FILE` überschreiben; Liste und Hinweise zur Rotation siehe [`13-DEPLOYMENT-OPERATIONS.md`](./13-DEPLOYMENT-OPERATIONS.md).

```sh
docker compose config --quiet     # Zuerst die Konfiguration validieren
docker compose up --build         # Startet app + postgres + redis
```

Die App lauscht standardmäßig nur auf `127.0.0.1:3080` (der Port lässt sich mit `PHYSICSOS_HTTP_PORT` ändern), die Health-Prüfung läuft über `/readyz`. Hinter einem TLS-Reverse-Proxy muss `PHYSICOS_TRUSTED_PROXIES` auf das **exakte IP-Literal** des Reverse Proxy gesetzt werden (CIDR und Hostnamen werden abgelehnt).

## 10. Fehlerbehebung

### pnpm-Versionskonflikt

Symptom: `ERR_PNPM_BAD_PM_VERSION`, Lockfile wird umgeschrieben, CI und lokales Verhalten weichen ab.

Behebung: Mit Corepack pnpm die Version aus dem Feld `packageManager` des jeweiligen Verzeichnisses ziehen lassen, nicht mit einem globalen pnpm überschreiben; Root und vendor haben zwei Versionen (`11.9.0` / `11.7.0`), beim Arbeiten über Verzeichnisgrenzen hinweg `pnpm -C <dir>` verwenden, statt erst `cd` auszuführen und dann dasselbe pnpm der Shell weiterzuverwenden.

### Overlay-Patch nicht sauber

Symptom: `apply` meldet, dass der Patch sich nicht anwenden lässt, oder im vendor erscheinen `.rej` / `.orig`.

Behebung:

```sh
git -C vendor/deepseek-harness status --short
```

Zuerst bestätigen, dass im vendor keine nicht zurückgeschriebenen Änderungen an vom Upstream verfolgten Dateien liegen (falls doch, zuerst `capture`), sicherstellen, dass keine `.rej` / `.orig` übrig sind, und dann `node scripts/overlay/harness-overlay.mjs apply` erneut ausführen. `apply` ist idempotent: Bereits angewendete Patches werden übersprungen.

### Kompilierung von node-pty im Container schlägt fehl

Symptom: In der Phase `docker compose up --build` meldet `node-gyp` fehlendes `python3`, `make` oder `g++`.

Behebung: In der Image-Build-Phase müssen `python3 make g++` enthalten sein, und Installationsskripte werden nur für `node-pty` freigegeben (die übrigen Abhängigkeiten bleiben bei `--ignore-scripts`). Bei Reproduktion auf einem lokalen Linux-Rechner `pnpm -C vendor/deepseek-harness rebuild node-pty` ausführen.

### Code geändert, aber Browser / Tests zeigen keine Änderung

Zuerst bestätigen, dass `overlays/harness/files/**` geändert und im vendor neu gebaut wurde (`lib/`, `dist/` sind generierte Artefakte); dann bestätigen, dass nach `apply` keine alten Artefakte übrig sind. Die `link:`-Brücke gibt es historisch genau deshalb, damit Browser-Bundle und Tests nicht zwei Kopien des Quellcodes lesen; Erläuterungen dazu siehe [`HARNESS-UI-OVERLAY.md`](./HARNESS-UI-OVERLAY.md).
