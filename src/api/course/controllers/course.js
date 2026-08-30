'use strict';

/**
 * course controller
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

function resolveRole(userLike) {
	if (!userLike) return '';
	const role = userLike.role;
	return normalizeRoleName(role?.type || role?.name || role || userLike.type || userLike.name || '');
}

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

			const role = resolveRole(authUser) || resolveRole(fullUser);
			if (!['admin', 'content-manager', 'instructor'].includes(role)) {
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

			if (role === 'instructor' && String(course.instructor?.id) !== String(authUser.id)) {
				return ctx.forbidden('You are not authorized to view progress for this course.');
			}

			const enrollments = await strapi.documents('api::enroll.enroll').findMany({
				filters: { courseId: { documentId: course.documentId } },
				populate: { userId: true },
			});

			const lessons = await strapi.documents('api::lesson.lesson').findMany({
				filters: { courseId: { documentId: course.documentId } },
				populate: { courseId: true },
			});
			const totalLessons = lessons.length;

			const studentIds = enrollments
				.map((enroll) => enroll.userId?.id)
				.filter((id) => id != null);

			const lessonProgressRecords = studentIds.length
				? await strapi.documents('api::lesson-progress.lesson-progress').findMany({
					filters: {
						courseId: { documentId: course.documentId },
						userId: { id: { $in: studentIds } },
					},
					populate: { lessonId: true, userId: true },
				})
				: [];

			const quizProgressRecords = studentIds.length
				? await strapi.documents('api::quizprogress.quizprogress').findMany({
					filters: {
						courseId: { documentId: course.documentId },
						userId: { id: { $in: studentIds } },
					},
					populate: { quizId: true, userId: true },
				})
				: [];

			const lessonMap = {};
			for (const progress of lessonProgressRecords) {
				if (!progress?.userId?.id || progress.completed !== true) continue;
				const studentId = progress.userId.id;
				if (!lessonMap[studentId]) lessonMap[studentId] = new Set();
				const lessonId = progress.lessonId?.documentId || progress.lessonId?.id;
				if (lessonId) lessonMap[studentId].add(String(lessonId));
			}

			const quizMap = {};
			for (const progress of quizProgressRecords) {
				if (!progress?.userId?.id) continue;
				const studentId = progress.userId.id;
				if (!quizMap[studentId]) quizMap[studentId] = [];
				quizMap[studentId].push({
					id: progress.documentId || progress.id,
					title: progress.quizId?.title || 'Quiz',
					result: Number(progress.result) || 0,
					totalMarks: Number(progress.totalMarks) || 0,
					percentage: Number(progress.percentage) || 0,
				});
			}

			const students = enrollments
				.map((enroll) => {
					const user = enroll.userId;
					if (!user) return null;

					const studentId = user.id;
					const completedLessonSet = lessonMap[studentId] || new Set();
					const completedLessons = completedLessonSet.size;
					const lessonPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
					const studentQuizzes = quizMap[studentId] || [];

					return {
						id: studentId,
						documentId: user.documentId || user.id,
						name: user.username || user.firstName || user.lastName || 'Unknown Student',
						email: user.email || 'No email provided',
						completedLessons,
						totalLessons,
						lessonPercent,
						quizSummary: studentQuizzes,
					};
				})
				.filter(Boolean);

			return {
				course: {
					id: course.documentId || course.id,
					title: course.title,
					totalLessons,
					enrolledStudents: students.length,
				},
				students,
			};
		}
	};
});
