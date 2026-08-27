'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createStrapi } = require('@strapi/strapi');

const COURSE_UID = 'api::course.course';
const USER_UID = 'plugin::users-permissions.user';
const REQUIRED_COURSE_FIELDS = [
  'title',
  'shortDescription',
  'description',
  'thumbnail',
  'level',
  'duration',
  'topic',
  'skills',
  'price',
  'extraSupport',
];

const courses = [
  {
    title: 'Web Development Master Course',
    shortDescription: 'Master modern frontend and backend development by building real-world web applications.',
    description: 'A comprehensive project-based web development course covering HTML, CSS, JavaScript, React, Next.js, Node.js, Express.js, databases, authentication, APIs, Git, deployment, and real-world full-stack development.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085',
    level: 'Intermediate', duration: 12,
    topic: ['HTML5, CSS3 & Responsive Design', 'JavaScript (ES6+)', 'React.js & Next.js', 'Node.js & Express.js', 'MongoDB & PostgreSQL', 'REST API Development', 'Authentication & Authorization', 'Git & GitHub', 'Real-World Full-Stack Projects'],
    skills: ['frontend', 'backend', 'responsive design', 'scalable web development', 'API development', 'authentication', 'database management', 'Git & GitHub', 'full-stack development'],
    price: 49.99, extraSupport: 'Students receive project guidance, debugging assistance, coding support, and course-related Q&A support.',
  },
  {
    title: 'JavaScript From Beginner to Advanced',
    shortDescription: 'Build a strong JavaScript foundation and master modern programming concepts through practical projects.',
    description: 'Learn JavaScript from the fundamentals to advanced concepts including ES6+, functions, arrays, objects, asynchronous programming, promises, APIs, DOM manipulation, modules, and modern JavaScript development.',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479',
    level: 'Beginner', duration: 8,
    topic: ['JavaScript Fundamentals', 'Variables & Data Types', 'Functions', 'Arrays & Objects', 'ES6+ Features', 'DOM Manipulation', 'Async JavaScript', 'Promises & Fetch API', 'Modern JavaScript'],
    skills: ['JavaScript', 'problem solving', 'DOM manipulation', 'ES6+', 'asynchronous programming', 'API integration', 'debugging', 'programming fundamentals'],
    price: 29.99, extraSupport: 'Students receive weekly coding exercises, debugging support, project reviews, and instructor Q&A.',
  },
  {
    title: 'React.js Complete Development Course',
    shortDescription: 'Learn React.js and build modern, component-based frontend applications from scratch.',
    description: 'A practical React.js course covering components, JSX, props, state, hooks, forms, API integration, routing, reusable components, performance optimization, and production-ready frontend development.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee',
    level: 'Intermediate', duration: 8,
    topic: ['React Fundamentals', 'JSX', 'Components', 'Props & State', 'React Hooks', 'React Router', 'Forms & Validation', 'REST API Integration', 'Performance Optimization'],
    skills: ['React.js', 'component architecture', 'React Hooks', 'state management', 'API integration', 'frontend development', 'reusable components', 'performance optimization'],
    price: 39.99, extraSupport: 'Students receive code reviews, React debugging support, project assistance, and weekly technical Q&A.',
  },
  {
    title: 'Next.js Full-Stack Development',
    shortDescription: 'Build fast, scalable and production-ready full-stack applications using Next.js.',
    description: 'Learn modern Next.js development including App Router, Server Components, Client Components, data fetching, dynamic routing, authentication, API development, optimization, and deployment.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c',
    level: 'Advanced', duration: 10,
    topic: ['Next.js App Router', 'Server Components', 'Client Components', 'Dynamic Routing', 'Data Fetching', 'Server Actions', 'Authentication', 'API Development', 'Deployment & Optimization'],
    skills: ['Next.js', 'React', 'server-side rendering', 'full-stack development', 'authentication', 'API development', 'performance optimization', 'deployment'],
    price: 59.99, extraSupport: 'Students receive architecture guidance, deployment assistance, debugging support, and production project reviews.',
  },
  {
    title: 'Node.js & Express Backend Development',
    shortDescription: 'Learn backend development with Node.js and Express by building scalable REST APIs.',
    description: 'This course teaches server-side JavaScript development using Node.js and Express.js. Students will build REST APIs, implement authentication, handle errors, validate requests, work with databases, and structure scalable backend applications.',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    level: 'Intermediate', duration: 8,
    topic: ['Node.js Fundamentals', 'Express.js', 'REST APIs', 'Middleware', 'Authentication', 'JWT', 'Error Handling', 'API Validation', 'Backend Architecture'],
    skills: ['Node.js', 'Express.js', 'REST API', 'JWT authentication', 'backend development', 'middleware', 'API validation', 'server architecture'],
    price: 44.99, extraSupport: 'Students receive backend architecture guidance, API debugging support, code reviews, and project assistance.',
  },
  {
    title: 'PostgreSQL & Database Design Masterclass',
    shortDescription: 'Learn relational databases and design efficient PostgreSQL systems for real-world applications.',
    description: 'Master PostgreSQL from database fundamentals to advanced relational database design. Learn SQL queries, relationships, joins, indexing, constraints, normalization, transactions, optimization, and application integration.',
    thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d',
    level: 'Intermediate', duration: 6,
    topic: ['PostgreSQL Fundamentals', 'SQL', 'Database Design', 'Relationships', 'Joins', 'Indexes', 'Constraints', 'Transactions', 'Query Optimization'],
    skills: ['PostgreSQL', 'SQL', 'database design', 'relational databases', 'query optimization', 'data modeling', 'database normalization', 'backend integration'],
    price: 34.99, extraSupport: 'Students receive database design reviews, SQL debugging assistance, query optimization guidance, and project support.',
  },
  {
    title: 'MongoDB & Modern Backend Development',
    shortDescription: 'Build flexible and scalable applications using MongoDB and modern backend technologies.',
    description: 'Learn MongoDB and NoSQL database development through practical backend projects. Explore collections, documents, CRUD operations, aggregation, indexing, schema design, data validation, and integration with Node.js applications.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c',
    level: 'Intermediate', duration: 6,
    topic: ['MongoDB Fundamentals', 'NoSQL Databases', 'CRUD Operations', 'MongoDB Queries', 'Aggregation', 'Indexing', 'Schema Design', 'Node.js Integration', 'Database Security'],
    skills: ['MongoDB', 'NoSQL', 'database design', 'CRUD', 'aggregation', 'indexing', 'Node.js integration', 'backend development'],
    price: 32.99, extraSupport: 'Students receive MongoDB query support, database design feedback, debugging assistance, and project guidance.',
  },
  {
    title: 'Full-Stack MERN Development',
    shortDescription: 'Become a full-stack developer by building complete applications with MongoDB, Express, React and Node.js.',
    description: 'A project-focused MERN stack course covering frontend development with React, backend development with Node.js and Express, MongoDB database integration, authentication, REST APIs, deployment, and complete application architecture.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97',
    level: 'Advanced', duration: 12,
    topic: ['MongoDB', 'Express.js', 'React.js', 'Node.js', 'REST APIs', 'Authentication', 'JWT', 'State Management', 'Full-Stack Deployment'],
    skills: ['MERN stack', 'React.js', 'Node.js', 'Express.js', 'MongoDB', 'REST API', 'authentication', 'full-stack development', 'deployment'],
    price: 69.99, extraSupport: 'Students receive full-stack project mentoring, architecture reviews, debugging assistance, and deployment support.',
  },
  {
    title: 'Git & GitHub for Professional Developers',
    shortDescription: 'Learn Git and GitHub workflows used by professional software development teams.',
    description: 'Learn how to manage source code professionally using Git and GitHub. This course covers repositories, commits, branches, merging, rebasing, pull requests, conflict resolution, collaboration workflows, and GitHub best practices.',
    thumbnail: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498',
    level: 'Beginner', duration: 4,
    topic: ['Git Fundamentals', 'Repositories', 'Commits', 'Branches', 'Merging', 'Rebasing', 'Pull Requests', 'Merge Conflicts', 'Team Collaboration'],
    skills: ['Git', 'GitHub', 'version control', 'branching', 'collaboration', 'pull requests', 'conflict resolution', 'team workflow'],
    price: 19.99, extraSupport: 'Students receive Git troubleshooting support, repository reviews, workflow guidance, and collaboration assistance.',
  },
  {
    title: 'REST API & Authentication Masterclass',
    shortDescription: 'Build secure and scalable REST APIs with authentication and authorization from the ground up.',
    description: 'Learn how to design and build production-ready REST APIs with proper authentication, authorization, validation, error handling, security practices, JWT, role-based access control, and database integration.',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
    level: 'Advanced', duration: 7,
    topic: ['REST API Architecture', 'HTTP Methods', 'API Routing', 'Request Validation', 'JWT Authentication', 'Authorization', 'Role-Based Access Control', 'Error Handling', 'API Security'],
    skills: ['REST API', 'authentication', 'authorization', 'JWT', 'RBAC', 'API security', 'validation', 'backend architecture'],
    price: 44.99, extraSupport: 'Students receive API architecture reviews, authentication debugging, security guidance, and hands-on project support.',
  },
  {
    title: 'TypeScript for Modern Web Development',
    shortDescription: 'Write safer, more maintainable web applications with TypeScript and practical type-driven design.',
    description: 'Build confidence with TypeScript by applying types, interfaces, generics, narrowing, utility types, modules, and configuration to frontend and backend projects. The course finishes with a typed production-style application.',
    thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    level: 'Intermediate', duration: 6,
    topic: ['TypeScript Fundamentals', 'Type Annotations', 'Interfaces', 'Generics', 'Union Types', 'Type Narrowing', 'Utility Types', ' tsconfig', 'Typed API Contracts'],
    skills: ['TypeScript', 'static typing', 'type design', 'generics', 'API contracts', 'refactoring', 'developer tooling', 'maintainable code'],
    price: 36.99, extraSupport: 'Students receive type-error clinics, migration advice, code reviews, and guidance applying TypeScript to an existing project.',
  },
  {
    title: 'Frontend Development with HTML, CSS & Responsive Design',
    shortDescription: 'Create accessible, responsive interfaces from semantic HTML and modern CSS foundations.',
    description: 'Learn the craft of frontend development through semantic markup, layout systems, responsive breakpoints, accessibility, forms, typography, animations, and a portfolio-quality responsive website built from scratch.',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8',
    level: 'Beginner', duration: 6,
    topic: ['Semantic HTML', 'CSS Cascade', 'Flexbox', 'CSS Grid', 'Responsive Breakpoints', 'Accessibility', 'Forms', 'Typography', 'CSS Animations'],
    skills: ['HTML', 'CSS', 'responsive design', 'accessibility', 'Flexbox', 'CSS Grid', 'UI implementation', 'frontend fundamentals'],
    price: 24.99, extraSupport: 'Students receive layout critiques, accessibility feedback, responsive debugging help, and weekly implementation exercises.',
  },
];

function loadClientEnv() {
  const env = {};
  for (const fileName of ['.env', '.env.local']) {
    const filePath = path.resolve(__dirname, '..', '..', 'LMS_CLIENT', fileName);
    if (!fs.existsSync(filePath)) continue;
    for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return env;
}

function validateCourse(course) {
  for (const field of REQUIRED_COURSE_FIELDS) {
    if (course[field] === undefined || course[field] === null || course[field] === '') {
      throw new Error(`Missing field "${field}" for ${course.title}`);
    }
  }
  if (!Array.isArray(course.topic) || !Array.isArray(course.skills)) throw new Error(`JSON fields invalid for ${course.title}`);
  if (!Number.isInteger(course.duration) || course.duration < 1) throw new Error(`Duration must be a positive integer for ${course.title}`);
  if (!['Beginner', 'Intermediate', 'Advanced'].includes(course.level)) throw new Error(`Invalid level for ${course.title}`);
}

async function uploadThumbnail(course, cloudName, uploadPreset) {
  const imageResponse = await fetch(`${course.thumbnail}?auto=format&fit=crop&w=1600&q=85`);
  if (!imageResponse.ok) throw new Error(`Unsplash download failed (${imageResponse.status})`);
  const image = Buffer.from(await imageResponse.arrayBuffer());
  const form = new FormData();
  form.append('file', new Blob([image], { type: imageResponse.headers.get('content-type') || 'image/jpeg' }), `${course.title}.jpg`);
  form.append('upload_preset', uploadPreset);
  const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form });
  const result = await cloudinaryResponse.json();
  if (!cloudinaryResponse.ok) throw new Error(result?.error?.message || `Cloudinary upload failed (${cloudinaryResponse.status})`);
  return result;
}

async function main() {
  for (const course of courses) validateCourse(course);
  const clientEnv = loadClientEnv();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || clientEnv.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || clientEnv.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !uploadPreset) throw new Error('Cloudinary unsigned upload configuration is missing.');

  const app = await createStrapi().load();
  try {
    const existing = await strapi.db.query(COURSE_UID).findMany({ select: ['id', 'title'] });
    const existingTitles = new Set(existing.map((course) => course.title));
    const roles = await strapi.db.query('plugin::users-permissions.role').findMany({ where: { type: 'instructor' }, select: ['id'] });
    const instructors = roles.length ? await strapi.db.query(USER_UID).findMany({ where: { role: { id: { $in: roles.map((role) => role.id) } } }, select: ['id', 'username', 'email'] }) : [];
    if (!instructors.length) throw new Error('No existing user with the instructor role was found; no courses were inserted.');

    let inserted = 0;
    let skipped = 0;
    let failed = 0;
    for (const [index, course] of courses.entries()) {
      if (existingTitles.has(course.title)) {
        console.log(`SKIPPED: ${course.title} already exists`);
        skipped += 1;
        continue;
      }
      try {
        const instructor = instructors[index % instructors.length];
        const uploaded = await uploadThumbnail(course, cloudName, uploadPreset);
        const media = await strapi.db.query('plugin::upload.file').create({ data: {
          name: `${course.title}.jpg`, alternativeText: course.title, caption: course.shortDescription,
          url: uploaded.secure_url || uploaded.url, hash: uploaded.public_id, ext: `.${uploaded.format || 'jpg'}`,
          mime: `image/${uploaded.format || 'jpeg'}`, size: uploaded.bytes || 0, width: uploaded.width, height: uploaded.height,
          provider: 'cloudinary', provider_metadata: { public_id: uploaded.public_id, resource_type: uploaded.resource_type || 'image' },
        } });
        await strapi.db.query(COURSE_UID).create({ data: { ...course, thumbnail: [media.id], instructor: instructor.id, publishedAt: new Date() } });
        console.log(`INSERTED: ${course.title} (instructor ${instructor.id})`);
        existingTitles.add(course.title);
        inserted += 1;
      } catch (error) {
        failed += 1;
        console.error(`FAILED: ${course.title}: ${error.message}`);
      }
    }
    const totalAfter = await strapi.db.query(COURSE_UID).count();
    console.log(JSON.stringify({ totalBefore: existing.length, inserted, skipped, failed, totalAfter }, null, 2));
    if (failed > 0 || totalAfter < 10) process.exitCode = 1;
  } finally {
    await app.destroy();
  }
}

main().catch((error) => {
  console.error(`SEED ABORTED: ${error.message}`);
  process.exitCode = 1;
});