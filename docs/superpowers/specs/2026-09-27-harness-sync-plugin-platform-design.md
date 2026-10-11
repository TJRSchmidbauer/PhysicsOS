# Entwurf für Harness-Sync und Plugin-Plattform von PhysicsOS

## Entscheidung

PhysicsOS führt ein einziges kontrolliertes Upgrade seines gevendorten DeepSeek Harness durch,
statt dem Upstream-`master` laufend zu folgen. Das Ziel ist das neueste
veröffentlichte Release-Tag `dsh-v0.1.7-rc.2`
(`477b4f420553e8a52c2fbccc464d7561b239c443`).

Nachdem das Upgrade validiert und veröffentlicht ist, pinnt PhysicsOS den daraus
entstandenen Upstream-Commit. Spätere Upgrades sind bewusste Wartungsfenster, keine
automatische Produktionssynchronisation.

## Erforderliche Ergebnisse

1. Das offizielle Harness-Release wird in den gevendorten Baum gemergt.
2. Die PhysicsOS-Overlays und Kompatibilitäts-Patches werden erneut angewendet.
3. Kontoisolation, Sitzungsbesitz, PostgreSQL-Persistenz, geteilter Redis-Zustand,
   Routing des Modellpools, Physik-Tools und der Web Client behalten ihre
   bestehenden Contracts.
4. Typecheck, Lint, Tests, Produktions-Builds und Container-Readiness bestehen
   vor der Beförderung.
5. Administrator-Tabs teilen sich ein System aus Seite, Toolbar, Karte, Formular, Tabelle und Leerzustand.
6. Das Plugin-Center listet unterstützte offizielle Plugins aus dem gepinnten Release
   und PhysicsOS-Plugins aus einem signierten Manifest auf.
7. Die Plugin-Installation ist per Allowlist, Signaturprüfung und
   Kompatibilitätsprüfung eingeschränkt und auf deklarierte Fähigkeiten beschränkt. Beliebiger
   hochgeladener Code wird niemals direkt im Produktions-Container ausgeführt.

## Architektur

### Kontrollierte Harness-Synchronisation

Das Root-Repository hält `vendor/deepseek-harness` als gepinntes Submodul.
`overlays/harness/files` ist die Quelle der PhysicsOS-eigenen Packages und Assets.
`overlays/harness/upstream-changes.patch` ist der Kompatibilitäts-Patch gegen
die gepinnte Revision.

Upgrades laufen in einem isolierten Worktree:

1. Das Ziel-Release im Submodul auschecken.
2. Das PhysicsOS-Overlay erneut anwenden.
3. Den Kompatibilitäts-Patch rebasen.
4. Schnittstellenänderungen auflösen, ohne Besitz, Authentifizierung oder
   Sandbox-Grenzen abzuschwächen.
5. Den vollständigen Workspace bauen und testen.
6. Den Submodul-Zeiger und die Root-seitigen Kompatibilitätsänderungen committen.

Die Produktion erhält nur ein getestetes Image. Das vorherige Image und das Datenbank-
Backup bleiben für das Rollback verfügbar.

### Konsistenz der Administrator-UI

Jeder Administrator-Tab teilt sich:

- einen Seitenkopf und eine horizontale Tab-Leiste;
- eine Zusammenfassungs-/Statistikzeile, sofern es Zähler gibt;
- eine Toolbar für Filter und Massenaktionen;
- einen Inhaltsbereich mit Tabelle, Kartenliste oder Leerzustand;
- gemeinsame Regeln für Abstände, Typografie, Fokus, Radius und Responsivität.

Die Tab-Komponenten bleiben einzeln testbar, definieren aber keine konkurrierenden
äußeren Seitenabstände und Kartensysteme mehr.

### Plugin-Center

Das Center hat zwei Kataloge:

- **Offizieller Katalog:** ein aus dem gepinnten Harness-Release erzeugtes Inventar,
  das Package-Identität, Version, Kompatibilität, Aktivierungszustand und
  PhysicsOS-Unterstützung auflistet.
- **PhysicsOS-Katalog:** ein signiertes Manifest für Plugins, die für PhysicsOS gebaut wurden
  und Version, Harness-Bereich, Fähigkeiten, Server-/Client-Einstiege,
  Integritäts-Digest und Herausgeber auflisten.

Die erste Version unterstützt vorinstallierte verifizierte Plugins und
Steuerelemente zum Aktivieren/Deaktivieren durch Administratoren. Neuer Code von Drittanbietern erfordert ein signiertes Manifest und
eine ausdrückliche Installation durch Administratoren. Plugins erhalten nur
deklarierte Fähigkeiten; uneingeschränkter Zugriff auf Dateisystem, Prozesse und Secrets wird
standardmäßig verweigert.

## Fehlerbehandlung

- Build- oder Testfehler beim Upgrade: den isolierten Worktree verwerfen; die Produktion
  bleibt unverändert.
- Readiness-Fehler in der Produktion: das vorherige Image wiederherstellen und den
  Migrationszustand der Datenbank bewahren.
- Fehler bei der Plugin-Integrität: Aktivierung verweigern und ein Audit-Ereignis schreiben.
- Fehler bei der Plugin-Kompatibilität: deaktiviert lassen und erforderliche gegenüber
  installierten Harness-Bereichen anzeigen.

## Verifikation

Die Verifikation umfasst Root-Typecheck, Lint, Tests für core/web/agent/deploy/desktop,
Host-Kompositionstests, Kontoisolation, Failover und Streaming des Modellpools,
PostgreSQL- und Redis-Readiness, den Produktions-Web-Build, Container-
Health und das Vorhandensein des Rollback-Images.

## Release-Richtlinie

Das erste öffentliche Release verwendet die synchronisierte Harness-Revision und die
PhysicsOS-Produkt-Shell. In der Produktion gibt es keinen automatischen Upstream-
Updater. Die Administrator-UI darf einen informativen Upgrade-Hinweis zeigen,
die Beförderung ist aber eine bewusste Handlung des Operators.
