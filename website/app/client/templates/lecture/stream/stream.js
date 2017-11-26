const peers = {}
const phone = false

/*****************************************************************************/
/* Stream: Event Handlers */
/*****************************************************************************/
Template.Stream.events({
	'click #recorder-modal-trigger': function() {
		Session.set('recorder', true)
		Session.set('audioURL', false)
		$('#recorder-modal').modal('open')
	},
	'click #group-discussion-modal-trigger': function() {
		var user = Meteor.user()
		var group = Groups.findOne(Session.get('groupId'))
		if (user && group && user._id === group.leader) 
			$('#group-discussion-modal').modal('open')
	},
	'click #group-discussion-modal-close': function() {
		$('#group-discussion-modal').modal('close')
	},
	'keyup #group-discussion-textarea': function() {
		// update discussion every 5 seconds after keyup
		clearTimeout(Session.get('typingTimer'))
		if ($('#group-discussion-textarea').val()) {
			typingTimer = setTimeout(function() {
				Meteor.call('updateGroupDiscussion', Session.get('groupId'),  
					$('#group-discussion-textarea').val())
			}, Session.get('typingInterval'))
			Session.set('typingTimer', typingTimer)
		}
	},
	'click .enter-group-discussion': function(event) {
		Session.set('groupId', event.target.dataset.value)
	},
	'click #exit-group-discussion': function() {
		Session.set('groupId', false)
	}
});


/*****************************************************************************/
/* Stream: Helpers */
/*****************************************************************************/
Template.Stream.helpers({
	lecture: function() {
		var lecture = Lectures.findOne(Session.get('lectureId'))
		if (lecture) return lecture
	},
	group: function() {
		var group = Groups.findOne(Session.get('groupId'))
		if (group) return group
	},
	groups: function() {
		var groups = Groups.find({active:true},{sort: {name: 1}}).fetch()
		if (groups.length) return groups
	},
	recorderIsActive: function() {
		var modal = document.getElementById('recorder-modal')
		if (Session.get('recorder') === true) return "muted"
	},
	getDisplayQuestion: function() {
		var lecture = Lectures.findOne(Session.get('lectureId'))
		if (lecture && lecture.displayQuestion) return lecture.displayQuestion
	},
	groupMode: function(mode) {
		if (mode == 'group') {
			voiceChat()
			return true
		} else {
			return false
		}
	},
	getGroupMembers: function() {
		var group = Groups.findOne(Session.get('groupId'))
		if (group) {
			var members = group.members
			members.splice(members.indexOf(Meteor.userId()), 1)
			return members
		}
	},
	avatarPosition: function(index) {
		if (index % 2 == 0) var x = 1.5*Math.floor((index + 1)/2)
		else var x = -1.5*Math.floor((index + 1)/2)
		var y = 1.2
		var z = -2.2
		return x + " " + y + " " + z 
	},
	namePosition: function(index) {
		if (index % 2 == 0) var x = 1.5*Math.floor((index + 1)/2)
		else var x = -1.5*Math.floor((index + 1)/2)
		var y = 0.7
		var z = -2.2
		return x + " " + y + " " + z 
	},
	getGroupNumber: function() {
		var group = Groups.findOne(Session.get('groupId'))
		if (group) return group.number
	},
	activeTextarea: function(discussion) {
		if (discussion) return 'active'
	},
	userCanEditDiscussion: function() {
		var user = Meteor.user()
		var group = Groups.findOne(Session.get('groupId'))
		if (user && group && user._id !== group.leader) return 'disabled'
	},
	groupDiscussion: function() {
		var discussion = GroupDiscussion.find({
			groupId: Session.get('groupId')
		}, {sort: {createdAt: -1}})
		if (discussion) return discussion
	}
});

function voiceChat() {
	if (!phone) {
		// set up the phone
		phone = window.phone = PHONE({
			number: Meteor.userId(),
			publish_key: 'pub-c-91dafed6-af99-459b-abd9-7b3e9ea1a413',
			subscribe_key: 'sub-c-edf059c0-d160-11e7-ad64-4ade014f1547',
			media: {audio: true, video: false},
			ssl: false
		})

		phone.unable(function() {
			console.log("Your device does not support RTCPeerConnection!");
		})

		phone.ready(function() {
			console.log('phone ready')
			var group = Groups.findOne(Session.get('groupId'))
			for (var user in peers) {
				if (peers.hasOwnProperty(user) && !peers[user]) {
					phone.dial(user)
				}
			}
		})

		phone.receive(function(session) {
			var audio  = document.getElementById('voiceChat')
			session.connected(function(session) {
				console.log('session ' + session.number + ' connected')
				if (session.status == 'connected') {
					peers[session.number] = session.video.src
					var source  = document.createElement("source")
					source.id = session.number + '-voiceChat'
					source.src = peers[session.number]
					audio.appendChild(source)
				}
			})
			session.ended(function(session) {
				console.log('session ' + session.number +  ' ended')
				peers[session.number] = false
				var source = document.getElementById(session.number + '-voiceChat')
				if (source) audio.removeChild(source)
			})
		})
	}
} 


/*****************************************************************************/
/* Stream: Lifecycle Hooks */
/*****************************************************************************/
Template.Stream.onCreated(function () {
});

Template.Stream.onRendered(function () {
	var courseCode = Router.current().params.code
	var title = Router.current().params.lecture
	var lecture = Lectures.findOne({$and: [{title: title}, {courseCode:courseCode}]})
	Session.set('lectureId', lecture._id)
	Session.set('recorder', false)
	Session.set('groupId', false)

	var group = Groups.findOne({members:Meteor.userId(),active:true})
	if (group) {
		Session.set('groupId', group._id)
		for (var i = 0; i < group.members.length; i ++) {
			if (group.members[i] != Meteor.userId()) {
				peers[group.members[i]] = false
			}
		}
	}
	
	Meteor.setTimeout(function() {
		$('#group-discussion-modal').modal()
		$('#recorder-modal').modal()
	}, 50)
	document.documentElement.style.overflow = "hidden"

	// variables to textarea update timer
	var typingTimer
	Session.set('typingTimer', typingTimer)
	Session.set('typingInterval', 5000)

	Session.set('phoneInit', false)
});

Template.Stream.onDestroyed(function () {
	document.documentElement.style.overflow = "auto"
	if (phone) {
		phone.hangup()
		phone = false
	}
	peers = {}
});
