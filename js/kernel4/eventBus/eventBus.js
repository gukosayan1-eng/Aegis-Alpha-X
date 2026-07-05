export class EventBus4 {
  constructor({ logger } = {}) {
    this.logger = logger;
    this.listeners = new Map();
    this.history = [];
    this.maxHistory = 2000;
  }

  subscribe(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
    return () => this.unsubscribe(type, handler);
  }

  unsubscribe(type, handler) {
    if (this.listeners.has(type)) this.listeners.get(type).delete(handler);
  }

  publish(type, event = {}) {
    const envelope = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `EV-${Date.now()}-${Math.random()}`,
      type,
      timestamp: Date.now(),
      ...event
    };

    this.history.push(envelope);
    if (this.history.length > this.maxHistory) this.history.shift();

    const handlers = this.listeners.get(type);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(envelope); }
        catch (error) { this.logger?.error?.(`Event handler failed for ${type}: ${error.message}`); }
      }
    }

    const wildcard = this.listeners.get("*");
    if (wildcard) {
      for (const handler of wildcard) {
        try { handler(envelope); }
        catch (error) { this.logger?.error?.(`Wildcard event handler failed: ${error.message}`); }
      }
    }

    return envelope;
  }

  getHistory(filterType = null) {
    return filterType ? this.history.filter(e => e.type === filterType) : [...this.history];
  }

  clearHistory() {
    this.history = [];
  }
}
