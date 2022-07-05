const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  getCmdList: () => ipcRenderer.invoke("get-cmd-list"),
  getPreference: () => ipcRenderer.invoke("get-preference"),
});

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    setCloseTrayState: (state) => ipcRenderer.send("set-close-tray", state),
    setStartWithWindow: (state) =>
      ipcRenderer.send("set-start-with-window", state),
    setAutoRecommand: (state) => ipcRenderer.send("set-auto-recommand", state),

    openFile: () => ipcRenderer.invoke("dialog:openFile"),
    newCmdSave: (cmd, path) => ipcRenderer.invoke("new-command", cmd, path),
  });
});
