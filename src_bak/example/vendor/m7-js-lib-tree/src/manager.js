/*
 * Copyright (c) 2025 m7.org
 * License: MTL-10 (see LICENSE.md)
 */
function install(sys, ctx){
    console.log('installing lib');
    const pkgId = ctx?.pkg?.id;
    if(!pkgId){
	console.warn('no package id found for lib, cannot proceed with install!');
	return;
    }
    
    const lib = bootstrap?.data?.getPackageModule?.(pkgId, 'lib')?.content;
    if (!lib) {
	console.warn('no lib module content found, cannot proceed with install!');
	return;
    }

    // Keep lib attached to package context only; do not leak to globals.
    ctx.lib = lib;
    console.log(sys,ctx);
}

function destroy(sys,ctx){
    console.warn('destroying');
    if (ctx && typeof ctx === "object" && Object.prototype.hasOwnProperty.call(ctx, "lib")) {
	delete ctx.lib;
    }
}
export default {
    install , destroy
    
};
