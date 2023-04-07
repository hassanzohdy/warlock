import { Response } from "../http";
import { router } from "../router";
import { Guest } from "./models/guest";

export function registerAuthRoutes() {
  // now let's add a guests route in our routes to generate a guest token to our guests.
  router.post("/login/guests", async (_request, response: Response) => {
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
  });
}
