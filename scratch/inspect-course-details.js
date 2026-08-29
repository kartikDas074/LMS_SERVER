const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  const c46 = await client.query('SELECT * FROM courses WHERE id = 46');
  console.log('Course 46 row:', c46.rows[0]);

  const links = await client.query('SELECT * FROM courses_instructor_lnk WHERE course_id = 46');
  console.log('Instructor links for course 46:', links.rows);

  const docLinks = await client.query('SELECT * FROM courses_documents_lnk WHERE course_id = 46');
  console.log('Doc links for course 46:', docLinks.rows);

  await client.end();
}

run().catch(console.error);
