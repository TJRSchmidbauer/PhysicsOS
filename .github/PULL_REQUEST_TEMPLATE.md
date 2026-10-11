## Beschreibung der Änderung

<!-- Was macht dieser PR? Warum so? Bitte Links zu zugehörigen Issues / ADRs angeben. -->

- Zugehöriges Issue:
- Umfang der Änderung:

## Testnachweis

<!-- Tatsächliche Befehle und Ergebnisse einfügen; nicht ausgeführte Punkte mit Begründung angeben, nichts leer lassen. -->

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

- Zusätzliche Gates (je nach Änderungsumfang ankreuzen und Ergebnis einfügen):
  - [ ] `pnpm run test:desktop`
  - [ ] `pnpm run test:acceptance`
  - [ ] Sonstiges:

## Screenshots / Aufzeichnung

<!-- Pflicht, wenn sich Oberfläche oder interaktives Verhalten ändern; ohne Oberflächenänderung „nicht betroffen“ eintragen. -->

| Vorher | Nachher |
| ------ | ------- |
|        |         |

## Checkliste

- [ ] Die Änderung tut nur eine Sache, ohne unbeteiligte Refactorings oder Formatierungen
- [ ] Die Quelle der Wahrheit wurde in `overlays/harness/files/**` (oder `packages/**`, `apps/desktop/**`) geändert, generierte Artefakte unter `vendor/deepseek-harness/**` wurden nicht von Hand angepasst
- [ ] Keine Schlüssel, `.env*`, Zertifikate oder privaten Schlüssel committet
- [ ] Neu hinzugefügter Drittanbieter-Code / -Daten sind in `NOTICE.md` oder im PR mit Herkunft und Lizenz erläutert
- [ ] Unfertige Fähigkeiten sind wahrheitsgemäß als „geplant“ gekennzeichnet, kein Platzhalter-Erfolgszustand gibt sich als fertig aus
- [ ] [`CONTRIBUTING.md`](../CONTRIBUTING.md) und [`CODE_OF_CONDUCT.md`](../CODE_OF_CONDUCT.md) wurden gelesen und werden eingehalten
