import detail     from "./detail.js";          // cleaned
import events     from "./events.js";          // cleaned
import helpers    from "./helpers.js";         // cleaned
import root       from "./root.js";            // cleaned
import tree       from "./collapsibleTree.js"; // cleaned
import context    from "./context.js";         // cleaned
import dom        from "./dom.js";             // cleaned
import finder     from "./finder.js";          // cleaned
import path       from "./path.js";            // cleaned
import toggle     from "./toggle.js";          // cleaned
import class_inspector     from "./ClassInspectorConsole.js";  // cleaned

let TreeInspector = null;

//leaving it in the main file b/c dont want to hide it
function installLibs(ctx = {}) {
    if (!TreeInspector) throw new Error("[install] TreeInspector not installed");
    if (!ctx || typeof ctx !== "object") throw new Error("[install] ctx must be an object");

    ctx.lib ||= {};
    ctx.TreeInspector = TreeInspector;
    Object.assign(ctx.lib, {
	detail,
	events,
	helpers,
	root,
	tree,
	context,
	dom,
	finder,
	path,
	toggle,
	class_inspector
    });

    return ctx;
}


function install(cls) {
    TreeInspector = cls;
}

function openConsole(
    target,
    {
	mount = document.body,
	title = "m7 Tree Console",
	maxDepth = 25,
	rootScope = globalThis,
	eventScope = null,
    } = {}
) {
    if (!eventScope) eventScope = rootScope;

    const ctx = installLibs({});
    if(!target) target =globalThis
    ctx.lib.context.build(ctx, {
	target,
	mount,
	title,
	maxDepth,
	rootScope,
	eventScope,
    });

    ctx.lib.events.bindConsoleUI(ctx);
    ctx.lib.tree.renderCollapsibleTree(ctx);

    return { inspector: ctx.inspector, el: ctx.el };
}

export {install,openConsole};
export default {install,console:openConsole};
