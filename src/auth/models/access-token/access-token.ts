import { Model } from "@mongez/mongodb";

export class AccessToken extends Model {
  /**
   * {@inheritDoc}
   */
  public static collection = "accessTokens";
}

export const AccessTokenBluePrint = AccessToken.blueprint();
