const MOD = "[app.history.State]";

function normalizeStatePos(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return 0;
    }

    return Math.max(0, Math.trunc(next));
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

        const confObj = this.lib.hash.to(conf);
        this.conf = this.lib.hash.merge(
            confObj,
            {
                stateKey: confObj.stateKey || "spa", // this is our sandbox
                last: null,
            }
        );

        this.identifier = identifier || new Date().toString();
    }

    buildEnvelope({type = "spa", url = "", previous = null, state = {}, pos = null, history = null} = {}) {
        const nextState = this.lib.hash.to(state);
        const nextPos = pos === null || pos === undefined ? this.history.statePos : normalizeStatePos(pos);
        const nextHistory = Array.isArray(history) ? history.slice() : this.history.urlHistory.slice();

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
        const host = this.history.host;
        const historyObj = host && host.history ? host.history : null;
        const pageState = historyObj && typeof historyObj.state === "object"
            ? Object.assign({}, historyObj.state)
            : {};

        pageState[this.conf.stateKey] = nextState;
        return pageState;
    }

    set(state) {
        const host = this.history.host;
        const locationObj = host && host.location ? host.location : null;
        if (!locationObj || typeof locationObj.href !== "string") {
            throw new Error(`${MOD} requires a host location with href.`);
        }

        const nextState = this.buildEnvelope({
            type: "start",
            url: locationObj.href,
            previous: null,
            state,
            pos: this.history.statePos,
        });

        const pageState = this.buildPageState(nextState);
        this.history.set(pageState, {
            title: null,
            url: locationObj.href,
        });

        return nextState;
    }

    push(url, title = "", state) {
        const host = this.history.host;
        const locationObj = host && host.location ? host.location : null;
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
            pos: this.history.statePos + 1,
            history: this.history.urlHistory.concat(previousURL),
        });

        this.conf.last = url;

        const pageState = this.buildPageState(nextState);
        this.history.push(url, title, pageState);
        return nextState;
    }
}

export default State;
export { State };
