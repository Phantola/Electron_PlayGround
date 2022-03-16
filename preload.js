window.addEventListener("DOMContentLoaded", () => {
  console.log("test;test");
  alert("test");

  const replaceText = (selector, text) => {
    const elem = document.getElementById(selector);
    if (elem) elem.innerText = text;
  };

  for (const dependency of ["Chrome", "node", "electron"]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
});
