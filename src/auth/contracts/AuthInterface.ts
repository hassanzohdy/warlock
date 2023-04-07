export interface Authenticable {
  /**
   * Generate access token
   */
  generateAccessToken(): Promise<string>;

  /**
   * Generate refresh token
   */
  generateRefreshToken(): Promise<string>;

  /**
   * Change password
   */
  changePassword(password: string): Promise<void>;

  /**
   * Verify Password
   */
  verifyPassword(password: string): Promise<boolean>;

  /**
   * Get user type
   */
  getUserType(): string;
}
