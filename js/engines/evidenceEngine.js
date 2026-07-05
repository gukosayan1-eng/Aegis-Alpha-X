export class EvidenceEngine {
  build({ reports, memory = {} }){
    const supporting=[], contradicting=[], unknowns=[], byEngine={};
    for(const r of reports){
      const engine=r.engine||"Unknown";
      byEngine[engine]={recommendation:r.recommendation,confidence:+(r.confidence||0),uncertainty:+(r.uncertainty||Math.max(0,100-(+r.confidence||0))),observations:r.observations||[]};
      for(const e of (r.supporting||[])) supporting.push({engine,text:e,strength:+(r.confidence||50)});
      for(const e of (r.contradicting||[])) contradicting.push({engine,text:e,strength:+(r.confidence||50)});
      if((r.uncertainty||0)>55) unknowns.push(`${engine} has high uncertainty.`);
    }
    const supportScore=supporting.reduce((a,e)=>a+e.strength,0)/Math.max(1,supporting.length);
    const contradictionScore=contradicting.reduce((a,e)=>a+e.strength,0)/Math.max(1,contradicting.length);
    const evidenceBalance=Math.max(0,Math.min(100,50+supportScore*.45-contradictionScore*.35-unknowns.length*3));
    return {supporting,contradicting,unknowns,byEngine,supportScore,contradictionScore,evidenceBalance};
  }
}
