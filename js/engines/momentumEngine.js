import { BaseEngine } from "./baseEngine.js";
import { rsiLast, slopePct } from "../market/indicators.js";

export class MomentumEngine extends BaseEngine {
  constructor(){ super("Momentum AI"); }

  analyze({ candles }){
    const rsi = rsiLast(candles);
    const shortSlope = slopePct(candles, 8);

    let recommendation = "WAIT";
    if(rsi > 45 && rsi < 67 && shortSlope > 0) recommendation = "LONG";
    if(rsi < 55 && rsi > 33 && shortSlope < 0) recommendation = "SHORT";

    const confidence = Math.min(100, 45 + Math.abs(shortSlope) * 35 + (rsi > 40 && rsi < 65 ? 20 : 0));

    return this.report({
      confidence,
      recommendation,
      observations: [`RSI ${rsi.toFixed(1)}`, `Short slope ${shortSlope.toFixed(2)}%`],
      supporting: [`Momentum direction supports ${recommendation}`],
      contradicting: rsi > 75 || rsi < 25 ? ["Momentum may be stretched"] : []
    });
  }
}
