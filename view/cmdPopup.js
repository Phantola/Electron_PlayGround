const cmdInput = document.getElementById("cmd");
cmdInput.focus();
cmdInput.addEventListener("keyup", function (e) {
  if (e.code == "Enter") {
    window.preLoadedElectronAPI.cmdExecute(this.value);
    this.value = "";
  }
});
