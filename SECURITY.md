# Sicherheitsrichtlinie

## Unterstützte Versionen

| Version                  | Supportstatus                                    |
| ------------------------ | ------------------------------------------------ |
| Branch `main` / neuestes 0.1.x | Sicherheitsmeldungen und Korrekturen werden angenommen |
| Ältere historische Commits und alte Builds | Nicht unterstützt, bitte zuerst auf die neueste Version aktualisieren |

PhysicsOS befindet sich derzeit in der öffentlichen Beta (public beta); Schnittstellen und Deployment-Weise können noch angepasst werden; Sicherheitskorrekturen werden vorrangig in den Branch `main` übernommen.

## Schwachstellen melden

- **Bitte melden Sie vertraulich über ein GitHub Security Advisory**: Im Repository `Security` → `Report a vulnerability`. Keine öffentlichen Issues eröffnen und keine Details zur Ausnutzung im Diskussionsbereich posten.
- Der Bericht sollte möglichst enthalten: betroffene Version oder Commit, Reproduktionsschritte, Auswirkungsbereich, ob es sich um ein Problem der Deployment-Konfiguration handelt, bereits versuchte Gegenmaßnahmen.
- Wenn Sie anonym bleiben oder namentlich erwähnt werden möchten, geben Sie dies bitte im Bericht an.

## Zugesagte Reaktionszeiten

| Phase                  | Zugesagte Frist                          |
| ---------------------- | ---------------------------------------- |
| Bestätigung des Berichts | Innerhalb von 3 Werktagen              |
| Erste Bewertung und Beurteilung des Auswirkungsbereichs | Innerhalb von 10 Werktagen |
| Korrektur oder Gegenmaßnahme | Je nach Schweregrad schnellstmöglich ein Zeitplan, Fortschritt wird laufend mitgeteilt |
| Öffentliche Offenlegung | Nach Veröffentlichung der Korrektur in Absprache mit der meldenden Person, standardmäßig erst korrigieren, dann offenlegen |

Dies ist eine Zusage nach bestem Bemühen (best effort) für ein gemeinnütziges Projekt und stellt kein kommerzielles SLA dar.

## Projektspezifische Sicherheitsgrenzen

Die Sicherheits-Baseline für das Deployment steht in [`docs/12-SECURITY-PERMISSION.md`](./docs/12-SECURITY-PERMISSION.md) und [`docs/13-DEPLOYMENT-OPERATIONS.md`](./docs/13-DEPLOYMENT-OPERATIONS.md); vor dem Melden einer Schwachstelle bitte mit den folgenden Grenzen abgleichen:

1. **7 Secret-Dateien**: `postgres_password`, `redis_password`, `database_url`, `redis_url`, `deepseek_api_key`, `admin_password`, `image_api_key`. Sie werden über Compose-Secrets nach `/run/secrets/*` eingehängt und von `scripts/docker-entrypoint.mjs` zu Umgebungsvariablen entfaltet. Fehlt ein Secret oder ist es leer, schlägt der Start des Prozesses direkt fehl, das ist erwartetes Verhalten.
2. **`PHYSICOS_TRUSTED_PROXIES` muss das exakte IP-Literal des Reverse Proxy sein** (IPv4 oder IPv6). CIDR und Hostnamen werden beim Start abgelehnt; leer bedeutet, keinem Weiterleitungs-Header zu vertrauen, was dazu führt, dass das Cookie ohne `Secure` gesetzt wird, die CSRF-Origin-Prüfung HTTPS-Anfragen ablehnen kann und alle Besucher denselben Rate-Limit-Bucket teilen. Der Reverse Proxy muss das vom Client übergebene `X-Forwarded-For` überschreiben und nicht anhängen.
3. **In der Produktion muss HTTPS verwendet werden**. Klartext-HTTP ist nur für die lokale Entwicklung oder Abnahmen in isolierten Netzen erlaubt.
4. **Keine `.env*`, Schlüssel, Zertifikate oder privaten Schlüssel committen**. Die `.gitignore` im Repository-Wurzelverzeichnis und in den Submodulen ignoriert lokale Secret-Dateien; finden Sie in Issues, PRs, Logs oder Screenshots echte Schlüssel, melden Sie das bitte über den obigen vertraulichen Weg.
5. **Multi-Replik-Deployments müssen den Zustand teilen**: Rate Limiting und das Ledger für Einmal-Antworten hängen vom Redis-Backend ab; ohne konfiguriertes gemeinsames Backend wird auf eine Einzelprozess-In-Memory-Implementierung zurückgegriffen, die bei mehreren Repliken keine replikaübergreifende Garantie bietet.

## Hinweise zum Umfang

Folgendes gilt in der Regel nicht als Sicherheitslücke dieses Repositorys, verdächtiges Verhalten wird aber trotzdem gern entgegengenommen:

- Probleme, die nur die lokale Entwicklungsumgebung betreffen und voraussetzen, dass der Angreifer bereits Lese-/Schreibzugriff auf Dateien der lokalen Maschine hat;
- Schwachstellen von Abhängigkeiten, die der Upstream bereits öffentlich gemacht, aber noch nicht korrigiert hat (wir verfolgen sie und aktualisieren, sobald verfügbar);
- Verhalten, das nur auslösbar ist, wenn der Betreiber des Produktions-Deployments Sicherheitskonfiguration aktiv abschaltet (z. B. `PHYSICOS_TRUSTED_PROXIES` auf eine beliebige Quelle setzt).
