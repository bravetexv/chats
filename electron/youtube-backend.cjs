const { google } = require('googleapis');

const API_KEY = 'AIzaSyAS6KVqNP9SQeePDhXvYZ_oeiIls8SzRUI';
const youtube = google.youtube({ version: 'v3', auth: API_KEY });

let pollingInterval = null;
let currentLiveChatId = null;

// Obtener el Channel ID desde un username o URL
const getChannelId = async (channelInput) => {
    try {
        let channelIdentifier = channelInput;

        if (channelInput.includes('youtube.com/')) {
            const match = channelInput.match(/youtube\.com\/@?([^/]+)/);
            if (match) channelIdentifier = match[1];
        }

        const response = await youtube.channels.list({
            part: ['id'],
            forHandle: channelIdentifier,
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id || null;
        }

        const searchResponse = await youtube.search.list({
            part: ['snippet'],
            q: channelIdentifier,
            type: ['channel'],
            maxResults: 1,
        });

        if (searchResponse.data.items && searchResponse.data.items.length > 0) {
            return searchResponse.data.items[0].snippet?.channelId || null;
        }

        return null;
    } catch (error) {
        console.error('Error getting channel ID:', error);
        return null;
    }
};

const getLiveStreamId = async (channelId) => {
    try {
        const response = await youtube.search.list({
            part: ['id'],
            channelId: channelId,
            eventType: 'live',
            type: ['video'],
            maxResults: 1,
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].id?.videoId || null;
        }

        return null;
    } catch (error) {
        console.error('Error getting live stream:', error);
        return null;
    }
};

const getLiveChatId = async (videoId) => {
    try {
        const response = await youtube.videos.list({
            part: ['liveStreamingDetails'],
            id: [videoId],
        });

        if (response.data.items && response.data.items.length > 0) {
            return response.data.items[0].liveStreamingDetails?.activeLiveChatId || null;
        }

        return null;
    } catch (error) {
        console.error('Error getting live chat ID:', error);
        return null;
    }
};

const fetchChatMessages = async (liveChatId, pageToken) => {
    try {
        const response = await youtube.liveChatMessages.list({
            liveChatId: liveChatId,
            part: ['snippet', 'authorDetails'],
            pageToken: pageToken,
            maxResults: 200,
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return null;
    }
};

const startChatPolling = async (liveChatId, mainWindow) => {
    let nextPageToken;
    let processedIds = new Set();

    const poll = async () => {
        try {
            const data = await fetchChatMessages(liveChatId, nextPageToken);

            if (data && data.items) {
                data.items.forEach((item) => {
                    const messageId = `youtube-${item.id}`;

                    if (processedIds.has(messageId)) return;
                    processedIds.add(messageId);

                    const chatMessage = {
                        id: messageId,
                        platform: 'youtube',
                        username: item.authorDetails?.displayName || 'Anonymous',
                        content: item.snippet?.displayMessage || '',
                        timestamp: new Date(item.snippet?.publishedAt).getTime(),
                        color: '#FF0000',
                    };

                    // Enviar a la ventana principal
                    if (mainWindow) {
                        mainWindow.webContents.send('youtube-message', chatMessage);
                    }
                });

                nextPageToken = data.nextPageToken || undefined;

                const pollingIntervalMs = data.pollingIntervalMillis || 5000;

                if (pollingInterval) clearTimeout(pollingInterval);
                pollingInterval = setTimeout(poll, pollingIntervalMs);
            } else {
                if (pollingInterval) clearTimeout(pollingInterval);
                pollingInterval = setTimeout(poll, 10000);
            }
        } catch (error) {
            console.error('Polling error:', error);
            if (mainWindow) {
                mainWindow.webContents.send('youtube-disconnected');
            }
        }
    };

    await poll();
};

const connectYouTube = async (channelInput, mainWindow) => {
    try {
        console.log('🔍 Buscando canal:', channelInput);
        const channelId = await getChannelId(channelInput);

        if (!channelId) {
            throw new Error('Canal no encontrado');
        }
        console.log('✅ Canal encontrado:', channelId);

        console.log('🔍 Buscando stream en vivo...');
        const liveVideoId = await getLiveStreamId(channelId);

        if (!liveVideoId) {
            throw new Error('No hay ningún stream en vivo activo en este canal');
        }
        console.log('✅ Stream encontrado:', liveVideoId);

        console.log('🔍 Obteniendo chat...');
        currentLiveChatId = await getLiveChatId(liveVideoId);

        if (!currentLiveChatId) {
            throw new Error('No se pudo obtener el chat del stream');
        }
        console.log('✅ Chat obtenido:', currentLiveChatId);

        await startChatPolling(currentLiveChatId, mainWindow);

        if (mainWindow) {
            mainWindow.webContents.send('youtube-connected');
        }

        console.log('✅ Connected to YouTube Live Chat');
        return true;
    } catch (error) {
        console.error('❌ Failed to connect to YouTube:', error);
        if (mainWindow) {
            mainWindow.webContents.send('youtube-error', error.message);
        }
        throw error;
    }
};

const disconnectYouTube = () => {
    if (pollingInterval) {
        clearTimeout(pollingInterval);
        pollingInterval = null;
    }

    currentLiveChatId = null;
    console.log('🔌 Disconnected from YouTube');
};

const sendMessageYouTube = async (message) => {
    if (!currentLiveChatId) {
        console.error('❌ YouTube not connected');
        return false;
    }

    try {
        await youtube.liveChatMessages.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    liveChatId: currentLiveChatId,
                    type: 'textMessageEvent',
                    textMessageDetails: {
                        messageText: message,
                    },
                },
            },
        });
        console.log('✅ Message sent to YouTube:', message);
        return true;
    } catch (error) {
        console.error('❌ Failed to send message to YouTube:', error);
        return false;
    }
};

module.exports = {
    connectYouTube,
    disconnectYouTube,
    sendMessageYouTube,
};
