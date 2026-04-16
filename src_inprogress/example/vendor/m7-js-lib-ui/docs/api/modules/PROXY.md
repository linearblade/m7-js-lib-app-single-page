# ui.proxy API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.proxy](./PROXY.md)

Service id: `ui.proxy`

Class definition: `lib.ui.service.ProxyService`

## Purpose

`ui.proxy` allows delegated button/link click proxying.

Use it when multiple visible controls should forward to one real target control so open/submit behavior stays uniform.

## Surface

```js
{
  defaultConfig(): object,
  setConfig(conf: object): void,
  getConfig(): object,
  start(): boolean,
  stop(): boolean,
  isStarted(): boolean,
  init(): void,
  forward(trigger: Element | string, event?: Event | null): boolean
}
```

## How To Use

```js
const proxy = lib.service.get("ui.proxy");
proxy.start();
```

```html
<button id="proxy-button-modal-user-org-insert" data-button-proxy="button-modal-user-org-insert">
  + New Organization
</button>
<div hidden>
  <a id="button-modal-user-org-insert" data-dialog-trigger aria-controls="modal-user-org-insert">open</a>
</div>
```

Notes:

- `ui.proxy` forwards clicks only; it does not open dialogs itself.
- `data-button-proxy` value is resolved via `lib.dom.attempt(...)` and can be CSS selector or a bare id token.

## Expected Attributes (Default Config)

- `data-button-proxy` on trigger elements
- `data-button-proxy` value must resolve to a target element via `lib.dom.attempt(...)`
- target should be a clickable control (`button`, `a`, or any element with click handler)

## Expected Classes (Default Config)

- no required classes
