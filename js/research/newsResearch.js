export class NewsResearch {
  constructor({ bus, state, logger }){
    this.bus = bus;
    this.state = state;
    this.logger = logger;
    this.trustedDomains = ["reuters.com","bloomberg.com","cnbc.com","coindesk.com","cointelegraph.com","theblock.co","decrypt.co","sec.gov","federalreserve.gov","binance.com","coinbase.com","kraken.com","okx.com","bybit.com"];
  }

  async research(query = "bitcoin OR crypto OR ethereum OR solana market"){
    const results = [];
    try { results.push(...await this.fetchGdelt(query)); } catch(error){ this.logger.line("GDELT news fetch failed: " + error.message); }
    try { results.push(...await this.fetchCryptoCompare()); } catch(error){ this.logger.line("CryptoCompare news fetch failed: " + error.message); }
    const sources = this.dedupe(results).slice(0, 25);
    const report = this.scoreNews(sources);
    this.state.state.news = { text: sources.map(x=>x.title).join("\n"), report, sources };
    this.state.save();
    this.bus.emit("news:researched", { report, sources, updatedAt:Date.now() });
    this.bus.emit("log:add", { time:new Date().toLocaleTimeString(), message:`News research completed. Sources ${sources.length}. Risk ${report.risk}. Direction ${report.direction}.` });
    this.bus.emit("agent:scan_once");
    return { report, sources };
  }

  async fetchGdelt(query){
    const url = "https://api.gdeltproject.org/api/v2/doc/doc?query=" + encodeURIComponent(query) + "&mode=ArtList&format=json&maxrecords=20&sort=HybridRel";
    const res = await fetch(url, { cache:"no-store" });
    if(!res.ok) throw new Error("GDELT " + res.status);
    const data = await res.json();
    return (data.articles || []).map(a => ({ title:a.title||"", url:a.url||"", source:a.domain||this.domainFromUrl(a.url), publishedAt:a.seendate||"", snippet:a.title||"", provider:"GDELT" }));
  }

  async fetchCryptoCompare(){
    const res = await fetch("https://min-api.cryptocompare.com/data/v2/news/?lang=EN", { cache:"no-store" });
    if(!res.ok) throw new Error("CryptoCompare " + res.status);
    const data = await res.json();
    return (data.Data || []).slice(0,20).map(a => ({ title:a.title||"", url:a.url||"", source:a.source_info?.name||this.domainFromUrl(a.url), publishedAt:a.published_on ? new Date(a.published_on*1000).toISOString() : "", snippet:a.body||a.title||"", provider:"CryptoCompare" }));
  }

  dedupe(items){
    const seen = new Set(), out = [];
    for(const item of items){
      const key = (item.title||"").toLowerCase().replace(/[^a-z0-9]/g,"").slice(0,90);
      if(!key || seen.has(key)) continue;
      seen.add(key);
      out.push({ ...item, credibility:this.credibility(item) });
    }
    return out;
  }

  domainFromUrl(url){ try { return new URL(url).hostname.replace("www.",""); } catch { return "unknown"; } }

  credibility(item){
    const src = (item.source || "").toLowerCase();
    const urlDomain = this.domainFromUrl(item.url || "").toLowerCase();
    const domain = src.includes(".") ? src : urlDomain;
    if(["sec.gov","federalreserve.gov"].some(d=>domain.includes(d))) return 98;
    if(this.trustedDomains.some(d=>domain.includes(d))) return 90;
    if(item.provider === "GDELT") return 70;
    if(item.provider === "CryptoCompare") return 62;
    return 50;
  }

  scoreNews(items){
    const text = items.map(i => `${i.title} ${i.snippet}`).join(" ").toLowerCase();
    const bullish = ["approved","approval","rate cut","cuts rates","inflows","adoption","partnership","institutional","accumulation","etf inflow","record inflows","halving","easing"];
    const bearish = ["hack","exploit","lawsuit","sec sues","ban","crackdown","outflows","rate hike","inflation hot","war","liquidation","bankruptcy","fraud","depeg","exchange down","investigation"];
    const urgent = ["breaking","urgent","hack","exploit","war","depeg","liquidation","bankruptcy","sues","crackdown"];
    const bullScore = bullish.reduce((a,k)=>a+(text.includes(k)?1:0),0);
    const bearScore = bearish.reduce((a,k)=>a+(text.includes(k)?1:0),0);
    const urgencyScore = urgent.reduce((a,k)=>a+(text.includes(k)?1:0),0);
    const avgCredibility = items.length ? items.reduce((a,i)=>a+i.credibility,0)/items.length : 0;
    let direction = "NEUTRAL";
    if(bullScore > bearScore) direction = "BULLISH";
    if(bearScore > bullScore) direction = "BEARISH";
    if(bearScore === bullScore && bearScore > 0) direction = "UNCLEAR/RISK";
    const impact = Math.min(100, Math.max(bullScore,bearScore)*18 + urgencyScore*10);
    const risk = Math.min(100, bearScore*22 + urgencyScore*16 + (avgCredibility < 55 ? 15 : 0) + (direction === "UNCLEAR/RISK" ? 20 : 0));
    const confidence = Math.min(95, 25 + Math.abs(bullScore-bearScore)*15 + avgCredibility*.45);
    return { direction, impact:Math.round(impact), risk:Math.round(risk), urgency:urgencyScore >= 2 ? "Immediate" : urgencyScore === 1 ? "Fast" : "Slow/Background", confidence:Math.round(confidence), credibility:Math.round(avgCredibility), sourceCount:items.length, summary:`Web news direction ${direction}, impact ${Math.round(impact)}, risk ${Math.round(risk)}, credibility ${Math.round(avgCredibility)}, sources ${items.length}.` };
  }
}
