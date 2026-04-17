/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */


import Events from './Events.js';
import Assert from './Assert.js';
import Utils from './utils/Utils.js';
import { BuiltIns, builtinDefs } from './builtins/index.js';

const MOD = '[app.SinglePageApp]';

function isRootSpec(lib, value) {
    return lib.hash.hasKeys(value, 'root host',true)
        && !lib.hash.hasKeys(value, 'global event');
}

function libRoot(lib){
    const bootRoot = lib.hash.get(lib,'_env.root');

    if( !(bootRoot && bootRoot.document)  )
	throw new Error("unable to acquire root/host");
    return {
	root: bootRoot.document,
	host:bootRoot
    } ;

}

function rootSpec(root, host = undefined) {
    return arguments.length > 1 ? { root, host } : root;
}

function getRoot(lib, input = null) {
    return isRootSpec(lib,input) ?
	input : libRoot(lib);
}


export class SinglePageApp{


    constructor({lib, root, env = null, state, listeners, popstates, builtins = true, autoStart = true} = {}){
	this.lib = lib;
	this.root = getRoot(lib, root);
	this.env = {};
	this.utils = new Utils({spa:this, lib});
	this.assert = new Assert({lib, controller: this});
	this.asserted = this.assert.check();
	this.events = new Events({lib, controller: this, asserted: this.asserted});
	this.eventDelegator = this.asserted.eventDelegator;
	this.popstate = this.asserted.popStateManager;
	this.popstate.controller = this;
	this.popstate.asserted = this.asserted;
	this.setRoot(this.root);
	this.builtins = new BuiltIns({controller: this, defs: builtinDefs, env: this.env});
	this.setEnv(env);
	this.setBuiltIns(builtins);
	this.setState(state);
	this.configure({listeners, popstates});
	if(!lib.bool.no(autoStart))
	    this.on();

    }

    setRoot(root, host){
	this.root = getRoot(this.lib, rootSpec(root, host));

	this.popstate.setHost(this.root.host);

	this.events.ensureEventDelegator({start: false});

	if (this.popstate && this.popstate.popStateListener) {
	    this.popstate.stop();
	    this.popstate.start();
	}

	return this.root;
    }

    setEnv(env = null){
	this.env = this.lib.hash.to(env);
	this.events.setEnv(this.env);
	this.popstate.setEnv(this.env);
	this.builtins.setEnv(this.env);
	return this.env;
    }

    setUtils(opts = null){
	this.utils.configure(Object.assign({
	    spa: this,
	    lib: this.lib,
	}, this.lib.hash.to(opts)));
	return this.utils;
    }

    setBuiltIns(builtins = true){
	const useBuiltins = !this.lib.bool.no(builtins);
	return !useBuiltins
	    ? []
	    : this.builtins.setEnabled(useBuiltins);
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


    normalizePopstateEntries(popstates = null){
	if (!popstates) {
	    return [];
	}

	if (typeof popstates === 'string' || typeof popstates === 'function') {
	    const handler = this.lib.func.get(popstates);
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
		    const handler = this.lib.func.get(item[1]);
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
		    const resolvedHandler = this.lib.func.get(handler);
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
		const handler = this.lib.func.get(value);
		if (handler) {
		    items.push({
			key,
			handler,
		    });
		    continue;
		}
		if (value && typeof value === 'object') {
		    const objectHandler = this.lib.func.get(value.handler ?? value.fn ?? value.action);
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

    resolveUrl(url, baseUrl){
	return this.utils.resolveUrl(url, baseUrl);
    }

    fetchPage(url, requestOptions = {}){
	return this.utils.fetchPage(url, requestOptions);
    }

    swapPage(payload, swapOptions = {}){
	return this.utils.swapPage(payload, swapOptions);
    }

    loadPage(url, loadOptions = {}){
	return this.utils.loadPage(url, loadOptions);
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

export default SinglePageApp;
