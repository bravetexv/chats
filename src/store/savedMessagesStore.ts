import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavedMessage } from '../types';

interface SavedMessagesState {
    savedMessages: SavedMessage[];
    addSavedMessage: (title: string, content: string) => void;
    removeSavedMessage: (id: string) => void;
    updateSavedMessage: (id: string, title: string, content: string) => void;
}

export const useSavedMessagesStore = create<SavedMessagesState>()(
    persist(
        (set) => ({
            savedMessages: [
                { id: '1', title: 'Bienvenida', content: '¡Bienvenidos al stream! 👋' },
                { id: '2', title: 'Redes', content: 'Sígueme en todas las plataformas: Twitch, YouTube y Kick!' },
                { id: '3', title: 'Gracias', content: 'Gracias por el apoyo! 💜' },
            ],

            addSavedMessage: (title, content) => set((state) => ({
                savedMessages: [...state.savedMessages, {
                    id: Date.now().toString(),
                    title,
                    content,
                }],
            })),

            removeSavedMessage: (id) => set((state) => ({
                savedMessages: state.savedMessages.filter(msg => msg.id !== id),
            })),

            updateSavedMessage: (id, title, content) => set((state) => ({
                savedMessages: state.savedMessages.map(msg =>
                    msg.id === id ? { ...msg, title, content } : msg
                ),
            })),
        }),
        {
            name: 'saved-messages-storage',
        }
    )
);
