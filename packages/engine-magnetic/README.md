# @physicsos/engine-magnetic

Magnetische Physik-Engine für ein geladenes Teilchen in einem homogenen Magnetfeld,
mit `v senkrecht B`, nur Magnetkraft und einem analytischen 2D-Löser für die Kreisbewegung.

`simulate(scene, request)` gibt eine deterministische analytische Trajektorie aus,
die die fünf erforderlichen Verifikations-Checkpoints und genügend Zwischenzustände für
renderer-neutrale Beobachtungen des Kreispfads enthält, zusammen mit nachvollziehbaren
abgeleiteten Fakten. `stateAt(scene, time)` und das hostseitige
`stateAtSeconds(scene, seconds)` liefern den analytischen Zustand, den die Timeline-
Wiedergabe verwendet. Das Modell deckt keine elektrischen Felder, keine Schwerkraft, keine Grenzen,
keine relativistischen Effekte und keine zum Feld parallele Geschwindigkeitskomponente ab.

Teil der PhysicsOS-Physikdomänen-Runtime. Dieses Package gehört PhysicsOS und
darf niemals nach `vendor/deepseek-harness` kopiert werden.
