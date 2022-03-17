const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");

// function for IPC invoke test. Pattern-1
function handleSetTitle(event, title) {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);

  if (title === "quit" || title === "exit") {
    win.close();
  }

  if (title === "appQuit") {
    if (app) {
      app.quit();
    }
  }

  win.setTitle(title);
}

// function for IPC invoke test Patter-2 (two-way)
async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

// modify createWidow() function
const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.loadFile("index.html");
  win.webContents.openDevTools();

  // if listen ipc message 1-way pattern
  ipcMain.on("set-title", handleSetTitle);

  // if listen ipc message 2-way pattern
  ipcMain.handle("dialog:openFile", handleFileOpen);
};

app.whenReady().then(() => {
  createWindow();

  // 맥에서는 창이 닫혀도 프로세스는 계속 실행되기 때문에
  // 사용가능한 창이 없을 때 앱을 활성화하면 새 창이 열리는 기능을 구현해주어야 함
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
