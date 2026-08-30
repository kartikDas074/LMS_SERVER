const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedExecutableTypes = [
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

module.exports = ({ env }) => {
  const isProduction = env('NODE_ENV', 'development') === 'production';

  return {
    'users-permissions': {
      config: {
        jwtManagement: 'refresh',
        sessions: {
          accessTokenLifespan: 10 * 60,
          maxRefreshTokenLifespan: 30 * 24 * 60 * 60,
          idleRefreshTokenLifespan: 14 * 24 * 60 * 60,
          httpOnly: true,
          cookie: {
            secure: isProduction ? true : env.bool('COOKIE_SECURE', false),
            sameSite: env('COOKIE_SAMESITE', isProduction ? 'none' : 'lax'),
            path: '/',
          },
        },
      },
    },
    upload: {
      config: {
        security: {
          allowedTypes: allowedMediaTypes,
          deniedTypes: deniedExecutableTypes,
        },
      },
    },
  };
};

