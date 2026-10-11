# @physicsos/platform-bridge

## Purpose

Isoliert die Plattformfähigkeiten von Browser / künftigem Tauri. In Geschäftskomponenten darf `window.__TAURI__` nicht vorkommen.

## Responsibilities

- Contract `PlatformBridge`
- `BrowserPlatformBridge`: Browser-Dateien / Zwischenablage / Benachrichtigungen / localStorage
- `TauriPlatformBridge`: Native Geräte-Fingerprint, App-Datenverzeichnis, Update-Prüfung und -Installation

Die Tauri-Bridge akzeptiert nur das von der Shell injizierte `window.__TAURI__.core.invoke` oder einen Testclient,
in einem gewöhnlichen Browser schlägt sie mit `TAURI_UNAVAILABLE` fail-closed fehl. Die Gerätekennung wird auf der Rust-Seite aus dem Rohwert gelesen,
mit einem persistenten Salt versehen und gehasht; Update-Prüfung und -Installation akzeptieren nur exakt passende Kandidatenversionen, die Signaturprüfung des Artefakts
übernimmt `tauri-plugin-updater` mit dem in die App einkompilierten öffentlichen Schlüssel.

## Allowed Dependencies

`@physicsos/shared`

## Forbidden Dependencies

DeepSeek Harness, Physics Engine, React-Geschäftsseiten.
