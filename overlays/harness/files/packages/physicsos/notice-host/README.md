# @deepseek-ai/dsh-notice-host

Host-Plugin für Feedback und Ankündigungen in PhysicsOS (反馈与公告). Ein Präfix (`/physicsos/notice`), zwei Laufrichtungen:

| Oberfläche | Wer liest | Wer schreibt |
| --- | --- | --- |
| `/feedback` | Lernende sehen ihre EIGENEN Zeilen; Lehrkräfte und höher sehen die Mandanten-Warteschlange | jedes angemeldete Konto |
| `/feedback/:id/reply` | — | Lehrkraft und höher, nur eigener Mandant |
| `/announcements` | jedes angemeldete Konto, Mandanten- und Plattform-Geltungsbereich | Schul-Admin und höher |
| `/platform-notice` | jedes angemeldete Konto, zusammen mit der Bestätigung dieses Kontos | nur Plattform-`SUPER_ADMIN` |
| `/platform-notice/ack` | — | jedes angemeldete Konto, nur aktuelle Version |

Die Identität stammt aus der Sitzung über den Service `physicsosIdentity`, den `auth-host` veröffentlicht. Dieser Host wird im ausgelieferten Patch VOR `auth-host` deklariert, daher wird der Service pro Anfrage statt beim Laden aufgelöst – der Fehlermodus wird von `tests/composition.spec.ts` abgedeckt, das die echte Kette bootet und prüft, dass das Gate bei einer Live-Sitzung antwortet.

Das Lesen von Feedback wird zeilenweise statt türweise gefiltert: Eine lernende Person, die den Listen-Endpunkt aufruft, ist ein legitimer Bildschirm („Was habe ich gesendet?“); eine Antwort mit 403 würde ihn kaputt machen, nur um eine Regel darüber durchzusetzen, WELCHE Zeilen sichtbar sind.

## Konfiguration

Keine Konfigurationsschlüssel. Das Plugin injiziert `webServer` und `storageDomain` und öffnet die Domäne `physicsos_notice`.

## Daten

`feedback` hält eine Zeile pro Meldung (serverseitig aufgelöster Autorenschlüssel, optionaler Kontakt und Seitenkontext, Status und die zugeordnete Antwort der betreuenden Person). `announcements` hält eine Zeile pro Mitteilung; `schoolId: null` bedeutet plattformweit, und eine zurückgezogene Zeile bleibt in der Tabelle, verlässt aber die ausgelieferte Liste.

`platform_notice` ist die Singleton-Mitteilung zum internen Test von PhysicsOS. Jedes Speichern durch einen Admin erhöht ihre Version um eins, und `platform_notice_acks` speichert eine Bestätigung pro Konto. Die Bestätigung liegt bewusst hier und nicht in den `ui-onboarding`-Einstellungen: Das Einstellungsdokument des Harness gilt für die gesamte Bereitstellung, und seine Verwendung würde es einem Konto erlauben, die Mitteilung für alle zu verwerfen.

## Verifikation

- `tests/routes.spec.ts` – die Regeln über einem echten HTTP-Server mit gestubbter Identität (18 Fälle: Rollenuntergrenzen, der Filter auf eigene Zeilen für Lernende, mandantenübergreifende Ablehnung, Zurückziehen und die Audit-Spur).
- `tests/platform-notice.spec.ts` – Standardtext, Schreibzugriffe nur für SUPER_ADMIN, Grenzen, kontobezogene Bestätigung, Audit-Zusammenfassung und monoton wachsende gleichzeitige Speicherungen.
- `tests/composition.spec.ts` – die echte Cordis-Kette, die belegt, dass das Gate scharf geschaltet und nicht bloß vorhanden ist.

## Modellerfahrung

Keine, da das Paket Browser-REST-Oberflächen bedient und nichts modellseitig Sichtbares registriert.

#### KV-Cache-Wirkung

Keine; dieses Paket stellt keine Provider-Anfrage zusammen und sendet auch keine.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Antworten sind nur per Pull: Eine lernende Person sieht die Antwort einer betreuenden Person beim nächsten Lesen von `/feedback`; nichts schiebt sie aktiv nach – keine Ungelesen-Markierung, keine Benachrichtigung.
- Feedback und Ankündigungen enthalten nur Klartext; es gibt keine Anhänge und kein gerendertes Markup.
- Zurückgezogene Ankündigungen behalten ihre Zeilen (`retiredAt`); es gibt kein hartes Löschen.
