import { buildHttpForProduction } from "./build-http-production";

buildHttpForProduction().then(() => {
  process.exit(0);
});
