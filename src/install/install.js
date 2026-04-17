import SinglePageApp from "../SinglePageApp.js";

const MOD = "[app.install]";
const NAMESPACE_ID = "app.SinglePageApp";
const SERVICE_ID = "app.singlepageapp";

function normalizeOptions(opts = {}) {
    const raw = opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};

    return {
        root: raw.root,
        env: raw.env && typeof raw.env === "object" ? raw.env : null,
        state: raw.state,
        builtins: Object.prototype.hasOwnProperty.call(raw, "builtins")
            ? raw.builtins
            : (Object.prototype.hasOwnProperty.call(raw, "builtin") ? raw.builtin : true),
        autoStart: false,
        utils: raw.utils && typeof raw.utils === "object" ? raw.utils : {},
        options: raw.options && typeof raw.options === "object" ? raw.options : {},
        log: typeof raw.log === "function" ? raw.log : null,
        status: typeof raw.status === "function" ? raw.status : null,
        force: raw.force === true,
    };
}

function readNamespace(lib) {
    if (!lib || !lib.hash || typeof lib.hash.get !== "function") {
        return {};
    }

    try {
        const namespace = lib.hash.get(lib, NAMESPACE_ID);
        return namespace && typeof namespace === "object" && !Array.isArray(namespace)
            ? namespace
            : {};
    } catch (error) {
        return {};
    }
}

function installNamespace(lib) {
    const namespace = readNamespace(lib);
    namespace.SinglePageApp = SinglePageApp;
    namespace.SERVICE_ID = SERVICE_ID;
    namespace.NAMESPACE_ID = NAMESPACE_ID;
    lib.hash.set(lib, NAMESPACE_ID, namespace);
    return namespace;
}

function existingService(lib) {
    if (!lib.service || typeof lib.service.get !== "function") {
        return null;
    }

    return lib.service.get(SERVICE_ID) || null;
}

function buildUtilityOptions(options) {
    return Object.assign(
        {},
        options.options || {},
        options.utils || {}
    );
}

function install(lib, opts = {}) {
    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} install(lib) requires an m7-lib instance object.`);
    }

    if (!lib.hash || typeof lib.hash.set !== "function") {
        throw new Error(`${MOD} install(lib) requires lib.hash.set.`);
    }

    const options = normalizeOptions(opts);
    const namespace = installNamespace(lib);
    const previousSpa = !options.force ? existingService(lib) || lib.spa || null : null;
    if (previousSpa && typeof previousSpa.off === "function") {
        previousSpa.off();
    }

    const spa = new SinglePageApp({
        lib,
        root: options.root,
        env: options.env,
        state: options.state,
        builtins: options.builtins,
        autoStart: options.autoStart,
    });

    spa.setUtils({
        options: buildUtilityOptions(options),
        log: options.log,
        status: options.status,
    });

    lib.spa = spa;

    if (lib.service && typeof lib.service.set === "function") {
        lib.service.set(SERVICE_ID, spa);
    }

    namespace.instance = spa;
    lib.hash.set(lib, NAMESPACE_ID, namespace);

    return {
        namespace,
        instance: spa,
        installedService: !!(lib.service && typeof lib.service.set === "function"),
    };
}

export { install, installNamespace, NAMESPACE_ID, SERVICE_ID };
export default {
    install,
    installNamespace,
    NAMESPACE_ID,
    SERVICE_ID,
};
