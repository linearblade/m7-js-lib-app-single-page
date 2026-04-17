# Standalone Helpers - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

This page documents the release-facing standalone helper surface exported by the SPA standalone build.

This is the helper set you get from:

* [../../dist/singlePageApp.standalone.v1.0.0.min.js](../../dist/singlePageApp.standalone.v1.0.0.min.js)
* [../../src/standalone/install.js](../../src/standalone/install.js)
* [../../src/standalone/prebundle.js](../../src/standalone/prebundle.js)

Important posture:

* this is a convenience surface for the SPA standalone bundle
* it does **not** imply an ActiveTags dependency
* the older vendor-composed walkthrough entry in `src/standalone/index.js` is useful for local/dev composition, but it is not the primary release contract

---

## Export surface

The standalone helper surface exposes:

* `lib`
* `initLib`
* `installServices`
* `install`
* `basic`
* `SinglePageApp`
* `VERSION`

In practice, the helpers you will touch most often are:

* `initLib`
* `installServices`
* `install`
* `basic`

---

## `lib`

`lib` is the bundled/shared m7 lib instance used by the standalone build.

Use it when you want direct access to the bundled runtime object.

Example:

```js
import { lib } from "./dist/singlePageApp.standalone.v1.0.0.min.js";
```

---

## `initLib(opts?)`

Initializes the bundled/shared m7 lib instance.

Typical use:

* initialize the bundled lib before manual service work
* force a re-init during controlled testing/setup flows

Example:

```js
import { initLib } from "./dist/singlePageApp.standalone.v1.0.0.min.js";

initLib({
  force: false,
});
```

Most consumers do **not** need to call this directly before `install(...)` or `basic(...)`, because those helpers already ensure lib readiness.

---

## `installServices(opts?)`

Installs the standalone runtime services without installing the SPA itself yet.

This is useful when you want:

* the bundled lib initialized
* event delegator installed
* popstate manager installed
* but no SPA instance created yet

Example:

```js
import { installServices } from "./dist/singlePageApp.standalone.v1.0.0.min.js";

const lib = installServices({
  forceInit: false,
});
```

Use this when you want to prepare the runtime in steps, for example:

1. initialize/install services
2. inspect or customize shared service state
3. install the SPA later

---

## `install(opts?)`

Installs the generic SPA service object against the standalone runtime.

This is the standalone equivalent of the generic installer:

* installs required services if missing
* creates the SPA instance
* registers the generic SPA service

It does **not** apply the baseline click/popstate configuration by itself.

Example:

```js
import { install } from "./dist/singlePageApp.standalone.v1.0.0.min.js";

const result = install({
  builtins: false,
});

const spa = result.instance;
```

---

## `basic(opts?)`

Installs the SPA and applies the baseline usable configuration in one step.

This is the easiest standalone entrypoint when you want:

* services installed
* SPA installed
* default click handler registered
* default popstate handler registered
* startup performed

Example:

```js
import { basic } from "./dist/singlePageApp.standalone.v1.0.0.min.js";

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

## When to use which helper

Use:

* `basic(...)`
  when you want the fastest route to a working SPA

* `install(...)`
  when you want a generic SPA service object and will wire handlers yourself

* `installServices(...)`
  when you want shared runtime services ready before SPA installation

* `initLib(...)`
  when you specifically need manual control over bundled lib initialization

---

## Recommended posture

For most users:

1. use `basic(...)`
2. move down to `install(...)` only when you need custom handler registration
3. move down to `installServices(...)` only when you need stepwise standalone composition

---

## See also

* [Installation](./INSTALLATION.md)
* [Requirements](./REQUIREMENTS.md)
* [Click and Popstate Handlers](./POPSTATE_HANDLERS.md)
* [README](../../README.md)
