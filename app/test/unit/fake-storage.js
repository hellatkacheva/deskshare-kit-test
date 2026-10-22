// In-memory Web Storage for unit tests; can be told to throw (blocked / quota).
export class FakeStorage {
  constructor(entries = {}) {
    this.map = new Map(Object.entries(entries));
    this.blocked = false;
  }

  #check() {
    if (this.blocked) throw new Error('SecurityError: storage blocked');
  }

  getItem(key) {
    this.#check();
    return this.map.has(key) ? this.map.get(key) : null;
  }

  setItem(key, value) {
    this.#check();
    this.map.set(key, String(value));
  }

  removeItem(key) {
    this.#check();
    this.map.delete(key);
  }
}
