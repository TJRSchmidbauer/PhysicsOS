# Umsetzungsplan zur Gesamtverschönerung des Experimentmoduls

> Ausführungsanforderung: superpowers:subagent-driven-development verwenden, Aufgaben einzeln umsetzen und reviewen; der Controller bearbeitet zugleich die unabhängige Asset-Erzeugung und visuelle Prüfung, ändert aber nicht parallel gemeinsam genutzte Frontend-Dateien.

**Ziel:** Das einheitliche visuelle Upgrade aller Experimentseiten sowie die bestätigte direkte Bedienung von Schaltungen abschließen.

**Architektur:** PhysicsScene → Engine → Verifier → Observation → PhysicsCanvas bleibt erhalten. Geändert werden die gemeinsame Darstellung und die Anpassung der Nutzergesten; Physiklösungen werden nicht in React berechnet.

**Technologie-Stack:** React 18, TypeScript, CSS Modules, SVG/Canvas, Vitest, vorhandenes Harness-Plugin.

**Entwurf:** `docs/superpowers/specs/2026-09-13-experiment-studio-polish-design.md`

## Globale Randbedingungen

- Bestehende uncommittete Änderungen des Nutzers erhalten; nicht zurücksetzen, nicht aufräumen, nicht automatisch committen oder pushen.
- Nur das offizielle Experiment-Plugin, die zugehörigen Tests und die in der Aufgabe benannten Assets ändern; das veraltete `apps/web` im Wurzelverzeichnis nicht ändern.
- Vorhandene semantische Tokens, CSS Modules und `clsx` verwenden, keine Abhängigkeit und kein zweites globales Theme hinzufügen.
- Keinen freien Verdrahtungs-Editor, keine Backend-Schnittstelle, keinen Kontoablauf und keinen Solver hinzufügen; die UI darf keine physikalischen Messwerte erfinden.
- Für Nutzer sichtbare Texte laufen über das vorhandene chinesisch-englische Locale, Standard Chinesisch; Code-Benennung und Code-Kommentare auf Englisch.
- Bei Verhaltensänderungen zuerst fehlschlagende Testfälle schreiben, den roten Zustand bestätigen, dann implementieren und den grünen Zustand bestätigen; bei reinem Styling per Browserbild prüfen.
- Nur die in dieser Aufgabe geänderten Dateien an die entsprechende Stelle in vendor synchronisieren; kein overlay capture ausführen, keine unbeteiligten Dateien überschreiben.
- Alle erzeugten Assets nur mit dem angegebenen Dienst und `gpt-image-2.5-sunburst` erstellen, Schlüssel dürfen nicht protokolliert werden.

### Task 1: Experimentzentrum und gemeinsamer Arbeitsbereich

**Dateien:**

- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/ExperimentPicker.tsx`, `ExperimentPicker.module.css`, `LabEmptyState.tsx`, `LabEmptyState.module.css`.
- Ändern: im selben Verzeichnis `PhysicsWorkspace.tsx`, `LabWorkspace.module.css`, `workspace-parts.tsx`, `locales.ts`.
- Eine kleine lokale Arbeitsbereichskomponente darf neu angelegt werden, damit die Hauptdatei nicht weiter anschwillt; es darf kein neuer öffentlicher Plugin-Export hinzukommen.
- Tests: `overlays/harness/files/packages/client/ui-physicsos/tests/overlay.client.spec.tsx`, `renderer-decoupling.client.spec.tsx`; neue Verhaltenstests kommen in `workspace-presentation.client.spec.tsx`.

**Schnittstelle:** Konsumiert das vorhandene `WorkspaceSnapshot`, `runtime.getSnapshot()`, `t`, Szenenvorlagen und Experimentliste; Engine und Szenendaten werden nicht geändert. Der Fokusmodus ist lokaler Komponentenzustand und darf nicht in der Szene persistiert werden.

- [ ] Alle zu ändernden Dateien lesen, CSS-Klassen, Komponenten-Props und Locale-Verweise durchsuchen und den offiziellen Einstieg abgleichen.
- [ ] Für neu hinzukommendes Darstellungsverhalten echte PhysicsSurface-Komponententests schreiben: Der Fokusmodus lässt sich betreten und verlassen und die Werkzeuge bleiben nutzbar; Szenen mit Kurven zeigen den Datenbereich standardmäßig; Szenen ohne Kurven klappen keinen leeren Diagrammbereich standardmäßig auf. Dafür das Einhängemuster `createPhysicsSurfaceController()` + `PhysicsSurface` aus `circuit.client.spec.tsx` verwenden.
- [ ] Die Kern-Assertions der Testfälle verwenden echte zugängliche Steuerelemente und Daten und prüfen keine CSS-Strings. Zum Beispiel:

```tsx
fireEvent.click(screen.getByRole('button', { name: '专注实验' }))
expect(screen.getByRole('button', { name: '退出专注' })).toBeVisible()
fireEvent.click(screen.getByRole('button', { name: '退出专注' }))
expect(screen.getByRole('button', { name: '专注实验' })).toBeVisible()
```

- [ ] Die fokussierten Tests ausführen, bestätigen, dass sie fehlschlagen, weil das neue Verhalten noch nicht existiert, und die Fehlerausgabe festhalten.
- [ ] Ein kompaktes, klares Experimentzentrum mit einheitlichem Kartenbildverhältnis und eindeutigen Zuständen umsetzen; Filter, Empfehlungen, Fortsetzen und das Verhalten nicht unterstützter Vorlagen bleiben erhalten.
- [ ] Hierarchie, Abstände, Typografie, reversiblen Fokusmodus und die Anfangsstrategie des Datenbereichs des gemeinsamen Arbeitsbereichs umsetzen. Die Initialisierung von `dataOpen` richtet sich nach `snapshot.charts.length > 0`; statische Experimente behalten die Möglichkeit, den Datenbereich manuell zu öffnen.
- [ ] Zeilenumbruch der mobilen Toolbar, Panel-Drawer, lange Titel und Tastaturfokus prüfen; unerreichbare Steuerelemente dürfen nicht durch verstecktes Overflow kaschiert werden.
- [ ] Geänderte Dateien synchronisieren und die fokussierten Tests, `pnpm typecheck:web`, `pnpm lint:web` ausführen. Änderungsliste, Rot-/Grün-Nachweise und verbleibende Risiken berichten und zum unabhängigen Review geben.

### Task 2: Canvas und Gerätedarstellung aller Domänen

**Dateien:**

- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/physics/PhysicsCanvas.module.css`, `primitives.module.css`, `renderers.module.css`.
- Bei Bedarf im selben Verzeichnis `PhysicsCanvas.tsx`, `renderer-registry.tsx`, `circuit-renderer.tsx`, die `*-renderer.tsx` der einzelnen Domänen ändern; an jeder Stelle nur die Darstellung anpassen, das Physikmodell darf nicht geändert werden.
- Neue Assets in `parts3d-catalog.ts` und `overlays/harness/files/apps/web/public/physicsos/parts3d/manifest.json` einbinden. Der Controller bereitet die Ressourcen vor, der umsetzende Agent aktualisiert nur Konsumenten und Rendering-Anker.
- Tests: die vorhandenen `electric-point-charge-visual.client.spec.tsx`, `electric-region-visual.client.spec.tsx`, `circuit.client.spec.tsx` sowie die Tests der einzelnen Domänen.

**Schnittstelle:** Die physikalische Semantik von `RendererProps` und `SceneVisualModel` bleibt erhalten; werden reine Darstellungs-Props ergänzt, sind alle tatsächlichen Aufrufer zu aktualisieren. Die neuen Bildpfade stammen aus der vom Controller gelieferten echten Asset-Liste, es werden keine nicht existierenden Pfade vorab erfunden.

- [ ] Eine Checkliste über alle registrierten Domänen anlegen: Mechanik/Stoß, Elektrik, Magnetfeld/zusammengesetzte Felder, Schaltung, elektromagnetische Induktion, Optik, mechanische Wellen, Akustik, Fluide, Wärmelehre, Hebel.
- [ ] Koordinatenhintergrund, Hierarchie von Achsen/Raster, Linienbreite, Beschriftung sowie Lesbarkeit von Zahlen und Einheiten vereinheitlichen. Die Farben der Schlüsselvektoren und die Semantik der Ebenenschalter bleiben erhalten.
- [ ] Proportionen und Positionierung der Geräte optimieren, damit Objekte erkennbar sind und Messwerte nicht kollidieren; physikalische Geometrie, Verdrahtung und Diagramme werden weiterhin von den vorhandenen echten Daten gespeist.
- [ ] Die neuen Gerätebilder einbinden, alte Bilder und Vektor-Fallbacks bleiben erhalten. Bildgröße und sichtbaren Bereich messen und die Konsistenz von catalog/manifest aktualisieren; Geräte mit fester Kameraposition nicht drehen, um eine andere Kameraposition vorzutäuschen.
- [ ] Für das Verhalten bei Ressourcenausfall und die Positionen von Anschlüssen/Beschriftungen zuerst echte Komponententests ergänzen und dann implementieren. Für statisches CSS keine quellcodeabgleichenden Tests hinzufügen.
- [ ] Die zugehörigen Domänentests fokussiert ausführen und typecheck/lint prüfen; Lesbarkeit der Szenen und unveränderte Datenfakten unabhängig reviewen.

### Task 3: Direkte Bedienung von Schaltungen und Regression

**Dateien:**

- Ändern: `PhysicsWorkspace.tsx`, `physics/PhysicsCanvas.tsx`, `physics/renderer-registry.tsx`, `physics/circuit-renderer.tsx`, bei Bedarf ein kleines neues `physics/circuit-interactions.ts`.
- Ändern: `physics/renderers.module.css`, `locales.ts` und `tests/circuit.client.spec.tsx`.
- `physics/workspace-runtime.ts` oder `circuit-workspace-runtime.ts` nur ändern, wenn für die Gestenanbindung der UI wirklich nötig; die Engine im Wurzelverzeichnis `packages/` darf nicht geändert werden.

**Schnittstelle:** Es werden `runtime.setChoice('switch:sw', 'open' | 'closed')` und `runtime.editParameter()` mit der echten Parameter-ID des Schleifers weiterverwendet. Der Bedienkanal ist vom vorhandenen `ComponentDragChannel` getrennt, um versehentliches Auslösen beim Verschieben von Bauteilen zu vermeiden; die Weitergabe erfolgt über reine Daten/Callbacks, es darf kein neuer globaler Store registriert werden.

- [ ] Alle Referenzen auf pointer von Bauteilen, `setChoice`, Parameter-ID des Schleifers und Frame-Updates durchsuchen.
- [ ] Neue Testfälle zuerst rot: Ein Klick auf den Schalter im Canvas macht den Strom null und der Zustand im Inspector ist konsistent; per Tastatur umschaltbar; wird der Schleifer in die Mitte/an die Endpunkte geschoben, ändern sich die echten Messwerte; das Ziehen eines ganzen Bauteils schaltet den Schalter nicht; pointercancel hinterlässt keine Geste.
- [ ] Unabhängige Erwartung mit dem vorhandenen `createSeriesCircuitScene()`: Geschlossen 6V/(10Ω+20Ω)=0,2A; geöffnet 0; erneut geschlossen wieder 0,2A.
- [ ] Unabhängige Erwartung mit `createRheostatCircuitScene()`: Bei Schleifer 0/0,5/1 gilt 6V/(10Ω+20Ω×Position)=0,6/0,3/0,2A. Nach dem Umschalten auf manuelle Position darf die ursprüngliche Durchlaufwiedergabe das Ergebnis der Geste nicht stillschweigend überschreiben.
- [ ] Zuerst diese Tests ausführen und das Fehlschlagen bestätigen, dann zugängliche Bedienbereiche für Schalter und Schleifer implementieren; Bauteil-Ziehen, Fokus, Touch- und Tastaturpfad bleiben erhalten.
- [ ] Dateien synchronisieren, `pnpm test:web`, `pnpm typecheck:web`, `pnpm lint:web`, `pnpm build:web` ausführen und alle Warnungen und Fehlschläge festhalten.
- [ ] Der Controller prüft mit einem echten Browser in Desktop-, schmaler Desktop- und Handy-Größe alle Domänen, Filter, Diagramme, den Fokusmodus und die Schaltungsgesten; Screenshots und Logs aufbewahren.
- [ ] Abschließend code-audit und unabhängige Gesamtabnahme durchführen, den Lieferbericht aktualisieren, nicht automatisch committen/pushen.
