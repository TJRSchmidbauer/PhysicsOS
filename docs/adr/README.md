# Architekturentscheidungsprotokolle (ADR)

Dieses Verzeichnis dokumentiert die Architekturentscheidungen von PhysicsOS in schlanken ADRs: eine Entscheidung pro Datei, die Nummern steigen monoton, werden nicht wiederverwendet und nicht neu vergeben.

## Ablauf

1. [`0000-template.md`](./0000-template.md) kopieren und in `NNNN-<kurzer-titel>.md` umbenennen (`NNNN` ist die aktuell höchste Nummer + 1, vierstellig mit führenden Nullen).
2. Die vier Abschnitte Kontext, Entscheidung, Konsequenzen und Alternativen ausfüllen und den Status angeben (vorgeschlagen / akzeptiert / verworfen / ersetzt).
3. Zusammen mit dem zugehörigen Code als PR zur Review einreichen; nach dem Merge wird der Text einer akzeptierten ADR nicht mehr umgeschrieben.
4. Ändert sich die Schlussfolgerung, wird eine neue ADR angelegt, und beide ADRs verweisen gegenseitig auf die Ersetzungsbeziehung.

## Index

Die folgenden Einträge sind noch nicht nachgetragen; es ist nur der Titel vermerkt. Sie werden erst dann als ADR ausgearbeitet, wenn die jeweilige Entscheidung endgültig feststeht. Bis dahin gelten sie nicht als wirksame Schlussfolgerungen.

| Nr. | Titel                   | Status        |
| --- | ----------------------- | ------------- |
| —   | Overlay-Mechanismus     | Nachzutragen  |
| —   | Postgres + Redis Runtime | Nachzutragen |
| —   | Server-Modus der Desktop-Shell | Nachzutragen |
