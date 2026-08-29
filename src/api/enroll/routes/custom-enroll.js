'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/enrolls/my',
      handler: 'api::enroll.enroll.my',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
