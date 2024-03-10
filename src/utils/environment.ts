export type Environment = "development" | "production" | "test";

export function environment(): Environment {
  return (process.env.NODE_ENV as Environment) || "development";
}

export function setEnvironment(env: Environment) {
  process.env.NODE_ENV = env;
}
