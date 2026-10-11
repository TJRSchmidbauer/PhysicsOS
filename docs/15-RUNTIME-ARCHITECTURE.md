# 15. Runtime-Architektur

> Datei: `docs/15-RUNTIME-ARCHITECTURE.md`
> Hinweis zur Nummerierung: `06` ist bereits von `06-UI-DESIGN-SYSTEM.md` belegt. Um bestehende Dokumente nicht umzunummerieren,
> nimmt dieses Dokument die nächste freie Nummer `15`.

Dieses Dokument beschreibt die vollständige Laufzeitkette von PhysicsOS vom „einen physikalischen Szenario“ bis zur „Oberfläche, die der Schüler sieht“,
sowie was jede Schicht **nicht** tun darf. Beim Hinzufügen neuer Physikdomänen (Elektrisches Feld / Schaltkreis / Optik) richtet man sich nach diesem Dokument
und legt keine parallelen Strukturen an.

---

## 1. Gesamtbild

```text
                    ┌──────────────────────────────┐
                    │  Question Pipeline           │
                    │  text → IR → Scene           │
                    └───────────────┬──────────────┘
                                    │ PhysicsScene
                                    ▼
┌───────────────┐   SceneCommand   ┌──────────────────────────────┐
│  UI / Agent   │ ───────────────► │  Scene Runtime               │
│  (caller)     │ ◄─────────────── │  revision + PhysicsEvent     │
└───────────────┘   Snapshot        └───────────────┬──────────────┘
                                    │ PhysicsScene @ revision
                                    ▼
                    ┌──────────────────────────────┐
                    │  Engine Layer                │
                    │  canHandle / simulate /      │
                    │  stateAt                     │
                    └───────────────┬──────────────┘
                                    │ SimulationResult
                                    ▼
                    ┌──────────────────────────────┐
                    │  Verifier                    │
                    │  named physical checks       │
                    └───────────────┬──────────────┘
                                    │ verified result
                                    ▼
                    ┌──────────────────────────────┐
                    │  Observation Layer           │
                    │  what is worth showing       │
                    └───────────────┬──────────────┘
                                    │ Observation[]
                                    ▼
                    ┌──────────────────────────────┐
                    │  Visual Bridge               │
                    │  → SceneVisualModel          │
                    └───────────────┬──────────────┘
                                    ▼
                    ┌──────────────────────────────┐
                    │  PhysicsCanvas               │
                    │  RENDERERS[view.domain]      │
                    └──────────────────────────────┘
```

Eine eiserne Regel zieht sich durch die gesamte Kette: **Nachgelagerte Schichten berechnen niemals Fakten neu, die vorgelagerte bereits festgestellt haben.**
Der Renderer berechnet keine Kräfte, der Canvas keine Trajektorien, der Agent kein vₓ.

---

## 2. Verantwortlichkeiten und Verbote der Schichten

| Schicht                              | Besitzt                                                                                                                                     | Verboten                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `physics-core`                       | **Domänenübergreifende** Contracts wie Quantity / QuantityVector / SimulationRequest / SimulationResult / VerificationCheck                  | Konzepte einer einzelnen Physikdomäne aufnehmen (Punktladung, schiefe Ebene, Zyklotronradius) |
| Domänen-Core (`physics-electric-core` …) | Reine Contracts und reine Mathematik der Domäne (E = kq/r², F = qE)                                                                     | Scene, Engine, Runtime, UI referenzieren                                          |
| `physics-scene`                      | Struktur von PhysicsScene, Scene Command / PhysicsEvent, Revisions-Gate, Scene-Validierung, Szenenfabrik, Fork von Experimentzweigen        | Physik lösen; Engine aufrufen                                                     |
| `engine-*`                           | Prüfung der Voraussetzungen mit `canHandle`, analytisches Lösen, `stateAt(t)`, derivedQuantities, diskrete Ereignisse                        | UI-Zustand lesen; entscheiden, „was angezeigt wird“                               |
| `physics-verifier`                   | Benannte physikalische Prüfungen (Erhaltung der Horizontalgeschwindigkeit, N = mg·cosθ …)                                                   | Ergebnisse der Engine korrigieren                                                 |
| `physics-observation`                | Macht verifizierte Fakten zu „zeigenswerten Beobachtungen“, gesteuert durch den Observable-Schalter der Scene                               | Neue physikalische Größen berechnen; Farben und Koordinaten festlegen             |
| Visual Bridge (in der UI)            | Observation → `SceneVisualModel` (Szeneneinheiten, y nach oben), Bounding Box des Ausschnitts, Anzeigelängen                               | Engine aufrufen; physikalische Felder der Scene zum Rechnen lesen                 |
| `PhysicsCanvas`                      | Projektion (die einzige y-Spiegelung), Raster, Koordinatenachsen, Skalenstriche, Maßstab, Renderer-Dispatch, hover/seek                     | Wissen, was ein Geschoss oder die Lorentzkraft ist                                |
| Renderer                             | Zeichnet das `SceneVisualModel` mit gemeinsamen Primitiven                                                                                  | Irgendeine Engine importieren; physikalische Arithmetik durchführen               |
| Agent Tool Layer                     | Context lesen, Tools aufrufen                                                                                                               | Selbst Physik rechnen; das Scene Command umgehen                                  |

---

## 3. Scene Runtime und Revision

`revision` beschreibt die **Zustandsversion der aktuellen Welt**; jedes erfolgreiche SceneCommand erhöht sie um 1
und erzeugt ein PhysicsEvent. Befehle tragen `expectedRevision`; stimmt sie nicht überein, schlägt der Befehl als Konflikt fehl –
das ist die einzige Absicherung gegen Nebenläufigkeit und gegen das „Überschreiben neuen Zustands durch veraltete UI“.

`lineage.parentRevision` beschreibt die **Herkunft** und hat eine andere Semantik als `revision`; beide dürfen nicht vermischt werden:

```text
scene-question-001  revision 4          ← Aufgabenwelt (wird nicht durch Experimente verändert)
        └── fork on first fact edit
            experiment-…  revision 0 → 1
            lineage.parentRevision = 4  ← Herkunft, nicht Version
```

Ein Zweig beginnt bei 0: Er ist eine andere Welt; würde er die Versionsnummer des Elternteils übernehmen, behaupteten zwei Szenen dieselbe Version.

### Was einen Fork auslöst

Nur Befehle, die **physikalische Fakten ändern**, forken eine aus einer Aufgabe stammende Szene
(einzige Definitionsstelle: `FACT_COMMANDS` in `physics/experimental-branch.ts`).
Abspielen, seek, Umschalten von Observables und Agent-Hervorhebungen tun das nicht – sie ändern, „was man ansieht“,
nicht, „was wahr ist“.

---

## 4. Engine Layer

Jede Engine implementiert dieselbe Schnittstelle:

```ts
canHandle(scene): ModelSupport      // Ist eine Voraussetzung nicht erfüllt, ist klar zu sagen, welche
validate(scene): VerificationResult
stateAt(scene, t): SimulationState  // Analytische Lösung, keine numerische Integration
simulate(scene, request): SimulationResult
```

`SimulationRequest` muss die **genaue Revision** der zu simulierenden Szene referenzieren, sonst wird die Ausführung abgelehnt;
das garantiert, dass „Lösung“ und „Szene“ stets dieselbe Version haben.

Implementiert: `engine-magnetic` (Kreisbewegung im homogenen Magnetfeld),
`engine-mechanics` (5 Modelle), `engine-electric` (Teilchenbewegung im homogenen elektrischen Feld;
das Punktladungsmodell kommt mit `ELECTRIC_FIELD_RUNTIME_PACK_V1` hinzu).

---

## 5. Observation Layer

Observation beantwortet „**was in diesem Frame zeigenswert ist**“, nicht „was die Physik ist“.
Sie entnimmt Werte nur aus verifiziertem `SimulationResult` / `SimulationState`
und wird durch `observableDefinitions[].visible` der Szene gesteuert.

Daher **müssen Ebenenschalter über SceneCommand laufen** (`SetObservableEnabled`)
und nicht über ein lokales Boolean in der Komponente: Sonst würde der Canvas etwas anzeigen, das die Szene gar nicht behauptet.

Beim Hinzufügen einer Domäne wird das bestehende Observation-Modul erweitert; kein paralleles `XxxObservation`-System anlegen.
Die **Richtung** einzelner Kräfte (mg / N / f) erhält die Observation-Schicht durch Projektion im eigenen Koordinatensystem des Modells;
der Zeichencode ist an der Richtungsbestimmung nicht beteiligt.

---

## 6. Visual Contract und Renderer Registry

`SceneVisualModel` (`physics/scene-visual-model.ts`) ist die einzige Eingabe des Renderers:
Szeneneinheiten, y nach oben, Anzeigelängen sind bereits von der Bridge festgelegt. Vokabular der Primitive:
Body / Ground / Incline / Platform / Trajectory / Vector / Angle / Dimension /
KeyPoint / Coordinate / Label / Measurement / Field / Particle / Guide.

```ts
RENDERERS = { magnetic, mechanics, electric } // domain → renderer
```

Eine neue Domäne = **ein Eintrag in der Registry + eine Renderer-Datei**.
Neue `XxxWorkspace.tsx` sind verboten: Es gibt nur eine Hülle `PhysicsWorkspace`.

### Canvas-Koordinaten und Skalierung

Die viewBox **folgt der Pixelgröße des Containers** (ResizeObserver), sodass 1 viewBox-Einheit = 1 CSS-px ist
und `preserveAspectRatio` Linienbreiten und Schriftgrößen niemals vergrößert; die Szene wird in der Plot-Box proportional eingepasst,
die Skalierung ist stets ≤ 1. Eine viewBox aus der Inhalts-Bounding-Box zu erzeugen ist ein bekanntes Anti-Pattern (bei hochformatigen Szenen wurde messbar 1,5× vergrößert).

---

## 7. Workspace Runtime

Die UI-Hülle kennt nur eine Schnittstelle:

```ts
interface WorkspaceRuntime {
  getSnapshot()
  editParameter(id, value)
  setChoice(id, value)
  setObservable(key, enabled)
  setRunning(r)
  setRate(r)
  seek(t)
  step(dt)
  advance(wallSeconds)
  setHighlight(ids)
  restoreOrigin?()
}
```

`WorkspaceSnapshot` besteht aus reinen Daten (title / status / sceneRevision / view / tree /
inspector / charts / table / derivation / verification / events / clock /
trajectoryTimes / branch? / error?). Die Domänenadapter bilden die Ausgabe ihrer jeweiligen Bridge darauf ab.

---

## 8. Agent Tool Layer

Der Agent liest den Context (scene / revision / simulation / verification / observations /
clock / **die aktuell tatsächlich gezeichneten visuellen IDs** / branch); Antworten verweisen nur auf diese Fakten.

Zwei Arten von Tools sind streng getrennt:

| Tool                                   | Charakter       | revision | PhysicsEvent |
| -------------------------------------- | --------------- | -------- | ------------ |
| `physics.ui.*` (z. B. `highlight`)     | Ansichtsinteraktion | unverändert | wird nicht erzeugt |
| `physics.scene.*` (z. B. `setParameter`) | Domänenbefehl | +1       | wird erzeugt |

`physics.scene.*` geht exakt denselben Weg wie die UI: `expectedRevision` → Scene Runtime →
Engine → Verifier → Observation → UI. Der Agent ist nur ein Aufrufer, es gibt keinen Seitenpfad.
Bei Verweisen auf nicht gezeichnete Objekte muss ausdrücklich gemeldet werden „Der Canvas zeigt derzeit nicht …“, es darf nicht still eine leere Menge hervorgehoben werden.

---

## 9. Question Pipeline

```text
text → Parser → Semantic IR → Semantic Validator → Scene Builder
     → Engine → Verifier → Solution
```

Der Scene Builder muss `metadata.sourceQuestionId` schreiben:
Es dient sowohl der Herkunftsverfolgung als auch als Grundlage für das Kriterium des Experimentzweigs (fehlt es, wird die Aufgabenszene durch Experimente verunreinigt).

---

## 10. Checkliste für eine neue Physikdomäne

1. `packages/physics-<domain>-core`: reine Contracts + reine Mathematik, keine Abhängigkeit von Scene / Engine / UI
2. `packages/engine-<domain>`: `canHandle` / `stateAt` / `simulate` / derived
3. `physics-scene`: Szenenfabrik + notwendige Scene Commands und Events
4. `physics-verifier`: benannte physikalische Prüfungen
5. `physics-observation`: bestehendes Modul erweitern (kein neues System anlegen)
6. UI: eine Visual Bridge + ein Eintrag in `RENDERERS` + eine Renderer-Datei
7. `physics-tokens`: Farbsemantik im bestehenden Physics Token System ergänzen
   (**verboten**, ein neues `physics-<domain>-tokens.css` anzulegen und sich darauf zu verlassen, dass der Import zufällig wirkt)
8. Agent: Alias-Tabelle für Hervorhebungen erweitern, keine zweite Highlight-Logik schreiben
9. Golden Questions + Browser-Abnahmefall
