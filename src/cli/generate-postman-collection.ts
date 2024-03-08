import { Postman } from "../postman";

async function main() {
  const postman = new Postman();

  await postman.generate();
}

main();
