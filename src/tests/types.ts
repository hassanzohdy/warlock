export type TestsConfigurations = {
  /**
   * Whether to enable database in testing environment
   * If enabled, make sure to use `.env.test` file to set the database configurations, otherwise it will use the default database configurations
   *
   * @default true
   */
  database?: boolean;
};
