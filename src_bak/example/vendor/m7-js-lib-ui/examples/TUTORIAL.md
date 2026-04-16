# Modal Example Tutorial

[README](../README.md) -> [Examples](./README.md) -> [Modal Tutorial](./TUTORIAL.md)

This tutorial walks through wiring and running the `modal.php` example with `m7-js-lib-ui`.

## What You Get

- click proxying (`ui.proxy`)
- modal open/close + backdrop + page lock (`ui.dialog`)
- tab panel switching inside the modal (`ui.tabs`)

## Files Used

- `examples/modal.php`
- `examples/m7-ui-services.minimal.css`

## 1) Install and Start UI Services

```js
import lib, { init } from "../m7-js-lib/src/index.js";
import installEventDelegator from "../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import installUI from "../m7-js-lib-ui/src/install.js";

init();
installEventDelegator(lib, { start: false });

installUI(lib, {
  installEventDelegator: true,
  startUiServices: true,
});
```

## 2) Include the Example Markup and CSS

Load the markup from `examples/modal.php` into your page.

Load `examples/m7-ui-services.minimal.css` so the default service classes behave correctly.

## 3) Verify Expected Behavior

1. Click `+ New Organization`.
2. Confirm the modal opens.
3. Switch between modal tabs (`Properties`, `Notes`).
4. Close using `X`, `Cancel`, or backdrop click.

If those actions work, proxy + dialog + tabs are wired correctly.

## 4) Attribute-to-Service Map

- `data-button-proxy` -> `ui.proxy`
- `data-dialog-trigger`, `data-dialog-close`, `aria-controls`, `aria-modal` -> `ui.dialog`
- `data-tab-trigger`, `role="tablist"`, `data-toggle-group`, `data-children` -> `ui.tabs`

## 5) Class Hooks Expected by Default Config

- dialog: `modal-hidden`, `modal-visible`, `modal-content`, `modal-container`, `modal-lock`, `modal-backdrop`, `#modal-backdrop`
- tabs/collapse: `tab-hidden`
- tabs: `selected`

## 6) Common Issues

- modal does not open:
  - ensure `ui.dialog` is started
  - ensure opener has `data-dialog-trigger` and valid `aria-controls`
- proxy click does nothing:
  - ensure `data-button-proxy` resolves to a real target via `lib.dom.attempt(...)`
- tabs do not switch:
  - ensure trigger has `aria-controls`
  - ensure target panel id exists and panel group is set via `data-toggle-group`
