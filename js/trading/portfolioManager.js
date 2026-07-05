export class PortfolioManager {
  evaluate({state,decision}){const account=state.account,settings=state.settings,openTrades=state.openTrades;const currentExposure=openTrades.reduce((a,t)=>a+t.positionValue,0);const maxExposure=account.equity*(settings.maxAllocation/100)*settings.maxLeverage;const exposurePct=maxExposure?currentExposure/maxExposure*100:0;const sameSymbolOpen=openTrades.some(t=>t.symbol===decision.symbol);const tooMuchExposure=currentExposure>=maxExposure;const tooManyOpen=openTrades.length>=(settings.maxOpenTrades||5);const sameSide=openTrades.filter(t=>t.side===decision.action).length;const crowded=sameSide>=3&&!["S","A"].includes(decision.grade);let approved=true;const reasons=[];if(sameSymbolOpen){approved=false;reasons.push("Existing open trade on same symbol.");}if(tooMuchExposure && !["S","A"].includes(decision.grade)){
      if((settings.aggressionMode || "balanced") === "conservative"){
        approved=false;
        reasons.push("Portfolio exposure limit reached.");
      } else {
        reasons.push("Exposure high; allowing paper trade with reduced sizing.");
      }
    }if(tooManyOpen){approved=false;reasons.push("Maximum open trades reached.");}if(decision.uncertainty>82 && !["S","A"].includes(decision.grade)){
      if(["conservative","balanced"].includes(settings.aggressionMode || "balanced")){
        approved=false;
        reasons.push("Uncertainty too high.");
      } else {
        reasons.push("Uncertainty high; allowed only because aggression mode is high.");
      }
    }if(crowded){approved=false;reasons.push("Portfolio already crowded in same direction; only A/S allowed.");}return{approved,exposurePct,currentExposure,maxExposure,sameSide,reasons:reasons.length?reasons:["Portfolio risk acceptable."]};}
}
