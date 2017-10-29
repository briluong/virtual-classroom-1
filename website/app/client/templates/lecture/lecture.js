/*****************************************************************************/
/* Lecture: Event Handlers */
/*****************************************************************************/
Template.Lecture.events({
	'change .toggle-lecture-active input': function(event) {
		// toggle active and inactive of lecture
		Meteor.call('toggleLecture', Session.get('lectureId'))
	},
	'click #lecture-file-upload-trigger': function() {
		$('#lecture-file-upload-modal').modal('open')
	},
	'click #lecture-settings-trigger': function() {
		$('#lecture-settings-modal').modal('open')
	},
	'click #clear-display-question': function() {
		$('#displayQuestion').val('')
		$('#displayQuestion-label').removeClass("active")
		Meteor.call('updateLectureDisplayQuestion', this._id, '')
	},
	'click #send-display-question': function() {
		var question = $('#displayQuestion').val()
		if (question) {
			Meteor.call('updateLectureDisplayQuestion', this._id, question, function(error, result) {
				if (error) {
					console.log(error)
				} else {
					Materialize.toast('Question added', 4000)
				}
			})
		}
	}
});

/*****************************************************************************/
/* Lecture: Helpers */
/*****************************************************************************/
Template.Lecture.helpers({
	lecture: function() {
		return Lectures.findOne(Session.get('lectureId'))
	},
	isActive: function() {
		// return true is this lecture is active
		var lecture = Lectures.findOne(Session.get('lectureId'))
		if (lecture) return lecture.active
	},
	numberOfOnlineStudents: function() {
		var enrolledStudents = Courses.findOne(Session.get('courseId')).students
		var onlineStudents = []
		enrolledStudents.forEach(function(studentId) {
			var user = Meteor.users.findOne(studentId)
			if (user.profile.online) onlineStudents.push(studentId)
		})
		return onlineStudents.length
	},
	questions: function() {
		var questions = Questions.collection.find({
			"meta.lectureId": Session.get("lectureId"),
			"meta.display": true
		}, {sort: {createdAt: -1}})
		if (questions.count()) return questions
	},
	activeDisplayQuestion: function() {
		if (this.displayQuestion != "") return 'active'
	}
});

/*****************************************************************************/
/* Lecture: Lifecycle Hooks */
/*****************************************************************************/
Template.Lecture.onCreated(function () {
});

Template.Lecture.onRendered(function () {
	$('#lecture-file-upload-modal').modal()
	$('#lecture-settings-modal').modal()
	var courseCode = Router.current().params.code
	var title = Router.current().params.lecture
	var course = Courses.findOne({code: courseCode})
	var lecture = Lectures.findOne({$and: [{title: title}, {courseCode:courseCode}]})
	if (course) Session.set('courseId', course._id)
	if (lecture) Session.set('lectureId', lecture._id)
});

Template.Lecture.onDestroyed(function () {
});
