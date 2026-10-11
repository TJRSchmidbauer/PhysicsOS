# Mechanics Runtime Pack V1 — Report

> Datei: `docs/reports/MECHANICS-RUNTIME-PACK-V1-REPORT.md`
> Aufgaben-ID: `MECHANICS_RUNTIME_PACK_V1`

---

## 1. Mechanics Contracts

`packages/physics-scene` Erweiterung:

- `Body` (rigid_body) hat bereits vollständigen Contract (mass, position, velocity, acceleration, shape, material)
- `Force` hat bereits vollständigen Contract (type: gravity, normal, friction, tension, spring, electric, lorentz, ampere, drag, custom; vector, targetId, model, derived)
- `GravityField` hat bereits vollständigen Contract (uniform_gravity, acceleration: QuantityVector)
- Scene-Validierung Erweiterung: Body Einheiten/Dimensionen/Endlichkeit/positive Masse Prüfung, Body ID zu observable target Validierung hinzugefügt

Neu: `mechanics-scene-factory.ts`:

- `createMechanicsScene(input)` — erstellt gültige PhysicsScene gemäß Model
- `createMechanicsSimulationRequest(scene, simId, traceId)` — erstellt SimulationRequest
- Unterstützt 5 Models + gravity, groundY, inclineAngle, frictionCoefficient, appliedForce

---

## 2. Engine Models

`packages/engine-mechanics` neu erstellt:

- `M1 uniform_linear_motion` — x(t) = x0 + vt, a = 0, F_net = 0
- `M2 uniformly_accelerated_motion` — v(t) = v0 + at, x(t) = x0 + v0t + ½at²
- `M3 projectile_motion` — vereinheitlichter waagrechter + schräger Wurf (launchAngle = 0 für waagrechten Wurf)
  - flightTime, range, maxHeight, impactVelocity Berechnung
  - GroundImpact Ereignis-Generierung
  - Timeline Dauer = impactTime
- `M4 newton_second_law` — ΣF = ma, unterstützt applied force + gravity + normal
- `M5 inclined_plane` — g sinθ, g cosθ, N = mg cosθ, f = μN, a = g(sinθ - μcosθ)

`mechanics-model-selector.ts`:

- `detectMechanicsModel(scene)` — automatische Model-Erkennung über title/description/observable/force/body
- `resolveMechanicsModel(scene)` — gibt vollständiges MechanicsModel zurück

---

## 3. Solver

- `analytical-kinematics.ts` — kinematicsAt(pos0, v0, a, t) gibt position/velocity/acceleration zurück
- `force-dynamics.ts` — newtonSecondLaw(m, forces[]), inclineAcceleration(m, g, θ, μ), inclineForceDecomposition(g, θ)

Alles analytisch, keine numerische Integration.

---

## 4. Scene Integration

- `MechanicsEngine` implementiert `PhysicsEngine<PhysicsScene>` Interface
- canHandle Prüfung: 2D, single body, mass > 0, validateScene
- validate ruft validateScene + canHandle auf
- stateAt gibt closed-form state zurück
- simulate sampelt 65-Punkte-Trajektorie, berechnet derivedQuantities, generiert verification

---

## 5. Verifier

`packages/physics-verifier` Erweiterung:

- `verifyNewtonSecondLaw(m, F, a)` — ΣF = ma numerische Prüfung
- `verifyKinematicConsistency(v0, a, t, v, x, x0)` — v(t) = v0 + at Prüfung
- `verifyProjectileHorizontalVelocity(states, bodyId)` — vx constant Prüfung
- `verifyProjectileVerticalAcceleration(a, g)` — ay = -g Prüfung
- `verifyProjectileImpact(finalY, groundY)` — impact y ≈ groundY Prüfung
- `verifyInclineForceDecomposition(g, θ, gPar, gNorm, N, m)` — mg sinθ, mg cosθ Prüfung

Engine-interne verification wird in simulate generiert.

---

## 6. Observation

`packages/physics-observation` Erweiterung:

- PositionObservation, MechanicsVelocityObservation, AccelerationObservation
- ForceObservation, NetForceObservation
- MechanicsTrajectoryObservation
- DisplacementObservation
- ProjectileKeyPointObservation (launch, apex, impact)
- GroundObservation, InclineObservation

`observeMechanicsScene(input)` — erzeugt renderer-neutrale Observations aus scene + simulation

---

## 7. Lab

Lab-UI in Aktualisierung — aktueller Lab Workspace basiert noch hauptsächlich auf Magnetic Runtime.
Mechanics Lab Templates und Renderer warten auf UI-Phase.

---

## 8. Question Parser

`packages/question-core` Erweiterung:

- `DeterministicMechanicsQuestionParser` — erkennt chinesische Mechanik-Aufgaben
- Unterstützt: Anfangsgeschwindigkeit, Endgeschwindigkeit, Beschleunigung, Zeit, Verschiebung, Höhe, Masse, Kraft, Winkel, Reibungskoeffizient, Erdbeschleunigung, horizontale Geschwindigkeit, Wurfwinkel
- Einheiten über `physics-units` `parseQuantity` + `canonicalValue` Umwandlung
- Keine manuelle Umrechnung

---

## 9. Semantic IR

`PhysicsSemanticIR` Erweiterung:

- domain: 'mechanics'
- model: uniform_linear_motion | uniformly_accelerated_motion | projectile_motion | newton_second_law | inclined_plane
- Neue targets: final_velocity, displacement, time, acceleration, range, max_height, flight_time, normal_force, friction_force, net_force, velocity
- Neue relations: constant_velocity, constant_acceleration, free_flight, on_incline
- Neue assumptions: no_air_resistance, constant_force, kinetic_friction, static_friction_pending
- Neue Felder: inclineAngle, launchAngle, groundY, frictionCoefficient

`semantic-validator.ts` erweitert zu domain-aware: magnetic → validateMagneticIR, mechanics → validateMechanicsIR

---

## 10. Question Runtime

`question-runtime.ts` neu geschrieben:

- Automatische Erkennung magnetic vs mechanics Aufgaben
- Magnetfeld → DeterministicMagneticQuestionParser + MagneticEngine
- Mechanik → DeterministicMechanicsQuestionParser + MechanicsEngine
- Vereinheitlichtes processQuestion Interface
- buildSolution unterstützt step + result Generierung für 5 mechanics Models

---

## 11. Renderer

MechanicsRenderer wartet auf UI-Phase. Aktueller LabCanvas unterstützt nur magnetic.

---

## 12. Timeline

MechanicsEngine.stateAt unterstützt Play/Pause/Seek/Step/Speed.
Alles stammt aus analytical stateAt(t), keine CSS-Animationen.

---

## 13. Golden Tests

### Magnetfeld Golden Questions (bestehende 49 Tests)

- 10 Magnetfeld-Aufgaben alle bestanden
- Q09 Einheitenumrechnung (km/s + mT) jetzt durch physics-units korrekt umgewandelt

### Mechanik Golden Questions (neu 64 Tests)

Golden Questions (6 Stück):

- mech-01: gleichmäßig beschleunigt v0=10, a=2, t=5 → v=20, s=75 ✓
- mech-02: waagrechter Wurf h=20m, vx=10m/s, g=10 → t=2s, R=20m ✓
- mech-03: schräger Wurf v0=20, θ=30°, g=10 → maxH, flightTime, range ✓
- mech-04: Newton m=2, F=10 → a=5 m/s² ✓
- mech-05: schiefe Ebene m=2, θ=30°, g=10, μ=0 → a=5 m/s², N≈17,32N ✓
- mech-06: Einheitenumrechnung 72 km/h → 20 m/s ✓

Engine Direct Tests:

- canHandle uniform linear / projectile / incline ✓
- lehnt mass ≤ 0 ab ✓
- stateAt gibt gültigen state zurück ✓
- simulate erzeugt states und derived ✓

Metamorphe Tests:

- projectile vx×2 → range×2, gleiche Flugzeit ✓
- newton F×2 → a×2 ✓
- incline mass×2 → Beschleunigung unverändert ✓

Randfälle:

- mass = 0 → nicht unterstützt ✓
- mass < 0 → nicht unterstützt ✓
- g = 0 projectile → kein Absturz, kein NaN ✓
- kein NaN in Simulationsergebnissen ✓

---

## 14. Browser E2E

Wird nach UI-Phase ausgeführt.

---

## 15. Screenshots

Werden nach UI-Phase ausgegeben.

---

## 16. Bekannte Einschränkungen

- **Lab UI**: Aktueller Lab Workspace basiert noch hauptsächlich auf Magnetic Runtime, Mechanics Lab Templates und Renderer warten auf UI-Phase
- **Scene Commands**: Mechanics Scene Commands (SetBodyMass, SetInitialPosition, SetLaunchAngle usw.) warten auf V2
- **Static Friction**: V1 unterstützt nur kinetic friction (μN), statische Reibungs-Gleichgewichtsprüfung als PENDING markiert
- **Renderer**: MechanicsRenderer (waagrechter Wurf Parabel, schiefe Ebene Kraftzerlegung) wartet auf UI-Phase
- **Data Panel**: x-t, v-t, a-t Diagramme warten auf UI-Phase
- **Agent "What If?"**: Tool Contract reserviert, Implementierung wartet auf V2
- **Home/Recent Spaces**: Warten auf UI-Phasen-Aktualisierung

---

## 17. Harness Replay Deferred

```
HARNESS_WINDOWS_REPLAY_GATE_DEFERRED
```

---

## 18. Test Statistics

| Suite                      | Tests    | Status   |
| -------------------------- | -------- | -------- |
| Magnetic Golden Questions  | 49       | PASS     |
| Mechanics Golden Questions | 64       | PASS     |
| **Total**                  | **113**  | **PASS** |
| root typecheck             | 16 tasks | PASS     |
| root test                  | 21 tasks | PASS     |

---

## 19. UI Architecture — Ein Arbeitsbereich, nicht eine Seite pro Domäne

In dieser Runde werden drei fast identische Arbeitsbereich-Hüllen zu einer zusammengefasst. Zuvor hatten `LabWorkspace` (Magnetfeld), `MechanicsLabWorkspace`, `ElectricLabWorkspace` zusammen ca. 1170 Zeilen Komponenten-Code, wobei ~80–85 % dieselbe toolbar / scene panel / canvas / timeline / data panel / inspector Struktur waren; `TreeRow`, `Chart`, `formatNumber`, `stepTo` und andere Blattkomponenten wurden wörtlich 2–3-fach kopiert, `PLAYBACK_RATES` kam dreimal vor.

```text
PhysicsSurface (einziger Dispatcher, LabWorkspace.tsx)
        │  domainOfScene(scene) → magnetic | mechanics | electric | unsupported
        ↓
WorkspaceRuntime (physics/workspace-runtime.ts)
        │  getSnapshot / editParameter / setChoice / setObservable
        │  setRunning / setRate / seek / step / advance / setHighlight
        ├── MagneticWorkspaceRuntime   → wrappt bestehenden bereits abgenommenen MagneticRuntimeBridge
        ├── MechanicsWorkspaceRuntime  → MechanicsRuntimeBridge
        └── ElectricWorkspaceRuntime   → SceneRuntime + ElectricEngine
        ↓
PhysicsWorkspace (einzige Shell, PhysicsWorkspace.tsx)
        │  konsumiert nur WorkspaceSnapshot; enthält keine Physik-Fakten
        ↓
PhysicsCanvas → RENDERERS[view.domain]
```

`MechanicsLabWorkspace.tsx` (734 Zeilen) und `ElectricLabWorkspace.tsx` (615 Zeilen) wurden gelöscht.
Neue Domäne = ein Runtime-Adapter + ein Renderer in der Registry, keine neuen Seiten mehr.

Snapshot-Vertrag (`WorkspaceSnapshot`) vereinheitlicht die zuvor drei inkompatiblen Snapshot-Formen:
`domain / title / subtitle / status / sceneRevision / view / ariaLabel / tree /
inspector / charts / table / derivation / verification / events / clock /
trajectoryTimes / sampleReadout? / error?`.

### Schlüssel-Fix: Ganzer Canvas nicht sichtbar

`physics-tokens.css` wurde nie importiert. Plugin-Bundle injiziert nur automatisch `*.module.css`, daher waren alle `--physics-*` Variablen undefiniert. `stroke: var(--undefined)` wird im berechneten Wert ungültig und fällt auf den Erbwert zurück, während der Canvas-Wurzelknoten `<svg fill="none">` ist — Ergebnis: Gitter, Koordinatenachsen, Pfeile, Trajektorien, Magnetfeld ×/· gelangen alle in den DOM, aber zeichnen nicht. **Bereits abgenommenes Magnetic UI daher ebenfalls stille Regression**.

Fix: Tokens werden mit `mountPhysicsOSChrome()` auf Document-Ebene injiziert (Datei dient genau diesem Zweck), doppelte CSS-Dateien entfernt; `tests/chrome.client.spec.ts` prüft alle 24 Tokens einzeln, damit dieser "weißer Canvas"-Fehler nicht mehr still auftreten kann.

### Schlüssel-Fix: Canvas wird 1,5× vergrößert

`PhysicsCanvas` erzeugte viewBox ursprünglich nach Inhaltsgröße. Hochformat-Szenarien (waagrechter Wurf h=20/R=20 ca. 1:1) ergaben 431×459 viewBox, in 770×699 Box durch `preserveAspectRatio` 1,523× vergrößert, alle Strichstärken und Schriftgrößen mitvergrößert, Bild wirkt grob und füllt Breite nicht aus. Jetzt plot box fest 960×540, Szene in Box zentriert, viewBox-Größe konstant — Skalierung nur ≤1, nie Vergrößerung. Domänen-Zeichnung zusätzlich mit clipPath, Objekte fliegen nicht mehr auf Achsen und Skalen hinaus.

---

## 20. Mechanics Visual Contract

`physics/scene-visual-model.ts` ist einzige Renderer-Eingabe: `BodyVisual` `GroundVisual` `InclineVisual` `PlatformVisual` `TrajectoryVisual` `VectorVisual` `AngleVisual` `DimensionVisual` `KeyPointVisual` `CoordinateVisual` `LabelVisual` `MeasurementVisual` `FieldVisual` `ParticleVisual` `GuideVisual`. Koordinaten in Szeneneinheiten, y nach oben; jeder Renderer führt genau einmal y-Spiegelung durch.

`physics/primitives.tsx` stellt gemeinsame Primitiven bereit (Ground / Incline / Platform / Body / Vectors / MathLabel / Angle / Dimension / KeyPoint / Coordinate / ArrowMarkers). Renderer importiert keine Engine, berechnet keine Physik — nur Layout-Arithmetik.

Lab und Question Space nutzen jetzt **denselben** mechanics visuellen Pfad
(`mechanics-visual-bridge.ts`, observation-gesteuert). Zuvor nutzte Lab einen redundanten
view builder, wodurch sich beide Oberflächen eigenständig drifteten; die redundante Implementierung wurde entfernt.

### Vektor-Beschriftungs-Layout

Auf der schiefen Ebene teilen sich die sechs Pfeile mg / N / f / a / mg·sinθ / mg·cosθ denselben Basispunkt; „Beschriftung am Pfeilende"
würden sich alle übereinander stapeln. `vector-label-layout.ts` löst die Beschriftungsboxen im **Bildschirmraum**: jedes Label wird entlang
seiner eigenen Pfeilrichtung weggeschoben, sodass es immer visuell mit seinem Pfeil gekoppelt bleibt; nur bei Überschreitung des Schwellenwerts wird eine
Führungslinie hinzugefügt. `tests/vector-label-layout.client.spec.ts` prüft mit einem echten Sechs-Pfeil-Freikörperdiagramm, dass sich keine zwei überlappen.

### Freikörperdiagramm stammt aus der Observation-Schicht

Einzelne Kräfte (mg / N / f) existierten zuvor in keinem mechanics-Szenario: `createMechanicsScene`
hatte kein `type: 'force'` Observable, `visible(scene,'force')` war stets leer. Jetzt:

- `createMechanicsScene` fügt `obs-forces` (force), `obs-keypoints`, hinzu
  `obs-components`（velocity_components）、`obs-decomposition`（force_decomposition）
- `observeMechanicsScene` veröffentlicht einzelne Kraftbeobachtungen: mg für alle Modelle; N, f und
  mg·sinθ / mg·cosθ aus den vom Engine bereits berechneten `normal_force` / `friction_force` Beträgen
  auf das modell-eigene Schrägen-Koordinatensystem projiziert — **Richtung kommt vom Modell, nicht vom Zeichencode**
- μ wird jetzt in `body.material.frictionCoefficient` geschrieben, andernfalls liest der Resolver μ=0,
  die Szene behauptet Reibung, aber der Solver wendet sie nicht an
- ΣF wird nur gezeichnet, wenn es von einer einzelnen Einzelkraft abweicht, um zu vermeiden, dass zwei Pfeile für dieselbe physikalische Tatsache übereinander liegen

---

## 21. Observation Toggle über Scene Command

Geschwindigkeitskomponenten, Kraftzerlegungen und Schlüsselpunkte waren zuvor lokale `Record<string,boolean>` innerhalb der Komponente,
Klicks erzeugten keine Scene-Ereignisse. Jetzt sind alle vier Ebenen Scene-Observables,
Toggle über `SetObservableEnabled`-Befehl → Revision +1 → `ObservableEnabled/Disabled`-Ereignisse,
der Canvas-Inhalt kann nicht mit dem vom Scene Deklarierten inkonsistent sein.

Neue mechanics Scene Commands (`scene-runtime.ts`):
`SetBodyMass` `SetBodyPosition` `SetBodyVelocity` `SetGravityAcceleration`
`SetInclineAngle` `SetFrictionCoefficient` `SetAppliedForce` `SetGroundLevel`,
jeweils mit PhysicsEvent und Validierung (Neigungswinkel muss strikt in 0–90° liegen, μ ≥ 0, Masse > 0).

---

## 22. Inspector / Scene Tree / Data Panel

Alle drei werden jetzt von Snapshot-Daten getrieben, nicht mehr handgeschrieben pro Arbeitsbereich.

- Inspector: `QuantityParameter` (bearbeitbar) und `DerivedQuantityView` (schreibgeschützt) getrennt;
  Bearbeitung wird bei Blur / Enter abgeschickt, Escape stellt wieder her, ungültige Werte zeigen Invalid-Zustand an, aber **lösen keinen Befehl aus**
  (ein halber Ziffernwert sollte keine Scene-Revision auslösen)
- Aufgabenszenarien im Labor sind jetzt **bearbeitbar** (zuvor hardcoded schreibgeschützt): h / v₀ / θ / g nach Änderung
  Revision +1 und erneute Validierung bestanden
- Scene Tree: `SceneTreeNode` rekursives Rendering, Observable-Zeilen mit Checkbox,
  Hover hebt entsprechendes Grafikelement hervor. Mechanik-Baum-Labels korrigiert (zuvor zeigten alle drei Geometry-Observables „Hilfsgeometrie“)
- Data Panel: Daten / Grafiken / Herleitungen / Ereignisse. Diagramme haben Achsenbeschriftungen, Einheiten, Nulllinie, mit Szenen-Uhr synchronisierten
  Cursor, kein dekoratives Sparkline
- Verification: Zeigt nur physikalisch sinnvolle Prüfungen (horizontale Geschwindigkeitserhaltung / vertikale Beschleunigung = g / Landepunkt-Beschränkung /
  Schwerekraftkomponente mg·sinθ usw.); Schema-, ID-Einzigartigkeit, Einheitsdimensionen etc. strukturelle Prüfungen zusammengeklappt in einer Zeile
  „Szenenstruktur gültig n/n“. Schüler sehen keine rohen IDs, auch kein JSON

---

## 23. Timeline

Ereignismarker (Abwurf / Höchstpunkt / Landung) werden über dem Scrubber gezeichnet, Klick seekt direkt zu jenem Zeitpunkt;
Marker erscheinen nur bei physikalisch bedeutsamen Zeitpunkten. Wiedergabe wird von `useAnimationClock` getrieben (RAF + Reset der Baseline bei versteckten Tabs
), Magnetfeld-Domäne behält `magneticPhysicalDelta`-Mapping bei (eine Zyklotronperiode ≈1e-7 s,
ohne Mapping müsste man pro Frame Millionen Umläufe überspringen); Mechanik / Elektrisches Feld schreiten in echten Sekunden fort und halten im Endzustand an.

---

## 24. Icon System V1

`src/client/icons/physics-icons.tsx`: 24×24 Raster, 1.75px visuelle Strichstärke, abgerundete Endpunkte,
`currentColor` gestrichelte SVG React Komponenten (bei kleinen Größen Strichstärke-Kompensation zur Beibehaltung des visuellen Gewichts).
Abdeckung: Labor / Aufgaben / Kinematik / Geschwindigkeit / Beschleunigung / Bahn / Schwerkraft / Kraft / Resultierende /
Newton'sches Zweites Gesetz / Horizontalwurf / Schräger Wurf / Schräge Ebene / Reibung / Normalkraft / Zeit / Zeitachse / Diagramm /
Messung / Verifikation / Szene / Observierbare Größe / Variable / Schlüsselpunkt / Boden / Abspielen / Pausieren / Zurücksetzen / Einzelschritt.

**Toolbar und Navigation verwenden kein Raster**: generierte Konzeptbilder dienen nur als visuelle Referenz, endgültige Icons sind alle handgezeichnete SVGs.

---

## 25. Generated Design Assets

`scripts/design/generate-physics-assets.mjs` (Node only, Browser erreicht es nie).
Anmeldeinformationen werden nur aus gitignored `.env` gelesen (`PHYSICSOS_IMAGE_PRIMARY_*` /
`PHYSICSOS_IMAGE_SECONDARY_*`), Metadaten protokollieren Provider / Model / Prompt /
tatsächliche Pixel / Zeit, **keine Keys protokolliert**. Upstream gelegentliche 502, Skript wiederholt bei 5xx/429.

| Asset                       | Provider    | Tatsächliche Größe | Verwendungszweck                  |
| --------------------------- | ----------- | -------- | --------------------- |
| `icon-concept-sheet`        | gpt-image-2 | 2880²    | Iconsystem visuelle Referenz      |
| `component-reference-sheet` | gpt-image-2 | 2880²    | Canvas-Grafikelemente 1:1 Nachbau-Referenz |
| `projectile-hero`           | gpt-image-2 | 1254²    | Horizontalwurf visuelle Referenz  |
| `inclined-plane-hero`       | gpt-image-2 | 2880²    | Schiefe Ebene visuelle Referenz   |
| `newton-force-hero`         | gpt-image-2 | 2880²    | Newtons 2. Gesetz visuelle Referenz |
| `uniform-acceleration-hero` | gpt-image-2 | 2880²    | Gleichmäßig beschleunigte Bewegung visuelle Referenz |
| `lab-empty-state`           | gpt-image-2 | 1254²    | Labor-Leerzustand Hintergrund-Referenz |

Bei Anfrage von 4096² liegt Server-Obergrenze bei ~2880², Metadaten protokollieren die decodierte tatsächliche Größe, nicht den Anfragewert.
Labor-Leerzustand verwendet letztlich Inline-SVG (Punktmatrix + eine echte quadratische Bézier-Parabel), kein Raster.

---

## 26. Browser E2E

`node apps/web/e2e/mechanics-acceptance.mjs` (zuerst `pnpm dsh web` starten).

| Case | Inhalt                                                                                                 | Ergebnis |
| ---- | ---------------------------------------------------------------------------------------------------- | ---- |
| E    | Magnetfeld Regression: verified, Canvas ≥55%, kein Schachbrettmuster, keine ganzseitige Scrollbar, echte Striche >20, v/F Labels | PASS |
| A    | Horizontalwurf: Template erstellen → h=45 ändern → Revision 1 + Reichweite neu berechnet + weiterhin verified → Wiedergabe treibt Uhr voran → Grafik-Panel ≥2 Diagramme mit Achsen | PASS |
| B    | Schiefe Ebene: mg/N/f/a vier Pfeile komplett → Kraftzerlegung aktiviert ergibt 3 mg* Labels → θ=45 ändern → Normalkraft ändert sich | PASS |
| C    | Horizontalwurf-Aufgabe: READY → Klick auf bekannte Größen hebt Canvas hervor → Strukturierte Schritte → In Physikwelt öffnen → mechanics + verified | PASS |
| D    | Schiefe-Ebene-Aufgabe: gleiches Vorgehen                                                             | PASS |

Qualitätssicherung: consoleErrors 0 / pageErrors 0 / unhandledRejections 0 /
failedRequests 0 / errorResponses 0 — alle 0.
Responsive: 1440 / 1600 / 1920 drei Stufen Canvas-Anteil ≥55%, keine ganzseitige Scrollbar.

---

## 27. Screenshots

```text
docs/reports/screenshots/mechanics-lab-projectile-1440x900.png
docs/reports/screenshots/mechanics-lab-projectile-1600x900.png
docs/reports/screenshots/mechanics-lab-projectile-1920x1080.png
docs/reports/screenshots/mechanics-lab-projectile-data-1600x900.png
docs/reports/screenshots/mechanics-lab-incline-1600x900.png
docs/reports/screenshots/mechanics-magnetic-1600x900.png
docs/reports/screenshots/question-projectile-1600x900.png
docs/reports/screenshots/question-incline-1600x900.png
docs/reports/screenshots/physics-icon-system-concept-4k.png
docs/reports/screenshots/mechanics-component-reference-4k.png
```

### Visuelle QA (bildweise manuelle Prüfung)

- Horizontalwurf: Parabel vollständig, Boden mit Schnittlinien, Abschussplattform ist kurzes Brett (kein den Boden durchstoßender Pfeiler),
  h Beschriftung im linken Rand, R Beschriftung unter dem Boden, Start- / Landepunkt als präzise kleine Marker,
  v grün / mg blaugrau / a bernsteinfarben, Zeitachse hat Abwurf- und Lander-Marker
- Schiefe Ebene: Keilform vollständig mit Scheitelpunkt, horizontale Basis, θ-Bogen, Klötzchen haftet an Schrägenfläche und rotiert mit,
  mg/N/f/a vier Pfeile haben Basispunkte alle am Klötzchen, nach Aktivierung der Kraftzerlegung sind mg·sinθ / mg·cosθ sekundäre gestrichelte Pfeile und Labels überlappen nicht
- Magnetfeld: Gitter, ×/· Feldpunktraster, Bahnenkreise, v/F Pfeile, Teilchen-Highlight, Drehrichtung-Glyphe, Maßstab — konsistent mit Abnahmezustand
- Drei Auflösungsstufen: Canvas beansprucht Platz 우선, Scene / Inspector wachsen nicht unbegrenzt mit der Breite
- Inspector: Bearbeitbare und abgeleitete Größen getrennt; Verifikationsliste ganz in chinesischen Physik-Prüfnamen + PASS

---

## 28. Regression

- `pnpm test` (root): 10 Pakete alles grün
- `npx vitest run packages/client/ui-physicsos`: 8 Dateien / 60 Tests alles grün
- Harness `pnpm test:gui`: 3818 passed / 1 failed — einzige Fehlschlag ist
  `ui-primitives/tests/code-block.client.spec.tsx` 5s Timeout,
  einzeln ausgeführt 15/15 durch, ist ein bekannter Flake unter Parallellast, in keinem Zusammenhang mit dieser Änderung stehend
- Harness `pnpm build`: alle Pakete bauen erfolgreich
- Magnetfeld bestehende Unit-Tests (B 0.50→1.00 Schleife, Ladungszeichenwechsel, ×/· Mapping, Observation Entfernung,
  Seek/Playback, Fehlschlag-Snapshot-Konsistenz) bestehen alle weiterhin

### Abhängigkeitsauflösungs-Fix

`ui-physicsos` referenziert `packages/*` via `file:`, pnpm **kopiert** diese Pakete in
`.pnpm` Store und aktualisiert nicht mehr mit dem Quellcode — Browser-Bundle kompiliert daher alte Kopie,
während vitest über tsconfig paths Quellcode liest, wodurch Divergenz entsteht (Phänomen: Quellcode Titel geändert,
Test sieht es, Browser nicht). Diese 8 Abhängigkeiten wurden auf `link:` Protokoll geändert,
in node_modules sind Symlinks auf den Quellcode, Bearbeitungen wirken sofort.

---

## 29. Bekannte Einschränkungen

- Elektrisches-Feld-Domäne Zeitachse ohne Ereignismarker (Engine hat vorerst keine diskreten Ereignisse) —
  erfasst als `ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG`, siehe `docs/reports/BACKLOG.md`
- Agent-Antworten basieren auf deterministischem Intent-Matching, nicht modellgestützt; Vertrag und Tools sind bereit,
  Einbindung erfordert nur Austausch von `matchIntent` (`AGENT_MODEL_BACKED_ANSWERS_BACKLOG`)
- Bild / PDF / OCR Aufgabeneingabe nicht angebunden, UI deutlich als nicht verfügbar markiert
- `apps/web` Standalone-SPA ist noch Übergangsprodukt, nicht mit dieser UI-Weiterentwicklung mitgegangen
- Generierte Hero-Raster liegen in `UI/assets/mechanics/*.png`, keine WebP / 2x Ableitungen gemacht
  (aktuelles UI nutzt kein Raster, um ungenutzte Assets nicht einzuführen)
- **Canvas Camera V1 (Anpassen an Szene / 100% / Ansicht zurücksetzen) nicht als explizites Steuerelement implementiert.**
  Das Problem, das es lösen soll — Strichstärkenverdickung durch extreme Szenen und Vergrößerung — wurde durch „viewBox folgt Container-Pixelgröße
  - Welt-Bounding-Box proportional fit" gelöst: Gate C prüft vier Szenen (inkl. 400 m Höhendifferenz, 1200 m Reichweite)
    auf konstantes Fit, Browser-Gate an 1440 / 1600 / 1920 drei Stufen prüft Render-Skalierung ≤ 1.
    Solange kein realer Fall von unzureichendem Bildausschnitt vorliegt, fügt ein Zoom-Steuerelement nur ungenutzte UI hinzu;
    sobald echte Pan/Zoom-bedürftige Szenarien auftreten (z. B. Mehrkörper-Ferninteraktion), nachrüsten
- Auf Schräger Ebene liegen ΣF und a Labels bei gleicher Richtung noch nah beieinander (bei aktiver Kraftzerlegung am deutlichsten):
  Layout-Algorithmus schiebt entlang jeweiliger Pfeilrichtung auseinander, gleichgerichtete Pfeile lassen sich daher nur über Längenunterschied unterscheiden
- Bei 1920×1080 zu viel Leerraum unter Canvas: Welt-Bounding-Box nach 16:9 normalisiert,
  aber der Canvas-Rahmen dieses Viewports ist nahe 4:3. Bildausschnitt korrekt und proportional, akzeptabler Leerraum, kein Defekt

---

## 31. Experimental Branch — Aufgabentatsachen dürfen nicht durch Experimente verunreinigt werden

Die Bedingungen im Aufgabentext sind **festgestellte Tatsachen**. Im Labor zu fragen „Was passiert, wenn h auf 30 m geändert wird“ ist eine andere
physikalische Welt, daher beim ersten Ändern physikalischer Tatsachen Fork, statt die Revision der Aufgabe voranzutreiben —
sonst beschreibt die gerade gelesene Lösung stillschweigend ein Szenario, das nicht mehr zum Aufgabentext passt.

Vertrag (`packages/physics-scene/src/scene-branch.ts`, `SceneMetadata.lineage`
ist die minimal kompatible Erweiterung von docs/03 §25, keine zweite Scene):

```ts
interface SceneLineage {
  origin: 'question' | 'template' | 'blank'
  branchType: 'experimental'
  originQuestionId?: QuestionId
  originSceneId: SceneId // Ursprungsszene, zurück zur Originalaufgabe nur ein Sprung
  parentSceneId: SceneId // Direkter Elternteil
  parentRevision: number // Eltern-Revision im Fork-Moment
  forkedAt: IsoDateTime
}
```

Branch beginnt bei **Revision 0**: es ist eine neue Welt, die Fortführung der Eltern-Revision würde zwei verschiedene Szenarien
dasselbe Versionsnummer beanspruchen lassen; Eltern-Revision wird in `lineage.parentRevision` gespeichert,
genau das ist die Info für „Originalaufgabenbedingungen wiederherstellen“. Branch des Branches zeigt weiter auf das ursprüngliche
`originSceneId`, daher ist Rückweg immer ein Sprung.

### Was gilt als „Ändern physikalischer Tatsachen“

`physics/experimental-branch.ts` hat nur eine Definitionsstelle (`FACT_COMMANDS`):

- **Löst Fork aus**: `SetParticleCharge` `SetParticleMass` `SetParticleVelocity`
  `SetMagneticFieldStrength` `SetMagneticFieldDirection`
  `SetElectricFieldStrength` `SetElectricFieldDirection`
  `SetBodyMass` `SetBodyPosition` `SetBodyVelocity`
  `SetGravityAcceleration` `SetInclineAngle` `SetFrictionCoefficient`
  `SetAppliedForce` `SetGroundLevel`
- **Löst keinen Fork aus**: Abspielen / Pausieren / Einzelschritt / Seek / Observation umschalten / Daten ansehen /
  Agent Highlight. `SetObservableEnabled` bewusst ausgeschlossen — es ändert „was man anschaut“,
  nicht „was wahr ist“, treibt aber weiterhin die Scene-eigene Revision als auditierbares Event voran.

### Behobener Vorläuferfehler

Die Kette question → scene hat **nie die Quelle aufgezeichnet**: `createMechanicsScene` hat keinen
`sourceQuestionId`-Parameter, `buildMechanicsSceneFromIR` schreibt nur die Aufgabennummer in die Description.
Daher war Fork-Kriterium immer falsch. `sourceQuestionId` jetzt durchgängig in Metadaten;
Browser CASE F hat diesen Fehler aufgedeckt (Unit-Test bestand, weil er Scene direkt mit Metadaten konstruierte).

### UI

Toolbar zeigt leichtes Badge: `Experimenteller Zweig` + `Quelle: <Aufgabentitel>` + `Originalbedingungen wiederherstellen`.
Kein Git-Branch-UI. `data-physicsos-branch="experimental"` für E2E-Assertionen.

### Tests

- `packages/physics-scene/tests/scene-branch.test.ts` (5): Neue Welt beginnt bei Revision 0
  , nach Bearbeitung des Branches behält Originalaufgabe 20 m und Revision 4, Branch des Branches zeigt weiter auf Ursprungsszene,
  Template-Szene origin ist template, Deep-Copy-Isolierung
- `tests/experimental-branch.client.spec.tsx` (5): Nur ansehen löst keinen Fork aus,
  erst beim ersten Ändern von Tatsachen Fork, Originalbedingungen wiederherstellen, Template niemals Fork, Toolbar Badge und Zurückkehren

---

## 32. Physics Agent — Laufzeit-bewusst, rechnet Physik nicht selbst

`physics/physics-agent.ts` + `physics/physics-agent-answers.ts` + `AgentDrawer.tsx`.

Agent kann lesen: Domain / Scene-Titel / Revision / Status / aktuelle Zeit und Gesamtdauer /
benannte Verifikationspunkte / abgeleitete Größen / **aktuell tatsächlich gezeichnete visuelle IDs** / Observable-Schalter / Branch.

```text
Nutzer: „Wo ist die horizontale Geschwindigkeit? Warum ändert sie sich nicht?“
        ↓
Agent liest Verifier's horizontal_velocity_constant = PASS
        ↓
Erklärung + tool: physics.ui.highlight('horizontal-velocity')
```

Agent **berechnet vₓ nicht neu**. Jeder Zahlenwert in der Antwort stammt aus den abgeleiteten Größen im Context;
`matchIntent` findet keine Übereinstimmung, gibt `undefined` zurück, Drawer sagt direkt „In dieser Runde kann ich noch nicht antworten“,
statt eine plausibel klingende physikalische Erklärung zu erfinden.

### Werkzeuge und PhysicsEvent strikt getrennt

| Werkzeug                         | Art              | Revision | PhysicsEvent |
| ---------------------------- | ----------------- | -------- | ------------ |
| `physics.ui.highlight`       | Reine View-Interaktion | Unverändert | Wird nicht erzeugt |
| `physics.scene.setParameter` | Echter SceneCommand | +1       | Wird erzeugt |

`physics.scene.setParameter` nutzt denselben `editParameter` wie der Inspector
→ `expectedRevision` → SceneRuntime → Engine → Verifier → Observation → UI.
Agent ist nur Befehlsaufrufer, kein Bypass.

Highlight-Ziele unterstützen semantische Aliase (`horizontal-velocity` → `velocity-x`), und **zuerst Abgleich mit aktuell
im Frame tatsächlich gezeichneten IDs schneiden**: zeigt auf etwas, das nicht gezeichnet ist, gibt zurück „Canvas zeigt derzeit keine Geschwindigkeitskomponenten,
bitte entsprechende Observierbare Größe zuerst öffnen“, statt stillschweigend leere Menge zu highlighten.

### Visuell

Highlight ist `drop-shadow` Glow + `--physics-highlight` (Bernstein),
in 160ms abgeschlossen, nach 1.8 s automatisch freigegeben; kein Flackern, kein roter Rahmen, keine starke Animation,
bei `prefers-reduced-motion` Transition auf Null (Token-Ebene zentral behandelt).

### Source Chips

Drawer zeigt `Grundlage`: `Szenen Rev. N` / `Simulation verifiziert` / Benannte Verifikationspunkte. Kein JSON.

### Tests

`tests/physics-agent.client.spec.tsx` (12): Context meldet nur reale Fakten,
Alias-Auflösung und „nicht gezeichnet → Ablehnen“, Highlight ändert Revision nicht,
nach Öffnen der Ebene Komponente highlightbar, Parameter-Befehl Revision +1 und Engine rechnet neu,
weist nicht existierende Szenenparameter ab, Vorschläge nur in beantwortbaren Szenen,
Antwort referenziert benannte Verifikationspunkte, gibt undefined zurück wenn nicht beantwortbar,
Drawer End-to-End (Highlight auf Canvas + Referenz Grundlagen + Befehl landet im Inspector)

---

## 33. Regression Gates

`tests/regression-gates.client.spec.ts` + Browser-Gates, gegen **stille** Ausfälle:

| Gate | Assertion                                                  | Position                                                                     |
| ---- | ----------------------------------------------------- | ------------------------------------------------------------------------ |
| A    | Alle `--physics-*` Tokens werden tatsächlich injiziert     | `chrome.client.spec.ts` / `regression-gates`                             |
| B    | Jede Domäne im Canvas produziert echte Geometrie (Bahn / Vektoren / Boden / Feld)   | `regression-gates` + Browser `paintedStrokes > 20`                        |
| C    | Szene passt konstant in feste Plot-Box und behält Seitenverhältnis bei; Render-Skalierung ≤ 1 | `regression-gates` + Browser `displayScale ≤ 1`                           |
| D    | Ursprüngliche Aufgabenszene wird nicht durch Experimentzweig geändert                            | `scene-branch.test.ts` + Browser CASE F                                   |
| E    | Agent-Highlight ändert scene revision nicht                       | `physics-agent.client.spec.tsx` + Browser CASE G                          |
| F    | Agent-Parameterbefehl ändert revision und löst Neuberechnung aus                | `physics-agent.client.spec.tsx` + Browser CASE H                          |
| G    | Observable-Umschalter ändert Observation-Ausgabe tatsächlich           | `regression-gates` (Kraftzerlegungs-Beobachtung von null auf vorhanden)                                 |
| H    | Runtime liest aktuellen Quellcode, nicht veraltete Kopie               | `regression-gates` (Assertions nur für im aktuellen Quellcode existierende observable- und metadata-Felder) |

Die Lehre aus Gate C ist es wert, festgehalten zu werden: Die frühe Assertion „px-per-metre ≤ 1" war falsch —
das ist Einheitenumrechnung, keine Vergrößerung. Was wirklich zu wahren ist, ist das **Verhältnis von viewBox-Größe zu Render-Pixel-Größe ≤ 1**.
Bei 1920×1080 erfasste dieses Gate eine 1,38-fache Vergrößerung, was dazu führte, viewBox an die Container-Pixelgröße anzupassen
(ResizeObserver), seitdem gilt 1 viewBox-Einheit = 1 CSS px, und der Canvas füllt gleichzeitig den verfügbaren Raum aus.

---

## 34. Endgültige Verifikation

| Projekt                                  | Ergebnis                                                                                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| root `pnpm typecheck`                 | PASS                                                                                    |
| root `pnpm test`                      | PASS (11 Dateien)                                                                         |
| `ui-physicsos` vitest                 | PASS (11 Dateien / 83 Tests)                                                               |
| harness `pnpm build`                  | PASS                                                                                    |
| harness `pnpm test:gui`               | **PASS (283 Dateien / 3842 Tests / 1 skipped / 0 fehlgeschlagen)**                                   |
| Browser-Abnahme `mechanics-acceptance.mjs` | ALL CHECKS PASSED                                                                       |
| Browser-Gates                            | consoleErrors / pageErrors / unhandledRejections / failedRequests / errorResponses alle 0 |

### UPSTREAM_PARALLEL_TEST_FLAKE

`packages/client/ui-primitives/tests/code-block.client.spec.tsx` trat einst in
`test:gui` unter paralleler Last 5 s Timeout auf. Untersuchungsresultat:

- Einzeln wiederholt ausgeführt **10/10 bestanden** (jeweils 15/15)
- Weder dieses Spec noch `src/` **importieren** irgendwelche `@physicsos/*`- oder physicsos-Module
- In dieser Runde endgültiges `test:gui` voll 283/283 bestanden, nicht reproduzierbar

Als Upstream-Parallellast-Flake eingestuft, registriert als `UPSTREAM_PARALLEL_TEST_FLAKE`.
Kein `.skip`, kein unendlicher Timeout, keine Geschäftslogik-Änderungen für ihn.

---

## 35. Browser E2E — Acht Cases

`node apps/web/e2e/mechanics-acceptance.mjs`

| Case | Inhalt                                                                               | Ergebnis |
| ---- | ------------------------------------------------------------------------------------ | -------- |
| E    | Magnetfeld-Regression: verified / Canvas ≥55% / kein Schachbrettmuster / kein ganzseitiges Scrollen / echtes Rendering / v·F-Labels     | PASS |
| A    | Waagerechter Wurf: Template → h=45 ändern → revision +1 + Reichweite neu berechnen + weiterhin verified → Wiedergabe voran → Bildpanel  | PASS |
| B    | Schiefe Ebene: mg·N·f·a komplett → Kraftzerlegung ergibt 3 mg* → θ=45 ändern → Stützkraft ändert sich                     | PASS |
| C    | Waagerechter-Wurf-Aufgabe: READY → Bekannte Größen anklicken, Canvas highlightet → Strukturierte Schritte → In Physikwelt öffnen → verified      | PASS |
| D    | Schiefe-Ebene-Aufgabe: dasselbe                                                                       | PASS |
| F    | Aufgabe → Labor: Nur ansehen, nicht forken → h ändern → Experimentzweig erzeugen (revision zurück auf 1) → Zurück zur Aufgabe, Originalwerte unverändert   | PASS |
| G    | Agent „Was ist diese Höhe?“ → Canvas-Highlight + Referenzgrundlage + **revision unverändert**                 | PASS |
| H    | Agent „Ändere Schrägenwinkel auf 45°“ → revision +1 + Inspector Sync + Engine Neuberechnung + weiterhin verified | PASS |

Responsive: 1440 / 1600 / 1920 drei Stufen Canvas ≥55%, kein ganzseitiges Scrollen, Render-Skalierung ≤ 1.

---

## 36. Endgültiger Screenshot-Satz

```text
docs/reports/screenshots/home-final-1600x900.png
docs/reports/screenshots/magnetic-lab-final-1600x900.png
docs/reports/screenshots/mechanics-projectile-final-1440x900.png
docs/reports/screenshots/mechanics-projectile-final-1600x900.png
docs/reports/screenshots/mechanics-projectile-final-1920x1080.png
docs/reports/screenshots/mechanics-incline-final-1600x900.png
docs/reports/screenshots/question-projectile-final-1600x900.png
docs/reports/screenshots/question-incline-final-1600x900.png
docs/reports/screenshots/agent-highlight-final-1600x900.png
docs/reports/screenshots/experimental-branch-final-1600x900.png
docs/reports/screenshots/data-panel-final-1600x900.png
docs/reports/screenshots/physics-icon-system-concept-4k.png
docs/reports/screenshots/mechanics-component-reference-4k.png
```

Reproduktion: `node apps/web/e2e/final-screenshots.mjs` (0 console / 0 page error).

### Manuelles Visual-QA-Ergebnis

- **Canvas ist Hauptvisual**: In drei Auflösungsstufen belegt es internen Arbeitsbereich ≥55%; bei 1920 folgt viewBox dem Container,
  Linienstärke und Schriftgröße bleiben 1:1, werden nicht mehr vergrößert
- **Pfeile und Labels**: Schiefe-Ebene-Sechs-Pfeile (mg / N / f / a / mg·sinθ / mg·cosθ) gemeinsamer Basispunkt, aber Labels
  trennen sich entlang jeweiliger Pfeilrichtung, keine Überlappung; waagerechter Wurf v / mg / a keine Verdeckung
- **Beschriftungen**: h in linker Freifläche, R unter dem Boden, Maßstab rechts unten, keine gegenseitige Überlappung;
  Domänenzeichnung durch clipPath auf Plot begrenzt, herausragende Bereiche drücken nicht mehr auf Achsen
- **Diagramme**: vier Sequenzen (x-t / y-t / vₓ-t / v_y-t) nebeneinander dargestellt, Achsenname + Einheit +
  mit Szenenuhr synchroner amber Cursor; Titel via MathText, Indizes korrekt
- **Satz**: Zahlen tabular-nums, Leerzeichen zwischen Einheit und Wert, Variablen kursiv
- **Inspector**: Editierbare Größen und abgeleitete Größen in Bereiche getrennt; Prüfliste vollständig mit chinesischen Physik-Prüfnamen + PASS,
  Strukturprüfungen zu einer Zeile zusammengeklappt
- **Konkret behobene Mängel**: Diagramm y-Achsentitel überlappt mit maximalem Tick (Titel erhielt eigene Beschriftungsleiste),
  viertes Diagramm durch Panelhöhe abgeschnitten (`auto-fit` Spalte), waagerechter-Wurf-Startplattform war einst durch Boden reichender Pfeiler,
  doppelte Marker bei Zusammenfall von Wurfhöhe und Startpunkt, Schiefe-Ebene-Keilspitze abgeschnitten

---

## 37. Abschlussstatus

```text
MECHANICS_RUNTIME_PACK_V1_COMPLETE
ELECTRIC_TIMELINE_EVENT_MARKERS_BACKLOG
UPSTREAM_PARALLEL_TEST_FLAKE
HARNESS_WINDOWS_REPLAY_GATE_DEFERRED
```

Nächste Phase: `ELECTRIC_FIELD_RUNTIME_PACK_V1` (Punktladung, Mehrfachladungen, homogenes elektrisches Feld,
elektrisches Feldvektor, elektrisches Potential, Gleichpotentiallinien, Bewegung geladener Teilchen im homogenen elektrischen Feld).
