export class Logger4 {
  constructor({ prefix = "K4", sink = console } = {}) {
    this.prefix = prefix;
    this.sink = sink;
    this.lines = [];
    this.maxLines = 1000;
  }

  write(level, message, data = null) {
    const line = {
      level,
      message,
      data,
      timestamp: Date.now()
    };
    this.lines.push(line);
    if (this.lines.length > this.maxLines) this.lines.shift();

    const text = `[${this.prefix}] ${new Date(line.timestamp).toLocaleTimeString()} ${level.toUpperCase()}: ${message}`;
    if (level === "error") this.sink.error?.(text, data || "");
    else if (level === "warn") this.sink.warn?.(text, data || "");
    else this.sink.log?.(text, data || "");
    return line;
  }

  info(message, data = null) { return this.write("info", message, data); }
  warn(message, data = null) { return this.write("warn", message, data); }
  error(message, data = null) { return this.write("error", message, data); }
  getLines() { return [...this.lines]; }
}
