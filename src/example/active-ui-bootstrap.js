import {
  install as installActiveTags,
  SERVICE_ID,
  VERSION,
} from "../vendor/activeTags/activeTags.standalone.v1.0.min.js";
import installUI from "./vendor/m7-js-lib-ui/src/install.js";
import installTree from "./vendor/m7-js-lib-tree/src/install.js";

const SPA_SERVICE_ID = "app.singlepageapp";
const EXAMPLE_LINK_SELECTOR = 'a[spa-type="nav-click"][href]';

function normalizePageScript(script) {
  const value = typeof script === "string" ? script.trim() : "";
  if (!value) {
    return null;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) || value.startsWith("/")) {
    return value;
  }

  const relative = value.replace(/^(\.\.\/|\.\/)+/, "").replace(/^\/+/, "");
  return `/${relative}`;
}

async function boot() {
  const m7Context = window.__M7_CONTEXT__ && typeof window.__M7_CONTEXT__ === "object" ? window.__M7_CONTEXT__ : {};
  const clientContext =
    m7Context.client_context && typeof m7Context.client_context === "object"
      ? m7Context.client_context
      : {};
  const lib = installActiveTags({
    conf: {
      boot: {
        observeDom: true,
        events: true,
        intervals: true,
      },
      job: {
        config: {
          importEnabled: true,
          importPath: ["/js/"],
        },
      },
    },
    spa: {
      builtins: false,
      linkSelector: EXAMPLE_LINK_SELECTOR,
      sourceSelector: "#main",
      targetSelector: "#main",
      statusSelector: "#ticker",
      trackCurrent: true,
    },
  });
  window.lib = lib;
  window.installActiveTags = installActiveTags;

  const AT = lib.service.get(SERVICE_ID);
  if (!AT) {
    throw new Error(`missing ActiveTags service '${SERVICE_ID}'.`);
  }

  const spa = lib.service.get(SPA_SERVICE_ID) || lib.spa || null;
  if (!spa) {
    throw new Error(`missing SPA service '${SPA_SERVICE_ID}' after installActiveTags.`);
  }

  window.spa = spa;
  window.spaLib = lib;
  window.SPA_SERVICE_ID = SPA_SERVICE_ID;

  await AT.start();
  installTree(lib);
  const { namespace: ui } = installUI(lib, {
    installEventDelegator: false,
    installChangeObserver: false,
    startUiServices: true,
    services: {
      navbar: {
        rootSelector: ".navbar",
        triggerAttrs: ["data-nav-trigger", "m7-nav-trigger"],
        dropBehaviorDefault: "right",
        dropBehaviorAttrs: [
          "nav-drop-behavior",
          "data-nav-drop-behavior",
          "m7-nav-drop-behavior",
        ],
        enableTopLevelHoverOpen: true,
      },
    },
  });

  const navbarService = lib.service.get("ui.navbar");
  if (!navbarService) {
    throw new Error("missing ui.navbar service after installUI.");
  }

  const navbarJob = typeof AT.toJob === "function" ? AT.toJob("navbar") : null;
  if (navbarJob && AT.engine && typeof AT.engine.enqueue === "function") {
    const ticket = AT.engine.enqueue(navbarJob, "installNav", {
      inputs: { reason: "startup" },
      meta: { source: "active-ui-bootstrap" },
    });
    if (ticket && typeof AT.engine.drain === "function") {
      await AT.engine.drain({ ticket });
    }
  }

  window.AT = AT;
  window.ui = ui || lib.hash.get(lib, "ui");
  window.navbarService = navbarService;
  window.AT_SERVICE_ID = SERVICE_ID;
  window.AT_VERSION = VERSION;

  const pageScripts = Array.isArray(clientContext.scripts) ? clientContext.scripts : [];
  for (const script of pageScripts) {
    const normalized = normalizePageScript(script);
    if (!normalized) {
      continue;
    }

    try {
      await import(normalized);
    } catch (error) {
      console.error(`[active-ui-bootstrap] failed to load page script '${normalized}':`, error);
    }
  }
}

boot().catch((error) => {
  console.error("[active-ui-bootstrap] failed to start:", error);
});
