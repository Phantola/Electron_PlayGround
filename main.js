const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  Menu,
  Tray,
  globalShortcut,
  nativeTheme,
  MenuItem,
} = require("electron");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const cp = require("child_process");

// Global vairables
let win = null; // main window
let tray = null; //tray
let commandPopUp = null; //commandInputPopup
let commandPopUpIsOpened = false;
let closeTrayFlag = true; //true, close action will be tray, false :  close action is real quit application

let commandObj = null; // mapped commands object

// 명령어 매핑파일 로딩 및 생성
if (commandObj == null)
  fs.access("command.json", fs.constants.F_OK, (err) => {
    if (err) {
      fs.writeFileSync("command.json", JSON.stringify({}));
      commandObj = {};
    } else {
      commandObj = JSON.parse(fs.readFileSync("command.json").toString());
    }
  });

app.whenReady().then(() => {
  createWindow();

  // 명령어 입력 팝업 Global shortcut Register
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    if (commandPopUp == null) {
      commandPopUp = createCmdPopUp();
      //commandPopUp.webContents.openDevTools();
      commandPopUpIsOpened = true;
    } else {
      if (commandPopUpIsOpened) {
        commandPopUp.hide();
        commandPopUpIsOpened = false;
      } else {
        commandPopUp.show();
        commandPopUpIsOpened = true;
      }
    }
  });

  // 맥에서는 창이 닫혀도 프로세스는 계속 실행되기 때문에
  // 사용가능한 창이 없을 때 앱을 활성화하면 새 창이 열리는 기능을 구현해주어야 함
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// 메인 윈도우 생성 ==================
function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    title: "Pandora",
    icon: "./icon.png",
    alwaysOnTop: false,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "./view/preload.js"),
    },
  });

  // 다크모드 적용
  nativeTheme.themeSource = "dark";

  // 트레이 생성
  tray = createTray();

  // 최소화하고 작업표시줄에서 다시 눌렀을 때
  win.on("restore", function (e) {
    win.show();
  });

  win.on("minimize", () => {
    win.hide();
  });

  win.on("close", () => {
    if (closeTrayFlag) {
      win.hide();
    } else {
      app.quit();
    }
  });

  win.loadFile("./view/index.html");

  // IPC Message Handlers
  ipcMain.on("set-close-tray", () => {
    closeTrayFlag = !closeTrayFlag;
  });
  ipcMain.handle("new-command", (e, cmd, path) => {
    return generateNewCommand(cmd, path);
  });
  ipcMain.handle("get-cmd-list", (e) => {
    return commandObj;
  });
  ipcMain.handle("dialog:openFile", handleFileOpen);
}

// 파일 찾기 다이얼로그 오픈
async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog();
  if (canceled) {
    return;
  } else {
    return filePaths[0];
  }
}

// 트레이 생성 함수 =================
function createTray() {
  let appIcon = new Tray("./assets/icon.png");
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "열기",
      click: () => {
        win.show();
      },
    },
    {
      label: "종료",
      click: () => {
        saveCommands();
        app.quit();
      },
    },
  ]);

  appIcon.setContextMenu(contextMenu);
}

// 명령어 입력 팝업 생성 ================
function createCmdPopUp() {
  const cmdPopUp = new BrowserWindow({
    width: 800,
    height: 80,
    frame: false,
    transparent: true,
    titleBarStyle: "hidden",
    webPreferences: {
      preload: path.join(__dirname, "./view/cmdPopupPreload.js"),
    },
  });
  cmdPopUp.loadFile("./view/cmdPopup.html");
  cmdPopUp.webContents.openDevTools();

  // esc 로 입력창 닫기
  let menu = new Menu();
  menu.append(
    new MenuItem({
      accelerator: "esc",
      acceleratorWorksWhenHidden: true,
      click: () => {
        cmdPopUp.hide();
        commandPopUpIsOpened = false;
      },
    })
  );
  cmdPopUp.setMenu(menu);

  // 명령 실행 핸들러
  ipcMain.on("cmd-execute", function (e, cmdString) {
    cmdExecute(cmdString);
    commandPopUp.hide();
    commandPopUpIsOpened = false;
  });

  // 명령어 자동완성 핸들러
  ipcMain.handle("cmd-auto-recommand", (e, cmdString) => {
    return cmdAutoRecommand(cmdString);
  });

  return cmdPopUp;
}

// 새로운 명령어 등록
function generateNewCommand(cmd, path) {
  commandObj[cmd] = path;

  if (commandObj[cmd] != undefined) {
    saveCommands();
    return true;
  }
}

// 프로그램 종료 시 json 파일에 저장
function saveCommands() {
  fs.writeFileSync("command.json", JSON.stringify(commandObj));
}

// 명령어 실행 함수
function cmdExecute(cmdString) {
  let path = commandObj[cmdString];

  if (path != undefined) {
    if (path.split(".")[-1] != "exe") {
      cp.execFile(path);
      return;
    }
  }

  if (cmdString.indexOf(":") > -1) {
    cmdString = cmdString.split(":");
    switch (cmdString[0]) {
      case "text":
      case "txt": {
        cp.exec(`notepad ${cmdString[1]}`);
        return;
      }
      case "site": {
        cp.execFile(
          `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`,
          [`${cmdString[1]}`]
        );
        console.log(cmdString[1]);
        return;
      }
      case "open": {
        cp.exec(`explorer.exe ${cmdString[1]}`);
        return;
      }
    }
  }

  cp.exec(cmdString);

  return;
}

// 명령어 추천 함수
function cmdAutoRecommand(cmdString) {
  let str = [];

  let reg = new RegExp(`^${cmdString}`);
  for (let i in commandObj) {
    if (reg.test(i)) str.push(i);
  }

  return str.length == 0 ? "" : str.sort()[0].slice(cmdString.length);
}
