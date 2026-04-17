# Click and Popstate Handlers - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

This guide explains how to design click handlers and popstate handlers together in this project.

---

## Why this matters

In this project, click and popstate handlers are two halves of the same navigation contract.

The click handler decides:

* whether a click should be intercepted
* what URL should be loaded
* what history key should be written
* whether a new history entry should be pushed

The popstate handler decides:

* what that same history key means on restore
* what URL or fragment should be rebuilt
* how the UI should be restored without pushing again

The popstate manager and the SPA are intentionally separate infrastructure.

The popstate manager is responsible for:

* tracking history
* storing state envelopes
* dispatching handlers by popstate key

The SPA layer is responsible for:

* deciding what should happen when that key is restored
* fetching, swapping, or otherwise rebuilding the UI

That means your application owns the restore policy.

---

## The pairing model

The normal flow looks like this:

1. A click handler intercepts a link
2. It calls `spa.loadPage(...)` with `pushState: true`
3. It writes a stable `popstateKey`
4. Browser history later restores that key
5. A popstate handler receives the restore event
6. It calls `spa.loadPage(...)` with `pushState: false`

The key point is simple:

* the click side writes the history meaning
* the popstate side reads and restores that same meaning

If those two sides drift apart, browser back/forward becomes unreliable.

---

## Click handler contract

The baseline click factory in [../../src/handler/click.js](../../src/handler/click.js) returns a function with this shape:

```js
async function clickHandler(evt, ctx) {
  // intercept click and push SPA state
  return false;
}
```

The useful inputs are:

* `evt`
  The click event

* `ctx`
  Delegator/runtime context, typically including:
  * `element`
  * `url`
  * `selector`
  * `popstateKey`

The click handler should usually:

1. reject clicks that should fall through to native browser behavior
2. resolve the target URL safely
3. prevent the native navigation
4. call `spa.loadPage(...)` with `pushState: true`
5. use the correct popstate key for the restore path

---

## Popstate handler contract

The baseline popstate factory in [../../src/handler/popstate.js](../../src/handler/popstate.js) returns a function with this shape:

```js
async function popStateHandler(evt, currentUrl, ctx) {
  // restore UI
  return false;
}
```

The important inputs are:

* `currentUrl`
  The URL being restored

* `ctx`
  Popstate dispatch context, which may include state and key information

The handler should:

1. resolve the URL safely
2. decide which restore key or fragment it is responsible for
3. restore UI state without pushing a new history entry

---

## Default click handler factory

The default click factory is useful when your navigation behavior is "intercept this link and load it into the SPA target".

```js
import createClickHandler from "./src/handler/click.js";

const clickHandler = createClickHandler({
  spa,
  popstateKey: "spa-link",
});
```

The generated handler:

* ignores modified clicks and non-left-button clicks
* resolves the URL with `spa.resolveUrl(...)`
* prevents native navigation
* reads the popstate key from explicit config or context
* calls `spa.loadPage(..., { pushState: true })`
* returns `false`

---

## Default popstate handler factory

The default factory is useful when your restore behavior is "load this URL into the current SPA target".

```js
import createPopStateHandler from "./src/handler/popstate.js";

const popstateHandler = createPopStateHandler({
  spa,
  popstateKey: "spa-link",
});
```

The generated handler:

* resolves the URL with `spa.resolveUrl(...)`
* reads the popstate key from explicit config or context
* calls `spa.loadPage(..., { pushState: false })`
* returns `false`

---

## Registering a matched pair

In most cases, custom handlers should be registered as a pair:

```js
const clickHandler = createArticleClickHandler({ spa });
const popstateHandler = createArticlePopstateHandler({ spa });

spa.registerListeners({
  selector: 'a[data-article-nav][href]',
  handler: clickHandler,
  popstate: "article-main",
});

spa.registerPopstates({
  "article-main": popstateHandler,
});
```

That keeps the relationship explicit:

* this selector writes `article-main`
* `article-main` restores through this handler

---

## Design rules for custom click and popstate handlers

### 1) Never push during restore

When restoring browser history, do not create a new history entry.

Use:

```js
pushState: false
```

### 2) Push on click, not on restore

The click side is where a new history entry should normally be created:

```js
pushState: true
```

The popstate side should restore only.

### 3) Keep the key stable

Use a predictable popstate key per restore behavior, for example:

* `spa-link`
* `article-main`
* `dashboard-filter-panel`

### 4) Use the same key on both sides

If a click handler writes `article-main`, the restore path should be registered under `article-main`.

Do not let the click side and restore side drift into different names.

### 5) Restore only what you own

If the back action should restore only one fragment, restore only that fragment.

Do not assume every popstate event means "reload the whole page".

### 6) Resolve URLs defensively

Use `spa.resolveUrl(...)` or equivalent logic and ignore unresolved or cross-origin values.

### 7) Keep state payloads small

Store only what the handler needs. Avoid shoving large UI blobs into history state.

### 8) Treat the popstate manager as infrastructure

Let the manager dispatch by key. Put application-specific restore logic in the handler, not in the manager itself.

---

## Example: custom click + restore pair

```js
function createArticleClickHandler({ spa }) {
  return async function articleClickHandler(evt, ctx = null) {
    const rawUrl = ctx && ctx.url ? ctx.url : null;
    const url = spa.resolveUrl(rawUrl);
    if (!url) {
      return false;
    }

    if (evt && typeof evt.preventDefault === "function") {
      evt.preventDefault();
    }

    await spa.loadPage(url, {
      pushState: true,
      popstateKey: "article-main",
      swapOptions: {
        sourceSelector: "#article",
        targetSelector: "#article",
      },
    });

    return false;
  };
}

function createArticlePopstateHandler({ spa }) {
  return async function articlePopstateHandler(evt, currentUrl, ctx = null) {
    const url = spa.resolveUrl(currentUrl);
    if (!url) {
      return false;
    }

    await spa.loadPage(url, {
      pushState: false,
      popstateKey: "article-main",
      swapOptions: {
        sourceSelector: "#article",
        targetSelector: "#article",
      },
    });

    return false;
  };
}
```

That pattern is useful when:

* the page has multiple independent panels
* one panel should be history-driven
* a full-page restore would be too heavy

---

## Example: custom fragment restore only

```js
function createArticlePopstateHandler({ spa }) {
  return async function articlePopstateHandler(evt, currentUrl, ctx = null) {
    const url = spa.resolveUrl(currentUrl);
    if (!url) {
      return false;
    }

    await spa.loadPage(url, {
      pushState: false,
      popstateKey: "article-main",
      swapOptions: {
        sourceSelector: "#article",
        targetSelector: "#article",
      },
    });

    return false;
  };
}
```


## Where the key comes from

The default click and popstate factories resolve a key from several places:

* explicit `popstateKey`
* `ctx.state.popstate`
* `ctx.popstateKey`
* `controller.env.popstateKey`

That makes it easy to:

* hard-code a handler for one key
* or let the dispatch context carry the key

---

## Relationship to the popstate manager project

The lower-level popstate manager project is intentionally more advanced-user oriented and more sparse on usage docs. This project is the place where restore behavior becomes concrete.

For lower-level service details, see the public popstate manager repository:

* [m7-js-lib-app-popstatemanager](https://github.com/linearblade/m7-js-lib-app-popstatemanager)

If you are deciding how to design a restore flow, start here:

* what state should be written into history?
* what key should dispatch the restore?
* what fragment or page should be rebuilt?
* what should happen when the URL is invalid or stale?

Then let the lower-level manager stay generic.

---

## See also

* [Installation](./INSTALLATION.md)
* [Quick Start](./QUICKSTART.md)
* [Introduction](./INTRODUCTION.md)
* [README](../../README.md)
