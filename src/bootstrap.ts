import config from "@mongez/config";
import { colors } from "@mongez/copper";
import { loadEnv } from "@mongez/dotenv";
import { captureAnyUnhandledRejection } from "@mongez/logger";
import { initializeDayjs } from "@mongez/time-wizard";
import { environment } from "./utils/environment";

export async function bootstrap() {
  const env = environment();
  const envColor = (env: string) => {
    switch (env) {
      case "development":
        return colors.yellow(env);
      case "production":
        return colors.green(env);
      case "test":
        return colors.magentaBright(env);
    }
  };
  console.log(
    colors.blueBright("ℹ"),
    colors.yellow(`(${new Date().toISOString()})`),
    colors.orange("[warlock]"),
    colors.magenta(`bootstrap`),
    colors.blueBright(`Starting application in ${envColor(env)} mode`),
  );

  loadEnv();
  initializeDayjs();
  captureAnyUnhandledRejection();

  setTimeout(async () => {
    const locales = config.get("app.localeCodes", ["en"]);

    for (const locale of locales) {
      if (locale === "en") continue;

      require(`dayjs/locale/${locale}`);
    }
  }, 0);
}
