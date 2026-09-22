const bcrypt = require("bcrypt");

async function generateHash() {
  const password = "kunal@7015185597";

  const hash = await bcrypt.hash(password, 10);

  console.log(hash);
}

generateHash();