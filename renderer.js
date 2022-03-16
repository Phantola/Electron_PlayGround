const setTitleButton = document.getElementById("set-title-btn");
const titleInput = document.getElementById("input-title");

setTitleButton.addEventListener("click", () => {
  const title = titleInput.value;
  window.electronAPI.setTitle(title);
});
