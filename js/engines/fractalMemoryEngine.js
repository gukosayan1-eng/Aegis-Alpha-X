import { BaseEngine } from "./baseEngine.js";
import { rsiLast, atrPct, slopePct } from "../market/indicators.js";

export class FractalMemoryEngine extends BaseEngine {
  constructor(){ super("Fractal Memory AI"); }
  signature(candles){ return { rsi:Math.round(rsiLast(candles)/10)*10, atr:Math.round(atrPct(candles)*2)/2, slope:Math.round(slopePct(candles,24)*2)/2 }; }
  analyze({ candles, memory }){
    const sig = this.signature(candles);
    const key = `fractal:rsi${sig.rsi}:atr${sig.atr}:slope${sig.slope}`;
    const mem = memory?.[key];
    let recommendation = sig.slope > 0 ? "LONG" : sig.slope < 0 ? "SHORT" : "WAIT";
    let confidence = 46, obs = `No fractal memory for ${key}.`;
    if(mem && (mem.trades || mem.samples)){
      const samples = mem.trades || mem.samples;
      const wr = (mem.wins || 0) / samples;
      confidence = Math.max(30, Math.min(90, 48 + (wr-.5)*60 + Math.min(12, samples/30)));
      obs = `Fractal memory ${samples} samples, ${Math.round(wr*100)}% win.`;
    }
    return { engine:this.name, confidence, recommendation, observations:[`Signature ${key}`, obs], supporting:mem ? ["Similar past states found"] : [], contradicting:!mem ? ["No similar historical state yet"] : [], uncertainty:Math.max(0,100-confidence) };
  }
}
