# PhysicsOS Physiklabor · Refactoring-Plan

> Datum: 2026-09-28
> Status: `PHYSICS_LAB_REFACTOR_PLAN_READY` (bereit zur parallelen Umsetzung)
> Eingabe: `docs/reports/PHYSICS-LAB-GLOBAL-AUDIT.md` (dieses Audit)
> Audit-Baseline: Commit `60bd660b386e41449849b698c84a21c53de71b5c`
> Vorherige Schlussfolgerung: `FAKE_RUNTIME` bestätigt 0, `FAKE_VERIFIED` bestätigt 0; `STATIC_DEMO` 0;
> `VISUAL_ONLY_ANIMATION` (als Physik ausgegeben) 1; `HARDCODED_PHYSICS` (verborgenes Ergebnis) 0, UI berechnet Physik 1.
> Vom Owner autorisiert, kann sofort vorangetrieben werden (Renderer-Refactoring / Zeitleiste / Mess-Infrastruktur / Uhr / UI-Hierarchie / Icons / Animationskorrekturen).

---

## 1. Ziel

Aus „lauffähige Physik-Engine + einheitliche Hülle“ soll ein „ehrliches Frontend der Physik-Runtime“ werden; der Kern besteht aus drei Dingen:

1. **Gemeinsamer Aufbau der Infrastruktur**: Uhr, Fähigkeitsmanifest, Verifikations-Gate, Einheitenumrechnung, Messung, Verdrahtung der Observation-Schicht, Rendering-Contract.
2. **Ehrlichkeit der Modelle**: Bewegungen, die das Frontend abspielt, müssen aus der Dynamik der Engine stammen; was keine Dynamik ist, muss **wahrheitsgemäß gekennzeichnet** oder durch echte Dynamik ergänzt werden.
3. **UI nach Fähigkeit ein-/ausblenden**: Nicht mehr alle Experimente haben dieselbe Toolbar, in der „die Hälfte der Steuerelemente grau ist“.

---

## 2. Zu errichtende gemeinsame Infrastruktur (nach Abhängigkeitsreihenfolge)

### I1. `ExperimentCapabilities`-Manifest (zuerst, alles andere hängt davon ab)

- **Ort**: Neu `physics/experiment-capabilities.ts`, im selben Verzeichnis wie `experiment-templates.ts`.
- **Inhalt**: Für 76 Vorlagen werden jeweils die **realen** Fähigkeiten deklariert (Form siehe Audit §7):
  `model: 'dynamic'|'analytical'|'quasi-static'|'static'`,
  `timeline/seek/replay/editable/measurable/branchable/verifiable` (boolean),
  `observations: string[]`, `measurements: string[]`.
- **Quelle**: Die Fähigkeitswerte werden **aus Runtime/Snapshot abgeleitet** (z. B. `clock.total>0 ⇒ timeline`),
  dazu eine statische Überschreibungstabelle, die den Engine-Typ (Feld `model`) korrigiert. Handkopierte Drift vermeiden: Empfohlen wird derive + wenige ausdrückliche Overrides.
- **Konsumenten**: Hülle (I2), Fähigkeits-Badges, Audit-Regressionstests.
- **Abnahme**: Der Unit-Test prüft, dass das Manifest alle 76 `EXPERIMENT_TEMPLATES`-ids abdeckt; `model` stimmt mit der Messung der Runtime überein.

### I2. Fähigkeitsgesteuertes Ein-/Ausblenden von Toolbar / Panels

- **Ist-Zustand**: `PhysicsWorkspace.tsx:616-662` und `:875-938` rendern bedingungslos den gesamten Transport + Timeline,
  bei `clock.total<=0` deaktiviert → „dieselbe Toolbar, die Hälfte der Schaltflächen nutzlos“.
- **Änderung**: Liest `capabilities.timeline/seek/replay` aus I1,
  bei `timeline:false` wird die gesamte Timeline-Zeile samt Wiedergabegruppe **ausgeblendet** (nicht deaktiviert); weiterhin sinnvolle Steuerelemente wie „Parameter bearbeiten/Zurücksetzen“ bleiben.
- **Abnahme**: Bei Domänen mit `total=0` (z. B. series-circuit, plane-mirror) erscheinen in der Toolbar keine grauen Schaltflächen mehr; E2E prüft, dass die Anzahl der Steuerelemente zur Fähigkeit passt.

### I3. Abstraktion `SimulationClock` + exakter seek-Contract

- **Ist-Zustand**: Keine Klasse `SimulationClock`; Dateninterface `PlaybackClock` + rAF + private Felder je Runtime;
  geschlossene Domänen können exakt seeken, collision nähert per Stichproben, statische Domänen sind no-op.
- **Änderung**: `SimulationClock` abstrahieren (play/pause/step/seek/reset/speed/advance),
  die Runtime implementiert über den Contract `stateAt(t)` den **exakten Wiederaufbau**; bei Fällen, die nur per Stichprobe rekonstruiert werden können (collision), wird in den Fähigkeiten `seek:'sampled'` markiert.
- **Abnahme**: Bei derselben Szene liefert `seek(t)` zweimal ein bytegleiches `SceneVisualModel` (geschlossene Domänen); collision dokumentiert die Stichprobentoleranz.

### I4. Provenance-Gate in den Rendering-Pfad einbinden (behebt P0-2)

- **Ist-Zustand**: `assertVerifiedPhysicsOutput` (`packages/physics-core/src/provenance.ts:376`) ist nur an
  `agent-tools/src/physics-tool-runtime.ts:305` angebunden; die UI stuft nur nach dem **String** `simulation.verification.status` ein
  (`physics/verified-result.ts:67-70`, `PhysicsWorkspace.tsx:377-382`).
- **Änderung**: Die Runtime ruft vor der Ausgabe von `verification` `assertVerifiedPhysicsOutput(values, 'RULE_VERIFIED')` auf
  (oder jeder Produktzahlenwert trägt eine `QuantityProvenance`); die Stufe des Badges wird von `deriveVerificationLevel` **aus der Evidenz zurückgeleitet**,
  leere checks werden stets auf `UNVERIFIED` herabgestuft. Die String-Zuordnung `LEVEL_BY_STATUS` wird gelöscht/eingeengt.
- **Abnahme**: Ein gefälschtes Ergebnis „status=passed, aber checks=[]“ darf in der UI **nicht** als verifiziert erscheinen (neuer Regressions-Gate-Test,
  Referenz `packages/agent-tools/tests/product-provenance-invariants.test.ts`).

### I5. Vollständige Verdrahtung der Observation-Schicht (behebt P1-2)

- **Ist-Zustand**: `packages/physics-observation` hat 7 Module, die UI nutzt nur 4 Domänen (mechanics/electric/composite/magnetic).
- **Änderung**: Für die Runtimes von circuit/induction/optics/wave wird das jeweilige `*-observation.ts` angebunden;
  für thermal/fluid/acoustics/modern wird je nach Bedarf ein Modul ergänzt oder ausdrücklich „nicht anwendbar“ festgehalten und in die Fähigkeitsliste geschrieben.
- **Abnahme**: Die `observations` jeder Domäne stammen aus der Observation-Schicht und nicht aus Inline-Berechnungen der Bridge.

### I6. Zentralisierung der Einheitenumrechnung (behebt P1-4)

- **Ist-Zustand**: `cm=m*100` u. Ä. verstreut über 7 visual-bridges + 2 runtimes (ca. 10 Stellen).
- **Änderung**: In `packages/physics-units` oder in der UI `physics/units-display.ts` wird
  `toDisplayValue(q, displayUnit)` bereitgestellt; die Bridge deklariert nur Anzeigeeinheiten und multipliziert nicht roh.
- **Abnahme**: Ein grep belegt, dass im Verzeichnis physics keine rohen Umrechnungen `* 100`/`*100` mehr vorkommen (Ausnahmen auf der Whitelist vermerkt).

### I7. Infrastruktur für Messwerkzeuge (behebt P1-3)

- **Ist-Zustand**: `measurementDefinitions` liegen in der Szene, die UI hat **keinerlei** interaktive Messwerkzeuge.
- **Änderung**: Neu eine Schicht für Messwerkzeuge (Messschieber/Winkelmesser/Stoppuhr/Strom-Spannungs-Anzeige), die `measurementDefinitions` +
  `SceneVisualModel` konsumiert und lesbare Zahlenwerte liefert (über die Einheiten aus I6); zunächst in 2~3 Experimenten pilotieren, dann ausrollen.
- **Abnahme**: Im Pilotexperiment lässt sich per Ziehen messen und ein verifizierter Wert mit Einheit ablesen.

### I8. Explizite Rendering-Contracts (optional, nach der Konvergenz von I1/I3)

- **Ist-Zustand**: `RENDERERS` (`renderer-registry.tsx:1236`) ist eine Domänen-Abbildung von 11 React-Komponenten,
  der Contract ist `RendererProps`. Das Audit bestätigt, dass es kein `canRender/buildVisualModel/render` gibt.
- **Änderung**: Es ist **nicht nötig**, dies zwanghaft in drei Methoden umzubauen; empfohlen wird, es zu belassen, aber zu **formalisieren** als
  `{ canRender(view): boolean; buildVisualModel(sceneOutput): SceneVisualModel; Component }`,
  und die derzeitige Logik „Weiterverteilung pro Bench innerhalb der Registry“ in `canRender` zu bündeln, was Tests und neue Domänen erleichtert.
- **Abnahme**: Ein neuer Bench erfordert keine Änderung an `PhysicsWorkspace`; `canRender`-Unit-Tests decken alle Benches ab.

---

## 3. Korrekturen der Modellehrlichkeit (P0)

### R1. lever: wahrheitsgemäß kennzeichnen oder echte Dynamik ergänzen (P0-1)

- **Ist-Zustand**: Das Momentengleichgewicht ist eine echte Engine (`engine-lever/src/statics.ts:50-63`), die Drehung ist eine Anzeige-Rampe (`statics.ts:72-83`),
  die als Rotationsdynamik ausgegeben wird.
- **Variante A (ehrliche Kennzeichnung, schnell)**: `model='quasi-static'`; die UI ändert „Ausführen“ in „Neigungstendenz anzeigen“,
  die Fähigkeitsliste markiert `model:'quasi-static'`, der Text erläutert „Dieses Modell ist Statik, der Neigungswinkel ist eine Skizze der Momentendifferenz“.
- **Variante B (echte Dynamik ergänzen, langsam)**: `τ=Iα`, `ω(t)`, `θ(t)` einführen, `I` und Dämpfung als Modellparameter, plus Abbruchbedingung
  (θ erreicht Anschlag/Kontakt). Der Verifier erhält Prüfungen auf Drehimpuls-/Energieerhaltung.
- **Empfehlung**: Zuerst A umsetzen, danach B bewerten (der Hebel der Mittelstufe ist in Lehrbüchern überwiegend Statik, A ist ehrlich genug).

### R2. apex-Ereignis zurück in die Engine (P0-3)

- **Ist-Zustand**: `mechanics-view-builders.ts:758` berechnet im View Builder selbst `apexTime=vy0/g`.
- **Änderung**: `engine-mechanics` gibt das Ereignis `apex` in `simulate()` aus; die View-Schicht bildet nur noch ab und rechnet nicht mehr.

### R3. Vereinheitlichung des g-Fallbacks der UI (P1-6)

- Das `: 9.8` in `mechanics-view-builders.ts:255` wird geändert, sodass g **zwingend** aus dem Schwerefeld der Szene gelesen wird (Fehlen gilt als Szenenfehler),
  oder es läuft über denselben Standardwert in `model-resolvers`, um „zwei Standardwerte in UI und Engine“ zu vermeiden.

---

## 4. Migrationsreihenfolge nach Domäne (jede Domäne ein kleiner Schritt, parallelisierbar)

Sortierprinzip: **Zuerst die gemeinsame Kette (I1–I4) reparieren, dann nach „Reife der Engine × Bereitschaft der Observation × didaktisches Gewicht“ vorrücken.**

| Charge | Domäne | Anzahl Experimente | Was getan wird | Abhängigkeit |
| --- | --- | --- | --- | --- |
| **B0** | alle | 76 | I1 Fähigkeitsliste + I2 Ein-/Ausblenden der Toolbar + I4 Provenance-Gate (horizontal, zuerst umsetzen) | — |
| **B1** | mechanics | 24 | R1 (lever) + R2 (apex) + I3 Präzisierung von seek (ohne collision) + Messpilot | I1–I4 |
| **B2** | composite | 6 | Observation ist bereit; Messung ergänzen + Fähigkeitsliste kalibrieren | B0 |
| **B3** | circuit | 8 | Zeitleiste bei quasistatisch ehrlich machen (Schiebewiderstand-Durchlauf kennzeichnen) + Observation-Verdrahtung + Messung an Schalter/Schiebewiderstand | I5 |
| **B4** | electric | 4 | Observation-Verdrahtung (bereits vorhanden) + Punktladung als statisch kennzeichnen + Messung | I5 |
| **B5** | induction | 5 | Observation-Verdrahtung + Transformator als statisch kennzeichnen | I5 |
| **B6** | wave | 7 | Observation-Verdrahtung + Messung (Wellenlänge/Frequenz) | I5 |
| **B7** | optics / light | 6 | Statische Kennzeichnung + geometrisch-optische Messung (Brennweite/Gegenstandsweite) | I6 |
| **B8** | fluid / pressure | 4 | Statische Kennzeichnung + Druckmessung | I6 |
| **B9** | thermal / thermometer | 4 | Ereignisachse der Heizkurve + Temperaturmessung | I5 |
| **B10** | acoustics / noise | 2 | Ereignisachse des Echos + Schallpegelmessung | — |
| **B11** | magnetic / current | 5 | current statisch kennzeichnen + Magnetfeldmessung; Verdrahtung des Zweigs magnetic-circular | I5 |
| **B12** | modern | 1 | photoelectric: Kennzeichnung der statischen Kurve + Messung der Schwellenfrequenz | I6 |

---

## 5. Abnahme und Regressions-Gates

1. **Fähigkeitskonsistenztest**: `ExperimentCapabilities` deckt 76 ids ab; für jede Vorlage wird die Deklaration im Manifest mit dem tatsächlichen
   `WorkspaceSnapshot` (timeline/events/charts/branch) Punkt für Punkt abgeglichen.
2. **Provenance-Gegenbeispiel-Gate**: Ein gefälschtes `status=passed, checks=[]` darf „verifiziert“ nicht aufleuchten lassen (I4).
3. **Zeitleisten-Contract-Test**: Bei Experimenten mit `timeline:true` ist `clock.total>0`; `seek(t)` ist idempotent (geschlossene Domänen bytegleich).
4. **Toolbar-Contract-Test**: Die Anzahl der Steuerelemente stimmt mit `capabilities` überein (keine ganzen Gruppen „sichtbar, aber deaktiviert“).
5. **Einheitentest**: `toDisplayValue` deckt alle Anzeigeeinheiten ab; grep verbietet rohe Umrechnungen mit `*100`.
6. **Modellkennzeichnungstest**: Bei Experimenten mit `model!=='dynamic'` darf die UI keine Texte/Animationen zeigen, die Dynamik andeuten (Schwerpunkt lever).

---

## 6. Risiken und irreversible Punkte

- **Nicht anzufassen**: Breaking Changes am `PhysicsScene`-Schema (vom Owner als irreversibel eingestuft); Produktions-Deployment (läuft noch mit einem älteren Commit).
- **Dieser Plan umfasst nicht**: Löschen von Nutzerdaten, DB-Migration, Brechen der öffentlichen API, Abschalten von Produktionsfunktionen.
- **Achtung**: In `packages/exam-standard/**`, `tool-physicsos/**`, `ui-physicsos/**` bearbeiten andere Agents parallel,
  bei der Umsetzung dieses Plans ist die Aufteilung nach Dateien einzuhalten, um gleichzeitiges Schreiben derselben Datei zu vermeiden.
