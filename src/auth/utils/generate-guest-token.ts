import config from "@mongez/config";
import { Guest } from "./../models/guest";

export async function generateGuestToken() {
  const GuestModel: typeof Guest = config.get(`auth.userType.guest`) || Guest;

  const guest = await GuestModel.create({
    userType: "guest",
  });

  return {
    // use our own jwt generator to generate a token for the guest
    accessToken: await guest.generateAccessToken(),
    ...(await guest.toJSON()),
  };
}
