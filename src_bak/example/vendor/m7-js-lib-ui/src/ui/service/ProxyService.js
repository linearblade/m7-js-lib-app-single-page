/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export class ProxyService {
    constructor(lib, opts = {}) {
        this.lib = lib;
        this.MOD = "[ui.proxy]";
        this.SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
        this.SERVICE_TAG = "ui.proxy";

        this.config = {};
        this.started = false;

        const self = this;
        this._delegatedHandler = function (event) {
            return self.forward(this, event);
        };

        this.defaultConfig();
        if (opts && typeof opts === "object") {
            this.setConfig(opts);
        }
    }

    getConfig() {
        return this.config;
    }

    defaultConfig() {
        this.config = {
            trigger: "[data-button-proxy]",
            attr: "data-button-proxy",
            preventDefault: true,
            stopPropagation: true,
        };
        return this.config;
    }

    setConfig(conf) {
        conf = this.lib.hash.to(conf);
        for (const k in conf) {
            this.lib.hash.set(this.config, k, conf[k]);
        }
    }

    resolveSelector(trigger) {
        if (!trigger || typeof trigger.getAttribute !== "function") return null;
        const selector = this.lib.utils.toString(trigger.getAttribute(this.config.attr), true).trim();
        return this.lib.utils.isEmpty(selector) ? null : selector;
    }

    forward(trigger, event = null) {
        const triggerNode = this.lib.dom.attempt(trigger);
        if (!triggerNode) return false;

        const selector = this.resolveSelector(triggerNode);
        if (!selector) return false;

        const target = this.lib.dom.attempt(selector);
        if (!target) {
            console.warn(`${this.MOD} target not found for selector: ${selector}`);
            return false;
        }

        if (target === triggerNode) {
            console.warn(`${this.MOD} ignoring self-targeted proxy click: ${selector}`);
            return false;
        }

        if (event && this.config.preventDefault && typeof event.preventDefault === "function") {
            event.preventDefault();
        }
        if (event && this.config.stopPropagation && typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }

        target.click();
        return true;
    }

    init() {
        return this.start();
    }

    start() {
        if (this.started) return true;

        const [delegator] = this.lib.require.service(this.SERVICE_EVENT_DELEGATOR, { mod: this.MOD });
        delegator.set({
            eventType: "click",
            selector: this.config.trigger,
            handler: this._delegatedHandler,
            tag: this.SERVICE_TAG,
        });

        this.started = true;
        return true;
    }

    stop() {
        if (!this.started) return false;

        const [delegator] = this.lib.require.service(this.SERVICE_EVENT_DELEGATOR, { mod: this.MOD });
        delegator.offTag(this.SERVICE_TAG);

        this.started = false;
        return true;
    }

    isStarted() {
        return this.started;
    }
}

export default ProxyService;
