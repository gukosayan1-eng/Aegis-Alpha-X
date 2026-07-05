import { BaseEngine } from "../../../contracts/baseEngine.js";
import { atr, clamp, pct, last } from "../_shared/marketMath.js";
export class VolatilityEngine4 extends BaseEngine{
  constructor(deps={}){ super({id:"understanding.volatility",name:"Volatility Intelligence",...deps}); }
  async update(context={}){
    const candles=context.candles||context.market?.candles||[]; const latest=last(candles); const a=atr(candles,14);
    const atrPct=latest&&a?Math.abs(pct(latest.close+a,latest.close)):0; let regime="NORMAL";
    if(atrPct>2.5) regime="HIGH"; else if(atrPct<0.45) regime="LOW";
    const confidence=clamp(regime==="NORMAL"?55:70);
    return this.result({confidence,uncertainty:clamp(100-confidence),recommendation:regime==="HIGH"?"REDUCE_RISK":"ALLOW",evidence:[{source:this.id,message:`ATR%=${atrPct.toFixed(3)} volatility=${regime}`,strength:confidence}],explanation:`Volatility regime is ${regime}.`,metadata:{atr:a,atrPct,regime}});
  }
}
