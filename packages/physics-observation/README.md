# @physicsos/physics-observation

Observation-Runtime: wandelt `PhysicsScene + SimulationResult + SimulationState`
in renderer-neutrale magnetische Observationen um.

## API

```ts
import { observeMagneticScene } from '@physicsos/physics-observation'

const observationState = observeMagneticScene({ scene, simulation, state })
```

Die Runtime gibt Observationen zu Geschwindigkeit, Lorentzkraft, Trajektorie, Bahnmittelpunkt und Radius
nur aus, wenn das Flag `ObservableDefinition.visible` aktiviert ist. Sie
löst nie eine Trajektorie und berechnet nie eine Kraft neu: Werte werden aus den
Engine-Fakten gelesen und an der Observation-Grenze validiert. Renderer-Belange wie
Raster, Achsen, Maßstabsbalken, Feldsymbole und Hintergrundmuster bleiben außerhalb
dieses Packages.

Teil der PhysicsOS-Physikdomänen-Runtime. Dieses Package gehört PhysicsOS und
darf niemals nach `vendor/deepseek-harness` kopiert werden.
