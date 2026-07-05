export class BaseEngine {
  constructor(name){
    this.name = name;
  }

  report({ confidence = 50, recommendation = "NEUTRAL", observations = [], supporting = [], contradicting = [] }){
    return {
      engine: this.name,
      confidence,
      recommendation,
      observations,
      supporting,
      contradicting,
      uncertainty: Math.max(0, 100 - confidence)
    };
  }
}
