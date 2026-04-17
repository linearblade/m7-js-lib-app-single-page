/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

const VERSION = typeof __SPA_VERSION__ !== "undefined"
    ? __SPA_VERSION__
    : "0.0.0-dev";

export { VERSION };
export default VERSION;
