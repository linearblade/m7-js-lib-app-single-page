# ui.chain API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.chain](./CHAIN.md)

Namespace: `lib.ui.chain`

## Surface

```js
{
  defaultConfig(): object,
  setConfig(conf: object): void,
  getConfig(): object,
  run(node: Element, attrName: string, ws?: object): any,
  runWith(node: Element, chain: string, ws?: object): any
}
```

## Purpose

Runs compact chain expressions that resolve and invoke functions.

Typical use is from attribute-driven UI modules (`data-toggle-on`, `data-toggle-off`).

## How To Use

```js
const chain = lib.ui.chain;
chain.runWith(button, "@console.log:clicked");
```

Run from an element attribute:

```html
<button data-on="my.namespace.fn:hello,world"></button>
```

```js
lib.ui.chain.run(button, "data-on");
```

## Notes

- Uses `lib.str.interp` for interpolation when available.
- Function resolution uses `lib.func.get`.
- Empty chain input returns `null`.
