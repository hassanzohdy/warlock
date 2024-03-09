import config from "@mongez/config";
import {
  createSigner,
  createVerifier,
  type Algorithm,
  type SignerOptions,
  type VerifierOptions,
} from "fast-jwt";
import { Request } from "../http";

const getSecretKey = () => config.get("auth.jwt.secret") as string;
const getAlgorithm = () => config.get("auth.jwt.algorithm") as Algorithm;

const getRefreshSecretKey = () =>
  config.get("auth.jwt.refresh.secret") as string;
// Assuming there's a separate config for refresh token validity, for example, '7d' for 7 days
const getRefreshTokenValidity = () =>
  config.get("auth.jwt.refresh.expiresIn") as number | string;

export const jwt = {
  /**
   * Generate a new JWT token for the user.
   * @param payload The payload to encode in the JWT token.
   */
  async generate(
    payload: any,
    {
      key = getSecretKey(),
      algorithm = getAlgorithm(),
      ...options
    }: SignerOptions & { key?: string } = {},
  ): Promise<string> {
    // Create a signer function with predefined options
    const sign = createSigner({ key, ...options, algorithm });

    return sign({ ...payload });
  },

  /**
   * Verify the given token.
   * @param token The JWT token to verify.
   * @returns The decoded token payload if verification is successful.
   */
  async verify(
    token: string | Request,
    {
      key = getSecretKey(),
      algorithms = getAlgorithm() ? [getAlgorithm()] : undefined,
      ...options
    }: VerifierOptions & { key?: string } = {},
  ) {
    const verify = createVerifier({ key, ...options, algorithms });
    if (typeof token !== "string") {
      token = token.authorizationValue;
    }

    return await verify(token as string);
  },

  /**
   * Generate a new refresh token for the user.
   */
  async generateRefreshToken(
    payload: any,
    {
      key = getRefreshSecretKey(),
      expiresIn = getRefreshTokenValidity(),
      algorithm = getAlgorithm(),
      ...options
    }: SignerOptions & { key?: string } = {},
  ): Promise<string> {
    const sign = createSigner({ key, expiresIn, algorithm, ...options });
    return sign({ ...payload });
  },

  /**
   * Verify the given refresh token.
   */
  async verifyRefreshToken(
    token: string,
    {
      key = getRefreshSecretKey(),
      algorithms = [getAlgorithm()],
      ...options
    }: VerifierOptions & { key?: string } = {},
  ) {
    const verify = createVerifier({ key, algorithms, ...options });
    return await verify(token);
  },
};
