/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {

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
}

export default make;
