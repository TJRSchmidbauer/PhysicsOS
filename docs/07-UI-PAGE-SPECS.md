# PhysicsOS UI-Seitenspezifikationen

> Datei: `docs/07-UI-PAGE-SPECS.md`  
> Dokumentzweck: Seitenweise 1:1-Nachbildung und Layout-Spezifikation von PhysicsOS  
> Abhängigkeit: `06-UI-DESIGN-SYSTEM.md`

---

# 1. Seitenübersicht

Aktueller Kern:

```text
01 Startseite
02 Physik-Labor-Arbeitsbereich
03 Aufgabenraum
04 Desktop Workspace
```

---

# 2. Web Shell

Top Navigation:

```text
Höhe 62px
Links/rechts Padding 28–36px
Logo-Bereich 160–180px
Nav-Abstand 34–44px
Suche 280–320px
```

Sicherer Seitenrand des Inhaltsbereichs links/rechts:

```text
24–32px
```

---

# 3. Startseite

Designbasis:

```text
1600×900
```

Hero:

```text
350–390px
Text links 42–48%
Visual rechts 52–58%
```

Haupttitel:

```text
36–44px
```

---

# 4. Doppelter Einstieg der Startseite

```text
2 Spalten
Abstand 18–24px
Höhe 170–190px
```

Innerhalb der Karte:

```text
Links 42%
Rechts 58%
```

---

# 5. Informationsbereich der Startseite

Empfohlen:

```text
Zuletzt fortgesetzt 24%
Beliebte Themen 46%
Zuletzt verwendete Dateien 30%
```

Unten:

```text
Lernpfad 66%
Fächerkategorien 34%
```

---

# 6. Physics Workspace

Struktur:

```text
Top Nav
Title / Action
Workspace Grid
Timeline
Bottom Data
```

---

# 7. Workspace Grid

Empfehlung bei 1600:

```text
Left Scene Panel 250px
Canvas 1fr
Inspector 275px
Observation 270px
Gap 12px
```

---

# 8. Left Panel

Enthält:

```text
Szene und Objekte
Ebenensteuerung
Szeneneinstellungen
```

Interner Scroll.

---

# 9. Canvas

Muss mindestens folgenden Anteil des Arbeitsbereichs behalten:

```text
45%+
```

---

# 10. Timeline

Höhe:

```text
64–78px
```

---

# 11. Bottom Data

Höhe:

```text
220–270px
```

Bei 1366 wird daraus Tabs.

---

# 12. Inspector

Tabs:

```text
Eigenschaften
Beobachtbare Größen
Daten
```

Gruppen:

```text
Teilcheneigenschaften
Anfangsbedingungen
Magnetfeldeinstellungen
```

---

# 13. Observation / Agent

Die rechte Spalte kann Folgendes enthalten:

```text
Beobachtbare Größen
Echtzeitdaten
KI-Assistent
```

Vertikal gestapelt.

---

# 14. Aufgabenraum

Drei Spalten:

```text
Verlauf
Aufgabe + Visualisierung
KI-Analyse
```

1600:

```text
Left 235px
Center 1fr
Right 390–420px
```

---

# 15. Linker Verlauf

Oben:

```text
Aufgabe hochladen
Neue Aufgabe
```

Darunter:

```text
Verlauf
Meine Aufgabensammlungen
```

---

# 16. Aufgabentext

Oben:

```text
Zurück
Titel
Tags
Favorit
Zum Fehlerheft hinzufügen
Mehr
```

Text:

```text
Aufgabenstellung
Aufgabenbild
Teilfragen
```

Darunter:

```text
Gegebene Bedingungen
Gesuchte Größen
```

---

# 17. Tabs

```text
Aufgabenverständnis
Visualisierung
Lösungsschritte
Variationsübungen
```

---

# 18. Visualisierungsbereich

```text
Physics Canvas
+
Szeneninformationen / Parameteranpassung
```

---

# 19. KI-Bereich rechts

```text
KI-Analyse
Fertigstellungsstatus
Lösungsschritte
Empfohlene verwandte Aufgaben
```

---

# 20. Untere Aktionen

```text
Vorherige Aufgabe
Nächste Aufgabe
Zum Fehlerheft hinzufügen
In der Physikwelt öffnen
```

---

# 21. Desktop Shell

```text
Windows Title Bar
App Toolbar
Left Sidebar
Tab Bar
Workspace
Bottom Status Bar
```

---

# 22. Desktop Sidebar

```text
Aufgeklappt 210px
Eingeklappt 64px
```

---

# 23. Desktop Toolbar

```text
48–52px
```

---

# 24. Desktop Workspace

```text
Object Tree 210px
Main Canvas flexibel
Property Panel 320px
```

Darunter:

```text
Data Table + Charts
```

---

# 25. Status Bar

```text
38–42px
```

Anzeige:

```text
Simulationszeit
Zeitschritt
Gitter
Genauigkeit
Engine Version
```

---

# 26. Breakpoints

```text
>=1800 XL
1440–1799 Large
1280–1439 Medium
<1280 Compact
```

---

# 27. Medium

Strategie:

```text
Observation / Agent als gemeinsamer Tab
Linke Spalte verschmälert
Bottom Data als Tabs
```

---

# 28. Compact

Verwendet:

```text
Drawer
Tabs
Floating Inspector
```

---

# 29. Seitenscroll

Startseite:

```text
Gesamte Seite
```

Workspace:

```text
Seite scrollt nicht, Panels scrollen unabhängig
```

Question:

```text
Center / Right scrollen unabhängig
```

---

# 30. Loading / Error

Jede Seite muss entwerfen:

```text
loading
empty
error
permission denied
```

---

# 31. Routen

```text
/
 /lab
 /lab/:sceneId
 /questions
 /questions/:questionId
 /history
 /resources
 /profile
```

---

# 32. Screenshot-Abnahme

Mindestens:

```text
1440×900
1600×900
1920×1080
```

---

# 33. Pixel Review

Prüfen:

```text
Navigationshöhe
Logo
Spaltenbreite
Panelhöhe
Canvas-Anteil
Schrift
CTA
Zustände
```

---

# 34. Seitennachbildung durch KI

Zuerst:

```text
Prototyp lesen
Layout zerlegen
Maße bestätigen
dann Komponenten schreiben
```

Es ist verboten, nach Gefühl eine „ähnliche Version“ zu bauen.

---

# 35. Definition of Done

```text
Layout stimmt überein
Maße stimmen überein
Alle Zustände vorhanden
Echte Funktionen angebunden
Keine Überläufe bei den Hauptauflösungen
Visuelle Abweichungen akzeptabel
```

---

# 36. Seitenspezifikation in einem Satz

> **Bei Seiten geht es nicht darum, „ähnlich auszusehen“, sondern den Prototyp als visuelle Faktenquelle zu nehmen und Layout, Proportionen, Hierarchie und Interaktionszustände ingenieurmäßig nachzubauen.**
