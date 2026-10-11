# PhysicsOS Phase 4 — Bericht zur Runtime für begrenzte elektrische Felder / Plattenkondensator-Felder

> Meilenstein: `ELECTRIC_BOUNDARY_RUNTIME_COMPLETE` → `PHYSICSOS_PHASE4_COMPLETE`
> Datum: 2026-08-23
> Datei: `docs/reports/ELECTRIC-BOUNDARY-RUNTIME-REPORT.md`

---

## 1. Gelieferte Fähigkeiten

Der Kernprüfungsstoff des elektrischen Feldes in der Oberstufenphysik – **die Ablenkung geladener Teilchen im Plattenkondensator** – fehlte bisher vollständig.
V1/V2/Phase 3 deckten das unbegrenzte homogene elektrische Feld und das elektrostatische Feld von Punktladungen ab; beiden fehlte der Begriff
„das Feld existiert nur innerhalb eines Bereichs“, und damit auch die diskreten Ereignisse Eintritt in den Feldbereich, Austritt aus dem Feldbereich und Aufprall auf die Platte.

Diese Phase vervollständigt einen vollständigen vertikalen Slice:

| Schicht  | Liefergegenstand                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| Scene    | `createParallelPlateScene` — 1 Teilchen + 1 Region mit gebundenem homogenem Feld + 1 rechteckiger Feldbereich + 2 Plattenränder |
| IR       | Modell `charged_particle_bounded_electric_field` + Felder `plateSeparation` / `plateLength` / `enterPosition`   |
| Engine   | `@physicsos/engine-electric-region` — abschnittsweise analytisch (außerhalb des Felds a=0, innerhalb a=qE/m) + drei Arten diskreter Ereignisse + 14 abgeleitete Größen + 5 Prüfungen |
| Parser   | `parseParallelPlate` + 10 Golden Questions (electric-10 ~ electric-19)                                          |
| Runtime  | Plattenkondensator-Zweig + Abbildung `SimulationResult.events` → `TimelineEvent` + plattenspezifischer tree/inspector/editParameter |
| Renderer | `ElectricRegionRenderer` — metallisch wirkende Platten + per clipPath beschnittenes begrenztes Feldraster + Trajektorie + Vektoren |
| Agent    | 10 Lehrintentionen zum begrenzten Feld, die alle von der Engine behauptete Prüfungen und abgeleitete Größen zitieren |

Der Schlüsselpunkt der physikalischen Korrektheit: **Das Feld existiert nur im rechteckigen Bereich zwischen den Platten**. Außerhalb des Felds bewegt sich das Teilchen
gleichförmig geradlinig (a = 0, F = 0), nach dem Eintritt in den Feldbereich führt es eine Bewegung wie beim waagerechten Wurf aus (a = qE/m konstant), nach dem Austritt wird die gleichförmige geradlinige Bewegung wieder aufgenommen,
oder es prallt auf die Platte und bleibt stehen, wenn die Ablenkung d/2 erreicht. Es wird nicht einfach ein Stück des unbegrenzten Feldes ausgeschnitten und gezeichnet – die Engine löst jede
Phase einzeln, E, F, a außerhalb des Bereichs sind streng null.

---

## 2. Einhaltung der Architektur

Es folgt der Kette aus `docs/15-RUNTIME-ARCHITECTURE.md`, eine zweite Runtime wurde nicht hinzugefügt:

```
Question → IR → Scene → PhysicsEngine → Verifier → Observation → Visual Bridge → UI → Agent
```

Die neue Engine implementiert dieselbe Schnittstelle `PhysicsEngine<PhysicsScene, PhysicsEventLike>`, strukturgleich mit
`engine-magnetic` / `engine-mechanics`. Sie schließt sich mit der bestehenden `engine-electric` über `canHandle`
**gegenseitig aus**:

- `engine-electric-region` akzeptiert nur Szenen mit `regions.length > 0` und `fields[].regionId`,
  das auf einen gültigen rechteckigen Bereich zeigt
- `engine-electric` lehnt ausdrücklich jede Szene mit `regions` / `boundaries` ab

Es gibt daher keinen Fall, in dem zwei Engines zugleich behaupten, dieselbe Szene bearbeiten zu können; das Routing wird in `engine-selector.ts`
anhand des IR-Modells entschieden.

Diskrete Ereignisse laufen über `PhysicsEventLike` (`physics-core/simulation.ts`, offener `type: string`),
das etwas anderes ist als das `PhysicsEvent` in `scene-runtime.ts` (von SceneCommand erzeugte Befehlsereignisse),
Letzteres wurde nicht verändert.

Der Renderer importiert keine Engine, sondern konsumiert nur das `SceneVisualModel`; Plattengeometrie, Feldrichtung und
Trajektorie werden alle von der Visual Bridge aus Szene und verifizierten Observationen erzeugt.

---

## 3. Browser-Abnahme

`apps/web/e2e/electric-region-acceptance.mjs` — 6 Cases, alle PASS:

| Case | Abnahmeinhalt                                                                        | Ergebnis |
| ---- | ------------------------------------------------------------------------------------ | -------- |
| A    | Regression Punktladung: `electric-03` weiterhin verified, Quellladung weiterhin gezeichnet, **Platten lecken nicht in den Punktladungs-Frame** | ✓ 6/6 |
| B    | Regression homogenes Feld: `electric-01` weiterhin verified, Trajektorie weiterhin gezeichnet, **unbegrenztes Feld ohne Platten und ohne Bereichsereignisse** | ✓ 6/6 |
| C    | Gesamte Kette Plattenkondensator: `electric-10` READY → Lösungsschritte → Labor verified → **zwei Platten** → Trajektorie | ✓ 9/9 |
| D    | Ereignis-Zeitachse: Anzahl der Marken ≥ 2, Klick auf eine Marke wirkt per seek auf die Uhr | ✓ 2/2 |
| E    | Agent erklärt die Ablenkung: Belege zitiert, **kein Coulomb 1/r² zitiert**, Hervorhebung trifft, **Revision unverändert** | ✓ 6/6 |
| F    | Scene Branch: Parameter ändern, Revision +1 und weiterhin verified, Aufgabenszene nicht verunreinigt | ✓ 4/4 |

Alle 5 Gates sind 0: console errors, page errors, unhandled rejections,
failed requests, error responses.

Der Regressionsschutz steckt in den Assertions selbst – Case A prüft, dass im Punktladungs-Frame `plates === 0`, Case B prüft, dass
im Frame des unbegrenzten Feldes weder Platten noch Bereichsereignisse sind. Kapert ein neuer Rendering-Zweig fälschlich alte Szenen, schlägt die Abnahme direkt fehl.

**Der Pfad Aufprall auf die Platte wurde separat verifiziert**: Case C/D laufen über `electric-10` (durchquert den Feldbereich, erzeugt
enter + exit). Der Pfad `HitPlate` wurde zusätzlich im Browser mit `electric-13` verifiziert (Zeit, bis das Elektron auf die Platte trifft):
workflow READY, verified, zwei Platten, Ereignismarken „Eintritt ins elektrische Feld 1.00e-9 Sekunden“ +
„Aufprall auf die Platte 5.77e-9 Sekunden“, **kein „Austritt aus dem elektrischen Feld“** (das Teilchen bleibt beim Aufprall stehen, physikalisch korrekt), 0 Fehler.
Screenshot `lab-plate-impact-1600x900.png`.

**Regression der alten Acceptance**: `electric-acceptance.mjs` (V1 homogenes Feld + Punktladung),
`electric-acceptance-v2.mjs` (Mehrquellen-Punktladung + Äquipotentiallinien) und `mechanics-acceptance.mjs`
alle drei ALL CHECKS PASSED, Gates 0.

---

## 4. Unit-Tests

| Umfang                                   | Anzahl      |
| ---------------------------------------- | ----------- |
| `test:core` (17 Packages)                | 445 grün    |
| `test:web` (ui-physicsos)                | 163 grün    |
| darunter `engine-electric-region`        | 16          |
| darunter `question-core` (einschließlich 10 Plattenkondensator-Aufgaben) | 146 |
| darunter region runtime / visual / agent | 23 / 8 / 52 |

`typecheck:core` und `typecheck:web` beide ohne Fehler. Bundle wurde neu gebaut.

---

## 5. Fünf echte Defekte, die die Browser-Abnahme aufgedeckt hat

608 Unit-Tests waren grün, aber sobald man den Browser öffnete, gab es einen weißen Bildschirm – diese Defekte hätte kein Unit-Test erkannt;
sie werden hier als Beleg für „nicht ausgeführt, nicht gemeldet“ festgehalten. Besonders 5.2 und 5.5 zeigen das Problem: Die zugehörigen Assertions waren damals
beide **bestanden** (DOM-Element vorhanden, aria-label stimmt mit der Implementierung überein), erst beim Betrachten der Screenshots und beim Lesen der tatsächlichen Ausgabe
fiel auf, dass die Funktion nicht nutzbar war.

### 5.1 Weißer Bildschirm im Aufgabenraum (fatal)

`useQuestionFrames` in `QuestionWorkspace.tsx` verwendet `resolveUniformElectricModel`
(alte Engine), um die Trajektorie für die Aufgaben-Vorschau zu lösen. Plattenkondensator-Szenen tragen `regions`, die alte Engine lehnt in `canHandle` ab und
wirft `EngineUnsupportedError: electric_force_only` – beim Rendern geworfen, React entlädt
den gesamten Baum, die Seite wird weiß.

Core-Runtime, Labor-Runtime und Visual Bridge routen alle drei korrekt zur neuen Engine, nur der Vorschaupfad im Aufgabenraum wurde vergessen. Behebung:
Plattenkondensator-Zweig hinzugefügt, der `electricRegionEngine.stateAtSeconds` verwendet.

### 5.2 Platten auf dem Canvas nicht sichtbar

`extentOf` hat die hartkodierten Untergrenzen `Math.max(12, …)` / `Math.max(7, …)` und einen Mindestrand von 2 Einheiten –
abgestimmt auf Szenen im Meterbereich (unbegrenztes Feld, Punktladungsfeld). Der Plattenkondensator-Aufbau ist im Zentimeterbereich (0,12 m × 0,04 m) und wurde
gewaltsam auf 17,92 × 10,08 Szeneneinheiten vergrößert, die Platten zu einem unsichtbaren Punkt gestaucht; `vectorBase` wird dadurch zu 7,
die Pfeile von E und v werden 1,3 m lang und fliegen aus dem Canvas.

Bemerkenswert ist, dass die Assertion `plates === 2` in Case C damals **bestanden** war – das DOM-Element existierte tatsächlich,
war aber optisch nicht zu sehen. Dieses „Test bestanden, aber Funktion nicht nutzbar“ lässt sich nur durch Betrachten der Screenshots entdecken.

Behebung: Für den Region-Zweig wurde eine eigenständige `regionVisualFrame` geschrieben, deren Rand sich nach dem Inhalt richtet statt nach Absolutwerten;
Tick-Schrittweite, Teilchenradius und Maßstab werden alle aus dem Frame abgeleitet (`niceStep` wählt 1/2/5×10ⁿ),
so wird von Millimeter bis Meter korrekt der Ausschnitt gewählt. Das gemeinsame `extentOf` wurde nicht geändert, Case A/B sind ohne Risiko.

### 5.3 Feldrichtung falsch gezeichnet + Plattenpolarität falsch beschriftet

`fieldDirection` stammt aus der Observation `electric_field` des aktuellen Frames. Im begrenzten Feld ist das beobachtete E streng null, wenn das Teilchen außerhalb der Platten ist,
einschließlich des Anfangsframes – die Richtung fällt dann auf den Fallback `{x:1, y:0}` zurück, die Feldlinien werden waagerecht nach rechts
gezeichnet (tatsächlich senkrecht nach unten), und die Plattenpolarität wird mit verkehrt beschriftet.

Behebung: Die Richtung wird aus der **Felddefinition der Szene** bezogen (eine konstante physikalische Tatsache des Kondensators), nicht aus der Observation eines einzelnen Augenblicks.

### 5.4 Widerspruch zwischen Inspector und Canvas-Zahlen

Die Engine berechnet `derivedQuantities` bei `endTime`, dann hat das Teilchen den Feldbereich bereits verlassen, E / F / a sind alle null.
Der Inspector liest diesen Endzustand, der Canvas den aktuellen Frame – wenn der Schüler per seek zwischen die Platten springt,
zeigt der Canvas |E| = 2000 V/m, während der Inspector rechts 0.00 zeigt.

Behebung: Der Region-Inspector liest nun `state.derived` des aktuellen Frames. Die Felder in anderen Domänen sind unbegrenzt, das Teilchen
befindet sich stets im Feld, deshalb tritt dieser Widerspruch nur beim begrenzten Feld zutage.

### 5.5 Ereigniszeit wird als „0.00 Sekunden“ gelesen

`TimelineMarkers` und die Ereignisliste formatieren beide mit `event.time.toFixed(2)`. Mechanikszenen liegen im Sekundenbereich
(Aufprall 2,02 s), das ist unproblematisch, aber ein Teilchen durchquert den Kondensator in Nanosekunden – jedes elektrische Ereignis wird auf
„0.00 Sekunden“ gerundet, und Screenreader würden einen falschen Zeitpunkt ansagen.

Die Assertion von Agent 7 prüfte, dass `aria-label` gleich `` `${event.label} ${event.time.toFixed(2)} 秒` `` ist,
und kopierte so die Formatierungslogik der Implementierung in die Assertion; der Test spiegelte also die Implementierung und konnte diesen Fehler nicht fangen.

Behebung: `eventTimeText()` wechselt unter 10 ms auf die Exponentialform (1.00e-9 Sekunden), das Verhalten im Sekundenbereich bleibt unverändert;
die Test-Assertion prüft nun, was der Schüler tatsächlich hört – ein Ereignis ungleich null darf nicht als 0.00 Sekunden gelesen werden, und der geparste Zahlenwert
muss größer als null sein.

---

## 6. Eine Designkorrektur im Lehr-Kreislauf des Agents

Bei den 10 Intentionen zum begrenzten Feld verlangten `bounded-field-enter` / `plate-deflection-direction` /
`plate-energy` ursprünglich, dass `electric-force-vector` in `drawnIds` vorkommt. Im Anfangsframe ist das Teilchen aber außerhalb der Platten,
F = 0, die Bridge überspringt Pfeile der Länge null – somit **erscheinen diese drei Fragen
nicht in den Vorschlägen**, wenn der Schüler die Szene gerade öffnet, obwohl „Warum wird es abgelenkt“ gerade die erste Frage ist, die man beim Öffnen der Szene stellen möchte.

Korrektur:

- Das Gate verlangt nun `electric-trajectory` (die Trajektorie stammt aus der gesamten Simulation und wird zu jedem Zeitpunkt gezeichnet)
- `forceHighlightTarget()` wählt das Hervorhebungsziel dynamisch: Im Feldbereich wird der Kraftvektor hervorgehoben, außerhalb fällt es auf die Trajektorie zurück –
  die Hervorhebung zeigt immer auf ein tatsächlich auf dem Canvas vorhandenes Element, es erscheint nie „Der Canvas zeigt derzeit keine elektrische Kraft“
- `outsideFieldRegion()` urteilt anhand der veröffentlichten abgeleiteten Größen (rechnet die Geometrie nicht neu); außerhalb des Feldbereichs ergänzt die Antwort einen Satz
  „Zu diesem Zeitpunkt befindet sich das Teilchen noch außerhalb der Platten … außerhalb der Platten gibt es kein Feld, daher wirkt keine Kraft“, um den Widerspruch „Warum wird es abgelenkt“ – „F = 0“ zu vermeiden

3 Tests sichern dieses Verhalten ab: Bei t=0 sind alle 10 Intentionen verfügbar, jede Hervorhebung lässt sich auflösen, die Antwort erklärt den Grund
für die Kraft null.

---

## 7. Geschlossener Backlog

`ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG` — die Startbedingung (die Engine erzeugt diskrete Ereignisse Eintritt in / Austritt aus dem Feldbereich und
Aufprall auf die Platte) ist erfüllt. Auch die damalige Prognose des BACKLOG traf zu: **null Änderungen auf der UI-Seite**.
Die Klasse von `TimelineMarkers` wird dynamisch zusammengesetzt (`css[\`eventMark_${event.kind}\`]`),
drei neue kinds greifen automatisch, ergänzt wurden nur drei CSS-Einträge und die `eventsOf`-Abbildung auf Runtime-Seite.

Bei Szenen mit unbegrenztem homogenem Feld und Punktladungen bleiben die `events` ein leeres Array, es werden keine Marker gefälscht.

---

## 8. Nicht Teil (ausdrückliche Grenzen)

- **Keine Kondensator-/Lade-Entlade-Schaltungen**: Diese gehören zur Schaltungsdomäne. Diese Phase deckt Plattengeometrie + Feld zwischen den Platten + Ablenkungs-
  physik ab, also den mechanischen Teil des Kondensators.
- **Kein PhysicsEvent für die Plattengeometrie**: `setPlateGeometry` läuft über fork, Revision +1,
  `validateScene`, erneutes simulate + verify, aber das Ereignislog der Szene selbst hat diese Änderung nicht erfasst.
  Eine vollständige Audit-Kette erfordert, den eingefrorenen Befehlssatz in `scene-runtime.ts` um
  `SetPlateSeparation` / `SetPlateLength` zu erweitern, das ist eine Spec-Änderung und bleibt für später.
- **Kein visueller Feinschliff im Question Space**: Es gibt keine konkrete Designanforderung, und diese Oberfläche hat bereits Acceptance-Abdeckung;
  CSS ohne visuelle Verifikationsmittel zu ändern, wäre Spekulation.
- **Das gemeinsame `extentOf` wird nicht geändert**: Der Region-Zweig verwendet eine eigenständige Frame-Funktion, um die bereits abgenommene Ausschnittswahl
  für Punktladungen und unbegrenzte Felder nicht zu beeinflussen.

---

## 9. Screenshots

- `docs/reports/screenshots/question-parallel-plate-1600x900.png` — Aufgabenraum
- `docs/reports/screenshots/lab-parallel-plate-1600x900.png` — Anfangsframe im Labor
  (Platten + begrenztes Feldraster + Trajektorie krümmt sich im Feldbereich, nach dem Austritt gerade)
- `docs/reports/screenshots/lab-parallel-plate-events-1600x900.png` — per seek zwischen die Platten
  (E nach unten, F und a nach oben, Zahlen von Inspector und Canvas stimmen überein)
- `docs/reports/screenshots/agent-plate-deflection-1600x900.png` — Agent erklärt die Ablenkungsrichtung
- `docs/reports/screenshots/lab-plate-impact-1600x900.png` — Pfad Aufprall auf die Platte
  (`electric-13`, Ereignismarken Eintritt ins elektrische Feld + Aufprall auf die Platte, kein Austritt aus dem elektrischen Feld)
