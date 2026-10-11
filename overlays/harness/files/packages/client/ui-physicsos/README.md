# @deepseek-ai/dsh-client-ui-physicsos

PhysicsOS-Produkt-Overlay für den DeepSeek Harness Web Client. Es registriert nur deklarierte Slots für Sidebar, Hero, Profil und Konversationsoberfläche. Es ersetzt `ConversationRoot` nicht und ändert weder Agent Loop noch Session noch Tools.

## Runtime-Grenze

```text
Question / Inspector / Timeline
  -> PhysicsScene + revision
  -> MagneticEngine oder MechanicsEngine
  -> Verifier
  -> Observation
  -> SceneVisualModel
  -> PhysicsCanvas
```

`PhysicsCanvas` ist der einzige Produktions-Renderer für magnetische und mechanische Szenen. React-Komponenten berechnen keine Antwortfakten. Question → Lab übergibt dieselbe `PhysicsScene`-Revision.

Die Wiedergabe verwendet `requestAnimationFrame`. Ein magnetischer Umlauf wird auf einen sichtbaren Wanduhr-Zyklus normiert, wobei jeder Frame weiterhin einen analytischen Engine-Zustand liest. Verifizierte magnetische Simulationsdaten werden zwischen den Frames zwischengespeichert; die Mechanik-Wiedergabe verwendet das exakte `MechanicsEngine.stateAt`, statt auf Trajektorien-Stützpunkte zu springen.

## Umgesetzte Oberflächen

- PhysicsOS-Startseite und Harness-Sidebar-Chrome
- Magnetfeld-Labor mit Bearbeitung nach Revision, Observables, Timeline, Daten, Diagrammen, Herleitung und Ereignissen
- Mechanik-Labor für gleichförmige Bewegung, gleichmäßige Beschleunigung, Wurf, zweites Newtonsches Gesetz und reibungsfreie schiefe Ebene
- Question Space mit 16 deterministischen Beispielen und Question → Lab
- Layouts für Desktop, schmalen Desktop und Mobilgeräte

## Verifikation

Im Repository-Wurzelverzeichnis:

```sh
pnpm typecheck:web
pnpm lint:web
pnpm test:web
pnpm build:web
```

## Model Experience

Keine, da das Package eine browserseitige UI-Plugin-Schicht ist, die nichts Modellseitiges registriert.

#### KV-Cache-Wirkung

Keine; dieses Package stellt weder eine Provider-Anfrage zusammen noch sendet es eine.

## Bekannte Einschränkungen und zurückgestellte Arbeiten

- Die Aufnahme per Bild/PDF/OCR/VLM ist nicht angebunden.
- Speichern, KI-Tutor, Vorlagenbibliothek und Persistenz des Lernverlaufs sind keine vollständigen Geschäftsabläufe.
- Electric, Circuit, Induction, Optics, Wave, Lehrerseite und Desktop-Produkte bleiben künftige Arbeit.
