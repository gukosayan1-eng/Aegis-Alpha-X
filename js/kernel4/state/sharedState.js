export class SharedState4 {
  constructor(initial = {}) {
    this.state = structuredClone ? structuredClone(initial) : JSON.parse(JSON.stringify(initial));
    this.snapshots = [];
    this.maxSnapshots = 250;
  }

  get(path = null) {
    if (!path) return this.state;
    return path.split(".").reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value) {
    const keys = path.split(".");
    let cursor = this.state;
    while (keys.length > 1) {
      const key = keys.shift();
      if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
      cursor = cursor[key];
    }
    cursor[keys[0]] = value;
    return value;
  }

  update(path, updater) {
    const current = this.get(path);
    return this.set(path, updater(current));
  }

  snapshot(label = "snapshot") {
    const snap = {
      id: crypto?.randomUUID ? crypto.randomUUID() : `SNAP-${Date.now()}`,
      label,
      timestamp: Date.now(),
      state: structuredClone ? structuredClone(this.state) : JSON.parse(JSON.stringify(this.state))
    };
    this.snapshots.push(snap);
    if (this.snapshots.length > this.maxSnapshots) this.snapshots.shift();
    return snap;
  }

  restore(snapshotId) {
    const snap = this.snapshots.find(s => s.id === snapshotId);
    if (!snap) throw new Error(`Snapshot not found: ${snapshotId}`);
    this.state = structuredClone ? structuredClone(snap.state) : JSON.parse(JSON.stringify(snap.state));
    return this.state;
  }
}
