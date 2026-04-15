# Installation

[README](../../README.md) -> [Usage TOC](./TOC.md) -> [Installation](./INSTALLATION.md)

`m7-js-lib-ui` is distributed as source ES modules in this repository.

## Prerequisites

- initialized `m7-js-lib` instance (`init()` has been called)
- installed `primitive.dom.eventdelegator` service
- browser DOM runtime

## Recommended install sequence

```js
import lib, { init } from "../../m7-js-lib/src/index.js";
import installEventDelegator from "../../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import installChangeObserver from "../../m7-js-lib-primitive-dom-changeobserver/src/install.js";
import installUI from "../../m7-js-lib-ui/src/install.js";

init();

installEventDelegator(lib, { start: false });
installChangeObserver(lib, { start: false });

installUI(lib, {
  installEventDelegator: true,
  installChangeObserver: false,
  startUiServices: true,
});
```

## Installer options

- `installEventDelegator`
  - default behavior: start delegator
  - explicit no-intent values (for example `false`) skip start
- `installChangeObserver`
  - `true`: start existing changeobserver service
  - any other value: no changeobserver start
- `startUiServices`
  - default behavior: start `ui.collapse`, `ui.tabs`, `ui.dialog`, `ui.proxy`, `ui.navbar`
  - explicit no-intent values (for example `false`) skip service startup
- `services`
  - optional per-service constructor options object
  - keys: `collapse`, `tabs`, `dialog`, `proxy`, `navbar`
  - each key is merged by that service's `setConfig(...)` during construction

Example:

```js
installUI(lib, {
  services: {
    tabs: { selected: "is-active" },
    proxy: { preventDefault: false },
    navbar: { dropBehaviorDefault: "auto" },
  },
});
```

## Manual wiring (advanced)

If needed, instantiate service classes directly:

```js
import { DialogService } from "../../m7-js-lib-ui/src/ui/service/DialogService.js";

lib.hash.set(lib, "ui.service.DialogService", DialogService);
lib.service.set("ui.dialog", new DialogService(lib));
lib.service.get("ui.dialog").start();
```

Use the package installer unless you need custom composition order.

## Delegator lifecycle note

UI service `start()`/`stop()` methods add/remove tagged local routes only.
They do not call `start()`/`stop()` on the main event delegator service.
