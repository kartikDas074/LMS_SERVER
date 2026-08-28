'use strict';

const { errors } = require('@strapi/utils');
const { ApplicationError, ForbiddenError, ValidationError } = errors;

const allowedRoles = new Set(['admin-pannel', 'admin-panel', 'admin', 'content-manager', 'instructor']);

module.exports = {
  async createCloudinaryAsset(ctx) {
    const user = ctx.state.user;
    const roleType = String(user?.role?.type || user?.role?.name || '').toLowerCase();

    if (!user || !allowedRoles.has(roleType)) {
        throw new ForbiddenError('You are not authorized to register course assets.');
    }

    const { url, publicId, format, width, height, bytes, resourceType, name } = ctx.request.body || {};
    if (!url || !publicId) {
      throw new ValidationError('Cloudinary url and publicId are required.');
    }

    try {
      const file = await strapi.db.query('plugin::upload.file').create({
        data: {
          name: name || publicId,
          alternativeText: name || 'Course media',
          caption: name || 'Course media',
          url,
          hash: publicId,
          ext: format ? `.${format}` : '.jpg',
          mime: resourceType === 'video' ? `video/${format || 'mp4'}` : (format ? `image/${format}` : 'image/jpeg'),
          size: bytes || 0,
          width,
          height,
          provider: 'cloudinary',
          provider_metadata: {
            public_id: publicId,
            resource_type: resourceType || 'image',
          },
        },
      });

      ctx.body = { id: file.id, documentId: file.documentId, url: file.url };
    } catch (error) {
      strapi.log.error('Failed to register Cloudinary course asset', error);
        throw new ApplicationError('Unable to register Cloudinary media asset.');
    }
  },
};
