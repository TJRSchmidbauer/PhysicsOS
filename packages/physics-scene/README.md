# @physicsos/physics-scene

PhysicsScene-Contract, Szenenbefehle, Physik-Ereignisse, Reducer und Revisions-Guard

`SceneRuntime` / `SceneStore` stellen `getScene()`, `execute(command)` und
`getEvents()` bereit. Jeder erfolgreiche Befehl erhöht die Szenen-Revision genau
einmal und hängt sein nachvollziehbares Ereignis an; veraltete `expectedRevision`-Werte liefern
`SCENE_REVISION_CONFLICT`, ohne Szene oder Ereignislog zu ändern.

`createMagneticScene()` besitzt die minimale Szeneneingabe des eingefrorenen Modells, die Einheiten und die
Observable-Definitionen. `createSceneCommand()` erlaubt Host-Adaptern, gebrandete
Befehlsumschläge aus transportsicheren String-IDs zu erzeugen, ohne gemeinsame ID- oder
Einheiten-Interna zu importieren.

Teil der PhysicsOS-Physikdomänen-Runtime. Dieses Package gehört PhysicsOS und
darf niemals nach `vendor/deepseek-harness` kopiert werden.
