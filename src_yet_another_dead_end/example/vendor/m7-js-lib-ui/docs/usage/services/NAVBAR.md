# Navbar Service

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md) -> [Navbar Service](./NAVBAR.md)

Service id: `ui.navbar`

## What This Is

`ui.navbar` is a delegated navigation controller for multi-level navbar menus.

It handles mobile/desktop toggle behavior, dropdown open/close state, outside-click/escape closing, and optional viewport-aware dropdown direction flipping.

## What It Does

On trigger click it:

- resolves trigger intent from `data-nav-trigger` / `m7-nav-trigger`
- toggles main links container or a dropdown subtree
- updates `aria-expanded` state on owning trigger
- optionally closes sibling dropdowns

At runtime it also:

- closes nav on outside click (`closeOnOutside`)
- closes nav on `Escape` (`closeOnEscape`)
- recalculates dropdown direction on resize/hover when auto-flip is enabled

## Default Selectors and Attributes

- root selector: `.navbar`
- links selector: `.navbar__links`
- dropdown selector: `.navbar__dropdown`
- dropdown menu selector: `.navbar__dropdown--menu`
- trigger attrs: `data-nav-trigger`, `m7-nav-trigger`
- direction override attrs: `nav-drop-behavior`, `data-nav-drop-behavior`, `m7-nav-drop-behavior`

Reserved trigger values:

- links toggle: `menu`, `links`, `navbar`, `navbar-links`, `toggle-links`
- close-all: `close`, `close-all`, `dismiss`, `dismiss-all`

## Expected Classes (Default Config)

- `open`: open state class for links and dropdowns
- `navbar-open`: root open state class
- `navbar-hover-open`: optional top-level hover-open mode class
- `navbar__dropdown--flip-left`: auto/forced left placement class
- `navbar__dropdown--center`: centered dropdown mode class
- `navbar__dropdown--measuring`: temporary measurement helper class

## Basic Use

```js
const navbar = lib.service.get("ui.navbar");
navbar.start();
```

Optional config:

```js
navbar.setConfig({
  dropBehaviorDefault: "auto",
  enableTopLevelHoverOpen: true,
  mobileMaxWidth: 800,
});
```

## Markup Example

```html
<nav class="navbar">
  <button class="navbar__toggle" data-nav-trigger="menu" aria-controls="navbar-links-main" aria-expanded="false">
    Menu
  </button>

  <ul class="navbar__links" id="navbar-links-main">
    <li class="navbar__dropdown" nav-drop-behavior="auto">
      <a href="#" data-nav-trigger aria-controls="menu-products" aria-expanded="false">Products</a>
      <ul class="navbar__dropdown--menu" id="menu-products">
        <li><a href="/products">Overview</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

## Notes

- `start()` / `stop()` only manage this service's own delegated route and listeners.
- They do not start or stop the event delegator service itself.
- `closeAll()` closes every matched navbar root.
- Minimal class hooks reference: `examples/m7-ui-navbar.minimal.css`.

## Production Hardening Roadmap

Recommended next features before broader rollout:

1. Keyboard navigation:
   Arrow-key traversal, Enter/Space open behavior, Escape close, and roving focus.
2. Focus management:
   Focus first item on open, return focus to trigger on close, optional mobile focus trap.
3. Placement offsets:
   Configurable `dropOffsetX` / `dropOffsetY` and edge padding controls.
4. Service event hooks:
   Add callbacks such as `onOpen`, `onClose`, `onToggle`, `onResolveBehavior`.
5. Close-policy controls:
   Allow depth-aware or branch-aware sibling close behavior.
6. Reduced-motion support:
   Respect `prefers-reduced-motion` and expose a motion toggle in config.
7. Mutation-aware refresh:
   Optional observer to re-run placement sync when nav DOM is updated dynamically.
8. End-to-end regression tests:
   Cover mobile overlap, nested behavior, and direction overrides (Playwright or equivalent).
