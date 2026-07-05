export class DataFeed {
  constructor(bus, logger){
    this.bus = bus;
    this.logger = logger;
    this.base = "https://fapi.binance.com";
    this.wsBase = "wss://fstream.binance.com/ws/";
    this.socket = null;
    this.universe = ["BTCUSDT","ETHUSDT","SOLUSDT","DOGEUSDT","XRPUSDT","AVAXUSDT","LINKUSDT"];
  }

  async getCandles(symbol, interval = "5m", limit = 300){
    const res = await fetch(`${this.base}/fapi/v1/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, { cache:"no-store" });
    if(!res.ok) throw new Error(`Binance candles ${res.status}`);
    const raw = await res.json();
    return raw.map(k => ({ time:Math.floor(k[0]/1000), open:+k[1], high:+k[2], low:+k[3], close:+k[4], volume:+k[5] }));
  }

  async loadUniverse(limit = 35){
    try{
      const infoRes = await fetch(`${this.base}/fapi/v1/exchangeInfo`, { cache:"no-store" });
      const tickRes = await fetch(`${this.base}/fapi/v1/ticker/24hr`, { cache:"no-store" });
      if(!infoRes.ok || !tickRes.ok) throw new Error("Universe fetch failed");
      const info = await infoRes.json();
      const ticks = await tickRes.json();
      const tradable = new Set(info.symbols.filter(x => x.contractType === "PERPETUAL" && x.quoteAsset === "USDT" && x.status === "TRADING").map(x => x.symbol));
      const ranked = ticks.filter(t => tradable.has(t.symbol)).sort((a,b)=>Number(b.quoteVolume||0)-Number(a.quoteVolume||0)).slice(0, limit).map(t => t.symbol);
      if(ranked.length){
        this.universe = ranked;
        this.bus.emit("log:add", { time:new Date().toLocaleTimeString(), message:`Loaded Binance universe: ${ranked.length} symbols.` });
      }
      return this.universe;
    }catch(error){
      this.logger.line("Universe load failed, using default universe: " + error.message);
      return this.universe;
    }
  }

  async getPrice(symbol){
    const res = await fetch(`${this.base}/fapi/v1/ticker/price?symbol=${symbol}`, { cache:"no-store" });
    if(!res.ok) throw new Error(`Ticker ${res.status}`);
    const data = await res.json();
    return +data.price;
  }

  async loadChartHistory(symbol, interval = "5m"){
    const candles = await this.getCandles(symbol, interval, 500);
    this.bus.emit("chart:history", { symbol, interval, candles, updatedAt:Date.now() });
    this.bus.emit("chart:updated", { symbol, interval, updatedAt:Date.now() });
    return candles;
  }

  streamChart(symbol, interval = "5m"){
    if(this.socket){ try{ this.socket.close(); }catch{} }
    this.socket = new WebSocket(this.wsBase + `${symbol.toLowerCase()}@kline_${interval}`);
    this.socket.onopen = () => this.logger.line(`Chart WebSocket connected: ${symbol} ${interval}`);
    this.socket.onclose = () => this.logger.line(`Chart WebSocket closed: ${symbol} ${interval}`);
    this.socket.onerror = () => this.logger.line(`Chart WebSocket error: ${symbol} ${interval}`);
    this.socket.onmessage = e => {
      const k = JSON.parse(e.data).k;
      const candle = { time:Math.floor(k.t/1000), open:+k.o, high:+k.h, low:+k.l, close:+k.c, volume:+k.v };
      this.bus.emit("chart:candle", { symbol, interval, candle, updatedAt:Date.now() });
      this.bus.emit("chart:updated", { symbol, interval, updatedAt:Date.now() });
      this.bus.emit("price:update", { symbol, price:candle.close, candle, updatedAt:Date.now() });
    };
  }
}
