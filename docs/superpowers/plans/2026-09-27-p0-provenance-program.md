# PhysicsOS P0-Provenance-Programm (vertrauenswürdige Herkunft)

> Diese Datei hält die vom Owner genehmigten Abnahmekriterien und die neu geordnete Roadmap fest. Reine Dokumentation, der Code wird nicht geändert.

**Ziel:** „Verifiziert“ zu einer lauffähigen Tatsache machen – jede für Nutzer sichtbare physikalische Schlussfolgerung, die Verified behauptet, muss auf eine konkrete Scene Revision, Engine, einen Verifier und echte Prüfungsevidenz zurückverfolgbar sein.

## 1. Architekturprinzip (wörtlich zitierbar)

> Verified is a property of evidence, not a presentation state.
> „Verifiziert“ ist eine Eigenschaft von Evidenz, kein Anzeigezustand der UI.

**Folgerung:** UI, Agent, Paper und Question dürfen nicht selbst „verifiziert“ behaupten; nur die Verifikationskette von PhysicsOS darf das.

## 2. Kanonische Kette

```
LLM / User / Question / Paper
            ↓
      Physics Semantic Input
            ↓
        PhysicsScene
            ↓
      Physics Engine
            ↓
         Verifier
            ↓
        Provenance
            ↓
    Verified Physics Result
            ↓
   UI / Agent / Paper / Export
```

Hinweis: Harness, Modell und UI sind austauschbar; `PhysicsScene → Engine → Verifier → Provenance` gehört uns, und alle zentralen physikalischen Schlussfolgerungen müssen durch sie hindurch.

## 3. P0-Abschlusskriterien (die fünf Punkte des Owners)

1. **Provenance ist ein Fakt, kein Etikett**: `verificationLevel` darf nur aus tatsächlichen Verifier-Prüfungen abgeleitet werden; fehlen `engineId`, `sceneRevision` oder Verifier-Evidenz, wird der Wert auf `UNVERIFIED` herabgestuft. `default: VERIFIED` ist verboten, die UI darf nicht selbst urteilen.
2. **Die UI für „Verifiziert“ konsumiert nur Fakten**: Es darf kein grünes Abzeichen angezeigt werden, nur weil „das Ergebnis unauffällig aussieht“; ohne Provenance wird `Unverified` angezeigt; die UI soll an ein einheitliches Standard-DTO binden, statt Felder seitenweise zusammenzusetzen.
3. **Das CI-Gate muss rot werden können**: Mindestens drei Fixtures – eine vom Modell direkt erzeugte nackte Zahl, ein Wert ohne `sceneRevision` und ein **gefälschtes** `verificationLevel: STRONGLY_VERIFIED` (unzureichende stützende Prüfungen) – das Gate muss bei allen dreien tatsächlich rot melden.
4. **Der Abgang des leeren Agent-Packages ist ausführbar**: Zuerst null Produktionskonsumenten bestätigen, dann löschen; die ADR wechselt von Proposed zu Accepted/Executed; die Dokumentation muss festhalten, dass **der Harness der Agent-Host ist**, und darf nicht andeuten, PhysicsOS pflege eine eigene Agent-Runtime.
5. **Werbetexte werden erst geändert, wenn die Kette durchläuft**: Erst wenn `Paper → Engine → Verifier → Provenance → Verified UI → CI Gate` Ende-zu-Ende wirklich nutzbar ist, wird angefasst, damit „verifizierbar“ ein lauffähiger Fakt statt einer Parole wird.

## 4. P0-Abnahme (Definition von fertig)

> Jede für Nutzer sichtbare physikalische Schlussfolgerung, die „Verified“ behauptet, muss auf eine konkrete Scene Revision, Engine, Verifier und echte Prüfungsevidenz zurückverfolgbar sein; andernfalls gilt sie ausnahmslos als Unverified.

Diese Abnahme muss als **Invariante auf Code-Ebene** umgesetzt werden und nicht nur als Richtlinie.

## 5. Merge-Reihenfolge

Die drei P0-Workstreams werden ohne Einschränkung parallel entwickelt, die Merge-Reihenfolge ist aber fest `Provenance → Gate → UI`: Die UI darf nicht zuerst landen und dann immer wieder gegen noch wechselnde Typen überarbeitet werden.

## 6. Zuordnung von Workstreams zu Kriterien

| Workstream     | Übernommene Kriterien                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Provenance** | Kriterium 1 (`verificationLevel` wird nur aus echten Prüfungen abgeleitet, bei fehlender Evidenz Herabstufung auf `UNVERIFIED`, `default: VERIFIED` verboten); Kriterium 4 (Abgang des leeren Agent-Packages, ADR wird Accepted/Executed, Dokumentation hält fest, dass der Harness der Agent-Host ist); Invarianten auf Code-Ebene der Abnahme |
| **Gate**       | Kriterium 3 (drei negative Fixtures, das Gate meldet tatsächlich rot)                                                                                                                                                                       |
| **UI**         | Kriterium 2 (konsumiert nur Fakten, bindet ein einheitliches DTO, ohne Provenance wird `Unverified` angezeigt)                                                                                                                              |
| **Alle Workstreams** | Kriterium 5 (Werbetexte einfrieren, bis die Kette Ende-zu-Ende nutzbar ist) ist die zeitliche Randbedingung dieses Programms und gilt über alle Workstreams hinweg                                                                    |

## 7. Reihenfolge des P1-Experiment-Kreislaufs (Aufzeichnung)

Begründung: Innerhalb von 30 Sekunden nach dem Öffnen eines Experiments sollte der Nutzer messen, sondieren, die Zeitleiste der physikalischen Ereignisse ansehen und wiedergeben können – das beweist das Vorhandensein einer echten physikalischen Runtime besser als ein weiteres KI-Panel.

`Measurement Tools → Physics Timeline → Experiment Notebook → Branch Compare → Question → World Visualisierung → Challenge`

Dabei ist das Experiment Notebook der Ort, an dem sich das obige Verhalten niederschlägt, und Challenge der spätere Wachstumseinstieg. `docs/ROADMAP.md` hält diese Reihenfolge gleichfalls fest.

## 8. Folgeaktionen

- Das Architekturprinzip (Abschnitt 1) wird beim P0-Abschluss in `docs/02-ENGINEERING-STANDARDS.md` aufgenommen (derzeit ist diese Datei von einem anderen Agent belegt, daher wird vorerst nicht hineingeschrieben, um Konflikte zu vermeiden).
- Diese Datei ist die Aufzeichnung und der Abnahmevertrag für P0; die Umsetzungsdetails richten sich nach den Umsetzungsberichten der einzelnen Workstreams.
