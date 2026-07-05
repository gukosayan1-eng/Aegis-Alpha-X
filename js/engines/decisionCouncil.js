import { ProbabilityEngine } from "./probabilityEngine.js";

export class DecisionCouncil {
  constructor(){
    this.probabilityEngine = new ProbabilityEngine();
  }

  evaluate({ symbol, candles, reports, settings, portfolioState = null }){
    const longReports = reports.filter(r => r.recommendation === "LONG");
    const shortReports = reports.filter(r => r.recommendation === "SHORT");

    const longEvidence = longReports.reduce((a,r)=>a+r.confidence,0);
    const shortEvidence = shortReports.reduce((a,r)=>a+r.confidence,0);

    let bias = "WAIT";
    if(longEvidence > shortEvidence) bias = "LONG";
    if(shortEvidence > longEvidence) bias = "SHORT";

    const totalEngines = reports.length;
    const aligned = reports.filter(r => r.recommendation === bias);
    const opposed = reports.filter(r => 
      (bias === "LONG" && r.recommendation === "SHORT") ||
      (bias === "SHORT" && r.recommendation === "LONG")
    );

    const alignedScore = aligned.reduce((a,r)=>a+r.confidence,0) / Math.max(1, aligned.length);
    const opposedScore = opposed.reduce((a,r)=>a+r.confidence,0) / Math.max(1, opposed.length);
    const consensus = aligned.length / Math.max(1, totalEngines) * 100;

    const rawEdge = Math.max(0, Math.min(100, alignedScore * 0.62 + consensus * 0.38 - opposedScore * 0.22));
    const probability = this.probabilityEngine.evaluate({ reports, directionalBias: bias, edge: rawEdge });

    let action = "WAIT";
    if(bias !== "WAIT" && rawEdge >= settings.minimumEdge && probability.probability >= settings.minimumEdge && probability.uncertainty <= 55){
      action = bias;
    }

    const price = candles.at(-1).close;
    const regimeReport = reports.find(r => r.engine === "Regime AI");

    return {
      symbol,
      action,
      bias,
      edge: rawEdge,
      probability: probability.probability,
      uncertainty: probability.uncertainty,
      price,
      regime: regimeReport?.observations?.[0]?.replace("Regime ","") || "Unknown",
      consensus,
      alignedEngines: probability.alignedEngines,
      opposedEngines: probability.opposedEngines,
      reason: `${symbol}: bias ${bias}. Edge ${rawEdge.toFixed(1)}, probability ${probability.probability.toFixed(1)}, uncertainty ${probability.uncertainty.toFixed(1)}. ${action === "WAIT" ? "Council chose WAIT." : "Council approved trade."}`,
      reports
    };
  }
}
