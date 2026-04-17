# Quick Start - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

This guide gets you from zero to a working delegated SPA flow quickly.

---

## 1) Mark your navigation links

Example markup:

```html
<a spa-type="nav-click" href="page-1.html">Page 1</a>
<a spa-type="nav-click" href="page-2.html">Page 2</a>

<div id="ticker">Ready</div>
<div id="main">
  Home page content.
</div>
```

---

## 2) Install services and configure the SPA

```js
import { install as installEventDelegator } from "../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import { install as installPopStateManager } from "../m7-js-lib-app-popstatemanager/src/install.js";
import { basic } from "./src/install/index.js";

installEventDelegator(lib, {
  root: document,
  host: window,
  start: true,
});

installPopStateManager(lib, {
  host: window,
  start: false,
});

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

---

## 3) What happens next

With the baseline configuration:

* link clicks matching `linkSelector` are intercepted
* the target URL is fetched
* `sourceSelector` content from the fetched page is copied into `targetSelector`
* a history entry is pushed with the configured popstate key
* browser back/forward restores that URL through the registered popstate handler

---

## 4) Validate the flow

The repository example pages under [../../src/example](../../src/example) demonstrate the normal loop:

1. open [../../src/example/index.html](../../src/example/index.html)
2. click into `page-1.html`, `page-2.html`, `page-3.html`
3. use browser back and forward
4. confirm `#main` swaps correctly and history restores the previous page

---

## 5) Turn off the baseline logger

The baseline config only emits debug logs when `debug: true` is passed.

If you want quiet operation, omit `debug` or set:

```js
debug: false
```

---

## Next steps

* If the default restore behavior is enough, keep using `basic(...)`
* If you need custom navigation and restore logic, read [POPSTATE_HANDLERS.md](./POPSTATE_HANDLERS.md)
* If you want a one-file distribution, build the standalone bundle with `npm run build`

---

## See also

* [Installation](./INSTALLATION.md)
* [Click and Popstate Handlers](./POPSTATE_HANDLERS.md)
* [README](../../README.md)
