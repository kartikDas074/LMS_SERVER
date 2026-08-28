'use strict';

/**
 * lesson controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::lesson.lesson', ({ strapi }) => ({
	async create(ctx) {
		const user = ctx.state.user;
		const input = ctx.request.body?.data || {};
		if (!user) return ctx.unauthorized('Authentication required.');
		const course = /^\d+$/.test(String(input.courseId))
			? await strapi.db.query('api::course.course').findOne({ where: { id: Number(input.courseId) }, populate: ['instructor'] })
			: await strapi.documents('api::course.course').findOne({ documentId: String(input.courseId), populate: { instructor: true } });
		if (!course) return ctx.notFound('Course not found.');
		const role = String(user.role?.type || user.role?.name || '').toLowerCase();
		if (role === 'instructor' && String(course.instructor?.id) !== String(user.id)) {
			return ctx.forbidden('You are not authorized to add lessons to this course.');
		}
		return super.create(ctx);
	},
}));
