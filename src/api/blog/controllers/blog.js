'use strict';

/**
 * blog controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

function normalizeRoleName(value) {
  const raw = String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
  if (!raw) return '';
  if (raw.includes('admin')) return 'admin';
  if (raw.includes('content manager')) return 'content-manager';
  if (raw.includes('instructor')) return 'instructor';
  if (raw.includes('student')) return 'student';
  if (raw.includes('public')) return 'public';
  if (raw.includes('authenticated')) return 'authenticated';
  return raw;
}

function getUserRoleType(user) {
  if (!user) return null;
  const roleVal = user.role?.type || user.role?.name || (Array.isArray(user.role) ? (user.role[0]?.type || user.role[0]?.name) : null);
  const normalized = normalizeRoleName(roleVal || user.type || user.name);
  if (normalized === 'admin') return 'admin';
  if (normalized === 'content-manager') return 'content-manager';
  return normalized;
}

async function getFullUser(strapi, userId) {
  if (!userId) return null;
  return strapi.db.query('plugin::users-permissions.user').findOne({
    where: { id: userId },
    populate: { role: true },
  });
}

async function enforceBlogActionAccess(strapi, ctx, blogDocumentId, allowPublicRead = false) {
  const user = ctx.state.user;
  const isPublicRequest = !user;

  if (isPublicRequest) {
    if (allowPublicRead) return { allowed: true, userRole: null };
    return { allowed: false, reason: 'Authentication required.' };
  }

  const fullUser = await getFullUser(strapi, user.id);
  const roleType = getUserRoleType(fullUser || user);

  if (roleType === 'admin') {
    return { allowed: true, userRole: 'admin' };
  }

  if (roleType === 'content-manager') {
    if (blogDocumentId) {
      const blog = await strapi.documents('api::blog.blog').findOne({
        documentId: blogDocumentId,
        populate: ['creator'],
      });
      if (!blog) {
        return { allowed: false, reason: 'Blog post not found.' };
      }
      const ownerId = blog?.creator?.id || blog?.creator;
      if (ownerId && Number(ownerId) !== Number(user.id)) {
        return { allowed: false, reason: 'You can only manage your own blog posts.' };
      }
    }
    return { allowed: true, userRole: 'content-manager' };
  }

  return { allowed: false, reason: 'You do not have permission to manage blog posts.' };
}

module.exports = createCoreController('api::blog.blog', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    let isStaff = false;

    if (user) {
      const fullUser = await getFullUser(strapi, user.id);
      const roleType = getUserRoleType(fullUser || user);
      isStaff = ['admin', 'content-manager'].includes(roleType);
    }

    if (!isStaff) {
      ctx.query = { ...ctx.query, status: 'published' };
    }
    return super.find(ctx);
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    let isStaff = false;

    if (user) {
      const fullUser = await getFullUser(strapi, user.id);
      const roleType = getUserRoleType(fullUser || user);
      isStaff = ['admin', 'content-manager'].includes(roleType);
    }

    if (!isStaff) {
      ctx.query = { ...ctx.query, status: 'published' };
    }

    const response = await super.findOne(ctx);

    if (!isStaff && response?.data) {
      const blog = response.data;
      if (!blog.publishedAt) {
        return ctx.notFound('Blog post not found.');
      }
    }
    return response;
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) {
      return ctx.unauthorized('Authentication required to create a blog post.');
    }

    const fullUser = await getFullUser(strapi, user.id);
    const roleType = getUserRoleType(fullUser || user);
    if (!['admin', 'content-manager'].includes(roleType)) {
      return ctx.forbidden('Only Admin and Content Manager can create blog posts.');
    }

    const payload = { ...ctx.request.body, data: { ...(ctx.request.body?.data || {}) } };
    // ALWAYS force publishedAt to null on creation to guarantee Draft status
    payload.data.publishedAt = null;
    ctx.request.body = payload;
    return super.create(ctx);
  },

  async update(ctx) {
    const { documentId } = ctx.params;
    const access = await enforceBlogActionAccess(strapi, ctx, documentId, false);
    if (!access.allowed) {
      return ctx.forbidden(access.reason || 'You do not have permission to update this blog post.');
    }
    return super.update(ctx);
  },

  async delete(ctx) {
    const { documentId } = ctx.params;
    const access = await enforceBlogActionAccess(strapi, ctx, documentId, false);
    if (!access.allowed) {
      return ctx.forbidden(access.reason || 'You do not have permission to delete this blog post.');
    }
    return super.delete(ctx);
  },

  async publish(ctx) {
    const { documentId } = ctx.params;
    if (!documentId) {
      return ctx.badRequest('Document ID is required.');
    }

    const access = await enforceBlogActionAccess(strapi, ctx, documentId, false);
    if (!access.allowed) {
      return ctx.forbidden(access.reason || 'Only Admin and Content Manager can publish blog posts.');
    }

    try {
      const published = await strapi.documents('api::blog.blog').publish({ documentId });
      return ctx.send({ data: published });
    } catch (error) {
      strapi.log.error('Failed to publish blog document:', error);
      return ctx.badRequest(error.message || 'Unable to publish blog post.');
    }
  },

  async unpublish(ctx) {
    const { documentId } = ctx.params;
    if (!documentId) {
      return ctx.badRequest('Document ID is required.');
    }

    const access = await enforceBlogActionAccess(strapi, ctx, documentId, false);
    if (!access.allowed) {
      return ctx.forbidden(access.reason || 'Only Admin and Content Manager can unpublish blog posts.');
    }

    try {
      const unpublished = await strapi.documents('api::blog.blog').unpublish({ documentId });
      return ctx.send({ data: unpublished });
    } catch (error) {
      strapi.log.error('Failed to unpublish blog document:', error);
      return ctx.badRequest(error.message || 'Unable to unpublish blog post.');
    }
  },
}));

