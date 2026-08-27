'use strict';

/**
 * Custom blog routes for publish/unpublish actions.
 * Handler strings must be fully qualified for extended core controllers.
 */
module.exports = {
  routes: [
    {
      method: 'PUT',
      path: '/blogs/:documentId/publish',
      handler: 'api::blog.blog.publish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/blogs/:documentId/unpublish',
      handler: 'api::blog.blog.unpublish',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
