# Gesamtes Upgrade der Erfahrung im Experimentmodul

Der Nutzer hat bestätigt, sich an der Experimenterfahrung von „Teilchen-Herr“ (粒子先生) zu orientieren, und „alles verschönern“ verlangt. Diese Runde umfasst das Experimentzentrum, den gemeinsamen Experiment-Arbeitsbereich und die Darstellung aller derzeitigen Experimentdomänen; die helle, präzise und zurückhaltende visuelle Sprache von PhysicsOS bleibt erhalten.

## Ziel und Grenzen

- Die Experimentgeräte sind die Hauptdarsteller, der Arbeitsbereich lässt nicht mehr mehrlagige Panels, schwach kontrastierenden Text und Leerflächen das Bild dominieren.
- Alle vorhandenen Experimentvorlagen, Physik-Engines, Verifikationsergebnisse, Szenenbefehle, die Faktenisolation der Aufgaben und die lokalen Lernverläufe bleiben erhalten.
- Es werden kein freier Verdrahtungs-Editor, keine Backend-Schnittstelle, kein Kontoablauf, keine Abhängigkeit, kein Solver und keine gefälschten physikalischen Größen hinzugefügt.
- Vorhandene uncommittete Änderungen gehören dem Nutzer. Der aktuelle Arbeitsbranch ist `codex/experiment-studio-polish`; nicht zurücksetzen, nicht aufräumen, nicht automatisch committen oder pushen.
- Die Quelle der Aufzeichnung ist `overlays/harness/files/packages/client/ui-physicsos/`; nur die tatsächlich geänderten Dateien werden nach `vendor/deepseek-harness/packages/client/ui-physicsos/` synchronisiert. Kein Overlay-Capture ausführen, das ganze Verzeichnisse löscht.

## Visuelles Design und Interaktion

1. Experimentzentrum: klarer Titel und Anzahl der Experimente, kompakte Suche und Kategorien, einheitliches Bildverhältnis, Fachsemantik und klare Hauptaktion; Empfehlungen, Fortsetzen von Experimenten und der Status „nicht unterstützt“ bleiben erhalten.
2. Gemeinsamer Arbeitsbereich: kompakte Toolbar, leichterer Szenenbaum und Inspector, vollständige Canvas-Grenze und klarerer Wiedergabebereich. Es wird eine reversible Ansicht „Experiment fokussieren“ geboten, die Steuerung und Daten nicht unerreichbar machen darf.
3. Datenrückmeldung: Experimente mit Kurven zeigen standardmäßig einen schlichten Diagrammbereich; statische Experimente ohne Kurven dürfen die Canvas-Fläche nicht mit einem leeren Diagramm verschwenden. Nach dem Wechsel des Experiments wird der Darstellungszustand für die neue Szene neu initialisiert.
4. Szene: Alle Domänen teilen klare Koordinaten, Schriftgrößen, Linienbreiten, Vektoren, Beschriftungen und Materialvorgaben; physikalisch korrekte Liniendiagramme und Feldlinien werden weiterhin im Code gezeichnet und nicht durch erzeugte Bilder ersetzt.
5. Schaltungsgeräte: Neue Assets mit einheitlicher Kameraposition, einheitlichem Maßstab und einheitlicher Beleuchtung; exakte Zahlen, Zustände und Verdrahtung werden weiterhin von Code und Engine getrieben. Alte Assets bleiben als Rückfall erhalten, Quellbilder werden nicht beliebig überschrieben.
6. Direkte Bedienung von Schaltungen: Der Schalter im Canvas lässt sich per Klick/Tastatur umschalten; der Schleifer ist per Maus, Touch und Tastatur einstellbar; dabei werden die vorhandenen Pfade `setChoice`/`editParameter` wiederverwendet und das ursprüngliche Verschieben von Bauteilen wird nicht versehentlich ausgelöst.
7. Geräteübergreifend: Desktop, schmaler Desktop und Mobil zeigen keinen horizontalen Seitenüberlauf, Toolbar-Schaltflächen bleiben erreichbar, Ebenen/Inspector sind einklappbar; der Fokus ist sichtbar, reduced-motion wird respektiert.

## Visuelle Randbedingungen

- Vorhandene semantische Tokens, CSS Modules und `clsx` verwenden; kein zweites globales Theme und keine Komponentenbibliothek hinzufügen.
- Grundton sind der vorhandene helle neutrale Hintergrund und das wissenschaftliche Blau, Fachfarben dienen nur der Erkennung und der physikalischen Semantik; keine gestapelten Dekorationsverläufe, verschwommenen Lichtflecken oder sinnlosen Leuchteffekte.
- Fließtext, Einheiten, Legenden und Interaktionshinweise müssen klar sein; erzeugte Assets dürfen keine dynamischen Zahlenwerte tragen.
- Neu erzeugte Bitmaps und Icons nur mit dem vom Nutzer angegebenen Dienst und `gpt-image-2.5-sunburst`; der Schlüssel wird nur bei der Anfrage injiziert und darf nicht in Quellcode, Dokumentation, Logs, Metadaten oder den Browser geschrieben werden.

## Abnahme

- Erstellen echter Vorlagen, Wechsel, Wiedergabe/Pause, Zeitachse, Datendiagramme, Eigenschaftsbearbeitung, Prüfung und Einstieg in den Bericht bleiben nutzbar.
- Das direkte Umschalten in Schaltungen muss die echten Engine-Messwerte ändern, die Grenzen des Schleifers sind 0..1, das Verschieben von Bauteilen darf den Schaltungszustand nicht umschalten.
- Komponentenregression über alle unterstützten Domänen; repräsentative Seiten für Mechanik, Elektrik, Magnetfeld, Schaltung, Optik, mechanische Wellen, Fluide, Wärmelehre, Akustik, Hebel und elektromagnetische Induktion werden im Browser geprüft.
- `pnpm test:web`, `pnpm typecheck:web`, `pnpm lint:web`, `pnpm build:web` ausführen und die echten Ergebnisse sowie vorhandene Warnungen festhalten.
- Repräsentative Desktop- und Mobil-Screenshots speichern; ein unabhängiges Code-Audit prüft Zustandszuordnung, Engine-Pfad, Asset-Laden und Auswirkungsbereich erneut.

## Vorhandene Baseline

2026-09-13, Node v26.0.0, pnpm 11.9.0; `pnpm test:web` bestand mit 32 Dateien und 473 Testfällen. Die vorhandene Ausgabe enthält Hinweise zu Vite tsconfig-paths und zu jsdom canvas getContext, die nicht durch diese Runde eingeführt wurden.
