/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

const RESERVED_TOGGLE_LINKS = new Set([
  "menu",
  "links",
  "navbar",
  "navbar-links",
  "toggle-links",
]);

const RESERVED_CLOSE_ALL = new Set([
  "close",
  "close-all",
  "dismiss",
  "dismiss-all",
]);

export class NavbarService {
  constructor(lib, opts = {}) {
    this.lib = lib;
    this.MOD = "[ui.navbar]";
    this.SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
    this.SERVICE_TAG = "ui.navbar";

    this.config = {};
    this.started = false;

    const self = this;
    this._delegatedTriggerHandler = function (event) {
      return self.handleTrigger(this, event);
    };
    this._outsideClickHandler = function (event) {
      return self.handleDocumentClick(event);
    };
    this._escapeHandler = function (event) {
      return self.handleKeyDown(event);
    };
    this._resizeHandler = function () {
      return self.handleResize();
    };
    this._hoverProbeHandler = function (event) {
      return self.handleHoverProbe(event);
    };
    this._lastHoverProbeNode = null;

    this.defaultConfig();
    if (opts && typeof opts === "object") {
      this.setConfig(opts);
    }
  }

  getRootObject() {
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

  defaultConfig() {
    this.config = {
      rootSelector: ".navbar",
      linksSelector: ".navbar__links",
      dropdownSelector: ".navbar__dropdown",
      menuSelector: ".navbar__dropdown--menu",
      triggerSelector: "",
      triggerAttrs: ["data-nav-trigger", "m7-nav-trigger"],
      navOpenClass: "open",
      dropdownOpenClass: "open",
      toggleOpenClass: "open",
      rootOpenClass: "navbar-open",
      topLevelHoverClass: "navbar-hover-open",
      enableTopLevelHoverOpen: false,
      enableAutoFlip: true,
      flipLeftClass: "navbar__dropdown--flip-left",
      centerClass: "navbar__dropdown--center",
      measureClass: "navbar__dropdown--measuring",
      viewportPadding: 8,
      probeOnHover: true,
      dropBehaviorDefault: "auto",
      dropBehaviorAttrs: [
        "nav-drop-behavior",
        "data-nav-drop-behavior",
        "m7-nav-drop-behavior",
      ],
      mobileMaxWidth: 800,
      closeOnOutside: true,
      closeOnEscape: true,
      closeOnResizeDesktop: true,
      closeSiblings: true,
      preventDefault: true,
      stopPropagation: true,
    };
    return this.config;
  }

  getConfig() {
    return this.config;
  }

  setConfig(conf = {}) {
    conf = this.lib.hash.to(conf);
    for (const k in conf) {
      this.lib.hash.set(this.config, k, conf[k]);
    }
    this.config.triggerAttrs = this.normalizeTriggerAttrs(this.config.triggerAttrs);
    this.config.dropBehaviorAttrs = this.normalizeDropBehaviorAttrs(this.config.dropBehaviorAttrs);
    this.config.dropBehaviorDefault = this.normalizeDropBehavior(this.config.dropBehaviorDefault);
    this.applyTopLevelHoverClass();
    this.syncFlipAll(true);
    return this.config;
  }

  normalizeTriggerAttrs(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
    return String(value || "")
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  normalizeDropBehaviorAttrs(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    }
    return String(value || "")
      .split(/[\s,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  normalizeDropBehavior(value) {
    const raw = String(value || "").trim().toLowerCase();
    if (!raw) return "auto";

    if (raw === "left" || raw === "to-left" || raw === "l") return "left";
    if (raw === "right" || raw === "to-right" || raw === "r") return "right";
    if (raw === "center" || raw === "centre" || raw === "middle" || raw === "mid") return "center";
    if (raw === "auto" || raw === "smart") return "auto";
    return "auto";
  }

  buildLocalTriggerSelector() {
    const selectors = [];

    if (typeof this.config.triggerSelector === "string" && this.config.triggerSelector.trim()) {
      selectors.push(this.config.triggerSelector.trim());
    }

    const attrs = this.normalizeTriggerAttrs(this.config.triggerAttrs);
    for (const attr of attrs) {
      selectors.push(attr.startsWith("[") ? attr : `[${attr}]`);
    }

    return [...new Set(selectors)].join(", ");
  }

  buildScopedTriggerSelector() {
    const root = String(this.config.rootSelector || "").trim();
    const local = this.buildLocalTriggerSelector();
    if (!root || !local) return "";

    return local
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => `${root} ${selector}`)
      .join(", ");
  }

  isDesktop() {
    const root = this.getRootObject();
    const width = Number(root && root.innerWidth);
    const maxMobile = Number(this.config.mobileMaxWidth);
    if (!Number.isFinite(width) || !Number.isFinite(maxMobile)) return false;
    return width > maxMobile;
  }

  getViewportWidth() {
    const root = this.getRootObject();
    const width = Number(root && root.innerWidth);
    if (Number.isFinite(width) && width > 0) return width;
    return 0;
  }

  clearFlipState(dropdown) {
    if (!dropdown || !dropdown.classList) return;
    const flipClass = String(this.config.flipLeftClass || "").trim();
    const centerClass = String(this.config.centerClass || "").trim();
    const measureClass = String(this.config.measureClass || "").trim();
    if (flipClass) dropdown.classList.remove(flipClass);
    if (centerClass) dropdown.classList.remove(centerClass);
    if (measureClass) dropdown.classList.remove(measureClass);
  }

  resolveDropBehaviorValue(dropdown, trigger = null) {
    const attrs = this.normalizeDropBehaviorAttrs(this.config.dropBehaviorAttrs);
    if (!attrs.length) return "";

    const menu = this.findDirectMenu(dropdown);
    const ownerTrigger = trigger || this.findPrimaryTrigger(dropdown);

    for (const attr of attrs) {
      if (dropdown && typeof dropdown.hasAttribute === "function" && dropdown.hasAttribute(attr)) {
        return String(dropdown.getAttribute(attr) || "").trim();
      }
      if (ownerTrigger && typeof ownerTrigger.hasAttribute === "function" && ownerTrigger.hasAttribute(attr)) {
        return String(ownerTrigger.getAttribute(attr) || "").trim();
      }
      if (menu && typeof menu.hasAttribute === "function" && menu.hasAttribute(attr)) {
        return String(menu.getAttribute(attr) || "").trim();
      }
    }

    return "";
  }

  resolveDropBehavior(dropdown, trigger = null) {
    const explicit = this.resolveDropBehaviorValue(dropdown, trigger);
    if (explicit) {
      return this.normalizeDropBehavior(explicit);
    }
    return this.normalizeDropBehavior(this.config.dropBehaviorDefault);
  }

  isMenuVisible(menu) {
    if (!menu) return false;
    if (typeof menu.getBoundingClientRect !== "function") return false;
    const root = this.getRootObject();
    if (!root || typeof root.getComputedStyle !== "function") {
      const rect = menu.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }

    const style = root.getComputedStyle(menu);
    if (!style) return false;
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = menu.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  measureMenuRect(dropdown, forceVisible = false) {
    const menu = this.findDirectMenu(dropdown);
    if (!menu || typeof menu.getBoundingClientRect !== "function") return null;

    const measureClass = String(this.config.measureClass || "").trim();
    let addedMeasureClass = false;
    if (forceVisible && measureClass && dropdown.classList) {
      dropdown.classList.add(measureClass);
      addedMeasureClass = true;
    }

    const rect = menu.getBoundingClientRect();

    if (addedMeasureClass) {
      dropdown.classList.remove(measureClass);
    }

    return rect;
  }

  getOverflowScore(rect) {
    if (!rect) return Number.POSITIVE_INFINITY;
    const width = this.getViewportWidth();
    if (!width) return 0;

    const pad = Number(this.config.viewportPadding);
    const padding = Number.isFinite(pad) ? Math.max(0, pad) : 0;
    const minX = padding;
    const maxX = width - padding;

    const leftOverflow = Math.max(0, minX - rect.left);
    const rightOverflow = Math.max(0, rect.right - maxX);
    return leftOverflow + rightOverflow;
  }

  updateFlipDirection(dropdown, { forceMeasure = false } = {}) {
    if (!dropdown || !dropdown.classList) return false;

    const flipClass = String(this.config.flipLeftClass || "").trim();
    const centerClass = String(this.config.centerClass || "").trim();
    this.clearFlipState(dropdown);
    if (!this.isDesktop()) return false;

    const menu = this.findDirectMenu(dropdown);
    if (!menu) return false;

    const behavior = this.resolveDropBehavior(dropdown);
    if (behavior === "left") {
      if (flipClass) {
        dropdown.classList.add(flipClass);
        return true;
      }
      return false;
    }
    if (behavior === "center") {
      if (centerClass) {
        dropdown.classList.add(centerClass);
        return true;
      }
      return false;
    }
    if (behavior === "right") {
      return false;
    }
    if (!this.config.enableAutoFlip || !flipClass) {
      return false;
    }

    const shouldForceMeasure = forceMeasure || !this.isMenuVisible(menu);
    const defaultRect = this.measureMenuRect(dropdown, shouldForceMeasure);
    const defaultScore = this.getOverflowScore(defaultRect);
    if (!Number.isFinite(defaultScore)) return false;

    if (defaultScore <= 0) {
      return false;
    }

    dropdown.classList.add(flipClass);
    const flippedRect = this.measureMenuRect(dropdown, shouldForceMeasure);
    const flippedScore = this.getOverflowScore(flippedRect);
    if (!Number.isFinite(flippedScore)) return true;

    if (flippedScore > defaultScore) {
      dropdown.classList.remove(flipClass);
      return false;
    }

    return true;
  }

  syncFlipForRoot(root, forceMeasure = false) {
    if (!root || typeof root.querySelectorAll !== "function") return false;
    const selector = String(this.config.dropdownSelector || "").trim();
    if (!selector) return false;

    const dropdowns = root.querySelectorAll(selector);
    for (const dropdown of dropdowns) {
      this.updateFlipDirection(dropdown, { forceMeasure });
    }

    return true;
  }

  syncFlipAll(forceMeasure = false) {
    const roots = this.getAllRoots();
    for (const root of roots) {
      this.syncFlipForRoot(root, forceMeasure);
    }
    return true;
  }

  findNavRoot(node) {
    if (!node || typeof node.closest !== "function") return null;
    const selector = String(this.config.rootSelector || "").trim();
    if (!selector) return null;
    return node.closest(selector);
  }

  getAllRoots() {
    const doc = this.getDocument();
    if (!doc) return [];
    const selector = String(this.config.rootSelector || "").trim();
    if (!selector) return [];
    return Array.from(doc.querySelectorAll(selector));
  }

  findLinks(root) {
    if (!root) return null;
    const selector = String(this.config.linksSelector || "").trim();
    if (!selector) return null;
    return root.querySelector(selector);
  }

  findDropdownOwner(node) {
    if (!node || typeof node.closest !== "function") return null;
    const selector = String(this.config.dropdownSelector || "").trim();
    if (!selector) return null;
    return node.closest(selector);
  }

  findDirectMenu(dropdown) {
    if (!dropdown || !dropdown.children) return null;
    const selector = String(this.config.menuSelector || "").trim();
    if (!selector) return null;

    for (const child of dropdown.children) {
      if (typeof child.matches === "function" && child.matches(selector)) {
        return child;
      }
    }
    return null;
  }

  findToggleNode(root) {
    if (!root) return null;
    const localTriggerSelector = this.buildLocalTriggerSelector();
    if (localTriggerSelector) {
      const list = root.querySelectorAll(localTriggerSelector);
      for (const node of list) {
        if (node.classList && node.classList.contains("navbar__toggle")) {
          return node;
        }
      }
    }
    return root.querySelector(".navbar__toggle");
  }

  setExpanded(node, value) {
    if (!node || typeof node.setAttribute !== "function") return;
    node.setAttribute("aria-expanded", value ? "true" : "false");
  }

  closeDescendants(dropdown) {
    if (!dropdown) return;
    const selector = String(this.config.dropdownSelector || "").trim();
    const openClass = String(this.config.dropdownOpenClass || "open").trim();
    if (!selector || !openClass) return;

    const list = dropdown.querySelectorAll(`${selector}.${openClass}`);
    for (const child of list) {
      child.classList.remove(openClass);
      this.clearFlipState(child);
      const trigger = this.findPrimaryTrigger(child);
      this.setExpanded(trigger, false);
    }
  }

  closeSiblings(dropdown) {
    if (!dropdown || !dropdown.parentElement || !this.config.closeSiblings) return;

    const selector = String(this.config.dropdownSelector || "").trim();
    const openClass = String(this.config.dropdownOpenClass || "open").trim();
    if (!selector || !openClass) return;

    for (const child of dropdown.parentElement.children) {
      if (child === dropdown) continue;
      if (typeof child.matches !== "function" || !child.matches(selector)) continue;
      child.classList.remove(openClass);
      this.clearFlipState(child);
      this.closeDescendants(child);
      const trigger = this.findPrimaryTrigger(child);
      this.setExpanded(trigger, false);
    }
  }

  findPrimaryTrigger(dropdown) {
    if (!dropdown || !dropdown.children) return null;

    const localTriggerSelector = this.buildLocalTriggerSelector();
    for (const child of dropdown.children) {
      if (!child || typeof child.matches !== "function") continue;
      if (localTriggerSelector && child.matches(localTriggerSelector)) {
        return child;
      }
      if (child.matches("a,button,[role='button']")) {
        return child;
      }
    }
    return null;
  }

  toggleDropdown(dropdown, trigger = null) {
    if (!dropdown) return false;

    const openClass = String(this.config.dropdownOpenClass || "open").trim();
    if (!openClass) return false;

    const next = !dropdown.classList.contains(openClass);

    if (next) {
      this.closeSiblings(dropdown);
      this.updateFlipDirection(dropdown, { forceMeasure: true });
    }

    dropdown.classList.toggle(openClass, next);
    if (!next) {
      this.clearFlipState(dropdown);
      this.closeDescendants(dropdown);
    }

    const ownerTrigger = trigger || this.findPrimaryTrigger(dropdown);
    this.setExpanded(ownerTrigger, next);
    return next;
  }

  toggleLinks(root, trigger = null) {
    const links = this.findLinks(root);
    if (!links) return false;

    const navClass = String(this.config.navOpenClass || "open").trim();
    const toggleClass = String(this.config.toggleOpenClass || "open").trim();
    const rootClass = String(this.config.rootOpenClass || "navbar-open").trim();

    const next = !links.classList.contains(navClass);
    links.classList.toggle(navClass, next);

    const toggle = trigger || this.findToggleNode(root);
    if (toggle) {
      toggle.classList.toggle(toggleClass, next);
      this.setExpanded(toggle, next);
    }

    if (rootClass) {
      root.classList.toggle(rootClass, next);
    }

    if (!next) {
      this.closeDropdownTree(root);
    }

    return next;
  }

  closeDropdownTree(root) {
    if (!root) return;
    const selector = String(this.config.dropdownSelector || "").trim();
    const openClass = String(this.config.dropdownOpenClass || "open").trim();
    if (!selector || !openClass) return;

    const openNodes = root.querySelectorAll(`${selector}.${openClass}`);
    for (const node of openNodes) {
      node.classList.remove(openClass);
      this.clearFlipState(node);
      const trigger = this.findPrimaryTrigger(node);
      this.setExpanded(trigger, false);
    }
  }

  closeRoot(root) {
    if (!root) return;

    const links = this.findLinks(root);
    const navClass = String(this.config.navOpenClass || "open").trim();
    const rootClass = String(this.config.rootOpenClass || "navbar-open").trim();
    const toggleClass = String(this.config.toggleOpenClass || "open").trim();

    if (links && navClass) {
      links.classList.remove(navClass);
    }
    if (rootClass) {
      root.classList.remove(rootClass);
    }

    const toggle = this.findToggleNode(root);
    if (toggle && toggleClass) {
      toggle.classList.remove(toggleClass);
      this.setExpanded(toggle, false);
    }

    this.closeDropdownTree(root);
  }

  closeAll() {
    const roots = this.getAllRoots();
    for (const root of roots) {
      this.closeRoot(root);
    }
    return true;
  }

  applyTopLevelHoverClass() {
    const hoverClass = String(this.config.topLevelHoverClass || "").trim();
    const enabled = !!this.config.enableTopLevelHoverOpen;
    if (!hoverClass) return false;

    const roots = this.getAllRoots();
    for (const root of roots) {
      root.classList.toggle(hoverClass, enabled);
    }
    return true;
  }

  resolveBinding(trigger) {
    const attrs = this.normalizeTriggerAttrs(this.config.triggerAttrs);
    for (const attr of attrs) {
      if (typeof trigger.hasAttribute === "function" && trigger.hasAttribute(attr)) {
        const value = String(trigger.getAttribute(attr) || "").trim();
        return { attr, value };
      }
    }
    return { attr: null, value: "" };
  }

  resolveTargetNode(root, rawTarget) {
    const doc = this.getDocument();
    if (!doc) return null;

    const target = String(rawTarget || "").trim();
    if (!target) return null;

    if (target.startsWith("#")) {
      return doc.getElementById(target.slice(1));
    }

    if (root && typeof root.querySelector === "function") {
      try {
        const inRoot = root.querySelector(target);
        if (inRoot) return inRoot;
      } catch (err) {
        // ignore invalid query and continue fallback.
      }
    }

    const byId = doc.getElementById(target);
    if (byId) return byId;

    try {
      return doc.querySelector(target);
    } catch (err) {
      return null;
    }
  }

  resolveAction(trigger, root) {
    if (!trigger || !root) return { type: "none" };

    const binding = this.resolveBinding(trigger);
    const value = binding.value;
    const lower = value.toLowerCase();

    if (RESERVED_CLOSE_ALL.has(lower)) {
      return { type: "close-all" };
    }
    if (RESERVED_TOGGLE_LINKS.has(lower)) {
      return { type: "links" };
    }
    if (value) {
      return { type: "target", target: value };
    }

    if (trigger.classList && trigger.classList.contains("navbar__toggle")) {
      return { type: "links" };
    }

    const dropdown = this.findDropdownOwner(trigger);
    const submenu = dropdown ? this.findDirectMenu(dropdown) : null;
    if (dropdown && submenu) {
      return { type: "dropdown", dropdown };
    }

    const controls = String(trigger.getAttribute("aria-controls") || "").trim();
    if (controls) {
      return { type: "target", target: controls };
    }

    return { type: "none" };
  }

  shouldStopAndPrevent(event) {
    if (!event) return;
    if (this.config.preventDefault && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    if (this.config.stopPropagation && typeof event.stopPropagation === "function") {
      event.stopPropagation();
    }
  }

  handleTargetAction(root, trigger, rawTarget) {
    const targetNode = this.resolveTargetNode(root, rawTarget);
    if (!targetNode) return false;

    const linksSelector = String(this.config.linksSelector || "").trim();
    const menuSelector = String(this.config.menuSelector || "").trim();
    const dropdownSelector = String(this.config.dropdownSelector || "").trim();

    if (linksSelector && typeof targetNode.matches === "function" && targetNode.matches(linksSelector)) {
      this.toggleLinks(root, trigger);
      return true;
    }

    if (menuSelector && typeof targetNode.matches === "function" && targetNode.matches(menuSelector)) {
      const owner = this.findDropdownOwner(targetNode);
      if (!owner) return false;
      this.toggleDropdown(owner, trigger);
      return true;
    }

    if (dropdownSelector && typeof targetNode.matches === "function" && targetNode.matches(dropdownSelector)) {
      this.toggleDropdown(targetNode, trigger);
      return true;
    }

    const owner = this.findDropdownOwner(targetNode);
    if (owner && this.findDirectMenu(owner)) {
      this.toggleDropdown(owner, trigger);
      return true;
    }

    return false;
  }

  handleTrigger(trigger, event = null) {
    if (!trigger || typeof trigger.closest !== "function") return false;

    const root = this.findNavRoot(trigger);
    if (!root) return false;

    const action = this.resolveAction(trigger, root);
    if (action.type === "none") return false;

    this.shouldStopAndPrevent(event);

    if (action.type === "close-all") {
      this.closeAll();
      return true;
    }

    if (action.type === "links") {
      this.toggleLinks(root, trigger);
      return true;
    }

    if (action.type === "dropdown") {
      this.toggleDropdown(action.dropdown, trigger);
      return true;
    }

    if (action.type === "target") {
      return this.handleTargetAction(root, trigger, action.target);
    }

    return false;
  }

  handleDocumentClick(event) {
    if (!this.started || !this.config.closeOnOutside) return false;
    const target = event && event.target;
    if (target && typeof target.closest === "function") {
      const rootSelector = String(this.config.rootSelector || "").trim();
      const inNavbar = rootSelector ? target.closest(rootSelector) : null;
      if (inNavbar) {
        // Mobile UX: tapping a non-trigger link should collapse open menus.
        if (!this.isDesktop()) {
          const localTriggerSelector = this.buildLocalTriggerSelector();
          const isTriggerClick = localTriggerSelector
            ? !!target.closest(localTriggerSelector)
            : false;
          if (!isTriggerClick) {
            const link = target.closest("a[href]");
            if (link) {
              this.closeRoot(inNavbar);
              return true;
            }
          }
        }
        return false;
      }
    }
    this.closeAll();
    return true;
  }

  handleKeyDown(event) {
    if (!this.started || !this.config.closeOnEscape) return false;
    const key = String((event && event.key) || "");
    if (key !== "Escape") return false;
    this.closeAll();
    return true;
  }

  handleResize() {
    if (!this.started) return false;
    if (this.config.closeOnResizeDesktop && this.isDesktop()) {
      this.closeAll();
    }
    this._lastHoverProbeNode = null;
    this.syncFlipAll(true);
    return true;
  }

  handleHoverProbe(event) {
    if (!this.started || !this.config.enableAutoFlip || !this.config.probeOnHover) return false;
    if (!this.isDesktop()) return false;

    const target = event && event.target;
    if (!target || typeof target.closest !== "function") return false;

    const selector = String(this.config.dropdownSelector || "").trim();
    if (!selector) return false;

    const dropdown = target.closest(selector);
    if (!dropdown) return false;
    if (this._lastHoverProbeNode === dropdown) return false;

    const root = this.findNavRoot(dropdown);
    if (!root) return false;

    this._lastHoverProbeNode = dropdown;
    this.updateFlipDirection(dropdown, { forceMeasure: true });
    return true;
  }

  start() {
    if (this.started) return true;

    const selector = this.buildScopedTriggerSelector();
    if (!selector) {
      throw new Error(`${this.MOD} cannot start: no trigger selector could be derived.`);
    }

    const [delegator] = this.lib.require.service(this.SERVICE_EVENT_DELEGATOR, { mod: this.MOD });
    delegator.set({
      eventType: "click",
      selector,
      handler: this._delegatedTriggerHandler,
      tag: this.SERVICE_TAG,
    });

    const doc = this.getDocument();
    const root = this.getRootObject();
    this.applyTopLevelHoverClass();
    if (doc && this.config.closeOnOutside) {
      doc.addEventListener("click", this._outsideClickHandler);
    }
    if (doc && this.config.closeOnEscape) {
      doc.addEventListener("keydown", this._escapeHandler);
    }
    if (doc && this.config.enableAutoFlip && this.config.probeOnHover) {
      doc.addEventListener("mouseover", this._hoverProbeHandler);
    }
    if (
      root &&
      typeof root.addEventListener === "function" &&
      (this.config.closeOnResizeDesktop || this.config.enableAutoFlip)
    ) {
      root.addEventListener("resize", this._resizeHandler);
    }

    this.syncFlipAll(true);
    this.started = true;
    return true;
  }

  stop() {
    if (!this.started) return false;

    const [delegator] = this.lib.require.service(this.SERVICE_EVENT_DELEGATOR, { mod: this.MOD });
    delegator.offTag(this.SERVICE_TAG);

    const doc = this.getDocument();
    const root = this.getRootObject();
    if (doc) {
      doc.removeEventListener("click", this._outsideClickHandler);
      doc.removeEventListener("keydown", this._escapeHandler);
      doc.removeEventListener("mouseover", this._hoverProbeHandler);
    }
    if (root && typeof root.removeEventListener === "function") {
      root.removeEventListener("resize", this._resizeHandler);
    }

    const hoverClass = String(this.config.topLevelHoverClass || "").trim();
    if (hoverClass) {
      const roots = this.getAllRoots();
      for (const item of roots) {
        item.classList.remove(hoverClass);
      }
    }

    this.closeAll();
    this._lastHoverProbeNode = null;
    this.started = false;
    return true;
  }

  isStarted() {
    return this.started;
  }
}

export default NavbarService;
