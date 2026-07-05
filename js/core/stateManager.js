import { Storage } from "./storage.js";

export class StateManager {
  constructor(){
    this.state = {
      settings: Storage.get("aegis_x_settings", {
        startupAmount: 300,
        baseRisk: 0.9,
        maxAllocation: 60,
        maxLeverage: 20,
        maxOpenTrades: 5,
        aggressionMode: "balanced",
        consultationMode: "consultation",
        maxUniverseSymbols: 35,
        feeRate: 0.04,
        manageInterval: 1000,
        minimumEdge: 72,
        scannerTimeframe: "5m",
        chartTimeframe: "5m",
        scanInterval: 10000,
        manageInterval: 3000
      }),
      account: Storage.get("aegis_x_account", {
        balance: 300,
        equity: 300,
        unrealized: 0
      }),
      market: {},
      scanner: [],
      decisions: [],
      openTrades: Storage.get("aegis_x_open_trades", []),
      closedTrades: Storage.get("aegis_x_closed_trades", []),
      memory: Storage.get("aegis_x_memory", {}),
      news: Storage.get("aegis_x_news", { text:"", report:null, sources:[] }),
      historicalCharts: Storage.get("aegis_x_historical_charts", [])
    };
  }

  save(){
    Storage.set("aegis_x_settings", this.state.settings);
    Storage.set("aegis_x_account", this.state.account);
    Storage.set("aegis_x_open_trades", this.state.openTrades);
    Storage.set("aegis_x_closed_trades", this.state.closedTrades);
    Storage.set("aegis_x_memory", this.state.memory);
    Storage.set("aegis_x_news", this.state.news);
    Storage.set("aegis_x_historical_charts", this.state.historicalCharts);
  }

  resetAccount(amount){
    this.state.account = {
      balance: amount,
      equity: amount,
      unrealized: 0
    };
    this.state.openTrades = [];
    this.state.closedTrades = [];
    this.save();
  }
}
