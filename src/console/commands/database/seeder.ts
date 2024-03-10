import { colors } from "@mongez/copper";
import { log } from "@mongez/logger";
import { Seed } from "./seed";

export type SeedOptions = {
  name: string;
  once?: boolean;
  execute: () => Promise<void>;
};

const seedsList: SeedOptions[] = [];

export function seed(options: SeedOptions) {
  seedsList.push(options);
}

export async function startSeeding({ once: baseOnce = false, fresh = false }) {
  if (fresh) {
    log.info(
      "Clearing previous seeds..., this will not clear actual data, but will clear seeds logger",
    );

    await Seed.delete();
  }

  for (const seed of seedsList) {
    const startTime = performance.now();
    const { name, once = baseOnce, execute } = seed;

    log.info("database", "seeder", `Seeding ${colors.pink(name)}`);
    if (once) {
      const seedItem = await Seed.first({ name });

      if (seedItem) {
        const timeTakenInMs = Math.round(performance.now() - startTime);

        log.error(
          "database",
          "seeder",
          `Seed ${colors.pink(name)} already seeded, skipping... (${colors.gray(timeTakenInMs + "ms")})`,
        );
        continue;
      }
    }

    await execute();

    const seedItem = await Seed.findOrCreate(
      { name },
      { name, once, seeds: 0 },
    );

    seedItem.increment("seeds");

    seedItem.save();

    const timeTakenInMs = Math.round(performance.now() - startTime);

    log.success(
      "database",
      "seeder",
      `Seeded ${colors.greenBright(name)} successfully (${colors.gray(timeTakenInMs + "ms")})`,
    );
  }
}
