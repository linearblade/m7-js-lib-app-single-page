# ui.service API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.service](./SERVICE.md)

Namespace for class definitions: `lib.ui.service`

Runtime instances are installed in `lib.service`.

## Class Definitions

```js
lib.ui.service.CollapseService
lib.ui.service.TabsService
lib.ui.service.DialogService
lib.ui.service.ProxyService
lib.ui.service.NavbarService
```

## Runtime Service IDs

```js
ui.collapse
ui.tabs
ui.dialog
ui.proxy
ui.navbar
```

## Installer Config Mapping

```js
installUI(lib, {
  services: {
    collapse: { ... },
    tabs: { ... },
    dialog: { ... },
    proxy: { ... },
    navbar: { ... }
  }
});
```

## Common Service Methods

```js
{
  defaultConfig(): object,
  getConfig(): object,
  setConfig(conf): void,
  start(): boolean,
  stop(): boolean,
  isStarted(): boolean
}
```

## How To Use

```js
const dialog = lib.service.get("ui.dialog");

dialog.start();
dialog.triggerOpen(document.querySelector("[data-dialog-trigger]"));
dialog.stop();
```

## Lifecycle Note

Calling `service.start()` / `service.stop()` adds or removes only that service's tagged routes from the delegator.
It does not start or stop the delegator service itself.
