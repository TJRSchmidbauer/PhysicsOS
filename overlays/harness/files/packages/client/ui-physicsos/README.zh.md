# @deepseek-ai/dsh-client-ui-physicsos

Die offizielle Produkt-Überlagerung von PhysicsOS auf dem DeepSeek Harness Web Client. Sie registriert nur deklarierte Slots für Sidebar, Startseite, Schülermodus und Arbeitsbereich, ersetzt `ConversationRoot` nicht und ändert weder Agent Loop noch Session noch Tools.

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

`PhysicsCanvas` ist der einzige offizielle Renderer für Magnetfeld und Mechanik. React berechnet keine Antwortfakten, Question → Lab übergibt dieselbe `PhysicsScene`-Revision.

Die Animation verwendet `requestAnimationFrame`. Die mikroskopische Periode im Magnetfeld wird auf eine beobachtbare Anzeigeperiode abgebildet, jeder Frame liest weiterhin den analytischen Zustand der Engine; die verifizierte Magnetfeld-Simulation wird zwischen den Frames zwischengespeichert. Die Mechanik-Wiedergabe ruft direkt `MechanicsEngine.stateAt` auf und springt nicht mehr zwischen diskreten Stützpunkten.

## Bereits umgesetzt

- PhysicsOS-Startseite und Harness-Sidebar
- Magnetfeld-Labor: Revisionsbearbeitung, Observables, Timeline, Daten, Diagramme, Herleitung, Ereignisse
- Mechanik-Labor: gleichförmige Bewegung, gleichmäßige Beschleunigung, Wurf, zweites Newtonsches Gesetz, reibungsfreie schiefe Ebene
- Question Space: 16 deterministische Beispiele und Question → Lab
- Layouts für Desktop, schmalen Desktop und Handy

## Noch nicht abgeschlossen

- Aufgabeneingabe per Bild/PDF/OCR/VLM
- Vollständiger Geschäftskreislauf für Speichern, KI-Assistent, Vorlagenbibliothek und Lernverlauf der Nutzer
- Electric, Circuit, Induction, Optics, Wave, Lehrerseite und Desktop

## Verifikation

Im Repository-Wurzelverzeichnis ausführen:

```sh
pnpm typecheck:web
pnpm lint:web
pnpm test:web
pnpm build:web
```

## Model Experience

Dieses Package stellt weder Modellanfragen zusammen noch sendet es welche; Modellkonfiguration und Sitzungsverhalten bleiben weiterhin Sache des Harness.
