/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {
    let tconfig = {};
    //fixup add config option later for noisy
    //console.error("running toaster config");
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
	conf = lib.hash.to(conf);
	for (const k in conf)
	    lib.hash.set(tconfig, k, conf[k]);
    }
    function set(e,text=undefined, type=undefined,opts=null){
	let group, alert,section,showHide,subAlert;
	let alertGroupSelector, alertGroup;
	let config =  tconfig;
	let setOpts = lib.hash.to(opts,'innerHTML');
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
	// Intentional: opt-in HTML mode for trusted strings only.
	if (setOpts.innerHTML === true) {
	    alert.innerHTML = text == null ? "" : String(text);
	}else {
	    alert.innerText = text == null ? "" : String(text);
	}

	if (type) {
            //alert.classList.remove(lib.array.to(alertClasses,/\s+/));
            let list = lib.args.slice(alert.classList);
            for (const item of list){
                if (item.match(config.alertClasses))
                    alert.classList.remove(item);
            }
            alert.classList.add(type);
        }

	// Intentional legacy behavior: falsy text hides the alert container.
	if (!text){
	    showHide.classList.add(config.hidden);
	}else {
	    showHide.classList.remove(config.hidden);
	    let zIndex = alertGroup?
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

}

export default make;
