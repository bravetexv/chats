import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Theme {
    name: string;
    gradient: string;
    backgroundImage?: string;
    backgroundBlur: number;
    backgroundOpacity: number;
}

interface ThemeState {
    currentTheme: Theme;
    customBackgroundImage: string | null;
    setTheme: (theme: Theme) => void;
    setCustomBackground: (imageUrl: string | null) => void;
    setBackgroundBlur: (blur: number) => void;
    setBackgroundOpacity: (opacity: number) => void;
}

export const predefinedThemes: Theme[] = [
    {
        name: 'Purple Dream',
        gradient: 'from-slate-900 via-purple-900 to-slate-900',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
    {
        name: 'Ocean Blue',
        gradient: 'from-blue-900 via-cyan-900 to-blue-900',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
    {
        name: 'Sunset',
        gradient: 'from-orange-900 via-red-900 to-pink-900',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
    {
        name: 'Forest',
        gradient: 'from-green-900 via-emerald-900 to-teal-900',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
    {
        name: 'Dark Mode',
        gradient: 'from-gray-900 via-gray-800 to-black',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
    {
        name: 'Neon',
        gradient: 'from-purple-600 via-pink-600 to-blue-600',
        backgroundBlur: 0,
        backgroundOpacity: 100,
    },
];

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            currentTheme: predefinedThemes[0],
            customBackgroundImage: null,

            setTheme: (theme) => set({ currentTheme: theme }),

            setCustomBackground: (imageUrl) => set((state) => ({
                customBackgroundImage: imageUrl,
                currentTheme: { ...state.currentTheme, backgroundImage: imageUrl || undefined },
            })),

            setBackgroundBlur: (blur) => set((state) => ({
                currentTheme: { ...state.currentTheme, backgroundBlur: blur },
            })),

            setBackgroundOpacity: (opacity) => set((state) => ({
                currentTheme: { ...state.currentTheme, backgroundOpacity: opacity },
            })),
        }),
        {
            name: 'theme-storage',
        }
    )
);
