# @physicsos/physics-verifier

Verifiziert eine magnetische `PhysicsScene` zusammen mit einem bereits erzeugten
`SimulationResult`. Er ruft nie eine Engine auf und erzeugt nie Trajektorien-
Zustände neu.

## API

```ts
import { MagneticPhysicsVerifier, verifyMagneticScene } from '@physicsos/physics-verifier'

const verification = verifyMagneticScene(scene, simulation)

const verifier = new MagneticPhysicsVerifier({ tolerance })
const sameVerification = verifier.verify(scene, simulation)
```

Der Rückgabewert ist der Contract `VerificationResult`, der
`@physicsos/physics-core` gehört:

```ts
{
  status,
  checks,
  warnings,
  errors,
}
```

Jede Prüfung speichert `expected`, `actual` und die exakt verwendete `PhysicsTolerance` in
`check.details`. Fehlgeschlagene Prüfungen werden über den Core-Helfer
`summarizeVerification` zu strukturierten `errors` hochgestuft; dieses Package definiert keinen konkurrierenden
Ergebnisumschlag.

## Magnetische Prüfungen

- Validierung von Schema/Revision der Szene und Bindung von Szene/Revision des Ergebnisses
- Prüfung auf endliche Zahlen in Szene und Ergebnis
- Prüfungen kanonischer Einheiten und Dimensionen für Radius, Periode, Winkelgeschwindigkeit und Kraft
- die Vorbedingungen des eingefrorenen magnetischen Modells und alle fünf von der Engine ausgegebenen Annahmen
- Erhaltung des Geschwindigkeitsbetrags bei `0`, `T/4`, `T/2`, `3T/4` und `T`
- `F · v ≈ 0` an jedem Verifikations-Stützpunkt
- `r ≈ mv / (|q|B)`, `T ≈ 2πm / (|q|B)` und `ω ≈ |q|B / m`
- `|F| ≈ |q|vB` für die abgeleitete Größe und die abgetasteten Kraftvektoren
- Schließung von Position/Geschwindigkeit des gelieferten `stateAt(T) ≈ stateAt(0)`

Alle numerischen Vergleiche verwenden eine einzige `PhysicsTolerance`. Eine eigene Richtlinie lässt sich dem
Konstruktor oder der Funktion übergeben, wenn ein Aufrufer eine dokumentierte Domänenrichtlinie braucht;
andernfalls wird `DEFAULT_TOLERANCE` aus `physics-core` verwendet.

Teil der PhysicsOS-Physikdomänen-Runtime. Dieses Package gehört PhysicsOS und
darf niemals nach `vendor/deepseek-harness` kopiert werden.
