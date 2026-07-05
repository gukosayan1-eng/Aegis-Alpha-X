
export class TickPipeline{
 constructor(kernel){this.kernel=kernel;}
 async execute(context){
  const engines=this.kernel.engineManager.list();
  const results=[];
  for(const e of engines){
    if(e.status!=="RUNNING") continue;
    results.push(await e.safeUpdate(context));
  }
  return results;
 }
}
