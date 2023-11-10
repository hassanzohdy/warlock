import { FastifyJWTOptions } from "@fastify/jwt";
import { Model } from "@mongez/monpulse";

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
  jwt: FastifyJWTOptions;
};
