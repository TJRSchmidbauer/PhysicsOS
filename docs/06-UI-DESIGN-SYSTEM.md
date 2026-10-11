# PhysicsOS UI Design System

> Datei: `docs/06-UI-DESIGN-SYSTEM.md`  
> Dokumentzweck: UI-Designsystem und visuelle Engineering-Spezifikation für PhysicsOS Web / Desktop  
> Visuelle Faktenquellen: `UI/原型图/` (Prototypen), `UI/组件图/` (Komponentenbilder)
>
> Diese Datei ist keine „Designreferenz“, sondern die visuelle Spezifikation, die bei der Frontend-Implementierung verbindlich einzuhalten ist.
>
> **Die Prototypen definieren die visuellen Fakten der Seiten, die Komponentenbilder die Gestalt der Komponenten, und diese Datei überführt die visuellen Regeln in Engineering-Form.**

---

# 1. Designziele

PhysicsOS soll nicht wie ein klassisches Bildungs-SaaS, eine Behörden-Verwaltungsoberfläche, eine dunkle Tech-Plattform oder ein mit Karten überfülltes Verwaltungssystem wirken.

Ziel-Optik:

> **Hell, präzise, wissenschaftlich, zurückhaltend, hochwertig, mit starkem Raumgefühl, hoher Informationsdichte, aber nicht erdrückend.**

Kernschlagwörter:

```text
Bright
Precise
Scientific
Calm
Premium
Spatial
Readable
Interactive
```

Die wahren Hauptdarsteller von PhysicsOS sind:

```text
Physics World
Physics Canvas
Question Content
Experiment Object
Trajectory
Force
Field
Energy
Data
```

Die UI ist nur das „Präzisionsgerätegehäuse“, das diese Inhalte trägt.

---

# 2. Priorität der visuellen Faktenquellen

Bei Implementierungskonflikten gilt folgende Priorität:

```text
Seitenprototypen
>
Komponentenbilder
>
Dieses Designsystem
>
Standardstile von Komponentenbibliotheken Dritter
```

Wenn die Standardstile von shadcn / Radix / Tailwind dem Prototyp widersprechen:

> Müssen die Standardstile überschrieben werden, statt die Richtung des Prototyps zu ändern.

---

# 3. Markenvisualität

Marke:

```text
PhysicsOS
```

Logo:

```text
Blaues geometrisches Raumstruktur-Symbol
+
PhysicsOS-Wortmarke
```

Visuelle Merkmale:

```text
Wissenschaftlich
Geometrisch
Räumlich
Ordnung
Präzision
```

Verboten:

```text
Cartoonisierung
Starkes Neon
Schwere Metalloptik
Großflächiges Violett
Komplexe, hochgesättigte Verläufe
```

---

# 3.1 Maskottchen „Kleines Q“ (小 Q)

PhysicsOS hat ein Maskottchen: eine glänzende blaue Kugel + weiße Gesichtsmaske + ein Elektronenbahn-Ring. Es gibt der Markengeometrie (Blau, Raum, Bahn) ein Gesicht und ist das einzige Element im Produkt, das „vermenschlicht“ sein darf.

Assets:

```text
UI/generated/mascot/                       Original-PNG mit Transparenz (Ausgabe des Generierungsmodells nach Cutout)
apps/web/public/physicsos/mascot/          WebP für das Web: {wave,think,search}-{160,320,640}.webp
scripts/design/cutout-mascot.py            Rendering auf Weiß → transparenter Ausschnitt (weicher Schatten bleibt erhalten)
ui-physicsos/src/client/Mascot.tsx         Die einzige Render-Komponente (Pose / Größe / Schweben)
```

Die drei Posen haben jeweils eigene Bedeutung und dürfen nicht vermischt werden:

```text
wave     Begrüßung —— Hero der Startseite, Einstiegsbutton des KI-Assistenten
think    Nachdenken / Erklären —— Leerzustand des KI-Assistenten, Herleitung, Laden
search   Suchen —— Kopfbereich des Experimentzentrums, Leerzustand des Lernverlaufs, keine Ergebnisse
```

Regeln:

```text
Geschäftscode nutzt es nur über <Mascot pose size />, ohne direkte Referenz auf die webp-Dateien
Pro Ansicht höchstens ein Kleines Q
Erscheint nicht im Inneren des PhysicsCanvas (der Canvas zeichnet nur Physik)
Konkurriert nicht im selben Bildausschnitt mit Physikdaten um den Fokus
```

---

# 4. Basis-Farbtokens

Empfohlen:

```css
:root {
  --bg-app: #f7f9fc;
  --bg-page: #fafbfd;
  --bg-surface: #ffffff;
  --bg-subtle: #f5f7fa;
  --bg-hover: #f2f6ff;
  --bg-selected: #edf4ff;

  --text-primary: #14213d;
  --text-secondary: #5f6b7a;
  --text-tertiary: #8a94a6;
  --text-disabled: #b5bdca;

  --primary-50: #f3f7ff;
  --primary-100: #e8f0ff;
  --primary-200: #d4e3ff;
  --primary-300: #afcbff;
  --primary-400: #76a5ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;

  --success-50: #f2fbf4;
  --success-500: #4caf50;
  --success-600: #3d9442;

  --warning-50: #fff9ee;
  --warning-500: #f2a93b;

  --danger-50: #fff3f2;
  --danger-500: #e95b54;

  --border-soft: #e8ecf2;
  --border-default: #dde3ec;
  --border-strong: #ccd5e1;

  --glass: rgba(255, 255, 255, 0.72);
  --glass-strong: rgba(255, 255, 255, 0.88);
}
```

Die Markenhauptfarbe ist stets ein natürliches Blau.

Grün wird verwendet für:

```text
Verifikation bestanden
CTA im Aufgabenraum
Erfolgszustände
```

Orange wird verwendet für:

```text
Warnungen
Energiebezogene Hervorhebungen
Schwierigkeit
```

Rot wird verwendet für:

```text
Fehler
Konflikte
Fehlschläge
```

Violett darf nicht die Hauptmarkenfarbe sein.

---

# 5. Seitenhintergrund

Standard:

```css
background:
  radial-gradient(circle at 35% 0%, rgba(214, 229, 255, 0.22), transparent 34%),
  linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%);
```

Der Canvas-Hintergrund des Arbeitsbereichs kann verwenden:

```text
#FBFDFF
```

mit einem sehr leichten blaugrauen Raster.

---

# 6. Hintergrundregel für das KI-gestützte Zuschneiden von Komponenten

Damit KI / CV / Frontend-Entwickler Komponentenbilder leicht manuell zuschneiden können:

> **Komponentenbilder verwenden einheitlich einen fast reinweißen, texturlosen, störungsarmen Hintergrund.**

Empfohlen:

```text
Hintergrundfarbe: #FFFFFF oder #FAFBFD
Abstand zwischen Komponenten: mindestens 48px
Jede Komponente vollständig eigenständig
Keine Überlappung
Keine komplexen Hintergrundbilder
Keine verdeckenden Schattenstapel
Keine großen Verlaufs-Lichtflecken hinter Komponenten
```

Wenn transparentes Material benötigt wird:

```text
Separat als transparentes PNG exportieren
```

Für Übersichtsbilder zum automatischen KI-Zuschneiden:

```text
Bevorzugt #FFFFFF
```

---

# 7. Schriftsystem

Chinesisch:

```text
PingFang SC
Microsoft YaHei
Noto Sans SC
system-ui
```

Englisch/Ziffern:

```text
Inter
SF Pro Display
system-ui
```

Formeln:

```text
KaTeX
```

---

# 8. Schriftgrößensystem

```text
Display XL    44 / 52 / 700
Display L     36 / 44 / 700
H1            30 / 38 / 700
H2            24 / 32 / 700
H3            20 / 28 / 650
H4            18 / 26 / 600
Body L        16 / 26 / 400
Body          14 / 22 / 400
Body S        13 / 20 / 400
Caption       12 / 18 / 400
Micro         11 / 16 / 400
```

---

# 9. Abstandssystem

Basiseinheit:

```text
4px
```

Empfohlen:

```text
4
8
12
16
20
24
32
40
48
64
```

---

# 10. Eckenradien

```text
4px  Sehr kleine Steuerelemente
6px  Input
8px  Standard-Button
10px Mini Card
12px Panel / Card
16px Hero Card
20px Große Einstiegskarten der Startseite
```

---

# 11. Rahmen und Schatten

Standard:

```css
border: 1px solid #e8ecf2;
```

Ausgewählt:

```css
border-color: #8bb4ff;
box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.08);
```

Schatten:

```css
--shadow-xs: 0 1px 2px rgba(20, 33, 61, 0.04);
--shadow-sm: 0 4px 14px rgba(20, 33, 61, 0.06);
--shadow-md: 0 10px 30px rgba(20, 33, 61, 0.08);
```

---

# 12. Glass

Nur verwendet für:

```text
Navigation
Schwebende Toolbar
Inspector
Hero-Datenüberlagerung
Modal
```

Empfohlen:

```css
background: rgba(255, 255, 255, 0.76);
backdrop-filter: blur(18px) saturate(140%);
border: 1px solid rgba(222, 229, 239, 0.72);
```

---

# 13. Button

Kategorien:

```text
Primary
Secondary
Ghost
Danger
```

Primary:

```text
Blauer Hintergrund, weiße Schrift
Höhe 36–40px
Eckenradius 8px
```

CTA der Startseite:

```text
42–46px
```

---

# 14. Input / Select

Standardhöhe:

```text
34–38px
```

Focus:

```text
Blauer Rahmen + leichter äußerer Ring
```

Zahleneingaben bieten:

```text
NumericStepper
```

mit Unterstützung für:

```text
Schrittweite
Einheit
Wissenschaftliche Notation
min/max
```

---

# 15. Tabs

Section Tabs:

```text
Eigenschaften
Beobachtbare Größen
Daten
Diagramme
Erweiterte Optionen
```

Aktiv:

```text
Blaue Schrift + 2px blaue Linie unten
```

---

# 16. Chip / Status

Chips werden verwendet für:

```text
Fach
Wissenspunkt
Schwierigkeit
Status
```

Status:

```text
Gespeichert Green
Läuft Blue
Nicht begonnen Amber
Nicht bestanden Red
Entwurf Gray
```

---

# 17. Card

Nach Domäne unterschieden:

```text
Entry Card
Data Card
Topic Card
Question Card
History Item
Panel Card
Summary Card
```

Nicht alle Inhalte in ein einheitliches Card-Schema pressen.

---

# 18. Einstiegskarten der Startseite

Zwei zentrale Einstiege:

```text
Physics Lab
Question Space
```

Anforderungen:

```text
Text links, Bild rechts
Starkes visuelles Asset
Primärer CTA
Viel Weißraum
```

---

# 19. Top Navigation

Web:

```text
Logo
Startseite
Physiklabor
Aufgabenraum
Lernverlauf
Ressourcenbibliothek
Mein Bereich
Globale Suche
Benachrichtigungen
Avatar
```

Höhe:

```text
60–64px
```

---

# 20. Desktop Sidebar

Unterstützt:

```text
Aufgeklappt
Eingeklappt
Hover
Active
```

---

# 21. Workspace Toolbar

Enthält:

```text
Neu
Öffnen
Speichern
Speichern unter
Ausführen
Pause
Stopp
Zurücksetzen
Parameterdurchlauf
Exportieren
Screenshot
Rückgängig
Wiederholen
```

---

# 22. Scene Tree

Knotenzustände:

```text
normal
hover
selected
hidden
locked
disabled
```

---

# 23. Inspector

Gruppen:

```text
Teilcheneigenschaften
Anfangsbedingungen
Magnetfeldeinstellungen
Erweiterte Einstellungen
```

---

# 24. Observation Panel

Einträge:

```text
Checkbox
Name
Symbol
Unit
Drag Handle
```

---

# 25. Physics Canvas

Der Canvas muss das visuelle Zentrum sein.

Raster:

```text
Hauptraster #DCE6F5
Nebenraster #EEF3FA
Koordinatenachsen #75859A
```

---

# 26. Physik-Semantikfarben

```text
Velocity      Green
Force         Blue
Acceleration  Orange
Momentum      Cyan
Electric      Blue-Cyan
Magnetic      Blue
Trajectory    Primary Blue
Energy        Amber
Error         Red
```

---

# 27. Magnetic Field

In die Zeichenebene hinein:

```text
×
```

Aus der Zeichenebene heraus:

```text
·
```

Verwendet ein wenig gesättigtes Blaugrau.

---

# 28. Trajectory

```text
Echtzeit: 2px blaue durchgezogene Linie
Vorhersage: blaue gestrichelte Linie
Verlauf: reduziertes Alpha
```

---

# 29. Timeline

Unterstützt:

```text
Abspielen
Pause
Vorwärts
Rückwärts
Geschwindigkeitsfaktor
Aktuelle Zeit
Gesamtzeit
Slider
Markierungen für Schlüsselereignisse
```

---

# 30. Data / Chart / Table

Data Card:

```text
Label
Symbol
Value
Unit
```

Diagramme:

```text
Helles Raster
Dezente Achsen
Einheitliche Semantikfarben
```

Tabellen:

```text
Kompakt
Zahlen rechtsbündig
Einheiten eindeutig
```

---

# 31. Agent Panel

Struktur:

```text
Header
Current Status
Conversation
Quick Actions
Input
```

Zustände sollten konkret sein:

```text
Aufgabe wird verstanden
Szene wird erstellt
Berechnung läuft
Verifikation läuft
Visualisierung wird angepasst
```

---

# 32. Question Space

Visueller Kern:

```text
Aufgabentext
Aufgabenbild
Gegebene Bedingungen
Gesuchte Größen
Visualisierung
Lösungsschritte
Verwandte Aufgaben
```

---

# 33. Aufgabentext

Anforderungen:

```text
Großzügiger Zeilenabstand
Klare Formeln
Korrekte Proportionen des Aufgabenbilds
Eindeutige Hierarchie der Aufgabennummern
```

---

# 34. KI-Analyse

Schritte verwenden:

```text
Nummerierte Punkte
Titel
Erklärung
Formel
```

---

# 35. Hero der Startseite

Der Hero soll echte physikalische Visualisierungen zeigen:

```text
Trajektorien
Felder
Versuchsaufbauten
Formeln als dezenter Hintergrund
```

und kein gewöhnliches Marketing-Banner sein.

---

# 36. Loading / Empty / Error

Loading:

```text
Skeleton + lokaler Progress
```

Empty:

```text
Leichte Illustration + Erklärung + CTA
```

Error:

```text
Eindeutige Fehlerkategorie + wiederherstellende Aktion
```

---

# 37. Animationen

Regulär:

```text
120–220ms
```

Seite:

```text
200–320ms
```

Kurve:

```css
cubic-bezier(.2,.8,.2,1)
```

## 37.1 Ebenen der Animation

Es gibt nur drei Animationsebenen, jede mit eindeutigen Tokens (siehe `chrome.ts`):

```text
Reaktion    --physics-motion-fast/base/slow (120–180ms)   Hover und Drücken von Buttons, Zeilen, Chips
Einblendung --physics-motion-entrance (460ms) + --physics-ease-emphasized
            Das Seitengerüst „baut sich um den Canvas herum auf“: Toolbar fällt von oben,
            Szenenbaum gleitet von links ein, Inspector von rechts,
            Canvas in der Mitte vergrößert sich atmend, Timeline und Datenpanel steigen von unten auf;
            Elemente in Listen werden über --physics-card-index / --physics-row-index gestaffelt
Physik-Ereignis  PhysicsCanvas effects (Kollision / Ein- und Austritt / Schockwelle an Schlüsselpunkten)
```

## 37.2 Animationen für Physik-Ereignisse

Überschreitet die Wiedergabeuhr ein `TimelineEvent`, löst der Canvas am Ereignisort eine Schockwelle aus (`CanvasEffect`):

```text
impact / plate-impact   Roter Doppelring + achtfacher Funkenflug (Kollision, Aufprall auf die Platte, Landung)
enter / exit            Gestrichelter breiter Ring in Feldfarbe (Eintritt in / Austritt aus dem Feldbereich)
launch / apex / generic Kleiner bernsteinfarbener Puls (Startpunkt, höchster Punkt)
```

Als Anker dienen nur zur Laufzeit bereits deklarierte Fakten: der KeyPoint mit gleicher id, sonst der bewegte Körper im aktuellen Frame; ein Sprung (seek) löst nichts aus. Implementierung siehe `physics/event-effects.ts`; die Animation selbst trägt keine physikalischen Größen.

## 37.3 Laufzustand

Läuft die Uhr (`data-physicsos-running="true"`): Der Ausführen-Button erhält einen äußeren Ring und atmet, der Canvas-Rahmen erhält eine blaue Einfassung, die Anzeige der aktuellen Zeit wird blau, und bewegte Körper erhalten einen weichen Schein.

## 37.4 Kleine Physik-Szene der Startseite

Rechts im Hero der Startseite befindet sich eine dekorative Welt elastischer Stöße (`HomePlayground`): Einige kleine Kugeln bewegen sich in einem reibungsfreien Kasten, stoßen elastisch mit den Wänden, untereinander und mit dem Körper des Kleinen Q (statischer kreisförmiger Kollisionskörper), hinterlassen Bahnspuren und lassen am Berührpunkt einen Ring aufblitzen; nähert sich der Zeiger, werden die Kugeln sanft weggeschoben. Es ist **kein** physikalisches Ergebnis, gelangt nicht in die `PhysicsScene` und zeigt keinerlei Zahlenwerte an.

Alle Einblend- und Schleifenanimationen werden unter `prefers-reduced-motion: reduce` abgeschaltet.

---

# 38. Icons

Einheitliches lineares Icon-System.

Physikspezifische Icons werden selbst gepflegt:

```text
Kraft
Magnetfeld
Elektrisches Feld
Versuchsgeräte
```

Emojis dürfen offizielle Icons nicht ersetzen.

---

# 39. 3D-Bildungsassets

Anforderungen:

```text
Hell
Fein
Realistisch, aber nicht übertrieben fotorealistisch
Einheitliches Material
Weiche Schatten
```

---

# 40. Responsives Verhalten

Schwerpunkte:

```text
1366×768
1440×900
1600×900
1920×1080
```

Der Workspace ist primär für den Desktop im Querformat ausgelegt.

---

# 41. 1366

Zuerst eingeklappt werden:

```text
Observation
Agent
Bottom Data
```

Der Canvas wird nicht bis zur Unbrauchbarkeit gestaucht.

---

# 42. 1920

Erlaubt, dass

```text
Inspector
Observation
Agent
```

gleichzeitig vorhanden sind.

---

# 43. Accessibility

Erforderlich:

```text
Keyboard
Focus
ARIA
Contrast
Reduced Motion
```

---

# 44. Zahlen und Formeln

Physikalische Daten:

```css
font-variant-numeric: tabular-nums;
```

Wissenschaftliche Notation:

```text
1.60 × 10⁻¹⁹
```

Für die Eingabe möglich:

```text
1.60e-19
```

---

# 45. Komponentenschichtung

```text
Primitive
Composite
Domain Component
Feature Component
```

Domain Component:

```text
QuantityInput
ObservableItem
PhysicsVectorLegend
Timeline
SceneTreeItem
FieldDirectionSelector
```

---

# 46. Token Source

Empfohlen:

```text
packages/ui/src/tokens/
```

Enthält:

```text
color
spacing
radius
shadow
typography
motion
physics semantic colors
```

---

# 47. Keine verstreuten Hex-Werte

Geschäftscode darf Farben nicht überall hartkodieren.

---

# 48. Abnahme der 1:1-Nachbildung

Schwerpunkte:

```text
Gesamtlayout
Maße
Relative Abstände
Visuelle Hierarchie
Hauptfarbe
Rahmen
Eckenradien
Schrift
Icons
Canvas-Proportionen
```

---

# 49. Visuelle Toleranz

Empfohlen:

```text
Abweichung bei Hauptmaßen <= 4px
Abweichung bei Hauptabständen <= 4px
Abweichung beim Eckenradius <= 2px
Deutliche Abweichung der Hauptfarbe nicht akzeptabel
```

---

# 50. Regeln für die UI-Entwicklung durch KI

Vorab zu lesen:

```text
UI/原型图
UI/组件图
06-UI-DESIGN-SYSTEM.md
07-UI-PAGE-SPECS.md
```

Verboten:

```text
Den Stil eigenmächtig wechseln
Großflächiges Violett
Standard-shadcn-Stile unverändert ausliefern
Mit Karten überfüllte Seiten
Emoji-Icons
```

---

# 51. UI Definition of Done

Erforderlich:

```text
Layout stimmt mit dem Prototyp überein
Tokens stimmen überein
Responsiv nutzbar
Focus nutzbar
Keine auffälligen Layoutsprünge
Keine Platzhalter-Assets
Keine Reste von Standard-Komponentenstilen
```

---

# 52. UI-Prinzip in einem Satz

> **Die UI von PhysicsOS muss sich wie ein präzises, helles, vertrauenswürdiges digitales wissenschaftliches Instrument anfühlen und nicht wie eine generische SaaS-Vorlage, in die Bildungsinhalte eingesetzt wurden.**
