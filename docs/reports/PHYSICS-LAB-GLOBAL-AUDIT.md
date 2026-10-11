# PhysicsOS Physiklabor · Vollständiger Auditbericht

> Datum: 2026-09-28
> Status: `PHYSICS_LAB_AUDIT_COMPLETE` (Schreibgeschützter Audit, kein Code geändert)
> Audit-Baseline: worktree `codex/harness-sync-ui-plugins`, commit `60bd660b386e41449849b698c84a21c53de71b5c`
> Umfang: `overlays/harness/files/packages/client/ui-physicsos/src/client/**`, `packages/physics-scene/**`,
> `packages/engine-*/**`, `packages/physics-{core,verifier,observation,units}/**`,
> `packages/agent-tools/src/{experiment-catalog,physics-tool-runtime}.ts`.
> Methode: Alle Schlussfolgerungen stammen aus Dateilesen und grep (file:line siehe Text); was nicht aus Code bestätigt werden konnte, wird durchgehend als `unverifiziert` markiert.
> Ausgelöste Skill: `code-audit` (Audit-Klasse muss; gemäß CLAUDE.md §3 „Audit/review nicht durch Read-only fälschlich blockieren").

---

## 0. Scan-Umfang (Was wurde gelesen)

| Bereich | Schlüsseldateien |
| --- | --- |
| Experimentvorlagen/Verzeichnis | `physics/experiment-templates.ts`(1815 Zeilen), `packages/agent-tools/src/experiment-catalog.ts`(502 Zeilen) |
| Hülle & Wiedergabe | `PhysicsWorkspace.tsx`(1121 Zeilen), `LabWorkspace.tsx`(412 Zeilen), `TimelineScrubber.tsx`, `animation-clock.ts`, `frame-source.ts` |
| Laufzeit | `physics/workspace-runtime.ts` + 21 `*-workspace-runtime.ts`, `physics-runtime-bridge.ts`, `mechanics-runtime-bridge.ts`, `collision-runtime-bridge.ts` |
| Rendering | `physics/renderer-registry.tsx`(≈1400 Zeilen), `physics/scene-visual-model.ts`(1890 Zeilen), `physics/PhysicsCanvas.tsx`, 24 `*-renderer.tsx`, `vector-label-layout.ts` |
| Bridge/Views | 21 `*-visual-bridge.ts`, `mechanics-view-builders.ts` |
| Szene-Layer | `packages/physics-scene/src/**` (scene.ts / scene-runtime.ts / diverse scene-factory) |
| Engine-Layer | 15 `packages/engine-*` (inkl. `engine-lever` komplett gelesen) |
| Verifizierung/Nachweisbarkeit | `packages/physics-core/src/provenance.ts`, `packages/physics-verifier/src/**`, UI `verified-result.ts`, `verification-presentation.ts`, `VerifiedResult.tsx` |
| Beobachtungs-Layer | `packages/physics-observation/src/**` (7 Observation-Module) |
| Lehr-Metadaten | `experiment-summaries.ts`(1082 Zeilen), `experiment-self-checks.ts`, `experiment-artwork.tsx`(1728 Zeilen) |

Keine Tests ausgeführt, keine App gestartet; dieser Bericht ist ein **statischer Code-Audit** (Owner verlangte explizit "zuerst scannen, vorerst nicht ändern").

---

## 1. Vollständiges Experimentverzeichnis (76, vollständig enumeriert)

Enumerationsquelle: Basierend auf `experiment-templates.ts` `EXPERIMENT_TEMPLATE_GROUPS` (12 Domänen, 76 Vorlagen),
kreuzverifiziert mit `experiment-catalog.ts` (Serverseite Agent-Seite 33 Einträge). **Alle 76 Vorlagen haben eine entsprechende Scene Factory,
kein Fall von "Vorlage ohne Factory". **Jede Vorlage ruft `createScene` mit der Factory auf, siehe Tabelle unten; alle Factories geben echte `PhysicsScene` zurück**
( `packages/physics-scene/src/scene.ts:1144` ).

| # | id | Domäne | Lernstufe | Scene Factory |
| --- | --- | --- | --- | --- |
| 1 | uniform-linear | Mechanik | Mittelstufe | createMechanicsScene |
| 2 | average-speed | Mechanik | Mittelstufe | createMechanicsScene |
| 3 | uniform-acceleration | Mechanik | Oberstufe | createMechanicsScene |
| 4 | projectile-horizontal | Mechanik | Oberstufe | createMechanicsScene |
| 5 | projectile-oblique | Mechanik | Oberstufe | createMechanicsScene |
| 6 | newton-second-law | Mechanik | Oberstufe | createMechanicsScene |
| 7 | incline | Mechanik | Oberstufe | createMechanicsScene |
| 8 | mechanical-energy | Mechanik | Mittelstufe | createMechanicalEnergyScene |
| 9 | ramp-friction | Mechanik | Mittelstufe | createRampFrictionScene |
| 10 | lever-balance | Mechanik | Mittelstufe | createLeverBalanceScene |
| 11 | collision-elastic | Mechanik | Oberstufe | createCollisionScene |
| 12 | collision-inelastic | Mechanik | Oberstufe | createCollisionScene |
| 13 | collision-perfectly-inelastic | Mechanik | Oberstufe | createCollisionScene |
| 14 | vt-area | Mechanik | Oberstufe | createMechanicsScene |
| 15 | force-composition | Mechanik | Oberstufe | createMechanicsScene |
| 16 | concurrent-equilibrium | Mechanik | Oberstufe | createMechanicsScene |
| 17 | apparent-weight | Mechanik | Oberstufe | createMechanicsScene |
| 18 | chase-meeting | Mechanik | Oberstufe | createCollisionScene |
| 19 | hooke-law | Mechanik | Mittelstufe | createMechanicsScene |
| 20 | spring-oscillator | Mechanik | Oberstufe | createMechanicsScene |
| 21 | circular-orbit | Mechanik | Oberstufe | createMechanicsScene |
| 22 | simple-pendulum | Mechanik | Oberstufe | createMechanicsScene |
| 23 | friction-static | Mechanik | Mittelstufe | createMechanicsScene |
| 24 | friction-mu | Mechanik | Mittelstufe | createMechanicsScene |
| 25 | point-charge | Elektrik | Oberstufe | createPointChargeScene |
| 26 | multi-point-charge | Elektrik | Oberstufe | createPointChargeScene |
| 27 | uniform-electric | Elektrik | Oberstufe | createElectricScene |
| 28 | parallel-plate | Elektrik | Oberstufe | createParallelPlateScene |
| 29 | straight-wire-field | Magnetik | Mittelstufe | createStraightWireFieldScene |
| 30 | solenoid-field | Magnetik | Mittelstufe | createSolenoidFieldScene |
| 31 | electromagnet | Magnetik | Mittelstufe | createElectromagnetScene |
| 32 | motor | Magnetik | Mittelstufe | createMotorScene |
| 33 | magnetic-circular | Magnetik | Oberstufe | createMagneticScene |
| 34 | series-circuit | Schaltkreis | Mittelstufe | createSeriesCircuitScene |
| 35 | parallel-circuit | Schaltkreis | Mittelstufe | createParallelCircuitScene |
| 36 | mixed-circuit | Schaltkreis | Mittelstufe | createMixedCircuitScene |
| 37 | short-circuit | Schaltkreis | Mittelstufe | createShortCircuitScene |
| 38 | rheostat-circuit | Schaltkreis | Mittelstufe | createRheostatCircuitScene |
| 39 | va-resistance | Schaltkreis | Mittelstufe | createRheostatCircuitScene |
| 40 | bulb-power | Schaltkreis | Mittelstufe | createRheostatCircuitScene |
| 41 | emf-measurement | Schaltkreis | Oberstufe | createEmfMeasurementScene |
| 42 | pinhole | Optik | Mittelstufe | createPinholeScene |
| 43 | total-reflection | Optik | Mittelstufe | createTotalReflectionScene |
| 44 | plane-mirror | Optik | Mittelstufe | createPlaneMirrorScene |
| 45 | convex-lens | Optik | Mittelstufe | createConvexLensScene |
| 46 | concave-mirror | Optik | Mittelstufe | createConcaveMirrorScene |
| 47 | convex-mirror | Optik | Mittelstufe | createConvexMirrorScene |
| 48 | echo-ranging | Akustik | Mittelstufe | createEchoRangingScene |
| 49 | buoyancy | Fluid | Mittelstufe | createArchimedesScene |
| 50 | solid-pressure | Fluid | Mittelstufe | createSolidPressureScene |
| 51 | liquid-pressure | Fluid | Mittelstufe | createLiquidPressureScene |
| 52 | atmospheric-pressure | Fluid | Mittelstufe | createAtmosphericPressureScene |
| 53 | thermometer | Thermodynamik | Mittelstufe | createThermometerCalibrationScene |
| 54 | noise | Akustik | Mittelstufe | createNoiseBarrierScene |
| 55 | crystal-melting | Thermodynamik | Mittelstufe | createCrystalMeltingScene |
| 56 | boiling-water | Thermodynamik | Mittelstufe | createBoilingWaterScene |
| 57 | heat-capacity-comparison | Thermodynamik | Mittelstufe | createHeatCapacityComparisonScene |
| 58 | velocity-selector | Kombiniert | Oberstufe | createVelocitySelectorScene |
| 59 | mass-spectrometer | Kombiniert | Oberstufe | createMassSpectrometerScene |
| 60 | composite-eb | Kombiniert | Oberstufe | createCompositeFieldScene |
| 61 | composite-ebg | Kombiniert | Oberstufe | createCompositeFieldScene |
| 62 | multi-region-field | Kombiniert | Oberstufe | createMultiRegionFieldScene |
| 63 | cyclotron | Kombiniert | Oberstufe | createCyclotronScene |
| 64 | induction-bar-motion | Induktion | Oberstufe | createBarMotionScene |
| 65 | transformer | Induktion | Oberstufe | createTransformerBenchScene |
| 66 | induction-double-bar-momentum | Induktion | Oberstufe | createDoubleBarRailScene |
| 67 | induction-double-bar-force | Induktion | Oberstufe | createDoubleBarRailScene |
| 68 | induction-flux-change | Induktion | Oberstufe | createFluxChangeScene |
| 69 | wave-travelling | Welle | Mittelstufe | createTravellingWaveScene |
| 70 | wave-interference | Welle | Oberstufe | createWaveInterferenceScene |
| 71 | wave-standing | Welle | Oberstufe | createStandingWaveScene |
| 72 | wave-longitudinal | Welle | Oberstufe | createLongitudinalWaveScene |
| 73 | wave-reflection-refraction | Welle | Oberstufe | createReflectionRefractionScene |
| 74 | wave-diffraction | Welle | Oberstufe | createDiffractionScene |
| 75 | wave-doppler | Welle | Oberstufe | createDopplerScene |
| 76 | photoelectric-effect | Moderne Physik | Oberstufe | createPhotoelectricEffectScene |

`comingSoon`: Das Vorlagen-Interface deklariert `comingSoon?: true` (`experiment-templates.ts:114`), aber **aktuell ist keines der 76 Modelle gesetzt**,
`SELECTABLE_TEMPLATE_COUNT` = 76 (`experiment-templates.ts:1790`). **Keine "demnächst online" Platzhalter-Experimente.**

---

## 2. Fähigkeitenmatrix pro Experiment

Legende: `E`=Domänen-Engine · `V`=Verifier (Engine-intern `simulate()` Selbstprüfung mit Rückgabe checks) · `O`=Observation-Layer-Beteiligung ·
`R`=Rendering aus Registry `RENDERERS` (`renderer-registry.tsx:1236`) · `TL`=hat Szenario-Zeitlinie (`clock.total>0`) ·
`Ev`=hat physikalische Events · `Ed`=Parameterbearbeitung→Neuberechnung · `Sk`=seek exakt reproduzierbar · `Br`=verzweigbar · `Mo`=Modellvollständigkeitsgrad.
Alle Zeilen `Scene=✔` (alle Vorlagen produzieren echte PhysicsScene).

> Hinweis: `TL=–` bedeutet, dass die Runtime die Zeitlinie explizit mit `total: 0` deaktiviert (meistens Stationär-/Statische Modelle, siehe §3 STATIC-Klasse),
> nicht "Parameter aktualisieren nicht" — diese Experimente haben `Ed=✔`, Parameteränderung löst Neuberechnung und Neuzeichnung aus.

### 2.1 Mechanik-Domäne (24)

| Experiment | E | V | O | R | TL | Ev | Ed | Sk | Br | Mo |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| uniform-linear | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| average-speed | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| uniform-acceleration | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| projectile-horizontal | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| projectile-oblique | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| newton-second-law | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| incline | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| mechanical-energy | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | QUASI_STATIC (Energiebilanz) |
| ramp-friction | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | QUASI_STATIC (Energiebilanz) |
| lever-balance | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | QUASI_STATIC (siehe §5) |
| collision-elastic | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔(Sampling) | ✔ | **FULL_DYNAMIC** |
| collision-inelastic | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔(Sampling) | ✔ | **FULL_DYNAMIC** |
| collision-perfectly-inelastic | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔(Sampling) | ✔ | **FULL_DYNAMIC** |
| vt-area | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| force-composition | ✔ | ✔ | ✔ | ✔ | ? | – | ✔ | ✔ | ✔ | ANALYTICAL/STATIC (unverifiziert) |
| concurrent-equilibrium | ✔ | ✔ | ✔ | ✔ | ? | – | ✔ | ✔ | ✔ | STATIC (unverifiziert) |
| apparent-weight | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| chase-meeting | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔(Sampling) | ✔ | **FULL_DYNAMIC** |
| hooke-law | ✔ | ✔ | ✔ | ✔ | – | – | ✔ | – | ✔ | STATIC (Feder-Gleichgewicht) |
| spring-oscillator | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| circular-orbit | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| simple-pendulum | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| friction-static | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| friction-mu | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |

mechanics läuft über `MechanicsRuntimeBridge` (`mechanics-runtime-bridge.ts`) mit `engine-mechanics`;
collision läuft über `CollisionRuntimeBridge` mit `engine-collision`; energy/lever jeweils eigene Runtime.
observation wird von `mechanics-view-builders.ts` + `physics-observation` bereitgestellt (diese Domäne hat die vollständigste Observation-Anbindung).

### 2.2 Elektrik/Magnetik-Domäne (9)

| Experiment | E | V | O | R | TL | Ev | Ed | Sk | Br | Mo |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| point-charge | ✔ | ✔ | ✔ | ✔ | – | – | ✔ | – | ✔ | STATIC (Coulomb-Felddarstellung, Engine lehnt 1/r²-Bewegung ab) |
| multi-point-charge | ✔ | ✔ | ✔ | ✔ | – | – | ✔ | – | ✔ | STATIC |
| uniform-electric | ✔ | ✔ | ✔ | ✔ | ? | – | ✔ | ? | ✔ | ANALYTICAL/STATIC (unverifiziert) |
| parallel-plate | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| straight-wire-field | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC (stationäres Magnetfeld) |
| solenoid-field | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| electromagnet | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| motor | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| magnetic-circular | ✔ | ✔ | ✔ | ✔ | ✔ | – | ✔ | ✔ | – | ANALYTICAL (analytischer Kreis) |

electric läuft über `electric-workspace-runtime` (`engine-electric` + `engine-electric-region`);
die vier current-Experimente laufen über `current-workspace-runtime` (`engine-magnetic` CurrentFieldEngine, `total:0`);
magnetic-circular läuft über `physics-runtime-bridge.ts` (`engine-magnetic` MagneticEngine).
`magnetic-circular` **kein Branching** (`branch=0`, `magnetic-workspace-runtime.ts` bindet `forkExperimentalScene` nicht ein).

### 2.3 Schaltkreis/Optik/Akustik/Fluid (17)

| Experiment | E | V | O | R | TL | Ev | Ed | Sk | Br | Mo |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| series-circuit | ✔ | ✔ | – | ✔ | ~ | – | ✔ | ✔ | ✔ | QUASI_STATIC (DC-Arbeitspunkt) |
| parallel-circuit | ✔ | ✔ | – | ✔ | ~ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| mixed-circuit | ✔ | ✔ | – | ✔ | ~ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| short-circuit | ✔ | ✔ | – | ✔ | ~ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| rheostat-circuit | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | QUASI_STATIC (Schiefer-Draht-Scan) |
| va-resistance | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| bulb-power | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| emf-measurement | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | QUASI_STATIC |
| pinhole | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC (geometrische Optik) |
| total-reflection | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| plane-mirror | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| convex-lens | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| concave-mirror | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| convex-mirror | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC |
| echo-ranging | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL（Hin-und-Rück-Kinematik） |
| buoyancy | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL（Sinken/Schwimmen） |
| noise | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC（Schallpegel-Logarithmus） |

`TL=~`: circuit-Zeitlinie ist **Schleifwiderstand-Scan** (`circuit-workspace-runtime.ts:10-11,412`),
Ohne Schleifwiderstand kann `endTime` der Schaltung 0 sein → Transportsteuerelemente werden deaktiviert (nicht pro Schaltung verifiziert, markiert `nicht verifiziert`).
circuit/optics/acoustics(noise) sind alle **nicht an Observation** Layer angebunden.

### 2.4 thermal / composite / induction / wave / modern（26 Stück）

| Experiment | E | V | O | R | TL | Ev | Ed | Sk | Br | Mo |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | --- |
| thermometer | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC（Kalibrierung） |
| crystal-melting | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL（Stückweise Heizkurve） |
| boiling-water | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| heat-capacity-comparison | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| velocity-selector | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| mass-spectrometer | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| composite-eb | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| composite-ebg | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL |
| multi-region-field | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL（Stückweise Kinematik） |
| cyclotron | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ANALYTICAL（Ideales Beschleunigungslücken-Modell） |
| induction-bar-motion | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL（E=BLv） |
| transformer | ✔ | ✔ | – | ✔ | – | – | ✔ | – | ✔ | STATIC（Windungsverhältnis） |
| induction-double-bar-momentum | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL（Exponential e^{−t/τ}） |
| induction-double-bar-force | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| induction-flux-change | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL（E=−dΦ/dt） |
| wave-travelling | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL（y=A·sin(2π(x/λ−ft))） |
| wave-interference | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| wave-standing | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| wave-longitudinal | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| wave-reflection-refraction | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| wave-diffraction | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| wave-doppler | ✔ | ✔ | – | ✔ | ✔ | – | ✔ | ✔ | ✔ | ANALYTICAL |
| photoelectric-effect | ✔ | ✔ | – | ✔ | – | – | ✔ | – | – | ANALYTICAL（Ein-Photon-Gleichung, statische Kurve） |

composite ist der hochrangigste Domain mit der vollständigsten Observation-Verkabelung; wave/induction/thermal/modern sind alle nicht an Observation angebunden.
`photoelectric-effect` **keine Zweige** (`branch=0`).

### 2.5 Fähigkeitenübersicht

- **Mit Szenario-Zeitlinie (`total>0`, Run verfügbar)**: ca. **46** (mechanics Bewegungsart 14 + collision 4 + lever 1 +
  parallel-plate 1 + magnetic-circular 1 + circuit 4~8 + echo 1 + buoyancy 1 + thermal 3 + composite 6 +
  induction 4 + wave 7).
- **Ohne Zeitlinie (`total=0`, stationär/statisch, Run deaktiviert)**: ca. **25** (siehe §3 STATIC-Liste).
- **Mit Physik-Ereignissen**: projectile(2), collision(1 Gruppe), lever, echo, buoyancy, thermal(3), composite(6). Übrige `events: []`.
- **Observation-Layer-Beteiligung**: mechanics, electric, composite, magnetic (4/12 Domänen). circuit/optics/wave/induction/thermal/fluid/acoustics/modern nicht angebunden.
- **Zweige**: Außer `magnetic-circular`, `photoelectric-effect` unterstützen alle Runtimes via `forkExperimentalScene` (`experimental-branch.ts`).

---

## 3. Fehlerklassifikation (inkl. file:line)

### 3.1 `STATIC_DEMO` (Geometrie gezeichnet, Parameter aktualisieren nicht) — **0 Stück**

Vollprüfung: Alle 21 Runtimes implementieren `editParameter → sceneCommand → recompute → getSnapshot`
(`lever-workspace-runtime.ts:420`, `circuit-workspace-runtime.ts:582`, `electric-workspace-runtime.ts:604` …).
`total=0` Experimente sind **kein** STATIC_DEMO — Parameteränderung geht durch echte Befehle, neu berechnen und neu zeichnen, nur das Modell selbst ist zeitunabhängig.
**Keine „gezeichnet aber nicht aktualisiert“ Experimente gefunden.**

### 3.2 `VISUAL_ONLY_ANIMATION` (CSS/RAF/lokaler Status getrieben, dahinter kein Engine-Zustand) — **1 (Physik-Vortäuschung)**

- **lever-balance**: Neigungswinkel ist keine Dynamik-Lösung, sondern **lineare Anzeige-Rampe** im Engine-Inneren
  `tilt = sign · MAX_TILT_RADIANS · min(t/TIP_DURATION, 1)` (`packages/engine-lever/src/statics.ts:78-79`),
  Datei-Kopf selbstbeschreibend: „no moment of inertia and no angular acceleration — junior statics, not a rigid-body integrator"
  (`statics.ts:8-9`). UI lässt „Run“ diese Rampe abspielen, visuell **vortäuschend** Rotationsdynamik. Siehe §5.

Übrige `time`-Verwendungen in Renderern sind rein **dekorativ** und phasengesperrt an Szenariozeit, keine Physik-Vortäuschung:
- Stromrichtungs-Punktstrich-Animation (`circuit-renderer.tsx:887`, `induction-renderer.tsx:365`);
- Heizgerät-Label-Phasenblinken `(time??0)*7.1` (`thermal-renderer.tsx:45`).
Diese drei Stellen sind akzeptables visuelles Chrome; Empfehlung: im Bericht einzeln aufführen, nicht als Fehler zählen.

### 3.3 `HARDCODED_PHYSICS` — **0 „versteckte Ergebnisse“; 3 Stellen beachten**

Kriterium: Unterscheidung „legitime Konstanten / Modellparameter / UI schummelt Physik-Ergebnisse“. Ganzes Repo grep (`9.8 / 9.81 / 1.6e-19 / 6.67e-11 / 340 / 343`) Ergebnis:

| Position | Wert | Urteil |
| --- | --- | --- |
| `packages/engine-modern/src/photoelectric-model.ts:5-7` | h、c、e | **legitime CODATA-2019 exakte Konstanten** |
| `packages/engine-magnetic/src/current.ts:23` | μ₀=4π×10⁻⁷ | **legitime SI-definierte Konstante** |
| `packages/engine-mechanics/src/orbit.ts:17` | GM=3.986004418e14 | **legitim (Erde GM)** |
| `packages/engine-mechanics/src/models/model-resolvers.ts:26` | `vec3(0,−9.8,0)` Fallback | **Modellparameter (stillschweigender Default)**: nur wirksam, wenn Szene `uniform_gravity` Feld fehlt |
| `experiment-templates.ts:127` `const g=9.8`；`:919/1411/1440/1467/1489/1515` `charge:1.6e-19` | 9.8 / e | **Modellparameter/legitime Konstanten** (als Szenen-Seed an Engine übergeben) |
| `physics-runtime-bridge.ts` / `prototype/magnetic-scene.ts` | `1.6e-19 / 1.67e-27` | **legitime Konstanten** (Elektronenladung, Protonenmasse, Seed-Werte) |
| `mechanics-view-builders.ts:255` | `: 9.8` (Fallback g ohne Gravitationsfeld) | **UI-seitiger Modellparameter-Default** (sekundär; nur Anzeige, zurück zur Engine) |
| `mechanics-view-builders.ts:758` | `const gravity = Math.hypot(m.gravity.x,m.gravity.y) || 9.8; const apexTime = vy0/gravity` | **UI rechnet Physik**: View-Builder berechnet selbst „Höchstpunkt“-Ereigniszeitpunkt, Engine gibt kein solches Event aus |
| `experiment-summaries.ts:332` | Text fest „9.8 N fällt auf 5.88 N“ | **Hardcoded Result in Lehrtext** (Dokumentationskonstante, Drift gegen Default-Szene verhindern) |

**„UI schummelt Physik“ trifft 1 Stelle**: `mechanics-view-builders.ts:758` (Apex-Zeitpunkt).
**„Versteckte hardcoded Ergebnisse“ trifft 0 Stellen** — Engine versteckt keine Ergebnisse, Verifizierer rechnet unabhängig neu (z. B. `lever-engine.ts:152-153,172-177`).

### 3.4 `FAKE_VERIFIED` — **Keine reproduzierbaren hardcoded Fake-Badges gefunden; 1 Architekturrisiko vorhanden (P1)**

- **Provenienz-Vertrag existiert real und ist korrekt**: `packages/physics-core/src/provenance.ts` definiert `VerifiedQuantity` + Evidenz-Ableitung
  `deriveVerificationLevel` (`:134-156`, Evidenz leer → `ENGINE_COMPUTED`, **niemals Default „verifiziert"**),
  sowie Gate `assertVerifiedPhysicsOutput` (`:376-386`, Default-Schwelle `ENGINE_COMPUTED`, wirft bei Nichterfüllung `UnverifiedPhysicsOutputError`).
- **Gate nur an Agent-Tool-Grenze angebunden, nicht an Render-Pfad**: Ganze Repo Aufrufstellen nur
  `packages/agent-tools/src/physics-tool-runtime.ts:305` (via `:593/:774/:874`) sowie Tests;
  **UI-Overlay `ui-physicsos/**` ohne jeglichen Aufruf**.
- **UI-Verifizierungsurteil kommt aus String, nicht Rückschluss auf Evidenz**: `physics/verified-result.ts:67-70` `LEVEL_BY_STATUS` mappt
  `'passed'/'passed_with_warnings'` direkt auf `'physics-verified'`, **prüft nicht checks / revision / Evidenz**;
  `PhysicsWorkspace.tsx:377-382` Status-Label gleichermaßen aus `snapshot.status` (= `simulation.verification.status` String).
  Datei selbst bezeichnet sich als Platzhalter für kanonischen Vertrag (`verified-result.ts:1-14`).
- **Risikopfad**: Engine `validate()/canHandle` gibt `{status:'passed', checks:[]}` zurück
  (z. B. `engine-acoustics/src/acoustics-engine.ts:269`, `engine-noise:319`, `engine-fluid:329` etc.),
  `summarizeVerification` (`packages/physics-core/src/verification.ts:94-97`) wertet „leere checks“ als `'passed'`.
  Falls dieser Status die UI-Status-Naht erreicht, zeigt Badge „Engine verifiziert“ bei **null checks**.
  Ist-Zustand: `simulate()` überschreibt diese Platzhalter (z. B. `engine-electric.ts:465→477`), **Erreichbarkeit nicht bestätigt**, daher als Risiko gelistet, nicht als Diagnose.
- **Fazit**: `FAKE_VERIFIED` (diagnostiziert) = **0**; **Architekturrisiko = 1** (P1, siehe P0/P1 Liste).
  Außerdem: `VerifiedResult.tsx` nur für Session `SceneChatCard`, gleiche Urteil-Mode wie Lab.

### 3.5 `FAKE_RUNTIME` (neue Kategorie) — **Diagnostiziert 0; angrenzend 2 Typen**

Kriterium: Run klickbar aber spielt nur CSS/lokalen Status, Timeline nicht Szenariozeit, Seek kann Physikzustand nicht rekonstruieren.

- **Diagnostiziert 0**: Shell setzt für `clock.total<=0` Experimente Play/Pause/Schritt/Reset/Zeitlinie alle auf `disabled`
  (`PhysicsWorkspace.tsx:620,633,643,654,880`), **kein** „klickbar aber leerlaufender“ Runner.
- **Angrenzend A (Modell vortäuscht Dynamik, 1)**: `lever-balance` „Run“ spielt Anzeige-Rampe, nicht `τ=Iα`, siehe §3.2/§5.
  Einordnung als `VISUAL_ONLY_ANIMATION`+`MODEL_COMPLETENESS` Fehler ist präziser.
- **Angrenzend B (gleiche Toolbar aber halbe Controls deaktiviert, systemisch ≈25)**: Shell rendert **bedingungslos** komplettes Transport + Timeline
  (`PhysicsWorkspace.tsx:616-662` und `:875-938`), `total=0` Experimente ganze Control-Zeile sichtbar aber grau.
  Owner: „Alle Experimente haben gleiche Toolbar, halbe Buttons nutzlos“ — **das ist der Beweis** (zählt als UI-Ehrlichkeitsfehler, P1).
- **Seek präzise rekonstruierbar**: magnetic/mechanics/lever/electric-region/composite/induction/thermal/wave/circuit/acoustics/fluid
  nutzen **geschlossene Neuberechnung** (`physics-runtime-bridge.ts:1028,1130`, `lever-workspace-runtime.ts:225`), seek präzise;
  collision nutzt **Sampling Nearest Neighbor** (`trajectoryTimes` + `nearestTimedStateIndex`, `animation-clock.ts:45`), approximative Rekonstruktion.
  Statische Domänen `seek` ist no-op (`optics-workspace-runtime.ts:580`, `modern:178`).

### 3.6 `MODEL_COMPLETENESS` (neue Dimension) — Pro-Experiment-Level (Matrix `Mo` Spalte)

- **FULL_DYNAMIC_MODEL (einziger echter Integrator)**: `engine-collision` nutzt halbbimpliziten Euler `v+=g·dt; x+=v·dt` +
  Impulskontakt (`collision-solver.ts:171-175,128-152`, `DEFAULT_DT=1/120`).
  Trifft **4**: collision-elastic / collision-inelastic / collision-perfectly-inelastic / chase-meeting.
- **ANALYTICAL_MODEL (geschlossene echte Physik, nach t lösend)**: mechanics Bewegungsart, parallel-plate, magnetic-circular,
  composite(6), induction(4), wave(7), echo, buoyancy, thermal Heizung(3), photoelectric. **≈ 46**.
- **QUASI_STATIC_MODEL**: lever-balance (Drehmomentgleichgewicht + Anzeige-Rampe), circuit(8) (DC-Arbeitspunkt + Schleifwiderstand-Scan),
  mechanical-energy / ramp-friction (Energiebilanz). **≈ 11**.
- **STATIC_EQUILIBRIUM_MODEL** (zeitunabhängige stationäre/statische): point-charge / multi-point-charge,
  current(4), optics(4)+light(2), pressure(3), thermometer, transformer, noise. **≈ 15**.
- **VISUAL_DEMO_ONLY**: **0** (jedes Experiment geht durch mindestens eine echte Engine).

**UI-Ehrlichkeit**: Statische/quasi-statische Experimente meist **ehrlich Zeitlinie deaktiviert und im Code-Kommentar Grund genannt**
(`current-workspace-runtime.ts:11`, `energy-workspace-runtime.ts:11`, `light:10`, `noise:10`,
`pressure:11`, `thermometer:10`, `transformer:10`) — das ist richtig gemacht.
**Einzige Unehrlichkeit ist lever**: Modell ist `STATIC_EQUILIBRIUM`, aber Frontend spielt **vortäuschende Rotationsdynamik** ab.

---

## 4. Architekturfazit (punktweise Beantwortung)

Zielkette: `PhysicsScene → Scene Runtime → Engine → Verifier → Observation → SceneVisualModel → Renderer`

1. **Einheitliche `PhysicsWorkspace`/`WorkspaceRuntime`?**
   **Shell einheitlich, Runtimes 21 Stück, keine gemeinsame Basisklasse.** Einzige Shell `PhysicsWorkspace.tsx` (Selbstbeschreibung „the one physics workspace")
   + einzige Canvas `PhysicsCanvas.tsx` + einziger Dispatcher `LabWorkspace.tsx:337 buildWorkspaceRuntime`.
   Aber **keine** einheitliche `WorkspaceRuntime` Implementierung: `workspace-runtime.ts:63` ist nur **Interface**,
   21 `*-workspace-runtime.ts` jeweils `implements`, jeweils wiederholen `command<T>()` und `seek/step/advance`
   (kein `extends`). `LabWorkspace.tsx:337-412` nutzt einen großen `switch` nach Domain+Bench zur Dispatch.
   → **Fazit: Nicht „ein Runtime“, sondern „ein Interface + 21 Implementierungen“.** Keine feineren per-Experiment Workspace-Seiten gefunden (Owner-Befürchtung unbegründet).

2. **Renderer-Registry + `canRender/buildVisualModel/render` Vertrag?**
   **Registry existiert, aber Vertrag sind nicht jene drei Methoden.** `RENDERERS` (`renderer-registry.tsx:1236`) mit
   `SceneVisualModel['domain']` als Key registriert **11** React-Komponenten; Vertrag ist `RendererProps`
   (`:113`: `{view, projection, time?, ...}`). `canRender/buildVisualModel/render` drei Namen **im ganzen Repo nicht existent**.
   `PhysicsCanvas.tsx:332` holt Renderer via `RENDERERS[view.domain]`. Multi-Bench-Domains in Registry **erneut verzweigt**
   (magnetic→current, mechanics→lever/energy, optics→light, thermal→thermometer, induction→transformer etc.).
   → **Registry ja, aber Eintrittsvertrag ist „React-Komponente konsumiert IR“, nicht Owners vorgesehene drei Methoden.**

3. **Gibt es `SceneVisualModel` Zwischenschicht?**
   **Ja, und es ist echtes IR.** `scene-visual-model.ts` (1890 Zeilen) Selbstbeschreibung: „einzige Eingabe die Renderer konsumieren, importiert nie Engine";
   `SceneVisualModel` (`:1515-1720`) = Domain + Viewport + shared Primitive-Arrays (bodies/particles/vectors/trajectories…)
   + ~60 optionale per-bench Felder (circuitComponents/opticalRays/leverBeam…).
   **Alle Renderer konsumieren nur `SceneVisualModel`, keiner direkt Engine/Runtime-Output** (nur `circuit-renderer.tsx:17`
   importiert reinen Geometrie-Helper `circuitTerminalPoint`). → **Kein `PhysicsScene → SVG/JSX` Direktanschluss.**

4. **Gibt es `SimulationClock` (play/pause/step/seek/reset/speed)?**
   **Keine `SimulationClock` Klasse.** Uhr = `PlaybackClock` **Dateninterface** (`scene-visual-model.ts:1846`:
   time/total/running/rate) + rAF-getrieben `useAnimationClock` (`animation-clock.ts:69`) + jeweilige Runtime private
   `currentTime/running/rate` Felder. Transport-Controls in Shell (play/pause/step±/reset=seek(0)/speed=setRate).
   **Präziser Seek**: geschlossene Domänen **können** (Neuberechnung state at t); collision **approximativ** (Sampling Nearest Neighbor); statische Domänen no-op.
   → **Keine einheitliche Uhr-Abstraktion, keine `reset()` Methode (reset ist seek(0)).**

5. **Vermittelt Observation Engine-Output?**
   **Teilweise.** `packages/physics-observation` hat 7 Module (circuit/composite/electric/induction/mechanics/optics/wave),
   aber UI nutzt nur **mechanics / electric / composite / magnetic** (via `physics-runtime-bridge.ts`);
   **circuit/induction/optics/wave Observation-Module existieren aber nicht an UI verkabelt**, thermal/fluid/acoustics/modern ohne observation.
   → **Observation nur in 4/12 Domänen vermittelnd, übrige UI liest direkt Runtime `SceneVisualModel`.**

6. **Einheiten via `physics-units`?**
   **Szene/Engine-Layer ja.** `physics-scene` durchgängig `Quantity<'length'>` etc. (`scene.ts:105-107`),
   Engine nutzt `quantity()`. **Aber UI-Brücken-Layer hat doppelte Anzeige-Umrechnung**: `cm = m*100` in **7 visual-bridges** je einmal geschrieben
   (`fluid-visual-bridge.ts:31`, `lever:31`, `current:65`, `thermometer:28`, `pressure:56`, `light:35`, `energy:37`),
   `composite-visual-bridge.ts:492 scaleLength*100`, `electric-visual-bridge.ts:525`, `wave-visual-bridge.ts:372-375`.
   `lever-workspace-runtime.ts:110-111 cmOf/nCmOf` analog. → **Einheitswerte selbst korrekt, aber Umrechnungslogik nicht zentralisiert, ~10 Stellen doppelt (Wartbarkeitsrisiko).**

7. **world→viewport Transformation zentralisiert?**
   **Zentralisiert.** `PhysicsCanvas.tsx:192-211` stellt einheitlich `px/py/sx/sy/scale/path` bereit (Selbstbeschreibung „einzige flip y Stelle"),
   Renderer ruft nur `projection.px/py` auf. **Keine `x*100+50` Art verstreute Literale gefunden** (Renderer-intern `0.5*scale`, `dialFraction*100`
   ist eine legitime Nutzung von `projection.scale`).

8. **Ist Timeline ein Videofortschrittsbalken oder eine Physik-Ereigniszeitachse?**
   **Physik-Ereigniszeitachse (mit benannten Ereignissen).** `TimelineMarkers` (`workspace-parts.tsx`) liest `snapshot.events`
   (`TimelineEvent{id,time,label,kind}`), z. B. projectile „Start/Höchstpunkt/Aufprall“, lever „Hebelgleichgewicht/Beginn Neigung/Neigung erreicht“,
   composite/echo/buoyancy/thermal haben alle benannte Ereignisse, per Klick ansteuerbar (`onSeek`). **Ereignisbasierte Experimente sind Ereignisachsen; Domänen ohne Ereignisse degenerieren zu reinen Scrubbern.**

9. **Label/Pfeil-Kollisionsvermeidung?**
   **Ja.** `vector-label-layout.ts` (142 Zeilen) löst Kollisionen im Bildschirmraum, schiebt entlang der Pfeilrichtung, blendet >15 px Führungslinien ein,
   aufgerufen über `primitives.tsx:657` (`Vectors`).

10. **Schmale Breite Responsiv?**
    **Ja, JS-getriebenes Responsiv-Verhalten.** `PhysicsCanvas.tsx:150-184` nutzt `ResizeObserver` für viewBox,
    setzt für Zeichenbereich `Math.max(120,…)/Math.max(90,…)` als Untergrenzen, `scale=min(sx,sy)` zur Seitenverhältniswahrung;
    `ResponsiveInspector.tsx` steuert Seitenleisten-Schublade/Tab-Umschaltung. Das einzige `@media` im Physics-CSS ist `prefers-reduced-motion`
    (`PhysicsCanvas.module.css:259`, `primitives.module.css:246`) — **keine Breiten-Breakpoints**, Breitenanpassung läuft vollständig über JS.

---

## 5. Hebel-Spezialfall (Owner-Screenshot-Beispiel)

**Frage: Werden Drehmoment/Kraftarm/Gleichgewicht in der Engine berechnet oder hardcodiert gezeichnet? Antwort: Drehmoment wird von der Engine berechnet; Rotation ist KEINE Dynamik, sondern eine Anzeige-Rampe.**

Ist-Zustand (datei:zeile):

- **Drehmoment/Kraftarm/Gleichgewicht = echt Engine-berechnet**: `resolveLeverModel` (`engine-lever/src/lever-model.ts:62`, verlangt je einen Hakengewicht pro Drehpunkseite);
  `momentsOf` (`statics.ts:50-63`) berechnet `leftWeight=m·g`, `leftMoment=leftWeight·arm`, `netMoment=links−rechts`,
  `balanced=|netMoment|≤1e-9·scale`, also Lehrbuch `F₁l₁=F₂l₂`. Gravitation g wird **aus der Szene gelesen** (`lever-model.ts:74-78`), nicht hardcodiert.
- **Rotation = nicht-physikalisch**: `leverStateAt` (`statics.ts:72-83`) ist eine **lineare Anzeige-Rampe**
  `tilt = sign·MAX_TILT_RADIANS·min(t/TIP_DURATION,1)`; `MAX_TILT_RADIANS=18°`, `TIP_DURATION=0.6`,
  `HOLD_DURATION=0.6` sind alles **Animations/Anzeige-Modellparameter**. Datei selbst notiert „kein Trägheitsmoment, keine Winkelbeschleunigung“ (`statics.ts:8-9`),
  `stateOf` kommentiert tilt ebenfalls als „Darstellung des Drehmomentunterschieds“ (`lever-engine.ts:208-210`).
- **UI↔Modell**: `lever-workspace-runtime.ts` nutzt `LeverEngine.simulate()` (`:143`), Parameterbearbeitung läuft über echte Befehle
  `SetHangerMass/SetHangerArm` (`:427,439`), Checks-Tabelle siehe `:77-92` (u. a. `weight_from_mass`, `moment_from_force`,
  `moment_balance`). `chartsOf` zeichnet θ–t (`:533-552`). UI-Seite hat `cmOf/nCmOf` für Einheitenumrechnung (`:110-111`).
- **Beurteilung**: Modell = `STATIC_EQUILIBRIUM_MODEL` (Drehmomentgleichgewicht) + ein Stück **vorgegebene Rotationsdynamik** als Anzeigerotation.
  Also: **Zahlenphysik (Drehmoment/Gleichgewicht) korrekt und verifizierbar; Bewegungsvisualisierung unehrlich** — sie lässt „ungleichgewichtete Hebel“ gleichmäßig linear auf 18° drehen und stoppen,
  statt `τ=Iα → ω(t) → θ(t)` konvergieren zu lassen.
- **Fix-Richtung (nicht in dieser Umsetzung)**: Entweder **ehrlich kennzeichnen** („Ausführen“ in „Neigungstendenz anzeigen“ umbenennen und im UI vermerken, dass es ein Anzeigemodell ist);
  oder **echte Dynamik nachrüsten**: `τ=Iα`, `ω(t)`, Dämpfung und Abbruchkriterien (θ an Anschlag/Kontaktfläche) einführen und `I` als Modellparameter bereitstellen.

---

## 6. Pro-Experiment-Einstufung

**„Complete“-Definition (Owner-Neudefinition)**: Scene / Engine / Observation / Renderer / Parameter veränderbar / Einheiten korrekt /
Laufzeit-Sync / Verifier **alle PASS**, und **die deklarierten Fähigkeiten** (timeline/seek/measurement/branch) **allesamt real vorhanden**.

Nach dieser Definition **erreicht kein Experiment `Complete`** — Hauptlücken sind **Observation nicht vollständig verdrahtet** und **keine Messwerkzeuge**.
Einstufungsergebnis:

| Stufe | Kriterium | Treffer |
| --- | --- | --- |
| **Complete** | Alle 8 Punkte + deklarierte Fähigkeiten alle echt | **0** |
| **Good** | Scene/Engine/Verifier/Renderer/Parameter/Einheiten/Sync alle PASS, deklarierte Fähigkeiten echt, nur Observation/measurement fehlt | collision(4), mechanics Bewegungs-Typen, composite(6), induction(4), wave(7), echo, buoyancy, thermal(3), electric Bewegungs-Typen |
| **Needs Work** | Echte Engine, aber Ehrlichkeits/Vollständigkeitslücken | **lever-balance** (Modell gibt Dynamik vor), **circuit(8)** (Quasi-statisch aber Timeline wie Bewegung), statische Domänen mit „Controls disabled aber gleiche Toolbar“, `mechanics-view-builders.ts:758` apex-Heimliche-Berechnung |
| **Critical** | Fake-Daten/Fake-Animation/UI rechnet Physik/fake verified/Timeline out-of-sync | **0** (nicht diagnostiziert) |

**Acht-Dimensionen-Bewertung (kurz)**: Physikalische Korrektheit überwiegend **Good** (Engines geschlossen formuliert und unabhängig verifiziert); Animationsherkunft **Needs Work→Good**
(außer lever alle aus Engine-Zustand); Interaktion **Good** (Parameterbearbeitung, Schalter, Slider, Drag besser als die meisten Produkte);
Messung **Critical/fehlt** (keine Messschieber/Winkelmesser-Interaktionsmessung, nur abgeleitete Größen-Tabellen); Visualisierung **Good** (geteilte Primitiven +
Label-Vermeidung + Ereignismarker); Timeline **Needs Work** (keine Ereignisdomäne nur Scrubber, und `total=0` Domänen Controls disabled);
Verifikation **Needs Work** (Badge aus String, Gate nicht an Renderpfad angebunden); Barrierefreiheit **Good** (aria-label, Tastatur-Play,
`prefers-reduced-motion`, `role=alert`).

---

## 7. Vorgeschlagene `ExperimentCapabilities`-Liste (reale Fähigkeiten, keine Vision)

Für jedes Experiment soll eine **faktische** Fähigkeitsdeklaration erzeugt werden, damit die Shell Controls danach ein-/ausblendet (statt pauschal gleiche Toolbar). Beispiel:

```ts
// Reale Fähigkeiten (Wert = Audit-Befund des Ist-Zustands, nicht Soll-Zustand)
{ id: 'lever-balance',
  model: 'quasi-static',              // Drehmomentgleichgewicht + Anzeigerampe, nicht dynamic
  timeline: true, seek: true, replay: true, editable: true,
  measurable: false, branchable: true, verifiable: true,
  observations: ['moments', 'arms'],
  measurements: [] }

{ id: 'series-circuit',
  model: 'static',                    // DC-Arbeitspunkt
  timeline: false, seek: false, replay: false, editable: true,
  measurable: false, branchable: true, verifiable: true,
  observations: [], measurements: [] }

{ id: 'collision-elastic',
  model: 'dynamic',                   // Einzige echte Integrations-Klasse
  timeline: true, seek: true /*Sampling*/, replay: true, editable: true,
  measurable: false, branchable: true, verifiable: true,
  observations: [], measurements: [] }
```

**Soll explizit kennzeichnen: „Angezeigt, aber dahinter keine echte Fähigkeit“** (das ist der Owner-genannte „gleiche Toolbar“-Befund):
- Alle `model: 'static'` ≈25 Experimente: **Play/Pause/Step/Reset + ganze Timeline-Zeile sichtbar aber disabled**
  (`PhysicsWorkspace.tsx:616-662,875-938` bedingungslos gerendert; `:620,633,643,654,880` per `clock.total<=0` deaktiviert).
  Empfehlung: Nach `ExperimentCapabilities.timeline` **ausblenden** statt deaktivieren, vermeidet „Reihe nutzloser Buttons“.
- `branchable:false` bei zweien (magnetic-circular, photoelectric-effect): **Branch-Badge/Restore-Entry** für sie nie erreichbar.
- `measurable:false` bei allen: **Keinerlei interaktive Messwerkzeuge** (Repo-weit `measurementDefinitions` nur in Scene/Factory/Test vorhanden,
  UI keine Messwerkzeug-Komponente) — falls Owner „measurement“ als deklarierte Fähigkeit führt, **deklarieren jetzt alle Experimente Fake-Fähigkeiten**.

---

## 8. P0 / P1 / P2

### P0 (Falsche Physik / Fake-Daten / Fake-Animation / UI rechnet Physik / Timeline out-of-sync / Fake verified)

| # | Punkt | Beleg | Erläuterung |
| --- | --- | --- | --- |
| P0-1 | **lever nutzt Anzeigerampe als vorgetäuschte Rotationsdynamik** | `engine-lever/src/statics.ts:8-9,72-83`; `lever-workspace-runtime.ts:225` | Modell ist statisches Gleichgewicht, doch „Ausführen“ spielt lineare Rotation ab, visuell gleich Fake-Dynamik. **Einzige bestätigte „Fake-Animation“.** |
| P0-2 | **Verifikations-Gate nicht an Renderpfad angebunden** (Fake-verified-Risiko) | `physics-core/src/provenance.ts:376` wird nur in `agent-tools/src/physics-tool-runtime.ts:305` aufgerufen; UI `verified-result.ts:67-70` urteilt nur nach String | Badge kann allein durch Engine-Status-String leuchten, ohne Evidenz zurückzuverfolgen; leere Checks mit `'passed'` theoretisch erreichbar. `assertVerifiedPhysicsOutput`/Evidenz-Rückführung in UI-Entscheidung einbinden. |
| P0-3 | **UI rechnet Physik (apex-Zeitpunkt)** | `physics/mechanics-view-builders.ts:758` | View-Builder berechnet selbst `apexTime=vy0/g` für Timeline-Events, umgeht Engine/Event-Vertrag. |

> P0 Anzahl: **3**. Streng genommen „Fake-Daten/Fake-Animation“ nur P0-1 bestätigt; P0-2 hohes Architektur-Risiko, P0-3 Kompetenzüberschreitung.

### P1 (Echte Animation / Messung / Timeline / Kraftvektoren / Feldvisualisierung / Inspector)

| # | Punkt | Beleg |
| --- | --- | --- |
| P1-1 | **Einheitliche Toolbar, Hälfte Controls disabled** (Ehrlichkeit) | `PhysicsWorkspace.tsx:616-662,875-938` bedingungslos gerendert; `total=0` Domänen disabled |
| P1-2 | **Observation-Layer nicht vollständig verdrahtet** | `physics-observation/src/{circuit,induction,optics,wave}-observation.ts` existieren, UI nutzt nicht (nur mechanics/electric/composite/magnetic) |
| P1-3 | **Keine interaktiven Messwerkzeuge** | Repo-weit keine Messwerkzeug-Komponenten; `measurementDefinitions` nicht von UI konsumiert |
| P1-4 | **Welt-Einheitenumrechnung ~10-fach dupliziert** | 7 `*-visual-bridge.ts` schreiben jeweils `cm=m*100` etc. |
| P1-5 | **`total=0` Domänen seek no-op nicht im Schema als Fähigkeit deklariert** | `optics-workspace-runtime.ts:580`, `modern:178` |
| P1-6 | **UI-seitiges g-Fallback 9.8** | `mechanics-view-builders.ts:255` (sekundär) |

### P2 (Notebook / Branch-Vergleich / Challenge / Teilen)

| # | Punkt | Beleg |
| --- | --- | --- |
| P2-1 | Lehrtexte hardcodieren Ergebnisse, driftgefährdet | `experiment-summaries.ts:332` („9.8 N → 5.88 N“) |
| P2-2 | Branch-Vergleich (zwei Szenen nebeneinander) fehlt | Nur `forkExperimentalScene` Single-Branch-Restore, kein Vergleichs-UI |
| P2-3 | Challenge/Scoring-Modus fehlt | Selbsttest ist Aufgabenpool-Auswahl (`experiment-self-checks.ts`), keine Challenge-Level |
| P2-4 | Teilen/Export nur CSV | `export-csv.ts`; keine Share-Links/Report-Export |
| P2-5 | Kein pro-Experiment `ExperimentCapabilities` Manifest | (§7 Neuanlage empfohlen) |

---

## 9. Nicht-verifizierte Liste (ehrliche Erklärung)

- `force-composition / concurrent-equilibrium / uniform-electric` `clock.total`: In Matrix `TL` mit `?` markiert, **nicht einzeln bestätigt**.
- Circuit-Schaltungen (ohne Schiefer) `endTime` gleich 0: **nicht pro Schaltung bestätigt**.
- Leere Checks `'passed'` erreichen **wirklich** die UI-Statuslücke: **Erreichbarkeit nicht bestätigt** (als Risiko geführt).
- Je Experiment `observations/measurements` Feldwerte **pro Experiment**: nur per Domain/Bridge Stichprobe bestätigt, nicht pro Experiment geprüft.
- App/Tests nicht ausgeführt; kein Pixel-genauer visueller Abgleich (Owner explizit „erst Scan“).

---

## 10. Fazit

- Owners Urteil **teilweise zutreffend**: Dies ist **NICHT** „Statische Bilder / einfache Animationen / UI-Demo“ —
  76 Experimente **alle** haben echte Scene Factory, laufen durch echte Engine, Parameterbearbeitung über echte Befehle und sind neu berechenbar, die meisten auch mit echter Verifikation und Ereignisachse.
- Aber es **wirkt tatsächlich wie UI**, Kernursachen sind drei: **(1) Einzige echte Dynamik nur collision, Rest überwiegend geschlossen/quasi-statisch/statisch**;
  **(2) Einzige vorgetäuschte Dynamik ist levers Fake-Rotation**; **(3) Shell rendert für alle Experimente identischen Transport, `total=0` bei ≈25 Experimenten
  Controls alle grau** — „gleiche Toolbar, halbe Buttons nutzlos“ sitzt genau hier.
- Höchste Priorität ist nicht „Animation nachrüsten“, sondern **① levers Modellehrlichkeit fixen ② provenance-Gate in Renderpfad einbinden
  ③ Controls nach realen Fähigkeiten ein-/ausblenden ④ Observation/Messung vervollständigen**.
