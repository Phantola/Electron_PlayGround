const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("preLoadedElectronAPI", {
  cmdExecute: (cmdString) => ipcRenderer.send("cmd-execute", cmdString),
});

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    // cmdExecute: (cmdString) => ipcRenderer.send("cmd-execute", cmdString),
  });
});
