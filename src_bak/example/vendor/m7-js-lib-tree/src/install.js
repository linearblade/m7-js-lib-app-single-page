/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import makeTree, {
    tree,
    treeNamespace,
    TreeInspector,
    inspector,
    openConsole,
    printTree,
} from "./tree.js";

const MOD = "[tree]";
const SERVICE_ID = "tree";

/**
 * install(lib, opts?)
 *
 * m7-js-lib integration installer for tree inspector helpers.
 *
 * This package is a straightforward library module:
 * - Registers a helper namespace at `lib.tree`
 * - Does not install shared services
 *
 * @param {Object} lib
 * @param {Object} [opts]
 * @param {boolean} [opts.force=false]
 * @returns {{
 *   namespace: Object,
 *   instance: null,
 *   installedService: boolean
 * }}
 */
export function install(lib, opts = {}) {
    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} install(lib) requires an m7-lib instance object.`);
    }

    if (!lib.hash || typeof lib.hash.set !== "function") {
        throw new Error(`${MOD} install(lib) requires lib.hash.set.`);
    }

    const force = !!(opts && opts.force === true);
    const hasHashGet = !!(lib.hash && typeof lib.hash.get === "function");

    let existing = null;
    if (!force && hasHashGet) {
        try {
            existing = lib.hash.get(lib, SERVICE_ID);
        } catch (err) {
            existing = null;
        }
    }

    const namespace = buildNamespace(existing, lib);
    lib.hash.set(lib, SERVICE_ID, namespace);

    return {
        namespace,
        instance: null,
        installedService: false,
    };
}

export {
    makeTree,
    tree,
    treeNamespace,
    TreeInspector,
    inspector,
    openConsole,
    printTree,
    SERVICE_ID,
};
export default install;

function buildNamespace(existing = null, lib = null) {
    const namespace = {};
    const built = lib ? makeTree(lib) : null;

    if (existing && typeof existing === "object") {
        Object.assign(namespace, existing);
    }

    if (built && typeof built === "object") {
        Object.assign(namespace, built);
    } else if (treeNamespace && typeof treeNamespace === "object") {
        Object.assign(namespace, treeNamespace);
    }

    // Keep aliases explicit so old and new callers can use either naming style.
    namespace.cls = TreeInspector;
    namespace.TreeInspector = TreeInspector;
    namespace.inspector =
        built && typeof built.inspector === "function" ? built.inspector : inspector;
    namespace.console =
        built && typeof built.console === "function" ? built.console : openConsole;
    namespace.openConsole =
        built && typeof built.openConsole === "function"
            ? built.openConsole
            : openConsole;
    namespace.printTree =
        built && typeof built.printTree === "function" ? built.printTree : printTree;

    return namespace;
}
