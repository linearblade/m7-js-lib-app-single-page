const MOD = "[app.popstate.Popstate]";

function normalizeHost(value) {
    return value && typeof value === "object" ? value : null;
}

class Popstate {
    constructor({root = null, autoStart = false} = {}) {
        this.root = null;
        this.started = false;
        this.listeners = [];
        this.listener = this.handleEvent.bind(this);

        if (root) {
            this.setRoot(root);
        }

        if (autoStart) {
            this.start();
        }
    }

    setRoot(root = null) {
        const next = normalizeHost(root);
        if (next === this.root) {
            return this;
        }

        const wasStarted = this.started;
        if (wasStarted) {
            this.stop();
        }

        this.root = next;

        if (wasStarted) {
            this.start();
        }

        return this;
    }

    setHost(host = null) {
        return this.setRoot(host);
    }

    resolveRoot() {
        if (this.root) {
            return this.root;
        }

        if (typeof window !== "undefined" && window && typeof window === "object") {
            return window;
        }

        return null;
    }

    resolveHost() {
        return this.resolveRoot();
    }

    start() {
        const root = this.resolveRoot();
        if (!root || typeof root.addEventListener !== "function") {
            return this;
        }

        if (this.started) {
            return this;
        }

        root.addEventListener("popstate", this.listener);
        this.started = true;
        return this;
    }

    stop() {
        const root = this.resolveRoot();
        if (root && typeof root.removeEventListener === "function") {
            root.removeEventListener("popstate", this.listener);
        }

        this.started = false;
        return this;
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

    clear() {
        this.listeners.length = 0;
        return this;
    }

    buildContext(event = null) {
        const root = this.resolveRoot();
        const location = root && root.location ? root.location : null;
        const history = root && root.history ? root.history : null;

        return {
            type: "popstate",
            event,
            state: event && Object.prototype.hasOwnProperty.call(event, "state") ? event.state : null,
            root,
            host: root,
            location,
            history,
            url: location && typeof location.href === "string" ? location.href : "",
        };
    }

    emit(event = null) {
        const ctx = this.buildContext(event);
        const listeners = this.listeners.slice();

        for (const handler of listeners) {
            handler(ctx);
        }

        return ctx;
    }

    handleEvent(event = null) {
        return this.emit(event);
    }
}

export default Popstate;
export { Popstate };
