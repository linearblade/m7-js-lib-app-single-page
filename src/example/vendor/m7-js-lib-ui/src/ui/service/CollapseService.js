/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export class CollapseService {
    constructor(lib, opts = {}) {
        this.lib = lib;
        this.MOD = "[ui.collapse]";
        this.SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
        this.SERVICE_TAG = "ui.collapse";

        this.config = {};
        this.started = false;

        const self = this;
        this._delegatedHandler = function (event) {
            return self.listener(event, this);
        };

        this.defaultConfig();
        if (opts && typeof opts === "object") {
            this.setConfig(opts);
        }
    }

    getDocument() {
        const doc = this.lib.hash.get(this.lib, "_env.root.document", null);
        if (doc) return doc;
        if (typeof document !== "undefined") return document;
        return null;
    }

    getConfig() {
        return this.config;
    }

    defaultConfig() {
        this.config = {
            trigger: "[data-collapse-trigger]",
            parent: "[data-collapse-parent]",
            children: "data-children",
            hidden: "tab-hidden",
            attrs: {
                listener: "data-listener-added",
                group: "data-toggle-group",
                toggle_on: "data-toggle-on",
                toggle_off: "data-toggle-off",
            },
            chain: this.lib.ui.chain.runWith,
        };

        return this.config;
    }

    setConfig(conf) {
        conf = this.lib.hash.to(conf);
        for (const k in conf) {
            this.lib.hash.set(this.config, k, conf[k]);
        }
    }

    runChain(node, attr) {
        if (!node || typeof node.getAttribute !== "function") return;
        const parent = typeof node.closest === "function" ? node.closest(this.config.parent) : null;
        const value = node.getAttribute(attr) ?? (parent ? parent.getAttribute(attr) : null);
        return this.lib.func.get(this.config.chain)(node, value);
    }

    getGroup(target) {
        const doc = this.getDocument();
        if (!doc || !target) return null;

        let groupName = this.lib.utils.toString(target.getAttribute(this.config.attrs.group), 1).trim();
        const parent = target.closest(this.config.parent);
        let parentGroup = null;

        if (this.lib.utils.isEmpty(groupName)) {
            parentGroup = parent
                ? this.lib.utils.toString(parent.getAttribute(this.config.attrs.group), 1).trim()
                : null;
        }

        const derivedGroup = this.lib.utils.isEmpty(groupName) ? parentGroup : groupName;
        if (this.lib.utils.isEmpty(derivedGroup)) {
            return null;
        }

        let allPanels = Array.from(
            doc.querySelectorAll(`[${this.config.attrs.group}="${derivedGroup}"]:not(${this.config.parent})`)
        );

        if (parentGroup && parent) {
            let ids = this.lib.utils.toString(parent.getAttribute(this.config.children), 1).trim();
            if (!this.lib.utils.isEmpty(ids)) {
                ids = this.lib.array.to(ids, /\s+/);
                for (const id of ids) {
                    const n = this.lib.dom.byId(id);
                    if (n && !allPanels.includes(n)) {
                        allPanels.push(n);
                    }
                }
            }
        }

        return allPanels;
    }

    togglePanel(panel, state = null) {
        if (!panel) return;

        let isHidden = this.lib.bool.yes(panel.getAttribute("aria-hidden"));
        if (this.lib.bool.isIntent(state)) {
            isHidden = this.lib.bool.byIntent(state);
        }

        if (isHidden) {
            panel.classList.remove(this.config.hidden);
            panel.setAttribute("aria-hidden", "false");
            panel.setAttribute("aria-expanded", "true");
            this.runChain(panel, this.config.attrs.toggle_on);
        } else {
            panel.classList.add(this.config.hidden);
            panel.setAttribute("aria-hidden", "true");
            panel.setAttribute("aria-expanded", "false");
            this.runChain(panel, this.config.attrs.toggle_off);
        }
    }

    listener(event, trigger) {
        const doc = this.getDocument();
        if (!doc || !trigger) return;

        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        const targetId = this.lib.utils.toString(trigger.getAttribute("aria-controls") ?? null, true).trim();
        if (this.lib.utils.isEmpty(targetId)) return;

        const targetPanel = doc.getElementById(targetId);
        if (!targetPanel) {
            console.error(`${targetId} not found, cannot toggle`);
            return;
        }

        const isExpanded = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", isExpanded ? "false" : "true");
        this.runChain(trigger, this.config.attrs.toggle_on);

        const group = this.getGroup(targetPanel);
        if (group) {
            for (const panel of group) {
                if (targetPanel !== panel) {
                    this.togglePanel(panel, false);
                }
            }
            this.togglePanel(targetPanel, true);
        } else {
            this.togglePanel(targetPanel);
        }
    }

    init() {
        const doc = this.getDocument();
        if (!doc) return;

        const collapseTriggers = doc.querySelectorAll(this.config.trigger);
        collapseTriggers.forEach((trigger) => {
            if (trigger.hasAttribute(this.config.attrs.listener)) return;

            const self = this;
            trigger.addEventListener("click", function (event) {
                self.listener(event, this);
            });

            trigger.setAttribute(this.config.attrs.listener, "true");
        });
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

export default CollapseService;
