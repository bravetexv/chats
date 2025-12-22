const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Cookie management para Kick
    getCookies: async (url) => {
        return await ipcRenderer.invoke('get-cookies', url);
    },
    setCookie: async (cookie) => {
        return await ipcRenderer.invoke('set-cookie', cookie);
    },
    // Kick Scraping
    connectKick: async (channel) => {
        return await ipcRenderer.invoke('connect-kick', channel);
    },
    disconnectKick: async () => {
        return await ipcRenderer.invoke('disconnect-kick');
    },
    onKickMessage: (callback) => {
        ipcRenderer.on('kick-message', (event, data) => callback(data));
    },
    onTwitchMessage: (callback) => {
        ipcRenderer.on('twitch-message', (event, data) => callback(data));
    },
    onYouTubeMessage: (callback) => {
        ipcRenderer.on('youtube-message', (event, data) => callback(data));
    },
    onYouTubeConnected: (callback) => {
        ipcRenderer.on('youtube-connected', () => callback());
    },
    onYouTubeDisconnected: (callback) => {
        ipcRenderer.on('youtube-disconnected', () => callback());
    },
    onYouTubeError: (callback) => {
        ipcRenderer.on('youtube-error', (event, error) => callback(error));
    },
    showKickWindow: async () => {
        return await ipcRenderer.invoke('show-kick-window');
    },
    showTwitchLogin: async () => {
        return await ipcRenderer.invoke('show-twitch-login');
    },
    openDevTools: () => {
        ipcRenderer.send('open-devtools');
    },
    openWidgetWindow: async (config) => {
        return await ipcRenderer.invoke('open-widget-window', config);
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
    send: (channel, ...args) => ipcRenderer.send(channel, ...args),
    onServerStatus: (callback) => {
        ipcRenderer.on('server-status', (event, data) => callback(data));
    },
    onServerError: (callback) => {
        ipcRenderer.on('server-error', (event, error) => callback(error));
    },
});
