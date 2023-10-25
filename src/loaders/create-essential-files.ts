import { ensureDirectory, putFile } from "@mongez/fs";
import { warlockPath } from "../utils";

export function createEssentialFiles() {
  ensureDirectory(warlockPath());

  putFile(
    warlockPath("bootstrap.ts"),
    `import { bootstrap } from "@mongez/warlock";\n bootstrap();`,
  );

  putFile(
    warlockPath("config-loader.ts"),
    `import loadConfigurations from "src/config";\nloadConfigurations();`,
  );

  putFile(
    warlockPath("start-http-application.ts"),
    'import { startHttpApplication } from "@mongez/warlock"; startHttpApplication();',
  );
}
