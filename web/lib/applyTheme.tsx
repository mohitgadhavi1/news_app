export type Theme = "light" | "dark" | "system";



export default function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDarkSystem = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (theme === "system") {
    if (isDarkSystem) root.classList.add("dark");
    else root.classList.remove("dark");
  } else if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}