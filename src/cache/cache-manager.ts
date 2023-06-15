import { dummyCacheDriver } from "./drivers/dummy-cache-driver";
import { CacheDriver } from "./types";

export const cache = dummyCacheDriver;

export function setCacheDriver(cacheDriver?: CacheDriver<any, any>) {
  Object.assign(cache, cacheDriver);
  cache.exists = !!cacheDriver;
}

export async function connectToCache() {
  await cache?.connect();
}
