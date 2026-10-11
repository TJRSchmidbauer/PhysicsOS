# Circuit Runtime Pack V1 — Gleichstrom-Schaltungen mit dynamischen Eigenschaften (dritte systemweite Abnahmekette)

> Datei: `docs/reports/CIRCUIT-RUNTIME-PACK-V1-REPORT.md`
> Abnahmedatum: 2026-08-26
> Vorgänger: `EXPERIMENT_LIBRARY_HOME_V1_COMPLETE` (siehe `MILESTONES.md`)
> Meilenstein: `CIRCUIT_RUNTIME_PACK_V1_COMPLETE`
> Entsprechende Roadmap: Phase 13 — Circuit Engine (§16) und die dritte systemweite Abnahmekette „Dynamischer Schaltkreis“ (§47)

## 1. Ziel und Umfang

Entsprechend der Roadmap-Reihenfolge wird die nächste Physikdomäne vorangetrieben: **Circuit – dynamische Schaltungen**. Die von Phase 13 deklarierten Fähigkeiten
(CircuitGraph / Series / Parallel / Mixed / Switch / Variable Resistor /
Meter / Internal Resistance) werden in dieser Runde vollständig umgesetzt.

Dies ist die erste Domäne **ohne räumliches Koordinatensystem**: Der Canvas ist keine metrische Welt mehr, sondern ein abstraktes Schaltplan-Raster.
Das bestehende Gerüst PhysicsScene → Engine → Verifier → WorkspaceRuntime → Renderer
bleibt unverändert, neu hinzu kommen das Darstellungsparadigma „Schaltplan“ und das Wiedergabeparadigma „quasistatischer Durchlauf“.

Golden First: Die Golden Cases von `engine-circuit` (Reihe/Parallel/Gemischt/Unterbrechung/EMK-Messung)
existieren vor der UI, und jeder Messwert der UI lässt sich auf einen von der Engine behaupteten Arbeitspunkt zurückführen.

## 2. Domain Core (Commit `f7193b9`)

### 2.1 Szenen-Contract (physics-scene)

- `circuit/circuit-scene.ts`: Netlist-artige Fabrik `createCircuitScene` –
  jedes Bauteil deklariert pro Anschluss den zugehörigen elektrischen Knoten (Net), die Topologie wird aus den Net-Namen rekonstruiert (Anschlüsse desselben Nets
  werden paarweise verkettet, Union-Find kann exakt zurückrechnen); `circuit.metadata.layout` speichert das
  **ausschließlich der Darstellung dienende** Schaltplan-Layout (Gitterkoordinaten der Bauteile + Rotation 0/90/180/270 +
  Wegpunkte der Leitungen), die Engine liest nur die Netlist, nicht das Layout.
- Einzige Quelle der Symbolgeometrie-Konvention: `CIRCUIT_SYMBOL_HALF_LENGTH = 0.75` (Symbollänge 1,5
  Rastereinheiten), Vorlagen-Leitungsführung und Renderer teilen sie, die Endpunkte passen daher immer zusammen.
- **Zeitachsen-Semantik**: Ein Gleichstromkreis hat von sich aus keine zeitliche Entwicklung. Bei Schiebewiderstand ist die Zeitachse das
  quasistatische Schleifer-Durchlauffenster `CIRCUIT_SWEEP_DURATION_SECONDS = 8` Sekunden;
  ohne Schiebewiderstand hat die Zeitachse die Länge 0 (statische Anzeige, keine gefälschte Animation).
- `circuit/circuit-templates.ts`: Fünf Experimentvorlagen-Fabriken
  `createSeriesCircuitScene` / `createParallelCircuitScene` /
  `createMixedCircuitScene` / `createRheostatCircuitScene` /
  `createEmfMeasurementScene`, alle mit von Hand angeordnetem rechteckigem Kreislayout + expliziten Eck-Wegpunkten.
- `scene-validation.ts`: Strukturprüfung der Schaltung (Anschlussreferenzen, Vollständigkeit der Verbindungen).

### 2.2 Erweiterung des eingefrorenen Befehlssatzes (Contract Change)

Der eingefrorene Satz der SceneCommands in `scene-runtime.ts` erhält fünf neue Schaltungsbefehle mit derselben Semantik
wie in den anderen Domänen (Payload validieren → Revision +1 → auditierbar):

```ts
SetComponentResistance   { circuitId, componentId, resistance }   // Wert des Festwiderstands / Gesamtwiderstand des Schiebewiderstands
SetSourceVoltage         { circuitId, componentId, voltage }      // EMK
SetSourceInternalResistance { circuitId, componentId, internalResistance }
SetSwitchState           { circuitId, componentId, state: 'open' | 'closed' }
SetSliderPosition        { circuitId, componentId, position: 0..1 }
```

Die gesperrte Liste in `docs/03 §69` setzt die bestehende Konvention fort, die Entwicklung über Lieferberichte festzuhalten
(Mechanik- / Elektrik-Befehle siehe die entsprechenden Berichte). `PhysicsScene.circuits[]` und der
Circuit-Bauteil-Contract (docs/03 §50–63, Invariante §177) sind bestehende, eingefrorene Definitionen; in dieser Runde gibt es
**keine Schemaänderung**, sie werden erstmals eingesetzt.

### 2.3 MNA-Gleichstrom-Engine (engine-circuit)

- `circuit-model.ts`: Auflösung Szene → elektrisches Modell. Das ideale Voltmeter wird zu einem hochohmigen Zweig mit
  `IDEAL_VOLTMETER_RESISTANCE`, der eingeschaltete Widerstand des Schiebewiderstands hat die Untergrenze
  `MIN_SLIDER_RESISTANCE` (Schieben auf 0 erzeugt keine numerische Singularität).
- `mna-solver.ts`: Modifizierte Knotenanalyse. Unbekannte = Potenziale der Nicht-Masse-Knoten + der Strom jedes Quellzweigs
  (ideale EMK / geschlossener Schalter / ideales Amperemeter); **jede zusammenhängende Insel wählt ihre eigene Masse**,
  nach dem Öffnen eines Schalters bleibt kein Teilnetz ohne Referenz schweben; Gauß-Elimination mit partieller Pivotierung, ein singuläres System
  wirft ausdrücklich `CIRCUIT_SOLVER_SINGULAR` (z. B. ideale Quelle an demselben Knoten angeschlossen).
  Die Lösung trägt `kclResidual`, `totalSourcePower`, `totalDissipatedPower`.
- `circuit-engine.ts`: Strukturgleich mit magnetic / mechanics / electric:
  `PhysicsEngine<PhysicsScene, PhysicsEventLike>`; `canHandle` ist **gegenseitig ausschließend** zu den übrigen Engines
  – akzeptiert werden nur reine Schaltungsszenen (genau ein circuit, keine particles/bodies/
  fields/regions), und derzeit beschränkt auf eine einzelne Quelle, Kondensatoren/Induktivitäten und andere reaktive Bauteile werden abgelehnt
  (ausdrückliche failedConditions, keine stille Degradierung).
- **Quasistatischer Durchlauf**: `stateAt(t)` bildet t auf die Schleiferposition ab (linear von der gespeicherten Position bis
  100 % durchlaufen) und **löst** den Gleichstrom-Arbeitspunkt an dieser Position **neu**, die Diagramme sind daher echte Kurven U/I/P über den Durchlauf;
  bei statischen Schaltungen entnimmt `simulate` nur eine Stichprobe.
- Abgeleitete Größen: `emf` / `main_current` / `terminal_voltage` / `total_power` /
  `external_power` / `internal_power` / `external_resistance` /
  `slider_resistance:<id>`, alle mit Formel.
- Fünf Arten von Prüfungen: `scene_valid`, `kcl_current_conservation` (KCL-Residuum < Toleranz),
  `power_balance` (P_Quelle = ΣP_verbraucht), `terminal_voltage_law:<sourceId>`
  (U = E − I·r), `ideal_meters_non_intrusive` (ideale Messgeräte verändern den Arbeitspunkt nicht).

### 2.4 Golden Cases (Verhalten vor der Implementierung festgelegt)

`circuit-engine.test.ts` + `mna-solver.test.ts` mit insgesamt 24 Punkten:
Reihenschaltung I = E/(R₁+R₂) und das Voltmeter liest I·R₂; Parallelschaltung teilt nach Leitwert; Gemischte Schaltung R₁ + R₂∥R₃;
offener Schalter: nirgends Strom und die Klemmenspannung kehrt auf die EMK zurück; EMK-Messung erfüllt an beiden Durchlaufendpunkten
U = E − I·r; Schiebewiderstand-Durchlauf: `stateAt` löst entlang des Schleifers neu; P_gesamt = P_außen + P_innen;
Ablehnungsmatrix von `canHandle` (keine Schaltung / zwei Quellen / Kondensator / Kurzschluss singulär);
nicht passende Anfrage-Revision und negative Zeit werden ausdrücklich abgelehnt; linearer Schleiferdurchlauf und Untergrenze des eingeschalteten Widerstands.

## 3. UI Runtime Pack (Commits `e00f8d3` + `2ac24f5`)

### 3.1 Experimentbibliothek: von 16 auf 21 Vorlagen, neue Kategorie „Schaltung“

- Fünf Vorlagen: **Reihenschaltung / Parallelschaltung / Gemischte Schaltung / Strom per Schiebewiderstand regeln /
  Messung von EMK und Innenwiderstand der Quelle**; jedes `createScene()` ruft die echte Scene Factory auf
  (`stampId` eindeutige sceneId), jeweils mit eigenem handgezeichnetem Kartenbild und Symbol-Icon.
- Die Fachfarbe erhält `--physics-subject-circuit: #0d9488` (+tint), Kategorie-Tabs,
  Farbpunkte, Kartenhintergründe und Domänen-Chips nutzen alle dieselbe Variablengruppe.

### 3.2 CircuitWorkspaceRuntime (derselbe WorkspaceRuntime-Contract)

- Hält SceneRuntime + CircuitEngine und gibt Frames in der gemeinsamen Form `WorkspaceSnapshot` aus
  – die Schaltungsdomäne wird von derselben Hülle `PhysicsWorkspace` und demselben `PhysicsCanvas` gerendert,
  es gibt keine zweite Hülle.
- **Parameterbearbeitung = echtes SceneCommand**: E / r / R / Schleiferposition / Schalter im Inspector
  laufen alle über die eingefrorenen Befehle aus §2.2 (Revision +1, auditierbar), es gibt keine lokalen Komponentenzustände,
  die Zahlen ändern. Eine Parameteränderung macht die alte Durchlaufposition physikalisch ungültig → die Zeit wird auf null zurückgesetzt.
- **Wiedergabe = quasistatischer Durchlauf**: Das Durchlauffenster wird in echten Sekunden getaktet und schreitet mit Wall Time 1:1 voran
  (das mikroskopische Darstellungsfenster-Pacing der Teilchendomäne ist nicht nötig); jeder Frame ist eine neue MNA-Lösung der Schleiferposition.
  Bei statischen Schaltungen ist die Zeitachse 0 lang, der Ausführen-Button kann keine Animation fälschen.
- Die Semantik des Experimentzweigs Question → Lab ist wie in den anderen Domänen: Das Ändern physikalischer Fakten forkt zuerst
  (`requiresExperimentalFork`), Abspielen/seek/Umschalten von Observables forkt nicht,
  `restoreOrigin` verwirft den Zweig und kehrt zur Aufgabenszene zurück.
- Diagramme I-t / U-t / P-t (nur Durchlauf-Szenen), Datentabelle t/I/U/P mit ≤ 13 Stichprobenzeilen,
  `sampleReadout` per Hover auf der Zeitachse, abgeleitete Größen lesen den State des **aktuellen Frames**.

### 3.3 Schaltplan-Rendering (circuit-visual-bridge + circuit-renderer)

- Die Bridge projiziert den verifizierten Arbeitspunkt auf das Layout: Platzierung/Rotation der Symbole, orthogonale L-förmige Leitungsführung +
  Wegpunkte, Punkte an gemeinsamen Anschlussknoten, Stromrichtungspfeile
  (`data-testid="current-*"`), Messwerttexte. **Die Bridge löst keine Schaltung** – jede Zahl stammt aus dem Arbeitspunkt der Engine.
- Der Renderer zeichnet SVG-Symbole echt: Quelle (lange/kurze Platte), Festwiderstand/Schiebewiderstand
  (mit Schleiferpfeil `data-testid="slider-*"`), Schalter (`data-closed` öffnet/schließt
  mit dem Zustand), Amperemeter/Voltmeter (Kreis mit Buchstabe + Echtzeit-Messwert).
- Messwert-Formatierung `fmtQuantityValue`: |I| < 1e-9 A wird als `0` angezeigt –
  bei offenem Kreis ist das Residuum der Gauß-Elimination ~1e-16 A numerisches Rauschen; eine Anzeige in Exponentialform würde eine
  Lösungsgenauigkeit vortäuschen (Prinzip der ehrlichen Darstellung).
- `scene-visual-model.ts` erhält neue Circuit-Visual-Typen
  (`CircuitComponentVisual` / `CircuitWireVisual` / `CircuitJunctionVisual` /
  `CircuitSymbolKind`); `domain-of-scene.ts` erkennt die Schaltungsdomäne mit `isCircuitScene`;
  `renderer-registry.tsx` registriert den Renderer `circuit`.

### 3.4 Gates bereinigt (`2ac24f5`)

Einengung generischer Befehle (`command<T extends SceneCommandType>`), Bereinigung von oxlint-Verstößen,
Entfernen der Non-Null-Assertion in `time-format.ts`. typecheck / lint für core+web auf null.

## 4. Browser-Abnahme (tests/acceptance/circuit-acceptance.mjs)

CASE A–F + Responsiv + Browser-Gates, alle PASS:

- **A** In der Experimentbibliothek erscheint die Kategorie „Schaltung“: Gesamtzahl der Vorlagen ≥ 21, der Tab „Schaltung“ listet 5 Experimente.
- **B** Reihenschaltung: Der Schaltplan wird echt gezeichnet (Leitungen ≥ 5, Knoten ≥ 2, Symbolstriche ≥ 10,
  Knoten mit Strich > 20), das Amperemeter liest den Engine-Strom 0,2 A, das Voltmeter liest U₂ = 4 V
  (6 V über 10+20 Ω), Strompfeile ≥ 3, KCL- und Leistungserhaltungsprüfung passed,
  Canvas ≥ 55 % ohne Seitenscroll.
- **C** EMK ändern 12 V → Revision +1, das Amperemeter folgt nach dem Ohmschen Gesetz auf 0,4 A,
  Zurücksetzen auf 6 V stellt 0,2 A wieder her, durchgehend verified.
- **D** Schalter öffnen: Symbol öffnet (`data-closed="false"`), Messwert 0 A, Strompfeile
  verschwinden, der offene Kreis bleibt verifizierte Physik; Schließen stellt 0,2 A wieder her.
- **E** Schiebewiderstand: Startpunkt 0,6 A (Schleifer 0 → nur der 10-Ω-Schutzwiderstand bleibt), die Zeitachse
  umfasst ein 8-Sekunden-Durchlauffenster, nach 2 Sekunden Ausführen rückt der Zeiger proportional vor, an das Ende gezogen 0,2 A, U₀ = 2 V
  (6 V/(10+20) Ω), die Diagrammseite veröffentlicht die drei Kurven I-t / U-t / P-t.
- **F** Messung von EMK und Innenwiderstand: E = 4,5 V, r = 0,5 Ω, Last 2 Ω → I = 1,8 A,
  Klemmenspannung 3,6 V, die Prüfung `Klemmenspannung U = E − I·r` passed; bei geöffnetem Schalter liest das Voltmeter
  direkt die EMK 4,5 V.
- **Responsiv** 1440×900 / 1920×1080: Canvas ≥ 55 %, kein Scrollen, Canvas wird nicht vergrößert.
- **Gates**: console errors / page errors / unhandled rejections /
  failed requests / error responses alle 0.

Sieben Screenshots: `circuit-library`, `circuit-series-lab` (1440/1600/1920),
`circuit-series-open`, `circuit-rheostat-lab`, `circuit-emf-lab`.

## 5. Regression der alten Suiten (alle sieben PASS)

Die sieben Acceptance-Suiten mechanics / electric / electric-v2 / electric-region / composite /
learning / library-home sind alle PASS, die Gates alle 0.

Die einzige Anpassung: Die Prüfung „vier Domänen-Farbpunkte paarweise verschieden“ in `library-home-acceptance.mjs` wurde mit der Kategorie „Schaltung“
auf **fünf** paarweise verschiedene Farbpunkte aktualisiert (Grün/Blau/Violett/Türkis/Orange) –
das ist Produktentwicklung und keine Regression, von gleicher Art wie die Aktualisierung der Prüfung „Schnellstart“ in Composite V1.
Die für die Regression neu aufgenommenen Screenshots (die Seiten der Experimentbibliothek zeigen nun den Tab „Schaltung“ und die fünfte Farbe) wurden mit zurückgeschrieben.

## 6. Overlay und Engineering-Abschluss

- `harness-overlay.mjs capture` wurde zurückgeschrieben; `upstream-changes.patch` ergänzt im vendor-Lockfile die beiden
  Workspace-Links `@physicsos/engine-circuit`, `@physicsos/physics-units` (nach dem Hinzufügen der Abhängigkeit zu ui-physicsos in `e00f8d3` war dieser capture vergessen worden).
- Das Debug-Probe-Skript `probe-circuit-tab.mjs` (temporäre Teilmenge von CASE A) wurde gelöscht und nicht ins Repository aufgenommen.

## 7. Abnahmedaten

- `typecheck:core` / `typecheck:web` ohne Fehler; `lint:core` / `lint:web` ohne Verstöße.
- `test:core` alles grün: 20 Packages, 655 Punkte (neu: engine-circuit 24,
  physics-scene 50 einschließlich Contract-Tests zu circuit-scene-runtime).
- `test:web` alles grün: 19 Dateien, 235 Punkte (neu `circuit.client.spec.tsx` mit 10 Punkten:
  Domänen-Routing, Lehrbuchlösung der Reihenschaltung, Schalter-Unterbrechungsbefehl, Schiebewiderstand-Durchlauf, EMK-Direktablesung, Neulösen nach Befehl,
  Schaltplan-Einhängen, Revisions-Audit der EMK-Bearbeitung, Schalterkopplung, Schiebewiderstand-Zeitachse + drei Diagramme).
- `build:web` (Bundle) besteht.
- Browser-Abnahme: `circuit-acceptance.mjs` alles PASS + Regression der sieben alten Acceptance-Suiten
  alles PASS, Gate-Zähler alle 0.

## 8. Nicht Teil (ausdrückliche Grenzen)

- **Wechselstrom / Transienten** (RC/RL-Auf- und Entladung, Kondensatoren, Induktivitäten): `canHandle` lehnt
  reaktive Bauteile ausdrücklich ab, ohne stille Näherung.
- **Netze mit mehreren Quellen**: MNA unterstützt sie selbst, aber dynamische Schaltungen der Oberstufe drehen sich um eine einzelne Quelle, `canHandle`
  sperrt derzeit auf eine einzelne Quelle; wird bei Bedarf von Induction (Phase 14) freigeschaltet.
- **Schaltungsaufgaben im Question Space** (deterministischer Parser + Golden Questions + Aufgabe →
  Lab) und **Agent-Lehrintentionen für Schaltungen**: gehören in den nächsten Slice, in dieser Runde geht das Labor voran.
- **Freies Aufbauen von Schaltungen** (Topologie per Drag-and-Drop-Verdrahtung): Vorlagenschaltungen + Interaktion mit Parameter/Schalter/Schleifer
  decken den Abnahmeumfang von Phase 13 ab; ein Editor ist eine eigenständige Produktfähigkeit.
- **Elektromagnetische Induktion an Schienen** (die vierte Abnahmekette von Phase 14): hängt von dieser Runde Circuit ab, nächste Phase.

## 9. Risiken und bekannte Probleme

- Keine blockierenden Probleme. Das bestehende Umgebungsproblem, dass das lefthook-postinstall an der pnpm-Abhängigkeitsprüfung hängt, besteht weiterhin,
  bei der Verifikation wird es umgangen (direkt vitest / die Gate-Skripte ausführen), das Artefakt ist nicht betroffen.
- Das ideale Voltmeter wird als hochohmiger Zweig modelliert (numerischer Pfad mit asymmetrischer Elimination), beim offenen Kreis wird die Anzeige über die
  Schwelle `NO_CURRENT_AMPS` auf null gebracht; die Prüfung `ideal_meters_non_intrusive` hält die physikalische Tatsache fest,
  dass „ideale Messgeräte den Arbeitspunkt nicht verändern“.
