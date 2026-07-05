import { EvidenceEngine } from "./evidenceEngine.js";
import { ProbabilityEngine } from "./probabilityEngine.js";
import { OpportunityGradingEngine } from "./opportunityGradingEngine.js";
export class ExecutiveDecisionCouncil {
  constructor(){ this.evidenceEngine=new EvidenceEngine(); this.probabilityEngine=new ProbabilityEngine(); this.gradingEngine=new OpportunityGradingEngine(); }
  evaluate({symbol,candles,reports,settings,memory}){
    const evidence=this.evidenceEngine.build({reports,memory});
    const longReports=reports.filter(r=>r.recommendation==="LONG"), shortReports=reports.filter(r=>r.recommendation==="SHORT");
    const longEvidence=longReports.reduce((a,r)=>a+(+r.confidence||0),0), shortEvidence=shortReports.reduce((a,r)=>a+(+r.confidence||0),0);
    let bias="WAIT"; if(longEvidence>shortEvidence) bias="LONG"; if(shortEvidence>longEvidence) bias="SHORT";
    const aligned=reports.filter(r=>r.recommendation===bias);
    const opposed=reports.filter(r=>(bias==="LONG"&&r.recommendation==="SHORT")||(bias==="SHORT"&&r.recommendation==="LONG"));
    const alignedScore=aligned.reduce((a,r)=>a+(+r.confidence||0),0)/Math.max(1,aligned.length);
    const opposedScore=opposed.reduce((a,r)=>a+(+r.confidence||0),0)/Math.max(1,opposed.length);
    const consensus=aligned.length/Math.max(1,reports.length)*100;
    const rawEdge=Math.max(0,Math.min(100,alignedScore*.46+consensus*.24+evidence.evidenceBalance*.30-opposedScore*.18));
    const probability=this.probabilityEngine.evaluate({reports,directionalBias:bias,edge:rawEdge});
    const expectedRR=Math.max(1.1,Math.min(5.5,1.2+((probability.probability||50)-55)/18-(probability.uncertainty||50)/90));
    const grade=this.gradingEngine.grade({probability:probability.probability,uncertainty:probability.uncertainty,evidenceBalance:evidence.evidenceBalance,expectedRR,settings});
    const newsReport=reports.find(r=>r.engine==="News AI");
    const newsRiskValue=Number((newsReport?.observations?.find(o=>o.includes("Risk"))||"Risk 0").replace(/[^0-9.]/g,""));
    let action="WAIT";
    const mode = settings.aggressionMode || "balanced";
    const allowedGrades =
      mode === "conservative" ? ["S","A","B"] :
      mode === "balanced" ? ["S","A","B","C"] :
      mode === "aggressive" ? ["S","A","B","C"] :
      ["S","A","B","C"];

    const minProb =
      mode === "conservative" ? settings.minimumEdge :
      mode === "balanced" ? Math.max(50, settings.minimumEdge - 12) :
      mode === "aggressive" ? Math.max(45, settings.minimumEdge - 18) :
      40;

    const maxUncertainty =
      mode === "conservative" ? 60 :
      mode === "balanced" ? 72 :
      mode === "aggressive" ? 82 :
      90;

    if(bias!=="WAIT" && allowedGrades.includes(grade.grade) && probability.probability >= minProb && probability.uncertainty <= maxUncertainty){
      action=bias;
    }

    if(newsRiskValue>=85 && mode !== "experimental") action="WAIT"; if(bias!=="WAIT"&&["S","A","B"].includes(grade.grade)&&probability.probability>=settings.minimumEdge&&probability.uncertainty<=60) action=bias; if(newsRiskValue>=70) action="WAIT";
    const regimeReport=reports.find(r=>r.engine==="Regime AI"); const pattern=reports.find(r=>r.engine==="Pattern AI")?.pattern||"Unknown";
    const thesis=bias==="WAIT"?"No dominant thesis":`${bias} ${pattern} inside ${(regimeReport?.observations?.[0]||"Unknown regime").replace("Regime ","")}`;
    return {symbol,action,bias,edge:rawEdge,probability:probability.probability,uncertainty:probability.uncertainty,evidenceBalance:evidence.evidenceBalance,expectedRR,grade:grade.grade,gradeScore:grade.score,gradeDescription:grade.description,thesis,evidence,price:candles.at(-1).close,regime:regimeReport?.observations?.[0]?.replace("Regime ","")||"Unknown",pattern,dna:reports.find(r=>r.engine==="Pattern DNA AI")?.dna||"Unknown",psychology:reports.find(r=>r.engine==="Psychology AI")?.observations?.[0]||"Unknown",liquidity:reports.find(r=>r.engine==="Liquidity AI")?.observations?.[0]||"Unknown",newsRisk:newsReport?.observations?.find(o=>o.includes("Risk"))||"No news risk",consensus,alignedEngines:aligned.length,opposedEngines:opposed.length,reason:`${symbol}: thesis ${thesis}. Grade ${grade.grade} (${grade.score.toFixed(1)}), probability ${probability.probability.toFixed(1)}, uncertainty ${probability.uncertainty.toFixed(1)}, evidence ${evidence.evidenceBalance.toFixed(1)}. ${action==="WAIT"?"Council chose WAIT.":"Council approved trade."}`,reports};
  }
}
