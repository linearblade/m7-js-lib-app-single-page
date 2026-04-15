/*
  Route state history helper for single page apps.
*/

const MOD = '[app.SinglePageApp]';

function normalizeWorkspace(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
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

	this.urlHistory = [];
	this.stateStack = [null];
	this.statePos = 0;
	this.identifier = identifier || new Date().toString();
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

	    console.error(spaState, this.stateStack[spaState.pos]);
	    if (spaState.pos >= this.stateStack.length ||  spaState.url !=  this.stateStack[spaState.pos].url ){
		console.error("STATE MISMATCH");
		return;
	    }

	    console.error("STATE MATCH");

	    backURL = spaState.url;
	    if (currentURL != backURL)
                return console.error("currentUrl / state url mismatch!'", currentURL, backURL);

	    // keep the internal cursor aligned with the browser's history entry
	    this.statePos = spaState.pos;
	    if (Array.isArray(spaState.history)) {
		this.urlHistory.splice(0, this.urlHistory.length, ...spaState.history.slice());
	    } else {
		this.urlHistory.length = spaState.pos;
	    }

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
	const lib = this.lib;
	const locationObj = this.resolveLocation();
	const historyObj = this.resolveHistory();

	state = lib.hash.to(state);
	let myState = lib.hash.merge(
	    {
		history: this.urlHistory.slice(),
		type: 'start',
		url: locationObj.href,
		previous: null,
		id: this.identifier,
		pos: this.statePos,
	    }, state);

	this.stateStack[this.statePos] = myState;
	let pageState = historyObj.state || {};
	pageState[this.conf.stateKey] = myState;
	console.error(pageState);
	historyObj.replaceState(
	    pageState,
	    null,
	    locationObj.href
	);

	return myState;
    }

    push_old(url, title = '', state){
	const lib = this.lib;
	const locationObj = this.resolveLocation();
	const historyObj = this.resolveHistory();

	state = lib.hash.to(state);
	let previousURL = locationObj.href.toString();

	if(url === undefined)
	    throw new Error("CANNOT PUSH STATE, URL UNDEFINED: " + url);

	const curPos = lib.hash.get(historyObj, `state.${this.conf.stateKey}.pos`);
	if (curPos !== undefined && curPos !== null && this.stateStack.length > curPos + 1){
	    console.error(`history position currently at ${curPos} but stack length is ${this.stateStack.length}`);
	    let stackSlice = this.stateStack.slice(0, curPos + 1);
	    this.stateStack.splice(0, this.stateStack.length, ...stackSlice);
	    this.statePos = curPos;
	    let urlSlice = this.urlHistory.slice(0, curPos + 1);
	    this.urlHistory.splice(0, this.urlHistory.length, ...urlSlice);
	    console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
	}

	this.urlHistory.push(previousURL);
	this.statePos ++;
	let myState = lib.hash.merge(
            {
                history: this.urlHistory.slice(),
                type: 'spa',
                previous: previousURL,
		id: this.identifier,
		url: url,
		pos: this.statePos,
            }, state);

        if(!title)title ='';
        this.conf.last = url;
	this.stateStack.push(myState);


	let pageState = {};
	pageState[this.conf.stateKey] = myState;

        console.error('pushing state..:' , state,myState,pageState);
	console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
        historyObj.pushState(pageState, title, url);
	return myState;
    }

    push(url, title = '', state){
	const lib = this.lib;
	const locationObj = this.resolveLocation();
	const historyObj = this.resolveHistory();

	state = lib.hash.to(state);
	let previousURL = locationObj.href.toString();

	if(url === undefined)
	    throw new Error("CANNOT PUSH STATE, URL UNDEFINED: " + url);

	const curPos = lib.hash.get(historyObj, `state.${this.conf.stateKey}.pos`);
	if (curPos !== undefined && curPos !== null && this.stateStack.length > curPos + 1){
	    console.error(`history position currently at ${curPos} but stack length is ${this.stateStack.length}`);
	    let stackSlice = this.stateStack.slice(0, curPos + 1);
	    this.stateStack.splice(0, this.stateStack.length, ...stackSlice);
	    this.statePos = curPos;
	    let urlSlice = this.urlHistory.slice(0, curPos + 1);
	    this.urlHistory.splice(0, this.urlHistory.length, ...urlSlice);
	    console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
	}

	this.urlHistory.push(previousURL);
	this.statePos ++;
	let myState = lib.hash.merge(
            {
                history: this.urlHistory.slice(),
                type: 'spa',
                previous: previousURL,
		id: this.identifier,
		url: url,
		pos: this.statePos,
            }, state);

        if(!title)title ='';
        this.conf.last = url;
	this.stateStack.push(myState);

	let pageState = historyObj.state && typeof historyObj.state === 'object'
	    ? Object.assign({}, historyObj.state)
	    : {};
	pageState[this.conf.stateKey] = myState;

        console.error('pushing state..:' , state,myState,pageState);
	console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
        historyObj.pushState(pageState, title, url);
	return myState;
    }

}

export default RouteState;
