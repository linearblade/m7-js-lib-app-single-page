/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import { lib as sharedLib, init as initLib } from "../../../m7-js-lib/src/index.js";
import installEventDelegator from "../../../m7-js-lib-primitive-dom-eventdelegator/src/install.js";
import installPopStateManager from "../../../m7-js-lib-app-popstatemanager/src/install.js";
import { install as installSpa, basic as basicSpa } from "../install/index.js";

const MOD = "[app.standalone.install]";

function isObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
}

function asObject(value) {
    return isObject(value) ? value : {};
}

function isRootSpec(value) {
    return !!(
        isObject(value)
        && value.root
        && value.host
    );
}

function ensureLibReady(opts = {}) {
    opts = asObject(opts);
    const hasLibOverride = Object.prototype.hasOwnProperty.call(opts, "lib");
    const runtimeLib = hasLibOverride ? opts.lib : sharedLib;

    if (!isObject(runtimeLib)) {
        throw new Error(`${MOD} missing lib instance.`);
    }

    const needsInit = !runtimeLib._initialized || opts.forceInit === true;
    if (needsInit && runtimeLib !== sharedLib) {
        throw new Error(`${MOD} opts.lib must be pre-initialized (cannot auto-init external lib instance).`);
    }

    if (needsInit) {
        initLib({ force: !!opts.forceInit });
    }

    return runtimeLib;
}

function hasService(lib, serviceId) {
    if (!serviceId) {
        return false;
    }

    if (lib.service && typeof lib.service.get === "function") {
        const candidate = lib.service.get(serviceId);
        return candidate !== undefined && candidate !== null;
    }

    try {
        const list = lib.require && typeof lib.require.service === "function"
            ? lib.require.service(serviceId, { mod: MOD, die: false })
            : [];
        return Array.isArray(list) && list.length > 0;
    } catch (error) {
        return false;
    }
}

function resolveHost(lib, opts = {}) {
    if (isObject(opts.host) && opts.host.location && opts.host.history) {
        return opts.host;
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

function resolveRoot(lib, host = null, opts = {}) {
    if (opts.root && typeof opts.root.addEventListener === "function") {
        return opts.root;
    }

    const docFromEnv = lib && lib._env && lib._env.root && lib._env.root.document
        ? lib._env.root.document
        : null;
    if (docFromEnv && typeof docFromEnv.addEventListener === "function") {
        return docFromEnv;
    }

    if (host && host.document && typeof host.document.addEventListener === "function") {
        return host.document;
    }

    if (typeof document !== "undefined" && document && typeof document.addEventListener === "function") {
        return document;
    }

    return null;
}

function canAutoStartDelegator(root = null) {
    return !!(
        root &&
        typeof root.addEventListener === "function" &&
        typeof root.removeEventListener === "function"
    );
}

function buildEventDelegatorOptions(lib, opts = {}) {
    const host = resolveHost(lib, opts);
    const root = resolveRoot(lib, host, opts);

    return Object.assign(
        {},
        asObject(opts.eventDelegator),
        {
            host,
            root,
            start: canAutoStartDelegator(root),
        }
    );
}

function buildPopstateOptions(lib, opts = {}) {
    const host = resolveHost(lib, opts);
    const raw = asObject(opts.popstate);

    return Object.assign(
        {},
        raw,
        {
            host,
            start: false,
            conf: Object.assign(
                {
                    debug: opts.debug === true,
                },
                asObject(raw.conf)
            ),
        }
    );
}

function buildSpaOptions(lib, opts = {}) {
    const out = {};
    const skip = {
        lib: true,
        forceInit: true,
        eventDelegator: true,
        popstate: true,
        host: true,
    };

    for (const key of Object.keys(opts)) {
        if (skip[key]) {
            continue;
        }
        out[key] = opts[key];
    }

    const host = resolveHost(lib, opts);
    const root = resolveRoot(lib, host, opts);
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

function installServices(opts = {}) {
    const options = asObject(opts);
    const lib = ensureLibReady(options);

    if (!hasService(lib, "primitive.dom.eventdelegator")) {
        installEventDelegator(lib, buildEventDelegatorOptions(lib, options));
    }

    if (!hasService(lib, "app.popstatemanager")) {
        installPopStateManager(lib, buildPopstateOptions(lib, options));
    }

    return lib;
}

function install(opts = {}) {
    const options = asObject(opts);
    const lib = installServices(options);
    return installSpa(lib, buildSpaOptions(lib, options));
}

function basic(opts = {}) {
    const options = asObject(opts);
    const lib = installServices(options);
    return basicSpa(lib, buildSpaOptions(lib, options));
}

export { sharedLib as lib, initLib, installServices, install, basic };
export default install;
