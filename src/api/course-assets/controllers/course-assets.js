'use strict';

const { errors } = require('@strapi/utils');
const { ApplicationError, ForbiddenError, ValidationError } = errors;

const allowedRoles = new Set(['admin-pannel', 'admin-panel', 'admin', 'content-manager']);

module.exports = {
  async createCloudinaryAsset(ctx) {
    const user = ctx.state.user;
    const roleType = String(user?.role?.type || user?.role?.name || '').toLowerCase();

    if (!user || !allowedRoles.has(roleType)) {
      throw new ForbiddenError('Only Admin Panel and Content Manager users can register course assets.');
    }

    const { url, publicId, format, width, height, name } = ctx.request.body || {};
    if (!url || !publicId) {
      throw new ValidationError('Cloudinary url and publicId are required.');
    }

    try {
      const file = await strapi.db.query('plugin::upload.file').create({
        data: {
          name: name || publicId,
          alternativeText: name || 'Course thumbnail',
          caption: name || 'Course thumbnail',
          url,
          hash: publicId,
          ext: format ? `.${format}` : '.jpg',
          mime: format ? `image/${format}` : 'image/jpeg',
          size: 0,
          width,
          height,
          provider: 'cloudinary',
          provider_metadata: {
            public_id: publicId,
            resource_type: 'image',
          },
        },
      });

      ctx.body = { id: file.id, documentId: file.documentId, url: file.url };
    } catch (error) {
      strapi.log.error('Failed to register Cloudinary course asset', error);
      throw new ApplicationError('Unable to register course thumbnail.');
    }
  },
};
