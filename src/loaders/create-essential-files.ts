import { ensureDirectory, listFiles, putFile } from "@mongez/fs";
import { toCamelCase, ucfirst } from "@mongez/reinforcements";
import prettier from "prettier";
import { configPath, warlockPath } from "../utils";

export async function createEssentialFiles() {
  ensureDirectory(warlockPath());

  putFile(
    warlockPath("bootstrap.ts"),
    `import { bootstrap } from "@mongez/warlock";\n bootstrap();`,
  );

  await createConfigLoader();

  // putFile(
  //   warlockPath("config-loader.ts"),
  //   `import loadConfigurations from "src/config";\nloadConfigurations();`,
  // );

  putFile(
    warlockPath("start-http-application.ts"),
    'import { startHttpApplication } from "@mongez/warlock"; startHttpApplication();',
  );
}

export async function createConfigLoader() {
  // first, get all files from the config directory
  const files = listFiles(configPath(""));

  const fileContents: string[] = [];

  const imports: string[] = [`import config from "@mongez/config";`];

  let hasIndex = false;

  // now check for the files
  for (const fileName of files) {
    // get file name without extension
    const file = fileName.replace(".ts", "").replace(".tsx", "");

    if (file === "index") {
      imports.push(`import loadConfigurations from "src/config";`);
      hasIndex = true;
      continue;
    } else if (file === "log") {
      imports.push(
        `import logConfigurations from "src/config/log";`,
        `import { setLogConfigurations } from "@mongez/warlock";`,
      );

      fileContents.push(
        `
        // Log configurations
        setLogConfigurations(logConfigurations);
        `,
      );
    } else if (file === "database") {
      imports.push(
        `import databaseConfigurations from "src/config/database";`,
        `import { setDatabaseConfigurations } from "@mongez/monpulse";`,
      );

      fileContents.push(
        `
        // Database configurations
        setDatabaseConfigurations(databaseConfigurations);
        `,
      );
    } else if (file === "mail") {
      imports.push(
        `import mailConfigurations from "src/config/mail";`,
        `import { setMailConfigurations } from "@mongez/warlock";`,
      );

      fileContents.push(
        `
        // Mail Configurations
        setMailConfigurations(mailConfigurations);
        `,
      );
    } else if (file === "cache") {
      imports.push(
        `import cacheConfigurations from "src/config/cache";`,
        `import { cache } from "@mongez/warlock";`,
      );

      fileContents.push(
        `
        // Cache configurations
        cache.setCacheConfigurations(cacheConfigurations);
        `,
      );
    } else {
      const importFileName = toCamelCase(file) + "Configurations";
      imports.push(`import ${importFileName} from "src/config/${file}";`);

      fileContents.push(
        `
        // ${ucfirst(file)} configurations
        config.set("${toCamelCase(file)}", ${importFileName});
        `,
      );
    }
  }

  // now create the file
  putFile(
    warlockPath(configFileLoaderName() + ".ts"),
    await prettier.format(
      imports.join("\n") +
        fileContents.join("\n") +
        (hasIndex ? "\nloadConfigurations();" : ""),
      {
        parser: "typescript",
      },
    ),
  );
}

export function configFileLoaderName() {
  return "config-loader";
}
