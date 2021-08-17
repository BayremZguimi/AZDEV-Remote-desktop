
var connection = new WebSocket('ws://ghost-signallingserver.herokuapp.com'); 
var name = "";

var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn'); 
var msgInput = document.querySelector('#msgInput'); 
var sendMsgBtn = document.querySelector('#sendMsgBtn'); 
var connectedUser, myConnection, dataChannel;
  
loginBtn.addEventListener("click", function(event) { 
   name = loginInput.value; 
	
   if(name.length > 0) { 
      send({ 
         type: "login", 
         name: name 
      }); 
   } 
}); 
 
connection.onmessage = function (message) { 
   console.log("Got message", message.data); 
   var data = JSON.parse(message.data); 
	
   switch(data.type) { 
      case "login": 
         onLogin(data.success); 
         break; 
      case "offer": 
         onOffer(data.offer, data.name); 
         break; 
      case "answer":
         onAnswer(data.answer); 
         break; 
      case "candidate": 
         onCandidate(data.candidate); 
         break; 
      default: 
         break; 
   } 
}; 
 
function onLogin(success) { 

   if (success === false) { 
      alert("oops...try a different username"); 
   } else { 
      var configuration = { 
         "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] 
      }; 
		
      myConnection = new webkitRTCPeerConnection(configuration, { 
         optional: [{RtpDataChannels: true}] 
      }); 
		
      console.log("RTCPeerConnection object was created"); 
      console.log(myConnection); 
  
     
      myConnection.onicecandidate = function (event) { 
		
         if (event.candidate) { 
            send({ 
               type: "candidate", 
               candidate: event.candidate 
            });
         } 
      }; 
		
      openDataChannel();
		
   } 
};
  
connection.onopen = function () { 
   console.log("Connected"); 
}; 
 
connection.onerror = function (err) { 
   console.log("Got error", err); 
};
  
function send(message) { 
   if (connectedUser) { 
      message.name = connectedUser; 
   }
	
   connection.send(JSON.stringify(message)); 
};

connectToOtherUsernameBtn.addEventListener("click", function () {
  
    var otherUsername = otherUsernameInput.value;
    connectedUser = otherUsername;
     
    if (otherUsername.length > 0) { 
       myConnection.createOffer(function (offer) { 
          console.log(); 
             
          send({ 
             type: "offer", 
             offer: offer 
          }); 
             
          myConnection.setLocalDescription(offer); 
       }, function (error) { 
          alert("An error has occurred."); 
       }); 
    } 
 });
   
 function onOffer(offer, name) { 
    connectedUser = name; 
    myConnection.setRemoteDescription(new RTCSessionDescription(offer));
     
    myConnection.createAnswer(function (answer) { 
       myConnection.setLocalDescription(answer); 
         
       send({ 
          type: "answer", 
          answer: answer 
       }); 
         
    }, function (error) { 
       alert("oops...error"); 
    }); 
 }
 
 function onAnswer(answer) { 
    myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
 }
   
 function onCandidate(candidate) { 
    myConnection.addIceCandidate(new RTCIceCandidate(candidate)); 
 }


function openDataChannel() { 

    var dataChannelOptions = { 
       reliable:true 
    }; 
     
    dataChannel = myConnection.createDataChannel("myDataChannel", dataChannelOptions);
     
    dataChannel.onerror = function (error) { 
       console.log("Error:", error); 
    };
     
    dataChannel.onmessage = function (event) { 
       console.log("Got message:", event.data); 
    };  
 }
   
 sendMsgBtn.addEventListener("click", function (event) { 
    var val = msgInput.value; 
    dataChannel.send(val); 
 });