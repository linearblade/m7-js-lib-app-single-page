const MOD = "[app.history.State]";

function normalizeStatePos(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return 0;
    }

    return Math.max(0, Math.trunc(next));
}

function normalizeObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

class State {
    constructor({lib, history, conf = {}, identifier} = {}) {
        this.lib = lib ?? null;
        this.history = history ?? null;

        if (!this.lib || !this.lib.hash || typeof this.lib.hash.to !== "function" || typeof this.lib.hash.merge !== "function") {
            throw new Error(`${MOD} requires lib.hash.to and lib.hash.merge.`);
        }

        if (!this.history || typeof this.history.set !== "function" || typeof this.history.push !== "function") {
            throw new Error(`${MOD} requires a history helper with set() and push().`);
        }

        this.conf = Object.assign(
            {
                stateKey: "spa",
                last: null,
            },
            normalizeObject(conf)
        );

        if (!this.conf.stateKey) {
            this.conf.stateKey = "spa";
        }

        this.identifier = identifier || new Date().toString();
    }

    get statePos() {
        return this.history.statePos;
    }

    set statePos(value) {
        this.history.statePos = normalizeStatePos(value);
    }

    get stateStack() {
        return this.history.stateStack;
    }

    get urlHistory() {
        return this.history.urlHistory;
    }

    resolveHost() {
        return this.history && this.history.host ? this.history.host : null;
    }

    resolveLocation() {
        const host = this.resolveHost();
        return host && host.location ? host.location : null;
    }

    resolveHistory() {
        const host = this.resolveHost();
        return host && host.history ? host.history : null;
    }

    buildEnvelope({type = "spa", url = "", previous = null, state = {}, pos = null, history = null} = {}) {
        const nextState = this.lib.hash.to(state);
        const nextPos = pos === null || pos === undefined ? this.statePos : normalizeStatePos(pos);
        const nextHistory = Array.isArray(history) ? history.slice() : this.urlHistory.slice();

        return this.lib.hash.merge(
            {
                history: nextHistory,
                type,
                url,
                previous,
                id: this.identifier,
                pos: nextPos,
            },
            nextState
        );
    }

    buildPageState(nextState) {
        const historyObj = this.resolveHistory();
        const pageState = historyObj && typeof historyObj.state === "object"
            ? Object.assign({}, historyObj.state)
            : {};

        pageState[this.conf.stateKey] = nextState;
        return pageState;
    }

    set(state) {
        const locationObj = this.resolveLocation();
        if (!locationObj || typeof locationObj.href !== "string") {
            throw new Error(`${MOD} requires a host location with href.`);
        }

        const nextState = this.buildEnvelope({
            type: "start",
            url: locationObj.href,
            previous: null,
            state,
            pos: this.statePos,
        });

        const pageState = this.buildPageState(nextState);
        this.history.set(pageState, {
            title: null,
            url: locationObj.href,
        });

        return nextState;
    }

    push(url, title = "", state) {
        const locationObj = this.resolveLocation();
        if (!locationObj || typeof locationObj.href !== "string") {
            throw new Error(`${MOD} requires a host location with href.`);
        }

        if (url === undefined || url === null) {
            throw new Error(`${MOD} push(url) requires a url.`);
        }

        const previousURL = locationObj.href.toString();
        const nextState = this.buildEnvelope({
            type: "spa",
            url,
            previous: previousURL,
            state,
            pos: this.statePos + 1,
            history: this.urlHistory.concat(previousURL),
        });

        this.conf.last = url;

        const pageState = this.buildPageState(nextState);
        this.history.push(url, title, pageState);
        return nextState;
    }
}

export default State;
export { State };
