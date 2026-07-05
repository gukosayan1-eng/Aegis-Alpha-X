import { BaseEngine } from "../../../contracts/baseEngine.js";
import { clamp } from "../_shared/marketMath.js";
export class StructureEngine4 extends BaseEngine{
  constructor(deps={}){ super({id:"understanding.structure",name:"Structure Intelligence",...deps}); }
  async update(context={}){
    const candles=context.candles||context.market?.candles||[]; const recent=candles.slice(-30);
    if(recent.length<10) return this.result({uncertainty:100,recommendation:"WAIT",explanation:"Not enough candles for structure analysis."});
    const highs=recent.map(c=>c.high), lows=recent.map(c=>c.low);
    const higherHigh=highs[highs.length-1]>Math.max(...highs.slice(0,-1)), lowerLow=lows[lows.length-1]<Math.min(...lows.slice(0,-1));
    let recommendation="WAIT"; if(higherHigh&&!lowerLow) recommendation="LONG_STRUCTURE"; if(lowerLow&&!higherHigh) recommendation="SHORT_STRUCTURE";
    const confidence=clamp((higherHigh||lowerLow)?68:42);
    return this.result({confidence,uncertainty:clamp(100-confidence),recommendation,evidence:[{source:this.id,message:`higherHigh=${higherHigh} lowerLow=${lowerLow}`,strength:confidence}],explanation:`Structure condition: ${recommendation}.`,metadata:{higherHigh,lowerLow}});
  }
}
