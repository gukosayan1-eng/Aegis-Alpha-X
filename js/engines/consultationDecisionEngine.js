import { emaLast, atrPct, slopePct } from "../market/indicators.js";

export class ConsultationDecisionEngine {
  constructor(dataFeed){
    this.dataFeed = dataFeed;
    this.frames = [
      { timeframe:"1m", style:"Scalp", hold:"3-15 min" },
      { timeframe:"5m", style:"Fast intraday", hold:"15-60 min" },
      { timeframe:"15m", style:"Intraday", hold:"45m-3h" },
      { timeframe:"1h", style:"Swing", hold:"2h-12h" },
      { timeframe:"4h", style:"Position swing", hold:"8h-3d" },
      { timeframe:"1d", style:"Macro swing", hold:"1d-2w" }
    ];
  }

  async choose(symbol){
    const candidates = [];
    for(const f of this.frames){
      try{
        const candles = await this.dataFeed.getCandles(symbol, f.timeframe, 260);
        const price = candles.at(-1).close;
        const ema21 = emaLast(candles, 21), ema200 = emaLast(candles, 200);
        const atr = atrPct(candles), slope = slopePct(candles, 30);
        const trendAligned = (price > ema200 && ema21 > ema200 && slope > 0) || (price < ema200 && ema21 < ema200 && slope < 0);
        const volatilityFit = atr > 0.15 && atr < 2.8 ? 25 : 5;
        const score = Math.min(100, Math.abs(slope)*18 + volatilityFit + (trendAligned ? 35 : 10));
        const bias = price > ema200 && ema21 > ema200 && slope > 0 ? "LONG" : price < ema200 && ema21 < ema200 && slope < 0 ? "SHORT" : "WAIT";
        candidates.push({ ...f, candles, score, bias, atr, slope });
      }catch(e){}
    }
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0] || null;
  }
}
