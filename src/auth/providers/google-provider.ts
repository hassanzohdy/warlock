import { OAuth2Client } from "google-auth-library";
import { ProviderUser } from "./provider-user";

export type GoogleProviderConfigurations = {
  /**
   * Client id
   */
  clientId?: string;
  /**
   * Redirect url
   */
  redirectUrl?: string;
  /**
   * Scope
   */
  scope?: string;
  /**
   * Profile url
   */
  profileUrl?: string;
};

export class GoogleProvider {
  /**
   * scope url
   */
  protected scope = "https://www.googleapis.com/auth/userinfo.email";

  /**
   * Redirect url
   */
  protected redirectUrl = "";

  /**
   * profile url
   */
  protected profileUrl = "https://www.googleapis.com/oauth2/v3/userinfo";

  /**
   * Provider name
   */
  public provider = "google";

  /**
   * Client id
   */
  protected clientId = "";

  /**
   * User profile instance
   */
  protected data?: ProviderUser;

  /**
   * Constructor
   */
  public constructor(providerOptions: GoogleProviderConfigurations) {
    //
    if (providerOptions.clientId) {
      this.clientId = providerOptions.clientId;
    }

    if (providerOptions.redirectUrl) {
      this.redirectUrl = providerOptions.redirectUrl;
    }

    if (providerOptions.scope) {
      this.scope = providerOptions.scope;
    }

    if (providerOptions.profileUrl) {
      this.profileUrl = providerOptions.profileUrl;
    }
  }

  /**
   * Set redirect url
   */
  public setRedirectUrl(url: string) {
    this.redirectUrl = url;

    return this;
  }

  /**
   * Get redirect url
   */
  public getRedirectUrl() {
    return this.redirectUrl;
  }

  /**
   * Get profile url
   */
  public getProfileUrl() {
    return this.profileUrl;
  }

  /**
   * Set profile url
   */
  public setProfileUrl(url: string) {
    this.profileUrl = url;

    return this;
  }

  /**
   * Get scope
   */
  public getScope() {
    return this.scope;
  }

  /**
   * Set scope
   */
  public setScope(scope: string) {
    this.scope = scope;

    return this;
  }

  /**
   * Get client id
   */
  public getClientId() {
    return this.clientId;
  }

  /**
   * Set client id
   */
  public setClientId(clientId: string) {
    this.clientId = clientId;

    return this;
  }

  /**
   * Login
   */
  public async login(code: string) {
    const provider = new OAuth2Client();

    provider.setCredentials({
      access_token: code,
    });

    const { data } = (await provider.request({
      url: this.profileUrl,
      headers: {
        Authorization: `Bearer ${code}`,
      },
    })) as any;

    data.avatarUrl = data.picture;

    data.id = data.sub;

    data.firstName = data.given_name;
    data.lastName = data.family_name;

    this.data = new ProviderUser(data, this.provider);

    return this.data;
  }

  /**
   * Logout the user
   */
  public async logout(accessToken: string) {
    const provider = new OAuth2Client();

    provider.setCredentials({
      access_token: accessToken,
    });

    await provider.revokeToken(accessToken);

    return true;
  }
}
