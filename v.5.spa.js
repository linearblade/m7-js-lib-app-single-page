/*
  Single Page App event handling tools.
  version: proof of concept
  TODO:

  [ ] clean up functions, remove the debug, use throw => catch where appropriate
  [ ] simplify the process, and break it out more granularly.
  [ ] add the ablity to set custom methods. (currently the popstate automatically pulls, and the click handler requires you pull yourself)

  maybe something like , set the click handler , which then calls the library.

  so like
  lib.app.SPA.setCustom(selector,  triggerAction, triggerBack);
  (when event trigger is called, do something, then run the event trigger?)
  
  lib.app.SPA.setWithFetch(selector, clickToUrlEvent, fetch-click, fetch-back);
  
*/

console.error('booting lib.event.spa');
if(typeof(lib) == 'undefined'){
    console.error('lib NOT SET. be sure to install lib first!');
    //throw an error here when you remember how to.
}
if (!lib.hash.get(lib,'event')){
    console.warn('lib.event not yet set. you may encounter errors if this loads before setting lib');
}
/*
  //'a.ajax-link'
  //try{modalOpen('loading');}catch{return console.error("problem with modal open. bailing out");};
  lib.event.spa.set('.ajax-link', [function(){modalOpen('laoding')} , function(e){
  let  set, some,vars,here;
  fetchFunc(e);
  }]);
  lib.event.spa.set('.ajax-link', [function(){modalOpen('laoding')} , ['fetch', 'var1','var2'];]



  lib.event.spa.set('.ajax-link', [function(e){modalOpen('loading')}, lib.event.spa.fetchWrapHREF(lib.event.spa.fetchData)] );

  
*/

lib.hash.set(lib,'app.SPA', (function(lib){
    let selectors = {};
    let builtIn = {};
    let urlHistory = [];
    //builtIn['fetch'] = fetchFunc;
    let identifier ;
    function setClick(selector,click,back){
	let clickHandler, popStateHandler;
	if (selectors[selector])
	    return console.error(`SELECTOR ALREADY EXISTS (${selector}). Use unset first`);
	identifier = new Date().toString();
	history.replaceState({history:urlHistory,type:'spa', url: window.location.href, id: identifier,selector:selector},null, window.location.href);

	if(!click)
	    return console.error('requires click handler');
	
	if(!back)
	    return console.error('requires back handler');
	

	clickHandler = function(e) {
	    let ws = {selector:selector},  url;
	    if (!e.target.matches(selector))
		return;
	    
	    let func = lib.func.get(click);
	    if(!func)
		return console.error('action not found!', action);

	    try {
		func(e,ws);
	    }catch {
		console.error('problem with action:',action);
	    }
		
	};
	
	
	popStateHandler =  popStateCustom2(selector,back);
	selectors[selector] = {
	    click: clickHandler,
	    popstate: popStateHandler
	};
	
	document.addEventListener('click', clickHandler);
	window.addEventListener('popstate',popStateHandler);

    }


    function pushState(url,title='',selector=null,ws=undefined){
	let state,previousURL;
	if(url===undefined) return console.error("CANNOT PUSH STATE, URL UNDEFINED",url);
	if(!title)title ='';
	if(lib.utils.isEmpty(selector))selector=null;;
	previousURL = window.location.href.toString();
	urlHistory.push(previousURL);
	state = {history:urlHistory,type:'spa', id: identifier,url: url,previousURL : previousURL, selector: selector,ws:ws}
	console.error('pushing state:' , state);
        history.pushState(state, title, url);
    }

    function popStateCustom2(selector, handler){
	if (!lib.func.get(handler))
	    return console.error('HANDLER NOT A FUNCTION');
	
	return function (e){

	    let isSPA, backURL;
            let currentURL = location.href;
	    console.error('state is (e,history)', e.state,history.state,currentURL);
	    if (!e.state) return
	    [isSPA, backURL,id] = lib.hash.expand(e.state, "type back id");
	    

	    if(!isSPA)
		return;
	    if( id !=identifier){
		console.error('expired state.');
		backURL = window.location.href;
		window.location.href="";
                window.location.href=backURL;
		if(selector && selectors[selector])
                    window.removeEventListener('popstate', selectors[selector]);
		return;
	    }
	    if (!lib.utils.isEmpty(e.state.selector) && e.state.selector != selector){
		//this is the wrong handler 
		console.error('invalid selector - '+selector);
		return;
	    }
	    
	    backURL = state.url?backURL:window.location.href;
	    //if (!isSPA) return;
	    if(!urlHistory || urlHistory.length<= 1) {
		console.error('no previous history');
		
		window.location.href="";
		window.location.href=backURL;
		if(selector && selectors[selector])
                    window.removeEventListener('popstate', selectors[selector]);
		return;
	    }

	    if (currentURL != backURL)
		return console.error("currentUrl / state url mismatch!'", currentURL, backURL);
	    urlHistory.pop();
	    
	    handler(e,currentURL);
	}
    }

    
    function fetchWrapHREF(functionOrHash){
	let args = lib.hash.to(functionOrHash, 'data');
	return function(e,ws){
	    let pargs;
	    const url = lib.utils.toString(e)?e:e.target.href;
            if(!lib.utils.toString(e))e.preventDefault();
	    console.error(['FETCH WRAP HREF', url,args]);
	    pargs = lib.hash.merge(args, {pushState:pushState, ws:ws});
	    lib.fetch(url, pargs);
	    return false;
	}
    }

			     

    


    
    return {
	history:urlHistory,
	setClick: setClick,
	fetchWrapHREF : fetchWrapHREF,
	pushState: pushState,
	//fetchData : fetchData
    }
})(lib));
