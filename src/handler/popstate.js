const MOD = "[app.popStateHandler]";

function noop() {}

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function resolveController(spa = null, controller = null) {
    return spa || controller || null;
}

function resolvePopstateKey(explicitKey = null, ctx = null, controller = null) {
    const candidates = [
        explicitKey,
        ctx && ctx.state && (ctx.state.popstate ?? ctx.state.popState ?? ctx.state.route),
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

export function createPopStateHandler({
    spa = null,
    controller = null,
    log = null,
    status = null,
    popstateKey = null,
    mod = MOD,
} = {}) {
    const target = assertController(resolveController(spa, controller));
    const logFn = typeof log === "function" ? log : noop;
    const statusFn = typeof status === "function" ? status : noop;

    return async function popStateHandler(evt, currentUrl, ctx = null) {
        const resolvedUrl = target.resolveUrl(currentUrl);
        if (!resolvedUrl) {
            logFn("popstate ignored", { url: currentUrl, reason: "unresolved-url" });
            return false;
        }

        const label = toStatusLabel(resolvedUrl);
        const handlerPopstateKey = resolvePopstateKey(popstateKey, ctx, target);
        statusFn(`Restoring ${label}...`);

        try {
            logFn("popstate loadPage start", {
                url: resolvedUrl,
                popstateKey: handlerPopstateKey || null,
            });
            await target.loadPage(resolvedUrl, {
                pushState: false,
                popstateKey: handlerPopstateKey || undefined,
                statusLabel: label,
            });
            logFn("popstate loadPage done", {
                url: resolvedUrl,
                popstateKey: handlerPopstateKey || null,
            });
        } catch (error) {
            console.error(`${mod} popstate handler failed for '${resolvedUrl}':`, error);
            statusFn(`Error restoring ${label}`);
        }

        return false;
    };
}

export default createPopStateHandler;
