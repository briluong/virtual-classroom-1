Router.configure({
	layoutTemplate: 'MasterLayout',
	loadingTemplate: 'Loading',
	notFoundTemplate: 'NotFound',
	trackPageView: true
});

Router.route('/', {
	name: 'home',
	controller: 'HomeController',
	where: 'client'
});

Router.route('profile', {
	name: 'profile',
	controller: 'ProfileController',
	where: 'client'
});

Router.route('create_new_course', {
	name: 'createNewCourse',
	controller: 'CreateNewCourseController',
	where: 'client'
});

Router.route('course', {
	name: 'coursesList',
	controller: 'CoursesListController',
	where: 'client'
});

Router.route('course/:code', {
	name: 'course',
	controller: 'CourseController',
	where: 'client'
});

Router.route('course/:code/:lecture', {
	name: 'lectures',
	controller: 'LecturesController',
	where: 'client'
});

Router.route('/profile/settings', {
	name: 'settings',
	controller: 'SettingsController',
	where: 'client'
});

