/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
type CacheValue = {
  value: any;
  expiry: number;
};

type CacheHolder = {
  [key: string]: CacheValue;
};

class Cache {
  cache: CacheHolder = {};

  get(key: string): any {
    if (this.cache[key] && this.cache[key].expiry > Date.now()) {
      return this.cache[key].value;
    }

    return undefined;
  }

  set(key: string, value: any, ttl = 0): any {
    this.cache[key] = { value, expiry: Date.now() + ttl };

    return this.cache[key].value;
  }

  delete(key: string): void {
    delete this.cache[key];
  }
}

export default Cache;
