/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {

    
    function setAlert(e,text=undefined, type=undefined){
	let group, alert;
	if (!lib.dom.is(e)) return;

	type = lib.utils.isEmpty(type) ? undefined : lib.utils.toString(type, 1).toLowerCase();
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

		// Intentional convenience behavior: falsy text hides the alert.
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
			//alert.classList.remove(lib.array.to(alertClasses,/\s+/));
			let list = lib.args.slice(alert.classList);
			for (const item of list){
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

}

export default make;
