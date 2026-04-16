/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export class TabsService {
    constructor(lib, opts = {}) {
        this.lib = lib;
        this.MOD = "[ui.tabs]";
        this.SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
        this.SERVICE_TAG = "ui.tabs";

        this.config = {};
        this.started = false;

        const self = this;
        this._delegatedHandler = function () {
            return self.toggleGroupVisibility(this);
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
            trigger: "[data-tab-trigger]",
            parent: "[data-tab-parent]",
            children: "data-children",
            hidden: "tab-hidden",
            selected: "selected",
            attrs: {
                listener: "data-listener-added",
                group: "data-toggle-group",
                on: "data-toggle-on",
                off: "data-toggle-off",
            },
            allow_rerun_on: false,
            allow_rerun_off: false,
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

    handleTabs(element, tabList) {
        const siblings = tabList.querySelectorAll(this.config.trigger);

        let previousSelected = null;
        siblings.forEach((sib) => {
            if (!sib.classList.contains(this.config.selected)) return;
            previousSelected = sib;
            sib.classList.remove(this.config.selected);
            sib.setAttribute("aria-selected", "false");
        });

        if (previousSelected) {
            if (this.config.allow_rerun_off || previousSelected !== element) {
                this.runChain(previousSelected, this.config.attrs.off);
            }
        }

        element.classList.add(this.config.selected);
        element.setAttribute("aria-selected", "true");

        if (this.config.allow_rerun_on || previousSelected !== element) {
            this.runChain(element, this.config.attrs.on);
        }
    }

    toggleGroupVisibility(element) {
        const doc = this.getDocument();
        if (!doc || !element) return;

        const targetPanelId = element.getAttribute("aria-controls");

        const tabList = element.closest("[role=tablist]");
        if (!tabList) {
            console.error("tablist not found");
            return;
        }
        this.handleTabs(element, tabList);

        const targetPanel = doc.getElementById(targetPanelId);
        if (!targetPanel) {
            const tabParent = element.closest(this.config.parent);
            if (
                element.getAttribute("data-no-controls") === "true" ||
                (tabParent && tabParent.getAttribute("data-no-controls") === "true")
            ) {
                return;
            }
            console.error(`No panel found with id "${targetPanelId}"`);
            return;
        }

        const parent = targetPanel.closest(this.config.parent);
        const groupName = targetPanel.getAttribute(this.config.attrs.group) ??
            (parent ? parent.getAttribute(this.config.attrs.group) : null);

        if (this.lib.utils.isEmpty(groupName)) {
            console.warn(`No valid toggle group found for panel with id "${targetPanelId}"`);
            return;
        }

        let allPanels = Array.from(
            doc.querySelectorAll(`[${this.config.attrs.group}="${groupName}"]:not(${this.config.parent})`)
        );

        if (parent) {
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

        allPanels.forEach((panel) => {
            panel.classList.add(this.config.hidden);
            panel.setAttribute("aria-hidden", "true");
            if (targetPanel !== panel) {
                this.runChain(panel, this.config.attrs.off);
            }
        });

        targetPanel.classList.remove(this.config.hidden);
        targetPanel.setAttribute("aria-hidden", "false");
        this.runChain(targetPanel, this.config.attrs.on);
    }

    init() {
        const doc = this.getDocument();
        if (!doc) return;

        const toggleItems = doc.querySelectorAll(this.config.trigger);
        toggleItems.forEach((item) => {
            if (item.hasAttribute(this.config.attrs.listener)) return;

            const self = this;
            item.addEventListener("click", function () {
                self.toggleGroupVisibility(this);
            });

            item.setAttribute(this.config.attrs.listener, "true");
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

export default TabsService;
