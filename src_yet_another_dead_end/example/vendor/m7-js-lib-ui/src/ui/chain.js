/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {
    //I've left run chain here b/c after thinking about this, your not really gonna use this toolset outside of the dom anyhow!
    //its primary purpose is to inline functions without having to resort to excess wrapper funcs and such, leading to lots of bounce around on pages
    //eventually we can complete the workflow project and integrate this with, activeTags , and our generalized workflow tool.
    
    let config = {};
    const interpVars =
        (lib.str && typeof lib.str.interp === "function")
            ? lib.str.interp
            : function (value) { return value; };

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
        for (const k in conf)
            lib.hash.set(config, k, conf[k]);
    }

    function resolveRoot() {
        const envRoot = lib.hash.get(lib, "_env.root");
        if (envRoot) return envRoot;
        if (typeof globalThis !== "undefined") return globalThis;
        if (typeof window !== "undefined") return window;
        if (typeof global !== "undefined") return global;
        return {};
    }

    function resolveDocument() {
        const root = resolveRoot();
        if (root && root.document) return root.document;
        return undefined;
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
		    src: resolveRoot(),
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
		const doc = resolveDocument();
		try{
		    result = doc ? doc.querySelector(loc) : undefined;
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
    
}

export default make;
