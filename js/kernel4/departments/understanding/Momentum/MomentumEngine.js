import { BaseEngine } from "../../../contracts/baseEngine.js";
import { rsi, ema, clamp } from "../_shared/marketMath.js";
export class MomentumEngine4 extends BaseEngine{
  constructor(deps={}){ super({id:"understanding.momentum",name:"Momentum Intelligence",...deps}); }
  async update(context={}){
    const candles=context.candles||context.market?.candles||[]; const closes=candles.map(c=>c.close);
    const value=rsi(closes,14), fast=ema(closes,12), slow=ema(closes,26), macd=fast!=null&&slow!=null?fast-slow:0;
    let recommendation="WAIT"; if(value>58&&macd>0) recommendation="LONG"; if(value<42&&macd<0) recommendation="SHORT";
    const confidence=clamp(Math.abs(value-50)*2+Math.min(Math.abs(macd),5)*8);
    return this.result({confidence,uncertainty:clamp(100-confidence),recommendation,evidence:[{source:this.id,message:`RSI=${value.toFixed(1)} MACD=${macd.toFixed(4)}`,strength:confidence}],counterEvidence:value>70||value<30?[{source:this.id,message:"Momentum may be extended.",strength:45}]:[],explanation:`Momentum recommends ${recommendation}.`,metadata:{rsi:value,macd}});
  }
}
