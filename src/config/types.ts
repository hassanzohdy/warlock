export type WarlockConfigServe = {
  //
};

export type WarlockConfigBuild = {
  /**
   * The path to the output directory.
   *
   * @default "dist"
   */
  outputDir?: string;
  /**
   * Output file name for the application entry point.
   *
   * @default "main.js"
   */
  entryFileName?: string;
};

export type WarlockConfig = {
  /**
   * Development server options
   */
  server?: WarlockConfigServe;
  /**
   * Build Options
   */
  build?: WarlockConfigBuild;
};

export type ResolvedWarlockConfig = {
  /**
   * Development server options
   */
  server: Required<WarlockConfigServe>;
  /**
   * Build Options
   */
  build: Required<WarlockConfigBuild>;
};
