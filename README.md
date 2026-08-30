# LMS Strapi Backend

This is the Strapi v5 backend server for the Learning Management System (LMS). It handles content management, user permissions, custom course & blog APIs, and PostgreSQL database persistence.

---

## 🛠️ Tech Stack

- **Framework:** Strapi v5
- **Language:** JavaScript (Node.js >= 20.0.0)
- **Database:** PostgreSQL (Neon Serverless PostgreSQL or local PostgreSQL)
- **Deployment:** Railway / Strapi Cloud

---

## 🚀 Local Setup

### 1. Install Dependencies

From the `server` directory:

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your `.env` file with your database connection and Strapi keys:

```env
HOST=0.0.0.0
PORT=1337
SERVER_PROXY=true
PUBLIC_URL=http://localhost:1337
CORS_ORIGINS=http://localhost:3000

# PostgreSQL (Neon Database)
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT=60000
DATABASE_SCHEMA=public

# Strapi Secret Keys (generate secure random strings)
APP_KEYS="toBeModified1,toBeModified2"
API_TOKEN_SALT=tobemodified
ADMIN_JWT_SECRET=tobemodified
TRANSFER_TOKEN_SALT=tobemodified
JWT_SECRET=tobemodified
ENCRYPTION_KEY=tobemodified
```

### 3. Seed Sample Data (Optional)

Run the included seed scripts to populate initial courses and blog posts into PostgreSQL:

```bash
# Seed initial courses dataset
npm run seed:courses

# Seed initial blogs dataset
npm run seed:blogs
```

### 4. Start Development Server

```bash
npm run develop
```

- Open `http://localhost:1337/admin` to log into or create the initial Strapi Administrator account.
- The REST API will be served at `http://localhost:1337/api`.

---

## 📜 Available Scripts

- `npm run develop` / `npm run dev`: Start Strapi in auto-reloading development mode
- `npm run build`: Build administrative interface for production
- `npm run start`: Run Strapi in production mode
- `npm run seed:courses`: Seed course data into database
- `npm run seed:blogs`: Seed blog data into database
- `npm run strapi`: Access the Strapi CLI

---

## 🔑 Key Environment Variables Breakdown

- `HOST`: Server host binding address (`0.0.0.0` for containerized environments like Railway).
- `PORT`: HTTP port (`1337` default).
- `PUBLIC_URL` or `URL`: Public-facing URL of backend (including protocol).
- `CORS_ORIGINS`: Allowed frontend origins for cross-origin requests.
- `DATABASE_CLIENT`: Set to `postgres`.
- `DATABASE_URL`: PostgreSQL connection string.
- `DATABASE_SSL`: Set to `true` when connecting to SSL-enforced providers like Neon.
- `APP_KEYS`: Comma-separated application keys.
- `API_TOKEN_SALT`: Salt used for generating API tokens.
- `ADMIN_JWT_SECRET`: Secret key for Strapi admin panel authentication.
- `TRANSFER_TOKEN_SALT`: Salt for Strapi data transfer tokens.
- `JWT_SECRET`: Secret key for Users & Permissions plugin JWT verification.
- `ENCRYPTION_KEY`: Strapi data encryption key.

---

## ☁️ Railway Deployment Guide

1. Push the repository to GitHub.
2. Create a Railway project and connect your GitHub repository.
3. Set the service root directory to `server`.
4. Configure environment variables in Railway settings (`DATABASE_URL`, `HOST=0.0.0.0`, `DATABASE_CLIENT=postgres`, `DATABASE_SSL=true`, and all Strapi secrets).
5. Set Build Command: `npm run build`
6. Set Start Command: `npm run start`
7. Generate a Railway domain and set `PUBLIC_URL` to your Railway HTTPS URL.
8. Access `<PUBLIC_URL>/admin` to access your live Strapi administration panel.
