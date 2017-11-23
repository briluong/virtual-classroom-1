import {audioLevel} from './audio-meter'

const blob = []
const transcript = 'Unable to transcript audio'
const confidence = 0

/*****************************************************************************/
/* Recorder: Event Handlers */
/*****************************************************************************/
Template.Recorder.events({
	'click #recorder-toggle': function() {
		if (Session.get('state') == 'inactive') {
			recorder()
		} else {
		}
	},
	'click #recorder-submit': function() {
		if (Session.get('state') == 'inactive') {
			console.log("blob: " + blob)
			console.log("transcript: " + transcript)
			console.log("confidence: " + confidence)
			//Meteor.call('submitLectureQuestion', Session.get('lectureId'), Session.get('audioId'))
			Session.set('recorder', false)
			Session.set('audioId', false)
			Session.set('audioURL', false)
			Materialize.toast('Question sent', 4000)
			$('#recorder-modal').modal('close')
		} else {
			Materialize.toast('Unable to record, please try again.', 4000)
		}
	},
	'click #recorder-cancel':function() {
		// if (recorder && recorder.state != 'inactive') {
		// 	recorder.stop()
		// 	Session.set('state', recorder.state)
		// }
		Session.set('recorder', false)
		Session.set('audioId', false)
		Session.set('audioURL', false)
		$('#recorder-modal').modal('close')
	}
});

/*****************************************************************************/
/* Recorder: Helpers */
/*****************************************************************************/
Template.Recorder.helpers({
	showPlayer: function() {
		return Session.get('audioURL')
	},
	getAudioURL: function() {
		return Session.get('audioURL')
	},
	getAudioLevel: function() {
		if (Session.get('recording') === true && Session.get('level'))
			return Session.get('level')
	},
	isRecording: function() {
		return Session.get('state') == 'recording'
	}
});

function recorder() {
	navigator.mediaDevices.getUserMedia({audio:true, video:false})
	.then(function(stream) {
		const chunks = []

		var recorder = new MediaRecorder(stream)
		var recognition = new webkitSpeechRecognition()
		recognition.continuous = false
		recognition.interimResults = false
		recognition.lang = "en-US"

		Session.set('initialized', true)
		recorder.onstart = function() {
			Session.set('state', recorder.state)
			recognition.start()
			console.log("Recorder service has started")
		}

		recorder.onstop = function() {
			Session.set('state', recorder.state)
			// TODO: Stop media properly
			console.log("Recorder service has ended")
			stream.getTracks().forEach(track => track.stop())
		}

		// function to be called when data is received
		recorder.ondataavailable = function(event) {
			console.log("Recorder server has available data")
			// add stream data to chunks
			chunks.push(event.data)
			// if recorder is 'inactive' then recording has finished
			if (recorder.state == 'inactive') {
				blob = new Blob(chunks, {type: 'audio/webm'})

				var time = new Date().getTime()
				blob.name = Session.get('lectureId') + '-' + Meteor.userId() + '-' + time + '.webm'
				
				// convert stream data chunks to a 'webm' audio format as a blob
				var url = URL.createObjectURL(blob)
				Session.set('audioURL', url)

				//uploadAudio(blob, transcript, confidence)
			}
		}

		recognition.onresult = function(event) { 
			recorder.stop()
			recognition.stop()
			Session.set("state", recorder.state)
			var result = event.results[0][0]				
			transcript = result.transcript
			confidence = result.confidence
		}

		$('#recorder-toggle').click(function() {
			if (recorder.state != 'inactive') {
				recorder.stop()
			}
		})
		$('#recorder-cancel').click(function() {
			if (recorder.state != 'inactive') {
				recorder.stop()
			}
		})
		recorder.start()
	}).catch(console.error)
}

function uploadAudio(blob, transcript, confidence) {
	var lecture = Lectures.findOne(Session.get('lectureId'))
	var upload = Audios.insert({
		file: blob,
		streams: 'dynamic',
		chunkSize: 'dynamic',
		meta: {
			lectureId: lecture._id,
			groupId: Session.get('groundId'),
			transcript: transcript,
			confidence: confidence,
			mode: lecture.mode,
			read: false,
			display: false
		}
	}, false)
	upload.on('end', function(error, fileObj) {
		if (error) {
			alert('Error during upload: ' + error.reason);
		} else {
			Session.set("audioId", upload.config.fileId)
		}
	})
	upload.start()
}


/*****************************************************************************/
/* Recorder: Lifecycle Hooks */
/*****************************************************************************/
Template.Recorder.onCreated(function () {
});

Template.Recorder.onRendered(function () {
	Session.set("audioURL", false)
	Session.set('audioId', false)
	Session.set('level',false)
	Session.set('initialized', false)
	Session.set('state', 'inactive')

	var courseCode = Router.current().params.code
	var title = Router.current().params.lecture
	var lecture = Lectures.findOne({$and: [{title: title}, {courseCode:courseCode}]})
	Session.set('lectureId', lecture._id)

	//recorder()
});

Template.Recorder.onDestroyed(function () {
});
