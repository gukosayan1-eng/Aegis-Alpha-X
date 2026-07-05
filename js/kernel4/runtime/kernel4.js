import { EventBus4 } from "../eventBus/eventBus.js";
import { SharedState4 } from "../state/sharedState.js";
import { Logger4 } from "../logging/logger4.js";
import { EngineManager4 } from "./engineManager.js";
import { Scheduler4 } from "./scheduler.js";
import { RuntimeHealth4 } from "../health/runtimeHealth.js";

export class Kernel4 {
  constructor({ initialState = {}, intervalMs = 1000, logger = null } = {}) {
    this.logger = logger || new Logger4();
    this.eventBus = new EventBus4({ logger: this.logger });
    this.state = new SharedState4(initialState);
    this.engineManager = new EngineManager4({
      logger: this.logger,
      eventBus: this.eventBus,
      state: this.state
    });
    this.scheduler = new Scheduler4({
      engineManager: this.engineManager,
      eventBus: this.eventBus,
      logger: this.logger,
      intervalMs
    });
    this.health = new RuntimeHealth4({
      engineManager: this.engineManager,
      eventBus: this.eventBus
    });
    this.status = "CREATED";
  }

  register(engine) {
    return this.engineManager.register(engine);
  }

  async initialize() {
    this.status = "INITIALIZING";
    await this.engineManager.initializeAll();
    this.status = "READY";
    this.logger.info("Kernel4 initialized");
  }

  async start(contextFactory = () => ({ state: this.state.get(), kernel: this })) {
    if (this.status === "CREATED") await this.initialize();
    await this.engineManager.startAll();
    this.scheduler.start(contextFactory);
    this.status = "RUNNING";
    this.logger.info("Kernel4 running");
  }

  async stop() {
    this.scheduler.stop();
    await this.engineManager.stopAll();
    this.status = "STOPPED";
    this.logger.info("Kernel4 stopped");
  }

  snapshot() {
    return {
      status: this.status,
      state: this.state.get(),
      health: this.health.snapshot(),
      events: this.eventBus.getHistory().slice(-100)
    };
  }
}
