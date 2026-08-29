'use strict';

/**
 * course controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::course.course', function ({ strapi }) {
	return {
		async find(ctx) {
			const user = ctx.state.user;

			if (user) {
				const role = String(user.role && (user.role.type || user.role.name) || '').toLowerCase();
				if (role === 'instructor') {
					const courses = await strapi.documents('api::course.course').findMany({
						filters: { instructor: { id: user.id } },
						populate: { instructor: true, thumbnail: true },
					});

					return {
						data: courses,
						meta: {
							pagination: {
								page: 1,
								pageSize: courses.length || 10,
								pageCount: 1,
								total: courses.length,
							},
						},
					};
				}
			}

			return super.find(ctx);
		},

		async findOne(ctx) {
			const user = ctx.state.user;
			const targetId = ctx.params.documentId || ctx.params.id;

			let course = await strapi.documents('api::course.course').findOne({
				documentId: String(targetId),
				populate: { instructor: true, thumbnail: true },
			});

			if (!course && /^\d+$/.test(String(targetId))) {
				const found = await strapi.documents('api::course.course').findMany({
					filters: { id: Number(targetId) },
					populate: { instructor: true, thumbnail: true },
				});
				if (found && found.length > 0) {
					course = found[0];
				}
			}

			if (!course) return ctx.notFound('Course not found.');

			if (user) {
				const role = String(user.role && (user.role.type || user.role.name) || '').toLowerCase();
				if (role === 'instructor' && String(course.instructor?.id) !== String(user.id)) {
					return ctx.forbidden('You are not authorized to view this course.');
				}
			}

			return {
				data: course,
				meta: {},
			};
		},

		async create(ctx) {
			const user = ctx.state.user;
			if (!user) return ctx.unauthorized('Authentication required.');

			const role = String(user.role && (user.role.type || user.role.name) || '').toLowerCase();
			const requestData = ctx.request.body?.data || {};
			const instructorId = role === 'instructor' ? user.id : requestData.instructor;

			const course = await strapi.documents('api::course.course').create({
				data: {
					...requestData,
					...(instructorId ? { instructor: instructorId } : {}),
				},
				status: 'published',
				populate: { instructor: true, thumbnail: true },
			});

			return {
				data: course,
				meta: {},
			};
		},

		async update(ctx) {
			const user = ctx.state.user;
			if (!user) return ctx.unauthorized('Authentication required.');

			const role = String(user.role && (user.role.type || user.role.name) || '').toLowerCase();
			const targetId = ctx.params.documentId || ctx.params.id;

			let course = await strapi.documents('api::course.course').findOne({
				documentId: String(targetId),
				populate: { instructor: true },
			});

			if (!course && /^\d+$/.test(String(targetId))) {
				const found = await strapi.documents('api::course.course').findMany({
					filters: { id: Number(targetId) },
					populate: { instructor: true },
				});
				if (found && found.length > 0) course = found[0];
			}

			if (!course) return ctx.notFound('Course not found.');

			if (role === 'instructor') {
				if (String(course.instructor && course.instructor.id) !== String(user.id)) {
					return ctx.forbidden('You are not authorized to update this course.');
				}
				if (ctx.request.body?.data) {
					delete ctx.request.body.data.instructor;
				}
			}

			const updateData = ctx.request.body?.data || {};
			const updated = await strapi.documents('api::course.course').update({
				documentId: course.documentId,
				data: updateData,
				status: 'published',
				populate: { instructor: true, thumbnail: true },
			});

			return {
				data: updated,
				meta: {},
			};
		},

		async delete(ctx) {
			const user = ctx.state.user;
			if (!user) return ctx.unauthorized('Authentication required.');

			const role = String(user.role && (user.role.type || user.role.name) || '').toLowerCase();
			const targetId = ctx.params.documentId || ctx.params.id;

			let course = await strapi.documents('api::course.course').findOne({
				documentId: String(targetId),
				populate: { instructor: true },
			});

			if (!course && /^\d+$/.test(String(targetId))) {
				const found = await strapi.documents('api::course.course').findMany({
					filters: { id: Number(targetId) },
					populate: { instructor: true },
				});
				if (found && found.length > 0) course = found[0];
			}

			if (!course) return ctx.notFound('Course not found.');

			if (role === 'instructor') {
				if (String(course.instructor && course.instructor.id) !== String(user.id)) {
					return ctx.forbidden('You are not authorized to delete this course.');
				}
			}

			return super.delete(ctx);
		},
	};
});
