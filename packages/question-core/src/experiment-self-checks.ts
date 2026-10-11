/**
 * Experiment self-check bank for lab topics.
 *
 * The golden-question bank keys its self-checks by question id; lab-first
 * teaching content (the circuit domain, the middle-school measurement experiments) has
 * no golden questions, so its conceptual probes are keyed by a LAB TOPIC
 * instead. A topic names what the current frame teaches: for circuits the web
 * layer resolves it from facts the runtime already published (pure series /
 * parallel nodes / rheostat / battery with internal resistance) — never from a template id, so a student-
 * modified or question-forked circuit still gets the probes that match what is
 * actually on the canvas. The optics topics dispatch the same way, on the
 * imaging element the runtime reports (plane mirror / convex lens / concave mirror), and the
 * acoustics topic on the echo range being present. The middle-school measurement
 * rigs (measuring average speed / volt-ampere method / measuring bulb power) are physically identical to their
 * base apparatus — their topic is the measurement intent, which lives in the
 * scene title the template stamped, the same dispatch the tutor uses for
 * mechanics lessons.
 *
 * This file is DATA, same rules as the question self-check bank: every wrong
 * option is a classified mistake with a readable explanation and review
 * pointers; where the running circuit Verifier asserts the exact fact an
 * explanation relies on, the option cites that check id. `terminal_voltage_law`
 * is a prefix — the engine stamps one check per source (`terminal_voltage_law:
 * bat`), and the UI resolves the citation by prefix.
 *
 * Each set also declares the knowledge nodes its attempts count toward, so the
 * learning record aggregates lab practice into the same mastery view as
 * question practice.
 */

import {
  CROSSED_NET_FORCE,
  INDUCTION_BAR_EMF,
  INDUCTION_FARADAY,
  INDUCTION_LENZ,
  INDUCTION_NO_CUT,
  MAGNETIC_WORK,
  PLATE_MOTION,
  PLATE_OUTSIDE,
  POINT_CHARGE_DIRECTION,
  RADIUS_MASS,
  SELECTOR_CONDITION,
  SELECTOR_TOO_FAST,
  SPECTROMETER_SPEED,
  SUPERPOSITION,
  THREE_FIELD_GRAVITY,
  WAVE_DESTRUCTIVE_HALF,
  WAVE_DIFFRACTION_MINIMUM,
  WAVE_DOPPLER_SIGN,
  WAVE_HARMONIC_FREQUENCY,
  WAVE_LONGITUDINAL_DIRECTION,
  WAVE_NODE_MOTION,
  WAVE_PARTICLE_TRANSPORT,
  WAVE_PATH_DIFFERENCE,
  WAVE_BOUNDARY_RULE,
  WAVE_SPEED_FREQUENCY,
} from './self-checks.ts'
import type { SelfCheckItem } from './self-checks.ts'

export interface ExperimentSelfCheckSet {
  /** Lab topic key, e.g. `circuit-emf`. */
  readonly id: string
  /** Student-facing topic name shown above the probes. */
  readonly topic: string
  /** Knowledge node ids an attempt on this set exercises. */
  readonly knowledge: readonly string[]
  readonly items: readonly SelfCheckItem[]
}

/* ----------------------------------------------------------------- series -- */

const SERIES_CURRENT: SelfCheckItem = {
  id: 'series-current-everywhere',
  prompt: 'In einem Reihenstromkreis, wie ist die Beziehung zwischen den Strömen durch die einzelnen Bauteile?',
  takeaway: 'In einem Reihenstromkreis gibt es nur einen Strompfad, der Strom ist überall gleich – das ist genau die Ausprägung des Kirchhoffschen Stromgesetzes in einem einfachen Stromkreis.',
  options: [
    { id: 'equal', label: 'Überall gleich', correct: true },
    {
      id: 'consumed',
      label: 'Je weiter entfernt vom Pluspol der Spannungsquelle, desto kleiner wird der Strom',
      mistake: {
        type: 'concept',
        explanation:
          'Der Strom wird nicht von den Bauteilen „verbraucht": Im Reihenstromkreis gibt es nur einen Pfad, an jedem Querschnitt fließt pro Sekunde dieselbe Ladungsmenge, der Strom ist überall gleich. Verbraucht wird elektrische Energie, nicht elektrischer Strom.',
        review: ['Strom in Reihe überall gleich', 'Kirchhoffsches Stromgesetz'],
        evidenceCheckId: 'kcl_current_conservation',
      },
    },
    {
      id: 'bigger-resistance-less',
      label: 'Je größer der Widerstand eines Bauteils, desto kleiner ist der Strom, der durch es fließt',
      mistake: {
        type: 'concept',
        explanation:
          '„Der größere Widerstand erhält einen kleineren Stromanteil" ist die Regel für die Stromverzweigung bei Parallelschaltung; in einem Reihenstromkreis fließt durch alle Bauteile derselbe Strom, an einem größeren Widerstand fällt jedoch eine größere Spannung ab.',
        review: ['Unterschied zwischen Reihen- und Parallelschaltung', 'Spannungsteilung in Reihe U = IR'],
        evidenceCheckId: 'kcl_current_conservation',
      },
    },
  ],
}

const SERIES_VOLTAGE: SelfCheckItem = {
  id: 'series-voltage-division',
  prompt: 'Wie wird die Spannung in einem Reihenstromkreis auf die Widerstände aufgeteilt?',
  takeaway: 'Spannungsteilung in Reihe: Gleicher Strom, U = IR, die Spannung teilt sich proportional zum Widerstand auf, die Gesamtspannung ist gleich der Summe der Teilspannungen.',
  options: [
    { id: 'proportional', label: 'Proportional zum Widerstand (U = IR)', correct: true },
    {
      id: 'all-source',
      label: 'An jedem Widerstand liegt die volle Quellspannung an',
      mistake: {
        type: 'concept',
        explanation:
          '„Überall gleiche Spannung" gilt für Parallelschaltungen; in einem Reihenstromkreis teilt sich die Gesamtspannung nach der Größe der Widerstände auf, nur die Summe der Teilspannungen ist gleich der Quellspannung.',
        review: ['Spannungsteilung in Reihe', 'Gleiche Spannung bei Parallelschaltung'],
      },
    },
    {
      id: 'equal-split',
      label: 'Unabhängig vom Widerstandswert teilen sich die Widerstände die Spannung zu gleichen Teilen',
      mistake: {
        type: 'concept',
        explanation:
          'Da der Strom in Reihe gleich ist, folgt aus U = IR, dass die Spannung proportional zum Widerstand ist: Bei R₂ = 2R₁ ist U₂ = 2U₁, nur bei gleichen Widerständen wird die Spannung gleichmäßig aufgeteilt.',
        review: ['Ohmsches Gesetz U = IR', 'Spannungsteilung in Reihe'],
      },
    },
  ],
}

/* --------------------------------------------------------------- parallel -- */

const PARALLEL_VOLTAGE: SelfCheckItem = {
  id: 'parallel-voltage-equal',
  prompt: 'Wie verhält sich die Spannung an den einzelnen Zweigen einer Parallelschaltung?',
  takeaway: 'Alle Zweige einer Parallelschaltung sind an dasselbe Knotenpaar angeschlossen, daher liegt an ihnen die gleiche Spannung an; die Zweigströme verteilen sich nach I = U/R umgekehrt proportional zum Widerstand.',
  options: [
    { id: 'equal', label: 'Sie ist gleich und entspricht der Spannung am Parallelteil', correct: true },
    {
      id: 'bigger-resistance-more',
      label: 'Der Zweig mit dem größeren Widerstand erhält eine höhere Spannung',
      mistake: {
        type: 'concept',
        explanation:
          '„Größerer Widerstand erhält größere Spannung" ist die Regel für die Spannungsteilung in Reihe; bei Parallelschaltung sind die Zweige an dasselbe Knotenpaar angeschlossen, die Spannung ist gleich, der Zweig mit dem größeren Widerstand führt jedoch einen kleineren Strom.',
        review: ['Gleiche Spannung bei Parallelschaltung', 'Stromaufteilung in Parallelschaltung I = U/R'],
      },
    },
    {
      id: 'bigger-current-more',
      label: 'Je größer der Strom in einem Zweig ist, desto höher ist dessen Spannung',
      mistake: {
        type: 'concept',
        explanation: 'Bei Parallelschaltung ist die Spannung an allen Zweigen gleich; ein größerer Strom bedeutet einfach, dass dieser Zweig einen kleineren Widerstand hat (I = U/R), nicht dass die Spannung höher ist.',
        review: ['Ohmsches Gesetz I = U/R', 'Merkmale von Parallelschaltungen'],
      },
    },
  ],
}

const PARALLEL_MAIN_CURRENT: SelfCheckItem = {
  id: 'parallel-main-current',
  prompt: 'Wie verhält sich der Hauptstrom zum Strom in den einzelnen Zweigen einer Parallelschaltung?',
  takeaway: 'Am Knoten gilt die Ladungserhaltung: Der zufließende Strom ist gleich der Summe der abfließenden Ströme, der Hauptstrom ist also die Summe aller Zweigströme (Kirchhoffsches Stromgesetz).',
  options: [
    { id: 'sum', label: 'Der Hauptstrom ist gleich der Summe der Ströme in allen Zweigen', correct: true },
    {
      id: 'max-branch',
      label: 'Der Hauptstrom ist gleich dem Strom im stärkstbelasteten Zweig',
      mistake: {
        type: 'concept',
        explanation:
          'An einem Knoten geht keine Ladung verloren: Der in den Knoten fließende Hauptstrom muss gleich der Summe der aus dem Knoten abfließenden Zweigströme sein, nicht gleich dem größten einzelnen Zweigstrom.',
        review: ['Kirchhoffsches Stromgesetz', 'Stromaufteilung in Parallelschaltung'],
        evidenceCheckId: 'kcl_current_conservation',
      },
    },
    {
      id: 'same-everywhere',
      label: 'Der Strom in jedem Zweig ist gleich dem Hauptstrom',
      mistake: {
        type: 'concept',
        explanation:
          '„Der Strom ist überall gleich" gilt nur für Reihenstromkreise; am Knoten einer Parallelschaltung teilt sich der Hauptstrom entsprechend der Leitwerte auf, jeder Zweig führt nur einen Teil des Stroms.',
        review: ['Unterschied zwischen Reihen- und Parallelschaltung', 'Kirchhoffsches Stromgesetz'],
        evidenceCheckId: 'kcl_current_conservation',
      },
    },
  ],
}

/* --------------------------------------------------------------- rheostat -- */

const RHEOSTAT_CURRENT: SelfCheckItem = {
  id: 'rheostat-resistance-current',
  prompt: 'Wie ändert sich der Strom im Stromkreis, wenn der eingestellte Widerstand des Schleifwiderstands größer wird?',
  takeaway:
    'Bei konstanter Spannungsquelle wird der Gesamtwiderstand größer, nach I = U/(R₀ + R_Schleifer) nimmt der Strom ab – genau auf diese Weise reguliert ein Potentiometer den Strom.',
  options: [
    { id: 'decreases', label: 'Er nimmt ab (Gesamtwiderstand wird größer)', correct: true },
    {
      id: 'increases',
      label: 'Er nimmt zu (durch das Verschieben des Schleifers ändert sich der Strom automatisch)',
      mistake: {
        type: 'concept',
        explanation:
          'Der Strom wird durch den Gesamtwiderstand des gesamten Stromkreises bestimmt: Größerer eingestellter Widerstand → größerer Gesamtwiderstand → I = U/R nimmt ab. Die Bewegungsrichtung des Schleifers muss in die Änderung des eingestellten Widerstands umgerechnet werden, bevor man die Schlussfolgerung zieht.',
        review: ['Ohmsches Gesetz I = U/R', 'Eingestellter Widerstand eines Schleifwiderstands'],
      },
    },
    {
      id: 'unchanged',
      label: 'Er bleibt unverändert (der Widerstand beeinflusst nur sich selbst)',
      mistake: {
        type: 'modeling',
        explanation:
          'Ein Reihenstromkreis ist ein geschlossenes System: Jede Änderung eines Widerstandswerts ändert den Gesamtwiderstand und damit den Strom im gesamten Stromkreis, es gibt kein Bauteil, das „nur sich selbst beeinflusst".',
        review: ['Analyse dynamischer Stromkreise: erst Gesamtwiderstand, dann Verteilung', 'Gesamtwiderstand in Reihe'],
      },
    },
  ],
}

const RHEOSTAT_METER: SelfCheckItem = {
  id: 'rheostat-meter-link',
  prompt: 'Wie ändert sich die Anzeige des Voltmeters über dem Festwiderstand R₀, wenn der eingestellte Widerstand größer wird?',
  takeaway: 'Bei der Analyse dynamischer Stromkreise betrachtet man zuerst den Hauptstromkreis: I nimmt ab, und da U₀ = I·R₀ (R₀ konstant), nimmt auch die Spannungsanzeige entsprechend ab.',
  options: [
    { id: 'decreases', label: 'Sie nimmt ab (U₀ = I·R₀ nimmt mit abnehmendem Strom ab)', correct: true },
    {
      id: 'increases',
      label: 'Sie nimmt zu (größerer Widerstand bedeutet größere Spannung)',
      mistake: {
        type: 'concept',
        explanation:
          '„Je größer der Widerstand, desto größer der Spannungsabfall" gilt für den Schleifwiderstand selbst: Er nimmt einen größeren Teil der Gesamtspannung auf, so dass an R₀ weniger Spannung abfällt. R₀ hat einen konstanten Wert, seine Spannung ändert sich nur über U₀ = I·R₀ mit dem Strom.',
        review: ['Spannungsteilung in Reihe', 'Analyse dynamischer Stromkreise: erst Gesamtwiderstand, dann Verteilung'],
      },
    },
    {
      id: 'unchanged',
      label: 'Sie bleibt unverändert (R₀ hat sich nicht geändert)',
      mistake: {
        type: 'modeling',
        explanation:
          'Dass R₀ konstant bleibt, bedeutet nicht, dass U₀ konstant bleibt: Ändert sich der durch ihn fließende Strom, ändert sich auch U₀ = I·R₀. In dynamischen Stromkreisen können auch die Anzeigen von unbewegten Bauteilen variieren.',
        review: ['In U = IR können sich beide Größen ändern', 'Analyse dynamischer Stromkreise'],
      },
    },
  ],
}

/* ----------------------------------------------------- Spannungs-Strom-Methode (Mittelschule) -- */

const VA_PRINCIPLE: SelfCheckItem = {
  id: 'va-principle',
  prompt: 'Was ist das Prinzip der Spannungs-Strom-Methode zur Widerstandsmessung?',
  takeaway:
    'Das Voltmeter misst die Spannung U am Widerstand Rx, das Amperemeter misst den durch ihn fließenden Strom I, der Widerstandswert ergibt sich aus der Umformung des Ohmschen Gesetzes R = U/I.',
  options: [
    { id: 'r-u-over-i', label: 'Messe U und I und berechne R = U/I', correct: true },
    {
      id: 'r-follows-u',
      label: 'Je größer die Spannung, desto größer der Widerstand, nimm den Messwert bei maximaler Spannung',
      mistake: {
        type: 'concept',
        explanation:
          'Der Widerstand ist eine Eigenschaft des Leiters, die von Material, Länge und Querschnittsfläche bestimmt wird; ändert man die Spannung, verändern sich U und I im gleichen Verhältnis, U/I bleibt konstant. Mehrere Messreihen werden durchgeführt, um den Mittelwert zu bilden und zufällige Fehler zu reduzieren, nicht weil sich der Widerstand ändert.',
        review: ['Widerstand ist eine Eigenschaft des Leiters', 'Ohmsches Gesetz R = U/I'],
      },
    },
    {
      id: 'swap-meters',
      label: 'Man kann auch Voltmeter in Reihe und Amperemeter parallel schalten',
      mistake: {
        type: 'modeling',
        explanation:
          'Das ist falsch geschaltet: Das Voltmeter hat einen sehr hohen Innenwiderstand, wird es in den Hauptkreis geschaltet, wird der Strom nahezu unterbrochen; das Amperemeter hat einen sehr kleinen Innenwiderstand, wird es parallel zu Rx geschaltet, wird Rx kurzgeschlossen. Korrekt ist: Amperemeter in Reihe, Voltmeter parallel – so stören ideale Messgeräte den Stromkreis kaum.',
        review: ['Voltmeter parallel, Amperemeter in Reihe', 'Annahme idealer Messgeräte'],
        evidenceCheckId: 'ideal_meters_non_intrusive',
      },
    },
  ],
}

const VA_RHEOSTAT_ROLE: SelfCheckItem = {
  id: 'va-rheostat-role',
  prompt: 'Wozu wird im Experiment ein Schleifwiderstand in Reihe geschaltet?',
  takeaway:
    'Durch Verschieben des Schleifers wird der Gesamtwiderstand des Stromkreises verändert, wodurch sich der Arbeitspunkt von Rx ändert: Durch Messen mehrerer (U, I)-Wertepaare und Bildung des Mittelwerts von R lassen sich zufällige Fehler reduzieren, außerdem dient der Widerstand dem Strombegrenzungsschutz.',
  options: [
    { id: 'multi-readings', label: 'Um Spannung und Strom an Rx zu verändern und mehrere Messwerte für die Mittelwertbildung zu erhalten', correct: true },
    {
      id: 'change-rx',
      label: 'Um den zu messenden Widerstand Rx direkt zu verändern',
      mistake: {
        type: 'concept',
        explanation:
          'Der Schleifwiderstand ändert nur den Anteil seines eigenen Widerstands, der in den Stromkreis eingeschaltet ist; Rx ist der zu messende Widerstand, dessen Wert konstant bleibt, verändert werden nur die an ihm abfallende Spannung und der durch ihn fließende Strom.',
        review: ['Eingestellter Widerstand eines Schleifwiderstands', 'Spannungsteilung in Reihe'],
      },
    },
    {
      id: 'as-switch',
      label: 'Um den Stromkreis anstelle eines Schalters ein- und auszuschalten',
      mistake: {
        type: 'modeling',
        explanation:
          'Ein Schalter hat nur die Zustände „ein" und „aus"; der Vorteil des Schleifwiderstands besteht darin, den eingeschalteten Widerstand kontinuierlich zu regulieren und den Arbeitspunkt über einen Bereich zu verschieben, um mehrere verschiedene (U, I)-Wertepaare abzulesen.',
        review: ['Funktion des Schleifwiderstands', 'Mehrfachmessung bei der Spannungs-Strom-Methode'],
      },
    },
  ],
}

/* ------------------------------------------------- Leistung einer Glühlampe (Mittelschule) -- */

const BULB_POWER_READING: SelfCheckItem = {
  id: 'bulb-power-reading',
  prompt: 'Wie ermittelt man die momentane tatsächliche Leistung einer Glühlampe?',
  takeaway:
    'P = U·I: Das Voltmeter misst U, das Amperemeter misst I, das Produkt der beiden Werte ist die momentane elektrische Leistung der Lampe – die Leistung ändert sich mit dem Arbeitspunkt und muss gemessen werden, nicht nur vom Typenschild abgelesen.',
  options: [
    { id: 'p-ui', label: 'Spannungsanzeige × Stromanzeige: P = U·I', correct: true },
    {
      id: 'rated-always',
      label: 'Solange die Lampe leuchtet, ist sie auf Nennleistung, einfach Typenschild lesen',
      mistake: {
        type: 'concept',
        explanation:
          'Das Typenschild gibt nur die Leistung bei Nennspannung an. Die tatsächliche Leistung P = U·I ändert sich mit der Spannung an der Lampe: Unterhalb der Nennspannung leuchtet die Lampe schwächer und hat eine geringere Leistung, nur wenn die Spannung genau dem Nennwert entspricht, ist die tatsächliche Leistung gleich der Nennleistung.',
        review: ['Nennleistung und tatsächliche Leistung', 'Elektrische Leistung P = U·I'],
        evidenceCheckId: 'power_balance',
      },
    },
    {
      id: 'brightness',
      label: 'Nach Helligkeit abschätzen: Je heller, desto näher an der Nennleistung',
      mistake: {
        type: 'modeling',
        explanation:
          'Die Helligkeit nimmt zwar mit der tatsächlichen Leistung zu, das ist jedoch nur eine qualitative Abschätzung, außerdem kann die Lampe bei Überschreitung der Nennspannung heller, aber bereits überlastet sein. Zur Messung muss man P = U·I verwenden, die Helligkeit ist nur eine ergänzende Beobachtung.',
        review: ['Messverfahren für elektrische Leistung', 'P = U·I'],
      },
    },
  ],
}

const BULB_RATED_POINT: SelfCheckItem = {
  id: 'bulb-rated-point',
  prompt: 'Wie muss der Schleifwiderstand eingestellt werden, um die Nennleistung zu messen?',
  takeaway:
    'Reguliere den Schleifer so lange, bis die Spannungsanzeige dem Nennspannungswert der Lampe entspricht; in diesem Moment ist P = U·I genau die Nennleistung. Bei jeder Abweichung von der Nennspannung misst man nur die momentane tatsächliche Leistung an diesem Arbeitspunkt.',
  options: [
    { id: 'until-rated', label: 'Bis die Spannungsanzeige genau den Nennspannungswert erreicht', correct: true },
    {
      id: 'max-current',
      label: 'Wenn der Strom maximal und die Lampe am hellsten ist',
      mistake: {
        type: 'modeling',
        explanation:
          'Wenn der eingestellte Widerstand minimal ist, kann die Spannung an der Lampe die Nennspannung überschreiten: Die Lampe leuchtet zwar heller, ist aber bereits überlastet und kann durchbrennen, außerdem ist die abgelesene Leistung dann nicht die Nennleistung. Maßgeblich ist der Spannungswert, nicht die Helligkeit.',
        review: ['Nennspannung als Kriterium', 'Einstellrichtung des Schleifwiderstands'],
      },
    },
    {
      id: 'any-point',
      label: 'An beliebiger Stelle, denn die Leistung ist eine feste Eigenschaft der Lampe',
      mistake: {
        type: 'concept',
        explanation:
          'Die Leistung ist keine feste Eigenschaft der Lampe: P = U·I ändert sich kontinuierlich mit dem Arbeitspunkt, schon eine kleine Verschiebung des Schleifers ändert die tatsächliche Leistung. Nur die Leistung bei Nennspannung wird als Nennleistung bezeichnet.',
        review: ['Tatsächliche Leistung ändert sich mit der Spannung', 'Bedeutung der Nennleistung'],
        evidenceCheckId: 'power_balance',
      },
    },
  ],
}

/* ------------------------------------------------- Durchschnittsgeschwindigkeit (Mittelschule, Mechanik) -- */

const AVERAGE_SPEED_DEFINITION: SelfCheckItem = {
  id: 'avg-speed-definition',
  prompt: 'Wie berechnet man richtig die Durchschnittsgeschwindigkeit eines Wagens, der eine schiefe Ebene hinunterrollt?',
  takeaway:
    'Durchschnittsgeschwindigkeit ist die Gesamtstrecke geteilt durch die Gesamtzeit: v̄ = s/t. Mit einem Maßband misst man s, mit einer Stoppuhr t und bildet den Quotienten – so erhält man die mittlere Geschwindigkeit für den gesamten Bewegungsabschnitt.',
  options: [
    { id: 'total-over-total', label: 'Gesamtstrecke durch Gesamtzeit: v̄ = s/t', correct: true },
    {
      id: 'average-of-speeds',
      label: 'Anfangs- und Endgeschwindigkeit addieren und durch 2 teilen',
      mistake: {
        type: 'concept',
        explanation:
          'Die Definition der Durchschnittsgeschwindigkeit ist immer v̄ = s/t; der Mittelwert aus Anfangs- und Endgeschwindigkeit ist nur bei gleichmäßig beschleunigter Bewegung gleich der Durchschnittsgeschwindigkeit, bei allgemeinen Bewegungen sind beide Werte unterschiedlich. Nur durch Messen von Strecke und Zeit erhält man das korrekte Ergebnis.',
        review: ['Definition der Durchschnittsgeschwindigkeit v̄ = s/t', 'Sonderfall bei gleichmäßig beschleunigter Bewegung v̄ = (v₀+v)/2'],
        evidenceCheckId: 'velocity_change',
      },
    },
    {
      id: 'instant-at-end',
      label: 'Die Geschwindigkeit in dem Moment ablesen, in dem der Wagen unten ankommt',
      mistake: {
        type: 'concept',
        explanation:
          'Die Geschwindigkeit beim Erreichen des unteren Endes ist eine Momentangeschwindigkeit und beschreibt nur diesen einen Zeitpunkt; da der Wagen beschleunigt, ist die Endgeschwindigkeit größer als die Durchschnittsgeschwindigkeit für den gesamten Abschnitt. Für die Durchschnittsgeschwindigkeit muss man stets die gesamte Strecke s und die gesamte Zeit t verwenden.',
        review: ['Unterschied zwischen Durchschnitts- und Momentangeschwindigkeit'],
        evidenceCheckId: 'velocity_change',
      },
    },
  ],
}

const AVERAGE_SPEED_SEGMENTS: SelfCheckItem = {
  id: 'avg-speed-segments',
  prompt: 'Wie verhalten sich die Durchschnittsgeschwindigkeiten der ersten und zweiten Hälfte, wenn ein Wagen aus dem Stand eine schiefe Ebene beschleunigt hinunterrollt?',
  takeaway:
    'Der Wagen wird immer schneller, für die gleiche Strecke benötigt er in der zweiten Hälfte weniger Zeit: Aus v̄ = s/t folgt, dass die Durchschnittsgeschwindigkeit in der zweiten Hälfte größer ist – genau das soll durch die Teilstreckenmessung nachgewiesen werden.',
  options: [
    { id: 'second-half-faster', label: 'Die zweite Hälfte ist größer (gleiche Strecke, kürzere Zeit)', correct: true },
    {
      id: 'equal',
      label: 'Sie sind gleich (derselbe Wagen hat natürlich die gleiche Geschwindigkeit)',
      mistake: {
        type: 'concept',
        explanation:
          'Bei beschleunigter Bewegung nimmt die Geschwindigkeit ständig zu, es gibt nicht „eine Geschwindigkeit für den Wagen": Die erste Hälfte ist langsamer, die zweite Hälfte schneller, daher müssen die Durchschnittsgeschwindigkeiten unterschiedlich sein. Durch Zeitmessung für Teilstrecken lässt sich dieser Unterschied direkt feststellen.',
        review: ['Geschwindigkeit ändert sich bei beschleunigter Bewegung', 'Messung der Durchschnittsgeschwindigkeit auf Teilstrecken'],
        evidenceCheckId: 'velocity_change',
      },
    },
    {
      id: 'first-half-faster',
      label: 'Die erste Hälfte ist größer (hat einen Vorsprung durch die gewählte Aufteilung)',
      mistake: {
        type: 'concept',
        explanation:
          'Beide Teilstrecken sind gleich lang, entscheidend ist die benötigte Zeit: Da der Wagen aus dem Stand beschleunigt, ist seine Geschwindigkeit in der ersten Hälfte geringer, die benötigte Zeit also länger, und somit ist die Durchschnittsgeschwindigkeit kleiner. Bei v̄ = s/t gilt: gleicher s, kleiner t → größere Geschwindigkeit.',
        review: ['Durchschnittsgeschwindigkeit v̄ = s/t', 'Merkmale der Bewegung aus dem Stand mit konstanter Beschleunigung'],
        evidenceCheckId: 'velocity_change',
      },
    },
  ],
}

/* ------------------------------------------------- Ebenenspiegel (Mittelschule, Optik) -- */

const MIRROR_DISTANCE_SIZE: SelfCheckItem = {
  id: 'mirror-distance-size',
  prompt: 'Wie verändern sich Größe und Abstand des Spiegelbilds, wenn man die Kerze langsam von der Glasplatte wegbewegt?',
  takeaway:
    'Das Bild in einem ebenen Spiegel ist spiegelsymmetrisch zum Gegenstand: Bild und Gegenstand sind stets gleich groß, der Bildabstand ist stets gleich dem Gegenstandsabstand – entfernt sich die Kerze, entfernt sich das Bild um denselben Betrag, seine Größe bleibt jedoch unverändert.',
  options: [
    { id: 'same-size-farther', label: 'Bildgröße bleibt unverändert, Bildabstand vergrößert sich (v = u)', correct: true },
    {
      id: 'image-shrinks',
      label: 'Das Bild wird immer kleiner (es sieht zwar kleiner aus)',
      mistake: {
        type: 'concept',
        explanation:
          'Der Eindruck „es wird kleiner" entsteht durch den größeren Abstand zum Auge und den damit kleineren Sehwinkel, also durch einen Beobachtungseffekt; geometrisch ist das Bild im ebenen Spiegel zum Gegenstand spiegelsymmetrisch und daher stets gleich groß. Dies lässt sich durch Einsetzen einer gleich großen Ersatzkerze an die Bildposition überprüfen.',
        review: ['Merkmale der Bildentstehung am ebenen Spiegel: gleich groß, symmetrisch', 'Sehwinkel und wahre Bildgröße'],
        evidenceCheckId: 'mirror_image_symmetry',
      },
    },
    {
      id: 'image-stays',
      label: 'Das Bild bleibt an seinem Platz, nur die Kerze bewegt sich',
      mistake: {
        type: 'concept',
        explanation:
          'Die Bildposition wird durch die Gegenstandsposition bestimmt: Bild und Gegenstand sind spiegelsymmetrisch, vergrößert sich der Gegenstandsabstand, vergrößert sich auch der Bildabstand synchron. Bewegt sich der Gegenstand, bewegt sich auch das Bild, beide bleiben spiegelbildlich zum Spiegel mit gleichem Abstand angeordnet.',
        review: ['Bild-Gegenstand-Symmetrie: Bildabstand = Gegenstandsabstand', 'Strahlengang am ebenen Spiegel'],
        evidenceCheckId: 'mirror_image_symmetry',
      },
    },
  ],
}

const MIRROR_VIRTUAL_SCREEN: SelfCheckItem = {
  id: 'mirror-virtual-screen',
  prompt: 'Kann man das Bild auf einem Schirm auffangen, wenn man diesen hinter die Glasplatte an die Stelle des „Bilds" hält?',
  takeaway:
    'Das Bild im ebenen Spiegel ist der Schnittpunkt der rückwärts verlängerten reflektierten Lichtstrahlen, hinter dem Spiegel treffen keine tatsächlichen Lichtstrahlen ein – es handelt sich um ein virtuelles Bild, das nicht auf einem Schirm aufgefangen werden kann, sondern nur durch die Glasplatte hindurch sichtbar ist.',
  options: [
    { id: 'cannot-virtual', label: 'Nein: Es ist ein virtuelles Bild, das durch die rückwärts verlängerten reflektierten Lichtstrahlen entsteht', correct: true },
    {
      id: 'can-catch',
      label: 'Ja: Das Bild befindet sich genau dort, wenn der Schirm genau positioniert ist, kann man es auffangen',
      mistake: {
        type: 'concept',
        explanation:
          '„Genau an der richtigen Stelle" bedeutet noch nicht, dass dort Licht eintrifft: Alle reflektierten Lichtstrahlen kehren zur Kerzenseite zurück, an der Position hinter dem Spiegel gibt es keinen tatsächlichen Strahlenschnittpunkt. Nur reelle Bilder können auf einem Schirm aufgefangen werden.',
        review: ['Unterschied zwischen reellem und virtuellem Bild', 'Bildentstehung am ebenen Spiegel'],
        evidenceCheckId: 'virtual_image_uncatchable',
      },
    },
    {
      id: 'brighter-helps',
      label: 'Ja, wenn man eine hellere Kerze nimmt oder den Schirm näher heranrückt',
      mistake: {
        type: 'modeling',
        explanation:
          'Helligkeit und Abstand beeinflussen nur die Beobachtungsbedingungen, ändern aber nichts daran, dass hinter dem Spiegel keine tatsächlichen Lichtstrahlen ankommen: Das Wesen des virtuellen Bilds wird durch den Strahlengang bestimmt, auch die hellste Kerze lässt kein reflektiertes Licht hinter den Spiegel gelangen.',
        review: ['Virtuelles Bild kann nicht auf einem Schirm aufgefangen werden', 'Reflexionsgesetz'],
        evidenceCheckId: 'virtual_image_uncatchable',
      },
    },
  ],
}

/* ------------------------------------------------- Sammellinse (Mittelschule, Optik) -- */

const LENS_BEYOND_2F: SelfCheckItem = {
  id: 'lens-beyond-2f',
  prompt: 'Welches Bild entsteht auf dem Schirm, wenn die Kerze außerhalb der doppelten Brennweite (u > 2f) einer Sammellinse steht?',
  takeaway:
    'Bei u > 2f entsteht ein umgekehrtes, verkleinertes, reelles Bild mit einem Bildabstand zwischen f und 2f – genau dieser Bereich wird in Fotoapparaten genutzt: Gegenstände weit außerhalb von 2f erzeugen auf dem Film ein verkleinertes, reelles Bild.',
  options: [
    { id: 'inverted-reduced', label: 'Umgekehrt, verkleinert, reell (f < v < 2f, Fotoapparat)', correct: true },
    {
      id: 'upright-virtual',
      label: 'Aufrecht, verkleinert, virtuell',
      mistake: {
        type: 'concept',
        explanation:
          'Eine Sammellinse erzeugt nur bei u < f ein virtuelles Bild, und dieses ist vergrößert. Bei u > 2f konvergieren die gebrochenen Lichtstrahlen tatsächlich auf dem Schirm und bilden ein auffangbares, reelles Bild, das notwendigerweise umgekehrt ist. „Aufrecht, verkleinert, virtuell" ist ein Merkmal einer Zerstreuungslinse.',
        review: ['Bildentstehungsgesetz der Sammellinse', 'Unterschied zwischen Sammel- und Zerstreuungslinse'],
        evidenceCheckId: 'thin_lens_equation',
      },
    },
    {
      id: 'inverted-magnified',
      label: 'Umgekehrt, vergrößert, reell',
      mistake: {
        type: 'concept',
        explanation:
          'Ein umgekehrtes, vergrößertes, reelles Bild entsteht bei f < u < 2f (Projektorbereich). Bei u > 2f ergibt die Linsengleichung 1/u + 1/v = 1/f v < u und die Abbildungsmassstab m = v/u < 1, das Bild ist also verkleinert. Zum Bestimmen der Bildgröße vergleicht man u mit 2f.',
        review: ['Bildentstehungsgesetz: Vergleich von u mit 2f', 'Abbildungsmassstab m = v/u'],
        evidenceCheckId: 'thin_lens_equation',
      },
    },
  ],
}

const LENS_WITHIN_F: SelfCheckItem = {
  id: 'lens-within-f',
  prompt: 'Kann man das Bild auf einem Schirm auffangen, wenn man die Kerze innerhalb der Brennweite (u < f) einer Sammellinse platziert?',
  takeaway:
    'Bei u < f divergieren die gebrochenen Lichtstrahlen, ihre rückwärts verlängerten Linien schneiden sich zu einem aufrechten, vergrößerten, virtuellen Bild – genau das Prinzip der Lupe: Das Bild kann nicht auf einem Schirm aufgefangen werden, man muss durch die Linse hindurchschauen.',
  options: [
    {
      id: 'cannot-magnifier',
      label: 'Nein: Es entsteht ein aufrechtes, vergrößertes, virtuelles Bild, das nur durch die Linse betrachtet werden kann (Lupe)',
      correct: true,
    },
    {
      id: 'move-screen-far',
      label: 'Ja, man braucht den Schirm nur weit genug entfernt aufzustellen',
      mistake: {
        type: 'modeling',
        explanation:
          'Bei u < f sind die gebrochenen Lichtstrahlen divergent, je weiter sie sich fortpflanzen, desto weiter entfernen sie sich voneinander, sie werden niemals konvergieren. Das Verschieben des Schirms löst also nicht das Problem „kein Konvergenzpunkt". Das Bild liegt auf der Seite der rückwärts verlängerten Strahlen und ist nur durch die Linse sichtbar.',
        review: ['Bei u < f entsteht ein virtuelles Bild', 'Unterschied zwischen reellem und virtuellem Bild'],
        evidenceCheckId: 'virtual_image_uncatchable',
      },
    },
    {
      id: 'screen-at-focus',
      label: 'Ja, man stellt den Schirm einfach im Brennpunkt auf',
      mistake: {
        type: 'concept',
        explanation:
          'Der Brennpunkt ist der Konvergenzpunkt für parallel zur optischen Achse einfallende Lichtstrahlen, nicht der Bildort für einen beliebigen Gegenstand. Bei u < f gibt es überhaupt keinen tatsächlichen Konvergenzpunkt der gebrochenen Strahlen, daher bleibt der Schirm im Brennpunkt leer. Ein reelles Bild würde nur an einem Ort v existieren, der hier nicht definiert ist.',
        review: ['Bedeutung von Brennpunkt und Brennweite', 'Virtuelles Bild kann nicht auf einem Schirm aufgefangen werden'],
        evidenceCheckId: 'virtual_image_uncatchable',
      },
    },
  ],
}

/* ------------------------------------------------- Hohlspiegel (Mittelschule, Optik) -- */

const CURVED_MIRROR_BEYOND_2F: SelfCheckItem = {
  id: 'curved-mirror-beyond-2f',
  prompt: 'Welches Bild entsteht, wenn eine Kerze außerhalb der doppelten Brennweite (u > 2f) eines Hohlspiegels steht?',
  takeaway:
    'Hohlspiegel folgen der gleichen Grundgleichung 1/u + 1/v = 1/f wie Sammellinsen: Bei u > 2f entsteht ein umgekehrtes, verkleinertes, reelles Bild. Da es sich jedoch um Reflexion handelt, kehren die Lichtstrahlen zurück und das reelle Bild liegt vor dem Spiegel (auf der gleichen Seite wie die Kerze), wo es auf einem Schirm aufgefangen werden kann.',
  options: [
    {
      id: 'inverted-reduced-front',
      label: 'Umgekehrt, verkleinert, reell, vor dem Spiegel (auf der Kerzenseite)',
      correct: true,
    },
    {
      id: 'plane-mirror-like',
      label: 'Aufrecht, gleich groß, virtuell, hinter dem Spiegel (wie beim ebenen Spiegel)',
      mistake: {
        type: 'concept',
        explanation:
          'Ein aufrechtes, gleich großes, virtuelles Bild ist charakteristisch für einen ebenen Spiegel. Ein Hohlspiegel fokussiert parallel zur optischen Achse einfallendes Licht im Brennpunkt; bei u > 2f konvergieren die reflektierten Lichtstrahlen tatsächlich und bilden ein umgekehrtes, verkleinertes, reelles Bild. Vergleiche daher immer u mit f und 2f und verwechsle nicht Kugelspiegel mit ebenen Spiegeln.',
        review: ['Unterschied zwischen Kugelspiegel und ebenem Spiegel', 'Bildentstehungsgesetz des Hohlspiegels'],
        evidenceCheckId: 'curved_mirror_equation',
      },
    },
    {
      id: 'real-behind-mirror',
      label: 'Umgekehrt, verkleinert, reell, hinter dem Spiegel',
      mistake: {
        type: 'concept',
        explanation:
          'Die Spiegelfläche ist undurchsichtig: Alle reflektierten Lichtstrahlen kehren zur Vorderseite zurück, hinter dem Spiegel treffen keine tatsächlichen Lichtstrahlen ein. Reelle Bilder können daher nur dort entstehen, wo tatsächliche Lichtstrahlen konvergieren, d. h. vor dem Spiegel. Die Regel „reelles Bild auf der anderen Seite des optischen Elements" gilt für Linsen (durchlässig), nicht für Spiegel (reflektierend).',
        review: ['Unterschied zwischen Reflexion und Brechung bei der Bildentstehung', 'Reelles Bild entsteht am Ort der tatsächlichen Strahlenkonvergenz'],
        evidenceCheckId: 'principal_rays_converge',
      },
    },
  ],
}

const CURVED_MIRROR_WITHIN_F: SelfCheckItem = {
  id: 'curved-mirror-within-f',
  prompt: 'Kann man das Bild auf einem Schirm auffangen, wenn man die Kerze innerhalb der Brennweite (u < f) eines Hohlspiegels platziert?',
  takeaway:
    'Bei u < f divergieren die reflektierten Lichtstrahlen, ihre rückwärts verlängerten Linien schneiden sich hinter dem Spiegel zu einem aufrechten, vergrößerten, virtuellen Bild – genau wie bei einem Kosmetik- oder Zahnspiegel: Das Bild kann nicht auf einem Schirm aufgefangen werden, man muss direkt in den Spiegel schauen.',
  options: [
    {
      id: 'cannot-makeup-mirror',
      label: 'Nein: Es entsteht ein aufrechtes, vergrößertes, virtuelles Bild, das nur im Spiegel betrachtet werden kann (Kosmetikspiegel)',
      correct: true,
    },
    {
      id: 'screen-behind',
      label: 'Ja, stellt man den Schirm hinter den Spiegel an die Bildposition, kann man es auffangen',
      mistake: {
        type: 'modeling',
        explanation:
          'Die korrekte Position reicht nicht aus: Das Bild hinter dem Spiegel ist der Schnittpunkt der rückwärts verlängerten reflektierten Lichtstrahlen, dort treffen keine tatsächlichen Lichtstrahlen ein. Ein Schirm an dieser Stelle bleibt daher leer. Nur reelle Bilder, die durch tatsächliche Strahlenkonvergenz entstehen, können aufgefangen werden.',
        review: ['Unterschied zwischen reellem und virtuellem Bild', 'Virtuelles Bild kann nicht auf einem Schirm aufgefangen werden'],
        evidenceCheckId: 'virtual_image_uncatchable',
      },
    },
    {
      id: 'always-converges',
      label: 'Ja, ein Hohlspiegel kann Licht immer zu einem reellen Bild konvergieren lassen',
      mistake: {
        type: 'concept',
        explanation:
          'Die Konvergenzfähigkeit eines Hohlspiegels ist begrenzt: Befindet sich der Gegenstand innerhalb der Brennweite, ist der einfallende Lichtkegel zu divergent, die reflektierten Strahlen bleiben divergent und es gibt keinen Konvergenzpunkt. Nur bei u > f entsteht ein reelles Bild, bei u < f entsteht ein vergrößertes, virtuelles Bild.',
        review: ['Bildentstehungsgesetz des Hohlspiegels: Vergleich von u mit f', 'Bedeutung des Brennpunkts'],
        evidenceCheckId: 'curved_mirror_equation',
      },
    },
  ],
}

/* ------------------------------------------------- Echolotung (Mittelschule, Akustik) -- */

const ECHO_DISTANCE_FORMULA: SelfCheckItem = {
  id: 'echo-distance-formula',
  prompt: 'Man ruft gegen eine Felswand und hört das Echo nach 2 s. Mit Schallgeschwindigkeit v = 340 m/s beträgt der Abstand zwischen Rufer und Felswand?',
  takeaway:
    'Die 2 s sind die Gesamtzeit für Hin- und Rückweg des Schalls: Die Gesamtstrecke ist v·t = 680 m (doppelter Weg), der einfache Abstand ist also die Hälfte davon, d = v·t/2 = 340 m – das Halbieren ist der leichteste Fehler bei der Echolotung.',
  options: [
    { id: 'half-trip', label: '340 m (d = v·t/2, der Schall legt Hin- und Rückweg zurück)', correct: true },
    {
      id: 'full-trip',
      label: '680 m (Abstand = Geschwindigkeit × Zeit)',
      mistake: {
        type: 'concept',
        explanation:
          's = v·t ist prinzipiell richtig, aber 680 m ist die vom Schall in 2 s zurückgelegte Gesamtstrecke: Der Schall erreicht zunächst die Felswand und kehrt dann zurück, in 2 s hat er also Hin- und Rückweg vollständig zurückgelegt. Der Abstand zum Felsen ist nur die Hälfte davon, daher muss noch durch 2 geteilt werden.',
        review: ['Echolotung d = v·t/2', 'Unterschied zwischen Hin- und Rückweg und einfachem Abstand'],
        evidenceCheckId: 'echo_distance_formula',
      },
    },
    {
      id: 'quarter-trip',
      label: '170 m (Hin- und Rückweg je 1 s, dann nochmal halbieren)',
      mistake: {
        type: 'concept',
        explanation:
          '„Hin- und Rückweg beanspruchen je 1 s" ist korrekt, dann legt der Schall in 1 s genau den einfachen Abstand zurück: d = v·t₁ = 340 × 1 = 340 m. Man halbiert also nur einmal – entweder teilt man die Gesamtzeit durch 2, oder teilt man die Gesamtstrecke durch 2, aber nicht beides.',
        review: ['Echolotung d = v·t/2', 'Einzelwegzeit t₁ = t/2'],
        evidenceCheckId: 'reflection_symmetry',
      },
    },
  ],
}

const ECHO_MEDIUM_SPEED: SelfCheckItem = {
  id: 'echo-medium-speed',
  prompt: 'Wenn man mit derselben Methode Unterwasserentfernung misst (Sonar), ist die gemessene Echozeit viel kürzer als in Luft. Was ist der Hauptgrund?',
  takeaway:
    'Die Schallgeschwindigkeit hängt vom Ausbreitungsmedium ab: In Wasser beträgt sie etwa 1500 m/s und ist damit viel größer als in Luft (ca. 340 m/s bei 15 °C), bei gleicher Entfernung ist die Hin- und Rücklaufzeit daher deutlich kürzer – bei der Berechnung muss stets die zum Medium gehörende Schallgeschwindigkeit verwendet werden.',
  options: [
    { id: 'medium-speed', label: 'Die Schallgeschwindigkeit in Wasser (ca. 1500 m/s) ist viel größer als in Luft', correct: true },
    {
      id: 'louder-faster',
      label: 'Das Sonar sendet lautere Schallwellen aus, die sich schneller ausbreiten',
      mistake: {
        type: 'concept',
        explanation:
          'Die Lautstärke beschreibt die Stärke des Schalls und wird durch die Amplitude bestimmt; die Ausbreitungsgeschwindigkeit wird hingegen durch das Medium bestimmt und ist unabhängig von der Lautstärke. Selbst der lauteste Schall breitet sich im gleichen Medium mit derselben konstanten Geschwindigkeit aus.',
        review: ['Schallgeschwindigkeit wird vom Medium bestimmt', 'Unterschied zwischen Lautstärke und Amplitude'],
        evidenceCheckId: 'pulse_speed_constant',
      },
    },
    {
      id: 'water-shorter-path',
      label: 'Der Schall legt im Wasser einen kürzeren Weg zurück',
      mistake: {
        type: 'modeling',
        explanation:
          'Schall breitet sich geradlinig aus, Hin- und Rückweg sind jeweils genau dieselbe Strecke vom Sender zum Reflektor. Das Medium ändert nicht die Weglänge. Die kürzere Zeit lässt sich nur durch eine höhere Geschwindigkeit erklären: t = 2d/v, je größer v, desto kleiner t.',
        review: ['Schall breitet sich geradlinig aus', 'Echozeit t = 2d/v'],
        evidenceCheckId: 'echo_distance_formula',
      },
    },
  ],
}

/* ---------------------------------------------------------------- buoyancy -- */

const BUOYANCY_DEPTH: SelfCheckItem = {
  id: 'buoyancy-depth',
  prompt: 'Ein Aluminiumblock ist bereits vollständig unter Wasser getaucht. Wird er noch tiefer in das Wasser gedrückt, wie ändert sich die Anzeige der Federwaage?',
  takeaway:
    'F_A = ρ_Fl·g·V_verdr enthält keine Tiefenabhängigkeit: Ist der Körper vollständig eingetaucht, ist das verdrängte Volumen V_verdr gleich dem Körpervolumen und ändert sich auch bei weiterem Absenken nicht, daher bleibt der Auftrieb und damit auch die Waagenanzeige unverändert.',
  options: [
    { id: 'unchanged', label: 'Unverändert (V_verdr ist bereits gleich dem Körpervolumen und ändert sich nicht mit der Tiefe)', correct: true },
    {
      id: 'deeper-more-buoyant',
      label: 'Sie wird kleiner (je tiefer eingetaucht, desto größer der Auftrieb, der Block wird leichter)',
      mistake: {
        type: 'concept',
        explanation:
          '„Je tiefer, desto größer der Auftrieb" gilt nur solange der Körper noch nicht vollständig eingetaucht ist – in diesem Fall nimmt das verdrängte Volumen noch zu. Sobald der Körper vollständig eingetaucht ist, ist V_verdr festgelegt und ändert sich nicht mehr, der Auftrieb bleibt daher konstant.',
        review: ['Auftrieb hängt nur von ρ_Fl und V_verdr ab', 'Unterschied zwischen teilweisem und vollständigem Eintauchen'],
        evidenceCheckId: 'buoyancy_depth_independent',
      },
    },
    {
      id: 'deeper-more-pressure',
      label: 'Sie wird größer (mit zunehmender Wassertiefe steigt der Druck und drückt den Block stärker nach unten)',
      mistake: {
        type: 'concept',
        explanation:
          'Der Druck steigt zwar mit der Tiefe, jedoch steigen sowohl der Druck auf die Oberseite als auch auf die Unterseite gleichzeitig an. Der Unterschied ergibt sich als ρ_Fl·g·h und hängt nur von der Höhe des Körpers ab – der Auftrieb entsteht aus diesem Druckunterschied, nicht aus dem Absolutdruck.',
        review: ['Auftrieb entsteht aus dem Druckunterschied zwischen Ober- und Unterseite', 'Unterschied zwischen p = ρgh und Druckdifferenz'],
        evidenceCheckId: 'archimedes_principle',
      },
    },
  ],
}

const BUOYANCY_LIQUID: SelfCheckItem = {
  id: 'buoyancy-liquid',
  prompt:
    'Wird derselbe Aluminiumblock aus Wasser (1,0×10³ kg/m³) in vollständig eingetauchtes Salzwasser (1,1×10³ kg/m³) überführt, wie verändern sich Auftrieb und Waagenanzeige?',
  takeaway:
    'Bei vollständigem Eintauchen bleibt V_verdr konstant, der Auftrieb hängt nur von der Flüssigkeitsdichte ab: ρ_Fl steigt um 10 %, daher steigt F_A um 10 %. Da G konstant bleibt, nimmt die Anzeige F_Anzeige = G − F_A entsprechend ab.',
  options: [
    { id: 'more-buoyant', label: 'Auftrieb steigt, Waagenanzeige sinkt', correct: true },
    {
      id: 'nothing-changes',
      label: 'Beide bleiben unverändert (Masse und Volumen des Blocks ändern sich nicht)',
      mistake: {
        type: 'concept',
        explanation:
          'Der Auftrieb ist gleich dem Gewicht der verdrängten Flüssigkeit und hängt davon ab, welche Flüssigkeit verdrängt wird. Der Block hat sich nicht verändert, aber dieselben 100 cm³ Salzwasser wiegen mehr als 100 cm³ Wasser, daher ist die Auftriebskraft größer.',
        review: ['F_A = ρ_Fl·g·V_verdr', 'Auftrieb hängt von der Flüssigkeitsdichte ab'],
        evidenceCheckId: 'archimedes_principle',
      },
    },
    {
      id: 'both-up',
      label: 'Auftrieb steigt, Waagenanzeige steigt ebenfalls',
      mistake: {
        type: 'modeling',
        explanation:
          'Anzeige und Auftrieb sind gegenläufig: Auf den Block wirken Gewicht G, Zugkraft F_Anzeige und Auftrieb F_A im Gleichgewicht. G bleibt konstant, nimmt F_A zu, trägt der Auftrieb mehr Gewicht, so zieht die Waage weniger – die Kräfte bilanzieren sich nach F_Anzeige + F_A = G. Wenn beide zunähmen, wäre dieses Gleichgewicht verletzt.',
        review: ['Tauchwägung F_A = G − F_Anzeige', 'Kräftegleichgewicht bei aufgehängtem Körper'],
        evidenceCheckId: 'scale_reading_balance',
      },
    },
  ],
}

/* ----------------------------------------------------------------- melting -- */

const MELTING_PLATEAU: SelfCheckItem = {
  id: 'melting-plateau',
  prompt: 'Wird Eis kontinuierlich erwärmt, bleibt das Thermometer mehrere Minuten lang bei 0 °C stehen. Wird in dieser Zeit weiterhin Wärme aufgenommen?',
  takeaway:
    'Beim Schmelzen eines Kristalls wird die zugeführte Wärme vollständig zur Aufhebung der Kristallstruktur verbraucht, nicht zur Temperaturerhöhung – konstante Temperatur bedeutet also nicht, dass keine Wärme zugeführt wird. Der Heizkörper läuft ununterbrochen, und der waagerechte Abschnitt im Diagramm zeigt genau die Aufnahme der Schmelzwärme Q = m·L.',
  options: [
    { id: 'absorbs', label: 'Ja, es nimmt Wärme auf (die Wärme wird zum Schmelzen verbraucht, nicht zur Temperaturerhöhung)', correct: true },
    {
      id: 'no-heat',
      label: 'Nein, es nimmt keine Wärme mehr auf (konstante Temperatur bedeutet kein Wärmestrom)',
      mistake: {
        type: 'concept',
        explanation:
          'Konstante Temperatur bedeutet nur, dass der Anteil der inneren Energie, der die mittlere kinetische Energie der Moleküle widerspiegelt, unverändert bleibt – das schließt jedoch nicht aus, dass Energie zugeführt wird. Bei konstanter Heizleistung wird weiterhin pro Sekunde Energie zugeführt, diese wird jedoch vollständig zum Aufbrechen der Kristallstruktur verwendet.',
        review: ['Beim Schmelzen wird Wärme aufgenommen, die Temperatur bleibt jedoch konstant', 'Schmelzwärme Q = m·L'],
        evidenceCheckId: 'melting_plateau',
      },
    },
    {
      id: 'broken-thermometer',
      label: 'Das Thermometer ist defekt (bei kontinuierlicher Erwärmung muss die Temperatur steigen)',
      mistake: {
        type: 'modeling',
        explanation:
          'Genau das ist ein charakteristisches Merkmal von Kristallen: Sie haben einen festen Schmelzpunkt, und während des Schmelzens bleibt die Temperatur bei diesem Punkt konstant. Führt man denselben Versuch mit einem amorphen Stoff wie Harz durch, steigt die Temperatur kontinuierlich an – ein direkter Vergleich zeigt, dass das Thermometer intakt ist.',
        review: ['Kristalle haben einen festen Schmelzpunkt', 'Unterschied zwischen kristallinen und amorphen Stoffen im Schmelzdiagramm'],
        evidenceCheckId: 'plateau_duration',
      },
    },
  ],
}

const MELTING_HEATING_RATE: SelfCheckItem = {
  id: 'melting-heating-rate',
  prompt: 'Im gleichen Versuchsaufbau mit gleicher Heizleistung: Warum steigt die Temperatur des Wassers nach dem vollständigen Schmelzen viel langsamer als zuvor die Temperatur des Eises?',
  takeaway:
    'Die Erwärmungsgeschwindigkeit wird durch die spezifische Wärmekapazität bestimmt: Die Aufheizrate beträgt P/(c·m). Die spezifische Wärmekapazität von Wasser (4200 J/(kg·°C)) ist doppelt so groß wie die von Eis (2100 J/(kg·°C)), daher halbiert sich bei gleicher Leistung und Masse die Aufheizgeschwindigkeit.',
  options: [
    { id: 'specific-heat', label: 'Wasser hat eine größere spezifische Wärmekapazität als Eis, daher steigt seine Temperatur bei gleicher Leistung langsamer', correct: true },
    {
      id: 'losing-heat',
      label: 'Wasser gibt Wärme schneller ab, ein Großteil der Wärme geht verloren',
      mistake: {
        type: 'modeling',
        explanation:
          'Wärmeverlust tritt zwar auf, kann jedoch nicht das exakte Verhältnis 1:2 erklären. Misst man die Steigungen der Geradenabschnitte für Eis und für Wasser, verhalten sie sich umgekehrt wie die spezifischen Wärmekapazitäten – das ist eine direkte Folge der Definition der spezifischen Wärmekapazität, nicht von Verlusten.',
        review: ['Aufheizrate = P/(c·m)', 'Bedeutung der spezifischen Wärmekapazität'],
        evidenceCheckId: 'heating_rate_ratio',
      },
    },
    {
      id: 'mass-changed',
      label: 'Die Masse wird kleiner, wenn Eis zu Wasser schmilzt',
      mistake: {
        type: 'concept',
        explanation:
          'Beim Schmelzen handelt es sich nur um einen Phasenübergang, die Masse bleibt erhalten – 100 g Eis ergeben 100 g Wasser. Was sich ändert, ist die spezifische Wärmekapazität, nicht die Masse; zudem würde eine kleinere Masse zu einer schnelleren Temperaturerhöhung führen.',
        review: ['Masse bleibt beim Schmelzen erhalten', 'Bedeutung der Größen in Q = c·m·ΔT'],
        evidenceCheckId: 'energy_conservation',
      },
    },
  ],
}

const HEAT_CAPACITY_RATIO: SelfCheckItem = {
  id: 'heat-capacity-ratio',
  prompt: 'Gleiche Massen Wasser und Petroleum werden mit demselben Heizgerät für dieselbe Zeit erwärmt: Wasser erwärmt sich um 50 °C, Petroleum um 100 °C. Was folgt daraus?',
  takeaway:
    'Die aufgenommene Wärme ist gleich, die Temperaturerhöhung unterscheidet sich jedoch um den Faktor 2: Die spezifische Wärmekapazität von Wasser ist doppelt so groß wie die von Petroleum. Die spezifische Wärmekapazität ist ein Maß für die „Wärmespeicherfähigkeit" – je größer c, desto weniger steigt die Temperatur bei gleicher zugeführter Wärme.',
  options: [
    { id: 'water-higher-c', label: 'Wasser hat eine größere spezifische Wärmekapazität, bei gleicher Wärme steigt seine Temperatur weniger stark', correct: true },
    {
      id: 'water-less-heat',
      label: 'Wasser nimmt tatsächlich weniger Wärme auf',
      mistake: {
        type: 'concept',
        explanation:
          'Genau das sollen die Kontrollvariablen ausschließen: Gleiche Leistung und gleiche Zeit bedeuten Q = P·t ist für beide identisch. Der Unterschied liegt also nicht in der zugeführten Wärme, sondern darin, wie stark diese Wärme die Temperatur erhöht.',
        review: ['Q = P·t ist für beide gleich', 'Kontrollvariablen: gleiche Masse, gleiche Leistung, gleiche Zeit'],
        evidenceCheckId: 'equal_heat_absorbed',
      },
    },
    {
      id: 'kerosene-thinner',
      label: 'Petroleum ist „dünner", deshalb erwärmt es sich schneller',
      mistake: {
        type: 'modeling',
        explanation:
          'Die Dichte ist in diesem Experiment keine Variable. Das Verhältnis der Temperaturerhöhungen entspricht genau dem umgekehrten Verhältnis der spezifischen Wärmekapazitäten (4200:2100 = 2:1) – dies ergibt sich direkt aus der Definition von c, nicht aus der „Dünnflüssigkeit".',
        review: ['ΔT / ΔT′ = c′ / c', 'Bedeutung der spezifischen Wärmekapazität'],
        evidenceCheckId: 'specific_heat_ratio',
      },
    },
  ],
}

const HEAT_CAPACITY_EQUAL_Q: SelfCheckItem = {
  id: 'heat-capacity-equal-q',
  prompt: 'Warum müssen in diesem Versuch zwei identische Heizgeräte verwendet und beide Flüssigkeiten für die gleiche Zeit erwärmt werden?',
  takeaway:
    'Um die Wärmespeicherfähigkeit zu vergleichen, muss die aufgenommene Wärme auf beiden Seiten gleich sein. Aus Q = c·m·ΔT folgt: Sind Q und m gleich, spiegelt die Differenz von ΔT direkt den Unterschied der spezifischen Wärmekapazität c wider. Ohne diese Kontrollbedingung lässt sich c nicht korrekt vergleichen.',
  options: [
    { id: 'same-heat', label: 'Damit beide Flüssigkeiten die gleiche Wärmemenge aufnehmen, sodass die Temperaturdifferenz nur die spezifische Wärmekapazität widerspiegelt', correct: true },
    {
      id: 'faster-finish',
      label: 'Damit beide Versuche gleichzeitig beendet werden und Zeit gespart wird',
      mistake: {
        type: 'concept',
        explanation:
          'Das gleichzeitige Beenden ist nur eine Erleichterung bei der Ablesung, nicht der eigentliche Grund. Hätte ein Heizgerät eine höhere Leistung, würde die entsprechende Flüssigkeit mehr Wärme aufnehmen, und eine größere Temperaturerhöhung ließe sich nicht mehr eindeutig auf eine kleinere spezifische Wärmekapazität zurückführen.',
        review: ['Kontrollvariable: Q muss gleich sein', 'Q = P·t'],
        evidenceCheckId: 'equal_heat_absorbed',
      },
    },
    {
      id: 'same-temperature',
      label: 'Damit beide auf dieselbe Endtemperatur erwärmt werden, um sie besser vergleichen zu können',
      mistake: {
        type: 'modeling',
        explanation:
          'In diesem Versuch wird gerade der Unterschied der Temperaturerhöhung ΔT verglichen, nicht angestrebt, dass die Endtemperaturen gleich sind. Würde man bis zur gleichen Endtemperatur erwärmen, wären die Erwärmungszeiten (und damit die aufgenommenen Wärmemengen Q = P·t) unterschiedlich, sodass wieder zwei Variablen vermischt würden.',
        review: ['Verglichen wird ΔT, nicht die Endtemperatur', 'In Q = c·m·ΔT müssen zunächst Q und m konstant gehalten werden'],
        evidenceCheckId: 'specific_heat_ratio',
      },
    },
  ],
}

/* ---------------------------------------------------------------- lever -- */

const LEVER_DOUBLE_MASS: SelfCheckItem = {
  id: 'lever-double-mass',
  prompt: 'Ein Hebel ist im Gleichgewicht. Verdoppelt man die Masse der Gewichtsstücke auf der linken Seite, lässt die rechte Seite unverändert, wie muss der linke Hebelarm verändert werden, um das Gleichgewicht wiederherzustellen?',
  takeaway:
    'Die Gleichgewichtsbedingung lautet F₁·l₁ = F₂·l₂. Verdoppelt sich die Kraft auf der linken Seite, muss der Hebelarm halbiert werden, damit das Produkt wieder dem ursprünglichen Drehmoment entspricht. Ändert sich die Kraft, muss sich auch der Hebelarm entsprechend ändern.',
  options: [
    { id: 'halve-arm', label: 'Halbieren (verdoppelte Kraft erfordert halben Hebelarm)', correct: true },
    {
      id: 'double-arm',
      label: 'Verdoppeln (größere Masse muss weiter außen aufgehängt werden)',
      mistake: {
        type: 'concept',
        explanation:
          'Würde man den Hebelarm vergrößern, würde das linke Drehmoment noch größer werden und der Hebel noch weiter aus dem Gleichgewicht geraten. Um F·l konstant zu halten, wenn F größer wird, muss l kleiner werden.',
        review: ['F₁·l₁ = F₂·l₂', 'Drehmoment M = F·l'],
        evidenceCheckId: 'moment_from_force',
      },
    },
    {
      id: 'unchanged',
      label: 'Nicht verändern, der Drehpunkt findet von selbst eine neue Gleichgewichtslage',
      mistake: {
        type: 'modeling',
        explanation:
          'In diesem Versuch ist der Drehpunkt fest fixiert. Das Gleichgewicht eines Hebels erster Art wird nicht durch Verschieben des Drehpunkts hergestellt, sondern dadurch, dass die Drehmomente auf beiden Seiten gleich groß sind. Ändert sich eine Kraft, muss entweder der Hebelarm oder die Kraft auf der anderen Seite angepasst werden.',
        review: ['Hebel erster Art: Drehpunkt ist fest', 'Gleichgewichtsbedingung F₁·l₁ = F₂·l₂'],
        evidenceCheckId: 'moment_balance',
      },
    },
  ],
}

const LEVER_SLIDE_OUT: SelfCheckItem = {
  id: 'lever-slide-out',
  prompt: 'Wird ein Gewichtsstück auf der rechten Seite des Hebels weiter nach außen verschoben, wie ändert sich die Wirkung auf den Hebel?',
  takeaway:
    'Die Gewichtskraft G = m·g des Gewichtsstücks bleibt unverändert, jedoch wird der Hebelarm größer. Das Drehmoment M = F·l nimmt zu, daher drückt die rechte Seite den Hebel stärker nach unten. Durch das Verschieben ändert sich also das Drehmoment, nicht die Kraft selbst.',
  options: [
    { id: 'moment-up', label: 'Die Gewichtskraft bleibt unverändert, der Hebelarm wird größer, das Drehmoment nimmt zu', correct: true },
    {
      id: 'force-up',
      label: 'Das Gewichtsstück wird schwerer, daher drückt es den Hebel stärker nach unten',
      mistake: {
        type: 'concept',
        explanation:
          'Es handelt sich noch um dasselbe Gewichtsstück, die Masse ist unverändert, daher ist auch die Gewichtskraft G = m·g unverändert. Durch das Verschieben nach außen wird nur der Hebelarm verlängert, das Drehmoment vergrößert sich, nicht die Kraft.',
        review: ['G = m·g hängt nur von Masse und g ab', 'M = F·l ändert sich mit l'],
        evidenceCheckId: 'weight_from_mass',
      },
    },
    {
      id: 'cancels',
      label: 'Kraft und Hebelarm heben sich gegenseitig auf, der Hebel bleibt im Gleichgewicht',
      mistake: {
        type: 'modeling',
        explanation:
          'Kraft und Hebelarm werden multipliziert, nicht subtrahiert oder aufgehoben. Wird der Hebelarm auf einer Seite größer, vergrößert sich das Drehmoment dieser Seite allein, wodurch die ursprüngliche Gleichgewichtsbedingung F₁·l₁ = F₂·l₂ gestört wird und der Hebel zu dieser Seite kippt.',
        review: ['M = F·l ist ein Produkt', 'Für Gleichgewicht müssen beide Drehmomente wieder gleich sein'],
        evidenceCheckId: 'moment_balance',
      },
    },
  ],
}

/* --------------------------------------------------------------- friction -- */

const FRICTION_STATIC_FOLLOWS: SelfCheckItem = {
  id: 'friction-static-follows',
  prompt: 'Mit einer Federwaage wird ein Block horizontal gezogen, die Zugkraft wird langsam von 0 aufwärts erhöht, doch der Block bewegt sich noch nicht. Wie groß ist in diesem Moment die Haftreibung?',
  takeaway:
    'Haftreibung ist eine „ausgleichende Kraft": Da der Block noch in Ruhe ist, ist die resultierende Kraft null, die Haftreibung ist stets gleich der momentanen Zugkraft f = F und wächst mit dieser, bis sie ihren Maximalwert f_{max} = μ_H·N erreicht.',
  options: [
    { id: 'equals-pull', label: 'Gleich der momentanen Zugkraft (f = F, wächst mit der Zugkraft)', correct: true },
    {
      id: 'fixed-muk',
      label: 'Konstant gleich μ_G·N, unabhängig von der Zugkraft',
      mistake: {
        type: 'concept',
        explanation:
          'μ_G·N ist der Betrag der Gleitreibung, der Block bewegt sich jedoch noch nicht. Im Ruhezustand nimmt die Haftreibung genau den Wert an, der erforderlich ist, um die Zugkraft auszugleichen: Beträgt die Zugkraft 3 N, so ist f = 3 N, nicht ein fester Wert μ_G·N.',
        review: ['Haftreibung ist ausgleichend: f = F (solange keine Bewegung)', 'Gleitreibung ist f = μ_G·N'],
        evidenceCheckId: 'static_friction_balance',
      },
    },
    {
      id: 'always-max',
      label: 'Stets gleich der maximalen Haftreibung μ_H·N',
      mistake: {
        type: 'concept',
        explanation:
          'μ_H·N ist nur der Grenzwert (Obergrenze) der Haftreibung, nicht deren aktueller Wert. Erst im Augenblick unmittelbar vor dem Beginn der Bewegung erreicht die Haftreibung ihren Maximalwert μ_H·N; zuvor ist f immer gleich der jeweiligen Zugkraft.',
        review: ['f_H ≤ μ_H·N ist eine Ungleichung mit Obergrenze', 'Bewegungsbeginn bei F = μ_H·N'],
        evidenceCheckId: 'static_limit',
      },
    },
  ],
}

const FRICTION_KINETIC_CONSTANT: SelfCheckItem = {
  id: 'friction-kinetic-constant',
  prompt: 'Der Block gleitet bereits. Wird die Zugkraft nun weiter erhöht, wie ändert sich die Gleitreibung?',
  takeaway:
    'Die Gleitreibung beträgt f = μ_G·N und hängt nur von μ_G und der Normalkraft N ab, nicht von der Zugkraft. Eine Erhöhung der Zugkraft ändert daher nur die resultierende Kraft und die Beschleunigung a = (F − f)/m, nicht jedoch f selbst.',
  options: [
    { id: 'unchanged', label: 'Sie bleibt unverändert, weiterhin μ_G·N (nur die Beschleunigung nimmt zu)', correct: true },
    {
      id: 'grows-with-pull',
      label: 'Sie nimmt mit der Zugkraft zu',
      mistake: {
        type: 'concept',
        explanation:
          'Der für die Haftreibung gültige Zusammenhang „wächst mit der äußeren Kraft" darf nicht auf die Gleitreibung übertragen werden. Sobald der Körper gleitet, ist f = μ_G·N konstant; auch wenn die Zugkraft weiter zunimmt, bleibt der Betrag der Gleitreibung gleich.',
        review: ['Gleitreibung f = μ_G·N ist unabhängig von der äußeren Kraft', 'Nur a = (F − f)/m ändert sich mit der Zugkraft'],
        evidenceCheckId: 'kinetic_friction',
      },
    },
    {
      id: 'equals-pull',
      label: 'Sie wird gleich der Zugkraft (Gleichgewicht)',
      mistake: {
        type: 'modeling',
        explanation:
          'f = F gilt nur im Ruhezustand bei Gleichgewicht. Der Block beschleunigt bereits, die resultierende Kraft ist also ungleich null: F > f, und die Differenz erzeugt die Beschleunigung.',
        review: ['Im Gleitfall ist F − μ_G·N ≠ 0', 'f = F gilt nur für ruhende Körper im Gleichgewicht'],
        evidenceCheckId: 'kinetic_friction',
      },
    },
  ],
}

/* ----------------------------------------------------------------- spring -- */

const SPRING_PERIOD_MASS: SelfCheckItem = {
  id: 'spring-period-mass',
  prompt: 'Im Federpendelversuch wird die Masse des schwingenden Körpers vervierfacht. Wie ändert sich die Schwingungsdauer?',
  takeaway:
    'T = 2π√(m/k): Die Schwingungsdauer ist proportional zu √m. Wird m vervierfacht, wird T genau verdoppelt – dies ist neben der Amplitudenunabhängigkeit der zweite nachweisbare Zusammenhang.',
  options: [
    { id: 'doubles', label: 'Sie verdoppelt sich (T ∝ √m)', correct: true },
    {
      id: 'quadruples',
      label: 'Sie vervierfacht sich (vielfache Masse → vielfache Schwingungsdauer)',
      mistake: {
        type: 'concept',
        explanation: 'In T = 2π√(m/k) steht m unter der Wurzel: Proportional ist √m, nicht m. Eine Vervierfachung von m führt also nur zu einer Verdopplung von √m.',
        review: ['T = 2π√(m/k)', 'Wurzelbeziehung: Faktor 4 → Faktor 2'],
        evidenceCheckId: 'period_consistency',
      },
    },
    {
      id: 'unchanged',
      label: 'Sie bleibt unverändert, die Schwingungsdauer hängt nur von der Feder ab',
      mistake: {
        type: 'concept',
        explanation:
          'T wird sowohl von m als auch von k bestimmt. „Unabhängig von der Amplitude" bedeutet nicht „unabhängig von der Masse" – nur eine Verdopplung von A lässt T unverändert.',
        review: ['T = 2π√(m/k) enthält m', 'T ist unabhängig von der Amplitude A'],
        evidenceCheckId: 'period_consistency',
      },
    },
  ],
}

const SPRING_HOOKE_EXTENSION: SelfCheckItem = {
  id: 'spring-hooke-extension',
  prompt: 'An einer vertikal aufgehängten Feder wird das Gewichtsstück verdoppelt und das System kommt wieder zur Ruhe. Wie ändert sich die Verlängerung Δx?',
  takeaway:
    'Im Gleichgewicht gilt k·Δx = m·g, also Δx = (m·g)/k, d. h. proportional zu m. Wird die Masse verdoppelt, verdoppelt sich auch die Verlängerung – genau nach diesem Prinzip werden Federwaagen geeicht.',
  options: [
    { id: 'doubles', label: 'Sie verdoppelt sich (Δx = m·g/k ∝ m)', correct: true },
    {
      id: 'unchanged',
      label: 'Sie bleibt unverändert, die Verlängerung hängt nur von der Feder ab',
      mistake: {
        type: 'concept',
        explanation:
          'Die Feder bestimmt zwar die Federkonstante k, die Verlängerung hängt aber auch vom angehängten Gewicht ab. Verdoppelt sich m·g bei unverändertem k, muss sich Δx entsprechend verdoppeln.',
        review: ['k·Δx = m·g', 'Δx = m·g/k'],
        evidenceCheckId: 'hooke_equilibrium',
      },
    },
    {
      id: 'squares',
      label: 'Sie vervierfacht sich (Kraft und Dehnung stehen in quadratischem Verhältnis)',
      mistake: {
        type: 'concept',
        explanation: 'F = k·x ist eine lineare Beziehung, kein quadratischer Zusammenhang. Verdoppelt sich die Kraft, verdoppelt sich auch die Dehnung; der F–x-Graph ist im elastischen Bereich eine Gerade durch den Ursprung.',
        review: ['F = k·x ist linear', 'Im elastischen Bereich sind F und x proportional'],
        evidenceCheckId: 'hooke_equilibrium',
      },
    },
  ],
}

/* --------------------------------------------------------------- pendulum -- */

const PENDULUM_PERIOD_MASS: SelfCheckItem = {
  id: 'pendulum-period-mass',
  prompt: 'Am Fadenpendel wird die Pendelkugel durch eine schwerere ersetzt, die Pendellänge bleibt unverändert. Wie ändert sich die Schwingungsdauer?',
  takeaway: 'In T = 2π√(L/g) kommt m nicht vor: Die Schwingungsdauer ist unabhängig von der Masse der Pendelkugel. Genau diesen Zusammenhang beobachtete Galilei an den Kronleuchtern in der Kirche.',
  options: [
    { id: 'unchanged', label: 'Sie bleibt unverändert (T ist unabhängig von der Masse der Pendelkugel)', correct: true },
    {
      id: 'heavier-slower',
      label: 'Sie wird länger, eine schwerere Kugel schwingt langsamer',
      mistake: {
        type: 'concept',
        explanation:
          'Zwar wirkt auf eine schwerere Kugel eine größere Gewichtskraft, aber ihre träge Masse ist ebenfalls größer – in F = m·a kürzt sich m heraus. Dies ist ein direkter Ausdruck der Äquivalenz von träger und schwerer Masse.',
        review: ['T = 2π√(L/g)', 'Gewichtskraft ∝ m, in der Beschleunigung kürzt sich m'],
        evidenceCheckId: 'period_consistency',
      },
    },
    {
      id: 'heavier-faster',
      label: 'Sie wird kürzer, eine schwerere Kugel fällt schneller',
      mistake: {
        type: 'concept',
        explanation:
          'Die Vorstellung „Schwereres fällt schneller" stammt aus der aristotelischen Physik und wird sowohl durch den freien Fall als auch durch das Fadenpendel widerlegt: Die Beschleunigung ist unabhängig von der Masse, daher ist auch die Schwingungsdauer unabhängig von der Masse.',
        review: ['T = 2π√(L/g)', 'Fallgeschwindigkeit ist unabhängig von der Masse'],
        evidenceCheckId: 'period_consistency',
      },
    },
  ],
}

const PENDULUM_LENGTH_PERIOD: SelfCheckItem = {
  id: 'pendulum-length-period',
  prompt: 'Wird die Pendellänge L vervierfacht, um welchen Faktor ändert sich die Schwingungsdauer eines Fadenpendels? Wie lässt sich damit g bestimmen?',
  takeaway:
    'Aus T = 2π√(L/g) folgt: Bei Vervierfachung von L wird T verdoppelt. Umgekehrt lässt sich durch Messen von T und L die Erdbeschleunigung zu g = 4π²L/T² berechnen – genau nach diesem Prinzip funktioniert der Versuch „Bestimmung der Erdbeschleunigung mit dem Fadenpendel".',
  options: [
    { id: 'doubles', label: 'T verdoppelt sich; g berechnet sich aus g = 4π²L/T²', correct: true },
    {
      id: 'quadruples',
      label: 'T vervierfacht sich (vielfache Länge → vielfache Schwingungsdauer)',
      mistake: {
        type: 'concept',
        explanation: 'L steht unter der Wurzel: T ∝ √L. Eine Vervierfachung von L führt nur zu einer Verdopplung von √L, also verdoppelt sich T, nicht vervierfacht sich.',
        review: ['T = 2π√(L/g)', 'T ∝ √L ist nicht linear'],
        evidenceCheckId: 'period_consistency',
      },
    },
    {
      id: 'halves',
      label: 'T halbiert sich (längeres Pendel schwingt schneller)',
      mistake: {
        type: 'modeling',
        explanation: 'Das Gegenteil ist richtig: Je länger das Pendel, desto größer ist der zurückgelegte Weg pro Schwingung und die Rückstellbeschleunigung relativ zur Länge ist kleiner, daher schwingt ein längeres Pendel langsamer und T wird größer.',
        review: ['T = 2π√(L/g)', 'Längeres Pendel → größere Schwingungsdauer'],
        evidenceCheckId: 'rope_length',
      },
    },
  ],
}

/* -------------------------------------------------------------------- emf -- */

const EMF_TERMINAL_VOLTAGE: SelfCheckItem = {
  id: 'emf-terminal-voltage',
  prompt: 'Verringert man den Widerstand des Außenkreises, sodass der Hauptstrom größer wird, wie ändert sich die Klemmenspannung?',
  takeaway:
    'U_K = E − I·r: Bei konstanter elektromotorischer Kraft fällt an einem realen Innenwiderstand eine größere Spannung I·r ab, wenn der Strom I größer wird, daher sinkt die Klemmenspannung – genau dies ist der Grundgedanke beim Experiment zur Bestimmung von E und r.',
  options: [
    { id: 'decreases', label: 'Sie nimmt ab (U_K = E − I·r)', correct: true },
    {
      id: 'constant-emf',
      label: 'Sie bleibt unverändert, die Klemmenspannung ist stets gleich der elektromotorischen Kraft',
      mistake: {
        type: 'concept',
        explanation:
          'Nur bei einer idealen Spannungsquelle mit Innenwiderstand r = 0 gilt U_K ≡ E. Bei einer realen Quelle wird ein Teil der Spannung am Innenwiderstand abfallen: U_K = E − I·r. Mit zunehmendem Strom wird dieser Anteil größer und die Klemmenspannung sinkt.',
        review: ['Klemmenspannung U_K = E − I·r', 'Innenwiderstand einer Spannungsquelle'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
    {
      id: 'increases',
      label: 'Sie nimmt zu (größerer Strom bedeutet größere Spannung)',
      mistake: {
        type: 'concept',
        explanation:
          'Für den Außenkreis gilt zwar U_K = I·R, doch in diesem Fall wird R kleiner und verursacht ein größeres I. Betrachtet man die Quelle, folgt aus U_K = E − I·r, dass mit größerem I die Klemmenspannung kleiner wird, nicht größer.',
        review: ['Gesetz für geschlossenen Stromkreis I = E/(R+r)', 'Klemmenspannung U_K = E − I·r'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
  ],
}

const EMF_OPEN_CIRCUIT: SelfCheckItem = {
  id: 'emf-open-circuit',
  prompt: 'Wird der Schalter geöffnet (I = 0), welchen Wert zeigt das Voltmeter an den Klemmen der Spannungsquelle an?',
  takeaway:
    'Im Leerlauf ist I = 0, am Innenwiderstand fällt keine Spannung ab: U_K = E − 0·r = E. Das Voltmeter zeigt also direkt die elektromotorische Kraft E – dies ist eine gängige Methode zur Messung von E (unter der Annahme eines idealen Voltmeters).',
  options: [
    { id: 'equals-emf', label: 'Gleich der elektromotorischen Kraft E', correct: true },
    {
      id: 'zero',
      label: 'Null (wenn der Stromkreis unterbrochen ist, gibt es keine Spannung)',
      mistake: {
        type: 'concept',
        explanation:
          'Durch das Öffnen des Schalters wird der Strom unterbrochen, nicht jedoch die Fähigkeit der Quelle, eine Spannung zu erzeugen. Die elektromotorische Kraft ist eine Eigenschaft der Quelle selbst; im Leerlauf fällt keine Spannung am Innenwiderstand ab, das Voltmeter misst daher genau E.',
        review: ['Physikalische Bedeutung der elektromotorischen Kraft', 'Klemmenspannung U_K = E − I·r'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
    {
      id: 'slightly-less',
      label: 'Etwas kleiner als E (am Innenwiderstand fällt trotzdem ein kleiner Anteil ab)',
      mistake: {
        type: 'modeling',
        explanation:
          'Der Spannungsabfall am Innenwiderstand beträgt I·r und ist proportional zum Strom: Bei I = 0 fällt gar keine Spannung ab. Unter idealen Bedingungen zeigt das Voltmeter also genau E; nur wenn man einen sehr kleinen Leckstrom durch das Voltmeter berücksichtigt, wäre der Wert geringfügig kleiner.',
        review: ['Für I = 0 wird U_K = E − I·r zu E', 'Annahme idealer Messgeräte'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
  ],
}

/* ------------------------------------------------------------------ table -- */

/**
 * Lab topic → self-check set. Keys are the topic ids the web layer resolves
 * from runtime facts; the tests assert every set references only declared
 * knowledge nodes and follows the same option rules as the question bank.
 */
export const EXPERIMENT_SELF_CHECKS: Readonly<Record<string, ExperimentSelfCheckSet>> = {
  'circuit-series': {
    id: 'circuit-series',
    topic: 'Reihenschaltung',
    knowledge: ['circ-series', 'circ-ohm-law'],
    items: [SERIES_CURRENT, SERIES_VOLTAGE],
  },
  'circuit-parallel': {
    id: 'circuit-parallel',
    topic: 'Parallel- und gemischte Schaltungen',
    knowledge: ['circ-parallel', 'circ-ohm-law'],
    items: [PARALLEL_VOLTAGE, PARALLEL_MAIN_CURRENT],
  },
  'circuit-rheostat': {
    id: 'circuit-rheostat',
    topic: 'Dynamischer Stromkreis mit Schleifwiderstand',
    knowledge: ['circ-dynamic', 'circ-ohm-law'],
    items: [RHEOSTAT_CURRENT, RHEOSTAT_METER],
  },
  'circuit-va': {
    id: 'circuit-va',
    topic: 'Widerstandsmessung nach der Spannungs-Strom-Methode',
    knowledge: ['circ-ohm-law', 'circ-dynamic'],
    items: [VA_PRINCIPLE, VA_RHEOSTAT_ROLE],
  },
  'circuit-bulb': {
    id: 'circuit-bulb',
    topic: 'Messung der elektrischen Leistung einer Glühlampe',
    knowledge: ['circ-power', 'circ-ohm-law'],
    items: [BULB_POWER_READING, BULB_RATED_POINT],
  },
  'mechanics-average-speed': {
    id: 'mechanics-average-speed',
    topic: 'Messung der Durchschnittsgeschwindigkeit',
    knowledge: ['kin-average-speed'],
    items: [AVERAGE_SPEED_DEFINITION, AVERAGE_SPEED_SEGMENTS],
  },
  'circuit-emf': {
    id: 'circuit-emf',
    topic: 'Elektromotorische Kraft und Innenwiderstand',
    knowledge: ['circ-emf-internal'],
    items: [EMF_TERMINAL_VOLTAGE, EMF_OPEN_CIRCUIT],
  },
  'optics-plane-mirror': {
    id: 'optics-plane-mirror',
    topic: 'Bildentstehung am ebenen Spiegel',
    knowledge: ['opt-plane-mirror', 'opt-light-reflection', 'opt-real-virtual-image'],
    items: [MIRROR_DISTANCE_SIZE, MIRROR_VIRTUAL_SCREEN],
  },
  'optics-convex-lens': {
    id: 'optics-convex-lens',
    topic: 'Bildentstehungsgesetz der Sammellinse',
    knowledge: ['opt-lens-imaging', 'opt-real-virtual-image'],
    items: [LENS_BEYOND_2F, LENS_WITHIN_F],
  },
  'optics-curved-mirror': {
    id: 'optics-curved-mirror',
    topic: 'Bildentstehung am Hohlspiegel',
    knowledge: ['opt-curved-mirror', 'opt-light-reflection', 'opt-real-virtual-image'],
    items: [CURVED_MIRROR_BEYOND_2F, CURVED_MIRROR_WITHIN_F],
  },
  'acoustics-echo': {
    id: 'acoustics-echo',
    topic: 'Entfernungsmessung mit Echolotung',
    knowledge: ['ac-echo-ranging', 'ac-sound-propagation', 'ac-echo'],
    items: [ECHO_DISTANCE_FORMULA, ECHO_MEDIUM_SPEED],
  },
  'fluid-buoyancy': {
    id: 'fluid-buoyancy',
    topic: 'Untersuchung der Größe des Auftriebs',
    knowledge: ['fl-buoyancy-measure', 'fl-archimedes', 'fl-float-sink'],
    items: [BUOYANCY_DEPTH, BUOYANCY_LIQUID],
  },
  'thermal-melting': {
    id: 'thermal-melting',
    topic: 'Untersuchung des Schmelzvorgangs eines Kristalls',
    knowledge: ['th-melting-point', 'th-latent-heat', 'th-specific-heat'],
    items: [MELTING_PLATEAU, MELTING_HEATING_RATE],
  },
  'thermal-heat-capacity': {
    id: 'thermal-heat-capacity',
    topic: 'Vergleich der Wärmespeicherfähigkeit verschiedener Stoffe',
    knowledge: ['th-specific-heat'],
    items: [HEAT_CAPACITY_RATIO, HEAT_CAPACITY_EQUAL_Q],
  },
  'mechanics-lever': {
    id: 'mechanics-lever',
    topic: 'Untersuchung der Gleichgewichtsbedingung eines Hebels',
    knowledge: ['dyn-lever-balance', 'dyn-moment'],
    items: [LEVER_DOUBLE_MASS, LEVER_SLIDE_OUT],
  },
  /* Spring/pendulum/friction topics are resolved from runtime verification facts (the
     hooke_equilibrium / rope_length / static_friction_balance checks), not the
     template id — a student-forked rig still gets the matching probes. The two
     spring rigs share the probe pool but keep separate topics so practice-deep
     links back to the same apparatus the attempt was recorded on. */
  'mechanics-spring-statics': {
    id: 'mechanics-spring-statics',
    topic: 'Federkraft und Dehnung (Hookesches Gesetz)',
    knowledge: ['dyn-hooke'],
    items: [SPRING_HOOKE_EXTENSION],
  },
  'mechanics-spring-oscillator': {
    id: 'mechanics-spring-oscillator',
    topic: 'Federpendel und harmonische Schwingung',
    knowledge: ['osc-spring', 'dyn-hooke'],
    items: [SPRING_PERIOD_MASS, SPRING_HOOKE_EXTENSION],
  },
  'mechanics-pendulum': {
    id: 'mechanics-pendulum',
    topic: 'Fadenpendel und Messung der Schwingungsdauer',
    knowledge: ['osc-pendulum'],
    items: [PENDULUM_PERIOD_MASS, PENDULUM_LENGTH_PERIOD],
  },
  'mechanics-friction': {
    id: 'mechanics-friction',
    topic: 'Haft- und Gleitreibung',
    knowledge: ['dyn-friction'],
    items: [FRICTION_STATIC_FOLLOWS, FRICTION_KINETIC_CONSTANT],
  },
  /* The three electromagnetic domains (electric / magnetic / composite) were lab-first
     here: the golden-question bank keys its probes by question id, while these
     lab benches carry NO golden question, so their conceptual probes are keyed
     by a lab topic the web layer resolves from runtime facts instead. Each set
     reuses the exact probe items the question bank already audited (see
     self-checks.ts) — one source of truth per probe, never a hand copy. */
  'magnetic-circular': {
    id: 'magnetic-circular',
    topic: 'Kreisbewegung im Magnetfeld',
    knowledge: ['em-lorentz', 'em-circular'],
    items: [MAGNETIC_WORK, RADIUS_MASS],
  },
  'electric-point-charge': {
    id: 'electric-point-charge',
    topic: 'Elektrisches Feld einer Punktladung',
    knowledge: ['em-field-strength', 'em-superposition', 'em-electric-force'],
    items: [POINT_CHARGE_DIRECTION, SUPERPOSITION],
  },
  'electric-parallel-plate': {
    id: 'electric-parallel-plate',
    topic: 'Geladene Teilchen im homogenen Feld eines Plattenkondensators',
    knowledge: ['em-uniform-deflection', 'em-bounded-field'],
    items: [PLATE_MOTION, PLATE_OUTSIDE],
  },
  'composite-velocity-selector': {
    id: 'composite-velocity-selector',
    topic: 'Geschwindigkeitsfilter',
    knowledge: ['em-velocity-selector', 'em-crossed-fields'],
    items: [SELECTOR_CONDITION, SELECTOR_TOO_FAST],
  },
  'composite-mass-spectrometer': {
    id: 'composite-mass-spectrometer',
    topic: 'Massenspektrometer',
    knowledge: ['em-mass-spectrometer', 'em-circular'],
    items: [RADIUS_MASS, SPECTROMETER_SPEED],
  },
  'composite-crossed-field': {
    id: 'composite-crossed-field',
    topic: 'Geladene Teilchen in gekreuzten elektrischen und magnetischen Feldern',
    knowledge: ['em-crossed-fields', 'em-lorentz'],
    items: [CROSSED_NET_FORCE, MAGNETIC_WORK],
  },
  'composite-three-field': {
    id: 'composite-three-field',
    topic: 'Gleichgewicht in elektrischen, magnetischen und Gravitationsfeldern',
    knowledge: ['em-three-field'],
    items: [THREE_FIELD_GRAVITY, CROSSED_NET_FORCE],
  },
  /* The induction lab benches (conductor bar cutting field lines / flux change) carry golden
     questions too, but the Lab's topic dispatch is fact-based, not
     question-id-based: the web layer reads the bench type the runtime drew.
     Both sets reuse the exact probe items the question bank audited (see
     self-checks.ts) — one source of truth per probe, never a hand copy. */
  'induction-bar-motion': {
    id: 'induction-bar-motion',
    topic: 'Leiterstab schneidet Magnetfeldlinien',
    knowledge: ['em-motional-emf', 'em-induction'],
    items: [INDUCTION_BAR_EMF, INDUCTION_NO_CUT],
  },
  'induction-flux-change': {
    id: 'induction-flux-change',
    topic: 'Induzierte elektromotorische Kraft durch Flussänderung',
    knowledge: ['em-faraday-law', 'em-lenz-law'],
    items: [INDUCTION_FARADAY, INDUCTION_LENZ],
  },
  /* The wave benches resolve their topic from the rig the runtime drew (a marked
     particle → rope wave, two sources → interference, nodes → standing wave). The probes are shared with
     the wave golden questions (see self-checks.ts) — one source of truth. */
  'wave-travelling': {
    id: 'wave-travelling',
    topic: 'Harmonische Transversalwelle auf einem Seil',
    knowledge: ['wv-wave-speed', 'wv-particle-motion'],
    items: [WAVE_SPEED_FREQUENCY, WAVE_PARTICLE_TRANSPORT],
  },
  'wave-interference': {
    id: 'wave-interference',
    topic: 'Zweiquelleninterferenz und Wellenüberlagerung',
    knowledge: ['wv-interference', 'wv-wave-speed'],
    items: [WAVE_PATH_DIFFERENCE, WAVE_DESTRUCTIVE_HALF],
  },
  'wave-standing': {
    id: 'wave-standing',
    topic: 'Stehende Welle auf einer beidseitig eingespannten Saite',
    knowledge: ['wv-standing-wave', 'wv-wave-speed'],
    items: [WAVE_NODE_MOTION, WAVE_HARMONIC_FREQUENCY],
  },
  'wave-expanded': {
    id: 'wave-expanded',
    topic: 'Longitudinalwellen, Grenzflächen, Beugung und Doppler-Effekt',
    knowledge: ['wv-longitudinal', 'wv-reflection-refraction', 'wv-diffraction', 'wv-doppler'],
    items: [
      WAVE_LONGITUDINAL_DIRECTION,
      WAVE_BOUNDARY_RULE,
      WAVE_DIFFRACTION_MINIMUM,
      WAVE_DOPPLER_SIGN,
    ],
  },
}

/** The self-check set of a lab topic, undefined when the topic has none. */
export const experimentSelfChecksOfTopic = (topicId: string): ExperimentSelfCheckSet | undefined =>
  EXPERIMENT_SELF_CHECKS[topicId]
