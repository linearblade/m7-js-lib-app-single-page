import History from "../history/History.js";
import Popstate from "../popstate/Popstate.js";

const MOD = "[app.transition.Transition]";

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function normalizeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeHost(value) {
    return value && typeof value === "object" ? value : null;
}

class Transition {
    constructor({root = null, history = null, popstate = null, controller = null, env = null, stateKey = "spa", identifier = null, autoStart = false, autoSeed = false} = {}) {
        this.root = null;
        this.controller = controller || null;
        this.env = normalizeObject(env);
        this.stateKey = normalizeText(stateKey) || "spa";
        this.history = history instanceof History ? history : new History({
            root,
            stateKey: this.stateKey,
            identifier: normalizeText(identifier) || null,
            autoSeed: false,
        });
        this.popstate = popstate instanceof Popstate ? popstate : new Popstate({
            root,
            autoStart: false,
        });
        this.identifier = normalizeText(identifier) || (this.history && this.history.identifier ? this.history.identifier : "");
        this.listeners = [];
        this.handlers = Object.create(null);
        this.handlerOrder = [];
        this.last = null;
        this.started = false;
        this.popstateOff = null;
        this.boundPopstateHandler = this.handlePopstate.bind(this);

        if (root) {
            this.setRoot(root);
        }

        this.bindPopstate();

        if (autoSeed) {
            this.seed();
        }

        if (autoStart) {
            this.start();
        }
    }

    setController(controller = null) {
        this.controller = controller || null;
        return this.controller;
    }

    setRoot(root = null) {
        this.root = normalizeHost(root);
        if (this.history && typeof this.history.setRoot === "function") {
            this.history.setRoot(this.root);
        }
        if (this.popstate && typeof this.popstate.setRoot === "function") {
            this.popstate.setRoot(this.root);
        }
        return this.root;
    }

    setHistory(history = null) {
        this.history = history instanceof History ? history : (history || null);
        if (this.root && this.history && typeof this.history.setRoot === "function") {
            this.history.setRoot(this.root);
        }
        if (this.history && typeof this.history.setStateKey === "function") {
            this.history.setStateKey(this.stateKey);
        }
        if (this.history && Object.prototype.hasOwnProperty.call(this.history, "identifier")) {
            this.identifier = this.history.identifier || this.identifier;
        }
        return this.history;
    }

    setPopstate(popstate = null) {
        this.unbindPopstate();
        this.popstate = popstate instanceof Popstate ? popstate : (popstate || null);
        if (this.root && this.popstate && typeof this.popstate.setRoot === "function") {
            this.popstate.setRoot(this.root);
        }
        this.bindPopstate();
        return this.popstate;
    }

    setEnv(env = null) {
        this.env = normalizeObject(env);
        return this.env;
    }

    setStateKey(stateKey = "spa") {
        this.stateKey = normalizeText(stateKey) || "spa";
        if (this.history && typeof this.history.setStateKey === "function") {
            this.history.setStateKey(this.stateKey);
        }
        return this.stateKey;
    }

    setIdentifier(identifier = null) {
        this.identifier = normalizeText(identifier) || (this.history && this.history.identifier ? this.history.identifier : "");
        if (this.history && Object.prototype.hasOwnProperty.call(this.history, "identifier")) {
            this.history.identifier = this.identifier;
        }
        return this.identifier;
    }

    register(key, handler) {
        const resolvedKey = normalizeText(key);
        if (!resolvedKey) {
            throw new Error(`${MOD} register(key, handler) requires a key.`);
        }

        if (typeof handler === "string" && this.controller && this.controller.lib && this.controller.lib.func && typeof this.controller.lib.func.get === "function") {
            handler = this.controller.lib.func.get(handler);
        }

        if (typeof handler !== "function") {
            throw new Error(`${MOD} register(key, handler) requires a function.`);
        }

        if (!Object.prototype.hasOwnProperty.call(this.handlers, resolvedKey)) {
            this.handlerOrder.push(resolvedKey);
        }

        this.handlers[resolvedKey] = handler;
        return handler;
    }

    unregister(key = null) {
        if (key === null) {
            this.handlers = Object.create(null);
            this.handlerOrder.length = 0;
            return this;
        }

        const resolvedKey = normalizeText(key);
        if (!resolvedKey || !Object.prototype.hasOwnProperty.call(this.handlers, resolvedKey)) {
            return this;
        }

        delete this.handlers[resolvedKey];
        const idx = this.handlerOrder.indexOf(resolvedKey);
        if (idx >= 0) {
            this.handlerOrder.splice(idx, 1);
        }
        return this;
    }

    resolveHandler(key = null) {
        const resolvedKey = normalizeText(key);
        if (resolvedKey && Object.prototype.hasOwnProperty.call(this.handlers, resolvedKey)) {
            return this.handlers[resolvedKey];
        }

        if (Object.prototype.hasOwnProperty.call(this.handlers, "default")) {
            return this.handlers.default;
        }

        if (Object.prototype.hasOwnProperty.call(this.handlers, "start")) {
            return this.handlers.start;
        }

        return null;
    }

    bindPopstate() {
        if (!this.popstate || typeof this.popstate.on !== "function") {
            return null;
        }

        if (!this.popstateOff) {
            this.popstateOff = this.popstate.on(this.boundPopstateHandler);
        }

        return this.popstateOff;
    }

    unbindPopstate() {
        if (typeof this.popstateOff === "function") {
            this.popstateOff();
        } else if (this.popstate && typeof this.popstate.off === "function") {
            this.popstate.off(this.boundPopstateHandler);
        }

        this.popstateOff = null;
        return this;
    }

    buildPopstateContext({event = null, currentURL = "", record = null, isSPA = "", popstateKey = "", rawState = null} = {}) {
        const controller = this.controller || null;
        const controllerEnv = controller && controller.env ? controller.env : {};
        const transitionEnv = this.env && typeof this.env === "object" ? this.env : {};

        return {
            lib: controller && controller.lib ? controller.lib : null,
            spa: controller,
            controller,
            transition: this,
            root: this.root,
            history: this.history,
            popstate: this.popstate,
            env: {
                global: controllerEnv,
                event: transitionEnv,
            },
            event,
            currentURL,
            state: record,
            rawState,
            isSPA,
            popstateKey,
        };
    }

    resolvePopstateRecord(ctx = null) {
        const next = ctx && typeof ctx === "object" ? ctx : {};
        const rawState = Object.prototype.hasOwnProperty.call(next, "state") ? next.state : null;
        if (!rawState || typeof rawState !== "object") {
            return null;
        }

        const record = rawState[this.stateKey];
        if (!record || typeof record !== "object") {
            return null;
        }

        return record;
    }

    on(handler) {
        if (typeof handler !== "function") {
            throw new Error(`${MOD} on(handler) requires a function.`);
        }

        if (this.listeners.indexOf(handler) < 0) {
            this.listeners.push(handler);
        }

        return () => this.off(handler);
    }

    off(handler = null) {
        if (handler === null) {
            this.listeners.length = 0;
            return this;
        }

        const idx = this.listeners.indexOf(handler);
        if (idx >= 0) {
            this.listeners.splice(idx, 1);
        }

        return this;
    }

    emit(type, detail = null) {
        const payload = {
            type: normalizeText(type) || "transition",
            detail: normalizeObject(detail),
            root: this.root,
            controller: this.controller,
            history: this.history,
            popstate: this.popstate,
            env: this.env,
            last: this.last,
        };

        const listeners = this.listeners.slice();
        for (const handler of listeners) {
            handler(payload);
        }

        return payload;
    }

    snapshot() {
        return {
            root: this.root,
            controller: this.controller,
            stateKey: this.stateKey,
            identifier: this.identifier,
            env: this.env,
            history: this.history && typeof this.history.snapshot === "function" ? this.history.snapshot() : null,
            popstate: this.popstate && typeof this.popstate.started === "boolean" ? {
                started: this.popstate.started,
                listeners: Array.isArray(this.popstate.listeners) ? this.popstate.listeners.length : 0,
            } : null,
            last: this.last,
            started: this.started,
            handlers: this.handlerOrder.slice(),
        };
    }

    current() {
        return this.history && typeof this.history.current === "function" ? this.history.current() : null;
    }

    read() {
        return this.history && typeof this.history.read === "function" ? this.history.read() : null;
    }

    seed(state = {}, title = "") {
        if (!this.history || typeof this.history.seed !== "function") {
            return null;
        }

        const record = this.history.seed(state, title);
        this.last = record;
        this.emit("seed", {
            record,
            title,
        });
        return record;
    }

    set(state = {}, title = "") {
        return this.seed(state, title);
    }

    push(url = null, title = "", state = {}) {
        if (!this.history || typeof this.history.push !== "function") {
            return null;
        }

        const record = this.history.push(url, title, state);
        this.last = record;
        this.emit("push", {
            record,
            url,
            title,
            state,
        });
        return record;
    }

    replace(url = null, title = "", state = {}) {
        if (!this.history || typeof this.history.replace !== "function") {
            return null;
        }

        const record = this.history.replace(url, title, state);
        this.last = record;
        this.emit("replace", {
            record,
            url,
            title,
            state,
        });
        return record;
    }

    handlePopstate(ctx = null) {
        const nextCtx = ctx && typeof ctx === "object" ? ctx : {};
        const rawState = Object.prototype.hasOwnProperty.call(nextCtx, "state") ? nextCtx.state : null;
        const record = this.resolvePopstateRecord(nextCtx);
        if (!record) {
            return null;
        }
        const historyIdentifier = this.history && this.history.identifier ? this.history.identifier : this.identifier;
        if (record.id && historyIdentifier && record.id !== historyIdentifier) {
            return null;
        }
        const currentURL = normalizeText(nextCtx.currentURL || nextCtx.url || (nextCtx.location && nextCtx.location.href) || "");
        if (currentURL && record.url && currentURL !== record.url) {
            return null;
        }
        const isSPA = record && record.type ? String(record.type) : "";
        const popstateKey = record && Object.prototype.hasOwnProperty.call(record, "popstate") ? record.popstate : "";
        const handler = this.resolveHandler(popstateKey);
        const handlerContext = this.buildPopstateContext({
            event: nextCtx.event || null,
            currentURL,
            record,
            isSPA,
            popstateKey,
            rawState,
        });

        if (record && this.history && typeof this.history.restore === "function") {
            this.history.restore(record);
        }

        let handlerResult = null;
        if (handler) {
            handlerResult = handler(nextCtx.event || null, currentURL, handlerContext);
        }

        this.last = record || this.last;
        const payload = {
            type: "popstate",
            root: this.root,
            controller: this.controller,
            history: this.history,
            popstate: this.popstate,
            env: this.env,
            last: this.last,
            record,
            ctx: nextCtx,
            currentURL,
            isSPA,
            popstateKey,
            handlerResult,
        };

        this.emit("popstate", payload);

        return payload;
    }

    start() {
        this.started = true;
        if (this.popstate && typeof this.popstate.start === "function") {
            this.popstate.start();
        }
        return this;
    }

    stop() {
        if (this.popstate && typeof this.popstate.stop === "function") {
            this.popstate.stop();
        }
        this.started = false;
        return this;
    }
}

export default Transition;
export { Transition };
