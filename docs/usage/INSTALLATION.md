# Installation - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

This guide covers the supported install shapes for the project.

---

## 1) Service-first source install

This is the recommended integration posture when you already manage your own m7 lib instance.

### Required services

Before creating the SPA instance, install:

* `primitive.dom.eventdelegator`
* `app.popstatemanager`

The SPA expects both services to already exist when you use the service-first path.

### Generic installer

```js
import { install as installEventDelegator } from "../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import { install as installPopStateManager } from "../m7-js-lib-app-popstatemanager/src/install.js";
import { install } from "./src/install/install.js";

installEventDelegator(lib, {
  root: document,
  host: window,
  start: true,
});

installPopStateManager(lib, {
  host: window,
  start: false,
});

const result = install(lib, {
  builtins: false,
});

const spa = result.instance;
```

This installs the generic SPA service only. It does not wire default click/popstate behavior.

### Basic installer

```js
import { basic } from "./src/install/index.js";

const result = basic(lib, {
  builtins: false,
  linkSelector: 'a[spa-type="nav-click"][href]',
  sourceSelector: "#main",
  targetSelector: "#main",
  statusSelector: "#ticker",
  trackCurrent: true,
});

const spa = result.instance;
```

`basic(...)` performs:

* generic SPA install
* env setup
* utility setup
* default click handler registration
* default popstate handler registration
* startup
* optional current-route tracking

---

## 2) Standalone bundle

Use the built standalone bundle when you want one file that already includes:

* m7 lib
* event delegator
* popstate manager
* SPA install/basic helpers

Example:

```js
import { basic } from "./dist/singlePageApp.standalone.v<version>.min.js";

const result = basic({
  builtins: false,
  linkSelector: 'a[spa-type="nav-click"][href]',
  sourceSelector: "#main",
  targetSelector: "#main",
  statusSelector: "#ticker",
  trackCurrent: true,
});

const spa = result.instance;
```

Build output is produced by:

```bash
npm run build
```

---

## 3) Legacy convenience installer

The repository still contains [../../src/spa-install.js](../../src/spa-install.js).

That path is useful for older demos or quick local wiring, but the preferred posture for new work is:

* `src/install/install.js` for generic service install
* `src/install/basic.js` for baseline configuration
* `src/install/index.js` for the convenience `basic(...)` wrapper

---

## 4) ActiveTags integration

If you are using an ActiveTags standalone that already bundles this project, the SPA can be enabled through ActiveTags config:

```js
const lib = installActiveTags({
  conf: {
    boot: {
      observeDom: true,
      events: true,
      intervals: true,
    },
  },
  spa: {
    builtins: false,
    linkSelector: 'a[spa-type="nav-click"][href]',
    sourceSelector: "#main",
    targetSelector: "#main",
    statusSelector: "#ticker",
    trackCurrent: true,
  },
});
```

In that shape, ActiveTags installs popstate first, then applies this project's basic SPA configuration.

---

## See also

* [Quick Start](./QUICKSTART.md)
* [Click and Popstate Handlers](./POPSTATE_HANDLERS.md)
* [README](../../README.md)
