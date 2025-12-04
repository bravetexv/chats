import type { ChatMessage } from '../types';
import { useChatStore } from '../store/chatStore';

export const connectYouTube = async (channelInput: string) => {
    const { setConnected, addMessage } = useChatStore.getState();

    try {
        setConnected('youtube', false);

        if (typeof window !== 'undefined' && (window as any).electron) {
            // Configurar listeners
            (window as any).electron.onYouTubeMessage((data: ChatMessage) => {
                addMessage(data);
            });

            (window as any).electron.onYouTubeConnected(() => {
                setConnected('youtube', true);
            });

            (window as any).electron.onYouTubeDisconnected(() => {
                setConnected('youtube', false);
            });

            (window as any).electron.onYouTubeError((error: string) => {
                console.error('YouTube error:', error);
                setConnected('youtube', false);
            });

            // Conectar
            const success = await (window as any).electron.invoke('connect-youtube', channelInput);

            if (!success) {
                throw new Error('Failed to connect to YouTube');
            }
        }
    } catch (error: any) {
        console.error('❌ Failed to connect to YouTube:', error);
        setConnected('youtube', false);
        throw error;
    }
};

export const disconnectYouTube = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        await (window as any).electron.invoke('disconnect-youtube');
    }

    useChatStore.getState().setConnected('youtube', false);
    console.log('🔌 Disconnected from YouTube');
};

export const sendMessageYouTube = async (message: string): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        try {
            const success = await (window as any).electron.invoke('send-youtube-message', message);
            if (success) {
                console.log('✅ Message sent to YouTube:', message);
            }
            return success;
        } catch (error) {
            console.error('❌ Failed to send message to YouTube:', error);
            return false;
        }
    }

    console.error('❌ Electron not available for YouTube');
    return false;
};
