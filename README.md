# Firebase + WebRTC 

Application to make video calls in a shared room where you can choose to share or not share the microphone, camera, and screen.

To begin the project, we followed the tutorial specified at https://webrtc.org/getting-started/firebase-rtc-codelab. Building upon this code and 
analyzing the official WebRTC website at https://webrtc.github.io/samples/, we added new functionalities. Additionally, we incorporated Bootstrap and 
the Font Awesome icon library to enhance the views and make them responsive. The final result is hosted at https://fir-webrtc-idaira2.web.app/. 
The changes made include:

● Addition of the option to share and stop sharing the screen.
● Addition of the option to share and stop sharing the camera.
● Addition of the option to share and stop sharing the microphone.
● Initiating video calls without transmitting audio and video to ensure participants' privacy.
● Identifying the calling and remote users below the videos.
● Button to copy the call identifier when creating a room.
● Modification of views with the appearance and disappearance of buttons on the screen based on whether they are needed, and responsive videos.


Steps followed:

1. Created a user account on Firebase.
2. Created a project in the Firebase console.
3. Created both Firestore Database and RealTime Database in the project.
4. Created a local folder and used the command prompt (using cmd, as some Firebase commands do not work correctly with Git Bush Here) to clone the
   project from https://github.com/webrtc/FirebaseRTC.
6. Accessed the project with cd FirebaseRTC, installed Firebase, logged in, and added the local project to Firebase using firebase use --add. After this,
   the project can be hosted at a URL using firebase deploy or tested locally with firebase emulators:start.
8. Added the code provided in the tutorial for creating call "rooms," collecting ICE candidates, and describing sessions, while modifying some data such as
   the text displayed when creating a room.
10. Added Bootstrap v4.3.1 and Font Awesome 6.0 through CDN.
11. Added a Bootstrap navbar and footer element.
12. Modified button text, the style of dropdown texts providing information about the "room," and added a brief description at the beginning of the web application.
13. Used Bootstrap classes to make the videos responsive.
14. Added 6 Font Awesome icons for managing audio, video, or screen sharing. These icons also utilize the style.display attribute to be displayed only during a call.
15. Created functions in app.js to enable or disable audio and video.
16. Created functions in app.js for sharing and stopping screen sharing.
17. Added a button styled with Bootstrap classes that calls the copy() function when clicked.
