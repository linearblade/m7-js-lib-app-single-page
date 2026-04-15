# ui.dialog API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.dialog](./DIALOG.md)

Service id: `ui.dialog`

Class definition: `lib.ui.service.DialogService`

## Purpose

`ui.dialog` manages delegated dialog open/close lifecycle, modal backdrop behavior, and page lock handling.

Use it to centralize modal behavior behind attribute-based triggers.

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
  triggerOpen(trigger: Element | string): void,
  triggerClose(trigger: Element | string): void,
  isModalOpen(target?: Element | string | null): Element[] | null,
  close(target?: Element | string | null, silent?: boolean): boolean
}
```

## How To Use

```js
const dialog = lib.service.get("ui.dialog");

dialog.start();
dialog.triggerOpen(document.querySelector("[data-dialog-trigger]"));
dialog.close();
```

## Required Markup

- Open trigger: `[data-dialog-trigger]` + `aria-controls`
- Close trigger: `[data-dialog-close]` + `aria-controls` (optional for close-all)
- Dialog target: matching element id
- Modal behavior: `aria-modal="true"`

## Expected Attributes (Default Config)

- `data-dialog-trigger` on open controls
- `aria-controls="<dialog-id>"` on open controls (required for target resolution)
- `data-dialog-close` on close controls
- `aria-controls="<dialog-id>"` on close controls (optional; empty means close all open dialogs)
- `aria-modal="true"` on dialog node for modal/backdrop behavior
- `data-backdrop-close` optional on opener trigger to route backdrop click to a specific control
- `data-toggle-on` / `data-toggle-off` optional chain hooks on trigger/target/parent nodes
- `data-dialog-parent` optional parent scope used for chain attribute inheritance

## Expected Classes (Default Config)

- `modal-hidden`
- `modal-visible`
- `modal-content`
- `modal-container`
- `modal-lock` (on `html` and `body`)
- `modal-backdrop` (inside `#modal-backdrop`)
- `#modal-backdrop` container id

`modal.php`-style flow:

- proxy forwards to hidden open trigger
- open/close trigger routing is owned by `ui.dialog`
- modal backdrop and `modal-lock` lifecycle are owned by `ui.dialog`
- tab switching inside dialog body is handled by `ui.tabs`
