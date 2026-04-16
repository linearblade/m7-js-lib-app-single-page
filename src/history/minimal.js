function normalizeStatePos(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return 0;
    }

    return Math.max(0, Math.trunc(next));
}

class History {
    constructor({lib, host} = {}) {
        this.lib = lib ?? null;
        this.host = null;
        this.setHost(host);

        this.stateStack = [null];
        this.urlHistory = [];
        this.statePos = 0;
    }

    setHost(host = null) {
        if (!host || !host.location || !host.history) {
            throw new Error("History requires a host with location and history");
        }

        this.host = host;
        return this.host;
    }

    snapshot() {
        return {
            statePos: this.statePos,
            stateStack: this.stateStack.slice(),
            urlHistory: this.urlHistory.slice(),
        };
    }

    restore(options = null) {
        if (!options || typeof options !== "object" || Object.keys(options).length === 0) {
            return this.snapshot();
        }

        const hasStatePos = Object.prototype.hasOwnProperty.call(options, "statePos");
        const hasStateStack = Object.prototype.hasOwnProperty.call(options, "stateStack");
        const hasUrlHistory = Object.prototype.hasOwnProperty.call(options, "urlHistory");

        if (hasStatePos) {
            this.statePos = normalizeStatePos(options.statePos);
        }

        if (hasStateStack && Array.isArray(options.stateStack)) {
            this.stateStack.splice(0, this.stateStack.length, ...options.stateStack.slice());
        }

        if (hasUrlHistory && Array.isArray(options.urlHistory)) {
            this.urlHistory.splice(0, this.urlHistory.length, ...options.urlHistory.slice());
        } else if (hasStatePos && !hasUrlHistory) {
            this.urlHistory.length = this.statePos;
        } else if (hasUrlHistory && options.urlHistory === null) {
            this.urlHistory.length = 0;
        }

        return this.snapshot();
    }

    set(state, {url, title = null} = {}) {
        const historyObj = this.host.history;

        this.stateStack[this.statePos] = state;

        if (url === undefined || url === null) {
            historyObj.replaceState(state, title);
        } else {
            historyObj.replaceState(state, title, url);
        }

        return state;
    }

    push(url, title = "", state) {
        if (url === undefined || url === null) {
            throw new Error("History.push requires a url");
        }

        const historyObj = this.host.history;
        const previousURL = this.host.location.href.toString();

        if (this.statePos < this.stateStack.length - 1) {
            this.stateStack.splice(this.statePos + 1);
        }

        if (this.statePos < this.urlHistory.length) {
            this.urlHistory.splice(this.statePos);
        }

        this.urlHistory.push(previousURL);
        this.statePos += 1;
        this.stateStack[this.statePos] = state;

        historyObj.pushState(state, title, url);
        return state;
    }
}

export default History;
export { History };
