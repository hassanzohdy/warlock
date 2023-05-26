import path from "path";

export async function prepareConfigurations() {
  // now we can import the config file using dynamic import
  const configPath = path.join(process.cwd(), "src", "config", "index.ts");
  const { default: loadConfigurations } = await import(configPath);

  await loadConfigurations();
}
