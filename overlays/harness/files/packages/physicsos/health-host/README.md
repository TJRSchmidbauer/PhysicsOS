# PhysicsOS Health Host

`@deepseek-ai/dsh-health-host` registriert zwei exakte Routen auf dem Harness-Webserver:

- `GET /healthz` ist die Prozess-Liveness und berührt nie eine Abhängigkeit.
- `GET /readyz` prüft PostgreSQL und Redis per TCP und liefert `503`, bis
  jede konfigurierte Abhängigkeit antwortet.

Die Verdrahtung der Produktions-Secrets verwendet zwei Dateien:

```text
DATABASE_URL_FILE=/run/secrets/database_url
REDIS_URL_FILE=/run/secrets/redis_url
```

Die Dateien enthalten URLs der Form `postgresql://...` und `redis://...`. Sie werden bei
jeder Readiness-Anfrage neu gelesen, auf 8 KiB begrenzt und nie in Antworten oder
Logs aufgenommen. Sind keine Prüfungen konfiguriert, schlägt die Readiness fail-closed mit
`NO_READINESS_CHECKS` fehl.

`deployment.patch.yml` bindet den Produktions-Webserver an alle Container-
Schnittstellen und hängt das kompilierte Plugin per absolutem Pfad ein. Die Compose-Port-
Bindung bleibt standardmäßig nur auf Loopback.
