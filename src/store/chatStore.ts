import { create } from 'zustand';
import type { ChatMessage, Platform } from '../types';

interface ChatState {
    messages: ChatMessage[];
    addMessage: (message: ChatMessage) => void;
    clearMessages: () => void;

    // Connection status
    connectedPlatforms: Record<Platform, boolean>;
    setConnected: (platform: Platform, isConnected: boolean) => void;

    // Viewer counts
    viewerCounts: Record<Platform, number>;
    setViewerCount: (platform: Platform, count: number) => void;

    // TTS Settings
    ttsEnabled: boolean;
    ttsReadName: boolean;
    ttsVoice: string; // Voice URI
    ttsLanguage: string; // Language code (e.g., 'es-ES', 'en-US')
    ttsRate: number; // 0.1 to 10
    ttsPitch: number; // 0 to 2
    ttsVolume: number; // 0 to 1
    setTtsEnabled: (enabled: boolean) => void;
    setTtsReadName: (enabled: boolean) => void;
    setTtsVoice: (voice: string) => void;
    setTtsLanguage: (language: string) => void;
    setTtsRate: (rate: number) => void;
    setTtsPitch: (pitch: number) => void;
    setTtsVolume: (volume: number) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message].slice(-500) // Keep last 500 messages
    })),
    clearMessages: () => set({ messages: [] }),

    connectedPlatforms: {
        twitch: false,
        youtube: false,
        kick: false,
        tiktok: false,
    },
    setConnected: (platform, isConnected) => set((state) => ({
        connectedPlatforms: { ...state.connectedPlatforms, [platform]: isConnected }
    })),

    viewerCounts: {
        twitch: 0,
        youtube: 0,
        kick: 0,
        tiktok: 0,
    },
    setViewerCount: (platform, count) => set((state) => ({
        viewerCounts: { ...state.viewerCounts, [platform]: count }
    })),

    // TTS Settings
    ttsEnabled: false,
    ttsReadName: false,
    ttsVoice: '', // Empty means default voice
    ttsLanguage: '', // Empty means all languages/default
    ttsRate: 1.0,
    ttsPitch: 1.0,
    ttsVolume: 1.0,
    setTtsEnabled: (enabled: boolean) => set({ ttsEnabled: enabled }),
    setTtsReadName: (enabled: boolean) => set({ ttsReadName: enabled }),
    setTtsVoice: (voice: string) => set({ ttsVoice: voice }),
    setTtsLanguage: (language: string) => set({ ttsLanguage: language }),
    setTtsRate: (rate: number) => set({ ttsRate: rate }),
    setTtsPitch: (pitch: number) => set({ ttsPitch: pitch }),
    setTtsVolume: (volume: number) => set({ ttsVolume: volume }),
}));
