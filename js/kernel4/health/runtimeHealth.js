export class RuntimeHealth4 {
  constructor({ engineManager, eventBus }) {
    this.engineManager = engineManager;
    this.eventBus = eventBus;
  }

  snapshot() {
    const engines = this.engineManager.health();
    const degraded = engines.filter(e => e.status === "DEGRADED").length;
    const running = engines.filter(e => e.status === "RUNNING").length;

    return {
      timestamp: Date.now(),
      status: degraded ? "DEGRADED" : "HEALTHY",
      engineCount: engines.length,
      running,
      degraded,
      engines
    };
  }

  publish() {
    const health = this.snapshot();
    this.eventBus.publish("kernel.health", { source: "runtimeHealth4", payload: health });
    return health;
  }
}
