const { Client } = require("pg");

const connectionString = "postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

async function run() {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query("SELECT id, name, type, description FROM up_roles;");
    console.log("Roles in Database:");
    console.log(res.rows);
  } catch (err) {
    console.error("Database query failed:", err);
  } finally {
    await client.end();
  }
}

run();
