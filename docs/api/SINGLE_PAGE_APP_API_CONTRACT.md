# SinglePageApp API Contract

[README](../../README.md) -> [API Index](./INDEX.md)

**(m7-js-lib-app-single-page)**

> **You may paste this file directly into another project so that an LLM can correctly reason about and use the software.**
> This document defines the **public API contract only**.
> It intentionally omits implementation details and source code.
>
> Anything not explicitly specified here must be treated as **undefined behavior**.

---

## Scope

This contract defines the public, stable interface for:

* `SinglePageApp`
* the generic installer surface
* the baseline `basic(...)` installer surface
* the click and popstate handler factories
* runtime dependency and service expectations

This contract does **not** define:

* private helper functions
* internal event registry structures
* internal utility implementation details
* legacy/inactive files
* undocumented side effects

---

## Important posture

`m7-js-lib-app-single-page` does **not** require ActiveTags.

ActiveTags may bundle or configure this project in some integration scenarios, but ActiveTags is not part of the SPA dependency contract and must not be treated as required runtime infrastructure for this library.

---

## Core concepts

### SinglePageApp instance

`SinglePageApp` is an application-layer navigation controller that composes:

* event delegation
* popstate/history restoration
* page fetch/swap helpers
* builtin registration

It is not a framework router and it is not the history manager itself.

### Root spec

A root spec is an object with:

* `root` -> document-side root
* `host` -> browser host object, usually `window`

### Popstate key

A popstate key is a stable string that pairs a click-side history write with a popstate-side restore handler.

Examples:

* `spa-link`
* `article-main`
* `dashboard-filter-panel`

---

## Fundamental guarantees

The project guarantees:

1. **Service-backed integration**  
   Event delegation and history behavior are delegated to required services.

2. **Explicit install/configure layering**  
   `install(...)` creates the generic SPA service; `basic(...)` creates a baseline usable product.

3. **Application-owned restore policy**  
   Popstate restoration belongs in the app layer, not in the history service.

4. **Root/host split**  
   The SPA treats document-side root and browser host as separate values.

5. **No implicit ActiveTags dependency**  
   Any ActiveTags usage is optional integration only.

---

## Environment and dependency requirements

Required `lib` dependency roots:

* `array`
* `hash`
* `func`
* `str`
* `bool`
* `request`

Required service ids:

* `primitive.dom.eventdelegator`
* `app.popstatemanager`

Expected browser/runtime capabilities:

* `document`
* `location`
* `history`
* `DOMParser`

If required dependencies, services, or browser capabilities are unavailable, construction or page-loading methods may throw.

---

## Module exports and integration

### `src/SinglePageApp.js`

Exports:

* named export: `SinglePageApp`
* default export: `SinglePageApp`

### `src/install/install.js`

Exports:

* named export: `install`
* named export: `installNamespace`
* named export: `NAMESPACE_ID`
* named export: `SERVICE_ID`
* default export object containing those members

### `src/install/index.js`

Exports:

* named export: `install`
* named export: `basic`
* default export object containing those members

### `src/handler/click.js`

Exports:

* named export: `createClickHandler`
* default export: `createClickHandler`

### `src/handler/popstate.js`

Exports:

* named export: `createPopStateHandler`
* default export: `createPopStateHandler`

### Standalone prebundle / dist

The standalone bundle export surface is expected to expose:

* `lib`
* `initLib`
* `installServices`
* `install`
* `basic`
* `SinglePageApp`
* `VERSION`

---

## Public API surface

## Construction

### `new SinglePageApp(opts?)`

Constructs a SPA controller instance.

Recognized construction options:

* `lib`
* `root`
* `env`
* `state`
* `listeners`
* `popstates`
* `builtins`
* `autoStart`

Behavior:

* resolves root/host
* asserts required dependencies/services
* acquires shared `eventDelegator`
* acquires shared `popstate` manager
* configures builtins/env/state/listeners/popstates
* starts immediately unless `autoStart` is disabled by m7-style false intent

Construction may throw if:

* `lib` is missing or invalid
* required services are unavailable
* browser root/host cannot be resolved

---

## Stable instance properties

After successful construction, the following stable properties are available:

* `spa.lib`
* `spa.root`
* `spa.env`
* `spa.utils`
* `spa.asserted`
* `spa.events`
* `spa.eventDelegator`
* `spa.popstate`
* `spa.builtins`

Undocumented internal properties must be treated as unstable.

---

## Stable instance methods

### `setRoot(root, host?) -> rootSpec`

Normalizes and stores the current root spec.

Also updates:

* popstate host
* event delegator root/host

### `setEnv(env?) -> Object`

Normalizes and stores the SPA environment object.

Also pushes env updates into:

* events
* popstate manager
* builtins

### `setUtils(opts?) -> Utils`

Configures the utility helper object used by:

* URL resolution
* page fetch
* page swap
* page load

### `setBuiltIns(builtins?) -> Array|*`

Enables or disables builtin behavior according to m7-style boolean intent.

### `configure({ listeners, popstates } = {}) -> this`

Registers listener and popstate definitions.

### `setState(state?) -> *`

Initializes or updates the current popstate state through the shared popstate manager.

### `registerListeners(listeners?) -> this`

Registers delegated listener definitions.

Accepted forms are defined by the events layer and baseline installer usage.

### `registerPopstates(popstates?) -> this`

Registers popstate handlers.

Accepted forms include:

* string/function shorthand
* arrays of entries
* object maps

### `normalizePopstateEntries(popstates?) -> Array`

Normalizes popstate registration input into `{ key, handler }` entries.

### `resolveUrl(url, baseUrl?) -> string|null`

Resolves a URL and rejects unresolved/cross-origin values according to utility rules.

### `fetchPage(url, requestOptions?) -> Promise<Object>`

Fetches a page and returns normalized payload including parsed document.

### `swapPage(payload, swapOptions?) -> Object`

Swaps source content into the current target document.

### `loadPage(url, loadOptions?) -> Promise<Object>`

High-level fetch + swap operation.

Behavior:

* resolves URL
* fetches page
* swaps content
* optionally pushes history state unless `pushState === false`

### `on() -> this`

Starts:

* event delegation
* popstate listener

### `off() -> this`

Stops:

* event delegation
* popstate listener

---

## Generic installer API

### `install(lib, opts?) -> { namespace, instance, installedService }`

Defined in `src/install/install.js`.

Responsibilities:

* installs/updates namespace metadata under `app.SinglePageApp`
* creates a `SinglePageApp` instance
* stores it on `lib.spa`
* registers service `app.singlepageapp` when `lib.service.set(...)` exists

Important posture:

* this is the generic installer
* it does **not** define the baseline click/popstate behavior by itself

Stable constants:

* `NAMESPACE_ID === "app.SinglePageApp"`
* `SERVICE_ID === "app.singlepageapp"`

---

## Baseline installer API

### `basic(lib, opts?) -> { namespace, instance, installedService, configured }`

Defined in `src/install/index.js`.

Behavior:

1. calls generic `install(...)`
2. applies baseline configuration via `configureBasic(...)`
3. returns the install result plus `configured: true`

The baseline configuration is expected to:

* set env
* set utility options
* register a default click handler
* register a default popstate handler
* start the SPA
* optionally track the current route

This is the "give me a baseline usable product" surface.

---

## Handler factory API

### `createClickHandler(opts?) -> Function`

Creates a click-side navigation handler.

Recognized options:

* `spa`
* `controller`
* `log`
* `status`
* `options`
* `popstateKey`
* `mod`

Expected behavior:

* reject clicks that should fall through
* resolve the URL
* prevent native navigation
* call `spa.loadPage(..., { pushState: true })`
* preserve/resolve the correct popstate key

### `createPopStateHandler(opts?) -> Function`

Creates a restore-side popstate handler.

Recognized options:

* `spa`
* `controller`
* `log`
* `status`
* `popstateKey`
* `mod`

Expected behavior:

* resolve the current URL
* determine the correct restore key
* call `spa.loadPage(..., { pushState: false })`

---

## Relationship between click and popstate handlers

The intended contract is:

* click handler writes a stable popstate key into pushed state
* popstate handler restores the UI for that same key

These handlers should be treated as a matched pair.

If they drift apart, browser back/forward behavior becomes unreliable.

---

## Error and throw behavior

Public methods may throw in cases including:

* missing or invalid `lib`
* missing required services
* unresolved browser root/host
* invalid URL resolution
* missing source selector in fetched document
* missing target selector in current document
* unavailable DOMParser

Exact error strings are not part of the stable contract.

---

## Undefined behavior

The following must be treated as undefined unless later documented:

* reaching into internal helper objects beyond documented properties/methods
* depending on the internal shape of event registry entries
* depending on undocumented builtin internals
* calling legacy files as if they were canonical public entrypoints

---

## Related docs

* [Requirements](../usage/REQUIREMENTS.md)
* [Installation](../usage/INSTALLATION.md)
* [Click and Popstate Handlers](../usage/POPSTATE_HANDLERS.md)
* [README](../../README.md)
