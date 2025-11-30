"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Load theme preference, default to dark
    const saved = localStorage.getItem('payless-theme');
    const prefersDark = saved ? saved === 'dark' : true;
    setIsDark(prefersDark);
    
    // Apply theme to document
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('payless-theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-sm hover:opacity-80 transition-opacity"
      aria-label="Toggle theme"
    >
      {isDark ? '☀' : '☾'}
    </button>
  );
}

