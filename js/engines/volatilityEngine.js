import { BaseEngine } from "./baseEngine.js";
import { atrPct } from "../market/indicators.js";

export class VolatilityEngine extends BaseEngine {
  constructor(){ super("Volatility AI"); }

  analyze({ candles }){
    const atr = atrPct(candles);
    const healthy = atr >= 0.18 && atr <= 1.4;
    const tooHot = atr > 1.4;

    return this.report({
      confidence: healthy ? 82 : tooHot ? 42 : 55,
      recommendation: healthy ? "TRADEABLE" : "WAIT",
      observations: [`ATR ${atr.toFixed(2)}%`],
      supporting: healthy ? ["Volatility is in tradeable range"] : [],
      contradicting: tooHot ? ["Volatility is too hot; leverage should be reduced"] : ["Volatility is low; move quality may be weak"]
    });
  }
}
