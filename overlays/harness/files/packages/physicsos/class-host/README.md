# @deepseek-ai/dsh-class-host

Host-Plugin von PhysicsOS für Klassen, Aufgaben, Abgaben, Durchsicht und
Abschluss. Ein Präfix (`/physicsos/class`) über dem gemeinsamen Service
`physicsosIdentity` und der Storage-Domäne `physicsos_class`.

| Oberfläche                                                 | Wer liest                                                                                                     | Wer schreibt                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `/classes`                                                 | Lernende sehen Klassen, denen sie angehören; Lehrkräfte sehen Klassen, die sie besitzen; Admins sehen den Mandanten | Lehrkraft und höher                               |
| `/classes/:id/members`                                     | Besitzer oder Schul-Admin                                                                                     | Besitzer oder Schul-Admin, über kanonischen `userKey` |
| `/classes/:id/assignments`                                 | Klassenmitglieder, Besitzer oder Admin                                                                        | Besitzer oder Schul-Admin                         |
| `/classes/:id/assignments/:id/submission`                  | die abgebende lernende Person                                                                                 | die abgebende lernende Person, sofern Mitglied    |
| `/classes/:id/assignments/:id/submissions`                 | Besitzer oder Schul-Admin                                                                                     | —                                                 |
| `/classes/:id/assignments/:id/submissions/:userKey/review` | —                                                                                                             | Besitzer oder Schul-Admin                         |
| `/classes/:id/dashboard`                                   | Besitzer oder Schul-Admin                                                                                     | —                                                 |

Der Identity-Service wird pro Anfrage aufgelöst, weil dieser Host geladen werden
kann, bevor `auth-host` ihn veröffentlicht. Jede Service-Methode prüft Mandant und
Besitz erneut; der Route-Guard ist eine äußere Tür, nicht die einzige Prüfung.

## Grenzen

- Request-Bodys: 32 KiB.
- Klassenname: 80 Zeichen; Beschreibung: 500 Zeichen.
- Mitgliedschaft: 500 Nutzer pro Klasse.
- Aufgaben: 500 pro Klasse; höchstens 200 auf einmal aufgelistet.
- Abgabetext: 16.000 Zeichen; Durchsichten höchstens 2.000 Zeichen.
- Listenlimits: Klassen 500, Mitglieder 500, Abgaben 500.

## Verifikation

- `tests/routes.spec.ts` deckt Rollendurchsetzung, Mandantenisolation, Mitgliedschaft,
  Ziel-/Fälligkeitsvalidierung, Abgabequittungen, Durchsicht, Dashboard-Zähler,
  Payload-Grenzen und Audit ab.
- `tests/composition.spec.ts` bootet die echte Cordis-Kette mit `class-host` vor
  `auth-host` und führt den vollständigen Workflow mit Live-Sitzungs-Cookies aus.
