import { BaseEngine } from "./baseEngine.js";
import { rsiLast, atrPct, slopePct } from "../market/indicators.js";

export class MarketPsychologyEngine extends BaseEngine {
  constructor(){ super("Psychology AI"); }

  analyze({ candles }){
    const rsi = rsiLast(candles);
    const atr = atrPct(candles);
    const fast = slopePct(candles, 8);
    const slow = slopePct(candles, 36);
    const last = candles.at(-1);
    const body = Math.abs(last.close - last.open);
    const wickTop = last.high - Math.max(last.close, last.open);
    const wickBottom = Math.min(last.close, last.open) - last.low;
    let state = "Balanced", recommendation = "WAIT", confidence = 48;
    const supporting = [], contradicting = [];
    if(rsi > 72 && wickTop > body * 1.2){ state = "Late Buyers / Possible Distribution"; recommendation = "SHORT"; confidence = 72; supporting.push("Overbought momentum with upper rejection wick."); }
    else if(rsi < 28 && wickBottom > body * 1.2){ state = "Panic Sellers / Possible Absorption"; recommendation = "LONG"; confidence = 72; supporting.push("Oversold momentum with lower absorption wick."); }
    else if(fast > .25 && slow > 0 && atr > .5){ state = "Risk-On Momentum Crowd"; recommendation = "LONG"; confidence = 66; supporting.push("Crowd momentum supports continuation."); }
    else if(fast < -.25 && slow < 0 && atr > .5){ state = "Risk-Off Momentum Crowd"; recommendation = "SHORT"; confidence = 66; supporting.push("Crowd momentum supports downside continuation."); }
    else contradicting.push("No strong crowd imbalance detected.");
    return this.report({ confidence, recommendation, observations:[`Psychology ${state}`,`RSI ${rsi.toFixed(1)}`,`ATR ${atr.toFixed(2)}%`,`Fast slope ${fast.toFixed(2)}%`], supporting, contradicting });
  }
}
