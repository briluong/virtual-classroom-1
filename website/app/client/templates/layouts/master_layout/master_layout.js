Template.MasterLayout.helpers({
	onCoursePage: function() {
		// if user is on a course page, return the course code
		if (Router.current().params.code) {
			return Router.current().params.code
		}
	},
	onLecturePage: function() {
		// if user is on a lecture page, return the lecture name
		if (Router.current().params.lecture) {
			return Router.current().params.lecture
		}
	}
});

Template.MasterLayout.events({
	'click #login-modal-trigger': function() {
		// $('#login-modal').modal('open');
		$('#login-modal').openModal()
	},
	'click #register-modal-trigger': function() {
		// $('#register-modal').modal('open');
		$('#register-modal').openModal()
	},
	'click #logout': function(event){
		event.preventDefault();
		Meteor.logout();
		Router.go('/');
	}
});

Template.MasterLayout.onRendered(function() {
	// $('#login-modal').modal();
	// $('#register-modal').modal();
	// initialize dropdown menu
	$(".dropdown-button").dropdown();
});