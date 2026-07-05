export function emaData(candles, period){
  if(!candles.length) return [];
  const k = 2 / (period + 1);
  let prev = candles[0].close;
  return candles.map((c, i) => {
    prev = i === 0 ? c.close : c.close * k + prev * (1-k);
    return { time: c.time, value: prev };
  });
}

export function emaLast(candles, period){
  const data = emaData(candles, period);
  return data.length ? data.at(-1).value : 0;
}

export function rsiData(candles, period = 14){
  const out = [];
  for(let i = period; i < candles.length; i++){
    let gains = 0;
    let losses = 0;
    for(let j = i - period + 1; j <= i; j++){
      const diff = candles[j].close - candles[j-1].close;
      if(diff >= 0) gains += diff;
      else losses -= diff;
    }
    const value = losses === 0 ? 100 : 100 - (100 / (1 + gains / losses));
    out.push({ time: candles[i].time, value });
  }
  return out;
}

export function rsiLast(candles, period = 14){
  const data = rsiData(candles, period);
  return data.length ? data.at(-1).value : 50;
}

export function atrPct(candles, period = 14){
  if(candles.length < period + 1) return 1;
  const trs = [];
  for(let i = candles.length - period; i < candles.length; i++){
    const c = candles[i];
    const p = candles[i-1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  const atr = trs.reduce((a,b)=>a+b,0) / trs.length;
  return atr / candles.at(-1).close * 100;
}

export function slopePct(candles, lookback = 20){
  const sample = candles.slice(-lookback);
  if(sample.length < 2) return 0;
  return (sample.at(-1).close - sample[0].close) / sample[0].close * 100;
}
