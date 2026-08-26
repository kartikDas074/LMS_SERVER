module.exports = {
  index(ctx) {
    const port = strapi.config.get('server.port');

    ctx.body = `Server is running on port ${port}`;
  },
};
