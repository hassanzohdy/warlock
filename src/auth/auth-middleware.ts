import config from "@mongez/config";
import { log } from "@mongez/logger";
import { Request, Response } from "./../http";
import { jwt } from "./jwt";
import { AccessToken } from "./models/access-token";

export function authMiddleware(allowedUserType?: string) {
  return async function auth(request: Request, response: Response) {
    try {
      // use our own jwt verify to verify the token
      await jwt.verify(request);

      const accessToken = await AccessToken.first({
        token: request.authorizationValue(),
      });

      if (!accessToken) {
        return response.unauthorized({
          error: "Unauthorized: Invalid Access Token",
        });
      }

      // get current user
      const user: any = request.baseRequest.user;
      // now, we need to get an instance of user using its corresponding model
      const userType = user.userType || accessToken.get("userType");

      // check if the user type is allowed
      if (allowedUserType && userType !== allowedUserType) {
        return response.unauthorized({
          error: "You are not allowed to access this resource",
        });
      }

      // get user model class
      const UserModel = config.get(`auth.userType.${userType}`);

      // get user model instance
      const currentUser = await UserModel.find(user.id);

      // set current user
      request.user = currentUser;
    } catch (err) {
      log.error("http", "auth", err);

      // unset current user

      return response.unauthorized({
        error: "Unauthorized: Invalid Access Token",
      });
    }
  };
}
