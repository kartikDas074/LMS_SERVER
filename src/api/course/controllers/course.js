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

		async studentProgress(ctx) {
			const authUser = ctx.state.user;
			if (!authUser) return ctx.unauthorized('Authentication required.');

			const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
				where: { id: authUser.id },
				populate: ['role'],
			});

			const role = String(fullUser?.role?.type || fullUser?.role?.name || '').toLowerCase();
			
			if (role !== 'admin' && role !== 'content-manager' && role !== 'instructor') {
				return ctx.forbidden('Access denied. Role not authorized.');
			}
			
			const courseId = ctx.query.courseId;
			if (!courseId) return ctx.badRequest('courseId is required');

			let course = await strapi.documents('api::course.course').findOne({
				documentId: String(courseId),
				populate: { instructor: true },
			});

			if (!course && /^\d+$/.test(String(courseId))) {
				const found = await strapi.documents('api::course.course').findMany({
					filters: { id: Number(courseId) },
					populate: { instructor: true },
				});
				if (found && found.length > 0) course = found[0];
			}

			if (!course) return ctx.notFound('Course not found.');

			if (role === 'instructor') {
				if (String(course.instructor && course.instructor.id) !== String(authUser.id)) {
					return ctx.forbidden('You are not authorized to view progress for this course.');
				}
			}

			// Find all enrollments for this course
			const enrollments = await strapi.documents('api::enroll.enroll').findMany({
				filters: { courseId: { documentId: course.documentId } },
				populate: { userId: true },
			});

			// Find total lessons for this course
			const lessons = await strapi.documents('api::lesson.lesson').findMany({
				filters: { courseId: { documentId: course.documentId } },
			});
			const totalLessons = lessons.length;

			const students = [];

			for (const enroll of enrollments) {
				if (!enroll.userId) continue;
				
				const studentId = enroll.userId.id;
				const studentName = enroll.userId.username || enroll.userId.email || 'Unknown Student';

				// Find completed lessons for this student in this course
				const progresses = await strapi.documents('api::lesson-progress.lesson-progress').findMany({
					filters: {
						courseId: { documentId: course.documentId },
						userId: { id: studentId },
						completed: true
					}
				});

				const completedLessons = progresses.length;
				const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

				students.push({
					name: studentName,
					progress: progressPercent
				});
			}

			return {
				course: {
					id: course.documentId,
					title: course.title
				},
				students
			};
		}
	};
});
