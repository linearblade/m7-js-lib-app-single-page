/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import { lib as bundledLib, init as initLib } from "../vendor/lib/m7.bundle.v1.0.0.min.js";
import { install as installEventDelegator } from "../vendor/eventDelegator/eventDelegator.bundle.v1.0.0.min.js";
import { install as installPopStateManager } from "../vendor/popStateManager/popStateManager.bundle.v1.0.0.min.js";
import { install as installSpa, basic as basicSpa } from "../install/index.js";

const MOD = "[app.standalone]";

function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function normalizeOptions(opts = {}) {
    return isObject(opts) ? opts : {};
}

function isRootSpec(value) {
    return !!(
        isObject(value)
        && value.root
        && value.host
    );
}

function resolveRuntimeLib(options = {}) {
    if (isObject(options.lib)) {
        return options.lib;
    }

    initLib({
        force: options.forceInit === true,
    });

    return bundledLib;
}

function resolveHost(lib, options = {}) {
    if (isObject(options.host) && options.host.location && options.host.history) {
        return options.host;
    }

    const bootRoot = lib && lib._env ? lib._env.root : null;
    if (bootRoot && bootRoot.location && bootRoot.history) {
        return bootRoot;
    }

    if (typeof window !== "undefined" && window && window.location && window.history) {
        return window;
    }

    return null;
}

function resolveRoot(host, options = {}) {
    if (options.root && typeof options.root.addEventListener === "function") {
        return options.root;
    }

    if (host && host.document && typeof host.document.addEventListener === "function") {
        return host.document;
    }

    if (typeof document !== "undefined" && document && typeof document.addEventListener === "function") {
        return document;
    }

    return null;
}

function buildSpaOptions(options = {}, host = null, root = null) {
    const out = {};
    const skip = {
        lib: true,
        forceInit: true,
        forceServices: true,
        host: true,
        eventDelegator: true,
        popstate: true,
    };

    for (const key of Object.keys(options)) {
        if (skip[key]) {
            continue;
        }
        out[key] = options[key];
    }

    if (out.root && !isRootSpec(out.root) && host) {
        out.root = {
            root: out.root,
            host,
        };
    } else if (!out.root && root && host) {
        out.root = {
            root,
            host,
        };
    }

    return out;
}

function buildEventDelegatorOptions(options = {}, host = null, root = null) {
    const raw = normalizeOptions(options.eventDelegator);

    return Object.assign(
        {},
        raw,
        {
            host,
            root,
            start: false,
        }
    );
}

function buildPopstateOptions(options = {}, host = null) {
    const raw = normalizeOptions(options.popstate);
    const conf = Object.assign(
        {
            debug: options.debug === true,
        },
        normalizeOptions(raw.conf)
    );

    return Object.assign(
        {},
        raw,
        {
            host,
            start: false,
            conf,
        }
    );
}

function installServices(opts = {}) {
    const options = normalizeOptions(opts);
    const lib = resolveRuntimeLib(options);
    const host = resolveHost(lib, options);
    const root = resolveRoot(host, options);

    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} unable to resolve a lib instance.`);
    }

    installEventDelegator(lib, buildEventDelegatorOptions(options, host, root));
    installPopStateManager(lib, buildPopstateOptions(options, host));

    return {
        lib,
        host,
        root,
    };
}

function install(opts = {}) {
    const options = normalizeOptions(opts);
    const runtime = installServices(options);
    const result = installSpa(runtime.lib, buildSpaOptions(options, runtime.host, runtime.root));

    return Object.assign(
        {
            lib: runtime.lib,
            host: runtime.host,
            root: runtime.root,
            standalone: true,
        },
        result
    );
}

function basic(opts = {}) {
    const options = normalizeOptions(opts);
    const runtime = installServices(options);
    const result = basicSpa(runtime.lib, buildSpaOptions(options, runtime.host, runtime.root));

    return Object.assign(
        {
            lib: runtime.lib,
            host: runtime.host,
            root: runtime.root,
            standalone: true,
        },
        result
    );
}

export { bundledLib as lib, initLib, installServices, install, basic };
export default {
    lib: bundledLib,
    initLib,
    installServices,
    install,
    basic,
};
