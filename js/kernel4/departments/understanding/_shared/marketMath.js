export function last(candles){ return candles?.[candles.length - 1] || null; }
export function sma(values, period){ if(!values || values.length < period) return null; const s=values.slice(-period); return s.reduce((a,b)=>a+b,0)/period; }
export function ema(values, period){ if(!values || values.length < period) return null; const k=2/(period+1); let out=values.slice(0,period).reduce((a,b)=>a+b,0)/period; for(let i=period;i<values.length;i++) out=values[i]*k+out*(1-k); return out; }
export function atr(candles, period=14){ if(!candles || candles.length < period+1) return null; const trs=[]; for(let i=1;i<candles.length;i++){const c=candles[i],p=candles[i-1]; trs.push(Math.max(c.high-c.low, Math.abs(c.high-p.close), Math.abs(c.low-p.close)));} return sma(trs,period); }
export function pct(a,b){ return b ? ((a-b)/b)*100 : 0; }
export function slope(values, lookback=20){ if(!values || values.length < lookback) return 0; return pct(values[values.length-1], values[values.length-lookback]) / lookback; }
export function clamp(n,min=0,max=100){ return Math.max(min, Math.min(max, n)); }
export function rsi(closes, period=14){ if(!closes || closes.length < period+1) return 50; let g=0,l=0; for(let i=closes.length-period;i<closes.length;i++){const d=closes[i]-closes[i-1]; if(d>=0) g+=d; else l-=d;} if(l===0) return 100; const rs=g/l; return 100-(100/(1+rs)); }
