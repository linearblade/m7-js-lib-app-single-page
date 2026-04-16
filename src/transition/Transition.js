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
    constructor({root = null, history = null, popstate = null, env = null} = {}) {
        this.root = null;
        this.history = history || null;
        this.popstate = popstate || null;
        this.env = normalizeObject(env);
        this.routes = Object.create(null);
        this.listeners = [];
        this.last = null;

        if (root) {
            this.setRoot(root);
        }
    }

    setRoot(root = null) {
        this.root = normalizeHost(root);
        if (this.history && typeof this.history.setHost === "function") {
            this.history.setHost(this.root);
        }
        if (this.popstate && typeof this.popstate.setHost === "function") {
            this.popstate.setHost(this.root);
        }
        return this.root;
    }

    setHistory(history = null) {
        this.history = history || null;
        if (this.root && this.history && typeof this.history.setHost === "function") {
            this.history.setHost(this.root);
        }
        return this.history;
    }

    setPopstate(popstate = null) {
        this.popstate = popstate || null;
        if (this.root && this.popstate && typeof this.popstate.setHost === "function") {
            this.popstate.setHost(this.root);
        }
        return this.popstate;
    }

    setEnv(env = null) {
        this.env = normalizeObject(env);
        return this.env;
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

    record(record = null) {
        const next = normalizeObject(record);
        this.last = next;
        return next;
    }
}

export default Transition;
export { Transition };
