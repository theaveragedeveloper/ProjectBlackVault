"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full
                 bg-vault-surface border border-vault-border
                 text-vault-text-muted hover:text-vault-text hover:border-vault-text-muted
                 flex items-center justify-center shadow-lg transition-all duration-200
                 max-md:bottom-6 max-md:right-3"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
