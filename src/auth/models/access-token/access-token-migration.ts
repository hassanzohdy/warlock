import { AccessTokenBluePrint } from "./access-token";

export async function accessTokenMigration() {
  await AccessTokenBluePrint.unique("token");
}

accessTokenMigration.down = async () => {
  await AccessTokenBluePrint.dropUniqueIndex("token");
};

accessTokenMigration.blueprint = AccessTokenBluePrint;
