import {
  install as installActiveTags,
  SERVICE_ID,
  VERSION,
} from "../vendor/activeTags/activeTags.standalone.v1.0.min.js";

const MOD = "[activeTags-bootstrap]";
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

  window.AT = AT;
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
      console.error(`${MOD} failed to load page script '${normalized}':`, error);
    }
  }
}

boot().catch((error) => {
  console.error(`${MOD} failed to start:`, error);
});
