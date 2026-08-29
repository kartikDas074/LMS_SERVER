'use strict';

const { createCoreController } = require('@strapi/strapi').factories;
const utils = require('@strapi/utils');
const { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError } = utils.errors;

module.exports = createCoreController('api::enroll.enroll', ({ strapi }) => ({
  async create(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('You must be logged in to enroll.');
    }

    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role'],
    });

    const userRole = fullUser?.role?.type || fullUser?.role?.name || '';
    if (String(userRole).toLowerCase() !== 'student') {
      throw new ForbiddenError('Only users with the Student role can enroll in courses.');
    }

    const requestData = ctx.request.body?.data || ctx.request.body || {};
    const rawCourseId = requestData.courseId;

    if (!rawCourseId) {
      throw new ValidationError('Course identifier (courseId) is required.');
    }

    let course = null;
    if (typeof rawCourseId === 'string' && isNaN(Number(rawCourseId))) {
      course = await strapi.documents('api::course.course').findOne({ documentId: rawCourseId });
    } else {
      course = await strapi.db.query('api::course.course').findOne({
        where: {
          $or: [{ documentId: String(rawCourseId) }, { id: Number(rawCourseId) }],
        },
      });
    }

    if (!course) {
      throw new NotFoundError('The specified course does not exist.');
    }

    const existingEnrollment = await strapi.db.query('api::enroll.enroll').findOne({
      where: {
        userId: authUser.id,
        courseId: course.id,
      },
    });

    if (existingEnrollment) {
      throw new ValidationError('You are already enrolled in this course.');
    }

    const created = await strapi.db.query('api::enroll.enroll').create({
      data: {
        userId: authUser.id,
        courseId: course.id,
        publishedAt: new Date().toISOString(),
      },
    });

    const populated = await strapi.db.query('api::enroll.enroll').findOne({
      where: { id: created.id },
      populate: {
        courseId: {
          populate: {
            thumbnail: true,
            instructor: true,
          },
        },
        userId: {
          populate: ['role'],
        },
      },
    });

    return { data: populated };
  },

  async find(ctx) {
    const authUser = ctx.state.user;
    if (authUser) {
      const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: authUser.id },
        populate: ['role'],
      });
      const userRole = fullUser?.role?.type || fullUser?.role?.name || '';
      if (String(userRole).toLowerCase() === 'student') {
        const enrollments = await strapi.db.query('api::enroll.enroll').findMany({
          where: { userId: authUser.id },
          populate: {
            courseId: {
              populate: {
                thumbnail: true,
                instructor: true,
              },
            },
            userId: {
              populate: ['role'],
            },
          },
        });
        return { data: enrollments };
      }
    }

    return super.find(ctx);
  },

  async my(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('You must be logged in to view your enrollments.');
    }

    const enrollments = await strapi.db.query('api::enroll.enroll').findMany({
      where: { userId: authUser.id },
      populate: {
        courseId: {
          populate: {
            thumbnail: true,
            instructor: true,
          },
        },
        userId: {
          populate: ['role'],
        },
      },
    });

    return { data: enrollments };
  },
}));
