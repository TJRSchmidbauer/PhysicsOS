# Harness Replay Baseline Diff

> Erstellungszeitpunkt: 2026-08-18 22:40 UTC+8
> Status: **DIAGNOSTIC ONLY — parallel ausgeführt, nicht für die formale Gate-Entscheidung verwendbar**

## Umgebungsprotokoll

| Punkt           | Wert                                       |
| --------------- | ------------------------------------------ |
| OS              | Microsoft Windows NT 10.0.26200.0          |
| Node            | v24.18.0                                   |
| pnpm            | 11.9.0                                     |
| PowerShell      | 5.1.26100.9168                             |
| pwsh            | **nicht installiert**                      |
| bash            | C:\windows\system32\bash.exe (WSL)         |
| git             | 2.45.1.windows.1                           |
| Upstream commit | `47f943859bef60e4160492346772ded9b24f765a` |

## Build-Ergebnis

### Baseline-Build-Befehl

```
cd d:\PhysicsOS\_baseline-harness
pnpm install --frozen-lockfile
npm run build
```

### Baseline-Build-Ergebnis

- **PASS** (exit 0, `✓ built in 5.92s`)
- Log: `docs/reports/baseline-build-original.log`

### PhysicsOS-Build-Befehl

```
cd d:\PhysicsOS\vendor\deepseek-harness
npm run build
```

### PhysicsOS-Build-Ergebnis

- **PASS** (exit 0, `✓ built in 4.21s`)
- Log: `docs/reports/physicsos-harness-build.log`

### Unterschiede der Build-Konfiguration

| Datei                                      | Baseline (HEAD)          | PhysicsOS                    | Unterschied    |
| ------------------------------------------ | ------------------------ | ---------------------------- | -------------- |
| `package.json`                             | Kein devDep `@types/react` | Ergänzt `@types/react: ~18.3.1` | PhysicsOS-Patch |
| `tsconfig.client.json`                     | Keine Ref `ui-physicsos` | Ergänzt Ref `ui-physicsos`   | PhysicsOS-Patch |
| `packages/bundle/web-app/package.json`     | Keine Abhängigkeit `ui-physicsos` | Ergänzt Abhängigkeit `ui-physicsos` | PhysicsOS-Patch |
| `packages/bundle/web-app/cordis.patch.yml` | Kein Slot `ui-physicsos` | Ergänzt Slot `ui-physicsos`  | PhysicsOS-Patch |
| `tsconfig.base.json`                       | `skipLibCheck: true`     | `skipLibCheck: true`         | **Kein Unterschied** |

### Grundursache des TypeScript-Fehlers

Beim ersten fehlgeschlagenen Baseline-Build wurden 5 `error TS2322/TS2375` gemeldet, alle darüber, dass `bigint` nicht zu `ReactNode` gehört.

**Grundursache**: Beim Schreiben von `_baseline-harness\package.json` mit PowerShell `Set-Content -Encoding utf8` entstand ein UTF-8-BOM, wodurch `JSON.parse` bei der Suche nach der PostCSS-Konfiguration fehlschlug. Nach Wiederherstellung der ursprünglichen `package.json` bestand der Build.

**Schlussfolgerung**: `@types/react@18.3.31` löst unter `skipLibCheck: true` keinen Typfehler aus. Der ursprüngliche Upstream baut in der aktuellen Umgebung Windows + Node 24 normal. **Es existiert kein UPSTREAM_BASELINE_BUILD_BLOCKED**.

### Ist es ein Windows-Upstream-Problem

Nein. Der Baseline-Build besteht im Originalzustand.

## Replay-Ergebnis (DIAGNOSTIC ONLY)

> **Wichtige Einschränkung**: Die Replays beider Seiten wurden **parallel** ausgeführt und teilen sich CPU, Browser-Prozesspool und temporäre Verzeichnisse.
> Auf der PhysicsOS-Seite traten wegen Ressourcenkonkurrenz viele Fehler vom Typ Timeout auf (34-s-Timeout tritt häufig auf).
> Diese Zahlen sind nur eine richtungsweisende Referenz und nicht für eine formale Regression Attribution zu verwenden.
> Der formale Abgleich muss seriell neu ausgeführt werden.

### Baseline Replay

```
Test Files  36 failed | 40 passed (76)
Tests       25 failed | 153 passed | 90 skipped (268)
Exit code: 1
```

### PhysicsOS Replay

```
Test Files  59 failed | 17 passed (76)
Tests       29 failed | 64 passed | 175 skipped (268)
Exit code: 1
```

## Failure Diff (nach Testdatei)

### A. Auf beiden Seiten fehlgeschlagen (36 Dateien)

Dies sind **UPSTREAM_WINDOWS_REPLAY_ISSUE**, nicht von PhysicsOS eingeführt:

```
apps/web/tests/agent-preset-authoring.e2e.ts
apps/web/tests/agent-preset-selection.e2e.ts
apps/web/tests/approval-composer.e2e.ts
apps/web/tests/background-job-list.e2e.ts
apps/web/tests/bash-abort-row.e2e.ts
apps/web/tests/chat-continuous-conversation.e2e.ts
apps/web/tests/chat-long-interactions.e2e.ts
apps/web/tests/chat-scroll-contract.e2e.ts
apps/web/tests/code-mode-round.e2e.ts
apps/web/tests/composer-tab-geometry.e2e.ts
apps/web/tests/details-session-lifecycle.e2e.ts
apps/web/tests/goal-multi-turn-actions.e2e.ts
apps/web/tests/hmr-live.e2e.ts
apps/web/tests/markdown-cjk-strong.e2e.ts
apps/web/tests/markdown-images.e2e.ts
apps/web/tests/markdown-inline-code-links.e2e.ts
apps/web/tests/math-rendering.e2e.ts
apps/web/tests/message-actions.e2e.ts
apps/web/tests/message-feedback-protocol.snapshot.ts
apps/web/tests/message-feedback.e2e.ts
apps/web/tests/minimal-preset.snapshot.ts
apps/web/tests/navigation-panes.e2e.ts
apps/web/tests/plugin-config.e2e.ts
apps/web/tests/produced-file-mentions.e2e.ts
apps/web/tests/produced-files.e2e.ts
apps/web/tests/pwsh-terminal.e2e.ts
apps/web/tests/replay-round-trip.e2e.ts
apps/web/tests/seeded-history.e2e.ts
apps/web/tests/shipped-composition.e2e.ts
apps/web/tests/sidebar-scrollbar.e2e.ts
apps/web/tests/skill-tool-row.e2e.ts
apps/web/tests/smoke-real.e2e.ts
apps/web/tests/stats-paged-history.e2e.ts
apps/web/tests/trajectory-virtualization.e2e.ts
apps/web/tests/turn-tail-actions.e2e.ts
apps/web/tests/workspace-management.e2e.ts
```

### B. Nur Baseline fehlgeschlagen (PhysicsOS besteht) (0 Dateien)

Keine.

### C. Nur PhysicsOS fehlgeschlagen (Kandidaten für PHYSICSOS_REGRESSION) (23 Dateien)

> **Warnung**: Wegen der parallelen Ausführung enthalten diese 23 Dateien sehr wahrscheinlich False Positives durch Ressourcenkonkurrenz.
> Erst nach einem seriellen Neulauf lässt sich dies bestätigen.

```
apps/web/tests/cold-blank-session.e2e.ts
apps/web/tests/composer-draft-scroll.e2e.ts
apps/web/tests/cordis-tool-round.e2e.ts
apps/web/tests/feedback-command.e2e.ts
apps/web/tests/goal-bar.e2e.ts
apps/web/tests/goal-command-presentation.e2e.ts
apps/web/tests/image-display.snapshot.ts
apps/web/tests/lifecycle-chrome.e2e.ts
apps/web/tests/live-interactions.e2e.ts
apps/web/tests/permission-policy-context.e2e.ts
apps/web/tests/plan-review.e2e.ts
apps/web/tests/question-composer.e2e.ts
apps/web/tests/queue-actions.e2e.ts
apps/web/tests/schedule-after.e2e.ts
apps/web/tests/sidebar-subagent-activity.e2e.ts
apps/web/tests/skill-invocation-policy.e2e.ts
apps/web/tests/skill-user-invoke.e2e.ts
apps/web/tests/startup-auto-selection.e2e.ts
apps/web/tests/steering.e2e.ts
apps/web/tests/subagent-conversation.e2e.ts
apps/web/tests/subagent-interrupt-ui.e2e.ts
apps/web/tests/web-search-round.e2e.ts
apps/web/tests/workflow-run.e2e.ts
```

### D. Kaskadierende Skips durch Absturz vorangehender Fixtures

Die 175 Skips auf PhysicsOS-Seite (gegenüber 90 Skips bei der Baseline), die Differenz von 85 Skips ist fast vollständig kaskadierend:

- Fehlschlag des vorangehenden Workspace-Bootstraps → nachfolgende Tests können keinen Workspace anlegen → alle Skip
- Timeout des Browser-Kontexts durch Ressourcenkonkurrenz → die gesamte Datei Skip

## Beobachtete Hinweise auf Root Causes

### 1. Fehler `unknown tool "bash"`

Tritt wiederholt in mehreren Tests auf, die auf beiden Seiten fehlschlagen:

```
Error: unknown tool "bash"
```

Im Replay-Fixture wurde ein `bash`-Tool-Aufruf aufgezeichnet, aber der Harness registriert in der aktuellen Windows-Umgebung kein `bash`-Tool (nur `pwsh`). Das ist ein **UPSTREAM_WINDOWS_REPLAY_ISSUE**.

### 2. Workspace-Bootstrap hängt

Stack des Fehlschlags von `turn-tail-actions.e2e.ts` auf PhysicsOS-Seite:

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('textbox', { name: 'Choose workspace' })
```

PhysicsOS hat den Text zur Workspace-Auswahl in `support.ts` geändert (`'选择工作区'` → `'新建物理世界'`), aber `connectFreshWorkspace` (englische Version) verwendet weiterhin `'Choose workspace'`. Dieser Unterschied kann die Workspace-Auswahl fehlschlagen lassen.

### 3. `hmr-live.e2e.ts` schlägt sofort fehl (29 ms)

Auf beiden Seiten innerhalb von 29 ms fehlgeschlagen, was auf ein **ursprüngliches HMR-Problem des Upstreams unter Windows** hindeutet, ohne Bezug zu PhysicsOS.

### 4. `startup-auto-selection.e2e.ts` 120-s-Timeout

- Baseline-Seite: PASS (7332 ms)
- PhysicsOS-Seite: FAIL (120000 ms Timeout)

Dies ist ein typisches Opfer paralleler Ausführung. Beim seriellen Neulauf besteht der Test möglicherweise.

## PID Artifact Audit

Das Wurzel-Repository hat 4 nicht verfolgte PID-Dateien:

```
DRELOCA~1ASUSTempdsh-subprocess-spec-4IgulWgrandchild-1787024101634.pid
DRELOCA~1ASUSTempdsh-subprocess-spec-4IgulWpipe-holder-1787024113463.pid
DRELOCA~1ASUSTempdsh-subprocess-spec-4IgulWtree-wait-1787024137866.pid
DRELOCA~1ASUSTempdsh-subprocess-spec-4IgulWzombie-group-1787024108461.pid
```

Herkunft: Die Testfälle in `packages/subprocess/subprocess-local/tests/spawn.spec.ts` legen temporäre PID-Dateien (unter `spillDir`) an, um die Logik zum Beenden von Prozessgruppen zu verifizieren. Das Präfix `dsh-subprocess-spec` im Dateinamen passt zum Muster `spawnSubprocess(spec(...))` im Testcode.

Ein normales Teardown sollte `spillDir` nach Testende bereinigen. Dass diese Dateien übrig blieben, liegt daran, dass ein früherer Testlauf abnormal beendet wurde (möglicherweise kill oder Timeout) und die Bereinigung nicht ausgeführt wurde.

**Schlussfolgerung**: Das sind temporäre Testartefakte, kein Produktionsfehler. Die richtige Behandlung ist, im Test-Teardown eine Bereinigung von `spillDir` hinzuzufügen. Sie sollten nicht in `.gitignore` aufgenommen werden.

## Nächste Schritte

1. Baseline-Replay **seriell neu ausführen** (einzeln, ohne Konkurrenz)
2. PhysicsOS-Replay **seriell neu ausführen** (einzeln, ohne Konkurrenz)
3. Das Diff mit den seriellen Ergebnissen neu erzeugen
4. Für echte PHYSICSOS_REGRESSION jeweils die Root Cause lokalisieren
5. UPSTREAM_WINDOWS_REPLAY_ISSUE klassifiziert festhalten

## Aktuelle Beurteilung

```
MAGNETIC_RUNTIME_VERTICAL_SLICE_IMPLEMENTED
HARNESS_REPLAY_GATE_BLOCKED
```

- Der Upstream-Baseline hat unter Windows beim Replay selbst bereits 36 fehlschlagende Dateien (25 fehlgeschlagene Tests), das ist ein UPSTREAM_WINDOWS_REPLAY_ISSUE
- Auf PhysicsOS-Seite könnte es neue Regressionen geben, aber die aktuellen Parallellaufdaten sind nicht vertrauenswürdig
- Ein serieller Neulauf zur Bestätigung ist erforderlich
