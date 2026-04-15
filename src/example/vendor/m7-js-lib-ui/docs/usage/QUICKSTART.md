# Quick Start

[README](../../README.md) -> [Usage TOC](./TOC.md) -> [Quick Start](./QUICKSTART.md)

## 1) Initialize m7 and required primitive

```js
import lib, { init } from "../../m7-js-lib/src/index.js";
import installEventDelegator from "../../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import installUI from "../../m7-js-lib-ui/src/install.js";

init();
installEventDelegator(lib, { start: false });

installUI(lib, {
  startUiServices: true,
});
```

## 2) Use helper modules

```js
const button = document.querySelector("[data-save]");
lib.ui.toaster.set(button, "Saved", "alert-success");
```

## 3) Use services from `lib.service`

```js
const tabs = lib.service.get("ui.tabs");
const dialog = lib.service.get("ui.dialog");

tabs.setConfig({ selected: "is-active" });

dialog.triggerOpen(document.querySelector("[data-dialog-trigger]"));
```

## 4) Control startup explicitly

```js
installUI(lib, { startUiServices: false });
lib.service.get("ui.proxy").start();
```

## Next

- [INSTALLATION.md](./INSTALLATION.md)
- [REQUIREMENTS.md](./REQUIREMENTS.md)
- [services/INDEX.md](./services/INDEX.md)
- [../api/INDEX.md](../api/INDEX.md)
