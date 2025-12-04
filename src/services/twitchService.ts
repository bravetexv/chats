import tmi from 'tmi.js';
import type { ChatMessage } from '../types';
import { useChatStore } from '../store/chatStore';
import { startViewerUpdates, stopViewerUpdates } from './viewerService';

let client: tmi.Client | null = null;
let currentChannel: string = '';

export const connectTwitch = async (channel: string) => {
    const { addMessage, setConnected } = useChatStore.getState();

    if (client) {
        client.disconnect();
    }

    currentChannel = channel;

    // 1. Conectar tmi.js en modo anónimo (solo lectura)
    const config: any = {
        connection: {
            reconnect: true,
            secure: true,
        },
        channels: [channel],
    };

    client = new tmi.Client(config);

    client.on('message', (_channel, tags, message, self) => {
        if (self) return;

        const chatMessage: ChatMessage = {
            id: `twitch-${Date.now()}-${Math.random()}`,
            platform: 'twitch',
            username: tags['display-name'] || tags.username || 'Anonymous',
            content: message,
            timestamp: Date.now(),
            color: tags.color || '#9147FF',
            badges: tags.badges ? Object.keys(tags.badges) : [],
        };

        addMessage(chatMessage);
    });

    client.on('connected', () => {
        setConnected('twitch', true);
        console.log('✅ Connected to Twitch (Read-Only)');
        // Start updating viewer count
        startViewerUpdates('twitch', channel);
    });

    client.on('disconnected', () => {
        setConnected('twitch', false);
        console.log('❌ Disconnected from Twitch');
    });

    client.connect().catch(console.error);

    // 2. Conectar ventana para envío de mensajes (si está disponible Electron)
    if (typeof window !== 'undefined' && (window as any).electron) {
        try {
            await (window as any).electron.invoke('connect-twitch-window', channel);
            console.log('✅ Twitch send window initialized for channel:', channel);
        } catch (error) {
            console.error('⚠️ Could not initialize Twitch send window:', error);
        }
    }

    return client;
};

export const disconnectTwitch = () => {
    if (client) {
        client.disconnect();
        client = null;
    }

    stopViewerUpdates('twitch');
    useChatStore.getState().setConnected('twitch', false);
    console.log('🔌 Disconnected from Twitch');
};

export const sendMessageTwitch = async (message: string): Promise<boolean> => {
    if (!currentChannel) {
        console.error('❌ Twitch not connected');
        return false;
    }

    // Usar IPC para enviar mensaje a través de la ventana oculta
    if (typeof window !== 'undefined' && (window as any).electron) {
        try {
            const success = await (window as any).electron.invoke('send-twitch-message', message);
            if (success) {
                console.log('✅ Message sent to Twitch via Window:', message);
                return true;
            } else {
                console.error('❌ Failed to send message via Window (Window not open?)');
                alert('⚠️ No se pudo enviar el mensaje. Asegúrate de haber iniciado sesión en Twitch.');
                return false;
            }
        } catch (error) {
            console.error('❌ Error sending message via IPC:', error);
            return false;
        }
    }

    return false;
};

export const startTwitchOAuth = () => {
    // Abrir ventana de Twitch para que el usuario inicie sesión
    // Luego debe usar el botón "Conectar" con el nombre del canal
    if (typeof window !== 'undefined' && (window as any).electron) {
        (window as any).electron.showTwitchLogin();
    }
};
