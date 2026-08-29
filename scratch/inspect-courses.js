const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  const courses = await client.query('SELECT id, document_id, title, published_at, locale FROM courses');
  console.log('Courses in DB:', courses.rows);

  await client.end();
}

run().catch(console.error);
