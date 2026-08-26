'use strict';

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/course-assets/cloudinary',
      handler: 'course-assets.createCloudinaryAsset',
      config: {
        auth: {
          scope: [],
        },
      },
    },
  ],
};
