import { BaseEngine } from "./baseEngine.js";

export class LiquidityEngine extends BaseEngine {
  constructor(){ super("Liquidity AI"); }

  analyze({ candles }){
    const price = candles.at(-1).close;
    const recent = candles.slice(-60);
    const high = Math.max(...recent.map(c=>c.high));
    const low = Math.min(...recent.map(c=>c.low));
    const above = (high - price) / price * 100;
    const below = (price - low) / price * 100;
    let recommendation = "WAIT", confidence = 50, state = "Mid-range";
    const supporting = [], contradicting = [];
    if(above < .25 && below > .5){ state = "Near upside liquidity"; recommendation = "SHORT"; confidence = 67; supporting.push("Price is close to recent highs where breakout buyers may be trapped."); }
    else if(below < .25 && above > .5){ state = "Near downside liquidity"; recommendation = "LONG"; confidence = 67; supporting.push("Price is close to recent lows where sell stops may be swept."); }
    else if(above > below * 1.7){ state = "More liquidity above"; recommendation = "LONG"; confidence = 58; supporting.push("Upside liquidity is more attractive."); }
    else if(below > above * 1.7){ state = "More liquidity below"; recommendation = "SHORT"; confidence = 58; supporting.push("Downside liquidity is more attractive."); }
    else contradicting.push("Liquidity is balanced.");
    return this.report({ confidence, recommendation, observations:[`Liquidity ${state}`,`Above ${above.toFixed(2)}%`,`Below ${below.toFixed(2)}%`,`High ${high.toFixed(4)}`,`Low ${low.toFixed(4)}`], supporting, contradicting });
  }
}
