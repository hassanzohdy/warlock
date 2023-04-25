import { CacheDriver } from "./types";

export const cache = {} as CacheDriver<any, any>;

export function setCacheDriver(cacheDriver?: CacheDriver<any, any>) {
  Object.assign(cache, cacheDriver);
}

export async function connectToCache() {
  await cache?.connect();
}
