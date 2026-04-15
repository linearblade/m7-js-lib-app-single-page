/*
  Single Page App event handling tools.
  version: proof of concept
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

const MOD = '[app.singlePageApp]';
const REQUIRED_DEP_PATHS = Object.freeze([
    'hash.to',
    'hash.get',
    'hash.merge',
    'hash.expand',
    'func.get',
    'service.get',
    'require.all',
    'require.service',
]);
const REQUIRED_SERVICE_IDS = Object.freeze([
    'primitive.dom.eventdelegator',
]);

console.error('booting lib.event.spa');
if(typeof(lib) == 'undefined'){
    console.error('lib NOT SET. be sure to install lib first!');
    //throw an error here when you remember how to.
}
class singlePageApp{



    constructor({lib} = {}){
	if(!lib || typeof lib !== 'object'){
	    throw Error(`${MOD} constructor requires lib.`);
	}

	this.lib = lib;
	this.selectors = {};
	this.urlHistory = [];
	this.stateStack = [null];
	this.statePos = 0;
	this.conf = {stateKey:'spa'};
	this.identifier = new Date().toString() ;
	this.popStateHandlers = {};
	this.services = this.assertServices();
	this.state_set();
    }

    assertServices(){
	const lib = this.lib;

	if(!lib.require || typeof lib.require.all !== 'function' || typeof lib.require.service !== 'function'){
	    throw Error(`${MOD} assertServices requires lib.require.all and lib.require.service.`);
	}

	lib.require.all(REQUIRED_DEP_PATHS, {mod:MOD});

	const services = lib.require.service(REQUIRED_SERVICE_IDS, {mod:MOD, returnMap:true});
	const eventDelegator = services['primitive.dom.eventdelegator'];

	if(!eventDelegator){
	    throw Error(`${MOD} assertServices requires primitive.dom.eventdelegator.`);
	}

	for (const method of ['on', 'start', 'stop', 'setRoot']) {
	    if (typeof eventDelegator[method] !== 'function') {
		throw Error(`${MOD} primitive.dom.eventdelegator is missing required method '${method}'.`);
	    }
	}

	return {
	    eventDelegator,
	};
    }

    state_set(state){
	const lib = this.lib;
	state = lib.hash.to(state);
	let myState = lib.hash.merge(
	    {
		history:this.urlHistory,
		type:'start',
		url: window.location.href,
		previous: null,
		id: this.identifier,
		pos:this.statePos
	    },state);

	this.stateStack[this.statePos] =myState;
	let pageState = history.state || {};
	pageState[this.conf.stateKey] = myState;
	console.error(pageState);
	history.replaceState(
	    pageState,
	    null,
	    window.location.href
	);

	this.startPopStateListener();
	this.startEventDelegator();

    }

    state_push(url,title='',state){
	const lib = this.lib;
	let curPos;
	state = lib.hash.to(state);
	
        let previousURL = window.location.href.toString();

        if(url===undefined)
	    throw new Error("CANNOT PUSH STATE, URL UNDEFINED: "+url);

	curPos = lib.hash.get(history, 'state.spa.pos');
	if (curPos && curPos < this.statePos){
	    console.error(`history  position currently at ${curPos} but internal stack pos is ${this.statePos}`);
	    let slice = this.stateStack.slice(0,curPos+1);
	    this.stateStack = slice;
	    this.statePos = curPos;
	    this.urlHistory = this.urlHistory.slice(0,curPos+1);
	    console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
	}

	this.urlHistory.push(previousURL);
	this.statePos ++;
	let myState = lib.hash.merge(
            {
                history:this.urlHistory,
                type:'spa',
                previous: previousURL,
		id : this.identifier,
		url: url,
		pos: this.statePos
            },state);
	
        if(!title)title ='';
        this.conf.last =url;
	this.stateStack.push(myState);


	let pageState = {};
	pageState[this.conf.stateKey] = myState;
	
        console.error('pushing state..:' , state,myState,pageState);
	console.error(`stack length ${this.stateStack.length} , stack pos ${this.statePos}`);
        history.pushState(pageState, title, url);
    }
    
    startEventDelegator(type = 'click'){
	const lib = this.lib;
	let obj = this;
	let handler = function(e) {
	    console.error("CAUGHT EVENT of type "+type);
	    let match, ws = {obj:obj};
	    try {
		match =obj.findSelectorByDom(e.target);
		if(!match)return;
		ws.popstate = match.popstate;
		let func = lib.func.get(match.handler);
		if(!func)
		    return console.error('event not found!', match);
		
		func(e,ws);
		return false;
	    }catch(error) {
		console.error('problem with event:',match);
		throw error;
		return false;
	    }
	    
	};

	document.addEventListener(type, handler);

    }

    findSelectorByDom(dom){
	let keys = Object.keys(this.selectors);
	console.error(dom);	
	for (let selector of keys)
	    if(dom.matches(selector) )
		return this.selectors[selector];
	return null;
    }
	
    click_set(selector, click,popStateKey=null){
	let clickHandler;
	if(!click)
	    return console.error('requires click handler');
	
	if (this.selectors[selector])
	    return console.error(`SELECTOR ALREADY EXISTS (${selector}). Use unset first`);
	this.selectors[selector] = {
	    handler: click,
	    popstate : popStateKey
	};
	
    }
    
    loadUrl(url=undefined){
	if(!url)
	    url = window.location.href;
	window.location.href="";
        window.location.href=url;

    }


    ps_remove(target = undefined){
	if(!target){
	    console.error('removing all popstate handlers');
	    let keys = Object.keys(this.popStateHandlers);
	    for (let key of this.popStateHandlers){
		delete(popStateHandlers[key] );
	    }

	}else {
	    delete(this.popStateHandlers[key]);
	}
    }
    
    ps_set(key, handler){
	if(!handler)
	    return console.error('requires handler');
	this.popStateHandlers[key] = handler;
    }

    
    startPopStateListener(){
	const lib = this.lib;
	let popStateHandler, handler,obj = this;

	
	popStateHandler = function (e){

	    let isSPA, backURL,spaState, id;
            let currentURL = location.href;
	    console.error('state is (e,history)', e.state,history.state,currentURL);
	    if (!e.state) return
	    spaState =  lib.hash.get(e.state, obj.conf['stateKey']);
	    if(!spaState)
		return;
	    
	    [isSPA, backURL,id] = lib.hash.expand(spaState, "type back id");
	    

	    if(!isSPA)
		return;
	    if( id !=obj.identifier){
		console.error('expired state.');
		removePopStateHandler();
		obj.loadUrl();
		return;
	    }

	    console.error(spaState, obj.stateStack[spaState.pos]);
	    if (spaState.pos >= obj.stateStack.length ||  spaState.url !=  obj.stateStack[spaState.pos].url ){
		console.error("STATE MISMATCH");
		return;
	    }

	    console.error("STATE MATCH");

	    backURL = spaState.url;
	    if (currentURL != backURL)
                return console.error("currentUrl / state url mismatch!'", currentURL, backURL);

	    //determine if it was a back or forward press
	    if (spaState.pos < obj.statePos){
		obj.urlHistory.pop();
	    }

	    if (isSPA == 'start'){
		console.error('removing eventListener and returning to start...');
		document.removeEventListener('popstate', popStateHandler);
		obj.loadUrl(currentURL);
		return;
	    }
	    handler = obj.popStateHandlers[spaState.popstate];
	    if(!handler)
		throw new Error(`pop state handler ${spaState.popState} not found`);


	    
	    handler(e,currentURL);

	    return

	    if (!lib.utils.isEmpty(e.state.selector) && e.state.selector != selector){
		//this is the wrong handler 
		console.error('invalid selector - '+selector);
		return;
	    }
	    
	    backURL = state.url?backURL:window.location.href;
	    //if (!isSPA) return;

	    if(!urlHistory || urlHistory.length<= 1) {
		console.error('no previous history');
		return;
		removePopStateHandler();
		obj.loadUrl(backURL);
		return;
	    }

	    if (currentURL != backURL)
		return console.error("currentUrl / state url mismatch!'", currentURL, backURL);

	    console.warn('popping history');
	    urlHistory.pop();
	    
	    handler(e,currentURL);
	}

	window.addEventListener('popstate',popStateHandler);
    }

    
}
    


    
