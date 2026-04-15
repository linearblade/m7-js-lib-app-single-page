/*
  Single Page App event handling tools.
  TODO:

  [ ] clean up functions, remove the debug, use throw => catch where appropriate
  [ ] simplify the process, and break it out more granularly.
  [x] add the ablity to set custom methods. (currently the popstate automatically pulls, and the click handler requires you pull yourself)

  maybe something like , set the click handler , which then calls the library.

  so like
  lib.app.SPA.setCustom(selector,  triggerAction, triggerBack);
  (when event trigger is called, do something, then run the event trigger?)
  
  lib.app.SPA.setWithFetch(selector, clickToUrlEvent, fetch-click, fetch-back);
  
*/

import Events from './Events.js';
import Assert from './Assert.js';
import RouteState from './RouteState.js';
import { BuiltIns, builtinDefs } from './builtins/index.js';

const MOD = '[app.SinglePageApp]';

function isRootSpec(value) {
    return !!value
        && typeof value === 'object'
        && Object.prototype.hasOwnProperty.call(value, 'root')
        && Object.prototype.hasOwnProperty.call(value, 'host')
        && !Object.prototype.hasOwnProperty.call(value, 'global')
        && !Object.prototype.hasOwnProperty.call(value, 'event');
}

function normalizeWorkspace(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function shouldInstallBuiltins(lib, builtins) {
    if (lib && lib.bool && typeof lib.bool.no === 'function') {
        return !lib.bool.no(builtins);
    }

    return builtins !== false;
}

class SinglePageApp{



    constructor({lib, root, env = null, state, listeners, popstates, builtins = true, autoStart = true} = {}){
	this.lib = lib;
	this.root = {};
	this.env = {};
	const rootSpec = isRootSpec(root) ? root : (root == null && isRootSpec(env) ? env : root);
	const workspace = rootSpec === env ? null : env;
	this.setRoot(rootSpec);
	this.setEnv(workspace);
	this.assert = new Assert({lib, controller: this});
	this.asserted = this.assert.check();
	this.events = new Events({lib, controller: this, asserted: this.asserted});
	this.popstate = new RouteState({lib, controller: this, asserted: this.asserted});
	this.builtins = new BuiltIns({controller: this, defs: builtinDefs, env: this.env});
	this.setBuiltIns(builtins);
	this.setState(state);
	this.configure({listeners, popstates});
	if (autoStart !== false) {
	    this.on();
	}
    }

	setRoot(root, host){
	let envRoot = root;
	let envHost = host;

	if (arguments.length === 1 && envRoot && typeof envRoot === 'object') {
	    const hasRoot = Object.prototype.hasOwnProperty.call(envRoot, 'root');
	    const hasHost = Object.prototype.hasOwnProperty.call(envRoot, 'host');
	    if (!hasRoot || !hasHost || envRoot.root == null || envRoot.host == null) {
		throw new Error(`${MOD} root must include both root and host, or be null/undefined.`);
	    }
	    envHost = envRoot.host;
	    envRoot = envRoot.root;
	}

	if (envRoot == null && envHost == null) {
	    const bootRoot = this.lib && this.lib._env ? this.lib._env.root : null;
	    if (envRoot == null && bootRoot && bootRoot.document) {
		envRoot = bootRoot.document;
	    }
	    if (envHost == null && bootRoot) {
		envHost = bootRoot;
	    }
	} else if (envRoot == null || envHost == null) {
	    throw new Error(`${MOD} root must include both root and host, or be null/undefined.`);
	}

	if (!envRoot || !envHost) {
	    throw new Error(`${MOD} requires root.root and root.host.`);
	}

	this.root = {
	    root: envRoot,
	    host: envHost,
	};

	if (this.events && typeof this.events.ensureEventDelegator === 'function') {
	    this.events.ensureEventDelegator({start: false});
	}

	if (this.popstate && this.popstate.popStateListener) {
	    this.popstate.stop();
	    this.popstate.start();
	}

	return this.root;
    }

    setEnv(env = null){
	this.env = normalizeWorkspace(env);
	if (this.builtins && typeof this.builtins.setEnv === 'function') {
	    this.builtins.setEnv(this.env);
	}
	return this.env;
    }

    setBuiltIns(builtins = true){
	const useBuiltins = shouldInstallBuiltins(this.lib, builtins);

	if (!this.builtins || typeof this.builtins.setEnabled !== 'function') {
	    return [];
	}

	return this.builtins.setEnabled(useBuiltins);
    }

    configure({listeners, popstates} = {}){
	this.registerPopstates(popstates);
	this.registerListeners(listeners);
	return this;
    }

    setState(state = undefined){
	if (state === undefined || state === null) {
	    this.popstate.set();
	} else {
	    this.popstate.set(state);
	}
	return this;
    }

    registerListeners(listeners = null){
	const items = Array.isArray(listeners)
	    ? listeners
	    : (listeners ? [listeners] : []);

	for (const spec of items) {
	    if (!spec) {
		continue;
	    }
	    this.events.register(spec);
	}
	return this;
    }

    registerPopstates(popstates = null){
	const items = this.normalizePopstateEntries(popstates);
	for (const item of items) {
	    this.popstate.register(item.key, item.handler);
	}
	return this;
    }

    resolvePopstateHandler(handler){
	if (typeof handler === 'string' && this.lib && this.lib.func && typeof this.lib.func.get === 'function') {
	    handler = this.lib.func.get(handler);
	}

	return typeof handler === 'function' ? handler : null;
    }

    normalizePopstateEntries(popstates = null){
	if (!popstates) {
	    return [];
	}

	if (typeof popstates === 'string' || typeof popstates === 'function') {
	    const handler = this.resolvePopstateHandler(popstates);
	    if (handler) {
		return [
		    {
			key: 'default',
			handler,
		    },
		];
	    }
	    return [];
	}

	if (Array.isArray(popstates)) {
	    const items = [];
	    for (const item of popstates) {
		if (!item) {
		    continue;
		}
		if (Array.isArray(item) && item.length >= 2) {
		    const handler = this.resolvePopstateHandler(item[1]);
		    if (!handler) {
			continue;
		    }
		    items.push({
			key: String(item[0]),
			handler,
		    });
		    continue;
		}
		if (typeof item === 'object') {
		    const key = item.key ?? item.popstate ?? item.name ?? item.id;
		    const handler = item.handler ?? item.fn ?? item.action;
		    const resolvedHandler = this.resolvePopstateHandler(handler);
		    if (key != null && resolvedHandler) {
			items.push({
			    key: String(key),
			    handler: resolvedHandler,
			});
		    }
		}
	    }
	    return items;
	}

	if (typeof popstates === 'object') {
	    const items = [];
	    for (const key of Object.keys(popstates)) {
		const value = popstates[key];
		const handler = this.resolvePopstateHandler(value);
		if (handler) {
		    items.push({
			key,
			handler,
		    });
		    continue;
		}
		if (value && typeof value === 'object') {
		    const objectHandler = this.resolvePopstateHandler(value.handler ?? value.fn ?? value.action);
		    const resolvedKey = value.key ?? key;
		    if (objectHandler) {
			items.push({
			    key: String(resolvedKey),
			    handler: objectHandler,
			});
		    }
		}
	    }
	    return items;
	}

	return [];
    }

    on(){
	this.events.start();
	this.popstate.start();
	return this;
    }

    off(){
	this.events.stop();
	this.popstate.stop();
	return this;
    }
}

SinglePageApp.Assert = Assert;
SinglePageApp.RouteState = RouteState;
SinglePageApp.Events = Events;

export { Assert, Events, RouteState, SinglePageApp };
export default SinglePageApp;



    
