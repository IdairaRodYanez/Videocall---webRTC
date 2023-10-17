mdc.ripple.MDCRipple.attachTo(document.querySelector('.mdc-button'));

const configuration = {
  iceServers: [
    {
      urls: [
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ],
  iceCandidatePoolSize: 10,
};

const senders = [];
var ID = '';

let peerConnection = null;
let localStream = null;
let remoteStream = null;
let roomDialog = null;
let roomId = null;

function init() {
  document.getElementById('cameraBtn').style.display = 'inline';
  document.getElementById('hangupBtn').style.display = 'none';
  document.getElementById('createBtn').style.display = 'none';
  document.getElementById('joinBtn').style.display = 'none';
  document.getElementById('currentRoom-copy').style.display = 'none';

  document.querySelector('#cameraBtn').addEventListener('click', openUserMedia);
  document.querySelector('#hangupBtn').addEventListener('click', hangUp);
  document.querySelector('#createBtn').addEventListener('click', createRoom);
  document.querySelector('#joinBtn').addEventListener('click', joinRoom);
  roomDialog = new mdc.dialog.MDCDialog(document.querySelector('#room-dialog'));
}

// copy ID function
 function copy() {
  navigator.clipboard.writeText(ID);
}

// share screen
document.getElementById('share-camera').addEventListener('click', async () => {
    localStream.getVideoTracks()[0].enabled = true;
    
    
    //hide the share button and display the "stop-sharing" one
    document.getElementById('share-camera').style.display = 'none';
    document.getElementById('stop-share-camera').style.display = 'inline';
  });

 // stop share camera
 document.getElementById('stop-share-camera').addEventListener('click', async () => {
    localStream.getVideoTracks()[0].enabled = false;

    document.getElementById('share-camera').style.display = 'inline';
    document.getElementById('stop-share-camera').style.display = 'none';
  });

 // share audio
document.getElementById('share-audio').addEventListener('click', async () => {
    localStream.getAudioTracks()[0].enabled = true;
    
    
    //hide the share button and display the "stop-sharing" one
    document.getElementById('share-audio').style.display = 'none';
    document.getElementById('stop-share-audio').style.display = 'inline';
  });

 // stop share audio
 document.getElementById('stop-share-audio').addEventListener('click', async () => {
    localStream.getAudioTracks()[0].enabled = false;

    document.getElementById('share-audio').style.display = 'inline';
    document.getElementById('stop-share-audio').style.display = 'none';
  });

// share screen
document.getElementById('share-screen').addEventListener('click', async () => {
   
    displayMediaStream = await navigator.mediaDevices.getDisplayMedia();
    
    senders.find(sender => sender.track.kind === 'video')
    .replaceTrack(displayMediaStream.getTracks()[0]);
    
    //show what you are showing in your "self-view" video.
    document.getElementById('localVideo').srcObject = displayMediaStream;
    
    //hide the share button and display the "stop-sharing" one
    document.getElementById('share-screen').style.display = 'none';
    document.getElementById('stop-share-screen').style.display = 'inline';
  });

// stop share screen
 document.getElementById('stop-share-screen').addEventListener('click', async () => {
    senders.find(sender => sender.track.kind === 'video')
      .replaceTrack(localStream.getTracks().find(track => track.kind === 'video'));
    document.getElementById('localVideo').srcObject = localStream;
    document.getElementById('share-screen').style.display = 'inline';
    document.getElementById('stop-share-screen').style.display = 'none';
  });

async function createRoom() {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;
  const db = firebase.firestore();
  const roomRef = await db.collection('rooms').doc();

  console.log('Create PeerConnection with configuration: ', configuration);
  peerConnection = new RTCPeerConnection(configuration);

  registerPeerConnectionListeners();

   localStream.getTracks()
    .forEach(track => senders.push(peerConnection.addTrack(track, localStream)));

  // Code for collecting ICE candidates below
  const callerCandidatesCollection = roomRef.collection('callerCandidates');

  peerConnection.addEventListener('icecandidate', event => {
    if (!event.candidate) {
      console.log('Got final candidate!');
      return;
    }
    console.log('Got candidate: ', event.candidate);
    callerCandidatesCollection.add(event.candidate.toJSON());
  });
  // Code for collecting ICE candidates above

  // Code for creating a room below
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log('Created offer:', offer);

  const roomWithOffer = {
    'offer': {
      type: offer.type,
      sdp: offer.sdp,
    },
  };
  await roomRef.set(roomWithOffer);
  roomId = roomRef.id;
  ID = roomRef.id;
  console.log(`New room created with SDP offer. Room ID: ${roomRef.id}`);
  document.querySelector(
      '#currentRoom').innerText = `La sala actual tiene por ID ${roomRef.id} - Eres el creador de la sala`;
  // Code for creating a room above

  peerConnection.addEventListener('track', event => {
    console.log('Got remote track:', event.streams[0]);
    event.streams[0].getTracks().forEach(track => {
      console.log('Add a track to the remoteStream:', track);
      remoteStream.addTrack(track);
    });
  });

  // Listening for remote session description below
  roomRef.onSnapshot(async snapshot => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data && data.answer) {
      console.log('Got remote description: ', data.answer);
      const rtcSessionDescription = new RTCSessionDescription(data.answer);
      await peerConnection.setRemoteDescription(rtcSessionDescription);
    }
  });
  // Listening for remote session description above

  // Listen for remote ICE candidates below
  roomRef.collection('calleeCandidates').onSnapshot(snapshot => {
    snapshot.docChanges().forEach(async change => {
      if (change.type === 'added') {
        let data = change.doc.data();
        console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
        await peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
  // Listen for remote ICE candidates above

  // Habilitamos opciones de stream
  document.getElementById('share-audio').style.display = 'inline';
  document.getElementById('share-camera').style.display = 'inline';
  document.getElementById('share-screen').style.display = 'inline';

  document.getElementById('cameraBtn').style.display = 'none';
  document.getElementById('hangupBtn').style.display = 'inline';
  document.getElementById('createBtn').style.display = 'none';
  document.getElementById('joinBtn').style.display = 'none';
  document.getElementById('currentRoom-copy').style.display = 'inline';
}

function joinRoom() {

  document.querySelector('#confirmJoinBtn').
      addEventListener('click', async () => {
        roomId = document.querySelector('#room-id').value;
        console.log('Join room: ', roomId);
        document.querySelector(
            '#currentRoom').innerText = `La sala actual tiene por ID ${roomId} - Eres el invitado`;
        await joinRoomById(roomId);
      }, {once: true});
  roomDialog.open();
}

async function joinRoomById(roomId) {
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#joinBtn').disabled = true;
  const db = firebase.firestore();
  const roomRef = db.collection('rooms').doc(`${roomId}`);
  const roomSnapshot = await roomRef.get();
  console.log('Got room:', roomSnapshot.exists);

  if (roomSnapshot.exists) {
    console.log('Create PeerConnection with configuration: ', configuration);
    peerConnection = new RTCPeerConnection(configuration);
    registerPeerConnectionListeners();
    localStream.getTracks().forEach(track => {
      senders.push(peerConnection.addTrack(track, localStream))
    });

    // Code for collecting ICE candidates below
    const calleeCandidatesCollection = roomRef.collection('calleeCandidates');
    peerConnection.addEventListener('icecandidate', event => {
      if (!event.candidate) {
        console.log('Got final candidate!');
        return;
      }
      console.log('Got candidate: ', event.candidate);
      calleeCandidatesCollection.add(event.candidate.toJSON());
    });
    // Code for collecting ICE candidates above

    peerConnection.addEventListener('track', event => {
      console.log('Got remote track:', event.streams[0]);
      event.streams[0].getTracks().forEach(track => {
        console.log('Add a track to the remoteStream:', track);
        remoteStream.addTrack(track);
      });
    });

    // Code for creating SDP answer below
    const offer = roomSnapshot.data().offer;
    console.log('Got offer:', offer);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    console.log('Created answer:', answer);
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp,
      },
    };
    await roomRef.update(roomWithAnswer);
    // Code for creating SDP answer above

    // Listening for remote ICE candidates below
    roomRef.collection('callerCandidates').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(async change => {
        if (change.type === 'added') {
          let data = change.doc.data();
          console.log(`Got new remote ICE candidate: ${JSON.stringify(data)}`);
          await peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
    // Listening for remote ICE candidates above
  }
    // Habilitamos opciones de stream
  document.getElementById('share-audio').style.display = 'inline';
  document.getElementById('share-camera').style.display = 'inline';
  document.getElementById('share-screen').style.display = 'inline';

  document.getElementById('cameraBtn').style.display = 'none';
  document.getElementById('hangupBtn').style.display = 'inline';
  document.getElementById('createBtn').style.display = 'none';
  document.getElementById('joinBtn').style.display = 'none';
}

async function openUserMedia(e) {
  const stream = await navigator.mediaDevices.getUserMedia(
      {video: true, audio: true});
  document.querySelector('#localVideo').srcObject = stream;
  localStream = stream;

  //inicialmente apagamos camara y micro
  localStream.getVideoTracks()[0].enabled = false;
  localStream.getAudioTracks()[0].enabled = false;

  remoteStream = new MediaStream();
  document.querySelector('#remoteVideo').srcObject = remoteStream;

  console.log('Stream:', document.querySelector('#localVideo').srcObject);
  
  document.getElementById('cameraBtn').style.display = 'none';
  document.getElementById('hangupBtn').style.display = 'inline';
  document.getElementById('createBtn').style.display = 'inline';
  document.getElementById('joinBtn').style.display = 'inline';
}

async function hangUp(e) {
  const tracks = document.querySelector('#localVideo').srcObject.getTracks();
  tracks.forEach(track => {
    track.stop();
  });

  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
  }

  if (peerConnection) {
    peerConnection.close();
  }

  document.querySelector('#localVideo').srcObject = null;
  document.querySelector('#remoteVideo').srcObject = null;
  document.querySelector('#cameraBtn').disabled = false;
  document.querySelector('#joinBtn').disabled = true;
  document.querySelector('#createBtn').disabled = true;
  document.querySelector('#hangupBtn').disabled = true;
  document.querySelector('#currentRoom').innerText = '';

  // Delete room on hangup
  if (roomId) {
    const db = firebase.firestore();
    const roomRef = db.collection('rooms').doc(roomId);
    const calleeCandidates = await roomRef.collection('calleeCandidates').get();
    calleeCandidates.forEach(async candidate => {
      await candidate.ref.delete();
    });
    const callerCandidates = await roomRef.collection('callerCandidates').get();
    callerCandidates.forEach(async candidate => {
      await candidate.ref.delete();
    });
    await roomRef.delete();
  }

  document.location.reload(true);
}

function registerPeerConnectionListeners() {
  peerConnection.addEventListener('icegatheringstatechange', () => {
    console.log(
        `ICE gathering state changed: ${peerConnection.iceGatheringState}`);
  });

  peerConnection.addEventListener('connectionstatechange', () => {
    console.log(`Connection state change: ${peerConnection.connectionState}`);
  });

  peerConnection.addEventListener('signalingstatechange', () => {
    console.log(`Signaling state change: ${peerConnection.signalingState}`);
  });

  peerConnection.addEventListener('iceconnectionstatechange ', () => {
    console.log(
        `ICE connection state change: ${peerConnection.iceConnectionState}`);
  });
}

init();
