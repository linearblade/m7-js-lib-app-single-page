/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

lib.hash.set(lib,'dom.chain', (function(lib) {
    //I've left run chain here b/c after thinking about this, your not really gonna use this toolset outside of the dom anyhow!
    //its primary purpose is to inline functions without having to resort to excess wrapper funcs and such, leading to lots of bounce around on pages
    //eventually we can complete the workflow project and integrate this with, activeTags , and our generalized workflow tool.
    
    let config = {};

    function getConfig(){
        return config;
    }

    function defaultConfig(){

	config = {
	    call:{
		format: ['e', 'job', 'args']
		//format: ['e', 'args']
	    },
	    interp: {
		return_invalid: true
	    }
	};
	

        return config;
    }
    function setConfig(conf) {
        for (k in conf)
            lib.hash.set(config, k, conf[k]);
    }
    

    //interpVars does not hang loose in activeTags v.0.9.9, you will need to pick it up from lib.str.interp

    //much simpler than active tags run chain. here we only run a given chain, and its based off the global namespace
    //no error failover.no interrupts.
    
    //gets the chain from the dom supplied.
    function runChain(node,target,ws = {}){
	
	let line = lib.utils.toString( lib.dom.get(node, target), 1).trim();
	if (lib.utils.isEmpty(line) )
	    return null;

	if (!lib.hash.is(ws) ) ws = {};
	let job = {
	    ws: ws,
	    _start:node,
	    e:node
	};

	let list =  _parseFunctions(line) ;
	let rv = _runFunctions(job,list);
	
	return rv;
    }
    //takes the chain directly, runs it.
    function runChainWith(node,chain,ws = {}){
	
	let line = lib.utils.toString( chain, 1).trim();
	if (lib.utils.isEmpty(line) )
	    return null;

	if (!lib.hash.is(ws) ) ws = {};
	let job = {
	    ws: ws,
	    _start:node,
	    e:node
	};

	let list =  _parseFunctions(line) ;
	let rv = _runFunctions(job,list);
	
	return rv;
    }

    //parse the functions from a runChain entry
    //... spreads arguments
    //@ calls a function directly, bypassings the workspace mechanics
    function _parseFunctions(line){
	let funcs  =lib.array.to(line,/\s+/),
	    out = [];
	for (let fun of funcs){
	    let parts = fun.split(/\:/);
	    let name = parts[0];
	    let args = parts.slice(1).join(':');
	    //let [name,args] = fun.split(/\:/,2);
	    args = lib.array.to(args,/\,/);

	    let spread = (name+'').startsWith('...') ? true:false;
	    if (spread) name= name.substr(3); 
	    let call = (name+'').startsWith('@') ? true:false;
	    if (call) name= name.substr(1); 
	    
	    out.push({f:name,a:args,spread:spread,call:call});
	}
	return out;
    }

    function _runFunctions(job, list){

	let scheme = interpScheme(job,undefined);
	let regex = new RegExp(/\$\[(.*?)\]/,"g");
	let builtIn = {    } ; // we have no builtins at the moment.
	
	let evalArgs = function (job,scheme,args){
	    args = lib.array.to(args);
	    for (let i =0;i<args.length;i++){
		let raw = args[i];
		let match = undefined;
		args[i] = interpVars(args[i], scheme);
		regex.lastIndex=0;
		if(match = regex.exec(raw)){
		    args[i] = evalTarget(job,match[1]);
		}else {
		}
	    }

	    return args;
	}
	let formatArgs = function (e,job,args,rec) {
	    let out = [];
	    //console.error('formatting args with ',rec);
	    if(rec.call){
		out.push(...args);
		return out;
	    }
	    for (let i of config.call.format) {
		if(i =='e')
		    out.push(e);
		if(i == 'job')
		    out.push(job);
		if (i=='args'){
		    if (rec.spread)
			out.push(...args);
		    else
			out.push(args);
		}
	    }
	    return out;
	}
	
	for (let rec of list){
	    let args = evalArgs(job,scheme,rec.a);
	    let rv;
	    //console.error(`${rec.f} with args `,args)
	    //continue;

	    try {
		if(rec.f in builtIn){ // builtins cannot be spread
		    rv = builtIn[rec.f](job,args);
		}else{
		    let e = job.e;
		    let fun = lib.func.get(rec.f,1);
		    let argSpread = formatArgs(e,job,args,rec);
		    rv = fun(...argSpread);
		    //rv = rec.spread?
		    //fun(e,job,...args):
		    //fun(e,job,args);
		    
		}
	    } catch (err) {
		console.error(`error running function ${rec.f}; reason : ${err.message}`);
		console.error(err);
	    }
	}
	
    }







    function interpScheme(job,custom={}){

	return function(target){
	    let info = parseTarget(job,target,custom);
	    //console.error(info);
	    if(lib.utils.isScalar(info))return info;
	    if (!lib.hash.is(info) || !info.src || !info.prop)
		return undefined;

	    if (lib.dom.is(info.src) ) return lib.dom.get(info.src,info.prop);
	    return lib.hash.get(info.src, info.prop);

	}
    }
    
    function parseTarget(job,target,custom={}){
	if(!target)return undefined;
	let splitter = function (str, exp=/\s+/,count=0){
	    str = lib.utils.toString(str,1);
	    let pos = str.indexOf(':');
	    return [str.substr(0,pos),pos>-1?str.substr(pos+1):undefined];

	};
	//console.error('parsing target for' , job , target);
	let data;
	//let [type,loc] = target.split(/:/,2);
	let [type,loc] = splitter(target);
	//if you want to allow this for 'literal values you'd return the default'
	if (!type) return config.interp.return_invalid?target:undefined;
	type = (type+"").toLowerCase();
	let disp = {

	    "window": () =>{
		return {
		    src: window,
		    prop: loc
		}
	    },
	    "ws":  () =>{
		//console.log(`>>ws.${loc}=`+lib.hash.get(job.ws,loc));
		
		return {
		    src: job.ws,
		    prop: loc
		}
	    },
	    "e":() =>{
		//return lib.dom.get(job.e, loc);
		//console.error('here', job.e, loc);
		return {
		    src:job.e,
		    prop: loc
		}
	    },
	    "find": () =>{
		let result = undefined;
		//console.log('running find on ',job.e,loc);
		try{
		    result = job.e.querySelector(loc);
		    if(!result && job.e.matches(loc))result = job.e;

		}catch{
		    result = undefined;
		    //console.log(`couldnt find element with querySelector('${loc}')`,job);
		}
		if(!result)console.log(`couldnt find element with e.querySelector('${loc}')`);
		return result;
	    },
	    "doc": () =>{
		let result = undefined;
		try{
		    result = document.querySelector(loc);
		}catch{
		    result = undefined;
		    //console.log(`error with  querySelector(selector '${loc}')`);
		}
		if(!result)console.log(`couldnt find element with document.querySelector('${loc}')`);
		return result;
	    },
	    "closest": ()=>{
		let result = undefined;
		try{
		    result = job.e.closest(loc);
		}catch{
		    result = undefined;
		    //console.log(`couldnt find element with closest(selector '${loc}' )`);
		}
		return result;

	    },
	    "default": () =>{
		return target;
	    }
	};

	if (lib.hash.is(custom) && type in custom){
	    //console.error(`returning custom ${type} , ${loc}`,custom);
	    return custom[type](loc);
	}else {
	    //console.error(`type :${type}, loc: ${loc}`);
	    if (!(type in disp))type="default";
	    return disp[type]();
	}
    }
    //evaluates a target variable.
    function evalTarget(job, target,custom){
	let parse = parseTarget(...arguments);
	return evalParse(parse);
    }


    //maybe we delete this
    function evalParse(parse){
	//console.error('EP',parse);
	if(lib.utils.baseType(parse,'object') && parse.src && parse.prop) {
	    return lib.dom.is(parse.src)?lib.dom.get(parse.src, parse.prop):lib.hash.get(parse.src,parse.prop);
	}
	return parse;
    }


    defaultConfig();
    var disp = {
        defaultConfig: defaultConfig,
	//init: ???
	run: runChain,
	runWith: runChainWith,
        getConfig: getConfig,
        setConfig: setConfig
    };
    return disp;
    
})(lib) );

    
lib.hash.set(lib,'bool', (function(lib) {
    function explicitTrue(val){
        type = typeof(val);
        if( (type =='undefined' || val===null) )return 0;
        if (type=='number')return val==1?1:0;
        if (type=='boolean')return val?1:0;
        if (type=='string')return val.match(/^(1|true|yes)$/i)?1:0;
        return 0;
    }
    function explicitFalse(val){
        type = typeof(val);
        if( (type =='undefined' || val===null) )return 0;
        if (type=='number')return val==0?1:0;
        if (type=='boolean')return val?0:1;
        if (type=='string')return val.match(/^(0|false|no)$/i)?1:0;
        return 0;
    }
    
    function is(val){
	return (typeof(val) == 'boolean');
    }
    function isExplicit(val){
	if (is(val) ) return true;
	return (explicitTrue(val) || explicitFalse(val) );
    }

    function to(val){
	return val?true:false;
    }

    function explicitTo(val) {
	return explicitTrue(val)?true:false;
    }
    
    return {
	isTrue: explicitTrue,
	isFalse: explicitFalse,
	xTrue: explicitTrue,
	xFalse: explicitFalse,
	is: is,
	isX : isExplicit,
	isExplicit: isExplicit,
	to : to,
	xTo: explicitTo,
	explicitTo: explicitTo

    };
})(lib) );

lib.hash.set(lib,'site', (function(lib) {

    
    function setAlert(e,text=undefined, type=undefined){
	let group, alert,alertClasses;

	type =(lib.utils.isEmpty(type))?undefined:type.toLowerCase();
	if(type && !type.match(/^alert\-/))type ="alert-"+type;
	
	group = e.closest("[role=group]");

	if(!group){
	    console.warn('element is not part of a group.',e);
	    return;
	}
	alert = group.querySelector('.alert');
	if(!alert){
	    console.warn('no alert found in group',group);
	    return;
	}

	if (text){
	    //let toolTip  =  alert.querySelector('tooltiptext');
	    let toolTip  =  alert.querySelector('.custom-tooltiptext');
	    let content  =  alert.querySelector('.custom-tooltip');
	    //console.warn("tip",toolTip,"content\n",content);
	    if(toolTip && content){
		toolTip.textContent=text;
		content.textContent =text;
	    }else {
		alert.textContent = text;
	    }
	    if (type) {
		if(type.match(/danger/i)) console.log('removing ',alertClasses);
		//alert.classList.remove(lib.array.to(alertClasses,/\s+/));
		let list = lib.args.slice(alert.classList);
		for(item of list){
		    if (item.match(/^alert\-/))
			alert.classList.remove(item);
		}
		alert.classList.add(type);
	    }
	    alert.classList.remove('d-hidden');
	    //$(alert).show();
	}else {
	    alert.classList.add('d-hidden');
	    //alert.addClass('d-none');
	}
    }
    var disp = {
	design: {
	    v1: {
		setAlert:setAlert
	    }
	}
    };
    return disp;

})(lib) );

lib.hash.set(lib,'site.localStorage', (function(lib){
    function keys()
    {
	const allKeys = [];
	for (let i = 0; i < localStorage.length; i++) {
	    allKeys.push(localStorage.key(i));
	}
	return allKeys;
    }
    function get(key,opts={})
    {
        opts = lib.hash.to(opts,'json');

        const rec = opts.json?
              JSON.parse(localStorage.getItem(key)):
              localStorage.getItem(key);
        return rec;
    }
    function set(key,data)
    {
        const store = lib.utils.isScalar(data)?
              data:
              JSON.stringify(data);

        localStorage.setItem(
            key,
            store
        );
    }
    function  deleteLocalStorage(key)
    {
        localStorage.removeItem(key);
    }
    return {
	set, get, delete:deleteLocalStorage,keys
    };
})(lib) );

lib.hash.set(lib,'site.delagator', (function(lib){


    // Event storage, to keep track of added delegators
    let events = [];

    // Helper function to find existing delegators
    function findDelegator(selector, eventType) {
        return events.find(function (delegator) {
            return delegator.selector === selector && delegator.eventType === eventType;
        });
    }

    // Set a delegator: Adds a new delegator or modifies an existing one
    function setDelegator(eventType, selector, handler) {
        // Remove any existing delegator for the same selector and event type
        removeDelegator(eventType, selector);

        // Add the new event listener using event delegation
        const delegator = function (e) {
            const targetElement = e.target.closest(selector);
            if (targetElement) {
                handler.call(targetElement, e);
            }
        };

        // Store the delegator details
        events.push({
            eventType: eventType,
            selector: selector,
            handler: delegator
        });

        // Attach the event listener to the document
        document.addEventListener(eventType, delegator);
    }

    // Remove a delegator: Detaches the event listener
    function removeDelegator(eventType, selector) {
        const existingDelegator = findDelegator(selector, eventType);
        if (existingDelegator) {
            // Remove the event listener from the document
            document.removeEventListener(eventType, existingDelegator.handler);

            // Remove the delegator from the events list
            events = events.filter(function (delegator) {
                return !(delegator.selector === selector && delegator.eventType === eventType);
            });
        }
    }

    // List all active delegators
    function listDelegators() {
        return events.map(function (delegator) {
            return {
                eventType: delegator.eventType,
                selector: delegator.selector
            };
        });
    }

    // Clear all delegators
    function clearDelegators() {
        events.forEach(function (delegator) {
            document.removeEventListener(delegator.eventType, delegator.handler);
        });
        events = [];
    }

    // Public API
    let dispatch = {
        set: setDelegator,
        remove: removeDelegator,
        list: listDelegators,
        clear: clearDelegators
    };

    return dispatch;

})(lib) );

lib.hash.set(lib,'site.collapse', (function(lib){


     /*
      * Collapse Component - Dynamic Panel Toggling Script
      * 
      * Description:
      * This script provides a dynamic collapse component system that allows for the 
      * toggling of panels (show/hide) based on triggers. It is fully configurable 
      * and supports parent-child relationships, where triggers can inherit attributes 
      * from their closest parent element marked as a collapse parent.
      * 
      * Usage:
      * 1. **Collapse Triggers**: 
      *    Elements with the `[data-collapse-trigger]` attribute will act as toggles 
      *    to show/hide target panels. The `aria-controls` attribute on the trigger 
      *    should point to the ID of the panel it controls.
      * 
      *    Example:
      *    <a href="#" data-collapse-trigger aria-controls="panel-id">Toggle Panel</a>
      * 
      * 2. **Panel Elements**:
      *    Panels are toggled based on the `aria-hidden` and `aria-expanded` attributes, 
      *    and the visibility is controlled by adding/removing the `tab-hidden` class.
      *    Each panel can optionally belong to a group (marked by `[data-toggle-group]`), 
      *    allowing multiple related panels to be toggled in sync.
      * 
      *    Example:
      *    <div id="panel-id" aria-hidden="true" aria-expanded="false" data-toggle-group="group-name">
      *       Panel Content Here
      *    </div>
      * 
      * 3. **Parent Elements**:
      *    You can mark a parent element with the `[data-collapse-parent]` attribute. 
      *    This allows triggers within the parent to inherit `data-toggle-on` or 
      *    `data-toggle-off` attributes from the parent if they are not explicitly set 
      *    on the trigger itself.
      * 
      *    Example:
      *    <div data-collapse-parent>
      *      <a href="#" data-collapse-trigger aria-controls="panel-id">Toggle Panel</a>
      *    </div>
      * 
      * 4. **Chained Functions**:
      *    You can use `data-toggle-on` and `data-toggle-off` attributes on triggers 
      *    or parent elements to specify space-separated lists of functions to execute 
      *    when the panel is shown or hidden.
      * 
      *    Example:
      *    <a href="#" data-collapse-trigger aria-controls="panel-id" data-toggle-on="func1 func2">Toggle Panel</a>
      * 
      * Configurable Options (within the script):
      * - `config.trigger`: Selector for collapse triggers.
      * - `config.parent`: Selector for collapse parent elements.
      * - `config.hidden`: Class used to hide panels (`tab-hidden` by default).
      * - `config.attrs`: Contains keys for various attributes like `data-listener-added`, 
      *   `data-toggle-group`, `data-toggle-on`, and `data-toggle-off`.
      * 
      * Dependencies:
      * This script relies on utility functions (`lib.utils`, `lib.func`, etc.) 
      * to handle conversions, boolean checks, and function execution. 
      * Ensure these utility functions are properly implemented and available globally.
      * 
      * Notes:
      * - Avoid adding duplicate event listeners by checking for `data-listener-added`.
      * - Uses the `aria-expanded` and `aria-hidden` attributes to control the state of panels.
      * - Error handling is included to prevent issues with missing target panels or invalid triggers.
      */
    let config = {};
    console.error("running collapse config");
    function getConfig(){
	return config;
    }




    function defaultConfig(){

	config = {
	    'trigger' : '[data-collapse-trigger]',
	    'parent'  : '[data-collapse-parent]',
	    'children': 'data-children',
	    'hidden'  : 'tab-hidden',
	    'attrs'   : {
		'listener' : 'data-listener-added',
		'group'    : 'data-toggle-group',
		'toggle_on': 'data-toggle-on',
		'toggle_off':'data-toggle-off'
	    },
	    'chain'   : lib.dom.chain.runWith
	};

	return config;
    }
    function setConfig(conf) {
        for (k in conf)
            lib.hash.set(config, k, conf[k]);
    }


     function runChain(e,attr) {
        //'chain' : lib.dom.chain.run
        const parent= e.closest(config.parent);
        const value = e.getAttribute(attr) ?? (parent?parent.getAttribute(attr):null );
        //console.error(`trying run chain with ${value} on ` , e);
        return lib.func.get(config.chain)(e, value);
        return lib.func.get(config.chain)(...arguments);
    }
    /*
    function runChain() {
        //'chain' : lib.dom.chain.run
	//$FIX ME
        return lib.func.get(config.chain)(...arguments);
	}
    */
     
     function initializeCollapseListeners() { 
	 const collapseTriggers = document.querySelectorAll(config.trigger);

	 collapseTriggers.forEach((trigger) => {
             // Avoid adding duplicate event listeners
             if (!trigger.hasAttribute(config.attrs.listener)) {

		 // Listener for collapse toggle functionality
		 trigger.addEventListener('click', function (event) {
                     event.preventDefault();  // Prevent default link behavior (if it's an <a>)
		     
		     //force a string even if its undefined, then trim it.
                     let target = lib.utils.toString(this.getAttribute('aria-controls')??null, true).trim();
		     if (lib.utils.isEmpty(target)) return;
		     
                     const targetPanel = document.getElementById(target);
		     if(!targetPanel){
			 console.error('${target} not found, cannot toggle');
			 return;
		     }
                     const isExpanded = this.getAttribute('aria-expanded') === 'true'; 
		     this.setAttribute('aria-expanded', isExpanded?'false':'true');
		     //we dont have toggle_off functionality here yet.
		     runChain(this, config.attrs.toggle_on);


		     const group = getGroup(targetPanel);
		     if(group) {
			 for (const panel of group) {
			     if(targetPanel !== panel)
				 togglePanel(panel,false);
			 }
			 togglePanel(targetPanel,true);
		     }else {
			 togglePanel(targetPanel);
		     }
		     

		     /*
		     const group = targetPanel.getAttribute(config.attrs.group);
		     
	     
		     if (group) {
			 const glist = document.querySelectorAll(`[${config.attrs.group}=${group}]`);
			 for (let gpanel of glist)
			     togglePanel(gpanel);
		     }else {
			 togglePanel(targetPanel);
		     }*/
		 });

		 // Mark the element to avoid duplicate listeners
		 trigger.setAttribute(config.attrs.listener, 'true');
             }
	 });
     }


    function getGroup(target){
	

	let groupName = lib.utils.toString (target.getAttribute(config.attrs.group), 1).trim();
	const parent= target.closest(config.parent);
	let pGroup = null;
	let derivedGroup = null;
	if (lib.utils.isEmpty(groupName)) 
	    pGroup = parent?lib.utils.toString (parent.getAttribute(config.attrs.group), 1).trim():null;


	derivedGroup = lib.utils.isEmpty(groupName) ?pGroup:groupName;
	console.error('group info', {groupName: groupName, parent: parent, parentGroup:pGroup, derivedGroup:derivedGroup});	
        if (lib.utils.isEmpty(derivedGroup)) {
            //console.warn(`No valid toggle group found for panel with id "${targetPanelId}"`);
            return null;
        }

	
        let allPanels = Array.from( document.querySelectorAll(`[${config.attrs.group}="${groupName}"]:not(${config.parent})`) );

	console.error(allPanels);

	//you will also have to collect the childrne of the parent. b/c if your group was defined in the parent. then you cannot identify them from the selector.
	
	if(pGroup) {
            let ids = lib.utils.toString(parent.getAttribute(config.children), 1).trim();
            if(!lib.utils.isEmpty(ids)){
                ids = lib.array.to(ids,/\s+/);
                for (let id of ids) {
                    let n = lib.dom.byId(id);
                    if (n && !allPanels.includes(n)) {
                        allPanels.push(n);
                    }
                }
            }
        }
	return allPanels;
	
    }
    /*
     function runChain(e,field){
	 let val = e.getAttribute(field)?.trim() || null;
	 //console.error(e,val, field,config.parent);
	 if (lib.utils.isEmpty(val)) {
             // try and check parent.
	     
             let parent = e.closest(config.parent);
	     if (!parent) return;
             val = parent.getAttribute(field)?.trim() || null;
             if (lib.utils.isEmpty(val))
		 return;
	 }
	 //console.error(e,field,  val);
	 if(lib.bool.xFalse(val) ) return;
	 const list = lib.array.to(val, /\s+/);
	 let ws = {};
	 for (let func of list){
	     //console.error('try to run ' + func);
             lib.func.get(func,true)(e,ws);
	 }
	 return;
     } */
    function togglePanel(panel,state=null) {
	 // Set panel attributes and hide it
	let isHidden = lib.bool.xTrue( panel.getAttribute('aria-hidden'));
	if(lib.bool.isExplicit(state) )
	    isHidden=lib.bool.xTo(state);
	
	if (isHidden){
	    panel.classList.remove(config.hidden);
	    panel.setAttribute('aria-hidden', 'false');
	    panel.setAttribute('aria-expanded', 'true');
	    runChain(panel, config.attrs.toggle_on);
	}else {
	    panel.classList.add(config.hidden);
	    panel.setAttribute('aria-hidden', 'true');
	    panel.setAttribute('aria-expanded', 'false');
	    runChain(panel, config.attrs.toggle_off);
	}
    }


    function listener(event){

        event.preventDefault();  // Prevent default link behavior (if it's an <a>)

        //force a string even if its undefined, then trim it.
        let target = lib.utils.toString(this.getAttribute('aria-controls')??null, true).trim();
        if (lib.utils.isEmpty(target)) return;

        const targetPanel = document.getElementById(target);
        if(!targetPanel){
            console.error(`${target} not found, cannot toggle`);
            return;
        }
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        this.setAttribute('aria-expanded', isExpanded?'false':'true');
        //we dont have toggle_off functionality here yet.
        runChain(this, config.attrs.toggle_on);

	
        const group = getGroup(targetPanel);
        if(group) {
            for (const panel of group) {
		if(targetPanel !== panel)
                    togglePanel(panel,false);
            }
	    togglePanel(targetPanel,true);
        }else {
            togglePanel(targetPanel);
        }
	/*
	const group = targetPanel.getAttribute(config.attrs.group);
        if (group) {
	    //in this case, the triggered element will be on, and the others off.
            const glist = document.querySelectorAll(`[${config.attrs.group}=${group}]`);
            for (let gpanel of glist){
		if(targetPanel !== gpanel)
                    togglePanel(gpanel,false);
	    }
	    togglePanel(targetPanel,true);
        }else {
            togglePanel(targetPanel);
        }*/
    }


    
    function initDelagator(){
        if (!lib.hash.get(lib,'site.delagator') )
            return console.warn('lib.site.delagator not found, event delagation for collapse not set');

        lib.site.delagator.set("click", config.trigger,  listener);

    }
    
     // Check if DOM is already loaded or wait for 'DOMContentLoaded'
     if (document.readyState === 'loading') {
	 document.addEventListener("DOMContentLoaded", initDelagator);
     } else {
	 initDelagator();
     }
    
    defaultConfig();
    var disp = {
        defaultConfig: defaultConfig,
        init: initializeCollapseListeners,
        getConfig: getConfig,
        setConfig: setConfig
    };
    return disp;    

})(lib) );


lib.hash.set(lib,'site.dialog', (function(lib){
    /**
     * site.dialog module
     *
     * This module manages dialog and modal behavior, providing support for
     * both modal dialogs (with backdrop and scroll lock) and non-modal dialogs.
     * It handles triggering, opening, closing, and chaining actions for dialogs.
     * The configuration is customizable to support various types of dialogs and behaviors.
     *
     * Features:
     * - Supports modal and non-modal dialog management
     * - Allows configuration for CSS classes, triggers, listeners, and more
     * - Manages a backdrop for modal dialogs, including scroll locking
     * - Runs custom chain actions when opening and closing dialogs
     * - Handles accessibility attributes like aria-hidden and aria-modal
     *
     * Configurations:
     * - 'trigger': Selector for elements that trigger opening dialogs
     * - 'close': Selector for elements that trigger closing dialogs
     * - 'parent': Optional parent container for dialog grouping
     * - 'hidden': CSS class for hidden dialogs
     * - 'visible': CSS class for visible dialogs
     * - 'lock': CSS class for scroll lock behavior
     * - 'content': CSS class applied to elements treated as dialogs
     * - 'zcontent': Optional additional class for dialog container
     * - 'backdrop': CSS class for backdrop elements
     * - 'attrs': Attributes for tracking listeners, actions, and groups
     * - 'chain': Function used to execute chained actions
     *
     * Initialization:
     * - Automatically initializes listeners if the DOM is ready, or waits for 'DOMContentLoaded'
     *
     * Functions:
     * - defaultConfig(): Sets the default configuration for the dialog module
     * - getConfig(): Returns the current configuration
     * - setConfig(conf): Updates the configuration with custom settings
     * - runChain(e, field): Runs a chain of functions specified by attributes
     * - ensureModalBackdrop(): Ensures a backdrop element is present for modal dialogs
     * - modalIsTextSelected(): Checks if text is selected on the page
     * - triggerOpen(trigger): Handles the logic for opening a dialog based on a trigger
     * - openBackdrop(): Displays the backdrop and locks scroll
     * - closeBackdrop(): Hides the backdrop and unlocks scroll
     * - dialogOpen(target): Opens the specified dialog, managing modal vs. non-modal behavior
     * - triggerClose(trigger): Closes a dialog based on a trigger, with optional "close all" support
     * - dialogClose(target): Closes the specified dialog or all dialogs
     * - initializeListeners(): Sets up event listeners for triggering and closing dialogs
     *
     * Usage:
     * - The module is automatically initialized, or you can manually call the 'init' function
     * - Use 'triggerOpen' and 'triggerClose' to programmatically open and close dialogs
     * - Configuration can be customized before initialization using 'setConfig'
     *
     * Example:
     *   site.dialog.triggerOpen('#my-dialog');
     *   site.dialog.triggerClose('#my-dialog');
     */

/**
 * Example Usage for Modal and Non-Modal Dialogs
 *
 * HTML Structure:
 *
 * 1. Modal Dialog Example:
 *
 <!-- Modal Trigger -->
 <a href="#" data-dialog-trigger data-dialog-type="modal" aria-controls="modal-id" role="button">Open Modal</a>

 <!-- Modal Structure -->
 <div id="modal-id" class="modal-container modal-hidden" role="dialog" aria-modal="true" aria-hidden="true">
   <div class="modal-content">
     <header class="modal-header">
       <h2>Modal Title</h2>
       <button type="button" data-dialog-close aria-controls="modal-id" class="modal-close" aria-label="Close modal">&times;</button>
     </header>
     <div class="modal-body">
       <p>This is the content inside the modal dialog.</p>
     </div>
     <footer class="modal-footer">
       <button type="button" data-dialog-close aria-controls="modal-id" class="modal-close">Close</button>
     </footer>
   </div>
 </div>

 * 2. Non-Modal Dialog Example:
 *
 <!-- Non-Modal Dialog Trigger -->
 <a href="#" data-dialog-trigger data-dialog-type="dialog" aria-controls="dialog-id" role="button">Open Dialog</a>

 <!-- Non-Modal Dialog Structure -->
 <div id="dialog-id" class="dialog-container modal-hidden" role="dialog" aria-hidden="true">
   <div class="dialog-content">
     <header class="dialog-header">
       <h2>Dialog Title</h2>
       <button type="button" data-dialog-close aria-controls="dialog-id" class="dialog-close" aria-label="Close dialog">&times;</button>
     </header>
     <div class="dialog-body">
       <p>This is the content inside the non-modal dialog.</p>
     </div>
     <footer class="dialog-footer">
       <button type="button" data-dialog-close aria-controls="dialog-id" class="dialog-close">Close</button>
     </footer>
   </div>
 </div>

 * Explanation:
 * - The 'data-dialog-trigger' attribute on the trigger elements indicates that clicking them will open a dialog.
 * - The 'data-dialog-type' attribute specifies whether the dialog is a 'modal' or a 'dialog' (non-modal).
 * - The 'aria-controls' attribute on the trigger points to the ID of the dialog that should be opened.
 * - In the dialog structure:
 *   - 'role="dialog"' indicates that the element is a dialog.
 *   - 'aria-modal="true"' is used only for modals to indicate that the rest of the page is not accessible when the modal is open.
 *   - 'aria-hidden="true"' is set initially to hide the dialog from assistive technologies until it is opened.
 * - Close buttons use 'data-dialog-close' to indicate that they will close the associated dialog.
 *
 * Run Chain Options:
 * - 'data-toggle-on': Defines a list of functions to be executed when the dialog is opened.
 * - 'data-toggle-off': Defines a list of functions to be executed when the dialog is closed.
 * - The functions specified in these attributes should be space-separated and will be executed in sequence.
 * - Example:
 *   <div data-toggle-on="function1 function2" data-toggle-off="function3">...</div>
 */

    
    let config = {};
    console.error("running dialog config");
    function getConfig(){
        return config;
    }




    function defaultConfig(){
     config = {
	 'trigger' : '[data-dialog-trigger]',
	 'close' : '[data-dialog-close]',
	 'parent'  : '[data-dialog-parent]',
	 'hidden'  : 'modal-hidden',
	 'visible'  : 'modal-visible',
	 'lock'    : 'modal-lock',
	 'content' : 'modal-content',  //this will be applied to an element if not already there.
	 'zcontent' : 'modal-container',  //this will be applied to an element if not already there.
	 'backdrop': 'modal-backdrop', //this is the backdrop wrapper
	 'attrs'   : {
	     'listener' : 'data-listener-added',
	     'group'    : 'data-toggle-group',
	     'on': 'data-toggle-on',
	     'off':'data-toggle-off'
	 },
	 'chain' : lib.dom.chain.run
     };
        return config;
    }
    function setConfig(conf) {
        for (k in conf)
            lib.hash.set(config, k, conf[k]);
    }
    function runChain() {
	//'chain' : lib.dom.chain.run
	return lib.func.get(config.chain)(...arguments);
    }

     

    function ensureModalBackdrop(target=null,trigger=null) {
	 // Check if the modal backdrop exists by looking for the container with id="modal-backdrop"
	 let backdropContainer = document.getElementById(config.backdrop);
	 
	 // If the backdrop container doesn't exist, create it
	 if (!backdropContainer) {
             backdropContainer = document.createElement('div');
             backdropContainer.id = config.backdrop;
	     backdropContainer.classList.add(config.hidden);
             // Create the inner backdrop element with the class 'modal-backdrop'
             const backdrop = document.createElement('div');
             backdrop.classList.add('modal-backdrop');

             // Append the backdrop to the container
             backdropContainer.appendChild(backdrop);

             // Append the backdrop container to the top of the document body
             document.body.insertBefore(backdropContainer, document.body.firstChild);
	 }

	 // Check if the listener has already been added by using a custom attribute
	const backdrop = backdropContainer.querySelector('.modal-backdrop');
	if (backdrop ){
	    if(trigger){
		trigger = lib.dom.attempt(trigger);
		backdrop.setAttribute('data-trigger',trigger.id);
	    }else {
		backdrop.removeAttribute('data-trigger');
	    }
	}

	 if (!backdrop.hasAttribute(config.listener)) {

             // Add an event listener to the backdrop to call modalClose when clicked
             backdrop.addEventListener('click', function(e) {

		 const backdropEl = e.currentTarget;
		 const triggerId = backdropEl.getAttribute('data-trigger') ?? null;
		 const trigger = triggerId ? document.getElementById(triggerId) : null;

		 let useButton = null;
		 if (trigger) {
		     const bdClose = trigger.getAttribute('data-backdrop-close');
		     if (bdClose) {
			 useButton = lib.dom.attempt(bdClose);
		     }
		 }

		 if (useButton) {
		     useButton.click();
		 } else {
		     dialogClose();
		 }
             });
	     
             // Mark the backdrop to avoid adding duplicate listeners
             backdrop.setAttribute(config.listener, 'true');
	 }
	 return backdropContainer;
     }

     function modalIsTextSelected() {
	 return window.getSelection().toString().length > 0;
     }


    function triggerOpen(trigger) {
	
	 if (modalIsTextSelected())return;
	 trigger = lib.dom.attempt(trigger,true);
	 const target = lib.dom.get(trigger, 'aria-controls')??null;
	 if (!target)
	     throw Error("target not found for modal open ");
	 
	 

	 runChain( trigger, config.attrs.on);
	dialogOpen(target,trigger);
     }

    function openBackdrop(target=null,trigger=null){
	 //lock page
	 const  scrollTop = document.documentElement.scrollTop;
	 const  dbScrollTop = document.body.scrollTop;
	 document.documentElement.classList.add(config.lock);
	 document.body.classList.add(config.lock);
	 document.documentElement.scrollTop = document.body.scrollTop = scrollTop;
	 
	 //show backdrop
	let backdrop = ensureModalBackdrop(target,trigger);
	 //backdrop['data-target'] = target.id;
	 backdrop.classList.remove(config.hidden);
	 backdrop.setAttribute('data-scrolltop' , scrollTop);
	 backdrop.setAttribute('data-dbscrolltop' , dbScrollTop);
     }

     function closeBackDrop(){
	 const backdrop = lib.dom.getElement(config.backdrop);

	 //if we have made it here without errors, now we can put away the backdrop (if necessary)
	 if (backdrop) {
	     //dont reset the lock unless the backdrop is open. 
	     if (!backdrop.classList.contains(config.hidden) ) {
		 // Reset scroll lock
		 //const scrollTop = document.documentElement.scrollTop;
		 let  scrollTop = backdrop.getAttribute('data-scrolltop') ??  document.documentElement.scrollTop;
		 let  dbScrollTop = backdrop.getAttribute('data-dbscrolltop') ?? scrollTop;
		 document.documentElement.classList.remove(config.lock);
		 document.body.classList.remove(config.lock);
		 //scrollTop must be reset AFTER removal of classes
		 document.documentElement.scrollTop = document.body.scrollTop = scrollTop;
		 backdrop.removeAttribute('data-scrolltop');
		 backdrop.removeAttribute('data-dbscrolltop');
		 
	     }
	     const trigger=backdrop.getAttribute('data-trigger');
	     if (trigger){
		 runChain(trigger, config.attrs.off);
	     }
             backdrop.classList.add(config.hidden); // Hide backdrop
             //backdrop['data-target'] = ""; // Clear the target reference, maybe just remove this altogether.
	     backdrop.removeAttribute('data-target');
	     backdrop.removeAttribute('data-trigger');
	 }

     }
     

     
    function dialogOpen(target,trigger=null){
	 if (modalIsTextSelected())return;
	 target= lib.dom.attempt(target,true);


         if(lib.bool.xTrue( lib.dom.get(target,'aria-modal') ) ){
	     dialogClose();
	     openBackdrop(target,trigger);
	 }
	 
	 //Since any target may be modal , and may already be visible on the page, we use a 
	 target.classList.add(config.visible);
	 lib.dom.set(target, 'aria-hidden', 'false');
	 //rewrite add this class if not present, mark the element so when we close it later, we know if it was already existing or not (we dont want to remove it if it started that way)
	 target.classList.add(config.content);

	 runChain(target, config.attrs.on);
	 return false;
     }

     //takes a trigger element, an closes its associated modal, running any particular toggle off handlers it has before passing to panel.
     function triggerClose(trigger){
	 trigger=lib.dom.attempt(trigger,true);
	 runChain(trigger, config.attrs.off);

	 const controls = lib.dom.get(trigger, 'aria-controls');

	 // If no aria-controls (empty), close all modals
	 if (lib.utils.isEmpty(controls)) {
             return modalClose();  // Close all modals
	 }

	 let element = controls?
	     lib.dom.getElement(controls):
	     null;

	 if (!element) 
             throw Error (`Modal element for aria-controls "${controls}" not found.`);

	 dialogClose(element);
     }
    
    //returns a list of open modal dialogs (currnetly there is only 1 that can be open but maybe later when we have time we can tile them
    //returns null if no modals are open
    //does not check for dialogs, only modal
    function isModalOpen(target = null)
    {
	 let closeList = [];

	 if (!lib.utils.isEmpty(target) ){ 	//is this modal open
	     let node = lib.dom.attempt(target, true);
	     if (lib.bool.xTrue(node.getAttribute('aria-modal'), true) ){
		 closeList.push(node);
	     }

	 }else { //is any modal open
	     
	     const list = document.querySelectorAll('.'+config.content);
	     for (const node of list){
		 if (lib.bool.xTrue(node.getAttribute('aria-modal'), true) ){
		     closeList.push(node);
		 }
	     }
	 }
        if(!closeList || closeList.length < 1)return null;
	return closeList;
    }
     
    function dialogClose(target = null,silent=false) {
	 // two circumstances.
	 // 1/ we wanna close just this modal
	 // 2/ we wanna close all modals (in which case we arent really a modal. but hey, they amount to almost the same thig
	 //
	 // since backdrop is not presently attached to the modal, we need to account for a 'let god sort it out' and find all modals and close.
	 // instead just foreach loop anything flagged as modal-content.
	 //
	 // Ensure the target is processed correctly (either passed directly or inferred from backdrop)
	 let closeList = [];

	 let flagCloseBackDrop = false;
	 if (!lib.utils.isEmpty(target) ){
	     let node = lib.dom.attempt(target, true);
	     if (lib.bool.xTrue(node.getAttribute('aria-modal'), true) ){
		 flagCloseBackDrop = true;
	     }
	     if (!node.matches('.'+config.content) ){
		 if (!silent)
		     throw Error("invalid modal target");
	     }else{
		 closeList.push(node);
	     }
	 }else {
	     
	     flagCloseBackDrop = true;
	     closeList = document.querySelectorAll('.'+config.content);
             if(!closeList || closeList.length < 1)return false;
	 }

	 
         for (let node of closeList) {
	     node.classList.remove(config.visible);
             node.classList.remove(config.content);
	     lib.dom.set(node,'aria-hidden','true');
	     runChain(node, config.attrs.off); // Run any toggle_off actions
	     
         }


	 if (flagCloseBackDrop)
	     closeBackDrop();


	 
         return false; // it can be called directly from an onclick .
	 

     }

    /*
     function runChain(e,field){
	 let val = e.getAttribute(field)?.trim() || null;
	 //console.error(e,val, field,config.parent);
	 if (lib.utils.isEmpty(val)) {
             // try and check parent.
	     
             let parent = e.closest(config.parent);
	     if (!parent) return;
             val = parent.getAttribute(field)?.trim() || null;
             if (lib.utils.isEmpty(val))
		 return;
	 }
	 //console.error(e,field,  val);
	 if(lib.bool.xFalse(val) ) return;
	 const list = lib.array.to(val, /\s+/);
	 let ws = {};
	 for (let func of list){
	     //console.error('try to run ' + func);
             lib.func.get(func,true)(e,ws);
	 }
	 return;
     }
     */

     
     
     function initializeListeners() { 
	 const triggers = document.querySelectorAll(config.trigger);

	 triggers.forEach((trigger) => {
             // Avoid adding duplicate event listeners
             if (!trigger.hasAttribute(config.attrs.listener)) {

		 // Listener for collapse toggle functionality
		 trigger.addEventListener('click', function (event) {
                     event.preventDefault();  // Prevent default link behavior (if it's an <a>)
		     triggerOpen(this);
		 });

		 // Mark the element to avoid duplicate listeners
		 trigger.setAttribute(config.attrs.listener, 'true');
             }
	 });
	 
	 const closeTriggers = document.querySelectorAll(config.close);
	 
	 closeTriggers.forEach((trigger) => {
             // Avoid adding duplicate event listeners
             if (!trigger.hasAttribute(config.attrs.listener)) {

		 // Listener for collapse toggle functionality
		 trigger.addEventListener('click', function (event) {
                     event.preventDefault();  // Prevent default link behavior (if it's an <a>)
		     triggerClose(this);

		 });

		 // Mark the element to avoid duplicate listeners
		 trigger.setAttribute(config.attrs.listener, 'true');
             }
	 });


	 
     }

    function initDelagator(){
	if (!lib.hash.get(lib,'site.delagator') )
	    return console.warn('lib.site.delagator not found, event delagation for dialog boxes not set');
	
	lib.site.delagator.set(
	    'click', config.trigger,

	    function (event) {
                event.preventDefault();  // Prevent default link behavior (if it's an <a>)
                triggerOpen(this);
            }
	);
	lib.site.delagator.set(
	    'click', config.close,
	     function (event) {
                 event.preventDefault();  // Prevent default link behavior (if it's an <a>)
                 triggerClose(this);
		 
             }
	);
    }

    defaultConfig();
    
     // Check if DOM is already loaded or wait for 'DOMContentLoaded'
     if (document.readyState === 'loading') {
	 //document.addEventListener("DOMContentLoaded", initializeListeners);
	 document.addEventListener("DOMContentLoaded", initDelagator);
     } else {
	 
	 //initializeListeners();
	 initDelagator();
     }
     
    

     

    var disp = {
        defaultConfig: defaultConfig,
        init: initializeListeners,
        getConfig: getConfig,
        setConfig: setConfig,
	triggerOpen : triggerOpen,
	triggerClose: triggerClose,
	//open  : open,
	//close : close
	isModalOpen : isModalOpen,
	close : dialogClose

    };
    return disp;    

})(lib) );

    
lib.hash.set(lib,'site.tabs', (function(lib){

    /*
     * Tabs Component - Dynamic Tab Switching System
     *
     * Description:
     * This script provides a dynamic tab switching system where multiple tab groups 
     * (linked by a common attribute) can toggle the visibility of their associated panels.
     * It supports dynamically running functions when tabs are shown or hidden, and is 
     * fully configurable for various use cases.
     * 
     * Usage:
     * 1. **Tab Triggers**:
     *    Elements marked with the `[data-tab-trigger]` attribute act as triggers for 
     *    toggling between different panels. The `aria-controls` attribute should point 
     *    to the ID of the panel it controls, and the `aria-selected` attribute is used 
     *    to indicate the currently active tab.
     * 
     *    Example:
     *    <a href="#" data-tab-trigger aria-controls="panel-id" aria-selected="false">Tab 1</a>
     * 
     * 2. **Panels**:
     *    Panels are toggled based on the `aria-hidden` and `aria-expanded` attributes.
     *    The visibility is controlled by adding or removing the `tab-hidden` class.
     *    Panels can belong to a group, which is indicated by the `data-toggle-group` attribute.
     * 
     *    Example:
     *    <div id="panel-id" aria-hidden="true" data-toggle-group="group-name">
     *       Panel content goes here...
     *    </div>
     * 
     * 3. **Parent Elements**:
     *    The parent container of the tabs (marked by `[data-tab-parent]` or `[role="tablist"]`)
     *    manages the relationship between tabs and their panels. The system checks the parent
     *    to properly manage group visibility and tab selection.
     * 
     * 4. **Chained Functions**:
     *    Custom functions can be triggered when tabs are toggled on or off by using the 
     *    `data-toggle-on` and `data-toggle-off` attributes. These can be space-separated 
     *    lists of functions to be run when the tab is selected (on) or deselected (off).
     * 
     *    Example:
     *    <a href="#" data-tab-trigger data-toggle-on="func1 func2" data-toggle-off="func3">Tab 1</a>
     * 
     * Configurable Options:
     * - `trigger`: Selector for tab triggers (default: `[data-tab-trigger]`).
     * - `parent`: Selector for tab parent elements (default: `[data-tab-parent]`).
     * - `hidden`: Class used to hide inactive panels (`tab-hidden` by default).
     * - `selected`: Class used to mark the currently active tab (`selected` by default).
     * - `attrs`: Contains keys for various attributes like `data-listener-added`, `data-toggle-group`, 
     *   `data-toggle-on`, and `data-toggle-off`.
     * - `allow_rerun_on`: If `true`, the `on` chain will be rerun even if the tab is already selected.
     * - `allow_rerun_off`: If `true`, the `off` chain will be rerun even if the tab is already deselected.
     * 
     * Functions:
     * - `defaultConfig()`: Resets the configuration to default values.
     * - `setConfig(conf)`: Allows you to modify or set specific configurations.
     * - `getConfig()`: Returns the current configuration.
     * - `runChain(e, field)`: Executes the functions listed in the `data-toggle-on` or `data-toggle-off` attributes.
     * - `toggleGroupVisibility(element)`: Handles showing and hiding panels within a tab group based on the clicked trigger.
     * - `initializeToggleListeners()`: Sets up event listeners on tab triggers, ensuring no duplicate listeners.
     * 
     * Dependencies:
     * This script depends on utility functions (`lib.utils`, `lib.func`, `lib.hash`, etc.) 
     * for array handling, string manipulation, and function execution. Ensure these utility 
     * functions are correctly implemented and available globally.
     * 
     * Notes:
     * - Avoids duplicate event listeners by checking for `data-listener-added`.
     * - Manages `aria-selected` and `aria-hidden` states to ensure proper accessibility.
     * - Supports flexible configurations and can be integrated into a larger library or framework.
     */

    /*
 * Required CSS Classes for Tab Component
 * 
 * 1. **`tab-hidden`**: 
 *    This class is applied to panels to hide them. Typically, this class will use `display: none` 
 *    or similar styles to prevent the hidden panel from being visible or interactable.
 * 
 *    Example:
 *    .tab-hidden {
 *        display: none;
 *    }
 * 
 * 2. **`selected`**:
 *    This class is applied to the currently active tab trigger (i.e., the tab that is selected).
 *    You may use this class to visually differentiate the active tab (e.g., bold text, a different color, etc.).
 * 
 *    Example:
 *    .selected {
 *        font-weight: bold;
 *        background-color: #f0f0f0; // or any visual cue for the selected tab 
 *    }
 * 
 * Custom CSS Notes:
 * - Ensure that the `tab-hidden` class is applied to panels that should be hidden and removed from the 
 *   currently visible panel.
 * - The `selected` class should be used on the active tab trigger to indicate which tab is currently open.
 * - If you have custom styling for your tabs or panels, ensure that those styles do not interfere with 
 *   the basic functionality of hiding and showing panels via the `tab-hidden` class.
 */

    
    let config = {};
    console.error("running tab config");
    function getConfig(){
	return config;
    }




    function defaultConfig(){


	config = {
            'trigger' : '[data-tab-trigger]',
            'parent'  : '[data-tab-parent]', //  '[role="tablist"]'
	    'children': 'data-children',
            'hidden'  : 'tab-hidden',
	    'selected': 'selected',
            'attrs'   : {
		'listener' : 'data-listener-added',
		'group'    : 'data-toggle-group',
		'on': 'data-toggle-on',
		'off':'data-toggle-off'
            },
	    allow_rerun_on : false, //if true,  it will re run the on toggle without checking if it was previously selected, if false, it will  not re run if that element was previously selected
            allow_rerun_off: false, //same as above,
	    chain: lib.dom.chain.runWith
	};
	return config;
    }
    function setConfig(conf) {
        for (k in conf)
            lib.hash.set(config, k, conf[k]);
    }

    function runChain(e,attr) {
        //'chain' : lib.dom.chain.run
	const parent= e.closest(config.parent);
        const value = e.getAttribute(attr) ?? (parent?parent.getAttribute(attr):null );
	//console.error(`trying run chain with ${value} on ` , e);
        return lib.func.get(config.chain)(e, value);
        return lib.func.get(config.chain)(...arguments);
    }

    function toggleGroupVisibility(element) {
        const targetPanelId = element.getAttribute('aria-controls');
	//console.warn(element,targetPanelId);

	const tabList = element.closest('[role=tablist]');
        if(!tabList) {
            console.error('tablist not found');
            return;
        }
	_handleTabs(element,tabList);

        const targetPanel = document.getElementById(targetPanelId);
        if (!targetPanel) {
	    const tabParent= element.closest(config.parent);
	    if (element.getAttribute('data-no-controls') == 'true' || tabParent && tabParent.getAttribute('data-no-controls') == 'true')
		return;
	    console.error(`No panel found with id "${targetPanelId}"`);
            return;
        }


	
	
	const parent= targetPanel.closest(config.parent);
        const groupName = targetPanel.getAttribute(config.attrs.group) ?? (parent?parent.getAttribute(config.attrs.group):null );
	//trying to push the group into a parent will require  a flag on the children, which doesnt really save us any typing. just an extra backlink.
	//so back burner for now.
        //const groupName = targetPanel.getAttribute(config.attrs.group) ;
	//$FIX - looks like we ended up impllementing toggle group anyway?
        if (lib.utils.isEmpty(groupName)) {
            console.warn(`No valid toggle group found for panel with id "${targetPanelId}"`);
            return;
        }

	
        let allPanels = Array.from( document.querySelectorAll(`[${config.attrs.group}="${groupName}"]:not(${config.parent})`) );
	//you will also have to collect the childrne of the parent.
	if(parent) {
	    let ids = lib.utils.toString(parent.getAttribute(config.children), 1).trim();
	    if(!lib.utils.isEmpty(ids)){
		ids = lib.array.to(ids,/\s+/);
		for (let id of ids) {
		    let n = lib.dom.byId(id);
		    if (n && !allPanels.includes(n)) {
			allPanels.push(n);
		    }
		}
	    } 
		
	}
	
	//const allPanels = document.querySelectorAll(`[${config.attrs.group}="${groupName}"]:not(${config.parent})`);


        allPanels.forEach(panel =>{

            panel.classList.add(config.hidden);
            panel.setAttribute('aria-hidden', 'true');
	    if(targetPanel !== panel)
		runChain(panel, config.attrs.off);
        } );

        targetPanel.classList.remove(config.hidden);
        targetPanel.setAttribute('aria-hidden', 'false');
	runChain(targetPanel, config.attrs.on);
	
	
    }

    function _handleTabs(element,tabList) {
        // Handle 'selected' class toggling
        const siblings = tabList.querySelectorAll(config.trigger);

        let previousSelected = null;
	siblings.forEach(sib => {
            if (sib.classList.contains(config.selected)) {
                previousSelected = sib; // Capture previously selected element
                sib.classList.remove(config.selected);
                sib.setAttribute('aria-selected', 'false');
            }
        });

        // Ensure we're only running 'data-un-toggle' if the previously selected element is different
        //I'm not sure I like this. maybe I want to re run it? add a config for it later. if you click it again, then it can serve as a defacto refresh button, which I like
        //$fixup
        //if (previousSelected && previousSelected !== element) {
        if (previousSelected) {
            if (config.allow_rerun_off || previousSelected !== element )
		runChain(previousSelected, config.attrs.off);
        }
	
	//always runs.
        // Now apply the 'selected' class to the new element
        element.classList.add(config.selected);
        element.setAttribute('aria-selected', 'true');

        if (config.allow_rerun_on || previousSelected !== element )
            runChain(element, config.attrs.on);

    }
    
    function initializeToggleListeners() {
        const toggleItems = document.querySelectorAll(config.trigger); // Updated selector
        //const toggleItems = document.querySelectorAll('[role=tab]'); // Updated selector
        //console.error('starting toggle listeners');

        toggleItems.forEach((item) => {
            // Avoid adding duplicate event listeners
            if (!item.hasAttribute(config.attrs.listener)) {

                // Listener for tab visibility toggling (now includes business logic as well)
                item.addEventListener("click", function () {
                    toggleGroupVisibility(this); // Handle UI toggling and business logic
                });

                // Mark the element to prevent duplicate listeners
                item.setAttribute(config.attrs.listener, 'true');
            }
        });
    }
    function initDelagator(){
	if (!lib.hash.get(lib,'site.delagator') )
            return console.warn('lib.site.delagator not found, event delagation for tabs boxes not set');
	
	lib.site.delagator.set("click", config.trigger,  function () {
            toggleGroupVisibility(this); // Handle UI toggling and business logic
        });

    }
    // Check if DOM is already loaded or wait for 'DOMContentLoaded'
    if (document.readyState === 'loading') {
        //document.addEventListener("DOMContentLoaded", initializeToggleListeners);
	document.addEventListener("DOMContentLoaded", initDelagator);
    } else {
        //initializeToggleListeners();
	initDelagator();
    }
        defaultConfig();
    var disp = {
        defaultConfig: defaultConfig,
	init: initializeToggleListeners,
        getConfig: getConfig,
        setConfig: setConfig
    };
    return disp;
})(lib) );

lib.hash.set(lib,'site.toaster', (function(lib){
    let tconfig = {};
    console.error("running toaster config");
    function getConfig(){
	return tconfig;
    }

    function defaultConfig(){
	tconfig = {
	    hidden: 'd-hidden',
	    setup: true,
	    alertClasses : /^alert\-/,
	    groupSelector: "[role=group]",
	    alertGroup: 'data-alert-group' ,
	    alertSelector : '.alert',
	    zIndex : 'data-z-index'
	};
	return tconfig;
    }
    function setConfig(conf) {
	for (k in conf)
	    lib.hash.set(tconfig, k, conf[k]);
    }
    function set(e,text=undefined, type=undefined){
	let group, alert,section,showHide,subAlert;
	let alertGroupSelector, alertGroup;
	let config =  tconfig;
	
	group = e.closest(config.groupSelector);
	if(!group)
	    return console.error('element is not part of a group.',e,config.groupSelector);

	alert = group.querySelector(config.alertSelector);
	if(!alert)
	    return console.warn('no alert found in group',group);

	//subAlert = alert.querySelector(config.alertSelector);
	if (config.alertGroup)
	    alertGroupSelector =  lib.dom.get(alert,config.alertGroup);
	
	//console.error(alertGroupSelector);
	
	if(alertGroupSelector){
	    alertGroup = alert.closest(alertGroupSelector);
	    if (!alertGroup)
		return console.error('alert group sepecified but not found', alertGroupSelector);
	    showHide = alertGroup;
	}else {
	    showHide = alert;
	}
	//console.error('asasdad',alert,text);
	//alert.textContent = text;
	alert.innerHTML = text;

	if (type) {
            //alert.classList.remove(lib.array.to(alertClasses,/\s+/));
            let list = lib.args.slice(alert.classList);
            for(item of list){
                if (item.match(config.alertClasses))
                    alert.classList.remove(item);
            }
            alert.classList.add(type);
        }

	if (!text){
	    showHide.classList.add(config.hidden);
	}else {
	    showHide.classList.remove(config.hidden);
	    zIndex = alertGroup?
		lib.dom.get(alertGroup,config.zIndex):
		lib.dom.get(alert,config.zIndex);
	    //console.error(`zindex = ${zIndex}`,showHide);
	    if(zIndex)
		showHide.style['z-index'] = zIndex;
	    
	}
	
	//alert.classList.remove(config.hidden);
    }
    
    defaultConfig();
    var disp = {
	defaultConfig: defaultConfig,
	set : set,
	getConfig: getConfig,
	setConfig: setConfig
    };
    return disp;

})(lib) );
    

lib.hash.set(lib,'site.at.v098',  (function(lib){

    function throwError(ws,r){
	let msg = `deliberately throwing an error in the load chain at stage ${ws.item.stage}!`;
	ws.obj.log('userdefined', ws.item.name, msg);
	console.log(msg);
	return 0;
    }

    function catchError (ws,r){
	let msg = `caught an error at ${ws.item.stage}`;
	ws.obj.log('error', ws.item.name, msg);
	console.log(msg);
	return 1;
    }

    function dump(ws,r,args){
	let buffer = ws.item.buffer;
	console.log(arguments);
	if (lib.utils.baseType(buffer,'object' ) && (lib.hash.is(buffer) || lib.array.is(buffer) ) ){
	    console.log('buffer' , JSON.parse(JSON.stringify(buffer)));
	}else {
	    console.log('buffer', buffer);
	}
	console.log(args);
	return 1;
	
    }
    
    function responseAlert(ws,r,args){
	let text="", type="success";
	console.log('setting closest Alert' ,ws,args);


	if (['null','clear','false'].includes(args[0]) ){
	    setAlert(ws.item.e,null);
	    return true;
	};

	let buffer= args[0]=='buffer'?
	    ws.item.buffer: lib.hash.get(r,'jsonData');

	//replace r.jsonData with buffer
	console.log('buffer is ',buffer);
	let rv=0;


	    
	
	if(lib.hash.get(buffer, "status") == 1){
	    text = lib.hash.get(buffer,"comment") || "OK";
	    rv = 1;
	}else {
	    if (buffer){
		text = lib.hash.get(buffer,"comment") || "error :something went wrong.", "danger";
	    }else{
		text="invalid server response";
	    }
            type ="danger";
	}
	lib.hash.set(window,'assets.ws',ws);
	setAlert(ws.item.e,text,type);
	console.log('returning '+rv);
	return rv;
    }
    
    function customAlert(ws,r,args){
	let f1,f2,text,type;
	[f1,f2] = args;
	console.log('in custom alert',f1,f2);

	//this lets us use the data set, and in particular configuration variables.

	let ev = ws.obj.evalTarget(ws.item, f1);
	//console.log('CUSTOM ALERT', f1,ev);
	text = ev?ev: ws.item.e.getAttribute('data-'+f1);

	type= ws.item.e.getAttribute('data-'+f2) || "success";
	setAlert(ws.item.e, text,type);
	return 1;
    }
    function customToggle(ws,r,args){
	let list = document.querySelectorAll(args[0]);
	for (let e of list){
	    e.classList.toggle(args[1]);
	}
	return 1;
	
    }
    function customAddClass(ws,r,args){

	let list = document.querySelectorAll(args[0]);
	for (let e of list){
	    e.classList.add(args[1]);
	}
	return 1;
	
    }
    function customRemoveClass(ws,r,args){

	let list = document.querySelectorAll(args[0]);
	for (let e of list){
	    e.classList.remove(args[1]);
	}
	return 1;
	
    }
    /*
      refresh page. add in later the ability to exclude /include from qs
     */
    function customReload(ws,r, args){
	//if(lib.hash.get(r.jsonData, "status") == 0)return;
	console.log('in custom reload');
	//return 1;
	location.reload();
	/*
	url = document.location.protocol+"//"+document.location.hostname+document.location.pathname;
	
	var match,
            pl     = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query  = window.location.search.substring(1);
	
	let urlParams = {};
	while (match = search.exec(query))
	    urlParams[decode(match[1])] = decode(match[2]);

	if(
	
	id = $(form.form).find('[name=id]');
	if (id.length)id = id[0].value;
	document.location= url+"?id="+id;

	*/
 }
    
    function onSubmitAlert(ws){
	lib.hash.set(window,'assets.ws',ws);
	let text = ws.form.form.getAttribute('data-on-submit-text');
	let type= ws.form.form.getAttribute('data-on-submit-type');
	setAlert(ws.form.form, text,type);
	return 1;
    }
    
    //https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dataset
    function responseToggleClass(ws,r){
	if(lib.hash.get(r.jsonData, "status") == 0)return;
	if (!lib.dom.isDom(ws.e) || typeof(ws.e.value) =='undefined' )return 0;
	[target,toggle] = lib.array.to(lib.hash.get(ws,'form.form.dataset.responseToggleClass'),/\s+/);
	console.log(`${target} / ${toggle}`);
	if(target && toggle){
	    target.classList.toggle(toggle);
	    //$(target).toggleClass(toggle);
	    //$('.button-privacy').toggleClass('d-none');
	    return 1;
	}else return 0;
    }

    function responseJSON(ws,r,args){
	let fName = "responseJSON";
	//console.log('parsing json',ws,r);
	let buffer = ws.item.buffer || undefined;
	ws.obj.log(fName,ws.item.name,ws, buffer, args);	

	ws.obj.log(fName, ws.item.name, 'buffer is ',buffer);
	if (!buffer){
	    ws.obj.log(fName, ws.item.name, 'buffer is undefined');
	    return 0;
	}
	if (typeof buffer =='object'){
	    ws.obj.log(fName, ws.item.name, 'buffer already an object');
	}else {

	    try{
		buffer = JSON.parse(buffer);
		//console.log('parsed json', buffer);
		
	    }catch{
		console.log('error decoding json from ',buffer);
	    }
	}
	
	if (buffer){
	    if(args[0]){
		buffer = lib.hash.get(buffer,args[0]);
		ws.obj.log(fName, ws.item.name,`traversing buffer (${args[0]}) `);

	    }
            ws.item.buffer= buffer;
	    ws.obj.log(fName, ws.item.name, 'buffer is now', buffer);
	    
            return 1;
	}
	console.log('no buffer');
	return 0;
    }

    function triggerClick(ws,r,args){
	console.log('caught click',ws);
	target = document.querySelector(args[0]) || ws.item.e;
	if (lib.dom.is(target)){
	    target.click();
	    //ws.item.e.click();
	    return 1;
	}
	return 0;
    }

    function bufferErrorUnless(ws,r,args){
	let buffer =  ws.item.buffer;
	let val = lib.hash.get(buffer,args[0]);
	console.log(`value ${args[0]} is ${val}`,arguments);
	return  lib.hash.get(buffer, args[0])?1:0;
    }
    
    aa = undefined;
    //traverses the buffer if its a hash. later array. errors on string
    function bufferTraverse(ws,r,args){
	let fName = "bufferTraverse";
	let data=ws.item.buffer,target=args[0];
	ws.obj.log(fName,ws.item.name,ws, data, args);	
	//console.log('TRAVERSE ',data,target);
	aa = data;
	if (!lib.hash.is(data)){
	    console.log('buffer is not a hash',data);
	    return 0;
	}
	data = lib.hash.get(data,target);
	ws.item.buffer=data;
	return 1;
    }

    
    
    function bufferListData(ws,r,args){
	
	let target,template,data,maxSubs=10 ;
	data = ws.item.buffer;
	//console.log("LOADING LIST DATA", arguments,"buffer:",data);
	//let [tSelect,tplTarget] = args[0].split(/\:/,2);

	target = lib.dom.getElement(args[0]);
	//target = lib.dom.byId(args[0]);
	//template = lib.dom.byId(args[1]);
	template = document.getElementsByClassName(args[1])[0];
	if (!target)return console.log(`target ${target} not found`);
	if (!template)return console.log(`template ${template} not found`);

	if(!lib.utils.toString(args[2],1).toLowerCase().match('append'))target.innerHTML="";
	let env = {i:-1};
	//let atBottom = atScrollBottom(target);
	for (row of data || []){
	    env.i++;
            //for (item of lib.hash.get(data,'data') || []){
            let clone = template.cloneNode(1);
            target.appendChild(clone);
            let nodeList = clone.querySelectorAll('[data-dst],[data-dst0]');
            //console.log(row);
	    let custom = {
		"row": (loc) =>{
		    //console.log(row,loc);
		    return{
			src:row,
			prop:loc
		    };
		},
		"env": (loc) =>{
		    return{
			src:env,
			prop:loc
		    };
		}
	    };
	    let scheme = (target)=>{
		//handles non interpolated data.
		let [type,loc] = target.split(/:/,2); 
		if(!loc)return row[type];
		//console.log('>>trying interpScheme on ',ws,target,custom);
		return ws.obj.interpScheme(ws,r,custom)(target);
	    };
	    transformElement(clone,scheme,{debug:0});
	    
	}
	/*
	  //$$fixup enable internally or later after config string
	if(atBottom){
	    target.scrollTop =target.scrollHeight;
	    console.log('scrolled to bottom');
	    }
	    */
	return 1;
	

    }
    function atScrollBottom(target){
	target = lib.dom.getElement(target);
	let fuzzRange = 10;
	if (!target)return console.log(`target ${target} not found`);
	let scrollDiff = target.scrollHeight - target.scrollTop;
	//console.log(`>>ATSB ${scrollDiff} :: ${target.clientHeight}`);
	return (scrollDiff > (fuzzRange+target.clientHeight)?0:1);
	
    }


    //example map
    /*
    [
	{  src:'foo',                dst:'textContent' },
	{  src:'bar${foo}',          dst:'textContent', type:'tpl' },
	{  src:"${foo}?'abc':'def'", dst:"textContent", type:'tpleval' },
	{  src: '[${a},${b}]',          dst:'textContent', type:'func' ,func:'somefunc in string or literal, or a anon func' },
    ]*/

    function transformElement (el,scheme,opts= {}){
	opts = lib.hash.to(opts,"max_subs");
	let dataMap = opts['map'];
	if(!lib.dom.is(el))return console.log(`element ${el} is not dom`);
	
        let nodeList = dataMap?
	    el.querySelectorAll('[data-dst],[data-dst0],[data-map-key]'):
	    el.querySelectorAll('[data-dst],[data-dst0]');
	nodeList = lib.args.slice(nodeList);
	nodeList.unshift(el);
	if(opts.debug>0){
	    console.log('nodeList' , nodeList);
            console.log('scheme',scheme);
	    console.log('opts',opts);
	}
	let counter = 0;

	let keyList = opts.keys?lib.array.to(opts.keys,/\s+/):false;
	let allow = true;
	if (keyList && keyList.length){
	    console.error(`keys are `, keyList);
	    allow = {};
	    for(let k of keyList)
		allow[k] = true;
	}

	
        for (node of nodeList){
	    if(opts.debug>1)console.log('node',node);
	    //continue;
	    //apply any number of keys you want.
	    let mapList = node.getAttribute('data-map-key');
	    mapList = lib.array.to(mapList, /\s+/ );
	    for (let mapTarget of mapList) {
		if(!lib.utils.isEmpty(mapTarget)){
		    
		    let mapItem = lib.hash.get(dataMap, mapTarget);
		    if (lib.array.is(mapItem) || lib.hash.is(mapItem)) {
			if ( allow==false || (lib.hash.is(allow) && allow[mapTarget] !=true ) ){
			    //console.error(`skipping ${mapTarget} ${allow[mapTarget]}`);
			    continue;
			}
			
			mapItem = lib.array.to(mapItem);
			MAP_LOOP: for (let item of mapItem){
			    let [src,dst,type,func,append,validate] = lib.hash.expand(item, "src dst type func append validate");

			    if(validate)
			    {
				let vScheme;
				if (lib.hash.is(scheme)){
				    let env = Object.keys(scheme).length==0?window:scheme;
				    vScheme = function (v){return lib.hash.get(env,v);	  }
				}else if(!lib.func.get(scheme)){
				    vScheme = function (val) {return eval(val);							     };
				}
				window.vScheme = vScheme;
				const list = lib.array.to(validate,/\s+/);
				for (const item of list)
				{
				    try {
					if([null,undefined].includes(vScheme(item) ) )
					    continue MAP_LOOP;
				    }catch(err){
					continue MAP_LOOP;
				    }
				}
			    }
			    //console.warn(`type is ${type}`);
			    let iVal =
				type =='func'?lib.utils.getFunction(func,true)(scheme, src?interpVars(src,scheme,1):null,node):
				type =='eval'?interpVars(src,undefined,1):
				type =='tpleval'?interpVars(src,scheme,1):
				type=='tpl'? interpVars(src,scheme):
				lib.func.get(scheme)?scheme(src):
				lib.hash.get(scheme,src);
			    //console.warn(`IVAL for map interp(${type} | ${src} ) ${iVal} `,scheme);
			    if(opts.debug>1)console.log(`ival is ${iVal}`);
			    //if(!iVal)continue;
			    //iVal = interpVars(tpl,iVal);
			    if(append)iVal = lib.dom.get(node,dst)+iVal;
			    if(opts.debug>1)console.log (`MAP set ${dst} to ${iVal}`);
			    if(dst)
				lib.dom.set(node, dst, iVal);
			}
		    }
		}
	    }
	    
	    for (let i =0; i < (opts.max_subs||10);i++){
		let iVal =undefined;
		let dst=i?node.getAttribute('data-dst'+i): node.getAttribute('data-dst') ||  node.getAttribute('data-dst0');
		let src=i?node.getAttribute('data-src'+i): node.getAttribute('data-src') ||  node.getAttribute('data-src0');
		let tpl=i?node.getAttribute('data-tpl'+i): node.getAttribute('data-tpl') ||  node.getAttribute('data-tpl0');
		let tplev=i?node.getAttribute('data-tpl-eval'+i): node.getAttribute('data-tpl-eval') ||  node.getAttribute('data-tpl-eval0');
		let ev=i?node.getAttribute('data-eval'+i): node.getAttribute('data-eval') ||  node.getAttribute('data-eval0');
		let append= explicitTrue(node.getAttribute('data-dst-append') );
		if (!(tpl || src || ev ||tplev))continue;
		if(opts.debug>1)console.log(`interping on ev=${ev}, tplev=${tplev}, tpl=${tpl}, src=${src}`);
		iVal = ev?interpVars(ev,undefined,1):
		    tplev?interpVars(tplev,scheme,1):
		    tpl?interpVars(tpl,scheme):
		    lib.func.get(scheme)?scheme(src):
		    lib.hash.get(scheme,src);

		//lib.hash.get(scheme,src);
		if(opts.debug>1)console.log(`ival is ${iVal}`);
		//if(!iVal)continue;
		//iVal = interpVars(tpl,iVal);
		if(append)iVal = lib.dom.get(node,dst)+iVal;
		if(opts.debug>1)console.log (`set ${dst} to ${iVal}`);
		lib.dom.set(node, dst, iVal);
	    }
	    counter++;
	    
	}
	if(opts.debug>0)console.log(`set ${counter} nodes`);
	
    }

    
    function hacksBackLink(ws,r,args){
	let ref = document.referrer;
	console.log('backlink hackery');
	let reveal = function(e){
	    if (!history.length)return 1;
	    e.classList.remove('d-none');
	    lib.dom.set(e,'onclick', "history.go(-1);return false");
	    //e.onclick = "history.go(-1);return false";
	    return 1;
	};
	if (!args[0] )return reveal(ws.item.e);

	if (!ref)return 1;
	let regex = new RegExp(args[0]);
	
	if ( regex.exec(ref))reveal(ws.item.e);
	return 1;
    }

    //$fixup unfinished
    function domFind(ws,r,args){
	let target = ws.e || ws.item.e;
	let f = undefined;

	f = target.querySelector(args[0]);
	return 1;
    }
    function domSet(ws,r,args){
	console.log('dom Set' ,args);
	if(!args[0] )return 0;
	if(!lib.dom.is(args[0])){
	    if (args[0].match(/this/i))args[0]=ws.e;
	    else if (args[0].match(/parent/i))args[0]=ws.item.e;
	}
	target = lib.dom.get(args[0]);
	if(!target || !args[1]) return 0;
	lib.dom.set(target,args[1],args[2]);
	return 1;
    }


 //args: callback, target
 function observe(ws,r,args){
     let options = {
	 root: ws.item.e
     };
     let target = args[1]?lib.dom.getElement(args[1]):undefined;
     let userFunc = lib.func.get(args[0]);
     if(!target || !userFunc){
	 console.log('no target or callback');
	 return 0;
     }
     //let callback = lib.func.prepend(userFunc, ws,args);
     let callback= (ws,userFunc,args) =>{
	 return function (entries,obs){
	     
	     let rv = userFunc(ws,args,...arguments);
	     if (rv==1){
		 console.log('DISCONNECTING OBSERVER');
		 obs.disconnect();
	     }
	 }
     };
     
     observer = new IntersectionObserver(callback(ws,userFunc,args), options);
     observer.observe(target);
     return 1;
 }
 
    
  var disp = {
      response: {
	  alert:responseAlert,
	  json:responseJSON
      },
      submit:{
	  alert:onSubmitAlert
      },
      test:{
	  'throw':throwError,
	  'catch':catchError,
	  dump: dump
      },
      custom: {
	  alert:customAlert,
	  toggle:customToggle,
	  addClass:customAddClass,
	  removeClass:customRemoveClass,
	  reload:customReload
      },
      hacks: {
	  backLink:hacksBackLink
      },
      trigger: {
	  click:triggerClick
      },
      buffer: {
	  traverse : bufferTraverse,
	  listData: bufferListData,
	  errorUnless: bufferErrorUnless
	  
      },
      transform:{
	  element : transformElement

      },

      dom:{
	  find:domFind,
	  set: domSet
      },
      intersect:{
	  observe:observe
      }
  };
    return disp;
})(lib) 

	    );

	    
