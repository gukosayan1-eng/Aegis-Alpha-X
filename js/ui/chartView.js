import { emaData, rsiData } from "../market/indicators.js";

export class ChartView {
  constructor(bus){
    this.bus = bus;
    this.candles = [];
    this.init();
    this.bus.on("chart:history", ({ candles }) => this.setHistory(candles));
    this.bus.on("chart:candle", ({ candle }) => this.updateCandle(candle));
    window.addEventListener("resize", () => this.resize());
    setInterval(() => this.renderAll(), 5000);
  }

  options(){
    return {
      layout:{ background:{ color:"#020617" }, textColor:"#cbd5e1" },
      grid:{ vertLines:{ color:"rgba(148,163,184,.08)" }, horzLines:{ color:"rgba(148,163,184,.08)" } },
      timeScale:{ timeVisible:true, secondsVisible:false },
      crosshair:{ mode:LightweightCharts.CrosshairMode.Normal }
    };
  }

  init(){
    this.chart = LightweightCharts.createChart(document.getElementById("priceChart"), this.options());
    this.volumeChart = LightweightCharts.createChart(document.getElementById("volumeChart"), this.options());
    this.rsiChart = LightweightCharts.createChart(document.getElementById("rsiChart"), this.options());

    this.candleSeries = this.chart.addCandlestickSeries({
      upColor:"#22c55e", downColor:"#ef4444",
      borderUpColor:"#22c55e", borderDownColor:"#ef4444",
      wickUpColor:"#22c55e", wickDownColor:"#ef4444"
    });
    this.ema21 = this.chart.addLineSeries({ color:"#22d3ee", lineWidth:2 });
    this.ema200 = this.chart.addLineSeries({ color:"#a78bfa", lineWidth:2 });
    this.volumeSeries = this.volumeChart.addHistogramSeries({ priceFormat:{ type:"volume" } });
    this.rsiSeries = this.rsiChart.addLineSeries({ color:"#facc15", lineWidth:2 });
    this.resize();
  }

  resize(){
    const p = document.getElementById("priceChart"), v = document.getElementById("volumeChart"), r = document.getElementById("rsiChart");
    if(p) this.chart.applyOptions({ width:p.clientWidth, height:p.clientHeight });
    if(v) this.volumeChart.applyOptions({ width:v.clientWidth, height:v.clientHeight });
    if(r) this.rsiChart.applyOptions({ width:r.clientWidth, height:r.clientHeight });
  }

  setHistory(candles){ this.candles = candles; this.renderAll(); }

  updateCandle(candle){
    if(this.candles.length && this.candles.at(-1).time === candle.time) this.candles[this.candles.length-1] = candle;
    else { this.candles.push(candle); if(this.candles.length > 700) this.candles.shift(); }
    this.renderAll();
  }

  renderAll(){
    if(!this.candles.length) return;
    this.resize();
    this.candleSeries.setData(this.candles.map(c=>({ time:c.time, open:c.open, high:c.high, low:c.low, close:c.close })));
    this.ema21.setData(emaData(this.candles, 21));
    this.ema200.setData(emaData(this.candles, 200));
    this.volumeSeries.setData(this.candles.map(c=>({ time:c.time, value:c.volume, color:c.close >= c.open ? "rgba(34,197,94,.45)" : "rgba(239,68,68,.45)" })));
    this.rsiSeries.setData(rsiData(this.candles));
  }
}
