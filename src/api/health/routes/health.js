module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/',
      handler: 'health.index',
      config: {
        auth: false,
      },
    },
  ],
};
