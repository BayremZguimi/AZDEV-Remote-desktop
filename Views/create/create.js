const electron = require("electron");
const ipc = electron.ipcRenderer;
function getRandomString(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}
let captcha = getRandomString(10);


document.getElementById('captcha').innerHTML = captcha;

var conn = new WebSocket('ws://ghost-signallingserver.herokuapp.com');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};

var connectedUser;


conn.onmessage = function (msg) { 
	
   var data = JSON.parse(msg.data); 
	
   switch(data.type) { 
      case "login": 
         handleLogin(data.success); 
         break; 
      case "offer": 
         handleOffer(data.offer, data.name); 
         break; 
      case "answer": 
         handleAnswer(data.answer); 
         break; 
      case "candidate": 
         handleCandidate(data.candidate); 
         break; 
      case "leave": 
         handleLeave(); 
         break; 
      default: 
         break; 
   }
};
  
conn.onerror = function (err) { 
   console.log("Got error", err); 
};
  
function send(message) { 
   if (connectedUser) { 
      message.name = connectedUser; 
   } 
	
   conn.send(JSON.stringify(message)); 
};

const remoteVideo = document.getElementById('remoteVideo');


var yourConn; 
var stream;

function loadStart(){
   setTimeout(function(){
      name = captcha;
      console.log(name);

      if (name.length > 0) { 
         send({ 
            type: "login", 
            name: name 
         }); 
      }
   }, 5000);
}
loadStart();

function handleLogin(success) { 
   if (success === false) { 
      alert("Ooops...try a different username"); 
   } else { 

      const mediaStreamConstraints = {
         video: {
                  mandatory: {
                    chromeMediaSource: 'desktop',
                  }
                }
      };
      navigator.getUserMedia(mediaStreamConstraints, function (myStream) { 
         stream = myStream; 
			
         var configuration = { 
            "iceServers": [{ "url": "stun:stun2.l.google.com:19302" }]
         }; 
			
         yourConn = new webkitRTCPeerConnection(configuration); 
			yourConn.ondatachannel = receiveChannelCallback;
         yourConn.addStream(stream);
			
         yourConn.onaddstream = function (e) { 
            remoteVideo.srcObject = e.stream; 
         };
			
         yourConn.onicecandidate = function (event) { 
            if (event.candidate) { 
               send({ 
                  type: "candidate", 
                  candidate: event.candidate 
               }); 
            } 
         };	
         
      }, function (error) { 
         console.log(error); 
      }); 	
   } 
};

  
function handleOffer(offer, name) { 
   connectedUser = name;
   yourConn.setRemoteDescription(new RTCSessionDescription(offer));
	
   yourConn.createAnswer(function (answer) { 
      yourConn.setLocalDescription(answer); 
		
      send({ 
         type: "answer", 
         answer: answer 
      }); 
		
   }, function (error) { 
      alert("Error when creating an answer"); 
   }); 
};
  
function handleAnswer(answer) { 
   yourConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
function handleCandidate(candidate) { 
   yourConn.addIceCandidate(new RTCIceCandidate(candidate)); 
};

function handleLeave() { 
   connectedUser = null; 
   remoteVideo.src = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};

function receiveChannelCallback(event) {
   receiveChannel = event.channel;
   receiveChannel.onmessage = handleReceiveMessage;

 }


 function handleReceiveMessage(event)
{
  ipc.send('robotData-send',event.data);
  ipc.on('robotData-reply', function(event,arg) {
  });
  
}
