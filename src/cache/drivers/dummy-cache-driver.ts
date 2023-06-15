import { CacheDriver } from "../types";

export const dummyCacheDriver = {
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
