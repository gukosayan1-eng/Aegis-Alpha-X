export class Logger {
  constructor(bus){
    this.bus = bus;
  }

  line(message){
    const time = new Date().toLocaleTimeString();
    this.bus.emit("log:add", { time, message });
  }

  thought(message){
    const time = new Date().toLocaleTimeString();
    this.bus.emit("thought:add", { time, message });
  }
}
