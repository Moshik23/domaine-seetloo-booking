"use client";

// Both icons are always in the DOM; Tailwind's `dark:` variant (driven by the
// `.dark` class the pre-hydration script sets on <html>) controls which one is
// visible via pure CSS. This avoids needing React state (and the render flash /
// hydration-mismatch risk of syncing that state to the DOM class after mount)
// just to pick an icon.
function toggleTheme() {
  const isDark = document.documentElement.classList.toggle("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
}

export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:border-rose-300 hover:text-rose-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:border-rose-700 dark:hover:text-rose-400"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="hidden h-4 w-4 dark:block">
        <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.05a1 1 0 011.41 0l.71.7a1 1 0 11-1.42 1.42l-.7-.71a1 1 0 010-1.41zM17 9a1 1 0 110 2h-1a1 1 0 110-2h1zM10 15a5 5 0 100-10 5 5 0 000 10zm0 3a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm7.24-1.34a1 1 0 010 1.41l-.7.71a1 1 0 11-1.42-1.42l.71-.7a1 1 0 011.41 0zM4 9a1 1 0 110 2H3a1 1 0 110-2h1zm1.34-4.36a1 1 0 011.41 0 1 1 0 010 1.41l-.7.71A1 1 0 114.63 5.36l.71-.71zm0 11.31l.71-.7a1 1 0 111.42 1.41l-.71.71a1 1 0 01-1.42-1.42z" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="block h-4 w-4 dark:hidden">
        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
      </svg>
    </button>
  );
}
