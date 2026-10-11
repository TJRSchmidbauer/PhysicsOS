# ADR-0001: Kontobasierte Sitzungsspeicherung

- Status: akzeptiert
- Datum: 2026-09-26
- Entscheider: PhysicsOS Maintainer
- Zugehörige Dokumente / PRs: `packages/session/session-persistence-jsonl`, `scripts/migrate/sessions-to-account-layout.mjs`

## Kontext

Sowohl die Web- als auch die Desktop-Version von PhysicsOS müssen es ermöglichen, dass dasselbe Konto auf verschiedenen Geräten dieselben Sitzungen wiederherstellt. Gleichzeitig dürfen andere Konten auf demselben Server durch Verzeichnis-Scans, Fehlkonfigurationen oder Betriebsskripte keine fremden Transkripte lesen können. Das ursprüngliche JSONL-Layout war nach `cwd` und Session-ID in Verzeichnisse gegliedert; das passt für einen Einzelnutzer-Harness, kennt aber keine Kontodimension.

Der `SessionHeader` ist ein stabiles Upstream-Sitzungsformat und enthält derzeit nur `id`, `cwd`, Lineage und `agentPreset`, kein Konto. Das eigentliche Zuordnungsbuch von PhysicsOS sind die Zeilen `api_resources` in der Speicherdomäne `physicsos_auth`: `session -> ownerKey(schoolId:username)`. Der Workspace-Pfad ist ein SHA-256-Digest des userKey und lässt sich nicht auf das Konto zurückführen; die Session-ID selbst trägt ebenfalls kein Konto.

Daher müssen „wer darf lesen und schreiben“ und „wo liegen die Dateien“ getrennt werden: Ersteres bleibt Aufgabe der Zuordnungsprüfung von `/api`, Letzteres liefert eine stabile Kontoverzeichnis-Grenze für Backup, Kontingente, Audit und geräteübergreifende Wiederherstellung.

## Entscheidung

- Das neue materialisierte Layout lautet `<root>/<schoolId>/<encoded-userKey>/<encoded-sessionId>/session.jsonl*`.
- `schoolId`, `userKey` und Session-ID müssen vor dem Eintritt ins Dateisystem eine Whitelist-Prüfung oder eine Injektions-sichere Kodierung durchlaufen; `..`, Pfadtrenner, NUL, leere Segmente und ein unzulässiges Konto-Alphabet werden abgelehnt.
- Das JSONL-Backend löst `SessionHeader -> owner` synchron über den optionalen Cordis-Dienst `physicsosSessionOwnership` auf. Fehlt der Dienst, wird weiter im alten Layout geschrieben; schlägt die Auflösung fehl oder wird ein ungültiger Owner geliefert, schlägt der Vorgang laut fehl (fail loud).
- Beim Lesen wird zuerst das Kontolayout erkannt, danach auf das alte Layout `<root>/<project>/<sessionId>/` zurückgegriffen. Existiert dieselbe Session-ID an beiden Orten oder unter zwei Ownern, wird ein eindeutiger Layout-Konflikt gemeldet, statt stillschweigend eine Variante zu wählen.
- Die Migration erfolgt durch ein Offline-Skript: Standardmäßig Dry-Run, erst `--apply` benennt um; die Zuordnung wird nur aus einer expliziten `api_resources`- oder Ownership-Manifest-Quelle gelesen, unbekannte, widersprüchliche und ungültige Header werden übersprungen und gemeldet.
- Die Autorisierungsgrenze hängt nicht von Verzeichnisnamen oder Dateipfaden ab. Die Zuordnungsprüfung über `api_resources` bleibt die einzige Zugangsentscheidung; die Verzeichnisschichtung dient der betrieblichen Isolation, dem Backup-Umfang und Compliance-Prüfungen.

## Konsequenzen

- Positiv: Kontodaten haben auf gemeinsam genutzten Servern eine stabile Grenze; alte Logs lassen sich stapelweise migrieren; Desktop- und Web-Client können Sitzungen aus demselben Kontoverzeichnis wiederherstellen; Konflikte werden nicht fälschlich als Daten eines der Konten gelesen.
- Negativ: Beim Entdecken von Sitzungen müssen altes und neues Layout gescannt werden, die Start-Enumeration der Kontoverzeichnisse ist teurer als bei einer einzigen alten Wurzel; während der Migration muss die beidseitige Konfliktprüfung gepflegt werden.
- Nachzuverfolgen: Die Produktions-Composition muss einen `physicsosSessionOwnership`-Provider veröffentlichen und den In-Memory-Index von `api_resources` oder eine gleichwertige Abfrage an das Backend anbinden; bei JSON-Speicher-Deployments kann das Migrationsskript `physicsos_auth.json` lesen, PostgreSQL-Deployments sollten auf Datenbankabfragen umgestellt werden.
- Bei Multi-Replica-Deployments muss das Sessions-Root auf einem gemeinsamen Dateisystem liegen, oder Sitzungsindex und -inhalt müssen nach PostgreSQL verlagert werden. Eine rein lokale Verzeichnisschichtung erfüllt die Konsistenz über Replikate hinweg nicht und bietet auch keinen prozessübergreifenden Schreib-Ausschluss.

## Alternativen

- Owner aus `cwd` ableiten: verworfen. Der Workspace-Pfad ist ein Hash-Digest und nicht umkehrbar; das Raten anhand von Pfadpräfixen würde nach Umbenennungen, bei geteilten Verzeichnissen oder nach Migrationen Daten dem falschen Konto zuordnen.
- `owner/schoolId` in den `SessionHeader` aufnehmen: vorerst nicht übernommen. Das würde das Upstream-Sitzungsformat verändern und die Sitzungspersistenz zur Abhängigkeit von der Authentifizierungsdomäne machen; bis zu einem Formatupgrade hält ein expliziter Resolver die Grenze zwischen Backend und Authentifizierung aufrecht.
- Pro Konto einen Symlink auf das alte Verzeichnis anlegen: verworfen. Dabei bliebe der alte Pfad die maßgebliche Identität, was Doppelschreibvorgänge und Rechte-Umgehung begünstigt, und Backup-Werkzeuge könnten die tatsächliche Grenze nicht zuverlässig unterscheiden.
