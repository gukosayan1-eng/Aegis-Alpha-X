import { RiskEngine } from "./riskEngine.js";
import { TradeManagementAI } from "./tradeManagementAI.js";
import { TradeReviewEngine } from "./tradeReviewEngine.js";

export class TradeEngine {
  constructor({ bus, state, logger }){
    this.bus = bus; this.state = state; this.logger = logger; this.risk = new RiskEngine();
    this.managerAI = new TradeManagementAI();
    this.reviewer = new TradeReviewEngine();
    // Kernel calls open() directly in 1.5 to avoid event-only execution gaps.
    this.bus.on("price:update", p => this.onPrice(p));
  }

  open({ symbol, candles, decision }){
    const s = this.state.state;

    if(decision.action !== "LONG" && decision.action !== "SHORT"){
      return { status: "BLOCKED", reason: "Decision was not LONG or SHORT." };
    }

    if(s.openTrades.some(t => t.symbol === symbol && t.status === "OPEN")){
      const reason = `Existing open trade on ${symbol}.`;
      this.logger.line(`Trade blocked: ${reason}`);
      return { status: "BLOCKED", reason };
    }

    if(s.openTrades.length >= (s.settings.maxOpenTrades || 5)){
      const reason = "Maximum open trades reached.";
      this.logger.line(`Trade blocked: ${reason}`);
      return { status: "BLOCKED", reason };
    }

    let trade;
    try {
      trade = this.risk.buildTrade({ state:s, symbol, candles, decision });
    } catch(error){
      const reason = `Risk build failed: ${error.message}`;
      this.logger.line(reason);
      return { status: "FAILED", reason };
    }

    if(!Number.isFinite(trade.margin) || !Number.isFinite(trade.positionValue) || trade.positionValue <= 0){
      const reason = "Invalid position sizing.";
      this.logger.line(`Trade failed: ${reason}`);
      return { status: "FAILED", reason };
    }

    if(trade.margin > s.account.balance){
      const reason = `Margin $${trade.margin.toFixed(2)} exceeds balance $${s.account.balance.toFixed(2)}.`;
      this.logger.line(`Trade blocked: ${reason}`);
      return { status: "BLOCKED", reason };
    }

    s.openTrades.push(trade);
    this.revalue();
    this.state.save();

    this.logger.line(`OPEN ${trade.side} ${trade.symbol} position $${trade.positionValue.toFixed(2)} margin $${trade.margin.toFixed(2)} lev ${trade.leverage}x.`);
    this.bus.emit("trade:opened", { trade, updatedAt:Date.now() });
    this.bus.emit("positions:update", { trades:s.openTrades, updatedAt:Date.now() });
    this.bus.emit("state:update", s);

    return { status: "OPENED", reason: "Trade opened successfully.", trade };
  }

  onPrice({ symbol, price }){
    const s = this.state.state; let changed = false;
    for(const trade of [...s.openTrades]){
      if(trade.symbol !== symbol || trade.status !== "OPEN") continue;
      trade.current = price;
      const move = trade.side === "LONG" ? (price-trade.entry)/trade.entry : (trade.entry-price)/trade.entry;
      trade.grossPnl = trade.positionValue * move;
      trade.estimatedExitFee = trade.positionValue * Number(trade.feeRate || 0);
      trade.totalFees = Number(trade.estimatedEntryFee || 0) + Number(trade.estimatedExitFee || 0);
      trade.pnl = trade.grossPnl - trade.totalFees;
      trade.maxProfit = Math.max(Number(trade.maxProfit || 0), trade.pnl);
      trade.maxDrawdown = Math.min(Number(trade.maxDrawdown || 0), trade.pnl);
      changed = true;

      let closeReason = null;

      // Profit protection: if trade was meaningfully profitable but gives too much back, exit before SL.
      const protectionTrigger = Math.max(Number(trade.riskDollars || 0) * 0.65, trade.positionValue * 0.0015);
      const givebackLimit = Math.max(Number(trade.riskDollars || 0) * 0.35, trade.positionValue * 0.0008);

      if(trade.maxProfit >= protectionTrigger && trade.pnl <= trade.maxProfit - givebackLimit){
        closeReason = "PROFIT PROTECTION";
      }
      if(!closeReason){
        if(trade.side === "LONG"){ if(price <= trade.stopLoss) closeReason = "SL"; if(price >= trade.takeProfit) closeReason = "TP"; }
        else { if(price >= trade.stopLoss) closeReason = "SL"; if(price <= trade.takeProfit) closeReason = "TP"; }
      }
      if(!closeReason){ const management=this.managerAI.evaluate(trade); if(management.action==="CLOSE") closeReason=management.reason; }
      if(closeReason) this.close(trade.id, closeReason, price);
    }
    if(changed){ this.revalue(); this.state.save(); this.bus.emit("positions:update", { trades:s.openTrades, updatedAt:Date.now() }); this.bus.emit("state:update", s); }
  }

  revalue(){
    const s = this.state.state;
    s.account.unrealized = s.openTrades.reduce((a,t)=>a+(t.pnl||0),0);
    s.account.equity = s.account.balance + s.account.unrealized;
    s.account.positionValue = s.openTrades.reduce((a,t)=>a+(t.positionValue||0),0);
  }

  async manageLivePositions(dataFeed){
    const s = this.state.state;
    if(!dataFeed || !s.openTrades.length){ this.bus.emit("positions:update", { trades:s.openTrades, updatedAt:Date.now() }); return; }
    for(const t of [...s.openTrades]){
      try{ this.onPrice({ symbol:t.symbol, price:await dataFeed.getPrice(t.symbol) }); }
      catch(err){ this.logger.line(`Live position update failed for ${t.symbol}: ${err.message}`); }
    }
    this.revalue(); this.state.save();
    this.bus.emit("positions:update", { trades:s.openTrades, updatedAt:Date.now() });
    this.bus.emit("state:update", s);
  }

  close(id, reason="MANUAL", exitPrice=null){
    const s = this.state.state;
    const trade = s.openTrades.find(t=>t.id===id); if(!trade) return;
    if(exitPrice !== null){
      const move = trade.side === "LONG" ? (exitPrice-trade.entry)/trade.entry : (trade.entry-exitPrice)/trade.entry;
      trade.grossPnl = trade.positionValue * move;
      trade.estimatedExitFee = trade.positionValue * Number(trade.feeRate || 0);
      trade.totalFees = Number(trade.estimatedEntryFee || 0) + Number(trade.estimatedExitFee || 0);
      trade.pnl = trade.grossPnl - trade.totalFees; trade.current = exitPrice;
    }
    s.account.balance += trade.pnl;
    s.openTrades = s.openTrades.filter(t=>t.id!==id);
    let closed = { ...trade, status:"CLOSED", closedAt:Date.now(), durationMs:Date.now()-trade.openedAt, closeReason:reason };
    closed.review = this.reviewer.review(closed);
    s.closedTrades.push(closed);
    this.updateMemory(closed); this.revalue(); this.state.save();
    this.logger.line(`CLOSE ${closed.symbol} ${reason}. P/L $${closed.pnl.toFixed(2)}.`);
    this.bus.emit("trade:closed", { trade:closed, updatedAt:Date.now() });
    this.bus.emit("history:update", { trades:s.closedTrades, updatedAt:Date.now() });
    this.bus.emit("positions:update", { trades:s.openTrades, updatedAt:Date.now() });
    this.bus.emit("state:update", s);
  }

  closeAll(){ for(const t of [...this.state.state.openTrades]) this.close(t.id, "MANUAL", t.current); }

  updateMemory(trade){
    const memory = this.state.state.memory;
    const keys = [`coin:${trade.symbol}`,`side:${trade.side}`,`regime:${trade.regime||"Unknown"}`,`timeframe:${trade.timeframe||"5m"}`,`leverage:${trade.leverage}x`,`setup:${trade.symbol}:${trade.side}:${trade.regime||"Unknown"}`,
      `pattern:${trade.pattern || "Unknown"}:${trade.side}`,
      `news:${trade.newsRisk || "No news risk"}`,
      `review:${trade.review?.category || "Unreviewed"}`,
      `closeReason:${trade.closeReason || "Unknown"}`];
    for(const key of keys){
      if(!memory[key]) memory[key] = { trades:0, wins:0, losses:0, pnl:0 };
      memory[key].trades++; if(trade.pnl >= 0) memory[key].wins++; else memory[key].losses++; memory[key].pnl += trade.pnl;
    }
  }
}
