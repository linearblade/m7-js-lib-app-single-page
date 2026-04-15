/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

import makeChain from "./ui/chain.js";
import makeSetAlert from "./ui/setAlert.js";
import makeToaster from "./ui/toaster.js";
import CollapseService from "./ui/service/CollapseService.js";
import TabsService from "./ui/service/TabsService.js";
import DialogService from "./ui/service/DialogService.js";
import ProxyService from "./ui/service/ProxyService.js";
import NavbarService from "./ui/service/NavbarService.js";

const MOD = "[m7-js-lib-ui]";
const SERVICE_EVENT_DELEGATOR = "primitive.dom.eventdelegator";
const SERVICE_CHANGE_OBSERVER = "primitive.dom.changeobserver";

const UI_SERVICES = [
  { id: "ui.collapse", className: "CollapseService", key: "collapse", ctor: CollapseService },
  { id: "ui.tabs", className: "TabsService", key: "tabs", ctor: TabsService },
  { id: "ui.dialog", className: "DialogService", key: "dialog", ctor: DialogService },
  { id: "ui.proxy", className: "ProxyService", key: "proxy", ctor: ProxyService },
  { id: "ui.navbar", className: "NavbarService", key: "navbar", ctor: NavbarService },
];

export function install(lib, opts = {}) {
  requireDeps(lib, "install(lib)");
  opts = lib.hash.to(opts);

  const [eventDelegator] = lib.require.service(SERVICE_EVENT_DELEGATOR, {
    mod: `${MOD} install(lib)`,
  });

  // Convenience option behavior:
  // - true/undefined => start delegator
  // - explicit false-intent => do not start
  if (!lib.bool.no(opts.installEventDelegator)) {
    eventDelegator.start();
  }

  if (opts.installChangeObserver === true) {
    const [changeObserver] = lib.require.service(SERVICE_CHANGE_OBSERVER, {
      mod: `${MOD} install(lib)`,
    });
    changeObserver.start();
  }

  const namespace = installUiModules(lib, opts);
  return {
    namespace,
    services: UI_SERVICES.map((spec) => spec.id),
  };
}

export default install;

function requireDeps(lib, label) {
  if (!lib || typeof lib !== "object") {
    throw new Error(`${MOD} ${label} requires an m7-lib instance object.`);
  }
  if (
    !lib.require ||
    typeof lib.require.all !== "function" ||
    typeof lib.require.service !== "function"
  ) {
    throw new Error(`${MOD} ${label} requires lib.require.all and lib.require.service.`);
  }

  lib.require.all("hash.get hash.set hash.to _env.root.document bool.no service.set service.get", {
    mod: `${MOD} ${label}`,
  });
}

function installUiModules(lib, opts) {
  const chain = makeChain(lib);
  lib.hash.set(lib, "ui.chain", chain);

  const setAlertNs = makeSetAlert(lib);
  const setAlert = lib.hash.get(setAlertNs, "design.v1.setAlert");
  lib.hash.set(lib, "ui.design.v1.setAlert", setAlert);

  lib.hash.set(lib, "ui.toaster", makeToaster(lib));

  installUiServiceClasses(lib);
  installUiServiceInstances(lib, opts);

  return lib.hash.get(lib, "ui");
}

function installUiServiceClasses(lib) {
  lib.hash.set(lib, "ui.service.CollapseService", CollapseService);
  lib.hash.set(lib, "ui.service.TabsService", TabsService);
  lib.hash.set(lib, "ui.service.DialogService", DialogService);
  lib.hash.set(lib, "ui.service.ProxyService", ProxyService);
  lib.hash.set(lib, "ui.service.NavbarService", NavbarService);
}

function installUiServiceInstances(lib, opts) {
  const serviceOpts = lib.hash.to(lib.hash.get(opts, "services"));
  const shouldStart = !lib.bool.no(lib.hash.get(opts, "startUiServices"));

  for (const spec of UI_SERVICES) {
    const ctorOpts = lib.hash.to(lib.hash.get(serviceOpts, spec.key));
    const instance = new spec.ctor(lib, ctorOpts);
    lib.service.set(spec.id, instance);

    if (shouldStart) {
      instance.start();
    }
  }
}
