# m7-js-lib-ui API Contract

[README](../../README.md) -> [API Index](./INDEX.md) -> [API Contract](./M7_JS_LIB_UI_API_CONTRACT.md)

This document defines integration-safe behavior for `m7-js-lib-ui` 1.0.

## Installer

```js
install(lib, opts?) => { namespace, services }
```

- `namespace` is `lib.ui`
- `services` is the installed UI service id list

## Required dependencies

`install(lib)` requires an m7 instance with:

- `lib.require.all`
- `lib.require.service`
- dependency paths resolvable by `lib.require.all("hash.get hash.set hash.to _env.root.document bool.no service.set service.get")`

## Service expectations

- must resolve `primitive.dom.eventdelegator`
- optionally resolves `primitive.dom.changeobserver`

## Option semantics

- `installEventDelegator`
  - started unless explicit no-intent (`lib.bool.no(value) === true`)
- `installChangeObserver`
  - started only when strictly `true`
- `startUiServices`
  - started unless explicit no-intent (`lib.bool.no(value) === true`)
- `services`
  - optional object keyed by `collapse`, `tabs`, `dialog`, `proxy`, `navbar`
  - each key is passed to that service constructor and merged by `setConfig(...)`

## Installed helper namespace paths

- `lib.ui.chain`
- `lib.ui.design.v1.setAlert`
- `lib.ui.toaster`

## Installed service class paths

- `lib.ui.service.CollapseService`
- `lib.ui.service.TabsService`
- `lib.ui.service.DialogService`
- `lib.ui.service.ProxyService`
- `lib.ui.service.NavbarService`

## Installed runtime service ids

- `ui.collapse`
- `ui.tabs`
- `ui.dialog`
- `ui.proxy`
- `ui.navbar`

## Non-goals

- no legacy `lib.site` backlinking
- no `auto.js` entrypoint
- no host/env bootstrap duplication
