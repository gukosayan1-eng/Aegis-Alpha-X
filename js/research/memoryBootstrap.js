import { emaLast, rsiLast, atrPct, slopePct } from "../market/indicators.js";

export class MemoryBootstrap {
  constructor({ bus, state, logger, dataFeed }){
    this.bus = bus;
    this.state = state;
    this.logger = logger;
    this.dataFeed = dataFeed;
  }

  classify(candles){
    const price = candles.at(-1).close;
    const ema21 = emaLast(candles, 21);
    const ema200 = emaLast(candles, 200);
    const rsi = rsiLast(candles);
    const atr = atrPct(candles);
    const slope = slopePct(candles, 24);

    let regime = "Range";
    if(price > ema200 && ema21 > ema200 && slope > 0.18) regime = "Bull Expansion";
    if(price < ema200 && ema21 < ema200 && slope < -0.18) regime = "Bear Expansion";
    if(atr > 1.4) regime = "High Volatility";
    if(atr < 0.28) regime = "Compression";

    let pattern = "Mean Reversion";
    if(regime.includes("Expansion") && Math.abs(slope) > 0.25) pattern = "Trend Continuation";
    if(regime === "Compression") pattern = "Compression Breakout Watch";
    if(rsi > 68 || rsi < 32) pattern = "Exhaustion";

    const side = regime.includes("Bear") ? "SHORT" : "LONG";
    return { regime, pattern, side, price, ema21, ema200, rsi, atr, slope };
  }

  outcome(candles, i, side){
    const entry = candles[i].close;
    const future = candles.slice(i + 1, i + 13);
    if(!future.length) return 0;
    const exit = future.at(-1).close;
    return side === "LONG" ? (exit - entry) / entry : (entry - exit) / entry;
  }

  remember(key, result, source = "historical"){
    const memory = this.state.state.memory;
    if(!memory[key]) {
      memory[key] = {
        historicalTrades: 0,
        liveTrades: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        source
      };
    }

    memory[key].historicalTrades = (memory[key].historicalTrades || 0) + 1;
    if(result >= 0) memory[key].wins++;
    else memory[key].losses++;
    memory[key].pnl += result * 100;
  }

  addMarketDNA(symbol, timeframe, i, features, result){
    const dna = this.state.state.historicalCharts;
    dna.push({
      id: `${symbol}-${timeframe}-${i}`,
      symbol,
      timeframe,
      regime: features.regime,
      pattern: features.pattern,
      side: features.side,
      rsi: Number(features.rsi.toFixed(2)),
      atr: Number(features.atr.toFixed(3)),
      slope: Number(features.slope.toFixed(3)),
      resultPct: Number((result * 100).toFixed(3)),
      timestamp: Date.now()
    });

    if(dna.length > 5000){
      this.state.state.historicalCharts = dna.slice(-5000);
    }
  }

  async run(){
    this.logger.line("Historical chart memory bootstrap started.");
    const timeframe = this.state.state.settings.scannerTimeframe || "5m";
    const symbols = this.dataFeed.universe;
    let samples = 0;

    for(const symbol of symbols){
      try {
        const candles = await this.dataFeed.getCandles(symbol, timeframe, 1000);
        for(let i = 240; i < candles.length - 15; i += 6){
          const slice = candles.slice(i - 240, i + 1);
          const features = this.classify(slice);
          const result = this.outcome(candles, i, features.side);

          this.remember(`coin:${symbol}`, result);
          this.remember(`regime:${features.regime}`, result);
          this.remember(`pattern:${features.pattern}`, result);
          this.remember(`setup:${symbol}:${features.pattern}:${features.side}`, result);
          this.remember(`timeframe:${timeframe}`, result);
          this.addMarketDNA(symbol, timeframe, i, features, result);
          samples++;
        }
      } catch(error){
        this.logger.line(`Bootstrap skipped ${symbol}: ${error.message}`);
      }
    }

    this.state.save();
    this.bus.emit("state:update", this.state.state);
    this.logger.line(`Historical chart memory bootstrap completed. Market DNA samples: ${samples}.`);
  }
}
