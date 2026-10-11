# @deepseek-ai/dsh-storage-postgres

PostgreSQL-Backend für den [Storage-Hub](../storage/README.md): registriert sich als
Backend `postgres` und bedient die `kv`-Facette über einen begrenzten
`pg`-Verbindungspool.

## Speichermodell

Das Backend hält seine Metadaten in zwei Tabellen innerhalb des konfigurierten
Schemas: `dsh_storage_units` stempelt beim ersten Öffnen die Descriptor-Version jeder
Einheit, und `dsh_storage_globals` hält das globale Singleton jeder Einheit. Ein Paar
aus Einheit/Tabelle erhält eine eigene Tabelle `u_<digest>`, wobei der Digest aus
beiden validierten Namen abgeleitet wird. Das hält physische Bezeichner innerhalb der
63-Byte-Grenze von PostgreSQL und verhindert, dass Unterstrich-Kombinationen wie
(`a_b`, `c`) und (`a`, `b_c`) denselben Speicher teilen.

Datensätze verwenden einen JSON-Textwert plus einen SHA-256-Hash des JSON-kodierten
Schlüssels. Der Hash ist der Primärschlüssel, während der vollständige Schlüssel in
`key_json` verbleibt; Schlüssel verbrauchen daher nicht das B-Tree-Eintragsbudget von
PostgreSQL und dürfen NUL, Unicode oder sehr große Zeichenketten enthalten. Upserts
und Deletes sind einzelne parametrisierte SQL-Anweisungen, sodass die
Anweisungsatomarität von PostgreSQL und das normale dauerhafte Commit-Verhalten den
Schreibvertrag des Hubs ohne eine für den Aufrufer sichtbare Transaktion erfüllen.

Namen von Einheiten und Tabellen werden gegen `UNIT_NAME_RE` des Storage-Hubs
validiert. Der Schemaname wird vor dem Quoting validiert und in der Länge begrenzt.
Metadatennamen sind fest, physische Namen sind Digests, und jeder Datensatzwert und
Schlüssel wird als SQL-Parameter übertragen.

## Konfiguration (schemastery)

```ts
interface Config {
  connectionString: string
  schema?: string // validated identifier; default 'public'
  maxConnections?: number // integer from 1 to 100; default 10
  ssl?: boolean | 'require' // default false
}
```

`ssl: true` verwendet die normale Zertifikatsprüfung der Plattform.
`ssl: 'require'` aktiviert TLS und akzeptiert das Serverzertifikat ohne zusätzliche
CA-Konfiguration. Eine ungültige Konfiguration schlägt bei der Konstruktion des
Plugins fehl und nicht erst bei der ersten Abfrage.

## Lebenszyklus und Fehler

Das Öffnen einer fehlenden Einheit legt ihre Metadatenzeile und die Datensatztabellen
transaktional an. Ein abweichender Versionsstempel wird mit `version-mismatch`
abgelehnt. Ein ungültiger JSON-Wert oder Schlüssel im Medium lässt Lesevorgänge mit
`malformed-medium` ablehnen. Ein zweites Öffnen desselben Einheitennamens wird
abgelehnt, Aufrufe nach dem Schließen einer Einheit werden mit `closed` abgelehnt, und
sowohl das Schließen der Einheit als auch des Backends ist idempotent und lässt
laufende Operationen auslaufen.

## Modellerfahrung

### Gespeicherte Domänendatensätze

#### Was das Modell sieht

Nichts. Dieses Backend steuert keinen Prompt, kein Tool und kein Schema bei; es
persistiert hostseitige Domänendaten hinter `ctx.storage`.

#### Token-Wirkung

Null Live-Request-Tokens.

#### KV-Cache-Wirkung

Keine. Das Backend berührt nie Präfixe von Live-Anfragen.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Es gibt kein Framework für Schema-Migrationen. Das Release hat derzeit ein Layout
  und behandelt Kompatibilitätsänderungen als künftige Migrationsaufgabe.
- Lock- oder Serialisierungsfehler von PostgreSQL werden direkt durchgereicht; dieses
  Backend fügt keine Wiederholungsschleife hinzu.
- Der Primärschlüssel der Schlüssel verwendet einen SHA-256-Digest. Eine
  Digest-Kollision zwischen zwei verschiedenen Schlüsseln würde diese Datensätze
  aliasieren; die Wahrscheinlichkeit gilt für das aktuelle Medium als vernachlässigbar.
- TLS-Modi jenseits von `true` und `'require'` sind zurückgestellt, bis eine
  Bereitstellung eigenes Zertifikatsmaterial oder Steuerungen zur
  Hostnamenprüfung benötigt.
