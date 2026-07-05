export class ProbabilityEngine {
  evaluate({ reports, directionalBias, edge }){
    const aligned = reports.filter(r => r.recommendation === directionalBias);
    const opposed = reports.filter(r => 
      (directionalBias === "LONG" && r.recommendation === "SHORT") ||
      (directionalBias === "SHORT" && r.recommendation === "LONG")
    );
    const neutral = reports.filter(r => r.recommendation === "WAIT" || r.recommendation === "WEAK");

    const support = aligned.reduce((a,r)=>a+r.confidence,0) / Math.max(1, aligned.length);
    const contradiction = opposed.reduce((a,r)=>a+r.confidence,0) / Math.max(1, opposed.length);
    const neutralPenalty = neutral.length * 3;

    const probability = Math.max(0, Math.min(100, edge + support * 0.18 - contradiction * 0.20 - neutralPenalty));
    const uncertainty = Math.max(5, Math.min(95, 100 - probability + opposed.length * 5 + neutral.length * 2));

    return {
      probability,
      uncertainty,
      support,
      contradiction,
      alignedEngines: aligned.length,
      opposedEngines: opposed.length,
      neutralEngines: neutral.length
    };
  }
}
