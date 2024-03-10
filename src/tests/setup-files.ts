import { ensureDirectoryAsync } from "@mongez/fs";
import {
  createAppBuilder,
  createBootstrapFile,
  loadEventFiles,
  loadLocalesFiles,
  loadMainFiles,
  loadRoutesFiles,
} from "../builder/app-builder";
import { createConfigLoader } from "../builder/config-loader-builder";
import { warlockPath } from "../utils";

export async function buildTestGlobalSetupFile() {
  const { addImport, saveAs, addContent } = createAppBuilder();

  await ensureDirectoryAsync(warlockPath());

  const data = await Promise.all([
    createBootstrapFile(),
    createConfigLoader(),
    loadMainFiles(),
    loadRoutesFiles(),
    loadEventFiles(),
    loadLocalesFiles(),
  ]);

  addImport(...data);

  await saveAs("test");

  return warlockPath("test.ts");
}
