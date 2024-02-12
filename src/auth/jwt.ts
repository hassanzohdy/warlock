import type { SignOptions, SignPayloadType } from "@fastify/jwt";
import { Request, getServer } from "../http";

export const jwt = {
  /**
   * Generate a new JWT token for the user
   */
  async generate(payload: SignPayloadType, options?: SignOptions) {
    return getServer()?.jwt.sign(payload, options) as string;
  },
  /**
   * Verify Current token from request which will be in the `Authorization` header
   */
  async verify(data: Request | string) {
    if (typeof data === "string") {
      return getServer()?.jwt.verify(data);
    }

    return await data.baseRequest.jwtVerify();
  },
};
