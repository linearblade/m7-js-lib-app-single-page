# Dialog Service

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md) -> [Dialog Service](./DIALOG.md)

Service id: `ui.dialog`

## What This Is

`ui.dialog` is a delegated dialog/modal lifecycle service.

It centralizes trigger routing, modal backdrop behavior, and lock-state handling.

This service owns modal visibility and modal page lock. It does not forward button clicks (`ui.proxy`) and it does not switch tab panels (`ui.tabs`).

## What It Does

On open trigger it:

- reads `aria-controls` to resolve dialog target
- runs open chain hooks
- opens dialog target (and modal backdrop if `aria-modal="true"`)

On close trigger it:

- runs close chain hooks
- closes target from `aria-controls`
- if `aria-controls` is empty, closes all open dialog nodes

For modal dialogs it also:

- creates/reuses backdrop container
- applies page lock class
- stores/restores scroll position on open/close

## Default Selectors and Attributes

- open trigger selector: `[data-dialog-trigger]`
- close trigger selector: `[data-dialog-close]`
- parent selector: `[data-dialog-parent]`
- target id source: `aria-controls`
- modal mode flag: `aria-modal`
- chain on attribute: `data-toggle-on`
- chain off attribute: `data-toggle-off`
- optional backdrop-close indirection: `data-backdrop-close`

Default classes/ids used:

- hidden class: `modal-hidden`
- visible class: `modal-visible`
- lock class: `modal-lock`
- dialog content marker class: `modal-content`
- container class hint: `modal-container`
- backdrop container id: `modal-backdrop`
- backdrop inner class: `modal-backdrop`

## Expected Classes (Default Config)

- `modal-hidden`: used to hide dialog/backdrop when inactive
- `modal-visible`: added when dialog is opened
- `modal-content`: runtime marker for currently opened dialog nodes
- `modal-container`: expected dialog container styling hook
- `modal-lock`: applied to `html` and `body` while modal is active
- `modal-backdrop`: backdrop layer class inside `#modal-backdrop`
- `#modal-backdrop`: backdrop container id created/reused by the service

## Basic Use

```js
const dialog = lib.service.get("ui.dialog");
dialog.start();

dialog.triggerOpen(document.querySelector("[data-dialog-trigger]"));
```

Programmatic close:

```js
dialog.close();
```

## Markup Example

```html
<div hidden>
  <a id="button-modal-user-org-insert" data-dialog-trigger aria-controls="modal-user-org-insert">
    open
  </a>
</div>

<div id="modal-user-org-insert" class="modal-container modal-hidden" role="dialog" aria-modal="true" aria-hidden="true">
  <button id="button-modal-user-org-insert-close" data-dialog-close aria-controls="modal-user-org-insert">
    Close
  </button>
  <div>Dialog content...</div>
</div>
```

`modal.php` alignment:

- opener trigger and close trigger both route through `ui.dialog`
- `aria-controls` points at the dialog container id
- modal/backdrop and `modal-lock` are managed by this service
- tab/collapse regions inside the dialog are handled by their own services

## Notes

- `isModalOpen()` returns open modal nodes or `null`.
- `close()` returns `false` by intent (onclick-friendly behavior).
- Service `start()`/`stop()` only add/remove this service's tagged routes.
