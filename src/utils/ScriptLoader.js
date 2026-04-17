/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

const MOD = "[app.SinglePageApp.Utils.ScriptLoader]";

const EXECUTABLE_SCRIPT_TYPES = Object.freeze([
    "",
    "module",
    "text/javascript",
    "application/javascript",
    "text/ecmascript",
    "application/ecmascript",
]);

const DEFAULT_SCRIPT_RELOAD = Object.freeze({
    enabled: true,
    selector: "script",
    excludeSelectors: [
        'script[type="application/json"]',
        'script[type="importmap"]',
        'script[type="speculationrules"]',
    ],
    excludeAttributes: [
        "data-spa-no-reload",
        "data-spa-script-skip",
    ],
});

class ScriptLoader {
    constructor({utils = null, spa = null, lib = null, options = null} = {}) {
        this.utils = null;
        this.spa = null;
        this.lib = null;
        this.options = {};
        this.configure({ utils, spa, lib, options });
    }

    configure({utils, spa, lib, options} = {}) {
        if (utils !== undefined) {
            this.setUtils(utils);
        }

        if (spa !== undefined) {
            this.setSpa(spa);
        }

        if (lib !== undefined) {
            this.setLib(lib);
        }

        if (options !== undefined) {
            this.setOptions(options);
        }

        return this;
    }

    setUtils(utils = null) {
        this.utils = utils || null;

        if (!this.spa && this.utils && this.utils.spa) {
            this.spa = this.utils.spa;
        }

        if (!this.lib && this.utils && this.utils.lib) {
            this.lib = this.utils.lib;
        }

        return this.utils;
    }

    setSpa(spa = null) {
        this.spa = spa || (this.utils && this.utils.spa) || null;
        return this.spa;
    }

    setLib(lib = null) {
        this.lib = lib || (this.utils && this.utils.lib) || null;
        return this.lib;
    }

    setOptions(options = null) {
        this.options = this.lib.hash.to(options);
        return this.options;
    }

    currentDocument() {
        if (this.utils && typeof this.utils.currentDocument === "function") {
            const doc = this.utils.currentDocument();
            if (doc) {
                return doc;
            }
        }

        const spaDoc = this.spa && this.spa.root && this.spa.root.root;
        if (spaDoc) {
            return spaDoc;
        }

        if (typeof document !== "undefined") {
            return document;
        }

        if (typeof window !== "undefined" && window.document) {
            return window.document;
        }

        return null;
    }

    mergeLists(...lists) {
        const merged = [];

        for (const list of lists) {
            for (const item of this.lib.array.to(list, { trim: true })) {
                if (!merged.includes(item)) {
                    merged.push(item);
                }
            }
        }

        return merged;
    }

    normalizeScriptReloadOptions(value = null) {
        if (value === false) {
            return {
                enabled: false,
                selector: DEFAULT_SCRIPT_RELOAD.selector,
                excludeSelectors: this.mergeLists(DEFAULT_SCRIPT_RELOAD.excludeSelectors),
                excludeAttributes: this.mergeLists(DEFAULT_SCRIPT_RELOAD.excludeAttributes),
            };
        }

        const raw = value && typeof value === "object" ? value : {};
        return {
            enabled: raw.enabled !== false,
            selector: typeof raw.selector === "string" && raw.selector.trim()
                ? raw.selector.trim()
                : DEFAULT_SCRIPT_RELOAD.selector,
            excludeSelectors: this.mergeLists(
                DEFAULT_SCRIPT_RELOAD.excludeSelectors,
                raw.excludeSelectors,
            ),
            excludeAttributes: this.mergeLists(
                DEFAULT_SCRIPT_RELOAD.excludeAttributes,
                raw.excludeAttributes,
            ),
        };
    }

    scriptType(script) {
        if (!script || typeof script.getAttribute !== "function") {
            return "";
        }

        return String(script.getAttribute("type") || "").trim().toLowerCase();
    }

    isScriptElement(node) {
        return !!(node && node.tagName && String(node.tagName).toLowerCase() === "script");
    }

    isExecutableScript(script) {
        return EXECUTABLE_SCRIPT_TYPES.includes(this.scriptType(script));
    }

    scriptMatchesSelector(script, selector) {
        if (!script || typeof script.matches !== "function" || !selector) {
            return false;
        }

        return script.matches(selector);
    }

    scriptHasExcludedAttribute(script, attributes = []) {
        if (!script || typeof script.hasAttribute !== "function") {
            return false;
        }

        for (const attribute of this.lib.array.to(attributes, { trim: true })) {
            if (script.hasAttribute(attribute)) {
                return true;
            }
        }

        return false;
    }

    shouldReloadScript(script, options = {}) {
        if (!this.isExecutableScript(script)) {
            return false;
        }

        if (this.scriptHasExcludedAttribute(script, options.excludeAttributes)) {
            return false;
        }

        for (const selector of this.lib.array.to(options.excludeSelectors, { trim: true })) {
            if (this.scriptMatchesSelector(script, selector)) {
                return false;
            }
        }

        return true;
    }

    replacementScript(script) {
        const doc = script && script.ownerDocument ? script.ownerDocument : this.currentDocument();
        if (!doc || typeof doc.createElement !== "function") {
            throw new Error(`${MOD} unable to create replacement script element.`);
        }

        const replacement = doc.createElement("script");
        const attrs = script && script.attributes ? Array.from(script.attributes) : [];
        for (const attr of attrs) {
            replacement.setAttribute(attr.name, attr.value);
        }

        replacement.textContent = script && script.textContent ? script.textContent : "";
        return replacement;
    }

    collectScripts(root, selector = "script") {
        if (!root || typeof root.querySelectorAll !== "function") {
            return [];
        }

        const scripts = [];
        if (this.isScriptElement(root) && this.scriptMatchesSelector(root, selector)) {
            scripts.push(root);
        }

        return scripts.concat(
            Array.from(root.querySelectorAll(selector)).filter((node) => this.isScriptElement(node))
        );
    }

    reloadScripts(root, reloadOptions = null) {
        const options = this.normalizeScriptReloadOptions(
            reloadOptions === undefined || reloadOptions === null
                ? this.options.scriptReload
                : reloadOptions
        );

        if (options.enabled === false) {
            return {
                root,
                found: 0,
                reloaded: 0,
                skipped: 0,
            };
        }

        const scripts = this.collectScripts(root, options.selector);
        let reloaded = 0;
        let skipped = 0;

        for (const script of scripts) {
            if (!this.shouldReloadScript(script, options) || !script.parentNode) {
                skipped += 1;
                continue;
            }

            const replacement = this.replacementScript(script);
            script.parentNode.replaceChild(replacement, script);
            reloaded += 1;
        }

        return {
            root,
            found: scripts.length,
            reloaded,
            skipped,
        };
    }
}

export { ScriptLoader };
export default ScriptLoader;
