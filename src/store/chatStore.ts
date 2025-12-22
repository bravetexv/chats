import { create } from 'zustand';
import type { ChatMessage, Platform } from '../types';
import { persist } from 'zustand/middleware';

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

    // Server Settings
    serverEnabled: boolean;
    serverPort: number;
    serverUrl: string;
    setServerEnabled: (enabled: boolean) => void;
    setServerPort: (port: number) => void;
    setServerUrl: (url: string) => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set, get) => ({
            messages: [],
            addMessage: (message) => {
                set((state) => {
                    // Prevenir duplicados por ID
                    if (state.messages.some(m => m.id === message.id)) {
                        return state;
                    }
                    return {
                        messages: [...state.messages, message].slice(-500) // Keep last 500 messages
                    };
                });

                // Broadcast to local server widget
                if (get().serverEnabled && (window as any).electron) {
                    (window as any).electron.send('broadcast-message', message);

                    // Broadcast TTS if enabled
                    const state = get();
                    if (state.ttsEnabled) {
                        const ttsData = {
                            text: state.ttsReadName ? `${message.username} dice: ${message.content}` : message.content,
                            voice: state.ttsVoice,
                            rate: state.ttsRate,
                            pitch: state.ttsPitch,
                            volume: state.ttsVolume,
                            language: state.ttsLanguage
                        };
                        (window as any).electron.send('broadcast-tts', ttsData);
                    }
                }
            },
            clearMessages: () => set({ messages: [] }),

            connectedPlatforms: {
                twitch: false,
                youtube: false,
                kick: false,
            },
            setConnected: (platform, isConnected) => set((state) => ({
                connectedPlatforms: { ...state.connectedPlatforms, [platform]: isConnected }
            })),

            viewerCounts: {
                twitch: 0,
                youtube: 0,
                kick: 0,
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

            // Server Settings
            serverEnabled: false,
            serverPort: 3000,
            serverUrl: '',
            setServerEnabled: (enabled) => set({ serverEnabled: enabled }),
            setServerPort: (port) => set({ serverPort: port }),
            setServerUrl: (url) => set({ serverUrl: url }),
        }),
        {
            name: 'chat-storage',
            partialize: (state) => ({
                ttsEnabled: state.ttsEnabled,
                ttsReadName: state.ttsReadName,
                ttsVoice: state.ttsVoice,
                ttsLanguage: state.ttsLanguage,
                ttsRate: state.ttsRate,
                ttsPitch: state.ttsPitch,
                ttsVolume: state.ttsVolume,
                serverEnabled: state.serverEnabled,
                serverPort: state.serverPort
            }),
        }
    )
);
