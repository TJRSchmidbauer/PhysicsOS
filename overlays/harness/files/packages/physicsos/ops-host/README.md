# `@deepseek-ai/dsh-ops-host`

`ops-host` ist die schreibgeschützte Betriebsoberfläche der Administratorkonsole
der PhysicsOS-Plattform. Sie stellt genau eine Route bereit:

```text
GET /physicsos/ops/metrics
GET /physicsos/ops/metrics?force=1
```

Die Antwort enthält Festplattennutzung des Hosts, begrenzte Verzeichnisbelegung,
Gesundheit/Latenz von PostgreSQL und Redis, Live-Aggregate zu Sitzungen/Konten,
Alarme und Cache-Metadaten. Die Route ist sitzungsauthentifiziert und weist jede
Rolle außer `SUPER_ADMIN` ab.

## Erhebungs- und Cache-Richtlinie

Der Standard-Cache der Erhebung beträgt 15 Sekunden. Gleichzeitige Anfragen teilen
sich eine laufende Erhebung, und `force=1` fordert eine frische Stichprobe an, teilt
sich aber weiterhin eine bereits laufende Erhebung. Der Cache ist bewusst auf kleine,
schreibgeschützte Betriebszahlen beschränkt:

- Zusammenfassungen von Dateisystem- und Verzeichnisgrößen;
- Datenbankgröße und aggregierte Zähler;
- Abhängigkeitslatenz und Speichersummen;
- Prozess-Uptime und Laufzeitversionen.

Er darf niemals Sitzungsprotokolle, Schülerantworten, Credentials, Tokens,
Verbindungszeichenfolgen, Benutzernamen, IP-Adressen oder Berechtigungsentscheidungen
enthalten. Diese Werte werden entweder nicht erhoben oder auf eine Zahl reduziert,
bevor sie die Antwort erreichen.

Verzeichnis-Scans sind durch Eintragsanzahl und Tiefe begrenzt. Sie folgen niemals
Symlinks und führen niemals `du`, `df` oder einen anderen Shell-Prozess aus. Da ein
begrenzter Scan keine exakte rekursive Quote ist, wird das Ergebnis mit
`partial: true` markiert, sobald ein Limit oder eine Berechtigungsgrenze erreicht
wird.

## Konfiguration

Der Host liest die Produktionsverdrahtung direkt:

- `DSH_HOME`, Standard `/var/lib/physicsos`
- `PHYSICSOS_SESSIONS_ROOT`, Standard `<DSH_HOME>/sessions`
- `DATABASE_URL` oder `DATABASE_URL_FILE`
- `REDIS_URL` oder `REDIS_URL_FILE`
- `PHYSICSOS_STORAGE_SCHEMA`, Standard `physicsos`

`DATABASE_URL_FILE` und `REDIS_URL_FILE` werden für Kompositionen unterstützt, die
den Docker-Entrypoint nicht verwenden. Werte werden einmal beim Start des Plugins
gelesen und niemals in die Antwort serialisiert.

Die Cordis-Zeile kann `cacheTtlMs` (Standard 15000), `timeoutMs` (Standard 5000),
`diskWarningPercent` (Standard 85) und `diskCriticalPercent` (Standard 92)
überschreiben. Die Antwort wiederholt die wirksamen Festplattenschwellen, damit das
schreibgeschützte Administratorpanel dieselben Werte einfärben kann, die der Server
ausgewertet hat.
