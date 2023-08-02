import config from "@mongez/config";
import { AWSConnectionOptions } from ".";

export async function getAWSConfigurations(): Promise<
  AWSConnectionOptions | undefined
> {
  const awsConfigurations = config.get("uploads.aws.connectionOptions");

  if (!awsConfigurations) return;

  return typeof awsConfigurations === "function"
    ? await awsConfigurations()
    : awsConfigurations;
}

export async function getAWSConfig(key: keyof AWSConnectionOptions) {
  const configurations = await getAWSConfigurations();

  if (!configurations) return;

  return configurations[key];
}
