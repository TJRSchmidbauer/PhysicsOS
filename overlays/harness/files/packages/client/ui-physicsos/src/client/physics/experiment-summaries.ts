/**
 * Per-experiment teaching metadata — the structured summary every template
 * carries, keyed by template id (same pattern as `experiment-artwork.tsx`'s
 * SCENE_ID_BASES: template data lives beside the registry, not inside it).
 *
 * `coreModel` is a CONTRACT, not marketing copy: it must describe the model
 * the engine actually solves for that scene. A parity test requires every
 * selectable template to have an entry with all four sections non-empty —
 * an experiment whose honest model cannot be written down gets flagged the
 * same way a fake implementation would.
 */

/** What the experiment is, in the student's language. */
export interface ExperimentSummary {
  /** The model the engine solves (formulas + criterion), stated plainly. */
  readonly coreModel: string
  /** The knobs the scene exposes. */
  readonly parameters: readonly string[]
  /** What visibly responds when the model runs. */
  readonly feedback: readonly string[]
  /** Measurement error / model approximation the honest lab admits to. */
  readonly errors: readonly string[]
}

/** Curriculum anchor — which textbook chapter this experiment belongs to. */
export interface TextbookMapping {
  readonly edition: string
  readonly volume: string
  readonly chapter: string
  readonly topics: readonly string[]
}

/** Full metadata block for one template. */
export interface ExperimentMeta {
  readonly summary: ExperimentSummary
  readonly textbook?: readonly TextbookMapping[]
  /** Extra search terms (synonyms, exam keywords) the picker matches on. */
  readonly aliases?: readonly string[]
  /** Procedural steps for the Experimentieranleitung overlay. */
  readonly guide?: readonly string[]
}

const PEP = 'Volksausgabe / Oberstufenphysik / 2019'
const PEP_J = 'Volksausgabe / Mittelstufenphysik / 2012'

const hs = (volume: string, chapter: string, topics: readonly string[]): TextbookMapping => ({
  edition: PEP,
  volume,
  chapter,
  topics,
})
const js = (volume: string, chapter: string, topics: readonly string[]): TextbookMapping => ({
  edition: PEP_J,
  volume,
  chapter,
  topics,
})

/** Summary/metadata for every selectable template, keyed by `ExperimentTemplate.id`. */
export const EXPERIMENT_META: Readonly<Record<string, ExperimentMeta>> = {
  /* ----------------------------------------------------------- mechanics -- */

  'uniform-linear': {
    summary: {
      coreModel: 'x = x₀ + vt: v konstant, a = 0, der Körper befindet sich im Kräftegleichgewicht.',
      parameters: ['Masse m', 'Anfangsgeschwindigkeit v₀', 'Anfangsposition x₀'],
      feedback: ['x–t-Diagramm ist eine Gerade mit Steigung, die Steigung entspricht der Geschwindigkeit', 'v–t-Diagramm ist eine horizontale Gerade', 'Punktrasterpapierband mit gleichmäßigen Abständen'],
      errors: ['Gleichförmige Geradlinige Bewegung ist ein Ideales Modell, reale Bewegung hat immer geringen Widerstand', 'Punktabstand durch Abtastgenauigkeit begrenzt'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 1 Mechanische Bewegung', ['Bewegungsgeschwindigkeit', 'Geschwindigkeit'])],
    aliases: ['gleichförmig', 'v=s/t', 'Geschwindigkeit', 's-t-Diagramm', 'Gleichgewichtszustand', 'Bewegungsbeschreibung'],
    guide: ['Experiment ausführen, Form der x–t-Kurve beobachten', 'Anfangsgeschwindigkeit v₀ vergrössern, Steigungen zweier x–t-Kurven vergleichen', 'Datenseite prüfen: Sind Verschiebungen in je gleichen Zeitintervallen gleich?'],
  },
  'average-speed': {
    summary: {
      coreModel: 'v̄ = s/t: Kleiner Wagen gleitet vom Ruhezustand gleichmäßig beschleunigt eine sanfte Ebene hinab, Gesamtweg und Vorderes/Hinteres Teilstück werden jeweils für die Durchschnittsgeschwindigkeit berechnet — v̄gesamt ≠ (v̄vorn + v̄hinten)/2.',
      parameters: ['Wagenmasse m', 'Beschleunigung a', 'Anfangsposition x₀'],
      feedback: ['v–t-Diagramm ist eine durch den Ursprung gehende Gerade', 'Datenseite gibt s und t der einzelnen Abschnitte an'],
      errors: ['Gesamtdurchschnittsgeschwindigkeit muss aus Gesamtweg geteilt durch Gesamtzeit berechnet werden, nicht durch erneutes Mitteln der Teilstreckenwerte', 'Reaktionszeit der Stoppuhr ist Hauptmessfehler'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 1 Mechanische Bewegung', ['Durchschnittsgeschwindigkeit messen'])],
    aliases: ['Durchschnittsgeschwindigkeit', 'Geschwindigkeitsmessung', 'Schrägenwagen', 'Stoppuhr', 'v=s/t', 'Geschwindigkeitsberechnung'],
    guide: ['Experiment ausführen, Gesamt-s und -t notieren, v̄gesamt berechnen', 'Einzelschritt: Zeit an Mittelpunkt anhalten, v̄vorn berechnen', 'v̄gesamt mit (v̄vorn + v̄hinten)/2 vergleichen, erklären warum ungleich'],
  },
  'uniform-acceleration': {
    summary: {
      coreModel: 'v = v₀ + at, x = x₀ + v₀t + ½at²: Beschleunigung konstant; setzt man a = -g, so erhält man den senkrechten Wurf nach oben.',
      parameters: ['Anfangsgeschwindigkeit v₀', 'Beschleunigung a', 'Anfangsposition x₀', 'Masse m'],
      feedback: ['v–t-Diagramm ist eine schräge Gerade, Steigung entspricht a', 'x–t-Diagramm ist eine Parabel', 'a–t-Diagramm ist eine horizontale Gerade'],
      errors: ['a und v₀ entgegengesetzte Richtung erfordert Vorzeichenrechnung', 'Diagramm-Steigungsablesung durch Koordinatenmaßstab beeinflusst'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 2 Gleichmäßig beschleunigte Geradlinige Bewegung', ['Geschwindigkeits-Zeit-Beziehung', 'Verschiebungs-Zeit-Beziehung'])],
    aliases: ['Gleichmäßig beschleunigt', 'Gleichmäßig verzögert', 'Senkrechter Wurf', 'v-t-Diagramm', 'at', 'Freier Fall', 'Freier-Fall-Bewegung', 'Schwerebeschleunigung'],
    guide: ['Experiment ausführen, v–t-Steigung mit a-Wert vergleichen', 'a auf negativ setzen: Körper erst verzögert, dann rückwärts beschleunigt beobachten', 'Datenseite: Prüfen ob v = v₀ + zu jedem Zeitpunkt gilt'],
  },
  'projectile-horizontal': {
    summary: {
      coreModel: 'x = v₀t, y = h − ½gt²: Horizontale Gleichförmige Bewegung und senkrechter Freier Fall überlagert; Fallzeit t = √(2h/g), Wurfweite R = v₀√(2h/g).',
      parameters: ['Anfangshöhe h', 'Anfangsgeschwindigkeit v₀', 'Schwerebeschleunigung g', 'Wurfwinkel θ = 0'],
      feedback: ['Bahn ist eine Parabel', 'x–t linear steigend, y–t parabelartig fallend', 'Punkzeitstempel markieren gleichzeitige Positionen'],
      errors: ['Horizontale und vertikale Teilbewegungen beeinflussen sich nicht — v₀ ändert Fallzeit nicht', 'Luftwiderstand vernachlässigt'],
    },
    textbook: [hs('Pflicht 2. Band', 'Kapitel 5 Wurfbewegung', ['Experiment: Eigenschaften waagerechten Wurfs', 'Gesetzmässigkeit der Wurfbewegung'])],
    aliases: ['Waagerechter Wurf', 'Horizontaler Wurf', 'Parabel', 'Fallzeit', 'Wurfweite'],
    guide: ['Einmal ausführen, Bahn und Punkzeitpunkte beobachten', 'Nur v₀ ändern: Fallzeit unverändert, Wurfweite grösser', 'Nur h ändern: t = √(2h/g) prüfen'],
  },
  'projectile-oblique': {
    summary: {
      coreModel: 'x = v₀cosθ·t, y = v₀sinθ·t − ½gt²: Schräger Wurf nach oben; Wurfhöhe H = v₀²sin²θ/(2g), Wurfweite R = v₀²sin2θ/g (Start und Landung auf gleicher Höhe).',
      parameters: ['Anfangsgeschwindigkeit v₀', 'Wurfwinkel θ', 'Schwerebeschleunigung g'],
      feedback: ['Bahn ist eine nach unten geöffnete Parabel', 'Im Scheitelpunkt nur noch horizontale Geschwindigkeitskomponente', 'Wurfweite und Wurfhöhe ändern sich mit θ'],
      errors: ['45° maximale Wurfweite gilt nur bei gleicher Start- und Landehöhe', 'Komplementäre Winkel gleiche Wurfweite ist Idealfall'],
    },
    textbook: [hs('Pflicht 2. Band', 'Kapitel 5 Wurfbewegung', ['Gesetzmässigkeit der Wurfbewegung'])],
    aliases: ['Schräger Wurf nach oben', 'Schräger Wurf', 'Wurfhöhe', 'Wurfweite', '45 Grad', 'Komplementäre Winkel'],
    guide: ['v₀ beibehalten, θ von 30° auf 60° ändern, Wurfweiten vergleichen', 'Höchsten Punkt finden: Wie gross ist die senkrechte Geschwindigkeitskomponente?', 'R = v₀²sin2θ/g prüfen'],
  },
  'newton-second-law': {
    summary: {
      coreModel: 'F = ma: Horizontale Zugkraft erzeugt Beschleunigung, Gewichtskraft und Normalkraft sind im Gleichgewicht; a = F/m umgekehrt proportional zur Masse.',
      parameters: ['Masse m', 'Zugkraft F', 'Schwerebeschleunigung g'],
      feedback: ['a–t-Diagramm ist eine horizontale Gerade', 'v–t-Diagramm ist eine schräge Gerade', 'Kraftpfeile zeigen Richtung der Resultierenden'],
      errors: ['a wird durch resultierende Außenkraft bestimmt — nur wenn horizontale Zugkraft gleich Resultierende ist, gilt F/m', 'Dieses Szenario vernachlässigt Reibungskraft'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 4 Bewegung und Kraftbeziehung', ['Newtonsches zweites Gesetz'])],
    aliases: ['Newton II', 'F=ma', 'Beschleunigung', 'Resultierende Außenkraft', 'Zweikraftgleichgewicht', 'Gleichgewichtskräfte', 'Kraftanalyse', 'Trägheit', 'Newton I und Trägheit', 'Newtonsche Bewegungsgesetze', 'Bewegungszustand'],
    guide: ['F fest, m ändern: Wie ändert sich a?', 'm fest, F ändern: a ∝ F prüfen', 'Kraftanalyse ansehen, Gleichgewicht in senkrechter Richtung bestätigen'],
  },
  incline: {
    summary: {
      coreModel: 'a = g(sinθ − μcosθ): Gewichtskraftanteil entlang der Ebene minus Gleitreibung; μ ≥ tanθ dann Körper in Ruhe oder gleichförmige Bewegung.',
      parameters: ['Masse m', 'Neigungswinkel θ', 'Reibungskoeffizient μ', 'Schwerebeschleunigung g'],
      feedback: ['Gewichtskraft zerfällt in entlang der Ebene und senkrecht zur Ebene gerichtete Komponenten', 'a–t konstant, v–t linear', 'Bei Änderung von θ oder μ reagiert Beschleunigung sofort'],
      errors: ['Bei μ ≥ tanθ rutscht Körper nicht — Haftreibung nimmt benötigten Wert an, nicht Maximalwert', 'Normalkraft N = mgcosθ nicht mg'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 4 Bewegung und Kraftbeziehung', ['Anwendung der Newtonschen Gesetze', 'Kraftanalyse'])],
    aliases: ['Schräge Ebene', 'Kraftzerlegung', 'Reibungskraft', 'Neigungswinkel', 'Abrutschen', 'Kraftanalyse auf schräger Ebene'],
    guide: ['Ausführen und Kraftzerlegungsmarkierungen beobachten', 'θ vergrössern: Wann wird a positiv? tanθ > μ prüfen', 'μ auf über 0,6 erhöhen: Rutscht der Körper noch?'],
  },
  'mechanical-energy': {
    summary: {
      coreModel:
        'Mechanische Energieerhaltung: Ep = mgh und Ek = ½mv² wandeln sich ineinander um. 2 kg Wagen gleitet von 90 cm Höhe eine glatte Ebene hinab, 17,64 J potentielle Energie werden am unteren Ende vollständig zu kinetischer Energie, v = √(2gh) = 4,2 m/s — wie beim freien Fall aus gleicher Höhe gleiche Aufprallgeschwindigkeit, unabhängig von der Masse.',
      parameters: ['Wagenmasse m', 'Loslasshöhe h', 'Ebenenneigungswinkel θ', 'Reibungskoeffizient μ'],
      feedback: [
        'Energiebalken in drei Segmente: Potenzielle Energie, kinetische Energie, durch Reibung erzeugte Wärme, Gesamtlänge ändert sich im Prozess nicht',
        'Masse verdoppelt: Potenzielle und kinetische Energie verdoppeln sich beide, aber Geschwindigkeit am unteren Ende bleibt gleich (in √(2gh) kommt kein m vor)',
        'Höhe verdoppelt: Potenzielle Energie verdoppelt sich, Geschwindigkeit wird √2-fach',
      ],
      errors: [
        '„Geschwindigkeit unabhängig von Masse“ verwechseln mit „kinetische Energie unabhängig von Masse“: Ek = ½mv² ist eindeutig proportional zu m',
        'Nur bei Vernachlässigung der Reibung gilt mechanische Energieerhaltung; bei Reibung geht verlorene mechanische Energie in Wärme über, Gesamtmenge bleibt trotzdem erhalten',
      ],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 11 Arbeit und mechanische Energie', ['Kinetische und potentielle Energie', 'Mechanische Energie und ihre Umwandlung'])],
    aliases: ['Mechanische Energie', 'Kinetische Energie', 'Potentielle Energie', 'Energieerhaltung', 'Energieumwandlung', 'Schwerepotentielle Energie', 'Mechanische Energieerhaltung', 'Ek', 'Ep'],
    guide: ['Energiebalken ansehen: Wie viel nimmt jedes Segment beim Start ein?', 'Ebene rauh machen: Wohin geht der fehlende Teil?', 'Masse verdoppeln: Hat sich die Geschwindigkeit am unteren Ende geändert?'],
  },
  'ramp-friction': {
    summary: {
      coreModel:
        'Energieerhaltungs-Gesamtbilanz: Ek + Ep + Q = const. Derselbe Wagen, dieselbe Höhe, raue Ebene (μ = 0,2) — am unteren Ende fehlt μmg·cosθ·L = 3,53 J kinetische Energie, jener Teil wird zu Reibungswärme. Beachte W = μmg·cosθ·L vereinfacht sich zu μmg·h·cotθ — **je flacher die Ebene, desto mehr Energie nimmt die Reibung mit**.',
      parameters: ['Wagenmasse m', 'Loslasshöhe h', 'Ebenenneigungswinkel θ', 'Reibungskoeffizient μ'],
      feedback: [
        'Drittes Segment des Energiebalkens (Wärme) wird mit μ länger, die beiden ersten werden entsprechend kürzer, Gesamtlänge unverändert',
        'Neigungswinkel flacher stellen: Weg wird länger, Normalkraft nimmt kaum ab, Reibung entzieht sogar mehr Wärme',
        'Neigungswinkel auf fast 90° (nahezu senkrechter Fall): Reibung entzieht kaum Energie',
      ],
      errors: [
        'Glaube „je flacher die Ebene, desto kraftsparender, also weniger Verlust“: Gespart wird Kraft, aber Weg wird länger, Reibungsarbeit wird sogar größer',
        'Reibungswärme als „Energie verschwunden“ betrachten: Sie liegt nur nicht mehr in Form mechanischer Energie vor',
      ],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 11 Arbeit und mechanische Energie', ['Mechanische Energie und ihre Umwandlung', 'Arbeit und Energie'])],
    aliases: ['Mechanische Energie', 'Energieerhaltung', 'Reibungswärme', 'Energieverlust', 'Kinetische Energie', 'Potentielle Energie', 'Schrägenreibung', 'W=fs'],
    guide: ['Glatter und rauer Ebene vergleichen, kinetische Energien am unteren Ende ablesen', 'Neigungswinkel von 45° auf 25° ändern, ansehen wie sich der Reibungsanteil ändert', 'Prüfen ob Ek + Q stets gleich der Startenergie mgh ist'],
  },
  'lever-balance': {
    summary: {
      coreModel: 'F₁L₁ = F₂L₂: Hebelarm ist der senkrechte Abstand vom Drehpunkt zur Wirkungslinie der Kraft; gleich große Drehmomente auf beiden Seiten bedeutet Gleichgewicht.',
      parameters: ['Beidseitige Gewichte (Kräfte)', 'Beidseitige Aufhängepositionen (Hebelarme)'],
      feedback: ['Hebel bleibt waagerecht = Gleichgewicht', 'Anzeigen geben direkt das Produkt aus Kraft × Arm auf beiden Seiten'],
      errors: ['Hebelarm ist nicht der Stababstand vom Drehpunkt zum Aufhängepunkt — bei schrägem Zug senkrechte Distanz nehmen', 'Eigengewicht des Hebels vernachlässigt'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 12 Einfache Maschinen', ['Hebel'])],
    aliases: ['Hebel', 'Hebelarm', 'Drehmoment', 'Gleichgewichtsbedingung', 'F1L1=F2L2', 'Hebelgleichgewichtsbedingung'],
    guide: ['Gewicht auf einer Seite verschieben bis Hebel im Gleichgewicht', 'Produkt F×L beider Seiten ablesen, Gleichheit prüfen', 'Kraft auf einer Seite verdoppeln, Hebelarm halbieren — immer noch im Gleichgewicht?'],
  },
  'collision-elastic': {
    summary: {
      coreModel: 'Σmᵢvᵢ und Σ½mᵢvᵢ² doppelt erhalten: Bei gleichmässiger zentraler elastischer Stoss tauschen die Körper die Geschwindigkeiten.',
      parameters: ['Zwei Kugelmassen m₁, m₂', 'Anfangsgeschwindigkeiten v₁, v₂', 'Restitutionskoeffizient e = 1'],
      feedback: ['Im Stossmoment werden Geschwindigkeiten getauscht', 'Ereignisseite markiert Stosszeitpunkt', 'Impuls- und Energieanzeigen bleiben 내내 erhalten'],
      errors: ['e = 1 ist ideales vollelastisches Modell', 'Randstösse werden ebenfalls nach Restitutionskoeffizient behandelt'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 1 Impulserhaltungsgesetz', ['Elastischer und unelastischer Stoss'])],
    aliases: ['Elastischer Stoss', 'Impulserhaltung', 'Energierehaltung', 'Zentraler Stoss'],
    guide: ['Experiment ausführen, Geschwindigkeiten der zwei Kugeln vor und nach Stoss beobachten', 'Auf Ereignisseite Stosszeitpunkt finden und Werte abgleichen', 'Masse einer Kugel ändern — tauschen sie noch die Geschwindigkeiten?'],
  },
  'collision-inelastic': {
    summary: {
      coreModel: 'Impulserhaltung, Energieverlust: bei e = 0,5 halbiert sich Relative Geschwindigkeit nach Stoss; v′ wird aus Impulserhaltung und Restitutionskoeffizient gemeinsam gelöst.',
      parameters: ['Zwei Kugelmassen m₁, m₂', 'Anfangsgeschwindigkeiten v₁, v₂', 'Restitutionskoeffizient e = 0,5'],
      feedback: ['Grosse Kugel verfolgt kleine, nach Stoss weiter vorwärts', 'Systemimpuls unverändert, Gesamtenergie sinkt'],
      errors: ['Verlorene kinetische Energie wird zu innerer Energie/Verformung, nicht Rechenfehler', 'Rand-Restitutionskoeffizient separat einstellbar'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 1 Impulserhaltungsgesetz', ['Elastischer und unelastischer Stoss'])],
    aliases: ['Unelastischer Stoss', 'Restitutionskoeffizient', 'Impulserhaltung', 'Energieverlust'],
    guide: ['Gesamtenergie vor Stoss notieren, nach Stoss erneut prüfen', 'e auf 0 setzen: Wie verhalten sich die Kugeln?', 'Prüfen: Relative Geschwindigkeit nach Stoss = e × Relative Geschwindigkeit vor Stoss'],
  },
  'collision-perfectly-inelastic': {
    summary: {
      coreModel: 'Vollständig unelastischer Stoss: Nach Stoss kleben beide Kugeln zusammen mit gemeinsamer Geschwindigkeit v′ = (m₁v₁ + m₂v₂)/(m₁ + m₂), Energieverlust maximal.',
      parameters: ['Zwei Kugelmassen m₁, m₂', 'Anfangsgeschwindigkeiten v₁, v₂', 'Restitutionskoeffizient e = 0'],
      feedback: ['Nach Stoss beide Kugeln gleiche Geschwindigkeit, gleiche Richtung', 'Energieanzeige zeigt maximalen Abfall'],
      errors: ['Impuls bleibt erhalten — verloren geht Energie, nicht Impuls'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 1 Impulserhaltungsgesetz', ['Elastischer und unelastischer Stoss'])],
    aliases: ['Vollständig unelastischer Stoss', 'Gemeinsame Geschwindigkeit', 'Verkleben', 'Impulserhaltung'],
    guide: ['Gemeinsame Geschwindigkeit = Gesamtimpuls ÷ Gesamtmasse prüfen', 'Energieverlustanteil am Ausgangswert berechnen', 'Mit elastischem Stoss-Experiment bei gleichen Anfangsbedingungen vergleichen'],
  },
  'vt-area': {
    summary: {
      coreModel: 'x = v₀t + ½at² und v = v₀ + at: Das v–t-Diagramm der gleichmäßig beschleunigten Geradlinigen Bewegung ist eine schräge Gerade, der von der Geraden und der t-Achse eingeschlossene Trapezflächeninhalt entspricht numerisch der Verschiebung.',
      parameters: ['Anfangsgeschwindigkeit v₀', 'Beschleunigung a', 'Masse m'],
      feedback: ['v–t-Diagramm ist eine durch (0, v₀) gehende schräge Gerade', 'x–t-Diagramm ist eine Parabel', 'Datenseite s-Spalte stimmt numerisch mit Trapezflächeninhalt überein'],
      errors: ['Geradesteigung ist Beschleunigung, nicht Geschwindigkeit', 'v–t-Flächeninhalt ist algebraischer Flächeninhalt — liegt Gerade unter t-Achse, ist Verschiebung negativ'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 2 Gleichmäßig beschleunigte Geradlinige Bewegung', ['Verschiebung-Zeit-Beziehung bei gleichmäßig beschleunigter Bewegung'])],
    aliases: ['v-t-Diagramm', 'Flächeninhalt', 'Verschiebung', 'Gleichmäßig beschleunigt', 'x-t-Diagramm'],
    guide: ['Experiment ausführen, v–t-Kurve im Diagramm ansehen', 'Mit v₀, a, t Trapezflächeninhalt von Hand berechnen, mit Verschiebungsspalte vergleichen', 'a auf 0 setzen: Welche Form hat die Kurve? Stimmt der Flächeninhalt noch mit der Verschiebung?'],
  },
  'force-composition': {
    summary: {
      coreModel: 'F_res = F₁ + F₂ (vektorielle Addition) → a = F_res/m: 3 N und 4 N orthogonal ergeben 5 N Resultierende, Körper beschleunigt in Resultierenden-Richtung.',
      parameters: ['Masse m', 'F₁ = 3 N (+x-Richtung)', 'F₂ = 4 N (+y-Richtung)'],
      feedback: ['F₁, F₂ zwei Kraftpfeile und ΣF Resultierender Pfeil gleichzeitig dargestellt', 'Beschleunigungsrichtung = Resultierenden-Richtung', 'Abgeleitete Größe Resultierende zeigt 5 N'],
      errors: ['Kraft ist Vektor — nicht einfach 3 + 4 = 7', 'mg und N senkrecht im Gleichgewicht, nicht an horizontaler Zusammensetzung beteiligt'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 3 Wechselwirkung — Kraft', ['Kraftzusammensetzung und -zerlegung'])],
    aliases: ['Kraftzusammensetzung', 'Parallelogramm', 'Resultierende', 'Vektoraddition', 'Teilkraft'],
    guide: ['Richtung und relative Länge der zwei Kraftpfeile F₁, F₂ ansehen', 'Abgeleitete Größe prüfen: |ΣF| = √(3² + 4²) = 5 N', 'Beschleunigungsrichtungswinkel sollte arctan(4/3) ≈ 53° betragen'],
  },
  'concurrent-equilibrium': {
    summary: {
      coreModel: 'ΣF = 0 → a = 0: Drei sich zu 120° einschliessende 8 N Zentralkräfte haben Vektorsumme null, Körper bleibt in Ruhe — direkte Demonstration der Gleichgewichtsbedingung.',
      parameters: ['Masse m', 'F₁ = 8 N (+x)', 'F₂, F₃ je 8 N (mit F₁ ±120°)'],
      feedback: ['Drei Kraftpfeile symmetrisch verteilt', 'Körper gesamte Zeit in Ruhe', 'Abgeleitete Größe Beschleunigung zeigt 0'],
      errors: ['Zentralkraftgleichgewicht fordert Vektorsumme null, nicht Skalarsumme null', 'Ruhe und gleichförmige Geradlinige Bewegung sind beide Gleichgewichtszustände (hier Ruhe demonstriert)'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 3 Wechselwirkung — Kraft', ['Gleichgewicht von Zentralkräften'])],
    aliases: ['Zentralkräfte', 'Kraftgleichgewicht', 'Dreikraftgleichgewicht', 'Gleichgewichtsbedingung', 'ΣF=0'],
    guide: ['Geometrische Beziehung der drei Kraftpfeile beobachten (gegenseitig 120°)', 'Prüfen: Alle ΣF-Komponenten sind 0', 'Eine Kraft gedanklich weglassen — in welche Richtung bewegt sich der Körper?'],
  },
  'apparent-weight': {
    summary: {
      coreModel: 'N = m(g + a_y): Beim beschleunigten Aufwärtsfahren des Aufzugs ist Normalkraft grösser als Gewichtskraft (Übergewicht); a_y < 0 bedeutet Gewichtslosigkeit, a_y = −g ergibt N = 0 vollständige Gewichtslosigkeit.',
      parameters: ['Masse m = 60 kg', 'Senkrechte Beschleunigung a = 2 m/s²', 'Anfangsgeschwindigkeit v₀ = 1 m/s'],
      feedback: ['Körper bewegt sich senkrecht nach oben', 'Abgeleitete Größe „Scheingewicht (Normalkraft)“ zeigt m(g+a) = 708 N > mg = 588 N'],
      errors: ['Scheingewicht ist Normalkraft/Waagenanzeige, nicht die Gewichtskraft selbst — mg ändert sich nicht', 'Übergewicht richtet sich nach Beschleunigungsrichtung, nicht Bewegungsrichtung (verzögertes Absinken ebenfalls Übergewicht)'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 4 Bewegung und Kraftbeziehung', ['Übergewicht und Gewichtslosigkeit'])],
    aliases: ['Übergewicht', 'Gewichtslosigkeit', 'Scheingewicht', 'Aufzug', 'Normalkraft', 'Vollständige Gewichtslosigkeit'],
    guide: ['Abgeleitete Größe „Scheingewicht (Normalkraft)“ ablesen und mit mg vergleichen', 'a_y auf −g setzen: Welcher Wert wird angezeigt?', 'Warum fühlt man sich in einem abbremsend abwärts fahrenden Aufzug auch schwerer?'],
  },
  'chase-meeting': {
    summary: {
      coreModel: 'x₁ = x₀₁ + v₁t, x₂ = x₀₂ + v₂t: Begegnungsbedingung x₁ = x₂ → t = 4/(3−1) = 2 s, bei x = 2 m eingeholt. Beide Kugeln auf zwei Spuren, Engine nur echte Kinematik, kein Stoss.',
      parameters: ['Verfolger v₁ = 3 m/s (4 m hinterher)', 'Vordermann v₂ = 1 m/s', 'Spurabstand 1,4 m'],
      feedback: ['Beide Fahrzeuge fahren jeweils gleichförmig', 'x–t-Diagramm zwei sich schneidende Geraden = Begegnungspunkt', 'Bahnen zwei parallele Spuren'],
      errors: ['Begegnung bedeutet Positionen gleich, nicht Geschwindigkeiten gleich', 'Falls v₁ ≤ v₂ niemals eingeholt — relative Verschiebung verkleinert sich nicht'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 2 Gleichmäßig beschleunigte Geradlinige Bewegung', ['Geschwindigkeits-Zeit-Beziehung bei gleichmäßig beschleunigter Bewegung'])],
    aliases: ['Einholen', 'Begegnung', 'Begegnungsproblem', 'Verfolgen', 'Relative Bewegung'],
    guide: ['Experiment ausführen, Schnittpunkt der zwei x–t-Geraden finden', 'Mit Δx/Δv = 4/2 Begegnungszeit von Hand berechnen und vergleichen', 'Wenn Vorderfahrzeug auch 3 m/s fährt: Wie sehen die Geraden aus?'],
  },
  'hooke-law': {
    summary: {
      coreModel: 'kΔx = mg: Bei ruhend hängendem Gewicht sind Federkraft und Gewichtskraft im Gleichgewicht, Δx = mg/k proportional zur Masse — ändert man m oder k, ändern sich Dehnung und Federkraftanzeige synchron.',
      parameters: ['Federkonstante k', 'Hängende Masse m', 'Schwerebeschleunigung g'],
      feedback: ['Federlänge ändert sich mit Gewichtmasse', 'Abgeleitete Grössen geben Δx und Federkraft F', 'Prüfzeile kontrolliert kΔx = mg und Aufhängeposition'],
      errors: ['Ausserhalb Elastizitätsgrenze gilt F = kx nicht mehr (Modell geht stets von innerhalb der Elastizitätsgrenze aus)', 'Eigenmasse der Feder vernachlässigt'],
    },
    textbook: [hs('Pflicht 1. Band', 'Kapitel 3 Wechselwirkung — Kraft', ['Gewicht und Federkraft', 'Experiment: Federkraft und Formänderung untersuchen'])],
    aliases: ['Hookesches Gesetz', 'Feder', 'Federkraft', 'Formänderung', 'k-Wert', 'Federkraftmesser'],
    guide: ['Δx und F aus abgeleiteten Grössen aufzeichnen, F = kΔx prüfen', 'm verdoppeln: Verdoppelt sich Δx auch?', 'k halbieren und beobachten — was ist die physikalische Bedeutung von k?'],
  },
  'spring-oscillator': {
    summary: {
      coreModel: 'F = −kx → x = x_eq + A·cos(ωt + φ), ω = √(k/m): Rückstellkraft-getriebene harmonische Schwingung, Periode T = 2π√(m/k) unabhängig von Amplitude.',
      parameters: ['Schwingermasse m', 'Federkonstante k', 'Amplitude A', 'Schwerebeschleunigung g'],
      feedback: ['Gleitblock schwingt hin und her um Gleichgewichtsposition', 'x–t-Diagramm ist Sinuskurve', 'Feder dehnt/staucht sich echtzeitlich mit Dehnung', 'Abgeleitete Grössen geben T, ω, Rückstellkraft'],
      errors: ['Modell geht von glatter Horizontalfläche (keine Reibung) und ideeller Feder aus', 'Bei grosser Amplitude weicht echte Feder von Linearität ab'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 2 Mechanische Schwingungen', ['Harmonische Schwingung', 'Beschreibung harmonischer Schwingung'])],
    aliases: ['Federpendel', 'Harmonisch', 'Schwingung', 'Periode', 'Rückstellkraft', 'SHM'],
    guide: ['Experiment ausführen, einen vollständigen Hin- und Rücklauf zählen — entspricht einem Perioden auf x–t-Kurve', 'm auf 4-fach ändern: Wie verändert sich T? T ∝ √m prüfen', 'A verdoppeln: Ändert sich T? „Gleichzeitigkeit“ erfahren'],
  },
  'circular-orbit': {
    summary: {
      coreModel:
        'Gravitation liefert Zentripetalkraft: GMm/r² = mv²/r, also v = √(GM/r), T = 2πr/v. Erde GM = 3,986×10¹⁴ m³/s², r = 6,8×10⁶ m (ca. 420 km über Boden) ergibt v = 7,66 km/s, T = 93,0 min — genau die ISS-Bahn.',
      parameters: ['Satellitenmasse m', 'Zentralkörper GM', 'Bahnradius r'],
      feedback: [
        'Beschleunigung zeigt stets zum Kreismittelpunkt, Geschwindigkeit stets tangential (a·v = 0)',
        'Grösserer Radius → geringere Geschwindigkeit, längere Periode (T ∝ r^1,5)',
        'Bahn geschlossen: Nach einer Periode kehrt Satellit zum Startpunkt zurück',
      ],
      errors: [
        'Satellit „fällt nicht runter“ nicht weil keine Gravitation: Gravitation wird komplett für Zentripetalkraft verwendet, keine überschüssige Komponente zieht ihn zum Fallen',
        'v = √(GM/r) unabhängig von Satellitenmasse — schwere Satelliten erfahren grössere Kraft, aber Beschleunigung gleich',
        'Kreisbahn als „Gravitation null“ missverstehen: Schwerelosigkeit in ISS ist Freier Fall, nicht fehlende Gravitation',
      ],
    },
    textbook: [hs('Pflicht 2. Band', 'Kapitel 7 Gravitation und Weltraumfahrt', ['Gravitationsgesetz', 'Weltraumfahrt'])],
    aliases: ['Gravitation', 'Zentripetalkraft', 'Kreisbahnen', 'Satellit', 'Weltraumgeschwindigkeiten', 'Kepler', 'GM/r²', 'mv²/r'],
    guide: ['Beschleunigungsmarkierung ansehen: Wohin zeigt sie? Senkrecht zur Geschwindigkeit?', 'Radius vergrössern: Wie ändern sich Geschwindigkeit und Periode?', 'Nach einer Periode: Ist der Satellit zum Startpunkt zurückgekehrt?'],
  },
  'simple-pendulum': {
    summary: {
      coreModel: 'θ = θ₀·cos(ωt), T = 2π√(L/g): Im Kleine-Winkel-Näherung führt der Fadenpendel eine harmonische Schwingung aus, Periode nur von Pendellänge und g abhängig.',
      parameters: ['Pendelkugelmasse m', 'Pendellänge L', 'Auschlenkwinkel θ₀', 'Schwerebeschleunigung g'],
      feedback: ['Pendelkugel schwingt entlang Bogen hin und her', 'x–t / v–t Diagramme zeigen Periodizität', 'Abgeleitete Grössen geben T und Fadenspannung'],
      errors: ['Bei grösserem θ₀ versagt Kleine-Winkel-Näherung (echte Periode etwas länger)', 'Luftwiderstand und Fadenmasse vernachlässigt'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 2 Mechanische Schwingungen', ['Fadenpendel', 'Experiment: g mit Fadenpendel messen'])],
    aliases: ['Fadenpendel', 'Pendel', 'Pendellänge', 'Periode', 'g-Messung'],
    guide: ['Pendellänge L ändern: Wie ändert sich T? T ∝ √L prüfen', 'Masse m ändern: Ändert sich T? Warum?', 'Mit T und L g zurückrechnen, mit Sollwert vergleichen'],
  },
  'friction-static': {
    summary: {
      coreModel: 'f_stat = F ≤ μ_s N, nach Gleiten f_dyn = μ_k N: Zugkraft nimmt mit 2 N/s zu, bei t = μsN/2 s beginnt Körper zu gleiten, Reibungskraft springt im Gleitmoment von 9,8 N auf 5,88 N ab.',
      parameters: ['Körpermasse m', 'Zugkraft (allmählich zunehmend)', 'Haftreibungskoeffizient μs', 'Gleitreibungskoeffizient μk', 'Schwerebeschleunigung g'],
      feedback: ['Ruhephase f wächst synchron mit F', 'Im Gleitmoment f springt ab, Körper beginnt zu beschleunigen', 'Datenseite zeigt maximalen Haftreibungswert und Gleitreibung', 'Prüfzeile kontrolliert Ruhephasengleichgewicht und Gleitphase a = (F−μkN)/m'],
      errors: ['Modell nimmt μs als exakten Schwellenwert; echte Kontaktflächen zeigen Kriechen und Geschwindigkeitsabhängigkeit', 'Linear wachsende Zugkraft ist Versuchsprotokoll-Annahme'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 8 Bewegung und Kraft', ['Reibungskraft']), hs('Pflicht 1. Band', 'Kapitel 3 Wechselwirkung — Kraft', ['Reibungskraft'])],
    aliases: ['Haftreibung', 'Gleitreibung', 'Reibungskraft', 'Maximale Haftreibung', 'μs', 'μk', 'Kraftmesser', 'Gleitreibungskraft'],
    guide: ['Experiment ausführen, Moment des f-Abfalls finden — wie gross ist die Zugkraft dann?', 'Maximale Haftreibung = μsN prüfen', 'μs vergrössern: Wie verschiebt sich der Gleitmoment?'],
  },
  'friction-mu': {
    summary: {
      coreModel: 'Gleiten unter konstanter Zugkraft: f = μkN, a = (F − f)/m. Datenseite gibt direkt f und N, daraus μk = f/N Rückrechnung des Gleitreibungskoeffizienten.',
      parameters: ['Körpermasse m', 'Zugkraft F', 'Gleitreibungskoeffizient μk', 'Schwerebeschleunigung g'],
      feedback: ['Körper gleitet sofort und gleichmäßig beschleunigt', 'Abgeleitete Grössen geben f, N und Gleitzeitpunkt', 'v–t ist schräge Gerade'],
      errors: ['μk wird als geschwindigkeitsunabhängig angenommen', 'Ablesung nimmt f der Gleitphase — Ruhephasen f = F nicht verwendbar'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 8 Bewegung und Kraft', ['Reibungskraft'])],
    aliases: ['Gleitreibungskoeffizient', 'Reibung messen', 'μk', 'Reibungskoeffizienten-Messung', 'Gleitreibungskraft', 'Reibung vergrössern verringern'],
    guide: ['Experiment ausführen, f und N in abgeleiteten Grössen ablesen', 'Mit μk = f/N Gleitreibungskoeffizient berechnen, mit Sollwert vergleichen', 'F ändern: Ändert sich f? Erfahren: f unabhängig von Zugkraft'],
  },

  /* ------------------------------------------------------------ electric -- */

  'point-charge': {
    summary: {
      coreModel: 'E = kQ/r²: Kugelsymmetrisches Feld des Punktelementarladung; Prüfpunkts-Feldstärke und Potential ändern sich umgekehrt proportional zum Quadrat der Distanz.',
      parameters: ['Quellladung Q', 'Prüfpunktsposition'],
      feedback: ['Feldlinien strahlen von positiver Ladung nach aussen', 'Equipotentialflächen sind konzentrische Kreise um Ladung', 'Prüfpunktsanzeige ändert sich mit r'],
      errors: ['Punktladung ist Ideales Modell', 'Feldliniendichte ist schematisch, Massgebend ist E = kQ/r²'],
    },
    textbook: [hs('Pflicht 3. Band', 'Kapitel 9 Elektrisches Feld und Anwendungen', ['Elektrisches Feld, Feldstärke'])],
    aliases: ['Punktladung', 'Coulombsches Gesetz', 'Feldstärke', 'Equipotentialfläche', 'kQ/r2'],
    guide: ['Prüfpunkt nach aussen ziehen, E-Änderung beobachten', 'Q negativ machen: Wie ändert sich Feldlinienrichtung?', 'E bei 2r mit E bei r vergleichen'],
  },
  'multi-point-charge': {
    summary: {
      coreModel: 'E⃗ = ΣkQᵢr̂ᵢ/rᵢ²: Feld mehrerer Punktladungen nach Vektoraddition; gleich grosse, entgegengesetzte Ladungen auf Mittelsenkrechten charakteristische Feldverteilung.',
      parameters: ['Quellladungen Qᵢ und Positionen', 'Prüfpunktsposition'],
      feedback: ['Zwei Feldliniensätze verformen sich gegenseitig', 'Prüfpunktsanzeige ist Vektorsumme'],
      errors: ['Feldstärke ist Vektoraddition, Beträge nicht direkt addierbar', 'Potential ist Skalar, direkt addierbar'],
    },
    textbook: [hs('Pflicht 3. Band', 'Kapitel 9 Elektrisches Feld und Anwendungen', ['Elektrisches Feld, Feldstärke', 'Überlagerung des elektrischen Feldes'])],
    aliases: ['Elektrisches Dipol', 'Feldüberlagerung', 'Gleich grosse entgegengesetzte Ladungen', 'Mittelsenkrechte'],
    guide: ['Prüfpunkt auf Mittelsenkrechte legen, Resultierendenrichtung beobachten', 'Prüfpunkt auf Verbindungslinienmittelpunkt: Wie gross ist E?', 'Eine Ladung gleiches Vorzeichen geben: Wie ändern sich Feldlinien?'],
  },
  'uniform-electric': {
    summary: {
      coreModel: 'a = qE/m: Geladenes Teilchen tritt mit horizontaler Anfangsgeschwindigkeit in senkrechtes homogenes E-Feld ein, führt artgleiche Bewegung wie waagerechter Wurf aus; Ablenkung y = qEt²/(2m).',
      parameters: ['Ladungsmenge q', 'Masse m', 'Anfangsgeschwindigkeit v₀', 'Feldstärke E und Richtung'],
      feedback: ['Bahn ist Parabel (elektrische Version des waagerechten Wurfs)', 'Geschwindigkeits-Senkrechtkomponente wächst linear'],
      errors: ['Nur elektrische Kraft berücksichtigt, Gravitation vernachlässigt (Teilchenmassstab gerechtfertigt)', 'Homogenes Feld auf Plattenzwischenraum begrenzt'],
    },
    textbook: [hs('Pflicht 3. Band', 'Kapitel 10 Energie im elektrischen Feld', ['Bewegung geladener Teilchen im elektrischen Feld'])],
    aliases: ['Homogenes elektrisches Feld', 'Artgleicher waagerechter Wurf', 'Ablenkung', 'qE', 'Feldstärke'],
    guide: ['Vergleich mit waagerechtem Wurf: Bahnform', 'E verdoppeln: Wie ändert sich Ablenkung?', 'q negativ: In welche Richtung biegt die Parabel?'],
  },
  'parallel-plate': {
    summary: {
      coreModel: 'E = U/d: Ablenkung im homogenen Feld zwischen Parallelplatten, y = qUL²/(2dmv₀²), nach Austritt gleichförmige Gerade zum Schirm.',
      parameters: ['Plattenspannung U', 'Plattenabstand d', 'Teilchen q/m/v₀'],
      feedback: ['Innerhalb Platten Parabel, ausserhalb Gerade — zweiteilige Bahn', 'Schirmverschiebung ändert sich linear mit U'],
      errors: ['Ablenkung massgebend nach Engine-Ausgabe deflection', 'Randfeld vernachlässigt'],
    },
    textbook: [hs('Pflicht 3. Band', 'Kapitel 10 Energie im elektrischen Feld', ['Bewegung geladener Teilchen im elektrischen Feld', 'Oszilloskop-Prinzip'])],
    aliases: ['Parallelplatten', 'Kondensator', 'Ablenkung', 'Oszilloskop', 'U/d', 'Ablenkung geladener Teilchen', 'Bewegung geladener Teilchen im elektrischen Feld'],
    guide: ['U ändern: Ist Schirmverschiebung proportional zu U?', 'd ändern: Wie ändert sich E = U/d?', 'v₀ vergrössern: Warum wird Ablenkung kleiner?'],
  },

  /* ------------------------------------------------------------ magnetic -- */

  motor: {
    summary: {
      coreModel:
        'Stromdurchflossene Spule im Magnetfeld: Je Kante wirkt F = B·I·L, Richtungen entgegengesetzt, Abstand eine Spulenbreite, Resultierendes Drehmoment τ = n·B·I·A·cosθ. B = 0,5 T, n = 100, I = 2 A, 6 cm × 4 cm ergibt pro Kante 0,06 N, Drehmoment 0,24 N·m; nach 90° Drehung Drehmoment null (Gleichgewichtsposition), Kommutator kehrt hier Stromrichtung um, Spule dreht kontinuierlich in eine Richtung.',
      parameters: ['Strom I', 'Statorfeld B', 'Windungszahl n', 'Kraftwirkende Kantenlänge L', 'Spulenbreite W', 'Spulenwinkel θ'],
      feedback: [
        'θ = 0: Drehmoment maximal, θ = 90°: Drehmoment null, Kantenkräfte aber unverändert',
        'Strom verdoppelt: Drehmoment verdoppelt (anders als Quadratgesetz beim Elektromagneten)',
        'Strom umgekehrt: Kantenkräfte umgekehrt, Drehrichtung ebenfalls umgekehrt',
      ],
      errors: [
        '„Drehmoment null“ mit „Kraft null“ verwechseln: In Gleichgewichtsposition wirken Kantenkräfte weiter BIL, nur Hebelarm wird null',
        'Kommutator vergessen: Bloße Spule nach Passieren der Gleichgewichtsposition kehrt Drehmoment um, würde hin- und herschwingen statt dauerhaft zu drehen',
      ],
    },
    textbook: [js('9. Klasse', 'Kapitel 20 Elektrizität und Magnetismus', ['Elektromotor', 'Wirkung des Magnetfelds auf stromdurchflossenen Leiter', 'Kommutator'])],
    aliases: ['Elektromotor', 'Amperesche Kraft', 'Magnetfeldwirkung auf Strom', 'Linkshand-Regel', 'Kommutator', 'Stromdurchflossene Spule', 'Drehmoment', 'Gleichstrommotor'],
    guide: ['Zuerst θ = 0 betrachten: Hier ist Drehmoment maximal', 'Spule auf 90° drehen: Wie gross ist das Drehmoment? Haben die Kantenkräfte sich geändert?', 'Stromrichtung umkehren: Wie ändert sich die Drehrichtung?'],
  },

  electromagnet: {
    summary: {
      coreModel:
        'B = μ_r·μ₀(N/L)I, Anziehungskraft F = B²A/(2μ₀). Eisenkern multipliziert Feld mit μ_r, Kraft aber proportional zu B², also Verstärkung um μ_r²: Derselbe Spule, Luftkern nur 0,25 mN, mit μ_r = 200 Eisenkern 10,05 N — 40 000-fach, 4 cm² Polfläche kann damit ca. 1 kg Eisen anheben.',
      parameters: ['Strom I', 'Windungszahl N', 'Spulenlänge L', 'Eisenkern μ_r', 'Vergleichskern μ_r₂', 'Polfläche A'],
      feedback: [
        'Luftkern / Haupteisenkern / Vergleichskern drei Zeilen nebeneinander: μ_r, B, Anziehungskraft, hebbarer Masse',
        'Strom verdoppelt: B verdoppelt, Kraft vervierfacht',
        'Kern mit 4-fachem μ_r: B vervierfacht, Kraft 16-fach',
      ],
      errors: [
        'Kraft als proportional zu B ansehen: F ∝ B², μ_r multipliziert nur B mit μ_r, Kraft steigt aber um μ_r²',
        'Echter Eisenkern sättigt (magnetische Flussdichte < 2 T), Modell nur im linearen Bereich gültig, μ_r nicht beliebig vergrösserbar',
      ],
    },
    textbook: [js('9. Klasse', 'Kapitel 20 Elektrizität und Magnetismus', ['Elektromagnet', 'Magnetische Eigenschaften des Elektromagneten', 'Strom erzeugt Magnetismus'])],
    aliases: [
      'Elektromagnet', 'Magnetische Eigenschaften des Elektromagneten', 'Eisenkern', 'Permeabilität', 'Strom erzeugt Magnetismus',
      'Stromdurchflossene Spule mit Eisenkern', 'Magnetstärke', 'Anziehungskraft',
    ],
    guide: ['Zuerst Luftkern-Zeile ansehen: Fast keine Anziehungskraft', 'Weicheisenkern einsetzen: Wie gross wird die Anziehungskraft?', 'Strom verdoppeln: Wie vervielfacht sich die Anziehungskraft?'],
  },

  'straight-wire-field': {
    summary: {
      coreModel:
        'B = μ₀I/(2πr): Magnetfeld um stromdurchflossenen geraden Leiter sind konzentrische Kreise, umgekehrt proportional zur Distanz, proportional zum Strom. 10 A Strom an 5 cm Abstand 40 µT, an 10 cm genau 20 µT — π in μ₀ kürzt sich mit 2πr, beide Messwerte sind ganze Zahlen.',
      parameters: ['Strom I', 'Messabstand r', 'Vergleichsmessabstand r₂'],
      feedback: ['Zwei Messpunkte nebeneinander angezeigt: 40 µT und 20 µT', 'Distanz verdoppelt, Messwert genau halbiert', 'Strom umgekehrt: Messwert unverändert, Umlaufrichtung umgekehrt'],
      errors: [
        'B als proportional zu r ansehen: Magnetfeld schwächt mit wachsender Distanz ab, umgekehrt proportional stimmt mit 40→20 überein',
        'Stromrichtung bestimmt Umlaufrichtung vergessen — Amperesche Regel: Rechte Hand um Leiter, Daumen zeigt Strom, Finger zeigen Feldumlauf',
      ],
    },
    textbook: [js('9. Klasse', 'Kapitel 20 Elektrizität und Magnetismus', ['Strom erzeugt Magnetismus', 'Magnetfeld um stromdurchflossenen geraden Leiter'])],
    aliases: [
      'Strom erzeugt Magnetismus', 'Amperesche Regel', 'Rechte-Hand-Schrauben-Regel', 'Stromdurchflossener gerader Leiter', 'Gerader Strom Magnetfeld',
      'Oersted-Experiment', 'Magnetfeldrichtung', 'Um stromdurchflossenen Leiter',
    ],
    guide: ['Messpunkt von 5 cm auf 10 cm verschieben: Wie ändert sich der Messwert?', 'Strom verdoppeln: Wie ändert sich der Messwert?', 'Strom umkehren: Wie ändert sich die Umlaufrichtung?'],
  },
  'solenoid-field': {
    summary: {
      coreModel:
        'B = μ₀(N/L)I: Inneres der stromdurchflossenen Spule ist homogenes Magnetfeld. n = N/L = 2000 Windungen/m, I = 5 A ergibt B = μ₀nI = 4π×10⁻³ T ≈ 12,57 mT; am Spulenende genau die Hälfte des Innern. Feldrichtung nach Amperescher Regel: Finger in Strom-Umlaufrichtung, Daumen zeigt zum N-Pol.',
      parameters: ['Strom I', 'Windungszahl N', 'Spulenlänge L', 'Vergleichswicklung N₂'],
      feedback: ['Windungszahl auf 800 verdoppelt, Feld verdoppelt sich genau', 'Länge halbiert, Windungen pro Länge verdoppelt, Feld verdoppelt sich auch', 'Spulenende-Anzeige immer Hälfte des Innern'],
      errors: [
        'Annahme, Spuleninneres Feld sei „punktförmig“: Homogen bedeutet gleiche Anzeige überall, erst am Ende halbiert',
        'Amperesche Regel falschen Pol zeigen — Daumenzeigende Seite ist N-Pol, Stromumkehr vertauscht Nord-Süd',
      ],
    },
    textbook: [js('9. Klasse', 'Kapitel 20 Elektrizität und Magnetismus', ['Strom erzeugt Magnetismus', 'Stromdurchflossene Spule', 'Amperesche Regel'])],
    aliases: [
      'Stromdurchflossene Spule', 'Spule', 'Strom erzeugt Magnetismus', 'Amperesche Regel', 'Rechte-Hand-Schrauben-Regel',
      'Magnetfeld der stromdurchflossenen Spule', 'Nordpol', 'Nord-Süd-Pol',
    ],
    guide: ['Windungszahl von 400 auf 800 ändern: Wie ändert sich das Magnetfeld?', 'Spulenlänge halbieren: Wie ändert sich das Magnetfeld?', 'Strom umkehren: Welcher Pol wird zum Nordpol?'],
  },

  'magnetic-circular': {
    summary: {
      coreModel: 'qvB = mv²/r: Lorentzkraft liefert Zentripetalkraft, r = mv/(qB), T = 2πm/(qB) unabhängig von Geschwindigkeit.',
      parameters: ['Ladung q', 'Masse m', 'Geschwindigkeit v', 'Magnetflussdichte B und Richtung'],
      feedback: ['Bahn ist vollständiger Kreis', 'Radius ändert sich sofort mit v, B', 'Periodenanzeige unabhängig von v'],
      errors: ['Lorentzkraft leistet keine Arbeit — Betrag der Geschwindigkeit konstant, nur Richtung ändert sich', 'Nur v⊥B ergibt Kreis, Parallelkomponente ergäbe Schraubenlinie'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Bewegung geladener Teilchen im homogenen Magnetfeld'])],
    /* Zentripetalkraft ist hier begründet aufgenommen: qvB = mv²/r und r = mv/(qB) sind **dasselbe Gleichung in zwei Formen** —
   Die Lorentzkraft ist genau jene zum Mittelpunkt gerichtete Resultierende, der Zyklotronradius wird eben aus der Zentripetalkraft-Beziehung gelöst. Schüler suchen
   nach „Zentripetalkraft“ und erhalten einen echten Kreisbahnversuch, nicht ein leeres Stichwort.
   (Gravitation anders: Jene Kraft stammt von Gravitation, nicht Lorentzkraft, daher hängt sie nicht an diesem Versuchsplatz.) */
    aliases: [
      'Lorentzkraft', 'Kreisbewegung', 'Zyklotronradius', 'r=mv/qB',
      'Zentripetalkraft', 'Zentripetalbeschleunigung', 'mv²/r',
    ],
    guide: [
      'v verdoppeln: Wie ändern sich Radius und Periode?',
      'B verdoppeln: Wie ändert sich der Radius?',
      'Teilchenladung ändern: Wie ändert sich die Drehrichtung?',
      'Kraftmarkierung ansehen: Lorentzkraft zeigt stets zum Mittelpunkt, sie ist hier die Zentripetalkraft (qvB = mv²/r)',
    ],
  },

  /* ------------------------------------------------------------- circuit -- */

  'short-circuit': {
    summary: {
      coreModel:
        'Kurzschluss: Kreis hat keine Last, Strom nur durch Innenwiderstand der Quelle bestimmt, I = E/r; gleichzeitig Klemmenspannung U = E − Ir = 0, gesamte EMK fällt am Innenwiderstand ab. E = 6 V, r = 0,5 Ω ergibt I = 12 A.',
      parameters: ['Quellen-EMK E', 'Innenwiderstand r', 'Schalterzustand'],
      feedback: ['Amperemeter-Anzeige weit über normalem Kreis', 'Klemmenspannung fällt auf 0', 'Schalter öffnen: Strom sofort null'],
      errors: [
        'Glaube „Spannung vom Kurzschluss aufgefressen“: Ganze EMK fällt am Innenwiderstand ab (U_in = Ir = E), äusserer Kreis bekommt 0',
        'Innenwiderstand vernachlässigt ergibt unendlich grossen Strom — real begrenzen Innenwiderstand und Leitungswiderstand den Kurzschlussstrom',
        'Kurzschluss als dauerhaft arbeitbaren Zustand ansehen: Es ist Fehler, Leitungen und Quelle überhitzen',
      ],
    },
    textbook: [js('9. Klasse', 'Kapitel 19 Haushaltselektrizität', ['Haushaltsstromkreis', 'Sicherer Umgang mit Elektrizität'])],
    aliases: ['Kurzschluss', 'Innenwiderstand', 'Klemmenspannung', 'Sicherer Umgang mit Elektrizität', 'Kurzschlussstrom', 'I=E/r'],
    guide: ['Amperemeter-Anzeige ansehen: Wie viel grösser als normaler Kreis?', 'Schalter öffnen: Welche Werte nehmen Strom und Klemmenspannung an?', 'Innenwiderstand vergrössern: Wie ändert sich der Kurzschlussstrom?'],
  },
  'series-circuit': {
    summary: {
      coreModel: 'Reihenschaltung: I überall gleich, U = ΣUᵢ, R = ΣRᵢ; Spannungsteilung proportional zu Widerstand.',
      parameters: ['Quellenspannung', 'Einzelne Widerstandswerte'],
      feedback: ['Amperemeter-Anzeige überall identisch', 'Einzelwiderstandsspannungen nach Widerstandswerten verteilt', 'Schalter öffnen: ganzer Kreis geht auf null'],
      errors: ['Amperemeter-Innenwiderstand vernachlässigt', 'Leitungswiderstand vernachlässigt'],
    },
    textbook: [js('9. Klasse', 'Kapitel 15 Strom und Stromkreis', ['Reihen- und Parallelschaltung']), js('9. Klasse', 'Kapitel 17 Ohmsches Gesetz', ['Reihenschaltung von Widerständen'])],
    aliases: ['Reihenschaltung', 'Stromgesetz', 'Spannungsteilung', 'Reihen-Parallelschaltung', 'Reihenschaltung Spannungsteilung', 'Reihenschaltung Berechnung', 'Realer Stromkreis Aufbau'],
    guide: ['Amperemeter und Einzelwiderstandsspannungen ablesen', 'Ugesamt = U₁ + U₂ prüfen', 'Schalter betätigen: Ganzer Stromkreis gleichzeitig stromlos'],
  },
  'parallel-circuit': {
    summary: {
      coreModel: 'Parallelschaltung: U an allen Zweigen gleich, I_haupt = ΣIᵢ, 1/R = Σ1/Rᵢ; Stromteilung umgekehrt proportional zum Widerstand.',
      parameters: ['Quellenspannung', 'Einzelne Zweigwiderstände'],
      feedback: ['Alle Zweigspannungen identisch', 'Hauptstrom gleich Summe der Zweigströme', 'Einen Zweig öffnen: übrige unbeeinflusst'],
      errors: ['Zweige unbeeinflusst voraussetzt quellennfreien Innenwiderstand'],
    },
    textbook: [js('9. Klasse', 'Kapitel 15 Strom und Stromkreis', ['Reihen- und Parallelschaltung']), js('9. Klasse', 'Kapitel 17 Ohmsches Gesetz', ['Parallelschaltung von Widerständen'])],
    aliases: ['Parallelschaltung', 'Stromteilung', 'Zweig', 'Hauptstrom', 'Reihen-Parallelschaltung'],
    guide: ['Beziehung zwischen Zweigströmen und Widerständen vergleichen', 'Ihaupt = I₁ + I₂ prüfen', 'Einen Zweigschalter öffnen, anderen Zweig beobachten'],
  },
  'mixed-circuit': {
    summary: {
      coreModel: 'Mischschaltung: Zuerst parallel dann serie (oder umgekehrt) schrittweise ersetzen; vom fernsten Ende zur Quelle schrittweise Widerstände zusammenfassen.',
      parameters: ['Quellenspannung', 'Einzelne Widerstandswerte'],
      feedback: ['Gesamtstrom ändert sich mit Ersatzwiderstand', 'Parallelteil an beiden Enden gleiche Spannung'],
      errors: ['Ersatzreihenfolge falsch → Ergebnis falsch — erst Topologie erkennen dann zusammenfassen'],
    },
    textbook: [js('9. Klasse', 'Kapitel 17 Ohmsches Gesetz', ['Ohmsches Gesetz', 'Reihen- und Parallelschaltung von Widerständen'])],
    aliases: ['Mischschaltung', 'Ersatzwiderstand', 'Komplexer Stromkreis'],
    guide: ['Zuerst Parallelteil finden und zu einem Ersatzwiderstand zusammenfassen', 'Dann mit Reihenteil addieren für Gesamtwiderstand', 'I = U/Rgesamt prüfen'],
  },
  'rheostat-circuit': {
    summary: {
      coreModel: 'Schiefer Rheostat als Spannungsteiler: R_angeschlossen = Rmax·(Schieberposition), I = U/(R_fest + R_angeschlossen); wohin Schieber geschoben, ändert Strom entsprechend.',
      parameters: ['Quellenspannung', 'Festwiderstand', 'Rheostat-Gesamtwiderstand', 'Schieberposition'],
      feedback: ['Beim Ziehen des Schiebers ändern Amperemeter und Voltmeter in Echtzeit', 'Stromrichtungs-Pfeile aktualisieren mit Lösung', 'Diagramme synchron neu gezeichnet bei Parameteränderung'],
      errors: ['Schieber hat an beiden Enden Widerstandswerte — beachten welcher Abschnitt angeschlossen ist', 'Lineares Widerstandsnetzwerk, kein Kontaktwiderstand'],
    },
    textbook: [js('9. Klasse', 'Kapitel 16 Spannung Widerstand', ['Rheostat'])],
    aliases: ['Schieberheostat', 'Schieber', 'Heostat', 'Strombegrenzung', 'Schieberheostat', 'Dynamische Stromkreisanalyse'],
    guide: ['Schieber auf Zeichenfläche ziehen, Amperemeter-Änderung beobachten', 'Schieber auf 0 und 100% schieben, zwei Extremströme ablesen', 'Pfeiltasten für feine Schieberänderung (±5%)'],
  },
  'va-resistance': {
    summary: {
      coreModel: 'Volt-Ampere-Methode Widerstandsmessung: R = U/I; Schieber verschieben für mehrere (U, I) Werte, Mittelwert bilden, Innen-/Ausschaltung haben systematische Fehler.',
      parameters: ['Quellenspannung', 'Messwiderstand Rx', 'Rheostat-Gesamtwiderstand', 'Schieberposition'],
      feedback: ['Jede Schieberposition entspricht einer (U, I) Messwertgruppe', 'R = U/I sollte bei allen Gruppen im Wesentlichen konstant bleiben'],
      errors: ['Amperemeter-Innenanschluss misst Rx + RA, Aussenschaltung misst Rx∥RV — systematische Fehlerrichtung beurteilen können', 'Mehrere Gruppen messen, Mittelwert reduziert zufällige Fehler'],
    },
    textbook: [js('9. Klasse', 'Kapitel 17 Ohmsches Gesetz', ['Widerstandsmessung'])],
    aliases: ['Volt-Ampere-Methode', 'Widerstand messen', 'Innenanschluss', 'Aussenschaltung', 'Rx'],
    guide: ['Schieber verschieben für drei (U, I) Gruppen, jeweils R berechnen', 'Drei R-Werte konsistent? Wo liegt der Unterschied?', 'Überlegen: Innen- bzw. Aussenschaltung misst zu gross oder zu klein?'],
  },
  'bulb-power': {
    summary: {
      coreModel: 'P = UI: Schieber verstellen bis Glühlampe Nennspannung erreicht, Strom ablesen ergibt Nennleistung; tatsächliche Leistung ändert sich mit tatsächlicher Spannung.',
      parameters: ['Quellenspannung', 'Glühlampe-Äquivalenzwiderstand', 'Rheostat-Gesamtwiderstand', 'Schieberposition'],
      feedback: ['Voltmeter-Anzeige ändert sich mit Schieber', 'P = UI sofort berechenbar', 'Je heller Lampe, desto grössere tatsächliche Leistung'],
      errors: ['Modell behandelt Glühlampe als Festwiderstand — echter Glühfadenwiderstand ändert sich mit Temperatur', 'Nennleistung nur bei Nennspannung gültig'],
    },
    textbook: [js('9. Klasse', 'Kapitel 18 Elektrische Leistung', ['Leistung kleiner Glühlampe messen'])],
    aliases: ['Elektrische Leistung', 'Nennleistung', 'Kleine Glühlampe', 'P=UI', 'Joulesches Gesetz', 'Elektrische Leistung und Joulesches Gesetz'],
    guide: ['Schieber so einstellen dass Voltmeter Nennspannung anzeigt, I ablesen, P berechnen', 'Spannung unter Nennwert: Ist tatsächliche Leistung grösser oder kleiner?', 'Warum ist echter Glühlampewiderstand nicht konstant?'],
  },
  'emf-measurement': {
    summary: {
      coreModel: 'E = U + Ir: Klemmenspannung fällt linear mit Laststrom; U–I-Ausgleichsgerade hat Abschnitt E, Steigungsbetrag r.',
      parameters: ['EMK E', 'Innenwiderstand r', 'Aussenwiderstand R'],
      feedback: ['Bei R-Änderung bewegen sich U und I entlang einer Geraden', 'Kurzschluss I = E/r, Leerlauf U = E'],
      errors: ['Voltmeter-Nebenschluss bringt systematischen Fehler — gemessenes E, r beide zu klein', 'Zu wenige Datenpunkte, Ausgleich instabil'],
    },
    textbook: [hs('Pflicht 3. Band', 'Kapitel 12 Elektrische Energie Energieerhaltung', ['Experiment: Messung von EMK und Innenwiderstand der Batterie'])],
    aliases: ['Elektromotorische Kraft', 'Innenwiderstand', 'Geschlossener Stromkreis', 'Klemmenspannung', 'U-I-Diagramm', 'Messung von Quellen-EMK und Innenwiderstand', 'Geschlossener Stromkreis Ohmsches Gesetz'],
    guide: ['R ändern, mehrere (I, U) Paare notieren', 'Im Diagramm U–I Geradenabschnitt und Steigung ansehen', 'R = r: Ausgangsleistung maximal — finden'],
  },

  /* -------------------------------------------------------------- optics -- */

  'total-reflection': {
    summary: {
      coreModel:
        'Totalreflexion: n₁sinθ₁ = n₂sinθ₂, wenn Licht aus optisch dichtem Medium in optisch dünnes Medium eintritt und Einfallswinkel den kritischen Winkel θ_c = arcsin(n₂/n₁) überschreitet, existiert gebrochener Strahl nicht mehr, Licht wird vollständig reflektiert. Glas (1,5) zu Luft (1,0) kritischer Winkel ist 41,8°.',
      parameters: ['Einfallsmedium Brechzahl n₁', 'Brechmedium Brechzahl n₂', 'Einfallswinkel θ₁'],
      feedback: [
        'Einfallswinkel über kritischem Winkel: gebrochener Strahl verschwindet komplett, nur reflektierter Strahl bleibt',
        'Einfallswinkel unter kritischen Winkel senken: gebrochener Strahl erscheint sofort',
        'Je näher n₂ an n₁, desto grösser kritischer Winkel, desto schwieriger Totalreflexion; von optisch dünn nach dicht gar kein kritischer Winkel',
      ],
      errors: [
        'Totalreflexion als „Brechungswinkel nähert sich 90° starke Brechung“ missverstehen: In jenem Moment existiert gebrochener Strahl nicht mehr, ist Schwellenwert nicht allmählich',
        'Annahme, zwischen je zwei Medien gebe es kritischen Winkel: nur von optisch dicht nach dünn (n₁ > n₂)',
        'Voraussetzung „Licht von dicht nach dünn“ vergessen: Richtung umgekehrt → keine Totalreflexion',
      ],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 4 Lichtphänomene', ['Lichtbrechung', 'Totalreflexion'])],
    aliases: ['Totalreflexion', 'Kritischer Winkel', 'Brechung', 'Lichtwellenleiter', 'Brechungsgesetz', 'Snell', 'n1sinθ1'],
    guide: ['Bei 45° prüfen: Gibt es noch gebrochenen Strahl?', 'Einfallswinkel schrittweise unter 41,8° senken: Wann erscheint gebrochener Strahl?', 'n₂ vergrössern: Wie ändert sich der kritische Winkel?'],
  },
  pinhole: {
    summary: {
      coreModel:
        'Lichtausbreitung geradlinig: Von jedem Punkt des Gegenstands ausgehendes Licht geht nach Durchgang durch Loch weiter geradeaus, auf Schirm entsteht aufrechtes Bild, h′ = h·v/u. 6 cm Pfeil 30 cm vor Loch, Schirm 15 cm hinter Loch ergibt 3 cm Bild, Vergrösserung v/u = 1/2; Schirm auf Gegenstandsabstand verschoben, Bild und Gegenstand gleich gross.',
      parameters: ['Gegenstandshöhe h', 'Gegenstandsweite u', 'Bildweite v'],
      feedback: [
        'Bild immer aufrecht: Pfeilspitze erscheint unten auf Schirm',
        'Je weiter Schirm desto grösser Bild, je weiter Gegenstand desto kleiner Bild — nur Verhältnis v/u massgebend',
        'v = u → Bild und Gegenstand gleich gross (Vergrösserung 1)',
      ],
      errors: [
        'Annahme, Bildgrösse hänge von Lochgrösse ab: Je kleiner Loch desto schärfer Bild, Grösse aber nur durch v/u bestimmt',
        'Aufrechtes Bild als „Lochvorschrift“ sehen: Es ist zwingende Folge geradlinigen Lichtlaufs, zwei Strahlen kreuzen sich im Loch',
        'Echtes Loch zeigt Beugung, zu kleines Loch macht Bild unscharf — Modell beschreibt nur geometrische Optik',
      ],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 4 Lichtphänomene', ['Geradlinige Lichtausbreitung', 'Lochbild'])],
    aliases: ['Lochbild', 'Geradlinige Lichtausbreitung', 'Geradeausausbreitung', 'Aufrechtes Bild', 'Nadel Loch', 'Schatten', 'Sonnenfinsternis'],
    guide: ['Zwei Lichtstrahlen beobachten: Wo kreuzen sie sich?', 'Schirm nach hinten verschieben: Wird Bild grösser oder kleiner?', 'Gegenstand nach vorne schieben (weg vom Loch): Wie ändert sich das Bild?'],
  },
  'plane-mirror': {
    summary: {
      coreModel: 'Ebener Spiegel bildet gleichgrosses, aufrechtes virtuelles Bild, Bildweite = Gegenstandsweite; Rückwärtsverlängerung reflektierter Strahlen schneiden sich im Bildpunkt.',
      parameters: ['Gegenstand (Kerze) Position', 'SpiegelPosition'],
      feedback: ['Hinter Spiegel erscheint symmetrisches virtuelles Bild', 'Lichtschirm an Bildposition fängt kein Bild ein', 'Reflektierte Strahlen und Rückwärtsverlängerungen beobachtbar'],
      errors: ['Virtuelles Bild ist keine tatsächliche Lichtkonvergenz — Lichtschirm-Auffangmethode beweist es', 'Glasplatte hat Dicke, bildet zwei schwache Bilder'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 4 Lichtphänomene', ['Ebenenspiegel-Bild'])],
    aliases: ['Ebener Spiegel', 'Virtuelles Bild', 'Gleich gross gleich weit', 'Bildentstehung', 'Lichtreflexion', 'Reflexionsgesetz', 'Reflexionsgesetz des Lichts', 'Ebenenspiegel-Bildeigenschaften'],
    guide: ['Kerze verschieben, Bildposition und -grösse beobachten', 'Lichtschirm an Bildposition: Kann man Bild auffangen?', 'Gegenstands- und Bildweite messen'],
  },
  'convex-lens': {
    summary: {
      coreModel: '1/f = 1/u + 1/v: u > 2f umgekehrtes verkleinertes reelles Bild, u = 2f gleichgross, f < u < 2f vergrössert, u = f kein Bild, u < f aufrechtes vergrössertes virtuelles Bild.',
      parameters: ['Brennweite f', 'Gegenstandsweite u'],
      feedback: ['Gegenstandsweite streicht über 2f und f, Bildcharakter springt um', 'Lichtschirm nur an reeller Bildposition fängt Bild ein', 'Drei besondere Strahlen schneiden sich im Bildpunkt'],
      errors: ['Virtuelles Bild muss durch Linse betrachtet werden, Lichtschirm fängt keines ein', 'u = f ist Grenze zwischen Bildentstehung und Nichtentstehung, nicht „Vergrösserung“'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 5 Linsen und Anwendungen', ['Bildentstehungsgesetz Sammellinse'])],
    aliases: ['Sammellinse', 'Bildentstehungsgesetz', 'Brennweite', 'Reelles Bild', 'Virtuelles Bild', 'Kamera', 'Lupe', 'Brechung', 'Lichtbrechung', 'Brechungsgesetz', 'Sammellinse Bild untersuchen', 'Linsen und Anwendungen'],
    guide: ['u von > 2f schrittweise verkleinern, Bild in jedem Bereich notieren', 'Was passiert bei u = f?', 'Bei u < f: Lichtschirm fängt kein Bild — wo ist das Bild?'],
  },
  'concave-mirror': {
    summary: {
      coreModel: 'Hohlspiegel gleiche Formel wie Sammellinse 1/f = 1/u + 1/v, aber reelles Bild entsteht spiegelvorderseitig; u streicht über 2f, f reproduziert ganze Bildtafel.',
      parameters: ['Brennweite f', 'Gegenstandsweite u'],
      feedback: ['Vor Spiegel entsteht umgekehrtes reelles Bild', 'f auf negativ gesetzt → wird Konvexspiegel', 'Besondere Strahlen (durch Zentrum, parallel, durch Brennpunkt) verfolgbar'],
      errors: ['Kugelspiegel ist Paraaxialnäherung — Randstrahlen haben Kugelaberration'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 4 Lichtphänomene', ['Lichtreflexion'])],
    aliases: ['Hohlspiegel', 'Kugelspiegel', 'Sammelspiegel', 'Sonnenofen', 'Lichtreflexion'],
    guide: ['Bei u > 2f: Was für ein Bild entsteht vor dem Spiegel?', 'f auf negativ: Welche Spiegelart ergibt sich?', 'Gegenstandsweite für gleichgrosses Bild finden'],
  },
  'convex-mirror': {
    summary: {
      coreModel: 'Konvexspiegel f < 0: Egal wie gross Gegenstandsweite, immer aufrechtes verkleinertes virtuelles Bild — vergrössertes Sichtfeld ist Grund für Rückspiegel.',
      parameters: ['Brennweite f (negativ)', 'Gegenstandsweite u'],
      feedback: ['Bild immer aufrecht verkleinert', 'Lichtschirm fängt nie Bild ein', 'Sichtbarer Sichtfeldbereich wird mit Spiegelkrümmung breiter'],
      errors: ['„Gegenstand näher als er erscheint“ — verkleinertes virtuelles Bild lässt Distanzschätzung fehlschlagen', 'Virtuelle Bildposition mit negativem f in Bildformel berechenbar'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 4 Lichtphänomene', ['Lichtreflexion', 'Kugelspiegel'])],
    aliases: ['Konvexspiegel', 'Rückspiegel', 'Streuung', 'Sichtfeld', 'Lichtreflexion'],
    guide: ['Gegenstandsweite verschieben: Ändert sich die Bildeigenschaft?', 'Mit Hohlspiegel bei gleicher Gegenstandsweite vergleichen', 'Erklären warum Auto-Rückspiegel Konvexspiegel sind'],
  },

  /* ----------------------------------------------------------- acoustics -- */

  noise: {
    summary: {
      coreModel:
        'Schallpegel L = 10·lg(I/I₀) (I₀ = 10⁻¹² W/m²), Punktquelle I = P/(4πr²) — zusammen L = Lw − 20·lg r − 10·lg(4π) − A, also **Distanz verdoppelt 6 dB weniger**, 10-fach 20 dB weniger, Schirmdämmung ist distanzunabhängige Subtraktion.',
      parameters: ['Schallquellen-Leistungspegel Lw', 'Hörerabstand r', 'Schirm-Schalldämmung A'],
      feedback: [
        'Bei 1 m 89,0 dB, zurück auf 2 m nur noch 83,0 dB',
        'Zurück auf 8 m: gegenüber 1 m um 18 dB weniger (Schallintensität nur noch ca. 1/64)',
        '15 dB Schirm hinzugefügt: Anzeige direkt weitere 15 dB weniger, unabhängig von Distanz',
      ],
      errors: [
        'Glaube „6 dB weniger ist kleine Verbesserung“: Schallintensität nur noch Viertel, drei Viertel der Energie weggenommen',
        '6 dB als „ein Sechstel weniger“ sehen: dB ist logarithmisch, Addition/Subtraktion entspricht Multiplikation',
        'Punktquellenannahme ignorieren: An Wand oder Boden anliegend, Schallwelle breitet sich auf kleinerer Halbkugel aus, Abschwächungsgesetz ändert sich',
      ],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 2 Schallphänomene', ['Gefährdung und Kontrolle von Lärm', 'Schallpegel'])],
    aliases: ['Lärm', 'Schallpegel', 'Dezibel', 'dB', 'Schalldämmung', 'Lärmkontrolle', 'Lärmminderung', 'Schallpegel'],
    guide: ['Anzeigen an 1 m und 2 m vergleichen: Wie gross ist der Unterschied?', 'Auf 8 m zurückgehen: Wie viele dB weniger als bei 1 m?', 'Schirm hinzufügen: Wie addieren sich Anzeige und Entfernungsdämpfung?'],
  },
  'echo-ranging': {
    summary: {
      coreModel: 'd = v·t/2: Schallwelle hin und zurück zur Felswand einmal, Einwegstrecke ist halber Gesamtweg; v nach Medium entsprechender Schallgeschwindigkeit.',
      parameters: ['Felswand-Distanz', 'Medium (bestimmt Schallgeschwindigkeit)'],
      feedback: ['Schallwelle Hin- und Rückweg als zwei Animationsteile', 'Echzeit ändert sich linear mit Distanz'],
      errors: ['Zeitmessfehler geht direkt verdoppelt in Distanz ein', 'Temperatur ändert Schallgeschwindigkeit — 15 °C Luft 340 m/s'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 2 Schallphänomene', ['Entstehung und Ausbreitung des Schalls', 'Schallgeschwindigkeit'])],
    aliases: ['Echo', 'Entfernungsmessung', 'Schallgeschwindigkeit', 's=vt/2', 'Schall', 'Akustik', 'Schallphänomene', 'Schallnutzung', 'Entstehung und Ausbreitung des Schalls', 'Ultraschall und Infraschall'],
    guide: ['Aussendezeitpunkt und Echo-Empfangszeitpunkt notieren, Zeitdifferenz bestimmen', 'Mit d = vt/2 Felswanddistanz nachrechnen', 'Medium ändern: Wie ändert sich die Echzeit?'],
  },

  /* --------------------------------------------------------------- fluid -- */

  buoyancy: {
    summary: {
      coreModel: 'F_Auftrieb = ρ_Flüssig·g·V_Verdrängt = G − F_Zug: Wiegeverfahren und Archimedisches Prinzip gegenseitige Verifikation; nach Volltauchen Auftrieb tiefenunabhängig.',
      parameters: ['Körpermasse und -volumen', 'Flüssigkeitsdichte', 'Absetztiefe'],
      feedback: ['Federwaage-Anzeige nimmt mit Eintauchvolumen ab', 'Nach Volltauchen Anzeige nicht mehr tiefenabhängig', 'F_Auftrieb = G − F_Zug direkt verifizierbar'],
      errors: ['„Je tiefer desto grösser Auftrieb“ ist Täuschung — nach Volltauchen V_Verdrängt nicht mehr veränderlich', 'Differenzmethode verlangt Körper ohne Bodenberührung'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 10 Auftrieb', ['Auftrieb', 'Archimedisches Prinzip'])],
    aliases: ['Auftrieb', 'Archimedes', 'Wiegeverfahren', 'Überlaufverfahren', 'F_Auftrieb', 'Schwimmen Sinken', 'Schwimm-Sink-Bedingung'],
    guide: ['Aluminiumblock langsam absenken: Wann hört die Federwaage auf sich zu ändern?', 'F_Auftrieb = G − F_Zug berechnen, mit ρ_Flüssig·g·V_Verdrängt abgleichen', 'Salzwasser statt Süßwasser: Wie ändert sich der Auftrieb in gleicher Tiefe?'],
  },
  'solid-pressure': {
    summary: {
      coreModel: 'p = F/S: Bei konstanter Kraft ist Druck umgekehrt proportional zur Aufstandsfläche. 20 N auf 200 cm² = 1000 Pa, auf 50 cm² = 4000 Pa — Kraft unverändert, Fläche auf Viertel, Druck vervierfacht.',
      parameters: ['Kraft F', 'Aufstandsfläche S', 'Vergleichsfläche S₂'],
      feedback: ['Zwei Aufstandsflächen Drücke nebeneinander: 1000 Pa und 4000 Pa', 'Fläche auf 100 cm² eingestellt, Druck liegt genau dazwischen', 'Kraft auf 0, beide Anzeigen zusammen auf null'],
      errors: ['Kraft muss senkrecht auf Aufstandsfläche wirken; schräg gedrückt ist wirksame Fläche kleiner als geometrische', 'Kraft als Druck zu sehen ist häufigster Fehler: Kraft in N, Druck als Wirkung in Pa'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 9 Druck', ['Druck', 'Wirkung der Kraft'])],
    aliases: ['Druck', 'Kraft', 'Aufstandsfläche', 'p=F/S', 'Kraftwirkung', 'Festkörperdruck', 'Druckformel', 'Druck vergrössern', 'Druck verkleinern', 'Kraft und Druck'],
    guide: ['Zuerst 200 cm² Fläche: Kraft 20 N, wie gross ist der Druck?', 'Dann 50 cm² Fläche: Hat sich die Kraft geändert? Wie viel mal grösser ist der Druck?', 'Aufstandsfläche auf 100 cm² ändern, p ∝ 1/S prüfen'],
  },
  'liquid-pressure': {
    summary: {
      coreModel: 'p = ρgh: In Wasser 20 cm Tiefe 1960 Pa, 40 cm Tiefe 3920 Pa, Tiefe verdoppelt → Druck verdoppelt; dieselben 20 cm mit Salzwasser (1100 kg/m³) = 2156 Pa, Druck ändert sich proportional zum Dichteverhältnis.',
      parameters: ['Flüssigkeitsdichte ρ', 'Sondentiefe h', 'Vergleichstiefe h₂', 'Vergleichsflüssigkeitsdichte ρ₂'],
      feedback: ['Sonde taucht ab, Anzeige wächst linear mit Tiefe', 'Gleiche Tiefe, dichtere Flüssigkeit, Anzeige wächst proportional zu ρ', 'Druck unabhängig von Gefässform, Flüssigkeitsgesamtmenge'],
      errors: ['Anzeige rechnet nur Flüssigkeitssäulendruck, nicht Luftdruck über Flüssigkeitsoberfläche', 'Flüssigkeit muss ruhend und homogen sein; bei Strömung oder Schichtung gilt p = ρgh nicht'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 9 Druck', ['Flüssigkeitsdruck', 'Grösse des Flüssigkeitsdrucks'])],
    aliases: ['Flüssigkeitsdruck', 'Druck', 'Innerer Flüssigkeitsdruck', 'ρgh', 'Tiefe', 'Druckmesser', 'U-Rohr-Manometer', 'Flüssigkeitsdruck und Tiefe', 'Flüssigkeitsdruck und Dichte'],
    guide: ['Druck an 20 cm Tiefe ablesen, dann an 40 cm', 'Zwei Messungen vergleichen: Tiefe verdoppelt, wie viel mal wird der Druck?', 'Salzwasser, Tiefe gleich: Wie ändert sich der Druck mit der Dichte?'],
  },
  'atmospheric-pressure': {
    summary: {
      coreModel: 'p₀ = ρgh (Torricelli): 101300 Pa halten Quecksilbersäule bei 760 mm. Derselbe p₀ auf Radius 5 cm Magdeburger Halbkugeln, πr²p₀ ≈ 796 N nötig zum Öffnen — beide Geräte-Anzeigen durch denselben p₀ bestimmt.',
      parameters: ['Luftdruck p₀', 'Barometer-Flüssigkeitsdichte', 'Halbkugelradius r'],
      feedback: ['Quecksilbersäulenhöhe ändert sich linear mit p₀: p₀ halbiert, Säulenhöhe halbiert', 'Halbkugelzugkraft wächst mit r²: Radius verdoppelt, Zugkraft vervierfacht', 'Luftdruck auf Hochgebirgswert geändert, Säulenhöhe und Zugkraft sinken gleichzeitig'],
      errors: ['Torricelli-Röhre oben ist Vakuum, Säulenhöhe balanciert nur Luftdruck', 'Praktische Messung liest relative Flüssigkeitsoberfläche, berücksichtigt Quecksilberdampfdruck und Temperatur'],
    },
    textbook: [js('8. Klasse Unterstufe', 'Kapitel 9 Druck', ['Luftdruck', 'Messung des Luftdrucks'])],
    aliases: ['Luftdruck', 'Atmosphärendruck', 'Torricelli', 'Quecksilbersäule', '760mmHg', 'Magdeburger Halbkugeln', 'Barometer', 'Standardatmosphärendruck', 'p0'],
    guide: ['Quecksilbersäulen-Oberfläche finden, Säulenhöhe ablesen: 760 mm entspricht wie grossem Luftdruck?', 'Luftdruck auf 70000 Pa ändern: Wie tief fällt die Quecksilbersäule?', 'Bei gleichem Luftdruck Halbkugelradius ändern: Erforderliche Zugkraft berechnen'],
  },

  /* ------------------------------------------------------------- thermal -- */

  thermometer: {
    summary: {
      coreModel:
        'Flüssigkeitsthermometer: Flüssigkeitsvolumen dehnt sich linear mit Temperatur aus ΔV = V₀βΔT, Kapillare wandelt Volumen in Höhe Δh = ΔV/A, also h = h₀ + k·t, Empfindlichkeit k = V₀β/A. 0,1 cm³ Kolben, 0,16 mm Kapillare, β = 2×10⁻⁴ Flüssigkeit ergibt k = 0,9947 mm/°C.',
      parameters: ['Zu messende Temperatur t', 'Glasballonvolumen V₀', 'Kapillardurchmesser d', 'Thermometerflüssigkeit (Ausdehnungskoeffizient β)'],
      feedback: [
        'Flüssigkeitssäule steigt/fällt linear mit Temperatur, zwei Fixpunkte markieren 0 °C und 100 °C',
        'Temperaturerhöhung → Säule steigt, Erniedrigung → fällt; Millimeteranstieg genau Temperatur mal Empfindlichkeit',
        'Flüssigkeit mit grösserem Ausdehnungskoeffizient: Pro Grad steigt Säule höher, Skalierung feiner',
      ],
      errors: [
        'Annahme, Skalierung sei beliebig: Gleichmässige Skalierung kommt aus physikalischem Fakt „Ausdehnung proportional zur Temperatur“',
        'Kapillare dicker machen als Verbesserung sehen: Je dicker Röhre, desto grösserer Querschnitt für gleiche Volumenausdehnung, Säule steigt weniger',
        'Ablesung ohne Augenhöhe zur Flüssigkeitsoberfläche, Thermometer ohne ausreichenden Kontakt zum Messobjekt — Anwendungsfehler',
      ],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 3 Aggregatzustandsänderungen', ['Temperatur', 'Thermometergebrauch'])],
    aliases: ['Thermometer', 'Temperatur', 'Skalierung', 'Messbereich', 'Teilungswert', 'Fixpunkt', 'Eiswasser-Gemisch', 'Ausdehnung', 'Celsius'],
    guide: ['Zwei Fixpunkte ansehen: Wo sind sie markiert, wie weit auseinander?', 'Thermometer in kochendes Wasser: Wo bleibt die Säule stehen?', 'Flüssigkeit mit grösserem Ausdehnungskoeffizient: Wie ändert sich die Skalierung?'],
  },
  'boiling-water': {
    summary: {
      coreModel:
        'Sieden ist isothermer Wärmeaufnahme-Prozess: Wasser bei 100 °C nimmt kontinuierlich Wärme auf bei konstanter Temperatur, aufgenommene Wärme Q = mL_v (Wasser Verdampfungswärme 2,26×10⁶ J/kg). 500 g Wasser ab 20 °C mit 500 W Erhitzung, 336 s bis Siedepunkt, danach 2260 s Thermometer regungslos.',
      parameters: ['Wassermasse m', 'Heizleistung P', 'Anfangstemperatur'],
      feedback: [
        'Temperatur-Zeit-Kurve zeigt bei 100 °C waagerechtes Plateau',
        'Während Plateau liefert Heizer weiter P, Wärme fliesst kontinuierlich zu',
        'Mehr Wasser → längeres Plateau (Q = mL_v, Plateau-Dauer = mL_v/P)',
      ],
      errors: [
        'Glaube „Temperatur konstant = keine Wärmeaufnahme“: Beim Sieden geht aufgenommene Wärme vollständig in Verdampfung, Q = mL_v',
        'Siedepunkt-Plateau mit Schmelz-Plateau verwechseln: Beide sind isotherme Wärmeaufnahme, aber bei verschiedenen Temperaturen, mit verschiedenen latenten Wärmen',
        'Luftdruck über Wasseroberfläche beeinflusst Siedepunkt — Standardluftdruck erst 100 °C',
      ],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 3 Aggregatzustandsänderungen', ['Verdampfung und Verflüssigung', 'Untersuchung der Temperaturänderung beim Sieden von Wasser'])],
    aliases: ['Sieden', 'Wassersieden', 'Verdampfung', 'Verdampfungswärme', 'Siedepunkt', 'Temperatur konstant', 'Aggregatzustandsänderung', 'Verflüssigung'],
    guide: ['Bis Temperatur stoppt laufen, ablesen wie viel Grad', 'Während Plateau: Hat Heizer aufgehört? Wohin geht die Wärme?', 'Masse verdoppeln: Wie viel länger wird das Plateau?'],
  },
  'crystal-melting': {
    summary: {
      coreModel: 'Q = cmΔT + λm: Kristall Schmelzprozess nimmt kontinuierlich Wärme auf, Temperatur bleibt Schmelzpunkt konstant — Kurve zeigt waagerechtes Segment.',
      parameters: ['Eismasse', 'Heizleistung', 'Schmelzwärme λ'],
      feedback: ['T–t Kurve zeigt deutliches waagerechtes Segment', 'Schmelzsegment aufgenommene Wärme vollständig für Kristallgitterzerstörung', 'λ auf 0 gesetzt → degeneriert zu amorpher Substanz'],
      errors: ['Waagerechtes Segment nicht „keine Wärmeaufnahme“, sondern Wärmeaufnahme ohne Temperaturerhöhung', 'Gefäss-Wärmeaufnahme und Wärmeverlust vernachlässigt'],
    },
    textbook: [js('8. Klasse Oberstufe', 'Kapitel 3 Aggregatzustandsänderungen', ['Schmelzen und Erstarren'])],
    aliases: ['Schmelzen', 'Kristall', 'Schmelzpunkt', 'Eis', 'Waagerechtes Segment', 'Erstarren', 'Aggregatzustandsänderung', 'Schmelzen und Erstarren', 'Schmelz- und Erstarrungspunkt'],
    guide: ['Waagerechtes Segment auf T–t-Kurve finden: Welchem Prozess entspricht es?', 'Aufheiz- und Schmelzsegment-Dauer vergleichen', 'λ auf 0 setzen: Ist das waagerechte Segment noch da?'],
  },
  'heat-capacity-comparison': {
    summary: {
      coreModel: 'Q = cmΔT: Gleichmässige unterschiedliche Stoffe nehmen gleiche Wärme auf, ΔT umgekehrt proportional zu spezifischer Wärmekapazität c — Wasser erwärmt sich langsamer weil c gross.',
      parameters: ['Zwei Flüssigkeiten Masse und spezifische Wärmekapazität', 'Heizleistung', 'Heizzeit'],
      feedback: ['Zwei Thermometer Erwärmungstempo Vergleich', 'Bei gleicher Q ist ΔT umgekehrt proportional zu c'],
      errors: ['Wärmeverluste machen tatsächliches ΔT etwas unter Idealwert', 'Ungleichmässiges Rühren bringt lokale Temperaturunterschiede'],
    },
    textbook: [js('9. Klasse', 'Kapitel 13 Innere Energie', ['Spezifische Wärmekapazität'])],
    aliases: ['Spezifische Wärmekapazität', 'Wärmeaufnahmefähigkeit', 'Wasser und Petroleum', 'Q=cmΔT', 'Wärmeberechnung'],
    guide: ['Gleichmässig Wasser und Petroleum erhitzen, ΔT vergleichen', 'ΔT_Wasser/ΔT_Petroleum ≈ c_Petroleum/c_Wasser prüfen', 'Erklären warum Meeresnähe kleinere Tag-Nacht-Temperaturunterschiede hat'],
  },

  /* ----------------------------------------------------------- composite -- */

  'velocity-selector': {
    summary: {
      coreModel: 'qE = qvB ⇒ v = E/B: Nur Teilchen mit dieser Geschwindigkeit durchlaufen orthogonales Elektromagnetfeld geradlinig, unabhängig von q, m.',
      parameters: ['Feldstärke E', 'Magnetflussdichte B', 'Einfallsgeschwindigkeit v₀', 'Bereichsgrösse'],
      feedback: ['v₀ = E/B → Bahn geradlinig', 'Abweichung von Wahlgeschwindigkeit → Ablenkung nach oben oder unten', 'Änderung q/m beeinflusst Wahlbedingung nicht'],
      errors: ['Elektrische und magnetische Kraft müssen wirklich entgegengerichtet — B-Richtung entscheidet über Aufhebung', 'Wahlbedingung unabhängig von Ladung, Masse ist Schluss nicht Annäherung'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Massenspektrometer und Zyklotron'])],
    aliases: ['Geschwindigkeitswähler', 'Orthogonales Feld', 'v=E/B', 'Geschwindigkeitsfilter', 'Bewegung geladener Teilchen in kompositen Feldern'],
    guide: ['Standardparameter: Teilchen geht geradlinig — v₀ = E/B prüfen', 'v₀ vergrössern: Wohin Ablenkung? Welche Kraft gewinnt?', 'B-Richtung ändern: Geht es noch geradlinig?'],
  },
  'mass-spectrometer': {
    summary: {
      coreModel: 'Zuerst Geschwindigkeitswähler v = E/B, dann reines Magnetfeld Halbkreisablenkung r = mv/(qB): Aufprallpunktabstand trennt Isotope.',
      parameters: ['Wahlbereich E/B', 'Ablenkbereich B', 'Teilchen q/m/v'],
      feedback: ['Zwei Bereichsbahnen deutlich verschieden: Gerade + Halbkreis', 'Aufprallpunktposition ändert sich mit m', 'r = mv/(qB) verifizierbar'],
      errors: ['Aufprallpunkt misst Durchmesser 2r nicht r', 'Rand-Eintrittswinkel-Unterschiede verursachen Ausbreitung'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Massenspektrometer und Zyklotron'])],
    aliases: ['Massenspektrometer', 'Isotope', 'Halbkreisablenkung', 'Ladungs-Massen-Verhältnis', 'Bewegung geladener Teilchen in kompositen Feldern'],
    guide: ['Bahnen erkennen: Welcher Abschnitt ist Wahlbereich, welcher Ablenkbereich?', 'm verdoppeln: Wie verschiebt sich Aufprallpunkt?', 'Aus Aufpralldurchmesser m zurückrechnen'],
  },
  'composite-eb': {
    summary: {
      coreModel: 'Orthogonales E, B überlagert: qE und qv×B Vektorsumme bestimmt Bahn; bei v₀ = E/B treten Drift und Zykloidenbewegung auf.',
      parameters: ['E und Richtung', 'B und Richtung', 'q/m/v₀'],
      feedback: ['Bahn nicht bloss Kreis oder Parabel — beide Kräfte momentan überlagert', 'v₀ Änderung bricht Gleichgewicht sofort'],
      errors: ['Lorentzkraft ändert mit Geschwindigkeitsrichtung — nicht als konstante Kraft anwendbar', 'Resultierende Kraft wird punktweise neu berechnet, nicht Initialwert'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Bewegung geladener Teilchen in kompositen Feldern'])],
    aliases: ['Komposites Feld', 'E+B', 'Kreuzfeld', 'Drift'],
    guide: ['Bei v₀ = E/B nähert sich Bahn Geraden — warum?', 'v₀ verdoppeln: Welche Bahnform ergibt sich?', 'E abschalten, mit reinem Magnetfeld-Kreis vergleichen'],
  },
  'composite-ebg': {
    summary: {
      coreModel: 'Gravitation + E-Feld + B-Feld drei Kräfte überlagert: Äquivalentes Schwerefeld-Verfahren fasst konstante Kräfte zu äquivalentem g′ zusammen, dann Lorentzkraft überlagern.',
      parameters: ['E, B, g und Richtungen', 'q/m/v₀'],
      feedback: ['Gravitation-Sichtbarkeitsschalter separat steuerbar', 'Bahn ist Ergebnis dreier Kräfte momentaner Überlagerung'],
      errors: ['Äquivalentes-Schwerefeld-Verfahren fasst nur konstante Kräfte — Lorentzkraft ändert mit v, kann nicht einbezogen werden'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Bewegung geladener Teilchen in kompositen Feldern'])],
    aliases: ['Drei Felder', 'E+B+g', 'Äquivalentes Schwerefeld'],
    guide: ['Gravitationssichtbarkeit umschalten, Bahnunterschied beobachten', 'Mit äquivalentem-Schwerefeld-Denken Ablenkungsrichtung vorhersagen', 'Bahn von composite-eb und diesem Experiment vergleichen'],
  },
  'multi-region-field': {
    summary: {
      coreModel: 'Bereichsfelder: Teilchen durchläuft nacheinander verschiedene Feldbereiche, in jedem Bereich Bewegung nach dortigem Feldtyp, an Grenzflächen Geschwindigkeit stetig, Kraft sprunghaft.',
      parameters: ['Jeweils E/B Konfiguration', 'Bereichsgrössen', 'q/m/v₀'],
      feedback: ['Bahn zeigt in verschiedenen Bereichen unterschiedliche Krümmungen', 'Grenzübertritt momentan Kraftrichtungsänderung'],
      errors: ['Austrittswinkel durch vorangegangenen Bahnabschnitt bestimmt — schrittweises Lösen nicht überspringbar'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Bewegung geladener Teilchen in kompositen Feldern'])],
    aliases: ['Mehrbereich', 'Bereichsfelder', 'Kombiniertes Feld'],
    guide: ['Jedem Bereich sein Feldmodell zuordnen', 'Teilchen bei Grenzübertritt: Geschwindigkeitsänderung verfolgen', 'Ein Bereichs-Feldstärke ändern: Wie wirkt sich das auf die Folgebahn aus?'],
  },
  cyclotron: {
    summary: {
      coreModel: 'Zyklotron: In D-Kästen r = mv/(qB) Halbbahn, Kästen-Spalt Wechselfeld synchron beschleunigt; Umlaufperiode T = 2πm/(qB) unabhängig von v — Isotropie ist Grund für Beschleunigung.',
      parameters: ['Magnetflussdichte B', 'Beschleunigungsspannung U', 'D-Kasten-Radius R', 'Spezifische Ladung q/m'],
      feedback: ['Bahnhalbmesser wächst kreisweise, Umlaufperiode unverändert', 'Wechselfeldfrequenz = Umlauffrequenz für kontinuierliche Beschleunigung', 'Austrittsenergie durch R und B bestimmt: Ek = q²B²R²/(2m)'],
      errors: ['Beschleunigung nicht durch Magnetfeldarbeit — Magnetkraft leistet nie Arbeit', 'Beschleunigungsspannung bestimmt nur Kreiszahl, nicht Endenergie'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 1 Kraft des Magnetfelds auf bewegte Ladungen', ['Massenspektrometer und Zyklotron'])],
    aliases: ['Zyklotron', 'D-Kästen', 'Isotropie', 'Umlauffrequenz', 'Wechselfeld'],
    guide: ['Prüfen ob Periode vor und nach Beschleunigung gleich bleibt', 'Beschleunigungsspannung halbieren: Wie ändern sich Kreiszahl und Austrittsenergie?', 'Magnetflussdichte verdoppeln: Wie vervielfacht sich die Austrittsenergie?'],
  },

  /* ----------------------------------------------------------- induction -- */

  transformer: {
    summary: {
      coreModel:
        'Idealer Transformator: Beide Wicklungen durchdringt derselbe Magnetfluss, daher Spannung jeder Wicklung gleich eigene Windungszahl mal dΦ/dt — U₁/U₂ = N₁/N₂, I₁/I₂ = N₂/N₁, und U₁I₁ = U₂I₂ konstant. 1000 Windungen primär, 200 sekundär, 220 V / 0,1 A ergibt 44 V / 0,5 A, Leistung bleibt 22 W.',
      parameters: ['Primärspannung U₁', 'Primärstrom I₁', 'Primärwindungen N₁', 'Sekundärwindungen N₂'],
      feedback: [
        'N₂ < N₁ → Abwärtswandlung, N₂ > N₁ → Aufwärtswandlung, Leistungsanzeigen beide Seiten immer identisch',
        'Sekundärwindungen verdoppelt: Spannung verdoppelt, Strom halbiert',
        'Beide Wicklungen gleichzeitig verdoppelt: nichts ändert sich — nur Windungsverhältnis ist eine Maschine',
      ],
      errors: [
        'Glaube Aufwärtswandlung könne „Energie aus dem Nichts“: Gleichzeitig sinkt Strom im selben Verhältnis, Leistung unverändert',
        'Absolute Windungszahl als Spannungshöhe sehen: Entscheidend für Ausgangsspannung ist Windungsverhältnis N₂/N₁, nicht N₂ selbst',
        'Idealer Transformator vernachlässigt Kupferverluste, Eisenverluste, Streufluss — echter Transformator Ausgangsleistung etwas kleiner als Eingangsleistung',
      ],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 3 Wechselstrom', ['Transformator', 'Elektrische Energieübertragung'])],
    aliases: ['Transformator', 'Idealer Transformator', 'Windungsverhältnis', 'Aufwärtswandlung', 'Abwärtswandlung', 'Primär-Sekundär-Spule', 'Elektrische Energieübertragung'],
    guide: ['Beidseitige Spannungen und Ströme ablesen, U₁/U₂ = N₁/N₂ prüfen', 'Sekundärwindungen verdoppeln: Spannungs- und Stromänderung beobachten', 'Prüfen ob beidseitige Leistungen stets gleich sind'],
  },
  'induction-bar-motion': {
    summary: {
      coreModel: 'ε = BLv, I = ε/(R + r): Schneiden von Feldlinien erzeugt Induktionsstrom, Amperesche Kraft wirkt entgegen als Dämpfung — v fällt exponentiell ab, kinetische Energie wird zu Joulescher Wärme.',
      parameters: ['Magnetflussdichte B', 'Stablänge L', 'Kreiswiderstand R + r', 'Stab-Anfangsgeschwindigkeit / Aussenkraft'],
      feedback: ['Je grössere Geschwindigkeit desto grösserer Strom', 'Ampereskraft bremst Stab — v–t Kurve wird flacher', 'Stromrichtung wird durch Bewegungsrichtung bestimmt'],
      errors: ['Endgeschwindigkeitsbedingung: Ampereskraft = Aussenkraft erst dann gleichförmige Bewegung', 'Schienenwiderstand und Kontaktwiderstand bereits in r enthalten'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 2 Elektromagnetische Induktion', ['Faradaysches Induktionsgesetz', 'Dynamische Probleme der elektromagnetischen Induktion'])],
    aliases: ['Einzelstab', 'FührungsSchiene', 'Feldlinienschnitt', 'BLv', 'Endgeschwindigkeit', 'Amperesche Kraft', 'Generator', 'Induktionsstrom', 'Elektromagnetische Induktion'],
    guide: ['Stab Anfangsgeschwindigkeit geben, v–t Kurvenform ansehen', 'Ausrechnen: Wann gleicht Ampereskraft der Aussenkraft?', 'B oder L ändern: Wie ändert sich die Endgeschwindigkeit?'],
  },
  'induction-double-bar-momentum': {
    summary: {
      coreModel: 'Doppelstab ohne Aussenkraft: Ampereskraft ist innere Kraft → Impulserhaltung, gemeinsame Geschwindigkeit v = m₁v₀/(m₁+m₂); Relativgeschwindigkeit u(t) = u₀·e^(−t/τ), τ = R·m₁m₂/(B²L²(m₁+m₂)).',
      parameters: ['B, L, R', 'Zwei Stabmassen m₁, m₂', 'Anfangsgeschwindigkeiten v₁, v₂'],
      feedback: ['Vorderer Stab bremst, hinterer beschleunigt bis gemeinsame Geschwindigkeit', 'Kreisstrom fällt mit Relativgeschwindigkeit ab', 'Zwei Stäbe stossen nie zusammen (Abstand nur wachsend)'],
      errors: ['Wachsender Abstand lässt hinteren Stab wie „nicht aufholen“ wirken — Relativverschiebung hat Obergrenze', 'Engine modelliert keine Kollision, Anfangskonfiguration muss Kollision vermeiden'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 2 Elektromagnetische Induktion', ['Dynamische Probleme der elektromagnetischen Induktion', 'Impulserhaltung bei elektromagnetischer Induktion'])],
    aliases: ['Doppelstab', 'FührungsSchiene', 'Impulserhaltung', 'Gemeinsame Geschwindigkeit', 'Elektromagnetische Induktion'],
    guide: ['Gemeinsame Geschwindigkeit = m₁v₀/(m₁+m₂) prüfen', 'Stromverlauf über Zeit beobachten', 'Massenverhältnis ändern: Wie ändern sich τ und gemeinsame Geschwindigkeit?'],
  },
  'induction-double-bar-force': {
    summary: {
      coreModel: 'Doppelstab konstante Kraft: Endzustand beide Stäbe gemeinsame Beschleunigung a = F/(m₁+m₂), Relativgeschwindigkeit u∞ = F·R·m₂/(B²L²(m₁+m₂)), Kreis-Stabilstrom I∞ = F·m₂/(BL(m₁+m₂)).',
      parameters: ['B, L, R', 'Zwei Stabmassen', 'Konstante Aussenkraft F'],
      feedback: ['Vorderer Stab immer schneller als hinterer — Geschwindigkeitsdifferenz konvergiert zu Festwert', 'Strom nähert sich Stabilwert an, nicht Null'],
      errors: ['Endzustand ist „gleiche Beschleunigung + konstante Geschwindigkeitsdifferenz“, nicht gemeinsame Geschwindigkeit — zum Impulstyp vergleichen', 'F weggenommen → Entwicklung nach Impulstyp'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 2 Elektromagnetische Induktion', ['Dynamische Probleme der elektromagnetischen Induktion'])],
    aliases: ['Doppelstab', 'Konstante Aussenkraft', 'Stabilstrom', 'Beschleunigung'],
    guide: ['Warten bis Stäbe stabil, Strom ablesen — ist er 0?', 'a = F/(m₁+m₂) prüfen', 'Mit Impulstyp-Doppelstab Endzustand vergleichen'],
  },
  'induction-flux-change': {
    summary: {
      coreModel: 'ε = −N·dΦ/dt: Durch Spule hindurchgehende Magnetflussänderung erzeugt Induktionsspannung; Lenzsches Regel bestimmt Richtung — Induktionswirkung hindert Änderung.',
      parameters: ['Spulenwindungen N', 'Magnetflussänderungsrate dΦ/dt', 'Kreiswiderstand'],
      feedback: ['Bei Magnetflussänderung schlägt Amperemeter aus', 'Änderung stoppt → Strom auf null', 'Richtung kehrt um bei Φ Zunahme/Abnahme'],
      errors: ['Induktion betrachtet „Änderungsrate“ nicht „Feldgrösse“ — konstantes starkes Magnetfeld keine Induktion', 'Richtungsbestimmung: erst überlegen was behindert wird'],
    },
    textbook: [hs('Wahlpflicht 2. Band', 'Kapitel 2 Elektromagnetische Induktion', ['Lenzsches Regel', 'Faradaysches Induktionsgesetz'])],
    aliases: ['Magnetfluss', 'Lenzsches Regel', 'Induktionsspannung', 'Spule', 'NΔΦ/Δt'],
    guide: ['dΦ/dt ändern: Wie ändert sich der Strom?', 'Magnetfluss Zu- und Abnahme: Stromrichtung entgegengesetzt — Lenzsche Regel prüfen', 'N verdoppeln: Wie ändert sich die Induktionsspannung?'],
  },

  /* ----------------------------------------------------------------- wave -- */

  'wave-travelling': {
    summary: {
      coreModel: 'v = λf: Seil-Harmonische Querwelle breitet sich mit konstanter Wellengeschwindigkeit aus; Mediumsteilchen schwingen nur auf/ab um Ruhelage, wandern nicht mit Welle mit.',
      parameters: ['Amplitude A', 'Wellenlänge λ', 'Frequenz f', 'Seillänge'],
      feedback: ['Wellenform verschiebt sich ganz, Teilchen schwingen auf/ab', 'Markiertes Teilchen zeichnet Schwingungsspur', 'v = λf Anzeige aktualisiert sich mit λ, f'],
      errors: ['Wellengeschwindigkeit wird durch Medium bestimmt — nicht „Quelle schiebt so schnell, Welle läuft so schnell“', 'Nachbarn in Phase Abstand ist erst λ'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Wellenentstehung', 'Wellenbeschreibung'])],
    /* Tonhöhe und Lautstärke sind hier begründet aufgenommen: Der Ton eines Tons wird durch die **Frequenz** bestimmt, die Lautstärke durch die **Amplitude**,
   und dieser Versuchsplatz macht beide als einstellbare Drehknöpfe zugänglich — gewechselt wird das Medium (Seil statt Luft),
   nicht das Gesetz. Indem man sie an den Versuchsplatz hängt, erhalten die Schüler „Tonhöhe = Frequenz“ als Physik,
   nicht als leeres Stichwort. */
    aliases: [
      'Querwelle', 'Wellenlänge', 'Wellengeschwindigkeit', 'v=λf', 'Seilwelle', 'Wellenlänge und Frequenz',
      'Tonhöhe', 'Frequenz und Tonhöhe', 'Lautstärke', 'Amplitude und Lautstärke',
    ],
    guide: [
      'Markiertes Teilchen fixieren: Geht es mit der Welle mit?',
      'f ändern, λ beobachten (v konstant)',
      'Mit Lineal einen Wellenlängenabstand messen',
      'Frequenz erhöhen: Wäre dies eine schwingende Saite, wie ändert sich die Tonhöhe (Tonhöhe = Frequenz)?',
      'Amplitude vergrössern: Wellenberg höher, Wellenlänge gleich — Lautstärke ändert Amplitude, nicht Tonhöhe',
    ],
  },
  'wave-interference': {
    summary: {
      coreModel: 'Kohärente Überlagerung: Gangunterschied Δs = nλ → Verstärkung, (n + ½)λ → Schwächung; Resultierende Amplitude = |A₁ ± A₂|.',
      parameters: ['Zwei Wellenquellen Abstand', 'Wellenlänge λ', 'Amplitude A', 'Beobachtungspunkt Position'],
      feedback: ['Beobachtungspunkt-Amplitude ändert sich periodisch mit Gangunterschied', 'Verstärkungs- und Schwächungszonen wechseln sich ab'],
      errors: ['„Verstärkung“ heisst Amplitude grösser, nicht Auslenkung konstant gross — Punkt schwingt weiter', 'Zwei Quellen müssen kohärent sein (gleiche Frequenz, konstanter Phasenunterschied)'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Welleninterferenz'])],
    aliases: ['Interferenz', 'Kohärenz', 'Gangunterschied', 'Verstärkungspunkt', 'Schwächungspunkt'],
    guide: ['Beobachtungspunkt auf Δs = 0: Wie gross ist die Resultierendenamplitude?', 'Auf Δs = λ/2 verschieben: Was wird daraus?', 'Entlang Mittelsenkrechte bewegen: Warum immer Verstärkung?'],
  },
  'wave-standing': {
    summary: {
      coreModel: 'Beidseitig festgehaltene Saite Stehwelle: λ = 2L/n, fₙ = n·v/(2L); Knoten unbewegt, Bäuche maximale Amplitude — Einfallswelle und reflektierte Welle überlagert.',
      parameters: ['Saitenlänge L', 'Wellengeschwindigkeit v', 'Harmonischen-Ordnung n'],
      feedback: ['Knotenpositionen immer unbewegt', 'n wächst → Knoten-Bauch-Abfolge dichter', 'Jeder Punkt Amplitude nach Stehwellverteilung'],
      errors: ['Stehwelle transportiert keine Energie — Wellenform wandert nicht', 'Beidseitig festgehalten erst n ganzzahliges Harmonisches Spektrum'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Wellenreflexion, -brechung und -beugung', 'Stehwelle'])],
    aliases: ['Stehwelle', 'Knoten', 'Bauch', 'Harmonische', 'Saite'],
    guide: ['Alle Knotenpositionen finden, Abstand = λ/2 prüfen', 'n von 1 auf 4: Wie ändert sich f?', 'Warum schwingen Teilchen an Knoten nie?'],
  },
  'wave-longitudinal': {
    summary: {
      coreModel: 'Longitudinalwelle: Mediumteilchen-Schwingungsrichtung fällt mit Wellenausbreitungsrichtung zusammen, bilden abwechselnd Verdichtungs- und Verdünnungszonen; v = λf gilt weiterhin.',
      parameters: ['Wellenlänge λ', 'Frequenz f', 'Mediumlänge'],
      feedback: ['Verdichtungs- und Verdünnungszonen verschieben sich ganz in Ausbreitungsrichtung', 'Einzelnes Teilchen schwingt nur an Ort hin und her', 'Bei f-Änderung ändert λ synchron, v unverändert'],
      errors: ['Schallwelle ist Longitudinalwelle — nicht „Schallwelle schwingt quer in Luft“', 'Teilchen wandern nicht mit Welle mit, wandert Schwingungsform und Energie'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Wellenentstehung', 'Wellenbeschreibung'])],
    aliases: ['Longitudinalwelle', 'Verdichtungswelle', 'Verdichtung', 'Verdünnung', 'Schallwelle'],
    guide: ['Ein Teilchen fixieren: In welche Richtung bewegt es sich?', 'Abstand zweier Verdichtungszonen messen, mit λ vergleichen', 'Frequenz erhöhen: Wie ändert sich der Verdichtungsabstand?'],
  },
  'wave-reflection-refraction': {
    summary: {
      coreModel: 'Grenzfläche zwei Seiten: Reflexionswinkel gleich Einfallswinkel; bei Brechung sin θ₁ / sin θ₂ = v₁ / v₂, Frequenz durch Wellenquelle bestimmt, vor/nach Grenzfläche unverändert.',
      parameters: ['Einfallswinkel θ₁', 'Brechungswinkel θ₂', 'Zwei Seiten Wellengeschwindigkeiten v₁, v₂', 'Frequenz f'],
      feedback: ['Reflektierter und einfallender Strahl spiegelbildlich zur Normale', 'Eintritt in schnelleres Medium → gebrochener Strahl entfernt sich von Normale', 'Beide Seiten Frequenzanzeigen identisch, Wellenlängen verschieden'],
      errors: ['Brechung ändert Wellengeschwindigkeit und Wellenlänge, nicht Frequenz', 'Winkel immer ab Normale gemessen, nicht ab Grenzfläche'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Wellenreflexion, -brechung und -beugung'])],
    aliases: ['Reflexion', 'Brechung', 'Grenzfläche', 'Wellengeschwindigkeitsverhältnis', 'Frequenz unverändert'],
    guide: ['Reflexionswinkel ablesen, mit Einfallswinkel vergleichen', 'Schnelleres Medium: Wie ändert sich der Brechungswinkel?', 'Prüfen ob beidseitige Frequenzen identisch sind'],
  },
  'wave-diffraction': {
    summary: {
      coreModel: 'Welle um Hindernis oder durch Spalt in alle Richtungen; Spaltbreite mit Wellenlänge vergleichbar → Beugung am deutlichsten, Spaltbreite weit grösser λ → näherungsweise geradlinige Ausbreitung.',
      parameters: ['Spaltbreite a', 'Wellenlänge λ', 'Spalt-Schirm-Distanz'],
      feedback: ['Je schmaler Spalt, desto mehr nähert sich ausgehende Wellenfront Halbkreis', 'a weit grösser λ → ausgehende Wellenfront fast eben', 'Zentraler Hellbereich verbreitert sich mit wachsendem λ/a'],
      errors: ['Beugung ist Wellennatur — braucht nicht „Spaltgrösse genau gleich Wellenlänge“ um aufzutreten', 'Beugung mit Interferenz verwechseln: Hier Selbstüberlagerung derselben Wellenfront'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Wellenreflexion, -brechung und -beugung'])],
    aliases: ['Beugung', 'Beugung', 'Einzelspalt', 'Spaltbreite', 'Deutlichkeitsbedingung Beugung'],
    guide: ['Spaltbreite auf λ einstellen: Wie ist die Form der austretenden Wellenfront?', 'Spaltbreite verzehnfachen: Wie wird die Wellenfront?', 'Erklären warum man „nebenan sprechen hören“ kann'],
  },
  'wave-doppler': {
    summary: {
      coreModel: 'Wellenquelle und Beobachter in Relativbewegung → Empfangsfrequenz ändert sich: f′ = f·v/(v ∓ v_s); Annäherung f′ > f, Entfernen f′ < f, Wellenquellenfrequenz unverändert.',
      parameters: ['Wellenquellenfrequenz f', 'Wellengeschwindigkeit v', 'Wellenquellengeschwindigkeit v_s', 'Beobachterposition'],
      feedback: ['Wellenquellenvorderseite Wellenfronten dicht, Rückseite lückenhaft', 'Empfangsfrequenz ändert sich mit Relativgeschwindigkeit', 'Relativgeschwindigkeit null → f′ = f'],
      errors: ['Dopplereffekt ändert weder Wellenquellenfrequenz noch Wellengeschwindigkeit', 'Bei Annäherung wird Wellenlänge komprimiert, nicht „Welle läuft schneller“'],
    },
    textbook: [hs('Wahlpflicht 1. Band', 'Kapitel 3 Mechanische Wellen', ['Dopplereffekt'])],
    aliases: ['Doppler', 'Frequenzverschiebung', 'Empfangsfrequenz', 'Annäherung', 'Entfernen'],
    guide: ['Vorder- und Rückseiten-Wellenfrontabstände vergleichen', 'Quelle anhalten: Empfangsfrequenz zu f?', 'Mit Relativgeschwindigkeit Rettungswagen-Tonänderung erklären'],
  },
  'photoelectric-effect': {
    summary: {
      coreModel: 'Einsteinsche Photoelektrische Gleichung hν = W + K_max; Bedingung für Photoeffekt ist hν > W (ν über Grenzfrequenz), Lichtintensität ändert nur Photoelektronenzahl.',
      parameters: ['Einfallslichtfrequenz ν', 'Austrittsarbeit W', 'Gegenspannung U_c', 'Lichtintensität'],
      feedback: ['ν vergrössert → K_max linear grösser', 'Lichtintensität vergrössert → Photostrom grösser, K_max unverändert', 'ν unter Grenzfrequenz → keine Photoelektronen'],
      errors: ['Photonenenergie durch Frequenz bestimmt, unabhängig von Lichtintensität', 'K_max unabhängig von Lichtintensität — das ist Experimentalfakt, Wellentheorie kann nicht erklären'],
    },
    textbook: [hs('Wahlpflicht 3. Band', 'Kapitel 4 Atomstruktur und Wellen-Teilchen-Dualität', ['Photoelektrischer Effekt', 'Einsteinsche Photoelektrische Gleichung'])],
    aliases: ['Photoelektrischer Effekt', 'Photon', 'Austrittsarbeit', 'Gegenspannung', 'Grenzfrequenz'],
    guide: ['Frequenz stufenweise erhöhen, Gegenspannungsänderung beobachten', 'Nur Lichtintensität ändern: Photostrom ändert sich, Gegenspannung nicht', 'Frequenz unter Grenzwert senken: Was passiert noch?'],
  },
}

/** Summary + metadata for a template id; `undefined` means the parity test
 *  should have caught a missing entry.  * @returns the experiment meta.
 * @param templateId - the experiment template id.
 * @returns the experiment meta.
 */
export const experimentMetaOf = (templateId: string): ExperimentMeta | undefined =>
  EXPERIMENT_META[templateId]
