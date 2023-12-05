export type ProviderData = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string;
};

export class ProviderUser {
  /**
   * Constructor
   */
  public constructor(
    public userData: ProviderData,
    public provider: string,
  ) {
    //
  }

  /**
   * Get user id
   */
  public get id() {
    return this.userData.id;
  }

  /**
   * Get user full name
   */
  public get name() {
    return this.userData.name;
  }

  /**
   * Get user first name
   */
  public get firstName() {
    return this.userData.firstName;
  }

  /**
   * Get user last name
   */
  public get lastName() {
    return this.userData.lastName;
  }

  /**
   * Get user email
   */
  public get email() {
    return this.userData.email;
  }

  /**
   * Get user avatar url
   */
  public get avatarUrl() {
    return this.userData.avatarUrl;
  }
}
