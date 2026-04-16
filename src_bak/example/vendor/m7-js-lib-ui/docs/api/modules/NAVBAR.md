# ui.navbar API

[README](../../../README.md) -> [API Index](../INDEX.md) -> [Modules Index](./INDEX.md) -> [ui.navbar](./NAVBAR.md)

Service id: `ui.navbar`

Class definition: `lib.ui.service.NavbarService`

## Purpose

`ui.navbar` provides delegated navbar/dropdown behavior with one service contract.

Use it when you want configurable, self-service nav behavior across pages without tying behavior to a specific CSS framework.

## Surface

```js
{
  defaultConfig(): object,
  setConfig(conf: object): object,
  getConfig(): object,
  closeAll(): boolean,
  start(): boolean,
  stop(): boolean,
  isStarted(): boolean
}
```

## How To Use

```js
const navbar = lib.service.get("ui.navbar");

navbar.start();
navbar.setConfig({ dropBehaviorDefault: "auto" });
```

## Required Markup

- navbar root: `.navbar`
- links container: `.navbar__links`
- dropdown owner: `.navbar__dropdown`
- dropdown menu: `.navbar__dropdown--menu`
- trigger attrs: `[data-nav-trigger]` or `[m7-nav-trigger]`

## Expected Attributes (Default Config)

- `data-nav-trigger` or `m7-nav-trigger` on trigger controls
- `aria-controls="<menu-id>"` on trigger controls
- `aria-expanded="false"` initial trigger state (service updates it)
- optional per-element direction override:
  - `nav-drop-behavior`
  - `data-nav-drop-behavior`
  - `m7-nav-drop-behavior`

## Expected Classes (Default Config)

- `open`
- `navbar-open`
- `navbar-hover-open`
- `navbar__dropdown--flip-left`
- `navbar__dropdown--center`
- `navbar__dropdown--measuring`

## Trigger Value Semantics

Reserved values for trigger attribute:

- links toggle: `menu`, `links`, `navbar`, `navbar-links`, `toggle-links`
- close-all: `close`, `close-all`, `dismiss`, `dismiss-all`

Any other non-empty value is resolved as a target selector/id.

## Production Recommendations

For production-grade behavior parity across devices and accessibility expectations, prioritize:

1. Keyboard navigation and roving focus support.
2. Explicit focus lifecycle management on open/close.
3. Placement offset config (`dropOffsetX`, `dropOffsetY`) and edge padding controls.
4. Runtime hooks (`onOpen`, `onClose`, `onToggle`, `onResolveBehavior`).
5. Depth-aware sibling-close policy options.
6. Reduced-motion compliance (`prefers-reduced-motion`).
7. Mutation-aware placement recalculation for dynamic nav content.
8. End-to-end regression coverage for mobile overlap and direction override behavior.
