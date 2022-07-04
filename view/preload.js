const { contextBridge, ipcRenderer } = require("electron");

// renderer 에서는 DOM 이 로드되기 전에 updateCounter에 콜백을 전달하므로,
// window.addEventListener("DOMContentLoaded" ~ 아래에 넣으면 renderer에서 undefined
contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  getCmdList: () => ipcRenderer.invoke("get-cmd-list"),
  refresh: () => ipcRenderer.send("refresh"),
});

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    // setTitle: (title) => ipcRenderer.send("set-title", title),
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    newCmdSave: (cmd, path) => ipcRenderer.invoke("new-command", cmd, path),
  });

  const replaceText = (selector, text) => {
    const elem = document.getElementById(selector);
    if (elem) elem.innerText = text;
  };

  for (const dependency of ["Chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
