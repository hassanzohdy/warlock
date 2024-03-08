import { registerPostmanCommand } from "../../postman";
import { registerProductionBuildCommand } from "../../starters/start-building-http-production";
import { registerRunProductionServerCommand } from "../../starters/start-http-production-server";
import { registerHttpDevelopmentServerCommand } from "../../starters/start-http-server";
import { registerCommands } from "../commander";
import { registerMigrationCommand } from "./database/migrate";
import { registerDatabaseSeedsCommand } from "./database/seeds";

export function $registerBuiltInCommands() {
  registerCommands([
    registerMigrationCommand(),
    registerDatabaseSeedsCommand(),
    registerHttpDevelopmentServerCommand(),
    registerPostmanCommand(),
    registerRunProductionServerCommand(),
    registerProductionBuildCommand(),
  ]);
}
