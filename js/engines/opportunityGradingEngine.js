export class OpportunityGradingEngine {
  grade({ probability=0, uncertainty=100, evidenceBalance=50, expectedRR=1.5, portfolioApproved=true, settings={} }){
    const mode = settings.aggressionMode || "balanced";

    let score =
      probability * 0.38 +
      evidenceBalance * 0.34 +
      Math.min(100, expectedRR * 24) * 0.18 -
      Math.max(0, uncertainty - 45) * 0.20;

    if(!portfolioApproved) score -= 22;

    if(mode === "conservative") score -= 6;
    if(mode === "aggressive") score += 8;
    if(mode === "experimental") score += 14;

    score = Math.max(0, Math.min(100, score));

    let grade = "REJECT";
    if(score >= 84 && uncertainty <= 42) grade = "S";
    else if(score >= 74 && uncertainty <= 55) grade = "A";
    else if(score >= 62 && uncertainty <= 68) grade = "B";
    else if(score >= 48) grade = "C";

    return {
      score,
      grade,
      description:
        grade === "S" ? "Exceptional opportunity" :
        grade === "A" ? "High-quality opportunity" :
        grade === "B" ? "Tradeable opportunity" :
        grade === "C" ? "Paper-test / low-conviction opportunity" :
        "Rejected"
    };
  }
}
