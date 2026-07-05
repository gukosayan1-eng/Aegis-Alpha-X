import {LegacyEngineAdapter} from "../adapters/legacyEngineAdapter.js";
export function createLegacyAdapters(legacy,kernel){
const defs=[["trend","Trend Engine",legacy.trendEngine],["liquidity","Liquidity Engine",legacy.liquidityEngine],["news","News Engine",legacy.newsEngine],["regime","Regime Engine",legacy.regimeEngine],["psychology","Psychology Engine",legacy.marketPsychologyEngine],["decision","Executive Council",legacy.executiveDecisionCouncil]];
return defs.filter(d=>d[2]).map(([id,name,obj])=>new LegacyEngineAdapter({id,name,legacyEngine:obj,eventBus:kernel.eventBus,state:kernel.state,logger:kernel.logger}));
}