module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/student-progress',
      handler: 'course.studentProgress',
      config: {
        policies: [],
      },
    },
  ],
};
