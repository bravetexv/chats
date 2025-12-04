import { useChatStore } from '../store/chatStore';

// Twitch: Obtener viewers usando API no oficial o scraping
export const fetchTwitchViewers = async (channel: string): Promise<number> => {
    try {
        // Usar API pública de Twitch (no requiere auth para datos básicos)
        const response = await fetch(`https://tmi.twitch.tv/group/user/${channel.toLowerCase()}/chatters`);
        if (response.ok) {
            const data = await response.json();
            const count = data.chatter_count || 0;
            useChatStore.getState().setViewerCount('twitch', count);
            return count;
        }
    } catch (error) {
        console.error('Error fetching Twitch viewers:', error);
    }
    return 0;
};

// YouTube: Ya tienes la API configurada, usar live streaming API
export const fetchYouTubeViewers = async (videoId: string): Promise<number> => {
    try {
        // Esto requiere que tengas el videoId del stream en vivo
        // Lo puedes obtener cuando conectas a YouTube
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=liveStreamingDetails&id=${videoId}&key=${API_KEY}`
        );

        if (response.ok) {
            const data = await response.json();
            const viewers = data.items?.[0]?.liveStreamingDetails?.concurrentViewers || 0;
            const count = parseInt(viewers);
            useChatStore.getState().setViewerCount('youtube', count);
            return count;
        }
    } catch (error) {
        console.error('Error fetching YouTube viewers:', error);
    }
    return 0;
};

// Kick: Usar API pública de Kick
export const fetchKickViewers = async (channel: string): Promise<number> => {
    try {
        const response = await fetch(`https://kick.com/api/v2/channels/${channel.toLowerCase()}`);
        if (response.ok) {
            const data = await response.json();
            const count = data.livestream?.viewer_count || 0;
            useChatStore.getState().setViewerCount('kick', count);
            return count;
        }
    } catch (error) {
        console.error('Error fetching Kick viewers:', error);
    }
    return 0;
};

// Función para actualizar viewers periódicamente
let viewerIntervals: Record<string, number> = {};

export const startViewerUpdates = (platform: 'twitch' | 'youtube' | 'kick', channel: string) => {
    // Limpiar intervalo previo si existe
    if (viewerIntervals[platform]) {
        clearInterval(viewerIntervals[platform]);
    }

    // Función de actualización según plataforma
    const updateFunction = async () => {
        switch (platform) {
            case 'twitch':
                await fetchTwitchViewers(channel);
                break;
            case 'kick':
                await fetchKickViewers(channel);
                break;
            // YouTube requiere videoId, se maneja diferente
            default:
                break;
        }
    };

    // Primera actualización inmediata
    updateFunction();

    // Actualizar cada 30 segundos
    viewerIntervals[platform] = setInterval(updateFunction, 30000);
};

export const stopViewerUpdates = (platform: 'twitch' | 'youtube' | 'kick') => {
    if (viewerIntervals[platform]) {
        clearInterval(viewerIntervals[platform]);
        delete viewerIntervals[platform];
    }
    useChatStore.getState().setViewerCount(platform, 0);
};
