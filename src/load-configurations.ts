export async function prepareConfigurations() {
  // const configPath = path.join(process.cwd(), "src", "config", "index.ts");
  const { default: loadConfigurations } = await import("config");

  await loadConfigurations();
}
