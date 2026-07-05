# Aegis Alpha X Kernel 4.0 — Milestone 01 Runtime Migration

This package is meant to be extracted over your Kernel 3.2 project.

## What this milestone adds

- Browser-compatible Kernel 4 runtime
- EventBus4
- SharedState4
- EngineManager4
- Scheduler4
- RuntimeHealth4
- BaseEngine contract
- LegacyEngineAdapter
- Kernel4 browser bridge
- Non-breaking UI diagnostics panel

## Important

This milestone does not remove Kernel 3.2.
It runs Kernel 4 beside Kernel 3.2 so the app remains functional while migration continues.

## How to run

1. Extract this ZIP.
2. Open the extracted folder in VS Code.
3. Run Live Server on `index.html`, or run:

```bash
python -m http.server 8000
```

4. Open:

```text
http://localhost:8000
```

5. You should see the normal app plus a `Kernel 4 Runtime` status panel.

## Next milestone

Milestone 02 will migrate existing Kernel 3.2 engines to BaseEngine + LegacyEngineAdapter so they can be scheduled and monitored by Kernel 4.
