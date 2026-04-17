# Requirements - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

This page defines the runtime requirements and dependency posture for m7-js-lib-app-single-page.

## Important note

ActiveTags is **not required** to use this project.

ActiveTags is currently used in one example/test harness because it is convenient for bundled integration testing, but this SPA library is designed to run independently.

Release-facing usage should be thought of in these terms:

* source/service install with m7 lib + required services
* standalone bundle import

Not:

* "requires ActiveTags"

---

## Version baseline

This project requires:

1. `m7-js-lib` (v1+)
2. `m7-js-lib-primitive-dom-eventdelegator`
3. `m7-js-lib-app-popstatemanager`

Optional integration layers may include other projects, but they are not part of the minimum SPA dependency contract.

---

## Required runtime surface

At runtime, a valid m7 `lib` instance must be available with these dependency roots:

* `array`
* `hash`
* `func`
* `str`
* `bool`
* `request`

Runtime enforcement posture:

* these are asserted by [../../src/Assert.js](../../src/Assert.js)
* the SPA asserts library roots, not member methods

That means:

* `request` is required
* `request.send` and `request.makeEnvelope` are treated as part of that library contract

No global `window.lib` binding is required.

---

## Required services

The source/service install path requires these service ids:

* `primitive.dom.eventdelegator`
* `app.popstatemanager`

These are asserted by [../../src/Assert.js](../../src/Assert.js).

If either service is missing, SPA construction may throw.

---

## Browser/runtime requirements

This project is designed for browser-style navigation environments.

Expected runtime capabilities:

* a document-like root
* a host with `location`
* a host with `history`
* `DOMParser` for HTML parsing

The SPA layer resolves:

* `root` -> document-side root
* `host` -> browser host object, usually `window`

If the runtime does not provide a browser-like root/host, SPA construction or page loading may fail.

---

## Standalone distribution posture

The standalone SPA bundle includes the minimum runtime stack directly:

* m7 lib
* event delegator
* popstate manager
* SPA install/basic helpers

If you consume the versioned standalone dist file, you do not need to install those sibling repos separately for runtime use.

Primary build output:

* [../../dist/singlePageApp.standalone.v1.0.0.min.js](../../dist/singlePageApp.standalone.v1.0.0.min.js)

Build command:

```bash
npm run build
```

---

## Verification checklist

Before starting runtime, verify:

* a valid `lib` instance exists
* `primitive.dom.eventdelegator` is installed
* `app.popstatemanager` is installed
* `document`, `location`, `history`, and `DOMParser` exist in the target browser environment

For manual/source construction, verify:

* `lib.require.all(...)` resolves the required dependency roots
* `lib.require.service(...)` resolves the required service ids
* `lib.request.makeEnvelope(...)` is available
* `lib.request.send(...)` is available

For standalone usage, verify:

* the bundle path resolves
* `basic(...)` or `install(...)` returns successfully
* the returned result includes a usable `instance`

---

## See also

* [Installation](./INSTALLATION.md)
* [Quick Start](./QUICKSTART.md)
* [Click and Popstate Handlers](./POPSTATE_HANDLERS.md)
* [README](../../README.md)
