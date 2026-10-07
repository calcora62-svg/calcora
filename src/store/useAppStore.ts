import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  recentTools: string[];
  addRecentTool: (toolId: string) => void;
  clearHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),
      favorites: [],
      toggleFavorite: (toolId) =>
        set((state) => ({
          favorites: state.favorites.includes(toolId)
            ? state.favorites.filter((id) => id !== toolId)
            : [...state.favorites, toolId],
        })),
      recentTools: [],
      addRecentTool: (toolId) =>
        set((state) => {
          const filtered = state.recentTools.filter((id) => id !== toolId);
          return { recentTools: [toolId, ...filtered].slice(0, 10) };
        }),
      clearHistory: () => set({ recentTools: [] }),
    }),
    {
      name: 'calcora-storage',
      partialize: (state) => ({
        theme: state.theme,
        favorites: state.favorites,
        recentTools: state.recentTools,
      }),
    }
  )
);
