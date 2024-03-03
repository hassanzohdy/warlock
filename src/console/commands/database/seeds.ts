import { colors } from "@mongez/copper";
import { connectToDatabase } from "@mongez/monpulse";
import { toSnakeCase } from "@mongez/reinforcements";
import { Command } from "commander";
import glob from "fast-glob";
import path from "path";
import { pathToFileURL } from "url";
import { registerCommand } from "../../commander";
import { Seed } from "./seed";

export function databaseSeedsCommand() {
  return new Command("db:seed")
    .option(
      "--once",
      "If set, the seed will be run only for one time even you run this command multiple times.",
    )
    .option("--fresh", "Clear the previous seeds and run it again.")
    .description(
      "Run database seeds for all modules, make sure each seeds are in `seeds` directory in any module in `src/app` that you want to run seeds for it. ",
    )
    .action(async options => {
      await connectToDatabase();
      if (options.fresh) {
        console.log("Clearing previous seeds...");

        await Seed.delete();
      }

      await seedDatabase(
        process.cwd() + "/src/app/**/seeds/*.ts",
        options.once ?? false,
      );

      process.exit(0);
    });
}

export function seedDatabase(seedsPath: string, once = false) {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async resolve => {
    const files = await glob(path.resolve(seedsPath).replace(/\\/g, "/"));

    // we need to observe the completion of each seed so we can resolve the promise as done
    let completed = 0;
    const totalFiles = files.length;

    for (const file of files) {
      const relativePath = path
        .relative(process.cwd(), file)
        .replaceAll("\\", "/");

      console.log(
        `Collecting Seeds from ${colors.magentaBright(relativePath)}`,
      );

      const modulePath = pathToFileURL(file).href;

      const fileExports = await import(modulePath);

      // count the number of exported functions
      const exportedFunctions = Object.keys(fileExports).length;

      let completedFunctions = 0;

      for (const functionName in fileExports) {
        const functionCallback = fileExports[functionName];

        const seederName = toSnakeCase(functionName, " ");

        const seed = await Seed.first({
          file: relativePath,
          seeder: functionName,
        });

        console.log(`Seeding ${colors.blueBright(seederName)}`);

        if (seed && (once || functionCallback.once)) {
          console.log(`${colors.yellowBright(seederName)} already seeded.`);
          completedFunctions++;

          if (completedFunctions === exportedFunctions) {
            completed++;

            if (completed === totalFiles) {
              resolve(true);
            }
          }

          continue;
        }

        functionCallback()
          .then(async () => {
            if (!seed) {
              await Seed.create({
                file: relativePath,
                seeder: functionName,
                calls: 1,
              });
            } else {
              seed.increment("calls");
              await seed.save();
            }

            console.log(`Seeded ${colors.greenBright(seederName)}`);
            completedFunctions++;

            if (completedFunctions === exportedFunctions) {
              completed++;

              if (completed === totalFiles) {
                console.log("Done");

                resolve(true);
              }
            }
          })
          .catch((error: any) => {
            console.log(`Failed to seed ${colors.redBright(seederName)}`);
            console.log(error);
          });
      }
    }
  });
}

registerCommand(databaseSeedsCommand());
