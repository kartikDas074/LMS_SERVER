module.exports = ({ env }) => {
  const configuredOrigins = env('CORS_ORIGINS', '');
  const origins = configuredOrigins
    ? configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean)
    : env('NODE_ENV', 'development') === 'production'
      ? []
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];

  if (env('NODE_ENV', 'development') === 'production' && origins.length === 0) {
    throw new Error('CORS_ORIGINS must be configured in production.');
  }

  return [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Requested-With', 'X-Strapi-Refresh-Cookie'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  ];
};
