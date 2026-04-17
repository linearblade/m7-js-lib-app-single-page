/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import SinglePageApp from "./SinglePageApp.js";
import createClickHandler from "./handler/click.js";
import createPopStateHandler from "./handler/popstate.js";
import { install as installPopStateManager } from "./vendor/popStateManager/popStateManager.bundle.v1.0.0.min.js";

const MOD = "[app.spa-install]";

function install(lib, opts = {}) {
    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} install(lib) requires an m7-lib instance object.`);
    }

    const options = normalizeOptions(opts);
    const log = createLogger(options.debug);
    const status = createStatusReporter(options.statusSelector);
    const previousSpa = lib.spa;
    if (previousSpa && typeof previousSpa.off === "function") {
        previousSpa.off();
    }

    ensurePopStateManager(lib, options);

    log("install start", {
        linkSelector: options.linkSelector,
        sourceSelector: options.sourceSelector,
        targetSelector: options.targetSelector,
        popstateKey: options.popstateKey,
        trackCurrent: options.trackCurrent,
    });
    status("SPA ready");

    const spa = new SinglePageApp({
        lib,
        builtins: options.builtins,
        autoStart: false,
    });

    spa.setEnv({
        popstateKey: options.popstateKey,
        statusSelector: options.statusSelector,
    });

    spa.setUtils({
        options,
        log,
        status,
    });

    const clickHandler = createClickHandler({
        spa,
        log,
        status,
        options,
        popstateKey: options.popstateKey,
        mod: MOD,
    });

    const popstateHandler = createPopStateHandler({
        spa,
        log,
        status,
        popstateKey: options.popstateKey,
        mod: MOD,
    });

    spa.registerListeners({
        selector: options.linkSelector,
        handler: clickHandler,
        popstate: options.popstateKey,
    });

    spa.registerPopstates({
        [options.popstateKey]: popstateHandler,
    });

    spa.on();
    if (options.trackCurrent) {
        spa.popstate.set({
            popstate: options.popstateKey,
        });
    }

    lib.spa = spa;
    log("install complete");
    return spa;
}

function ensurePopStateManager(lib, options = {}) {
    return installPopStateManager(lib, {
        host: resolveInstallHost(lib),
        start: false,
        conf: {
            debug: options.debug === true,
        },
    });
}

function resolveInstallHost(lib) {
    const bootRoot = lib && lib._env ? lib._env.root : null;
    if (bootRoot && bootRoot.location && bootRoot.history) {
        return bootRoot;
    }

    if (typeof window !== "undefined" && window && window.location && window.history) {
        return window;
    }

    return null;
}

function normalizeOptions(opts = {}) {
    const raw = opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};

    return {
        linkSelector: raw.linkSelector || "a.spa-link[href]",
        sourceSelector: raw.sourceSelector || "#main",
        targetSelector: raw.targetSelector || "#main",
        popstateKey: raw.popstateKey || "spa-link",
        trackCurrent: raw.trackCurrent !== false,
        updateTitle: raw.updateTitle !== false,
        debug: raw.debug === true,
        statusSelector: raw.statusSelector || null,
        builtins: Object.prototype.hasOwnProperty.call(raw, "builtins")
            ? raw.builtins
            : (Object.prototype.hasOwnProperty.call(raw, "builtin") ? raw.builtin : true),
        requestOptions: raw.requestOptions && typeof raw.requestOptions === "object" ? raw.requestOptions : {},
        scriptReload: Object.prototype.hasOwnProperty.call(raw, "scriptReload")
            ? raw.scriptReload
            : (Object.prototype.hasOwnProperty.call(raw, "reloadScripts") ? raw.reloadScripts : null),
    };
}

function createLogger(enabled) {
    if (!enabled) {
        return function noop() {};
    }

    return function log(message, details) {
        if (details !== undefined) {
            console.log(`${MOD} ${message}`, details);
            return;
        }
        console.log(`${MOD} ${message}`);
    };
}

function createStatusReporter(selector) {
    const rawSelector = typeof selector === "string" ? selector.trim() : "";
    if (!rawSelector) {
        return function noop() {};
    }

    return function reportStatus(message) {
        const doc = typeof document !== "undefined"
            ? document
            : (typeof window !== "undefined" && window.document ? window.document : null);
        if (!doc) {
            return;
        }

        const el = doc.querySelector(rawSelector);
        if (!el) {
            return;
        }

        const text = message == null ? "" : String(message);
        el.textContent = text;
        el.setAttribute("title", text);
    };
}

export { install };
export default {
    install,
};
