'use strict';

/**
 * quizprogress controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const utils = require('@strapi/utils');
const { ValidationError, UnauthorizedError, NotFoundError } = utils.errors;

module.exports = createCoreController('api::quizprogress.quizprogress', ({ strapi }) => ({
  async create(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('Authentication required to submit quiz progress.');
    }

    const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: authUser.id },
      populate: ['role'],
    });
    const userRole = fullUser?.role?.type || fullUser?.role?.name || '';
    if (String(userRole).toLowerCase() !== 'student') {
      throw new Error('Only student accounts can submit quiz progress.');
    }

    const requestData = ctx.request.body?.data || ctx.request.body || {};
    const {
      courseId: rawCourseId,
      quizId: rawQuizId,
      result = 0,
      totalMarks = 0,
      percentage = 0,
    } = requestData;

    if (!rawCourseId || !rawQuizId) {
      throw new ValidationError('Both courseId and quizId are required.');
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

    let quiz = null;
    if (typeof rawQuizId === 'string' && isNaN(Number(rawQuizId))) {
      quiz = await strapi.documents('api::quiz.quiz').findOne({ documentId: rawQuizId });
    } else {
      quiz = await strapi.db.query('api::quiz.quiz').findOne({
        where: { $or: [{ documentId: String(rawQuizId) }, { id: Number(rawQuizId) }] },
      });
    }
    if (!quiz) {
      throw new NotFoundError('Quiz not found.');
    }

    if (String(quiz.courseId?.id || quiz.courseId || course.id) !== String(course.id)) {
      throw new ValidationError('The selected quiz does not belong to the specified course.');
    }

    const enrollment = await strapi.db.query('api::enroll.enroll').findOne({
      where: {
        userId: authUser.id,
        courseId: course.id,
      },
    });
    if (!enrollment) {
      throw new ValidationError('You must be enrolled in this course before submitting a quiz.');
    }

    const existing = await strapi.db.query('api::quizprogress.quizprogress').findOne({
      where: {
        userId: { id: authUser.id },
        courseId: { id: course.id },
        quizId: { id: quiz.id },
      },
    });

    if (existing) {
      throw new ValidationError('You have already attempted this quiz. Only one attempt is allowed.');
    }

    const numericResult = Number(result) || 0;
    const numericTotalMarks = Number(totalMarks) || 0;
    const computedPercentage = numericTotalMarks > 0
      ? Number(((numericResult / numericTotalMarks) * 100).toFixed(2))
      : Number(percentage) || 0;

    const created = await strapi.documents('api::quizprogress.quizprogress').create({
      data: {
        userId: authUser.id,
        courseId: course.id,
        quizId: quiz.id,
        result: numericResult,
        totalMarks: numericTotalMarks,
        percentage: computedPercentage,
      },
      status: 'published',
    });

    return { data: created };
  },

  async find(ctx) {
    const authUser = ctx.state.user;
    if (!authUser) {
      throw new UnauthorizedError('Authentication required to view quiz progress.');
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

    const progress = await strapi.db.query('api::quizprogress.quizprogress').findMany({
      where,
      populate: {
        quizId: true,
        courseId: true,
      },
    });

    return { data: progress };
  },
}));
