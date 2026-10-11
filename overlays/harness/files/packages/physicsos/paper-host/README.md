# @deepseek-ai/dsh-paper-host

Host-Plugin für den PhysicsOS-Klausurbereich (出卷专区) – die Klausurdomäne (Blueprints, Spezifikationstabellen, bankgesteuertes Entwerfen, Prüfung pro Aufgabe, hashgebundene Freigabe, DOCX-/PDF-Export) und die REST-Oberfläche `/physicsos/paper` über den Service `webServer` und eine Storage-Domänen-Einheit `physicsos_paper`.

Nur Klausur + Lösungsweg: Dieses Plugin erzeugt standardmäßig druckbare A4-Klausuren und Lösungsblätter; es macht keine Hausaufgaben, keine Korrektur und keine Klassenverwaltung.

## Modell

```
source_paper ──< annotations        # Originalklausur + Prüfungspunkt-Annotation pro Aufgabe (Erfassungsfläche)
                                      auch das Durchsuchen der Klausurbibliothek liest diese beiden Tabellen
bank_items ──< bank_usage           # verifizierte Aufgabenbank + Nutzungshauptbuch (Grundlage des Frischegates)
blueprints                          # verifizierte Strukturvorlagen (Physik-Zhongkao 90 / Naturwissenschaften komplex 150 / Gaokao 100)
jobs ──< exports                    # Klausuraufträge – der vollständige Zustandsautomat von der Zusammenstellung bis zur Lieferung
```

`jobs` ist die einzige Schreibautorität: Zusammenstellungsplan, Entwurfsdokument, Prüfprotokoll pro Aufgabe, unabhängiger Lösungsbericht, Freigabe-Hash und Exportmanifest hängen daran.

### Zustandsautomat des Auftrags

```
spec → drafting → checking → review → approved → exported
                     ↘ failed
```

Nach `review` macht jedes `commitDocument` (Aufgabe tauschen, überarbeiten, Dokument ändern) die aktuelle Freigabe ungültig – die Freigabe ist an den Inhalts-Hash gebunden, keine Änderung kann sie umgehen.

## REST-Oberfläche (`/physicsos/paper`)

### Originalklausuren und Prüfungspunkte

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/sources` | Liste der Originalklausuren (nach `status` filterbar) |
| POST | `/sources` | Originalklausur erfassen (region / school / kind / featured) |
| GET | `/annotations?source=` | Liste der Prüfungspunkt-Annotationen |
| POST | `/sources/:id/annotations` | Annotation pro Aufgabe (Aufgabennummer / Typ / Punktwert / Prüfungspunkt / Kompetenz / vollständiger Aufgabentext) |
| POST | `/sources/:id/verify` | Originalklausur verifizieren (`pending → verified`) |
| POST | `/sources/:id/import/csv` | Massenimport von Annotationen (naive Kommatrennung, Aufgabentexte mit Kommas passen nicht hinein) |
| POST | `/annotations/:id/review` | Annotation verifizieren |
| GET | `/stats` | Statistik der Erfassungsfläche |

> Das Durchsuchen der Klausurbibliothek zeigt nur `verified`-Originalklausuren und -Annotationen; `pending` ist im Verwaltungshauptbuch des Klausurbereichs sichtbar.

### Aufgabenbank

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET | `/bank/items?status=&level=&kind=` | Liste der Aufgabenbank; `status` akzeptiert nur `pending\|verified\|rejected`, ungültige Werte ergeben 400 |
| POST | `/bank/items` | direkt aufnehmen (striktes Wire-Format) |
| PUT | `/bank/items/:id` | Eintrag überarbeiten; `id` / `enteredBy` werden per `omit` entfernt und können nicht eingeschleust werden |
| POST | `/bank/ingest` | Import per Einfügen: strukturierte Modell-Extraktion + Anomalieerkennung |
| POST | `/bank/items/:id/review` | `pending → verified / rejected` |
| GET | `/bank/items/:id/usage` | Nutzungshauptbuch dieser Aufgabe |

### Zusammenstellung und Lieferung

| Methode | Pfad | Beschreibung |
| --- | --- | --- |
| GET/POST | `/blueprints` | Liste der Strukturvorlagen / neu anlegen |
| POST | `/blueprints/:id/verify` | Vorlage verifizieren |
| GET | `/jobs` | Auftragsliste |
| POST | `/jobs` | Auftrag anlegen (`{blueprintId, request}`) → zweidimensionale Spezifikationstabelle erzeugen |
| PUT | `/jobs/:id/spec` | Lehrkraft bestätigt/passt die Spezifikationstabelle an |
| GET | `/jobs/:id/bank-plan` | Vorschau des Zusammenstellungsplans (Supply-Modus und Score je Aufgabe, ohne Aufnahme in die Klausur) |
| POST | `/jobs/:id/draft` | Entwerfen (asynchron, 202) |
| POST | `/jobs/:id/check` | automatische Prüfung + unabhängiges Lösen (asynchron, 202) |
| POST | `/jobs/:id/questions/:no/repair` | einzelne Aufgabe nach Anmerkung der Lehrkraft überarbeiten |
| POST | `/jobs/:id/questions/:no/replace` | Aufgabe tauschen (synchrone Validierung vor dem 202, ohne Kandidat sofort 404) |
| POST | `/jobs/:id/questions/:no/review` | Aufgabe einzeln freigeben / zurückweisen |
| PUT | `/jobs/:id/document` | Dokument direkt ändern (Änderung macht die Freigabe ungültig) |
| POST | `/jobs/:id/approve` | gesamte Klausur freigeben (an den aktuellen Hash gebunden) |
| POST | `/jobs/:id/export` | Vierer-Paket exportieren (Schülerklausur/Lösungsklausur × PDF/DOCX) |
| GET | `/jobs/:id/files/:name` | Download; Dateinamen laufen über eine Allowlist, der Pfad darf nach `normalize` den Export-Root nicht verlassen |

Fehler antworten stets mit `{error:{code,message}}` und dem entsprechenden HTTP-Status.

## Zusammenstellungsalgorithmus (reine Funktionen, in `@physicsos/question-paper`)

Jede Zeile der Spezifikationstabelle wird unabhängig entschieden, vier Versorgungsstufen:

| Modus | Auslöser | Verhalten |
| --- | --- | --- |
| `verbatim` | Kandidaten-Score ≥ 0,85 | Originalaufgabe wird übernommen, kein Wort geändert |
| `adapt` | Score ∈ [0,55; 0,85) | Situation und Zahlenwerte werden auf dem Gerüst der Originalaufgabe umgeschrieben, Antwort neu berechnet |
| `generate` | Zeile ohne Kandidat über der Schwelle | Modell neu aufgabenstellen lassen (mit Beispielen aus der Aufgabenbank möglich) |
| `gap` | Aufgabentyp/Prüfungspunkt ohne Lösung | ehrlich leer lassen, nichts zusammenstückeln |

Kandidaten-Score = Wissenspunkt 0,45 + Schwierigkeit 0,25 + Kompetenz 0,15 + Quelle 0,15; die Quelle nimmt ab in der Reihenfolge „verifizierte Originalklausur > ausgewählte Schul-/Verbundklausur > sonstige geprüfte > öffentlich/aus dem Gedächtnis rekonstruiert“. Das Frischegate `freshnessPapers` drückt Aufgaben herunter, die in den letzten Klausuren verwendet wurden (nur approved/exported-Klausuren zählen, failed-Klausuren belegen kein Kontingent).

**provenance ist nicht fälschbar**: `generated`-Aufgaben erhalten in `draftSection` einheitlich den Stempel `{mode:'generated'}`, was eine vom Modell möglicherweise mitgebrachte falsche `bankItemId` wegwischt; das Hauptbuch bucht nach der **provenance der tatsächlich in die Klausur aufgenommenen Aufgabe**, nicht nach dem Plan – eine zu generate herabgestufte Aufgabe wird nicht fälschlich als adapted verbucht.

## Prüfung und Belege

- `checks.ts` (reine Funktionen): Gesamtpunktzahl / Punktwerte / Lückenlosigkeit der Aufgabennummern / fehlende Antwort / fehlende Abbildung / außerhalb des Stoffs / doppelte Aufgaben
- Unabhängige Lösungsrunde: ohne Kandidatenantwort noch einmal lösen und vergleichen, erzeugt ein `SolveResult` in `solveReport`
- Vor jedem Export muss die `approval` mit dem Hash der aktuellen Version übereinstimmen

## Externe Werkzeuge, von denen es abhängt

| Werkzeug | Zweck | Bei Fehlen |
| --- | --- | --- |
| `pandoc` | Markdown → DOCX (`$LaTeX$` → bearbeitbare OMML-Formeln) | Export schlägt fehl und meldet einen Fehler |
| `soffice` (LibreOffice) | DOCX → PDF | Export schlägt fehl und meldet einen Fehler |
| `unzip` | `reference.docx` der Referenzvorlage entnehmen | Export schlägt fehl und meldet einen Fehler |

Alle drei werden isoliert per `spawn` aufgerufen (nicht über eine Shell), mit Timeout und `cwd`-Isolation.

## Hinweis zum Build

Der Einstieg von `tsdown` ist `lib/types/index.js` (Produkt von `tsc`), daher **erst `tsc -b`, dann `tsdown`** – ein direkter `tsdown`-Lauf bündelt das alte Produkt des letzten Mals; das äußert sich als „die Route steht im Quellcode, liefert aber 404“. Verwenden Sie `pnpm run bundle` im Paket, das beide Schritte in der richtigen Reihenfolge ausführt.

## Modellerfahrung

Keine, da das Paket Browser-REST-Oberflächen für Klausuren und die Aufgabenbank bedient und nichts modellseitig Sichtbares registriert.

#### KV-Cache-Wirkung

Keine; dieses Paket stellt keine Provider-Anfrage zusammen und sendet auch keine.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Der CSV-Import trennt naiv nach Komma/Tabulator, Aufgabentexte mit Kommas passen nicht hinein – Aufgabentexte werden über das Formular pro Aufgabe erfasst
- Die Browse-Seite zeigt nur `verified`-Originalklausuren und -Prüfungspunkte
- Die Spalte für den Aufgabentyp zeigt das rohe Enum (z. B. `choice-single`); chinesische Labels sind eine spätere kleine Änderung
- Kein REAL-Composition-Test (`routes.spec.ts` läuft über eine Map-gestützte Domäne); die echte Kette tragen manuelle E2E-Tests außerhalb von `auth-host` und die Browser-Abnahme
