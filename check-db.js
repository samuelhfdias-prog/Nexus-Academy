import { createClient } from "@libsql/client";

async function run() {
  const client = createClient({ url: "file:./sqlite.db" });
  const result = await client.execute("SELECT * FROM users;");
  console.log("Users in DB:", result.rows);
}

run().catch(console.error);
