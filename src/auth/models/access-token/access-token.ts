import { Model } from "@mongez/monpulse";

export class AccessToken extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "accessTokens";
}

export const AccessTokenBluePrint = AccessToken.blueprint();
