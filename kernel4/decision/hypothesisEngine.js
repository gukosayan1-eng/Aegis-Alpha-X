
export class HypothesisEngine{
 evaluate(results=[]){
  return {
   long:results.filter(r=>r.recommendation==="BUY"),
   short:results.filter(r=>r.recommendation==="SELL"),
   wait:results.filter(r=>r.recommendation==="WAIT")
  };
 }
}
