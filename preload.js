const { contextBridge, ipcRenderer } = require("electron");

window.addEventListener("DOMContentLoaded", () => {
  contextBridge.exposeInMainWorld("electronAPI", {
    setTitle: (title) => ipcRenderer.send("set-title", title),
  });

  const replaceText = (selector, text) => {
    const elem = document.getElementById(selector);
    if (elem) elem.innerText = text;
  };

  for (const dependency of ["Chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
