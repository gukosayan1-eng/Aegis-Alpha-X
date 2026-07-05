export class BaseEngine {
  constructor({ id, name, version = "4.0.0", eventBus, state, logger } = {}) {
    if (!id) throw new Error("BaseEngine requires id");
    this.id = id;
    this.name = name || id;
    this.version = version;
    this.eventBus = eventBus;
    this.state = state;
    this.logger = logger;
    this.status = "CREATED";
    this.startedAt = null;
    this.lastUpdateAt = null;
    this.lastError = null;
    this.metricsState = {
      updateCount: 0,
      errorCount: 0,
      totalLatencyMs: 0,
      lastLatencyMs: 0
    };
  }

  async initialize() {
    this.status = "INITIALIZED";
  }

  async start() {
    this.status = "RUNNING";
    this.startedAt = Date.now();
  }

  async stop() {
    this.status = "STOPPED";
  }

  async update(context = {}) {
    this.lastUpdateAt = Date.now();
    return this.standardResult({
      confidence: 0,
      uncertainty: 100,
      evidence: [],
      counterEvidence: [],
      recommendation: "WAIT",
      explanation: `${this.name} has no update implementation yet.`,
      metadata: { contextKeys: Object.keys(context) }
    });
  }

  async safeUpdate(context = {}) {
    const started = performance.now();
    try {
      const result = await this.update(context);
      const latency = performance.now() - started;
      this.metricsState.updateCount += 1;
      this.metricsState.totalLatencyMs += latency;
      this.metricsState.lastLatencyMs = latency;
      this.lastUpdateAt = Date.now();
      return this.normalizeResult(result);
    } catch (error) {
      const latency = performance.now() - started;
      this.metricsState.errorCount += 1;
      this.metricsState.lastLatencyMs = latency;
      this.lastError = error.message;
      this.status = "DEGRADED";
      this.publish("engine:error", {
        engineId: this.id,
        name: this.name,
        error: error.message,
        timestamp: Date.now()
      });
      return this.standardResult({
        confidence: 0,
        uncertainty: 100,
        evidence: [],
        counterEvidence: [{ source: this.id, message: error.message, strength: 100 }],
        recommendation: "WAIT",
        explanation: `${this.name} failed: ${error.message}`,
        metadata: { error: true }
      });
    }
  }

  publish(type, payload = {}) {
    if (this.eventBus) {
      this.eventBus.publish(type, {
        source: this.id,
        timestamp: Date.now(),
        payload
      });
    }
  }

  health() {
    return {
      engineId: this.id,
      name: this.name,
      version: this.version,
      status: this.status,
      startedAt: this.startedAt,
      lastUpdateAt: this.lastUpdateAt,
      lastError: this.lastError,
      metrics: this.metrics()
    };
  }

  metrics() {
    const avgLatencyMs = this.metricsState.updateCount
      ? this.metricsState.totalLatencyMs / this.metricsState.updateCount
      : 0;

    return {
      ...this.metricsState,
      avgLatencyMs
    };
  }

  standardResult({
    confidence = 0,
    uncertainty = 100,
    evidence = [],
    counterEvidence = [],
    recommendation = "WAIT",
    explanation = "",
    metrics = {},
    metadata = {}
  }) {
    return {
      engineId: this.id,
      engineName: this.name,
      version: this.version,
      timestamp: Date.now(),
      confidence,
      uncertainty,
      evidence,
      counterEvidence,
      recommendation,
      explanation,
      metrics,
      metadata
    };
  }

  normalizeResult(result = {}) {
    return this.standardResult({
      confidence: Number(result.confidence ?? 0),
      uncertainty: Number(result.uncertainty ?? Math.max(0, 100 - Number(result.confidence ?? 0))),
      evidence: Array.isArray(result.evidence) ? result.evidence : [],
      counterEvidence: Array.isArray(result.counterEvidence) ? result.counterEvidence : [],
      recommendation: result.recommendation || result.action || "WAIT",
      explanation: result.explanation || result.reason || "",
      metrics: result.metrics || {},
      metadata: result.metadata || result
    });
  }
}
