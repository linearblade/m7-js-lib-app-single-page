/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import {
  VERSION,
  basic as basicSpa,
  initLib as initSpaLib,
  install as installSpa,
  installServices as installSpaServices,
  lib as standaloneLib,
} from "../vendor/singlePageApp/singlePageApp.standalone.v1.0.0.min.js";

const MOD = "[standalone-bootstrap]";
const SPA_SERVICE_ID = "app.singlepageapp";
const EXAMPLE_LINK_SELECTOR = 'a[spa-type="nav-click"][href]';
const MAX_TICKER_ITEMS = 12;

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

function resolveSpa(lib, result) {
  if (result && result.instance) {
    return result.instance;
  }

  if (lib && lib.service && typeof lib.service.get === "function") {
    return lib.service.get(SPA_SERVICE_ID) || lib.spa || null;
  }

  return lib && lib.spa ? lib.spa : null;
}

function createTickerReporter() {
  return function reportStatus(message) {
    const track = typeof document !== "undefined"
      ? document.querySelector("#ticker")
      : null;
    if (!track) {
      return;
    }

    const text = message == null ? "" : String(message).trim();
    if (!text) {
      return;
    }

    const placeholder = track.querySelector(".ticker-item.is-static");
    if (placeholder) {
      placeholder.remove();
    }

    const item = document.createElement("span");
    item.className = "ticker-item";

    const stamp = document.createElement("time");
    stamp.setAttribute("datetime", new Date().toISOString());
    stamp.textContent = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const body = document.createElement("span");
    body.textContent = text;

    item.appendChild(stamp);
    item.appendChild(body);
    track.appendChild(item);

    while (track.children.length > MAX_TICKER_ITEMS) {
      track.removeChild(track.firstElementChild);
    }

    track.scrollTo({
      left: track.scrollWidth,
      behavior: "smooth",
    });
  };
}

async function boot() {
  const m7Context = window.__M7_CONTEXT__ && typeof window.__M7_CONTEXT__ === "object" ? window.__M7_CONTEXT__ : {};
  const clientContext =
    m7Context.client_context && typeof m7Context.client_context === "object"
      ? m7Context.client_context
      : {};

  const reportTickerStatus = createTickerReporter();
  const result = basicSpa({
    builtins: false,
    linkSelector: EXAMPLE_LINK_SELECTOR,
    sourceSelector: "#main",
    targetSelector: "#main",
    trackCurrent: true,
    status: reportTickerStatus,
  });

  const lib = standaloneLib;
  const spa = resolveSpa(lib, result);
  if (!spa) {
    throw new Error(`missing SPA service '${SPA_SERVICE_ID}' after standalone install.`);
  }

  window.lib = lib;
  window.spa = spa;
  window.spaLib = lib;
  window.SPA_SERVICE_ID = SPA_SERVICE_ID;
  window.SPA_VERSION = VERSION;
  window.basicSpa = basicSpa;
  window.installSpa = installSpa;
  window.installSpaServices = installSpaServices;
  window.initSpaLib = initSpaLib;
  window.singlePageAppLib = standaloneLib;
  window.reportSpaStatus = reportTickerStatus;

  reportTickerStatus("Standalone bundle ready.");

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
