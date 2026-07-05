import { Kernel4 } from "./runtime/kernel4.js";

export function createKernel4Bridge({ legacyState = {}, intervalMs = 1000 } = {}) {
  const kernel4 = new Kernel4({ initialState: legacyState, intervalMs });

  window.AegisKernel4 = kernel4;

  kernel4.eventBus.subscribe("*", (event) => {
    window.dispatchEvent(new CustomEvent("aegis:kernel4:event", { detail: event }));
  });

  return kernel4;
}
