const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  getAutoRecommand: (callback) =>
    ipcRenderer.on("get-auto-recommand", callback),
  closeCmdPopup: () => ipcRenderer.send("close-cmd-popup"),
  cmdExecute: (cmdString) => ipcRenderer.send("cmd-execute", cmdString),
});

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    cmdAutoRecommand: (cmdString) =>
      ipcRenderer.invoke("cmd-auto-recommand", cmdString),
  });
});
