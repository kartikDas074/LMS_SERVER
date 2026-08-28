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
		await assertQuizAccess(ctx, user, course);
		return super.create(ctx);
	},
	async update(ctx) {
		const user = ctx.state.user;
		if (!user) return ctx.unauthorized('Authentication required.');
		const quiz = await strapi.documents('api::quiz.quiz').findOne({ documentId: String(ctx.params.id), populate: { courseId: { populate: { instructor: true } } } });
		await assertQuizAccess(ctx, user, quiz?.courseId);
		return super.update(ctx);
	},
	async delete(ctx) {
		const user = ctx.state.user;
		if (!user) return ctx.unauthorized('Authentication required.');
		const quiz = await strapi.documents('api::quiz.quiz').findOne({ documentId: String(ctx.params.id), populate: { courseId: { populate: { instructor: true } } } });
		await assertQuizAccess(ctx, user, quiz?.courseId);
		return super.delete(ctx);
	},
}));

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
}
