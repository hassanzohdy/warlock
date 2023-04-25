export async function prepareConfigurations() {
  // now we can import the config file using dynamic import
  const { default: loadConfigurations } = await import("config");

  await loadConfigurations();
}
