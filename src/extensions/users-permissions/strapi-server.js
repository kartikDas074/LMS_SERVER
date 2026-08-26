'use strict';

const _ = require('lodash');
const utils = require('@strapi/utils');
const { ApplicationError, ValidationError } = utils.errors;

const buildRefreshCookieOptions = (sessions, isProduction) => ({
  httpOnly: true,
  secure: typeof sessions.cookie?.secure === 'boolean' ? sessions.cookie.secure : isProduction,
  sameSite: sessions.cookie?.sameSite ?? 'lax',
  path: sessions.cookie?.path ?? '/',
  domain: sessions.cookie?.domain,
  maxAge: sessions.cookie?.maxAge,
  overwrite: true,
});

const ALLOWED_LMS_ROLES = [
  'student',
  'instructor',
  'content-manager',
  'admin-pannel',
];

const sanitizeUser = (user, ctx) => {
  const { auth } = ctx.state;
  const userSchema = strapi.getModel('plugin::users-permissions.user');
  return strapi.contentAPI.sanitize.output(user, userSchema, { auth });
};

module.exports = (plugin) => {
  // Store the original controllers factory
  const originalAuthFactory = plugin.controllers.auth;

  // Wrap the auth controller factory to override 'register' action
  plugin.controllers.auth = (args) => {
    const controllers = originalAuthFactory(args);

    controllers.register = async (ctx) => {
      const pluginStore = await strapi.store({ type: 'plugin', name: 'users-permissions' });
      const settings = await pluginStore.get({ key: 'advanced' });

      if (!settings.allow_register) {
        throw new ApplicationError('Register action is currently disabled');
      }

      const {
        username,
        email,
        password,
        confirmPassword,
        role: requestedRole,
        profileImage,
        image,
      } = ctx.request.body;

      // Validate required fields
      if (!username || !email || !password) {
        throw new ValidationError('Username, email, and password are required.');
      }

      // Validate password confirmation if supplied
      if (confirmPassword && password !== confirmPassword) {
        throw new ValidationError('Passwords do not match.');
      }

      // Secure Role Validation & Resolution
      let targetRoleType = 'student';
      if (requestedRole) {
        const normalizedRole = String(requestedRole).toLowerCase().trim();
        if (!ALLOWED_LMS_ROLES.includes(normalizedRole)) {
          throw new ValidationError(
            `Invalid role requested. Allowed roles are: ${ALLOWED_LMS_ROLES.join(', ')}`
          );
        }
        targetRoleType = normalizedRole;
      }

      // Find the resolved role in Strapi Users & Permissions
      const matchedRole = await strapi.db
        .query('plugin::users-permissions.role')
        .findOne({ where: { type: targetRoleType } });

      if (!matchedRole) {
        throw new ApplicationError(`Role '${targetRoleType}' is not configured in Strapi.`);
      }

      // Check for conflicting username or email
      const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: {
          $or: [
            { email: email.toLowerCase() },
            { username: username.trim() },
          ],
        },
      });

      if (existingUser) {
        throw new ApplicationError('Email or Username is already taken.');
      }

      // Profile Image Attachment (Cloudinary media linking)
      const imagePayload = profileImage || image;
      let attachedFileId = null;

      if (imagePayload && imagePayload.url) {
        try {
          const publicId = imagePayload.publicId || `avatar-${Date.now()}`;
          const ext = imagePayload.format ? `.${imagePayload.format}` : '.jpg';
          const mime = imagePayload.format ? `image/${imagePayload.format}` : 'image/jpeg';

          // Create media entry in plugin::upload.file
          const fileEntry = await strapi.db.query('plugin::upload.file').create({
            data: {
              name: `${username}-avatar${ext}`,
              alternativeText: `${username} profile picture`,
              caption: `${username} profile picture`,
              url: imagePayload.url,
              hash: publicId,
              ext,
              mime,
              size: 50,
              provider: 'cloudinary',
              provider_metadata: {
                public_id: publicId,
                resource_type: 'image',
              },
            },
          });

          if (fileEntry) {
            attachedFileId = fileEntry.id;
          }
        } catch (uploadErr) {
          strapi.log.warn('Could not link Cloudinary image to upload file record:', uploadErr);
        }
      }

      // Construct new user entity
      const newUser = {
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password,
        provider: 'local',
        role: matchedRole.id,
        confirmed: !settings.email_confirmation,
        blocked: false,
      };

      if (attachedFileId) {
        newUser.image = attachedFileId;
      }

      // Create user via Users & Permissions user service
      const createdUser = await strapi.plugin('users-permissions').service('user').add(newUser);

      // Fetch complete user with role and image populated
      const populatedUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: createdUser.id },
        populate: {
          role: true,
          image: true,
        },
      });

      const sanitizedUser = await sanitizeUser(populatedUser, ctx);

      const mode = strapi.config.get('plugin::users-permissions.jwtManagement', 'legacy-support');
      let jwt;

      if (mode === 'refresh') {
        const refresh = await strapi
          .sessionManager('users-permissions')
          .generateRefreshToken(String(createdUser.id), undefined, { type: 'refresh' });
        const access = await strapi
          .sessionManager('users-permissions')
          .generateAccessToken(refresh.token);

        if ('error' in access) {
          throw new ApplicationError('Failed to generate access token');
        }

        jwt = access.token;
        const sessions = strapi.config.get('plugin::users-permissions.sessions');
        const cookieName = sessions?.cookie?.name || 'strapi_up_refresh';
        const isProduction = process.env.NODE_ENV === 'production';
        ctx.cookies.set(
          cookieName,
          refresh.token,
          buildRefreshCookieOptions(sessions, isProduction)
        );
      } else {
        jwt = await strapi.plugin('users-permissions').service('jwt').issue({ id: createdUser.id });
      }

      ctx.send({
        jwt,
        user: sanitizedUser,
      });
    };

    return controllers;
  };

  // 2. Custom Me Controller with automatic Role and Image population
  plugin.controllers.user.me = async (ctx) => {
    const authUser = ctx.state.user;

    if (!authUser) {
      return ctx.unauthorized();
    }

    const user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: {
        role: true,
        image: true,
      },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    // Manually build safe response — never expose sensitive fields,
    // always include role + image regardless of the caller's role permissions
    ctx.body = {
      id: user.id,
      username: user.username,
      email: user.email,
      confirmed: user.confirmed,
      blocked: user.blocked,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            type: user.role.type,
            description: user.role.description,
          }
        : null,
      image: user.image
        ? {
            id: user.image.id,
            url: user.image.url,
            name: user.image.name,
            alternativeText: user.image.alternativeText,
            provider: user.image.provider,
            provider_metadata: user.image.provider_metadata,
          }
        : null,
    };
  };


  // Disable request body schema validation for public registration
  // to allow additional parameters (confirmPassword, role, profileImage)
  const registerRoute = plugin.routes['content-api'].routes.find(
    (route) => route.method === 'POST' && route.path === '/auth/local/register'
  );
  if (registerRoute) {
    delete registerRoute.request;
  }

  return plugin;
};
