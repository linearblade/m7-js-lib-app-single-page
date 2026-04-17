# Introduction - m7-js-lib-app-single-page

[README](../../README.md) -> [Usage TOC](./TOC.md)

m7-js-lib-app-single-page exists to provide SPA-style navigation without collapsing the whole application into a router-owned framework.

The project is aimed at sites that already have server-rendered pages and want:

* delegated click handling for internal navigation
* partial-page fetch and swap behavior
* browser back and forward support
* service-oriented composition instead of hidden global boot logic

## Core idea

This project deliberately separates three concerns:

1. **History tracking**
   Owned by `app.popstatemanager`

2. **SPA service lifecycle**
   Owned by this project's `install()` layer

3. **Restore behavior**
   Owned by your application-level popstate handler

That separation matters. A history service should know how to store and dispatch state, but it should not guess what "restore this route" means for every application.

## Install vs basic

This project exposes two main entrypoints:

* `install(lib, opts)`
  Creates and registers a `SinglePageApp` service object. This is the generic installer.

* `basic(lib, opts)`
  Calls `install(...)`, then wires a baseline usable product: click handler, popstate handler, utility options, and startup. This is the "easy button" path.

The split lets you choose whether you want:

* a generic SPA service object to compose yourself
* a ready-to-use default setup

## Root vs host

Within this project:

* `root` refers to the document-side root
* `host` refers to the browser host object, usually `window`

This is built on top of `lib._env.root`, which is the runtime global root from m7 lib.

## Why popstate stays in the app layer

The most important design choice in this project is that the popstate handler belongs to the consuming application.

For example:

* one app may restore `#main` by fetching and swapping server-rendered HTML
* another may restore only a fragment
* another may restore tabs, filters, or dialog state without fetching a full page

The shared popstate manager should not own those decisions.

This repository includes:

* a reusable click handler factory in [../../src/handler/click.js](../../src/handler/click.js)
* a reusable popstate handler factory in [../../src/handler/popstate.js](../../src/handler/popstate.js)
* a baseline configuration path in [../../src/install/basic.js](../../src/install/basic.js)

But those are defaults, not the only valid model.

## Result

You get:

* SPA-like navigation without framework lock-in
* explicit service registration and dependency boundaries
* a clean place to customize restore behavior
* a standalone bundle path when you want the whole stack prewired

---

## See also

* [Installation](./INSTALLATION.md)
* [Quick Start](./QUICKSTART.md)
* [Click and Popstate Handlers](./POPSTATE_HANDLERS.md)
* [README](../../README.md)
