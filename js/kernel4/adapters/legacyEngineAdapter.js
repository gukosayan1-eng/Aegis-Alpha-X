import { BaseEngine } from "../contracts/baseEngine.js";

export class LegacyEngineAdapter extends BaseEngine {
  constructor({ id, name, legacyEngine, analyzeMethod = "analyze", eventBus, state, logger }) {
    super({ id, name, eventBus, state, logger });
    this.legacyEngine = legacyEngine;
    this.analyzeMethod = analyzeMethod;
  }

  async update(context = {}) {
    if (!this.legacyEngine) {
      return this.standardResult({
        confidence: 0,
        uncertainty: 100,
        recommendation: "WAIT",
        explanation: "Legacy engine missing."
      });
    }

    const fn = this.legacyEngine[this.analyzeMethod];
    if (typeof fn !== "function") {
      return this.standardResult({
        confidence: 0,
        uncertainty: 100,
        recommendation: "WAIT",
        explanation: `Legacy method ${this.analyzeMethod} not found.`
      });
    }

    const raw = await fn.call(this.legacyEngine, context);
    return this.normalizeResult(raw);
  }
}
