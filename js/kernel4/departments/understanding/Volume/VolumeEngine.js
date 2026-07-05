import { BaseEngine } from "../../../contracts/baseEngine.js";
import { sma, clamp } from "../_shared/marketMath.js";
export class VolumeEngine4 extends BaseEngine{
  constructor(deps={}){ super({id:"understanding.volume",name:"Volume Intelligence",...deps}); }
  async update(context={}){
    const candles=context.candles||context.market?.candles||[]; const volumes=candles.map(c=>c.volume||0);
    const current=volumes[volumes.length-1]||0, avg20=sma(volumes,20)||current||1, ratio=current/avg20;
    const confirmation=ratio>=1.2, confidence=clamp(confirmation?55+(ratio-1)*35:35);
    return this.result({confidence,uncertainty:clamp(100-confidence),recommendation:confirmation?"CONFIRM":"WEAK_CONFIRMATION",evidence:[{source:this.id,message:`Volume ratio=${ratio.toFixed(2)}x`,strength:confidence}],counterEvidence:!confirmation?[{source:this.id,message:"Volume confirmation weak.",strength:50}]:[],explanation:confirmation?"Volume confirms participation.":"Volume confirmation is weak.",metadata:{current,avg20,ratio}});
  }
}
