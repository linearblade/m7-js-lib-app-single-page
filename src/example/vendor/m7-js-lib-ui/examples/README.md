# Examples

[README](../README.md) -> [Examples](./README.md)

This directory contains runnable/reference markup and baseline styling for `m7-js-lib-ui` services.

## Files

- `modal.php`
  - copied from `www.m7.org/src/assets/require/modal.php`
  - demonstrates `ui.proxy`, `ui.dialog`, and `ui.tabs` working together
- `m7-ui-services.minimal.css`
  - minimal class hooks expected by default service configs
  - includes dialog modal/backdrop/lock hooks and tab/collapse visibility hooks
- `TUTORIAL.md`
  - step-by-step tutorial for wiring and validating the modal example
- `navbar.php`
  - navbar service markup example (`ui.navbar`) with nested dropdowns
- `m7-ui-navbar.minimal.css`
  - minimal class hooks expected by `ui.navbar` default config
- `NAVBAR_TUTORIAL.md`
  - step-by-step tutorial for wiring and validating the navbar example

## Default class hooks covered

- `ui.dialog`: `modal-hidden`, `modal-visible`, `modal-content`, `modal-container`, `modal-lock`, `modal-backdrop`
- `ui.tabs`: `tab-hidden`, `selected`
- `ui.collapse`: `tab-hidden`
- `ui.proxy`: no required classes
- `ui.navbar`: `open`, `navbar-open`, `navbar-hover-open`, `navbar__dropdown--flip-left`, `navbar__dropdown--center`, `navbar__dropdown--measuring`
