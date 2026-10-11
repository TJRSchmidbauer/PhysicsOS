# NOTICE

PhysicsOS ist ein **gemeinnütziges Open-Source-Projekt**; der eigene Code und die eigene Dokumentation werden gemäß der `LICENSE` im Repository-Wurzelverzeichnis (PolyForm Noncommercial 1.0.0) lizenziert, ausschließlich für nichtkommerzielle, gemeinnützige Zwecke.

## Komponenten Dritter

### DeepSeek Harness

- Upstream-Repository: <https://github.com/deepseek-ai/deepseek-harness>
- Integrationsweise: Git-Submodul `vendor/deepseek-harness`, Pin siehe `docs/HARNESS-UPSTREAM.md`
- Upstream-Lizenz: MIT License, Copyright (c) 2026 DeepSeek

Dieses Repository verteilt den Harness-Quellcode nicht als Ganzes neu, sondern nur:

- `overlays/harness/files/`: von PhysicsOS selbst geschriebene Harness-Client-Plugins und statische Assets
- `overlays/harness/upstream-changes.patch`: Patch mit lokalen Änderungen an Harness-Quelldateien

Die vom Patch betroffenen Upstream-Dateien unterliegen weiterhin der MIT-Lizenz des Upstreams, das Urheberrecht liegt bei DeepSeek; PhysicsOS beansprucht nur Rechte an den im Patch neu hinzugefügten Inhalten. Nutzer müssen den Harness-Quellcode selbst aus dem Upstream-Repository beziehen und dessen MIT-Lizenz und Urheberrechtsvermerk beibehalten.

Das Feld `"license": "MIT"` in `overlays/harness/files/packages/client/ui-physicsos/package.json` ist eine Anforderung der Package-Prüfung des Harness-Workspace selbst (`verify-dsh-package-licenses`) und bedeutet nicht, dass der eigene Code von PhysicsOS auf MIT umgestellt wurde. Maßgeblich für die Lizenzierung des eigenen Codes von PhysicsOS ist die `LICENSE` dieses Repositorys.

### C-Eval-Aufgabendaten (`scripts/ingest-ceval-physics.mjs`)

- Upstream-Datensatz: <https://huggingface.co/datasets/ceval/ceval-exam>
- Nutzungsumfang: alle 401 Einfachauswahl-Aufgaben der beiden Fächer `middle_school_physics` und
  `high_school_physics` (Aufgabenstellung / vier Optionen / Antwort / Lösung)
- Upstream-Lizenz: **CC BY-NC-SA 4.0** (Namensnennung — nicht kommerziell — Weitergabe unter gleichen Bedingungen)
- Kompatibilität: Der eigene Code von PhysicsOS wird unter PolyForm Noncommercial 1.0.0 lizenziert, ebenfalls
  nichtkommerziell; dieses Repository verwendet die Daten gemäß den Bedingungen von CC BY-NC-SA zu Namensnennung und Weitergabe unter gleichen Bedingungen

Die Daten werden über `scripts/ingest-ceval-physics.mjs` in die Aufgabenbank von PhysicsOS abgebildet, wobei je Eintrag erhalten bleiben:

- `sourceLabel`: `C-Eval <config>（<split>）`
- `sourceUrl`: Adresse des Upstream-Datensatzes
- `answerTier`: `web-public`
- `reuseModes`: `['adapt']` —— **ohne `verbatim`**, d. h. der Klausurzusammenstellungs-Algorithmus darf sie nur als Grundgerüst
  für Umformulierungen verwenden, sie werden nie wörtlich als Klausur gedruckt
- `anomalies`: wahrheitsgemäße Aufzeichnung der Felder, die diese Datenquelle **nicht liefert** (keine offizielle
  Wissenspunkt-Kennzeichnung, Schwierigkeit, Kompetenzstufe, Punktzahl, und keine Verifikation anhand einer echten Klausur); die Wissenspunkte wurden
  aus Aufgabenstellung und Optionen nach der im Skript offengelegten Schlüsselworttabelle **maschinell abgeleitet** und mit
  `knowledge-derived-from-stem` markiert
- Alle Einträge werden mit `status: 'pending'` aufgenommen und **müssen von Lehrkräften im Klausurbereich einzeln verifiziert werden**,
  bevor sie an der Klausurzusammenstellung teilnehmen

Diese Aufgaben sind **keine Originalaufgaben aus Guizhou** und wurden mit keiner Klausur abgeglichen; ihre Aufgabe ist es, dem Zusammenstellungs-Algorithmus
eine echte nutzbare Aufgabenquelle zu geben, nicht, bereits verifizierte Inhalte der Klausurbibliothek vorzutäuschen.

### Visuelle Assets

Die Bilder unter `UI/generated/` wurden von einem Generierungsmodell erzeugt, die Generierungsparameter liegen in der gleichnamigen `.json`; sie dürfen ebenfalls gemäß `LICENSE` nur für nichtkommerzielle, gemeinnützige Zwecke verwendet werden.
