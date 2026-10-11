# tests

Browser-Abnahmetests über Package-Grenzen hinweg.

## acceptance/

Ende-zu-Ende-Abnahmedurchgänge gegen den **laufenden Harness-Webservice** (`pnpm dev`, Port 3080),
je Meilenstein ein `*-acceptance.mjs`, direkt mit node auszuführen:

```bash
pnpm dev                                        # zuerst den Service starten
node tests/acceptance/library-home-acceptance.mjs
```

Die gemeinsame Infrastruktur liegt in `support.mjs`: Browserstart, fünf Gates (console / page error /
unhandled rejection / failed request / 4xx-5xx), das ✓/✗-Prüfbuch,
Screenshots nach `docs/reports/screenshots/` und das Überspringen des Onboardings. Die Suiten schreiben nur Produktfälle.

`harness-*-shot.mjs` und `final-screenshots.mjs` sind eigenständige Screenshot-Werkzeuge,
die nicht in die Gate-Entscheidung eingehen.

## agent/

Abnahme der Kette Harness-Modell → PhysicsOS-Tool → Engine; sie braucht weder Browser noch einen Modell-API-Key:

```bash
node tests/agent/headless-physics-acceptance.mjs
```

Das Skript startet das mitgelieferte Mock-LLM des Harness (geskriptet als „zuerst `physics_solve_question` anfordern, dann eine Textantwort geben“),
führt in einem temporären `DSH_HOME` mit `--profile headless --patch tests/agent/physics-headless.patch.yml`
einen echten `dsh`-Prozess aus, dekodiert dann das Sitzungslog und prüft 13 Gates: Das Tool-Verzeichnis enthält nur die sieben `physics_*`-Tools,
die Persona enthält die Physikverfassung, genau ein `tool/call`, `tool/result` ist ein `solved`-Ergebnis der Aufgaben-Runtime mit Engine-Prüfung
`passed` (R = 7.83 cm, T = 1.64×10⁻⁷ s), `turn/end` ist `completed`.

- `physics-headless.patch.yml`: Eine `--patch`-Überlagerung, die den Coding-Agent des Headless-Profils durch die Komposition „Physik-Lernmodus“ ersetzt,
  dieselbe Komposition wie das Web-Preset `apps/cli/config/agent-presets/physics-student`. Einmal mit einem echten Modell ausführen:
  `pnpm -C vendor/deepseek-harness dsh --profile headless --patch ../../tests/agent/physics-headless.patch.yml "<Aufgabenstellung>"`.
- `run-mock-llm.mjs`: Startet das Mock-LLM einzeln (zum manuellen Debuggen gegen `dsh web` / headless).
- `dump-session-log.mjs`: Dekodiert `session.jsonl.zstd` Frame für Frame und gibt es als `type :: data` aus.
