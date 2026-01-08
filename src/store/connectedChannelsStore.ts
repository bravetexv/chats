import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConnectedChannelsState {
    twitchChannel: string | null;
    youtubeChannel: string | null;
    kickChannel: string | null;
    youtubeApiKey: string | null;
    setTwitchChannel: (channel: string | null) => void;
    setYoutubeChannel: (channel: string | null) => void;
    setKickChannel: (channel: string | null) => void;
    setYoutubeApiKey: (key: string | null) => void;
}

export const useConnectedChannelsStore = create<ConnectedChannelsState>()(
    persist(
        (set) => ({
            twitchChannel: null,
            youtubeChannel: null,
            kickChannel: null,
            youtubeApiKey: null,
            setTwitchChannel: (channel) => set({ twitchChannel: channel }),
            setYoutubeChannel: (channel) => set({ youtubeChannel: channel }),
            setKickChannel: (channel) => set({ kickChannel: channel }),
            setYoutubeApiKey: (key) => set({ youtubeApiKey: key }),
        }),
        {
            name: 'connected-channels-storage',
        }
    )
);
