const cmdInput = document.getElementById("cmd");
const autoCompBox = document.getElementById("auto-complete");
let autoCompleteState;

window.preLoadedElectronAPI.getAutoRecommand((_event, state) => {
  autoCompleteState = state;
  if (!state) autoCompBox.innerHTML = "";
});

cmdInput.focus();
cmdInput.addEventListener("keypress", () => {
  autoCompBox.innerHTML = "";
});
cmdInput.addEventListener("keyup", async function (e) {
  if (e.code == "Enter") {
    window.preLoadedElectronAPI.cmdExecute(this.value);
    this.value = "";
  }

  if (e.code == "Escape") {
    window.preLoadedElectronAPI.closeCmdPopup();
    this.value = "";
    return;
  }

  // 자동완성
  if (autoCompleteState) {
    let recommand =
      this.value == ""
        ? ""
        : await window.electronAPI.cmdAutoRecommand(this.value);

    autoCompBox.innerHTML = "&nbsp".repeat(this.value.length) + recommand;
  }
});
