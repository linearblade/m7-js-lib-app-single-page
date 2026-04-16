const MOD = "[app.SinglePageApp.builtins.defs]";

function normalizeText(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function normalizeWorkspace(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function defineBuiltin(trigger, fn, meta = {}) {
    const normalizedTrigger = normalizeText(trigger);
    if (!normalizedTrigger) {
        throw new Error(`${MOD} defineBuiltin requires a trigger.`);
    }

    if (typeof fn !== "function") {
        throw new Error(`${MOD} defineBuiltin requires a function.`);
    }

    const selector = normalizeText(meta.selector);
    const out = {
        trigger: normalizedTrigger,
        selector: selector || undefined,
        fn,
        name: normalizeText(meta.name) || (fn.name || normalizedTrigger),
        kind: normalizeText(meta.kind) || normalizedTrigger,
        description: typeof meta.description === "string" ? meta.description : "",
        env: normalizeWorkspace(meta.env),
    };

    return Object.freeze(out);
}

export { defineBuiltin };
export default defineBuiltin;
