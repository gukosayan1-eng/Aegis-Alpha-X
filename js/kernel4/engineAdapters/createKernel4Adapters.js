import { LegacyEngineAdapter } from "./legacyEngineAdapter.js";

export function createKernel4Adapters(legacy = {}, kernel4) {
  const candidates = [
    ["trend", "Trend Intelligence", legacy.trendEngine],
    ["momentum", "Momentum Intelligence", legacy.momentumEngine],
    ["volatility", "Volatility Intelligence", legacy.volatilityEngine],
    ["volume", "Volume Intelligence", legacy.volumeEngine],
    ["structure", "Structure Intelligence", legacy.structureEngine],
    ["regime", "Market Regime Intelligence", legacy.regimeEngine],
    ["liquidity", "Liquidity Intelligence", legacy.liquidityEngine],
    ["psychology", "Market Psychology Intelligence", legacy.marketPsychologyEngine],
    ["memory", "Memory Intelligence", legacy.memoryEngine],
    ["pattern-dna", "Pattern DNA Intelligence", legacy.patternDNAEngine],
    ["fractal-memory", "Fractal Memory Intelligence", legacy.fractalMemoryEngine],
    ["evidence", "Evidence Intelligence", legacy.evidenceEngine],
    ["opportunity-grading", "Opportunity Grading Intelligence", legacy.opportunityGradingEngine],
    ["consultation", "Consultation Decision Intelligence", legacy.consultationDecisionEngine],
    ["probability", "Probability Intelligence", legacy.probabilityEngine],
    ["decision-council", "Decision Council", legacy.decisionCouncil],
    ["executive-council", "Executive Decision Council", legacy.executiveDecisionCouncil],
    ["trade", "Trade Execution Intelligence", legacy.tradeEngine],
    ["risk", "Risk Intelligence", legacy.riskEngine],
    ["portfolio", "Portfolio Intelligence", legacy.portfolioManager],
    ["trade-management", "Trade Management Intelligence", legacy.tradeManagementAI],
    ["trade-review", "Trade Review Intelligence", legacy.tradeReviewEngine],
    ["research-lab", "Research Lab Intelligence", legacy.researchLabAI],
    ["counterfactual", "Counterfactual Intelligence", legacy.counterfactualEngine],
    ["post-mortem", "Post Mortem Intelligence", legacy.postMortemEngine],
    ["memory-bootstrap", "Memory Bootstrap Intelligence", legacy.memoryBootstrap],
    ["news-research", "News Research Intelligence", legacy.newsResearch]
  ];

  return candidates
    .filter(([id, name, engine]) => engine)
    .map(([id, name, engine]) => new LegacyEngineAdapter({
      id,
      name,
      legacyEngine: engine,
      eventBus: kernel4.eventBus,
      state: kernel4.state,
      logger: kernel4.logger
    }));
}

export function registerKernel4Adapters(legacy = {}, kernel4) {
  const adapters = createKernel4Adapters(legacy, kernel4);
  for (const adapter of adapters) kernel4.register(adapter);
  return adapters;
}
