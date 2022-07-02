// Notification
const NOTIFICATION_TITLE = "Pandora";
const NOTIFICATION_BODY = "Pandora is Running.";
const NOTIFICATION_CLICK_MESSAGE = "Notification clicked!";

new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY });

// new command file find dialog
const filePathElement = document.getElementsByClassName("path")[0];

filePathElement.addEventListener("click", async () => {
  const filePath = await window.electronAPI.openFile();
  filePathElement.value = filePath;
});

// new command save button
const newCmdBtn = document.getElementById("new-cmd-save");
newCmdBtn.addEventListener("mouseenter", (e) => {
  newCmdBtn.style.color = "white";
  newCmdBtn.style.backgroundColor = "#3d8bfd";
});
newCmdBtn.addEventListener("mouseleave", (e) => {
  newCmdBtn.style.color = "#3d8bfd";
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

(async () => {
  let cmdList = await window.preLoadedElectronAPI.getCmdList();

  let commandList = document.getElementById("command-list");

  if (JSON.stringify(commandList) == "{}") {
    let p = document.createElement("p");
    p.style.paddingLeft = "14px";
    p.style.color = "#8a8a8a";
    p.innerText = `-`;
    commandList.append(p);
    return;
  }

  for (let i in cmdList) {
    let p = document.createElement("p");
    p.innerText = `${i} : ${cmdList[i]}`;
    commandList.append(p);
  }
})();
