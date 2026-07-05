function money(n){
  return "$" + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function badge(value){
  const cls = value === "LONG" ? "long" : value === "SHORT" ? "short" : "wait";
  return `<span class="badge ${cls}">${value}</span>`;
}

function setText(id, value){
  const el = document.getElementById(id);
  if(el) el.textContent = value;
}

function stamp(id){
  setText(id, new Date().toLocaleTimeString());
}

export class DashboardView {
  constructor(bus, state, tradeEngine){
    this.bus = bus;
    this.state = state;
    this.tradeEngine = tradeEngine;

    this.bus.on("state:update", s => this.renderState(s));
    this.bus.on("scanner:update", payload => this.renderScanner(payload.rows || payload));
    this.bus.on("positions:update", payload => { this.renderOpenTrades(payload.trades || []); stamp("positionsUpdated"); });
    this.bus.on("history:update", payload => { this.renderHistory(payload.trades || []); stamp("historyUpdated"); });
    this.bus.on("chart:updated", () => stamp("chartUpdated"));
    this.bus.on("news:researched", payload => this.renderWebNews(payload));
    this.bus.on("decision:evaluated", payload => this.renderCouncil(payload));
    this.bus.on("research:lab_result", payload => this.renderResearchLab(payload));
    this.bus.on("research:counterfactual_result", payload => this.renderCounterfactuals(payload));
    this.bus.on("log:add", line => this.addLog(line));
    this.bus.on("thought:add", line => this.addThought(line));
    this.bus.on("system:status", payload => setText("systemStatus", payload.status));

    document.getElementById("applySettings").onclick = () => this.applySettings();
    document.getElementById("resetAccount").onclick = () => this.resetAccount();
    document.getElementById("startAgent").onclick = () => this.bus.emit("agent:start");
    document.getElementById("stopAgent").onclick = () => this.bus.emit("agent:stop");
    document.getElementById("scanOnce").onclick = () => this.bus.emit("agent:scan_once");
    document.getElementById("closeAll").onclick = () => this.tradeEngine.closeAll();
    document.getElementById("bootstrapMemory").onclick = () => this.bus.emit("memory:bootstrap");
    document.getElementById("manageNow").onclick = () => this.bus.emit("positions:manage_now");
    document.getElementById("runResearchLab").onclick = () => this.bus.emit("research:lab");
    document.getElementById("runCounterfactuals").onclick = () => this.bus.emit("research:counterfactuals");
  }

  applySettings(){
    const s = this.state.state;
    s.settings.startupAmount = Number(document.getElementById("startupAmount").value || 300);
    s.settings.baseRisk = Number(document.getElementById("baseRisk").value || 0.9);
    s.settings.maxAllocation = Number(document.getElementById("maxAllocation").value || 60);
    s.settings.maxLeverage = Number(document.getElementById("maxLeverage").value || 20);
    s.settings.maxOpenTrades = Number(document.getElementById("maxOpenTrades").value || 5);
    s.settings.aggressionMode = document.getElementById("aggressionMode").value || "balanced";
    s.settings.consultationMode = document.getElementById("consultationMode").value || "consultation";
    s.settings.maxUniverseSymbols = Number(document.getElementById("maxUniverseSymbols").value || 35);
    s.settings.feeRate = Number(document.getElementById("feeRate").value || 0.04);
    s.settings.manageInterval = Math.max(1000, Number(document.getElementById("manageSeconds").value || 1) * 1000);
    s.settings.minimumEdge = Number(document.getElementById("minimumEdge").value || 72);
    const syncedTimeframe = document.getElementById("scannerTimeframe").value || document.getElementById("timeframe").value || "5m";
    s.settings.scannerTimeframe = syncedTimeframe;
    s.settings.chartTimeframe = syncedTimeframe;
    document.getElementById("timeframe").value = syncedTimeframe;
    s.settings.scanInterval = Math.max(3000, Number(document.getElementById("scanInterval").value || 10) * 1000);
    this.state.save();
    this.bus.emit("state:update", s);
    this.bus.emit("log:add", { time:new Date().toLocaleTimeString(), message:"Settings applied." });
  }

  resetAccount(){
    const amount = Number(document.getElementById("startupAmount").value || 300);
    this.state.resetAccount(amount);
    this.bus.emit("state:update", this.state.state);
    this.bus.emit("history:update", { trades: [], updatedAt: Date.now() });
    this.bus.emit("positions:update", { trades: [], updatedAt: Date.now() });
    this.bus.emit("log:add", { time:new Date().toLocaleTimeString(), message:`Account reset to ${money(amount)}.` });
  }

  renderState(s){
    setText("balance", money(s.account.balance));
    setText("equity", money(s.account.equity));
    setText("unrealized", money(s.account.unrealized));
    setText("openCount", s.openTrades.length);
    setText("positionValue", money(s.account.positionValue));

    const active = s.openTrades?.[0];
    const latest = active ? `MANAGING ${active.side}` : (s.scanner?.[0]?.decision?.action || "WAIT");
    setText("latestDecision", latest);
    setText("opportunityGrade", s.scanner?.[0]?.decision?.grade || "—");

    this.renderOpenTrades(s.openTrades || []);
    this.renderHistory(s.closedTrades || []);
    this.renderMemory(s.memory || {});
    this.renderActiveContext(s);
  }

  renderScanner(rows){
    stamp("scannerUpdated");
    const body = document.getElementById("scannerRows");
    if(!body) return;

    body.innerHTML = rows.map(r => `
      <tr>
        <td>${r.symbol}</td>
        <td>${money(r.price)}</td>
        <td>${r.decision.selectedStyle || r.selectedStyle || "—"}</td><td>${r.decision.selectedTimeframe || r.selectedTimeframe || "—"}</td><td>${r.decision.regime || "Unknown"}</td>
        <td>${r.decision.bias}</td>
        <td>${Math.round(r.decision.probability || 0)}</td>
        <td>${Math.round(r.decision.uncertainty || 0)}</td>
        <td>${r.decision.portfolioApproved ? "APPROVED" : "BLOCKED"}</td>
        <td>${Math.round(r.decision.edge || 0)}</td>
        <td><span class="badge grade-${String(r.decision.grade || "reject").toLowerCase()}">${r.decision.grade || "—"}</span></td><td>${r.decision.thesis || "—"}</td><td>${badge(r.decision.action)}</td>
        <td>${r.decision.executionStatus || "—"}: ${r.decision.executionReason || ""}</td>
      </tr>
    `).join("");
  }

  renderCouncil({ symbol, reports, decision }){
    const grid = document.getElementById("councilGrid");
    if(!grid) return;
    grid.innerHTML = reports.map(r => `
      <div class="council-card">
        <small>${r.engine}</small>
        <strong>${r.recommendation} ${Math.round(r.confidence)}</strong>
      </div>
    `).join("") + `
      <div class="council-card">
        <small>Decision Council</small>
        <strong>${decision.action} ${Math.round(decision.probability || decision.edge || 0)} / U${Math.round(decision.uncertainty || 0)}</strong>
      </div>
    `;

    const adaptive=document.getElementById("adaptivePanel");
    if(adaptive){adaptive.textContent=`Symbol: ${symbol}\nAction: ${decision.action}\nGrade: ${decision.grade} (${Math.round(decision.gradeScore||0)})\nThesis: ${decision.thesis}\nEvidence balance: ${Math.round(decision.evidenceBalance||0)}\nExpected RR: ${(decision.expectedRR||0).toFixed(2)}\nSupporting: ${(decision.evidence?.supporting||[]).slice(0,4).map(e=>e.engine+": "+e.text).join(" | ")}\nContradictions: ${(decision.evidence?.contradicting||[]).slice(0,4).map(e=>e.engine+": "+e.text).join(" | ")}`;}
    this.bus.emit("thought:add", { 
      time:new Date().toLocaleTimeString(), 
      message: decision.reason + " Portfolio: " + (decision.portfolioReasons || []).join(" ") 
    });
  }

  renderActiveContext(s){
    const box = document.getElementById("activeContext");
    if(!box) return;

    if(!s.openTrades.length){
      const top = s.scanner?.[0];
      box.textContent = top ? `No active position. Top opportunity: ${top.symbol}, decision ${top.decision.action}, probability ${Math.round(top.decision.probability || 0)}, uncertainty ${Math.round(top.decision.uncertainty || 0)}.` : "No active position yet.";
      return;
    }

    const t = s.openTrades[0];
    box.textContent = `Managing ${t.side} ${t.symbol}. Style ${t.selectedStyle || '—'} / ${t.timeframe}. Position value ${money(t.positionValue)}, margin ${money(t.margin)}, leverage ${t.leverage}x, probability at entry ${Math.round(t.probability || 0)}, uncertainty ${Math.round(t.uncertainty || 0)}, regime ${t.regime}. Current net P/L ${money(t.pnl)} after estimated fees ${money(t.totalFees)}.`;
  }

  renderOpenTrades(trades){
    const body = document.getElementById("openRows");
    if(!body) return;

    body.innerHTML = trades.length ? trades.map(t => `
      <tr>
        <td>${t.id}</td>
        <td>${t.symbol}</td>
        <td>${badge(t.side)}</td>
        <td>${Number(t.entry).toFixed(4)}</td>
        <td>${Number(t.current).toFixed(4)}</td>
        <td>${Number(t.stopLoss).toFixed(4)}</td>
        <td>${Number(t.takeProfit).toFixed(4)}</td>
        <td>${money(t.positionValue)}</td>
        <td>${money(t.margin)}</td>
        <td>${money(t.riskDollars)}</td>
        <td>${money(t.maxProfit)}</td>
        <td>${money(t.maxDrawdown)}</td>
        <td>${Math.round(t.allocationPct || 0)}%</td>
        <td>${this.tradeAge(t)}</td>
        <td><span class="badge ${t.grossPnl >= 0 ? "positive" : "negative"}">${money(t.grossPnl)}</span></td><td>${money(t.totalFees)}</td><td><span class="badge ${t.pnl >= 0 ? "positive" : "negative"}">${money(t.pnl)}</span></td>
        <td>${t.status} / ${t.timeframe} / ${t.expectedHold}</td>
      </tr>
    `).join("") : `<tr><td colspan="16">No open positions.</td></tr>`;
  }

  renderHistory(trades){
    const body = document.getElementById("historyRows");
    if(!body) return;

    body.innerHTML = (trades || []).slice(-100).reverse().map(t => `
      <tr>
        <td>${new Date(t.closedAt).toLocaleTimeString()}</td>
        <td>${t.symbol}</td>
        <td>${badge(t.side)}</td>
        <td>${Number(t.entry).toFixed(4)}</td>
        <td>${Number(t.current).toFixed(4)}</td>
        <td>${money(t.positionValue)}</td>
        <td>${money(t.margin)}</td>
        <td>${money(t.riskDollars)}</td>
        <td>${this.formatDuration(t.durationMs || 0)}</td>
        <td><span class="badge ${t.pnl >= 0 ? "positive" : "negative"}">${money(t.pnl)}</span></td>
        <td>${t.closeReason}</td>
        <td>${t.review?.fullReview || "No review available."}</td>
      </tr>
    `).join("") || `<tr><td colspan="12">No closed trades yet.</td></tr>`;
  }

  renderMemory(memory){
    const panel = document.getElementById("memoryPanel");
    if(!panel) return;
    const rows = Object.entries(memory || {});
    panel.innerHTML = rows.length ? rows.slice(0,120).map(([k,m]) => {
      const wr = m.trades ? Math.round(m.wins / m.trades * 100) : 0;
      return `<div><strong>${k}</strong><br>Samples: ${m.trades || m.samples || 0} | Win: ${wr}% | P/L: ${money(m.pnl)} ${m.source ? "| " + m.source : ""}</div><hr>`;
    }).join("") : "No memory yet. Click Bootstrap Memory.";
  }

  tradeAge(t){ return this.formatDuration(Date.now() - t.openedAt); }

  formatDuration(ms){
    const s = Math.max(0, Math.floor(ms / 1000));
    if(s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if(m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m`;
  }

  addLog({ time, message }){
    const box = document.getElementById("systemLog");
    if(!box) return;
    box.innerHTML += `<div>[${time}] ${message}</div>`;
    box.scrollTop = box.scrollHeight;
  }

  addThought({ time, message }){
    const box = document.getElementById("monologue");
    if(!box) return;
    box.innerHTML += `<div><strong>${time}</strong><br>${message}</div><hr>`;
    box.scrollTop = box.scrollHeight;
  }
}
