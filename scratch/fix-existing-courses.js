const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  const res = await client.query("UPDATE courses SET locale = 'en' WHERE locale IS NULL");
  console.log(`Updated ${res.rowCount} courses with locale = 'en'`);

  await client.end();
}

run().catch(console.error);
