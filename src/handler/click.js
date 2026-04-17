/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

const MOD = "[app.clickHandler]";

function noop() {}

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function normalizeOptions(value = null) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function resolveController(spa = null, controller = null) {
    return spa || controller || null;
}

function resolvePopstateKey(explicitKey = null, ctx = null, controller = null) {
    const candidates = [
        explicitKey,
        ctx && ctx.popstateKey,
        ctx && ctx.env && ctx.env.global && ctx.env.global.popstateKey,
        ctx && ctx.env && ctx.env.event && ctx.env.event.popstateKey,
        controller && controller.env && controller.env.popstateKey,
    ];

    for (const candidate of candidates) {
        const key = normalizeText(candidate);
        if (key) {
            return key;
        }
    }

    return "";
}

function toStatusLabel(url) {
    const raw = normalizeText(url);
    if (!raw) {
        return "page";
    }

    try {
        const fallbackBase = typeof window !== "undefined" && window.location
            ? window.location.href
            : "http://localhost/";
        const resolved = new URL(raw, fallbackBase);
        const pathname = String(resolved.pathname || "").replace(/\/+$/, "");
        const last = pathname.split("/").filter(Boolean).pop();
        return last || pathname || raw;
    } catch (error) {
        return raw;
    }
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

function assertController(controller) {
    if (!controller || typeof controller !== "object") {
        throw new Error(`${MOD} requires a controller object.`);
    }

    if (typeof controller.loadPage !== "function") {
        throw new Error(`${MOD} requires controller.loadPage(url, opts).`);
    }

    if (typeof controller.resolveUrl !== "function") {
        throw new Error(`${MOD} requires controller.resolveUrl(url).`);
    }

    return controller;
}

export function createClickHandler({
    spa = null,
    controller = null,
    log = null,
    status = null,
    options = null,
    popstateKey = null,
    mod = MOD,
} = {}) {
    const target = assertController(resolveController(spa, controller));
    const logFn = typeof log === "function" ? log : noop;
    const statusFn = typeof status === "function" ? status : noop;
    const opts = normalizeOptions(options);

    return async function clickHandler(evt, ctx = null) {
        if (evt && evt.__m7SpaHandled) {
            return false;
        }

        const element = ctx && ctx.element ? ctx.element : this;
        const url = ctx && ctx.url ? ctx.url : null;

        if (!shouldHandleClick(evt, element)) {
            return false;
        }

        const resolvedUrl = target.resolveUrl(url);
        if (!resolvedUrl) {
            logFn("click ignored", { url, reason: "unresolved-url" });
            return false;
        }

        const label = target.utils && typeof target.utils.toStatusLabel === "function"
            ? target.utils.toStatusLabel(resolvedUrl)
            : toStatusLabel(resolvedUrl);

        logFn("click", {
            selector: ctx && ctx.selector ? ctx.selector : opts.linkSelector,
            url: resolvedUrl,
        });
        statusFn(`Loading ${label}...`);

        if (evt && typeof evt.preventDefault === "function") {
            evt.preventDefault();
        }

        if (evt) {
            evt.__m7SpaHandled = true;
        }

        try {
            const handlerPopstateKey = resolvePopstateKey(popstateKey, ctx, target);
            logFn("loadPage start", { url: resolvedUrl });
            await target.loadPage(resolvedUrl, {
                pushState: true,
                popstateKey: handlerPopstateKey || undefined,
                statusLabel: label,
            });
            logFn("loadPage done", { url: resolvedUrl });
        } catch (error) {
            console.error(`${mod} click handler failed for '${resolvedUrl}':`, error);
            statusFn(`Error loading ${label}`);
        }

        return false;
    };
}

export default createClickHandler;
