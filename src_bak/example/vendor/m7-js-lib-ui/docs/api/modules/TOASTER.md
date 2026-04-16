# ui.toaster API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.toaster](./TOASTER.md)

Namespace: `lib.ui.toaster`

## Surface

```js
{
  defaultConfig(): object,
  setConfig(conf: object): void,
  getConfig(): object,
  set(e: Element, text?: any, type?: string, opts?: { innerHTML?: boolean }): void
}
```

## Purpose

Sets alert/toast message text inside a grouped UI region and toggles visibility/classes.

## How To Use

```js
const saveButton = document.querySelector("[data-save]");
lib.ui.toaster.set(saveButton, "Saved", "alert-success");
```

Trusted HTML mode:

```js
lib.ui.toaster.set(saveButton, "<b>Saved</b>", "alert-success", {
  innerHTML: true,
});
```

## Notes

- Default render path uses `innerText`.
- `opts.innerHTML === true` is opt-in and should only be used with trusted strings.
- Falsy `text` hides the target alert container by convenience.
