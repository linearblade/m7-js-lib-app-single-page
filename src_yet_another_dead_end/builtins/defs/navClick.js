import { defineBuiltin } from "./defineBuiltin.js";

const MOD = "[app.SinglePageApp.builtins.defs.navClick]";
const NAV_CLICK_SELECTOR = '[spa-type="nav-click"]';

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function resolveElement(ctx, evt) {
    if (!ctx || typeof ctx !== "object") {
        return evt && evt.currentTarget ? evt.currentTarget : null;
    }

    return ctx.element
        || ctx.target
        || (evt && evt.currentTarget ? evt.currentTarget : null)
        || (evt && evt.target ? evt.target : null)
        || null;
}

function readAttr(element, name) {
    if (!element || typeof element.getAttribute !== "function") {
        return null;
    }

    const value = element.getAttribute(name);
    if (value == null) {
        return null;
    }

    const text = normalizeText(value);
    return text ? text : null;
}

function hasDom(node) {
    return !!node && typeof node === "object" && typeof node.nodeType === "number";
}

function readBool(lib, value) {
    if (lib && lib.bool && typeof lib.bool.yes === "function") {
        return lib.bool.yes(value);
    }

    return false;
}

function currentDocument() {
    if (typeof document !== "undefined") {
        return document;
    }

    return null;
}

function currentLocationHref() {
    if (typeof window !== "undefined" && window.location && window.location.href) {
        return window.location.href;
    }

    return "";
}

function currentLocationOrigin() {
    if (typeof window !== "undefined" && window.location && window.location.origin) {
        return window.location.origin;
    }

    return "";
}

function toStatusLabel(url) {
    const raw = normalizeText(url);
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

function createStatusReporter(selector) {
    const text = normalizeText(selector);
    if (!text) {
        return function noop() {};
    }

    return function reportStatus(message) {
        const doc = currentDocument();
        if (!doc || typeof doc.querySelector !== "function") {
            return;
        }

        const el = doc.querySelector(text);
        if (!el) {
            return;
        }

        const value = message == null ? "" : String(message);
        el.textContent = value;
        if (typeof el.setAttribute === "function") {
            el.setAttribute("title", value);
        }
    };
}

function stripHash(url) {
    const text = normalizeText(url);
    if (!text) {
        return "";
    }

    const idx = text.indexOf("#");
    return idx >= 0 ? text.slice(0, idx) : text;
}

function isPlainClick(evt, element) {
    if (evt && evt.defaultPrevented) {
        return false;
    }

    if (evt && typeof evt.button === "number" && evt.button !== 0) {
        return false;
    }

    if (evt && (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)) {
        return false;
    }

    if (element && typeof element.getAttribute === "function") {
        const target = readAttr(element, "target");
        if (target && target !== "_self") {
            return false;
        }

        if (typeof element.hasAttribute === "function" && element.hasAttribute("download")) {
            return false;
        }
    }

    return true;
}

function resolveUrl(rawHref, baseHref = "") {
    const raw = normalizeText(rawHref);
    if (!raw) {
        return null;
    }

    const base = normalizeText(baseHref) || currentLocationHref();

    try {
        const resolved = base ? new URL(raw, base) : new URL(raw);
        const origin = currentLocationOrigin();
        if (origin && resolved.origin !== origin) {
            return null;
        }

        return resolved.href;
    } catch (error) {
        return raw;
    }
}

function isSameDocumentFragment(rawHref, resolvedHref) {
    const raw = normalizeText(rawHref);
    const resolved = normalizeText(resolvedHref);
    const current = currentLocationHref();

    if (!raw || !resolved || !current) {
        return false;
    }

    if (raw.startsWith("#")) {
        return true;
    }

    const left = stripHash(resolved);
    const right = stripHash(current);
    return !!left && left === right && resolved.includes("#");
}

function resolveNode(input, doc) {
    if (hasDom(input)) {
        return input;
    }

    const text = normalizeText(input);
    if (!text || !doc) {
        return null;
    }

    if (typeof doc.querySelector === "function") {
        try {
            const found = doc.querySelector(text);
            if (found) {
                return found;
            }
        } catch (error) {
            // fall through to id lookup
        }
    }

    if (!text.startsWith("#") && typeof doc.getElementById === "function") {
        const foundById = doc.getElementById(text);
        if (foundById) {
            return foundById;
        }
    }

    return null;
}

function extractSourceNode(sourceDoc, sourceInput) {
    const root = sourceDoc && sourceDoc.body
        ? sourceDoc.body
        : (sourceDoc && sourceDoc.documentElement ? sourceDoc.documentElement : sourceDoc);

    if (!normalizeText(sourceInput)) {
        return root;
    }

    return resolveNode(sourceInput, sourceDoc);
}

function extractSourceMarkup(sourceNode, useReplacement = false) {
    if (!sourceNode) {
        return "";
    }

    if (sourceNode.nodeType === 9) {
        const body = sourceNode.body;
        if (body && typeof body.innerHTML === "string") {
            return body.innerHTML;
        }

        const docEl = sourceNode.documentElement;
        if (docEl && typeof docEl.innerHTML === "string") {
            return docEl.innerHTML;
        }

        return "";
    }

    const owner = sourceNode.ownerDocument || null;
    const isBody = !!owner && owner.body === sourceNode;
    const isDocEl = !!owner && owner.documentElement === sourceNode;

    if (isBody || isDocEl) {
        return typeof sourceNode.innerHTML === "string" ? sourceNode.innerHTML : "";
    }

    if (useReplacement && typeof sourceNode.outerHTML === "string") {
        return sourceNode.outerHTML;
    }

    if (typeof sourceNode.innerHTML === "string") {
        return sourceNode.innerHTML;
    }

    if (typeof sourceNode.outerHTML === "string") {
        return sourceNode.outerHTML;
    }

    return normalizeText(sourceNode.textContent);
}

function parseHtmlDocument(html) {
    const markup = normalizeText(html);
    if (!markup) {
        return null;
    }

    if (typeof DOMParser !== "undefined") {
        const parser = new DOMParser();
        return parser.parseFromString(markup, "text/html");
    }

    if (typeof document !== "undefined" && document.implementation && typeof document.implementation.createHTMLDocument === "function") {
        const doc = document.implementation.createHTMLDocument("");
        if (typeof doc.open === "function" && typeof doc.write === "function" && typeof doc.close === "function") {
            doc.open();
            doc.write(markup);
            doc.close();
        } else if (doc.documentElement) {
            doc.documentElement.innerHTML = markup;
        }
        return doc;
    }

    return null;
}

function hydrateScripts(root, doc) {
    const scripts = [];
    if (!root || typeof root.querySelectorAll !== "function") {
        return scripts;
    }

    const currentDoc = doc || currentDocument();
    if (!currentDoc || typeof currentDoc.createElement !== "function") {
        return scripts;
    }

    const nodes = Array.from(root.querySelectorAll("script"));
    for (const oldScript of nodes) {
        const next = currentDoc.createElement("script");
        if (oldScript && oldScript.attributes) {
            for (const attr of Array.from(oldScript.attributes)) {
                next.setAttribute(attr.name, attr.value);
            }
        }

        next.textContent = oldScript && oldScript.textContent ? oldScript.textContent : "";
        if (oldScript.parentNode) {
            oldScript.parentNode.replaceChild(next, oldScript);
        }
        scripts.push(next);
    }

    return scripts;
}

function makeFragment(html, doc) {
    const currentDoc = doc || currentDocument();
    if (!currentDoc || typeof currentDoc.createElement !== "function") {
        return null;
    }

    const template = currentDoc.createElement("template");
    template.innerHTML = normalizeText(html);
    const fragment = template.content.cloneNode(true);
    const scripts = hydrateScripts(fragment, currentDoc);
    return {
        fragment,
        scripts,
    };
}

function applyMarkup(target, html, opts = {}) {
    const currentDoc = target && target.ownerDocument ? target.ownerDocument : currentDocument();
    const replacement = makeFragment(html, currentDoc);

    if (!target || !replacement || !replacement.fragment) {
        return {
            applied: false,
            scripts: [],
        };
    }

    const mode = opts.replace ? "replace" : "inject";
    if (mode === "replace") {
        if (typeof target.replaceWith === "function") {
            target.replaceWith(replacement.fragment);
        } else if (target.parentNode) {
            target.parentNode.replaceChild(replacement.fragment, target);
        } else {
            throw new Error(`${MOD} unable to replace target without a parent node.`);
        }
    } else if (typeof target.replaceChildren === "function") {
        target.replaceChildren(replacement.fragment);
    } else {
        while (target.firstChild) {
            target.removeChild(target.firstChild);
        }
        target.appendChild(replacement.fragment);
    }

    return {
        applied: true,
        mode,
        scripts: replacement.scripts,
    };
}

async function fetchHtml(lib, url) {
    const request = lib && lib.request && typeof lib.request.send === "function"
        ? lib.request.send.bind(lib.request)
        : null;
    const makeEnvelope = lib && lib.request && typeof lib.request.makeEnvelope === "function"
        ? lib.request.makeEnvelope.bind(lib.request)
        : null;

    if (request) {
        const envelope = makeEnvelope
            ? makeEnvelope({
                url,
                method: "GET",
                responseParse: "text",
            })
            : {
                transport: "http",
                op: "send",
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

        const response = await request(envelope);

        const html = response && typeof response.body === "string"
            ? response.body
            : normalizeText(response && response.body);

        return {
            response,
            html,
            document: parseHtmlDocument(html),
        };
    }

    if (typeof fetch === "function") {
        const response = await fetch(url, {
            method: "GET",
            credentials: "same-origin",
        });
        const html = await response.text();
        const headers = {};
        if (response.headers && typeof response.headers.forEach === "function") {
            response.headers.forEach((value, key) => {
                headers[String(key).toLowerCase()] = value;
            });
        }

        return {
            response: {
                ok: !!response.ok,
                status: response.status,
                statusText: response.statusText,
                url: response.url || url,
                headers,
                body: html,
                redirected: !!response.redirected,
            },
            html,
            document: parseHtmlDocument(html),
        };
    }

    throw new Error(`${MOD} no request transport available.`);
}

function readFallbackValue(ctx, key) {
    if (!ctx || typeof ctx !== "object") {
        return null;
    }

    const direct = ctx[key];
    if (direct !== undefined && direct !== null) {
        if (typeof direct === "string") {
            const text = normalizeText(direct);
            return text || null;
        }

        return direct;
    }

    const env = ctx.env && typeof ctx.env === "object" ? ctx.env : null;
    if (env) {
        const envEvent = env.event && typeof env.event === "object" ? env.event : null;
        if (envEvent && envEvent[key] !== undefined && envEvent[key] !== null) {
            const value = envEvent[key];
            if (typeof value === "string") {
                const text = normalizeText(value);
                return text || null;
            }

            return value;
        }

        const envGlobal = env.global && typeof env.global === "object" ? env.global : null;
        if (envGlobal && envGlobal[key] !== undefined && envGlobal[key] !== null) {
            const value = envGlobal[key];
            if (typeof value === "string") {
                const text = normalizeText(value);
                return text || null;
            }

            return value;
        }
    }

    return null;
}

function resolveHref(element, ctx) {
    const direct = readAttr(element, "spa-href");
    if (direct) {
        return direct;
    }

    const candidates = [
        readFallbackValue(ctx, "url"),
        readFallbackValue(ctx, "href"),
    ];

    for (const candidate of candidates) {
        const text = normalizeText(candidate);
        if (text) {
            return text;
        }
    }

    if (element && typeof element.getAttribute === "function") {
        const attrHref = readAttr(element, "href");
        if (attrHref) {
            return attrHref;
        }
    }

    if (element && typeof element.href === "string") {
        const text = normalizeText(element.href);
        if (text) {
            return text;
        }
    }

    return null;
}

function resolveSourceInput(element, ctx) {
    const direct = readAttr(element, "spa-src");
    if (direct) {
        return direct;
    }

    const fallback = readFallbackValue(ctx, "src");
    return fallback || null;
}

function resolveDestinationInput(element, ctx) {
    const direct = readAttr(element, "spa-dst");
    if (direct) {
        return direct;
    }

    const fallback = readFallbackValue(ctx, "dst");
    return fallback || null;
}

function resolveSpaType(element) {
    return readAttr(element, "spa-type");
}

function resolveCurrentUrl() {
    return currentLocationHref();
}

async function navClickBuiltin(evt, ctx = {}) {
    const lib = ctx && ctx.lib ? ctx.lib : null;
    const element = resolveElement(ctx, evt);

    if (!element) {
        return null;
    }

    if (resolveSpaType(element) !== "nav-click") {
        return null;
    }

    if (!isPlainClick(evt, element)) {
        return null;
    }

    const rawHref = resolveHref(element, ctx);
    if (!rawHref) {
        return null;
    }

    const resolvedUrl = resolveUrl(rawHref, resolveCurrentUrl());
    if (!resolvedUrl) {
        return null;
    }

    const statusSelector = readFallbackValue(ctx, "statusSelector");
    const reportStatus = createStatusReporter(statusSelector);
    const label = toStatusLabel(resolvedUrl);

    if (isSameDocumentFragment(rawHref, resolvedUrl)) {
        return {
            trigger: "click",
            kind: "nav-click",
            name: "spa.nav-click",
            selector: NAV_CLICK_SELECTOR,
            href: rawHref,
            url: resolvedUrl,
            element,
            event: evt || null,
            ctx: ctx || null,
            bypass: true,
            reason: "same-document-fragment",
            applied: false,
        };
    }

    if (evt && typeof evt.preventDefault === "function") {
        evt.preventDefault();
    }

    if (evt) {
        evt.__m7SpaHandled = true;
    }

    reportStatus(`Loading ${label}...`);

    try {
        const fetchResult = await fetchHtml(lib, resolvedUrl);
        const response = fetchResult.response || {};
        const responseOk = typeof response.ok === "boolean"
            ? response.ok
            : (typeof response.status === "number" ? response.status >= 200 && response.status < 400 : true);
        if (!responseOk) {
            const status = typeof response.status === "number" ? response.status : 0;
            const statusText = response.statusText ? response.statusText : "Request failed";
            throw new Error(`${MOD} request failed for '${resolvedUrl}' (${status} ${statusText})`);
        }

        const sourceDoc = fetchResult.document;
        if (!sourceDoc) {
            throw new Error(`${MOD} unable to parse HTML from '${resolvedUrl}'.`);
        }

        reportStatus(`Fetched ${label}`);

        const replaceMode = readBool(lib, readAttr(element, "spa-replace"));
        const sourceInput = resolveSourceInput(element, ctx);
        const destinationInput = replaceMode ? null : resolveDestinationInput(element, ctx);

        const sourceNode = sourceInput ? resolveNode(sourceInput, sourceDoc) : extractSourceNode(sourceDoc, null);
        if (!sourceNode) {
            const sourceLabel = normalizeText(sourceInput) || "document";
            throw new Error(`${MOD} unable to resolve source '${sourceLabel}' in fetched document.`);
        }

        const sourceHtml = extractSourceMarkup(sourceNode, replaceMode);
        const destinationDoc = element.ownerDocument || currentDocument();
        const destinationNode = replaceMode
            ? element
            : (destinationInput ? resolveNode(destinationInput, destinationDoc) : element);

        if (!destinationNode) {
            const destinationLabel = normalizeText(destinationInput) || "clicked element";
            throw new Error(`${MOD} unable to resolve destination '${destinationLabel}' in current document.`);
        }

        const applyResult = applyMarkup(destinationNode, sourceHtml, {
            replace: replaceMode,
        });

        reportStatus(`Loaded ${label}`);

        return {
            trigger: "click",
            kind: "nav-click",
            name: "spa.nav-click",
            selector: NAV_CLICK_SELECTOR,
            href: rawHref,
            url: resolvedUrl,
            title: sourceDoc && sourceDoc.title ? String(sourceDoc.title).trim() : "",
            popstateKey: readFallbackValue(ctx, "popstateKey") || null,
            pushState: true,
            element,
            event: evt || null,
            ctx: ctx || null,
            response: fetchResult.response || null,
            document: sourceDoc,
            source: {
                input: sourceInput || null,
                node: sourceNode,
                html: sourceHtml,
            },
            destination: {
                input: destinationInput || null,
                node: destinationNode,
            },
            replace: replaceMode,
            bypass: false,
            applied: !!applyResult.applied,
            swap: {
                mode: applyResult.mode || (replaceMode ? "replace" : "inject"),
                scripts: applyResult.scripts || [],
            },
        };
    } catch (error) {
        reportStatus(`Error loading ${label}`);
        throw error;
    }
}

const navClickDef = defineBuiltin("click", navClickBuiltin, {
    selector: NAV_CLICK_SELECTOR,
    name: "spa.nav-click",
    kind: "nav-click",
    description: "Fetch remote HTML and swap the selected source content into the destination element.",
});

export {
    NAV_CLICK_SELECTOR,
    applyMarkup,
    currentDocument,
    currentLocationHref,
    currentLocationOrigin,
    extractSourceMarkup,
    extractSourceNode,
    fetchHtml,
    hydrateScripts,
    isPlainClick,
    isSameDocumentFragment,
    navClickBuiltin,
    navClickDef,
    normalizeText,
    parseHtmlDocument,
    readAttr,
    readBool,
    readFallbackValue,
    resolveCurrentUrl,
    resolveDestinationInput,
    resolveElement,
    resolveHref,
    resolveNode,
    resolveSourceInput,
    resolveSpaType,
    resolveUrl,
};
export default navClickDef;
