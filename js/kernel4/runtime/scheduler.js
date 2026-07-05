export class Scheduler4 {
  constructor({ engineManager, eventBus, logger, intervalMs = 1000 }) {
    this.engineManager = engineManager;
    this.eventBus = eventBus;
    this.logger = logger;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.running = false;
    this.tickCount = 0;
  }

  start(contextFactory = () => ({})) {
    if (this.running) return;
    this.running = true;
    this.timer = setInterval(() => this.tick(contextFactory), this.intervalMs);
    this.logger.info(`Scheduler started at ${this.intervalMs}ms`);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
    this.logger.info("Scheduler stopped");
  }

  async tick(contextFactory = () => ({})) {
    this.tickCount += 1;
    const context = contextFactory();
    this.eventBus.publish("kernel.tick", { source: "scheduler4", payload: { tick: this.tickCount } });

    for (const engine of this.engineManager.list()) {
      if (engine.status !== "RUNNING") continue;
      const result = await engine.safeUpdate(context);
      this.eventBus.publish("engine.result", { source: engine.id, payload: result });
    }
  }
}
