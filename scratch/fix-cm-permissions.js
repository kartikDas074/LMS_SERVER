const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_tsXIYDaAZ6n5@ep-dark-math-axr5cjks-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'
});

// Permissions needed by Content Manager that are currently MISSING
// These are content-management related permissions, NOT system admin ones.
// We exclude: role management, user management (create/destroy/update others), content-type-builder
const PERMISSIONS_TO_ADD = [
  // Upload/media (needed for Cloudinary image uploads in courses & blogs)
  'plugin::upload.content-api.destroy',
  'plugin::upload.content-api.find',
  'plugin::upload.content-api.findOne',
  'plugin::upload.content-api.findPage',
  'plugin::upload.content-api.upload',
  // Auth flows (refresh, logout, etc.)
  'plugin::users-permissions.auth.callback',
  'plugin::users-permissions.auth.changePassword',
  'plugin::users-permissions.auth.connect',
  'plugin::users-permissions.auth.emailConfirmation',
  'plugin::users-permissions.auth.forgotPassword',
  'plugin::users-permissions.auth.getSessions',
  'plugin::users-permissions.auth.logout',
  'plugin::users-permissions.auth.refresh',
  'plugin::users-permissions.auth.register',
  'plugin::users-permissions.auth.resetPassword',
  'plugin::users-permissions.auth.revokeSession',
  'plugin::users-permissions.auth.sendEmailConfirmation',
  // User read-only (needed for /users/me, resolving instructor for course creation)
  'plugin::users-permissions.user.find',
  'plugin::users-permissions.user.findOne',
  // Health check
  'api::health.health.index',
  // i18n
  'plugin::i18n.locales.listLocales',
  // Permissions read-only (needed by some Strapi UI flows)
  'plugin::users-permissions.permissions.getPermissions',
];

async function run() {
  await client.connect();
  console.log('Connected to database');

  const CONTENT_MANAGER_ROLE_ID = 8;

  // Get existing CM permissions to avoid duplicates
  const existingPerms = await client.query(
    `SELECT p.action FROM up_permissions p
     JOIN up_permissions_role_lnk l ON l.permission_id = p.id
     WHERE l.role_id = $1`,
    [CONTENT_MANAGER_ROLE_ID]
  );
  const existingActions = new Set(existingPerms.rows.map(r => r.action));
  console.log(`\nExisting CM permissions: ${existingActions.size}`);

  const toAdd = PERMISSIONS_TO_ADD.filter(action => !existingActions.has(action));
  console.log(`\nPermissions to add: ${toAdd.length}`);
  toAdd.forEach(a => console.log(' +', a));

  if (toAdd.length === 0) {
    console.log('\nAll required permissions already present!');
    await client.end();
    return;
  }

  // Get the max existing permission id to generate new ids
  const maxId = await client.query('SELECT MAX(id) as max_id FROM up_permissions');
  let nextId = (maxId.rows[0].max_id || 0) + 1;

  // Get the document_id prefix
  const crypto = require('crypto');
  const generateDocumentId = () => crypto.randomBytes(12).toString('hex');

  let added = 0;
  for (const action of toAdd) {
    const documentId = generateDocumentId();
    const now = new Date().toISOString();

    // Insert the permission
    await client.query(
      `INSERT INTO up_permissions (id, document_id, action, created_at, updated_at, published_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nextId, documentId, action, now, now, now]
    );

    // Link it to content manager role
    const linkMaxId = await client.query('SELECT MAX(id) as max_id FROM up_permissions_role_lnk');
    const nextLinkId = (linkMaxId.rows[0].max_id || 0) + 1;
    await client.query(
      `INSERT INTO up_permissions_role_lnk (id, permission_id, role_id, permission_ord)
       VALUES ($1, $2, $3, $4)`,
      [nextLinkId, nextId, CONTENT_MANAGER_ROLE_ID, nextLinkId]
    );

    console.log(`Added permission: ${action} (id=${nextId})`);
    nextId++;
    added++;
  }

  console.log(`\nDone! Added ${added} permissions to Content Manager role.`);

  // Verify final state
  const finalPerms = await client.query(
    `SELECT p.action FROM up_permissions p
     JOIN up_permissions_role_lnk l ON l.permission_id = p.id
     WHERE l.role_id = $1
     ORDER BY p.action`,
    [CONTENT_MANAGER_ROLE_ID]
  );
  console.log(`\nContent Manager now has ${finalPerms.rows.length} permissions.`);

  await client.end();
}

run().catch(console.error);
