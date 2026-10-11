# @physicsos/exam-standard

Die **Exam Standard Runtime**: der Vertragskern, der dafür sorgt, dass eine erzeugte
Klausur von versionierten offiziellen Standards bestimmt wird und nicht davon, dass
das Sprachmodell sich eine Klausur aus Guizhou „so vorstellt“. Sie ist neben der
Physik-Welt-Runtime und dem Aufgaben-Compiler der dritte Burggraben des Projekts.

Dieses Paket liefert **ausschließlich Verträge und Mechanik**. Es enthält **kein
befülltes echtes Pack** – keine Klausurstruktur aus Guizhou, keine Aufgabenanzahl,
keine Punkteverteilung, keine Schwierigkeitszahl, keinen Bewertungsraster, keine
Quellenmetadaten. Das spätere Befüllen mit Guizhou 2026 ist eine Datenaufgabe, die
von offiziellen Dokumenten getrieben wird; die Erweiterung auf eine andere Provinz
oder das landesweite 新高考 ist ein neues versioniertes Pack, niemals ein Zweig in
dieser Engine.

## Versionierung – niemals ein einzelnes Boolean

```
CN → Guizhou → { 中考 | 高考 } → { 2024 | 2025 | 2026 … }
```

Ein Profil wird durch `(jurisdiction, stage, subject, year)` identifiziert. 中考 und
高考 sind **vollständig getrennte Profile** (unterschiedliche Lehrplanwurzeln; keine
gemeinsame Vorlage mit Schwierigkeitsschalter). Maßgeblich dafür, was gefragt werden
darf, ist der **考试范围 / Curriculum Scope** (`ContentScope`) – niemals ein 考试大纲.

## Verträge

`ExamProfile`, `PaperBlueprint`, `ContentScope`, `QuestionTaxonomy`,
`CompetencyModel`, `AnswerStandard`, `ScoringStandard`, `OfficialSourceRef`,
`QuestionRecord` und die drei getrennten Antwortebenen (`FinalAnswer`,
`ExamSolution`, `LearningExplanation`) mit strukturierten `ScoringPoint`s.

## Auflösung und der unbestätigte Zustand

```ts
import { createExamStandardRegistry, planPaper, examStandardRegistry } from '@physicsos/exam-standard'

const registry = createExamStandardRegistry()          // leer: kein echtes Pack
registry.resolve({ jurisdiction: 'CN-GZ', stage: 'ZHONGKAO', subject: 'PHYSICS', year: 2026 })
// → { status: 'UNCONFIRMED', code: 'NO_PACK_REGISTERED', … }   // niemals ein Default

planPaper(registry, target) // → { status: 'REFUSED', code, reason }  // rät niemals
```

Ein unbestätigtes Profil, ein unvollständiger Blueprint oder ein mehrdeutiges Ziel
erzeugen einen ausdrücklichen Zustand `UNCONFIRMED` / `REFUSED` mit einem stabilen
Code. Eine Runtime, die offizielle Normen errät, ist schlechter als eine, die
ablehnt.

## Zwei Verifier, getrennt gehalten

- `@physicsos/physics-verifier` → *Stimmt die Physik?* (nicht dieses Paket)
- `verifyExamCompliance` → *Liegt das im Stoffumfang, ist es ein gültiger Typ, eine
  gültige Punktzahl, ein gültiges Antwortformat, im Rahmen des Schwierigkeitsziels,
  und erfüllt es die Blueprint-Abdeckung?*

Der Klausur-Verifier verarbeitet die `PhysicsVerificationSummary` des
Physik-Verifiers strukturell (damit die Abhängigkeit draußen bleibt) und gibt nur die
Anzahl der Physik-Ergebnisse wieder; über die Physik urteilt er nicht. Sein
`ExamComplianceReport` endet bei `READY_FOR_TEACHER_REVIEW` – das System schlägt vor,
eine Lehrkraft genehmigt. Er endet niemals bei „offiziell“.

## Gate gegen gefälschte Offizialität

`checkNotFakeOfficial` verlangt, dass jedes erzeugte Artefakt als PhysicsOS
模拟试卷 / 非官方试卷 (Probeklausur / nicht offizielle Klausur) gekennzeichnet ist,
und weist alles zurück, was sich als offiziell ausgibt (ein Label
`OFFICIAL_PAPER_CLAIM`, eine Zuschreibung an eine echte Behörde oder Fließtext, der
eine offizielle Herausgabe behauptet), mit dem stabilen Code
`EXAM_FAKE_OFFICIAL_CLAIM`.

## Tests

```sh
pnpm -C packages/exam-standard test        # vitest
pnpm -C packages/exam-standard typecheck   # tsc --noEmit
pnpm -C packages/exam-standard lint        # eslint
```

Die Tests verwenden eindeutig gekennzeichnete synthetische Fixtures
(`TEST-FIXTURE-*`, `.invalid`-URLs) und prüfen den ehrlichen Fehlermodus: Ohne
bestätigtes Profil/bestätigte Quellen lehnen Auflösung und Planung ab, statt einen
Default zu verwenden.
