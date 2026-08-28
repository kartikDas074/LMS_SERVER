const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

async function run() {
  await client.connect();

  // Check permissions for Content Manager (role_id=8) and Admin (role_id=7)
  const perms = await client.query(`
    SELECT p.id, p.action, r.id as role_id, r.name as role_name, r.type as role_type
    FROM up_permissions p
    JOIN up_permissions_role_lnk l ON l.permission_id = p.id
    JOIN up_roles r ON l.role_id = r.id
    WHERE r.id IN (7, 8)
    ORDER BY r.id, p.action
  `);
  console.log('\nPermissions for Admin (7) and Content Manager (8):');
  console.log(`Total: ${perms.rows.length}`);
  
  const adminPerms = perms.rows.filter(r => r.role_id === 7);
  const cmPerms = perms.rows.filter(r => r.role_id === 8);
  
  console.log('\nAdmin permissions count:', adminPerms.length);
  console.log('Admin actions:', adminPerms.map(p => p.action).join('\n'));
  
  console.log('\nContent Manager permissions count:', cmPerms.length);
  console.log('Content Manager actions:', cmPerms.map(p => p.action).join('\n'));
  
  // Find admin permissions NOT in CM
  const cmActions = new Set(cmPerms.map(p => p.action));
  const adminActions = adminPerms.map(p => p.action);
  const missingFromCM = adminActions.filter(a => !cmActions.has(a));
  console.log('\nAdmin permissions MISSING from Content Manager:');
  console.log(missingFromCM.join('\n'));

  await client.end();
}

run().catch(console.error);
