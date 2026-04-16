/*
  Boot-time assertions for the single page app.
*/

const MOD = '[app.SinglePageApp.Assert]';
const REQUIRED_DEP_PATHS = Object.freeze([
    'hash',
    'func',
    'str',
]);
const REQUIRED_SERVICE_IDS = Object.freeze([
    'primitive.dom.eventdelegator',
    'app.popstatemanager',
]);

class Assert {

    constructor({lib, controller} = {}){
	this.lib = lib;
	this.controller = controller || null;
	this.asserted = null;
    }

    check(){
	const lib = this.lib;

	if(!lib || typeof lib !== 'object'){
	    throw Error(`${MOD} requires lib.`);
	}

	if(!lib.require || typeof lib.require.all !== 'function' || typeof lib.require.service !== 'function'){
	    throw Error(`${MOD} requires lib.require.all and lib.require.service.`);
	}

	lib.require.all(REQUIRED_DEP_PATHS, {mod:MOD});

	const services = lib.require.service(REQUIRED_SERVICE_IDS, {mod:MOD, returnMap:true});
	const eventDelegator = services['primitive.dom.eventdelegator'];
	const popStateManager = services['app.popstatemanager'];

	if(!eventDelegator){
	    throw Error(`${MOD} requires primitive.dom.eventdelegator.`);
	}

	if(!popStateManager){
	    throw Error(`${MOD} requires app.popstatemanager.`);
	}

	this.asserted = {
	    services,
	    eventDelegator,
	    popStateManager,
	};

	if (this.controller) {
	    this.controller.asserted = this.asserted;
	}

	return this.asserted;
    }
}

export default Assert;
