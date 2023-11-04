import { buildHttpForProduction } from "./../starters/build-http-production";

buildHttpForProduction().then(() => {
  process.exit(0);
});
