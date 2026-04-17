/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import ScriptLoader from "./ScriptLoader.js";

const MOD = "[app.SinglePageApp.Utils]";

function noop() {}

class Utils {
    constructor({spa = null, lib = null, options = null, log = null, status = null} = {}) {
        this.spa = spa || null;
        this.lib = lib || (this.spa && this.spa.lib) || null;
        this.options = {};
        this.logFn = noop;
        this.statusFn = noop;
        this.scriptLoader = new ScriptLoader({
            utils: this,
            spa: this.spa,
            lib: this.lib,
            options: this.options,
        });
        this.configure({ options, log, status });
    }

    configure({spa, lib, options, log, status} = {}) {
        if (spa !== undefined) {
            this.setSpa(spa);
        }

        if (lib !== undefined) {
            this.setLib(lib);
        }

        if (options !== undefined) {
            this.setOptions(options);
        }

        if (log !== undefined) {
            this.setLog(log);
        }

        if (status !== undefined) {
            this.setStatus(status);
        }

        return this;
    }

    syncScriptLoader() {
        this.scriptLoader.configure({
            utils: this,
            spa: this.spa,
            lib: this.lib,
            options: this.options,
        });
        return this.scriptLoader;
    }

    setSpa(spa = null) {
        this.spa = spa || null;
        if (!this.lib && this.spa && this.spa.lib) {
            this.lib = this.spa.lib;
        }
        this.syncScriptLoader();
        return this.spa;
    }

    setLib(lib = null) {
        this.lib = lib || (this.spa && this.spa.lib) || null;
        this.syncScriptLoader();
        return this.lib;
    }

    setOptions(options = null) {
        this.options = this.lib.hash.to(options);
        this.syncScriptLoader();
        return this.options;
    }

    setLog(log = null) {
        this.logFn = typeof log === "function" ? log : noop;
        return this.logFn;
    }

    setStatus(status = null) {
        this.statusFn = typeof status === "function" ? status : noop;
        return this.statusFn;
    }

    requireSpa() {
        if (!this.spa || typeof this.spa !== "object") {
            throw new Error(`${MOD} requires a spa instance.`);
        }

        return this.spa;
    }

    log(message, details) {
        if (details !== undefined) {
            return this.logFn(message, details);
        }

        return this.logFn(message);
    }

    status(message) {
        return this.statusFn(message);
    }

    currentDocument() {
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

    currentLocationHref() {
        const host = this.spa && this.spa.root && this.spa.root.host;
        if (host && host.location && host.location.href) {
            return host.location.href;
        }

        if (typeof window !== "undefined" && window.location && window.location.href) {
            return window.location.href;
        }

        return null;
    }

    currentLocationOrigin() {
        const host = this.spa && this.spa.root && this.spa.root.host;
        if (host && host.location && host.location.origin) {
            return host.location.origin;
        }

        if (typeof window !== "undefined" && window.location && window.location.origin) {
            return window.location.origin;
        }

        return null;
    }

    reloadScripts(root, reloadOptions = null) {
        return this.scriptLoader.reloadScripts(root, reloadOptions);
    }

    resolveUrl(url, baseUrl) {
        const raw = typeof url === "string" ? url.trim() : "";
        if (!raw) {
            return null;
        }

        const base = baseUrl || this.currentLocationHref();

        try {
            const resolved = base ? new URL(raw, base) : new URL(raw);
            const origin = this.currentLocationOrigin();
            if (origin && resolved.origin !== origin) {
                return null;
            }
            return resolved.href;
        } catch (error) {
            return raw;
        }
    }

    toStatusLabel(url) {
        const raw = typeof url === "string" ? url.trim() : "";
        if (!raw) {
            return "page";
        }

        try {
            const resolved = new URL(raw, this.currentLocationHref() || "http://localhost/");
            const pathname = String(resolved.pathname || "").replace(/\/+$/, "");
            const last = pathname.split("/").filter(Boolean).pop();
            return last || pathname || raw;
        } catch (error) {
            return raw;
        }
    }

    makeRequestEnvelope(url, requestOptions = {}) {
        const optionRequestOpts = this.lib.hash.to(this.options.requestOptions);
        const requestOpts = this.lib.hash.to(requestOptions);
        const opts = {
            ...optionRequestOpts,
            ...requestOpts,
            url,
            responseParse: requestOpts.responseParse || "text",
        };

        return this.lib.request.makeEnvelope(opts);
    }

    async sendRequest(envelope) {
        return this.lib.request.send(envelope);
    }

    isOkResponse(response) {
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

    extractHtml(response) {
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

    parseHtml(html) {
        if (typeof DOMParser === "undefined") {
            throw new Error(`${MOD} DOMParser is not available.`);
        }

        const parser = new DOMParser();
        return parser.parseFromString(String(html), "text/html");
    }

    async fetchPage(url, requestOptions = {}) {
        const spa = this.requireSpa();
        const resolvedUrl = this.resolveUrl(url);
        if (!resolvedUrl) {
            throw new Error(`${MOD} unable to resolve url '${url}'.`);
        }

        const envelope = this.makeRequestEnvelope(resolvedUrl, requestOptions);
        this.log("fetchPage request", {
            url: resolvedUrl,
            method: envelope.method,
        });

        const response = await this.sendRequest(envelope);
        this.log("fetchPage response", {
            url: resolvedUrl,
            status: response && typeof response.status === "number" ? response.status : null,
            ok: response && typeof response.ok === "boolean" ? response.ok : null,
            responseUrl: response && response.url ? response.url : null,
        });
        this.status(`Fetched ${this.toStatusLabel(resolvedUrl)}`);

        if (!this.isOkResponse(response)) {
            const status = response && typeof response.status === "number" ? response.status : 0;
            const statusText = response && response.statusText ? response.statusText : "Request failed";
            throw new Error(`${MOD} request failed for '${resolvedUrl}' (${status} ${statusText})`);
        }

        const html = this.extractHtml(response);
        if (!html) {
            throw new Error(`${MOD} empty response body for '${resolvedUrl}'.`);
        }

        const document = this.parseHtml(html);
        const responseUrl = response && response.url ? response.url : resolvedUrl;
        this.log("fetchPage parsed", {
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
    }

    swapPage(payload, swapOptions = {}) {
        const document = payload && payload.document
            ? payload.document
            : (typeof payload === "string" ? this.parseHtml(payload) : null);

        if (!document) {
            throw new Error(`${MOD} swapPage requires an HTML document or HTML string.`);
        }

        const sourceSelector = swapOptions.sourceSelector || this.options.sourceSelector;
        const targetSelector = swapOptions.targetSelector || this.options.targetSelector;
        const updateTitle = swapOptions.updateTitle !== undefined
            ? !!swapOptions.updateTitle
            : this.options.updateTitle;

        const source = document.querySelector(sourceSelector);
        if (!source) {
            throw new Error(`${MOD} unable to find source '${sourceSelector}' in the fetched document.`);
        }

        const currentDoc = this.currentDocument();
        if (!currentDoc) {
            throw new Error(`${MOD} current document is not available.`);
        }

        const target = currentDoc.querySelector(targetSelector);
        if (!target) {
            throw new Error(`${MOD} unable to find target '${targetSelector}' in the current document.`);
        }

        this.log("swapPage start", {
            sourceSelector,
            targetSelector,
            title: document && document.title ? document.title : "",
        });
        this.status(`Swapping ${this.toStatusLabel(document && document.title ? document.title : sourceSelector)}...`);

        target.innerHTML = source.innerHTML;
        const scriptReload = this.reloadScripts(target, swapOptions.scriptReload);

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

        this.log("swapPage done", {
            sourceSelector,
            targetSelector,
            scriptsFound: scriptReload.found,
            scriptsReloaded: scriptReload.reloaded,
            scriptsSkipped: scriptReload.skipped,
        });

        return {
            document,
            source,
            target,
            scriptReload,
        };
    }

    async loadPage(url, loadOptions = {}) {
        const spa = this.requireSpa();
        const resolvedUrl = this.resolveUrl(url);
        if (!resolvedUrl) {
            throw new Error(`${MOD} unable to resolve url '${url}'.`);
        }

        const payload = await this.fetchPage(resolvedUrl, loadOptions.requestOptions || {});
        const swapResult = this.swapPage(payload, loadOptions.swapOptions || {});
        const finalUrl = this.resolveUrl(payload.url || resolvedUrl) || resolvedUrl;
        const currentDoc = this.currentDocument();
        const title = loadOptions.title !== undefined
            ? loadOptions.title
            : (swapResult.document.title || (currentDoc ? currentDoc.title : "") || "");

        if (loadOptions.pushState !== false) {
            this.log("pushState", {
                url: finalUrl,
                title,
                popstateKey: loadOptions.popstateKey || this.options.popstateKey,
            });
            spa.popstate.push(finalUrl, title, {
                popstate: loadOptions.popstateKey || this.options.popstateKey,
            });
        }

        this.status(`Loaded ${title || this.toStatusLabel(finalUrl)}`);
        const afterLoad = this.lib.func.get(loadOptions.afterLoad);
        if (afterLoad) {
            afterLoad({
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
    }
}

export { Utils };
export default Utils;
