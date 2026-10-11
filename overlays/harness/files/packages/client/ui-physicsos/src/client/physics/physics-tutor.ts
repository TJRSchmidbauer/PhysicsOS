/**
 * Tutor Mode scripts — a physics teacher, not a chat box.
 *
 * A tutor lesson is a structured ladder over the CURRENT frame:
 *   Beobachtung (facts the runtime already published) → Leitfrage → Hinweis 1..n → Antwort.
 * The student reveals one rung at a time; each rung may highlight the canvas
 * primitive it talks about, and the answer cites the Verifier checks by name.
 *
 * Every number in a lesson is read from {@link PhysicsAgentContext} — the same
 * already-verified view the Q&A agent uses. When a fact is absent the lesson
 * says less instead of inventing it; no rung ever computes physics.
 */

import type { PhysicsAgentContext } from './physics-agent.ts'
import { circuitTopicOf, mechanicsTopicOf } from './experiment-self-checks.ts'

/** One revealable rung of the ladder. */
export interface TutorStage {
  readonly id: string
  /** Rung heading, e.g. Hinweis 1. */
  readonly title: string
  readonly paragraphs: readonly string[]
  /** Highlight targets (agent alias ids) applied when this rung is revealed. */
  readonly highlights?: readonly string[]
}

/** Verifier citations attached to the answer rung. */
export interface TutorEvidence {
  readonly label: string
  readonly status: 'passed' | 'failed' | 'warning'
}

/**
 * The tutor script shape used by the physics tutor module.
 */
export interface TutorScript {
  readonly id: string
  /** Lesson topic shown as the card heading. */
  readonly topic: string
  /** Beobachtung: current-frame facts, one line each. */
  readonly observation: readonly string[]
  /** The guiding question the ladder answers. */
  readonly question: string
  readonly hints: readonly TutorStage[]
  readonly answer: TutorStage
  readonly evidence: readonly TutorEvidence[]
}

/* ------------------------------------------------------------------ helpers -- */

const derivedText = (
  context: PhysicsAgentContext,
  label: string,
): string | undefined => {
  const row = context.derived.find(entry => entry.label === label)
  if (row === undefined) return undefined
  return `${row.value} ${row.unit}`.trim()
}

const checkOf = (
  context: PhysicsAgentContext,
  id: string,
): TutorEvidence | undefined => {
  const check = context.verification.find(entry => entry.id === id)
  return check === undefined ? undefined : { label: check.label, status: check.status }
}

const observeLine = (name: string, value: string | undefined): string[] =>
  value === undefined ? [] : [`${name}: ${value}`]

const evidenceOf = (
  context: PhysicsAgentContext,
  ids: readonly string[],
): TutorEvidence[] =>
  ids.flatMap((id) => {
    const check = checkOf(context, id)
    return check === undefined ? [] : [check]
  })

/**
 * Evidence for per-target check families: the circuit engine stamps one
 * `terminal_voltage_law:<sourceId>` check per source, so a lesson cites the
 * family by prefix instead of hard-coding a component id.
 */
const evidenceOfPrefix = (
  context: PhysicsAgentContext,
  prefix: string,
): TutorEvidence[] =>
  context.verification
    .filter(check => check.id === prefix || check.id.startsWith(`${prefix}:`))
    .map(check => ({ label: check.label, status: check.status }))

/* ------------------------------------------------------------------ lessons -- */

const velocitySelectorLesson = (context: PhysicsAgentContext): TutorScript => {
  const selection = checkOf(context, 'velocity_selection_condition')
  const balanced = selection?.status === 'passed'
  const electric = derivedText(context, 'Betrag der elektrischen Feldkraft')
  const magnetic = derivedText(context, 'Betrag der Lorentzkraft')
  const net = derivedText(context, 'Betrag der resultierenden Kraft')
  const selected = derivedText(context, 'Auswahlgeschwindigkeit')
  const speed = derivedText(context, 'Geschwindigkeitsbetrag')
  return {
    id: balanced ? 'selector-balanced' : 'selector-deflecting',
    topic: 'Geschwindigkeitswähler',
    observation: [
      ...observeLine('Aktueller Geschwindigkeitsbetrag', speed),
      ...observeLine('Auswahlgeschwindigkeit des Aufbaus E/B', selected),
      ...observeLine('Elektrische Feldkraft |F_E|', electric),
      ...observeLine('Lorentzkraft |F_B|', magnetic),
      ...observeLine('Resultierende Kraft |ΣF|', net),
    ],
    question: balanced ? 'Warum wird dieses Teilchen nicht abgelenkt?' : 'Warum wird dieses Teilchen abgelenkt?',
    hints: [
      {
        id: 'hint-electric',
        title: 'Hinweis 1',
        paragraphs: ['Betrachte zuerst die elektrische Feldkraft: Ist die Richtung von E festgelegt, so ist auch die Richtung von F_E = qE bestimmt; sie hängt nicht von der Geschwindigkeit ab.'],
        highlights: ['electric-force'],
      },
      {
        id: 'hint-magnetic',
        title: 'Hinweis 2',
        paragraphs: ['Betrachte nun die Lorentzkraft: Bestimme die Richtung von qv×B mit der Linke-Hand-Regel. Ist sie der elektrischen Feldkraft entgegengesetzt?'],
        highlights: ['magnetic-force'],
      },
      {
        id: 'hint-compare',
        title: 'Hinweis 3',
        paragraphs: [
          'Vergleiche die Beträge der beiden Kräfte: |F_E| = qE ist fest, |F_B| = qvB ändert sich mit der Geschwindigkeit. Überlege, was geschieht, wenn v gleich, größer oder kleiner als E/B ist.',
        ],
        highlights: ['electric-force', 'magnetic-force'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: balanced
        ? [
          'Die beiden Kräfte sind gleich groß und entgegengesetzt, die resultierende Kraft ist null, und das Teilchen durchläuft den Bereich geradlinig und gleichförmig — die Geschwindigkeit erfüllt gerade v = E/B.',
          [electric === undefined ? '' : `|F_E| = ${electric}`, magnetic === undefined ? '' : `|F_B| = ${magnetic}`, net === undefined ? '' : `|ΣF| = ${net}`]
            .filter(entry => entry.length > 0)
            .join('; '),
        ].filter(entry => entry.length > 0)
        : [
          'Die aktuelle Geschwindigkeit ist nicht gleich E/B: |F_B| = qvB und |F_E| = qE sind nicht gleich groß, die resultierende Kraft ist nicht null, und das Teilchen wird zur Seite der überwiegenden Kraft abgelenkt.',
          [electric === undefined ? '' : `|F_E| = ${electric}`, magnetic === undefined ? '' : `|F_B| = ${magnetic}`, net === undefined ? '' : `|ΣF| = ${net}`]
            .filter(entry => entry.length > 0)
            .join('; '),
          selected === undefined ? '' : `Nur Teilchen mit einer Geschwindigkeit von genau ${selected} können geradlinig passieren.`,
        ].filter(entry => entry.length > 0),
      highlights: ['electric-force', 'magnetic-force', 'net-force'],
    },
    evidence: evidenceOf(context, [
      'velocity_selection_condition',
      'electric_force_magnitude_consistent',
      'magnetic_force_magnitude_consistent',
    ]),
  }
}

const spectrometerLesson = (context: PhysicsAgentContext): TutorScript => {
  const radius = derivedText(context, 'Kreisbahnradius')
  const period = derivedText(context, 'Umlaufperiode')
  const selected = derivedText(context, 'Auswahlgeschwindigkeit')
  return {
    id: 'spectrometer-arc',
    topic: 'Massenspektrometer',
    observation: [
      ...observeLine('Auswahlgeschwindigkeit E/B', selected),
      ...observeLine('Magnetischer Ablenkradius r', radius),
      ...observeLine('Umlaufperiode T', period),
    ],
    question: 'Warum bewegt sich das Ion nach dem Eintritt in den magnetischen Ablenkbereich auf einer gleichförmigen Kreisbahn?',
    hints: [
      {
        id: 'hint-region',
        title: 'Hinweis 1',
        paragraphs: ['Im Ablenkbereich gibt es nur ein Magnetfeld. Stelle zuerst fest, welche Kräfte auf das Teilchen in diesem Bereich wirken.'],
        highlights: ['magnetic-region'],
      },
      {
        id: 'hint-perpendicular',
        title: 'Hinweis 2',
        paragraphs: ['Die Lorentzkraft steht stets senkrecht zur Geschwindigkeit. Kann eine senkrecht zur Geschwindigkeit stehende Kraft den Betrag der Geschwindigkeit ändern?'],
        highlights: ['magnetic-force'],
      },
      {
        id: 'hint-centripetal',
        title: 'Hinweis 3',
        paragraphs: ['Eine Kraft mit konstantem Betrag, deren Richtung stets zu einer Seite zeigt, ist genau die Zentripetalkraft: qvB = mv²/r, aufgelöst nach r = mv/(qB).'],
        highlights: ['trajectory'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Im Ablenkbereich liefert die Lorentzkraft die Zentripetalkraft und verrichtet keine Arbeit: Der Geschwindigkeitsbetrag bleibt konstant, die Richtung dreht sich gleichförmig, die Bahn ist ein Kreisbogen.',
        radius === undefined ? '' : `Der Ablenkradius des aktuellen Aufbaus beträgt r = ${radius} und ergibt sich aus r = mv/(qB) (Wert aus der abgeleiteten Größe der Engine).`,
      ].filter(entry => entry.length > 0),
      highlights: ['magnetic-force', 'trajectory'],
    },
    evidence: evidenceOf(context, [
      'magnetic_force_does_no_work',
      'speed_conserved_in_pure_magnetic',
      'magnetic_deflection_radius_defined',
    ]),
  }
}

const threeFieldLesson = (context: PhysicsAgentContext): TutorScript => {
  const gravity = derivedText(context, 'Betrag der Schwerkraft')
  const electric = derivedText(context, 'Betrag der elektrischen Feldkraft')
  const magnetic = derivedText(context, 'Betrag der Lorentzkraft')
  const net = derivedText(context, 'Betrag der resultierenden Kraft')
  return {
    id: 'three-field-net',
    topic: 'Elektrisches Feld + Magnetfeld + Schwerkraft',
    observation: [
      ...observeLine('Elektrische Feldkraft |F_E|', electric),
      ...observeLine('Lorentzkraft |F_B|', magnetic),
      ...observeLine('Schwerkraft |mg|', gravity),
      ...observeLine('Resultierende Kraft |ΣF|', net),
    ],
    question: 'Wie wird die Bewegung des Teilchens bestimmt, wenn drei Felder gleichzeitig vorhanden sind?',
    hints: [
      {
        id: 'hint-list',
        title: 'Hinweis 1',
        paragraphs: ['Liste zuerst alle drei Kräfte auf: qE, qv×B, mg. Lässt man eine davon weg, erhält man eine falsche Bahn.'],
        highlights: ['electric-force', 'magnetic-force', 'gravity-force'],
      },
      {
        id: 'hint-scale',
        title: 'Hinweis 2',
        paragraphs: ['Vergleiche die Größenordnungen: Betrachte die Beträge der drei Kräfte oben — welche ist viel kleiner als die anderen beiden? Bei mikroskopischen Teilchen darf die Schwerkraft meist vernachlässigt werden, aber erst vergleichen, dann entscheiden.'],
      },
      {
        id: 'hint-sum',
        title: 'Hinweis 3',
        paragraphs: ['Die resultierende Kraft ist die Vektorsumme ΣF = qE + qv×B + mg; mit ΣF = ma wird dann die Beschleunigung bestimmt.'],
        highlights: ['net-force'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Die Engine setzt die drei Kräfte Bild für Bild gemäß ΣF = qE + qv×B + mg zusammen; in dieser Szene ist die Schwerkraft um einige Größenordnungen kleiner als die elektromagnetischen Kräfte, sodass die resultierende Kraft nahezu der Differenz der elektromagnetischen Kräfte entspricht.',
        [electric === undefined ? '' : `|F_E| = ${electric}`, magnetic === undefined ? '' : `|F_B| = ${magnetic}`, gravity === undefined ? '' : `|mg| = ${gravity}`, net === undefined ? '' : `|ΣF| = ${net}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['net-force'],
    },
    evidence: evidenceOf(context, ['composite_force_superposition', 'energy_consistency']),
  }
}

const crossedFieldLesson = (context: PhysicsAgentContext): TutorScript => {
  const electric = derivedText(context, 'Betrag der elektrischen Feldkraft')
  const magnetic = derivedText(context, 'Betrag der Lorentzkraft')
  const net = derivedText(context, 'Betrag der resultierenden Kraft')
  return {
    id: 'crossed-field-net',
    topic: 'Kombiniertes Feld E + B',
    observation: [
      ...observeLine('Elektrische Feldkraft |F_E|', electric),
      ...observeLine('Lorentzkraft |F_B|', magnetic),
      ...observeLine('Resultierende Kraft |ΣF|', net),
    ],
    question: 'Wie bewegt sich das Teilchen, wenn ein elektrisches und ein magnetisches Feld senkrecht zueinander gleichzeitig wirken?',
    hints: [
      {
        id: 'hint-electric',
        title: 'Hinweis 1',
        paragraphs: ['Die Richtung der elektrischen Feldkraft qE wird von E und dem Vorzeichen der Ladung bestimmt; ihr Betrag hängt nicht von der Geschwindigkeit ab.'],
        highlights: ['electric-force'],
      },
      {
        id: 'hint-magnetic',
        title: 'Hinweis 2',
        paragraphs: ['Die Lorentzkraft qv×B ändert mit der Geschwindigkeit ständig Richtung und Betrag — das ist der Grund für die Krümmung der Bahn.'],
        highlights: ['magnetic-force'],
      },
      {
        id: 'hint-balance',
        title: 'Hinweis 3',
        paragraphs: ['Frage dich: Unter welcher Bedingung heben sich die beiden Kräfte gerade auf? Das ist der Arbeitspunkt des Geschwindigkeitswählers v = E/B.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Die resultierende Kraft ΣF = qE + qv×B ändert sich Bild für Bild: Bei v = E/B heben sich beide Kräfte auf und die Bahn ist gerade; weicht die Geschwindigkeit davon ab, krümmt sich die Bahn.',
        [electric === undefined ? '' : `|F_E| = ${electric}`, magnetic === undefined ? '' : `|F_B| = ${magnetic}`, net === undefined ? '' : `|ΣF| = ${net}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['electric-force', 'magnetic-force', 'net-force'],
    },
    evidence: evidenceOf(context, ['composite_force_superposition', 'magnetic_force_does_no_work']),
  }
}

const magneticLesson = (context: PhysicsAgentContext): TutorScript => {
  const radius = derivedText(context, 'Bahnradius R')
  const period = derivedText(context, 'Periodendauer T')
  const force = derivedText(context, 'Lorentzkraft F')
  return {
    id: 'magnetic-circular',
    topic: 'Kreisbewegung im Magnetfeld',
    observation: [
      ...observeLine('Lorentzkraft F', force),
      ...observeLine('Bahnradius R', radius),
      ...observeLine('Periodendauer T', period),
    ],
    question: 'Warum bewegt sich ein geladenes Teilchen in einem homogenen Magnetfeld auf einer gleichförmigen Kreisbahn?',
    hints: [
      {
        id: 'hint-direction',
        title: 'Hinweis 1',
        paragraphs: ['Bestimme die Richtung der Lorentzkraft mit der Linke-Hand-Regel: Sie steht stets senkrecht zur Geschwindigkeit.'],
        highlights: ['force'],
      },
      {
        id: 'hint-no-work',
        title: 'Hinweis 2',
        paragraphs: ['Eine senkrecht zur Geschwindigkeit stehende Kraft verrichtet keine Arbeit. Ändert sich der Geschwindigkeitsbetrag des Teilchens?'],
      },
      {
        id: 'hint-radius',
        title: 'Hinweis 3',
        paragraphs: ['Eine Kraft mit konstantem Betrag, deren Richtung stets zum Kreismittelpunkt zeigt, ist die Zentripetalkraft: qvB = mv²/r.'],
        highlights: ['radius'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Die Lorentzkraft wirkt als Zentripetalkraft und verrichtet keine Arbeit; der Geschwindigkeitsbetrag bleibt konstant, die Richtung dreht sich gleichförmig — eine gleichförmige Kreisbewegung. Der Radius r = mv/(qB) und die Periodendauer T = 2πm/(qB) hängen nicht von der Geschwindigkeit ab.',
        [radius === undefined ? '' : `R = ${radius}`, period === undefined ? '' : `T = ${period}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['trajectory', 'radius'],
    },
    evidence: context.verification
      .filter(check => /keine Arbeit|Periodendauer|Radius|Kreis/.test(check.label))
      .map(check => ({ label: check.label, status: check.status })),
  }
}

const projectileLesson = (context: PhysicsAgentContext): TutorScript => {
  const range = derivedText(context, 'Waagerechte Wurfweite R')
  const flight = derivedText(context, 'Flugzeit t')
  return {
    id: 'projectile-decomposition',
    topic: 'Waagerechter Wurf',
    observation: [
      ...observeLine('Waagerechte Wurfweite R', range),
      ...observeLine('Flugzeit t', flight),
    ],
    question: 'Warum lässt sich der waagerechte Wurf in zwei unabhängige geradlinige Bewegungen zerlegen?',
    hints: [
      {
        id: 'hint-horizontal',
        title: 'Hinweis 1',
        paragraphs: ['Wirkt in horizontaler Richtung eine Kraft? Ohne Kraft bleibt die Geschwindigkeitskomponente konstant.'],
        highlights: ['horizontal-velocity'],
      },
      {
        id: 'hint-vertical',
        title: 'Hinweis 2',
        paragraphs: ['In vertikaler Richtung wirkt nur die Schwerkraft: eine gleichmäßig beschleunigte Bewegung aus der Ruhe heraus, also ein freier Fall.'],
        highlights: ['gravity'],
      },
      {
        id: 'hint-time',
        title: 'Hinweis 3',
        paragraphs: ['Beide Teilbewegungen verwenden dieselbe Zeit t. Von welcher Teilbewegung hängt die Fallzeit ab?'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Horizontal gleichförmig x = v₀t, vertikal freier Fall h = ½gt²; t = √(2h/g) wird von der Höhe bestimmt, die Wurfweite ist R = v₀·t.',
        [range === undefined ? '' : `R = ${range}`, flight === undefined ? '' : `t = ${flight}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['trajectory'],
    },
    evidence: context.verification
      .filter(check => /Bahn|Verschiebung|Bewegung|Energie/.test(check.label))
      .slice(0, 3)
      .map(check => ({ label: check.label, status: check.status })),
  }
}

const inclineLesson = (context: PhysicsAgentContext): TutorScript => {
  const normal = derivedText(context, 'Normalkraft N')
  const acceleration = derivedText(context, 'Beschleunigung entlang der schiefen Ebene a')
  return {
    id: 'incline-decomposition',
    topic: 'Kraftanalyse auf der schiefen Ebene',
    observation: [
      ...observeLine('Normalkraft N', normal),
      ...observeLine('Beschleunigung entlang der schiefen Ebene a', acceleration),
    ],
    question: 'Warum zerlegt man die Schwerkraft in eine Komponente entlang der schiefen Ebene und eine senkrecht dazu?',
    hints: [
      {
        id: 'hint-forces',
        title: 'Hinweis 1',
        paragraphs: ['Zeichne zuerst alle Kräfte: die Schwerkraft mg senkrecht nach unten und die Normalkraft N senkrecht zur schiefen Ebene.'],
        highlights: ['gravity', 'normal-force'],
      },
      {
        id: 'hint-axes',
        title: 'Hinweis 2',
        paragraphs: ['Der Körper kann sich nur entlang der schiefen Ebene bewegen; legt man die Koordinatenachsen entlang und senkrecht zur Ebene, werden die Bewegungsgleichungen am einfachsten.'],
      },
      {
        id: 'hint-components',
        title: 'Hinweis 3',
        paragraphs: ['Zerlege die Schwerkraft: Die Komponente entlang der Ebene mg·sinθ treibt das Gleiten an, die senkrechte Komponente mg·cosθ hält der Normalkraft das Gleichgewicht.'],
        highlights: ['gravity-parallel', 'gravity-normal'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'In senkrechter Richtung herrscht Gleichgewicht N = mg·cosθ, in Richtung der Ebene erzeugt mg·sinθ (abzüglich der Reibungskraft) die Beschleunigung — das ist der Sinn der Zerlegung.',
        [normal === undefined ? '' : `N = ${normal}`, acceleration === undefined ? '' : `a = ${acceleration}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['net-force'],
    },
    evidence: context.verification
      .slice(0, 3)
      .map(check => ({ label: check.label, status: check.status })),
  }
}

const electricLesson = (context: PhysicsAgentContext): TutorScript => {
  const field = derivedText(context, 'Elektrische Feldstärke E') ?? derivedText(context, 'Feldstärke E')
  const force = derivedText(context, 'Elektrische Feldkraft F')
  return {
    id: 'electric-force-direction',
    topic: 'Elektrisches Feld und elektrische Feldkraft',
    observation: [
      ...observeLine('Elektrische Feldstärke E', field),
      ...observeLine('Elektrische Feldkraft F', force),
    ],
    question: 'Wie erhält man aus der Richtung des elektrischen Feldes die Kraftrichtung auf das Teilchen?',
    hints: [
      {
        id: 'hint-field',
        title: 'Hinweis 1',
        paragraphs: ['Die Feldrichtung ist eine Eigenschaft des Feldes selbst: Das Feld einer positiven Ladung zeigt radial nach außen, und in einem homogenen Feld ist die Richtung überall gleich.'],
        highlights: ['electric-field'],
      },
      {
        id: 'hint-sign',
        title: 'Hinweis 2',
        paragraphs: ['F = qE: Bei positiver Ladung zeigt die Kraft in Richtung von E, bei negativer entgegen E. Das Vorzeichen der Ladung entscheidet.'],
        highlights: ['electric-force'],
      },
      {
        id: 'hint-motion',
        title: 'Hinweis 3',
        paragraphs: ['Bei konstanter Kraftrichtung führt ein senkrecht eintretendes Teilchen eine wurfähnliche Bewegung aus — strukturgleich zum waagerechten Wurf im Schwerefeld.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Kraftrichtung = Ladungsvorzeichen × Feldrichtung; die konstante elektrische Feldkraft erzeugt eine konstante Beschleunigung a = qE/m, und die Bahn wird von der Anfangsgeschwindigkeit und der Feldrichtung gemeinsam bestimmt.',
        [field === undefined ? '' : `E = ${field}`, force === undefined ? '' : `F = ${force}`]
          .filter(entry => entry.length > 0)
          .join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['electric-force'],
    },
    evidence: context.verification
      .slice(0, 3)
      .map(check => ({ label: check.label, status: check.status })),
  }
}

const averageSpeedLesson = (context: PhysicsAgentContext): TutorScript => {
  const displacement = derivedText(context, 'Verschiebung')
  const finalSpeed = derivedText(context, 'Endgeschwindigkeit')
  const acceleration = derivedText(context, 'Beschleunigung')
  return {
    id: 'mechanics-average-speed',
    topic: 'Durchschnittsgeschwindigkeit messen',
    observation: [
      ...observeLine('Verschiebung s', displacement),
      ...observeLine('Endgeschwindigkeit v', finalSpeed),
      ...observeLine('Beschleunigung a', acceleration),
    ],
    question: 'Wie misst man die Durchschnittsgeschwindigkeit des Wagens auf diesem Abschnitt?',
    hints: [
      {
        id: 'hint-define',
        title: 'Hinweis 1',
        paragraphs: ['Die Durchschnittsgeschwindigkeit beschreibt die mittlere Schnelligkeit über den gesamten Abschnitt: v̄ = s/t; dazu braucht man nur die Gesamtstrecke und die Gesamtzeit, keine Momentangeschwindigkeit zu einem bestimmten Zeitpunkt.'],
        highlights: ['trajectory'],
      },
      {
        id: 'hint-measure',
        title: 'Hinweis 2',
        paragraphs: ['Miss mit dem Lineal die Strecke s auf der schiefen Ebene und stoppe mit der Stoppuhr die Fahrzeit t — spiele die Bewegung einmal ab, dann ist die Zeitachse deine Stoppuhr.'],
      },
      {
        id: 'hint-segments',
        title: 'Hinweis 3',
        paragraphs: ['Miss anschließend abschnittsweise: Stoppe die erste und die zweite Hälfte getrennt. Der Wagen beschleunigt bergab — bei gleicher Strecke, welcher Abschnitt braucht weniger Zeit?'],
        highlights: ['velocity'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Teile die gemessene Strecke durch die zugehörige Zeit: v̄ = s/t. Der Wagen beschleunigt bergab, die zweite Hälfte braucht weniger Zeit, ihre Durchschnittsgeschwindigkeit ist größer als die der ersten Hälfte; die Durchschnittsgeschwindigkeit über die gesamte Strecke liegt zwischen beiden, während die Endgeschwindigkeit ein Momentanwert und damit größer als die Durchschnittsgeschwindigkeit über die Gesamtstrecke ist.',
        [
          displacement === undefined ? '' : `s = ${displacement}`,
          finalSpeed === undefined ? '' : `Endgeschwindigkeit v = ${finalSpeed}`,
          acceleration === undefined ? '' : `a = ${acceleration}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['trajectory'],
    },
    /* The uniformly-accelerated engine stamps exactly this physical check. */
    evidence: evidenceOf(context, ['velocity_change']),
  }
}

const leverBalanceLesson = (context: PhysicsAgentContext): TutorScript => {
  const leftMoment = derivedText(context, 'Linkes Drehmoment M₁')
  const rightMoment = derivedText(context, 'Rechtes Drehmoment M₂')
  const leftWeight = derivedText(context, 'Linke Gewichtskraft G₁')
  const rightWeight = derivedText(context, 'Rechte Gewichtskraft G₂')
  const ratio = derivedText(context, 'Drehmomentverhältnis M₁/M₂')
  const judgement = derivedText(context, 'Gleichgewichtsbeurteilung') ?? ''
  const balanced = judgement.includes('Hebel im Gleichgewicht')
  return {
    id: 'mechanics-lever',
    topic: 'Gleichgewichtsbedingungen des Hebels untersuchen',
    observation: [
      ...observeLine('Linkes Drehmoment M₁', leftMoment),
      ...observeLine('Rechtes Drehmoment M₂', rightMoment),
      ...observeLine('Drehmomentverhältnis M₁/M₂', ratio),
    ],
    question: balanced
      ? 'Warum können 200 g bei 15 cm mit 300 g bei 10 cm im Gleichgewicht sein?'
      : 'Der Hebel neigt sich zu einer Seite. Wie müssen Hebelarm oder Masse geändert werden, damit wieder Gleichgewicht herrscht?',
    hints: [
      {
        id: 'hint-weight',
        title: 'Hinweis 1',
        paragraphs: ['Die Kraft jedes Gewichtsstücks ist seine Gewichtskraft G = mg, nicht etwa so, dass eine größere Masse automatisch einen längeren Hebelarm ergibt. Ändert sich die Masse, ändert sich die Kraft.'],
        highlights: ['hanger-left', 'hanger-right'],
      },
      {
        id: 'hint-moment',
        title: 'Hinweis 2',
        paragraphs: ['Das Drehmoment ist die Größe, die den Hebel dreht: M = F·l. Der Hebelarm ist der senkrechte Abstand vom Drehpunkt zur Wirkungslinie der Kraft; schiebt man das Gewichtsstück nach außen, bleibt die Kraft gleich, das Drehmoment wird größer.'],
        highlights: ['arm-left', 'arm-right'],
      },
      {
        id: 'hint-balance',
        title: 'Hinweis 3',
        paragraphs: ['Die Gleichgewichtsbedingung des Hebels erster Art ist die Gleichheit der Drehmomente auf beiden Seiten: F₁l₁ = F₂l₂. Verdoppelt sich die Kraft auf einer Seite, muss der Hebelarm dieser Seite halbiert werden, damit die Produkte übereinstimmen.'],
        highlights: ['lever-1'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        balanced
          ? 'G₁ = 1.96 N, l₁ = 15 cm, M₁ = 29.4 N·cm; G₂ = 2.94 N, l₂ = 10 cm, M₂ = 29.4 N·cm. Kräfte und Hebelarme sind verschieden, die Drehmomente aber gleich, deshalb steht der Hebel waagerecht.'
          : 'Die Seite mit dem größeren M = F·l sinkt nach unten. Verkürze den Hebelarm der größeren Seite (oder erhöhe die Masse der kleineren Seite), bis F₁l₁ = F₂l₂ gilt und der Hebel wieder waagerecht steht.',
        [
          leftWeight === undefined ? '' : `G₁ = ${leftWeight}`,
          rightWeight === undefined ? '' : `G₂ = ${rightWeight}`,
          leftMoment === undefined ? '' : `M₁ = ${leftMoment}`,
          rightMoment === undefined ? '' : `M₂ = ${rightMoment}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['hanger-left', 'hanger-right'],
    },
    evidence: evidenceOf(context, ['weight_from_mass', 'moment_from_force', 'moment_balance']),
  }
}

const forceMotionLesson = (context: PhysicsAgentContext): TutorScript => ({
  id: 'force-and-motion',
  topic: 'Kraft und Bewegung',
  observation: context.derived
    .slice(0, 3)
    .map(row => `${row.label}: ${row.value} ${row.unit}`.trim()),
  question: 'Wie erhält man aus den wirkenden Kräften die Bewegung des Körpers?',
  hints: [
    {
      id: 'hint-forces',
      title: 'Hinweis 1',
      paragraphs: ['Führe zuerst eine vollständige Kraftanalyse durch und zeichne jede einzelne Kraft ein.'],
    },
    {
      id: 'hint-net',
      title: 'Hinweis 2',
      paragraphs: ['Bilde die resultierende Kraft: Ist sie null, bleibt die Geschwindigkeit konstant (Ruhe oder gleichförmige geradlinige Bewegung); ist sie konstant, ist die Bewegung gleichmäßig beschleunigt.'],
    },
    {
      id: 'hint-newton',
      title: 'Hinweis 3',
      paragraphs: ['Übersetze die resultierende Kraft mit F = ma in eine Beschleunigung und beschreibe dann mit den kinematischen Formeln, wie sich der Ort mit der Zeit ändert.'],
    },
  ],
  answer: {
    id: 'answer',
    title: 'Antwort',
    paragraphs: [
      'Kräfte → resultierende Kraft → Beschleunigung → Bewegung: Das ist der allgemeine Weg bei Mechanikaufgaben. Die Zahlenwerte dieser Szene stammen alle aus den abgeleiteten Größen der Engine.',
    ],
    highlights: ['trajectory'],
  },
  evidence: context.verification
    .slice(0, 3)
    .map(check => ({ label: check.label, status: check.status })),
})

/* ----------------------------------------------------------------- circuit -- */

const circuitSeriesLesson = (context: PhysicsAgentContext): TutorScript => {
  const emf = derivedText(context, 'EMK E')
  const current = derivedText(context, 'Hauptstrom I')
  const terminal = derivedText(context, 'Klemmenspannung U')
  const external = derivedText(context, 'Ersatzwiderstand des Außenkreises')
  return {
    id: 'circuit-series-loop',
    topic: 'Reihenschaltung',
    observation: [
      ...observeLine('EMK E', emf),
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Klemmenspannung U', terminal),
      ...observeLine('Ersatzwiderstand des Außenkreises', external),
    ],
    question: 'Wovon wird der Strom im Reihenstromkreis bestimmt?',
    hints: [
      {
        id: 'hint-loop',
        title: 'Hinweis 1',
        paragraphs: ['Betrachte zuerst das Amperemeter: Ein Reihenstromkreis hat nur einen Pfad, der Strom ist überall gleich, und was das Amperemeter anzeigt, ist der Hauptstrom.'],
        highlights: ['ammeter'],
      },
      {
        id: 'hint-resistance',
        title: 'Hinweis 2',
        paragraphs: ['Betrachte nun die Widerstände: Der Gesamtwiderstand in Reihe ist die Summe der Einzelwiderstände; je mehr Widerstände zugeschaltet sind, desto größer ist der Gesamtwiderstand.'],
        highlights: ['resistors'],
      },
      {
        id: 'hint-ohm',
        title: 'Hinweis 3',
        paragraphs: ['Verbinde beides mit dem Ohmschen Gesetz: I = U / R_Reihe. Bei fester Gesamtspannung bestimmt der Gesamtwiderstand den Strom.'],
        highlights: ['battery'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Der Hauptstrom wird durch I = U/R_Reihe bestimmt: In Reihe ist der Strom überall gleich, jeder Widerstand erhält nach U = IR seine Spannung, und deren Summe ist gleich der Gesamtspannung.',
        [
          emf === undefined ? '' : `E = ${emf}`,
          current === undefined ? '' : `I = ${current}`,
          external === undefined ? '' : `R_Reihe = ${external}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['ammeter', 'resistors'],
    },
    evidence: evidenceOf(context, ['kcl_current_conservation', 'power_balance']),
  }
}

const circuitParallelLesson = (context: PhysicsAgentContext): TutorScript => {
  const current = derivedText(context, 'Hauptstrom I')
  const terminal = derivedText(context, 'Klemmenspannung U')
  const external = derivedText(context, 'Ersatzwiderstand des Außenkreises')
  return {
    id: 'circuit-parallel-junction',
    topic: 'Parallel- und gemischte Schaltung',
    observation: [
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Klemmenspannung U', terminal),
      ...observeLine('Ersatzwiderstand des Außenkreises', external),
    ],
    question: 'Wie verteilt sich der Strom am Knotenpunkt?',
    hints: [
      {
        id: 'hint-junction',
        title: 'Hinweis 1',
        paragraphs: ['Betrachte zuerst den Knotenpunkt (den Punkt im Schaltplan): Hier teilt sich der Hauptstrom in mehrere Zweige, und der zufließende Strom muss gleich der Summe der abfließenden Ströme sein.'],
        highlights: ['ammeter'],
      },
      {
        id: 'hint-voltage',
        title: 'Hinweis 2',
        paragraphs: ['Die Zweige einer Parallelschaltung liegen an demselben Knotenpaar, ihre Spannung ist gleich; der Strom jedes Zweigs ist I = U/R, und der Zweig mit dem kleineren Widerstand erhält mehr.'],
        highlights: ['voltmeter'],
      },
      {
        id: 'hint-equivalent',
        title: 'Hinweis 3',
        paragraphs: ['Der Ersatzwiderstand des parallelen Teils ist kleiner als jeder einzelne Zweig — ein zusätzlicher Zweig bedeutet einen zusätzlichen Pfad, und die Leitwerte addieren sich.'],
        highlights: ['resistors'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Die Ladungserhaltung am Knoten (Kirchhoffsches Stromgesetz): Der Hauptstrom ist gleich der Summe der Zweigströme; parallel geschaltete Zweige haben dieselbe Spannung, und der Strom verteilt sich nach den Leitwerten.',
        [
          current === undefined ? '' : `Hauptstrom I = ${current}`,
          external === undefined ? '' : `Ersatzaußenwiderstand = ${external}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['ammeter', 'resistors'],
    },
    evidence: evidenceOf(context, ['kcl_current_conservation', 'power_balance']),
  }
}

const circuitRheostatLesson = (context: PhysicsAgentContext): TutorScript => {
  const slider = derivedText(context, 'Zugeschalteter Widerstand R_Schieber')
  const current = derivedText(context, 'Hauptstrom I')
  const terminal = derivedText(context, 'Klemmenspannung U')
  return {
    id: 'circuit-rheostat-dynamic',
    topic: 'Dynamischer Stromkreis mit Schiebewiderstand',
    observation: [
      ...observeLine('Zugeschalteter Widerstand R_Schieber', slider),
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Klemmenspannung U', terminal),
    ],
    question: 'Warum ändern sich die Messwerte der Messgeräte gemeinsam, wenn der Schieber bewegt wird?',
    hints: [
      {
        id: 'hint-slider',
        title: 'Hinweis 1',
        paragraphs: ['Betrachte zuerst den Schiebewiderstand: Der zugeschaltete Widerstand ist R_Schieber = p·R_gesamt, die Schieberposition p bestimmt, wie viel Widerstand zugeschaltet ist.'],
        highlights: ['rheostat'],
      },
      {
        id: 'hint-current',
        title: 'Hinweis 2',
        paragraphs: ['Ändert sich der Gesamtwiderstand, ändert sich auch der Hauptstrom: I = U/(R₀ + R_Schieber). Wächst der zugeschaltete Widerstand, sinkt der Strom.'],
        highlights: ['ammeter'],
      },
      {
        id: 'hint-meter',
        title: 'Hinweis 3',
        paragraphs: ['Die Spannung am Festwiderstand U₀ = I·R₀ wächst und fällt mit dem Strom — der Messwert des Voltmeters ändert sich also zusammen mit dem Strom, nicht mit dem gerade verstellten Bauteil.'],
        highlights: ['voltmeter'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Eine Widerstandsänderung → Änderung des Gesamtwiderstands → Änderung des Hauptstroms → die Messwerte folgen gemeinsam. Mit Abspielen wird der Schieber von der aktuellen Position bis zur maximalen Zuschaltung gefahren; die I-t- und U-t-Kurven zeigen genau diese Kette.',
        [
          slider === undefined ? '' : `R_Schieber = ${slider}`,
          current === undefined ? '' : `I = ${current}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['rheostat', 'ammeter'],
    },
    evidence: evidenceOf(context, ['kcl_current_conservation', 'power_balance']),
  }
}

const circuitVaLesson = (context: PhysicsAgentContext): TutorScript => {
  const emf = derivedText(context, 'EMK E')
  const current = derivedText(context, 'Hauptstrom I')
  const slider = derivedText(context, 'Zugeschalteter Widerstand R_Schieber')
  return {
    id: 'circuit-va-resistance',
    topic: 'Widerstandsmessung nach der Strom-Spannungs-Methode',
    observation: [
      ...observeLine('Quellenspannung E', emf),
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Zugeschalteter Widerstand R_Schieber', slider),
    ],
    question: 'Wie bestimmt man mit nur einem Voltmeter und einem Amperemeter den zu messenden Widerstand Rx?',
    hints: [
      {
        id: 'hint-ammeter',
        title: 'Hinweis 1',
        paragraphs: ['Das Amperemeter liegt in Reihe im Stromkreis: In Reihe ist der Strom überall gleich, es zeigt also den Strom I an, der durch Rx fließt.'],
        highlights: ['ammeter'],
      },
      {
        id: 'hint-voltmeter',
        title: 'Hinweis 2',
        paragraphs: ['Das Voltmeter liegt parallel zu Rx und zeigt die an ihm anliegende Spannung U an. Ideale Messgeräte beeinflussen den Stromkreis nicht: Das Voltmeter entzieht keinen Strom, das Amperemeter verursacht keinen Spannungsabfall.'],
        highlights: ['voltmeter'],
      },
      {
        id: 'hint-slider',
        title: 'Hinweis 3',
        paragraphs: ['Aus einem Wertepaar lässt sich R = U/I berechnen, doch eine einzelne Messung hat einen großen zufälligen Fehler. Bewege den Schieber, um den Arbeitspunkt zu ändern, lies weitere Wertepaare (U, I) ab — und mittlere die erhaltenen R.'],
        highlights: ['rheostat'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Aus dem Ohmschen Gesetz umgestellt: Rx = U/I. Das Voltmeter zeigt U, das Amperemeter zeigt I, eine Division genügt. Der Schiebewiderstand ändert den Arbeitspunkt, und der Mittelwert mehrerer Messungen verkleinert den zufälligen Fehler — U und I wachsen und fallen gemeinsam, das Verhältnis bleibt konstant, weil der Widerstand eine Eigenschaft des Leiters selbst ist.',
        [
          emf === undefined ? '' : `E = ${emf}`,
          current === undefined ? '' : `I = ${current}`,
          slider === undefined ? '' : `R_Schieber = ${slider}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['voltmeter', 'ammeter'],
    },
    evidence: evidenceOf(context, [
      'ideal_meters_non_intrusive',
      'kcl_current_conservation',
      'power_balance',
    ]),
  }
}

const circuitBulbLesson = (context: PhysicsAgentContext): TutorScript => {
  const current = derivedText(context, 'Hauptstrom I')
  const slider = derivedText(context, 'Zugeschalteter Widerstand R_Schieber')
  const external = derivedText(context, 'Ausgangsleistung')
  return {
    id: 'circuit-bulb-power',
    topic: 'Elektrische Leistung einer kleinen Glühlampe messen',
    observation: [
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Zugeschalteter Widerstand R_Schieber', slider),
      ...observeLine('Ausgangsleistung', external),
    ],
    question: 'Wie bestimmt man die tatsächliche und die Nennleistung einer kleinen Glühlampe?',
    hints: [
      {
        id: 'hint-meters',
        title: 'Hinweis 1',
        paragraphs: ['Es sind keine neuen Geräte nötig: Das Voltmeter misst die Spannung U an der Lampe, das Amperemeter den Strom I durch sie — zwei Messgeräte genügen.'],
        highlights: ['voltmeter', 'ammeter'],
      },
      {
        id: 'hint-formula',
        title: 'Hinweis 2',
        paragraphs: ['Die Berechnungsformel der elektrischen Leistung lautet P = UI. Multipliziert man die beiden Messwerte, erhält man die momentan von der Lampe aufgenommene tatsächliche Leistung — sie ändert sich mit dem Arbeitspunkt und ist kein fester Wert.'],
      },
      {
        id: 'hint-rated',
        title: 'Hinweis 3',
        paragraphs: ['Bewege den Schieber, um den Arbeitspunkt der Lampe zu ändern: Nur wenn der Messwert des Voltmeters genau der Nennspannung entspricht, ergibt die Rechnung die Nennleistung; maßgeblich ist der Messwert des Voltmeters, nicht die Helligkeit.'],
        highlights: ['rheostat'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'P = UI gilt für jeden Arbeitspunkt: Das Produkt der Messwerte an einer beliebigen Schieberposition ist die tatsächliche Leistung an diesem Punkt; nur wenn die Spannung auf den Nennwert eingestellt wird, erhält man die Nennleistung. Unterhalb der Nennspannung leuchtet die Lampe schwächer und die Leistung ist kleiner; oberhalb der Nennspannung drohen Überlast und Zerstörung.',
        [
          current === undefined ? '' : `I = ${current}`,
          slider === undefined ? '' : `R_Schieber = ${slider}`,
          external === undefined ? '' : `Ausgangsleistung = ${external}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['voltmeter', 'rheostat'],
    },
    evidence: evidenceOf(context, ['power_balance', 'kcl_current_conservation']),
  }
}

const circuitEmfLesson = (context: PhysicsAgentContext): TutorScript => {
  const emf = derivedText(context, 'EMK E')
  const current = derivedText(context, 'Hauptstrom I')
  const terminal = derivedText(context, 'Klemmenspannung U')
  const internalPower = derivedText(context, 'Verlustleistung im Innenwiderstand')
  /* fmtQuantityValue renders sub-nanoamp solves as exactly '0' — an open
     switch, not a small current. The lesson flips between the open-circuit
     reading (U = E) and the loaded drop (U = E − I·r) on that fact. */
  const open = context.derived.find(row => row.label === 'Hauptstrom I')?.value === '0'
  return {
    id: open ? 'circuit-emf-open' : 'circuit-emf-internal',
    topic: 'EMK und Innenwiderstand',
    observation: [
      ...observeLine('EMK E', emf),
      ...observeLine('Hauptstrom I', current),
      ...observeLine('Klemmenspannung U', terminal),
      ...observeLine('Verlustleistung im Innenwiderstand', internalPower),
    ],
    question: open ? 'Warum zeigt das Voltmeter bei geöffnetem Stromkreis direkt die EMK an?' : 'Warum ist die Klemmenspannung kleiner als die EMK?',
    hints: [
      {
        id: 'hint-source',
        title: 'Hinweis 1',
        paragraphs: ['Eine Quelle ist kein Konstantspannungsgerät: Sie hat einen Innenwiderstand r, und die nach außen abgegebene Spannung ist nicht unbedingt gleich der EMK.'],
        highlights: ['battery'],
      },
      {
        id: 'hint-loop-law',
        title: 'Hinweis 2',
        paragraphs: ['Ohmsches Gesetz des geschlossenen Stromkreises: I = E/(R + r); Innen- und Außenwiderstand bestimmen gemeinsam den Strom.'],
        highlights: ['ammeter'],
      },
      {
        id: 'hint-terminal',
        title: 'Hinweis 3',
        paragraphs: ['Klemmenspannung U = E − I·r: Je größer der Strom, desto mehr Spannung fällt am Innenwiderstand ab. Bei Strom null fällt dort überhaupt nichts ab.'],
        highlights: ['voltmeter'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: open
        ? [
          'Bei geöffnetem Stromkreis ist I = 0, am Innenwiderstand fällt keine Spannung ab: U = E − 0·r = E, das Voltmeter zeigt direkt die EMK an — das ist die übliche Methode zur Messung von E.',
          [emf === undefined ? '' : `E = ${emf}`, terminal === undefined ? '' : `U = ${terminal}`]
            .filter(entry => entry.length > 0)
            .join('; '),
        ].filter(entry => entry.length > 0)
        : [
          'Am Innenwiderstand fällt I·r ab: U = E − I·r, und die Differenz wird als Leistung I²·r im Inneren der Quelle verbraucht (siehe Verlustleistung im Innenwiderstand). Bewegt man den Schieber und ändert I, so ändert sich U linear; der Achsenabschnitt dieser U-I-Geraden ist E, ihre Steigung ist −r.',
          [
            emf === undefined ? '' : `E = ${emf}`,
            terminal === undefined ? '' : `U = ${terminal}`,
            current === undefined ? '' : `I = ${current}`,
            internalPower === undefined ? '' : `P_innen = ${internalPower}`,
          ].filter(entry => entry.length > 0).join('; '),
        ].filter(entry => entry.length > 0),
      highlights: ['battery', 'voltmeter'],
    },
    evidence: [
      ...evidenceOfPrefix(context, 'terminal_voltage_law'),
      ...evidenceOf(context, ['power_balance']),
    ],
  }
}

/* ------------------------------------------------------------------- optics -- */

const planeMirrorLesson = (context: PhysicsAgentContext): TutorScript => {
  const objectDistance = derivedText(context, 'Gegenstandsabstand u')
  const imageDistance = derivedText(context, 'Bildabstand v')
  const nature = derivedText(context, 'Bildart')
  const screenNote = derivedText(context, 'Schirmnachweis')
  return {
    id: 'optics-plane-mirror',
    topic: 'Abbildung am ebenen Spiegel',
    observation: [
      ...observeLine('Abstand Gegenstand zur Spiegelfläche u', objectDistance),
      ...observeLine('Abstand Bild zur Spiegelfläche v', imageDistance),
      ...observeLine('Bildart', nature),
      ...observeLine('Schirmnachweis', screenNote),
    ],
    question: 'Der Schirm steht bereits an der Stelle des Bildes — warum lässt sich das Bild dennoch nicht auf dem Schirm auffangen?',
    hints: [
      {
        id: 'hint-reflection',
        title: 'Hinweis 1',
        paragraphs: ['Trifft Licht auf die Spiegelfläche, wird es reflektiert, wobei der Reflexionswinkel gleich dem Einfallswinkel ist. Ins Auge gelangt der reflektierte Strahl — öffne den Strahlengang der Hauptstrahlen, um zu sehen, wohin das reflektierte Licht läuft.'],
        highlights: ['mirror'],
      },
      {
        id: 'hint-extension',
        title: 'Hinweis 2',
        paragraphs: ['Verlängere jeden reflektierten Strahl hinter den Spiegel zurück (gestrichelte Linien in der Abbildung): Diese Verlängerungen schneiden sich in einem Punkt hinter dem Spiegel, und dessen Abstand zur Spiegelfläche ist genau gleich dem Gegenstandsabstand.'],
        highlights: ['image'],
      },
      {
        id: 'hint-virtual',
        title: 'Hinweis 3',
        paragraphs: ['Frage dich: Verläuft an jenem Schnittpunkt hinter dem Spiegel tatsächlich Licht? Ein Schirm kann nur wirklich gebündeltes Licht auffangen.'],
        highlights: ['screen'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Der ebene Spiegel erzeugt ein virtuelles Bild: Die reflektierten Strahlen selbst laufen nicht zusammen, nur ihre rückwärtigen Verlängerungen schneiden sich hinter dem Spiegel. Dort verläuft kein wirkliches Licht, deshalb lässt sich das Bild nicht auf einem Schirm auffangen; Bild und Gegenstand haben denselben Abstand zur Spiegelfläche, dieselbe Größe und stehen aufrecht.',
        [
          objectDistance === undefined ? '' : `u = ${objectDistance}`,
          imageDistance === undefined ? '' : `v = ${imageDistance}`,
          nature === undefined ? '' : nature,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['image', 'screen'],
    },
    evidence: evidenceOf(context, [
      'mirror_image_symmetry',
      'principal_rays_converge',
      'virtual_image_uncatchable',
    ]),
  }
}

/**
 * The five imaging zones of a convex lens, keyed by the Gegenstandsabstand-Bereich derived value
 * the optics runtime publishes. The answer sentences are the Abbildungsgesetz-Tabelle rows.
 */
const LENS_ZONES: Readonly<Record<string, { slug: string; answer: string }>> = {
  'u > 2f': {
    slug: 'beyond-2f',
    answer: 'Gegenstandsabstand größer als 2f: Es entsteht ein umgekehrtes, verkleinertes reelles Bild, der Bildabstand liegt zwischen f und 2f — der Arbeitsbereich einer Kamera.',
  },
  'u = 2f': {
    slug: 'at-2f',
    answer: 'Gegenstandsabstand gleich 2f: Es entsteht ein umgekehrtes, gleich großes reelles Bild, v = 2f — im Labor nutzt man diesen Punkt zur schnellen Brennweitenmessung.',
  },
  'f < u < 2f': {
    slug: 'between-f-2f',
    answer: 'Gegenstandsabstand zwischen f und 2f: Es entsteht ein umgekehrtes, vergrößertes reelles Bild, der Bildabstand v > 2f — der Arbeitsbereich eines Projektors.',
  },
  'u = f': {
    slug: 'at-f',
    answer: 'Gegenstandsabstand gleich f: Die gebrochenen Strahlen verlaufen parallel zueinander und schneiden sich nie — es entsteht kein Bild; das ist die Grenze zwischen reellem und virtuellem Bild.',
  },
  'u < f': {
    slug: 'within-f',
    answer: 'Gegenstandsabstand kleiner als f: Das gebrochene Licht divergiert, die rückwärtigen Verlängerungen schneiden sich auf derselben Seite wie der Gegenstand — es entsteht ein aufrechtes, vergrößertes virtuelles Bild, wie bei einer Lupe.',
  },
}

const convexLensLesson = (context: PhysicsAgentContext): TutorScript => {
  const objectDistance = derivedText(context, 'Gegenstandsabstand u')
  const focalLength = derivedText(context, 'Brennweite f')
  const imageDistance = derivedText(context, 'Bildabstand v')
  const magnification = derivedText(context, 'Vergrößerung m')
  const nature = derivedText(context, 'Bildart')
  const zoneText = context.derived.find(row => row.label === 'Gegenstandsabstand-Bereich')?.value
  const zone = zoneText === undefined ? undefined : LENS_ZONES[zoneText]
  const screenNote = derivedText(context, 'Schirmnachweis')
  return {
    id: zone === undefined ? 'optics-lens' : `optics-lens-${zone.slug}`,
    topic: 'Abbildungsgesetze der Konvexlinse',
    observation: [
      ...observeLine('Gegenstandsabstand u', objectDistance),
      ...observeLine('Brennweite f', focalLength),
      ...observeLine('Bildabstand v', imageDistance),
      ...observeLine('Vergrößerung m', magnification),
      ...observeLine('Bildart', nature),
      ...observeLine('Schirmnachweis', screenNote),
    ],
    question:
      zoneText === 'u = f'
        ? 'Der Gegenstandsabstand ist gerade gleich der Brennweite — warum entsteht dabei kein Bild?'
        : `Der aktuelle Gegenstandsabstand fällt in den Bereich ${zoneText ?? 'welchem'} — warum entsteht ein solches Bild?`,
    hints: [
      {
        id: 'hint-compare',
        title: 'Hinweis 1',
        paragraphs: ['Vergleiche den Gegenstandsabstand zuerst mit den beiden Bezugspunkten: F (Brennpunkt) und 2F auf der Achse sind sämtliche Grenzpunkte der Abbildungsgesetze. In welchem Bereich liegt der Gegenstand?'],
        highlights: ['lens'],
      },
      {
        id: 'hint-rays',
        title: 'Hinweis 2',
        paragraphs: ['Öffne den Strahlengang der Hauptstrahlen und konstruiere: Ein achsenparallel einfallender Strahl geht nach der Brechung durch den Brennpunkt, ein durch den Mittelpunkt gehender Strahl läuft geradlinig weiter — der Schnittpunkt zweier gebrochener Strahlen (oder ihrer rückwärtigen Verlängerungen) ist das Bild.'],
        highlights: ['image'],
      },
      {
        id: 'hint-equation',
        title: 'Hinweis 3',
        paragraphs: ['Prüfe die Konstruktion mit der Dünnlinse-Formel: 1/u + 1/v = 1/f. Sind u und f bekannt, lässt sich v berechnen; ein positives v bedeutet ein auf dem Schirm auffangbares reelles Bild, ein negatives v bedeutet ein Bild auf derselben Seite wie der Gegenstand, also ein virtuelles Bild.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        zone?.answer ?? 'Durch Vergleich des Gegenstandsabstands mit f und 2f lassen sich Ausrichtung, Größe und Art (reell oder virtuell) des Bildes ablesen; Konstruktion und Dünnlinse-Formel ergeben dasselbe Bild.',
        [
          objectDistance === undefined ? '' : `u = ${objectDistance}`,
          focalLength === undefined ? '' : `f = ${focalLength}`,
          imageDistance === undefined ? '' : `v = ${imageDistance}`,
          magnification === undefined ? '' : `m = ${magnification}`,
        ].filter(entry => entry.length > 0).join('; '),
        screenNote === undefined ? '' : `Schirmnachweis: ${screenNote}.`,
      ].filter(entry => entry.length > 0),
      highlights: ['image', 'lens'],
    },
    evidence: evidenceOf(context, [
      'thin_lens_equation',
      'principal_rays_converge',
      'rays_parallel_at_focus',
      'virtual_image_uncatchable',
    ]),
  }
}

/**
 * The imaging zones of a concave mirror, keyed by the Gegenstandsabstand-Bereich derived value
 * the optics runtime publishes (the mirror shares the u-vs-f/2f classification
 * with the convex lens; 2f is the centre of curvature C). The answer sentences
 * are the Abbildungsgesetz-Tabelle rows, folded back to the mirror's front side.
 */
const MIRROR_ZONES: Readonly<Record<string, { slug: string; answer: string }>> = {
  'u > 2f': {
    slug: 'beyond-c',
    answer: 'Gegenstandsabstand größer als 2f (Gegenstand außerhalb des Krümmungsmittelpunkts C): Es entsteht ein umgekehrtes, verkleinertes reelles Bild, das zwischen F und C vor dem Spiegel liegt — genau in diesem Bereich arbeitet der Hauptspiegel eines Spiegelteleskops.',
  },
  'u = 2f': {
    slug: 'at-c',
    answer: 'Gegenstandsabstand gleich 2f (Gegenstand im Krümmungsmittelpunkt C): Es entsteht ein umgekehrtes, gleich großes reelles Bild, das ebenfalls bei C liegt — ein durch C laufender Strahl kehrt auf demselben Weg zurück; im Labor nutzt man diesen Punkt zur schnellen Bestimmung des Krümmungsmittelpunkts.',
  },
  'f < u < 2f': {
    slug: 'between-f-c',
    answer: 'Gegenstandsabstand zwischen f und 2f: Es entsteht ein umgekehrtes, vergrößertes reelles Bild, der Bildabstand v > 2f, das Bild liegt außerhalb von C.',
  },
  'u = f': {
    slug: 'at-f',
    answer: 'Gegenstandsabstand gleich f: Die reflektierten Strahlen verlaufen parallel zueinander und schneiden sich nie — es entsteht kein Bild. Ein Scheinwerfer nutzt genau das umgekehrt: Er setzt die Lichtquelle in den Brennpunkt und strahlt ein paralleles Bündel aus.',
  },
  'u < f': {
    slug: 'within-f',
    answer: 'Gegenstandsabstand kleiner als f: Das reflektierte Licht divergiert, die rückwärtigen Verlängerungen schneiden sich hinter dem Spiegel — es entsteht ein aufrechtes, vergrößertes virtuelles Bild, wie bei einem Kosmetik- oder Zahnarztspiegel.',
  },
}

const curvedMirrorLesson = (context: PhysicsAgentContext): TutorScript => {
  const objectDistance = derivedText(context, 'Gegenstandsabstand u')
  const focalLength = derivedText(context, 'Brennweite f')
  const imageDistance = derivedText(context, 'Bildabstand v')
  const magnification = derivedText(context, 'Vergrößerung m')
  const nature = derivedText(context, 'Bildart')
  const zoneText = context.derived.find(row => row.label === 'Gegenstandsabstand-Bereich')?.value
  const zone = zoneText === undefined ? undefined : MIRROR_ZONES[zoneText]
  const screenNote = derivedText(context, 'Schirmnachweis')
  /* A convex mirror (f < 0) has no zone table — it always forms the same
     upright reduced virtual image, so the runtime publishes no Gegenstandsabstand-Bereich. */
  const convex = zoneText === undefined && focalLength !== undefined && focalLength.startsWith('-')
  return {
    id: convex
      ? 'optics-mirror-convex'
      : zone === undefined
        ? 'optics-mirror'
        : `optics-mirror-${zone.slug}`,
    topic: 'Abbildung am Konkavspiegel',
    observation: [
      ...observeLine('Gegenstandsabstand u', objectDistance),
      ...observeLine('Brennweite f', focalLength),
      ...observeLine('Bildabstand v', imageDistance),
      ...observeLine('Vergrößerung m', magnification),
      ...observeLine('Bildart', nature),
      ...observeLine('Schirmnachweis', screenNote),
    ],
    question: convex
      ? 'Warum ist bei negativer Brennweite (Konvexspiegel) das Bild stets aufrecht, verkleinert und virtuell, egal wie groß der Gegenstandsabstand ist?'
      : zoneText === 'u = f'
        ? 'Der Gegenstandsabstand ist gerade gleich der Brennweite — warum entsteht dabei kein Bild?'
        : `Der aktuelle Gegenstandsabstand fällt in den Bereich ${zoneText ?? 'welchem'} — warum entsteht ein solches Bild? Worin unterscheidet es sich von dem der Konvexlinse?`,
    hints: [
      {
        id: 'hint-compare',
        title: 'Hinweis 1',
        paragraphs: ['Vergleiche den Gegenstandsabstand zuerst mit den beiden Bezugspunkten auf der Achse: F (Brennpunkt) und C (Krümmungsmittelpunkt, bei 2f) sind sämtliche Grenzpunkte der Abbildungsgesetze des Konkavspiegels. In welchem Bereich liegt der Gegenstand?'],
        highlights: ['mirror'],
      },
      {
        id: 'hint-rays',
        title: 'Hinweis 2',
        paragraphs: ['Öffne den Strahlengang der Hauptstrahlen und konstruiere: Ein achsenparallel einfallender Strahl geht nach der Reflexion durch den Brennpunkt F, ein auf den Scheitel des Spiegels treffender Strahl wird nach dem Reflexionsgesetz symmetrisch zurückgeworfen — der Schnittpunkt zweier reflektierter Strahlen (oder ihrer rückwärtigen Verlängerungen) ist das Bild. Beachte, dass die Reflexion das Licht auf die Kerzenseite zurückwirft.'],
        highlights: ['image'],
      },
      {
        id: 'hint-equation',
        title: 'Hinweis 3',
        paragraphs: ['Prüfe die Konstruktion mit der Kugelspiegel-Formel: 1/u + 1/v = 1/f (f = R/2). Ist v positiv, entsteht das reelle Bild vor dem Spiegel, und der Schirm muss auf der Kerzenseite aufgestellt werden; ist v negativ, liegt das Bild hinter dem Spiegel und ist virtuell.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        convex
          ? 'Ein Konvexspiegel streut das Licht: Die rückwärtigen Verlängerungen der reflektierten Strahlen schneiden sich stets hinter dem Spiegel, und unabhängig vom Gegenstandsabstand entsteht ein aufrechtes, verkleinertes virtuelles Bild — dadurch wird das Sichtfeld größer, weshalb er als Rückspiegel und als Spiegel an Kreuzungen verwendet wird.'
          : zone?.answer ??
            'Durch Vergleich des Gegenstandsabstands mit f und C (bei 2f) lassen sich Ausrichtung, Größe und Art des Bildes ablesen; es gilt dieselbe Tabelle wie für die Konvexlinse, nur wirft die Reflexion das reelle Bild vor den Spiegel zurück.',
        [
          objectDistance === undefined ? '' : `u = ${objectDistance}`,
          focalLength === undefined ? '' : `f = ${focalLength}`,
          imageDistance === undefined ? '' : `v = ${imageDistance}`,
          magnification === undefined ? '' : `m = ${magnification}`,
        ].filter(entry => entry.length > 0).join('; '),
        screenNote === undefined ? '' : `Schirmnachweis: ${screenNote}.`,
      ].filter(entry => entry.length > 0),
      highlights: ['image', 'mirror'],
    },
    evidence: evidenceOf(context, [
      'curved_mirror_equation',
      'principal_rays_converge',
      'rays_parallel_at_focus',
      'virtual_image_uncatchable',
    ]),
  }
}

/* ---------------------------------------------------------------- acoustics -- */

const echoRangingLesson = (context: PhysicsAgentContext): TutorScript => {
  const soundSpeed = derivedText(context, 'Schallgeschwindigkeit v')
  const echoTime = derivedText(context, 'Echolaufzeit t')
  const oneWayTime = derivedText(context, 'Einwegzeit t₁')
  const measured = derivedText(context, 'Gemessene Entfernung d = v·t/2')
  const wallDistance = derivedText(context, 'Abstand zur Felswand d')
  const phase = context.derived.find(row => row.label === 'Impulszustand')?.value
  return {
    id: 'acoustics-echo-ranging',
    topic: 'Entfernungsmessung per Echo',
    observation: [
      ...observeLine('Schallgeschwindigkeit v', soundSpeed),
      ...observeLine('Echolaufzeit t', echoTime),
      ...observeLine('Impulszustand', phase),
    ],
    question: 'Wie berechnet man aus der mit der Stoppuhr gemessenen Echolaufzeit die Entfernung zur Felswand?',
    hints: [
      {
        id: 'hint-round-trip',
        title: 'Hinweis 1',
        paragraphs: ['Überlege zuerst, was die gestoppte Zeit t ist: Der Schall geht von der Quelle aus, wird an der Felswand reflektiert und erst danach gehört — t ist die Gesamtzeit für Hin- und Rückweg, nicht die Zeit für einen Weg.'],
        highlights: ['wall'],
      },
      {
        id: 'hint-total-path',
        title: 'Hinweis 2',
        paragraphs: ['Der Schall breitet sich im Medium mit der Schallgeschwindigkeit v geradlinig und gleichförmig aus: Die in t Sekunden zurückgelegte Gesamtstrecke ist s = v·t. Spiele die Szene ab und beobachte den Impuls auf Hin- und Rückweg — diese Strecke ist doppelt so groß wie der Abstand von der Quelle zur Felswand.'],
        highlights: ['sound-pulse'],
      },
      {
        id: 'hint-halve',
        title: 'Hinweis 3',
        paragraphs: ['Hin- und Rückweg sind symmetrisch: Jeder Weg beträgt d und dauert t/2. Daher gilt d = v·(t/2) = v·t/2 — die Division durch 2 ist genau der Schritt, der bei der Echolaufzeitmessung am leichtesten vergessen wird.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Halbiere die Gesamtstrecke: d = v·t/2. Der Schall legt die Strecke 2d gleichförmig in der Zeit t zurück, auf jeden Weg entfällt genau die Hälfte; wechselt das Medium, ändert sich die Schallgeschwindigkeit, und bei gleicher Entfernung ändert sich die Echolaufzeit entsprechend — in der Formel muss v die Schallgeschwindigkeit des jeweiligen Mediums sein.',
        [
          soundSpeed === undefined ? '' : `v = ${soundSpeed}`,
          echoTime === undefined ? '' : `t = ${echoTime}`,
          oneWayTime === undefined ? '' : `t₁ = ${oneWayTime}`,
          measured === undefined ? '' : `d = v·t/2 = ${measured}`,
        ].filter(entry => entry.length > 0).join('; '),
        wallDistance === undefined ? '' : `Das stimmt mit dem in der Szene platzierten Abstand zur Felswand ${wallDistance} überein — die Entfernungsformel ist von der Engine verifiziert.`,
      ].filter(entry => entry.length > 0),
      highlights: ['wall', 'sound-pulse'],
    },
    evidence: evidenceOf(context, [
      'echo_distance_formula',
      'reflection_symmetry',
      'pulse_speed_constant',
    ]),
  }
}

/* -------------------------------------------------------------------- fluid -- */

const buoyancyLesson = (context: PhysicsAgentContext): TutorScript => {
  const weight = derivedText(context, 'Gewichtskraft G')
  const reading = derivedText(context, 'Kraftmesseranzeige F_Anzeige')
  const buoyant = derivedText(context, 'Auftriebskraft F_Auftrieb')
  const displacedVolume = derivedText(context, 'Verdrängtes Flüssigkeitsvolumen V_verdrängt')
  const displacedWeight = derivedText(context, 'Gewichtskraft der verdrängten Flüssigkeit G_verdrängt')
  const liquidDensity = derivedText(context, 'Flüssigkeitsdichte ρ_Fl')
  const phase = context.derived.find(row => row.label === 'Eintauchzustand')?.value
  const floats = context.verification.some(check => check.id === 'float_equilibrium')
  return {
    id: 'fluid-buoyancy',
    topic: 'Größe des Auftriebs untersuchen',
    observation: [
      ...observeLine('Gewichtskraft G', weight),
      ...observeLine('Kraftmesseranzeige F_Anzeige', reading),
      ...observeLine('Eintauchzustand', phase),
    ],
    question: floats
      ? 'Der Klotz schwimmt auf dem Wasser und sinkt nicht weiter, die Kraftmesseranzeige ist null — wie groß ist der Auftrieb jetzt?'
      : 'Nach dem Eintauchen des Klotzes ins Wasser wird die Kraftmesseranzeige kleiner — wohin ist der fehlende Teil der Kraft verschwunden?',
    hints: [
      {
        id: 'hint-missing-force',
        title: 'Hinweis 1',
        paragraphs: ['Der Klotz selbst ist nicht leichter geworden: Seine Gewichtskraft G bleibt von Anfang bis Ende gleich. Geändert hat sich die Kraft, die ihn hält — die Flüssigkeit drückt von unten dagegen, und der Kraftmesser muss nur noch den Rest tragen.'],
        highlights: ['block-1'],
      },
      {
        id: 'hint-weighing-method',
        title: 'Hinweis 2',
        paragraphs: ['Schreibe die drei Kräfte als Gleichgewichtsbedingung: G nach unten, F_Auftrieb und F_Anzeige nach oben; das Gleichgewicht ergibt F_Anzeige + F_Auftrieb = G. Umgestellt erhält man das Wägeverfahren: F_Auftrieb = G − F_Anzeige; es genügt, die beiden Messwerte zu subtrahieren.'],
      },
      {
        id: 'hint-displaced',
        title: 'Hinweis 3',
        paragraphs: ['Betrachte nun, woher diese Kraft kommt: In dem Raum, den der Klotz einnimmt, befand sich zuvor Flüssigkeit. Berechne die Gewichtskraft dieser Flüssigkeit G_verdrängt = ρ_Fl·g·V_verdrängt und vergleiche sie mit dem zuvor durch Subtraktion erhaltenen F_Auftrieb.'],
        highlights: ['liquid-1'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        floats
          ? 'Beim Schwimmen ruht der Klotz, in vertikaler Richtung bleiben nur Gewichtskraft und Auftrieb, also gilt F_Auftrieb = G — eine Kraftmesseranzeige von null bedeutet nicht, dass kein Auftrieb wirkt, sondern gerade, dass der Auftrieb allein die ganze Gewichtskraft trägt.'
          : 'Die fehlende Kraft ist der Auftrieb: F_Auftrieb = G − F_Anzeige. Er ist gleich der Gewichtskraft der vom Klotz verdrängten Flüssigkeit G_verdrängt = ρ_Fl·g·V_verdrängt — das ist das Archimedische Prinzip. Nach dem vollständigen Eintauchen bleibt V_verdrängt auf das Volumen des Klotzes festgelegt, und auch ein weiteres Absenken ändert den Messwert nicht mehr.',
        [
          weight === undefined ? '' : `G = ${weight}`,
          reading === undefined ? '' : `F_Anzeige = ${reading}`,
          buoyant === undefined ? '' : `F_Auftrieb = G − F_Anzeige = ${buoyant}`,
          displacedVolume === undefined ? '' : `V_verdrängt = ${displacedVolume}`,
        ].filter(entry => entry.length > 0).join('; '),
        displacedWeight === undefined
          ? ''
          : `Gewichtskraft der verdrängten Flüssigkeit G_verdrängt = ${displacedWeight}, gleich dem Auftrieb — das Archimedische Prinzip ist von der Engine verifiziert.`,
        liquidDensity === undefined ? '' : `Aktuelle Flüssigkeitsdichte ρ_Fl = ${liquidDensity}; bei einer dichteren Flüssigkeit liefert dasselbe V_verdrängt einen größeren Auftrieb.`,
      ].filter(entry => entry.length > 0),
      highlights: ['block-1', 'liquid-1'],
    },
    evidence: evidenceOf(context, [
      'archimedes_principle',
      'scale_reading_balance',
      'buoyancy_depth_independent',
      'float_equilibrium',
    ]),
  }
}

/* ------------------------------------------------------------------ thermal -- */

const crystalMeltingLesson = (context: PhysicsAgentContext): TutorScript => {
  const power = derivedText(context, 'Heizleistung P')
  const meltingPoint = derivedText(context, 'Schmelzpunkt T_Schmelz')
  const meltingDuration = derivedText(context, 'Schmelzdauer t_Schmelz')
  const meltingHeat = derivedText(context, 'Schmelzwärme Q_Schmelz')
  const temperature = derivedText(context, 'Aktuelle Temperatur T')
  const phase = context.derived.find(row => row.label === 'Aktuelle Phase')?.value
  const crystalline = context.verification.some(check => check.id === 'melting_plateau')
  return {
    id: crystalline ? 'thermal-crystal-melting' : 'thermal-amorphous',
    topic: 'Schmelzvorgang eines Kristalls untersuchen',
    observation: [
      ...observeLine('Heizleistung P', power),
      ...observeLine('Aktuelle Temperatur T', temperature),
      ...observeLine('Aktuelle Phase', phase),
    ],
    question: crystalline
      ? 'Die Heizung hat keine Sekunde ausgesetzt, doch das Thermometer bleibt beim Schmelzpunkt stehen. Wohin ist die Wärme in dieser Zeit gegangen?'
      : 'Warum steigt die Temperatur dieser Probe bei gleicher konstanter Heizleistung durchgehend an, ohne jenen waagerechten Abschnitt?',
    hints: [
      {
        id: 'hint-still-heating',
        title: 'Hinweis 1',
        paragraphs: ['Kläre zuerst eines: Die Heizleistung ist konstant, jede Sekunde werden P Joule zugeführt. Eine gleichbleibende Temperatur bedeutet nicht, dass keine Energie ankommt — diese beiden Dinge sind getrennt zu betrachten.'],
        highlights: ['thermal-bench-1'],
      },
      {
        id: 'hint-where-it-goes',
        title: 'Hinweis 2',
        paragraphs: ['Die zugeführte Wärme kann nur zwei Wege nehmen: Sie verstärkt die Molekularbewegung (Temperatur steigt) oder sie löst die Kristallstruktur des Festkörpers auf (Zustandsänderung). Beim Schmelzen nimmt sie vollständig den zweiten Weg.'],
        highlights: ['sample-1'],
      },
      {
        id: 'hint-latent',
        title: 'Hinweis 3',
        paragraphs: ['Berechne die in diesem Abschnitt aufgenommene Wärme: Q = P·t_Schmelz, sie ist auch gleich mL. Umgekehrt lassen sich aus Schmelzdauer und Leistung die Schmelzwärme dieses Stoffes bestimmen — genau darin liegt der Nutzen dieses Versuchs.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        crystalline
          ? 'Die Wärme wird vollständig zum Schmelzen verwendet: Ein Kristall hat einen festen Schmelzpunkt, die während des Schmelzens aufgenommene Energie dient dem Aufbrechen der Kristallstruktur und nicht der Temperaturerhöhung, daher zeigt das Diagramm einen waagerechten Abschnitt. Erst nach dem vollständigen Schmelzen nimmt die restliche Flüssigkeit weiter Wärme auf, und die Temperatur steigt wieder.'
          : 'Dies ist ein amorpher Stoff: Er hat keinen festen Schmelzpunkt, wird beim Erhitzen allmählich weich, und die Temperatur steigt während des gesamten Vorgangs an, sodass das Diagramm keinen waagerechten Abschnitt hat. Ob jener waagerechte Abschnitt vorhanden ist, ist genau das Kriterium zur Unterscheidung von Kristallen und amorphen Stoffen.',
        [
          power === undefined ? '' : `P = ${power}`,
          meltingPoint === undefined ? '' : `T_Schmelz = ${meltingPoint} ℃`,
          meltingDuration === undefined ? '' : `t_Schmelz = ${meltingDuration}`,
          meltingHeat === undefined ? '' : `Q_Schmelz = mL = ${meltingHeat}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Dass die Steigungen vor und nach dem Schmelzen verschieden sind, ist kein Zufall: Die Erwärmungsrate ist P/(cm); je größer die spezifische Wärmekapazität, desto langsamer steigt die Temperatur.',
      ].filter(entry => entry.length > 0),
      highlights: ['sample-1', 'thermometer'],
    },
    evidence: evidenceOf(context, [
      'melting_plateau',
      'plateau_duration',
      'amorphous_no_plateau',
      'energy_conservation',
      'heating_rate_ratio',
    ]),
  }
}

const heatCapacityLesson = (context: PhysicsAgentContext): TutorScript => {
  const power = derivedText(context, 'Heizleistung P')
  const heat = derivedText(context, 'Aufgenommene Wärme Q')
  const waterRise = derivedText(context, 'Temperaturanstieg ΔT')
  const oilRise = derivedText(context, 'Vergleichs-Temperaturanstieg ΔT′')
  const waterC = derivedText(context, 'Spezifische Wärmekapazität c')
  const oilC = derivedText(context, 'Vergleichs-Wärmekapazität c′')
  const waterT = derivedText(context, 'Wassertemperatur T')
  const oilT = derivedText(context, 'Kerosintemperatur T′')
  return {
    id: 'thermal-heat-capacity',
    topic: 'Wärmeaufnahmefähigkeit verschiedener Stoffe vergleichen',
    observation: [
      ...observeLine('Heizleistung P', power),
      ...observeLine('Wassertemperatur T', waterT),
      ...observeLine('Kerosintemperatur T′', oilT),
    ],
    question: 'Warum erwärmt sich Wasser langsamer und Kerosin schneller, obwohl dieselbe Heizung gleich lange heizt?',
    hints: [
      {
        id: 'hint-same-heat',
        title: 'Hinweis 1',
        paragraphs: ['Prüfe zuerst die Kontrollgrößen: Beide Seiten haben dieselbe Masse, dieselbe Leistung und dieselbe Zeit, die aufgenommene Wärme Q = P·t ist also völlig gleich. Nicht die zugeführte Wärme ist verschieden.'],
        highlights: ['thermal-bench-1', 'thermal-bench-1-comparison'],
      },
      {
        id: 'hint-q-cm-dt',
        title: 'Hinweis 2',
        paragraphs: ['Q = cmΔt. Sind Q und m gleich, so ist c auf der Seite mit dem größeren Δt kleiner. Kerosin erwärmt sich doppelt so stark wie Wasser, seine spezifische Wärmekapazität ist also halb so groß wie die von Wasser.'],
        highlights: ['sample-1', 'sample-2'],
      },
      {
        id: 'hint-read-thermometers',
        title: 'Hinweis 3',
        paragraphs: ['Beide Thermometer verwenden dieselbe Skala: Die Flüssigkeitssäule des Wassers ist nur etwa halb so hoch wie die des Kerosins; das ist das Temperaturanstiegsverhältnis 1:2 und zugleich das Wärmekapazitätsverhältnis 2:1.'],
        highlights: ['thermometer', 'thermometer-2'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Die spezifische Wärmekapazität ist die Wärmeaufnahmefähigkeit: Bei gleicher aufgenommener Wärmemenge Q in Joule erwärmt sich ein Stoff mit größerem c weniger. Die spezifische Wärmekapazität von Wasser ist doppelt so groß wie die von Kerosin, daher beträgt sein Temperaturanstieg nur die Hälfte.',
        [
          power === undefined ? '' : `P = ${power}`,
          heat === undefined ? '' : `Q = ${heat}`,
          waterRise === undefined ? '' : `ΔT_Wasser = ${waterRise} ℃`,
          oilRise === undefined ? '' : `ΔT_Kerosin = ${oilRise} ℃`,
          waterC === undefined ? '' : `c_Wasser = ${waterC}`,
          oilC === undefined ? '' : `c_Kerosin = ${oilC}`,
        ].filter(entry => entry.length > 0).join('; '),
      ].filter(entry => entry.length > 0),
      highlights: ['sample-1', 'sample-2', 'thermometer', 'thermometer-2'],
    },
    evidence: evidenceOf(context, [
      'equal_heat_absorbed',
      'specific_heat_ratio',
      'energy_conservation',
    ]),
  }
}

/* ---------------------------------------------------------------- induction -- */

const barMotionLesson = (context: PhysicsAgentContext): TutorScript => {
  const emf = derivedText(context, 'Induzierte Spannung E')
  const current = derivedText(context, 'Induzierter Strom I')
  const field = derivedText(context, 'Magnetische Flussdichte B')
  const barLength = derivedText(context, 'Stablänge L')
  const velocity = derivedText(context, 'Stabgeschwindigkeit v')
  const resistance = derivedText(context, 'Kreiswiderstand R')
  return {
    id: 'induction-bar-motion',
    topic: 'Leiterstab schneidet Feldlinien',
    observation: [
      ...observeLine('Magnetische Flussdichte B', field),
      ...observeLine('Stabgeschwindigkeit v', velocity),
      ...observeLine('Induzierte Spannung E', emf),
      ...observeLine('Induzierter Strom I', current),
    ],
    question: 'Der Stab gleitet gleichförmig, und der Messwert bleibt stets derselbe. Erzeugt dieser Stab überhaupt Strom? Woher kommt die Energie?',
    hints: [
      {
        id: 'hint-what-decides-emf',
        title: 'Hinweis 1',
        paragraphs: ['Vergleiche zuerst die Messwerte mit der Formel: E = BLv. Die drei Größen B, L und v bleiben beim gleichförmigen Gleiten des Stabs alle konstant, daher ist die induzierte Spannung konstant — ein stabiler Messwert bedeutet nicht, dass kein Strom erzeugt wird, sondern eine stabile Stromerzeugung.'],
        highlights: ['induction-field', 'induction-bench-1.bar'],
      },
      {
        id: 'hint-where-energy-from',
        title: 'Hinweis 2',
        paragraphs: ['Im Stab fließt ein Strom, und dieser Strom erfährt im Magnetfeld eine Ampèresche Kraft, die der Bewegung entgegengerichtet ist. Damit der Stab gleichförmig bleibt, muss eine äußere Kraft ihn ständig antreiben — die mechanische Arbeit wird gerade durch das Überwinden der Ampèreschen Kraft in elektrische Energie umgewandelt.'],
        highlights: ['induction-current-arrow'],
      },
      {
        id: 'hint-direction',
        title: 'Hinweis 3',
        paragraphs: ['Die Stromrichtung ergibt sich aus der Rechte-Hand-Regel: Öffne die rechte Hand so, dass die Feldlinien in die Handfläche eintreten, und richte den Daumen in Bewegungsrichtung des Stabs; dann zeigen die vier Finger in Richtung des induzierten Stroms. Gleitet der Stab umgekehrt, kehrt sich auch die Richtung der vier Finger um.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Der Stab erzeugt stabil Strom: E = BLv wird nur von Magnetfeld, Stablänge und Geschwindigkeit bestimmt und hängt nicht vom Widerstand ab; beim gleichförmigen Gleiten bleiben alle drei Größen konstant, die induzierte Spannung ist also konstant. Der Strom I = E/R ist ebenfalls konstant.',
        [
          field === undefined ? '' : `B = ${field}`,
          barLength === undefined ? '' : `L = ${barLength}`,
          velocity === undefined ? '' : `v = ${velocity}`,
          resistance === undefined ? '' : `R = ${resistance}`,
          emf === undefined ? '' : `E = BLv = ${emf}`,
          current === undefined ? '' : `I = E/R = ${current}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Energiebilanz: Die mechanische Arbeit der äußeren Kraft, die den Stab antreibt, wird über die Ampèresche Kraft in elektrische Energie im Stromkreis umgewandelt — das ist der Keim des Generators. Sobald der Stab stehen bleibt (v = 0), fällt E sofort auf null.',
      ].filter(entry => entry.length > 0),
      highlights: ['induction-bench-1.bar', 'induction-current-arrow'],
    },
    evidence: evidenceOf(context, ['faraday_law', 'lenz_direction', 'ohm_law_loop']),
  }
}

const fluxChangeLesson = (context: PhysicsAgentContext): TutorScript => {
  const emf = derivedText(context, 'Induzierte Spannung E')
  const current = derivedText(context, 'Induzierter Strom I')
  const flux = derivedText(context, 'Magnetischer Fluss Φ')
  const field = derivedText(context, 'Magnetische Flussdichte B')
  const resistance = derivedText(context, 'Kreiswiderstand R')
  return {
    id: 'induction-flux-change',
    topic: 'Änderung des magnetischen Flusses erzeugt eine induzierte Spannung',
    observation: [
      ...observeLine('Magnetische Flussdichte B', field),
      ...observeLine('Magnetischer Fluss Φ', flux),
      ...observeLine('Induzierte Spannung E', emf),
      ...observeLine('Induzierter Strom I', current),
    ],
    question: 'Die Spule bleibt unbewegt, doch beim Ein- und Ausführen des Magneten schlägt der Zeiger des Amperemeters aus. Was ändert sich?',
    hints: [
      {
        id: 'hint-what-is-flux',
        title: 'Hinweis 1',
        paragraphs: ['Die Anzahl der durch die Spule tretenden Feldlinien heißt magnetischer Fluss Φ = B·S·cosθ. Die Spule bewegt sich nicht, die Fläche bleibt gleich, geändert wird B — kommt der Magnet näher, wächst B, entfernt er sich, sinkt B.'],
        highlights: ['induction-field'],
      },
      {
        id: 'hint-rate-not-value',
        title: 'Hinweis 2',
        paragraphs: ['Bei der induzierten Spannung zählt die Änderungsrate, nicht die Änderungsmenge: E = -dΦ/dt. Je schneller sich der magnetische Fluss ändert, desto stärker schlägt der Zeiger aus; führt man den Magneten langsam ein und aus, liefert derselbe Endwert Φ praktisch keine induzierte Spannung.'],
      },
      {
        id: 'hint-lenz',
        title: 'Hinweis 3',
        paragraphs: ['Das Minuszeichen steht für die Lenzsche Regel: Beim Einführen wächst der magnetische Fluss, das Feld des induzierten Stroms wirkt dem Wachstum entgegen (es ist dem ursprünglichen Feld entgegengerichtet); beim Herausziehen nimmt der magnetische Fluss ab, und das induzierte Feld gleicht das aus (es ist dem ursprünglichen Feld gleichgerichtet). Der Grundsatz, der Änderung entgegenzuwirken, deckt beide Fälle ab.'],
        highlights: ['induction-current-arrow'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Was sich ändert, ist der magnetische Fluss: Die Bewegung des Magneten ändert das B, das die Spule durchsetzt, und damit ändert sich Φ = B·S·cosθ. Sobald dΦ/dt ≠ 0 ist, gibt es eine induzierte Spannung E = -dΦ/dt, und im geschlossenen Stromkreis fließt I = E/R.',
        [
          field === undefined ? '' : `B = ${field}`,
          flux === undefined ? '' : `Φ = ${flux}`,
          resistance === undefined ? '' : `R = ${resistance}`,
          emf === undefined ? '' : `E = -dΦ/dt = ${emf}`,
          current === undefined ? '' : `I = E/R = ${current}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Die Lenzsche Regel legt die Richtung fest: Das Vorzeichen von E ist dem von dΦ/dt entgegengesetzt — Einführen (Φ steigt) und Herausziehen (Φ sinkt) ergeben genau entgegengesetzte Stromrichtungen, deshalb schlägt der Zeiger einmal nach links und einmal nach rechts aus.',
      ].filter(entry => entry.length > 0),
      highlights: ['induction-bench-1', 'induction-current-arrow'],
    },
    evidence: evidenceOf(context, ['faraday_law', 'lenz_direction', 'ohm_law_loop']),
  }
}

/* --------------------------------------------------------------------- wave -- */

const travellingWaveLesson = (context: PhysicsAgentContext): TutorScript => {
  const amplitude = derivedText(context, 'Amplitude A')
  const wavelength = derivedText(context, 'Wellenlänge λ')
  const frequency = derivedText(context, 'Frequenz f')
  const speed = derivedText(context, 'Wellengeschwindigkeit v')
  const period = derivedText(context, 'Periodendauer T')
  const marker = context.drawnIds.find(id => id.endsWith('.marker'))
  const profile = context.drawnIds.find(id => id.startsWith('wave-bench'))
  return {
    id: 'wave-travelling',
    topic: 'Harmonische Transversalwelle auf einem Seil',
    observation: [
      ...observeLine('Amplitude A', amplitude),
      ...observeLine('Wellenlänge λ', wavelength),
      ...observeLine('Frequenz f', frequency),
      ...observeLine('Wellengeschwindigkeit v = λf', speed),
      ...observeLine('Periodendauer T = 1/f', period),
    ],
    question: 'Das Wellenprofil läuft ständig nach rechts, doch das blau markierte Teilchen bleibt auf derselben senkrechten Linie. Was breitet sich denn nach rechts aus?',
    hints: [
      {
        id: 'hint-particle',
        title: 'Hinweis 1',
        paragraphs: ['Beobachte das markierte Teilchen: Seine horizontale Koordinate bewegt sich keinen einzigen Skalenstrich, es pendelt nur senkrecht auf und ab — das ist eine harmonische Schwingung, und die Amplitude ist A.'],
        ...(marker === undefined ? {} : { highlights: [marker] }),
      },
      {
        id: 'hint-profile',
        title: 'Hinweis 2',
        paragraphs: ['Betrachte nun das ganze Seil: Nach jeweils einer Periodendauer T rückt das Wellenprofil gerade um eine Wellenlänge λ vor. Die Strecke λ geteilt durch die Zeit T ergibt die Ausbreitungsgeschwindigkeit des Profils v = λ/T = λf.'],
        ...(profile === undefined ? {} : { highlights: [profile] }),
      },
      {
        id: 'hint-medium',
        title: 'Hinweis 3',
        paragraphs: ['Erhöhe einmal die Frequenz: Das Wellenprofil wird dichter (λ wird kürzer), aber v bleibt gleich, denn die Wellengeschwindigkeit wird vom Medium Seil bestimmt; die Quelle legt nur f fest, und λ = v/f ist das gemeinsame Ergebnis beider.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Nach rechts breitet sich die Schwingung als solche sowie die mit ihr transportierte Energie aus; das Medium selbst (jedes Teilchen des Seils) führt nur nahe seiner eigenen Ruhelage eine harmonische Schwingung aus und wandert nicht mit der Welle.',
        [
          amplitude === undefined ? '' : `A = ${amplitude}`,
          wavelength === undefined ? '' : `λ = ${wavelength}`,
          frequency === undefined ? '' : `f = ${frequency}`,
          speed === undefined ? '' : `v = λf = ${speed}`,
          period === undefined ? '' : `T = 1/f = ${period}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Die Aufgabenverteilung der drei Größen: Das Medium legt die Wellengeschwindigkeit v fest, die Quelle die Frequenz f, und die Wellenlänge λ = v/f ergibt sich aus beiden gemeinsam.',
      ].filter(entry => entry.length > 0),
      highlights: [marker, profile].filter((id): id is string => id !== undefined),
    },
    evidence: evidenceOf(context, [
      'wave_speed_relation',
      'period_frequency_reciprocal',
      'profile_translation',
      'particle_no_net_transport',
    ]),
  }
}

const waveInterferenceLesson = (context: PhysicsAgentContext): TutorScript => {
  const pathDifference = derivedText(context, 'Wegunterschied Δ')
  const ratio = derivedText(context, 'Wegunterschied / Wellenlänge Δ/λ')
  const resultant = derivedText(context, 'Gesamtamplitude A_P')
  const amplitude = derivedText(context, 'Amplitude A')
  const wavelength = derivedText(context, 'Wellenlänge λ')
  const verdict = context.derived.find(row => row.label === 'Schwingung am Punkt P')?.value
  const destructive = verdict === 'Schwingung geschwächt'
  const point = context.drawnIds.find(id => id.endsWith('.point'))
  const sources = context.drawnIds.filter(id => /\.source-\d$/.test(id))
  return {
    id: destructive ? 'wave-interference-destructive' : 'wave-interference-constructive',
    topic: 'Interferenz zweier Quellen und Überlagerung',
    observation: [
      ...observeLine('Amplitude einer einzelnen Quelle A', amplitude),
      ...observeLine('Wellenlänge λ', wavelength),
      ...observeLine('Wegunterschied am Punkt P Δ', pathDifference),
      ...observeLine('Δ/λ', ratio),
      ...observeLine('Gesamtamplitude am Punkt P A_P', resultant),
      ...observeLine('Schwingung am Punkt P', verdict),
    ],
    question: destructive
      ? 'Beide Quellen schwingen, doch der Punkt P bewegt sich kaum. Wohin sind die beiden Wellen verschwunden?'
      : 'Die Amplitude am Punkt P ist größer als die jeder einzelnen Quelle. Woher kommt die zusätzliche Amplitude?',
    hints: [
      {
        id: 'hint-path',
        title: 'Hinweis 1',
        paragraphs: ['Die beiden Wellen legen bis zum Punkt P unterschiedlich lange Wege zurück, der Wegunterschied ist Δ = |r₂ − r₁|. Die Welle mit dem längeren Weg kommt später an, und um wie viele Perioden, hängt davon ab, wie viele Wellenlängen in Δ passen.'],
        ...(point === undefined ? {} : { highlights: [point] }),
      },
      {
        id: 'hint-phase',
        title: 'Hinweis 2',
        paragraphs: ['Ist Δ ein ganzzahliges Vielfaches der Wellenlänge, kommen beide Wellen in Phase an, Wellenberg trifft auf Wellenberg, und die Auslenkungen addieren sich zu 2A; ist Δ ein ungeradzahliges Vielfaches der halben Wellenlänge, kommen sie gegenphasig an, Wellenberg trifft auf Wellental, und die Auslenkungen heben sich zu 0 auf.'],
        highlights: sources,
      },
      {
        id: 'hint-formula',
        title: 'Hinweis 3',
        paragraphs: ['Einheitlich geschrieben: Gesamtamplitude A_P = |2A·cos(πΔ/λ)|. Bei ganzzahligem Δ/λ ist cos = ±1 und ergibt 2A, bei halbzahligem Δ/λ ist cos = 0 und ergibt 0, in allen übrigen Fällen liegt der Wert dazwischen. Verschiebe den Wegunterschied und beobachte, wie sich A_P stetig ändert.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        destructive
          ? 'Die beiden Wellen sind nicht verschwunden, sie sind am Punkt P nur stets gegenphasig: Wenn die eine am Wellenberg ankommt, erreicht die andere gerade das Wellental, und die Summe der Auslenkungen ist immer null. Die Energie wurde auf die Verstärkungspunkte umverteilt.'
          : 'Die zusätzliche Amplitude entsteht durch Überlagerung: Beide Wellen kommen in Phase in P an, die Auslenkungen addieren sich zu jedem Zeitpunkt, und die Gesamtamplitude erreicht 2A. Die Energie entsteht nicht aus dem Nichts, sondern die Interferenz hat sie von den Abschwächungspunkten zu den Verstärkungspunkten verschoben.',
        [
          pathDifference === undefined ? '' : `Δ = ${pathDifference}`,
          ratio === undefined ? '' : `Δ/λ = ${ratio}`,
          resultant === undefined ? '' : `A_P = |2A·cos(πΔ/λ)| = ${resultant}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Kriterium: Bei Δ = nλ ist die Schwingung verstärkt, bei Δ = (n + ½)λ geschwächt; die Kohärenzbedingung ist, dass beide Quellen dieselbe Frequenz und eine konstante Phasendifferenz haben.',
      ].filter(entry => entry.length > 0),
      highlights: [point, ...sources].filter((id): id is string => id !== undefined),
    },
    evidence: evidenceOf(context, [
      'interference_geometry',
      'path_difference_rule',
      'superposition_bounds',
      'wave_speed_relation',
    ]),
  }
}

const standingWaveLesson = (context: PhysicsAgentContext): TutorScript => {
  const stringLength = derivedText(context, 'Saitenlänge L')
  const harmonic = derivedText(context, 'Harmonische Ordnung n')
  const speed = derivedText(context, 'Wellengeschwindigkeit v')
  const wavelength = derivedText(context, 'Wellenlänge λ')
  const frequency = derivedText(context, 'Frequenz f')
  const fundamental = derivedText(context, 'Grundfrequenz f₁')
  const nodes = context.drawnIds.filter(id => id.includes('.node.'))
  const antinodes = context.drawnIds.filter(id => id.includes('.antinode.'))
  return {
    id: 'wave-standing',
    topic: 'Stehende Welle auf einer beidseitig eingespannten Saite',
    observation: [
      ...observeLine('Saitenlänge L', stringLength),
      ...observeLine('Harmonische Ordnung n', harmonic),
      ...observeLine('Wellengeschwindigkeit auf der Saite v', speed),
      ...observeLine('Wellenlänge λ = 2L/n', wavelength),
      ...observeLine('Frequenz f_n = n·v/2L', frequency),
      ...observeLine('Grundfrequenz f₁', fundamental),
    ],
    question: 'Die Saite schwingt zwischen zwei gestrichelten Linien hin und her, doch einige Punkte bleiben völlig unbewegt. Warum läuft die Welle hier nicht weiter?',
    hints: [
      {
        id: 'hint-nodes',
        title: 'Hinweis 1',
        paragraphs: ['Zähle zuerst die unbewegten Punkte: Die beiden Enden sind eingespannt und können sich ohnehin nicht bewegen; die unbewegten Punkte dazwischen heißen Knoten. Zwischen zwei benachbarten Knoten liegt gerade eine halbe Wellenlänge λ/2.'],
        highlights: nodes,
      },
      {
        id: 'hint-superpose',
        title: 'Hinweis 2',
        paragraphs: ['Eine stehende Welle entsteht durch die Überlagerung zweier gleicher, entgegengesetzt laufender Wellen: An den Knoten sind beide Wellen stets gegenphasig und heben sich zu null auf; an den Bäuchen sind sie stets in Phase und die Amplitude ist maximal. Das Wellenprofil läuft nicht mehr vorwärts, sondern schwingt nur noch an Ort und Stelle auf und ab.'],
        highlights: antinodes,
      },
      {
        id: 'hint-harmonic',
        title: 'Hinweis 3',
        paragraphs: ['Damit beide Enden Knoten sind, muss die Saitenlänge eine ganze Zahl von Halbwellenlängen aufnehmen: L = n·λ/2. Daraus folgt λ = 2L/n, und mit v = λf ergibt sich f_n = n·v/(2L) = n·f₁ — ändere n auf 3 und beobachte, wie sich Frequenz und Knotenzahl ändern.'],
      },
    ],
    answer: {
      id: 'answer',
      title: 'Antwort',
      paragraphs: [
        'Zwei entgegengesetzt laufende Wellen überlagern sich zu einer stehenden Welle: An den Knoten heben sie sich dauerhaft gegenphasig auf, die Auslenkung ist immer null; an den Bäuchen sind sie dauerhaft in Phase, die Amplitude ist maximal. Das Profil breitet sich nicht aus, die Energie pendelt zwischen benachbarten Knoten hin und her.',
        [
          stringLength === undefined ? '' : `L = ${stringLength}`,
          harmonic === undefined ? '' : `n = ${harmonic}`,
          wavelength === undefined ? '' : `λ = 2L/n = ${wavelength}`,
          speed === undefined ? '' : `v = ${speed}`,
          frequency === undefined ? '' : `f_n = n·v/(2L) = ${frequency}`,
          fundamental === undefined ? '' : `f₁ = ${fundamental}`,
        ].filter(entry => entry.length > 0).join('; '),
        'Eine beidseitig eingespannte Saite kann nur bei diesen diskreten Frequenzen f_n = n·f₁ resonieren; deshalb wird die Tonhöhe eines Saiteninstruments von Saitenlänge, Spannung (die v bestimmt) und Harmonischer Ordnung gemeinsam festgelegt.',
      ].filter(entry => entry.length > 0),
      highlights: [...nodes, ...antinodes],
    },
    evidence: evidenceOf(context, [
      'harmonic_relation',
      'frequency_harmonic',
      'boundary_nodes',
      'node_positions_fixed',
    ]),
  }
}

/* ------------------------------------------------------------------ dispatch -- */

/**
 * Pick the tutor lesson for the current frame.
 *
 * Composite frames are told apart by the facts the runtime published (the
 * spectrometer's drift/deflection regions, the gravity contribution, the
 * selection-condition check); circuit frames by the lab topics the self-checks
 * resolve (circuit facts first — internal resistance, rheostat symbol,
 * junction dots — with the Mittelstufe Strom-Spannungs-Methode/Lampenleistung measurement intents read off
 * the stamped title); optics frames by the imaging element actually on the
 * bench (plane mirror vs thin lens vs curved mirror, with the lens and mirror
 * lessons sub-dispatched on the Gegenstandsabstand-Bereich the runtime published); acoustics
 * frames all teach echo ranging, fluid frames the weighing method and thermal
 * frames split on whether a second sample is drawn (two-beaker heat-capacity
 * comparison vs the melting curve);
 * mechanics frames: a lever (two hangers drawn) teaches F₁l₁ = F₂l₂, otherwise
 * the scene title the template stamped (Durchschnittsgeschwindigkeit messen / Wurfbewegung / schiefe Ebene / Kraft und Bewegung). Unknown
 * frames return undefined and the drawer keeps Q&A.
 * @returns the tutor script.
 * @param context - the agent context.
 */
export const tutorScriptOf = (context: PhysicsAgentContext): TutorScript | undefined => {
  if (context.status === 'failed') return undefined
  if (context.domain === 'composite') {
    if (context.drawnIds.includes('spectrometer-deflection')) return spectrometerLesson(context)
    const gravity = context.derived.find(row => row.label === 'Betrag der Schwerkraft')
    if (gravity !== undefined && !/^0(\.0+)?$/.test(gravity.value)) return threeFieldLesson(context)
    if (context.verification.some(check => check.id === 'velocity_selection_condition')) {
      return velocitySelectorLesson(context)
    }
    return crossedFieldLesson(context)
  }
  if (context.domain === 'magnetic') return magneticLesson(context)
  if (context.domain === 'mechanics') {
    if (mechanicsTopicOf(context) === 'mechanics-lever') return leverBalanceLesson(context)
    if (mechanicsTopicOf(context) === 'mechanics-average-speed') return averageSpeedLesson(context)
    if (/Wurf/.test(context.sceneTitle)) return projectileLesson(context)
    if (/schiefe Ebene|geneigte Ebene|Rampe/.test(context.sceneTitle)) return inclineLesson(context)
    return forceMotionLesson(context)
  }
  if (context.domain === 'circuit') {
    const topic = circuitTopicOf(context)
    if (topic === 'circuit-emf') return circuitEmfLesson(context)
    if (topic === 'circuit-va') return circuitVaLesson(context)
    if (topic === 'circuit-bulb') return circuitBulbLesson(context)
    if (topic === 'circuit-rheostat') return circuitRheostatLesson(context)
    if (topic === 'circuit-parallel') return circuitParallelLesson(context)
    return circuitSeriesLesson(context)
  }
  if (context.domain === 'optics') {
    return context.optics?.elementKind === 'plane_mirror'
      ? planeMirrorLesson(context)
      : context.optics?.elementKind === 'curved_mirror'
        ? curvedMirrorLesson(context)
        : convexLensLesson(context)
  }
  if (context.domain === 'acoustics') return echoRangingLesson(context)
  if (context.domain === 'fluid') return buoyancyLesson(context)
  if (context.domain === 'thermal') {
    return context.drawnIds.includes('sample-2')
      ? heatCapacityLesson(context)
      : crystalMeltingLesson(context)
  }
  if (context.domain === 'induction') {
    /* The rod object only exists on the cutting rig — a fact, not a title. */
    return context.drawnIds.some(id => id.endsWith('.bar'))
      ? barMotionLesson(context)
      : fluxChangeLesson(context)
  }
  if (context.domain === 'wave') {
    /* Each wave rig draws a primitive the others never do: the marked particle,
       the sources, the nodes — so the lesson follows the canvas, not the title. */
    if (context.drawnIds.some(id => id.endsWith('.marker'))) return travellingWaveLesson(context)
    if (context.drawnIds.some(id => id.endsWith('.source-1'))) return waveInterferenceLesson(context)
    if (context.drawnIds.some(id => id.includes('.node.'))) return standingWaveLesson(context)
    return undefined
  }
  /* Composite, magnetic, mechanics, circuit, optics, acoustics, fluid,
     thermal, induction and wave returned above; electric remains. */
  return electricLesson(context)
}
