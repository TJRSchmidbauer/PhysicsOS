/**
 * Physics Agent answer bank (V1, deterministic).
 *
 * There is no model call in this build, so an "answer" is a lookup keyed by
 * intent. What matters architecturally is the SHAPE: every answer cites facts the
 * runtime already produced (scene revision, a named verification check, a derived
 * quantity) and may carry tool calls. When a real model is wired in, it replaces
 * `matchIntent` and keeps this citation + tool contract.
 *
 * An answer must never state a physical value it did not read from the context.
 */

import type { PhysicsAgentContext, PhysicsAgentToolCall } from './physics-agent.ts'

/**
 * The agent source chip shape used by the physics agent answers module.
 */
export interface AgentSourceChip {
  readonly kind: 'scene' | 'simulation' | 'verification' | 'question'
  readonly label: string
}

/**
 * The agent answer shape used by the physics agent answers module.
 */
export interface AgentAnswer {
  readonly question: string
  readonly paragraphs: readonly string[]
  readonly sources: readonly AgentSourceChip[]
  readonly tools: readonly PhysicsAgentToolCall[]
}

/** Suggested prompts, filtered to what the current scene can actually answer. */
export interface AgentSuggestion {
  readonly id: string
  readonly prompt: string
}

const chip = (kind: AgentSourceChip['kind'], label: string): AgentSourceChip => ({ kind, label })

const findCheck = (context: PhysicsAgentContext, id: string) =>
  context.verification.find(check => check.id === id)

const findDerived = (context: PhysicsAgentContext, label: string) =>
  context.derived.find(row => row.label.includes(label))

/**
 * Whether the electric frame is a uniform field driving a charged particle
 * (the kinematics model), as opposed to a static point-charge field. The
 * distinguishing signal is the verifier's `electric_kinematic_consistency`
 * check, which only the uniform-field path emits — the point-charge path
 * carries `electric_field_1_over_r2` instead. Reading it from the asserted
 * checks (not from `drawnIds` or sign inference) keeps the Agent honest: it
 * speaks about the model the runtime already verified.
 */
const isUniformElectricField = (context: PhysicsAgentContext): boolean =>
  context.domain === 'electric' &&
  context.verification.some(check => check.id === 'electric_kinematic_consistency')

/**
 * Whether the electric frame is a bounded (parallel-plate) field, as opposed to
 * an unbounded uniform field or a static point-charge field. The distinguishing
 * signal is the region engine's `bounded_field_geometry` check, which only the
 * parallel-plate path emits — the uniform-field path carries
 * `electric_kinematic_consistency` instead, and the point-charge path carries
 * `electric_field_1_over_r2`. Reading it from the asserted checks (not from
 * `drawnIds` or geometry inference) keeps the Agent honest: it speaks about the
 * model the runtime already verified.
 */
const isBoundedElectricField = (context: PhysicsAgentContext): boolean =>
  context.domain === 'electric' &&
  context.verification.some(check => check.id === 'bounded_field_geometry')

/**
 * Highlight target for a force-related bounded-field answer.
 *
 * The electric force vector is only drawn while the particle is INSIDE the field
 * region — outside it F = 0 and the bridge skips the zero-length arrow. The
 * trajectory, by contrast, is drawn from the whole simulation and is always
 * present. Falling back to it keeps the highlight honest (it points at something
 * the canvas actually draws) instead of failing with "not visible" in the
 * opening frame, where the particle has not yet reached the plates.
 */
const forceHighlightTarget = (context: PhysicsAgentContext): string =>
  context.drawnIds.includes('electric-force-vector')
    ? 'electric-force-vector'
    : 'electric-trajectory'

/**
 * Whether the particle is currently outside the field region, where the engine
 * asserts F = 0. Read from the published derived row rather than re-deriving the
 * geometry, so the Agent only ever repeats what the runtime already computed.
 * The row may be formatted as a scalar (`0`) or a vector (`(0.00, 0.00)`), so
 * every number it carries has to be zero for the force to count as absent.
 */
const outsideFieldRegion = (context: PhysicsAgentContext): boolean => {
  const force = context.derived.find(row => row.label.includes('Elektrische Kraft'))
  if (force === undefined) return false
  const numbers = force.value.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g)
  return numbers !== null && numbers.every(entry => Number.parseFloat(entry) === 0)
}

/** Whether the frame is a DC circuit — the only domain the circuit intents describe. */
const isCircuitFrame = (context: PhysicsAgentContext): boolean => context.domain === 'circuit'

/**
 * The circuit engine emits the terminal-voltage law as one check per source
 * (`terminal_voltage_law:<componentId>`), so the Agent looks it up by prefix —
 * the check IS the runtime's judgement that U = E − I·r holds for this source.
 */
const terminalVoltageLawCheck = (context: PhysicsAgentContext) =>
  context.verification.find(check => check.id.startsWith('terminal_voltage_law'))

/**
 * A component id that is actually drawn in the current circuit frame, for a
 * highlight tool call. Prefers the source, then a resistor, then any drawn
 * component, so the Agent never points at something the canvas is not drawing.
 */
const circuitComponentTarget = (
  context: PhysicsAgentContext,
  preferredPrefix?: string,
): string => {
  const components = context.drawnIds
  if (preferredPrefix !== undefined) {
    const preferred = components.find(id => id.startsWith(preferredPrefix))
    if (preferred !== undefined) return preferred
  }
  const source = components.find(id => /^(bat|source|src|emf)/i.test(id))
  if (source !== undefined) return source
  const resistor = components.find(id => /^r\d*$/i.test(id))
  if (resistor !== undefined) return resistor
  return components[0] ?? 'bat'
}

/** Whether an ammeter or voltmeter symbol is drawn on the schematic. */
const hasMeter = (context: PhysicsAgentContext): boolean =>
  context.drawnIds.some(id => /^(am|vm)|meter/.test(id))

interface Intent {
  readonly id: string
  readonly prompt: string
  /** Whether this scene can answer it at all, so the Drawer never offers a dead end. */
  readonly available: (context: PhysicsAgentContext) => boolean
  readonly answer: (context: PhysicsAgentContext) => AgentAnswer
}

/** True for a crossed-field frame — the only domain the composite intents describe. */
const isCompositeFrame = (context: PhysicsAgentContext): boolean => context.domain === 'composite'

/**
 * The composite verifier's selection-condition check, when this frame has one.
 *
 * Read from the published verification rows rather than compared against E/B by
 * the Agent: the check IS the runtime's judgement, and an Agent that recomputed it
 * would be a second physics implementation free to disagree with the canvas.
 */
const selectionCheckOf = (context: PhysicsAgentContext) =>
  context.verification.find(check => check.id === 'velocity_selection_condition')

/**
 * Whether the apparatus declares a region of the given role.
 *
 * Region ids come from the scene (`spectrometer-deflection`, `selector-region-1`,
 * `multi-region-magnetic`, …) and reach the Agent through `drawnIds`, so this asks
 * what the canvas is actually drawing rather than guessing from the domain.
 */
const hasRegion = (context: PhysicsAgentContext, role: 'deflection' | 'selector' | 'any'): boolean => {
  const ids = context.drawnIds
  if (role === 'any') {
    return ids.some(id => /region|spectrometer|selector/i.test(id))
  }
  if (role === 'deflection') {
    return ids.some(id => /deflection|multi-region-magnetic/i.test(id))
  }
  return ids.some(id => /selector/i.test(id))
}

const INTENTS: readonly Intent[] = [
  {
    id: 'horizontal-velocity',
    prompt: 'Wo ist die horizontale Geschwindigkeit? Warum bleibt sie konstant?',
    available: context =>
      context.drawnIds.includes('velocity') && context.domain === 'mechanics',
    answer: (context) => {
      const check = findCheck(context, 'horizontal_velocity_constant')
      const paragraphs = [
        'In horizontaler Richtung wirkt keine Kraft, daher bleibt die horizontale Geschwindigkeitskomponente vₓ während des gesamten Fluges konstant; in vertikaler Richtung führt die Schwerkraft zu einer gleichmäßigen Beschleunigung, die beiden Richtungen beeinflussen sich nicht.',
      ]
      if (check === undefined) {
        paragraphs.push('Das aktuelle Szenario trifft keine explizite Aussage dazu, daher wird hier nur eine modellbasierte Erklärung gegeben.')
      } else {
        paragraphs.push(
          `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf den bereits verifizierten Simulationsergebnissen und wird nicht neu berechnet.`,
        )
      }
      return {
        question: 'Wo ist die horizontale Geschwindigkeit? Warum bleibt sie konstant?',
        paragraphs,
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        /* Point at the component, and turn its layer on first if needed. */
        tools: [{ tool: 'physics.ui.highlight', targetId: 'horizontal-velocity', duration: 1800 }],
      }
    },
  },
  {
    id: 'normal-force-direction',
    prompt: 'Warum wirkt die Normalkraft in dieser Richtung?',
    available: context => context.drawnIds.includes('force-normal'),
    answer: (context) => {
      const check = findCheck(context, 'normal_force')
      const normal = findDerived(context, 'Normalkraft')
      return {
        question: 'Warum wirkt die Normalkraft in dieser Richtung?',
        paragraphs: [
          'Die Normalkraft wirkt senkrecht zur Kontaktfläche nach außen, da sie die Gegenreaktion auf den Druck des Körpers gegen die schiefe Ebene ist. Sie kompensiert nur die Komponente der Schwerkraft senkrecht zur schiefen Ebene (mg·cosθ) und trägt nicht zur Bewegung entlang der Ebene bei.',
          normal === undefined
            ? 'Das aktuelle Szenario gibt keinen Zahlenwert für die Normalkraft an.'
            : `Die Engine gibt N = ${normal.value} ${normal.unit} an, was mit mg·cosθ übereinstimmt.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'normal-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'height-meaning',
    prompt: 'Was ist diese Höhe?',
    available: context => context.drawnIds.includes('launch-height'),
    answer: (context) => {
      const flight = findDerived(context, 'Flugzeit')
      return {
        question: 'Was ist diese Höhe?',
        paragraphs: [
          'Dies ist der vertikale Abstand h zwischen dem Abwurfpunkt und dem Boden. Er bestimmt nur die vertikale Bewegung: Die Fallzeit hängt von h und g ab, nicht von der horizontalen Anfangsgeschwindigkeit.',
          flight === undefined
            ? 'Das aktuelle Szenario gibt keine Flugzeit an.'
            : `Die daraus resultierende Flugzeit beträgt ${flight.value} ${flight.unit}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'height-dimension', duration: 1800 }],
      }
    },
  },
  {
    id: 'apex-height',
    prompt: 'Wie hoch ist der höchste Punkt?',
    available: context => context.drawnIds.includes('apex'),
    answer: (context) => {
      const apex = findDerived(context, 'Maximale Höhe')
      return {
        question: 'Wie hoch ist der höchste Punkt?',
        paragraphs: [
          'Der höchste Punkt ist der Punkt, an dem die vertikale Geschwindigkeit auf null reduziert wird. Seine Höhe wird durch v_y²/(2g) bestimmt und hängt nicht von der gleichförmigen horizontalen Bewegung ab.',
          apex === undefined
            ? 'Der aktuelle Schnappschuss gibt keinen Wert für die maximale Höhe an.'
            : `Die Engine gibt die maximale Höhe als ${apex.value} ${apex.unit} an; die Markierung „höchster Punkt“ auf der Leinwand entspricht genau dieser Position.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'apex', duration: 1800 }],
      }
    },
  },
  {
    id: 'set-incline-45',
    prompt: 'Ändere den Neigungswinkel auf 45°',
    available: context =>
      context.drawnIds.includes('incline-angle') ||
      context.drawnIds.includes('force-normal'),
    answer: context => ({
      question: 'Ändere den Neigungswinkel auf 45°',
      paragraphs: [
        'Der Neigungswinkel wurde auf 45° geändert. Mit zunehmendem Neigungswinkel nimmt mg·sinθ zu und mg·cosθ ab, wodurch die Beschleunigung entlang der schiefen Ebene größer und die Normalkraft kleiner wird.',
        'Diese Änderung ist identisch mit einer manuellen Eingabe im Eigenschaftsfenster: Sie durchläuft dieselbe Szenenbefehls- und Verifikationskette, sodass die Szenarioversion um +1 erhöht wird.',
      ],
      sources: [
        chip('scene', `Szenario Rev. ${context.sceneRevision}`),
        chip('simulation', 'Neu simuliert und verifiziert nach Änderung'),
      ],
      tools: [
        { tool: 'physics.scene.setParameter', parameterId: 'angle', value: 45 },
        { tool: 'physics.ui.highlight', targetId: 'incline-angle', duration: 1800 },
      ],
    }),
  },
  {
    id: 'lorentz-no-work',
    prompt: 'Warum verrichtet die Lorentzkraft keine Arbeit?',
    available: context => context.domain === 'magnetic',
    answer: (context) => {
      const check =
        findCheck(context, 'speed_conserved') ?? findCheck(context, 'lorentz_force_centripetal')
      return {
        question: 'Warum verrichtet die Lorentzkraft keine Arbeit?',
        paragraphs: [
          'Die Lorentzkraft steht stets senkrecht zur Geschwindigkeit. Da Arbeit das Produkt aus der Komponente der Kraft in Verschiebungsrichtung und der Verschiebung ist, trägt die senkrecht stehende Komponente nichts bei – die verrichtete Arbeit ist null und die Geschwindigkeit bleibt konstant.',
          check === undefined
            ? 'Das aktuelle Szenario trifft keine explizite Aussage zur Erhaltung der Geschwindigkeit.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'velocity', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-field-magnitude',
    prompt: 'Woher kommt diese elektrische Feldstärke?',
    available: context =>
      context.domain === 'electric' && context.drawnIds.includes('electric-field-vector'),
    answer: (context) => {
      const field = findDerived(context, 'Elektrische Feldstärke')
      const uniform = isUniformElectricField(context)
      /* In a uniform field the constant E is a given, not a Coulomb-law result;
         the honest check is F=qE (electric_force_consistency), not 1/r². The
         point-charge path keeps its Coulomb-law explanation + 1/r² check. */
      const uniformCheck = findCheck(context, 'electric_force_consistency')
      const pointCheck = findCheck(context, 'electric_field_1_over_r2')
      const check = uniform ? uniformCheck : pointCheck
      const explanation = uniform
        ? 'In einem homogenen elektrischen Feld ist die Feldstärke E an allen Punkten gleich groß und gleich gerichtet. E ist ein vorgegebener konstanter Wert und nicht das Ergebnis einer einzelnen Punktladung – hier werden lediglich die von der Engine bereits behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.'
        : 'Das Feld einer Punktladung wird durch das Coulombsche Gesetz E = k·q/r² beschrieben, mit radialer Ausrichtung: Von einer positiven Ladung nach außen, zu einer negativen Ladung hin. Hier werden lediglich die von der Engine bereits behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.'
      return {
        question: 'Woher kommt diese elektrische Feldstärke?',
        paragraphs: [
          explanation,
          field === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die elektrische Feldstärke an.'
            : `Die Engine gibt E = ${field.value} ${field.unit} an.`,
          check === undefined
            ? (uniform ? 'Das aktuelle Szenario trifft keine Aussage zur Beziehung zwischen elektrischer Kraft und Feldstärke.' : 'Das aktuelle Szenario trifft keine Aussage zur 1/r²-Abhängigkeit.')
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(field === undefined ? [] : [chip('simulation', `E = ${field.value} ${field.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-field-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-force-magnitude',
    prompt: 'Wie groß ist die elektrische Kraft auf die Testladung?',
    available: context =>
      context.domain === 'electric' && context.drawnIds.includes('electric-force-vector'),
    answer: (context) => {
      const force = findDerived(context, 'Elektrische Kraft')
      const field = findDerived(context, 'Elektrische Feldstärke')
      const uniform = isUniformElectricField(context)
      /* Point-charge frames carry electric_force_qE; uniform-field frames carry
         electric_force_consistency. Fall back across both so the answer cites the
         check the runtime actually asserted for this model. */
      const check = findCheck(context, 'electric_force_qE') ?? findCheck(context, 'electric_force_consistency')
      const forceClause = uniform
        ? 'Die elektrische Kraft ergibt sich aus F = q·E: Sie ist das Produkt aus der konstanten Feldstärke am Ort des Teilchens und seiner Ladung. Die Richtung ergibt sich aus dem Vorzeichen der Ladung relativ zur Feldrichtung.'
        : 'Die elektrische Kraft ergibt sich aus F = q·E: Sie ist das Produkt aus der Feldstärke am Ort der Testladung und der Testladung. Die Richtung ergibt sich aus dem Vorzeichen der Ladung relativ zur Feldrichtung.'
      return {
        question: 'Wie groß ist die elektrische Kraft auf die Testladung?',
        paragraphs: [
          forceClause,
          force === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die elektrische Kraft an.'
            : `Die Engine gibt F = ${force.value} ${force.unit} an.`,
          field === undefined ? '' : `Dieser Wert basiert auf dem bereits angegebenen E = ${field.value} ${field.unit} und wird nicht neu berechnet.`,
          check === undefined
            ? ''
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ].filter(paragraph => paragraph !== ''),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(force === undefined ? [] : [chip('simulation', `F = ${force.value} ${force.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-force-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-field-direction',
    prompt: 'In welche Richtung zeigt das elektrische Feld?',
    available: context =>
      context.domain === 'electric' && context.drawnIds.some(id => id.startsWith('source-')),
    answer: (context) => {
      const check = findCheck(context, 'electric_field_direction')
      /* Multi-source: there is no single radial direction. The verifier skips the
         single-direction check (status not 'failed', often absent or marked
         skipped) and the honest answer names the combined field's streamlines. */
      const multiSource = (context.chargeSigns?.length ?? 0) >= 2
      const positive = context.chargeSign === 'positive'
      const negative = context.chargeSign === 'negative'
      const directionClause = multiSource
        ? 'Bei mehreren Punktladungen gibt es keine einheitliche Richtung: An jedem Punkt ist die Feldrichtung die Resultierende der Vektorsumme der Felder aller Quellen. Die Feldlinien folgen dieser resultierenden Richtung und sind der Stromlinienkarte zu entnehmen.'
        : positive
          ? 'Das Feld einer positiven Punktladung ist radial nach außen gerichtet (divergierend): Die Feldlinien verlaufen von der Ladung weg.'
          : negative
            ? 'Das Feld einer negativen Punktladung ist radial nach innen gerichtet (konvergierend): Die Feldlinien verlaufen auf die Ladung zu.'
            : 'Das elektrische Feld ist radial gerichtet: Von positiven Ladungen nach außen, zu negativen Ladungen hin. Da das Vorzeichen der Quellladung im aktuellen Szenario nicht angegeben ist, wird hier nur die allgemeine Regel beschrieben.'
      return {
        question: 'In welche Richtung zeigt das elektrische Feld?',
        paragraphs: [
          directionClause,
          check === undefined
            ? (multiSource ? 'Bei einem Feld aus mehreren Quellen wird keine einzelne Richtungsüberprüfung vorgenommen; die Richtung ergibt sich aus der Überlagerung der Feldlinien.' : 'Das aktuelle Szenario trifft keine Aussage zur Richtung des elektrischen Feldes.')
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: multiSource ? 'field-line' : 'charge-source', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-field-line-origin',
    prompt: 'Warum verlaufen elektrische Feldlinien von positiven Ladungen aus?',
    available: context =>
      context.domain === 'electric' &&
      context.drawnIds.some(id => id.startsWith('stream-')),
    answer: (context) => {
      const directionCheck = findCheck(context, 'electric_field_direction')
      const signs = context.chargeSigns
      const hasPositive = signs?.includes('positive') ?? false
      const hasNegative = signs?.includes('negative') ?? false
      const signClause = hasPositive && hasNegative
        ? 'Im aktuellen Szenario sind sowohl positive als auch negative Quellladungen vorhanden: Feldlinien beginnen an positiven Ladungen, enden an negativen Ladungen (oder erstrecken sich ins Unendliche), und ihre Tangente folgt an jedem Punkt der Richtung des resultierenden Feldes.'
        : hasPositive
          ? 'Die Quellladung ist positiv, daher verlaufen die Feldlinien radial von ihr nach außen.'
          : hasNegative
            ? 'Die Quellladung ist negativ, daher verlaufen die Feldlinien von außen auf sie zu.'
            : 'Gemäß der Konvention beginnen elektrische Feldlinien an positiven Ladungen und enden an negativen Ladungen – positive Ladungen sind Quellen, negative Ladungen sind Senken. Da die Vorzeichen der Quellen im aktuellen Szenario nicht angegeben sind, wird hier nur die allgemeine Regel beschrieben.'
      return {
        question: 'Warum verlaufen elektrische Feldlinien von positiven Ladungen aus?',
        paragraphs: [
          signClause,
          'Dies ist eine konventionelle Definition: An jedem Punkt einer Feldlinie entspricht deren Tangente der Richtung des elektrischen Feldes. Da das Feld einer positiven Ladung nach außen gerichtet ist, verlaufen die Linien von ihr weg; da das Feld einer negativen Ladung auf sie zu gerichtet ist, münden die Linien in ihr. Hier wird ausschließlich die von der Engine bereits überprüfte Richtungsinformation wiedergegeben, nicht neu berechnet.',
          directionCheck === undefined
            ? 'Für ein Feld aus mehreren Quellen wird keine einzelne Richtungsüberprüfung vorgenommen; die Richtung ergibt sich aus den resultierenden Feldlinien.'
            : `Die Überprüfung „${directionCheck.label}“ durch die Engine ist ${directionCheck.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(signs === undefined ? [] : [chip('scene', signs.map(s => (s === 'positive' ? 'pos.' : s === 'negative' ? 'neg.' : 'neutral')).join(', '))]),
          ...(directionCheck === undefined ? [] : [chip('verification', directionCheck.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'field-line', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-superposition',
    prompt: 'Wie entsteht das resultierende Feld?',
    available: context =>
      context.domain === 'electric' &&
      ((context.chargeSigns?.length ?? 0) >= 2 ||
        context.drawnIds.filter(id => id.startsWith('source-')).length >= 2),
    answer: (context) => {
      const check = findCheck(context, 'electric_field_superposition')
      const field = findDerived(context, 'Elektrische Feldstärke')
      const sourceCount = context.chargeSigns?.length ??
        context.drawnIds.filter(id => id.startsWith('source-')).length
      return {
        question: 'Wie entsteht das resultierende Feld?',
        paragraphs: [
          `${sourceCount} Punktladung(en) erzeugen jeweils ein elektrisches Feld nach dem Coulombschen Gesetz Eᵢ = k·qᵢ/rᵢ². Das resultierende Feld ist die Vektorsumme aller Einzelquellen: E = Σ Eᵢ. An jedem Punkt werden die Feldvektoren aller Quellen addiert.`,
          'Bei der Überlagerung ist sowohl Betrag als auch Richtung zu berücksichtigen: Bei zwei gleich großen gleichnamigen Ladungen hebt sich das Feld im Symmetriezentrum auf; bei zwei gleich großen entgegengesetzten Ladungen addieren sich die Felder im Zentrum in dieselbe Richtung.',
          field === undefined ? '' : `Die Engine gibt das resultierende Feld als E = ${field.value} ${field.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Superposition.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen und wird nicht neu berechnet.`,
        ].filter(paragraph => paragraph !== ''),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(field === undefined ? [] : [chip('simulation', `E = ${field.value} ${field.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [
          { tool: 'physics.ui.highlight', targetId: 'field-line', duration: 1800 },
        ],
      }
    },
  },
  /* ── Uniform-field dynamics intents ────────────────────────────────────────
     The four intents below only apply to the uniform-electric-field kinematics
     model (a charged particle deflected by a constant E), never to the static
     point-charge field. `isUniformElectricField` gates them on the verifier's
     `electric_kinematic_consistency` check, so they cannot fire in a point-charge
     frame (which carries `electric_field_1_over_r2` instead). Each cites the
     verifier check that actually asserts the physics it describes, plus the
     derived quantity the runtime already published. */
  {
    id: 'electric-acceleration-constant',
    prompt: 'Warum ist die Beschleunigung konstant?',
    available: context =>
      isUniformElectricField(context) && context.drawnIds.includes('electric-acceleration-vector'),
    answer: (context) => {
      const check = findCheck(context, 'electric_acceleration_consistency')
      const accel = findDerived(context, 'Beschleunigung')
      return {
        question: 'Warum ist die Beschleunigung konstant?',
        paragraphs: [
          'In einem homogenen elektrischen Feld ist E konstant, daher ist auch die elektrische Kraft F = q·E konstant. Nach dem zweiten Newtonschen Gesetz gilt a = F/m = q·E/m, sodass auch die Beschleunigung konstant ist – dies ist die Grundlage für die gleichmäßig beschleunigte Bewegung des Teilchens. Hier werden ausschließlich die bereits von der Engine behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.',
          accel === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die Beschleunigung an.'
            : `Die Engine gibt a = ${accel.value} ${accel.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Beschleunigung.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(accel === undefined ? [] : [chip('simulation', `a = ${accel.value} ${accel.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-acceleration-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-trajectory-shape',
    prompt: 'Warum ist die Bahn eine Parabel?',
    available: context =>
      isUniformElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'electric_kinematic_consistency')
      const displacement = findDerived(context, 'Verschiebung')
      /* The IR carries velocity_perpendicular_E / velocity_parallel_E, but the
         Agent context does not expose relations. The honest, model-level answer
         covers both cases without claiming a specific initial-velocity
         orientation the runtime did not surface to the Agent. */
      return {
        question: 'Warum ist die Bahn eine Parabel?',
        paragraphs: [
          'In einem homogenen elektrischen Feld ist die Beschleunigung konstant, und die Bewegung erfüllt r = r₀ + v₀·t + ½·a·t². Wenn die Anfangsgeschwindigkeit nicht parallel zur Feldrichtung ist, wird die senkrechte Komponente gleichmäßig beschleunigt und die parallele Komponente bleibt gleichförmig, sodass die zusammengesetzte Bahn eine Parabel ist. Wenn die Anfangsgeschwindigkeit parallel zum Feld verläuft, entartet die Bahn zu einer gleichmäßig beschleunigten Geraden. Hier werden ausschließlich die von der Engine bereits behaupteten zustandsweisen kinematischen Ergebnisse wiedergegeben, nicht neu berechnet.',
          displacement === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die Verschiebung an.'
            : `Die Engine gibt die Verschiebung als Δr = ${displacement.value} ${displacement.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(displacement === undefined ? [] : [chip('simulation', `Δr = ${displacement.value} ${displacement.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-trajectory', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-work-energy',
    prompt: 'In welchem Verhältnis stehen die Arbeit der elektrischen Kraft und der Arbeitssatz?',
    available: context =>
      isUniformElectricField(context) && context.drawnIds.includes('electric-force-vector'),
    answer: (context) => {
      const check = findCheck(context, 'electric_energy_consistency')
      const work = findDerived(context, 'Arbeit der elektrischen Kraft')
      const kineticChange = findDerived(context, 'Änderung der kinetischen Energie')
      return {
        question: 'In welchem Verhältnis stehen die Arbeit der elektrischen Kraft und der Arbeitssatz?',
        paragraphs: [
          'Die von der elektrischen Kraft am Teilchen verrichtete Arbeit W = F·Δr ist gleich der Änderung seiner kinetischen Energie ΔK und gleich dem negativen Wert der Änderung der potentiellen Energie -ΔU – dies ist die Ausprägung der Energieerhaltung im elektrischen Feld. Hier werden ausschließlich die bereits von der Engine behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.',
          work === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die von der elektrischen Kraft verrichtete Arbeit an.'
            : `Die Engine gibt W = ${work.value} ${work.unit} an.`,
          kineticChange === undefined
            ? ''
            : `Die entsprechende Änderung der kinetischen Energie beträgt ΔK = ${kineticChange.value} ${kineticChange.unit}.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Energie.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ].filter(paragraph => paragraph !== ''),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(work === undefined ? [] : [chip('simulation', `W = ${work.value} ${work.unit}`)]),
          ...(kineticChange === undefined ? [] : [chip('simulation', `ΔK = ${kineticChange.value} ${kineticChange.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-force-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'electric-velocity-evolution',
    prompt: 'Wie ergibt sich die Endgeschwindigkeit?',
    available: context =>
      isUniformElectricField(context) && context.drawnIds.includes('electric-velocity-vector'),
    answer: (context) => {
      const check = findCheck(context, 'electric_kinematic_consistency')
      const speed = findDerived(context, 'Geschwindigkeitsbetrag')
      return {
        question: 'Wie ergibt sich die Endgeschwindigkeit?',
        paragraphs: [
          'In einem homogenen elektrischen Feld ist die Beschleunigung konstant, und die Endgeschwindigkeit erfüllt v = v₀ + a·t: Die Komponente der Anfangsgeschwindigkeit parallel zum Feld wird gleichmäßig verändert, während die senkrechte Komponente konstant bleibt; der Betrag der resultierenden Geschwindigkeit wird von der Engine Zustand für Zustand berechnet. Hier werden ausschließlich die bereits von der Engine behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.',
          speed === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die Endgeschwindigkeit an.'
            : `Die Engine gibt den Betrag der Endgeschwindigkeit als |v| = ${speed.value} ${speed.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Bewegung.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(speed === undefined ? [] : [chip('simulation', `|v| = ${speed.value} ${speed.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-velocity-vector', duration: 1800 }],
      }
    },
  },
  /* ── Bounded-field (parallel-plate) intents ─────────────────────────────────
     The ten intents below only apply to the parallel-plate (bounded uniform
     field) model: a charged particle enters a rectangular field region between
     two plates, is deflected inside, then exits or strikes a plate.
     `isBoundedElectricField` gates them on the region engine's
     `bounded_field_geometry` check, so they cannot fire in an unbounded uniform
     field (which carries `electric_kinematic_consistency`) or a point-charge
     frame (which carries `electric_field_1_over_r2`). Each cites the region
     engine's checks and derived quantities the runtime already published. */
  {
    id: 'bounded-field-enter',
    prompt: 'Warum wird das Teilchen nach dem Eintritt in das Feld abgelenkt?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'kinematic_consistency')
      const force = findDerived(context, 'Elektrische Kraft')
      const outside = outsideFieldRegion(context)
      return {
        question: 'Warum wird das Teilchen nach dem Eintritt in das Feld abgelenkt?',
        paragraphs: [
          'Nach dem Eintritt in das begrenzte homogene elektrische Feld zwischen den Platten wirkt auf das Teilchen die elektrische Kraft F = q·E. Da nach dem zweiten Newtonschen Gesetz a = q·E/m gilt und die Beschleunigung konstant sowie nicht parallel zur Anfangsgeschwindigkeit ist (es sei denn, die Anfangsgeschwindigkeit verläuft genau parallel zum Feld), wird die Bahn abgelenkt – im Bereich liegt ein parabelförmiger Wurf vor. Hier werden ausschließlich die bereits von der Engine behaupteten Ergebnisse wiedergegeben, nicht neu berechnet.',
          force === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die elektrische Kraft an.'
            : outside
              ? `Zum aktuellen Zeitpunkt befindet sich das Teilchen noch außerhalb der Platten. Die Engine gibt F = ${force.value} ${force.unit} an – das begrenzte Feld existiert nur zwischen den Platten, daher wirkt hier keine Kraft; erst nach dem Eintritt zwischen die Platten beginnt F = q·E zu wirken und die Ablenkung zu verursachen.`
              : `Die Engine gibt F = ${force.value} ${force.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(force === undefined ? [] : [chip('simulation', `F = ${force.value} ${force.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: forceHighlightTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'bounded-field-exit',
    prompt: 'Warum ist die Bewegung nach dem Verlassen des Feldes gleichförmig?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-velocity-vector'),
    answer: (context) => {
      const check = findCheck(context, 'kinematic_consistency')
      const speed = findDerived(context, 'Geschwindigkeitsbetrag')
      return {
        question: 'Warum ist die Bewegung nach dem Verlassen des Feldes gleichförmig?',
        paragraphs: [
          'Nach dem Verlassen des Bereichs zwischen den Platten wirkt keine elektrische Kraft mehr auf das Teilchen (begrenztes Feld: Das Feld existiert nur im rechteckigen Bereich zwischen den Platten), die resultierende Kraft ist null und damit auch die Beschleunigung. Nach dem ersten Newtonschen Gesetz bewegt sich das Teilchen mit der Geschwindigkeit beim Verlassen des Feldbereichs geradlinig gleichförmig weiter. Innerhalb des Bereichs ist a = q·E/m konstant, außerhalb gilt a = 0 – hier werden ausschließlich die bereits von der Engine behaupteten kinematischen Ergebnisse wiedergegeben, nicht neu berechnet.',
          speed === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für den Geschwindigkeitsbetrag an.'
            : `Die Engine gibt den Geschwindigkeitsbetrag |v| = ${speed.value} ${speed.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(speed === undefined ? [] : [chip('simulation', `|v| = ${speed.value} ${speed.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-velocity-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-deflection-direction',
    prompt: 'Warum wird das Elektron nach oben abgelenkt?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'electric_force_consistency')
      const force = findDerived(context, 'Elektrische Kraft')
      const outside = outsideFieldRegion(context)
      return {
        question: 'Warum wird das Elektron nach oben abgelenkt?',
        paragraphs: [
          'Die Ablenkungsrichtung wird durch die Richtung der elektrischen Kraft F = q·E bestimmt. Ist die Ladung des Teilchens negativ (wie bei einem Elektron, q < 0) und zeigt das elektrische Feld nach unten, so ist F = q·E dem Feld entgegengesetzt, also nach oben gerichtet, und das Teilchen wird nach oben abgelenkt. Allgemeine Regel: Positive Ladungen werden in Feldrichtung abgelenkt, negative Ladungen entgegen der Feldrichtung. Hier wird ausschließlich die von der Engine bereits überprüfte Beziehung F = q·E wiedergegeben, nicht neu berechnet.',
          force === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die elektrische Kraft an.'
            : outside
              ? `Zum aktuellen Zeitpunkt befindet sich das Teilchen noch außerhalb der Platten. Die Engine gibt F = ${force.value} ${force.unit} an – außerhalb der Platten existiert kein Feld, daher wirkt keine Kraft; die Ablenkung findet zwischen den Platten statt.`
              : `Die Engine gibt F = ${force.value} ${force.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Beziehung der elektrischen Kraft.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(force === undefined ? [] : [chip('simulation', `F = ${force.value} ${force.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: forceHighlightTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-deflection-formula',
    prompt: 'Wie berechnet man die Ablenkungsstrecke?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'kinematic_consistency')
      const deflection = findDerived(context, 'Ablenkungsverschiebung')
      return {
        question: 'Wie berechnet man die Ablenkungsstrecke?',
        paragraphs: [
          'Die Ablenkungsstrecke beträgt y = ½·a·t², wobei a = q·E/m die Beschleunigung zwischen den Platten und t = L/vx die Zeit ist, die das Teilchen zum Durchqueren benötigt (L ist die Plattenlänge, vx die horizontale Anfangsgeschwindigkeit). Nach Einsetzen von a und t ergibt sich y = q·E·L²/(2·m·vx²). Hier werden ausschließlich die bereits von der Engine behaupteten kinematischen Ergebnisse und die Ablenkungsverschiebung wiedergegeben, nicht neu berechnet.',
          deflection === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die Ablenkungsverschiebung an.'
            : `Die Engine gibt die Ablenkungsverschiebung y = ${deflection.value} ${deflection.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(deflection === undefined ? [] : [chip('simulation', `y = ${deflection.value} ${deflection.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-trajectory', duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-hit-time',
    prompt: 'Wie bestimmt man den Zeitpunkt des Plattenaufpralls?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'events_present')
      /* The Agent context does not expose the event list, so the answer stays at
         the model level (how the hit time is derived) and cites the region
         engine's `events_present` check, which asserts the trajectory produced
         the enter/exit/hit events at all. It never claims a specific hit time. */
      return {
        question: 'Wie berechnet man die Zeit bis zum Auftreffen auf die Platte?',
        paragraphs: [
          'Die Auftreffzeit auf die Platte wird durch die gleichmäßig beschleunigte Bewegung in vertikaler Richtung bestimmt: Das Teilchen bewegt sich zwischen den Platten gemäß y = ½·a·t² (a = q·E/m) gleichmäßig beschleunigt. Erreicht y den halben Plattenabstand d/2, trifft es auf die Platte, und man erhält t = √(d/a) = √(m·d/(q·E)). Gleichzeitig bewegt es sich horizontal gleichförmig, sodass die tatsächliche Auftreffposition durch beide Bewegungsrichtungen bestimmt wird. Hier wird ausschließlich die von der Engine bereits behauptete Ereignisüberprüfung wiedergegeben, nicht neu berechnet.',
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Ereigniserzeugung.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-trajectory', duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-velocity-exit',
    prompt: 'Wie groß ist die Austrittsgeschwindigkeit?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-velocity-vector'),
    answer: (context) => {
      const check = findCheck(context, 'kinematic_consistency')
      const exitVelocity = findDerived(context, 'Austrittsgeschwindigkeit')
      const speed = findDerived(context, 'Geschwindigkeitsbetrag')
      return {
        question: 'Wie groß ist die Austrittsgeschwindigkeit?',
        paragraphs: [
          'Die Geschwindigkeit des Teilchens beim Verlassen des Feldbereichs setzt sich aus einer horizontalen und einer vertikalen Komponente zusammen: Die horizontale Komponente vx bleibt unverändert (im Bereich wirkt keine horizontale Kraft), während die vertikale Komponente vy = a·t = q·E·L/(m·vx) im Feldbereich gleichmäßig beschleunigt zunimmt. Nach dem Verlassen des Feldbereichs ändern sich beide Komponenten nicht mehr. Der Betrag der resultierenden Geschwindigkeit ist |v| = √(vx² + vy²). Hier werden ausschließlich die bereits von der Engine behaupteten kinematischen Ergebnisse wiedergegeben, nicht neu berechnet.',
          exitVelocity === undefined
            ? speed === undefined
              ? 'Das aktuelle Szenario gibt keinen Wert für die Austrittsgeschwindigkeit an.'
              : `Die Engine gibt den Geschwindigkeitsbetrag |v| = ${speed.value} ${speed.unit} an.`
            : `Die Engine gibt die Austrittsgeschwindigkeit v = ${exitVelocity.value} ${exitVelocity.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(exitVelocity === undefined ? [] : [chip('simulation', `v = ${exitVelocity.value} ${exitVelocity.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-velocity-vector', duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-energy',
    prompt: 'Zusammenhang zwischen der Arbeit der elektrischen Kraft und der kinetischen Energie?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'energy_consistency')
      const work = findDerived(context, 'Arbeit der elektrischen Kraft')
      const kineticChange = findDerived(context, 'Änderung der kinetischen Energie')
      const outside = outsideFieldRegion(context)
      return {
        question: 'Zusammenhang zwischen der Arbeit der elektrischen Kraft und der kinetischen Energie?',
        paragraphs: [
          'Im begrenzten Feld zwischen den Platten verrichtet die elektrische Kraft am Teilchen die Arbeit W = F·Δr = q·E·y (wobei y die Ablenkungsverschiebung ist), die gleich der Änderung der kinetischen Energie ΔK und gleich dem negativen Wert der Änderung der potentiellen Energie -ΔU ist. Nach dem Verlassen des Feldbereichs verrichtet die elektrische Kraft keine Arbeit mehr, und die kinetische Energie ändert sich nicht mehr. Hier wird ausschließlich die von der Engine bereits überprüfte Konsistenz der Energie wiedergegeben, nicht neu berechnet.',
          work === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die von der elektrischen Kraft verrichtete Arbeit an.'
            : outside
              ? `Zum aktuellen Zeitpunkt befindet sich das Teilchen noch außerhalb der Platten. Die Engine gibt W = ${work.value} ${work.unit} an – außerhalb der Platten wirkt keine Kraft, daher wird keine Arbeit verrichtet; die Arbeit wird zwischen den Platten verrichtet.`
              : `Die Engine gibt W = ${work.value} ${work.unit} an.`,
          kineticChange === undefined
            ? ''
            : `Die entsprechende Änderung der kinetischen Energie beträgt ΔK = ${kineticChange.value} ${kineticChange.unit}.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Energie.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ].filter(paragraph => paragraph !== ''),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(work === undefined ? [] : [chip('simulation', `W = ${work.value} ${work.unit}`)]),
          ...(kineticChange === undefined ? [] : [chip('simulation', `ΔK = ${kineticChange.value} ${kineticChange.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: forceHighlightTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-trajectory-parabola',
    prompt: 'Warum ist die Bahn im Bereich eine Parabel?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.includes('electric-trajectory'),
    answer: (context) => {
      const check = findCheck(context, 'kinematic_consistency')
      const displacement = findDerived(context, 'Verschiebung')
      const deflection = findDerived(context, 'Ablenkungsverschiebung')
      return {
        question: 'Warum ist die Bahn im Bereich eine Parabel?',
        paragraphs: [
          'Im begrenzten homogenen elektrischen Feld zwischen den Platten wirkt in horizontaler Richtung keine Kraft (gleichförmige Bewegung, vx konstant), während in vertikaler Richtung eine konstante elektrische Kraft wirkt (gleichmäßig beschleunigt, a = q·E/m). Die Überlagerung zweier unabhängiger Bewegungsrichtungen – horizontal gleichförmig + vertikal gleichmäßig beschleunigt – ergibt als resultierende Bahn eine Parabel, analog zum waagerechten Wurf im Schwerefeld. Hier werden ausschließlich die bereits von der Engine behaupteten, Zustand für Zustand ermittelten kinematischen Ergebnisse wiedergegeben, nicht neu berechnet.',
          displacement === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die Verschiebung an.'
            : `Die Engine gibt die Verschiebung Δr = ${displacement.value} ${displacement.unit} an.`,
          deflection === undefined
            ? ''
            : `Dabei beträgt die Ablenkungsverschiebung y = ${deflection.value} ${deflection.unit}.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Konsistenz der Kinematik.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ].filter(paragraph => paragraph !== ''),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(displacement === undefined ? [] : [chip('simulation', `Δr = ${displacement.value} ${displacement.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-trajectory', duration: 1800 }],
      }
    },
  },
  {
    id: 'plate-field-uniform',
    prompt: 'Warum ist das Feld zwischen den Platten homogen?',
    /* Offered wherever the bounded field exists, not only where the E arrow is
       drawn: at t = 0 the particle is still outside the plates, the engine
       zeroes the field there, and the bridge (rightly) draws no phantom E
       vector — but "Warum ist das Feld zwischen den Platten homogen" is exactly the question a student opens
       the scene with. The plates are drawn from the first frame, so they gate
       availability and carry the highlight whenever E is absent. */
    available: context =>
      isBoundedElectricField(context) &&
      (context.drawnIds.includes('electric-field-vector') ||
        context.drawnIds.some(id => id.startsWith('plate-'))),
    answer: (context) => {
      const check = findCheck(context, 'bounded_field_geometry')
      const field = findDerived(context, 'Elektrische Feldstärke')
      return {
        question: 'Warum ist das Feld zwischen den Platten homogen?',
        paragraphs: [
          'Ein Plattenkondensator erzeugt zwischen seinen Platten ein homogenes elektrisches Feld: Vernachlässigt man den Randeffekt, so ist die Feldstärke zwischen den Platten an allen Punkten gleich groß und gleich gerichtet (senkrecht zur Plattenfläche), und das Feld existiert nur im rechteckigen Bereich zwischen den Platten. Dies ist eine geometrische Eigenschaft des Plattenkondensators – das Feld zwischen zwei unendlich großen, parallelen, geladenen Platten ist homogen. Hier wird ausschließlich die von der Engine bereits behauptete Geometrieüberprüfung des Bereichs wiedergegeben, nicht neu berechnet.',
          field === undefined
            ? 'Das aktuelle Szenario gibt keinen Wert für die elektrische Feldstärke an.'
            : `Die Engine gibt E = ${field.value} ${field.unit} an.`,
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Geometrie des Bereichs.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(field === undefined ? [] : [chip('simulation', `E = ${field.value} ${field.unit}`)]),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{
          tool: 'physics.ui.highlight',
          targetId: context.drawnIds.includes('electric-field-vector') ? 'electric-field-vector' : 'plate-*',
          duration: 1800,
        }],
      }
    },
  },
  {
    id: 'plate-no-field-outside',
    prompt: 'Warum gibt es außerhalb des Bereichs kein Feld?',
    available: context =>
      isBoundedElectricField(context) && context.drawnIds.some(id => id.startsWith('plate-')),
    answer: (context) => {
      const check = findCheck(context, 'bounded_field_geometry')
      return {
        question: 'Warum gibt es außerhalb des Bereichs kein Feld?',
        paragraphs: [
          'Das elektrische Feld zwischen den Platten ist ein begrenztes Feld: Es existiert nur im rechteckigen Bereich zwischen den beiden Platten, außerhalb ist die Feldstärke null. Dies liegt daran, dass das Feld eines Plattenkondensators durch die Ladungsverteilung auf den Platten erzeugt wird und im idealisierten Modell (ohne Randeffekt) vollständig auf den Raum zwischen den Platten beschränkt ist. Außerhalb des Bereichs wirkt auf das Teilchen keine elektrische Kraft, und es bewegt sich geradlinig gleichförmig. Hier wird ausschließlich die von der Engine bereits behauptete Geometrieüberprüfung des Bereichs wiedergegeben, nicht neu berechnet.',
          check === undefined
            ? 'Das aktuelle Szenario trifft keine Aussage zur Geometrie des Bereichs.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}. Diese Schlussfolgerung basiert auf bereits verifizierten Simulationsergebnissen.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'plate', duration: 1800 }],
      }
    },
  },

  /* ------------------------------------------------------------- composite -- *
   * Crossed-field apparatuses. Every answer cites the composite verifier's own
   * `velocity_selection_condition` check or a derived row the runtime published;
   * none of them evaluates v = E/B. The formula is shown as the reasoning a
   * student writes down, and the numbers next to it are the runtime's.             */

  {
    id: 'velocity-selector-balance',
    prompt: 'Warum wird dieses Teilchen nicht abgelenkt?',
    available: context => isCompositeFrame(context) && selectionCheckOf(context) !== undefined,
    answer: (context) => {
      const check = selectionCheckOf(context)
      const electric = findDerived(context, 'Betrag der elektrischen Kraft')
      const magnetic = findDerived(context, 'Betrag der Lorentzkraft')
      const net = findDerived(context, 'Betrag der resultierenden Kraft')
      const balanced = check?.status === 'passed'
      return {
        question: 'Warum wird dieses Teilchen nicht abgelenkt?',
        paragraphs: [
          balanced
            ? 'Weil die elektrische Kraft und die Lorentzkraft gleich groß und entgegengesetzt sind, ist die resultierende Kraft null und das Teilchen durchquert den Geschwindigkeitswähler geradlinig gleichförmig. Die Auswahlbedingung für die Geschwindigkeit |q·E| = |q·v·B| ist erfüllt, also v = E/B.'
            : 'Das Teilchen wird derzeit tatsächlich abgelenkt: Elektrische Kraft und Lorentzkraft heben sich nicht auf, die resultierende Kraft ist nicht null. Nur Teilchen mit einer Geschwindigkeit von genau E/B können geradlinig passieren.',
          [
            electric === undefined ? '' : `Elektrische Kraft |F_E| = ${electric.value} ${electric.unit}`,
            magnetic === undefined ? '' : `Lorentzkraft |F_B| = ${magnetic.value} ${magnetic.unit}`,
            net === undefined ? '' : `Resultierende Kraft |ΣF| = ${net.value} ${net.unit}`,
          ].filter(entry => entry.length > 0).join('; ') || 'Der aktuelle Frame gibt keine Kraftwerte aus.',
          check === undefined
            ? ''
            : `Laut Prüfung „${check.label}“ des Verifizierers für kombinierte Felder: ${check.status === 'passed' ? 'erfüllt' : 'nicht erfüllt'}.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [
          { tool: 'physics.ui.highlight', targetId: 'electric-force', duration: 1800 },
          { tool: 'physics.ui.highlight', targetId: 'magnetic-force', duration: 1800 },
          { tool: 'physics.ui.highlight', targetId: 'net-force', duration: 1800 },
        ],
      }
    },
  },
  {
    id: 'velocity-too-fast',
    prompt: 'Was passiert, wenn die Geschwindigkeit größer als E/B ist?',
    available: context => isCompositeFrame(context),
    answer: (context) => {
      const check = selectionCheckOf(context)
      const magnetic = findDerived(context, 'Lorentzkraft')
      const selected = findDerived(context, 'Ausgewählte Geschwindigkeit')
      return {
        question: 'Was passiert, wenn die Geschwindigkeit größer als E/B ist?',
        paragraphs: [
          'Der Betrag der Lorentzkraft |q·v·B| ist proportional zur Geschwindigkeit, während die elektrische Kraft |q·E| unabhängig von der Geschwindigkeit ist. Bei zu großer Geschwindigkeit überwiegt die Lorentzkraft, die resultierende Kraft zeigt auf deren Seite, und das Teilchen wird dorthin abgelenkt und vom Selektor abgewiesen.',
          selected === undefined
            ? ''
            : `Die ausgewählte Geschwindigkeit der aktuellen Vorrichtung beträgt ${selected.value} ${selected.unit}; nur Teilchen mit dieser Geschwindigkeit können geradlinig passieren.`,
          check === undefined ? '' : `Laut „${check.label}“: ${check.status === 'passed' ? 'Die aktuelle Geschwindigkeit erfüllt die Bedingung genau' : 'Die aktuelle Geschwindigkeit erfüllt die Bedingung nicht'}.`,
          magnetic === undefined ? '' : `Lorentzkraft im aktuellen Frame |F_B| = ${magnetic.value} ${magnetic.unit}.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'magnetic-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'velocity-too-slow',
    prompt: 'Was passiert, wenn die Geschwindigkeit kleiner als E/B ist?',
    available: context => isCompositeFrame(context),
    answer: (context) => {
      const check = selectionCheckOf(context)
      const electric = findDerived(context, 'Elektrische Kraft (Betrag)')
      return {
        question: 'Was passiert, wenn die Geschwindigkeit kleiner als E/B ist?',
        paragraphs: [
          'Bei zu kleiner Geschwindigkeit wird die Lorentzkraft |q·v·B| kleiner, während die elektrische Kraft |q·E| unverändert bleibt. Daher überwiegt die elektrische Kraft, das Teilchen wird zu deren Seite abgelenkt und ebenfalls abgewiesen. Genau deshalb lässt der Selektor nur eine einzige Geschwindigkeit durch.',
          electric === undefined ? '' : `Elektrische Kraft im aktuellen Frame |F_E| = ${electric.value} ${electric.unit}.`,
          check === undefined ? '' : `Laut „${check.label}“.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-electric-force-direction',
    prompt: 'Wie bestimmt man die Richtung der elektrischen Kraft?',
    available: context =>
      isCompositeFrame(context) && context.drawnIds.includes('electric-force-vector'),
    answer: (context) => {
      const electric = findDerived(context, 'Elektrische Kraft')
      return {
        question: 'Wie bestimmt man die Richtung der elektrischen Kraft?',
        paragraphs: [
          context.chargeSign === 'negative'
            ? 'Die elektrische Kraft ist F = q·E. Da die Ladung negativ ist, zeigt die elektrische Kraft entgegen der Feldrichtung.'
            : 'Die elektrische Kraft ist F = q·E. Da die Ladung positiv ist, zeigt die elektrische Kraft in Feldrichtung.',
          electric === undefined
            ? 'Im aktuellen Frame wurde kein elektrischer Kraftvektor ausgegeben.'
            : `Die von der Engine angegebene elektrische Kraft beträgt ${electric.value} ${electric.unit}; ihre Richtung entspricht der Richtung des blauen Pfeils auf der Leinwand.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'electric-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-magnetic-force-direction',
    prompt: 'Wie bestimmt man die Richtung der Lorentzkraft?',
    available: context =>
      isCompositeFrame(context) && context.drawnIds.includes('magnetic-force-vector'),
    answer: (context) => {
      const magnetic = findDerived(context, 'Lorentzkraft')
      return {
        question: 'Wie bestimmt man die Richtung der Lorentzkraft?',
        paragraphs: [
          'Die Lorentzkraft F = q·(v×B) steht gleichzeitig senkrecht zur Geschwindigkeit und zum Magnetfeld: Zuerst wird v×B mit der Rechten-Hand-Regel bestimmt, dann wird die Richtung anhand des Ladungsvorzeichens festgelegt (bei negativer Ladung kehrt sie sich ein weiteres Mal um). Ihre Richtung ändert sich mit der Geschwindigkeit – das ist der größte Unterschied zur elektrischen Kraft.',
          magnetic === undefined
            ? 'Im aktuellen Frame wurde kein Lorentzkraft-Vektor ausgegeben.'
            : `Die von der Engine angegebene Lorentzkraft beträgt ${magnetic.value} ${magnetic.unit}.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'magnetic-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-magnetic-no-work',
    prompt: 'Warum verrichtet die Lorentzkraft keine Arbeit?',
    available: context => isCompositeFrame(context),
    answer: (context) => {
      const check = findCheck(context, 'magnetic_force_does_no_work')
      const kinetic = findDerived(context, 'Änderung der kinetischen Energie')
      return {
        question: 'Warum verrichtet die Lorentzkraft keine Arbeit?',
        paragraphs: [
          'Die Lorentzkraft q·(v×B) steht stets senkrecht zur Geschwindigkeit, die Leistung ist F·v ≡ 0, daher verrichtet sie niemals Arbeit: Sie ändert nur die Richtung der Geschwindigkeit, nicht deren Betrag. Im kombinierten Feld ändern die elektrische Kraft und die Schwerkraft die kinetische Energie.',
          check === undefined
            ? 'Das aktuelle Szenario trifft keine explizite Aussage dazu.'
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
          kinetic === undefined ? '' : `Die Änderung der kinetischen Energie im aktuellen Frame beträgt ${kinetic.value} ${kinetic.unit}.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'magnetic-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-enter-magnetic-region',
    prompt: 'Was geschieht nach dem Eintritt in den magnetischen Ablenkungsbereich?',
    available: context => isCompositeFrame(context) && hasRegion(context, 'deflection'),
    answer: (context) => {
      const radius = findCheck(context, 'magnetic_deflection_radius_defined')
      return {
        question: 'Was geschieht nach dem Eintritt in den magnetischen Ablenkungsbereich?',
        paragraphs: [
          'Nach dem Eintritt in einen Bereich, in dem nur ein Magnetfeld herrscht, verschwindet die elektrische Kraft und es bleibt nur die Lorentzkraft. Da sie senkrecht zur Geschwindigkeit steht und ihren Betrag nicht ändert, wirkt sie genau als Zentripetalkraft, und das Teilchen führt eine gleichförmige Kreisbewegung aus: Der Geschwindigkeitsbetrag bleibt konstant, während sich die Richtung ständig ändert.',
          radius === undefined
            ? 'Das aktuelle Szenario ist noch nicht in einen reinen Magnetfeldbereich eingetreten.'
            : `Die Prüfung „${radius.label}“ des Verifizierers für kombinierte Felder ist ${radius.status === 'passed' ? 'bestanden' : 'nicht bestanden'}; der Radius wird durch r = m·v/(|q|·B) bestimmt.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(radius === undefined ? [] : [chip('verification', radius.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'magnetic-region', duration: 2200 }],
      }
    },
  },
  {
    id: 'composite-why-circular',
    prompt: 'Warum handelt es sich im Magnetfeld um eine Kreisbewegung?',
    available: context => isCompositeFrame(context),
    answer: (context) => {
      const speedCheck = findCheck(context, 'speed_conserved_in_pure_magnetic')
      const radius = findDerived(context, 'Kreisbahnradius')
      const period = findDerived(context, 'Umlaufperiode')
      return {
        question: 'Warum handelt es sich im Magnetfeld um eine Kreisbewegung?',
        paragraphs: [
          'Bei ausschließlich vorhandenem Magnetfeld ist der Betrag der Lorentzkraft konstant |q|·v·B und steht stets senkrecht zur Geschwindigkeit – genau das ist die Bedingung für eine gleichförmige Kreisbewegung: konstanter Betrag, Richtung stets zum Kreismittelpunkt. Aus |q|·v·B = m·v²/r folgt r = m·v/(|q|·B), und die Periode T = 2π·m/(|q|·B) ist unabhängig von der Geschwindigkeit.',
          [
            radius === undefined ? '' : `Kreisbahnradius ${radius.value} ${radius.unit}`,
            period === undefined ? '' : `Umlaufperiode ${period.value} ${period.unit}`,
          ].filter(entry => entry.length > 0).join(', ') || 'Im aktuellen Frame wurden keine Kreisbahngrößen ausgegeben.',
          speedCheck === undefined
            ? ''
            : `Die Überprüfung „${speedCheck.label}“ durch die Engine ist ${speedCheck.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(speedCheck === undefined ? [] : [chip('verification', speedCheck.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'trajectory', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-spectrometer-radius',
    prompt: 'Wie ergibt sich der Ablenkungsradius?',
    available: context => isCompositeFrame(context) && hasRegion(context, 'deflection'),
    answer: (context) => {
      const check = findCheck(context, 'magnetic_deflection_radius_defined')
      const radius = findDerived(context, 'Kreisbahnradius')
      return {
        question: 'Wie ergibt sich der Ablenkungsradius?',
        paragraphs: [
          'Im Ablenkmagnetfeld liefert die Lorentzkraft die Zentripetalkraft: |q|·v·B = m·v²/r, umgestellt ergibt sich r = m·v/(|q|·B). Je größer die Masse und je größer die Geschwindigkeit, desto flacher der Kreisbogen; je stärker das Magnetfeld, desto stärker die Krümmung. Genau darauf beruht der Massenspektrometer, um Ionen unterschiedlicher Masse zu trennen.',
          radius === undefined
            ? check === undefined
              ? 'Das aktuelle Szenario gibt keinen Radius aus.'
              : `Der Radius stammt aus der Prüfung „${check.label}“ des Verifizierers für kombinierte Felder.`
            : `Die Engine gibt r = ${radius.value} ${radius.unit} an.`,
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'magnetic-region', duration: 2200 }],
      }
    },
  },
  {
    id: 'composite-charge-to-mass',
    prompt: 'Wie wird das spezifische Ladung-zu-Masse-Verhältnis bestimmt?',
    available: context => isCompositeFrame(context) && hasRegion(context, 'deflection'),
    answer: (context) => {
      const selected = findDerived(context, 'Ausgewählte Geschwindigkeit')
      const radius = findDerived(context, 'Kreisbahnradius')
      return {
        question: 'Wie wird das Ladung-zu-Masse-Verhältnis bestimmt?',
        paragraphs: [
          'In zwei Schritten: Zuerst wird die Geschwindigkeit mit dem Geschwindigkeitswähler fest auf v = E/B festgelegt, dann wird im Ablenkmagnetfeld der Radius r des Kreisbogens gemessen. Durch Umstellen von r = m·v/(|q|·B) erhält man q/m = v/(r·B) – alle drei Größen sind messbar, daher ist das spezifische Ladung-zu-Masse-Verhältnis bestimmbar.',
          [
            selected === undefined ? '' : `Ausgewählte Geschwindigkeit ${selected.value} ${selected.unit}`,
            radius === undefined ? '' : `Radius ${radius.value} ${radius.unit}`,
          ].filter(entry => entry.length > 0).join(', ') || 'Im aktuellen Frame werden beide Größen noch nicht gleichzeitig angegeben.',
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'selector-region', duration: 2200 }],
      }
    },
  },
  {
    id: 'composite-gravity-balance',
    prompt: 'Kann die Schwerkraft hier vernachlässigt werden?',
    available: context =>
      isCompositeFrame(context) && context.drawnIds.includes('gravity-force-vector'),
    answer: (context) => {
      const gravity = findDerived(context, 'Schwerkraft')
      const electric = findDerived(context, 'Elektrische Kraft')
      return {
        question: 'Kann die Schwerkraft hier vernachlässigt werden?',
        paragraphs: [
          'In diesem Szenario wird die Schwerkraft berücksichtigt, daher ist die resultierende Kraft die Summe dreier Anteile: ΣF = q·E + q·(v×B) + m·g. In Aufgaben zu Elementarteilchen kann m·g nur vernachlässigt werden, wenn es die elektrische Kraft um mehr als zehn Größenordnungen unterschreitet; bei makroskopischen kleinen Körpern wie geladenen Staubteilchen oder Tropfen ist das nicht möglich.',
          [
            gravity === undefined ? '' : `Schwerkraft ${gravity.value} ${gravity.unit}`,
            electric === undefined ? '' : `Elektrische Kraft ${electric.value} ${electric.unit}`,
          ].filter(entry => entry.length > 0).join(', ') || 'Im aktuellen Frame wurden diese beiden Größen nicht ausgegeben.',
        ],
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          chip('simulation', 'Simulation verifiziert'),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'gravity-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-net-force',
    prompt: 'Wie wird die resultierende Kraft berechnet?',
    available: context => isCompositeFrame(context),
    answer: (context) => {
      const check = findCheck(context, 'composite_force_superposition')
      const net = findDerived(context, 'Resultierende Kraft')
      const acceleration = findDerived(context, 'Beschleunigung')
      return {
        question: 'Wie wird die resultierende Kraft berechnet?',
        paragraphs: [
          'Die resultierende Kraft ist die Vektorsumme der drei Kräfte: ΣF = q·E + q·(v×B) + m·g. Da die Lorentzkraft von der Geschwindigkeit abhängt, ist die Beschleunigung im kombinierten Feld im Allgemeinen nicht konstant.',
          [
            net === undefined ? '' : `Resultierende Kraft ${net.value} ${net.unit}`,
            acceleration === undefined ? '' : `Beschleunigung ${acceleration.value} ${acceleration.unit}`,
          ].filter(entry => entry.length > 0).join(', ') || 'Im aktuellen Frame wurde keine resultierende Kraft ausgegeben.',
          check === undefined
            ? ''
            : `Die Überprüfung „${check.label}“ durch die Engine ist ${check.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und stellt sicher, dass die Vektorsumme der drei Einzelkräfte genau diese Bahn ergibt.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(check === undefined ? [] : [chip('verification', check.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: 'net-force', duration: 1800 }],
      }
    },
  },
  {
    id: 'composite-region-transition',
    prompt: 'Was geschieht beim Überqueren der Feldbereichsgrenze?',
    available: context => isCompositeFrame(context) && hasRegion(context, 'any'),
    answer: context => ({
      question: 'Was geschieht beim Überqueren der Feldbereichsgrenze?',
      paragraphs: [
        'Das Feld ist an den jeweiligen Bereich gebunden: Im Moment des Übertritts über die Grenze wechselt das Feld, das auf das Teilchen wirkt, und die Kraft ändert sich entsprechend, jedoch bleiben Position und Geschwindigkeit kontinuierlich. Die Engine startet an jeder Grenzüberschreitung eine neue Bewegungsphase; die Markierungen „Eintritt/Austritt“ auf der Zeitachse entsprechen genau diesen Übergangsmomenten.',
        'Auch deshalb ist der Kraftwert außerhalb des Feldbereichs null – dort existiert kein Feld, sodass dies korrekt ist und kein Berechnungsfehler vorliegt.',
      ],
      sources: [
        chip('scene', `Szenario Rev. ${context.sceneRevision}`),
        chip('simulation', 'Simulation verifiziert'),
      ],
      tools: [{ tool: 'physics.ui.highlight', targetId: 'field-region', duration: 2200 }],
    }),
  },
  /* ---------------------------------------------------------------- circuit --
     DC steady-state intents. Every number read from the verified operating
     point (inspector derived rows); every check named is one the circuit engine
     actually emitted (kcl / power balance / U = E − Ir / ideal meters). The
     available-gates dispatch on CircuitAgentFacts so a series loop never claims
     junction splitting and a non-rheostat frame never answers a slider question. */
  {
    id: 'circuit-ohm-current',
    prompt: 'Wie ergibt sich dieser Strom?',
    available: isCircuitFrame,
    answer: (context) => {
      const current = findDerived(context, 'Hauptstrom')
      const kcl = findCheck(context, 'kcl_current_conservation')
      return {
        question: 'Wie ergibt sich dieser Strom?',
        paragraphs: [
          'Im geschlossenen Stromkreis ergibt sich der Strom aus der elektromotorischen Kraft und dem Gesamtwiderstand: I = E/(R_äuß + r). Je größer der äußere Widerstand, desto kleiner der Strom; der Innenwiderstand r nimmt ebenfalls einen Spannungsabfall in Anspruch, weshalb bei einer realen Spannungsquelle I nicht einfach E/R, sondern E/(R_äuß + r) beträgt.',
          [
            current === undefined ? '' : `Aktueller Hauptstrom ${current.value} ${current.unit}`,
          ].filter(entry => entry.length > 0).join(', ') || 'Im aktuellen Frame wurde kein Hauptstrom ausgegeben.',
          kcl === undefined
            ? ''
            : `Die Überprüfung „${kcl.label}“ durch die Engine ist ${kcl.status === 'passed' ? 'bestanden' : 'nicht bestanden'} – an jedem Knoten ist die Summe der einfließenden Ströme gleich der Summe der abfließenden Ströme.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(current === undefined ? [] : [chip('simulation', 'Hauptstrom I')]),
          ...(kcl === undefined ? [] : [chip('verification', kcl.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-terminal-voltage',
    prompt: 'Warum ist die Klemmenspannung kleiner als die EMK?',
    available: isCircuitFrame,
    answer: (context) => {
      const terminal = findDerived(context, 'Klemmenspannung')
      const law = terminalVoltageLawCheck(context)
      const internal = context.circuit?.internalResistance ?? 0
      return {
        question: 'Warum ist die Klemmenspannung kleiner als die EMK?',
        paragraphs: [
          internal > 0
            ? 'Am Innenwiderstand r der Spannungsquelle tritt ein Spannungsabfall auf, sodass gilt U_Klemme = E − I·r. Die Klemmenspannung ist also um den Betrag des Innenwiderstandsabfalls kleiner als die EMK. Je größer der Strom (je kleiner der äußere Widerstand), desto größer ist der Abfall und desto niedriger die Klemmenspannung.'
            : 'Der Innenwiderstand dieser Quelle wird vernachlässigt (r = 0), daher ist die Klemmenspannung gleich der EMK. Sobald ein Innenwiderstand vorhanden ist, gilt U_Klemme = E − I·r.',
          terminal === undefined
            ? 'Im aktuellen Frame wurde keine Klemmenspannung ausgegeben.'
            : `Die aktuelle Klemmenspannung beträgt ${terminal.value} ${terminal.unit}.`,
          law === undefined
            ? ''
            : `Die Überprüfung „${law.label}“ durch die Engine ist ${law.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und bestätigt, dass U tatsächlich die Beziehung U = E − I·r erfüllt.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(terminal === undefined ? [] : [chip('simulation', 'Klemmenspannung U')]),
          ...(law === undefined ? [] : [chip('verification', law.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-internal-resistance',
    prompt: 'Welche Rolle spielt der Innenwiderstand?',
    available: context => isCircuitFrame(context) && (context.circuit?.internalResistance ?? 0) > 0,
    answer: (context) => {
      const internal = context.circuit?.internalResistance ?? 0
      const internalPower = findDerived(context, 'Verlustleistung im Innenwiderstand')
      const law = terminalVoltageLawCheck(context)
      return {
        question: 'Welche Rolle spielt der Innenwiderstand?',
        paragraphs: [
          `Der Innenwiderstand dieser Spannungsquelle beträgt r = ${internal} Ω. Der Innenwiderstand nimmt wie ein Lastwiderstand einen Teil der Spannung in Anspruch (U_Klemme = E − I·r) und wandelt einen Teil der elektrischen Leistung in Wärme um: P_innen = I²·r. Er ist keine „Fehlerquelle“, sondern eine inhärente Eigenschaft realer Spannungsquellen – in vielen Schulaufgaben wird r = 0 zur Idealisierung angenommen.`,
          internalPower === undefined
            ? 'Im aktuellen Frame wurde keine Verlustleistung im Innenwiderstand ausgegeben.'
            : `Die aktuelle Verlustleistung im Innenwiderstand beträgt ${internalPower.value} ${internalPower.unit}.`,
          law === undefined
            ? ''
            : `Die Überprüfung „${law.label}“ durch die Engine ist ${law.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und bestätigt, dass die gemessene Klemmenspannung den Spannungsabfall über den ${internal} Ω berücksichtigt.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(internalPower === undefined ? [] : [chip('simulation', 'Verlustleistung im Innenwiderstand')]),
          ...(law === undefined ? [] : [chip('verification', law.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-series-loop',
    prompt: 'In einer Reihenschaltung Stromverteilung in Reihenschaltung?',
    available: context => isCircuitFrame(context) && (context.circuit?.junctionCount ?? 0) === 0,
    answer: (context) => {
      const current = findDerived(context, 'Hauptstrom')
      const kcl = findCheck(context, 'kcl_current_conservation')
      return {
        question: 'In einer Reihenschaltung Stromverteilung in Reihenschaltung?',
        paragraphs: [
          'In einer Reihenschaltung gibt es nur einen einzigen Stromkreis, sodass der Strom überall gleich groß ist. Dies folgt aus der Kontinuität des Stroms: An jedem Knoten ist der Stromzufluss gleich dem Abfluss. Somit fließt durch Spannungsquelle, Schalter und alle Widerstände derselbe Hauptstrom I.',
          current === undefined
            ? 'Im aktuellen Frame wurde kein Hauptstrom ausgegeben.'
            : `Aktueller Hauptstrom ${current.value} ${current.unit}.`,
          kcl === undefined
            ? ''
            : `Die Überprüfung „${kcl.label}“ durch die Engine ist ${kcl.status === 'passed' ? 'bestanden' : 'nicht bestanden'}.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(current === undefined ? [] : [chip('simulation', 'Hauptstrom I')]),
          ...(kcl === undefined ? [] : [chip('verification', kcl.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context, 'r'), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-parallel-split',
    prompt: 'Wie teilt sich der Strom an einem Knoten auf?',
    available: context => isCircuitFrame(context) && (context.circuit?.junctionCount ?? 0) > 0,
    answer: (context) => {
      const current = findDerived(context, 'Hauptstrom')
      const kcl = findCheck(context, 'kcl_current_conservation')
      return {
        question: 'Wie teilt sich der Strom an einem Knoten auf?',
        paragraphs: [
          'Der Hauptstrom teilt sich an einem Knoten im umgekehrten Verhältnis der Widerstände auf: An beiden Enden jedes Zweigs liegt dieselbe Spannung an, daher gilt I_Zweig = U/R_Zweig; je kleiner der Widerstand, desto größer der Strom im Zweig. Der in den Knoten fließende Strom ist gleich dem aus dem Knoten fließenden Strom (Kirchhoffsches Stromgesetz) – das ist die Herkunft der „Stromaufteilung“ in der Parallelschaltung.',
          current === undefined
            ? 'Im aktuellen Frame wurde kein Hauptstrom ausgegeben.'
            : `Aktueller Hauptstrom ${current.value} ${current.unit}, auf die einzelnen Zweige aufgeteilt.`,
          kcl === undefined
            ? ''
            : `Die Überprüfung „${kcl.label}“ durch die Engine ist ${kcl.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und stellt sicher, dass die Stromaufteilung am Knoten der Kirchhoffschen Stromregel entspricht.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(current === undefined ? [] : [chip('simulation', 'Hauptstrom I')]),
          ...(kcl === undefined ? [] : [chip('verification', kcl.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context, 'r'), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-rheostat-sweep',
    prompt: 'Wenn sich der Schieber bewegt, wie ändert sich der Strom?',
    available: context => isCircuitFrame(context) && context.circuit?.hasSlider === true,
    answer: (context) => {
      const slider = findDerived(context, 'Eingeschalteter Widerstand')
      const current = findDerived(context, 'Hauptstrom')
      return {
        question: 'Wenn sich der Schieber bewegt, wie ändert sich der Strom?',
        paragraphs: [
          'Der Schieber ändert den in den Stromkreis eingeschalteten Widerstandswert R_Stell (R_Stell = p·R_ges, wobei p die Schieberposition ist). Wird der Gesamtwiderstand größer, nimmt der Strom I = E/(R_ges) ab; wird der Gesamtwiderstand kleiner, nimmt der Strom zu. Genau so funktioniert der Stellwiderstand nach dem Prinzip der Stromsteuerung.',
          [
            slider === undefined ? '' : `Aktueller eingeschalteter Widerstand ${slider.value} ${slider.unit}`,
            current === undefined ? '' : `Aktueller Hauptstrom ${current.value} ${current.unit}`,
          ].filter(entry => entry.length > 0).join('; ') || 'Im aktuellen Frame wurde kein Stellwiderstand-Wert ausgegeben.',
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(slider === undefined ? [] : [chip('simulation', 'Eingeschalteter Widerstand R_Stell')]),
          ...(current === undefined ? [] : [chip('simulation', 'Hauptstrom I')]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context, 'rv'), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-power-balance',
    prompt: 'Spannungsquellewohin geht die Leistung der Quelle?',
    available: isCircuitFrame,
    answer: (context) => {
      const total = findDerived(context, 'Gesamtleistung der Quelle')
      const external = findDerived(context, 'Ausgangsleistung')
      const internal = findDerived(context, 'Verlustleistung im Innenwiderstand')
      const balance = findCheck(context, 'power_balance')
      return {
        question: 'Spannungsquellewohin geht die Leistung der Quelle?',
        paragraphs: [
          'Die gesamte Leistung der Spannungsquelle ist P_ges = E·I und wird auf den äußeren Stromkreis und den Innenwiderstand der Quelle aufgeteilt: Der äußere Stromkreis erhält die Ausgangsleistung P_außen = U·I, der Innenwiderstand wandelt den Rest P_innen = I²·r in Wärme um. Dabei gilt P_ges = P_außen + P_innen (Energieerhaltung).',
          [
            total === undefined ? '' : `Gesamtleistung der Quelle ${total.value} ${total.unit}`,
            external === undefined ? '' : `Ausgangsleistung ${external.value} ${external.unit}`,
            internal === undefined ? '' : `Verlustleistung im Innenwiderstand ${internal.value} ${internal.unit}`,
          ].filter(entry => entry.length > 0).join('; ') || 'Im aktuellen Frame wurden keine Leistungswerte ausgegeben.',
          balance === undefined
            ? ''
            : `Die Überprüfung „${balance.label}“ durch die Engine ist ${balance.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und stellt sicher, dass die Leistungsbilanz korrekt ist.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(balance === undefined ? [] : [chip('verification', balance.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: circuitComponentTarget(context), duration: 1800 }],
      }
    },
  },
  {
    id: 'circuit-meters-ideal',
    prompt: 'Warum beeinflussen ideale Messgeräte den Stromkreis nicht?',
    available: context => isCircuitFrame(context) && hasMeter(context),
    answer: (context) => {
      const meters = findCheck(context, 'ideal_meters_non_intrusive')
      return {
        question: 'Warum beeinflussen ideale Messgeräte den Stromkreis nicht?',
        paragraphs: [
          'Ein ideales Amperemeter hat einen Innenwiderstand von null, ist in einen Zweig geschaltet und verursacht keinen Spannungsabfall; ein ideales Voltmeter hat einen unendlich großen Innenwiderstand, ist parallel zwischen zwei Punkten geschaltet und nimmt keinen Strom auf. Deshalb entsprechen die Messwerte den ursprünglichen Werten des Stromkreises und nicht der Veränderung durch das Messgerät.',
          meters === undefined
            ? 'Im aktuellen Szenario wurde kein Prüfwert für das Messgerät ausgegeben.'
            : `Die Überprüfung „${meters.label}“ durch die Engine ist ${meters.status === 'passed' ? 'bestanden' : 'nicht bestanden'} und bestätigt, dass die Messung nicht durch das Messgerät verfälscht wird.`,
        ].filter(entry => entry.length > 0),
        sources: [
          chip('scene', `Szenario Rev. ${context.sceneRevision}`),
          ...(meters === undefined ? [] : [chip('verification', meters.label)]),
        ],
        tools: [{ tool: 'physics.ui.highlight', targetId: context.drawnIds.find(id => /^(am|vm)/.test(id)) ?? circuitComponentTarget(context), duration: 1800 }],
      }
    },
  },
]

/**
 * Prompts this scene can actually answer.
 * @returns the agent suggestions list.
 * @param context - the agent context.
 */
export const agentSuggestions = (context: PhysicsAgentContext): readonly AgentSuggestion[] =>
  INTENTS.filter(intent => intent.available(context)).map(intent => ({
    id: intent.id,
    prompt: intent.prompt,
  }))

/**
 * Match a student question to an intent.
 *
 * Keyword matching is honest about being V1: an unmatched question returns
 * `undefined` so the Drawer says it cannot answer yet, rather than inventing
 * plausible-sounding physics explanation.
 * @returns the agent answer.
 * @param context - the agent context.
 * @param input - the caller-supplied fields.
 */
export const matchIntent = (
  input: string,
  context: PhysicsAgentContext,
): AgentAnswer | undefined => {
  const text = input.trim()
  if (text.length === 0) return undefined
  const byId = INTENTS.find(intent => intent.id === text)
  if (byId !== undefined && byId.available(context)) return byId.answer(context)

  const rules: readonly { id: string; test: RegExp }[] = [
    /* Composite intents are tried FIRST and gated on `domain === 'composite'`, so
       they never intercept an electric or mechanics frame. Without this ordering
       "Lorentzkraft verrichtet keine Arbeit" and "Ablenkung" would be answered by the magnetic / parallel-plate
       rules below, which know nothing about a two-field apparatus. */
    { id: 'velocity-selector-balance', test: /keineAblenkung|keine Ablenkung|warum.{0,6}geradlinig|geradlinig.{0,6}bestanden|genau.{0,6}bestanden|Auswahlbedingung|Gleichgewichtsbedingung/i },
    { id: 'velocity-too-fast', test: /Geschwindigkeit.{0,6}(groß|schnell).{0,6}(wird|wie)|(größer|schneller).{0,4}E\s*\/\s*B|zu schnell/i },
    { id: 'velocity-too-slow', test: /Geschwindigkeit.{0,6}(klein|langsam).{0,6}(wird|wie)|(kleiner|langsamer).{0,4}E\s*\/\s*B|zu langsam/i },
    { id: 'composite-electric-force-direction', test: /Elektrische Kraft.{0,6}Richtung|Elektrische Kraft.{0,4}wie.{0,4}bestimmen/i },
    { id: 'composite-magnetic-force-direction', test: /Lorentzkraft.{0,6}Richtung|Magnetfeldkraft.{0,6}Richtung|linke Hand|Rechte-Hand-Regel/i },
    { id: 'composite-magnetic-no-work', test: /Lorentzkraft.{0,6}keine.{0,4}Arbeit|Lorentzkraft.{0,4}Arbeit/i },
    { id: 'composite-enter-magnetic-region', test: /Eintritt.{0,4}(Magnetfeld|Ablenkung)|Eintritt.{0,4}Magnetfeld|Ablenkungsbereich/i },
    { id: 'composite-why-circular', test: /warum.{0,6}Kreis|Kreisbewegung|Kreisbahn/i },
    { id: 'composite-spectrometer-radius', test: /Ablenkungsradius|Radius.{0,6}wie|Radius.{0,6}Formel|Kreisradius/i },
    { id: 'composite-charge-to-mass', test: /spezifisches Ladung-zu-Masse-Verhältnis|Ladung-zu-Masse-Verhältnis|q\s*\/\s*m/i },
    { id: 'composite-gravity-balance', test: /Schwerkraft.{0,6}(vernachlässigen|ignorieren|kann man)|soll man.{0,4}Schwerkraft/i },
    { id: 'composite-net-force', test: /Resultierende Kraft.{0,6}(wie|berechnen)|drei Kräfte|Vektorsumme/i },
    { id: 'composite-region-transition', test: /Grenze|Feldbereich.{0,4}(Grenze|wechseln|Übergang)|durchqueren.{0,4}Feldbereich|Bereich.{0,4}wechseln/i },
    /* Circuit intents are gated on `domain === 'circuit'` via their
       available-predicate, so the rules here never steal an electric / magnetic
       / induction question about Strom or Spannung: in a non-circuit frame the
       intents are skipped and the rules below still answer. Rheostat / parallel
       / meter rules are tried before the generic current rule so a slider or
       junction question reaches its specific answer. */
    { id: 'circuit-rheostat-sweep', test: /Stellwiderstand|Widerstand|Schieber|Schieberegler|Eingeschalteter Widerstand|Widerstandswert.*(verstellen|ändern|erhöhen|verringern|größer|kleiner)/i },
    { id: 'circuit-parallel-split', test: /Parallelschaltung|Stromaufteilung|Abzweigung|Knoten|Knoten|Zweig|jeder Zweig|zwei Wege/i },
    { id: 'circuit-series-loop', test: /Reihenschaltung|überall gleich groß|jeder Verbraucher.*Strom|Strom.*(überall|alle).{0,4}gleich/i },
    { id: 'circuit-meters-ideal', test: /Amperemeter|Voltmeter|Messgerät|Strommesser|Spannungsmesser/i },
    { id: 'circuit-internal-resistance', test: /Innenwiderstand/i },
    { id: 'circuit-terminal-voltage', test: /Klemmenspannung|Ausgangsspannung|Spannung.*(nimmt ab|sinkt|fällt)|EMK.*(und|mit).{0,4}Spannung|warum.*Spannung/i },
    { id: 'circuit-power-balance', test: /Leistung|Energieerhaltung|Energie.*wohin|Spannungsquelle.*Leistung|Ausgangsleistung|Innenwiderstand.*Wärme|elektrische Arbeit/i },
    { id: 'circuit-ohm-current', test: /Strom.*(wie|warum|wie viel|Größe|berechnen)|ermitteln.*Strom|Hauptstrom|Stromstärke/i },
    { id: 'horizontal-velocity', test: /horizontale Geschwindigkeit|vx|v_x|horizontale Richtung/i },
    { id: 'normal-force-direction', test: /Normalkraft|Normalrichtung|normal/i },
    /* höchster Punkt asks for the apex readout; the broad Höhe rule below answers the
       launch height instead, so the apex probe must be tried first. */
    { id: 'apex-height', test: /höchster Punkt|maximale Höhe|Wurfhöhe|Scheitelpunkt/i },
    { id: 'height-meaning', test: /Höhe|20\s*m|h\s*=/i },
    { id: 'set-incline-45', test: /(Neigungswinkel|Winkel|θ).*(ändere|setze|verändere).*(45|fünfundvierzig)|45.*(Grad|°)/i },
    { id: 'lorentz-no-work', test: /Lorentzkraft.*Arbeit|keine.{0,4}Arbeit/i },
    /* Bounded-field (parallel-plate) intents must be tried before the broad
       uniform-field dynamics rules and the static electric-field/electric-force
       rules so queries about Ablenkung/Platten/Eintrittelektrisches Feld/Austrittelektrisches Feld/Auftreffen auf Platte reach the bounded-field
       answer rather than the generic uniform-field or point-charge answer. The
       isBoundedElectricField available-gate ensures they only fire for a
       parallel-plate frame; in a uniform-field or point-charge frame they are
       skipped and the existing rules below still handle the query. */
    { id: 'bounded-field-enter', test: /Eintrittelektrisches Feld|Eintritt.*Feldbereich|gerade.{0,4}eingetreten.{0,4}Feld|Eintritt.*Ablenkung/i },
    { id: 'bounded-field-exit', test: /Austrittelektrisches Feld|Aus.{0,4}elektrisches Feld|Austritt.*Feldbereich|Verlassen.*gleichförmig|Austritt.*gleichförmig/i },
    { id: 'plate-deflection-direction', test: /Ablenkung.{0,4}Richtung|warum.{0,4}Ablenkung|Elektron.{0,4}Ablenkung|warum.{0,4}nach oben.*abgelenkt|warum.{0,4}nach unten.*abgelenkt/i },
    { id: 'plate-deflection-formula', test: /Ablenkungsstrecke|Ablenkung.{0,4}Formel|Ablenkung.{0,4}berechnen|y\s*=\s*0\.5|Ablenkungsbetrag|Ablenkung.{0,4}wie/i },
    { id: 'plate-hit-time', test: /Auftreffen auf Platte|trifft.*Platten|stößt.*Platte|Platte.*Zeit|Auftreffen.*Platte/i },
    { id: 'plate-velocity-exit', test: /Austritt.*Geschwindigkeit|Aus.{0,4}Geschwindigkeit|Ausgangsgeschwindigkeit|Austritt.*wie groß|Austrittsgeschwindigkeit/i },
    { id: 'plate-energy', test: /zwischen den Platten.*Arbeit|Platten.*Energie|zwischen den Platten.*kinetische Energie|Elektrische Kraftarbeit.*kinetische Energie|Arbeit.*kinetische Energie.*Zusammenhang/i },
    { id: 'plate-trajectory-parabola', test: /im Bereich.*Parabel|zwischen den Platten.*Parabel|im Bereich.*Bahn|zwischen den Platten.*Bahn.*warum/i },
    { id: 'plate-field-uniform', test: /zwischen den Platten.*homogen|zwischen den Platten.*warum.*Feld|Platten.*homogen|zwischen den Platten.*elektrisches Feld.*warum/i },
    { id: 'plate-no-field-outside', test: /außerhalb des Bereichs.*keine|außerhalb des Bereichs.*Feld|außerhalb der Platten.*keine|außerhalb der Platten.*Feld|warum.*außerhalb|außen.*keine.*Feld/i },
    /* Uniform-field dynamics intents must be tried before the broad
       electric-field/electric-force rules so "Beschleunigung warum konstant"/"Bahn warum
       Parabel"/"Endgeschwindigkeit wie entsteht"/"Arbeit der elektrischen Kraft" reach the dynamics answer rather
       than the static field-magnitude answer. The electric-force-magnitude
       rule below also excludes Arbeit so the ordering is double-belted. */
    { id: 'electric-acceleration-constant', test: /Beschleunigung.{0,4}warum|Beschleunigung.{0,4}konstant|warum.*Beschleunigung.*konstant/i },
    { id: 'electric-trajectory-shape', test: /Bahn.{0,4}warum|warum.*Parabel|Bahn.{0,4}Form|Bewegungsbahn/i },
    { id: 'electric-work-energy', test: /Arbeit|Arbeitssatz|Energie.{0,4}Erhaltung|ΔK|dK|kinetische Energie.{0,4}Änderung/i },
    { id: 'electric-velocity-evolution', test: /Endgeschwindigkeit|Endgeschwindigkeit|Geschwindigkeit.{0,4}wie|v\s*=\s*v0/i },
    { id: 'electric-field-magnitude', test: /Elektrische Feldstärke|Feldstärke|gesucht\s*E|\bE\s*wie groß|\bE\s*wie entsteht/i },
    { id: 'electric-force-magnitude', test: /Elektrische Kraft|gesucht\s*F\b|\bF\s*=\s*q\s*E\b|Testladung.*Kraft/i },
    { id: 'electric-field-direction', test: /elektrisches Feld.{0,4}Richtung|Feldstärke.{0,4}Richtung|zeigt nach|nach außen|nach innen/i },
    { id: 'electric-field-line-origin', test: /Feldlinien.{0,4}warum|Feldlinien.*von.*positive Ladung|warum.*heraus|von positive Ladung.*ausgehen/i },
    { id: 'electric-superposition', test: /Überlagerung|resultierendes Feld|Gesamtfeld|Quellen/i },
  ]
  for (const rule of rules) {
    if (!rule.test.test(text)) continue
    const intent = INTENTS.find(candidate => candidate.id === rule.id)
    if (intent !== undefined && intent.available(context)) return intent.answer(context)
  }
  return undefined
}
