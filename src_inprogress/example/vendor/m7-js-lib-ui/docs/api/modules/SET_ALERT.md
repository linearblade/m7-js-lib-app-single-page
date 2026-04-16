# ui.design.v1.setAlert API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.design.v1.setAlert](./SET_ALERT.md)

Namespace: `lib.ui.design.v1.setAlert`

## Surface

```js
setAlert(e: Element, text?: any, type?: string): void
```

## Purpose

Convenience helper for alerts scoped to the nearest `[role=group]`.

## How To Use

```html
<div role="group">
  <div class="alert d-hidden"></div>
  <input id="email" />
</div>
```

```js
const input = document.getElementById("email");
lib.ui.design.v1.setAlert(input, "Invalid email", "warning");
```

## Notes

- Validates element with `lib.dom.is`.
- Normalizes `type` to `alert-*` class.
- Falsy `text` hides the alert by convenience.
