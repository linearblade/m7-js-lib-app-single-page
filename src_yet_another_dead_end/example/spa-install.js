import spaModule, { install } from "../spa-install.js";

function bootSpa() {
    if (typeof window === "undefined") {
        return null;
    }

    const lib = typeof window !== "undefined" ? window.lib : null;
    if (!lib) {
        console.log("[example.spa-install] window.lib not ready yet");
        return null;
    }

    console.log("[example.spa-install] installing spa");
    const spa = install(lib, { debug: true, statusSelector: "#ticker", trackCurrent: true });
    if (spa && spa.builtins && typeof spa.builtins.setBuiltinEnv === "function") {
        spa.builtins.setBuiltinEnv("spa.nav-click", {
            statusSelector: "#ticker",
        });
        console.log("[example.spa-install] nav-click builtin env set");
    }
    console.log("[example.spa-install] spa installed");
    window.spa = spa;
    bindNativeSpaFallback(spa);
    return spa;
}

const spa = bootSpa();

if (typeof window !== "undefined") {
    window.installSpa = install;
    if (!spa && typeof window.addEventListener === "function") {
        window.addEventListener("load", () => {
            if (!window.spa && window.lib) {
                console.log("[example.spa-install] delayed install");
                window.spa = install(window.lib, { debug: true, statusSelector: "#ticker", trackCurrent: true });
                bindNativeSpaFallback(window.spa);
            }
        }, { once: true });
    }
}

export { install };
export default spaModule;

function bindNativeSpaFallback(spa) {
    if (typeof window === "undefined" || typeof document === "undefined" || !spa) {
        return;
    }

    if (window.__m7SpaNativeFallbackBound) {
        return;
    }

    const handler = async (evt) => {
        if (!evt || evt.__m7SpaHandled) {
            return;
        }

        const anchor = findSpaAnchor(evt.target);
        if (!anchor || !shouldHandleNativeClick(evt, anchor)) {
            return;
        }

        const href = anchor.getAttribute("href") || anchor.href;
        if (!href) {
            return;
        }

        evt.preventDefault();
        evt.__m7SpaHandled = true;

        console.log("[example.spa-install] native spa click", href);

        try {
            await spa.loadPage(href, {
                pushState: true,
                popstateKey: "spa-link",
            });
        } catch (error) {
            console.error("[example.spa-install] native spa click failed:", error);
        }
    };

    document.addEventListener("click", handler, true);
    window.__m7SpaNativeFallbackBound = true;
}

function findSpaAnchor(node) {
    if (!node) {
        return null;
    }

    if (typeof node.closest === "function") {
        return node.closest("a.spa-link[href]");
    }

    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el) {
        if (el.matches && el.matches("a.spa-link[href]")) {
            return el;
        }
        el = el.parentElement;
    }

    return null;
}

function shouldHandleNativeClick(evt, anchor) {
    if (!anchor) {
        return false;
    }

    if (evt && evt.defaultPrevented) {
        return false;
    }

    if (evt && typeof evt.button === "number" && evt.button !== 0) {
        return false;
    }

    if (evt && (evt.metaKey || evt.ctrlKey || evt.shiftKey || evt.altKey)) {
        return false;
    }

    const target = anchor.getAttribute ? anchor.getAttribute("target") : null;
    if (target && target !== "_self") {
        return false;
    }

    if (anchor.hasAttribute && anchor.hasAttribute("download")) {
        return false;
    }

    return true;
}
