console.log("main process working");

const electron = require("electron"); //including electron
const robot = require("robotjs");
const ipc = electron.ipcMain;
const app = electron.app;						//Including app sub-module
const BrowserWindow = electron.BrowserWindow;	//Including BrowserWindow sub-module
const path = require("path");	//Built in path module
const url = require("url");		//Built in url module

let userData;

let win;



function applyRobot (data){
	  
	console.log(data.leftclick);

	  var x = data.x;
      var y = data.y;
	if(data.leftclick==true){
		robot.mouseClick();
	}
	if(data.doubleclick){
		robot.mouseClick('left',true);
	}
	if(data.rightclick){
		robot.mouseClick('right',false);
	}
     robot.moveMouse(x,y);
	   
	   function scale (x, fromLow, fromHigh, toLow, toHigh) {
		return (x - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow
	  }
}
let indexURL = { 
	pathname: path.join(__dirname, 'Views/index/index.html'),
	protocol: 'file',
	slashes: true
}

function createWindow() {
	win = new BrowserWindow({webPreferences: {nodeIntegration: true}, width: 700, height: 400}); 
	win.loadURL(url.format(indexURL));
	
	
	let offer = "Client: Hello Server";
	socket.emit('offer', offer);
	win.on('closed', () => {win = null;}); 
}


ipc.on('userData-send', (event,arg) => {
	console.log(arg);
	userData = arg;
	event.reply('userData-Reply', arg);
});

ipc.on('userData-get', (event,arg) => {
	event.reply('userData-set', userData);
});

ipc.on('robotData-send', (event,arg) => {
	event.reply('robotData-reply', "Robot message is recieved");
	applyRobot(JSON.parse(arg));
});


app.on('ready', createWindow);


app.on('window-all-closed', () => {
	if(process.platform !== 'darwin'){
		app.quit();
	}
});
app.on('activate', () => {
	if(win === null){
		createWindow();
	}
});