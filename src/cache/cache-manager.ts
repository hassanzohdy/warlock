import { CacheDriver } from "./types";

export const cache = {
  exists: false,
  set: async (_key: string, _value: any) => {
    //
  },
  get: async (_key: string) => {
    //
  },
  remove(_key) {
    //
  },
  connect: async () => {
    //
  },
  removeByNamespace(_namespace) {
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
