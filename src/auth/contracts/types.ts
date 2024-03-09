import { type Model } from "@mongez/monpulse";
import { type Algorithm } from "fast-jwt";

export type AuthConfigurations = {
  /**
   * Define all user types
   * This is important to differentiate between user types when validating and generating tokens
   */
  userType: {
    [userType: string]: typeof Model;
  };
  /**
   * JWT configurations
   */
  jwt: {
    secret: string;
    algorithm?: Algorithm;
    refresh?: {
      secret?: string;
      expiresIn?: number | string;
    };
  };
};
