const MOD = "[app.history.History]";

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

function currentWindow() {
    if (typeof window !== "undefined" && window && typeof window === "object") {
        return window;
    }

    return null;
}

class History {
    constructor({root = null, stateKey = "spa", identifier = null, autoSeed = false} = {}) {
        this.root = null;
        this.stateKey = normalizeText(stateKey) || "spa";
        this.identifier = normalizeText(identifier) || new Date().toString();
        this.records = [];
        this.urlHistory = [];
        this.statePos = -1;
        this.last = null;

        if (root) {
            this.setRoot(root);
        }

        if (autoSeed) {
            this.seed();
        }
    }

    setRoot(root = null) {
        this.root = normalizeHost(root);
        return this;
    }

    setHost(host = null) {
        return this.setRoot(host);
    }

    resolveRoot() {
        if (this.root) {
            return this.root;
        }

        return currentWindow();
    }

    resolveHost() {
        return this.resolveRoot();
    }

    resolveLocation() {
        const root = this.resolveRoot();
        return root && root.location ? root.location : null;
    }

    resolveHistory() {
        const root = this.resolveRoot();
        return root && root.history ? root.history : null;
    }

    setStateKey(stateKey = "spa") {
        this.stateKey = normalizeText(stateKey) || "spa";
        return this.stateKey;
    }

    current() {
        if (this.statePos < 0 || this.statePos >= this.records.length) {
            return null;
        }

        return this.records[this.statePos] || null;
    }

    currentUrl() {
        const current = this.current();
        if (current && current.url) {
            return current.url;
        }

        const location = this.resolveLocation();
        return location && typeof location.href === "string" ? location.href : "";
    }

    read() {
        const history = this.resolveHistory();
        const current = history && history.state && typeof history.state === "object"
            ? history.state[this.stateKey]
            : null;
        return current || this.current();
    }

    restore(record = null) {
        const next = normalizeObject(record);
        if (!next || !normalizeText(next.url)) {
            return null;
        }

        const pos = typeof next.pos === "number" && next.pos >= 0 ? next.pos : this.statePos;
        this.statePos = pos;

        if (Array.isArray(next.history)) {
            this.urlHistory.splice(0, this.urlHistory.length, ...next.history.slice());
        } else if (this.urlHistory.length > pos) {
            this.urlHistory.splice(pos);
        }

        if (this.records.length > pos + 1) {
            this.records.splice(pos + 1);
        }

        this.records[pos] = next;
        this.last = next.url;
        return next;
    }

    list() {
        return this.records.slice();
    }

    snapshot() {
        return {
            stateKey: this.stateKey,
            identifier: this.identifier,
            statePos: this.statePos,
            last: this.last,
            urlHistory: this.urlHistory.slice(),
            records: this.records.slice(),
        };
    }

    clear() {
        this.records.length = 0;
        this.urlHistory.length = 0;
        this.statePos = -1;
        this.last = null;
        return this;
    }

    resolveUrl(url = null) {
        const text = normalizeText(url);
        if (!text) {
            return "";
        }

        return text;
    }

    buildRecord({type = "spa", url = "", title = "", previous = null, state = {}, pos = null} = {}) {
        const currentUrl = this.resolveUrl(url) || this.currentUrl();
        const nextState = normalizeObject(state);
        const record = Object.assign(
            {
                history: this.urlHistory.slice(),
                type: normalizeText(type) || "spa",
                previous: previous,
                id: this.identifier,
                url: currentUrl,
                pos: pos === null || pos === undefined ? Math.max(this.statePos, 0) : pos,
            },
            nextState
        );

        if (normalizeText(title)) {
            record.title = normalizeText(title);
        }

        return record;
    }

    buildPageState(record) {
        const history = this.resolveHistory();
        const pageState = history && history.state && typeof history.state === "object"
            ? Object.assign({}, history.state)
            : {};

        pageState[this.stateKey] = record;
        return pageState;
    }

    sync(record, {title = "", replace = false} = {}) {
        const history = this.resolveHistory();
        const location = this.resolveLocation();
        if (!history || !location) {
            throw new Error(`${MOD} requires host.history and host.location.`);
        }

        const nextRecord = record && typeof record === "object" ? record : this.buildRecord({title});
        const pageState = this.buildPageState(nextRecord);
        const nextTitle = normalizeText(title);

        if (replace) {
            history.replaceState(pageState, nextTitle || null, nextRecord.url || location.href);
        } else {
            history.pushState(pageState, nextTitle || null, nextRecord.url || location.href);
        }

        return nextRecord;
    }

    seed(state = {}, title = "") {
        const location = this.resolveLocation();
        if (!location || typeof location.href !== "string") {
            throw new Error(`${MOD} requires a location with href.`);
        }

        const previous = null;
        const record = this.buildRecord({
            type: "start",
            url: location.href,
            title,
            previous,
            state,
            pos: this.statePos >= 0 ? this.statePos : 0,
        });

        this.statePos = 0;
        this.restore(record);
        this.sync(record, {title, replace: true});
        return record;
    }

    replace(url = null, title = "", state = {}) {
        const location = this.resolveLocation();
        if (!location || typeof location.href !== "string") {
            throw new Error(`${MOD} requires a location with href.`);
        }

        if (this.statePos < 0) {
            this.seed();
        }

        const current = this.current();
        const nextUrl = this.resolveUrl(url) || location.href;
        const record = this.buildRecord({
            type: current && current.type ? current.type : "spa",
            url: nextUrl,
            title,
            previous: current && Object.prototype.hasOwnProperty.call(current, "previous") ? current.previous : null,
            state,
            pos: this.statePos,
        });

        this.restore(record);
        this.sync(record, {title, replace: true});
        return record;
    }

    push(url = null, title = "", state = {}) {
        const location = this.resolveLocation();
        if (!location || typeof location.href !== "string") {
            throw new Error(`${MOD} requires a location with href.`);
        }

        if (this.statePos < 0) {
            this.seed();
        }

        const current = this.current();
        const nextUrl = this.resolveUrl(url);
        if (!nextUrl) {
            throw new Error(`${MOD} push(url) requires a url.`);
        }

        if (this.statePos < this.records.length - 1) {
            this.records.splice(this.statePos + 1);
        }

        if (this.statePos < this.urlHistory.length) {
            this.urlHistory.splice(this.statePos);
        }

        const previous = current && current.url ? current.url : location.href;
        this.urlHistory.push(previous);

        const nextPos = this.statePos + 1;
        const record = this.buildRecord({
            type: "spa",
            url: nextUrl,
            title,
            previous,
            state,
            pos: nextPos,
        });

        this.statePos = nextPos;
        this.restore(record);
        this.sync(record, {title, replace: false});
        return record;
    }
}

export default History;
export { History };
