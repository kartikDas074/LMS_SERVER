'use strict';

const LMS_ROLES = [
  {
    name: 'Admin Panel',
    type: 'admin-pannel',
    description: 'LMS Admin application role with full application access',
  },
  {
    name: 'Content Manager',
    type: 'content-manager',
    description: 'LMS Content Manager application role',
  },
  {
    name: 'Instructor',
    type: 'instructor',
    description: 'LMS Instructor application role',
  },
  {
    name: 'Student',
    type: 'student',
    description: 'LMS Student application role',
  },
];

// Permissions every authenticated user should have
const BASE_AUTHENTICATED_PERMISSIONS = [
  'plugin::users-permissions.user.me',
  'plugin::users-permissions.user.updateme',
];

async function ensurePermission(strapi, roleId, action) {
  const exists = await strapi.db
    .query('plugin::users-permissions.permission')
    .findOne({ where: { action, role: roleId } });

  if (!exists) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .create({ data: { action, role: roleId, enabled: true } });
  } else if (!exists.enabled) {
    await strapi.db
      .query('plugin::users-permissions.permission')
      .update({ where: { id: exists.id }, data: { enabled: true } });
  }
}

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    try {
      strapi.log.info('Initializing LMS Application Roles bootstrap...');

      // 1. Ensure all 4 LMS roles exist in Strapi Users & Permissions
      for (const roleDef of LMS_ROLES) {
        const existingRole = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: roleDef.type } });

        if (!existingRole) {
          await strapi.db
            .query('plugin::users-permissions.role')
            .create({ data: roleDef });
          strapi.log.info(`Created LMS Role: ${roleDef.name} (${roleDef.type})`);
        }
      }

      // 2. Grant base permissions to all LMS roles + built-in Authenticated role
      const allRoleTypes = [...LMS_ROLES.map((r) => r.type), 'authenticated'];

      for (const roleType of allRoleTypes) {
        const role = await strapi.db
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: roleType } });

        if (role) {
          for (const action of BASE_AUTHENTICATED_PERMISSIONS) {
            await ensurePermission(strapi, role.id, action);
          }
          strapi.log.info(`Granted base permissions to role: ${roleType}`);
        }
      }

      // 3. Configure full application permissions for the admin-pannel role
      const adminRole = await strapi.db
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: 'admin-pannel' } });

      if (adminRole) {
        // Fetch all registered content-api and users-permissions permissions
        const permissionsService = strapi.plugin('users-permissions').service('users-permissions');
        if (permissionsService && typeof permissionsService.getActions === 'function') {
          const allActions = await permissionsService.getActions();
          const existingPerms = await strapi.db
            .query('plugin::users-permissions.permission')
            .findMany({ where: { role: adminRole.id } });
          const existingActionSet = new Set(existingPerms.map((p) => p.action));
          const permissionInserts = [];

          for (const [apiName, apiObj] of Object.entries(allActions)) {
            const controllers = apiObj.controllers || {};
            for (const [controllerName, actionsObj] of Object.entries(controllers)) {
              for (const [actionName] of Object.entries(actionsObj)) {
                const actionKey = `${apiName}.${controllerName}.${actionName}`;
                if (!existingActionSet.has(actionKey)) {
                  permissionInserts.push({
                    action: actionKey,
                    role: adminRole.id,
                    enabled: true,
                  });
                }
              }
            }
          }

          if (permissionInserts.length > 0) {
            for (const perm of permissionInserts) {
              await strapi.db.query('plugin::users-permissions.permission').create({ data: perm });
            }
            strapi.log.info(`Granted ${permissionInserts.length} permissions to LMS Admin role.`);
          }
        }
      }

      strapi.log.info('LMS Application Roles initialized successfully.');
    } catch (error) {
      strapi.log.error('Error during LMS Roles bootstrap:', error);
    }
  },
};
