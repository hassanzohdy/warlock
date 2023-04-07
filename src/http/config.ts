import config from "@mongez/config";
import { get } from "@mongez/reinforcements";
import { HttpConfigurations } from "./types";

/**
 * Default http configurations
 */
export const defaultHttpConfigurations: HttpConfigurations = {
  port: 3000,
  host: "0.0.0.0",
  middleware: {
    all: [],
    only: {
      middleware: [],
    },
    except: {
      middleware: [],
    },
  },
};

/**
 * Get http configurations for the given key
 */
export function httpConfig(key: string): any {
  return config.get(`http.${key}`, get(defaultHttpConfigurations, key));
}
