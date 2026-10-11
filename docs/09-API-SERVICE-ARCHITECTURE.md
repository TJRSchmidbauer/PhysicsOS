# PhysicsOS API- und Service-Architektur

> Datei: `docs/09-API-SERVICE-ARCHITECTURE.md`  
> Dokumentzweck: Service-Grenzen, API-Spezifikation, serviceübergreifende Kommunikation und Laufzeitverantwortlichkeiten von PhysicsOS

---

# 1. Ziel

PhysicsOS teilt Services nicht der „Anzahl der Microservices“ zuliebe auf, sondern entwirft entwicklungsfähige Grenzen entlang klarer fachlicher Verantwortlichkeiten.

Anfangs kann es sein:

```text
Modularer Monolith
+
Eigenständige Agent- / Math- / Document-Runtime
```

Später wird je nach Last und Teamgröße getrennt deployt.

---

# 2. Logische Services

```text
API Service
Agent Service
Simulation Service
Math Service
Document Service
```

---

# 3. API Service

Empfohlen:

```text
Spring Boot
```

Zuständig für:

```text
Auth
User
Role
Permission
Curriculum
Question
Exam
Question Attempt
Learning
Teacher
Class
Assignment
Content
Analytics
Scene Metadata
Job Metadata
```

Nicht zuständig für:

```text
Agent Loop
Physics Solver
OCR/VLM
Symbolic Math
```

---

# 4. Agent Service

Zuständig für:

```text
PhysicsAgentRuntime
DeepSeek Harness Adapter
Session
Run
Roles
Tools
Skills
Prompt
Context
Compaction
Memory
Model Router
Streaming
Trace
```

---

# 5. Simulation Service

Zuständig für:

```text
Server-side Physics Simulation
Heavy Simulation
Batch Simulation
Simulation Job
Simulation Artifact
Physics Verification
```

Die im Browser lauffähige leichte Echtzeit-Physics-Engine muss nicht vollständig über den Server laufen.

---

# 6. Math Service

Empfohlen:

```text
Python + FastAPI
```

Zuständig für:

```text
Symbolic
Equation Solve
ODE
Matrix
Advanced Geometry
Root Finding
Optimization
Numerical
```

---

# 7. Document Service

Zuständig für:

```text
PDF
OCR
VLM
Page Analysis
Question Segmentation
Diagram Extraction
Document Job
```

---

# 8. Gateway

Einheitlich bereitgestellt:

```text
/api/v1/*
/agent/v1/*
/simulation/v1/*
/document/v1/*
/math/v1/*
```

---

# 9. Authentication

Alle Services teilen eine einheitliche Nutzeridentität.

Verboten:

```text
Agent Service legt eigene Konten an
Simulation Service legt eigene Konten an
```

---

# 10. Authorization Context

Serviceübergreifend weitergegeben:

```text
userId
roles
permission scopes
traceId
```

---

# 11. Trace

Empfohlener Header:

```text
X-Trace-Id
```

Wird vom Upstream keiner mitgeliefert, erzeugt ihn der Einstiegspunkt.

---

# 12. REST-Design

Empfohlen:

```text
GET    /api/v1/questions/{id}
POST   /api/v1/questions
PATCH  /api/v1/questions/{id}

GET    /api/v1/scenes/{id}
POST   /api/v1/scenes
```

Verboten ist willkürliche Benennung im RPC-Stil:

```text
/getQuestion
/createSceneNow
```

---

# 13. Agent API

Empfohlen:

```text
POST /agent/v1/sessions
GET  /agent/v1/sessions/{id}

POST /agent/v1/sessions/{id}/messages

POST /agent/v1/runs/{id}/cancel
POST /agent/v1/runs/{id}/resume

POST /agent/v1/sessions/{id}/fork
```

---

# 14. Agent Streaming

Bevorzugt:

```text
SSE
```

Ereignisse:

```text
run_started
status_changed
text_delta
tool_started
tool_completed
scene_changed
verification_completed
observation_changed
compaction_started
compaction_completed
run_completed
run_failed
```

---

# 15. Simulation API

```text
POST /simulation/v1/runs
GET  /simulation/v1/runs/{id}
POST /simulation/v1/runs/{id}/cancel
```

---

# 16. Document API

```text
POST /document/v1/jobs
GET  /document/v1/jobs/{id}
POST /document/v1/jobs/{id}/cancel
```

---

# 17. Math API

Empfohlen:

```text
POST /math/v1/symbolic/simplify
POST /math/v1/equations/solve
POST /math/v1/ode/solve
POST /math/v1/geometry/intersections
```

---

# 18. Request / Response DTO

Externe Schnittstellen legen nur DTOs offen.

Verboten ist, dass

```text
JPA Entity
ORM Model
Harness Internal Object
Engine Internal Object
```

direkt in der API erscheinen.

---

# 19. API Error

Einheitlich:

```json
{
  "error": {
    "code": "SCENE_REVISION_CONFLICT",
    "message": "Scene revision conflict.",
    "traceId": "trace_xxx",
    "details": {}
  }
}
```

---

# 20. HTTP Status

Vereinbarung:

```text
200 Query Success
201 Created
204 Success No Content
400 Invalid Request
401 Unauthenticated
403 Forbidden
404 Not Found
409 Conflict
422 Domain Validation Failed
429 Rate Limited
500 Internal
503 Dependency Unavailable
```

---

# 21. Validation

Am Einstieg mindestens:

```text
Schema Validation
Bean Validation / Zod / Pydantic
Permission
Domain Validation
```

---

# 22. Idempotency

Aufgabenartige Schnittstellen unterstützen:

```text
Idempotency-Key
```

Zum Beispiel:

```text
Document Parse
Simulation Run
Bulk Generate
```

---

# 23. Timeout

Alle serviceübergreifenden Anfragen müssen setzen:

```text
connect timeout
request timeout
job timeout
```

---

# 24. Retry

Automatischer Retry nur für:

```text
Vorübergehende Netzwerkfehler
Kurzzeitige 5xx
Wiederholbares Rate Limit
```

Kein Retry bei:

```text
INVALID_PARAMETER
SCENE_REVISION_CONFLICT
PHYSICS_CONSTRAINT_VIOLATION
```

Es sei denn, die obere Ebene hat einen ausdrücklichen Reparaturablauf.

---

# 25. Circuit Breaker

Für folgende Abhängigkeiten empfohlen:

```text
Model Provider
OCR / VLM Provider
Math Service
Object Storage
```

---

# 26. Rate Limit

Schwerpunkte:

```text
LLM
VLM
OCR
Document Parse
Simulation
Export
```

---

# 27. Queue

Langläufer:

```text
Exam Parse
Batch Question Parse
Long Simulation
Bulk Question Generation
```

kommen in die Queue.

---

# 28. Job Contract

Einheitlich:

```text
queued
running
needs_review
completed
failed
cancelled
```

---

# 29. WebSocket

Nur für wirklich bidirektionale Echtzeit:

```text
Mehrbenutzer-Scene-Collaboration
Hochfrequente Shared Scene Events
```

Für normales Agent Streaming wird SSE bevorzugt.

---

# 30. Service-to-Service Security

Später in Produktion einsetzbar:

```text
Service Token
mTLS
Network Policy
```

---

# 31. OpenAPI

Der API Service muss eine formale OpenAPI pflegen.

Clients erzeugen daraus einen typisierten Client.

---

# 32. Contract Source of Truth

Verboten ist:

```text
OpenAPI einmal
TS Type einmal
Java DTO einmal
```

die dauerhaft manuell getrennt gepflegt werden und auseinanderdriften.

Öffentliche Contracts sollten eine einzige Quelle oder einen automatischen Prüfmechanismus haben.

---

# 33. Client Generation

Web:

```text
packages/api-client
```

greift einheitlich auf das Backend zu.

Verstreute fetch-Aufrufe in Seiten sind verboten.

---

# 34. API Compatibility

Minor:

```text
backward compatible
```

Breaking:

```text
Neue API-Version
```

---

# 35. Health

Jeder Service:

```text
/health
/ready
```

---

# 36. Metrics

Mindestens:

```text
request count
latency
5xx
dependency latency
queue depth
active jobs
```

---

# 37. File Upload

Empfohlener Ablauf:

```text
Init Upload
↓
Signed Upload
↓
Object Storage
↓
Confirm
```

Große Dateien sollen nicht vollständig über den API Service laufen.

---

# 38. Download

Verwendet:

```text
Signed URL
```

oder kontrollierten Streaming-Download.

---

# 39. Grenze der Scene API

Der API Service verwaltet:

```text
Scene Metadata
Ownership
Share
Listing
```

Die Physics Runtime verwaltet:

```text
Scene State
Events
Revision
Snapshot
```

---

# 40. Agent ändert Scene

Verboten:

```text
Agent Service
↓
direkt UPDATE scene_json
```

Erforderlich:

```text
Agent Tool
↓
Physics Runtime
```

---

# 41. Simulation Input

Festzulegen sind:

```text
sceneId
sceneRevision
options
```

---

# 42. Document → Question

Der Document Service liefert Analyseergebnisse.

Die formale Question-Ressource wird von der Business API verwaltet.

---

# 43. Resource Owner

Jede Kernressource muss genau einen Owner haben.

Zum Beispiel:

```text
Question → API Service
Agent Session → Agent Service
Physics Event → Physics Runtime
Document Job → Document Service
```

---

# 44. Kein datenbankübergreifendes Lesen privater Tabellen

Nach der Aufteilung der Services gilt:

> Service A darf nicht direkt private Datenbanktabellen von Service B abfragen.

Zusammenarbeit erfolgt über:

```text
API
Event
Shared Contract
```

---

# 45. Async Event

Künftig einführbar:

```text
QuestionParsed
SceneCreated
AssignmentSubmitted
LearningStateUpdated
```

zur asynchronen Entkopplung.

---

# 46. Service Package

Jeder Service sollte enthalten:

```text
README
API
Domain
Application
Infrastructure
Tests
Dockerfile
```

---

# 47. Contract Test

Serviceübergreifend zu testen:

```text
request schema
response schema
errors
authorization
version compatibility
```

---

# 48. Graceful Degradation

Agent Service nicht verfügbar:

```text
Das bestehende Physics Lab bleibt manuell nutzbar
```

Document Service nicht verfügbar:

```text
Textaufgaben können weiterhin manuell erfasst werden
```

Physics Engine schlägt fehl:

```text
Darf keinen Erfolg vortäuschen
```

---

# 49. Definition of Done

Eine neue Schnittstelle muss besitzen:

```text
Contract
Validation
Auth
Permission
Error
Trace
Test
Metrics
Documentation
```

---

# 50. Service-Architektur in einem Satz

> **Die Service-Grenzen von PhysicsOS werden entlang von Domänenfakten und Berechnungsverantwortung gezogen, sodass Business, Agent, Physiksimulation, Mathematik und Dokumentverständnis unabhängig weiterentwickelt werden können, ohne sich über Datenbanken und implizite Zustände gegenseitig festzuketten.**
