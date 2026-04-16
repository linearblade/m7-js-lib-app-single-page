import SinglePageApp from "./SinglePageApp.js";
import { install as installPopStateManager } from "./vendor/popStateManager/popStateManager.bundle.v1.0.0.min.js";

const MOD = "[app.spa-install]";

function install(lib, opts = {}) {
    if (!lib || typeof lib !== "object") {
        throw new Error(`${MOD} install(lib) requires an m7-lib instance object.`);
    }

    if (!lib.request || typeof lib.request.send !== "function") {
        throw new Error(`${MOD} install(lib) requires lib.request.send.`);
    }

    const options = normalizeOptions(opts);
    const log = createLogger(options.debug);
    const status = createStatusReporter(options.statusSelector);
    const previousSpa = lib.spa;
    if (previousSpa && typeof previousSpa.off === "function") {
        previousSpa.off();
    }

    ensurePopStateManager(lib, options);

    log("install start", {
        linkSelector: options.linkSelector,
        sourceSelector: options.sourceSelector,
        targetSelector: options.targetSelector,
        popstateKey: options.popstateKey,
        trackCurrent: options.trackCurrent,
    });
    status("SPA ready");

    const spa = new SinglePageApp({
        lib,
        builtins: options.builtins,
        autoStart: false,
    });

    spa.setEnv({
        popstateKey: options.popstateKey,
        statusSelector: options.statusSelector,
    });

    attachHelpers(spa, lib, options, log, status);

    const clickHandler = async function (evt, ctx) {
        if (evt && evt.__m7SpaHandled) {
            return false;
        }

        const element = ctx && ctx.element ? ctx.element : this;
        const url = ctx && ctx.url ? ctx.url : null;

        if (!shouldHandleClick(evt, element)) {
            return false;
        }

        const resolvedUrl = spa.resolveUrl(url);
        if (!resolvedUrl) {
            log("click ignored", { url, reason: "unresolved-url" });
            return false;
        }

        const label = toStatusLabel(resolvedUrl);
        log("click", {
            selector: ctx && ctx.selector ? ctx.selector : options.linkSelector,
            url: resolvedUrl,
        });
        status(`Loading ${label}...`);

        if (evt && typeof evt.preventDefault === "function") {
            evt.preventDefault();
        }

        if (evt) {
            evt.__m7SpaHandled = true;
        }

        try {
            log("loadPage start", { url: resolvedUrl });
            await spa.loadPage(resolvedUrl, {
                pushState: true,
                popstateKey: ctx && ctx.popstateKey ? ctx.popstateKey : options.popstateKey,
                statusLabel: label,
            });
            log("loadPage done", { url: resolvedUrl });
        } catch (error) {
            console.error(`${MOD} click handler failed for '${resolvedUrl}':`, error);
            status(`Error loading ${label}`);
        }

        return false;
    };

    const popstateHandler = async function (evt, currentUrl) {
        const resolvedUrl = spa.resolveUrl(currentUrl);
        if (!resolvedUrl) {
            log("popstate ignored", { url: currentUrl, reason: "unresolved-url" });
            return false;
        }

        const label = toStatusLabel(resolvedUrl);
        status(`Restoring ${label}...`);

        try {
            log("popstate loadPage start", { url: resolvedUrl });
            await spa.loadPage(resolvedUrl, {
                pushState: false,
                popstateKey: options.popstateKey,
                statusLabel: label,
            });
            log("popstate loadPage done", { url: resolvedUrl });
        } catch (error) {
            console.error(`${MOD} popstate handler failed for '${resolvedUrl}':`, error);
            status(`Error restoring ${label}`);
        }

        return false;
    };

    spa.registerListeners({
        selector: options.linkSelector,
        handler: clickHandler,
        popstate: options.popstateKey,
    });

    spa.registerPopstates({
        [options.popstateKey]: popstateHandler,
    });

    spa.on();
    if (options.trackCurrent) {
        spa.popstate.set({
            popstate: options.popstateKey,
        });
    }

    lib.spa = spa;
    log("install complete");
    return spa;
}

function ensurePopStateManager(lib, options = {}) {
    return installPopStateManager(lib, {
        host: resolveInstallHost(lib),
        start: false,
        conf: {
            debug: options.debug === true,
        },
    });
}

function resolveInstallHost(lib) {
    const bootRoot = lib && lib._env ? lib._env.root : null;
    if (bootRoot && bootRoot.location && bootRoot.history) {
        return bootRoot;
    }

    if (typeof window !== "undefined" && window && window.location && window.history) {
        return window;
    }

    return null;
}

function normalizeOptions(opts = {}) {
    const raw = opts && typeof opts === "object" && !Array.isArray(opts) ? opts : {};

    return {
        linkSelector: raw.linkSelector || "a.spa-link[href]",
        sourceSelector: raw.sourceSelector || "#main",
        targetSelector: raw.targetSelector || "#main",
        popstateKey: raw.popstateKey || "spa-link",
        trackCurrent: raw.trackCurrent !== false,
        updateTitle: raw.updateTitle !== false,
        debug: raw.debug === true,
        statusSelector: raw.statusSelector || null,
        builtins: Object.prototype.hasOwnProperty.call(raw, "builtins")
            ? raw.builtins
            : (Object.prototype.hasOwnProperty.call(raw, "builtin") ? raw.builtin : true),
        requestOptions: raw.requestOptions && typeof raw.requestOptions === "object" ? raw.requestOptions : {},
    };
}

function attachHelpers(spa, lib, options, log, status) {
    spa.resolveUrl = resolveUrl;

    spa.fetchPage = async function fetchPage(url, requestOptions = {}) {
        const resolvedUrl = spa.resolveUrl(url);
        if (!resolvedUrl) {
            throw new Error(`${MOD} unable to resolve url '${url}'.`);
        }

        const envelope = makeRequestEnvelope(lib, resolvedUrl, {
            ...options.requestOptions,
            ...requestOptions,
        });

        log("fetchPage request", {
            url: resolvedUrl,
            method: envelope.method,
        });

        const response = await sendRequest(lib, envelope, resolvedUrl);
        log("fetchPage response", {
            url: resolvedUrl,
            status: response && typeof response.status === "number" ? response.status : null,
            ok: response && typeof response.ok === "boolean" ? response.ok : null,
            responseUrl: response && response.url ? response.url : null,
        });
        status(`Fetched ${toStatusLabel(resolvedUrl)}`);

        if (!isOkResponse(response)) {
            const status = response && typeof response.status === "number" ? response.status : 0;
            const statusText = response && response.statusText ? response.statusText : "Request failed";
            throw new Error(`${MOD} request failed for '${resolvedUrl}' (${status} ${statusText})`);
        }

        const html = extractHtml(response);
        if (!html) {
            throw new Error(`${MOD} empty response body for '${resolvedUrl}'.`);
        }

        const document = parseHtml(html);
        const responseUrl = response && response.url ? response.url : resolvedUrl;
        log("fetchPage parsed", {
            url: resolvedUrl,
            title: document && document.title ? document.title : "",
            bytes: html.length,
        });
        return {
            url: spa.resolveUrl(responseUrl) || resolvedUrl,
            response,
            html,
            document,
        };
    };

    spa.swapPage = function swapPage(payload, swapOptions = {}) {
        const document = payload && payload.document
            ? payload.document
            : (typeof payload === "string" ? parseHtml(payload) : null);

        if (!document) {
            throw new Error(`${MOD} swapPage requires an HTML document or HTML string.`);
        }

        const sourceSelector = swapOptions.sourceSelector || options.sourceSelector;
        const targetSelector = swapOptions.targetSelector || options.targetSelector;
        const updateTitle = swapOptions.updateTitle !== undefined
            ? !!swapOptions.updateTitle
            : options.updateTitle;

        const source = document.querySelector(sourceSelector);
        if (!source) {
            throw new Error(`${MOD} unable to find source '${sourceSelector}' in the fetched document.`);
        }

        const currentDoc = currentDocument();
        if (!currentDoc) {
            throw new Error(`${MOD} current document is not available.`);
        }

        const target = currentDoc.querySelector(targetSelector);
        if (!target) {
            throw new Error(`${MOD} unable to find target '${targetSelector}' in the current document.`);
        }

        log("swapPage start", {
            sourceSelector,
            targetSelector,
            title: document && document.title ? document.title : "",
        });
        status(`Swapping ${toStatusLabel(document && document.title ? document.title : sourceSelector)}...`);

        target.innerHTML = source.innerHTML;
        reloadScripts(target);

        if (updateTitle) {
            const title = document.title && String(document.title).trim();
            if (title) {
                currentDoc.title = title;
            }
        }

        if (typeof swapOptions.afterSwap === "function") {
            swapOptions.afterSwap({
                document,
                source,
                target,
                payload,
            });
        }

        log("swapPage done", {
            sourceSelector,
            targetSelector,
        });

        return {
            document,
            source,
            target,
        };
    };

    spa.loadPage = async function loadPage(url, loadOptions = {}) {
        const resolvedUrl = spa.resolveUrl(url);
        if (!resolvedUrl) {
            throw new Error(`${MOD} unable to resolve url '${url}'.`);
        }

        const payload = await spa.fetchPage(resolvedUrl, loadOptions.requestOptions || {});
        const swapResult = spa.swapPage(payload, loadOptions.swapOptions || {});
        const finalUrl = spa.resolveUrl(payload.url || resolvedUrl) || resolvedUrl;
        const currentDoc = currentDocument();
        const title = loadOptions.title !== undefined
            ? loadOptions.title
            : (swapResult.document.title || (currentDoc ? currentDoc.title : "") || "");

        if (loadOptions.pushState !== false) {
            log("pushState", {
                url: finalUrl,
                title,
                popstateKey: loadOptions.popstateKey || options.popstateKey,
            });
            spa.popstate.push(finalUrl, title, {
                popstate: loadOptions.popstateKey || options.popstateKey,
            });
        }

        status(`Loaded ${title || toStatusLabel(finalUrl)}`);

        if (typeof loadOptions.afterLoad === "function") {
            loadOptions.afterLoad({
                url: finalUrl,
                payload,
                swapResult,
                title,
            });
        }

        return {
            url: finalUrl,
            payload,
            swapResult,
            title,
        };
    };
}

function shouldHandleClick(evt, element) {
    if (!element) {
        return false;
    }

    if (evt && evt.defaultPrevented) {
        return false;
    }

    if (evt && typeof evt.button === "number" && evt.button !== 0) {
        return false;
    }

    if (evt && (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)) {
        return false;
    }

    if (typeof element.getAttribute === "function") {
        const target = element.getAttribute("target");
        if (target && target !== "_self") {
            return false;
        }

        if (element.hasAttribute && element.hasAttribute("download")) {
            return false;
        }
    }

    return true;
}

function resolveUrl(url, baseUrl) {
    const raw = typeof url === "string" ? url.trim() : "";
    if (!raw) {
        return null;
    }

    const base = baseUrl || currentLocationHref();

    try {
        const resolved = base ? new URL(raw, base) : new URL(raw);
        if (typeof window !== "undefined" && window.location && window.location.origin) {
            if (resolved.origin !== window.location.origin) {
                return null;
            }
        }
        return resolved.href;
    } catch (error) {
        return raw;
    }
}

function currentLocationHref() {
    if (typeof window !== "undefined" && window.location && window.location.href) {
        return window.location.href;
    }

    return null;
}

function createLogger(enabled) {
    if (!enabled) {
        return function noop() {};
    }

    return function log(message, details) {
        if (details !== undefined) {
            console.log(`${MOD} ${message}`, details);
            return;
        }
        console.log(`${MOD} ${message}`);
    };
}

function createStatusReporter(selector) {
    const rawSelector = typeof selector === "string" ? selector.trim() : "";
    if (!rawSelector) {
        return function noop() {};
    }

    return function reportStatus(message) {
        const doc = currentDocument();
        if (!doc) {
            return;
        }

        const el = doc.querySelector(rawSelector);
        if (!el) {
            return;
        }

        const text = message == null ? "" : String(message);
        el.textContent = text;
        el.setAttribute("title", text);
    };
}

function toStatusLabel(url) {
    const raw = typeof url === "string" ? url.trim() : "";
    if (!raw) {
        return "page";
    }

    try {
        const resolved = new URL(raw, currentLocationHref() || "http://localhost/");
        const pathname = String(resolved.pathname || "").replace(/\/+$/, "");
        const last = pathname.split("/").filter(Boolean).pop();
        return last || pathname || raw;
    } catch (error) {
        return raw;
    }
}

function currentDocument() {
    if (typeof document !== "undefined") {
        return document;
    }

    if (typeof window !== "undefined" && window.document) {
        return window.document;
    }

    return null;
}

function makeRequestEnvelope(lib, url, requestOptions = {}) {
    const opts = {
        ...requestOptions,
        url,
        responseParse: requestOptions.responseParse || "text",
    };

    if (lib.request && typeof lib.request.makeEnvelope === "function") {
        return lib.request.makeEnvelope(opts);
    }

    return {
        endpoint: {
            url,
        },
        method: "GET",
        headers: {},
        response: {
            parse: "text",
            return: "payload",
        },
    };
}

async function sendRequest(lib, envelope, fallbackUrl) {
    if (lib.request && typeof lib.request.send === "function") {
        return lib.request.send(envelope);
    }

    if (typeof fetch === "function") {
        const init = {
            method: envelope && envelope.method ? envelope.method : "GET",
            headers: envelope && envelope.headers ? envelope.headers : {},
        };

        if (envelope && envelope.body !== undefined) {
            init.body = envelope.body;
        }

        if (envelope && envelope.credentials) {
            init.credentials = envelope.credentials;
        }

        const response = await fetch(fallbackUrl, init);

        return await normalizeFetchResponse(response, fallbackUrl);
    }

    throw new Error(`${MOD} no request transport is available.`);
}

async function normalizeFetchResponse(response, url) {
    let body = "";
    let headers = {};

    if (response && response.headers && typeof response.headers.forEach === "function") {
        response.headers.forEach((value, key) => {
            headers[String(key).toLowerCase()] = value;
        });
    }

    if (response && typeof response.text === "function") {
        body = await response.text();
    }

    return {
        ok: !!(response && response.ok),
        status: response && typeof response.status === "number" ? response.status : 0,
        statusText: response && response.statusText ? response.statusText : "",
        url: response && response.url ? response.url : url,
        headers,
        body,
        redirected: !!(response && response.redirected),
    };
}

function isOkResponse(response) {
    if (!response || typeof response !== "object") {
        return true;
    }

    if (typeof response.ok === "boolean") {
        return response.ok;
    }

    if (typeof response.status === "number") {
        return response.status >= 200 && response.status < 400;
    }

    return true;
}

function extractHtml(response) {
    if (response == null) {
        return "";
    }

    if (typeof response === "string") {
        return response;
    }

    if (typeof response.body === "string") {
        return response.body;
    }

    if (response.body == null) {
        return "";
    }

    return String(response.body);
}

function parseHtml(html) {
    if (typeof DOMParser === "undefined") {
        throw new Error(`${MOD} DOMParser is not available.`);
    }

    const parser = new DOMParser();
    return parser.parseFromString(String(html), "text/html");
}

function reloadScripts(root) {
    const scripts = Array.from(root.querySelectorAll("script"));
    for (const script of scripts) {
        const clone = script.cloneNode(true);
        script.parentNode.replaceChild(clone, script);
    }
}

export { install };
export default {
    install,
};
