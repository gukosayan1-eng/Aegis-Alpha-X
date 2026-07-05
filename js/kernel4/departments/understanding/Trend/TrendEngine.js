import { BaseEngine } from "../../../contracts/baseEngine.js";
import { ema, slope, clamp } from "../_shared/marketMath.js";
export class TrendEngine4 extends BaseEngine{
  constructor(deps={}){ super({id:"understanding.trend",name:"Trend Intelligence",...deps}); }
  async update(context={}){
    const candles=context.candles||context.market?.candles||[]; const closes=candles.map(c=>c.close);
    const ema20=ema(closes,20), ema50=ema(closes,50), ema200=ema(closes,200), trendSlope=slope(closes,30);
    let recommendation="WAIT", confidence=0;
    if(ema20&&ema50&&ema200){
      if(ema20>ema50&&ema50>ema200&&trendSlope>0){recommendation="LONG"; confidence=clamp(55+Math.abs(trendSlope)*80);}
      else if(ema20<ema50&&ema50<ema200&&trendSlope<0){recommendation="SHORT"; confidence=clamp(55+Math.abs(trendSlope)*80);}
      else confidence=clamp(35+Math.abs(trendSlope)*35);
    }
    return this.result({confidence,uncertainty:clamp(100-confidence),recommendation,evidence:[{source:this.id,message:`EMA alignment / slope ${trendSlope.toFixed(4)}`,strength:confidence}],counterEvidence:recommendation==="WAIT"?[{source:this.id,message:"Trend alignment incomplete.",strength:60}]:[],explanation:`Trend recommends ${recommendation}.`,metadata:{ema20,ema50,ema200,trendSlope}});
  }
}
