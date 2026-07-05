import { BaseEngine } from "./baseEngine.js";
import { emaLast, atrPct, slopePct } from "../market/indicators.js";

export class RegimeEngine extends BaseEngine {
  constructor(){ super("Regime AI"); }

  analyze({ candles }){
    const price = candles.at(-1).close;
    const ema21 = emaLast(candles, 21);
    const ema200 = emaLast(candles, 200);
    const atr = atrPct(candles);
    const slope = slopePct(candles, 36);

    let regime = "Range";
    let confidence = 58;

    if(atr > 1.35){
      regime = "High Volatility";
      confidence = 82;
    } else if(price > ema200 && ema21 > ema200 && slope > 0.18){
      regime = "Bull Expansion";
      confidence = Math.min(95, 70 + Math.abs(slope) * 18);
    } else if(price < ema200 && ema21 < ema200 && slope < -0.18){
      regime = "Bear Expansion";
      confidence = Math.min(95, 70 + Math.abs(slope) * 18);
    } else if(atr < 0.28){
      regime = "Compression";
      confidence = 76;
    }

    const recommendation = regime.includes("Bull") ? "LONG" : regime.includes("Bear") ? "SHORT" : "WAIT";

    return this.report({
      confidence,
      recommendation,
      observations: [`Regime ${regime}`, `ATR ${atr.toFixed(2)}%`, `Slope ${slope.toFixed(2)}%`],
      supporting: [`Current market classified as ${regime}`],
      contradicting: regime === "Range" ? ["No strong directional regime"] : []
    });
  }
}
