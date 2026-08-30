'use strict';

/**
 * lesson-progress controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const utils = require('@strapi/utils');
const { ValidationError, UnauthorizedError, NotFoundError } = utils.errors;

module.exports = createCoreController('api::lesson-progress.lesson-progress', ({ strapi }) => ({
  async create(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('Authentication required to update lesson progress.');
    }

    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role'],
    });
    const userRole = fullUser?.role?.type || fullUser?.role?.name || '';
    if (String(userRole).toLowerCase() !== 'student') {
      throw new Error('Only student accounts can update lesson progress.');
    }

    const requestData = ctx.request.body?.data || ctx.request.body || {};
    const { courseId: rawCourseId, lessonId: rawLessonId, completed = true } = requestData;

    if (!rawCourseId || !rawLessonId) {
      throw new ValidationError('Both courseId and lessonId are required.');
    }

    let course = null;
    if (typeof rawCourseId === 'string' && isNaN(Number(rawCourseId))) {
      course = await strapi.documents('api::course.course').findOne({ documentId: rawCourseId });
    } else {
      course = await strapi.db.query('api::course.course').findOne({
        where: { $or: [{ documentId: String(rawCourseId) }, { id: Number(rawCourseId) }] },
      });
    }
    if (!course) {
      throw new NotFoundError('Course not found.');
    }

    let lesson = null;
    if (typeof rawLessonId === 'string' && isNaN(Number(rawLessonId))) {
      lesson = await strapi.documents('api::lesson.lesson').findOne({ documentId: rawLessonId });
    } else {
      lesson = await strapi.db.query('api::lesson.lesson').findOne({
        where: { $or: [{ documentId: String(rawLessonId) }, { id: Number(rawLessonId) }] },
      });
    }
    if (!lesson) {
      throw new NotFoundError('Lesson not found.');
    }

    if (String(lesson.courseId?.id || lesson.courseId || course.id) !== String(course.id)) {
      throw new ValidationError('The selected lesson does not belong to the specified course.');
    }

    const enrollment = await strapi.db.query('api::enroll.enroll').findOne({
      where: {
        userId: authUser.id,
        courseId: course.id,
      },
    });
    if (!enrollment) {
      throw new ValidationError('You must be enrolled in this course before marking a lesson complete.');
    }

    const existing = await strapi.db.query('api::lesson-progress.lesson-progress').findOne({
      where: {
        userId: { id: authUser.id },
        courseId: { id: course.id },
        lessonId: { id: lesson.id },
      },
    });

    if (existing) {
      const updated = await strapi.documents('api::lesson-progress.lesson-progress').update({
        documentId: existing.documentId,
        data: {
          completed: Boolean(completed),
        },
        status: 'published',
      });
      return { data: updated, meta: { message: 'Lesson progress already existed and was updated.' } };
    }

    const created = await strapi.documents('api::lesson-progress.lesson-progress').create({
      data: {
        userId: authUser.id,
        courseId: course.id,
        lessonId: lesson.id,
        completed: Boolean(completed),
      },
      status: 'published',
    });

    return { data: created };
  },

  async find(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('Authentication required to view lesson progress.');
    }

    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role'],
    });
    const userRole = fullUser?.role?.type || fullUser?.role?.name || '';
    if (String(userRole).toLowerCase() !== 'student') {
      return { data: [] };
    }

    const courseDocumentId = ctx.query?.filters?.courseId?.documentId?.$eq;
    const where = { userId: authUser.id };
    if (courseDocumentId) {
      const course = await strapi.db.query('api::course.course').findOne({
        where: { documentId: String(courseDocumentId) },
        select: ['id'],
      });
      if (!course) return { data: [] };
      where.courseId = course.id;
    }

    const progress = await strapi.db.query('api::lesson-progress.lesson-progress').findMany({
      where,
      populate: {
        lessonId: true,
        courseId: true,
      },
    });

    return { data: progress };
  },
}));
