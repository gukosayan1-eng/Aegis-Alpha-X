export class PostMortemEngine {
  analyzeTrade(trade){
    const issues = [], strengths = [];
    if((trade.maxProfit || 0) > Math.abs(trade.pnl || 0) && trade.pnl < 0) issues.push("Trade was profitable first but management failed to protect gains.");
    if((trade.uncertainty || 0) > 55) issues.push("Entry uncertainty was high.");
    if((trade.leverage || 0) >= 12 && trade.pnl < 0) issues.push("Leverage amplified a losing setup.");
    if((trade.maxDrawdown || 0) < -Math.abs(trade.riskDollars || 0)) issues.push("Adverse excursion exceeded planned risk.");
    if(trade.closeReason === "TP") strengths.push("Thesis reached planned take profit.");
    if(trade.closeReason === "PROFIT PROTECTION") strengths.push("Manager protected profit before full reversal.");
    return { rootCause: issues[0] || strengths[0] || "No dominant root cause identified.", issues, strengths, executionScore:Math.max(0,Math.min(100,70-issues.length*14+strengths.length*10)), managementScore:Math.max(0,Math.min(100,65-(issues.some(i=>i.includes("management"))?25:0)+strengths.length*12)) };
  }
}
