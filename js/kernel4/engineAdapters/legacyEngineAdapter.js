import { BaseEngine } from "../contracts/baseEngine.js";

export class LegacyEngineAdapter extends BaseEngine {
  constructor({ id, name, legacyEngine, methods = ["analyze", "evaluate", "build", "decide"], eventBus, state, logger } = {}) {
    super({ id, name, eventBus, state, logger });
    this.legacyEngine = legacyEngine;
    this.methods = methods;
  }

  async update(context = {}) {
    if (!this.legacyEngine) {
      return this.result({ uncertainty:100, recommendation:"WAIT", explanation:`${this.name} legacy engine missing.` });
    }

    const method = this.methods.find(m => typeof this.legacyEngine[m] === "function");
    if (!method) {
      return this.result({ uncertainty:100, recommendation:"WAIT", explanation:`${this.name} has no compatible method.` });
    }

    const raw = await this.legacyEngine[method](context);
    return this.normalize(raw);
  }
}
