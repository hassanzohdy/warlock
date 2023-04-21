import { Casts, Model } from "@mongez/mongodb";

export class Seed extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "seeds";

  /**
   * {@inheritDoc}
   */
  protected casts: Casts = {
    file: "string",
    seeder: "string",
    calls: "number",
  };
}
