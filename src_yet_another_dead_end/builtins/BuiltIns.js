import builtinDefs, { defineBuiltin } from "./defs/index.js";

const MOD = "[app.SinglePageApp.builtins.BuiltIns]";

function normalizeWorkspace(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function resolveKey(value) {
    if (!value) {
        return "";
    }

    if (typeof value === "string") {
        return normalizeText(value);
    }

    if (typeof value === "object") {
        return normalizeText(value.name)
            || normalizeText(value.kind)
            || normalizeText(value.selector)
            || normalizeText(value.trigger);
    }

    return "";
}

function normalizeBool(value) {
    return value === true;
}

class BuiltIns {
    constructor({controller = null, defs = builtinDefs, env = null} = {}) {
        this.controller = controller || null;
        this.defs = Array.isArray(defs) ? defs.slice() : [];
        this.registry = Object.create(null);
        this.order = [];
        this.entries = Object.create(null);
        this.enabled = false;
        this.env = {
            global: normalizeWorkspace(env),
            event: Object.create(null),
        };

        this.install(this.defs);
    }

    setController(controller = null) {
        const next = controller || null;
        if (next === this.controller) {
            return this;
        }

        const wasEnabled = this.enabled;
        if (wasEnabled) {
            this.detach();
        }

        this.controller = next;

        if (wasEnabled && this.controller) {
            this.attach();
        }

        return this;
    }

    setEnv(env = null) {
        const workspace = normalizeWorkspace(env);
        this.env.global = workspace;

        if (this.controller && typeof this.controller === "object") {
            this.controller.env = workspace;
        }

        return workspace;
    }

    setBuiltinEnv(name, env = null) {
        const key = resolveKey(name);
        if (!key) {
            throw new Error(`${MOD} setBuiltinEnv requires a builtin name.`);
        }

        this.env.event[key] = normalizeWorkspace(env);
        return this.env.event[key];
    }

    getBuiltinEnv(name) {
        const key = resolveKey(name);
        if (!key) {
            return null;
        }

        return this.env.event[key] || null;
    }

    buildEnv(name, eventEnv = null) {
        const key = resolveKey(name);
        const globalEnv = this.controller && this.controller.env ? this.controller.env : this.env.global;
        const storedEnv = key ? (this.getBuiltinEnv(key) || {}) : {};
        const baseEvent = eventEnv !== null && eventEnv !== undefined
            ? normalizeWorkspace(eventEnv)
            : {};

        return {
            global: globalEnv || {},
            event: Object.assign({}, baseEvent, storedEnv),
        };
    }

    normalizeDef(def) {
        if (!def || typeof def !== "object") {
            throw new Error(`${MOD} builtin definitions must be objects.`);
        }

        const normalized = Object.assign({}, def);
        const trigger = normalizeText(normalized.trigger);
        const selector = normalizeText(normalized.selector);
        const fn = normalized.fn || normalized.handler;

        if (!trigger) {
            throw new Error(`${MOD} builtin definition requires a trigger.`);
        }

        if (!selector) {
            throw new Error(`${MOD} builtin definition requires a selector.`);
        }

        if (typeof fn !== "function") {
            throw new Error(`${MOD} builtin definition requires a function.`);
        }

        const name = normalizeText(normalized.name) || normalizeText(normalized.kind) || selector || trigger;

        return defineBuiltin(trigger, fn, {
            selector,
            name,
            kind: normalizeText(normalized.kind) || name,
            description: typeof normalized.description === "string" ? normalized.description : "",
            env: normalized.env,
        });
    }

    register(def, {attach = this.enabled} = {}) {
        const normalized = this.normalizeDef(def);
        const key = resolveKey(normalized);

        if (!key) {
            throw new Error(`${MOD} builtin definition could not be keyed.`);
        }

        if (Object.prototype.hasOwnProperty.call(this.entries, key)) {
            this.detachBuiltin(key);
        }

        if (!Object.prototype.hasOwnProperty.call(this.registry, key)) {
            this.order.push(key);
        }

        this.registry[key] = normalized;

        if (attach && this.controller && this.controller.events && typeof this.controller.events.register === "function") {
            this.attachBuiltin(key);
        }

        return normalized;
    }

    registerMany(defs = [], opts = {}) {
        const items = Array.isArray(defs) ? defs : [defs];
        const out = [];
        for (const def of items) {
            if (!def) {
                continue;
            }
            out.push(this.register(def, opts));
        }
        return out;
    }

    update(name, patch = {}, {attach = this.enabled} = {}) {
        const key = resolveKey(name);
        if (!key || !Object.prototype.hasOwnProperty.call(this.registry, key)) {
            return null;
        }

        const current = this.registry[key];
        const next = this.normalizeDef(Object.assign({}, current, patch));
        this.registry[key] = next;

        if (Object.prototype.hasOwnProperty.call(this.entries, key)) {
            this.detachBuiltin(key);
        }

        if (attach && this.controller && this.controller.events && typeof this.controller.events.register === "function") {
            this.attachBuiltin(key);
        }

        return next;
    }

    remove(name) {
        const key = resolveKey(name);
        if (!key || !Object.prototype.hasOwnProperty.call(this.registry, key)) {
            return null;
        }

        const current = this.registry[key];

        if (Object.prototype.hasOwnProperty.call(this.entries, key)) {
            this.detachBuiltin(key);
        }

        delete this.registry[key];

        const index = this.order.indexOf(key);
        if (index >= 0) {
            this.order.splice(index, 1);
        }

        return current;
    }

    clearRegistry() {
        this.registry = Object.create(null);
        this.order = [];
        return this;
    }

    clear() {
        this.detach();
        this.clearRegistry();
        return this;
    }

    list() {
        return this.order
            .map((key) => this.registry[key])
            .filter(Boolean);
    }

    listActive() {
        return this.order
            .map((key) => this.entries[key])
            .filter(Boolean);
    }

    get(name) {
        const key = resolveKey(name);
        if (!key) {
            return null;
        }

        return this.registry[key] || null;
    }

    has(name) {
        const key = resolveKey(name);
        return !!key && Object.prototype.hasOwnProperty.call(this.registry, key);
    }

    makeRuntimeHandler(key) {
        const self = this;
        return async function runtimeHandler(evt, ctx = {}) {
            const def = self.registry[key];
            if (!def || typeof def.fn !== "function") {
                return null;
            }

            const nextCtx = ctx && typeof ctx === "object" ? Object.assign({}, ctx) : {};
            const env = self.buildEnv(key, nextCtx.env && nextCtx.env.event ? nextCtx.env.event : null);
            nextCtx.env = env;

            const result = await def.fn.call(this, evt, nextCtx);
            await self.applyRuntimeResult(key, result, nextCtx);
            return result;
        };
    }

    resolveRuntimePopstateKey(result = null, ctx = null) {
        const candidates = [
            result && result.popstateKey,
            ctx && ctx.popstateKey,
            ctx && ctx.env && ctx.env.global && ctx.env.global.popstateKey,
            ctx && ctx.env && ctx.env.event && ctx.env.event.popstateKey,
            this.controller && this.controller.env && this.controller.env.popstateKey,
        ];

        for (const candidate of candidates) {
            const key = normalizeText(candidate);
            if (key) {
                return key;
            }
        }

        return "";
    }

    resolveRuntimeTitle(result = null) {
        const candidates = [
            result && result.title,
            result && result.document && result.document.title,
        ];

        for (const candidate of candidates) {
            const title = normalizeText(candidate);
            if (title) {
                return title;
            }
        }

        return "";
    }

    async applyRuntimeResult(key, result, ctx = null) {
        if (!result || typeof result !== "object") {
            return null;
        }

        if (!normalizeBool(result.pushState) || result.bypass === true) {
            return null;
        }

        if (!this.controller || !this.controller.popstate || typeof this.controller.popstate.push !== "function") {
            return null;
        }

        const url = normalizeText(result.url);
        if (!url) {
            return null;
        }

        const popstateKey = this.resolveRuntimePopstateKey(result, ctx);
        if (!popstateKey) {
            return null;
        }

        const title = this.resolveRuntimeTitle(result);
        const state = result.state && typeof result.state === "object" ? Object.assign({}, result.state) : {};
        state.popstate = popstateKey;

        if (typeof document !== "undefined" && document && title) {
            document.title = title;
        }

        return this.controller.popstate.push(url, title, state);
    }

    attachBuiltin(name) {
        const key = resolveKey(name);
        if (!key) {
            return null;
        }

        const def = this.registry[key];
        if (!def) {
            return null;
        }

        if (!this.controller || !this.controller.events || typeof this.controller.events.register !== "function") {
            return null;
        }

        const runtimeHandler = this.makeRuntimeHandler(key);
        const entry = this.controller.events.register({
            selector: def.selector,
            eventType: def.trigger,
            handler: runtimeHandler,
            env: def.env,
            tag: def.name || def.kind || key,
            force: true,
        });

        this.entries[key] = {
            key,
            def,
            handler: def.fn,
            runtimeHandler,
            entry,
        };

        return this.entries[key];
    }

    detachBuiltin(name) {
        const key = resolveKey(name);
        if (!key) {
            return null;
        }

        const active = this.entries[key];
        if (!active) {
            return null;
        }

        if (active.entry && typeof active.entry.off === "function") {
            active.entry.off();
        } else if (this.controller && this.controller.events && typeof this.controller.events.unregister === "function") {
            this.controller.events.unregister({
                selector: active.def.selector,
                eventType: active.def.trigger,
                handler: active.runtimeHandler,
                tag: active.def.name || active.def.kind || key,
            });
        }

        delete this.entries[key];
        return active;
    }

    attach() {
        if (!this.controller || !this.controller.events || typeof this.controller.events.register !== "function") {
            this.enabled = true;
            return [];
        }

        this.detach();
        this.enabled = true;

        const out = [];
        for (const key of this.order) {
            const entry = this.attachBuiltin(key);
            if (entry) {
                out.push(entry);
            }
        }

        return out;
    }

    detach() {
        const keys = Object.keys(this.entries);
        const out = [];

        for (const key of keys) {
            const entry = this.detachBuiltin(key);
            if (entry) {
                out.push(entry);
            }
        }

        this.enabled = false;
        return out;
    }

    setEnabled(enabled = true) {
        if (enabled !== false) {
            this.attach();
        } else {
            this.detach();
        }

        return this.listActive();
    }

    install(defs = null) {
        if (defs !== null && defs !== undefined) {
            this.defs = Array.isArray(defs) ? defs.slice() : [defs];
        }

        const shouldAttach = this.enabled;
        this.detach();
        this.clearRegistry();
        this.registerMany(this.defs, {attach: false});
        this.enabled = shouldAttach;

        if (shouldAttach) {
            this.attach();
        }

        return this.list();
    }

    uninstall() {
        this.clear();
        this.enabled = false;
        return this;
    }
}

export { BuiltIns };
export default BuiltIns;
