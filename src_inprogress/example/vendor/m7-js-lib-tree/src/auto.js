/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
// auto.js
//
// Backward-compatible shim for legacy m7 usage.
// - v098 style: if global lib exists, auto-install into it.
// - v1 style: no global lib required; this file safely no-ops.
//
// For explicit/module installs, prefer importing install() directly.

import install, {
    treeNamespace,
    TreeInspector as TreeInspectorClass,
} from "./install.js";

const MOD = "[tree]";

const host = resolveHost();
const lib = host && host.lib ? host.lib : null;

let installResult = null;

if (lib) {
    installResult = install(lib, { host });
} else if (host && host.console && typeof host.console.warn === "function") {
    host.console.warn(`${MOD} auto.js: global lib not found; skipping auto-install.`);
}

const tree =
    installResult && installResult.namespace
        ? installResult.namespace
        : buildNamespace();

const TreeInspector = tree.TreeInspector || tree.cls || TreeInspectorClass;
const inspector =
    tree && typeof tree.inspector === "function" ? tree.inspector : undefined;
const openConsole =
    tree && typeof tree.openConsole === "function"
        ? tree.openConsole
        : tree && typeof tree.console === "function"
          ? tree.console
          : undefined;
const printTree =
    tree && typeof tree.printTree === "function" ? tree.printTree : undefined;

export { tree, TreeInspector, inspector, openConsole, printTree, install };
export default tree;

function buildNamespace() {
    const namespace =
        treeNamespace && typeof treeNamespace === "object"
            ? { ...treeNamespace }
            : {};

    namespace.cls = namespace.cls || TreeInspectorClass;
    namespace.TreeInspector = namespace.TreeInspector || namespace.cls;
    namespace.inspector =
        typeof namespace.inspector === "function" ? namespace.inspector : undefined;
    namespace.console =
        typeof namespace.console === "function" ? namespace.console : undefined;
    namespace.openConsole =
        typeof namespace.openConsole === "function"
            ? namespace.openConsole
            : namespace.console;

    return namespace;
}

function resolveHost() {
    if (typeof globalThis !== "undefined") return globalThis;
    if (typeof window !== "undefined") return window;
    if (typeof global !== "undefined") return global;
    return undefined;
}
