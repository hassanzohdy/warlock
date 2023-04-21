import path from "path";

export async function prepareConfigurations() {
  const rootDir = process.cwd();
  const configFile = path.join(rootDir, "src/config/index.ts");

  // now we can import the config file using dynamic import
  const { loadConfigurations } = await import(configFile);

  await loadConfigurations();
}
