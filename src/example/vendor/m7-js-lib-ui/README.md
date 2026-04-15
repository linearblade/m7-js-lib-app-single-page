# m7-js-lib-ui

[README](./README.md)

UI service pack for `m7-js-lib` 1.0.
Configuration-first UI behavior layer for websites and web applications built on `m7-js-lib`.
Bring your own markup and CSS, wire behavior through attributes, and compose services with explicit lifecycle control.

## Purpose

- enable self-service UI behavior composition without coupling to a visual framework
- provide attribute-driven behavior contracts that stay consistent across pages
- keep startup/lifecycle explicit through install + service `start()` / `stop()` control

## Chaining Differentiator

`m7-js-lib-ui` includes a shared chain contract for UI lifecycle behavior:

- `data-toggle-on`
- `data-toggle-off`
- chain execution via `lib.ui.chain`

Compared to common UI libraries that mostly expose per-component events or callbacks, this provides a consistent, configuration-first way to compose on/off behavior across services (`ui.dialog`, `ui.tabs`, `ui.collapse`).

## Navigation

1. [docs/ABOUT.md](docs/ABOUT.md)
2. [docs/usage/INTRODUCTION.md](docs/usage/INTRODUCTION.md)
3. [docs/usage/QUICKSTART.md](docs/usage/QUICKSTART.md)
4. [docs/usage/TOC.md](docs/usage/TOC.md)
5. [docs/api/INDEX.md](docs/api/INDEX.md)
6. [docs/entrypoints-contract.md](docs/entrypoints-contract.md)
7. [examples/README.md](examples/README.md)
8. [examples/TUTORIAL.md](examples/TUTORIAL.md)
9. [examples/NAVBAR_TUTORIAL.md](examples/NAVBAR_TUTORIAL.md)

## What It Installs

Core UI helpers (`lib.ui`):

- [`lib.ui.chain`](docs/api/modules/CHAIN.md): Runs attribute-driven function chains used by UI service on/off hooks.
- [`lib.ui.design.v1.setAlert`](docs/api/modules/SET_ALERT.md): Sets or clears inline alert content with optional HTML rendering.
- [`lib.ui.toaster`](docs/api/modules/TOASTER.md): Renders toast/alert notifications with grouped display behavior.

Service class definitions (`lib.ui.service.*`):

- [`lib.ui.service.CollapseService`](docs/api/modules/COLLAPSE.md): Class implementation behind accordion/collapse panel toggling.
- [`lib.ui.service.TabsService`](docs/api/modules/TABS.md): Class implementation behind delegated tab trigger/panel state management.
- [`lib.ui.service.DialogService`](docs/api/modules/DIALOG.md): Class implementation behind delegated modal/dialog lifecycle behavior.
- [`lib.ui.service.ProxyService`](docs/api/modules/PROXY.md): Class implementation behind delegated click proxy forwarding.
- [`lib.ui.service.NavbarService`](docs/api/modules/NAVBAR.md): Class implementation behind delegated navbar/dropdown behavior.
- [`lib.ui.service` namespace](docs/api/modules/SERVICE.md): Installed class namespace contract and structure.

Service instances (in `lib.service`):

- [`ui.collapse`](docs/api/modules/COLLAPSE.md): Toggles collapsible panels and grouped accordion state.
- [`ui.tabs`](docs/api/modules/TABS.md): Handles tab trigger selection and panel visibility by group.
- [`ui.dialog`](docs/api/modules/DIALOG.md): Handles dialog open/close triggers, backdrop, and modal lock.
- [`ui.proxy`](docs/api/modules/PROXY.md): Forwards one control click to another target control.
- [`ui.navbar`](docs/api/modules/NAVBAR.md): Handles delegated navbar links/dropdowns across desktop and mobile behavior.

Return shape:

```js
{
  namespace: lib.ui,
  services: ["ui.collapse", "ui.tabs", "ui.dialog", "ui.proxy", "ui.navbar"]
}
```

## Quick Install

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

const dialog = lib.service.get("ui.dialog");
dialog.triggerOpen(document.querySelector("[data-dialog-trigger]"));
```

## Examples

- [examples/modal.php](examples/modal.php)
- [examples/m7-ui-services.minimal.css](examples/m7-ui-services.minimal.css)
- [examples/TUTORIAL.md](examples/TUTORIAL.md)
- [examples/navbar.php](examples/navbar.php)
- [examples/m7-ui-navbar.minimal.css](examples/m7-ui-navbar.minimal.css)
- [examples/NAVBAR_TUTORIAL.md](examples/NAVBAR_TUTORIAL.md)

## Installer Behavior

- Requires `primitive.dom.eventdelegator` service.
- Starts delegator unless `installEventDelegator` is explicit no-intent.
- Optionally starts `primitive.dom.changeobserver` via `installChangeObserver === true`.
- Creates UI service class defs under `lib.ui.service.*`.
- Creates UI service instances in `lib.service`.
- Starts UI services by default unless `startUiServices` is explicit no-intent.

## License

See [LICENSE.md](LICENSE.md).
