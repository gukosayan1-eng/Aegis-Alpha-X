export class Storage {
  static get(key, fallback){
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  static set(key, value){
    localStorage.setItem(key, JSON.stringify(value));
  }
}
