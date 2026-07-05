export class EventRouter4 {
  constructor(eventBus) {
    this.eventBus = eventBus;
    this.routes = new Map();
  }

  route(eventType, targetEngineId) {
    if (!this.routes.has(eventType)) this.routes.set(eventType, new Set());
    this.routes.get(eventType).add(targetEngineId);
  }

  getTargets(eventType) {
    return [...(this.routes.get(eventType) || [])];
  }
}
