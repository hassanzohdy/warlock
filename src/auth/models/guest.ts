import { Document } from "@mongez/mongodb";
import { Auth } from "./auth";

export class Guest extends Auth {
  /**
   * {@inheritDoc}
   */
  public static collection = "guests";

  /**
   * Get user type
   */
  public get userType(): string {
    return "guest";
  }

  /**
   * {@inheritDoc}
   */
  public get embeddedData(): Document {
    return {
      ...this.only(["id"]),
      userType: this.userType,
    };
  }

  /**
   * {@inheritDoc}
   */
  public async toJSON() {
    return {
      ...this.only(["id"]),
      userType: this.userType,
    } as any;
  }
}
