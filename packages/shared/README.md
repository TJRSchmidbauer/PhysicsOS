# @physicsos/shared

## Purpose

Stabile Basistypen über Package-Grenzen hinweg in PhysicsOS: Brand ID, Zeit, Fehler.

## Responsibilities

- branded ID
- ISO-Zeit-Hilfen
- Einheitliche Fehlertypen (einschließlich des ausdrücklichen UnimplementedError)

## Public API

Siehe `src/index.ts`.

## Allowed Dependencies

Keine Laufzeitabhängigkeiten.

## Forbidden Dependencies

React, DOM, DeepSeek Harness, Tauri, jede Implementierung einer Physics Engine.
