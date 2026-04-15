# Navbar Example Tutorial

[README](../README.md) -> [Examples](./README.md) -> [Navbar Tutorial](./NAVBAR_TUTORIAL.md)

This tutorial walks through wiring and validating the `navbar.php` example with `ui.navbar`.

## What You Get

- delegated trigger handling for nav controls (`data-nav-trigger` / `m7-nav-trigger`)
- mobile menu toggle behavior and dropdown tree state
- outside-click + `Escape` close behavior
- optional viewport-aware dropdown auto-flip behavior

## Files Used

- `examples/navbar.php`
- `examples/m7-ui-navbar.minimal.css`

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
  services: {
    navbar: {
      dropBehaviorDefault: "auto",
      mobileMaxWidth: 800,
    },
  },
});
```

## 2) Include Markup and CSS

- load `examples/navbar.php` markup into your page
- load `examples/m7-ui-navbar.minimal.css` for default class hooks

## 3) Verify Expected Behavior

1. Click `Menu` on mobile width and confirm `.navbar__links` toggles.
2. Click `Products` and verify dropdown opens.
3. Click `Guides` and verify nested dropdown opens.
4. Click outside the navbar and verify open state closes.
5. Press `Escape` and verify open state closes.

## 4) Attribute-to-Service Map

- `data-nav-trigger` / `m7-nav-trigger` -> trigger routing (`ui.navbar`)
- `aria-controls` -> target menu/link node resolution
- `nav-drop-behavior` / `data-nav-drop-behavior` / `m7-nav-drop-behavior` -> per-element direction override

## 5) Class Hooks Expected by Default Config

- structure: `navbar`, `navbar__links`, `navbar__dropdown`, `navbar__dropdown--menu`
- runtime: `open`, `navbar-open`, `navbar-hover-open`
- placement: `navbar__dropdown--flip-left`, `navbar__dropdown--center`, `navbar__dropdown--measuring`

## 6) Common Issues

- trigger click does nothing:
  - ensure trigger has `data-nav-trigger` or `m7-nav-trigger`
  - ensure service `ui.navbar` is started
- menu target does not open:
  - ensure `aria-controls` matches a real element id
- dropdown placement looks wrong:
  - validate `dropBehaviorDefault` and any per-element behavior attrs
