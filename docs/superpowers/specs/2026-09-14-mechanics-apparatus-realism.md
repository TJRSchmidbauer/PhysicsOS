# Realistische Mechanikgeräte: Vertrag für Kameraposition und Anker

Vergleichsreferenz: das Physiklabor von „Teilchen-Herr“ (die Geräte sind gerenderte reale Objekte, keine Strichzeichnungen).
Die Schaltungsdomäne hat diese Pipeline bereits durchlaufen (`scripts/design/generate-parts3d.mjs` + Vermessung + Katalog + Abnahme);
die Mechanik verwendet denselben **Ablauf** wieder, aber Kameraposition und Anker sind anders – die senkrechte Draufsicht der Schaltungen einfach zu übernehmen würde die Geräte plattdrücken.

## Kameraposition (für den gesamten Stapel gemeinsam, keine Auslassung erlaubt)

- **Orthogonale Seitenansicht von der Seite**: aus der Seite auf Augenhöhe, ohne perspektivische Verkürzung, ohne 3/4-Schrägwinkel. Die natürliche Lesart der Aufbauten der Mechanik
  auf dem Tisch ist der Seitenaufriss; eine Draufsicht würde schiefe Ebene, Wagen und Gewichtsstücke alle unerkennbar machen.
- Die Geräte **stehen auf einer waagerechten Bodenlinie**, die im Bild über die gesamte Breite verläuft (Bezugsgröße der Vermessung).
- Hauptlicht von links oben, kein Schattenwurf auf den Boden (nur ein sehr schwacher Kontaktschatten unten) – ein Schattenwurf würde die Konturvermessung verunreinigen.
- Vollständig transparenter Hintergrund; als einheitliche Maßstabsbasis dient ein **1-m-Labor-Maßstab**, damit die relative Größe zwischen
  Wagen/Gewichtsstücken/Holzklotz stimmt.

## Ankervertrag

Ein Gerät muss mindestens einen Anker haben, der sich **vermessen** lässt, damit die Rendering-Schicht eine Grundlage hat, es auf die Szenengeometrie zu setzen.

| Anker   | Form                         | Verwendung                                            | Entsprechende Szenengröße                            |
| ------- | ---------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| `line`  | Gerade Strecke mit normierten Endpunkten | **Oberseite** langer Geräte: Oberseite des Schiefe-Ebene-Bretts, Tischplatte der Plattform | Abbildung auf eine Szenenstrecke → bestimmt zugleich Drehwinkel und Skalierung |
| `point` | Normierter Einzelpunkt       | Einzelner Aufsetzpunkt/Aufhängepunkt/Kreismittelpunkt | Abbildung auf einen Szenenpunkt → bestimmt nur die Position |

- `line` ist der Schlüssel der schiefen Ebene: Das Brett ist ein **Rechteck**, und in der orthogonalen Seitenansicht ist das Drehen eines Rechtecks eine exakte Transformation,
  daher kann dasselbe Brettbild auf Szenenstrecken beliebiger Neigung geklebt werden; die vom Code gezeichneten Keilstützen und die Bodenschraffur bleiben erhalten
  (das Entwurfsdokument sagt ausdrücklich: Physikalische Liniendiagramme werden vom Code gezeichnet, Bilder ersetzen nicht den physikalischen Vorgang).
- `point` wird für `block` / `ball` / `cart` verwendet: Gemessen wird die **Mitte der Bodenkontaktlinie** (der Mittelpunkt der Linie, auf der Räder oder Unterkante den
  Boden berühren), sodass die bestehende Drehlogik von `Body.rotation` nicht geändert werden muss.
- Die Messweise entspricht der der Schaltungen: Auf der Alpha-Kontur genommen (Schwelle 200), nicht nach Augenmaß.
- **Ob etwas „plattgedrückt“ ist, muss über die Kantensteigung beurteilt werden, nicht über die Breite jeder Zeile**: Ein schmales Brett, das um 8° geneigt liegt, hat in jeder Zeile
  weiterhin die volle Breite; erst wenn man spaltenweise die Scheitelpunkte nimmt, sieht man die Neigung. In der Messung hatte `plank` an der Oberkante die Steigung −0,09°,
  an der Unterkante −0,05° (eben), während die Spitzen-Tal-Differenz der Scheitelpunkte von 57px nur von den Abschrägungen an beiden Enden stammt – beide Kennzahlen müssen gemeinsam betrachtet werden,
  jede allein führt zu Fehlurteilen.
- Zur Messung der Linie der Oberseite wird der **Median der Spaltenscheitelpunkte** genommen, nicht Quartil oder Minimum: Die Abschrägungen an den Enden ziehen die Endpunkte verzerrt.

## Nicht realistisch gemachte Teile

- `Ground` (Bodenlinie + Schraffur), Vektoren, Trajektorien, Maßlinien, Winkelbeschriftungen, Schlüsselpunkte: bleiben alle vom Code gezeichnet.
- Physikalische Größen, Messwerte, Einheiten: werden durchweg von Code und Engine geliefert, die Bitmap trägt keinerlei Zahlen.
