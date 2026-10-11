/**
 * Selbsttest-Bank für die Fehlerdiagnose.
 *
 * Jede Goldfrage enthält ein kurzes konzeptionelles Quiz. Jede FALSCHE Option ist
 * mit dem Fehler annotiert, den sie verkörpert — Konzept / Richtung /
 * Modellierung — plus einer für Lernende lesbaren Erklärung und Wiederholungshinweisen.
 * Wo der laufende Verifier genau die Tatsache zusichert, auf die die Erklärung sich stützt,
 * verweist die Option auf diese Check-ID, damit die UI den Live-PASS/FAIL als
 * Beleg statt einer unbelegten Behauptung anzeigen kann.
 *
 * Diese Datei ist DATEN. Sie berechnet nie Physik; Erklärungen nennen Gesetze und
 * verweisen auf Verifier-Checks — die Zahlen liegen in der Runtime.
 */

export type MistakeType = 'concept' | 'direction' | 'modeling'

export interface SelfCheckMistake {
  readonly type: MistakeType
  readonly explanation: string
  /** Wiederholungshinweise, z. B. Linke-Hand-Regel. */
  readonly review: readonly string[]
  /** Verifier-Check-ID, deren Live-Status die Erklärung stützt, falls vorhanden. */
  readonly evidenceCheckId?: string
}

export interface SelfCheckOption {
  readonly id: string
  readonly label: string
  readonly correct?: true
  readonly mistake?: SelfCheckMistake
}

export interface SelfCheckItem {
  readonly id: string
  readonly prompt: string
  /** Bestärkung, die nach einer richtigen Antwort angezeigt wird. */
  readonly takeaway: string
  readonly options: readonly SelfCheckOption[]
}

/* ---------------------------------------------------------------- Familien -- */

export const MAGNETIC_WORK: SelfCheckItem = {
  id: 'magnetic-no-work',
  prompt: 'Verrichtet die Lorentzkraft an einem geladenen Teilchen, das eine Kreisbewegung ausführt, Arbeit?',
  takeaway: 'Die Lorentzkraft steht stets senkrecht zur Geschwindigkeitsrichtung, verrichtet keine Arbeit, und der Betrag der Geschwindigkeit des Teilchens bleibt konstant.',
  options: [
    { id: 'no-work', label: 'Verrichtet keine Arbeit, Geschwindigkeit bleibt konstant', correct: true },
    {
      id: 'positive-work',
      label: 'Verrichtet positive Arbeit, die Geschwindigkeit wird immer größer',
      mistake: {
        type: 'concept',
        explanation: 'Die Richtung der Lorentzkraft steht stets senkrecht zur Geschwindigkeitsrichtung, die Leistung F·v = 0, eine Änderung des Geschwindigkeitsbetrags ist unmöglich.',
        review: ['Richtung der Lorentzkraft (Linke-Hand-Regel)', 'Definition der Arbeit W = F·s·cosθ'],
        evidenceCheckId: 'magnetic_force_does_no_work',
      },
    },
    {
      id: 'negative-work',
      label: 'Verrichtet negative Arbeit, das Teilchen wird allmählich langsamer',
      mistake: {
        type: 'concept',
        explanation: 'Die Lorentzkraft steht stets senkrecht zur Geschwindigkeit, sie verrichtet weder positive noch negative Arbeit; Abbremsen erfordert eine Kraft entgegen der Geschwindigkeitsrichtung.',
        review: ['Lorentzkraft verrichtet keine Arbeit', 'Arbeit-Energie-Theorem'],
        evidenceCheckId: 'magnetic_force_does_no_work',
      },
    },
  ],
}

const LORENTZ_RULE: SelfCheckItem = {
  id: 'lorentz-direction-rule',
  prompt: 'Mit welcher Regel bestimmt man die Richtung der Lorentzkraft, die ein geladenes Teilchen im Magnetfeld erfährt?',
  takeaway:
    'Die Richtung der Lorentzkraft bestimmt man mit der Linke-Hand-Regel: Die Feldlinien treten in die Handfläche ein, die vier Finger zeigen in die Geschwindigkeitsrichtung der positiven Ladung, und der Daumen gibt die Kraftrichtung an; bei negativer Ladung kehrt sich die Richtung um.',
  options: [
    { id: 'left-hand', label: 'Linke-Hand-Regel (bei negativer Ladung umgekehrte Richtung)', correct: true },
    {
      id: 'right-hand',
      label: 'Rechte-Hand-Regel',
      mistake: {
        type: 'direction',
        explanation: 'Die Rechte-Hand-Regel dient zur Bestimmung der Richtung des induzierten Stroms, der entsteht, wenn ein Leiter Feldlinien schneidet; die Kraftrichtung bestimmt man mit der Linke-Hand-Regel.',
        review: ['Linke-Hand-Regel', 'Anwendungsfälle der Rechte-Hand-Regel'],
      },
    },
    {
      id: 'ampere-rule',
      label: 'Ampèresche Regel (Rechte-Hand-Schraubenregel)',
      mistake: {
        type: 'direction',
        explanation: 'Die Ampèresche Regel bestimmt die Richtung des vom Strom erzeugten Magnetfelds, nicht die Kraftrichtung.',
        review: ['Linke-Hand-Regel', 'Anwendungsfälle der Ampèreschen Regel'],
      },
    },
  ],
}

export const RADIUS_MASS: SelfCheckItem = {
  id: 'radius-vs-mass',
  prompt: 'Zwei Teilchen mit gleicher Geschwindigkeit und gleicher Ladungsmenge treten in dasselbe homogene Magnetfeld ein. Was gilt für das Teilchen mit der größeren Masse?',
  takeaway: 'r = mv/(qB): Bei gleicher Geschwindigkeit und gleicher Ladung ist der Radius proportional zur Masse — genau dies ist das Prinzip, mit dem das Massenspektrometer Isotope unterscheidet.',
  options: [
    { id: 'larger-radius', label: 'Größerer Bahnradius', correct: true },
    {
      id: 'smaller-radius',
      label: 'Kleinerer Bahnradius',
      mistake: {
        type: 'concept',
        explanation:
          'Aus qvB = mv²/r folgt r = mv/(qB), die Masse steht im Zähler: Je größer die Masse, desto schwerer kann dieselbe Lorentzkraft sie auf eine gekrümmte Bahn zwingen.',
        review: ['Zentripetalkraft-Gleichung qvB = mv²/r', 'Prinzip des Massenspektrometers'],
      },
    },
    {
      id: 'same-radius',
      label: 'Gleicher Bahnradius',
      mistake: {
        type: 'concept',
        explanation: 'Der Radius r = mv/(qB) hängt von der Masse ab; wäre der Radius massenunabhängig, könnte das Massenspektrometer die Isotope nicht trennen.',
        review: ['r = mv/(qB)', 'Prinzip des Massenspektrometers'],
      },
    },
  ],
}

export const SELECTOR_CONDITION: SelfCheckItem = {
  id: 'selector-condition',
  prompt: 'Was ist die Bedingung dafür, dass ein Teilchen im Geschwindigkeitswähler geradlinig hindurchfliegt?',
  takeaway: '|qE| = |qvB|, die beiden Kräfte sind im Gleichgewicht, also v = E/B; diese Bedingung ist unabhängig vom Vorzeichen und vom Betrag der Ladung.',
  options: [
    { id: 'v-eq-eb', label: 'v = E/B, elektrische Feldkraft und Lorentzkraft sind im Gleichgewicht', correct: true },
    {
      id: 'only-positive',
      label: 'Nur positive Ladungen können geradlinig hindurchfliegen',
      mistake: {
        type: 'concept',
        explanation:
          'Wechselt die Ladung das Vorzeichen, kehren sich elektrische Feldkraft und Lorentzkraft gleichzeitig um, die Gleichgewichtsbeziehung bleibt unverändert; der Geschwindigkeitswähler wirkt für positive und negative Ladungen gleichermaßen.',
        review: ['Bedingung der Geschwindigkeitsauswahl |qE| = |qvB|', 'Richtungen der elektrischen Feldkraft und der Lorentzkraft'],
        evidenceCheckId: 'velocity_selection_condition',
      },
    },
    {
      id: 'fast-enough',
      label: 'Bei ausreichend großer Geschwindigkeit kommt es einfach durch',
      mistake: {
        type: 'concept',
        explanation:
          'Je größer die Geschwindigkeit, desto größer die Lorentzkraft; die beiden Kräfte geraten aus dem Gleichgewicht und die Ablenkung wird sogar stärker; nur Teilchen mit genau v = E/B fliegen geradlinig hindurch.',
        review: ['Lorentzkraft F = qvB ist proportional zur Geschwindigkeit', 'Bedingung der Geschwindigkeitsauswahl'],
        evidenceCheckId: 'velocity_selection_condition',
      },
    },
  ],
}

export const SELECTOR_TOO_FAST: SelfCheckItem = {
  id: 'selector-too-fast',
  prompt: 'Was geschieht mit dem Teilchen, wenn die Eintrittsgeschwindigkeit größer als E/B ist?',
  takeaway: 'Ist die Geschwindigkeit zu groß, überwiegt die Lorentzkraft |qvB|, das Teilchen wird zur Seite der Lorentzkraft abgelenkt und vom Wähler zurückgehalten.',
  options: [
    { id: 'toward-magnetic', label: 'Ablenkung zur Seite der Lorentzkraft', correct: true },
    {
      id: 'toward-electric',
      label: 'Ablenkung zur Seite der elektrischen Feldkraft',
      mistake: {
        type: 'direction',
        explanation:
          'Die elektrische Feldkraft |qE| ist geschwindigkeitsunabhängig, die Lorentzkraft |qvB| wächst mit der Geschwindigkeit; bei zu großer Geschwindigkeit überwiegt die Lorentzkraft.',
        review: ['|F_E| = qE ist geschwindigkeitsunabhängig', '|F_B| = qvB ist proportional zur Geschwindigkeit'],
        evidenceCheckId: 'velocity_selection_condition',
      },
    },
    {
      id: 'still-straight',
      label: 'Fliegt weiterhin geradlinig hindurch',
      mistake: {
        type: 'concept',
        explanation: 'Geradliniges Hindurchfliegen erfordert ein striktes Gleichgewicht der beiden Kräfte; bei v ≠ E/B ist die resultierende Kraft nicht null und das Teilchen wird zwangsläufig abgelenkt.',
        review: ['Bedingung der Geschwindigkeitsauswahl v = E/B'],
        evidenceCheckId: 'velocity_selection_condition',
      },
    },
  ],
}

export const SPECTROMETER_SPEED: SelfCheckItem = {
  id: 'spectrometer-speed',
  prompt: 'Wie ändert sich der Betrag der Geschwindigkeit, nachdem ein Ion in den magnetischen Ablenkbereich des Massenspektrometers eingetreten ist?',
  takeaway: 'Im Ablenkbereich existiert nur ein Magnetfeld, die Lorentzkraft verrichtet keine Arbeit, der Geschwindigkeitsbetrag bleibt konstant, die Bahn ist ein gleichförmiger Kreis.',
  options: [
    { id: 'constant', label: 'Bleibt konstant (Lorentzkraft verrichtet keine Arbeit)', correct: true },
    {
      id: 'speeds-up',
      label: 'Dreht sich immer schneller',
      mistake: {
        type: 'concept',
        explanation: 'Im Ablenkbereich gibt es nur ein Magnetfeld, die Lorentzkraft steht senkrecht zur Geschwindigkeit und verrichtet keine Arbeit, kinetische Energie und Geschwindigkeitsbetrag bleiben konstant.',
        review: ['Lorentzkraft verrichtet keine Arbeit', 'Geschwindigkeitsbetrag im reinen Magnetfeld bleibt erhalten'],
        evidenceCheckId: 'speed_conserved_in_pure_magnetic',
      },
    },
    {
      id: 'slows-down',
      label: 'Wird allmählich langsamer bis zum Stillstand',
      mistake: {
        type: 'concept',
        explanation: 'Die Magnetfeldkraft verbraucht keine kinetische Energie; ohne Widerstand kreist das Teilchen im Magnetfeld für immer mit demselben Geschwindigkeitsbetrag.',
        review: ['Lorentzkraft verrichtet keine Arbeit'],
        evidenceCheckId: 'speed_conserved_in_pure_magnetic',
      },
    },
  ],
}

export const CROSSED_NET_FORCE: SelfCheckItem = {
  id: 'crossed-net-force',
  prompt: 'Wie bestimmt man die resultierende Kraft auf ein geladenes Teilchen, das sich gleichzeitig in zueinander orthogonalen E- und B-Feldern befindet?',
  takeaway: 'ΣF = qE + qv×B (plus mg, falls die Schwerkraft berücksichtigt wird): Zuerst bestimmt man die einzelnen Kräfte, dann bildet man die Vektorsumme.',
  options: [
    { id: 'vector-sum', label: 'Vektorsumme der Kräfte ΣF = qE + qv×B', correct: true },
    {
      id: 'scalar-sum',
      label: 'Die Beträge der Kräfte werden direkt addiert',
      mistake: {
        type: 'concept',
        explanation: 'Kraft ist ein Vektor: Addiert man die Beträge zweier entgegengesetzt gerichteter Kräfte, erhält man eine völlig falsche resultierende Kraft; es muss die Vektorsumme gebildet werden.',
        review: ['Vektoraddition von Kräften', 'Kraftanalyse im kombinierten Feld'],
        evidenceCheckId: 'composite_force_superposition',
      },
    },
    {
      id: 'dominant-only',
      label: 'Nur die größere der beiden Kräfte wird berücksichtigt',
      mistake: {
        type: 'modeling',
        explanation:
          'Zwei Kräfte gleicher Größenordnung verändern beide die Bewegung; lässt man eine davon weg, erhält man eine falsche Bahn. Der Geschwindigkeitswähler ist gerade das Ergebnis des Zusammenwirkens beider Kräfte.',
        review: ['Vollständigkeit der Kraftanalyse', 'Kombiniertes Feld F = qE + qv×B'],
        evidenceCheckId: 'composite_force_superposition',
      },
    },
  ],
}

export const THREE_FIELD_GRAVITY: SelfCheckItem = {
  id: 'three-field-gravity',
  prompt: 'Wie wird die Schwerkraft bei mikroskopischen Teilchen wie Protonen und Elektronen in Problemen mit kombinierten Feldern üblicherweise behandelt?',
  takeaway:
    'Die Schwerkraft mikroskopischer Teilchen ist um mehr als zehn Größenordnungen kleiner als die elektromagnetische Kraft und wird üblicherweise vernachlässigt; bei makroskopischen Objekten wie geladenen Kügelchen oder Tröpfchen muss die Schwerkraft dagegen berücksichtigt werden.',
  options: [
    { id: 'neglect-micro', label: 'Bei mikroskopischen Teilchen wird die Schwerkraft vernachlässigt, bei makroskopischen geladenen Kügelchen muss sie berücksichtigt werden', correct: true },
    {
      id: 'always-include',
      label: 'Die Schwerkraft muss immer mitgerechnet werden, sonst ist es falsch',
      mistake: {
        type: 'modeling',
        explanation:
          'Bei der Modellierung kommt es auf die Größenordnung an: Für ein Proton gilt mg ≈ 10⁻²⁶ N, die typische elektromagnetische Kraft beträgt ≈ 10⁻¹⁵ N, der Einfluss der Schwerkraft geht in der elektromagnetischen Kraft völlig unter.',
        review: ['Abschätzung der Größenordnung', 'Näherungen bei der Modellierung'],
      },
    },
    {
      id: 'never-include',
      label: 'In Problemen mit kombinierten Feldern wird die Schwerkraft grundsätzlich nicht berücksichtigt',
      mistake: {
        type: 'modeling',
        explanation: 'In Problemen mit geladenen Tröpfchen oder Kügelchen haben mg und qE dieselbe Größenordnung, die Schwerkraft ist gerade Teil der Gleichgewichtsbedingung und darf nicht weggelassen werden.',
        review: ['Bedingung des Kräftegleichgewichts bei drei Kräften', 'Typische Aufgabe: schwebendes geladenes Tröpfchen'],
      },
    },
  ],
}

const PROJECTILE_HORIZONTAL: SelfCheckItem = {
  id: 'projectile-horizontal-velocity',
  prompt: 'Wie ändert sich die horizontale Geschwindigkeitskomponente während eines waagerechten Wurfs?',
  takeaway: 'In horizontaler Richtung wirkt keine Kraft, die Geschwindigkeitskomponente bleibt v₀ unverändert; in vertikaler Richtung liegt ein freier Fall vor. Die beiden Teilbewegungen beeinflussen sich gegenseitig nicht.',
  options: [
    { id: 'constant', label: 'Bleibt konstant', correct: true },
    {
      id: 'decreases',
      label: 'Nimmt allmählich ab',
      mistake: {
        type: 'concept',
        explanation: 'Vernachlässigt man den Luftwiderstand, ist die resultierende Kraft in horizontaler Richtung null und die Geschwindigkeitskomponente bleibt konstant; das Gefühl, sie werde langsamer, ist eine eingemischte Intuition zum Widerstand.',
        review: ['Unabhängigkeit der Bewegungen', 'Erstes Newtonsches Gesetz'],
      },
    },
    {
      id: 'increases',
      label: 'Nimmt allmählich zu',
      mistake: {
        type: 'concept',
        explanation: 'Die Schwerkraft wirkt nur in vertikaler Richtung, nur die vertikale Geschwindigkeitskomponente wächst; die horizontale Geschwindigkeitskomponente ist davon unberührt.',
        review: ['Zusammensetzung und Zerlegung von Bewegungen'],
      },
    },
  ],
}

const PROJECTILE_TIME: SelfCheckItem = {
  id: 'projectile-flight-time',
  prompt: 'Wovon hängt die Flugzeit eines waagerechten Wurfs bis zum Boden ab?',
  takeaway: 't = √(2h/g): hängt nur von der Fallhöhe und der Erdbeschleunigung ab, unabhängig von der horizontalen Anfangsgeschwindigkeit und der Masse.',
  options: [
    { id: 'height-only', label: 'Hängt nur von der Fallhöhe (und g) ab', correct: true },
    {
      id: 'initial-speed',
      label: 'Je größer die horizontale Anfangsgeschwindigkeit, desto länger die Flugzeit',
      mistake: {
        type: 'modeling',
        explanation: 'Horizontale und vertikale Bewegung sind voneinander unabhängig; die Anfangsgeschwindigkeit bestimmt nur die Wurfweite x = v₀t und ändert die Fallzeit nicht.',
        review: ['Unabhängigkeit der Bewegungen', 't = √(2h/g)'],
      },
    },
    {
      id: 'mass',
      label: 'Je größer die Masse, desto schneller fällt es',
      mistake: {
        type: 'concept',
        explanation: 'Die Fallbeschleunigung hängt nicht von der Masse ab (bei vernachlässigtem Luftwiderstand); genau dies ist das Ergebnis von Galileis Experiment am Schiefen Turm von Pisa.',
        review: ['Freier Fall', 'g ist unabhängig von der Masse'],
      },
    },
  ],
}

const UNIFORM_ACCELERATION: SelfCheckItem = {
  id: 'uniform-acceleration-meaning',
  prompt: 'Was gilt für die Beschleunigung bei einer gleichmäßig beschleunigten geradlinigen Bewegung?',
  takeaway: '"Gleichmäßig beschleunigt" bedeutet konstante Beschleunigung: Die Geschwindigkeit ändert sich gleichmäßig, die Verschiebung wächst quadratisch mit der Zeit.',
  options: [
    { id: 'constant', label: 'Bleibt konstant', correct: true },
    {
      id: 'grows',
      label: 'Wächst zusammen mit der Geschwindigkeit',
      mistake: {
        type: 'concept',
        explanation:
          'Die Beschleunigung beschreibt die Änderungsrate der Geschwindigkeit; bei einer gleichmäßig beschleunigten Bewegung ist diese Änderungsrate selbst konstant, es wächst die Geschwindigkeit, nicht die Beschleunigung.',
        review: ['Definition der Beschleunigung a = Δv/Δt'],
      },
    },
    {
      id: 'zero',
      label: 'Die Beschleunigung ist null',
      mistake: {
        type: 'concept',
        explanation: 'Beschleunigung null bedeutet gleichförmige geradlinige Bewegung; gleichmäßig beschleunigt erfordert a ≠ 0 und konstant.',
        review: ['Unterschied zwischen gleichförmiger und gleichmäßig beschleunigter Bewegung'],
      },
    },
  ],
}

const NEWTON_SECOND: SelfCheckItem = {
  id: 'newton-constant-force',
  prompt: 'Welche Bewegung führt ein Körper aus, wenn auf ihn eine konstante resultierende Kraft wirkt?',
  takeaway: 'F = ma: Eine konstante Kraft erzeugt eine konstante Beschleunigung, der Körper führt eine gleichmäßig beschleunigte Bewegung aus (sind Kraftrichtung und Anfangsgeschwindigkeit kollinear, ist es eine gleichmäßig beschleunigte geradlinige Bewegung).',
  options: [
    { id: 'uniform-acceleration', label: 'Gleichmäßig beschleunigte Bewegung (konstante Beschleunigung)', correct: true },
    {
      id: 'uniform-speed',
      label: 'Gleichförmige Bewegung',
      mistake: {
        type: 'concept',
        explanation: 'Die Bedingung für eine gleichförmige Bewegung ist eine verschwindende resultierende Kraft; solange eine konstante resultierende Kraft wirkt, ändert sich die Geschwindigkeit fortlaufend.',
        review: ['Zweites Newtonsches Gesetz F = ma', 'Erstes Newtonsches Gesetz'],
      },
    },
    {
      id: 'stays-still',
      label: 'Bleibt in Ruhe',
      mistake: {
        type: 'concept',
        explanation: 'Ein Körper mit einer resultierenden Kraft ungleich null kann nicht in Ruhe bleiben, er beginnt aus der Ruhe heraus zu beschleunigen.',
        review: ['Zweites Newtonsches Gesetz'],
      },
    },
  ],
}

const INCLINE_NORMAL: SelfCheckItem = {
  id: 'incline-normal-direction',
  prompt: 'Wie ist die Richtung der Normalkraft, die auf einen Körper auf einer schiefen Ebene wirkt?',
  takeaway:
    'Die Normalkraft steht senkrecht auf der Berührungsfläche: Auf einer schiefen Ebene wirkt sie senkrecht zur Ebene nach oben und ihr Betrag ist mg·cosθ (wenn keine weiteren vertikalen äußeren Kräfte wirken).',
  options: [
    { id: 'perpendicular', label: 'Senkrecht zur schiefen Ebene nach oben', correct: true },
    {
      id: 'vertical',
      label: 'Senkrecht nach oben',
      mistake: {
        type: 'direction',
        explanation: 'Die Normalkraft ist die Federkraft der Berührungsfläche und zeigt stets senkrecht zur Berührungsfläche; senkrecht nach oben gilt nur auf einer horizontalen Fläche.',
        review: ['Richtung der Federkraft', 'Kraftanalyse: Modell der schiefen Ebene'],
      },
    },
    {
      id: 'along-incline',
      label: 'Entlang der schiefen Ebene nach oben',
      mistake: {
        type: 'direction',
        explanation: 'Entlang der schiefen Ebene wirkt die Reibungskraft (falls vorhanden); die Normalkraft steht senkrecht zur Ebene.',
        review: ['Unterscheidung der Richtungen von Normalkraft und Reibungskraft'],
      },
    },
  ],
}

const UNIFORM_LINEAR_MOTION: SelfCheckItem = {
  id: 'uniform-motion-condition',
  prompt: 'Wie groß ist die resultierende Kraft auf einen Körper, der eine gleichförmige geradlinige Bewegung ausführt?',
  takeaway: 'Die Bedingung für eine gleichförmige geradlinige Bewegung ist eine verschwindende resultierende Kraft (Erstes Newtonsches Gesetz): Betrag und Richtung der Geschwindigkeit bleiben unverändert, erst dann gilt s = vt.',
  options: [
    { id: 'zero', label: 'Die resultierende Kraft ist null', correct: true },
    {
      id: 'constant-nonzero',
      label: 'Eine konstante resultierende Kraft ungleich null wirkt',
      mistake: {
        type: 'concept',
        explanation: 'Eine konstante resultierende Kraft ungleich null erzeugt eine konstante Beschleunigung, die Geschwindigkeit ändert sich fortlaufend, eine gleichförmige Bewegung ist unmöglich.',
        review: ['Erstes Newtonsches Gesetz', 'Zweites Newtonsches Gesetz F = ma'],
      },
    },
    {
      id: 'forward-force',
      label: 'Es muss eine nach vorn gerichtete Antriebskraft geben',
      mistake: {
        type: 'concept',
        explanation: 'Zur Aufrechterhaltung einer gleichförmigen Bewegung ist keine Nettokraft nötig; eine vorhandene Antriebskraft hebt gerade nur den Widerstand auf, die resultierende Kraft bleibt null.',
        review: ['Erstes Newtonsches Gesetz', 'Kraft ist nicht die Ursache der Aufrechterhaltung von Bewegung'],
      },
    },
  ],
}

const SOUND_MEDIUM_SPEED: SelfCheckItem = {
  id: 'sound-speed-medium',
  prompt: 'Wie verhält sich die Schallgeschwindigkeit in Wasser üblicherweise im Vergleich zu der in Luft?',
  takeaway: 'Die Schallgeschwindigkeit wird vom Medium bestimmt: im Allgemeinen Festkörper > Flüssigkeit > Gas, in Wasser etwa 1500 m/s, in Luft (15 ℃) etwa 340 m/s.',
  options: [
    { id: 'faster', label: 'In Wasser schneller als in Luft', correct: true },
    {
      id: 'slower',
      label: 'In Wasser langsamer als in Luft',
      mistake: {
        type: 'concept',
        explanation: 'Je dichter und elastischer das Medium, desto schneller wird der Schall übertragen: in Meerwasser etwa 1500 m/s, deutlich mehr als die 340 m/s in Luft.',
        review: ['Zusammenhang zwischen Schallgeschwindigkeit und Medium'],
      },
    },
    {
      id: 'same',
      label: 'Gleich schnell',
      mistake: {
        type: 'concept',
        explanation: 'Die Schallgeschwindigkeit ist keine Konstante, sie ändert sich mit der Art des Mediums und der Temperatur; man darf den Wert für Luft nicht ohne Weiteres auf ein anderes Medium übertragen.',
        review: ['Bestimmende Faktoren der Schallgeschwindigkeit'],
      },
    },
  ],
}

const ECHO_RANGING_HALF: SelfCheckItem = {
  id: 'echo-round-trip',
  prompt: 'Ist im Fall der Echo-Entfernungsmessung das Produkt v·t unmittelbar die Tiefe selbst?',
  takeaway: 'v·t ist die Gesamtstrecke des Schalls für Hin- und Rückweg, für die Tiefe des Meeresbodens muss man noch durch 2 teilen: d = v·t/2.',
  options: [
    { id: 'half', label: 'Nein, es muss durch 2 geteilt werden', correct: true },
    {
      id: 'direct',
      label: 'Ja, v·t ist bereits die Tiefe',
      mistake: {
        type: 'modeling',
        explanation: 'Das Echo ist ein Hin-und-Rück-Signal: v·t umfasst sowohl Hin- als auch Rückweg, direkt verwendet ergibt es die doppelte Tiefe.',
        review: ['Modell der Echo-Entfernungsmessung d = v·t/2'],
      },
    },
    {
      id: 'quarter',
      label: 'Nein, es muss durch 4 geteilt werden',
      mistake: {
        type: 'modeling',
        explanation: 'Der Hin- und Rückweg besteht aus nur zwei Teilstrecken, eine Division durch 2 genügt; eine Division durch 4 verwechselt den Hin- und Rückweg mit vier Teilstrecken.',
        review: ['Modell der Echo-Entfernungsmessung d = v·t/2'],
      },
    },
  ],
}

export const POINT_CHARGE_DIRECTION: SelfCheckItem = {
  id: 'point-charge-field-direction',
  prompt: 'Wie ist die Richtung des elektrischen Feldes an einem Punkt in der Umgebung einer positiven Punktladung?',
  takeaway:
    'Das elektrische Feld wird von der Quellladung bestimmt: Das Feld einer positiven Ladung zeigt radial nach außen, das Feld einer negativen Ladung zeigt auf die Ladung selbst, unabhängig davon, ob eine Probeladung vorhanden ist.',
  options: [
    { id: 'radially-out', label: 'Radial vom Ladungspunkt nach außen', correct: true },
    {
      id: 'toward-charge',
      label: 'Auf die Ladung selbst gerichtet',
      mistake: {
        type: 'direction',
        explanation: 'Auf die Ladung zu zeigt das Feld einer negativen Ladung; die Feldlinien einer positiven Ladung gehen von ihr aus und laufen nach außen auseinander.',
        review: ['Vorzeichenkonvention der Feldlinienrichtung', 'Feldverteilung positiver und negativer Ladungen'],
      },
    },
    {
      id: 'depends-on-probe',
      label: 'Hängt vom Vorzeichen der eingebrachten Probeladung ab',
      mistake: {
        type: 'concept',
        explanation:
          'Das elektrische Feld ist eine Eigenschaft der Quellladung und existiert vor der Probeladung; die Probeladung ändert nur die Richtung der wirkenden Kraft F = qE, nicht die Richtung des Feldes.',
        review: ['Definition der Feldstärke E = F/q'],
      },
    },
  ],
}

export const SUPERPOSITION: SelfCheckItem = {
  id: 'field-superposition',
  prompt: 'Wie bestimmt man die gesamte Feldstärke, die zwei Punktladungen an einem Raumpunkt erzeugen?',
  takeaway:
    'Die Überlagerung der Feldstärken ist eine Vektoraddition: Beim Mittelpunkt der Verbindungslinie zweier entgegengesetzt gleich großer Ladungen addieren sich die beiden gleich gerichteten Felder, beim Mittelpunkt zweier gleich großer gleichartiger Ladungen heben sich die beiden entgegengesetzt gerichteten Felder zu null auf.',
  options: [
    { id: 'vector-add', label: 'Die Vektorsumme der beiden Feldstärken', correct: true },
    {
      id: 'scalar-add',
      label: 'Die Beträge der beiden Feldstärken werden direkt addiert',
      mistake: {
        type: 'concept',
        explanation:
          'Die Feldstärke ist ein Vektor: Beim Mittelpunkt zweier gleich großer gleichartiger Ladungen sind die beiden Felder betragsgleich und entgegengesetzt gerichtet; eine algebraische Addition ergäbe aus 0 fälschlich 2E.',
        review: ['Superpositionsprinzip des elektrischen Feldes', 'Vektoraddition'],
      },
    },
    {
      id: 'always-zero',
      label: 'Die Felder zweier Ladungen heben sich immer gegenseitig auf',
      mistake: {
        type: 'concept',
        explanation: 'Nur beim Mittelpunkt zweier gleich großer gleichartiger Ladungen hebt sich das Feld zu null auf; beim Mittelpunkt zweier entgegengesetzt gleich großer Ladungen verdoppelt sich das Feld sogar.',
        review: ['Typische Feldverteilungen: gleich große gleichartige/entgegengesetzte Ladungen'],
      },
    },
  ],
}

export const PLATE_MOTION: SelfCheckItem = {
  id: 'plate-motion-type',
  prompt: 'Ein geladenes Teilchen tritt senkrecht zur Feldstärkerichtung in ein homogenes elektrisches Feld ein (zwischen parallelen Platten). Welche Bewegung führt es aus?',
  takeaway: 'In Richtung der Anfangsgeschwindigkeit gleichförmig, in Richtung der Feldstärke gleichmäßig beschleunigt — zusammen ergibt das eine dem waagerechten Wurf entsprechende Bewegung, die Bahn ist eine Parabel.',
  options: [
    { id: 'parabola', label: 'Dem waagerechten Wurf entsprechende Bewegung (parabelförmige Bahn)', correct: true },
    {
      id: 'circle',
      label: 'Gleichförmige Kreisbewegung',
      mistake: {
        type: 'concept',
        explanation:
          'Eine Kreisbewegung erfordert eine stets zum Kreismittelpunkt gerichtete Kraft; im homogenen elektrischen Feld ist die Richtung der elektrischen Feldkraft konstant, es entsteht eine konstante Beschleunigung, die Bahn ist eine Parabel.',
        review: ['Dem waagerechten Wurf entsprechende Bewegung im homogenen elektrischen Feld', 'Bedingungen für eine Kreisbewegung'],
      },
    },
    {
      id: 'straight',
      label: 'Gleichförmige geradlinige Bewegung in der ursprünglichen Richtung',
      mistake: {
        type: 'concept',
        explanation: 'Ein geladenes Teilchen erfährt stets die elektrische Feldkraft F = qE und wird in der senkrechten Richtung fortlaufend beschleunigt, es kann keine Gerade beibehalten.',
        review: ['Elektrische Feldkraft F = qE', 'Zusammensetzung von Bewegungen'],
      },
    },
  ],
}

export const PLATE_OUTSIDE: SelfCheckItem = {
  id: 'plate-outside-field',
  prompt: 'Welche Bewegung führt das Teilchen aus, nachdem es den Bereich der parallelen Platten verlassen hat?',
  takeaway: 'Im idealisierten Modell existiert das Feld nur zwischen den Platten; nach dem Austritt ist die resultierende Kraft null und das Teilchen führt entlang der Austrittsgeschwindigkeit eine gleichförmige geradlinige Bewegung aus.',
  options: [
    { id: 'uniform-line', label: 'Gleichförmige geradlinige Bewegung entlang der Austrittsgeschwindigkeit', correct: true },
    {
      id: 'keeps-bending',
      label: 'Wird weiterhin parabelförmig abgelenkt',
      mistake: {
        type: 'modeling',
        explanation: 'Die Ablenkung stammt vom Feld zwischen den Platten; außerhalb der Platten ist die Feldstärke null, ohne Kraft gibt es keine Beschleunigung und die Bahn wird wieder zur Geraden.',
        review: ['Modell des begrenzten Feldes', 'Erstes Newtonsches Gesetz'],
      },
    },
    {
      id: 'returns',
      label: 'Wird zwischen die Platten zurückgezogen',
      mistake: {
        type: 'modeling',
        explanation: 'Im idealisierten Modell paralleler Platten gibt es außerhalb der Platten kein Feld, es existiert keine Kraft, die zurückzieht; Randeffekte werden im Modell der Oberstufe vernachlässigt.',
        review: ['Grenzen des idealisierten Modells'],
      },
    },
  ],
}

const FIELD_WORK_ENERGY: SelfCheckItem = {
  id: 'field-work-energy',
  prompt: 'Wie ändert sich die kinetische Energie eines geladenen Teilchens, wenn die elektrische Feldkraft positive Arbeit an ihm verrichtet?',
  takeaway: 'Arbeit-Energie-Theorem W = ΔEₖ: Verrichtet die elektrische Feldkraft positive Arbeit, wächst die kinetische Energie; verrichtet sie negative Arbeit, nimmt sie ab.',
  options: [
    { id: 'increases', label: 'Die kinetische Energie wächst', correct: true },
    {
      id: 'unchanged',
      label: 'Die kinetische Energie bleibt konstant',
      mistake: {
        type: 'concept',
        explanation: 'Die kinetische Energie unverändert lässt die Lorentzkraft (sie verrichtet keine Arbeit); hat die elektrische Feldkraft eine Komponente entlang der Verschiebung, ändert sie zwangsläufig die kinetische Energie.',
        review: ['Arbeit-Energie-Theorem W = ΔEₖ', 'Vergleich: elektrische Feldkraft verrichtet Arbeit, Magnetfeldkraft nicht'],
      },
    },
    {
      id: 'decreases',
      label: 'Die kinetische Energie nimmt ab',
      mistake: {
        type: 'concept',
        explanation: 'Positive Arbeit bedeutet, dass die Kraft eine positive Komponente in Richtung der Verschiebung hat und Energie an das Teilchen abgibt, die kinetische Energie kann nur wachsen.',
        review: ['Beurteilung positiver und negativer Arbeit'],
      },
    },
  ],
}

/* ------------------------------------------------------------ Fragenzuordnung -- */

const MAGNETIC_BASIC = [MAGNETIC_WORK, LORENTZ_RULE]
const MAGNETIC_RADIUS = [RADIUS_MASS, MAGNETIC_WORK]
const SELECTOR = [SELECTOR_CONDITION, SELECTOR_TOO_FAST]
const SPECTROMETER = [RADIUS_MASS, SPECTROMETER_SPEED]
const CROSSED = [CROSSED_NET_FORCE, MAGNETIC_WORK]
const THREE_FIELD = [THREE_FIELD_GRAVITY, CROSSED_NET_FORCE]
const PLATES = [PLATE_MOTION, PLATE_OUTSIDE]
const POINT = [POINT_CHARGE_DIRECTION]
const POINT_MULTI = [POINT_CHARGE_DIRECTION, SUPERPOSITION]

/* Selbsttests für Stromkreise: Der Verifier der Engine veröffentlicht kcl_current_conservation
   und power_balance, daher zitieren die falschen Optionen sie als Live-Belege. */
const OHMS_LAW: SelfCheckItem = {
  id: 'circuit-ohms-law',
  prompt: 'In einem Reihenstromkreis beträgt die Quellenspannung E und der Gesamtwiderstand R. Wie groß ist der Strom im Stromkreis?',
  takeaway: 'Ohmsches Gesetz I = E/R: Der Strom in einem Reihenstromkreis ist gleich der Quellenspannung geteilt durch den Gesamtwiderstand.',
  options: [
    { id: 'i-e-r', label: 'I = E / R', correct: true },
    {
      id: 'i-e-times-r',
      label: 'I = E × R',
      mistake: {
        type: 'concept',
        explanation: 'Der Strom ist umgekehrt proportional zum Widerstand, nicht proportional; je größer der Widerstand, desto kleiner der Strom.',
        review: ['Ohmsches Gesetz I = U/R'],
        evidenceCheckId: 'kcl_current_conservation',
      },
    },
    {
      id: 'i-r-over-e',
      label: 'I = R / E',
      mistake: {
        type: 'modeling',
        explanation: 'Hier sind Widerstand und Quellenspannung vertauscht; im Zähler muss die Quellenspannung stehen, im Nenner der Widerstand.',
        review: ['Ohmsches Gesetz I = U/R'],
      },
    },
  ],
}

const SERIES_PARALLEL_RULE: SelfCheckItem = {
  id: 'circuit-series-parallel',
  prompt: 'Welche Beziehung gilt für den Strom an allen Stellen eines Reihenstromkreises?',
  takeaway: 'In einem Reihenstromkreis ist der Strom überall gleich, die Spannung verteilt sich nach den Widerständen; in einem Parallelstromkreis ist die Spannung an allen Zweigen gleich, der Strom verteilt sich nach den Leitwerten.',
  options: [
    { id: 'equal', label: 'Der Strom ist überall gleich', correct: true },
    {
      id: 'voltage-equal',
      label: 'Die Spannung ist überall gleich',
      mistake: {
        type: 'concept',
        explanation: 'Überall gleiche Spannung ist das Kennzeichen eines Parallelstromkreises; in einem Reihenstromkreis verteilt sich die Spannung nach den Widerständen.',
        review: ['Gesetze des Reihenstromkreises', 'Gesetze des Parallelstromkreises'],
      },
    },
    {
      id: 'current-adds',
      label: 'Die Ströme werden addiert',
      mistake: {
        type: 'modeling',
        explanation:
          'Die Addition der Ströme ist das Kennzeichen paralleler Zweige (der Gesamtstrom ist gleich der Summe der Zweigströme); in einem Reihenstromkreis ist der Strom überall gleich.',
        review: ['Strom- und Spannungsgesetze in Reihen- und Parallelschaltung'],
      },
    },
  ],
}

const TERMINAL_VOLTAGE_RULE: SelfCheckItem = {
  id: 'circuit-terminal-voltage',
  prompt: 'Welche Beziehung gilt zwischen Klemmenspannung und Quellenspannung, wenn die Stromquelle einen Innenwiderstand hat?',
  takeaway: 'Klemmenspannung U = E − I·r: Am Innenwiderstand der Stromquelle fällt ein Teil der Spannung ab, die Spannung im Außenstromkreis ist kleiner als die Quellenspannung.',
  options: [
    { id: 'u-e-ir', label: 'U = E − I·r', correct: true },
    {
      id: 'u-e-plus-ir',
      label: 'U = E + I·r',
      mistake: {
        type: 'concept',
        explanation: 'Der Spannungsabfall am Innenwiderstand ist der Spannung des Außenstromkreises entgegengerichtet, er muss subtrahiert und nicht addiert werden.',
        review: ['Formel für die Klemmenspannung U = E − I·r'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
    {
      id: 'u-equals-e',
      label: 'U = E (Klemmenspannung gleich Quellenspannung)',
      mistake: {
        type: 'modeling',
        explanation: 'Nur bei einer idealen Stromquelle (Innenwiderstand null) ist die Klemmenspannung gleich der Quellenspannung; bei vorhandenem Innenwiderstand fällt an ihm ein Teil der Spannung ab.',
        review: ['Innenwiderstand der Stromquelle und Klemmenspannung'],
        evidenceCheckId: 'terminal_voltage_law',
      },
    },
  ],
}

const POWER_RULE: SelfCheckItem = {
  id: 'circuit-power',
  prompt: 'Welche Beziehung gilt zwischen der Gesamtleistung der Stromquelle, der Leistung des Außenstromkreises und der am Innenwiderstand verbrauchten Leistung?',
  takeaway: 'Energieerhaltung: Die Gesamtleistung der Stromquelle P = E·I ist gleich der Summe aus der Leistung des Außenstromkreises U·I und der am Innenwiderstand verbrauchten Leistung I²·r.',
  options: [
    { id: 'conservation', label: 'P_gesamt = P_außen + P_innen', correct: true },
    {
      id: 'p-equals-ui',
      label: 'P_gesamt = U·I (nur Außenstromkreis)',
      mistake: {
        type: 'concept',
        explanation: 'U·I ist nur die Leistung des Außenstromkreises; der am Innenwiderstand verbrauchte Anteil I²·r fehlt.',
        review: ['Formel für die Leistung der Stromquelle P = E·I'],
        evidenceCheckId: 'power_balance',
      },
    },
    {
      id: 'p-equals-i2r',
      label: 'P_gesamt = I²·r (nur Innenwiderstand)',
      mistake: {
        type: 'modeling',
        explanation: 'I²·r ist nur die am Innenwiderstand verbrauchte Leistung; die Gesamtleistung der Stromquelle ist E·I und umfasst sowohl den Außenstromkreis als auch den Innenwiderstand.',
        review: ['Leistung der Stromquelle und Energieerhaltung'],
        evidenceCheckId: 'power_balance',
      },
    },
  ],
}

const CIRCUIT_OHM = [OHMS_LAW, SERIES_PARALLEL_RULE]
const CIRCUIT_EMF = [TERMINAL_VOLTAGE_RULE, OHMS_LAW]

/* Selbsttests zur Optik. Die Optik-Engine veröffentlicht keine Verifier-Checks (sie
   prüft die Abbildung geometrisch, nicht über benannte Checks), daher nennen die falschen Optionen
   das zugrunde liegende Gesetz direkt, statt eine evidenceCheckId zu zitieren —
   genauso wie die Mechanik-Aufgaben Konzepte ohne Live-Check behandeln. */
const PLANE_MIRROR_IMAGE: SelfCheckItem = {
  id: 'optics-plane-mirror-virtual',
  prompt: 'Ein Gegenstand befindet sich 15 cm vor einem ebenen Spiegel. Wie groß ist der Abstand des Bildes vom Spiegel und welche Art von Bild entsteht?',
  takeaway: 'Der ebene Spiegel erzeugt ein aufrechtes, gleich großes, virtuelles Bild, der Bildabstand ist gleich dem Gegenstandsabstand (v = u), Bild und Gegenstand sind spiegelsymmetrisch.',
  options: [
    { id: 'v-equals-u', label: 'Bildabstand = 15 cm, aufrechtes, gleich großes virtuelles Bild', correct: true },
    {
      id: 'v-doubles',
      label: 'Bildabstand = 30 cm, das Bild ist größer als der Gegenstand',
      mistake: {
        type: 'concept',
        explanation:
          'Bei der Abbildung durch einen ebenen Spiegel ist der Bildabstand stets gleich dem Gegenstandsabstand, es gibt keine Vergrößerung; eine Vergrößerung tritt nur bei einer Konvexlinse oder einem Konkavspiegel bei bestimmten Gegenstandsabständen auf.',
        review: ['Abbildungsgesetz des ebenen Spiegels: Bildabstand = Gegenstandsabstand', 'Ein virtuelles Bild wird nicht vergrößert'],
      },
    },
    {
      id: 'real-image',
      label: 'Bildabstand = 15 cm, umgekehrtes reelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Das Bild eines ebenen Spiegels ist ein durch Reflexion des Lichts entstandenes virtuelles Bild und kann nicht auf einem Schirm aufgefangen werden; ein reelles Bild entsteht durch die Vereinigung tatsächlicher Lichtstrahlen, ein ebener Spiegel kann kein reelles Bild erzeugen.',
        review: ['Unterschied zwischen reellem und virtuellem Bild', 'Eigenschaften der Abbildung am ebenen Spiegel'],
      },
    },
  ],
}

const CONVEX_LENS_REAL_IMAGE: SelfCheckItem = {
  id: 'optics-convex-lens-real-image',
  prompt: 'Eine Konvexlinse hat die Brennweite f = 10 cm, der Gegenstand steht bei u = 30 cm (u > 2f). Welche Art von Bild entsteht?',
  takeaway: 'Die Bedingung für ein reelles Bild bei einer Konvexlinse ist u > f; für u > 2f entsteht ein umgekehrtes, verkleinertes, reelles Bild mit dem Bildabstand f < v < 2f.',
  options: [
    { id: 'inverted-reduced', label: 'Umgekehrtes, verkleinertes, reelles Bild, f < v < 2f', correct: true },
    {
      id: 'upright-reduced',
      label: 'Aufrechtes, verkleinertes, reelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Reelle Bilder einer Konvexlinse sind stets umgekehrt; ein aufrechtes Bild kann nur ein virtuelles Bild sein (für u < f), es kann nicht zugleich aufrecht und reell sein.',
        review: ['Abbildungsgesetz der Konvexlinse: reelle Bilder umgekehrt, virtuelle Bilder aufrecht', 'Bildeigenschaften für u > 2f und f < u < 2f'],
      },
    },
    {
      id: 'enlarged-real',
      label: 'Umgekehrtes, vergrößertes, reelles Bild',
      mistake: {
        type: 'modeling',
        explanation:
          'Für u > 2f liegt der Bildabstand bei f < v < 2f und das Bild ist verkleinert; ein vergrößertes reelles Bild tritt bei f < u < 2f auf, je nach Gegenstandsabstand ist die Bildeigenschaft unterschiedlich.',
        review: ['Tabelle der Abbildungsgesetze der Konvexlinse', 'Zuordnung von Gegenstandsabstand, Bildabstand und Bildeigenschaft'],
      },
    },
  ],
}

const CONVEX_LENS_MAGNIFYING: SelfCheckItem = {
  id: 'optics-convex-lens-virtual-image',
  prompt: 'Eine Konvexlinse hat die Brennweite f = 10 cm, der Gegenstand steht bei u = 6 cm (u < f). Welche Art von Bild entsteht?',
  takeaway: 'Für u < f erzeugt die Konvexlinse ein aufrechtes, vergrößertes, virtuelles Bild mit dem Bildabstand |v| > u; dies ist das Prinzip der Lupe.',
  options: [
    { id: 'upright-enlarged-virtual', label: 'Aufrechtes, vergrößertes, virtuelles Bild', correct: true },
    {
      id: 'inverted-reduced-real',
      label: 'Umgekehrtes, verkleinertes, reelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Für u < f laufen die gebrochenen Lichtstrahlen auseinander und können sich nicht zu einem reellen Bild vereinigen; ein aufrechtes Bild kann nur ein virtuelles Bild sein, im Gegensatz zur Abbildung für u > 2f.',
        review: ['Konvexlinse erzeugt für u < f ein virtuelles Bild', 'Prinzip der Lupe'],
      },
    },
    {
      id: 'real-image',
      label: 'Umgekehrtes, vergrößertes, reelles Bild',
      mistake: {
        type: 'modeling',
        explanation:
          'Ein umgekehrtes vergrößertes reelles Bild tritt für f < u < 2f auf; für u < f entsteht überhaupt kein reelles Bild, zur Beurteilung der Bildeigenschaft ist zuerst das Verhältnis von Gegenstandsabstand und Brennweite zu prüfen.',
        review: ['Abbildungsgesetz der Konvexlinse: der Bereich des Gegenstandsabstands bestimmt die Bildeigenschaft'],
      },
    },
  ],
}

const CONCAVE_MIRROR_REAL_IMAGE: SelfCheckItem = {
  id: 'optics-concave-mirror-real-image',
  prompt: 'Ein Konkavspiegel hat die Brennweite f = 10 cm, der Gegenstand steht bei u = 30 cm (u > 2f). Welche Art von Bild entsteht?',
  takeaway: 'Das Abbildungsgesetz des Konkavspiegels stimmt mit dem der Konvexlinse überein: Für u > 2f entsteht ein umgekehrtes, verkleinertes, reelles Bild, das vor der Spiegelfläche (auf derselben Seite) erscheint.',
  options: [
    { id: 'inverted-reduced-real', label: 'Umgekehrtes, verkleinertes, reelles Bild', correct: true },
    {
      id: 'upright-virtual',
      label: 'Aufrechtes, verkleinertes, virtuelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Beim Konkavspiegel vereinigen sich für u > 2f die reflektierten Lichtstrahlen zu einem reellen Bild, das Bild ist umgekehrt; ein aufrechtes virtuelles Bild tritt nur für u < f auf, anders als beim Konvexspiegel.',
        review: ['Abbildungsgesetz des Konkavspiegels', 'Analogie der Abbildungsgesetze von sphärischen Spiegeln und Linsen'],
      },
    },
    {
      id: 'enlarged-real',
      label: 'Umgekehrtes, vergrößertes, reelles Bild',
      mistake: {
        type: 'modeling',
        explanation:
          'Für u > 2f ist das Bild verkleinert; ein vergrößertes reelles Bild erfordert f < u < 2f. Hier wird fälschlich die Aussage, ein Konkavspiegel erzeuge ein reelles Bild, mit einer stets vergrößerten Abbildung verwechselt.',
        review: ['Tabelle der Abbildungsgesetze des Konkavspiegels', 'Zuordnung von Gegenstandsabstand und Bildeigenschaft'],
      },
    },
  ],
}

const CONVEX_MIRROR_IMAGE: SelfCheckItem = {
  id: 'optics-convex-mirror-virtual',
  prompt: 'Ein Konvexspiegel streut das Licht. Welches Bild entsteht von einem Gegenstand vor dem Konvexspiegel?',
  takeaway: 'Der Konvexspiegel (Streuspiegel) erzeugt für jeden Gegenstandsabstand ein aufrechtes, verkleinertes, virtuelles Bild; deshalb dient er als Rückspiegel eines Autos zur Vergrößerung des Sichtfelds.',
  options: [
    { id: 'upright-reduced-virtual', label: 'Aufrechtes, verkleinertes, virtuelles Bild', correct: true },
    {
      id: 'inverted-real',
      label: 'Umgekehrtes, reelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Der Konvexspiegel ist ein Streuspiegel, die reflektierten Lichtstrahlen vereinigen sich nicht und es entsteht nie ein reelles Bild; ein reelles Bild kann nur ein Sammelspiegel (Konkavspiegel) für u > f erzeugen.',
        review: ['Streuende Eigenschaft des Konvexspiegels', 'Unterschied zwischen Sammel- und Streuspiegel'],
      },
    },
    {
      id: 'enlarged-virtual',
      label: 'Aufrechtes, vergrößertes, virtuelles Bild',
      mistake: {
        type: 'concept',
        explanation:
          'Das virtuelle Bild des Konvexspiegels ist stets verkleinert (Vergrößerung |m| < 1), weil die Streuung das Bild zusammendrückt; ein vergrößertes virtuelles Bild tritt nur bei einer Konvexlinse für u < f auf.',
        review: ['Abbildung am Konvexspiegel: stets verkleinert', 'Gegenstandsabstandsbedingung der Lupe mit Konvexlinse'],
      },
    },
  ],
}

const CONVEX_LENS_BETWEEN_F_2F: SelfCheckItem = {
  id: 'optics-convex-lens-magnified-real',
  prompt: 'Eine Konvexlinse hat die Brennweite f = 10 cm, der Gegenstand steht bei u = 15 cm (f < u < 2f). Welche Art von Bild entsteht?',
  takeaway: 'Für f < u < 2f erzeugt die Konvexlinse ein umgekehrtes, vergrößertes, reelles Bild mit dem Bildabstand v > 2f; dies ist das Prinzip des Projektors.',
  options: [
    { id: 'inverted-enlarged-real', label: 'Umgekehrtes, vergrößertes, reelles Bild, v > 2f', correct: true },
    {
      id: 'upright-virtual',
      label: 'Aufrechtes, vergrößertes, virtuelles Bild',
      mistake: {
        type: 'concept',
        explanation: 'Ein aufrechtes virtuelles Bild tritt für u < f auf; für f < u < 2f vereinigen sich die gebrochenen Lichtstrahlen zu einem reellen Bild, und reelle Bilder sind stets umgekehrt.',
        review: ['Abbildungsgesetz der Konvexlinse: für f < u < 2f entsteht ein umgekehrtes vergrößertes reelles Bild', 'Gegenstandsabstandsgrenze zwischen reellem und virtuellem Bild'],
      },
    },
    {
      id: 'reduced-real',
      label: 'Umgekehrtes, verkleinertes, reelles Bild',
      mistake: {
        type: 'modeling',
        explanation:
          'Ein verkleinertes reelles Bild tritt für u > 2f auf; für f < u < 2f ist der Bildabstand v > 2f und das Bild vergrößert. Hier werden die Bildeigenschaften zweier Gegenstandsabstandsbereiche verwechselt.',
        review: ['Tabelle der Abbildungsgesetze der Konvexlinse', 'Gegenstandsabstandsbedingungen für vergrößerte und verkleinerte reelle Bilder'],
      },
    },
  ],
}

/* --------------------------------------------------------------- Induktion -- */

export const INDUCTION_BAR_EMF: SelfCheckItem = {
  id: 'induction-bar-emf-formula',
  prompt: 'Ein Leiterstab der Länge L bewegt sich mit der Geschwindigkeit v senkrecht durch ein homogenes Magnetfeld der Flussdichte B. Wie groß ist die induzierte Spannung?',
  takeaway: 'Bewegungsinduzierte Spannung E = BLv: Die Spannung ist maximal, wenn die drei Größen senkrecht aufeinander stehen; die Richtung bestimmt man mit der Rechte-Hand-Regel.',
  options: [
    { id: 'blv', label: 'E = BLv', correct: true },
    {
      id: 'blv-over-r',
      label: 'E = BLv/R',
      mistake: {
        type: 'modeling',
        explanation:
          'BLv/R ist der Betrag des induzierten Stroms I (Ohmsches Gesetz I = E/R), nicht die Spannung. Die induzierte Spannung wird nur von B, L und v bestimmt und hängt nicht vom Widerstand des Stromkreises ab.',
        review: ['Bewegungsinduzierte Spannung E = BLv', 'Induzierter Strom I = E/R'],
        evidenceCheckId: 'ohm_law_loop',
      },
    },
    {
      id: 'bl-over-v',
      label: 'E = BL/v',
      mistake: {
        type: 'concept',
        explanation:
          'Die Geschwindigkeit v steht im Zähler: Die pro Zeiteinheit überstrichene Fläche ist Lv, die Änderungsrate des magnetischen Flusses ist BLv. Eine Division ergibt nicht einmal stimmige Einheiten (T·m ÷ (m/s) ist kein Volt).',
        review: ['Einheitenprüfung: T·m²/s = Wb/s = V', 'Herleitung der bewegungsinduzierten Spannung'],
        evidenceCheckId: 'faraday_law',
      },
    },
  ],
}

export const INDUCTION_LENZ: SelfCheckItem = {
  id: 'induction-lenz-opposition',
  prompt: 'Welche Richtung des induzierten Stroms ergibt sich nach der Lenzschen Regel, wenn der magnetische Fluss durch eine Spule zunimmt?',
  takeaway:
    'Lenzsche Regel: Das Magnetfeld des induzierten Stroms wirkt stets der Änderung des magnetischen Flusses entgegen, die den induzierten Strom hervorruft — nimmt der magnetische Fluss zu, ist das Magnetfeld des induzierten Stroms dem ursprünglichen Magnetfeld entgegengerichtet.',
  options: [
    { id: 'opposes-increase', label: 'Das induzierte Magnetfeld ist dem ursprünglichen entgegengerichtet und hemmt die Zunahme', correct: true },
    {
      id: 'same-direction',
      label: 'Das induzierte Magnetfeld ist dem ursprünglichen gleichgerichtet und verstärkt den magnetischen Fluss',
      mistake: {
        type: 'direction',
        explanation:
          'Wäre das induzierte Magnetfeld dem ursprünglichen gleichgerichtet, würde der magnetische Fluss weiter zunehmen und die induzierte Spannung weiter wachsen — eine Rückkopplung würde die Energie unbegrenzt vergrößern und damit die Energieerhaltung verletzen. Das Hemmen der Lenzschen Regel ist gerade der Ausdruck der Energieerhaltung.',
        review: ['Formulierung der Lenzschen Regel', 'Lenzsche Regel und Energieerhaltung'],
        evidenceCheckId: 'lenz_direction',
      },
    },
    {
      id: 'no-direction',
      label: 'Die Richtung ist unbestimmt und hängt vom Spulenwiderstand ab',
      mistake: {
        type: 'concept',
        explanation:
          'Die Richtung des induzierten Stroms wird nur durch die Richtung der Flussänderung und den Wicklungssinn der Spule bestimmt (Lenzsche Regel); nur der Betrag des Stroms hängt vom Widerstand ab (I = E/R).',
        review: ['Lenzsche Regel bestimmt die Richtung', 'I = E/R bestimmt den Betrag'],
        evidenceCheckId: 'lenz_direction',
      },
    },
  ],
}

export const INDUCTION_FARADAY: SelfCheckItem = {
  id: 'induction-faraday-rate',
  prompt: 'Was ist nach dem Faradayschen Induktionsgesetz der Betrag der induzierten Spannung?',
  takeaway: 'E = -dΦ/dt: Der Betrag der induzierten Spannung ist gleich der Änderungsrate des magnetischen Flusses — nicht der Änderung selbst, sondern der Änderung pro Zeiteinheit.',
  options: [
    { id: 'flux-rate', label: 'Die Änderungsrate des magnetischen Flusses dΦ/dt', correct: true },
    {
      id: 'flux-change',
      label: 'Die Änderung des magnetischen Flusses ΔΦ',
      mistake: {
        type: 'concept',
        explanation:
          'Dieselbe Änderung ΔΦ, einmal in 1 s und einmal in 10 s ausgeführt, ergibt einen zehnfachen Unterschied der Spannung: Bei langsamer Änderung entsteht fast keine Spannung. Entscheidend für die Spannung ist die Schnelligkeit der Änderung (die Änderungsrate), nicht der Gesamtbetrag der Änderung.',
        review: ['Bedeutung von E = -dΦ/dt', 'Unterschied zwischen Änderung und Änderungsrate'],
        evidenceCheckId: 'faraday_law',
      },
    },
    {
      id: 'flux-value',
      label: 'Der Betrag des magnetischen Flusses Φ selbst',
      mistake: {
        type: 'concept',
        explanation:
          'Ein sehr großer konstanter magnetischer Fluss (dΦ/dt = 0) erzeugt überhaupt keine Spannung; nur eine Änderung induziert. Die induzierte Spannung hängt nicht vom Absolutwert von Φ ab.',
        review: ['Faradaysches Gesetz: nur eine Änderung induziert', 'Konstanter magnetischer Fluss erzeugt keine Spannung'],
        evidenceCheckId: 'faraday_law',
      },
    },
  ],
}

export const INDUCTION_NO_CUT: SelfCheckItem = {
  id: 'induction-zero-emf-conditions',
  prompt: 'Ein Leiterstab bewegt sich in einem Magnetfeld. In welchem Fall ist die induzierte Spannung null?',
  takeaway:
    'Ist in E = BLv eine der Größen null, so ist auch die Spannung null: v = 0 (keine Bewegung), der Stab bewegt sich parallel zum Magnetfeld (schneidet keine Feldlinien) oder der Stab gleitet entlang seiner eigenen Länge (überstreicht keine wirksame Fläche).',
  options: [
    { id: 'parallel-to-b', label: 'Der Stab bewegt sich in Richtung des Magnetfelds (Geschwindigkeit parallel zum Magnetfeld)', correct: true },
    {
      id: 'fast-motion',
      label: 'Wenn sich der Stab sehr schnell bewegt',
      mistake: {
        type: 'modeling',
        explanation:
          'E = BLv ist proportional zur Geschwindigkeit: Je schneller, desto größer die Spannung, sie wird nie wegen zu großer Geschwindigkeit null. Null wird sie nur dann, wenn die wirksame Komponente der Schneidegeschwindigkeit null ist.',
        review: ['In E = BLv ist die Geschwindigkeit die Komponente senkrecht zum Magnetfeld', 'Proportionale Beziehung'],
        evidenceCheckId: 'faraday_law',
      },
    },
    {
      id: 'any-motion',
      label: 'Solange sich der Stab im Magnetfeld bewegt, ist die Spannung nicht null',
      mistake: {
        type: 'concept',
        explanation:
          'Bewegt man sich in Richtung des Magnetfelds, werden keine Feldlinien geschnitten; in E = BLv⊥ ist die senkrechte Komponente v⊥ = 0, die Spannung ist null. Bewegung bedeutet nicht automatisch Schneiden.',
        review: ['Bedingung für das Schneiden von Feldlinien', 'Senkrechte Komponente der Geschwindigkeit'],
        evidenceCheckId: 'faraday_law',
      },
    },
  ],
}

/* ------------------------------------------------------------------- Welle -- */

export const WAVE_SPEED_FREQUENCY: SelfCheckItem = {
  id: 'wave-speed-frequency',
  prompt: 'Ein Seil wird schneller geschüttelt (doppelte Frequenz), das Seil selbst wird nicht gewechselt. Wie ändern sich Wellengeschwindigkeit und Wellenlänge?',
  takeaway:
    'Die Wellengeschwindigkeit wird vom Medium bestimmt und hängt nicht von der Schüttelfrequenz ab. In v = λf ist v fest; verdoppelt sich die Frequenz, halbiert sich die Wellenlänge — bei schnellerem Schütteln wird die Wellenform dichter, aber die Welle läuft gleich schnell.',
  options: [
    { id: 'speed-same-wavelength-half', label: 'Wellengeschwindigkeit unverändert, Wellenlänge halbiert', correct: true },
    {
      id: 'speed-doubles',
      label: 'Wellengeschwindigkeit verdoppelt, Wellenlänge unverändert',
      mistake: {
        type: 'concept',
        explanation:
          'Die Wellengeschwindigkeit ist eine Eigenschaft des Mediums (bestimmt durch die Spannung und die lineare Dichte des Seils); die Schnelligkeit des Schüttelns ändert daran nichts. In v = λf ist v fest, eine Verdopplung von f kann λ nur halbieren.',
        review: ['Wellengeschwindigkeit wird vom Medium bestimmt', 'v = λf'],
        evidenceCheckId: 'wave_speed_relation',
      },
    },
    {
      id: 'both-double',
      label: 'Wellengeschwindigkeit und Wellenlänge verdoppeln sich beide',
      mistake: {
        type: 'modeling',
        explanation:
          'Würden sich v und λ zugleich verdoppeln, verlangte v = λf eine Halbierung von f, im Widerspruch zur Verdopplung der Frequenz. Auf demselben Seil ist v fest, λ kann sich nur umgekehrt proportional zu f ändern.',
        review: ['v = λf: von den drei Größen sind nur zwei unabhängig wählbar', 'Periodendauer T = 1/f'],
        evidenceCheckId: 'period_frequency_reciprocal',
      },
    },
  ],
}

export const WAVE_PARTICLE_TRANSPORT: SelfCheckItem = {
  id: 'wave-particle-transport',
  prompt: 'Eine Transversalwelle läuft auf einem Seil nach rechts. Wie bewegt sich das markierte Seilteilchen?',
  takeaway:
    'Das Teilchen schwingt nur um seine eigene Gleichgewichtslage auf und ab und wandert nicht mit der Welle nach rechts. Nach rechts breiten sich die Schwingungsform und die Energie aus, nicht das Seil selbst.',
  options: [
    { id: 'oscillates-in-place', label: 'Schwingt um seinen ursprünglichen Ort auf und ab und bewegt sich nicht nach rechts', correct: true },
    {
      id: 'travels-with-wave',
      label: 'Bewegt sich zusammen mit der Welle nach rechts',
      mistake: {
        type: 'concept',
        explanation:
          'Die Welle überträgt den Schwingungszustand, nicht das Medium. Die x-Koordinate des markierten Punkts bleibt stets unverändert, nur y führt über die Zeit eine harmonische Schwingung aus — auf dem Canvas bewegt sich seine Abszisse um keinen einzigen Rasterabstand.',
        review: ['Die Welle überträgt Schwingungsform und Energie', 'Die Medium-Teilchen führen eine harmonische Schwingung aus'],
        evidenceCheckId: 'particle_no_net_transport',
      },
    },
    {
      id: 'round-trip-wavelength',
      label: 'Bewegt sich zuerst um eine Wellenlänge nach rechts und kehrt dann an den ursprünglichen Ort zurück',
      mistake: {
        type: 'modeling',
        explanation:
          'Das Teilchen verlässt niemals seine x-Position. Die Aussage, es kehre nach einer Periode an den ursprünglichen Ort zurück, bedeutet, dass es eine vollständige Auf-und-Ab-Schwingung ausführt, und nicht, dass es in horizontaler Richtung einen Hin-und-Rückweg zurücklegt.',
        review: ['In einer Periode T = 1/f führt das Teilchen eine vollständige Schwingung aus', 'Die Wellenform verschiebt sich in einer Periode um eine Wellenlänge'],
        evidenceCheckId: 'profile_translation',
      },
    },
  ],
}

export const WAVE_PATH_DIFFERENCE: SelfCheckItem = {
  id: 'wave-path-difference',
  prompt: 'Zwei gleichphasige kohärente Wellenquellen haben zum Punkt P den Gangunterschied Δ = 2λ. Wie schwingt der Punkt P?',
  takeaway: 'Ist der Gangunterschied ein ganzzahliges Vielfaches der Wellenlänge, treffen die beiden Wellen gleichphasig ein: Wellenberg trifft auf Wellenberg, Wellental auf Wellental, die Schwingung wird verstärkt, die Amplitude ist 2A.',
  options: [
    { id: 'constructive', label: 'Die Schwingung wird verstärkt, Amplitude 2A', correct: true },
    {
      id: 'destructive',
      label: 'Die Schwingung wird abgeschwächt, Amplitude null',
      mistake: {
        type: 'concept',
        explanation:
          'Die Bedingung für Abschwächung ist Δ = (n + ½)λ, hier heben sich die beiden Wellen gegenphasig auf. Δ = 2λ entspricht genau zwei ganzen Perioden, die beiden Wellen überlagern sich gleichphasig, es ist ein Verstärkungspunkt.',
        review: ['Δ = nλ verstärkt', 'Δ = (n + ½)λ schwächt ab'],
        evidenceCheckId: 'path_difference_rule',
      },
    },
    {
      id: 'beats',
      label: 'Die Amplitude schwankt zwischen 0 und 2A hin und her',
      mistake: {
        type: 'modeling',
        explanation:
          'Die Amplitude an einem Verstärkungspunkt ist stabil 2A: Die Verschiebung des Punktes P schwingt über die Zeit zwischen −2A und +2A, aber die Amplitude selbst bleibt unverändert. Die Verteilung der Verstärkungen und Abschwächungen kohärenter Wellen ist stabil.',
        review: ['Das Interferenzmuster bleibt stabil', 'Resultierende Amplitude A_P = |2A·cos(πΔ/λ)|'],
        evidenceCheckId: 'superposition_bounds',
      },
    },
  ],
}

export const WAVE_DESTRUCTIVE_HALF: SelfCheckItem = {
  id: 'wave-destructive-half',
  prompt: 'Verschiebt man den Beobachtungspunkt an die Stelle mit dem Gangunterschied Δ = λ/2, wie überlagern sich die beiden Wellen dort?',
  takeaway:
    'Bei einem Gangunterschied von einer halben Wellenlänge treffen die beiden Wellen gegenphasig ein, erreicht die eine einen Wellenberg, so erreicht die andere gerade ein Wellental, die Verschiebungen heben sich stets gegenseitig auf, die Amplitude ist null — das ist ein Abschwächungspunkt.',
  options: [
    { id: 'cancel', label: 'Heben sich stets gegenseitig auf, Amplitude null', correct: true },
    {
      id: 'crest-on-crest',
      label: 'Wellenberg über Wellenberg, Amplitude 2A',
      mistake: {
        type: 'concept',
        explanation:
          'Ein Gangunterschied von einer halben Wellenlänge bedeutet, dass die eine Welle gerade einen Wellenberg erreicht, während die andere einen Wellental erreicht; die Verschiebungen sind betragsgleich und entgegengesetzt gerichtet und ergeben nach der Überlagerung null.',
        review: ['Δ = (n + ½)λ schwächt ab', 'Phasendifferenz = 2πΔ/λ'],
        evidenceCheckId: 'path_difference_rule',
      },
    },
    {
      id: 'waves-vanish',
      label: 'Nachdem sich die beiden Wellen getroffen haben, verschwinden sie beide',
      mistake: {
        type: 'modeling',
        explanation:
          'Die beiden Wellen heben sich nur an diesem Punkt in ihrer Verschiebung auf, jede von ihnen breitet sich weiter in ihrer ursprünglichen Richtung aus; die Energie verschwindet nicht, sondern verteilt sich neu auf die Verstärkungspunkte.',
        review: ['Prinzip der unabhängigen Ausbreitung von Wellen', 'Interferenz ist eine Neuverteilung der Energie'],
        evidenceCheckId: 'superposition_bounds',
      },
    },
  ],
}

export const WAVE_NODE_MOTION: SelfCheckItem = {
  id: 'wave-node-motion',
  prompt: 'Auf einer an beiden Enden befestigten Saite bildet sich eine stehende Welle. Wie bewegen sich die Teilchen an einem Knoten?',
  takeaway:
    'Ein Knoten ist die Stelle, an der zwei entgegengesetzt laufende Wellen stets gegenphasig überlagert werden, die Verschiebung ist immer null und das Teilchen bleibt in Ruhe; die Stelle mit der größten Amplitude ist der Bauch.',
  options: [
    { id: 'still', label: 'Bleibt stets in Ruhe, Verschiebung null', correct: true },
    {
      id: 'max-amplitude',
      label: 'Größte Amplitude, schwingt am stärksten auf und ab',
      mistake: {
        type: 'concept',
        explanation:
          'Die Stelle mit der größten Amplitude heißt Bauch, nicht Knoten. Ein Knoten ist die Stelle, an der sich die beiden Wellen stets gegenphasig aufheben, die Verschiebung ist immer null — auf dem Canvas bewegt er sich überhaupt nicht.',
        review: ['Knoten: Verschiebung immer null', 'Bauch: größte Amplitude'],
        evidenceCheckId: 'node_positions_fixed',
      },
    },
    {
      id: 'slides-along',
      label: 'Bewegt sich entlang der Saite hin und her',
      mistake: {
        type: 'modeling',
        explanation:
          'Das Stehende an einer stehenden Welle ist, dass sich die Wellenform nicht ausbreitet: Die Knoten liegen fest bei x = m·L/n und verschieben sich nicht mit der Zeit; bei einer an beiden Enden befestigten Saite sind die beiden Enden selbst Knoten.',
        review: ['Die Wellenform einer stehenden Welle breitet sich nicht aus', 'Ein festes Ende ist ein Knoten'],
        evidenceCheckId: 'boundary_nodes',
      },
    },
  ],
}

export const WAVE_HARMONIC_FREQUENCY: SelfCheckItem = {
  id: 'wave-harmonic-frequency',
  prompt: 'Die Saitenlänge L und die Wellengeschwindigkeit v bleiben unverändert. Wie ändert sich die Frequenz beim Übergang von der zweiten zur dritten Harmonischen?',
  takeaway:
    'f_n = n·v/(2L), die Frequenz der Harmonischen ist proportional zu n: Beim Übergang von n = 2 zu n = 3 wird die Frequenz zum 1,5-Fachen, auf der Saite entsteht ein zusätzlicher Knoten.',
  options: [
    { id: 'times-1-5', label: 'Wird zum 1,5-Fachen (f_n ∝ n)', correct: true },
    {
      id: 'unchanged',
      label: 'Unverändert, die Frequenz wird nur von der Saite bestimmt',
      mistake: {
        type: 'concept',
        explanation:
          'Die Saite bestimmt die Wellengeschwindigkeit v und die Grundfrequenz f₁ = v/(2L); die Frequenz der n-ten Harmonischen f_n = n·f₁ wächst mit n. Dieselbe Saite kann bei mehreren Frequenzen in Resonanz geraten.',
        review: ['f_n = n·v/(2L) = n·f₁', 'Grundfrequenz und Harmonische'],
        evidenceCheckId: 'frequency_harmonic',
      },
    },
    {
      id: 'two-thirds',
      label: 'Wird zum 2/3-Fachen (die Wellenlänge wird länger)',
      mistake: {
        type: 'modeling',
        explanation:
          'Wächst n, so wird λ = 2L/n kürzer und nicht länger; v bleibt konstant, wird λ kürzer, so wächst f = v/λ. Die Wellenlänge der dritten Harmonischen beträgt 2/3 der zweiten, die Frequenz das 1,5-Fache.',
        review: ['L = n·λ/2', 'v = λf'],
        evidenceCheckId: 'harmonic_relation',
      },
    },
  ],
}

export const WAVE_LONGITUDINAL_DIRECTION: SelfCheckItem = {
  id: 'wave-longitudinal-direction',
  prompt: 'Wie hängt bei einer Longitudinalwelle im Medium die Schwingungsrichtung der Teilchen mit der Ausbreitungsrichtung zusammen?',
  takeaway: 'Bei einer Longitudinalwelle schwingen die Teilchen in Richtung der Ausbreitung vor und zurück und bilden Verdichtungs- und Verdünnungsbereiche; nur die Transversalwelle schwingt senkrecht zur Ausbreitungsrichtung.',
  options: [
    { id: 'parallel', label: 'Die Schwingungsrichtung ist parallel zur Ausbreitungsrichtung', correct: true },
    {
      id: 'perpendicular',
      label: 'Die Schwingungsrichtung ist senkrecht zur Ausbreitungsrichtung',
      mistake: {
        type: 'concept',
        explanation: 'Senkrecht zur Ausbreitungsrichtung schwingt die Transversalwelle; die Longitudinalwelle breitet sich über Verdichtung und Verdünnung des Mediums aus.',
        review: ['Unterschied zwischen Longitudinal- und Transversalwelle', 'Verdichtung und Verdünnung'],
        evidenceCheckId: 'longitudinal_particle_motion',
      },
    },
  ],
}

export const WAVE_BOUNDARY_RULE: SelfCheckItem = {
  id: 'wave-boundary-rule',
  prompt: 'Welche Größe bleibt unverändert, wenn eine mechanische Welle von einem Medium in ein anderes übergeht?',
  takeaway: 'Die Frequenz wird von der Wellenquelle bestimmt und bleibt über die Grenzfläche hinweg unverändert; die Wellengeschwindigkeit ändert sich, daher ändert sich die Wellenlänge mit dem Medium.',
  options: [
    { id: 'frequency', label: 'Frequenz', correct: true },
    {
      id: 'speed',
      label: 'Wellengeschwindigkeit',
      mistake: {
        type: 'concept',
        explanation: 'Ein Wechsel des Mediums ändert die Wellengeschwindigkeit; damit f unverändert bleibt, ändert sich die Wellenlänge nach λ = v/f.',
        review: ['v = λf', 'Die Frequenz bleibt über die Grenzfläche hinweg unverändert'],
        evidenceCheckId: 'frequency_unchanged_at_boundary',
      },
    },
  ],
}

export const WAVE_DIFFRACTION_MINIMUM: SelfCheckItem = {
  id: 'wave-diffraction-minimum',
  prompt: 'Wie lautet die Bedingung für die dunklen Streifen bei der Beugung am Einzelspalt?',
  takeaway: 'Für die dunklen Streifen gilt a·sinθ = mλ (m = ±1, ±2, …); je schmaler der Spalt, desto ausgeprägter die Beugung.',
  options: [
    { id: 'm-lambda', label: 'a·sinθ = mλ', correct: true },
    {
      id: 'half-lambda',
      label: 'a·sinθ = (m + ½)λ',
      mistake: {
        type: 'modeling',
        explanation: '(m + ½)λ ist die Bedingung für die dunklen Streifen bei der Doppelspaltinterferenz; die Beugung am Einzelspalt entsteht aus der Überlagerung der Elementarwellen innerhalb desselben Spalts.',
        review: ['Bedingung für die dunklen Streifen bei der Einzelspaltbeugung', 'Unterschied zwischen Doppelspaltinterferenz und Einzelspaltbeugung'],
      },
    },
  ],
}

export const WAVE_DOPPLER_SIGN: SelfCheckItem = {
  id: 'wave-doppler-sign',
  prompt: 'Wie ändert sich die vom Beobachter empfangene Frequenz, wenn sich die Wellenquelle einem ruhenden Beobachter nähert?',
  takeaway: 'Nähert sich die Wellenquelle, werden die Wellenfronten gestaucht und die empfangene Frequenz ist höher als die Quellfrequenz; entfernt sie sich, ist sie niedriger als die Quellfrequenz.',
  options: [
    { id: 'higher', label: 'Die Frequenz steigt', correct: true },
    {
      id: 'unchanged',
      label: 'Die Frequenz bleibt unverändert',
      mistake: {
        type: 'concept',
        explanation: 'Die Relativbewegung ändert den zeitlichen Abstand, in dem aufeinanderfolgende Wellenfronten den Beobachter erreichen, daher ändert sich die Empfangsfrequenz.',
        review: ['Dopplereffekt', 'f′ = f(v ± v₀)/(v ∓ vₛ)'],
        evidenceCheckId: 'doppler_frequency_relation',
      },
    },
  ],
}

export const PHOTOELECTRIC_EQUATION: SelfCheckItem = {
  id: 'photoelectric-equation',
  prompt: 'Wie wirkt sich eine Erhöhung der Intensität des einfallenden Lichts beim photoelektrischen Effekt auf die maximale kinetische Energie der Photoelektronen aus?',
  takeaway:
    'Eine höhere Lichtintensität erhöht nur die Zahl der einfallenden Photonen pro Zeiteinheit und damit den Photostrom; die Energie hf jedes Photons bleibt unverändert, ebenso die maximale kinetische Energie.',
  options: [
    { id: 'unchanged', label: 'Die maximale kinetische Energie bleibt unverändert, der Photostrom wächst', correct: true },
    {
      id: 'increases',
      label: 'Die maximale kinetische Energie wächst mit der Lichtintensität',
      mistake: {
        type: 'concept',
        explanation: 'Die Einstein-Gleichung lautet hf = W + Kmax; Kmax wird nur von der Frequenz und der Austrittsarbeit bestimmt und ist unabhängig von der Lichtintensität.',
        review: ['Photonenenergie E = hf', 'Kmax = hf − W'],
        evidenceCheckId: 'intensity_does_not_change_kmax',
      },
    },
  ],
}

export const PHOTOELECTRIC_THRESHOLD: SelfCheckItem = {
  id: 'photoelectric-threshold',
  prompt: 'Können Photoelektronen entstehen, wenn die Frequenz des einfallenden Lichts unter der Grenzfrequenz des Metalls liegt und die Lichtintensität erhöht wird?',
  takeaway: 'Nein. Ist die Energie hf eines einzelnen Photons kleiner als die Austrittsarbeit, so können noch so viele Photonen kein Elektron herauslösen.',
  options: [
    { id: 'cannot', label: 'Nein, Kmax = 0', correct: true },
    {
      id: 'can-with-intensity',
      label: 'Ja, sofern die Lichtintensität groß genug ist',
      mistake: {
        type: 'concept',
        explanation: 'Der photoelektrische Effekt ist ein Einzelphotonenprozess; liegt die Frequenz unter der Grenzfrequenz, reicht kein einzelnes Photon aus, um die Austrittsarbeit zu überwinden.',
        review: ['Grenzfrequenz f₀ = W/h', 'Einzelphotonen-Photoeffekt'],
        evidenceCheckId: 'photocurrent_extinction_below_threshold',
      },
    },
  ],
}

export const MODERN_UNSUPPORTED: SelfCheckItem = {
  id: 'modern-unsupported-model',
  prompt: 'Wie ist eine solche Aufgabe zu beantworten, wenn die aktuelle Engine kein Modell für Energieniveau-Übergänge besitzt?',
  takeaway: 'Es soll UNSUPPORTED_MODEL zurückgegeben und die Modellücke erklärt werden; klassische Formeln dürfen nicht angewendet werden, um eine Antwort vorzutäuschen.',
  options: [
    { id: 'unsupported', label: 'UNSUPPORTED_MODEL zurückgeben', correct: true },
    {
      id: 'classical-guess',
      label: 'Mit einer beliebigen klassischen Formel abschätzen',
      mistake: {
        type: 'modeling',
        explanation: 'Energieniveau-Übergänge sind ein Quantenmodell; die Berechnung mit einem anderen physikalischen Modell liefert Werte ohne physikalische Grundlage.',
        review: ['Gültigkeitsgrenzen des Modells', 'Prinzip des sicheren Fehlers (fail-closed)'],
      },
    },
  ],
}

/**
 * Goldfrage → Selbsttest-Aufgaben. Die Testsuite stellt sicher, dass jede Goldfrage
 * mindestens eine Aufgabe besitzt und jede Option entweder richtig oder ein
 * klassifizierter Fehler ist.
 */
export const QUESTION_SELF_CHECKS: Readonly<Record<string, readonly SelfCheckItem[]>> = {
  '01-proton-basic': MAGNETIC_BASIC,
  '02-electron-negative-charge': MAGNETIC_BASIC,
  '03-field-out-of-page': [LORENTZ_RULE, MAGNETIC_WORK],
  '04-radius-only': MAGNETIC_RADIUS,
  '05-period-only': MAGNETIC_RADIUS,
  '06-missing-charge-sign': [LORENTZ_RULE],
  '07-zero-field': [MAGNETIC_WORK],
  '08-parallel-velocity': [LORENTZ_RULE],
  '09-unit-conversion': MAGNETIC_RADIUS,
  '10-scientific-notation': MAGNETIC_RADIUS,

  'electric-01-perpendicular-deflection': PLATES,
  'electric-02-negative-parallel': [PLATE_MOTION, FIELD_WORK_ENERGY],
  'electric-03-point-charge-field': POINT,
  'electric-04-point-charge-force': POINT,
  'electric-05-point-charge-direction': POINT,
  'electric-06-dipole-midpoint-field': POINT_MULTI,
  'electric-07-like-charges-midpoint': POINT_MULTI,
  'electric-08-dipole-axis-field': POINT_MULTI,
  'electric-09-off-axis-field': POINT_MULTI,
  'electric-10-electron-deflection': PLATES,
  'electric-11-proton-deflection': PLATES,
  'electric-12-exit-velocity': PLATES,
  'electric-13-hit-plate-time': PLATES,
  'electric-14-deflection-direction': PLATES,
  'electric-15-field-reversed': PLATES,
  'electric-16-different-velocity': PLATES,
  'electric-17-different-charge': PLATES,
  'electric-18-plate-length-effect': PLATES,
  'electric-19-energy': [FIELD_WORK_ENERGY, PLATE_OUTSIDE],

  'mech-01-uniform-acceleration': [UNIFORM_ACCELERATION],
  'mech-02-projectile-horizontal': [PROJECTILE_HORIZONTAL, PROJECTILE_TIME],
  'mech-03-projectile-oblique': [PROJECTILE_HORIZONTAL, PROJECTILE_TIME],
  'mech-04-newton-second-law': [NEWTON_SECOND],
  'mech-05-incline-no-friction': [INCLINE_NORMAL, NEWTON_SECOND],
  'mech-06-unit-conversion': [UNIFORM_ACCELERATION],
  'mech-07-uniform-distance': [UNIFORM_LINEAR_MOTION],
  'mech-08-sound-propagation': [SOUND_MEDIUM_SPEED, UNIFORM_LINEAR_MOTION],
  'mech-09-echo-ranging': [ECHO_RANGING_HALF],
  'mech-10-netforce-friction': [NEWTON_SECOND],

  'comp-01-selector-balance': SELECTOR,
  'comp-02-selector-selected-velocity': SELECTOR,
  'comp-03-selector-too-fast': [SELECTOR_TOO_FAST, SELECTOR_CONDITION],
  'comp-04-selector-too-slow': [SELECTOR_TOO_FAST, SELECTOR_CONDITION],
  'comp-05-selector-electron': [SELECTOR_CONDITION, LORENTZ_RULE],
  'comp-06-selector-low-field': SELECTOR,
  'comp-07-selector-trajectory': SELECTOR,
  'comp-08-selector-missing-direction': [SELECTOR_CONDITION],
  'comp-09-spectrometer-radius': SPECTROMETER,
  'comp-10-spectrometer-charge-mass': SPECTROMETER,
  'comp-11-spectrometer-isotope': SPECTROMETER,
  'comp-12-spectrometer-period': [SPECTROMETER_SPEED, RADIUS_MASS],
  'comp-13-spectrometer-electron': [SPECTROMETER_SPEED, LORENTZ_RULE],
  'comp-14-spectrometer-selected-velocity': [SELECTOR_CONDITION, RADIUS_MASS],
  'comp-15-eb-crossed': CROSSED,
  'comp-16-eb-electron-trajectory': [CROSSED_NET_FORCE, LORENTZ_RULE],
  'comp-17-eb-energy': [FIELD_WORK_ENERGY, MAGNETIC_WORK],
  'comp-18-ebg-balance': THREE_FIELD,
  'comp-19-ebg-droplet': THREE_FIELD,
  'comp-20-ebg-heavy-particle': THREE_FIELD,
  'comp-21-cyclotron': [CROSSED_NET_FORCE],

  'circ-01-series-current': CIRCUIT_OHM,
  'circ-02-parallel-total-resistance': [SERIES_PARALLEL_RULE, OHMS_LAW],
  'circ-03-emf-internal': CIRCUIT_EMF,
  'circ-04-rheostat': [OHMS_LAW, TERMINAL_VOLTAGE_RULE],
  'circ-05-power': [POWER_RULE, OHMS_LAW],
  'circ-06-terminal-voltage': CIRCUIT_EMF,

  'opt-01-plane-mirror': [PLANE_MIRROR_IMAGE],
  'opt-02-convex-lens-beyond-2f': [CONVEX_LENS_REAL_IMAGE],
  'opt-03-convex-lens-between-f-and-2f': [CONVEX_LENS_BETWEEN_F_2F],
  'opt-04-convex-lens-within-f': [CONVEX_LENS_MAGNIFYING],
  'opt-05-concave-mirror-beyond-2f': [CONCAVE_MIRROR_REAL_IMAGE],
  'opt-06-convex-mirror': [CONVEX_MIRROR_IMAGE],

  'ind-01-bar-motion-emf': [INDUCTION_BAR_EMF, INDUCTION_NO_CUT],
  'ind-02-bar-motion-lenz': [INDUCTION_LENZ, INDUCTION_BAR_EMF],
  'ind-03-flux-change-emf': [INDUCTION_FARADAY, INDUCTION_LENZ],
  'ind-04-flux-change-lenz': [INDUCTION_LENZ, INDUCTION_FARADAY],
  'ind-05-bar-zero-velocity': [INDUCTION_NO_CUT, INDUCTION_BAR_EMF],
  'ind-06-missing-resistance': [INDUCTION_BAR_EMF],

  /* ------------------------------------------------------------------- Welle -- */
  'wave-01-speed-from-wavelength-frequency': [WAVE_SPEED_FREQUENCY, WAVE_PARTICLE_TRANSPORT],
  'wave-02-wavelength-from-speed': [WAVE_SPEED_FREQUENCY],
  'wave-03-interference-constructive': [WAVE_PATH_DIFFERENCE, WAVE_DESTRUCTIVE_HALF],
  'wave-04-interference-destructive': [WAVE_DESTRUCTIVE_HALF, WAVE_PATH_DIFFERENCE],
  'wave-05-standing-third-harmonic': [WAVE_HARMONIC_FREQUENCY, WAVE_NODE_MOTION],
  'wave-06-missing-frequency': [WAVE_SPEED_FREQUENCY],
  'wave-07-longitudinal': [WAVE_LONGITUDINAL_DIRECTION, WAVE_SPEED_FREQUENCY],
  'wave-08-reflection-refraction': [WAVE_BOUNDARY_RULE],
  'wave-09-single-slit-diffraction': [WAVE_DIFFRACTION_MINIMUM],
  'wave-10-doppler': [WAVE_DOPPLER_SIGN],
}

/** Selbsttest-Aufgaben zu einer Frage, [] wenn keine definiert sind. */
export const selfChecksOfQuestion = (questionId: string): readonly SelfCheckItem[] =>
  QUESTION_SELF_CHECKS[questionId] ?? []
