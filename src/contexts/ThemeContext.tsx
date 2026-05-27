"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const Ctx = createContext<{ theme: Theme; toggle: (e?: React.MouseEvent) => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem("ortist-theme") as Theme) ?? "dark";
    setTheme(stored);
    document.documentElement.classList.toggle("light", stored === "light");
  }, []);

  function applyTheme() {
    setTheme(prev => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("ortist-theme", next);
      document.documentElement.classList.toggle("light", next === "light");
      return next;
    });
  }

  function toggle(e?: React.MouseEvent) {
    if (e) {
      const x = e.clientX;
      const y = e.clientY;
      document.documentElement.style.setProperty("--theme-x", `${x}px`);
      document.documentElement.style.setProperty("--theme-y", `${y}px`);
    }

    if ("startViewTransition" in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void })
        .startViewTransition(applyTheme);
    } else {
      applyTheme();
    }
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
