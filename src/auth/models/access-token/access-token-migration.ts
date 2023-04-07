import AccessTokenBluePrint from "./access-token-blueprint";

export async function accessTokenMigration() {
  await AccessTokenBluePrint.unique("token");
}

accessTokenMigration.down = async () => {
  await AccessTokenBluePrint.dropUniqueIndex("token");
};

accessTokenMigration.blueprint = AccessTokenBluePrint;
