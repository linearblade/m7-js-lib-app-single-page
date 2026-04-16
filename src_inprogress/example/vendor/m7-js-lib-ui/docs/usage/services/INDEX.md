# Service Guides

[README](../../../README.md) -> [Usage TOC](../TOC.md) -> [Service Guides](./INDEX.md)

These pages are user-facing guides for runtime UI services installed in `lib.service`.

Working reference pattern:

- `proxy` can forward to hidden/open/submit controls
- `dialog` owns modal open/close + backdrop
- `tabs` manages panel switching inside dialog content
- `navbar` manages delegated nav menu/dropdown behavior

`modal.php` reference mapping:

- `data-button-proxy` -> `ui.proxy`
- `data-dialog-trigger`, `data-dialog-close`, `aria-controls`, `aria-modal` -> `ui.dialog`
- `data-tab-trigger`, `role="tablist"`, `data-toggle-group`, `data-children` -> `ui.tabs`
- `ui.collapse` is not used in that modal example; it is for accordion/collapse flows
- minimal default class hooks stylesheet: `examples/m7-ui-services.minimal.css`

`navbar.php` reference mapping:

- `data-nav-trigger` / `m7-nav-trigger` -> `ui.navbar`
- `.navbar`, `.navbar__links`, `.navbar__dropdown`, `.navbar__dropdown--menu` -> `ui.navbar`
- minimal default class hooks stylesheet: `examples/m7-ui-navbar.minimal.css`

## Services

- [COLLAPSE.md](./COLLAPSE.md) - `ui.collapse`
- [TABS.md](./TABS.md) - `ui.tabs`
- [DIALOG.md](./DIALOG.md) - `ui.dialog`
- [PROXY.md](./PROXY.md) - `ui.proxy`
- [NAVBAR.md](./NAVBAR.md) - `ui.navbar`
