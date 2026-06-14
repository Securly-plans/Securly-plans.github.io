console.log("Loaded index.js");

document.addEventListener("DOMContentLoaded", function () {
  const otherGamesButton = document.getElementById("otherGamesButton");
  const themeButton = document.getElementById("themeButton");
  const lightIcon = document.getElementById("lightIcon");
  const darkIcon = document.getElementById("darkIcon");
  const loadingText = document.getElementById("loadingText");
  const loadingBar = document.getElementById("loadingBar");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      lightIcon.classList.add("hidden");
      darkIcon.classList.remove("hidden");
    } else {
      lightIcon.classList.remove("hidden");
      darkIcon.classList.add("hidden");
    }
    localStorage.setItem("theme", theme);
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme("dark");
  }

  let currentContent = loadingText.innerHTML;

  function handleLoaderTextChange(mutationsList, observer) {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList" || mutation.type === "subtree") {
        const newContent = loadingText.innerHTML;
        if (newContent !== currentContent) {
          currentContent = newContent;
          const parts = newContent.split(":");
          const lastPart = parts[parts.length - 1].trim();
          rawPercent = lastPart.replace("%", "").trim();
          if (isNaN(rawPercent) || parseInt(rawPercent) !== Number(rawPercent)) {
            observer.disconnect();
            console.log("Disconnected the observer.");
            return;
          }
          loadingBar.value = rawPercent;
        }
      }
    });
  }

  const observer = new MutationObserver(handleLoaderTextChange);
  const config = { childList: true, subtree: true };
  observer.observe(loadingText, config);

  themeButton.addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  });

  otherGamesButton.addEventListener("click", () => {
    const url = "/games/";
    window.open(url, "_blank").focus();
  });
});
