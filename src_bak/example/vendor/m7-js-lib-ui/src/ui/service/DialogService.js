/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export class DialogService {
    constructor(lib, opts = {}) {
        this.lib = lib;
        this.MOD = "[ui.dialog]";
        this.SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
        this.SERVICE_TAG = "ui.dialog";

        this.config = {};
        this.started = false;

        const self = this;
        this._delegatedOpenHandler = function (event) {
            if (event && typeof event.preventDefault === "function") {
                event.preventDefault();
            }
            return self.triggerOpen(this);
        };

        this._delegatedCloseHandler = function (event) {
            if (event && typeof event.preventDefault === "function") {
                event.preventDefault();
            }
            return self.triggerClose(this);
        };

        this.defaultConfig();
        if (opts && typeof opts === "object") {
            this.setConfig(opts);
        }
    }

    getRoot() {
        const root = this.lib.hash.get(this.lib, "_env.root", null);
        if (root) return root;
        if (typeof globalThis !== "undefined") return globalThis;
        return {};
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
            trigger: "[data-dialog-trigger]",
            close: "[data-dialog-close]",
            parent: "[data-dialog-parent]",
            hidden: "modal-hidden",
            visible: "modal-visible",
            lock: "modal-lock",
            content: "modal-content",
            zcontent: "modal-container",
            backdrop: "modal-backdrop",
            attrs: {
                listener: "data-listener-added",
                group: "data-toggle-group",
                on: "data-toggle-on",
                off: "data-toggle-off",
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

    runChain(nodeLike, attr) {
        const node = this.lib.dom.attempt(nodeLike);
        if (!node) return;

        const parent = typeof node.closest === "function" ? node.closest(this.config.parent) : null;
        const value = node.getAttribute(attr) ?? (parent ? parent.getAttribute(attr) : null);
        return this.lib.func.get(this.config.chain)(node, value);
    }

    ensureModalBackdrop(target = null, trigger = null) {
        const doc = this.getDocument();
        if (!doc) return null;

        let backdropContainer = doc.getElementById(this.config.backdrop);
        if (!backdropContainer) {
            backdropContainer = doc.createElement("div");
            backdropContainer.id = this.config.backdrop;
            backdropContainer.classList.add(this.config.hidden);

            const backdrop = doc.createElement("div");
            backdrop.classList.add("modal-backdrop");
            backdropContainer.appendChild(backdrop);

            if (doc.body) {
                doc.body.insertBefore(backdropContainer, doc.body.firstChild);
            }
        }

        const backdrop = backdropContainer.querySelector(".modal-backdrop");
        if (!backdrop) return backdropContainer;

        if (trigger) {
            const triggerNode = this.lib.dom.attempt(trigger);
            if (triggerNode && triggerNode.id) {
                backdrop.setAttribute("data-trigger", triggerNode.id);
            }
        } else {
            backdrop.removeAttribute("data-trigger");
        }

        if (!backdrop.hasAttribute(this.config.attrs.listener)) {
            const self = this;
            backdrop.addEventListener("click", function (e) {
                const backdropEl = e.currentTarget;
                const triggerId = backdropEl.getAttribute("data-trigger") ?? null;
                const linkedTrigger = triggerId ? doc.getElementById(triggerId) : null;

                let useButton = null;
                if (linkedTrigger) {
                    const bdClose = linkedTrigger.getAttribute("data-backdrop-close");
                    if (bdClose) {
                        useButton = self.lib.dom.attempt(bdClose);
                    }
                }

                if (useButton) {
                    useButton.click();
                } else {
                    self.close();
                }
            });

            backdrop.setAttribute(this.config.attrs.listener, "true");
        }

        return backdropContainer;
    }

    modalIsTextSelected() {
        const root = this.getRoot();
        if (!root || typeof root.getSelection !== "function") return false;
        const selection = root.getSelection();
        return !!(selection && selection.toString && selection.toString().length > 0);
    }

    triggerOpen(trigger) {
        if (this.modalIsTextSelected()) return;

        const triggerNode = this.lib.dom.attempt(trigger, true);
        const target = this.lib.dom.get(triggerNode, "aria-controls") ?? null;
        if (!target) {
            throw new Error("target not found for modal open");
        }

        this.runChain(triggerNode, this.config.attrs.on);
        this.dialogOpen(target, triggerNode);
    }

    openBackdrop(target = null, trigger = null) {
        const doc = this.getDocument();
        if (!doc || !doc.documentElement || !doc.body) return;

        const scrollTop = doc.documentElement.scrollTop;
        const dbScrollTop = doc.body.scrollTop;

        doc.documentElement.classList.add(this.config.lock);
        doc.body.classList.add(this.config.lock);
        doc.documentElement.scrollTop = doc.body.scrollTop = scrollTop;

        const backdrop = this.ensureModalBackdrop(target, trigger);
        if (!backdrop) return;

        backdrop.classList.remove(this.config.hidden);
        backdrop.setAttribute("data-scrolltop", scrollTop);
        backdrop.setAttribute("data-dbscrolltop", dbScrollTop);
    }

    closeBackdrop() {
        const backdrop = this.lib.dom.getElement(this.config.backdrop);
        const doc = this.getDocument();
        if (!backdrop || !doc || !doc.documentElement || !doc.body) return;

        if (!backdrop.classList.contains(this.config.hidden)) {
            const scrollTop = backdrop.getAttribute("data-scrolltop") ?? doc.documentElement.scrollTop;
            const dbScrollTop = backdrop.getAttribute("data-dbscrolltop") ?? scrollTop;

            doc.documentElement.classList.remove(this.config.lock);
            doc.body.classList.remove(this.config.lock);
            doc.documentElement.scrollTop = doc.body.scrollTop = scrollTop;

            backdrop.removeAttribute("data-scrolltop");
            backdrop.removeAttribute("data-dbscrolltop");
        }

        const trigger = backdrop.getAttribute("data-trigger");
        if (trigger) {
            this.runChain(trigger, this.config.attrs.off);
        }

        backdrop.classList.add(this.config.hidden);
        backdrop.removeAttribute("data-target");
        backdrop.removeAttribute("data-trigger");
    }

    dialogOpen(target, trigger = null) {
        if (this.modalIsTextSelected()) return;

        const targetNode = this.lib.dom.attempt(target, true);

        if (this.lib.bool.yes(this.lib.dom.get(targetNode, "aria-modal"))) {
            this.close();
            this.openBackdrop(targetNode, trigger);
        }

        targetNode.classList.add(this.config.visible);
        this.lib.dom.set(targetNode, "aria-hidden", "false");
        targetNode.classList.add(this.config.content);

        this.runChain(targetNode, this.config.attrs.on);
        return false;
    }

    triggerClose(trigger) {
        const triggerNode = this.lib.dom.attempt(trigger, true);
        this.runChain(triggerNode, this.config.attrs.off);

        const controls = this.lib.dom.get(triggerNode, "aria-controls");
        if (this.lib.utils.isEmpty(controls)) {
            return this.close();
        }

        const element = controls ? this.lib.dom.getElement(controls) : null;
        if (!element) {
            throw new Error(`Modal element for aria-controls "${controls}" not found.`);
        }

        this.close(element);
    }

    isModalOpen(target = null) {
        const doc = this.getDocument();
        if (!doc) return null;

        const closeList = [];

        if (!this.lib.utils.isEmpty(target)) {
            const node = this.lib.dom.attempt(target, true);
            if (this.lib.bool.yes(node.getAttribute("aria-modal"))) {
                closeList.push(node);
            }
        } else {
            const list = doc.querySelectorAll(`.${this.config.content}`);
            for (const node of list) {
                if (this.lib.bool.yes(node.getAttribute("aria-modal"))) {
                    closeList.push(node);
                }
            }
        }

        if (!closeList || closeList.length < 1) return null;
        return closeList;
    }

    close(target = null, silent = false) {
        const doc = this.getDocument();
        if (!doc) return false;

        let closeList = [];
        let closeBackdrop = false;

        if (!this.lib.utils.isEmpty(target)) {
            const node = this.lib.dom.attempt(target, true);
            if (this.lib.bool.yes(node.getAttribute("aria-modal"))) {
                closeBackdrop = true;
            }
            if (!node.matches(`.${this.config.content}`)) {
                if (!silent) {
                    throw new Error("invalid modal target");
                }
            } else {
                closeList.push(node);
            }
        } else {
            closeBackdrop = true;
            closeList = doc.querySelectorAll(`.${this.config.content}`);
            if (!closeList || closeList.length < 1) return false;
        }

        for (const node of closeList) {
            node.classList.remove(this.config.visible);
            node.classList.remove(this.config.content);
            this.lib.dom.set(node, "aria-hidden", "true");
            this.runChain(node, this.config.attrs.off);
        }

        if (closeBackdrop) {
            this.closeBackdrop();
        }

        return false;
    }

    init() {
        const doc = this.getDocument();
        if (!doc) return;

        const triggers = doc.querySelectorAll(this.config.trigger);
        triggers.forEach((trigger) => {
            if (trigger.hasAttribute(this.config.attrs.listener)) return;

            const self = this;
            trigger.addEventListener("click", function (event) {
                if (event && typeof event.preventDefault === "function") {
                    event.preventDefault();
                }
                self.triggerOpen(this);
            });

            trigger.setAttribute(this.config.attrs.listener, "true");
        });

        const closeTriggers = doc.querySelectorAll(this.config.close);
        closeTriggers.forEach((trigger) => {
            if (trigger.hasAttribute(this.config.attrs.listener)) return;

            const self = this;
            trigger.addEventListener("click", function (event) {
                if (event && typeof event.preventDefault === "function") {
                    event.preventDefault();
                }
                self.triggerClose(this);
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
            handler: this._delegatedOpenHandler,
            tag: this.SERVICE_TAG,
        });

        delegator.set({
            eventType: "click",
            selector: this.config.close,
            handler: this._delegatedCloseHandler,
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

export default DialogService;
