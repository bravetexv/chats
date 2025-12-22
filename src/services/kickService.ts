import type { ChatMessage } from '../types';
import { useChatStore } from '../store/chatStore';
import { useConnectedChannelsStore } from '../store/connectedChannelsStore';
import { startViewerUpdates, stopViewerUpdates } from './viewerService';

// Extraer username desde URL o username directo
const extractUsername = (input: string): string => {
    if (input.includes('kick.com/')) {
        const match = input.match(/kick\.com\/([^/?]+)/);
        if (match) return match[1];
    }
    return input.trim();
};

let isConnecting: boolean = false;
let messageListenerRegistered: boolean = false;

export const connectKick = async (channelInput: string) => {
    const { addMessage, setConnected } = useChatStore.getState();
    const { setKickChannel } = useConnectedChannelsStore.getState();

    // Prevenir múltiples conexiones simultáneas
    if (isConnecting) {
        console.warn('⚠️ Ya hay una conexión de Kick en proceso, espera...');
        return;
    }

    isConnecting = true;

    try {
        const channelName = extractUsername(channelInput);
        console.log('🔍 Conectando a Kick (Scraping):', channelName);

        // Verificar si estamos en Electron
        if (typeof window !== 'undefined' && (window as any).electron) {
            // Desconectar anterior si existe
            if (messageListenerRegistered) {
                console.log('🔌 Removiendo listener anterior de Kick...');
                // El listener se sobrescribirá, pero marcamos que necesitamos limpiar
                await disconnectKick();
            }

            // Usar el puente de Electron
            const success = await (window as any).electron.connectKick(channelName);

            if (success) {
                console.log('✅ Ventana de Kick conectada');
                setConnected('kick', true);
                setKickChannel(channelName); // Guardar canal en el store

                // Start viewer updates
                startViewerUpdates('kick', channelName);

                // Escuchar mensajes - solo registrar una vez
                if (!messageListenerRegistered) {
                    (window as any).electron.onKickMessage((data: any) => {
                        console.log('📩 Kick message received:', data);

                        const chatMessage: ChatMessage = {
                            id: data.id || `kick-${Date.now()}-${Math.random()}`,
                            platform: 'kick',
                            username: data.username,
                            content: data.content,
                            timestamp: data.timestamp || Date.now(),
                            color: data.color || '#53FC18',
                        };

                        addMessage(chatMessage);
                    });
                    messageListenerRegistered = true;
                    console.log('✅ Listener de mensajes de Kick registrado');
                }
            } else {
                throw new Error('No se pudo abrir la ventana de Kick');
            }
        } else {
            console.error('❌ Electron no detectado. Esta función requiere Electron.');
            alert('Kick chat requiere ejecutar la app en Electron.');
        }

    } catch (error: any) {
        console.error('❌ Failed to connect to Kick:', error);
        setConnected('kick', false);
        throw error;
    } finally {
        isConnecting = false;
    }
};

export const disconnectKick = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        await (window as any).electron.disconnectKick();
    }

    stopViewerUpdates('kick');
    useChatStore.getState().setConnected('kick', false);
    useConnectedChannelsStore.getState().setKickChannel(null);
    isConnecting = false;
    console.log('✅ Desconectado de Kick');
};

export const sendMessageKick = async (message: string): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).electron) {
        try {
            console.log('📤 Sending message to Kick:', message);
            const success = await (window as any).electron.invoke('send-kick-message', message);
            return success;
        } catch (error) {
            console.error('❌ Failed to send message to Kick:', error);
            return false;
        }
    }
    console.error('❌ Electron not available for Kick sending');
    return false;
};
