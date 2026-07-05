import { TrendEngine4 } from "./Trend/TrendEngine.js";
import { MomentumEngine4 } from "./Momentum/MomentumEngine.js";
import { VolatilityEngine4 } from "./Volatility/VolatilityEngine.js";
import { VolumeEngine4 } from "./Volume/VolumeEngine.js";
import { StructureEngine4 } from "./Structure/StructureEngine.js";
export function registerUnderstandingEngines(kernel4){
  const deps={eventBus:kernel4.eventBus,state:kernel4.state,logger:kernel4.logger};
  const engines=[new TrendEngine4(deps),new MomentumEngine4(deps),new VolatilityEngine4(deps),new VolumeEngine4(deps),new StructureEngine4(deps)];
  for(const e of engines) kernel4.register(e);
  return engines;
}
