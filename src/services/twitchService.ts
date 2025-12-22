import tmi from 'tmi.js';
import type { ChatMessage } from '../types';
import { useChatStore } from '../store/chatStore';
import { useConnectedChannelsStore } from '../store/connectedChannelsStore';
import { startViewerUpdates, stopViewerUpdates } from './viewerService';

let client: tmi.Client | null = null;
let currentChannel: string = '';
let messageListenerRegistered: boolean = false;
let isConnecting: boolean = false;

export const connectTwitch = async (channel: string) => {
    const { addMessage, setConnected } = useChatStore.getState();
    const { setTwitchChannel } = useConnectedChannelsStore.getState();

    // Registrar listener de mensajes de la ventana (solo una vez)
    if (typeof window !== 'undefined' && (window as any).electron && !messageListenerRegistered) {
        (window as any).electron.onTwitchMessage((data: any) => {
            console.log('📩 Twitch message from window:', data);
            const chatMessage: ChatMessage = {
                id: data.id || `twitch-win-${Date.now()}-${Math.random()}`,
                platform: 'twitch',
                username: data.username,
                content: data.content,
                timestamp: data.timestamp || Date.now(),
                color: data.color || '#9147FF',
                badges: data.badges || [],
            };
            addMessage(chatMessage);
        });
        messageListenerRegistered = true;
        console.log('✅ Listener de mensajes de ventana de Twitch registrado');
    }

    // Prevenir múltiples conexiones simultáneas
    if (isConnecting) {
        console.warn('⚠️ Ya hay una conexión en proceso, espera...');
        return null;
    }

    isConnecting = true;

    try {
        // Desconectar cliente anterior si existe
        if (client) {
            console.log('🔌 Desconectando cliente anterior...');
            // Remover todos los event listeners antes de desconectar
            client.removeAllListeners();
            await client.disconnect();
            client = null;
        }

        currentChannel = channel;
        console.log(`🔄 Conectando a Twitch: ${channel}`);

        // 1. Conectar tmi.js en modo anónimo (solo lectura)
        const config: any = {
            connection: {
                reconnect: true,
                secure: true,
            },
            channels: [channel],
        };

        client = new tmi.Client(config);

        // Event handler para mensajes - usar función nombrada para evitar duplicados
        const handleMessage = (_channel: string, tags: any, message: string, self: boolean) => {
            if (self) return;

            const chatMessage: ChatMessage = {
                id: tags.id || `twitch-${Date.now()}-${Math.random()}`,
                platform: 'twitch',
                username: tags['display-name'] || tags.username || 'Anonymous',
                content: message,
                timestamp: Date.now(),
                color: tags.color || '#9147FF',
                badges: tags.badges ? Object.keys(tags.badges) : [],
            };

            console.log('📨 Nuevo mensaje de Twitch:', chatMessage.username, chatMessage.content);
            addMessage(chatMessage);
        };

        const handleConnected = () => {
            setConnected('twitch', true);
            setTwitchChannel(channel); // Guardar canal en el store
            console.log('✅ Connected to Twitch (Read-Only)');
            // Start updating viewer count
            startViewerUpdates('twitch', channel);
        };

        const handleDisconnected = () => {
            setConnected('twitch', false);
            console.log('❌ Disconnected from Twitch');
        };

        // Registrar event listeners
        client.on('message', handleMessage);
        client.on('connected', handleConnected);
        client.on('disconnected', handleDisconnected);

        // Conectar con timeout
        await Promise.race([
            client.connect(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout de conexión')), 10000)
            )
        ]);

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
    } catch (error) {
        console.error('❌ Error al conectar a Twitch:', error);
        setConnected('twitch', false);
        if (client) {
            client.removeAllListeners();
            client = null;
        }
        throw error;
    } finally {
        isConnecting = false;
    }
};

export const disconnectTwitch = () => {
    if (client) {
        console.log('🔌 Desconectando de Twitch...');
        // Remover todos los event listeners antes de desconectar
        client.removeAllListeners();
        client.disconnect();
        client = null;
    }

    stopViewerUpdates('twitch');
    useChatStore.getState().setConnected('twitch', false);
    useConnectedChannelsStore.getState().setTwitchChannel(null);
    currentChannel = '';
    isConnecting = false;
    console.log('✅ Desconectado de Twitch');
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
