// tray-close setting check-box
const closeTrayCheck = document.getElementById("close-tray-check");
const startWithWindowCheck = document.getElementById("start-with-window-check");
const autoRecommandCheck = document.getElementById("auto-recommand-check");

(async () => {
  let preference = JSON.parse(
    await window.preLoadedElectronAPI.getPreference()
  );
  closeTrayCheck.checked = preference.closeTrayState;
  startWithWindowCheck.checked = preference.startWithWindow;
  autoRecommandCheck.checked = preference.enableAutoRecommand;
})();

closeTrayCheck.addEventListener("change", (e) => {
  window.electronAPI.setCloseTrayState(closeTrayCheck.checked);
});
startWithWindowCheck.addEventListener("change", (e) => {
  window.electronAPI.setStartWithWindow(startWithWindowCheck.checked);
});
autoRecommandCheck.addEventListener("change", (e) => {
  window.electronAPI.setAutoRecommand(autoRecommandCheck.checked);
});

// new command file find dialog
const filePathInput = document.getElementsByClassName("path")[0];
const fileFinderBtn = document.getElementById("path-find");
fileFinderBtn.addEventListener("mouseenter", (e) => {
  fileFinderBtn.style.color = "white";
  fileFinderBtn.style.backgroundColor = "#3d8bfd";
});
fileFinderBtn.addEventListener("mouseleave", (e) => {
  fileFinderBtn.style.color = "#3d8bfd";
  fileFinderBtn.style.backgroundColor = "#333";
});
fileFinderBtn.addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFile();
  filePathInput.value = filePath;
});

// new command save button
const newCmdBtn = document.getElementById("new-cmd-save");
newCmdBtn.addEventListener("mouseenter", (e) => {
  newCmdBtn.style.color = "white";
  newCmdBtn.style.backgroundColor = "green";
});
newCmdBtn.addEventListener("mouseleave", (e) => {
  newCmdBtn.style.color = "green";
  newCmdBtn.style.backgroundColor = "#333";
});
newCmdBtn.addEventListener("click", async (e) => {
  let cmd = document.getElementById("new-cmd").value;
  let path = document.getElementById("new-path").value;

  if (cmd == "") {
    alert("실행 명령어를 입력하여 주십시오");
    document.getElementById("new-cmd").value = "";
    return;
  }

  if (path == "") {
    alert("실행 파일 경로를 지정하여 주십시오");
    document.getElementById("new-path").value = "";
    filePathElement.click();
    return;
  }

  if (path == "undefined") {
    alert("실행 파일 경로를 지정하여 주십시오");
    document.getElementById("new-path").value = "";
    filePathElement.click();
    return;
  }

  let result = await window.electronAPI.newCmdSave(cmd, path);
  if (result) {
    alert("성공적으로 등록되었습니다.");
    location.reload();
  } else {
    alert("에러가 발생하였습니다.");
    location.reload();
  }
});

// Exist commands Rendering
(async () => {
  let cmdList = await window.preLoadedElectronAPI.getCmdList();

  let commandList = document.getElementById("command-list");

  if (JSON.stringify(cmdList) == "{}") {
    let p = document.createElement("p");
    p.style.paddingLeft = "14px";
    p.style.color = "#8a8a8a";
    p.innerText = `-`;
    commandList.append(p);
    return;
  }

  for (let i in cmdList) {
    let p = document.createElement("p");
    p.id = "cmd-item";
    p.innerHTML = `<span class="cmd">${i}</span> : <span class="path">${cmdList[i]}</span>`;
    commandList.append(p);
  }
})();
