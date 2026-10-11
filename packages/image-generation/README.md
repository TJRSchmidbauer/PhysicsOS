# @physicsos/image-generation

Bildgenerierungs-Adapter für PhysicsOS-Designassets: ein kleiner Provider-Vertrag
plus eine OpenAI-kompatible Implementierung (`SunburstImageProvider`, Gateway
`https://image.haqiuhaqiu.xyz`, Modell `gpt-image-2.5-sunburst`).

```ts
interface ImageGenerationProvider {
  generate(input: {
    prompt: string
    size?: string
    purpose: 'ui-concept' | 'icon-concept' | 'experiment-cover' | 'share-card' | 'teacher-asset'
  }): Promise<GeneratedImage>
}
```

## Wofür es gedacht ist – und wofür nicht

Generierte Bilder sind **Dekoration, keine Physik**. Erlaubt: UI-Konzepte,
Icon-Konzeptblätter, Experiment-Cover, Lehrerillustrationen, Share-Cards,
Cover für Explore/Challenge, Dokumentationsvisuals. Verboten: Teilchenbahnen,
Darstellungen von Versuchsaufbauten, Kraft- oder Feldvektoren, Diagramme mit
Versuchsdaten, Messergebnisse, `PhysicsScene`-Darstellungen, Verified Results.

KI-Bilder gelangen niemals in die Kette der Physikfakten
(`PhysicsScene → Engine → Observation → SceneVisualModel → Renderer`). Nichts
hiervon darf an eine Physik-Zeichenfläche angeschlossen werden.

Icons: Das Modell erzeugt nur Konzeptblätter und Formstudien. Finale
Produkt-Icons in 16/20/24 px werden als SVG mit `currentColor`, einheitlicher
Strichstärke und einheitlichem Radius sowie optischer Ausrichtung neu gezeichnet –
niemals aus einem KI-PNG ausgeschnitten.

## Konfiguration (nur über Umgebungsvariablen)

| Variable                    | Standard                       |
| --------------------------- | ------------------------------ |
| `PHYSICSOS_IMAGE_API_KEY`   | — (**erforderlich**, geheim)   |
| `PHYSICSOS_IMAGE_API_BASE`  | `https://image.haqiuhaqiu.xyz` |
| `PHYSICSOS_IMAGE_API_MODEL` | `gpt-image-2.5-sunburst`       |

Der Key ist ein Geheimnis: Er wird zum Aufrufzeitpunkt aus der Umgebung gelesen
und niemals in Quellcode, Metadaten, Logs oder Fehler geschrieben. `.env` / `.env.*`
stehen in der `.gitignore` (`.env.example` enthält nur leere Werte). Ein nicht
gesetzter Key wirft `MissingImageApiKeyError` – einen Platzhalter-Fallback gibt es
bewusst nicht.

Der ältere Name mit einem „S“, `PHYSICOS_IMAGE_API_KEY` (und die symmetrischen
Namen für Base/Model), wird noch als **Deprecation-Alias für einen
Kompatibilitätszyklus** gelesen und warnt einmal pro Prozess, ohne einen Wert
auszugeben. Siehe `docs/adr/0004-image-api-env-migration.md`.

## Verwendung

```ts
import { SunburstImageProvider } from '@physicsos/image-generation'

const image = await new SunburstImageProvider().generate({
  purpose: 'icon-concept',
  prompt: 'flat line-icon concept sheet …',
})
// image.bytes, image.width, image.height, image.model, image.requestedSize
```

`NodeJS.ProcessEnv` kann für Tests injiziert werden (`{ env }`); `size`
überschreibt den Standardwert je Zweck (eine breite Zeichenfläche für
`ui-concept`/`experiment-cover`/`share-card`, ein Quadrat für
`icon-concept`/`teacher-asset`).

## Gate gegen Geheimnis-Lecks

```sh
pnpm -C packages/image-generation run scan:secrets             # das Repo scannen
pnpm -C packages/image-generation run scan:secrets:self-test   # beweisen, dass das Gate funktioniert
```

Es scannt jede von Git verfolgte Datei – Quellcode, Doku, Fixtures, Snapshots,
Designasset-Manifeste, erzeugte Berichte – nach `sk-` + 20 Key-Zeichen und nach den
Literalwerten der sensiblen Umgebungsvariablen des Projekts (nur der tatsächlich
gesetzten). Funde werden auf eine Länge geschwärzt; der Wert wird niemals
ausgegeben. Nicht gesetzte Credential-Variablen fügen schlicht keine Suchmuster
hinzu, daher ist das Gate in der CI sicher ausführbar.

## Konzeptassets neu erzeugen

Die zwei Assets unter
`overlays/harness/files/apps/web/design-assets/{icon-concept-sheet,lab-ui-concept}/`
wurden mit diesem Adapter erzeugt. Jedes hat eine `manifest.json`, die Modell,
Endpunkt, Größe, Prompt und den exakt gesendeten Prompt-Text festhält, sodass ein
Neuaufbau allein aus dem Repository reproduzierbar ist. Der Key kommt aus der
Umgebung – niemals von der Kommandozeile, niemals aus einer Datei im Repo:

```sh
set -a; . ~/.dsh/.env; set +a   # or: export PHYSICSOS_IMAGE_API_KEY=…

node --input-type=module -e '
import { mkdirSync, writeFileSync } from "node:fs"
import { SunburstImageProvider } from "./packages/image-generation/src/index.ts"

const out = "overlays/harness/files/apps/web/design-assets/icon-concept-sheet"
const image = await new SunburstImageProvider().generate({
  purpose: "icon-concept",
  // copy the prompt verbatim from the asset manifest.json
  prompt: process.env.CONCEPT_PROMPT ?? "",
})
mkdirSync(out, { recursive: true })
writeFileSync(`${out}/icon-concept-sheet.png`, image.bytes)
console.log(image.model, `${image.width}x${image.height}`)
'
```

Tauschen Sie `purpose`/Pfade für `lab-ui-concept` (`ui-concept`) gegen das zweite
Blatt aus. Der Generierungsschritt ist bewusst _nicht_ in den Build oder die
Test-Suite eingebunden: Er braucht ein Credential und das Netzwerk, und die Tests
hier müssen deterministisch und offline bleiben.
