# LMS Strapi Backend

## Tech Stack

- Strapi v5
- JavaScript
- Node.js
- PostgreSQL on Neon
- Railway

## Local Setup

From the repository root:

```bash
cd server
npm install
```

Copy `.env.example` to `.env`, set `DATABASE_URL` to the Neon connection string, and replace the local Strapi secret values with secure random values. Then start the admin panel:

```bash
npm run develop
```

Open `http://localhost:1337/admin` and create the first administrator account when prompted.

## Environment Variables

- `HOST`: bind address. Use `0.0.0.0` for Railway.
- `PORT`: HTTP port. Railway supplies this value automatically.
- `PUBLIC_URL` or `URL`: public backend URL, including the protocol.
- `DATABASE_CLIENT`: must be `postgres`.
- `DATABASE_URL`: private Neon PostgreSQL connection string. Never commit it.
- `DATABASE_SSL`: enables TLS for the Neon connection.
- `DATABASE_SSL_REJECT_UNAUTHORIZED`: validates the database certificate; keep enabled in production.
- `DATABASE_POOL_MIN` and `DATABASE_POOL_MAX`: PostgreSQL pool bounds.
- `DATABASE_CONNECTION_TIMEOUT`: database acquisition timeout in milliseconds.
- `DATABASE_SCHEMA`: PostgreSQL schema, normally `public`.
- `APP_KEYS`: comma-separated Strapi application keys.
- `API_TOKEN_SALT`: salt for API tokens.
- `ADMIN_JWT_SECRET`: admin authentication secret.
- `TRANSFER_TOKEN_SALT`: salt for transfer tokens.
- `JWT_SECRET`: Users & Permissions JWT secret.
- `ENCRYPTION_KEY`: Strapi encryption key.

## Production Build

```bash
npm run build
npm run start
```

## Railway Deployment

1. Push the repository to GitHub.
2. Create a Railway project and connect the GitHub repository.
3. Configure the service root directory as `server`.
4. Add `DATABASE_URL` from Neon and all Strapi secrets as Railway variables.
5. Set `HOST=0.0.0.0`, `DATABASE_CLIENT=postgres`, and `DATABASE_SSL=true`.
6. Use `npm run build` as the build command.
7. Use `npm run start` as the start command.
8. Generate a Railway domain and set `PUBLIC_URL` to that HTTPS URL.
9. Open `<PUBLIC_URL>/admin` to access the Strapi admin panel.

Do not upload or commit `.env`. Railway variables should contain the production values directly.

## Database

This backend uses PostgreSQL hosted on Neon. The connection is supplied only through `DATABASE_URL`, and TLS is enabled by default for Neon and production deployments.
