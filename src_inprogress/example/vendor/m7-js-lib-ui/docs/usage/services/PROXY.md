# Proxy Service

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md) -> [Proxy Service](./PROXY.md)

Service id: `ui.proxy`

## What This Is

`ui.proxy` is a delegated click-forwarding service.

It lets one control trigger another control declaratively through attributes.

This service is for forwarding only. It does not open/close modals directly and it does not toggle tabs.

## What It Does

On proxy trigger click it:

- reads selector text from `data-button-proxy`
- resolves target with `lib.dom.attempt(...)`
- optionally prevents default/stops propagation
- calls `target.click()`

## Default Selectors and Attributes

- trigger selector: `[data-button-proxy]`
- target selector attribute: `data-button-proxy`

Target resolution behavior:

- value is passed to `lib.dom.attempt(...)`
- CSS selector values work (for example `#save-btn`)
- bare id tokens also work when resolvable by `lib.dom.attempt` (for example `button-modal-user-org-insert`)

Default behavior flags:

- `preventDefault: true`
- `stopPropagation: true`

## Expected Classes (Default Config)

- no required classes
- `ui.proxy` routes by attribute selectors (`[data-button-proxy]`) and target resolution, not CSS class names

## Basic Use

```js
const proxy = lib.service.get("ui.proxy");
proxy.start();
```

## Markup Example

```html
<button id="proxy-button-modal-user-org-insert" data-button-proxy="button-modal-user-org-insert">
  + New Organization
</button>

<div hidden>
  <a id="button-modal-user-org-insert" data-dialog-trigger aria-controls="modal-user-org-insert">
    user-org-create
  </a>
</div>
```

In this pattern:

- visible button belongs to `ui.proxy`
- hidden anchor is the real dialog trigger handled by `ui.dialog`
- proxy cleanly decouples visible UI controls from trigger plumbing

## Programmatic Forwarding

```js
const proxy = lib.service.get("ui.proxy");
proxy.forward(document.querySelector("[data-button-proxy]"));
```

## Notes

- Self-targeted proxy selectors are ignored.
- If target cannot be resolved, the service logs a warning and no-ops.
- `start()`/`stop()` affect only this service's tagged routes.
