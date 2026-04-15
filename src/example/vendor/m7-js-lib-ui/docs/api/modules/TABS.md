# ui.tabs API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.tabs](./TABS.md)

Service id: `ui.tabs`

Class definition: `lib.ui.service.TabsService`

## Purpose

`ui.tabs` manages delegated tab trigger state and tab panel visibility by group.

Use it to keep `aria-selected`, `aria-hidden`, active classes, and hidden classes in sync from attribute-driven markup.

## Surface

```js
{
  defaultConfig(): object,
  setConfig(conf: object): void,
  getConfig(): object,
  start(): boolean,
  stop(): boolean,
  isStarted(): boolean,
  init(): void
}
```

## How To Use

```js
const tabs = lib.service.get("ui.tabs");

tabs.setConfig({ selected: "is-active" });
tabs.start();
```

## Required Markup

- Trigger: `[data-tab-trigger]`
- Parent/tablist: `[role=tablist]`
- Panel target: `aria-controls="panel-id"`
- Panel group: `data-toggle-group="group-name"`
- Optional parent children list: `data-children="panel-a panel-b ..."`

## Expected Attributes (Default Config)

- `data-tab-trigger` on tab controls
- `aria-controls="<panel-id>"` on tab controls
- `role="tablist"` around sibling tab controls
- `data-toggle-group="<group-name>"` on panel nodes or on parent scope
- `data-children="id-a id-b ..."` optional on parent scope for explicit panel membership
- `data-no-controls="true"` optional on trigger or parent to suppress missing-panel error
- `data-toggle-on` / `data-toggle-off` optional chain hooks on trigger/panel/parent nodes
- `data-tab-parent` optional parent scope used for inheritance and fallbacks

## Expected Classes (Default Config)

- `tab-hidden`
- `selected`

Notes:

- `ui.tabs` controls tab selected/hidden state only.
- In modal UIs, this typically runs inside a dialog body after `ui.dialog` opens the container.
