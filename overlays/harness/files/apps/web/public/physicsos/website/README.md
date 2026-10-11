# PhysicsOS-Produktwebsite

Werbeseite nach außen. Eine statische Website, die **keinen Build-Schritt benötigt**:
Das Verzeichnis direkt öffnen genügt, und es lässt sich auch komplett auf beliebiges
statisches Hosting kopieren.

```
overlays/harness/files/apps/web/public/physicsos/website/
├── index.html          Einzelseite (hero / Physikgebiete / Simulations-Engine / Aufgabenraum / Vertrauenswürdigkeit / CTA)
├── site.css            Design-Tokens und alle Stile
├── avatar-160.jpg      GitHub-Avatar des Autors (160×160, von Navigation und Fußbereich gemeinsam genutzt)
├── lib/flow-field.js   Hero-Hintergrund: WebGL2-Strömungsfeld-Shader
└── shots/              Echte Produkt-Screenshots (JPEG, per Skript erzeugt)
```

Auf der Website werden zwei GitHub-Adressen referenziert:

- **Persönliche Startseite** `https://github.com/122-syf-wcy` – Avatar in der Kopfleiste
  + GitHub-Mark-Badge, Adressblock mit Avatar im Fußbereich.
- **Projekt-Repository** `https://github.com/122-syf-wcy/PhysicsOS` – Adressblock mit
  Repo-Icon im Fußbereich, Schaltfläche „Quellcode ansehen“ im CTA.

Die beiden Blöcke im Fußbereich sind in `.footer-ghs` gefasst und werden gemeinsam
umgebrochen. Bei einem neuen Avatar genügt es, `avatar-160.jpg` zu ersetzen; der Pfad
ist im Markup fest eingetragen.

## Lokale Vorschau

```bash
cd overlays/harness/files/apps/web/public/physicsos/website
python3 -m http.server 4192 --bind 127.0.0.1
```

Dann `http://127.0.0.1:4192/` öffnen.

## Woher die Screenshot-Materialien stammen

In `shots/` liegen keine Designentwürfe, sondern Screenshots der **echten
Produktoberfläche**, die ein Skript gegen den echten Dienst erzeugt:

```bash
pnpm dev                                        # in einem weiteren Terminal, Port 3080
node scripts/design/website-shots.mjs           # Ausgabe nach shots/*.jpg
```

Das Skript öffnet nacheinander die Startseite, das Experimentzentrum, die Labore von
vier Gebieten und den Aufgabenraum und macht jeweils einen Screenshot. Die beiden
Einführungsdialoge beim ersten Start (Beta-Hinweis → API-Key-Einführung) schließt es
selbst.

**Die Zahlen im Material ergeben sich aus Messungen**: „43 lauffähige
Experimentvorlagen“ und „80 integrierte Aufgaben“ im Hero entsprechen dem Titel der
Experimentbibliothek und der tatsächlichen Aufgabenzahl; es gibt insgesamt 45
Experimentvorlagen, davon sind Zyklotron und stehende Saitenwelle als „demnächst
unterstützt“ markiert, deshalb steht nach außen nur 43. Nach Produktänderungen das
Skript erneut ausführen, die Bilder werden aktualisiert, die Zahlen auf der Seite
müssen aber von Hand überprüft werden.

## Hintergrundeffekt

`lib/flow-field.js` ist ein WebGL2-Fragment-Shader: Value Noise verzerrt zunächst die
Linienkoordinaten per Domain Warp, danach folgt ein Swirl-Fold, und schließlich mischt
ein Schachbrett-Mixer 5 Farbstopps zu einem langsam driftenden Lichtband. Das ist eine
Umsetzung derselben Art wie der Hero-Hintergrund der DeepSeek-Websites, mit für
PhysicsOS neu abgestimmten Parametern.

**Zum Leuchten bringen es die letzten drei Schritte des Shaders, nicht das Rauschen
selbst**:

1. **Selbstleuchtender Glow (Bloom)**: Anhand eines Helligkeitsschwellwerts wird dem
   Feld der helle Anteil noch einmal aufgelegt,
   `col += (col*.85 + warm) * bloom * strength`. Ohne diesen Schritt ist das Feld nur
   eine Farbverlaufskarte.
2. **Virtuelle Lichtquelle**: warmer Core (`exp(-ld²·4.5)`) + kalter Halo
   (`exp(-ld·1.8)`), folgt dem Zeiger mit Easing (`lightFollow`); ruht der Zeiger,
   fällt der Einfluss auf null.
3. **Vignette**: `vignette: 0.38` dunkelt die vier Ecken ab und sammelt den Blick auf
   dem Lichtband in der Mitte.

Die Palette muss **an beiden Enden Ankerpunkte nahe Schwarz haben, das helle Ende nahe
Weiß** (`#03060d` / `#16355f` / `#3570bd` / `#e9f0fc` / `#03060d`). Das helle Ende ist
eine „Lichtquelle“, keine „Farbe“; sobald es durch eine gesättigte Farbe ersetzt oder
der Bloom entfernt wird, fällt der gesamte Effekt zu einem Nebel zusammen. Die
mittlere Marineblau-Stufe muss **hell** genug sein, damit der Himmelseindruck lesbar
wird.

Degradierung und Energiesparen:

- `prefers-reduced-motion: reduce`: nur ein statisches Bild wird gezeichnet, keine
  rAF-Schleife.
- Außerhalb des Viewports (IntersectionObserver) oder bei verborgenem Tab: das Zeichnen
  pausiert.
- Das Geräte-Pixelverhältnis wird auf 1,5 begrenzt, damit sich die Füllrate auf
  Retina-Bildschirmen nicht verdoppelt.
- Ohne WebGL2: Das Canvas wird automatisch ausgeblendet, der CSS-Verlauf des Hero trägt
  das Layout allein.

Dem Canvas **kein CSS-Blur hinzufügen** – die Bandstruktur selbst ist der Effekt, ein
Weichzeichner macht daraus wieder ein Hintergrundbild.

## Visuelle Grundstimmung

Die Website ist insgesamt **dunkel** gehalten (`#0a0a0a` Papierfläche + weiße Schrift)
und baugleich zur DeepSeek-Harness-Website: Die Seite ist nahezu schwarz, der Hero ist
ein durchgehendes leuchtendes blaues Feld, und die Produktoberfläche erscheint als
„beleuchtetes Fenster“ auf dunklem Grund.

Das Designsystem des Produkts selbst (`docs/06-UI-DESIGN-SYSTEM.md`) ist hell und
nebelweiß; hier wird es gewissermaßen umgekehrt eingesetzt: Markenblau und Bernstein
bleiben erhalten, die nebelweiße Papierfläche wird zum Bilderrahmen der Screenshots.
Beim Ändern von Stilen bevorzugt die Tokens am Anfang von `site.css` wiederverwenden
und keine neuen Farben erfinden.
