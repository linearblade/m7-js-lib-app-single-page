# About m7-js-lib-ui

[README](../README.md) -> [Usage TOC](./usage/TOC.md) -> [API Index](./api/INDEX.md)

`m7-js-lib-ui` is a UI-focused extension library for `m7-js-lib`.

It provides behavior modules that operate on declarative DOM patterns (alerts, tabs, collapse panels, dialogs) while relying on m7 core primitives for dependency checks, object/path access, intent parsing, and delegated event wiring.

## Core Model

1. `m7-js-lib` initializes first.
2. Required primitives (event delegator) are installed into the m7 service registry.
3. `m7-js-lib-ui` installs helper modules under `lib.ui`.
4. `m7-js-lib-ui` installs UI service classes under `lib.ui.service`.
5. Runtime instances are installed into `lib.service` (`ui.collapse`, `ui.tabs`, `ui.dialog`, `ui.proxy`).

## Design Intent

- Keep helper behavior grouped under `lib.ui`.
- Keep runtime behavior service-first through `lib.service`.
- Reuse m7 core and primitive services instead of re-implementing host/env/service logic.
- Keep installer behavior explicit.

## See Also

- [Introduction](./usage/INTRODUCTION.md)
- [Installation](./usage/INSTALLATION.md)
- [API Index](./api/INDEX.md)
- [Entrypoints Contract](./entrypoints-contract.md)
