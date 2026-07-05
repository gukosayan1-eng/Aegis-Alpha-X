import { registerUnderstandingEngines } from "./kernel4/departments/understanding/registerUnderstandingEngines.js";
import { registerKernel4Adapters } from "./kernel4/engineAdapters/createKernel4Adapters.js";
import { createKernel4Bridge } from "./kernel4/kernel4BrowserBridge.js";
import { EventBus } from "./core/eventBus.js";
import { Logger } from "./core/logger.js";
import { StateManager } from "./core/stateManager.js";
import { Kernel } from "./core/kernel.js";
import { DataFeed } from "./market/dataFeed.js";
import { TrendEngine } from "./engines/trendEngine.js";
import { RegimeEngine } from "./engines/regimeEngine.js";
import { MomentumEngine } from "./engines/momentumEngine.js";
import { VolatilityEngine } from "./engines/volatilityEngine.js";
import { VolumeEngine } from "./engines/volumeEngine.js";
import { StructureEngine } from "./engines/structureEngine.js";
import { MemoryEngine } from "./engines/memoryEngine.js";
import { ExecutiveDecisionCouncil } from "./engines/executiveDecisionCouncil.js";
import { TradeEngine } from "./trading/tradeEngine.js";
import { PortfolioManager } from "./trading/portfolioManager.js";
import { ChartView } from "./ui/chartView.js";
import { DashboardView } from "./ui/dashboardView.js";
import { MemoryBootstrap } from "./research/memoryBootstrap.js";
import { CounterfactualEngine } from "./research/counterfactualEngine.js";
import { ResearchLabAI } from "./research/researchLabAI.js";
import { NewsResearch } from "./research/newsResearch.js";

const bus = new EventBus();
const state = new StateManager();
const logger = new Logger(bus);
const dataFeed = new DataFeed(bus, logger);

const engines = [
  new RegimeEngine(),
  new TrendEngine(),
  new MomentumEngine(),
  new StructureEngine(),
  new VolatilityEngine(),
  new VolumeEngine(),
  new MemoryEngine()
];

const decisionCouncil = new ExecutiveDecisionCouncil();
const portfolioManager = new PortfolioManager();
const tradeEngine = new TradeEngine({ bus, state, logger });
const counterfactualEngine = new CounterfactualEngine();
const researchLabAI = new ResearchLabAI();
const memoryBootstrap = new MemoryBootstrap({ bus, state, logger, dataFeed });
const newsResearch = new NewsResearch({ bus, state, logger });

const kernel = new Kernel({ bus, state, logger, engines, dataFeed, decisionCouncil, tradeEngine, portfolioManager });

new ChartView(bus);
new DashboardView(bus, state, tradeEngine);

async function reloadChart(){
  const symbol = document.getElementById("chartSymbol").value;
  const interval = document.getElementById("timeframe").value;
  state.state.settings.chartTimeframe = interval;
  state.save();
  await dataFeed.loadChartHistory(symbol, interval);
  dataFeed.streamChart(symbol, interval);
}

bus.on("agent:start", () => kernel.start());
bus.on("agent:stop", () => kernel.stop());
bus.on("agent:scan_once", () => kernel.scanOnce());
bus.on("memory:bootstrap", () => memoryBootstrap.run());
bus.on("news:research_web", () => newsResearch.research());
bus.on("positions:manage_now", () => tradeEngine.manageLivePositions(dataFeed));
bus.on("research:lab", () => bus.emit("research:lab_result", researchLabAI.analyze({ memory: state.state.memory, closedTrades: state.state.closedTrades, scanner: state.state.scanner })));
bus.on("research:counterfactuals", () => bus.emit("research:counterfactual_result", counterfactualEngine.analyzeClosedTrades(state.state.closedTrades)));
bus.on("chart:force_refresh_request", () => reloadChart());

document.getElementById("chartSymbol").onchange = reloadChart;
document.getElementById("timeframe").onchange = () => {
  document.getElementById("scannerTimeframe").value = document.getElementById("timeframe").value;
  reloadChart();
};

const scannerTimeframeSyncHandler = () => {
  document.getElementById("timeframe").value = document.getElementById("scannerTimeframe").value;
  reloadChart();
};
document.getElementById("scannerTimeframe").onchange = scannerTimeframeSyncHandler;
document.getElementById("reloadChart").onclick = reloadChart;

setInterval(() => tradeEngine.manageLivePositions(dataFeed), state.state.settings.manageInterval || 1000);
setInterval(() => reloadChart(), 30000);

await kernel.boot();
await reloadChart();
await kernel.scanOnce();

bus.emit("positions:update", { trades: state.state.openTrades, updatedAt: Date.now() });
bus.emit("history:update", { trades: state.state.closedTrades, updatedAt: Date.now() });


// Kernel 4.0 Milestone 1 bridge.
// This does not replace Kernel 3.2 yet; it runs beside it for migration safety.
try {
  window.AegisKernel4 = createKernel4Bridge({
    legacyState: typeof state !== "undefined" ? state.state : {},
    intervalMs: 1000
  });
  window.AegisKernel4.initialize();
  console.log("[K4] Milestone 1 runtime bridge loaded.");
} catch (error) {
  console.warn("[K4] Bridge failed to initialize:", error);
}


// Kernel 4 Milestone 04: register legacy engines into Kernel 4 runtime when available.
try {
  if (window.AegisKernel4) {
    const legacy = {
      trendEngine: typeof trendEngine !== "undefined" ? trendEngine : null,
      momentumEngine: typeof momentumEngine !== "undefined" ? momentumEngine : null,
      volatilityEngine: typeof volatilityEngine !== "undefined" ? volatilityEngine : null,
      volumeEngine: typeof volumeEngine !== "undefined" ? volumeEngine : null,
      structureEngine: typeof structureEngine !== "undefined" ? structureEngine : null,
      regimeEngine: typeof regimeEngine !== "undefined" ? regimeEngine : null,
      liquidityEngine: typeof liquidityEngine !== "undefined" ? liquidityEngine : null,
      marketPsychologyEngine: typeof marketPsychologyEngine !== "undefined" ? marketPsychologyEngine : null,
      memoryEngine: typeof memoryEngine !== "undefined" ? memoryEngine : null,
      patternDNAEngine: typeof patternDNAEngine !== "undefined" ? patternDNAEngine : null,
      fractalMemoryEngine: typeof fractalMemoryEngine !== "undefined" ? fractalMemoryEngine : null,
      evidenceEngine: typeof evidenceEngine !== "undefined" ? evidenceEngine : null,
      opportunityGradingEngine: typeof opportunityGradingEngine !== "undefined" ? opportunityGradingEngine : null,
      consultationDecisionEngine: typeof consultationDecisionEngine !== "undefined" ? consultationDecisionEngine : null,
      probabilityEngine: typeof probabilityEngine !== "undefined" ? probabilityEngine : null,
      decisionCouncil: typeof decisionCouncil !== "undefined" ? decisionCouncil : null,
      executiveDecisionCouncil: typeof executiveDecisionCouncil !== "undefined" ? executiveDecisionCouncil : null,
      tradeEngine: typeof tradeEngine !== "undefined" ? tradeEngine : null,
      riskEngine: typeof riskEngine !== "undefined" ? riskEngine : null,
      portfolioManager: typeof portfolioManager !== "undefined" ? portfolioManager : null,
      tradeManagementAI: typeof tradeManagementAI !== "undefined" ? tradeManagementAI : null,
      tradeReviewEngine: typeof tradeReviewEngine !== "undefined" ? tradeReviewEngine : null,
      researchLabAI: typeof researchLabAI !== "undefined" ? researchLabAI : null,
      counterfactualEngine: typeof counterfactualEngine !== "undefined" ? counterfactualEngine : null,
      postMortemEngine: typeof postMortemEngine !== "undefined" ? postMortemEngine : null,
      memoryBootstrap: typeof memoryBootstrap !== "undefined" ? memoryBootstrap : null,
      newsResearch: typeof newsResearch !== "undefined" ? newsResearch : null
    };
    window.Kernel4LegacyAdapters = registerKernel4Adapters(legacy, window.AegisKernel4);
    console.log(`[K4] Milestone 04 registered ${window.Kernel4LegacyAdapters.length} legacy adapters.`);
  }
} catch (error) {
  console.warn("[K4] Milestone 04 adapter registration failed:", error);
}

try {
  if (window.AegisKernel4 && !window.Kernel4UnderstandingEngines) {
    window.Kernel4UnderstandingEngines = registerUnderstandingEngines(window.AegisKernel4);
    console.log(`[K4] Milestone 05 registered ${window.Kernel4UnderstandingEngines.length} native understanding engines.`);
  }
} catch (error) {
  console.warn("[K4] Milestone 05 failed:", error);
}
