import { WarlockConfig } from "./types";

export const defaultWarlockConfigurations: WarlockConfig = {
  build: {
    outputDir: process.cwd() + "/dist",
    entryFileName: "app.js",
  },
};
