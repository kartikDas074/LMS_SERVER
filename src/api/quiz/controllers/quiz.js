'use strict';

/**
 * quiz controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::quiz.quiz', ({ strapi }) => ({
	async create(ctx) {
		const user = ctx.state.user;
		if (!user) return ctx.unauthorized('Authentication required.');
		const courseId = ctx.request.body?.data?.courseId;
		const course = await findCourse(strapi, courseId);
		const errorResponse = await assertQuizAccess(ctx, user, course);
		if (errorResponse) return errorResponse;
		return super.create(ctx);
	},
	async update(ctx) {
		const user = ctx.state.user;
		if (!user) return ctx.unauthorized('Authentication required.');
		const targetId = ctx.params.documentId || ctx.params.id;
		const quiz = await findQuiz(strapi, targetId);
		const errorResponse = await assertQuizAccess(ctx, user, quiz?.courseId);
		if (errorResponse) return errorResponse;
		return super.update(ctx);
	},
	async delete(ctx) {
		const user = ctx.state.user;
		if (!user) return ctx.unauthorized('Authentication required.');
		const targetId = ctx.params.documentId || ctx.params.id;
		const quiz = await findQuiz(strapi, targetId);
		const errorResponse = await assertQuizAccess(ctx, user, quiz?.courseId);
		if (errorResponse) return errorResponse;
		return super.delete(ctx);
	},
}));

async function findQuiz(strapi, targetId) {
	if (!targetId) return null;
	return /^\d+$/.test(String(targetId))
		? strapi.db.query('api::quiz.quiz').findOne({ where: { id: Number(targetId) }, populate: ['courseId', 'courseId.instructor'] })
		: strapi.documents('api::quiz.quiz').findOne({ documentId: String(targetId), populate: { courseId: { populate: { instructor: true } } } });
}

async function findCourse(strapi, courseId) {
	if (!courseId) return null;
	return /^\d+$/.test(String(courseId))
		? strapi.db.query('api::course.course').findOne({ where: { id: Number(courseId) }, populate: ['instructor'] })
		: strapi.documents('api::course.course').findOne({ documentId: String(courseId), populate: { instructor: true } });
}

async function assertQuizAccess(ctx, user, course) {
	if (!course) return ctx.notFound('Course not found.');
	const role = String(user.role?.type || user.role?.name || '').toLowerCase();
	if (role === 'instructor' && String(course.instructor?.id) !== String(user.id)) return ctx.forbidden('You are not authorized to manage quizzes for this course.');
	return null;
}
