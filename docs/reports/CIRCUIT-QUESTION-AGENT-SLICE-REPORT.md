# Bericht zum Slice Schaltungs-Question-Space und Agent-Schaltungsintentionen

> Datum: 2026-09-08
> Status: `CIRCUIT_QUESTION_AGENT_SLICE_COMPLETE` (abgeschlossen)
> Umfang: Der im Bericht `CIRCUIT_RUNTIME_PACK_V1` in der „Nicht-Ziele“-Liste genannte nächste Slice – Überprüfung der gesamten Kette der Schaltungsaufgaben im Question Space + Ergänzung der Agent-Schaltungsintentionen.
> Schaltungs-Engine / Szene / Vorlagen / Visualisierung / Labor (MNA-Gleichstrom-Engine, 21→38 Vorlagen, Schaltplan-Canvas) wurden bereits in `CIRCUIT_RUNTIME_PACK_V1_COMPLETE` abgenommen und werden in dieser Runde nicht wiederholt.

---

## 1. Ziel und Prüfung des Ist-Zustands

Beim Abschluss von `CIRCUIT_RUNTIME_PACK_V1` wurde ausdrücklich festgehalten: „Nicht Teil: Schaltungsaufgaben im Question Space und Agent-Schaltungsintentionen (nächster Slice)“. Vor Beginn dieses Slices wurde zunächst der Stand der Aufgaben-Pipeline geprüft:

- **Schaltungsaufgaben im Question Space sind bereits vorhanden**: `deterministic-circuit-parser` (Schaltungssignale via `isCircuitQuestionText` + Extraktion von EMK/Innenwiderstand/Widerstand/Strom/Spannung/Leistung + Topologieerkennung Reihen-/Parallel-/Gemischt-/Schiebewiderstand), `circuit-scene-builder` (IR → Szene `physics-scene/1.0`), Schaltungs-Dispatch in `question-runtime` (vor der Elektrik-Erkennung), `engine-selector` routet zu `CircuitEngine`, `golden-questions` mit 6 Golden-Aufgaben (Strom in Reihenschaltung / Gesamtwiderstand der Parallelschaltung / Strom mit Schiebewiderstand / Gesamtleistung und Außenleistung / Strom und Klemmenspannung / Aufgabe zum Innenwiderstand), QuestionWorkspace rendert über `resolveCircuitOperatingPoint` + `circuitSceneVisualAt` einen verifizierbaren Schaltplan – abgedeckt durch alle 402 Testfälle von question-core in grün.
- **Lücke auf Agent-Seite bestätigt**: `physics-agent-answers.ts` hat für `domain === 'circuit'` keinerlei Intention; der KI-Assistent im Labor kann bei Schaltungsframes nur „kann ich nicht beantworten“ sagen. Dieser Slice ergänzt die Agent-Schaltungsintentionen.

## 2. Liefergegenstände

| Pfad                                                       | Inhalt                                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `ui-physicsos/src/client/physics/physics-agent-answers.ts` | 8 Schaltungsintentionen + 4 Hilfsfunktionen + Schaltungsregel in `matchIntent` (nach der Regel für zusammengesetzte Felder, vor der Mechanikregel; Domänen-Gate verhindert Übergriffe) |
| `ui-physicsos/tests/physics-agent.client.spec.tsx`         | +10 Testfälle zu Schaltungsintentionen (Faktenveröffentlichung / Topologie-Dispatch / Verweis auf benannte Prüfungen / Routing / Hervorhebung auflösbar / Domänenisolation) |

Die Hervorhebungs-Beschriftungstabelle (`HIGHLIGHT_LABELS`) enthält die vorhandenen Schaltungseinträge (bat / am / vm / sw / rv / r0-r3) bereits, in dieser Runde unverändert; `CircuitAgentFacts` (Innenwiderstand / Schiebewiderstand / Knotenzahl) und `physicsAgentContext` kamen bereits mit `CIRCUIT_RUNTIME_PACK_V1`, in dieser Runde werden sie nur konsumiert.

## 3. Entwurf der Intentionen

Alle acht Intentionen halten sich daran, dass „die Antwort nur Fakten wiedergibt, die die Runtime bereits erzeugt hat“:

| Intention                                              | Gate              | Zitierte Runtime-Fakten                                                     |
| ------------------------------------------------------ | ----------------- | --------------------------------------------------------------------------- |
| `circuit-ohm-current` (Woher kommt dieser Strom?)      | domain=circuit    | Abgeleitete Größe „Hauptstrom I“ + Prüfung `kcl_current_conservation`, Formel I = E/(R_außen + r) |
| `circuit-terminal-voltage` (Warum ist die Klemmenspannung kleiner als die EMK?) | domain=circuit | Abgeleitete Größe „Klemmenspannung U“ + Prüfung `terminal_voltage_law:<id>` (U = E − I·r) |
| `circuit-internal-resistance` (Wozu dient der Innenwiderstand?) | r > 0     | Abgeleitete Größe „Verlustleistung am Innenwiderstand“ + Prüfung zum Klemmenspannungsgesetz, P_innen = I²·r |
| `circuit-series-loop` (Der Strom ist in Reihenschaltung überall gleich) | junctionCount = 0 | Abgeleitete Größe „Hauptstrom I“ + KCL-Prüfung               |
| `circuit-parallel-split` (Wie teilt sich der Strom am Knoten?) | junctionCount > 0 | Abgeleitete Größe „Hauptstrom I“ + KCL-Prüfung, I_Zweig = U/R_Zweig, umgekehrt proportionale Stromteilung |
| `circuit-rheostat-sweep` (Wie ändert sich der Strom beim Verschieben des Schleifers?) | hasSlider | Abgeleitete Größen „eingeschalteter Widerstand R_Schieber“ und „Hauptstrom I“, R_Schieber = p·R_gesamt |
| `circuit-power-balance` (Wohin geht die Leistung der Quelle?) | domain=circuit | Prüfung `power_balance` + drei abgeleitete Größen Gesamt-/Ausgangs-/Innenwiderstandsleistung, P_gesamt = P_außen + P_innen |
| `circuit-meters-ideal` (Warum beeinflussen ideale Messgeräte die Schaltung nicht?) | Canvas hat am/vm-Symbol | Prüfung `ideal_meters_non_intrusive`                       |

Entwurfspunkte:

1. **Der Topologie-Dispatch liest `CircuitAgentFacts`, rät nicht anhand des Titels.** `junctionCount` (Parallelknoten) / `hasSlider` (Schiebewiderstand-Symbol) / `internalResistance` (Innenwiderstand der Quelle) stammen alle aus Inspector und Canvas-Projektion – ein Reihenschaltungs-Frame behauptet nie eine Knotenverzweigung, ein Frame mit r = 0 beantwortet nie „Wozu dient der Innenwiderstand“.
2. **Prüfungen werden nach Präfix zugeordnet.** `terminal_voltage_law` ist je Quelle eine Prüfung `terminal_voltage_law:<componentId>`; der Agent findet mit `startsWith` dieses „Urteil der Runtime“, statt U = E − I·r selbst nachzurechnen.
3. **Hervorhebungsziele werden dynamisch vom Canvas bezogen.** `circuitComponentTarget` bevorzugt die im aktuellen Frame tatsächlich gezeichnete Quellen-ID (bat), dann einen Widerstand, dann irgendein Bauteil – die Hervorhebung zeigt nie auf etwas Nicht-Existentes; `resolveHighlightTarget` liefert für nicht gezeichnete IDs eine leere Menge, die Tool-Schicht meldet wahrheitsgemäß „Der Canvas zeigt derzeit nicht …“.
4. **Das Domänen-Gate verhindert Übergriffe.** Die Schaltungsregel steht in `matchIntent` nach der Regel für zusammengesetzte Felder und vor den Mechanik-/Elektrikregeln, aber das `available` jeder Intention wird auf `domain === 'circuit'` begrenzt – die Aufgabe zur elektromagnetischen Induktion „Induktionsstrom berechnen“ oder eine Punktladungsaufgabe „Strom“ werden nicht von Schaltungsintentionen abgefangen (per Test belegt).

## 4. Abnahmedaten

- `pnpm typecheck:web` ohne Fehler.
- `pnpm lint:web` (oxlint) ohne Fehler.
- `pnpm test:web`: 30 Dateien, **376 Testfälle, alle grün**. `physics-agent.client.spec.tsx` mit 62 Testfällen (zuvor 52, +10 Schaltung); abgedeckt sind: Veröffentlichung von Fakten und drawnIds der vier Schaltungsvorlagen, Topologie-Dispatch nach facts, Verweis von `circuit-ohm-current`/`circuit-terminal-voltage` auf benannte Prüfungen und abgeleitete Größen, das r-> 0-Gate der Innenwiderstandsintention (ein Frame mit r = 0 wird sowohl per ID als auch per Schlüsselwort abgewiesen), Routing von sechs Schülerfragen auf die richtige Intention, alle Hervorhebungsziele der verfügbaren Intentionen über vier Frames lassen sich auf tatsächlich gezeichnete Symbole auflösen, Schaltungshervorhebung ist reine Ansicht (Revision unverändert), Mechanik-/Elektrik-Frames bieten überhaupt keine Schaltungsintentionen an.
- `pnpm test:core`: alles grün (question-core 402, einschließlich der kompletten Kette der Schaltungs-Golden-Aufgaben; Engine/Szene/Prüfungen unverändert).
- Das Agent-Ende-zu-Ende-`headless-physics-acceptance` und die übrigen Acceptance-Tests sind nicht betroffen (in dieser Runde wurden Engine, Tool-Runtime und Aufgabenbank nicht angefasst).

## 5. Ausdrücklich nicht Teil / Grenzen

- **Die Schaltungsaufgaben selbst im Question Space**: Parser / Szenenaufbau / Runtime / 6 Golden-Aufgaben wurden zuvor geliefert und getestet, in dieser Runde nur geprüft und nicht geändert.
- **Modellbasierte Agent-Antworten**: `AGENT_MODEL_BACKED_ANSWERS_BACKLOG` unverändert – beim Anbinden eines echten Modells wird weiterhin nur `matchIntent` ersetzt, der Verweisvertrag dieser Intentionen (abgeleitete Größen + benannte Prüfungen + highlight-Tool-Aufruf) bleibt unverändert erhalten.
- **Schaltungs-Engine / Prüfungen / Erweiterung der Vorlagen**: Wechselstrom-Transienten, Kondensatoren/Induktivitäten und mehrere Quellen werden gemäß der Grenze von `CIRCUIT_RUNTIME_PACK_V1` weiterhin durch `canHandle` abgelehnt.
- Nicht angefasst: alle Packages unter `packages/`, `apps/web`, die Upstream-Historie des Harness.
