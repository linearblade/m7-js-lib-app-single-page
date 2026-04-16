# Collapse Service

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md) -> [Collapse Service](./COLLAPSE.md)

Service id: `ui.collapse`

## What This Is

`ui.collapse` is a delegated panel-toggle service for accordions/collapsible regions.

It binds one click route through the event delegator and resolves targets from trigger attributes.

## What It Does

On trigger click it:

- reads `aria-controls` from the clicked trigger
- resolves the target panel by id
- toggles panel visibility state (`aria-hidden`, `aria-expanded`, hidden class)
- if a toggle group is configured, turns off sibling panels in that group
- runs optional chain hooks for on/off transitions

## Default Selectors and Attributes

- trigger selector: `[data-collapse-trigger]`
- parent selector: `[data-collapse-parent]`
- target panel id source: `aria-controls` on trigger
- group attribute: `data-toggle-group`
- parent child-id list attribute: `data-children`
- chain on attribute: `data-toggle-on`
- chain off attribute: `data-toggle-off`
- hidden class: `tab-hidden`

## Expected Classes (Default Config)

- `tab-hidden`: hides collapsed panels

## State Mutations

When a panel is opened:

- removes `tab-hidden`
- sets `aria-hidden="false"`
- sets `aria-expanded="true"`

When a panel is closed:

- adds `tab-hidden`
- sets `aria-hidden="true"`
- sets `aria-expanded="false"`

## Basic Use

```js
const collapse = lib.service.get("ui.collapse");
collapse.start();
```

Optional config:

```js
collapse.setConfig({
  hidden: "is-hidden",
  trigger: "[data-my-collapse]",
});
```

## Markup Example

```html
<section data-collapse-parent data-toggle-group="faq" data-children="a1 a2">
  <button data-collapse-trigger aria-controls="a1" aria-expanded="false">Question 1</button>
  <div id="a1" class="tab-hidden" aria-hidden="true" data-toggle-group="faq">Answer 1</div>

  <button data-collapse-trigger aria-controls="a2" aria-expanded="false">Question 2</button>
  <div id="a2" class="tab-hidden" aria-hidden="true" data-toggle-group="faq">Answer 2</div>
</section>
```

## Notes

- Chain hooks are executed through `lib.ui.chain`.
- `stop()` removes only this service's tagged routes from delegator.
- `start()` / `stop()` do not start/stop the delegator service itself.
- This service is not used in the referenced `modal.php` flow; that file uses `ui.proxy`, `ui.dialog`, and `ui.tabs`.
