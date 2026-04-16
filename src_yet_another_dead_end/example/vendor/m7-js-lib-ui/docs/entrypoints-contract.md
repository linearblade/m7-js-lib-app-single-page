# Entrypoints Contract

[README](../README.md) -> [Usage TOC](./usage/TOC.md) -> [Entrypoints Contract](./entrypoints-contract.md)

This package has an explicit installer entrypoint model.

## `src/index.js`

- Default export: `install`
- Named export: `installUI` (alias of `install`)
- No side effects at import time.

## `src/install.js`

Primary integration API:

```js
install(lib, opts?) => {
  namespace: lib.ui,
  services: ["ui.collapse", "ui.tabs", "ui.dialog", "ui.proxy", "ui.navbar"]
}
```

Behavior:

- validates m7 dependencies through `lib.require`
- requires `primitive.dom.eventdelegator`
- starts delegator unless `installEventDelegator` is explicit no-intent
- optionally starts `primitive.dom.changeobserver`
- installs helper modules under `lib.ui`
- installs service class defs under `lib.ui.service`
- installs service instances in `lib.service`
- starts UI services unless `startUiServices` is explicit no-intent
- supports per-service constructor config via `opts.services.<name>`

## No Auto Entrypoint

This package intentionally does not expose `auto.js`.
