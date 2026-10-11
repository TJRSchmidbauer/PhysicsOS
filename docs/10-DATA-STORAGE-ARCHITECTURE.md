# PhysicsOS Daten- und Speicherarchitektur

> Datei: `docs/10-DATA-STORAGE-ARCHITECTURE.md`  
> Dokumentzweck: Faktenquellen, Persistenz, Cache, Events, Objektspeicher und Suchsystem von PhysicsOS

---

# 1. Oberstes Prinzip

Unterschiedliche Daten müssen klare Faktenquellen haben.

Verboten:

```text
Eine Datenbank speichert jede Semantik
Ein Vector Store gilt für alles als Memory
Redis hält die einzigen dauerhaften Daten
Harness Session ersetzt Physics Event
```

---

# 2. Gesamtspeicher

```text
PostgreSQL
Object Storage
Redis
Vector Store
Physics Event Store
Harness Session Store
```

---

# 3. Drei Faktenquellen

```text
Business DB
→ Geschäftsfakten

Physics Event Store
→ Fakten der physikalischen Welt

Harness Session Store
→ Fakten der Agent-Ausführung
```

---

# 4. PostgreSQL

Speichert:

```text
User
Role
Permission
Question
Exam
QuestionAttempt
LearningState
Curriculum
Class
Assignment
Teacher Content
Scene Metadata
Skill Metadata
Job Metadata
Audit Metadata
```

---

# 5. Physics Event Store

Logisch getrennt definiert.

Erfasst:

```text
scene_id
revision
event_id
type
payload
actor
trace
occurred_at
```

Events sind unveränderlich.

---

# 6. Scene Snapshot

Metadata kann in PostgreSQL liegen.

Große Snapshots:

```text
Object Storage
```

---

# 7. Object Storage

Speichert:

```text
PDF
Image
Question Image
Scene Asset
Scene Snapshot
Simulation Artifact
Export
Report
Generated Asset
Temporary Normalized File
```

---

# 8. Redis

Nur verwendet für:

```text
Cache
Rate Limit
Lock
Queue
Temporary Runtime State
Simulation Cache
Short-lived Session Data
```

---

# 9. Vector Store

Verwendet für:

```text
Curriculum Retrieval
Question Retrieval
Knowledge Retrieval
Teacher Material Retrieval
```

Speichert nicht den realen Zustand von PhysicsScene.

---

# 10. Harness Session Store

Speichert:

```text
Agent model-visible session events
Tool Calls
Tool Results
Conversation
Compaction Events
```

## 10.1 Session-Format und Migration (0.1.7, gemessen mit `67e8444`)

Ergebnis der **schreibgeschützten** Prüfung eines Produktions-Backups (34/34 Produktions-Session-Logs):

- Alle liegen im Disk-Format **`format version: 0`** vor; 0.1.7 liest das alte Format über `historicalSessionFormatCatalog` (`vendor/deepseek-harness/packages/session/session-format-catalog`).
- Die Migration ist **inkrementell**: Das Lesen schreibt **0** Dateien um; nur ein erzwungenes Schreiben erzeugt eine neue `session.v4.jsonl.zstd`, die ursprüngliche `session.jsonl.zstd` bleibt **Byte für Byte unverändert**.
- v0→v4 bewahrt die Zähler für message / turn / step (die chunk-Zeilen von v0 werden in v4 zu `assistant/attempt` zusammengefasst).

**Konsequenz (muss klar gesagt werden)**: Die Vorversion kann den Inhalt vor der Migration weiterhin lesen, aber nach dem Upgrade landen Schreibvorgänge in der v4-Datei, die die alte Version ignoriert – daher sind ein **On-Box-Sessions-Snapshot + `pg_dump` vor dem Upgrade** eine echte Voraussetzung, keine Formalität. Die Backup-Schritte auf der Deployment-Seite stehen in `docs/13-DEPLOYMENT-OPERATIONS.md`.

---

# 11. ID

Einheitliche, stabile IDs.

Empfohlen, projektweit eine Variante zu wählen:

```text
UUIDv7
```

oder:

```text
ULID
```

Nicht durcheinander.

---

# 12. Zeit

Datenbank einheitlich:

```text
UTC
```

---

# 13. User

Empfohlene Felder:

```text
id
display_name
role
status
created_at
updated_at
```

---

# 14. Question

```text
id
revision
stem
source_type
difficulty
grade
knowledge_tags
status
created_at
updated_at
```

---

# 15. Exam

```text
id
title
source_document_id
question_count
status
```

---

# 16. QuestionAttempt

```text
id
user_id
question_id
question_revision
answer
score
result
submitted_at
```

---

# 17. LearningState

Muss versioniert sein.

Empfohlen zu behalten:

```text
revision
updated_at
```

Wichtige Updates können zusätzlich Event / Evidence hinterlassen.

---

# 18. SceneMetadata

```text
scene_id
owner_id
title
current_revision
latest_snapshot_id
source_question_id
visibility
created_at
updated_at
```

---

# 19. PhysicsEvent-Index

Mindestens:

```text
(scene_id, revision) UNIQUE
(scene_id, occurred_at)
trace_id
tool_call_id
event_type
```

---

# 20. Snapshot Metadata

```text
snapshot_id
scene_id
revision
object_key
sha256
schema_version
created_at
```

---

# 21. SimulationArtifact

```text
simulation_id
scene_id
scene_revision
engine_id
engine_version
status
artifact_key
sha256
created_at
```

---

# 22. Document

```text
document_id
owner_id
object_key
sha256
content_type
size
page_count
status
created_at
```

---

# 23. Parse Job

```text
job_id
document_id
status
progress
parser_version
error_code
created_at
updated_at
```

---

# 24. Skill Metadata

```text
skill_id
version
domain
path
status
hash
```

---

# 25. Audit

Erfasst:

```text
actor
action
resource_type
resource_id
result
trace_id
timestamp
```

---

# 26. Soft Delete

Geschäftsressourcen können verwenden:

```text
deleted_at
```

Physics Events werden jedoch nicht weich gelöscht, die Ereignishistorie bleibt erhalten.

---

# 27. Hard Delete

Löscht ein Nutzer aktiv seine persönlichen Daten:

```text
business record
object file
derived cache
vector chunks
```

werden gemäß Richtlinie bereinigt.

---

# 28. Hash

Für Dateien empfohlen:

```text
SHA-256
```

Verwendet für:

```text
integrity
dedup
artifact verification
```

---

# 29. Dedup

Möglich:

```text
Deduplizierung per Hash innerhalb desselben Nutzers
```

Nutzerübergreifende Deduplizierung muss den Datenschutz berücksichtigen.

---

# 30. Encryption

Transport:

```text
TLS
```

Sensible ruhende Daten werden je nach Deployment-Umgebung verschlüsselt.

---

# 31. Backup

Muss abdecken:

```text
PostgreSQL
Physics Event Store
Harness Session Store
Object Storage metadata
Critical Assets
```

> Vor dem Upgrade auf 0.1.7 sind **ein On-Box-Snapshot des Harness Session Store + `pg_dump` harte Voraussetzung**: Die alte Release kann die nach dem Upgrade geschriebene `session.v4.jsonl.zstd` nicht lesen (siehe §10.1). Nur eines von beiden zu sichern genügt für ein Rollback nicht.

---

# 32. Restore

Bei der Wiederherstellung prüfen:

```text
hash
schemaVersion
event revision continuity
foreign references
```

---

# 33. Retention

Definiert den Lebenszyklus von:

```text
Temporary OCR Asset
Temporary Render
Simulation Chunk
Old Job Log
Application Log
```

---

# 34. Vector Chunk

Muss tragen:

```text
source_id
source_version
chunk_id
embedding_model
created_at
```

---

# 35. Re-embedding

Nach einem Upgrade des Embedding-Modells wird eine Neuerzeugung unterstützt.

Alte Embeddings können schrittweise ausgemustert werden.

---

# 36. Scene gehört nicht in die Vector Truth

PhysicsScene ist eine strukturierte Welt und sollte nicht in ein Embedding umgewandelt und als einzige Scene-Quelle verwendet werden.

---

# 37. Cache Key

Enthält mindestens die Version:

```text
scene:{id}:{revision}
question:{id}:{revision}
skill:{id}:{version}
simulation:{hash}
```

---

# 38. Cache Invalidation

Nach einer Revisionsänderung müssen die zugehörigen Caches ungültig werden.

---

# 39. Migration

Für die Datenbank empfohlen:

```text
Flyway
```

oder eine gleichwertige Lösung.

---

# 40. Contract Migration

Zu unterscheiden:

```text
Database Schema Migration
Domain Contract Migration
```

Beides ist nicht dasselbe.

---

# 41. Große Simulationsdaten

Nicht vollständig in PostgreSQL-Zeilen stopfen.

Verwenden:

```text
chunk
compression
object storage
metadata index
```

---

# 42. JSONB

Geeignet für:

```text
metadata
extensible config
```

Nicht alle Kernbeziehungen sollten in JSONB versteckt werden.

---

# 43. Suche

Normale Filterung:

```text
PostgreSQL
```

Volltext:

```text
Search Index if needed
```

Semantisch:

```text
Vector Store
```

---

# 44. Consistency

PhysicsScene:

```text
revision immutable
```

Business Resource:

```text
optimistic locking
```

---

# 45. Event Compaction

Speicheroptimierung ist erlaubt, darf aber nicht beschädigen:

```text
semantic replay
audit
revision
```

---

# 46. Snapshot Policy

Empfohlen, in Kombination zu erzeugen nach:

```text
event count
time
manual save
branch
```

---

# 47. Simulation Retention

Gewöhnliche temporäre Simulationen dürfen nur die jüngsten oder eine Zusammenfassung behalten.

Ergebnisse, die vom Nutzer gespeichert, mit einer Aufgabe verknüpft oder von Lehrkräften veröffentlicht wurden, sollten persistiert werden.

---

# 48. Privacy

Learning State und Fehlerprotokolle von Schülern:

```text
Minimale Zugriffsrechte
```

---

# 49. Observability

Überwachen:

```text
DB latency
slow query
cache hit
queue depth
object latency
event append latency
```

---

# 50. Data Definition of Done

Ein neues Datenmodell muss festlegen:

```text
Owner
Schema
Index
Migration
Retention
Backup
Privacy
Test
```

---

# 51. Datenarchitektur in einem Satz

> **PhysicsOS baut keinen chaotischen „KI-Datenpool“ auf, sondern gibt Geschäftsfakten, Fakten der physikalischen Welt, Agent-Laufzeitfakten und Retrieval-Daten jeweils eigene, wiederherstellbare und nachverfolgbare Speichergrenzen.**
