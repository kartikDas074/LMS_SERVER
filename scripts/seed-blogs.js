'use strict';

const { createStrapi } = require('@strapi/strapi');

const BLOG_UID = 'api::blog.blog';
const posts = [
  ['Learning React in 2026', 'React remains one of the most useful technologies for building modern web applications. This article explains what beginners should learn first, how modern React differs from older approaches, and how to build practical projects while learning.'],
  ['Next.js App Router: What Developers Should Know', 'Next.js App Router introduces a modern approach to building full-stack React applications. Learn about layouts, server components, client components, routing, data fetching, and practical project architecture.'],
  ['How to Build a Production-Ready REST API', 'A production API needs more than CRUD endpoints. Explore authentication, authorization, validation, error handling, pagination, security, logging, and scalable backend architecture.'],
  ['PostgreSQL Database Design for Web Applications', 'Good database design makes applications easier to maintain and scale. Learn about relationships, normalization, indexes, constraints, transactions, and practical PostgreSQL design decisions.'],
  ['Git and GitHub Workflow for Developers', 'Learn a practical Git and GitHub workflow for real software projects, including branches, commits, pull requests, merge conflicts, code reviews, and collaborative development.'],
  ['Authentication vs Authorization Explained', 'Authentication and authorization are fundamental parts of secure applications. Understand the difference between them and learn how sessions, JWTs, roles, and permissions work together.'],
  ['Building Better Responsive Interfaces', 'Responsive design is about more than making a page fit on a mobile screen. Explore layout systems, typography, spacing, breakpoints, accessibility, and practical techniques for building polished interfaces.'],
  ['Node.js Backend Architecture for Beginners', 'Learn how to structure a Node.js backend using controllers, services, routes, middleware, validation, error handling, and database layers so that your application remains maintainable as it grows.'],
  ['How to Become a Better Full-Stack Developer', 'Becoming a strong full-stack developer requires more than learning frameworks. This guide discusses fundamentals, problem solving, frontend development, backend engineering, databases, Git, deployment, and project-based learning.'],
  ['Common Mistakes Developers Make in Their First Projects', 'Many beginner projects fail because of avoidable mistakes such as poor architecture, missing validation, weak error handling, insecure authentication, duplicated code, and lack of proper Git workflow.'],
  ['A Practical Guide to Debugging Web Applications', 'Effective debugging combines reproducible steps, useful logs, focused hypotheses, and small verified changes. Learn how to investigate frontend, API, and database failures without guessing.'],
];

function blocks(text) { return [{ type: 'paragraph', children: [{ type: 'text', text }] }]; }

async function main() {
  const app = await createStrapi().load();
  try {
    const users = await strapi.db.query('plugin::users-permissions.user').findMany({ select: ['id', 'username', 'email'], limit: 1 });
    if (!users.length) throw new Error('No existing user was found; no blogs were inserted.');
    const creator = users[0];
    const existing = await strapi.db.query(BLOG_UID).findMany({ select: ['id', 'title', 'publishedAt'] });
    const titles = new Set(existing.map((blog) => blog.title));
    let inserted = 0; let skipped = 0; let failed = 0;
    for (const [index, [title, description]] of posts.entries()) {
      if (titles.has(title)) { console.log(`SKIPPED: ${title}`); skipped += 1; continue; }
      try {
        const data = { title, Description: blocks(description), creator: creator.id, publishedAt: index < 7 ? new Date().toISOString() : null };
        await strapi.db.query(BLOG_UID).create({ data });
        console.log(`INSERTED: ${title} (${index < 7 ? 'Published' : 'Draft'})`);
        titles.add(title);
        inserted += 1;
      } catch (error) { failed += 1; console.error(`FAILED: ${title}: ${error.message}`); }
    }
    for (const [, [title]] of posts.entries()) {
      if (posts.findIndex((post) => post[0] === title) < 7) continue;
      const draft = await strapi.db.query(BLOG_UID).findOne({ where: { title } });
      if (draft?.publishedAt) await strapi.db.query(BLOG_UID).update({ where: { id: draft.id }, data: { publishedAt: null } });
    }
    const totalAfter = await strapi.db.query(BLOG_UID).count();
    const published = await strapi.db.query(BLOG_UID).count({ where: { publishedAt: { $notNull: true } } });
    const drafts = totalAfter - published;
    console.log(JSON.stringify({ creator: { id: creator.id, username: creator.username }, totalBefore: existing.length, inserted, skipped, failed, totalAfter, published, drafts }, null, 2));
    const seededTitlesPresent = posts.every(([title]) => titles.has(title));
    if (failed || !seededTitlesPresent) process.exitCode = 1;
  } finally { await app.destroy(); }
}

main().catch((error) => { console.error(`SEED ABORTED: ${error.message}`); process.exitCode = 1; });