'use strict';

/**
 * blog controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::blog.blog', ({ strapi }) => ({
  async publish(ctx) {
    const { documentId } = ctx.params;
    if (!documentId) {
      return ctx.badRequest('Document ID is required.');
    }
    try {
      const published = await strapi.documents('api::blog.blog').publish({
        documentId,
      });
      return ctx.send({ data: published });
    } catch (error) {
      strapi.log.error('Failed to publish blog document:', error);
      return ctx.badRequest(error.message || 'Unable to publish blog post.');
    }
  },

  async unpublish(ctx) {
    const { documentId } = ctx.params;
    if (!documentId) {
      return ctx.badRequest('Document ID is required.');
    }
    try {
      const unpublished = await strapi.documents('api::blog.blog').unpublish({
        documentId,
      });
      return ctx.send({ data: unpublished });
    } catch (error) {
      strapi.log.error('Failed to unpublish blog document:', error);
      return ctx.badRequest(error.message || 'Unable to unpublish blog post.');
    }
  },
}));
