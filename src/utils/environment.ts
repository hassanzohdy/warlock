export type Environment = "development" | "production" | "test";

export function environment(): Environment {
  return (process.env.NODE_ENV as Environment) || "development";
}
