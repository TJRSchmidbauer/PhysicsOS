# Harness Overlay

`vendor/deepseek-harness` ist ein gepinntes Upstream-Submodul; dieses Repo verändert die Upstream-Historie nicht. Alles, was PhysicsOS auf den Harness-Arbeitsbereich überlagern muss, liegt hier und wird von `scripts/overlay/harness-overlay.mjs` synchronisiert.

## Inhalt

| Pfad                                                              | Beschreibung                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `files/packages/client/ui-physicsos/`                             | Quellcode und Tests des offiziellen PhysicsOS-Client-Plugins (`lib/` und `node_modules/` sind Build-Artefakte und nicht im Repo)                                                                                                     |
| `files/packages/physicsos/tool-physicsos/`                        | Hostseitiges PhysicsOS-Tool-Plugin `@deepseek-ai/dsh-tool-physicsos`: registriert `@physicsos/agent-tools` als vom Modell aufrufbare `physics_*`-Tools (`lib/` wird von `pnpm run build:agent` erzeugt und ist nicht im Repo)        |
| `files/packages/physicsos/auth-host/`                             | PhysicsOS-Kontosystem und gemeinsame `/api`-Kontorichtlinie: Schule/Konto/Sitzung, Ressourcenzugehörigkeit, private Arbeitsbereiche und Einschränkungen für Schüler-Voreinstellungen                                                  |
| `files/apps/cli/config/agent-presets/physics-student/`            | Agent-Voreinstellung „Physik-Lernmodus“: Persona mit Physik-Verfassung + Physik-Tools + Fragetool, wird über die Root-Erkennung mitgeliefert und ist in den Web-Einstellungen wählbar                                                |
| `files/packages/client/ui-settings-models/src/client/protocol.ts` | Harness-seitig neu hinzugefügte Datei, auf die lokale Änderungen verweisen                                                                                                                                                           |
| `files/apps/web/public/physicsos/`                                | Für das Web komprimierte Startseiten-Assets                                                                                                                                                                                          |
| `upstream-changes.patch`                                          | Lokale Änderungen an vom Harness bereits verfolgten Dateien (ohne Löschungen von Dokumenten wie `AGENTS.md`); enthält die Abhängigkeit von `apps/cli/package.json` auf das Tool-Plugin und den Projektverweis in `tsconfig.host.json` |

## Verwendung

```sh
git submodule update --init --recursive
node scripts/overlay/harness-overlay.mjs apply
```

`apply` kopiert nur als Überlagerung und löscht nicht die in `vendor/deepseek-harness` vorhandenen `node_modules/` und `lib/`; ein bereits angewendeter Patch wird übersprungen.

Nach Änderungen an Code in `vendor/deepseek-harness` in dieses Verzeichnis zurückschreiben:

```sh
node scripts/overlay/harness-overlay.mjs capture
```

## Editor

Die `tsconfig.json` in `files/**` sind keine kompilierbaren Projektdateien: Ihre `extends` und `references` zeigen auf Pfade wie `tsconfig.base.json` und `vendor/cosmokit`, die erst nach `apply` in `vendor/deepseek-harness` existieren. Beim Öffnen einer `.ts`-Datei im Overlay oder bei aktivierter Projektdiagnose lädt der TS-Server diese tsconfig-Dateien an Ort und Stelle und meldet fehlende Ziele als Fehler – das ist fehlender Kontext, kein Codeproblem; das echte Signal liefert `pnpm run typecheck` unter dem vendor-Pfad.

Damit die IDE dieses Rauschen nicht mehr meldet, schalten Sie in den Benutzereinstellungen die Projektdiagnose aus (`.vscode/` dieses Repos steht in der `.gitignore` und ist lokale Konfiguration):

```json
{ "typescript.tsserver.experimental.enableProjectDiagnostics": false }
```

## Grenzen

- Urheberrecht und Lizenz der Upstream-Dateien liegen bei DeepSeek (MIT), Details siehe `NOTICE.md` im Repo-Root.
- `files/**` ist PhysicsOS-eigener Code und steht unter der `LICENSE` im Repo-Root.
- Zum Ablauf beim Aktualisieren des Harness-Pins siehe `docs/HARNESS-UPSTREAM.md`; nach einer Pin-Änderung muss erneut `capture` ausgeführt und bestätigt werden, dass sich der Patch noch anwenden lässt.
