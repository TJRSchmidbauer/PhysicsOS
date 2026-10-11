# PhysicsOS Agent-Architekturdesign

> Datei: `docs/04-AGENT-ARCHITECTURE.md`  
> Dokumentposition: Harness / Tools / Skills / Context / Memory Gesamtarchitektur (inkl. bereits stillgelegtes Agent-Runtime-Designentwurf)
> Upstream-Dokumente:
>
> - `00-PRODUCT-OVERVIEW.md`
> - `01-DEVELOPMENT-GUIDE.md`
> - `02-ENGINEERING-STANDARDS.md`
> - `03-DOMAIN-CONTRACTS.md`
>
> Dieses Dokument definiert die technischen Grenzen und Betriebsweisen aller Agent-bezogenen Fähigkeiten in PhysicsOS.
>
> **Kernprinzip: DeepSeek Harness ist Agent-Infrastruktur, nicht der PhysicsOS-Geschäftskern.**
>
> **Stillgelegt (ADR-0002, 2026-09-27)**: Die in diesem Dokument beschriebenen `@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter` Adapter-Paare sind **stillgelegt und gelöscht**, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. **Harness ist der Agent-Host; PhysicsOS baut keinen unabhängigen Agent-Runtime auf und wartet auch keinen** — Modelle und Harness liefern Verständnis und Operationen, unser eigener Runtime ist der Physik-Welt-Runtime (Scene → Engine → Verifier), nicht Agent-Loop. **Alle in diesem Dokument vorkommenden „PhysicsOS Agent Runtime“, „PhysicsAgentRuntime“, „AgentRuntime“ Bezeichnungen sind historische Designentwürfe**, sie beziehen sich auf die konzeptionelle Ebene über dem Harness-Host und bedeuten nicht, dass PhysicsOS über einen unabhängigen Runtime verfügt. Die in diesem Dokument vorkommenden Adapter-Ketten-Diagramme und Paketpositionen wurden entsprechend korrigiert; die tatsächliche Produktionskette siehe `docs/HARNESS-UPSTREAM.md`: Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

---

# 1. Dokumentziele

Dieses Dokument beantwortet:

> **Wie läuft der PhysicsOS Agent eigentlich?**

Folgendes muss geklärt werden:

```text
Wer ist für das Verstehen der Aufgabe zuständig
Wer ist für das Erstellen der PhysicsScene zuständig
Wer ist für das Aufrufen der Physics Engine zuständig
Wer ist für die Verifizierung zuständig
Wer ist für die Lehre zuständig
Wer ist für den Kontext zuständig
Wer ist für das Tool zuständig
Wer ist für das Memory zuständig
Wer ist für die Session zuständig
Wer ist für die Zustandswiederherstellung zuständig
In welcher Schicht befindet sich DeepSeek Harness eigentlich
```

Der PhysicsOS Agent ist kein gewöhnlicher Chatbot.

Er muss in der Lage sein:

```text
Aufgabe verstehen
PhysicsScene verstehen
Physics IR lesen
Physikalische Szenen erstellen / ändern
Physics Tools aufrufen
Physics Engine aufrufen
Math Runtime aufrufen
Ergebnisse verifizieren
Observation steuern
Timeline steuern
Physikalische Prozesse erklären
Schülerfehler diagnostizieren
Langfristigen Lernzustand pflegen
```

---

# 2. Höchste Prinzipien des Agents

Der PhysicsOS Agent befolgt folgende höchste Prinzipien:

## 2.1 Agent ist nicht die reale physikalische Welt

Der Agent kann:

```text
Verstehen
Planen
Auswählen
Erklären
Änderungen anfordern
```

Aber er kann nicht direkt entscheiden:

```text
Wo sich Objekte letztlich befinden
Wie die Bahn aussieht
Wie groß die Lorentzkraft genau ist
Wie groß der Stromkreis-Strom ist
Wie groß die Geschwindigkeit nach Kollision ist
```

Die tatsächlichen Ergebnisse stammen von:

```text
Physics Engine
```

---

## 2.2 Agent modifiziert PhysicsScene nicht direkt

Richtig:

```text
Agent
↓
Physics Tool
↓
Tool Guard
↓
Scene Command
↓
PhysicsScene Runtime
↓
Physics Event
```

Verboten:

```text
Agent
↓
scene.xxx = value
```

---

## 2.3 Agent Context kann PhysicsScene nicht ersetzen

Im Context dürfen nur folgende Dinge gespeichert werden:

```text
sceneId
sceneRevision
snapshotId
Für die aktuelle Aufgabe benötigten Observation Slice
```

Die echte Scene bleibt im Physics Runtime.

---

## 2.4 Trennung von Solver und Tutor

Der Solver ist zuständig für:

```text
Das Erreichen korrekter Ergebnisse
```

Der Tutor ist zuständig für:

```text
Den Schüler das korrekte Ergebnis verstehen lassen
```

Beide dürfen nicht zu einer Verantwortung vermischt werden.

---

## 2.5 Entkopplung von Harness und PhysicsOS

Harness ist der Agent-Host; PhysicsOS dockt über Tool-Plugins im Harness-Arbeitsbereich an:

```text
Harness tool runtime → dsh-tool-physicsos → @physicsos/agent-tools
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: Das ehemals als „einziger Harness-Einstiegspunkt“ fungierende Adapter-Paar `@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter` ist stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. PhysicsOS baut keinen unabhängigen Agent-Runtime auf; die tatsächliche Produktionskette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

---

# 3. Agent-Gesamtarchitektur

```text
                          PhysicsOS UI
                               │
                               ↓
                    Physics Agent Client
                               │
                               ↓
                  PhysicsAgentRuntime API
                               │
           ┌───────────────────┼───────────────────┐
           ↓                   ↓                   ↓
     Orchestrator         Context Manager       Tool Runtime
           │                   │                   │
           ├─────────────┬─────┴───────┬───────────┤
           ↓             ↓             ↓           ↓
   Question Parser  Scene Builder   Solver      Tutor
           │             │             │           │
           └─────────────┼──────┬──────┘           │
                         ↓      ↓                  │
                      Verifier Observation Planner │
                         │      │                  │
                         └──────┼──────────────────┘
                                ↓
                          Physics Runtime
                                │
                     ┌──────────┴──────────┐
                     ↓                     ↓
                Physics Engine         Math Runtime

                               ▲
                               │
                       DeepSeek Harness
                               │
       Model / Session / Loop / Tools / Prompt / Storage
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: Im Diagramm ehemals vorhandener Zweig `PhysicsAgentRuntime API → DSH Adapter → DeepSeek Harness` ist stillgelegt und gelöscht (`@physicsos/agent-runtime` / `@physicsos/agent-dsh-adapter`), siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Harness ist Agent-Host, PhysicsOS baut keinen unabhängigen Agent-Runtime auf; die tatsächliche Produktionskette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

---

# 4. Positionierung von DeepSeek Harness

PhysicsOS implementiert keine allgemeinen Harness-Fähigkeiten neu.

DeepSeek Harness ist verantwortlich für:

```text
Agent Loop
Session
Turn / Step
Model Adapter
Tool Runtime Hook
Prompt Assembly
Context Injection
Compaction Extension Point
Storage
Streaming
Cancellation
Subagent / Workflow-Infrastruktur
Trajectory / Trace-Grundlagen
```

PhysicsOS ist verantwortlich für:

```text
Physics Domain
Physics Workflow
Physics State Machine
Physics Tools
Physics Skills
Physics Context Policy
Learning Memory
Scene Reference
Physics Verifier
Tutor Policy
```

---

# 5. Warum nicht den Harness-Geschäftskern forken

PhysicsOS verwendet nicht:

```text
Fork DeepSeek Harness
↓
Agent Loop direkt modifizieren
↓
Physics-Geschäft in Harness-Kernel schreiben
```

Sondern:

```text
DeepSeek Harness Upstream
        │
        ↓
Pinned Version
        │
        ↓
Physics Profile
```

> **Stillgelegt (ADR-0002, 2026-09-27)**: In der Kette ehemals vorhandene `DSH Adapter` / `PhysicsOS Agent Runtime` zwei Schichten (entsprechend `@physicsos/agent-dsh-adapter` / `@physicsos/agent-runtime`) sind stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Harness ist Agent-Host; PhysicsOS baut keinen unabhängigen Agent-Runtime auf. Die tatsächliche Produktionskette ist Harness-Tool-Runtime → `dsh-tool-physicsos` → `@physicsos/agent-tools` → Physik-Engine / Verifier.

Gründe:

```text
Kosten für upstream breaking changes senken
Vermeiden, dass das Geschäft an Harness-interne APIs gebunden wird
Zukünftigen Austausch des Agent Runtime erleichtern
Tests erleichtern
Gemeinsame Nutzung von Web / Desktop / Local Runtime erleichtern
```

---

# 6. Harness Adapter-Grenze

> **Stillgelegt (ADR-0002, 2026-09-27)**: Ehemals als „einziges in PhysicsOS Agent/Domain erlaubt, direkt von Harness abhängiges Paket“ fungierende `packages/agent-dsh-adapter` (`@physicsos/agent-dsh-adapter`) und `packages/agent-runtime` (`@physicsos/agent-runtime`) sind stillgelegt und gelöscht, siehe `docs/adr/0002-agent-runtime-adapter-disposition.md`. Die Grenzregeln werden nun von Tool-Plugins im Harness-Arbeitsbereich übernommen: `dsh-tool-physicsos` verwendet die öffentliche Harness-Plugin-API (`defineTool`), alle übrigen PhysicsOS-Module importieren Harness nicht.

Andere Module:

```text
physics-core
agent-tools
question-parser
physics-scene
```