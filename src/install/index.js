import { install } from "./install.js";
import { configure as configureBasic } from "./basic.js";

function basic(lib, opts = {}) {
    const result = install(lib, opts);
    const instance = configureBasic(result.instance, opts);

    return Object.assign({}, result, {
        instance,
        configured: true,
    });
}

export { install, basic };
export default {
    install,
    basic,
};
