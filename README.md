# m7-js-lib-app-single-page v1.0.0

*Framework-light single-page navigation for m7 lib*

## Introduction

m7-js-lib-app-single-page adds service-oriented SPA navigation on top of m7 lib. It is designed for sites that want partial page loading, delegated click handling, and browser back/forward support without moving to a framework-owned router. The project stays deliberately split: `install()` gives you a generic SPA service object, `basic()` wires a baseline usable product, and popstate restoration remains application-owned so you can decide how each history key should restore UI state.

ActiveTags is not required to use this project. It is currently used in one test/demo path for convenience, but the SPA is designed to run independently through its own install/basic and standalone bundle surfaces.

---

## Navigation

If you are new to the project, the recommended reading order is:

1. **Introduction** -> [docs/usage/INTRODUCTION.md](docs/usage/INTRODUCTION.md)
2. **Installation** -> [docs/usage/INSTALLATION.md](docs/usage/INSTALLATION.md)
3. **Requirements** -> [docs/usage/REQUIREMENTS.md](docs/usage/REQUIREMENTS.md)
4. **Quick Start** -> [docs/usage/QUICKSTART.md](docs/usage/QUICKSTART.md)
5. **Click and Popstate Handlers** -> [docs/usage/POPSTATE_HANDLERS.md](docs/usage/POPSTATE_HANDLERS.md)
6. **API Contract** -> [docs/api/SINGLE_PAGE_APP_API_CONTRACT.md](docs/api/SINGLE_PAGE_APP_API_CONTRACT.md)
7. **Usage TOC** -> [docs/usage/TOC.md](docs/usage/TOC.md)

---

## Quick example

### Source install with explicit services

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

### Standalone bundle

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

---

## Philosophy

> "Own navigation in the app layer, not in the history service."

This project treats popstate restoration as application behavior. The popstate manager tracks history and dispatches by key, but the SPA layer decides what "restore this URL" means for a given screen or fragment.

---

## License

See [LICENSE.md](LICENSE.md) for full terms.

* Usage rights and restrictions are defined in [LICENSE.md](LICENSE.md)
* Commercial licensing inquiries: [legal@m7.org](mailto:legal@m7.org)

---

## AI Usage Disclosure

See:

* [docs/AI_DISCLOSURE.md](docs/AI_DISCLOSURE.md)
* [docs/USE_POLICY.md](docs/USE_POLICY.md)

for permitted use of AI in derivative tools or automation layers.

---

## Feedback / Security

* General inquiries: [legal@m7.org](mailto:legal@m7.org)
* Security issues: [security@m7.org](mailto:security@m7.org)
