# PhysicsOS Release-Handbuch

Ein Release geht nur von einem Commit oder Tag aus, der die CI bestanden hat. Maßgeblich für Produktions-Deployment, Backup und Wiederherstellung ist [`13-DEPLOYMENT-OPERATIONS.md`](./13-DEPLOYMENT-OPERATIONS.md); diese Seite beschreibt nur den Release-Einstieg, das Signaturmaterial und die Checkliste.

## Server-Image-Release

1. Sicherstellen, dass CI, `docker compose config --quiet` und die Verifikation der Deployment-Änderungen für den Kandidaten-Commit vollständig bestanden sind.
2. Einen unveränderlichen semantischen Tag erstellen, z. B. `v0.2.0`, und den Tag pushen.
3. Der Tag löst [`.github/workflows/release.yml`](../.github/workflows/release.yml) aus, der ein `linux/amd64`-Image baut, nach GHCR pusht und anschließend ein GitHub Release erstellt.
4. Der Workflow kann auch manuell gestartet werden, indem ein vorhandener Tag angegeben und ein Entwurfs-Release gewählt wird.
5. Commit-SHA, Image-Digest, Compose-Revision, Migrationsversion (falls vorhanden) und verantwortliche Person festhalten; beim Deployment den Digest verwenden und sich nicht allein auf bewegliche Tags verlassen.

Der Image-Name ergibt sich aus dem Repository-Pfad, der Tag wird aus der semantischen Version abgeleitet; Vorabversionen aktualisieren `latest` nicht automatisch.

## Desktop-Release

[`.github/workflows/desktop-release.yml`](../.github/workflows/desktop-release.yml) baut bei einem `v*`-Tag oder manueller Auslösung:

- macOS arm64: `.app` und `.dmg`
- macOS x86_64: `.app` und `.dmg`
- Windows x86_64: NSIS-`.exe` und MSI-`.msi`

Fehlt das Signaturmaterial, erzeugt der Workflow unsignierte Builds, die nur für interne Verifikation taugen und nicht als Installationspaket für die öffentliche Beta verwendet werden dürfen.

### Signatur- und Update-Material

Die macOS-Codesignierung benötigt `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD` und
`APPLE_SIGNING_IDENTITY`. Die Notarisierung benötigt `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` und muss mit den derzeit vom Workflow injizierten Secrets übereinstimmen. Windows benötigt `WINDOWS_CERTIFICATE`,
`WINDOWS_CERTIFICATE_PASSWORD` oder `WINDOWS_CERTIFICATE_THUMBPRINT` für ein bereits installiertes Zertifikat. Zertifikate, Passwörter und
API-Private-Keys dürfen nur aus einem geschützten Release-Environment stammen und nicht in das Repository, die Release-Konfiguration, Kommandozeilenargumente oder Logs geschrieben werden.

Für Tauri-Update-Pakete werden außerdem benötigt:

- `PHYSICSOS_DESKTOP_UPDATE_PUBKEY`
- `PHYSICSOS_DESKTOP_UPDATE_ENDPOINT`
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (wenn der private Schlüssel ein Passwort hat)

Vor dem Release `pnpm run desktop:release-config` ausführen; es lehnt Entwicklungsschlüssel, Platzhalterdomains, Nicht-HTTPS-Endpunkte und Builds ab, die noch auf die Entwicklungsseite zeigen. `update-host` hostet nur das Manifest `latest.json`, nicht die Installationspakete; Installationspakete und die zugehörigen `.sig`-Dateien müssen zuerst an eine stabile HTTPS-Adresse hochgeladen und anschließend über die Verwaltungsschnittstelle von `update-host` als Version registriert, veröffentlicht oder zurückgerollt werden. Schnittstellen- und Kanalregeln siehe [`overlays/harness/files/packages/physicsos/update-host/README.md`](../overlays/harness/files/packages/physicsos/update-host/README.md).

`update-host` prüft die auf dem Server eingehende Signatur nur auf ihre Form; das ersetzt keine kryptografische Verifikation. Vor dem Release müssen der Client oder die Tauri-
CLI Installationspaket und `.sig` mit dem eingebetteten öffentlichen Schlüssel verifizieren; schlägt die Prüfung fehl, darf keine neue Version registriert werden.

## Datenbank-Backup und Wiederherstellung

Vor dem Release ist gemäß [`13-DEPLOYMENT-OPERATIONS.md`](./13-DEPLOYMENT-OPERATIONS.md) ein koordiniertes Backup von PostgreSQL, Redis und `app_data` durchzuführen und das Backup-Manifest zu verifizieren. Eine Wiederherstellung ist ein destruktiver Vorgang; sie erfordert ein Wartungsfenster, einen klar benannten Wiederherstellungspunkt und eine abgeschlossene Wiederherstellungsübung. Wiederherstellungsbefehle werden auf dieser Seite weder kopiert noch umgeschrieben.

## Checkliste vor dem Release

- [ ] CI, Lint, Tests und Build des Kandidaten-Commits sind vollständig bestanden.
- [ ] `.env` und die sieben Arten von Produktions-Secret-Dateien sind nicht committet; Berechtigungen und Rotationsstand sind bestätigt.
- [ ] Für PostgreSQL, Redis und `app_data` existiert ein verifizierbares Backup, das Ergebnis der Wiederherstellungsübung ist dokumentiert.
- [ ] `docker compose config --quiet`, `/healthz` und `/readyz` bestehen; Reverse Proxy und `PHYSICOS_TRUSTED_PROXIES` sind geprüft.
- [ ] Image-Digest, Prüfsummen der Desktop-Installationspakete und Signaturmaterial sind dokumentiert.
- [ ] Version, Plattform, URL und Signatur in `latest.json` stimmen mit den tatsächlich hochgeladenen Artefakten überein.
- [ ] Die Release Notes nennen bekannte Einschränkungen, Rollback-Weg, Auswirkungen der Datenmigration und die durchführende Person.
