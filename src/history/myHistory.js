function normalizeStatePos(value) {
    const next = Number(value);
    if (!Number.isFinite(next)) {
        return 0;
    }

    return Math.max(0, Math.trunc(next));
}

class History {

    constructor({lib, conf = {}, identifier, host} = {}){
	this.lib = lib;
	this.host = host ?? null;

	if (!host || !host.location || !host.history) 
	    throw new Error("History requires a host with location and history");
	
	
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


    resolveLocation(){
	return this?.host?.location ?? null;
    }

    resolveHistory(){
	return this?.host?.history ?? null;
    }

    syncHistoryState(spaState = null){
	if (!spaState || typeof spaState !== 'object') {
	    return {
		statePos: this.statePos,
		urlHistory: this.urlHistory.slice(),
	    };
	}

	const nextPos = normalizeStatePos(spaState.pos);
	this.statePos = nextPos;

	// Restore the trail of previous URLs so the next push() starts from the
	// same branch the browser history already moved to.
	if (Array.isArray(spaState.history)) {
	    this.urlHistory.splice(0, this.urlHistory.length, ...spaState.history.slice());
	} else {
	    this.urlHistory.length = nextPos;
	}

	return {
	    statePos: this.statePos,
	    urlHistory: this.urlHistory.slice(),
	};
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
