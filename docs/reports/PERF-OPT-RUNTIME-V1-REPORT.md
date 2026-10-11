# PhysicsOS Abschlussbericht Performance-Optimierung V1 (PERF-OPT)

> Datum: 2026-09-08
> Status: `PHYSICSOS_PERF_OPT_V1_COMPLETE` (abgeschlossen)
> Umfang: Gemäß den Performance-Vorgaben aus `docs/01-DEVELOPMENT-GUIDE.md` §84–86 und `docs/02-ENGINEERING-STANDARDS.md` §26 / #123 / #124 / #125 / #150
> wurden hochfrequente Rendering-Pfade, Trajektorienspeicherung, Berechnungskomplexität und die Worker-Grenze global optimiert. Die physikalischen Zahlenwerte und öffentlichen Contracts bleiben unverändert.

---

## 1. Ziel

Die Lücken zwischen Ist-Zustand und den vier Performance-Vorgaben:

| Vorgabe                                     | Ist-Zustand                                                           | Lücke                                               |
| ------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| #123 Canvas-Performance (kein Update des gesamten React-Baums pro Frame) | Die Animationsuhr ruft pro Frame `setSnapshot` auf        | Jeder Frame löst ein Neu-Rendern des gesamten React-Baums aus |
| #85 / #124 Trennung der Abtastraten + begrenzte Trajektorien bei großen Datenmengen | Die Engine kodiert die Trajektorienabschnitte hart, `SimulationOptions.outputSampleRate` ist deklariert, hat aber keinen Konsumenten | Der Speicher wächst mit der Simulation unbegrenzt, die Anzahl der gerenderten Punkte hat keine Obergrenze |
| #150 / #26 Long Tasks im Hauptthread und O(n²) | Einige Pfade mit linearem/quadratischem Scan                      | `phaseAt` linearer Scan, Verifikationszusammenfassung O(E×C), Feldabtastung mit wiederholten Allokationen |
| #125 Worker-Nachrichten müssen einen klaren Contract haben | Keine Worker-fähige Nachrichtenhülle                | Für eine künftige Worker-Auslagerung fehlt ein Contract |

Diese Runde führt keine Worker-Produktionsimplementierung ein und löst keinen Umbau auf Lazy Loading aus (§86 ist ein späteres Thema der Web-Schicht), sondern setzt nur die vier Dinge „Contract, Obergrenze, Entkopplung, Komplexität“ um und belegt mit den vorhandenen Gates, dass sich die Zahlenwerte nicht geändert haben.

## 2. Liefergegenstände

| Pfad                                                                        | Inhalt                                                                                                                                                                                                                                                                                                                    |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/physics-scene/src/trajectory-sampling.ts` (neu)                   | Contract für Abtastung/Ausdünnung/Chunking: begrenzter Speicher nach #124 `MAX_TRAJECTORY_STORAGE_SAMPLES = 1024`, Render-Budget `MAX_TRAJECTORY_RENDER_POINTS = 512`; `trajectoryStorageSampleCount` (liest `outputSampleRate`, begrenzt auf [2,1024]), `trajectorySampleTimes` (äquidistant einschließlich Endpunkten), `decimateTrajectoryPoints` (erhält Anfang und Ende + Indexmenge `protect`), `chunkTrajectoryPoints` |
| `packages/physics-scene/tests/trajectory-sampling.test.ts` (neu)            | 14 Testfälle: Begrenzung / Äquidistanz / Ausdünnung erhält Anfang und Ende / protect / Chunking                                                                                                                                                                                                                           |
| 6 Engines (mechanics / magnetic / electric / wave / induction / composite)  | `simulate()` respektiert `request.options.outputSampleRate`; der Standard-Fallback ist identisch mit der ursprünglichen Abschnittskonstante (Standardverhalten ohne jede Änderung)                                                                                                                                         |
| 4 Trajektorien-Builder der Observation-Schicht (magnetic / electric / mechanics / composite) | Ausdünnung mit 512 Punkten als Obergrenze; composite sammelt zusätzlich die Zeitpunkte der Phasengrenzen in `protect`, sodass die Knickpunkte beim Durchtritt durch Bereiche nach der Ausdünnung nicht verloren gehen                                                                                       |
| `packages/physics-core/src/simulation.ts`                                   | Neu der Worker-Nachrichten-Contract: diskriminierte Union `SimulationProgress` / `SimulationError` / `SimulationWorkerMessage` + Strukturvalidator `parseSimulationWorkerMessage` (Schema `simulation-worker/1.0`)                                                                                                       |
| `packages/physics-core/src/verification.ts`                                 | `summarizeVerification` O(E×C) → O(E+C) (Deduplizierung über Set der Fehlercodes)                                                                                                                                                                                                                                         |
| `packages/engine-composite/src/composite-engine.ts`                         | `phaseAt` linearer Scan → binäre Suche, Semantik zweigweise äquivalent zur ursprünglichen Implementierung (Kommentar behält das ursprüngliche Kriterium „erstes endTime ≥ time“ bei)                                                                                                                                      |
| `packages/physics-electric-core/src/field.ts`                               | `fieldAt` mit fusioniertem Einzeldurchlauf-Akkumulator, beseitigt n Zwischenallokationen und doppeltes Durchlaufen pro Abtastung                                                                                                                                                                                          |
| `packages/physics-verifier/src/electric-verifier.ts`                        | Einmaliger Map-Index der abgeleiteten Größen pro Zustand statt mehrfacher linearer Scans (die Datei wurde zugleich von prettier umgeordnet, der semantische Diff ist dieser Punkt)                                                                                                                                         |
| `packages/physics-verifier/src/magnetic-verifier.ts`                        | `assumptionsFromResult` O(A²) → O(A)                                                                                                                                                                                                                                                                                      |
| `overlays/.../ui-physicsos/src/client/physics/frame-source.ts` (neu)        | Rendering-Kanal #123: `createFrameSource` / `useFrameSource` (`useSyncExternalStore`), Abonnement speziell für den Canvas                                                                                                                                                                                                 |
| `overlays/.../ui-physicsos/src/client/PhysicsWorkspace.tsx`                 | Die Animationsuhr veröffentlicht pro Frame an die FrameSource (der Canvas aktualisiert unabhängig); die React-Hülle aktualisiert mit 250-ms-Zusammenfassungsdrosselung, Änderungen an Status / Revision / running werden sofort aktualisiert                                                                              |
| `overlays/.../ui-physicsos/src/client/QuestionWorkspace.tsx`                | Die Wiedergabeuhr und die Frame-für-Frame-Visual-Berechnung wandern in den Canvas-Teilbaum; die Drawn-ID-Selection meldet mit Mengengleichheits-Guard nach oben, die Rails des Eltern-Elements rendern nicht mit jedem Frame neu                                                                                          |
| `overlays/.../ui-physicsos/tests/frame-source.client.spec.ts` (neu)         | 4 Testfälle zur FrameSource-Semantik                                                                                                                                                                                                                                                                                      |
| `overlays/.../ui-physicsos/tests/renderer-decoupling.client.spec.tsx` (neu) | 2 Testfälle zur Verifikation auf Browser-Ebene für #123: Pro Frame wird nur die Anzeige des Canvas aktualisiert, die React-Hülle verharrt bei der gedrosselten Zusammenfassung und gleicht nach 250 ms an; diskrete Interaktionen sofort                                                                                  |
| `packages/physics-core/tests/contracts.test.ts`                             | +5 Testfälle zum Worker-Contract (round-trip / lehnt Nicht-Schema ab / unbekanntes kind / Nicht-Objekt / progress außerhalb des Bereichs)                                                                                                                                                                                  |
| `packages/physics-core/src/index.ts`, `packages/physics-scene/src/index.ts` | Neue Exporte                                                                                                                                                                                                                                                                                                              |

Insgesamt: 20 Quelldateien geändert + 5 Dateien neu (989 Einfügungen / 256 Löschungen, ohne Zeiger auf das vendor-Submodul), alles in `packages/` und `overlays/` (ohne `apps/`, Upstream-Historie von `vendor/`, `services/`).

## 3. Entwurfsentscheidungen

1. **Die vier Abtastraten werden vom Contract in die Implementierung überführt, mit Standard ohne Änderung.** solver timestep (Engine-intern), storage (`outputSampleRate`, Standard-Fallback = ursprüngliche Abschnittszahl + 1), render (Observation-Schicht dünnt auf 512 aus), chart (derzeit kein eigenständiger Konsument, in F1 vermerkt) sind vier getrennte Schichten; übergibt ein Aufrufer kein `outputSampleRate`, ist die Speicherdichte Punkt für Punkt identisch mit der vor der Optimierung, die physikalischen Zahlenwerte bleiben unverändert.
2. **Die Ausdünnung erfindet niemals Zahlenwerte und verliert niemals Punkte mit physikalischer Bedeutung.** `decimateTrajectoryPoints` wählt nur äquidistant nach Index (ohne Werte zu verändern); Anfang und Ende (Start/Landung/Grenze) werden zwingend behalten; `protect` erlaubt dem Aufrufer, Indizes zu deklarieren, die überleben müssen (Zeitpunkte des Bereichsdurchtritts bei composite); überschreitet es das Budget, wird die protect-Menge selbst gleichmäßig ausgedünnt, die Obergrenze wird nie durchbrochen.
3. **Der Rendering-Kanal wird vom React-Zustand entkoppelt.** `FrameSource` ist ein winziger externer Store, die Animationsschleife schreibt hinein, ohne React-State anzufassen; nur der Canvas abonniert → pro Frame wird nur der Canvas neu gerendert. Die React-Hülle abonniert eine „niederfrequente Zusammenfassung“ (250 ms Wanduhr-Drosselung) + deutliche Änderungen (Status / sceneRevision / running) werden sofort aktualisiert, Interaktionsaktionen (seek / highlight / Szenenwechsel) laufen über doppeltes Schreiben mit `commit`, damit Canvas und Panels sofort konsistent sind.
4. **An der Worker-Grenze wird zuerst der Contract festgelegt.** `SimulationWorkerMessage` erlaubt nur vier Nachrichtenarten, mit `schemaVersion` markiert, die Nutzlast sind dieselben unveränderlichen Contracts wie im Prozess (same payload in/out-of-worker, bytegleich); `parseSimulationWorkerMessage` führt an der Grenze eine Strukturvalidierung durch (progress ∈ [0,1], retryable boolean…), fehlerhafte Nutzlasten liefern `undefined` und treiben keinerlei Berechnung an. Die Worker-Produktionsimplementierung ist ein vermerkter Folgepunkt (siehe §7).
5. **Komplexitätskorrekturen bewahren die Semantik.** `summarizeVerification` dedupliziert mit einem Set unter Erhalt der ersten Reihenfolge; die binäre Suche in `phaseAt` bildet die Semantik des linearen Scans „erstes endTime ≥ time, Überschreitung fällt auf die letzte Phase zurück“ ausdrücklich nach; `fieldAt` akkumuliert komponentenweise und entspricht der arithmetischen Abfolge des ursprünglichen map→reduce. Alle durch vorhandene Golden-/Contract-Tests belegt: Zahlenwerte unverändert.

## 4. Korrekturen beim Abschluss

Nachdem die Performance-Änderungen abgelegt waren, deckte web lint an den neuen Dateien 7 Probleme auf; nach den Korrekturen beim Abschluss ist lint auf null:

- `frame-source.ts` / `frame-source.client.spec.ts` / `renderer-decoupling.client.spec.tsx` fehlte der Zeilenumbruch am Dateiende (eol-last ×3).
- `useSyncExternalStore(source.subscribe, source.get, source.get)` in `frame-source.ts` löst unbound-method ×3 aus: Die Methoden der Schnittstelle `FrameSource` erhalten die Deklaration `this: void` (die Fabrikimplementierung besteht aus Closure-Pfeilfunktionen, die nicht von `this` abhängen).
- Der Helfer `t` in `renderer-decoupling.client.spec.tsx` `key => zh[key] ?? key` löst `no-unsafe-return` aus (oxc löst den komplexen locale-key-Abbildungstyp zum Typ `error` auf): Umstellung auf die Zwischenvariable `translations: Readonly<Record<string, string>>`, wie die bestehende Schreibweise in `overlay.client.spec` / `wave.client.spec`.

## 5. Abnahmedaten

- `pnpm typecheck` (core 28 Packages + web + agent): ohne Fehler.
- `pnpm lint` (core + web + agent): ohne Fehler.
- `pnpm test:core`: 27 Packages **1090 Testfälle alle grün** (physics-scene 99 einschließlich neuer 14, physics-core 33 einschließlich neuer 5 Contract-Testfälle, question-core 402, engine-composite 26, physics-verifier 30, physics-electric-core 13 usw.).
- `pnpm test:web`: 30 Dateien **366 Testfälle alle grün** (einschließlich frame-source 4, renderer-decoupling 2; Basis 28 Dateien 360 Testfälle, hinzugekommen sind genau diese beiden Dateien).
- `pnpm test:agent`: 22 Testfälle alle grün; `agent-tools` 32 Testfälle alle grün.
- Ende-zu-Ende `tests/agent/headless-physics-acceptance.mjs`: alle 16 Gates PASS (R = 7.83 cm, T = 1.64×10⁻⁷ s stimmen mit der Baseline vor der Optimierung überein, 63/63 Engine-Prüfungen bestanden) – im Ausführungsprotokoll der Sonderaufgabe festgehalten.
- Regression der Browser-Abnahme (acht Acceptance-Skripte mechanics / electric / electric-v2 / electric-region / composite / learning / circuit / wave) nicht betroffen – in dieser Runde wurde kein Domänenverhalten außerhalb des Canvas-Zeichnens und der Engine-Zahlenpfade angefasst.

## 6. Behandlung der Review-Findings

| ID      | Schweregrad | Inhalt                                                 | Behandlung                                                                             |
| ------- | ------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| F1      | low    | Kein eigenständiges Budget für die chart-Abtastrate    | Vermerkt: Sobald ein chart-Konsument auftaucht, wird ein eigenständiges Budget umgesetzt (§7) |
| F2      | medium | Indexbasierte Ausdünnung bei composite kann phase-boundary verlieren | **Umgesetzt**: Die Observation-Schicht sammelt die Grenzzeitpunkt-Indizes in `protect` und dünnt dann aus |
| F3      | low    | `chunkTrajectoryPoints` hat keinen Produktionskonsumenten | Vermerkt: Chunking-Primitive unter der Obergrenze 1024/512 für künftige Lazy-Loading-Konsumenten von Trajektorien |
| F4      | low    | Semantik von `outputSampleRate` nicht dokumentiert     | **Umgesetzt**: Der Contract-Kommentar im Kopf von `trajectory-sampling.ts` erläutert „Gesamtzahl der Speicherabtastungen, begrenzt auf [2,1024]“ |
| F5      | low    | Nach dem Zusammenführen der verification times bei magnetic können states 1024 leicht überschreiten | Vermerkt: Die Obergrenze ist eine Näherung; Trennung der verification times von den states ist Folgearbeit |
| F6      | low    | Einige begrenzte Engines haben den Hook `outputSampleRate` nicht angebunden | Vermerkt: electric-region / fluid / thermal / acoustics / lever sind alle begrenzt abschnittsweise, kein unbegrenztes Wachstum |
| F1 (t9) | low    | `parseSimulationWorkerMessage` prüft flach, Formulierung in der Doku zu stark | Vermerkt: Beim Landen der Worker-Implementierung wird eine tiefe Prüfung ergänzt oder die Doku abgeschwächt |
| F2 (t9) | medium | Die composite-Phasenzerlegung ist im Extremfall ein begrenzter Long Task, nicht auf Worker ausgelagert | Vermerkt: Der Contract `simulation-worker/1.0` ist bereit, der Produktions-Worker ist ein vermerkter Folgepunkt (§7) |
| F3 (t9) | low    | Im Diff von electric-verifier steckt Rauschen durch prettier-Umordnung | Akzeptiert: Die Umordnung kommt mit dem Commit dieser Runde, der semantische Diff ist der Map-Index |
| F1 (t5) | low    | Das vom WeakMap-Cache gehaltene Array hat keine defensive Kopie | Vermerkt: Derzeit keine schreibenden Konsumenten; sobald welche auftauchen, wird auf frozen/Kopie umgestellt und der Nur-Lese-Contract vermerkt |

## 7. Ausdrücklich nicht Teil / Folgearbeiten

- **Worker-Produktionsimplementierung**: Der Contract `simulation-worker/1.0` ist bereit, die Phasenzerlegung von composite und die Gitterabtastung der Punktladung sind die bevorzugten Kandidaten; für die Umsetzung müssen `decomposePhases` und andere Long Tasks aus dem Hauptthread verlagert oder mit Aufteilung/Abbruchmechanismus versehen werden (#26).
- **#86 Lazy Loading** (bedarfsgerechtes Laden von Three.js / großen Skills / erweiterten Diagrammen / Teacher Studio): Optimierung der Größe beim ersten Laden in der Web-Schicht, eigene Phase.
- **Eigenständige chart-Abtastrate**, **Lazy-Loading-Konsum von Chunks**, **Vereinheitlichung von `outputSampleRate` in den übrigen Engines**: alle in dieser Runde nicht blockierend.
- Nicht geändert: Zahlenwerte der Physik, öffentliche Contracts und API-Signaturen (die neuen Exporte dieser Runde sind rein inkrementell); die alte eigenständige Oberfläche `apps/web` (`APPS_WEB_STANDALONE_RETIREMENT_BACKLOG` unverändert).
