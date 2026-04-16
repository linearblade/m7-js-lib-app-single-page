/*
  Route state history helper for single page apps.
*/

import Popstate from './popstate/Popstate.js';
import History from './history/History.js';

const MOD = '[app.SinglePageApp]';

function normalizeWorkspace(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeHost(value) {
    return value && typeof value === 'object' ? value : null;
}

class RouteState extends Popstate {

    constructor({lib, conf = {}, identifier, controller, asserted, env = null} = {}){
	super();
	this.lib = lib;
	this.controller = controller || null;
	this.asserted = asserted || (this.controller && this.controller.asserted) || null;
	this.env = normalizeWorkspace(env);
	this.conf = Object.assign(
	    {
		stateKey: 'spa',
		last: null,
	    },
	    conf && typeof conf === 'object' && !Array.isArray(conf) ? conf : {}
	);

	if (!this.conf.stateKey) {
	    this.conf.stateKey = 'spa';
	}

	this.identifier = identifier || new Date().toString();
	this.historyState = new History({
	    host: this.resolveHost(),
	    stateKey: this.conf.stateKey,
	    identifier: this.identifier,
	    autoSeed: false,
	});
	this.historyState.clear();
	this.historyState.setStateKey(this.conf.stateKey);
	this.historyState.identifier = this.identifier;
	this.stateStack = this.historyState.records;
	this.urlHistory = this.historyState.urlHistory;
	this.statePos = 0;
	this.stateStack[0] = null;
	this.popStateHandlers = Object.create(null);
	this.popStateListener = null;
	this.popStateHost = null;
    }

    resolveControllerRoot(){
	return this.controller && this.controller.root ? this.controller.root : null;
    }

    resolveRoot(){
	return this.resolveControllerRoot();
    }

    resolveControllerEnv(){
	return this.resolveControllerRoot();
    }

    resolveHost(){
	if (this.popStateHost) {
	    return this.popStateHost;
	}
	if (this.host) {
	    return this.host;
	}
	const root = this.resolveControllerRoot();
	if (root && root.host) {
	    return root.host;
	}
	if (this.historyState && this.historyState.host) {
	    return this.historyState.host;
	}
	return null;
    }

    setHost(host = null) {
	const next = normalizeHost(host);
	if (next === this.host && next === this.popStateHost) {
	    return this;
	}

	const wasStarted = this.started === true;
	if (wasStarted) {
	    this.stop();
	}

	this.host = next;
	this.popStateHost = next;
	if (this.historyState && typeof this.historyState.setHost === 'function') {
	    this.historyState.setHost(next);
	}

	if (wasStarted && next && typeof next.addEventListener === 'function') {
	    this.start();
	}

	return this;
    }

    get statePos() {
	return this.historyState ? this.historyState.statePos : 0;
    }

    set statePos(value) {
	if (!this.historyState) {
	    return;
	}

	const next = Number.isFinite(value) ? Math.trunc(value) : this.historyState.statePos;
	this.historyState.statePos = next >= 0 ? next : 0;
    }

    syncHistoryState() {
	if (!this.historyState) {
	    return null;
	}

	const host = this.resolveHost();
	if (typeof this.historyState.setHost === 'function') {
	    this.historyState.setHost(host);
	}
	if (typeof this.historyState.setStateKey === 'function') {
	    this.historyState.setStateKey(this.conf.stateKey);
	}
	this.historyState.identifier = this.identifier;
	return this.historyState;
    }

    resolveLocation(){
	const host = this.resolveHost();
	return host ? host.location : null;
    }

    resolveHistory(){
	const host = this.resolveHost();
	return host ? host.history : null;
    }

    setEnv(env = null){
	this.env = normalizeWorkspace(env);
	return this.env;
    }

    buildPopstateContext({event, currentURL, spaState, isSPA} = {}){
	const spa = this.controller || null;
	const globalEnv = spa && spa.env ? spa.env : {};
	return {
	    lib: this.lib,
	    spa,
	    root: this.resolveControllerRoot(),
	    env: {
		global: globalEnv,
		event: this.env,
	    },
	    routeState: this,
	    event,
	    currentURL,
	    state: spaState,
	    isSPA,
	};
    }

    handleEvent(e = null){
	const lib = this.lib;
	const historyState = this.syncHistoryState();
	const host = this.resolveHost();
	const currentURL = host && host.location ? host.location.href : (typeof location !== 'undefined' ? location.href : undefined);

	console.error('state is (e,history)', e && e.state, host && host.history ? host.history.state : undefined, currentURL);
	if (!e || !e.state) return;

	const spaState = lib.hash.get(e.state, this.conf['stateKey']);
	if(!spaState)
	    return;

	let [isSPA, backURL, id] = lib.hash.expand(spaState, "type back id");

	if(!isSPA)
	    return;
	if( id != this.identifier){
	    console.error('expired state.');
	    this.stop();
	    this.loadUrl();
	    return;
	}

	console.error(spaState, this.stateStack[spaState.pos]);
	if (spaState.pos >= this.stateStack.length ||  spaState.url !=  this.stateStack[spaState.pos].url ){
	    console.error("STATE MISMATCH");
	    return;
	}

	console.error("STATE MATCH");

	backURL = spaState.url;
	if (currentURL != backURL)
            return console.error("currentUrl / state url mismatch!'", currentURL, backURL);

	if (historyState && typeof historyState.restore === 'function') {
	    historyState.restore(spaState);
	} else {
	    // keep the internal cursor aligned with the browser's history entry
	    this.statePos = spaState.pos;
	    if (Array.isArray(spaState.history)) {
		this.urlHistory.splice(0, this.urlHistory.length, ...spaState.history.slice());
	    } else {
		this.urlHistory.length = spaState.pos;
	    }
	}
	this.conf.last = spaState.url;

	if (isSPA == 'start'){
		console.error('returning to start...');
		const startHandler = this.popStateHandlers[spaState.popstate] || this.popStateHandlers.start || this.popStateHandlers.default;
		const handlerContext = this.buildPopstateContext({
		    event: e,
		    currentURL,
		    spaState,
		    isSPA,
		});
		if (startHandler) {
		    startHandler(e,currentURL,handlerContext);
		    return;
		}
		this.loadUrl(currentURL);
		return;
	}
	const handler = this.popStateHandlers[spaState.popstate];
	if(!handler)
	    throw new Error(`pop state handler ${spaState.popState} not found`);

	const handlerContext = this.buildPopstateContext({
	    event: e,
	    currentURL,
	    spaState,
	    isSPA,
	});
	handler(e,currentURL,handlerContext);

	return;
    }

    loadUrl(url = undefined){
	const locationObj = this.resolveLocation();
	if (!url) {
	    url = locationObj.href;
	}

	locationObj.href = '';
	locationObj.href = url;
	return url;
    }

    unregister(target = undefined){
	if(!target){
	    console.error('removing all popstate handlers');
	    let keys = Object.keys(this.popStateHandlers);
	    for (let key of keys){
		delete(this.popStateHandlers[key] );
	    }

	}else {
	    delete(this.popStateHandlers[target]);
	}
    }

    register(key, handler){
	const resolvedHandler = this.lib && this.lib.func && typeof this.lib.func.get === 'function'
	    ? this.lib.func.get(handler)
	    : handler;

	if (typeof resolvedHandler !== 'function') {
	    throw new Error(`${MOD} requires handler function.`);
	}

	this.popStateHandlers[key] = resolvedHandler;
	return resolvedHandler;
    }

    start(){
	const historyState = this.syncHistoryState();
	const host = this.resolveHost();
	if (!host || typeof host.addEventListener !== 'function') {
	    this.popStateHost = host || null;
	    this.popStateListener = null;
	    this.started = false;
	    return null;
	}

	if (this.started && this.popStateListener && this.popStateHost === host) {
	    return this.popStateListener;
	}

	if (this.started) {
	    this.stop();
	}

	this.host = host;
	this.popStateHost = host;
	this.popStateListener = this.listener;
	host.addEventListener('popstate', this.popStateListener);
	if (historyState && typeof historyState.setHost === 'function') {
	    historyState.setHost(host);
	}
	this.started = true;
	return this.popStateListener;
    }

    stop(){
	const host = this.popStateHost || this.host || this.resolveHost();
	const listener = this.popStateListener || this.listener;

	if (listener && host && typeof host.removeEventListener === 'function') {
	    host.removeEventListener('popstate', listener);
	}

	this.started = false;
	this.popStateListener = null;
	this.popStateHost = null;
	this.host = null;
	return this;
    }

    set(state){
	const historyState = this.syncHistoryState();
	const lib = this.lib;
	state = lib.hash.to(state);
	const myState = historyState && typeof historyState.seed === 'function'
	    ? historyState.seed(state)
	    : null;

	if (myState) {
	    this.conf.last = myState.url;
	}

	return myState;
    }

    push_old(url, title = '', state){
	return this.push(url, title, state);
    }

    push(url, title = '', state){
	const historyState = this.syncHistoryState();
	const lib = this.lib;
	state = lib.hash.to(state);

	if (historyState && typeof historyState.push === 'function') {
	    const myState = historyState.push(url, title, state);
	    this.conf.last = myState.url;
	    return myState;
	}

	throw new Error(`${MOD} history helper is unavailable.`);
    }

}

export default RouteState;
