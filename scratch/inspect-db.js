const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  const userLinks = await client.query('SELECT * FROM up_users_role_lnk WHERE user_id = 13');
  console.log('User 13 links:', userLinks.rows);

  // Give user 13 Admin Panel role (id 7) or Content Manager (id 8)
  await client.query('DELETE FROM up_users_role_lnk WHERE user_id = 13');
  await client.query('INSERT INTO up_users_role_lnk (user_id, role_id) VALUES (13, 7)');
  console.log('User 13 assigned to role 7 (Admin Panel)');

  // Let's also check permissions for role 7 and role 8
  const perms = await client.query(`
    SELECT p.id, p.action, r.id as role_id, r.name as role_name
    FROM up_permissions p
    JOIN up_permissions_role_lnk l ON l.permission_id = p.id
    JOIN up_roles r ON l.role_id = r.id
    WHERE p.action LIKE '%blog%'
  `);
  console.log('Blog permissions count:', perms.rows.length);
  console.log('Blog permissions:', perms.rows);

  await client.end();
}

run().catch(console.error);
