"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  darkMode:    boolean;
  toggleDark:  () => void;
  sidebarOpen: boolean;
  setSidebar:  (v: boolean) => void;
}

export const useStore = create<UIStore>()(
  persist(
    (set, get) => ({
      darkMode:   false,
      toggleDark: () => {
        const next = !get().darkMode;
        set({ darkMode: next });
        document.documentElement.classList.toggle("dark", next);
      },
      sidebarOpen: true,
      setSidebar:  (v) => set({ sidebarOpen: v }),
    }),
    {
      name:        "finansapp-ui",
      partialize:  (s) => ({ darkMode: s.darkMode, sidebarOpen: s.sidebarOpen }),
    }
  )
);
