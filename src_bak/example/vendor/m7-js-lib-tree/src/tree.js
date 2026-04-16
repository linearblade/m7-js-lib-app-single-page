/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import baseTreeNamespace, {
    cls as TreeInspectorClass,
    inspector as inspectorFactory,
    openConsole as openConsoleImpl,
} from "./TreeInspector.js";

const MOD = "[tree]";
let lastNamespace = null;

const ICONS = {
    object: "📁",
    array: "🔗",
    function: "ƒ",
    class: "🏛️",
    scalar: "❓",
    circular: "♻️",
};

export function make(lib) {
    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} make(lib) requires an m7-lib instance object.`);
    }

    const disp = buildStandaloneNamespace();
    lastNamespace = disp;
    return disp;
}

export default make;
export const TreeInspector = TreeInspectorClass;
export const treeNamespace = buildStandaloneNamespace();

export function inspector(...args) {
    return resolveNamespace().inspector(...args);
}

export function openConsole(...args) {
    return resolveNamespace().openConsole(...args);
}

export function printTree(...args) {
    return resolveNamespace().printTree(...args);
}

export const tree = {
    get cls() {
        return TreeInspectorClass;
    },
    get TreeInspector() {
        return TreeInspectorClass;
    },
    inspector: (...args) => resolveNamespace().inspector(...args),
    console: (...args) => resolveNamespace().console(...args),
    openConsole: (...args) => resolveNamespace().openConsole(...args),
    printTree: (...args) => resolveNamespace().printTree(...args),
};

function buildStandaloneNamespace() {
    const namespace =
        baseTreeNamespace && typeof baseTreeNamespace === "object"
            ? { ...baseTreeNamespace }
            : {};

    namespace.cls = TreeInspectorClass;
    namespace.TreeInspector = TreeInspectorClass;
    namespace.inspector = inspectorFactory;
    namespace.console = openConsoleImpl;
    namespace.openConsole = openConsoleImpl;
    namespace.printTree = printTreeImpl;

    return namespace;
}

function resolveNamespace() {
    if (lastNamespace && typeof lastNamespace === "object") {
        return lastNamespace;
    }

    throw new Error(`${MOD} requires an active lib instance. Call make(lib) or install(lib) first.`);
}

function logLine(log, text) {
    if (!log.text) log.text = "";
    log.text = `${log.text}${text}\n`;
}

function printTreeImpl(
    value,
    {
        name = "root",
        indent = "",
        seen = new WeakSet(),
        isLast = true,
        log = {},
    } = {},
) {
    const branch = indent ? (isLast ? "└─ " : "├─ ") : "";
    const nextIndent = indent + (isLast ? "   " : "│  ");

    let type = typeof value;
    const isClass =
        type === "function" &&
        /^class\s/.test(Function.prototype.toString.call(value));

    let icon = ICONS.scalar;

    if (value && type === "object") {
        if (seen.has(value)) {
            logLine(log, `${indent}${branch}${ICONS.circular} ${name}`);
            return log.text;
        }
        seen.add(value);
        icon = Array.isArray(value) ? ICONS.array : ICONS.object;
    } else if (type === "function") {
        icon = isClass ? ICONS.class : ICONS.function;
    }

    logLine(log, `${indent}${branch}${icon} ${name}`);

    if (value && type === "object") {
        const entries = Object.entries(value);
        entries.forEach(([key, val], index) => {
            printTreeImpl(val, {
                name: key,
                indent: nextIndent,
                seen,
                isLast: index === entries.length - 1,
                log,
            });
        });
    }

    return log.text;
}
