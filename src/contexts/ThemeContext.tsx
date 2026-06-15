"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light" | "midnight" | "forest" | "rose" | "ocean";

export const THEMES: { id: Theme; label: string; swatch: string }[] = [
  { id: "dark",     label: "Dark",     swatch: "#151515" },
  { id: "light",    label: "Light",    swatch: "#EEE9FB" },
  { id: "midnight", label: "Midnight", swatch: "#0C0F1E" },
  { id: "forest",   label: "Forest",   swatch: "#0A1410" },
  { id: "rose",     label: "Rose",     swatch: "#180D12" },
  { id: "ocean",    label: "Ocean",    swatch: "#071419" },
];

const Ctx = createContext<{
  theme: Theme;
  setTheme: (theme: Theme, e?: React.MouseEvent) => void;
}>({
  theme: "dark",
  setTheme: () => {},
});

function applyClass(theme: Theme) {
  const html = document.documentElement;
  THEMES.forEach(t => html.classList.remove(t.id));
  if (theme !== "dark") html.classList.add(theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("ortist-theme") as Theme) ?? "dark";
    setThemeState(stored);
    applyClass(stored);
  }, []);

  function setTheme(next: Theme, e?: React.MouseEvent) {
    if (e) {
      document.documentElement.style.setProperty("--theme-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--theme-y", `${e.clientY}px`);
    }

    const apply = () => {
      setThemeState(next);
      localStorage.setItem("ortist-theme", next);
      applyClass(next);
    };

    if ("startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(apply);
    } else {
      apply();
    }
  }

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
