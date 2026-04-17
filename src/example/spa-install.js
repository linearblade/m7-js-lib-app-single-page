const MOD = "[example.spa-install]";
const SPA_SERVICE_ID = "app.singlepageapp";

function resolveSpa() {
    if (typeof window === "undefined") {
        return null;
    }

    const lib = window.lib && typeof window.lib === "object"
        ? window.lib
        : null;

    if (lib && lib.service && typeof lib.service.get === "function") {
        return lib.service.get(SPA_SERVICE_ID) || lib.spa || window.spa || null;
    }

    return window.spa || null;
}

function prepareSpa() {
    const spa = resolveSpa();
    if (!spa) {
        return null;
    }

    window.spa = spa;
    window.spaLib = window.lib || window.spaLib || null;
    window.SPA_SERVICE_ID = SPA_SERVICE_ID;
    return spa;
}

const spa = prepareSpa();

if (typeof window !== "undefined" && !spa && typeof window.addEventListener === "function") {
    window.addEventListener("load", () => {
        const delayedSpa = prepareSpa();
        if (!delayedSpa) {
            console.warn(`${MOD} missing SPA service '${SPA_SERVICE_ID}' after load`);
        }
    }, { once: true });
}

export { SPA_SERVICE_ID };
export default spa;
