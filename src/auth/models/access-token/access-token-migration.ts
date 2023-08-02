import { AccessTokenBlueprint } from "./access-token";

export async function accessTokenMigration() {
  await AccessTokenBlueprint.unique("token");
}

accessTokenMigration.down = async () => {
  await AccessTokenBlueprint.dropUniqueIndex("token");
};

accessTokenMigration.blueprint = AccessTokenBlueprint;
