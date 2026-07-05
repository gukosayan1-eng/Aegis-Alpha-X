import { BaseEngine } from "./baseEngine.js";
import { emaLast, slopePct } from "../market/indicators.js";

export class MemoryEngine extends BaseEngine {
  constructor(){ super("Memory AI"); }

  scoreNode(node){
    if(!node) return 50;
    const total = (node.historicalTrades || 0) + (node.liveTrades || node.trades || 0);
    if(total < 10) return 50;
    const wins = node.wins || 0;
    const winRate = wins / Math.max(1, total) * 100;
    const pnlScore = Math.max(0, Math.min(100, 50 + (node.pnl || 0) * 0.75));
    return Math.max(0, Math.min(100, winRate * 0.65 + pnlScore * 0.35));
  }

  analyze({ symbol, candles, memory }){
    const price = candles.at(-1).close;
    const ema200 = emaLast(candles, 200);
    const slope = slopePct(candles, 24);
    const side = price < ema200 && slope < 0 ? "SHORT" : "LONG";

    const coin = this.scoreNode(memory[`coin:${symbol}`]);
    const sideNode = this.scoreNode(memory[`side:${side}`]);
    const combined = coin * 0.70 + sideNode * 0.30;

    let recommendation = "WAIT";
    if(combined >= 58) recommendation = side;
    if(combined <= 42) recommendation = side === "LONG" ? "SHORT" : "LONG";

    const totalSamples = (memory[`coin:${symbol}`]?.historicalTrades || 0) + (memory[`coin:${symbol}`]?.liveTrades || 0);

    return this.report({
      confidence: combined,
      recommendation,
      observations: [`Memory score ${combined.toFixed(1)}`, `Historical/live samples ${totalSamples}`],
      supporting: totalSamples ? [`Memory has ${totalSamples} samples for ${symbol}`] : ["No meaningful memory yet"],
      contradicting: totalSamples < 20 ? ["Memory sample size is still low"] : []
    });
  }
}
