import type { ChatMessage } from '../types';
import { useChatStore } from '../store/chatStore';
import { useConnectedChannelsStore } from '../store/connectedChannelsStore';

let listenersRegistered: boolean = false;
let isConnecting: boolean = false;

export const connectYouTube = async (channelInput: string, apiKey?: string) => {
    const { setConnected, addMessage } = useChatStore.getState();
    const { setYoutubeChannel } = useConnectedChannelsStore.getState();

    // Prevenir múltiples conexiones simultáneas
    if (isConnecting) {
        console.warn('⚠️ Ya hay una conexión de YouTube en proceso, espera...');
        return;
    }

    isConnecting = true;

    try {
        setConnected('youtube', false);

        if (typeof window !== 'undefined' && (window as any).electron) {
            // Desconectar anterior si existe
            if (listenersRegistered) {
                console.log('🔌 Removiendo listeners anteriores de YouTube...');
                await disconnectYouTube();
            }

            // Configurar listeners solo una vez
            if (!listenersRegistered) {
                (window as any).electron.onYouTubeMessage((data: ChatMessage) => {
                    console.log('📨 Nuevo mensaje de YouTube:', data.username, data.content);
                    addMessage(data);
                });

                (window as any).electron.onYouTubeConnected(() => {
                    setConnected('youtube', true);
                    setYoutubeChannel(channelInput);
                    console.log('✅ Conectado a YouTube');
                });

                (window as any).electron.onYouTubeDisconnected(() => {
                    setConnected('youtube', false);
                    console.log('❌ Desconectado de YouTube');
                });

                (window as any).electron.onYouTubeError((error: string) => {
                    console.error('YouTube error:', error);
                    setConnected('youtube', false);
                });

                listenersRegistered = true;
                console.log('✅ Listeners de YouTube registrados');
            }

            // Conectar
            const success = await (window as any).electron.invoke('connect-youtube', channelInput, apiKey);

            if (!success) {
                throw new Error('Failed to connect to YouTube');
            }
        }
    } catch (error: any) {
        console.error('❌ Failed to connect to YouTube:', error);
        setConnected('youtube', false);
        throw error;
    } finally {
        isConnecting = false;
    }
};

export const disconnectYouTube = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        await (window as any).electron.invoke('disconnect-youtube');
    }

    useChatStore.getState().setConnected('youtube', false);
    useConnectedChannelsStore.getState().setYoutubeChannel(null);
    isConnecting = false;
    console.log('✅ Desconectado de YouTube');
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
