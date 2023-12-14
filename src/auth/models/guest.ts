import { Document } from "@mongez/monpulse";
import { Auth } from "./auth";

export class Guest extends Auth {
  /**
   * {@inheritDoc}
   */
  public static collection = "guests";

  /**
   * Set the user type key
   * If set to empty string, then it will ignored
   */
  protected userTypeKey = "userType";

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
    if (!this.userTypeKey) return super.embeddedData;
    return {
      ...this.onlyId,
      [this.userTypeKey]: this.userType,
    };
  }

  /**
   * {@inheritDoc}
   */
  public async toJSON() {
    if (!this.userTypeKey) return this.onlyId;

    return {
      ...this.onlyId,
      [this.userTypeKey]: this.userType,
    };
  }
}
