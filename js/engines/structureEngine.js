import { BaseEngine } from "./baseEngine.js";

export class StructureEngine extends BaseEngine {
  constructor(){ super("Structure AI"); }

  analyze({ candles }){
    const recent = candles.slice(-36);
    const prior = candles.slice(-72, -36);
    const price = candles.at(-1).close;

    const recentHigh = Math.max(...recent.map(c=>c.high));
    const recentLow = Math.min(...recent.map(c=>c.low));
    const priorHigh = Math.max(...prior.map(c=>c.high));
    const priorLow = Math.min(...prior.map(c=>c.low));

    const brokeHigh = recentHigh > priorHigh;
    const brokeLow = recentLow < priorLow;

    let recommendation = "WAIT";
    if(brokeHigh && price > priorHigh) recommendation = "LONG";
    if(brokeLow && price < priorLow) recommendation = "SHORT";

    return this.report({
      confidence: recommendation === "WAIT" ? 48 : 78,
      recommendation,
      observations: [`Recent high ${recentHigh.toFixed(4)}`, `Recent low ${recentLow.toFixed(4)}`],
      supporting: recommendation !== "WAIT" ? ["Structure has shifted in decision direction"] : [],
      contradicting: recommendation === "WAIT" ? ["No clean structural break"] : []
    });
  }
}
