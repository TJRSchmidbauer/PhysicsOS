# PhysicsOS Desktop

Die Tauri-2-Hülle umschließt den bestehenden PhysicsOS-Web-Build. Sie forkt nicht
die Business-Oberfläche.

## Entwicklung

Das Harness-Submodul initialisieren, den Root-Workspace installieren und dann
ausführen:

```sh
git submodule update --init --recursive vendor/deepseek-harness
pnpm install
pnpm --dir apps/desktop dev
```

`tauri.conf.json` startet `pnpm --dir ../.. dev` und lädt die Harness-Web-Oberfläche
unter `http://127.0.0.1:3080`.

## Lokales unsigniertes Paket

`build:local` verwendet bewusst den eingecheckten Fallback `web/`. Diese Seite ist
ein Smoke-Ziel für die Entwicklung, kein Release-Artefakt.

```sh
pnpm run desktop:build
```

Der Befehl entfernt Tauri-, Apple- und Windows-Signatur-Credentials aus der
Umgebung des Kindprozesses und ruft `tauri build --debug --no-bundle` auf. Unter
macOS erzeugt er:

```text
apps/desktop/src-tauri/target/debug/physicsos-desktop
```

## macOS-Installer

Ein echtes Release-Frontend, den gebündelten Node-Sidecar und ein unsigniertes DMG
unter macOS bauen:

```sh
pnpm --dir apps/desktop run build:release -- --unsigned --bundles app,dmg
```

Der Installer wird hier abgelegt:

```text
apps/desktop/src-tauri/target/<rust-target>/release/bundle/dmg/
```

`--unsigned` deaktiviert Updater-Artefakte und übergibt `--no-sign` an Tauri. Das
Ergebnis ist weder mit einer Developer ID signiert noch notarisiert. Beim ersten
Start kann macOS Gatekeeper es blockieren. Entweder mit Control-Klick auf die App
**Öffnen** wählen und dann unter **Systemeinstellungen > Datenschutz & Sicherheit >
Trotzdem öffnen** bestätigen, oder nach dem Kopieren nach Programme das
Quarantäne-Attribut entfernen:

```sh
xattr -dr com.apple.quarantine /Applications/PhysicsOS.app
```

Prüfen Sie die heruntergeladene Prüfsumme, bevor Sie diesen Workaround für einen
verteilten unsignierten Build verwenden.

## Release-Paket

Release-Builds verwenden das gemeinsame Harness-Frontend, nicht `web/`. Das
Packaging-Skript baut `@deepseek-ai/dsh-web-frontend`, prüft
`vendor/deepseek-harness/apps/web/dist/index.html`, kopiert es nach
`apps/desktop/web-release/`, paketiert den Sidecar und ruft Tauri mit
`frontendDist = "../web-release"` auf.

Zur Laufzeit startet die Release-Hülle den paketierten Harness-`web`-Host auf einem
Loopback-Port, wartet auf dessen Readiness-Zeile und navigiert das Hauptfenster zu
diesem Origin. Dadurch werden `window.__DSH_BOOT__` und das Client-Plugin-Manifest
injiziert. Die statische Kopie `web-release/` bleibt Teil des Bundles, während das
Fenster verborgen bleibt, bis der Host bereit ist.

Den öffentlichen Produktions-Updater-Schlüssel und den Endpunkt über die Umgebung
bereitstellen:

```sh
export PHYSICSOS_DESKTOP_UPDATE_PUBKEY='<production minisign public key>'
export PHYSICSOS_DESKTOP_UPDATE_ENDPOINT='https://updates.physicsos.app/physicsos/update/latest.json?channel=stable'
pnpm run desktop:release
```

Alternativ `release.config.example.json` nach
`apps/desktop/release.config.json` kopieren, beide Updater-Felder ersetzen und die
Datei aus Git heraushalten. `PHYSICSOS_DESKTOP_RELEASE_CONFIG` kann auf eine andere
Datei zeigen. Umgebungswerte haben Vorrang vor der Datei.

Die Release-Validierung ist ein hartes Gate:

```sh
pnpm run desktop:release-config
```

Sie weist den eingecheckten Entwicklungsschlüssel, den Platzhalter-Host
`physicsos.dev`, Nicht-HTTPS-Endpunkte und einen Release-Build zurück, der noch auf
`web/` zeigt.

Bundles werden hier abgelegt:

```text
apps/desktop/src-tauri/target/<rust-target>/release/bundle/
```

Der Bundler kann ausdrücklich eingegrenzt werden:

```sh
# macOS
pnpm --dir apps/desktop run build:release -- --target aarch64-apple-darwin --bundles app,dmg

# Windows (unter Windows ausführen)
pnpm --dir apps/desktop run build:release -- --target x86_64-pc-windows-msvc --bundles nsis,msi
```

Ohne Updater- oder Code-Signing-Secrets `--unsigned` voranstellen. Das
Release-Skript deaktiviert Updater-Artefakte und benötigt keine
Produktions-Updater-Credentials. Sind alle Produktions-Updater-Secrets vorhanden,
erzeugt es signierte Updater-Artefakte und behält die normale strenge
Release-Validierung bei.

## App-Icon

Die Quelle des Release-Icons wurde mit dem gewünschten Bildmodell
`gpt-image-2.5-sunburst` aus einem PhysicsOS-Briefing „Atom/elektrischer Funke“
erzeugt. Die eingecheckte Quelle ist:

```text
apps/desktop/design/app-icon-source-sunburst.png
```

Die Plattform-Assets nach einer Änderung der Quelle neu erzeugen:

```sh
pnpm --dir apps/desktop exec tauri icon design/app-icon-source-sunburst.png
```

Der Bild-Client liest Provider-URL, Modell, Key, Prompt und Ausgabepfad aus
Umgebungsvariablen; der Key wird niemals in das Repository oder das Manifest
geschrieben.

## Agent-Sidecar

Den Sidecar vor einem Release bauen und einsammeln:

```sh
pnpm run desktop:sidecar
```

Das führt den Harness-Host-Build aus, deployt `@deepseek-ai/dsh` mit einem
gehoisteten Abhängigkeitsbaum, kopiert die gevendorten Cordis-Pakete plus den
PhysicsOS-Bridge-Einstieg und schreibt:

```text
apps/desktop/src-tauri/resources/agent-sidecar/sidecar.json
apps/desktop/src-tauri/resources/agent-sidecar/runtime/lib/bin.js
apps/desktop/src-tauri/resources/agent-sidecar/runtime/sidecar/bridge.mjs
apps/desktop/src-tauri/resources/agent-sidecar/runtime/node
```

Die erzeugte Runtime ist mehrere hundert Megabyte groß und wird bewusst von Git
ignoriert. Tauri bündelt das Verzeichnis als `agent-sidecar/`. Die Rust-Hülle löst
`sidecar.json` zuerst aus dem Ressourcenverzeichnis von Tauri auf, fällt während der
Entwicklung auf das Quell-Ressourcenverzeichnis zurück und behält
`PHYSICSOS_AGENT_SIDECAR` als ausdrückliche Überschreibung der ausführbaren Datei bei.

Die Haupt-`args` des Manifests starten weiterhin den Harness-`web`-Host.
`sidecarArgs` startet die Bridge als Agent-Prozess:

```sh
<resource-dir>/agent-sidecar/runtime/node <resource-dir>/agent-sidecar/runtime/lib/bin.js
<resource-dir>/agent-sidecar/runtime/node <resource-dir>/agent-sidecar/runtime/sidecar/bridge.mjs
```

Beim Paketieren wird die per Prüfsumme gepinnte offizielle Node-24.21.0-Runtime für
die Zielplattform heruntergeladen und unter `runtime/node` bzw. `runtime/node.exe`
abgelegt. Das Manifest ruft diese relative ausführbare Datei auf, daher hängt die
App nicht davon ab, dass Node installiert ist oder im `PATH` liegt. Archiv-URL,
Plattform, Version und SHA-256 stehen in `runtime/node-runtime.json`.

Das Windows-Packaging muss unter Windows laufen, damit pnpm die
zielspezifischen nativen optionalen Abhängigkeiten deployt. Der Workflow baut
NSIS- und MSI-Installer auf dem Windows-Runner und führt den Smoke-Pfad mit dem
gebündelten `node.exe` aus. Die gebündelte Node-Runtime, das Signieren, die
Installation und das Verhalten beim ersten Start erfordern weiterhin eine
Validierung auf einem echten Windows-Host; macOS kann `node.exe` nicht ausführen.

## CI-Installer

`.github/workflows/desktop-release.yml` läuft für `v*`-Tags und manuelle
Auslösungen. Er baut NSIS-/MSI-Installer für macOS arm64, macOS x86_64 und Windows
x86_64 und lädt die Pakete sowie alle Updater-`.sig`-Dateien als
Workflow-Artefakte hoch. Fehlende Signatur-Secrets führen zu einem unsignierten
Build statt zu einem Fehler.

| Secret                               | Zweck                                                        |
| ------------------------------------ | ------------------------------------------------------------ |
| `PHYSICSOS_DESKTOP_UPDATE_PUBKEY`    | Öffentlicher Tauri-Updater-Schlüssel, dem die App vertraut   |
| `PHYSICSOS_DESKTOP_UPDATE_ENDPOINT`  | HTTPS-Endpunkt für `latest.json`                             |
| `TAURI_SIGNING_PRIVATE_KEY`          | Privater Tauri-Updater-Schlüssel                             |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Passwort des Updater-Schlüssels, falls verschlüsselt         |
| `APPLE_CERTIFICATE`                  | Base64-kodiertes Developer-ID-Application-`.p12`             |
| `APPLE_CERTIFICATE_PASSWORD`         | `.p12`-Passwort                                              |
| `APPLE_SIGNING_IDENTITY`             | Developer-ID-Application-Identität                           |
| `APPLE_ID`                           | Apple-Konto für die Notarisierung                            |
| `APPLE_PASSWORD`                     | App-spezifisches Apple-Passwort                              |
| `APPLE_TEAM_ID`                      | Apple-Team-ID                                                |
| `WINDOWS_CERTIFICATE`                | Base64-kodiertes Windows-Code-Signing-Zertifikat             |
| `WINDOWS_CERTIFICATE_PASSWORD`       | Passwort des Windows-Zertifikats                             |
| `WINDOWS_CERTIFICATE_THUMBPRINT`     | Optionaler Zertifikat-Fingerabdruck                          |

Öffentlicher Updater-Schlüssel, Endpunkt und privater Schlüssel müssen alle
vorhanden sein, um signierte Updater-Artefakte zu aktivieren. macOS benötigt für
das Code-Signing weiterhin das Apple-Zertifikat und die Identität; Windows benötigt
entweder das kodierte Zertifikat oder einen Zertifikat-Fingerabdruck.

### Agent-Bridge-Protokoll

Die Rust-Allowlist und das 120-Sekunden-Timeout für unäre Anfragen bleiben
unverändert. Die Bridge sendet ein `ready`-Ereignis mit Protokollversion `1`;
`TauriSidecarRpc.start` wartet auf diesen Handshake, bevor es zurückkehrt. Das
Manifest bleibt bei Version `1`.

Die Bridge verbindet sich mit dem lokalen `dsh web`-Host unter
`PHYSICSOS_HARNESS_URL` (Standard `http://127.0.0.1:38971`). Bei jeder Anfrage liest
die Tauri-Hülle das aktuelle Cookie `physicsos_session` aus dem Haupt-WebView und
fügt es unter einem reservierten Feld zu den Sidecar-Parametern hinzu. Die Bridge
entfernt dieses Feld, bevor sie die Anfrage abbildet, protokolliert es niemals und
schreibt es niemals auf die Platte.

Implementierte Methoden:

- `session/create` ruft den echten RPC `session.create` auf, speichert die
  zurückgegebene Sitzungs-ID und liefert die `PhysicsAgentSession`-Sicht, die der
  Adapter erwartet.
- `session/send` öffnet den kontobezogenen WebSocket `/api/events.mux`, reiht über
  `session.prompt` einen Textprompt ein und streamt Text-/Tool-/Terminal-Ereignisse,
  versehen mit einer erzeugten Run-ID.
- `run/cancel` ruft den echten RPC `session.cancel` auf und sendet ein terminales
  Ereignis `run_failed` mit dem Code `RUN_CANCELLED`.
- `run/resume` hängt sich wieder an einen Run an, der in diesem Bridge-Prozess noch
  aktiv ist. Es spielt keinen abgeschlossenen Verlauf erneut ab: Ein unbekannter
  oder beendeter Run schlägt mit `RUN_NOT_RESUMABLE` fehl.

Die Bridge schlägt geschlossen fehl (fail closed) bei Eingaben, die das
Harness-Prompt-Protokoll nicht darstellen kann: Anhänge liefern
`UNSUPPORTED_ATTACHMENTS`; Metadaten zu Szene/Aufgabe/Modellrichtlinie liefern
`UNSUPPORTED_SESSION_CONTEXT`; Harness-Fragen und Freigabe-Prompts liefern ein
terminales Ereignis `SIDECAR_INTERACTION_UNSUPPORTED` und brechen den Run ab.
`scene_changed`, `observation_changed` und `verification_completed` sind
PhysicsOS-Domänenereignisse, keine Harness-Ereignisse, daher erfindet der Sidecar
sie nicht.

Die Bridge-Tests ausführen mit:

```sh
node --test apps/desktop/sidecar/bridge.test.mjs
node --test apps/desktop/sidecar/bridge.live.test.mjs
```

Der Live-Test startet ein temporäres lokales `dsh web`, injiziert ein lokales
OpenAI-kompatibles Mock-Modell, authentifiziert einen Admin und prüft ein echtes
`session.create` plus einen Prompt-Durchlauf über die Bridge.

## Rotation des Updater-Schlüssels

Einen neuen Produktionsschlüssel außerhalb des Repositorys erzeugen:

```sh
pnpm --dir apps/desktop exec tauri signer generate -w ~/.tauri/physicsos-updater.key
```

Den ausgegebenen öffentlichen Schlüssel in der Release-Umgebung oder der
Release-Konfiguration ablegen. Den privaten Schlüssel und das Passwort nur im
Release-Secret-Manager speichern. Ein neuer öffentlicher Schlüssel ändert den
Vertrauensanker, daher muss das erste Release mit ihm über einen bestehenden
vertrauenswürdigen Build verteilt werden; nachfolgende Updates verwenden den neuen
Schlüssel.

Das Release-Signieren benötigt außerdem `TAURI_SIGNING_PRIVATE_KEY` und
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`. Die macOS-Verteilung benötigt ein Apple-
Developer-ID-Zertifikat plus Notarisierungs-Credentials; die Windows-Verteilung
benötigt ihr Code-Signing-Zertifikat. Die signierte `.sig` und die passende
`latest.json` am konfigurierten Endpunkt veröffentlichen, sobald alle
Plattform-Artefakte vorliegen.
