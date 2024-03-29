import { Model } from "@mongez/monpulse";

export class AccessToken extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "accessTokens";
}

export const AccessTokenBlueprint = AccessToken.blueprint();
