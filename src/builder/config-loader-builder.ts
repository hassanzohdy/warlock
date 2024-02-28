import { listFiles } from "@mongez/fs";
import { toCamelCase, ucfirst } from "@mongez/reinforcements";
import { configPath } from "../utils";
import { createAppBuilder } from "./app-builder";

export async function createConfigLoader() {
  // first, get all files from the config directory
  const files = listFiles(configPath(""));

  const { addImport, saveAs, addContent } = createAppBuilder();

  addImport(`import config from "@mongez/config";`);

  // now check for the files
  for (const fileName of files) {
    // get file name without extension
    const file = fileName.replace(".ts", "").replace(".tsx", "");
    if (file === "log") {
      addImport(
        `import logConfigurations from "src/config/log";`,
        `import { setLogConfigurations } from "@mongez/warlock";`,
      );

      addContent(
        `
          // Log configurations
          setLogConfigurations(logConfigurations);
          `,
      );
    } else if (file === "mail") {
      addImport(
        `import mailConfigurations from "src/config/mail";`,
        `import { setMailConfigurations } from "@mongez/warlock";`,
      );

      addContent(
        `
          // Mail Configurations
          setMailConfigurations(mailConfigurations);
          `,
      );
    } else {
      const importFileName = toCamelCase(file) + "Configurations";
      addImport(`import ${importFileName} from "src/config/${file}";`);

      addContent(
        `
          // ${ucfirst(file)} configurations
          config.set("${toCamelCase(file)}", ${importFileName});
          `,
      );
    }
  }

  // TODO: Add config loading events before saving so we can move the following code in another file
  addContent(`    
  const locales = config.get("app.localeCodes", ["en"]);

  for (const locale of locales) {
    if (locale === "en") continue;

    require(\`dayjs/locale/\${locale}\`);
  }
`);

  // now create the file
  await saveAs(configFileLoaderName());

  return `import "./${configFileLoaderName()}";`;
}

export function configFileLoaderName() {
  return "config-loader";
}
