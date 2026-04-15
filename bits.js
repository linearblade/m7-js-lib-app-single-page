/*
  new eventMessage(eventRoutes(), eventRouter);
*/
class eventMessage{

    constructor(routes,origin=null, router=null){
	this.debug=true;
	this.routes = routes;
	this.origin = Array.isArray(origin)?origin:[origin];
	this.router = router;

	this.lastEvent;
	this.id = null;


	if(this.routes)this.listen(true);
	/*
	  for (let key in routes) {
	  if (route.hasOwnProperty(key)) {
	  
	  }
	  }*/
    }
    
    defaultRouter(event){
	this.log('parsing route with string based router');
	return (/^(string|number)$/).test(typeof event.data)?event.data:null;
    }
    handleWrapper(){
	let obj = this;
	return (event) => {
	    obj.lastEvent = event;
	    obj.log('caught event',event);
	    let route = (typeof(obj.router) == 'function'?obj.router(event):obj.defaultRouter(event) );
	    if (!obj.validateOrigin(event) ){
		this.log('invalid event');
		return;
	    }else {
		this.log('trusted event');
	    }
	    return obj.handleEvent(route,event);
	}
    }
    handleEvent(route,event){
	let routeType= typeof(this.routes);
	if( !(/^(function|object)$/).test(routeType) ) {
	    this.log('invalid event route');
	    return null;
	}
	this.log(`routing ${route}`);
	if(routeType == 'object'){
	    this.log('using internal route map');
	    this.handleHash(route,event);
	}else {
	    this.log('using passed in functional route map');
	    this.routes(route,event);
	}
	
    }

    handleHash(route,event){
	if( !(/^(string|number)$/).test(typeof route) ) {
	    this.log(`route is not a string or number: ${route}`);
	    return null;
	}
	let func = this.routes[route];
	if(typeof(func) == 'function'){
	    this.log(`running event for ${route}`);
	    func(event);
	}else {
	    this.log(`event for  ${route} is not a function`);
	    //this is an error.
	}
	return;
    }
    validateOrigin(event){
	let origin = new URL(event.origin).hostname;
        if (typeof(origin) != 'string') {
            this.log("invalid Origin");
            return false;
        }
	
	for (let item of this.origin){
	    this.log(`testing ${origin} against ${item}`);
	    if (origin.match(item) )return true;
	}
	this.log(`invalid origin ${origin}`);
	return false;
        if (!origin.match(/alacritysim.com$/i) ){
            this.logt("bad origin");
            return false;
        }

	
	return true;
	
    }

    log(message){
	if(this.debug){
	    console.warn(arguments);
	}
	return;
    }

    abort(){
	this.log('flushing current listener');
	window.removeEventListener('message',this.id);
	this.id=null;
    }
    listen(flush=false){
	if(this.id){
	    if(!flush)return this.log('event listener already set. use flush=true')
	    this.abort();
	}
	this.log('starting listener');
	window.addEventListener(
	    "message",
	    this.id = this.handleWrapper()
	);
	
    }
}

function eventRoutes(){
    return {
	'reload' : (event)=>{
	    //https://stackoverflow.com/questions/570015/how-do-i-reload-a-page-without-a-postdata-warning-in-javascript
	    if ( window.history.replaceState ) {
		window.history.replaceState( null, null, window.location.href );
	    }
	    console.warn('reloading page' + window.location.href);
	    let name = 'some_junk_var';
	    urlParams[name] = urlParams[name]?parseInt(urlParams[name])+1:1;
	    let list = [];
	    for (let i in urlParams){
		list.push([i, urlParams[i] ]);
	    }
	    let qs = arrayToQS(list);
	    window.location.href = window.location.pathname +`?${qs}`;
	    //window.location.href = window.location.href+`&${name}=${counter}`;
	},
	'profile' : (event)=>{
	    let id = event.data['id'];
	    window.location.href=`/userprofiles.php?id=${id}`;
	},
	'dog' : (event)=>{
	    let id = event.data['id'];
	    window.location.href=`/dog.php?id=${id}`;
	},
	'topup' : (event)=>{
	    let rand = Math.floor(Math.random() *100 );
	    window.location.href=`/topup?rand=${rand}`;
	},
	
	'message' : (event)=>{
	    let id = event.data['id'];
	    let subject = event.data['subject'];
	    let body= event.data['body'];
	    let direct = event.data['direct'];
	    if(!subject)subject="";
	    if(!body)body="";
	    if(direct){
		//window.location= `/messages.php?folder=&action=message::compose&sendto=${id}&subject=${subject}&body=${body}`;
		window.location = `/mail/compose?to=${id}&subject=${subject}&body=${body}`;
	    }else{
		//modalIframe('#modal-message-compose', `/messages.php?folder=&action=message::compose&sendto=${id}&subject=${subject}&body=${body}`);
		modalClose();
		writeMail(id,subject,undefined,body);
	    }

	    //window.location.href= `/mtest.php?folder=&sendto=${id}&action=message::compose`;
	},
	'support' : (event) =>{
	    window.location.href="/issuehub.php";
	},
	'trade' : (event) =>{
	    window.location.href="/trade";
	},
	'redirect' : (event) => {
	    let url= event.data['url'];
	    alert(`captured ${url}`);
	    //window.location.href="";
	    //window.location.href=url;
	}
    }
}

function eventRouter(event){
    console.warn('using supplied router');
    if(typeof(event) !='object' && typeof(event.data) != 'object') {
	return;
	console.warn('invalid event sent to eventRouter',event);
    }
    if (!event.data['action']) return null;
    console.warn('route: '+event.data['action']);
    return (/^(string|number)$/).test(typeof event.data['action']) ? event.data['action']:null;
}

function toggleTabGroup(e){
    if (!lib.dom.is(e) ){

    }
    let groupTarget = lib.dom.get(e,'data-group');
    console.warn(groupTarget);
    let group = groupTarget?
        document.querySelector(`[role="tab-group"][data-name="${groupTarget}"]`):
        e.closest('[role=tab-group]');


    let labelE = e.closest('[role=tab-label]');
    if (!group)return console.error("tab group not found");
    if (!labelE)return console.error("tab label not found");
    let target=lib.dom.get(labelE, "data-target");
    if(!target)return console.error(`tab panel target not defined (data-target)`);

    let panels =group.querySelectorAll(`[role=tab-panel]`);
    console.log(panels);
    if (!panels) return console.error('no tab panels defined');
    for (let panel of panels){
        let name = lib.dom.get(panel, 'data-name');
        console.log(name);
        console.log(panel);
        if (name==target) panel.style.display='inline';
        else panel.style.display='none';
    }
    //let panel =group.querySelector(`[data-name=${target}]`);

    //if(!panel)return console.error('tab panel not found');
    return false;
}

//lift from utilsDom.js

function getAttrs(e){
    const attributes = e.attributes;
    let attrs = {};
    /*
      for (let i = 0; i < attributes.length; i++) {
      const attribute = attributes[i];
      console.log(`${attribute.name} = ${attribute.value}`);

      }
    */
    // Alternatively, using for...of loop
    for (const attribute of attributes) {
        //console.log(`${attribute.name} = ${attribute.value}`);
	attrs[attribute.name] = attribute.value;
    }
    return attrs;
}
function cloneJS(src){
    let e = lib.dom.getElement(src);
    if (!e)return undefined ;

    
    
    var script = document.createElement('script');
    //var attrs = Array.prototype.slice.call(e.attributes) || [];

    const attributes = e.attributes;
    for (const item of attributes){
	lib.dom.set(script,item.name,item.value);
    }
    //script.innerHTML = e.innerHTML;
    script.text = e.text;
    //clone.async=true;
    return script;
}
function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode, existingNode.nextSibling);
}
function removeElement( e ) {
    e = lib.dom.getElement(e);
    e.parentNode.removeChild(e);
}
/*
  used for single page app handling.
*/
function fetchData(data,info){
    let state,backURL ;
    console.error('MADE IT TO FETCH DATA!',data?"data = yes":"data-no",info);
    let url = lib.hash.get(info,'url');

    transferDomFromData(data, '#main', '#main',transferRunAT);
    transferDomFromData(data, '#widget-status', '#widget-status',transferRunAT);

    modalClose();

    // Update the address bar
    info.opts.pushState(url,null,lib.hash.get(info,'opts.ws.selector'),lib.hash.get(info,'opts.ws'));
    return;

}


function fetchData2(data,info){
    let state,backURL ,obj;
    console.error('MADE IT TO FETCH DATA!2',data?"data=yes":"data=no",info);
    let url = lib.hash.get(info,'url');

    
    obj = lib.hash.get(info,'opts.ws.obj');
    obj.state_push(url, null, {
	selector: lib.hash.get(info,'opts.ws.selector'),
	popstate: lib.hash.get(info,'opts.ws.popstate')
    });
    
    let match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
	urlParams[decode(match[1])] = decode(match[2]);

    transferDomFromData(data, '#main', '#main',transferRunAT);
    transferDomFromData(data, '#widget-status', '#widget-status',transferRunAT);
    modalClose();

    
    return;

}
function spa_click2(e,ws){
    modalOpen('loading');
    e.preventDefault();
    return lib.app.SPA.fetchWrapHREF(fetchData2)(e,ws);
}

function transferRunAT(data,src,dst,e){
    
    let selector = dst+' .activeTag\\-098';
    console.error('loading selector: ' +selector);
    AT098.load(selector);
    AT098.runAll();
    
}
var DEBUG;
function transferDomFromData(data, src , dst,func){
    DEBUG = data;
    const parser = new DOMParser();
    const doc = lib.dom.is(data)?
	  data:
	  parser.parseFromString(data, 'text/html');
    const mainContent = document.querySelector(dst);

    if(!mainContent)
        return console.error(`UNABLE TO FIND dst (${dst}) in document`);
    //const newContent = lib.dom.is(src)?src:doc.querySelector(src); 
    const newContent = doc.querySelector(src);

    if (!newContent)
        return console.error(`UNABLE TO FIND src (${src}) in data`);
    
    //mainContent.innerHTML = "";
    mainContent.innerHTML = newContent.innerHTML;
    const scripts = mainContent.querySelectorAll('script');
    for (let i = 0; i < scripts.length; i++) {
	let clone = cloneJS(scripts[i]);
	insertAfter(clone,scripts[i]);
	removeElement(scripts[i]);
    }

    lib.func.get(func, true)(data,src,dst);
    return doc;
}

function popStateResponse(data,info){
    console.error('POP STATE RESPONSE', data,info);


    transferDomFromData(data, '#main', '#main',transferRunAT);
    transferDomFromData(data, '#widget-status', '#widget-status',transferRunAT);
    modalClose();
}

function spa_click(e,ws){
    modalOpen('loading');
    return lib.app.SPA.fetchWrapHREF(fetchData)(e,ws);
}
function spa_popstate(e,url){
    modalOpen('loading');
    let response = function (data,info){
	console.error('POP STATE RESPONSE', data,info);

	transferDomFromData(data, '#main', '#main',transferRunAT);
	transferDomFromData(data, '#widget-status', '#widget-status',transferRunAT);
	modalClose();
    }
    lib.fetch(url, response);
}

/*
//old way
lib.event.spa.set('.ajax-link', [function(e){modalOpen('loading')}, lib.event.spa.fetchWrapHREF(lib.event.spa.fetchData)] );


//new way
lib.app.SPA.set(...SPA_args);

lib.event.spa.set takes 3 arguments
selector : this is a css selector, it will make against any click, sent. so they dont need to exist at the time they are set.
fetch-click    : is a list or singular , click runs this. 
fetch-popstate : is a fetch argument (opts). without a hash, it will convert into {response:arg} , as per lib.fetch.

At present, you must manually call the fetch to work, or use fetchWrapHREF to pull the link from an <a> tag and inject it into a fetch automatically.

Inside your click handler, you need to call info.opts.pushState(url) to load up the stack.
*/

var SPA_args = [
    '.ajax-link',
    [
	function(e){modalOpen('loading')},
	lib.app.SPA.fetchWrapHREF(fetchData)
    ],
    {
	'on': 	function(e){modalOpen('loading')},
	'response' : popStateResponse
    }
];
var SPA_args2 = [
    '.ajax-link',
    spa_click,
    spa_popstate
];
function startShit(){
    let test = new singlePageApp();
    test.click_set('.ajax-link', spa_click2,'default');
    test.click_set('.spa-link', spa_click2,'default');
    test.ps_set('default', spa_popstate);
    window.test = test;
}
function startup(){
    let intoSelector, outofSelector;
    console.log('running startup');
    //setEventMessage();
    /*
      window.onmessage = function (event) {
      if (event.data === "closed") {
      closeIFrame();
      }
      };
    */
    bs = new bootStrapper();
    window['AT'] = new activeTag();
    window['AF'] = new activeForm();
    window['AT098'] = new activeTag098();
    AT098.load('.activeTag\\-098');
    AT098.runAll();
    window['submitForm'] = AF.wrap(AF.submit);
    AT.load('.activeTag-live');
    if(typeof(chatLoader) == 'function')chatLoader();
    bs.ws['eventMessage'] = new eventMessage(eventRoutes(),/alacritysim.com$/i,eventRouter);

    //startShit();
    //lib.app.SPA.setClick(...SPA_args2);



    
    /*
      document.addEventListener('click', function(e) {
      console.log('capturing');

      if (e.target.matches('a[target=content-iframe-tag]')) {
      console.log('caught into iframe');
      return loadIntoIframe(e);
      } else if (e.target.matches('a[target=load-out-of-iframe]')) {
      console.log('into main');
      return loadIntoMain(e);
      }else if (e.target.matches('a.ajax-link')) {
      //urlHistory = [window.location.href];
      const url = e.target.href;
      try{modalOpen('loading');}catch{return console.error("problem with modal open. bailing out");};
      e.preventDefault();
      fetch(url)
      .then(response => response.text())
      .then(data => {
      const mainContent = document.getElementById('main');
      if(!mainContent)
      return console.error("MAIN CONTENT NOT FOUND");
      // Create a new DOM parser
      const parser = new DOMParser();
      // Parse the HTML string into a document
      const doc = parser.parseFromString(data, 'text/html');
      // Extract the desired element from the parsed document
      const newContent = doc.querySelector('#main'); // Adjust selector as needed
      if (!newContent)
      return console.error("UNABLE TO FIND MAIN");
      console.error('intercepted');
      // Replace the main content with the new content
      mainContent.innerHTML = newContent.innerHTML;
      modalClose();
      // Update the address bar
      urlHistory.push(window.location.href);

      history.pushState({click:1}, '', url);
      //window['previousURL'] = url;
      })
      .catch(error => console.error('Error loading content:', error));
      return false;
      }
      }, true);




      //document.addEventListener('DOMContentLoaded', function() {
      const links = document.querySelectorAll('.ajax-link');
      const mainContent = document.getElementById('main');
      let popStateHandler;
      popStateHandler =  function(e) {
      let fetchMe = location.href;
      let currentURL = location.href;
      const previousURL = window.urlHistory && window.urlHistory.length?window.urlHistory[window.urlHistory.length - 1]:null;
      console.error('state is', e.state,currentURL, previousURL);
      if( !previousURL) return;
      
      
      if ((e.state || currentURL == previousURL) && window.urlHistory.length == 1){
      console.error('at end of the list, doing a regular back to ',previousURL);
      window.removeEventListener('popstate', popStateHandler);
      window.location.href= "";
      window.location.href=previousURL;
      return;
      }
      
      
      if (currentURL != previousURL){
      if(e.state){
      fetchMe = previousURL;
      }else{
      console.error('url mismatch  (current,previous). bail out..', currentURL,previousURL);
      return;
      }
      }
      

      
      //if (!e.state )
      try {modalOpen('loading');}catch{return;};
      fetch(fetchMe)
      .then(response => response.text())
      .then(data => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(data, 'text/html');
      if(!doc)
      return console.error("unable to load document from back button");
      const newContent = doc.querySelector('#main'); // Adjust selector as needed
      const mainContent = document.getElementById('main');
      if (!newContent)
      return console.error("unable to fetch content from previous document")
      if(!mainContent)
      return console.error("unable to locate main content to insert into");
      mainContent.innerHTML = newContent.innerHTML;
      urlHistory.pop();
      modalClose();
      })
      .catch(error => console.error('Error loading content:', error));
      };
      
      window.addEventListener('popstate', popStateHandler);
    */



    
    /*
      intoSelector = document.querySelector("a[target=content-iframe-tag]");
      if(intoSelector && typeof(loadIntoFrame) !='undefined')
      intoSelector.addEventListener('click', loadIntoIframe, true);
      outofSelector =  document.querySelector("a[target=load-out-of-iframe]");
      if(outofSelector && typeof(loadIntoMain) !='undefined')
      outofSelector.addEventListener('click', loadIntoMain, true);
      
    */
    /*
      <a href="/dog.php?id=425376" target="load-out-of-iframe" target=>dog outside</a>
      <a href="/dog.php?id=425376" target="content-iframe-tag">dog</a>
    */
    
    /*
      e =document.getElementById('topwebgames');
      if(e){
      console.log('lazy loading');
      //e.setAttribute('language',"Javascript");
      e.type="text/javascript";
      e.src=e.getAttribute('data-src');

      e.text=e.text;
      }
    */
}
