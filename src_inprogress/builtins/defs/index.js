import { defineBuiltin } from "./defineBuiltin.js";
import navClickDef, { navClickBuiltin } from "./navClick.js";

const builtinDefs = Object.freeze([
    navClickDef,
]);

const builtIns = builtinDefs;

export { builtinDefs, builtIns, defineBuiltin, navClickBuiltin, navClickDef };
export default builtinDefs;
