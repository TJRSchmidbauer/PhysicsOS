# @deepseek-ai/dsh-model-pool-host

Plattform-Modell-Fallback und Key-Pool von PhysicsOS. Das Design orientiert sich am
Modell „Kanal / Schlüssel“ von new-api, behält aber nur das, was diese Bereitstellung
wirklich braucht: einen lokalen OpenAI-kompatiblen Proxy, gewichtetes Round-Robin und
Failover über mehrere Kanäle und mehrere Keys, verschlüsselte Ablage in der
Datenbank, Pflege im Backend und die Nachvollziehbarkeit, wer was geändert hat.

## Was es löst

Früher war die Modellkette „ein `DEEPSEEK_BASE_URL` + ein Key“. Sobald der Key
ungültig wurde, bekamen alle Modellrunden der gesamten Plattform gemeinsam ein 401.
Jetzt:

```
Harness ──▶ http://127.0.0.1:<PHYSICSOS_MODEL_POOL_PORT>/v1
                     │  nach priority gestuft + geglättetes gewichtetes Round-Robin innerhalb der Stufe
                     ├─▶ Kanal A / Key 1  ─┐
                     ├─▶ Kanal A / Key 2  ─┤ bei Fehler zum nächsten Kandidaten wechseln
                     └─▶ Plattform-Fallback-Kanal ─┘ alle fehlgeschlagen → eindeutiger Fehler, niemals eine gefälschte Antwort
```

## Zentrales Verhalten

| Verhalten | Wert / Erläuterung |
| --- | --- |
| Schlüsselablage | AES-256-GCM; der Schlüssel wird aus `PHYSICSOS_MODEL_POOL_SECRET` per HKDF-SHA256 abgeleitet. Die Liste zeigt nur die letzten 4 Stellen. |
| Round-Robin | Je kleiner `priority`, desto früher; innerhalb derselben Stufe geglättetes gewichtetes Round-Robin (weight aufsummieren, das Maximum wählen, dann die Summe abziehen). |
| Wiederholung | Standard `retryCount=2` (höchstens 3 Versuche) und nicht mehr als die Anzahl der Kandidaten; bei Client-Fehlern (400/404/422) wird der Key nicht gewechselt. |
| Abkühlung | Nach `failureThreshold=3` aufeinanderfolgenden Fehlern oder bei jedem 401/403 sofort in die Abkühlung; ab `cooldownBaseMs=30s` exponentielles Backoff, Obergrenze `cooldownMaxMs=30min`. |
| Erholung | Bei `autoRecover=true` kehrt der Key nach Ablauf der Abkühlung automatisch in den Betrieb zurück; bei false muss ein Admin im Backend „Wiederherstellen“ wählen. |
| Streaming | Wiederholt wird nur „vor den Antwort-Headern“. Ein bereits begonnener Stream wird nicht wiederholt abgespielt, um doppelte Inhalte zu vermeiden. |
| Modellalias | Die „Modellliste“ eines Kanals enthält den **eigenen Modellnamen des Upstreams**; beim Weiterleiten ersetzt der erste davon den plattformseitigen Namen (z. B. nennt die Plattform es einheitlich „平台公益模型“, der Upstream kennt aber nur `minimax-m3`). Bleibt sie leer, wird der Modellname des Aufrufers unverändert durchgereicht. Die Auswahl filtert nicht mehr nach Modellnamen: Jeder aktivierte Kanal ist Kandidat, die Reihenfolge bestimmt `priority`. |
| Alles ausgefallen | Gibt HTTP 503 + `MODEL_POOL_EXHAUSTED` zurück (oder `MODEL_POOL_EMPTY` / `MODEL_POOL_NO_KEY` / `MODEL_POOL_ALL_COOLING`), mit chinesischer Begründung. |
| Audit | `channel.create/update/delete`, `key.create/update/delete/reset`, `settings.update`; protokolliert werden nur die letzten Stellen und Parameter, nie der Key-Wert. |

## Backend-Schnittstellen (nur SUPER_ADMIN)

Präfix `/physicsos/model-pool`; Schreibzugriffe verlangen `content-type: application/json`:

| Methode | Pfad | Wirkung |
| --- | --- | --- |
| GET | `/state` | Kanäle + Keys (geschwärzt) + Statistik + Audit + Richtlinie, auf einem Bildschirm renderbar |
| POST | `/channels` | Kanal hinzufügen |
| PATCH / DELETE | `/channels/:id` | Kanal ändern / löschen (Löschen entfernt auch seine Keys) |
| POST | `/channels/:id/keys` | Key hinzufügen (Klartext nur im Request-Body, beim Speichern sofort verschlüsselt) |
| PATCH / DELETE | `/keys/:id` | ändern (einschließlich Key-Wechsel) / löschen |
| POST | `/keys/:id/reset` | Fehlerzähler zurücksetzen, Abkühlung aufheben |
| POST | `/keys/:id/test` | eine minimale Anfrage mit `max_tokens=1` senden, Latenz und Fehler melden |
| PATCH | `/settings` | Anzahl Wiederholungen, Fehlerschwelle, Abkühlungsbasis und -obergrenze, automatische Erholung |

## Konfiguration

| Konfiguration / Umgebungsvariable | Standard | Erläuterung |
| --- | --- | --- |
| `port` / `PHYSICSOS_MODEL_POOL_PORT` | `38972` | Lauschport des Proxys (nur lokal) |
| `host` / `PHYSICSOS_MODEL_POOL_HOST` | `127.0.0.1` | Bindeadresse des Proxys, nicht auf `0.0.0.0` ändern |
| `PHYSICSOS_MODEL_POOL_SECRET`(`_FILE`) | keiner | Hauptschlüssel der Verschlüsselung; fehlt er, ist das Backend schreibgeschützt und der Proxy verweigert das Entschlüsseln |
| `PHYSICSOS_MODEL_FALLBACK_BASE_URL` | `https://api.deepseek.com/v1` | Adresse des Fallback-Kanals, mit dem ein leerer Pool befüllt wird |
| `PHYSICSOS_MODEL_FALLBACK_API_KEY`(`_FILE`) | keiner | Fallback-Key; ist er vorhanden und der Pool leer, wird automatisch ein Kanal mit `priority=100` angelegt |

## Verdrahtung der Bereitstellung

1. In `compose.yml` zeigt `DEEPSEEK_BASE_URL` auf `http://127.0.0.1:${PHYSICSOS_MODEL_POOL_PORT}/v1`.
2. Ein Secret `model_pool_secret` und `PHYSICSOS_MODEL_POOL_SECRET_FILE` hinzufügen; er muss langfristig stabil bleiben,
   ein Austausch bedeutet, dass alle gespeicherten Keys neu erfasst werden müssen
   (`KEY_DECRYPT_FAILED`, es wird nie stillschweigend ein falscher Key verwendet).
3. Das bisherige `DEEPSEEK_API_KEY` muss weiterhin einen nicht leeren Wert behalten – die Verbindungsprüfung des Harness
   verlangt, dass es existiert, der Proxy verwendet es aber nicht mehr.

## Tests

```sh
./node_modules/.bin/vitest run packages/physicsos/model-pool-host/tests
```
