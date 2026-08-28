const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  const roles = await client.query('SELECT * FROM up_roles');
  console.log('All Roles:');
  console.table(roles.rows);

  const links = await client.query(`
    SELECT u.id as user_id, u.username, u.email, r.id as role_id, r.name as role_name, r.type as role_type
    FROM up_users u
    LEFT JOIN up_users_role_lnk l ON l.user_id = u.id
    LEFT JOIN up_roles r ON l.role_id = r.id
  `);
  console.log('\nUsers and Roles:');
  console.table(links.rows);

  await client.end();
}

run().catch(console.error);
