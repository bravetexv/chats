import { create } from 'zustand';

interface ConnectedChannelsState {
    twitchChannel: string | null;
    youtubeChannel: string | null;
    kickChannel: string | null;
    setTwitchChannel: (channel: string | null) => void;
    setYoutubeChannel: (channel: string | null) => void;
    setKickChannel: (channel: string | null) => void;
}

export const useConnectedChannelsStore = create<ConnectedChannelsState>((set) => ({
    twitchChannel: null,
    youtubeChannel: null,
    kickChannel: null,
    setTwitchChannel: (channel) => set({ twitchChannel: channel }),
    setYoutubeChannel: (channel) => set({ youtubeChannel: channel }),
    setKickChannel: (channel) => set({ kickChannel: channel }),
}));
