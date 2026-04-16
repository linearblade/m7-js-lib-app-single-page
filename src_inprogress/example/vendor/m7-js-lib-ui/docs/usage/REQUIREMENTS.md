# Requirements

[README](../../README.md) -> [Usage TOC](./TOC.md) -> [Requirements](./REQUIREMENTS.md)

## Runtime

- ES module support
- browser DOM APIs (`document`, selectors, classList, events)

## Core dependency

- `m7-js-lib` 1.0 runtime with:
  - `lib.require`
  - `lib.service`
  - `lib.hash`
  - `lib.bool`
  - `lib.array`
  - `lib.args`
  - `lib.dom`
  - `lib.func`
  - `lib.str`
  - `lib.utils`

## Primitive dependency

- required: `primitive.dom.eventdelegator`
- optional (only if started via install option): `primitive.dom.changeobserver`

## Integration posture

- installer is explicit (`install(lib, opts?)`)
- no `auto.js` entrypoint
