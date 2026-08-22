const { app, BrowserWindow } = require('electron');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 900,
    title: "iMaxx Mobile App",
    webPreferences: {
      nodeIntegration: false,   // Disable node integration to avoid webpack/metro module conflicts
      contextIsolation: true,    // Isolate context to mirror standard browser sandbox
    },
    backgroundColor: '#08080C',
  });

  // Load the live Metro development bundle URL
  mainWindow.loadURL('http://localhost:8081');

  // Open developer tools automatically to inspect console messages
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});
