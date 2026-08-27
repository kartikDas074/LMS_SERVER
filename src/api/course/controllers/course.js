'use strict';

/**
 * course controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::course.course', ({ strapi }) => ({
	async findOne(ctx) {
		const result = await super.findOne(ctx);
		const documentId = ctx.params.documentId || ctx.params.id;
		const course = await strapi.db.query('api::course.course').findOne({
			where: { documentId },
			populate: { instructor: true },
		});

		if (result?.data && course?.instructor) {
			result.data.instructor = {
				id: course.instructor.id,
				documentId: course.instructor.documentId,
				username: course.instructor.username,
				email: course.instructor.email,
			};
		}

		return result;
	},
}));
