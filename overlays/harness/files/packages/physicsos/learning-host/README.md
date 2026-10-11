# @deepseek-ai/dsh-learning-host

Host-Plugin für das persönliche Lernen in PhysicsOS. Es bedient `/physicsos/learning`
über die Storage-Domänen-Einheit `physicsos_learning`:

| Methode | Pfad                     | Ergebnis                                                              |
| ------- | ------------------------ | --------------------------------------------------------------------- |
| GET     | `/attempts?limit&cursor` | die Versuche der aufrufenden Person, neueste zuerst, cursor-paginiert |
| PUT     | `/attempts/:id`          | idempotentes unveränderliches Upsert eines Versuchs                   |
| GET     | `/scenes?limit&cursor`   | die gespeicherten Szenen der aufrufenden Person, neueste zuerst, cursor-paginiert |
| PUT     | `/scenes/:sceneId`       | idempotentes Upsert einer gespeicherten Szene                         |
| DELETE  | `/scenes/:sceneId`       | idempotentes Entfernen einer gespeicherten Szene                      |

Konto und Mandant stammen ausschließlich aus der Sitzung über den Service
`physicsosIdentity`. Kein Endpunkt akzeptiert `userKey` oder `schoolId` von der
Leitung, und es gibt keinen Administrator-Lesepfad für persönliche Zeilen. Hosts
werden vor auth-host deklariert, daher wird die Identität pro Anfrage verzögert
aufgelöst; fehlende Identität schlägt geschlossen mit `503` fehl, eine nicht
aufgelöste Sitzung mit `401`.

## Datenschutzgrenze

`physicsos_learning` ist getrennt von `physicsos_auth.learning_counts`. Persönliche
Versuche können Prompts und Antworten enthalten, während aggregierte Zähler
anonyme Wissensbeobachtungen pro Schule und Tag bleiben. Das Speichern eines
Versuchs hier aktualisiert das aggregierte Hauptbuch nicht.

## Client-Anbindung

Das Paket wird in dieser Aufgabe bewusst nicht in die gemeinsame Bundle-Verdrahtung
aufgenommen. Der Controller muss es in die Overlay-Pfadliste, die
Host-Projektverweise, die Root-Host-Befehle für typecheck/lint/test und die
ausgelieferte Cordis-Komposition eintragen. Der Client-Controller muss
`createLearningApi()` erzeugen, an `createLearningRecordController` und
`createPhysicsSurfaceController` übergeben und danach beide `sync()`-Methoden
aufrufen, sobald der authentifizierte Storage-Namespace existiert.

## Verifikation

- `tests/routes.spec.ts` deckt Authentifizierung, Mandanten-/Kontoisolation,
  Paginierung, Idempotenz, Szenen-Updates und Szenen-Löschung ab.
- `tests/composition.spec.ts` bootet die echte Kette aus Storage/Auth/Learning,
  belegt sitzungsübergreifendes Lesen und belegt, dass persönliche Speicherungen
  nicht in das aggregierte Dashboard gelangen.
- `tests/client-sync.spec.ts` deckt lokale Migration, Offline-First-Schreibvorgänge,
  Remote-Merge, Szenen-Tombstones, Request-Kodierung und Fehlercodes ab.

## Bekannte Einschränkungen und zurückgestellte Arbeit

- Die Client-Sync-Methoden sind bereitgestellt, aber die gemeinsame Verdrahtung in
  `client/index.ts` liegt beim Controller, daher ruft die ausgelieferte Anwendung sie
  erst auf, wenn diese Verdrahtung landet.
- Sync-Cursor sind opak, aber nicht signiert; sie grenzen nur die eigenen Zeilen der
  aufrufenden Person ein und können keinen Zugriff auf ein anderes Konto oder einen
  anderen Mandanten gewähren.
- Gespeicherte Szenen sind durch die Request-Größe und einen flachen strukturellen
  Vertrag begrenzt, nicht durch eine vollständige Validierung durch die
  Physik-Engine; das Labor bleibt der Validator der gerenderten Szene.
