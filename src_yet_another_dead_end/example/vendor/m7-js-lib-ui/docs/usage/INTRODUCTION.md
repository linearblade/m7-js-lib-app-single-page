# Introduction

[README](../../README.md) -> [Usage TOC](./TOC.md) -> [Introduction](./INTRODUCTION.md)

`m7-js-lib-ui` is a DOM behavior layer for `m7-js-lib` with a service-first runtime model.

## Installed Surfaces

Core helpers:

- `lib.ui.chain`
- `lib.ui.design.v1.setAlert`
- `lib.ui.toaster`

Class definitions:

- `lib.ui.service.CollapseService`
- `lib.ui.service.TabsService`
- `lib.ui.service.DialogService`
- `lib.ui.service.ProxyService`
- `lib.ui.service.NavbarService`

Runtime service ids:

- `ui.collapse`
- `ui.tabs`
- `ui.dialog`
- `ui.proxy`
- `ui.navbar`

## Design Intent

- explicit installer lifecycle
- service instances live in `lib.service`
- class definitions live in `lib.ui.service`
- startup handled by install policy

## Next

Read [QUICKSTART.md](./QUICKSTART.md), then [INSTALLATION.md](./INSTALLATION.md), then [services/INDEX.md](./services/INDEX.md).
