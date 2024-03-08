import config from "@mongez/config";
import { log } from "@mongez/logger";
import { Middleware } from "../router";
import { Request, Response } from "./../http";
import { jwt } from "./jwt";
import { AccessToken } from "./models/access-token";

export function authMiddleware(allowedUserType?: string) {
  const auth: Middleware = async (request: Request, response: Response) => {
    try {
      await jwt.verify(request);

      // use our own jwt verify to verify the token
      const accessToken = await AccessToken.first({
        token: request.authorizationValue,
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

      if (!UserModel) {
        throw new Error(`User type ${userType} is unknown type.`);
      }

      // get user model instance
      const currentUser = await UserModel.find(user.id);

      if (!currentUser) {
        accessToken.destroy();
        return response.unauthorized({
          error: "Unauthorized: Invalid Access Token",
        });
      }

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

  if (allowedUserType) {
    const userAccessTokenKey = `${allowedUserType}AccessToken`;
    const userAccessTokenKeyNameHeader = `${allowedUserType}AccessTokenHeader`;
    auth.postman = {
      onCollectingVariables(variables) {
        if (
          variables.find(
            variable => variable.key === userAccessTokenKeyNameHeader,
          )
        )
          return;

        variables.push({
          key: userAccessTokenKey,
          value: "YOUR_TOKEN_HERE",
        });

        variables.push({
          key: userAccessTokenKeyNameHeader,
          value: `Bearer {{${userAccessTokenKey}}}`,
        });
      },
      onAddingRequest({ request }) {
        request.header.push({
          key: "Authorization",
          value: `{{${userAccessTokenKeyNameHeader}}}`,
        });
      },
    };
  }

  return auth;
}
