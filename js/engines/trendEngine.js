import { BaseEngine } from "./baseEngine.js";
import { emaLast, slopePct } from "../market/indicators.js";

export class TrendEngine extends BaseEngine {
  constructor(){ super("Trend AI"); }

  analyze({ candles }){
    const price = candles.at(-1).close;
    const ema21 = emaLast(candles, 21);
    const ema200 = emaLast(candles, 200);
    const slope = slopePct(candles, 24);

    const bullish = price > ema200 && ema21 > ema200 && slope > 0;
    const bearish = price < ema200 && ema21 < ema200 && slope < 0;
    const confidence = Math.min(100, Math.abs(slope) * 25 + (bullish || bearish ? 55 : 30));

    return this.report({
      confidence,
      recommendation: bullish ? "LONG" : bearish ? "SHORT" : "WAIT",
      observations: [`Price ${price.toFixed(4)}`, `EMA21 ${ema21.toFixed(4)}`, `EMA200 ${ema200.toFixed(4)}`, `Slope ${slope.toFixed(2)}%`],
      supporting: bullish ? ["Price above EMA200", "Short-term trend above long-term trend"] : bearish ? ["Price below EMA200", "Short-term trend below long-term trend"] : ["No clean trend alignment"],
      contradicting: bullish && slope < 0.1 ? ["Bull trend slope is weak"] : bearish && slope > -0.1 ? ["Bear trend slope is weak"] : []
    });
  }
}
