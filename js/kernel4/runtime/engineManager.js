export class EngineManager4 {
  constructor({ logger, eventBus, state }) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.state = state;
    this.engines = new Map();
  }

  register(engine) {
    if (!engine?.id) throw new Error("Cannot register engine without id");
    if (this.engines.has(engine.id)) throw new Error(`Engine already registered: ${engine.id}`);
    this.engines.set(engine.id, engine);
    this.eventBus.publish("kernel.engine.registered", { source: "kernel4", payload: engine.health() });
    return engine;
  }

  get(id) { return this.engines.get(id); }
  list() { return [...this.engines.values()]; }

  async initializeAll() {
    for (const engine of this.engines.values()) {
      await engine.initialize();
    }
  }

  async startAll() {
    for (const engine of this.engines.values()) {
      await engine.start();
    }
  }

  async stopAll() {
    for (const engine of [...this.engines.values()].reverse()) {
      await engine.stop();
    }
  }

  health() {
    return this.list().map(e => e.health());
  }
}
