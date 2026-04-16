# ui.collapse API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.collapse](./COLLAPSE.md)

Service id: `ui.collapse`

Class definition: `lib.ui.service.CollapseService`

## Purpose

`ui.collapse` manages delegated open/close behavior for collapsible panels and accordion groups.

Use it to toggle panel visibility + `aria-expanded`/`aria-hidden` state through attributes.

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
const collapse = lib.service.get("ui.collapse");

collapse.setConfig({ hidden: "tab-hidden" });
collapse.start();
```

## Required Markup

- Trigger: `[data-collapse-trigger]`
- Trigger target: `aria-controls="panel-id"`
- Panel id: `id="panel-id"`
- Optional group: `data-toggle-group="group-name"`

## Expected Attributes (Default Config)

- `data-collapse-trigger` on collapse controls
- `aria-controls="<panel-id>"` on collapse controls
- `data-toggle-group="<group-name>"` optional on panel or parent scope for grouped behavior
- `data-children="id-a id-b ..."` optional on parent scope for explicit panel membership
- `data-toggle-on` / `data-toggle-off` optional chain hooks on trigger/panel/parent nodes
- `data-collapse-parent` optional parent scope used for group/children inheritance

## Expected Classes (Default Config)

- `tab-hidden`

Note:

- `ui.collapse` is not part of the referenced `modal.php` flow; that flow uses `ui.proxy`, `ui.dialog`, and `ui.tabs`.
