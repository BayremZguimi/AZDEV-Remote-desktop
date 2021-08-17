const electron = require("electron");
const ipc = electron.ipcRenderer;
let BrowserWindow = electron.remote.BrowserWindow;
const path = require("path");
const url = require("url");   


const connectToOtherUsernameBtn = document.getElementById('connectToOtherUsernameBtn');

  
let vStreamURL = {
  pathname: path.join(__dirname, '../vStream/index.html'),
  protocol: 'file',
  slashes: true
}


function createRendererWindow(urlObj) {
  let remoteWin = new BrowserWindow({webPreferences: {nodeIntegration: true}}); 
  remoteWin.setFullScreen(true);
  remoteWin.loadURL(url.format(urlObj));
}

connectToOtherUsernameBtn.addEventListener('click', function() { 
  console.log("join-request");
  let userName = document.getElementById('userName').value;
  let captcha = document.getElementById('captchaInput').value;
  console.log(userName);
  console.log(captcha);

  let userData = {
    un: userName,
    cap: captcha
  };
  
  ipc.send('userData-send',userData);

  ipc.on('userData-Reply', function(event,arg) {
    console.log(arg);
  });

  createRendererWindow(vStreamURL);
});