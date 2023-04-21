import { Request, Response } from "../http";
import { Guest } from "./models/guest";

export async function guestLogin(_request: Request, response: Response) {
  // generate a new guest first
  const guest = await Guest.create({
    userType: "guest",
  });

  return response.send({
    user: {
      // use our own jwt generator to generate a token for the guest
      accessToken: await guest.generateAccessToken(),
      userType: guest.userType,
    },
  });
}
