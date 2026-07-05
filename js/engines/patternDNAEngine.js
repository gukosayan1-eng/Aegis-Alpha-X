import { BaseEngine } from "./baseEngine.js";
import { emaLast, rsiLast, atrPct, slopePct } from "../market/indicators.js";

export class PatternDNAEngine extends BaseEngine {
  constructor(){ super("Pattern DNA AI"); }
  bucket(v,l,h){ return v < l ? "Low" : v > h ? "High" : "Mid"; }
  dna({ symbol, candles }){
    const price = candles.at(-1).close;
    const ema21 = emaLast(candles,21), ema200 = emaLast(candles,200);
    const rsi = rsiLast(candles), atr = atrPct(candles), slope = slopePct(candles,24);
    const trend = price > ema200 && ema21 > ema200 ? "Bull" : price < ema200 && ema21 < ema200 ? "Bear" : "Mixed";
    const momentum = this.bucket(rsi,42,62), volatility = this.bucket(atr,.35,1.1);
    const slopeState = slope > .2 ? "Rising" : slope < -.2 ? "Falling" : "Flat";
    return `${symbol}|T:${trend}|M:${momentum}|V:${volatility}|S:${slopeState}`;
  }
  analyze({ symbol, candles, memory }){
    const code = this.dna({ symbol, candles });
    const key = `dna:${code}`;
    const mem = memory?.[key];
    let recommendation = code.includes("T:Bull") ? "LONG" : code.includes("T:Bear") ? "SHORT" : "WAIT";
    let confidence = 52, text = "No direct DNA memory yet.";
    if(mem && (mem.trades || mem.samples)){
      const samples = mem.trades || mem.samples;
      const wr = (mem.wins || 0) / samples;
      confidence = Math.max(35, Math.min(92, 50 + (wr-.5)*55 + Math.min(15, samples/20)));
      text = `DNA memory ${samples} samples, ${Math.round(wr*100)}% win.`;
    }
    return { engine:this.name, confidence, recommendation, dna:code, observations:[`DNA ${code}`, text], supporting: recommendation !== "WAIT" ? [`DNA leans ${recommendation}`] : [], contradicting: !mem ? ["No direct historical DNA sample yet"] : [], uncertainty:Math.max(0,100-confidence) };
  }
}
