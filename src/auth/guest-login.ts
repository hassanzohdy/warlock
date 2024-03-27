import type { Request, Response } from "../http";
import { generateGuestToken } from "./utils/generate-guest-token";

export async function guestLogin(_request: Request, response: Response) {
  return response.send({
    user: await generateGuestToken(),
  });
}
