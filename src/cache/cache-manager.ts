import { CacheDriver } from "./types";

export const cache = {
  exists: false,
  set: async (_key: string, _value: any) => {
    //
  },
  get: async (_key: string) => {
    //
  },
  async flush() {
    //
  },
  remove(_key: string) {
    //
  },
  connect: async () => {
    //
  },
  parseKey(_key) {
    //
  },
  removeByNamespace(_namespace: string) {
    //
  },
} as CacheDriver<any, any> & {
  exists: boolean;
};

export function setCacheDriver(cacheDriver?: CacheDriver<any, any>) {
  Object.assign(cache, cacheDriver);
  cache.exists = !!cacheDriver;
}

export async function connectToCache() {
  await cache?.connect();
}
