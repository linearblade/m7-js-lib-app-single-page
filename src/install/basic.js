/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import createClickHandler from "../handler/click.js";
import createPopStateHandler from "../handler/popstate.js";

const MOD = "[app.install.basic]";

function normalizeOptions(opts = {}) {
    const raw = opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};

    return {
        env: raw.env && typeof raw.env === "object" ? raw.env : null,
        listeners: raw.listeners,
        popstates: raw.popstates,
        linkSelector: raw.linkSelector || "a.spa-link[href]",
        sourceSelector: raw.sourceSelector || "#main",
        targetSelector: raw.targetSelector || "#main",
        popstateKey: raw.popstateKey || "spa-link",
        trackCurrent: raw.trackCurrent !== false,
        updateTitle: raw.updateTitle !== false,
        debug: raw.debug === true,
        statusSelector: raw.statusSelector || null,
        requestOptions: raw.requestOptions && typeof raw.requestOptions === "object" ? raw.requestOptions : {},
        scriptReload: Object.prototype.hasOwnProperty.call(raw, "scriptReload")
            ? raw.scriptReload
            : (Object.prototype.hasOwnProperty.call(raw, "reloadScripts") ? raw.reloadScripts : null),
        utils: raw.utils && typeof raw.utils === "object" ? raw.utils : {},
        options: raw.options && typeof raw.options === "object" ? raw.options : {},
        log: typeof raw.log === "function" ? raw.log : null,
        status: typeof raw.status === "function" ? raw.status : null,
    };
}

function assertSpa(spa) {
    if (!spa || typeof spa !== "object") {
        throw new Error(`${MOD} configure(spa) requires a spa instance object.`);
    }

    if (typeof spa.registerListeners !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.registerListeners(...).`);
    }

    if (typeof spa.registerPopstates !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.registerPopstates(...).`);
    }

    if (typeof spa.setEnv !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.setEnv(...).`);
    }

    if (typeof spa.setUtils !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.setUtils(...).`);
    }

    if (typeof spa.on !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.on().`);
    }

    if (!spa.popstate || typeof spa.popstate.set !== "function") {
        throw new Error(`${MOD} configure(spa) requires spa.popstate.set(...).`);
    }

    return spa;
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

function buildUtilityOptions(options) {
    return Object.assign(
        {
            sourceSelector: options.sourceSelector,
            targetSelector: options.targetSelector,
            popstateKey: options.popstateKey,
            updateTitle: options.updateTitle,
            requestOptions: options.requestOptions,
            scriptReload: options.scriptReload,
            statusSelector: options.statusSelector,
        },
        options.options || {},
        options.utils || {}
    );
}

function configure(spa, opts = {}) {
    const target = assertSpa(spa);
    const options = normalizeOptions(opts);
    const log = options.log || createLogger(options.debug);
    const status = options.status || createStatusReporter(options.statusSelector);

    log("configure start", {
        linkSelector: options.linkSelector,
        sourceSelector: options.sourceSelector,
        targetSelector: options.targetSelector,
        popstateKey: options.popstateKey,
        trackCurrent: options.trackCurrent,
    });
    status("SPA ready");

    const env = Object.assign({}, options.env || {}, {
        popstateKey: options.popstateKey,
        statusSelector: options.statusSelector,
    });

    target.setEnv(env);
    target.setUtils({
        options: buildUtilityOptions(options),
        log,
        status,
    });

    const clickHandler = createClickHandler({
        spa: target,
        log,
        status,
        options,
        popstateKey: options.popstateKey,
        mod: MOD,
    });

    const popstateHandler = createPopStateHandler({
        spa: target,
        log,
        status,
        popstateKey: options.popstateKey,
        mod: MOD,
    });

    target.registerListeners({
        selector: options.linkSelector,
        handler: clickHandler,
        popstate: options.popstateKey,
    });

    target.registerPopstates({
        [options.popstateKey]: popstateHandler,
    });

    target.registerListeners(options.listeners);
    target.registerPopstates(options.popstates);

    target.on();
    if (options.trackCurrent) {
        target.popstate.set({
            popstate: options.popstateKey,
        });
    }

    log("configure complete");

    return target;
}

export { configure };
export default {
    configure,
};
