const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  getCmdList: () => ipcRenderer.invoke("get-cmd-list"),
});

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    setCloseTray: () => ipcRenderer.on("set-close-tray"),
    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    newCmdSave: (cmd, path) => ipcRenderer.invoke("new-command", cmd, path),
  });
});
