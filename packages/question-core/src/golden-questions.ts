import { asQuestionId } from '@physicsos/shared'
import type { QuestionDocument } from './question-document.ts'
import type { PhysicsModelId } from './semantic-ir.ts'

export interface GoldenQuestionDefinition {
  id: string
  title: string
  text: string
  expectedDomain?:
    | 'magnetic'
    | 'mechanics'
    | 'electric'
    | 'composite'
    | 'circuit'
    | 'optics'
    | 'induction'
    | 'wave'
  expectedChargeSign: 'positive' | 'negative' | 'unknown'
  expectedFieldDirection: 'into_page' | 'out_of_page' | 'unknown'
  expectedValidation: 'VALID' | 'AMBIGUOUS' | 'INVALID_SEMANTICS' | 'UNSUPPORTED_MODEL'
  /** Komplexes Gerät, das die Frage beschreibt, falls es sich um ein komplexes handelt. */
  expectedModel?: PhysicsModelId
}

export const GOLDEN_QUESTIONS: readonly GoldenQuestionDefinition[] = [
  {
    id: '01-proton-basic',
    title: 'Proton tritt senkrecht in homogenes Magnetfeld ein',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 2,0×10^6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,50 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: 1. Betrag der Lorentzkraft 2. Bahnradius 3. Umlaufperiode 4. Bewegungsrichtung bestimmen 5. Bewegungsbahn anzeigen',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: '02-electron-negative-charge',
    title: 'Elektron tritt senkrecht in homogenes Magnetfeld ein',
    text: 'Ein Elektron tritt mit einer Geschwindigkeit von 2,0×10^6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,50 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 9,11×10^-31 kg, q = -1,60×10^-19 C. Gesucht: 1. Betrag der Lorentzkraft 2. Bahnradius 3. Umlaufperiode 4. Bewegungsrichtung bestimmen',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: '03-field-out-of-page',
    title: 'Magnetfeld senkrecht zur Papierfläche nach außen',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 1,0×10^6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,40 T ein, dessen Richtung senkrecht zur Papierfläche nach außen zeigt. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: 1. Bahnradius 2. Umlaufperiode 3. Bewegungsrichtung bestimmen',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: '04-radius-only',
    title: 'Nur Bahnradius berechnen',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 3,0×10^6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,20 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: Bahnradius',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: '05-period-only',
    title: 'Nur Umlaufperiode berechnen',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 5,0×10^5 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,30 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: Umlaufperiode',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: '06-missing-charge-sign',
    title: 'Ladungszeichen fehlt',
    text: 'Ein geladenes Teilchen tritt mit einer Geschwindigkeit von 2,0×10^6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,50 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67×10^-27 kg, q = 1,60×10^-19 C. Gesucht: 1. Bahnradius 2. Bewegungsrichtung bestimmen',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'AMBIGUOUS',
  },
  {
    id: '07-zero-field',
    title: 'Magnetische Flussdichte ist null',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 2,0×10^6 m/s in einen Bereich mit magnetischer Flussdichte 0 T ein. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: Bahnradius',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'INVALID_SEMANTICS',
  },
  {
    id: '08-parallel-velocity',
    title: 'Geschwindigkeit parallel zum Magnetfeld',
    text: 'Ein Proton bewegt sich mit einer Geschwindigkeit von 2,0×10^6 m/s parallel zur Richtung eines homogenen Magnetfeldes der magnetischen Flussdichte 0,50 T. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: Bahnradius',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'UNSUPPORTED_MODEL',
  },
  {
    id: '09-unit-conversion',
    title: 'Einheitenumrechnung',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 2000 km/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 500 mT ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67×10^-27 kg, q = +1,60×10^-19 C. Gesucht: Bahnradius und Umlaufperiode',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: '10-scientific-notation',
    title: 'Wissenschaftliche Notation',
    text: 'Ein Proton tritt mit einer Geschwindigkeit von 2,0e6 m/s senkrecht in ein homogenes Magnetfeld der magnetischen Flussdichte 0,50 T ein, dessen Richtung senkrecht zur Papierfläche nach innen zeigt. Gegeben: m = 1,67e-27 kg, q = +1,60e-19 C. Gesucht: 1. Betrag der Lorentzkraft 2. Bahnradius 3. Umlaufperiode',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-01-perpendicular-deflection',
    title: 'Positive Ladung wird in homogenem elektrischen Feld abgelenkt',
    text: 'Ein positiv geladenes Teilchen mit Masse m = 4 kg und Ladung q = +2 C tritt mit einer Anfangsgeschwindigkeit von 3 m/s in positive x-Richtung in ein homogenes elektrisches Feld ein. Die elektrische Feldstärke beträgt E = 6 N/C, die Feldrichtung zeigt in positive y-Richtung, die Bewegungsdauer beträgt 2 s. Gesucht: Elektrische Kraft, Beschleunigung, Endgeschwindigkeit, Verschiebung, Änderung des elektrischen Potenzials, Änderung der potentiellen Energie, Arbeit der elektrischen Kraft und Änderung der kinetischen Energie.',
    expectedDomain: 'electric',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-02-negative-parallel',
    title: 'Negative Ladung wird entlang der Feldrichtung abgebremst',
    text: 'Ein negativ geladenes Teilchen mit Masse m = 2 kg und Ladung q = -1 C bewegt sich mit einer Anfangsgeschwindigkeit von 4 m/s in positive x-Richtung. Im Raum existiert ein homogenes elektrisches Feld mit der Feldstärke E = 2 V/m, dessen Richtung in positive x-Richtung zeigt, die Bewegungsdauer beträgt 2 s. Gesucht: Elektrische Kraft, Beschleunigung, Endgeschwindigkeit, Verschiebung, Änderung des elektrischen Potenzials, Änderung der potentiellen Energie und Änderung der kinetischen Energie.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-03-point-charge-field',
    title: 'Elektrische Feldstärke einer Punktladung',
    text: 'Eine Punktladung q = +5 μC befindet sich im Raum. In einem Abstand von r = 20 cm wird eine Testladung platziert. Gesucht: Betrag der elektrischen Feldstärke an diesem Punkt.',
    expectedDomain: 'electric',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-04-point-charge-force',
    title: 'Elektrische Feldkraft einer Punktladung auf Testladung',
    text: "Eine Punktladung q = +5 μC befindet sich im Raum. In einem Abstand von r = 20 cm wird eine Testladung q' = +2 μC platziert. Gesucht: Elektrische Feldkraft auf die Testladung.",
    expectedDomain: 'electric',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-05-point-charge-direction',
    title: 'Richtung des elektrischen Feldes einer negativen Punktladung',
    text: 'Eine Punktladung q = -3 μC befindet sich im Raum. In einem Abstand von r = 10 cm wird eine Testladung platziert. Bestimmen Sie die Richtung des elektrischen Feldes an diesem Punkt.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-06-dipole-midpoint-field',
    title: 'Elektrische Feldstärke im Mittelpunkt zweier gleichgroßer ungleichartiger Punktladungen',
    text: 'Zwei Punktladungen q1 = +2 μC und q2 = -2 μC befinden sich im Abstand von 20 cm. Gesucht: Betrag der elektrischen Feldstärke im Mittelpunkt der Verbindungslinie.',
    expectedDomain: 'electric',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-07-like-charges-midpoint',
    title: 'Elektrische Feldstärke im Mittelpunkt zweier gleichgroßer gleichartiger Punktladungen',
    text: 'Zwei Punktladungen q1 = +3 μC und q2 = +3 μC befinden sich im Abstand von 30 cm. Gesucht: Betrag der elektrischen Feldstärke im Mittelpunkt der Verbindungslinie.',
    expectedDomain: 'electric',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-08-dipole-axis-field',
    title: 'Elektrische Feldstärke im Mittelpunkt eines elektrischen Dipols',
    text: 'Zwei Punktladungen q1 = +1 μC und q2 = -1 μC befinden sich im Abstand von 10 cm. Gesucht: Betrag der elektrischen Feldstärke im Mittelpunkt der Verbindungslinie.',
    expectedDomain: 'electric',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-09-off-axis-field',
    title: 'Elektrische Feldstärke außerhalb der Achse einer Punktladung',
    text: 'Eine Punktladung q = +4 μC befindet sich im Raum. In einem Abstand von 15 cm links davon wird eine Testladung platziert. Gesucht: Betrag und Richtung der elektrischen Feldstärke an diesem Punkt.',
    expectedDomain: 'electric',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-10-electron-deflection',
    title: 'Ablenkung eines Elektrons im Plattenkondensator',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Gesucht: Ablenkweg des Elektrons.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-11-proton-deflection',
    title: 'Ablenkung eines Protons im Plattenkondensator',
    text: 'Ein Proton tritt mit der Anfangsgeschwindigkeit v0 = 2×10^6 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Protonenmasse m = 1,67×10^-27 kg, Ladung q = +1,6×10^-19 C, elektrische Feldstärke E = 5000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 2 cm, Plattenlänge L = 10 cm. Gesucht: Ablenkweg des Protons.',
    expectedDomain: 'electric',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-12-exit-velocity',
    title: 'Geschwindigkeit beim Verlassen des Plattenkondensators',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Gesucht: Betrag der Geschwindigkeit des Elektrons beim Verlassen des elektrischen Feldes.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-13-hit-plate-time',
    title: 'Zeit bis das Elektron die Platte trifft',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 1×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 5000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 2 cm, Plattenlänge L = 20 cm. Gesucht: Zeit bis das Elektron die Platte trifft.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-14-deflection-direction',
    title: 'Bestimmung der Ablenkrichtung des Elektrons',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Bestimmen Sie die Ablenkrichtung des Elektrons (nach oben oder unten).',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-15-field-reversed',
    title: 'Ablenkrichtung nach Umkehr des elektrischen Feldes',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach oben, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Bestimmen Sie die Ablenkrichtung des Elektrons.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'electric-16-different-velocity',
    title: 'Einfluss unterschiedlicher Anfangsgeschwindigkeiten auf die Ablenkung',
    text: 'Zwei Elektronen treten jeweils mit den Anfangsgeschwindigkeiten v0 = 3×10^7 m/s und v0 = 1,5×10^7 m/s horizontal in dasselbe Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Vergleichen Sie die Ablenkwege der beiden Elektronen.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'UNSUPPORTED_MODEL',
  },
  {
    id: 'electric-17-different-charge',
    title: 'Vergleich der Ablenkung bei unterschiedlichen Ladungsmengen',
    text: 'Ein Elektron und ein Proton treten mit derselben Anfangsgeschwindigkeit v0 = 2×10^6 m/s horizontal in dasselbe Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, Protonenmasse m = 1,67×10^-27 kg, Ladung q = +1,6×10^-19 C, elektrische Feldstärke E = 5000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 2 cm, Plattenlänge L = 10 cm. Vergleichen Sie die Ablenkwege beider Teilchen.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'UNSUPPORTED_MODEL',
  },
  {
    id: 'electric-18-plate-length-effect',
    title: 'Einfluss der Plattenlänge auf die Ablenkung',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 6 cm. Gesucht: Ablenkweg des Elektrons, und Vergleich mit dem Ablenkweg bei Plattenlänge 12 cm.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'UNSUPPORTED_MODEL',
  },
  {
    id: 'electric-19-energy',
    title: 'Arbeit der elektrischen Feldkraft und kinetische Energieänderung im Plattenkondensator',
    text: 'Ein Elektron tritt mit der Anfangsgeschwindigkeit v0 = 3×10^7 m/s horizontal in ein Plattenkondensatorfeld ein. Gegeben: Elektronenmasse m = 9,11×10^-31 kg, Ladung q = -1,6×10^-19 C, elektrische Feldstärke E = 2000 V/m, Richtung senkrecht nach unten, Plattenabstand d = 4 cm, Plattenlänge L = 12 cm. Gesucht: Arbeit der elektrischen Feldkraft am Elektron und Änderung der kinetischen Energie des Elektrons.',
    expectedDomain: 'electric',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-01-uniform-acceleration',
    title: 'Gleichmäßig beschleunigte geradlinige Bewegung',
    text: 'Ein Auto hat eine Anfangsgeschwindigkeit von 10 m/s und eine Beschleunigung von 2 m/s², es bewegt sich 5 s lang. Gesucht: Endgeschwindigkeit und Verschiebung.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-02-projectile-horizontal',
    title: 'Horizontalwurf',
    text: 'Ein Gegenstand wird aus 20 m Höhe mit 10 m/s horizontal abgeworfen, g = 10 m/s². Gesucht: Fallzeit und horizontale Wurfweite.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-03-projectile-oblique',
    title: 'Schräger Wurf',
    text: 'Ein Gegenstand wird mit einer Anfangsgeschwindigkeit von 20 m/s unter einem Wurfwinkel von 30° abgeworfen, g = 10 m/s². Gesucht: Maximale Höhe, Flugzeit und Wurfweite.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-04-newton-second-law',
    title: 'Zweites Newtonsches Gesetz',
    text: 'Ein Objekt mit einer Masse von 2 kg erfährt eine horizontale resultierende Kraft von 10 N. Bestimme die Beschleunigung.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-05-incline-no-friction',
    title: 'Reibungsfreie schiefe Ebene',
    text: 'Ein Objekt mit einer Masse von 2 kg befindet sich auf einer glatten schiefen Ebene mit einem Neigungswinkel von 30°, g = 10 m/s². Bestimme die Beschleunigung entlang der Ebene und die Stützkraft.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-06-unit-conversion',
    title: 'Einheitenumrechnung 72 km/h',
    text: 'Ein Auto fährt mit einer Geschwindigkeit von 72 km/h, die Beschleunigung beträgt 2 m/s², die Bewegungsdauer 5 s. Bestimme die Endgeschwindigkeit.',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },

  /* ------------------------------------------------------------- composite -- *
   * Kreuzfeldapparaturen: ein Geschwindigkeitswähler, ein Massenspektrometer und
   * E+B / E+B+g-Welten. Jede Aufgabe gibt das Vorzeichen der Ladung, die Richtung
   * des elektrischen Feldes und die Orientierung des magnetischen Feldes an,
   * weil diese drei Größen die Beträge in eine Kraftbilanz verwandeln — ohne sie
   * ist die Apparaturgeometrie unbestimmt und die IR ist legitim AMBIGUOUS
   * anstatt lösbar. Feldstärken werden so gewählt, dass die Selektionsbedingung
   * exakt ist (v = E/B), es sei denn, die Aufgabe handelt spezifisch von einem
   * abgewiesenen Teilchen.       */

  {
    id: 'comp-01-selector-balance',
    title: 'Geschwindigkeitswähler: gerade durchgelassen',
    text: 'Im Geschwindigkeitswähler wirken ein homogenes elektrisches Feld und ein homogenes magnetisches Feld, die senkrecht aufeinander stehen. Die Richtung des elektrischen Feldes ist senkrecht nach oben, E = 2,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T. Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s horizontal vom linken Ende ein und durchläuft geradlinig. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft 3. Betrag der resultierenden Kraft',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-02-selector-selected-velocity',
    title: 'Geschwindigkeitswähler: Wahlgeschwindigkeit bestimmen',
    text: 'Die Richtung des elektrischen Feldes im Geschwindigkeitswähler ist senkrecht nach oben, die elektrische Feldstärke E = 4,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, die magnetische Flussdichte B = 0,50 T. Ein Strahl positiver Ionen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt horizontal ein. Bestimme den Betrag der Teilchengeschwindigkeit, der ein geradliniges Durchlaufen ermöglicht.',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-03-selector-too-fast',
    title: 'Geschwindigkeitswähler: Geschwindigkeit zu groß',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 2,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T. Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 2,0×10⁵ m/s horizontal ein. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft 3. Betrag der resultierenden Kraft 4. Zeichne die Bewegungsbahn',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-04-selector-too-slow',
    title: 'Geschwindigkeitswähler: Geschwindigkeit zu klein',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 2,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T. Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 5,0×10⁴ m/s horizontal ein. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft 3. Betrag der resultierenden Kraft',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-05-selector-electron',
    title: 'Geschwindigkeitswähler: Elektron durchläuft',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 1,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht in die Zeichenebene hinein, B = 0,10 T. Ein Elektron (q = -1,6×10⁻¹⁹ C, m = 9,11×10⁻³¹ kg) tritt mit v = 1,0×10⁵ m/s horizontal nach rechts ein und durchläuft gerade. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-06-selector-low-field',
    title: 'Geschwindigkeitswähler: schwaches Feld',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 200 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 2,0×10⁻³ T. Ein Proton (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s horizontal ein und durchläuft geradlinig. Bestimme: 1. Wahlgeschwindigkeit 2. Betrag der elektrischen Feldkraft 3. Betrag der resultierenden Kraft',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-07-selector-trajectory',
    title: 'Geschwindigkeitswähler: Bahn und resultierende Kraft',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach unten, E = 3,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht in die Zeichenebene hinein, B = 0,30 T. Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s horizontal nach rechts ein. Bestimme: 1. Betrag der resultierenden Kraft 2. Bewegungsbahn 3. Beschleunigung',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-08-selector-missing-direction',
    title: 'Geschwindigkeitswähler: magnetische Feldrichtung nicht gegeben',
    text: 'Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 2,0×10⁴ V/m, die magnetische Flussdichte B = 0,20 T. Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s horizontal ein. Bestimme den Betrag der elektrischen Feldkraft.',
    expectedDomain: 'composite',
    expectedModel: 'velocity_selector',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'AMBIGUOUS',
  },
  {
    id: 'comp-09-spectrometer-radius',
    title: 'Massenspektrometer: Ablenkradius',
    text: 'Das Massenspektrometer besteht aus einem Geschwindigkeitswähler und einem Ablenkmagnetfeld. Im Geschwindigkeitswähler ist die Richtung des elektrischen Feldes senkrecht nach oben, E = 200 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 2,0×10⁻³ T. Ein Proton (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s horizontal ein und durchläuft den Wahlgeradlinig, woraufhin es in das Ablenkmagnetfeld eintritt und eine Kreisbewegung ausführt. Bestimme: 1. Kreisradius 2. Betrag der Lorentzkraft',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-10-spectrometer-charge-mass',
    title: 'Massenspektrometer: spezifische Ladung',
    text: 'Im Massenspektrometer ist die Richtung des elektrischen Feldes im Geschwindigkeitswähler senkrecht nach oben, E = 200 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 2,0×10⁻³ T. Ein positives Ion (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) tritt mit v = 1,0×10⁵ m/s durch den Wahlger und gelangt in das Ablenkmagnetfeld, wobei ein Kreisradius von r = 0,52 m gemessen wird. Bestimme die spezifische Ladung dieses Ions.',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-11-spectrometer-isotope',
    title: 'Massenspektrometer: Isotopentrennung',
    text: 'Das Massenspektrometer dient der Isotopentrennung. Die Richtung des elektrischen Feldes im Geschwindigkeitswähler ist senkrecht nach oben, E = 200 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 2,0×10⁻³ T, positives Ion q = 1,6×10⁻¹⁹ C, m = 3,34×10⁻²⁷ kg, tritt mit v = 1,0×10⁵ m/s durch den Wahlger in das Ablenkmagnetfeld ein. Bestimme: 1. Kreisradius 2. Umlaufperiode',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-12-spectrometer-period',
    title: 'Massenspektrometer: Umlaufperiode',
    text: 'Der Geschwindigkeitswähler des Massenspektrometers hat eine elektrische Feldrichtung senkrecht nach oben, E = 400 V/m, die magnetische Feldrichtung ist senkrecht aus der Zeichenebene heraus, B = 4,0×10⁻³ T. Ein Proton (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) durchläuft mit v = 1,0×10⁵ m/s geradlinig und gelangt in das Ablenkmagnetfeld. Bestimme: 1. Umlaufperiode 2. Kreisradius',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-13-spectrometer-electron',
    title: 'Massenspektrometer: Elektronenstrahlablenkung',
    text: 'Im Massenspektrometer hat der Geschwindigkeitswähler eine elektrische Feldrichtung senkrecht nach oben, E = 100 V/m, die magnetische Feldrichtung ist senkrecht in die Zeichenebene hinein, B = 1,0×10⁻³ T. Ein Elektron (q = -1,6×10⁻¹⁹ C, m = 9,11×10⁻³¹ kg) durchläuft den Wahlger mit v = 1,0×10⁵ m/s horizontal nach rechts und gelangt in das Ablenkmagnetfeld. Bestimme: 1. Kreisradius 2. Betrag der Lorentzkraft',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-14-spectrometer-selected-velocity',
    title: 'Massenspektrometer: Wahlgeschwindigkeit und Radius',
    text: 'Der Geschwindigkeitswähler des Massenspektrometers hat eine elektrische Feldrichtung senkrecht nach oben, E = 300 V/m, die magnetische Feldrichtung ist senkrecht aus der Zeichenebene heraus, B = 3,0×10⁻³ T, positives Ion q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg. Bestimme: 1. Die Teilchengeschwindigkeit, die den Wahlger durchlaufen kann 2. Den Kreisradius nach Eintritt in das Ablenkmagnetfeld',
    expectedDomain: 'composite',
    expectedModel: 'mass_spectrometer',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-15-eb-crossed',
    title: 'Kombiniertes Feld: E und B wirken gleichzeitig',
    text: 'Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) wird gleichzeitig von einem homogenen elektrischen Feld und einem homogenen magnetischen Feld beeinflusst. Die Richtung des elektrischen Feldes ist senkrecht nach oben, E = 2,0×10⁴ V/m, die Richtung des magnetischen Feldes ist senkrecht in die Zeichenebene hinein, B = 0,20 T. Das Teilchen tritt mit v = 1,0×10⁵ m/s horizontal nach rechts ein, die Schwerkraft wird vernachlässigt. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft 3. Betrag der resultierenden Kraft 4. Beschleunigung',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-16-eb-electron-trajectory',
    title: 'Kombiniertes Feld: Elektronenbahn in gekreuzten Feldern',
    text: 'Ein Elektron (q = -1,6×10⁻¹⁹ C, m = 9,11×10⁻³¹ kg) bewegt sich in sich senkrecht schneidenden elektrischen und magnetischen Feldern. Die Richtung des elektrischen Feldes ist senkrecht nach unten, E = 1,0×10³ V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,010 T, die Anfangsgeschwindigkeit beträgt v = 1,0×10⁵ m/s horizontal nach rechts, die Schwerkraft wird vernachlässigt. Bestimme: 1. Betrag der resultierenden Kraft 2. Bewegungsbahn 3. Änderung der kinetischen Energie',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-17-eb-energy',
    title: 'Kombiniertes Feld: kinetische Energie und Arbeit der Lorentzkraft',
    text: 'Ein positiv geladenes Teilchen (q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg) befindet sich gleichzeitig in einem homogenen elektrischen Feld und einem homogenen magnetischen Feld. Die Richtung des elektrischen Feldes ist senkrecht nach oben, E = 5,0×10³ V/m, die Richtung des magnetischen Feldes ist senkrecht in die Zeichenebene hinein, B = 0,050 T, die Anfangsgeschwindigkeit beträgt v = 1,0×10⁵ m/s horizontal nach rechts, die Schwerkraft wird vernachlässigt. Bestimme: 1. Kinetische Energie 2. Änderung der kinetischen Energie 3. Betrag der resultierenden Kraft',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'into_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-18-ebg-balance',
    title: 'Kombiniertes Feld: Gleichgewicht von elektrischem Feld, magnetischem Feld und Schwerkraft',
    text: 'Ein positiv geladenes Mikroteilchen (q = 1,0×10⁻⁶ C, m = 2,0×10⁻⁶ kg) wird gleichzeitig von einem homogenen elektrischen Feld, einem homogenen magnetischen Feld und der Schwerkraft beeinflusst. Die Richtung des elektrischen Feldes ist senkrecht nach oben, E = 20 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T, die Fallbeschleunigung g = 10 m/s². Es tritt mit v = 100 m/s horizontal nach rechts ein. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der Lorentzkraft 3. Betrag der resultierenden Kraft',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-19-ebg-droplet',
    title: 'Kombiniertes Feld: Dreikraftüberlagerung bei geladenem Tröpfchen',
    text: 'Ein negativ geladenes Tröpfchen (q = -2,0×10⁻⁶ C, m = 4,0×10⁻⁶ kg) befindet sich gleichzeitig in einem elektrischen Feld, einem magnetischen Feld und der Schwerkraft. Die Richtung des elektrischen Feldes ist senkrecht nach unten, E = 10 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T, g = 10 m/s². Es tritt mit v = 50 m/s horizontal nach rechts ein. Bestimme: 1. Betrag der resultierenden Kraft 2. Beschleunigung 3. Bewegungsbahn',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'negative',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-20-ebg-heavy-particle',
    title: 'Kombiniertes Feld: geladenes Mikroteilchen in drei Feldern',
    text: 'Ein positiv geladenes Mikroteilchen (q = 5,0×10⁻⁷ C, m = 1,0×10⁻⁶ kg) wird gleichzeitig von elektrischer Feldkraft, Lorentzkraft und Schwerkraft beeinflusst. Die Richtung des elektrischen Feldes ist senkrecht nach oben, E = 20 V/m, die Richtung des magnetischen Feldes ist senkrecht aus der Zeichenebene heraus, B = 0,20 T, die Fallbeschleunigung g = 10 m/s². Es tritt mit v = 100 m/s horizontal nach rechts ein. Bestimme: 1. Betrag der elektrischen Feldkraft 2. Betrag der resultierenden Kraft 3. Beschleunigung',
    expectedDomain: 'composite',
    expectedModel: 'charged_particle_composite_field',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },
  {
    id: 'comp-21-cyclotron',
    title: 'Zyklotron',
    text: 'Das homogene Magnetfeld des Zyklotrons zeigt senkrecht aus der Zeichenebene heraus, B = 1,5 T, die Beschleunigungsspannung beträgt U = 2000 V, der Radius der D-förmigen Hohlräume R = 0,50 m, die Frequenz des Beschleunigungsfeldes entspricht der Umlauffrequenz des Protons. Proton q = 1,6×10⁻¹⁹ C, m = 1,67×10⁻²⁷ kg, beginnt mit v = 1,0×10⁵ m/s zu beschleunigen. Bestimme: 1. Umlaufperiode 2. Maximale Geschwindigkeit 3. Maximale kinetische Energie',
    expectedDomain: 'composite',
    expectedModel: 'cyclotron',
    expectedChargeSign: 'positive',
    expectedFieldDirection: 'out_of_page',
    expectedValidation: 'VALID',
  },

  /* --------------------------------------------------------------- optics --- *
   * Aufgaben zur geometrischen Optik/Bildgebung. Jede benennt ein optisches
   * Element und die Abbildungsgrößen (Brennweite, Gegenstands-/Bildweite,
   * Vergrößerung, Bildart). Die Optik-Engine löst mittels der
   * Dünnlinsen-/Spiegelgleichung (1/u + 1/v = 1/f) und bestimmt die Bildart
   * aus dem Vorzeichen von v. */
  {
    id: 'opt-01-plane-mirror',
    title: 'Abbildung am ebenen Spiegel',
    text: 'Eine Kerze wird 15 cm vor einem ebenen Spiegel platziert. Gegeben: Abstand der Kerze zum ebenen Spiegel u = 15 cm. Bestimme: 1. Bildweite v 2. Bildart (aufrecht oder umgekehrt, reelles oder virtuelles Bild, vergrößert oder verkleinert)',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'opt-02-convex-lens-beyond-2f',
    title: 'Abbildung durch Konvexlinse (u>2f, umgekehrtes verkleinertes reelles Bild)',
    text: 'Eine Konvexlinse hat die Brennweite f = 10 cm, ein Gegenstand wird auf der Hauptoptischen Achse in einem Abstand von u = 30 cm von der Linse platziert. Gegeben: f = 10 cm, u = 30 cm. Bestimme: 1. Bildweite v 2. Vergrößerung m 3. Bildart',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'opt-03-convex-lens-between-f-and-2f',
    title: 'Abbildung durch Konvexlinse (f<u<2f, umgekehrtes vergrößertes reelles Bild)',
    text: 'Eine Konvexlinse hat die Brennweite f = 10 cm, der Gegenstand ist u = 15 cm von der Linse entfernt. Gegeben: f = 10 cm, u = 15 cm. Bestimme: 1. Bildweite v 2. Vergrößerung m 3. Bildart',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'opt-04-convex-lens-within-f',
    title: 'Abbildung durch Konvexlinse (u<f, aufrechtes vergrößertes virtuelles Bild)',
    text: 'Eine Konvexlinse hat die Brennweite f = 10 cm, der Gegenstand ist u = 6 cm von der Linse entfernt. Gegeben: f = 10 cm, u = 6 cm. Bestimme: 1. Bildweite v 2. Bildart',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'opt-05-concave-mirror-beyond-2f',
    title: 'Abbildung durch konkaven Spiegel (u>2f, umgekehrtes verkleinertes reelles Bild)',
    text: 'Ein konkaver Spiegel hat die Brennweite f = 10 cm, der Gegenstand ist u = 30 cm vom Spiegel entfernt (u>2f). Gegeben: f = 10 cm, u = 30 cm. Bestimme: 1. Bildweite v 2. Bildart',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'opt-06-convex-mirror',
    title: 'Abbildung durch konvexen Spiegel (aufrechtes verkleinertes virtuelles Bild)',
    text: 'Ein konvexer Spiegel hat die Brennweite f = -10 cm (Divergenzspiegel), der Gegenstand ist u = 20 cm vom Spiegel entfernt. Gegeben: f = -10 cm, u = 20 cm. Bestimme: Bildart',
    expectedDomain: 'optics',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },

  /* --------------------------------------------------------------- circuit -- *
   * Gleichstrom-Stationärzustands-Fragen. Jede nennt eine EMK, Widerstände und die
   * Topologie (Reihe / Parallel / Rheostat / EMK-Messung), und fragt nach einer
   * von {Strom, Spannung, Widerstand, Leistung, Klemmenspannung, Innenwiderstand}. Die Schaltungs-Engine löst die
   * Szene per MNA; Werte sind so gewählt, dass die Antwort exakt oder nahezu exakt ist. */

  {
    id: 'circ-01-series-current',
    title: 'Strom in Reihenschaltung berechnen',
    text: 'Eine Reihenschaltung besteht aus einer Stromquelle, einem Schalter, einem Amperemeter und zwei Widerständen. Die elektromotorische Kraft der Quelle beträgt E = 6 V (ideale Quelle, Innenwiderstand vernachlässigbar), die Widerstände sind R1 = 10 Ω, R2 = 20 Ω, in Reihe geschaltet. Schalter schließen, den Strom in der Schaltung bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'circ-02-parallel-total-resistance',
    title: 'Gesamtwiderstand in Parallelschaltung',
    text: 'Eine Parallelschaltung besteht aus einer Stromquelle und zwei parallel geschalteten Widerständen. Die elektromotorische Kraft der Quelle beträgt E = 6 V (ideale Quelle), die Widerstände sind R1 = 10 Ω, R2 = 15 Ω, parallel geschaltet. Schalter schließen, den Gesamtwiderstand der Schaltung und den Hauptstrom bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'circ-03-emf-internal',
    title: 'Ermittlung von elektromotorischer Kraft und Innenwiderstand der Stromquelle',
    text: 'Mit Amperemeter, Voltmeter und Gleitwiderstand werden die elektromotorische Kraft und der Innenwiderstand der Stromquelle gemessen. Die elektromotorische Kraft der Quelle beträgt E = 4,5 V, der Innenwiderstand r = 0,5 Ω, der maximale Widerstand des Gleitwiderstands beträgt 20 Ω, der Schieber befindet sich in der Mittelposition. Schalter schließen, die Anzeigen von Amperemeter und Voltmeter bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'circ-04-rheostat',
    title: 'Stromregelung mit Gleitwiderstand',
    text: 'Eine Reihenschaltung besteht aus einer Stromquelle, einem Amperemeter, einem Gleitwiderstand und einem Festwiderstand. Die elektromotorische Kraft der Quelle beträgt E = 6 V (ideale Quelle), der Festwiderstand R0 = 10 Ω, der maximale Widerstand des Gleitwiderstands beträgt 20 Ω, der Schieber befindet sich in der Mittelposition. Schalter schließen, den Strom in der Schaltung bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'circ-05-power',
    title: 'Leistung der Stromquelle',
    text: 'Eine Reihenschaltung besteht aus einer Stromquelle und zwei Widerständen. Die elektromotorische Kraft der Quelle beträgt E = 6 V (ideale Quelle), die Widerstände sind R1 = 10 Ω, R2 = 20 Ω, in Reihe geschaltet. Schalter schließen, die Gesamtleistung der Quelle und die Leistung des Außenkreises bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'circ-06-terminal-voltage',
    title: 'Klemmenspannung',
    text: 'Eine Reihenschaltung besteht aus einer Stromquelle und einem Widerstand. Die elektromotorische Kraft der Quelle beträgt E = 9 V, der Innenwiderstand r = 1 Ω, der Außenkreiswiderstand R = 5 Ω, in Reihe geschaltet. Schalter schließen, den Strom in der Schaltung und die Klemmenspannung bestimmen.',
    expectedDomain: 'circuit',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },

  /* --------------------------------------------------------------- induction -- *
   * Fragen zur elektromagnetischen Induktion. Jede nennt entweder einen
   * Leiterstab, der Feldlinien schneidet (E = BLv), oder eine Spule, deren Fluss sich ändert
   * (E = -dΦ/dt), plus den Schleifenwiderstand R, so dass I = E/R. Werte folgen den
   * Lehrbuchvorlagen der Engine, sodass die Antworten exakt sind. */
  {
    id: 'ind-01-bar-motion-emf',
    title: 'Induzierte Spannung bei schneidendem Leiterstab',
    text: 'Ein elektromagnetisches Induktionsexperiment: Die magnetische Flussdichte des homogenen Magnetfelds beträgt B = 0,5 T, ein Leiterstab der Länge L = 20 cm wird senkrecht in das Magnetfeld gelegt und schneidet mit der Geschwindigkeit v = 2 m/s senkrecht die Feldlinien, zusammen mit einem Stromkreis von R = 5 Ω bildet er einen geschlossenen Stromkreis. Gesucht: 1. Induzierte Spannung 2. Induzierter Strom',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'ind-02-bar-motion-lenz',
    title: 'Lenzsche Richtung bei entgegengesetztem Schneiden des Leiterstabs',
    text: 'Elektromagnetisches Induktionsgerät: Die magnetische Flussdichte des homogenen Magnetfelds beträgt B = 0,2 T, die Länge des Leiterstabs beträgt L = 50 cm, er schneidet mit der Geschwindigkeit v = -4 m/s in entgegengesetzter Richtung die Feldlinien, der Schleifenwiderstand beträgt R = 2 Ω. Gesucht: 1. Induzierte Spannung 2. Richtung des induzierten Stroms (Lenzsches Gesetz)',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'ind-03-flux-change-emf',
    title: 'Induzierte Spannung durch magnetischen Flussänderung',
    text: 'Eine eindrähtige Spule wird in ein Magnetfeld gelegt, die magnetische Flussdichte beträgt B = 0,4 T, die Spulenfläche S = 50 cm², die Änderungsrate des magnetischen Flusses beträgt 0,05 Wb/s (gleichmäßig zunehmend), der Spulenwiderstand beträgt R = 2 Ω. Gesucht: 1. Induzierte Spannung 2. Induzierter Strom',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'ind-04-flux-change-lenz',
    title: 'Lenzsche Richtung bei abnehmendem magnetischem Fluss',
    text: 'Beim Abschalten des Elektromagneten verringert sich der durch die Spule gehende magnetische Fluss um 0,08 Wb pro Sekunde (Änderungsrate des magnetischen Flusses -0,08 Wb/s), die Spulenfläche beträgt S = 25 cm², die magnetische Flussdichte B = 0,6 T, der Schleifenwiderstand R = 4 Ω. Gesucht: 1. Induzierte Spannung 2. Richtung des induzierten Stroms',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'ind-05-bar-zero-velocity',
    title: 'Keine Induktion bei ruhendem Leiterstab',
    text: 'Elektromagnetisches Induktionsgerät: In einem homogenen Magnetfeld mit der magnetischen Flussdichte B = 0,5 T befindet sich ein Leiterstab der Länge L = 20 cm in Ruhe (v = 0 m/s), der Schleifenwiderstand beträgt R = 5 Ω. Gesucht: Induzierte Spannung und induzierter Strom',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'ind-06-missing-resistance',
    title: 'Fehlender Schleifenwiderstand (ungültig)',
    text: 'Die magnetische Flussdichte des homogenen Magnetfelds beträgt B = 0,5 T, ein Leiterstab der Länge L = 20 cm schneidet mit der Geschwindigkeit v = 2 m/s senkrecht die Feldlinien. Gesucht: Induzierte Spannung',
    expectedDomain: 'induction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'INVALID_SEMANTICS',
  },

  /* -------------------------------------------------------------------- wave -- *
   * Mechanische-Wellen-Fragen. Eine Seilwelle fixiert zwei von v, λ, f und fragt
   * nach dem Rest; eine Interferenzfrage beurteilt einen Punkt anhand seines Gang-
   * unterschieds; eine Stehwellenfrage liest die Harmonische einer eingespannten Saite.
   * Werte folgen den Lehrbuchvorlagen der Engine, sodass die Antworten exakt sind. */
  {
    id: 'wave-01-speed-from-wavelength-frequency',
    title: 'Wellengeschwindigkeit und Periode aus Wellenlänge und Frequenz',
    text: 'Eine auf einem Seil fortschreitende harmonische Querwelle, Amplitude A = 5 cm, Wellenlänge λ = 0,4 m, Frequenz der Wellenquelle f = 5 Hz. Gesucht: 1. Wellengeschwindigkeit 2. Periode',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-02-wavelength-from-speed',
    title: 'Wellenlänge aus Wellengeschwindigkeit und Frequenz',
    text: 'Eine mechanische Welle breitet sich auf einem Seil mit der Geschwindigkeit v = 2 m/s entlang des Seils aus, die Wellenquelle schwingt mit der Frequenz 10 Hz, Amplitude 4 cm. Gesucht: Wellenlänge der Welle auf dem Seil',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-03-interference-constructive',
    title: 'Zweiquelleninterferenz: Gangunterschied als ganzzahliges Vielfaches der Wellenlänge',
    text: 'Auf der Wasseroberfläche schwingen zwei kohärente Wellenquellen S1, S2 in Phase, beide mit Amplitude 3 cm, Wellenlänge λ = 0,2 m, Frequenz f = 10 Hz, Abstand der Wellenquellen d = 0,8 m. Der Abstand von Punkt P zu S1 beträgt 1,0 m, zu S2 1,4 m. Beurteilen, ob die Schwingung an Punkt P verstärkt oder abgeschwächt ist, und die resultierende Amplitude an Punkt P bestimmen.',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-04-interference-destructive',
    title: 'Zweiquelleninterferenz: Gangunterschied als ungerades Vielfaches der halben Wellenlänge',
    text: 'Die von zwei kohärenten Wellenquellen ausgesandten Wasserwellen haben die Wellenlänge λ = 0,2 m, Frequenz f = 10 Hz, beide Amplituden 3 cm, der Abstand der Wellenquellen beträgt d = 0,8 m. Der Gangunterschied eines Punkts zu den beiden Wellenquellen beträgt Δ = 0,3 m. Beurteilen, ob die Schwingung an diesem Punkt verstärkt oder abgeschwächt ist, und die resultierende Amplitude bestimmen.',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-05-standing-third-harmonic',
    title: 'Dritte Harmonische der Saitenschwingung',
    text: 'Eine Saite der Länge L = 1,0 m ist an beiden Enden fixiert, die Wellengeschwindigkeit auf der Saite beträgt v = 40 m/s, beim Schwingen bildet sich eine Stehwelle der dritten Harmonischen, Amplitude 4 cm. Gesucht: 1. Wellenlänge 2. Schwingungsfrequenz 3. Anzahl der Knoten auf der Saite',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-06-missing-frequency',
    title: 'Fehlende Frequenz (ungültig)',
    text: 'Eine Querwelle auf einem Seil, Wellenlänge λ = 0,4 m, Amplitude 5 cm. Gesucht: Wellengeschwindigkeit',
    expectedDomain: 'wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'INVALID_SEMANTICS',
  },
  {
    id: 'wave-07-longitudinal',
    title: 'Wellenlänge, Frequenz und Wellengeschwindigkeit einer Longitudinalwelle',
    text: 'Eine Longitudinalwelle breitet sich in einem elastischen Medium aus, Amplitude A = 2 cm, Wellenlänge λ = 0,5 m, Frequenz f = 4 Hz, Mediumlänge ℓ = 1,5 m. Gesucht: Wellengeschwindigkeit und Periode',
    expectedDomain: 'wave',
    expectedModel: 'longitudinal_wave',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-08-reflection-refraction',
    title: 'Reflexion und Brechung von Wellen',
    text: 'Wasserwellen haben in Medium 1 die Wellengeschwindigkeit v1 = 4 m/s, nach Eintritt in Medium 2 beträgt die Wellengeschwindigkeit v2 = 2 m/s, der Einfallswinkel beträgt θ1 = 30°, die Frequenz f = 2 Hz. Reflexionswinkel und Brechungswinkel gesucht.',
    expectedDomain: 'wave',
    expectedModel: 'reflection_refraction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-09-single-slit-diffraction',
    title: 'Zentrales Hellfeld bei Einzelschlitzbeugung',
    text: 'Wasserwellen beugen sich an einem Einzelschlitz der Breite a = 1 m, Wellenlänge λ = 0,5 m, Frequenz f = 2 Hz, Abstand vom Schlitz zum Schirm L = 2 m. Breite des zentralen Hellfelds und Beugungswinkel des ersten Dunkelfelds gesucht.',
    expectedDomain: 'wave',
    expectedModel: 'wave_diffraction',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'wave-10-doppler',
    title: 'Dopplereffekt',
    text: 'Eine mechanische Welle breitet sich in einem Medium mit der Wellengeschwindigkeit v = 340 m/s aus, die Frequenz der Wellenquelle beträgt f = 500 Hz, die Wellenquelle nähert sich mit vs = 34 m/s einem ruhenden Beobachter. Die vom Beobachter empfangene Frequenz gesucht.',
    expectedDomain: 'wave',
    expectedModel: 'wave_doppler',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },

  /* ------------------------------------------------------------- mechanics -- *
   * Gleichförmige geradlinige Bewegung und Newtons zweites Gesetz: Einsteigerfragen aus Mittelstufenlehrbüchern. Fragen zu Hebeln, Einfachpendeln, Auftrieb, Wärmelehre
   * würden zuerst auf den Parser stoßen (kein passendes Modell, PARSE_FAILED) oder als andere Modelle missverstanden werden — daher
   * werden hier nur Fragen gesammelt, die die Engine tatsächlich lösen kann, die übrigen Kapitel überlässt man der Lab-Selbsttest-Abdeckung. */
  {
    id: 'mech-07-uniform-distance',
    title: 'Weg bei gleichförmiger geradliniger Bewegung',
    text: 'Xiaoming fährt mit dem Fahrrad auf einer geraden Straße gleichförmig voran, Geschwindigkeit 5 m/s, er fährt 600 s lang. Gegeben: v = 5 m/s, t = 600 s. Gesucht: der von Xiaoming zurückgelegte Weg s',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-08-sound-propagation',
    title: 'Ausbreitungsweg des Schalls',
    text: 'Schall breitet sich in Luft mit der Geschwindigkeit 340 m/s gleichförmig aus, nach 10 s. Gegeben: v = 340 m/s, t = 10 s. Gesucht: der Ausbreitungsweg des Schalls s',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-09-echo-ranging',
    title: 'Entfernungsmessung mit Echo: Ausbreitungsweg',
    text: 'Schall breitet sich in Meerwasser mit der Geschwindigkeit 1500 m/s gleichförmig aus, wird von der Meeresoberfläche senkrecht nach unten ausgesandt und nach 4 s wird das vom Meeresboden reflektierte Echo empfangen. Gegeben: v = 1500 m/s, t = 4 s. Gesucht: der Ausbreitungsweg des Ultraschalls s',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'mech-10-netforce-friction',
    title: 'Resultierende Kraft und Beschleunigung mit Reibung',
    text: 'Ein Körper der Masse 10 kg wird auf einer horizontalen Fläche von Zugkraft und Reibungskraft beansprucht, die horizontale Resultierende beträgt 20 N, der Körper führt eine gleichmäßig beschleunigte Geradlinige Bewegung aus. Gegeben: m = 10 kg, Resultierende F = 20 N. Gesucht: die Beschleunigung a des Körpers',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
]

/**
 * Modern-Physik-Fixtures. Getrennt von der Legacy-Goldenen-Liste, bis der
 * Controller die `modern`-Bibliothek/Renderer-Locale-Verdrahtung hinzufügt; die Frage-
 * Laufzeit und der Parser üben sie bereits Ende-zu-Ende aus.
 */
export const MODERN_GOLDEN_QUESTIONS: readonly GoldenQuestionDefinition[] = [
  {
    id: 'modern-01-photoelectric-energy',
    title: 'Photonenenergie und maximale Anfangsenergie beim photoelektrischen Effekt',
    text: 'Das Auslösearbeitsvermögen eines Metalls beträgt W = 2,0 eV, es wird mit monochromatischem Licht der Wellenlänge λ = 400 nm bestrahlt, Lichtstärke I = 10 W/m², Kathodenfläche S = 1 cm². Photonenenergie, maximale Anfangsenergie, Sperrspannung und Photostrom gesucht.',
    expectedModel: 'photoelectric_effect',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'modern-02-threshold',
    title: 'Grenzfrequenz und Grenzwelllenlänge beim photoelektrischen Effekt',
    text: 'Das Auslösearbeitsvermögen eines Metalls beträgt W = 3,0 eV, es wird mit monochromatischem Licht der Wellenlänge λ = 500 nm bestrahlt. Grenzfrequenz, Grenzwelllenlänge und ob der photoelektrische Effekt eintreten kann, gesucht.',
    expectedModel: 'photoelectric_effect',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'VALID',
  },
  {
    id: 'modern-03-atomic-level-unsupported',
    title: 'Energielevelsprung im Wasserstoffatom (vorläufig nicht unterstützt)',
    text: 'Ein im Energieniveau n = 2 befindliches Wasserstoffatom springt in ein niedrigeres Energieniveau, die Energie des abgestrahlten Photons gesucht.',
    expectedModel: 'atomic_energy_level',
    expectedChargeSign: 'unknown',
    expectedFieldDirection: 'unknown',
    expectedValidation: 'UNSUPPORTED_MODEL',
  },
]

/**
 * Domain a golden question exercises: the explicit `expectedDomain` when set,
 * otherwise the family the id prefix encodes (mech-/circ-/opt-/ind-/wave-).
 * Composite questions always declare theirs explicitly.
 */
export const goldenQuestionDomain = (
  def: GoldenQuestionDefinition,
): NonNullable<GoldenQuestionDefinition['expectedDomain']> =>
  def.expectedDomain ??
  (def.id.startsWith('mech-')
    ? 'mechanics'
    : def.id.startsWith('circ-')
      ? 'circuit'
      : def.id.startsWith('opt-')
        ? 'optics'
        : def.id.startsWith('ind-')
          ? 'induction'
          : def.id.startsWith('wave-')
            ? 'wave'
            : 'magnetic')

export function createGoldenQuestionDocument(
  def: GoldenQuestionDefinition,
  now?: string,
): QuestionDocument {
  const ts = now ?? new Date().toISOString()
  const domain = goldenQuestionDomain(def)
  return {
    id: asQuestionId('golden-' + def.id),
    content: {
      source: 'text',
      rawText: def.text,
      extractedText: def.text,
      status: 'EXTRACTED',
    },
    metadata: {
      title: def.title,
      tags: [
        domain,
        domain === 'mechanics'
          ? 'motion'
          : domain === 'circuit'
            ? 'dc-circuit'
            : domain === 'wave'
              ? 'mechanical-wave'
              : 'charged-particle',
      ],
      difficulty: 'standard',
    },
    createdAt: ts,
    updatedAt: ts,
  }
}
