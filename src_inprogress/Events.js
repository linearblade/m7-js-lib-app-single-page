/*
  Single Page App event handling tools.
  version: proof of concept
*/

const MOD = '[app.SinglePageApp.Events]';
let SPA_INSTANCE_SEQ = 0;

function normalizeWorkspace(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

class Events {

    constructor({lib, controller, asserted, env = null} = {}){
	this.lib = lib;
	this.controller = controller || null;
	this.asserted = asserted || (this.controller && this.controller.asserted) || null;
	this.eventDelegator = this.asserted ? this.asserted.eventDelegator : null;
	this.env = normalizeWorkspace(env);
	this.selectors = Object.create(null);
	this.listenerSelectors = [];
	this.listenerTag = `${MOD}:${++SPA_INSTANCE_SEQ}`;
    }

    resolveControllerRoot(){
	return this.controller && this.controller.root ? this.controller.root : null;
    }

    resolveControllerEnv(){
	return this.resolveControllerRoot();
    }

    resolveEventRoot(){
	const root = this.resolveControllerRoot();
	return root ? root.root : null;
    }

    resolveEventHost(){
	const root = this.resolveControllerRoot();
	return root ? root.host : null;
    }

    setEnv(env = null){
	this.env = normalizeWorkspace(env);
	return this.env;
    }

    resolveListenerEnv(spec = null){
	if (spec && Object.prototype.hasOwnProperty.call(spec, 'env')) {
	    return normalizeWorkspace(spec.env);
	}

	return this.env;
    }

    buildListenerKey(selector, eventType = null){
	return `${eventType == null ? '' : String(eventType)}\u0000${String(selector)}`;
    }

    ensureEventDelegator({start = false} = {}){
	const eventDelegator = this.eventDelegator;
	const root = this.resolveEventRoot();
	const host = this.resolveEventHost();

	if (typeof eventDelegator.setRoot === 'function' && (eventDelegator.root !== root || eventDelegator.host !== host)) {
	    eventDelegator.setRoot(root, host);
	}

	if (start && typeof eventDelegator.start === 'function') {
	    eventDelegator.start();
	}

	return eventDelegator;
    }

    start(){
	this.ensureEventDelegator({start: true});
	return this;
    }

    stop(){
	const eventDelegator = this.eventDelegator;
	if (eventDelegator && typeof eventDelegator.stop === 'function') {
	    eventDelegator.stop();
	}
	return this;
    }

    resolveListenerUrl(dom){
	if (!dom) return null;

	if (typeof dom.getAttribute === 'function') {
	    const href = dom.getAttribute('href');
	    if (href) return href;
	}

	if (typeof dom.href === 'string' && dom.href) {
	    return dom.href;
	}

	if (typeof dom.closest === 'function') {
	    const anchor = dom.closest('a[href]');
	    if (anchor) {
		if (typeof anchor.getAttribute === 'function') {
		    const href = anchor.getAttribute('href');
		    if (href) return href;
		}
		if (typeof anchor.href === 'string' && anchor.href) {
		    return anchor.href;
		}
	    }
	}

	return null;
    }

    buildListenerContext({spec, event, matched}){
	const spa = this.controller || null;
	const globalEnv = spa && spa.env ? spa.env : {};
	const eventEnv = this.resolveListenerEnv(spec);
	// Keep the context thin; handlers can reach into `ctx.spa` for SPA helpers.
	const ctx = {
	    lib: this.lib,
	    selector: spec.selector,
	    eventType: spec.eventType,
	    popstateKey: spec.popstate,
	    spa,
	    env: {
		global: globalEnv,
		event: eventEnv,
	    },
	    element: matched,
	    target: event ? event.target : null,
	    event,
	    url: this.resolveListenerUrl(matched),
	};

	return ctx;
    }

    normalizeListenerSpec(selectorOrSpec, handler, opts = {}, {requireHandler = true, defaultEventType = 'click'} = {}){
	const lib = this.lib;
	const isHash = lib.hash.is(selectorOrSpec);
	const raw = isHash
	    ? Object.assign({}, selectorOrSpec, lib.hash.is(opts) ? opts : {})
	    : Object.assign({}, lib.hash.is(opts) ? opts : {}, {
		selector: selectorOrSpec,
		handler,
	    });

	const selector = lib.str.to(raw.selector, true);
	if (!selector) {
	    throw Error(`${MOD} register requires a selector.`);
	}

	let resolvedHandler = raw.handler;
	if (typeof resolvedHandler === 'string') {
	    resolvedHandler = lib.func.get(resolvedHandler);
	}
	const hasHandler = Object.prototype.hasOwnProperty.call(raw, 'handler') && raw.handler != null;
	if (resolvedHandler == null) {
	    if (requireHandler || hasHandler) {
		throw Error(`${MOD} register requires a handler function.`);
	    }
	} else if (typeof resolvedHandler !== 'function') {
	    throw Error(`${MOD} register requires a handler function.`);
	}

	const eventType = lib.str.to(
	    Object.prototype.hasOwnProperty.call(raw, 'eventType')
		? raw.eventType
		: (Object.prototype.hasOwnProperty.call(raw, 'type') ? raw.type : defaultEventType),
	    true
	) || defaultEventType || null;
	const options = raw.options;
	const policy = lib.hash.is(raw.policy) ? raw.policy : undefined;
	const popstate = lib.hash.is(raw) && Object.prototype.hasOwnProperty.call(raw, 'popstate')
	    ? raw.popstate
	    : null;
	const env = Object.prototype.hasOwnProperty.call(raw, 'env')
	    ? raw.env
	    : undefined;
	const metaTag = Object.prototype.hasOwnProperty.call(raw, 'tag') && raw.tag != null
	    ? String(raw.tag)
	    : null;
	const force = raw.force === true;

	return {
	    selector,
	    eventType,
	    handler: resolvedHandler,
	    options,
	    policy,
	    popstate,
	    env,
	    metaTag,
	    force,
	};
    }

    register(selectorOrSpec, handler, opts = {}){
	const spec = this.normalizeListenerSpec(selectorOrSpec, handler, opts, {
	    requireHandler: true,
	    defaultEventType: 'click',
	});
	const key = this.buildListenerKey(spec.selector, spec.eventType);
	const existing = this.selectors[key];

	if (existing && existing.owner !== this.listenerTag) {
	    throw Error(`${MOD} selector '${spec.selector}' / event '${spec.eventType}' is owned by another registry entry.`);
	}

	if (existing && !spec.force) {
	    throw Error(`${MOD} selector already registered (${spec.selector} / ${spec.eventType}). Use unregister first.`);
	}

	if (existing && typeof existing.off === 'function') {
	    existing.off();
	}

	const self = this;
	const runtimeHandler = function(evt){
	    const matched = this;
	    const ctx = self.buildListenerContext({spec, event: evt, matched});
	    return spec.handler.call(matched, evt, ctx);
	};

	const eventDelegator = this.ensureEventDelegator({start: false});
	const off = eventDelegator.on({
	    eventType: spec.eventType,
	    selector: spec.selector,
	    handler: runtimeHandler,
	    options: spec.options,
	    policy: spec.policy,
	    tag: this.listenerTag,
	});

	const entry = {
	    owner: this.listenerTag,
	    key,
	    selector: spec.selector,
	    eventType: spec.eventType,
	    handler: spec.handler,
	    runtimeHandler,
	    options: spec.options,
	    policy: spec.policy,
	    popstate: spec.popstate,
	    metaTag: spec.metaTag,
	    off,
	};

	this.selectors[key] = entry;
	if (this.listenerSelectors.indexOf(key) < 0) {
	    this.listenerSelectors.push(key);
	}
	return entry;
    }

    unregister(selectorOrSpec, opts = {}){
	const spec = this.normalizeListenerSpec(selectorOrSpec, undefined, opts, {
	    requireHandler: false,
	    defaultEventType: null,
	});
	let removed = 0;
	const keys = this.listenerSelectors.slice();

	for (const key of keys) {
	    const entry = this.selectors[key];
	    if (!entry || entry.owner !== this.listenerTag) {
		continue;
	    }

	    if (entry.selector !== spec.selector) {
		continue;
	    }

	    if (spec.eventType && entry.eventType !== spec.eventType) {
		continue;
	    }

	    if (typeof spec.handler === 'function' && entry.handler !== spec.handler) {
		continue;
	    }

	    if (spec.metaTag != null && entry.metaTag !== spec.metaTag) {
		continue;
	    }

	    if (typeof entry.off === 'function') {
		entry.off();
	    } else if (this.eventDelegator && typeof this.eventDelegator.off === 'function') {
		this.eventDelegator.off({
		    eventType: entry.eventType,
		    selector: entry.selector,
		    handler: entry.runtimeHandler || entry.handler,
		    options: entry.options,
		    tag: this.listenerTag,
		});
	    }

	    delete this.selectors[key];
	    const ownedIndex = this.listenerSelectors.indexOf(key);
	    if (ownedIndex >= 0) {
		this.listenerSelectors.splice(ownedIndex, 1);
	    }
	    removed++;

	    if (spec.eventType || typeof spec.handler === 'function' || spec.metaTag != null) {
		break;
	    }
	}

	return removed;
    }

    findSelectorByDom(dom, eventType = null){
	let keys = this.listenerSelectors;
	for (let key of keys) {
	    const entry = this.selectors[key];
	    if (!entry) {
		continue;
	    }
	    if (eventType != null && entry.eventType !== eventType) {
		continue;
	    }
	    if(dom && typeof dom.matches === 'function' && dom.matches(entry.selector) )
		return entry;
	}
	return null;
    }

    click_set(selector, click, popStateKey = null, env = null){
	return this.register({
	    selector,
	    handler: click,
	    eventType: 'click',
	    popstate: popStateKey,
	    env,
	});
    }
}

export default Events;
