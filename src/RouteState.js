/*
  Route state history helper for single page apps.
*/

import History from './history/minimal.js';
import State from './history/State.js';

const MOD = '[app.SinglePageApp]';

function normalizeWorkspace(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function normalizeStatePos(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return 0;
    }

    return Math.max(0, Math.trunc(next));
}

class RouteState {

    constructor({lib, conf = {}, identifier, controller, asserted, env = null} = {}){
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
	this.history = new History({
	    lib: this.lib,
	    host: this.resolveHost(),
	});
	this.state = new State({
	    lib: this.lib,
	    history: this.history,
	    conf: this.conf,
	    identifier: this.identifier,
	});
	this.popStateHandlers = Object.create(null);
	this.popStateListener = null;
	this.popStateHost = null;
    }

    get stateStack(){
	return this.history.stateStack;
    }

    get urlHistory(){
	return this.history.urlHistory;
    }

    get statePos(){
	return this.history.statePos;
    }

    set statePos(value){
	this.history.statePos = normalizeStatePos(value);
    }

    setHost(host){
	if (this.history && typeof this.history.setHost === 'function') {
	    this.history.setHost(host);
	} else if (this.history) {
	    this.history.host = host;
	}
	return this.history;
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
	const root = this.resolveControllerRoot();
	return root ? root.host : null;
    }

    resolveLocation(){
	const host = this.resolveHost();
	return host ? host.location : null;
    }

    resolveHistory(){
	const host = this.resolveHost();
	return host ? host.history : null;
    }

    syncHistoryState(spaState = null){
	if (!spaState || typeof spaState !== 'object') {
	    return this.history.snapshot();
	}

	const restore = {
	    statePos: spaState.pos,
	};

	if (Array.isArray(spaState.history)) {
	    restore.urlHistory = spaState.history;
	}

	// Translate the SPA envelope into the generic history helper state.
	return this.history.restore(restore);
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
	const lib = this.lib;
	const host = this.resolveHost();

	if (this.popStateListener && this.popStateHost && typeof this.popStateHost.removeEventListener === 'function') {
	    this.popStateHost.removeEventListener('popstate', this.popStateListener);
	}

	const popStateHandler = (e) => {
	    let isSPA, backURL, spaState, id;
	    let currentURL = host.location ? host.location.href : (typeof location !== 'undefined' ? location.href : undefined);
	    console.error('state is (e,history)', e.state, host.history ? host.history.state : undefined, currentURL);
	    if (!e.state) return;
	    spaState = lib.hash.get(e.state, this.conf['stateKey']);
	    if(!spaState)
		return;

	    [isSPA, backURL, id] = lib.hash.expand(spaState, "type back id");

	    if(!isSPA)
		return;
	    if( id != this.identifier){
			console.error('expired state.');
			if (typeof host.removeEventListener === 'function') {
			    host.removeEventListener('popstate', popStateHandler);
			}
		this.loadUrl();
		return;
	    }

	    const pageState = this.stateStack[spaState.pos];
	    const currentSpaState = pageState ? pageState[this.conf.stateKey] : null;
	    console.error(spaState, pageState);
	    if (spaState.pos >= this.stateStack.length ||  !currentSpaState || spaState.url != currentSpaState.url ){
			console.error("STATE MISMATCH");
			return;
	    }

	    console.error("STATE MATCH");

	    backURL = spaState.url;
	    if (currentURL != backURL)
                return console.error("currentUrl / state url mismatch!'", currentURL, backURL);

	    // keep the internal cursor aligned with the browser's history entry
	    this.syncHistoryState(spaState);

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
	};

	this.popStateListener = popStateHandler;
	this.popStateHost = host;
	host.addEventListener('popstate', popStateHandler);
	return popStateHandler;
    }

    stop(){
	const host = this.popStateHost || this.resolveHost();

	if (this.popStateListener && host && typeof host.removeEventListener === 'function') {
	    host.removeEventListener('popstate', this.popStateListener);
	}

	this.popStateListener = null;
	this.popStateHost = null;
	return this;
    }

    set(state){
	return this.state.set(state);
    }


    push(url, title = '', state){
	const nextState = this.state.push(url, title, state);
	this.conf.last = url;
	return nextState;
    }

}

export default RouteState;
