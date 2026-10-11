# Umsetzungsplan für Harness-Sync, Admin-UI und Plugin-Plattform

> **Für agentische Worker:** ERFORDERLICHER SUB-SKILL: superpowers:subagent-driven-development (empfohlen) oder superpowers:executing-plans verwenden, um diesen Plan Aufgabe für Aufgabe umzusetzen. Die Schritte verwenden die Checkbox-Syntax (`- [ ]`) zur Nachverfolgung.

**Ziel:** Das gepinnte Harness-Release aktualisieren, die Administrator-UI vereinheitlichen und ein sicheres Plugin-Center in der ersten Version ausliefern, ohne die Produktarchitektur von PhysicsOS zu ersetzen.

**Architektur:** Das Root-Repository hält das Harness-Submodul gepinnt. Upgrades laufen isoliert, wenden die PhysicsOS-Overlays erneut an und bestehen das vollständige Verifikations-Gate vor der Beförderung. Code für Administrator-UI und Plugin-Katalog liegt in PhysicsOS-Overlay-Packages, damit Upstream-Änderungen ihn nicht überschreiben können.

**Technologie-Stack:** TypeScript, React, Cordis-Host-Plugins, PostgreSQL-Speicherdomänen, pnpm, Vitest, Docker Compose.

**Spezifikation:** `docs/superpowers/specs/2026-09-27-harness-sync-plugin-platform-design.md`

## Globale Randbedingungen

- Upgrade-Ziel: `dsh-v0.1.7-rc.2` (`477b4f420553e8a52c2fbccc464d7561b239c443`).
- Kontobesitz, Authentifizierung, Sitzungsisolation oder Sandbox-Grenzen nicht abschwächen.
- Keinen unsignierten oder unverifizierten Plugin-Code im Produktions-Container ausführen.
- Dateien in PhysicsOS-Besitz unter `overlays/harness/files` halten.
- Den Upstream-`master` nicht automatisch deployen.
- Das Produktions-Rollback-Image, ein Dateisystem-Backup des Sessions-Roots und ein Datenbank-Backup vor der Beförderung bereithalten (siehe Task 6 Step 4).

## Review-Schwerpunkte

- Eine einem Konto A gehörende Sitzung muss nach dem Upgrade für Konto B unsichtbar und unveränderlich bleiben.
- Ein Plugin-Package, das mit der gepinnten Harness-Version inkompatibel ist, muss deaktiviert bleiben.
- Ein fehlerhaftes oder unsigniertes Plugin-Manifest darf niemals einen ausführbaren Einstiegspunkt erreichen.
- Administrator-Tabs mit null Zeilen müssen dieselbe Geometrie und dieselben Steuerelemente für den Leerzustand verwenden.
- Ein Readiness-Fehler in der Produktion muss das vorherige Image verfügbar und den Dienst wiederherstellbar lassen.

---

### Task 1: Das kontrollierte Upgrade vorbereiten

**Dateien:**
- Ändern: Zeiger des Submoduls `vendor/deepseek-harness`
- Ändern: `overlays/harness/upstream-changes.patch`
- Ändern: `overlays/harness/files/**`

**Schnittstellen:**
- Konsumiert: das gepinnte Submodul bei `47f943859bef60e4160492346772ded9b24f765a`.
- Liefert: ein baubares Submodul bei `dsh-v0.1.7-rc.2` mit erneut angewendeten PhysicsOS-Overlays.

Status: **erledigt** auf diesem Branch. Submodul gepinnt auf `477b4f42` (`dsh-v0.1.7-rc.2`) in `0a2a6b1`; Build-Grenze in `37377a8`; Protokollmigration 0.1.7 und Gate-Reparatur in `94cc797`.

- [x] **Step 1: Die Rollback-Revision festhalten und im isolierten Worktree einen Upgrade-Branch anlegen.**

Ausführen: `git rev-parse HEAD && git submodule status`
Erwartet: Der aktuelle Root-Commit und der gepinnte Harness-Commit werden ausgegeben.

- [x] **Step 2: Im Submodul `dsh-v0.1.7-rc.2` auschecken und Overlay apply ausführen.**

Ausführen: `git -C vendor/deepseek-harness checkout dsh-v0.1.7-rc.2 && node scripts/overlay/harness-overlay.mjs apply`
Erwartet: Das Overlay meldet jeden PhysicsOS-Pfad und wendet den Kompatibilitäts-Patch an bzw. meldet dessen Zustand.

- [x] **Step 3: Änderungen an Upstream-Schnittstellen auflösen, ohne PhysicsOS-Contracts zu ändern.**

Kontoidentität, Namen der Speicherdomänen, Sitzungsbesitz, Provider-Routing des Modellpools und Namen der Physik-Tools stabil halten. Jede geänderte Upstream-Schnittstelle in `docs/13-DEPLOYMENT-OPERATIONS.md` festhalten.

- [x] **Step 4: Die fokussierte Kompatibilitäts-Suite ausführen.**

Ausführen: `pnpm run typecheck && pnpm run lint && pnpm run test:agent`
Erwartet: Alle Befehle enden mit `0`; kein Test zu Isolation, Modellpool oder Komposition schlägt fehl.

- [x] **Step 5: Den Submodul-Zeiger und die Kompatibilitätsänderungen committen.**

```bash
git add vendor/deepseek-harness overlays/harness docs/13-DEPLOYMENT-OPERATIONS.md
git commit -m "chore(harness): sync PhysicsOS on dsh 0.1.7 release"
```

### Task 2: Die Seitenhülle des Administrators vereinheitlichen

**Dateien:**
- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/AdminWorkspace.tsx`
- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/AdminWorkspace.module.css`
- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/Admin*Tab.tsx`
- Test: `overlays/harness/files/packages/client/ui-physicsos/tests/admin-shell.client.spec.tsx`

**Schnittstellen:**
- Konsumiert: die vorhandenen `AdminWorkspaceProps` und die rollenabhängige Tab-Liste.
- Liefert: gemeinsame Primitive `AdminPage`, `AdminToolbar`, `AdminStats`, `AdminCard`, `AdminEmpty` und `AdminTable`, exportiert aus einem Admin-lokalen Komponentenmodul.

Status: **erledigt** — Commit `6b8b1ae`; fokussierte Client-Tests 46/46.

- [x] **Step 1: Den fehlschlagenden Shell-Test schreiben.**

Prüfen, dass jeder sichtbare Tab einen Seitenkopf, eine Tabliste, einen einheitlichen Inhaltsbereich und keinen Tab-lokalen äußeren Rand-Wrapper rendert.

- [x] **Step 2: Den Test ausführen und bestätigen, dass er fehlschlägt.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/client/ui-physicsos/tests/admin-shell.client.spec.tsx`
Erwartet: FAIL, weil die gemeinsamen Primitive nicht existieren.

- [x] **Step 3: Die Primitive implementieren und jeden Administrator-Tab migrieren.**

Einen einzigen Container mit maximaler Breite, eine Abstandsskala 12/16/24, einen gemeinsamen Kartenradius, eine Toolbar-Form und eine Komponente für den Leerzustand verwenden. Das Verhalten der Host-API nicht ändern.

- [x] **Step 4: Die Client-Tests ausführen.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/client/ui-physicsos/tests`
Erwartet: Alle Tests bestehen.

- [x] **Step 5: Committen.**

```bash
git add overlays/harness/files/packages/client/ui-physicsos
git commit -m "feat(admin): unify administrator page layout"
```

### Task 3: Den offiziellen Plugin-Katalog hinzufügen

**Dateien:**
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/package.json`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/src/domain.ts`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/src/catalog.ts`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/src/index.ts`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/tests/catalog.spec.ts`
- Ändern: `scripts/overlay/harness-overlay.mjs`
- Ändern: `package.json`

**Schnittstellen:**
- Konsumiert: das gepinnte Harness-Package-Inventar und die Versionsmetadaten von `dsh-v0.1.7-rc.2`.
- Liefert: `PluginCenter.state()` und eine schreibgeschützte Zustandsroute `/physicsos/plugins` mit stabilen Plugin-IDs, Versionen, Kompatibilität, Quelle und Status.

Status: **erledigt** — Commit `05c554a` (mit Task 4); fokussierte plugin-center-Suite 21/21.

- [x] **Step 1: Den fehlschlagenden Katalog-Test schreiben.**

Testen, dass ein bekanntes offizielles Plugin vorhanden ist, dass eine inkompatible Version als `incompatible` markiert wird und dass kein Eintrag einen absoluten Dateisystempfad enthält.

- [x] **Step 2: Den Test ausführen und bestätigen, dass er fehlschlägt.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/physicsos/plugin-center/tests/catalog.spec.ts`
Erwartet: FAIL mit nicht aufgelöstem `plugin-center`.

- [x] **Step 3: Katalog und Host-Route implementieren.**

Nur den Aktivierungs-/Deaktivierungszustand des Administrators persistieren. Offizielle Packages bleiben aus dem gepinnten Image installiert; der Katalog lädt zur Laufzeit niemals ausführbaren Code herunter.

- [x] **Step 4: Fokussierte Tests ausführen.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/physicsos/plugin-center/tests`
Erwartet: Alle Tests bestehen.

- [x] **Step 5: Committen.**

```bash
git add overlays/harness/files/packages/physicsos/plugin-center scripts/overlay/harness-overlay.mjs package.json
git commit -m "feat(plugins): add official plugin catalog"
```

### Task 4: PhysicsOS-Plugin-Manifeste hinzufügen

**Dateien:**
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/src/manifest.ts`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/tests/manifest.spec.ts`
- Neu: `overlays/harness/files/packages/physicsos/plugin-center/plugins/manifest.json`

**Schnittstellen:**
- Konsumiert: Katalogeinträge aus Task 3.
- Liefert: validierte Manifest-Einträge mit `id`, `version`, `harnessRange`, `capabilities`, `entry`, `publisher` und `sha256`.

Status: **erledigt** — Commit `05c554a`; das ausgelieferte Manifest katalogisiert 12 vorinstallierte Plugins unter einer Ed25519-Signatur und mit SHA-256-Digests. Signaturschlüssel in `bc080ed` rotiert und erneut verifiziert.

- [x] **Step 1: Fehlschlagende Manifest-Tests schreiben.**

Ablehnen: unsignierte Einträge, unbekannte Fähigkeiten, doppelte IDs, Path Traversal, fehlenden Digest und einen Harness-Bereich, der die gepinnte Version ausschließt.

- [x] **Step 2: Die Tests ausführen und bestätigen, dass sie fehlschlagen.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/physicsos/plugin-center/tests/manifest.spec.ts`
Erwartet: FAIL, weil die Validierung fehlt.

- [x] **Step 3: Schema-Validierung und Digest-Verifikation implementieren.**

Keinen Pfad zum Herunterladen von Code hinzufügen. Die erste Version beschreibt nur vorinstallierte Packages und deren Fähigkeiten.

- [x] **Step 4: Tests ausführen.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/physicsos/plugin-center/tests/manifest.spec.ts`
Erwartet: PASS.

- [x] **Step 5: Committen.**

```bash
git add overlays/harness/files/packages/physicsos/plugin-center
git commit -m "feat(plugins): validate PhysicsOS plugin manifests"
```

### Task 5: Den Administrator-Tab des Plugin-Centers hinzufügen

**Dateien:**
- Neu: `overlays/harness/files/packages/client/ui-physicsos/src/client/PluginCenterApi.ts`
- Neu: `overlays/harness/files/packages/client/ui-physicsos/src/client/AdminPluginTab.tsx`
- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/AdminWorkspace.tsx`
- Ändern: `overlays/harness/files/packages/client/ui-physicsos/src/client/locales.ts`
- Test: `overlays/harness/files/packages/client/ui-physicsos/tests/admin-plugin.client.spec.tsx`

**Schnittstellen:**
- Konsumiert: den Katalogzustand `/physicsos/plugins` aus den Tasks 3 und 4.
- Liefert: einen Administrator-Tab `plugins` mit Quellfiltern offiziell/PhysicsOS, Kompatibilitätsstatus, Offenlegung der Fähigkeiten und Steuerelementen zum Aktivieren/Deaktivieren.

Status: **erledigt** — Commit `a4e0bf1`; fokussiert 6/6 und Admin-Regression 52/52.

- [x] **Step 1: Den fehlschlagenden UI-Test schreiben.**

Prüfen, dass offizielle und PhysicsOS-Gruppen gerendert werden, inkompatible Plugins nicht aktiviert werden können und Fähigkeitslabels vor der Aktivierung sichtbar sind.

- [x] **Step 2: Den Test ausführen und bestätigen, dass er fehlschlägt.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/client/ui-physicsos/tests/admin-plugin.client.spec.tsx`
Erwartet: FAIL, weil `AdminPluginTab` nicht existiert.

- [x] **Step 3: Den Tab implementieren und in die Administrator-Hülle einbinden.**

Der Tab ist nur für SUPER_ADMIN und folgt den gemeinsamen Admin-Primitiven aus Task 2.

- [x] **Step 4: Client-Tests ausführen.**

Ausführen: `pnpm -C vendor/deepseek-harness exec vitest run packages/client/ui-physicsos/tests`
Erwartet: Alle Tests bestehen.

- [x] **Step 5: Committen.**

```bash
git add overlays/harness/files/packages/client/ui-physicsos
git commit -m "feat(plugins): add administrator plugin center"
```

### Task 6: Vollständige Verifikation und Beförderung in die Produktion

**Dateien:**
- Ändern: `docs/13-DEPLOYMENT-OPERATIONS.md`
- Ändern: `docs/reports/ISOLATION-AUDIT.md`

**Schnittstellen:**
- Konsumiert: alle vorangehenden Tasks.
- Liefert: ein getestetes Produktions-Image und ausdrückliche Rollback-Nachweise.

Status: **in Arbeit — nicht erledigt.** Die vier statischen Gates bestehen bei `94cc797` (siehe `docs/reports/BETA-LAUNCH-REPORT.md` §10), aber der Lauf der echten Browser-Abnahme und jeder Produktionsschritt unten sind weiterhin offen.

- [ ] **Step 1: Die Root-Verifikation ausführen.**

Ausführen: `pnpm run typecheck && pnpm run lint && pnpm run test`
Erwartet: Alle Befehle enden mit `0`.

- [ ] **Step 2: Das Produktions-Image bauen und gegen das isolierte Compose-Projekt starten.**

Ausführen: `docker compose -p physicsos_upgrade build app && docker compose -p physicsos_upgrade up -d`
Erwartet: `app`, `postgres` und `redis` werden healthy, und `/readyz` meldet beide Abhängigkeiten `ok`.
Hinweis: Der Host hat von 78G etwa 23G frei, genug für einen Image-Neubau, aber nicht für viele. Veraltete Images vor dem Bauen aufräumen (`docker image prune`), damit der Neubau die Platte nicht erschöpft.

- [ ] **Step 3: Smoke-Tests zu Kontoisolation und Modellpool ausführen.**

Verifizieren: Verweigerung kontoübergreifender Sitzungen, Workspace-Besitz, Modell-Streaming, Failover und die erwartete öffentliche Modellidentität.

- [ ] **Step 4: Rollback-Image und Backups (Sessions-Root + PostgreSQL) vor der Beförderung festhalten.**

Das vorherige Image taggen; ein Backup des Sessions-Roots (`/var/lib/physicsos/sessions`) auf Dateisystemebene und ein `pg_dump` erstellen; bestätigen, dass beide lesbar sind – alles bevor das primäre Compose-Projekt umgeschaltet wird.

Warum das eine harte Voraussetzung ist: Das laufende Deployment speichert Session-Logs im ältesten On-Disk-Format (`{"type":"session","version":0,...}`). Harness 0.1.7 liefert die Migrationskette `v0 → v1 → v2 → v3 → v4` (`packages/session/session-format-v0-to-v1` … `-v3-to-v4`, wobei `catalog-migration.ts` für `version <= 3` den `historicalSessionFormatCatalog` auswählt), sodass 0.1.7 diese Logs an Ort und Stelle vorwärts migriert. Nach der Beförderung würde das vorherige Release (Rollback-Revision `14157e1`, Submodul gepinnt auf `47f9438`) bereits migrierte Daten lesen. Das Rollback-Image ist daher nur **zusammen mit** dem vor der Beförderung erstellten Backup von Sessions-Root + Datenbank ein echtes Rollback. Beim Rollback nicht an Ort und Stelle rückkonvertieren; aus dem Backup wiederherstellen.

- [ ] **Step 5: Das verifizierte Release befördern und committen.**

```bash
git add docs/13-DEPLOYMENT-OPERATIONS.md docs/reports/ISOLATION-AUDIT.md
git commit -m "docs: record synchronized Harness release verification"
```

---

## Zurückgestellte Punkte (festgehalten, nicht erledigt)

Dies sind bekannte offene Punkte, die von den Tasks 1–5 **nicht** abgeschlossen werden. Sie müssen sichtbar bleiben, bis ein späterer Task sie schließt.

- **Migration des veralteten `session.snapshotEvents()`.** In `overlays/harness/files/packages/physicsos/tool-physicsos/src/index.ts` (Zeile ~195) und `src/invariant.ts` (Zeile ~53) bleiben zwei Aufrufstellen des synchronen `session.snapshotEvents()` mit `// oxlint-disable-next-line typescript/no-deprecated -- ... migration deferred.` unterdrückt, statt auf die asynchrone Event-API von 0.1.7 migriert zu werden. Das ist eine zurückgestellte Migration, keine erledigte.
- **Keine automatische Upstream-Verfolgung.** PhysicsOS folgt dem Upstream-`master` nicht. Dieses Upgrade ist das einzige kontrollierte Fenster von `47f943859bef60e4160492346772ded9b24f765a` auf `dsh-v0.1.7-rc.2`. Danach ist nur ein Hinweis „neue Version verfügbar“ mit manuellem Upgrade-Pfad geplant; siehe `docs/ROADMAP.md`.
- **Die echte Browser-Abnahme ist noch nicht grün.** `pnpm run test:acceptance` (`node tests/acceptance/glass-surfaces.mjs`) besteht zum Zeitpunkt des Schreibens nicht; es ist ein Gate von Task 6 und liegt beim Web-Boot-Fix.
