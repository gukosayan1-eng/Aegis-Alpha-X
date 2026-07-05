import { ConsultationDecisionEngine } from "../engines/consultationDecisionEngine.js";
export class Kernel {
  constructor({ bus, state, logger, engines, dataFeed, decisionCouncil, tradeEngine, portfolioManager }){
    this.bus = bus; this.state = state; this.logger = logger; this.engines = engines; this.dataFeed = dataFeed;
    this.decisionCouncil = decisionCouncil; this.tradeEngine = tradeEngine; this.portfolioManager = portfolioManager;
    this.running = false;
    this.consultation = new ConsultationDecisionEngine(this.dataFeed); this.scanTimer = null; this.manageTimer = null; this.chartRefreshTimer = null;
  }

  async boot(){
    this.logger.line("Kernel 1.2 booted.");
    this.bus.emit("system:status", { status:"READY" });
    this.bus.emit("state:update", this.state.state);
  }

  async scanOnce(){
    this.bus.emit("system:status", { status:this.running ? "RUNNING / SCANNING" : "ANALYZING" });
    this.logger.line("Kernel scan started.");

    const results = [];
    const settings = this.state.state.settings;
    const fixedTimeframe = settings.scannerTimeframe || "5m";

    await this.dataFeed.loadUniverse(settings.maxUniverseSymbols || 35);

    for(const symbol of this.dataFeed.universe){
      let selectedTimeframe = fixedTimeframe;
      let selectedStyle = "Fixed";
      let candles = null;

      try{
        if(settings.consultationMode === "consultation"){
          const choice = await this.consultation.choose(symbol);
          if(choice && choice.candles && choice.candles.length){
            selectedTimeframe = choice.timeframe || fixedTimeframe;
            selectedStyle = choice.style || "Consultation";
            candles = choice.candles;
          } else {
            selectedStyle = "Fallback";
            candles = await this.dataFeed.getCandles(symbol, selectedTimeframe, 300);
          }
        } else {
          candles = await this.dataFeed.getCandles(symbol, selectedTimeframe, 300);
        }

        if(!candles || !candles.length) throw new Error("No candle data returned.");

        const context = {
          symbol,
          candles,
          selectedTimeframe,
          selectedStyle,
          settings: { ...settings, selectedTimeframe, selectedStyle },
          memory: this.state.state.memory
        };

        const reports = [];
        for(const e of this.engines){
          if(typeof e.analyzeAsync === "function") reports.push(await e.analyzeAsync({ ...context, dataFeed:this.dataFeed }));
          else reports.push(e.analyze(context));
        }

        let decision = this.decisionCouncil.evaluate({ symbol, candles, reports, settings, memory:this.state.state.memory });
        decision.selectedTimeframe = selectedTimeframe;
        decision.selectedStyle = selectedStyle;

        const portfolio = this.portfolioManager.evaluate({ state:this.state.state, decision });
        decision = { ...decision, selectedTimeframe, selectedStyle, portfolioApproved:portfolio.approved, portfolioReasons:portfolio.reasons, portfolioExposurePct:portfolio.exposurePct };
        if(!portfolio.approved) decision.action = "WAIT";

        if(decision.action === "LONG" || decision.action === "SHORT"){
          const execution = this.tradeEngine.open({ symbol, candles, reports, decision });
          decision.executionStatus = execution.status;
          decision.executionReason = execution.reason;
        } else {
          decision.executionStatus = "NO TRADE";
          decision.executionReason = (decision.portfolioReasons || ["Decision was WAIT."]).join(" ");
        }

        results.push({ symbol, price:candles.at(-1).close, selectedTimeframe, selectedStyle, reports, decision });
        this.bus.emit("decision:evaluated", { symbol, reports, decision });
      }catch(err){
        this.logger.line(`Scan skipped ${symbol}: ${err.message}`);
      }
    }

    results.sort((a,b)=>(b.decision.probability||b.decision.edge||0)-(a.decision.probability||a.decision.edge||0));
    this.state.state.scanner = results;
    this.state.save();
    this.bus.emit("scanner:update", { rows:results, updatedAt:Date.now() });
    this.bus.emit("state:update", this.state.state);
    this.bus.emit("system:status", { status:this.running ? "RUNNING" : "READY" });
    const openable = results.filter(r => r.decision.action === "LONG" || r.decision.action === "SHORT").length;
    this.logger.line(`Kernel scan completed. Openable decisions this scan: ${openable}.`);
  }

  start(){
    if(this.running) return;
    this.running = true;
    this.bus.emit("system:status", { status:"RUNNING" });
    this.logger.line("Agent started.");
    this.scanOnce();
    clearInterval(this.scanTimer); clearInterval(this.manageTimer); clearInterval(this.chartRefreshTimer);
    this.scanTimer = setInterval(()=>this.scanOnce(), this.state.state.settings.scanInterval || 10000);
    this.manageTimer = setInterval(()=>this.tradeEngine.manageLivePositions(this.dataFeed), this.state.state.settings.manageInterval || 1000);
    this.chartRefreshTimer = setInterval(()=>this.bus.emit("chart:force_refresh_request", {}), 20000);
  }

  stop(){
    this.running = false;
    this.consultation = new ConsultationDecisionEngine(this.dataFeed);
    clearInterval(this.scanTimer); clearInterval(this.manageTimer); clearInterval(this.chartRefreshTimer);
    this.bus.emit("system:status", { status:"STOPPED" });
    this.logger.line("Agent stopped.");
  }
}
