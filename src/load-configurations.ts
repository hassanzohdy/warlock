// config loader returns a dynamic import with default export function
export type ConfigurationsLoader = () => Promise<{ default: () => void }>;

export async function prepareConfigurations(config: ConfigurationsLoader) {
  // const configPath = path.join(process.cwd(), "src", "config", "index.ts");
  const { default: loadConfigurations } = await config();

  await loadConfigurations();
}
