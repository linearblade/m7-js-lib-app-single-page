const MOD = "[app.popstate.Popstate]";

function normalizeHost(value) {
    return value && typeof value === "object" ? value : null;
}

class Popstate {
    constructor({host = null, autoStart = false} = {}) {
        this.host = null;
        this.started = false;
        this.listeners = [];
        this.listener = this.handleEvent.bind(this);

        if (host) {
            this.setHost(host);
        }

        if (autoStart) {
            this.start();
        }
    }

    setHost(host = null) {
        const next = normalizeHost(host);
        if (next === this.host) {
            return this;
        }

        const wasStarted = this.started;
        if (wasStarted) {
            this.stop();
        }

        this.host = next;

        if (wasStarted) {
            this.start();
        }

        return this;
    }

    resolveHost() {
        if (this.host) {
            return this.host;
        }

        if (typeof window !== "undefined" && window && typeof window === "object") {
            return window;
        }

        return null;
    }

    start() {
        const host = this.resolveHost();
        if (!host || typeof host.addEventListener !== "function") {
            return this;
        }

        if (this.started) {
            return this;
        }

        host.addEventListener("popstate", this.listener);
        this.started = true;
        return this;
    }

    stop() {
        const host = this.resolveHost();
        if (host && typeof host.removeEventListener === "function") {
            host.removeEventListener("popstate", this.listener);
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
        const host = this.resolveHost();
        const location = host && host.location ? host.location : null;
        const history = host && host.history ? host.history : null;

        return {
            type: "popstate",
            event,
            state: event && Object.prototype.hasOwnProperty.call(event, "state") ? event.state : null,
            host,
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
