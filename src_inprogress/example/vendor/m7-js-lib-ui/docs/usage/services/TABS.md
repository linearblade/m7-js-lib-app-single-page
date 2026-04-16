# Tabs Service

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md) -> [Tabs Service](./TABS.md)

Service id: `ui.tabs`

## What This Is

`ui.tabs` is a delegated tab-state service.

It keeps trigger selected state and panel visibility synchronized by group.

This service owns tab trigger/panel state only. It does not open/close modals (`ui.dialog`) and it does not proxy clicks (`ui.proxy`).

## What It Does

On tab trigger click it:

- finds the containing tablist (`[role=tablist]`)
- updates selected state/class across sibling triggers
- resolves target panel from `aria-controls`
- resolves panel group via `data-toggle-group`
- hides sibling panels and shows the target panel
- runs chain hooks for on/off transitions

## Default Selectors and Attributes

- trigger selector: `[data-tab-trigger]`
- parent selector: `[data-tab-parent]`
- required tablist context: `[role=tablist]`
- target panel id source: `aria-controls` on trigger
- panel group attribute: `data-toggle-group`
- parent child-id list attribute: `data-children`
- chain on attribute: `data-toggle-on`
- chain off attribute: `data-toggle-off`
- hidden class: `tab-hidden`
- selected class: `selected`

Related behavior flags:

- `allow_rerun_on` default `false`
- `allow_rerun_off` default `false`

## Expected Classes (Default Config)

- `tab-hidden`: hides non-active panels
- `selected`: marks active trigger

## State Mutations

On selected trigger:

- adds `selected`
- sets `aria-selected="true"`

On previously selected triggers:

- removes `selected`
- sets `aria-selected="false"`

On panels:

- non-target panels: add `tab-hidden`, set `aria-hidden="true"`
- target panel: remove `tab-hidden`, set `aria-hidden="false"`

## Basic Use

```js
const tabs = lib.service.get("ui.tabs");
tabs.start();
```

Optional config:

```js
tabs.setConfig({
  selected: "is-active",
  hidden: "is-hidden",
  allow_rerun_on: true,
});
```

## Markup Example

```html
<div data-tab-parent data-toggle-group="group-modal-user-org" data-children="panel-members-modal-user-org-properties panel-members-modal-user-org-notes">
  <ul role="tablist" data-tab-parent>
    <li><a data-tab-trigger aria-selected="true" aria-controls="panel-members-modal-user-org-properties">Properties</a></li>
    <li><a data-tab-trigger aria-selected="false" aria-controls="panel-members-modal-user-org-notes">Notes</a></li>
  </ul>

  <section id="panel-members-modal-user-org-properties" class="tab-panel" data-toggle-group="group-modal-user-org" aria-hidden="false">...</section>
  <section id="panel-members-modal-user-org-notes" class="tab-panel tab-hidden" data-toggle-group="group-modal-user-org" aria-hidden="true">...</section>
</div>
```

## Notes

- If panel cannot be found and `data-no-controls="true"` is set on trigger or parent, missing-panel error is skipped.
- Chain hooks run through `lib.ui.chain`.
- `start()` / `stop()` only manage this service's delegated routes.
- In modal-style UIs, tabs normally run inside dialog content after `ui.dialog` opens the container.
