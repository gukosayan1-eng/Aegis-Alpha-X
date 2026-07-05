export class TradeReviewEngine {
  review(trade){
    const pnl = Number(trade.pnl || 0);
    const side = trade.side;
    const reason = trade.closeReason || "UNKNOWN";
    const durationMs = trade.durationMs || 0;
    const durationMin = durationMs / 60000;
    const expectedHold = trade.expectedHold || "variable";
    const leverage = Number(trade.leverage || 1);
    const regime = trade.regime || "Unknown";
    const probability = Number(trade.probability || 0);
    const uncertainty = Number(trade.uncertainty || 0);
    const maxProfit = Number(trade.maxProfit || 0);
    const maxDrawdown = Number(trade.maxDrawdown || 0);

    let category = "Neutral outcome";
    let explanation = "Trade closed without enough context for a strong review.";

    if(pnl < 0 && reason === "SL" && maxProfit > Math.abs(pnl) * 0.35){
      category = "Management failure";
      explanation = `The ${side} trade was profitable by as much as $${maxProfit.toFixed(2)} but later reversed and hit SL. The entry may not have been the main problem; the management engine should have protected profit, trailed the stop, or exited when momentum faded.`;
    } else if(pnl > 0 && reason === "TP"){
      category = "Validated thesis";
      explanation = `The ${side} thesis worked. Price reached TP before invalidation. Regime was ${regime}, entry probability was ${Math.round(probability)}, uncertainty was ${Math.round(uncertainty)}. This setup should gain memory credit.`;
    } else if(pnl < 0 && reason === "SL"){
      category = "Invalidated thesis";
      explanation = `The ${side} thesis failed without enough favorable movement first. This is more likely an entry, timing, or regime-classification issue.`;
    } else if(reason === "PROFIT PROTECTION"){
      category = pnl >= 0 ? "Protected profit" : "Protection too late";
      explanation = pnl >= 0
        ? `The trade showed profit and the manager protected it before full reversal. This is a good management behavior.`
        : `The manager tried to protect after deterioration, but too late. Tighten the protection trigger for similar setups.`;
    } else if(reason === "TRAILING EXIT"){
      category = pnl >= 0 ? "Good trailing exit" : "Bad trailing exit";
      explanation = pnl >= 0
        ? `Trailing logic closed the trade after favorable movement. This supports active management.`
        : `Trailing exit closed at a loss; review whether trailing activated too early or volatility was underestimated.`;
    } else if(pnl > 0 && reason === "MANUAL"){
      category = "Manual profitable exit";
      explanation = "Trade was manually closed in profit. Positive, but less statistically clean than TP or systematic management exit.";
    } else if(pnl < 0 && reason === "MANUAL"){
      category = "Manual defensive exit";
      explanation = "Trade was manually closed in loss. This may indicate early thesis deterioration or discretionary override.";
    }

    const durationNote = durationMin < 5
      ? "Very short hold; likely scalp/noise-sensitive."
      : durationMin > 240
        ? `Longer hold; suitable for swing/position analysis. Expected window: ${expectedHold}.`
        : `Hold duration was ${Math.round(durationMin)} minutes. Expected window: ${expectedHold}.`;

    const leverageNote = leverage >= 15
      ? "High leverage amplified the outcome; future sizing should demand stronger probability and lower uncertainty."
      : leverage <= 5
        ? "Leverage was controlled; outcome mostly reflects direction and management."
        : "Moderate leverage used.";

    const excursionNote = `Max favorable P/L was $${maxProfit.toFixed(2)} and max adverse P/L was $${maxDrawdown.toFixed(2)}.`;

    return {
      category,
      explanation,
      durationNote,
      leverageNote,
      excursionNote,
      fullReview: `${category}: ${explanation} ${durationNote} ${leverageNote} ${excursionNote}`
    };
  }
}
