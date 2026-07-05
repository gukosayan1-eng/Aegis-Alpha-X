import { BaseEngine } from "./baseEngine.js";

export class VolumeEngine extends BaseEngine {
  constructor(){ super("Volume AI"); }

  analyze({ candles }){
    const last = candles.at(-1);
    const avgVol = candles.slice(-20).reduce((a,c)=>a+c.volume,0) / 20;
    const ratio = last.volume / avgVol;

    return this.report({
      confidence: Math.min(100, 45 + ratio * 20),
      recommendation: ratio > 1 ? "CONFIRMING" : "WEAK",
      observations: [`Relative volume ${ratio.toFixed(2)}x`],
      supporting: ratio > 1 ? ["Volume is above recent average"] : [],
      contradicting: ratio <= 1 ? ["Volume is not confirming strongly"] : []
    });
  }
}
