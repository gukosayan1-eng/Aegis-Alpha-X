export class AdaptiveSizingEngine {
  multiplier(decision){
    let m = 0.35;
    const g = decision.grade || "C";
    const u = +(decision.uncertainty || 60);
    const p = +(decision.probability || 50);

    if(g === "S") m = 2.6;
    else if(g === "A") m = 1.6;
    else if(g === "B") m = 0.9;
    else if(g === "C") m = 0.35;
    else m = 0;

    if(u > 70) m *= 0.45;
    else if(u > 55) m *= 0.7;

    if(p > 82 && u < 42) m *= 1.2;

    return Math.max(0, Math.min(3.0, m));
  }

  leverageCap(decision, base){
    const g = decision.grade || "C";
    let cap = base;

    if(g === "S") cap = Math.min(base + 3, 20);
    if(g === "A") cap = Math.min(base + 1, 16);
    if(g === "B") cap = Math.min(base, 10);
    if(g === "C") cap = Math.min(base, 4);
    if(g === "REJECT") cap = 0;

    if(decision.uncertainty > 70) cap = Math.min(cap, 3);
    if(String(decision.regime || "").includes("High Volatility")) cap = Math.min(cap, 4);

    return Math.max(1, cap);
  }
}
