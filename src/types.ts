export type Platform = 'twitch' | 'youtube' | 'kick' | 'tiktok';

export interface ChatMessage {
    id: string;
    platform: Platform;
    username: string;
    content: string;
    timestamp: number;
    color?: string;
    badges?: string[];
}

export interface SavedMessage {
    id: string;
    title: string;
    content: string;
}
