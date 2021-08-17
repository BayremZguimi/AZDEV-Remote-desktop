const electron = require("electron");
const ipc = electron.ipcRenderer;

var name; 
var connectedUser;
var userData = {
   un: null,
   cap: null
}


ipc.send('userData-get',userData);

ipc.on('userData-set', function(event,arg) {
   userData = arg;
   console.log(arg);
});

var conn = new WebSocket('ws://ghost-signallingserver.herokuapp.com');
  
conn.onopen = function () { 
   console.log("Connected to the signaling server"); 
};

conn.onmessage = function (msg) { 
   console.log("Got message", msg.data);
	
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


var loginPage = document.querySelector('#loginPage'); 
var loginBtn = document.querySelector('#loginBtn'); 

var callPage = document.querySelector('#callPage'); 
var callBtn = document.querySelector('#callBtn'); 

var hangUpBtn = document.querySelector('#hangUpBtn');
  
const remoteVideo = document.getElementById('remoteVideo');

var yourConn; 
var stream;
  
callPage.style.display = "none";

function loadStart(){
   setTimeout(function(){
      name = userData.un;
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
      
      loginPage.style.display = "none";
      callPage.style.display = "block";
     
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
         openDataChannel();	
      }, function (error) { 
         console.log(error); 
      }); 	
      
   } 
};
  


callBtn.addEventListener("click", function () { 
   var callToUsername = userData.cap;

   if (callToUsername.length > 0) { 

      connectedUser = callToUsername;
      console.log(connectedUser);
      
      yourConn.createOffer(function (offer) { 
         send({ 
            type: "offer", 
            offer: offer 
         }); 
         
         yourConn.setLocalDescription(offer); 
      }, function (error) { 
         alert("Error when creating an offer"); 
      });  
   }    
});
  
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

hangUpBtn.addEventListener("click", function () { 

   send({ 
      type: "leave" 
   });  
	
   handleLeave(); 
});
  
function handleLeave() { 
   connectedUser = null; 
   remoteVideo.src = null; 
	
   yourConn.close(); 
   yourConn.onicecandidate = null; 
   yourConn.onaddstream = null; 
};

function openDataChannel() { 

   var dataChannelOptions = { 
      reliable:true 
   }; 
    
   dataChannel = yourConn.createDataChannel("channel1", dataChannelOptions);
    
   dataChannel.onerror = function (error) { 
      console.log("Error:", error); 
   };
    console.log('datachannel created');

   window.addEventListener('mousemove', e => {
      var data= {
         "x": e.x,
         "y": e.y,
         "width": remoteVideo.getBoundingClientRect().width,
         "height": remoteVideo.getBoundingClientRect().height,
         "leftclick": null
      }
      dataChannel.send(JSON.stringify(data));
   });
   remoteVideo.onclick=function(event){
      var data= {
         "x": e.x,
         "y": e.y,
         "width": remoteVideo.getBoundingClientRect().width,
         "height": remoteVideo.getBoundingClientRect().height,
         "leftclick": true
      }
      dataChannel.send(JSON.stringify(data));
   }

   
}