const electronModule = require('electron');
console.log('--- DEBUG START ---');
console.log('Process versions:', JSON.stringify(process.versions, null, 2));
console.log('Type of require("electron"):', typeof electronModule);
if (typeof electronModule === 'string') {
    console.log('Value of require("electron"):', electronModule);
} else {
    console.log('Keys of require("electron"):', Object.keys(electronModule));
}

const app = typeof electronModule === 'object' ? electronModule.app : null;
const BrowserWindow = typeof electronModule === 'object' ? electronModule.BrowserWindow : null;
const ipcMain = typeof electronModule === 'object' ? electronModule.ipcMain : null;
const session = typeof electronModule === 'object' ? electronModule.session : null;

console.log('App object:', typeof app);
console.log('--- DEBUG END ---');

const path = require('path');
const fs = require('fs');

// Helper para cargar configuración
function getConfigPath() {
    // Only call app.getPath when this function is executed, not during module load
    if (!app || !app.getPath) {
        throw new Error('Electron app is not ready yet');
    }
    return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
    try {
        const configPath = getConfigPath();
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading config:', error);
    }
    return {};
}

// Helper para guardar configuración
function saveConfig(config) {
    try {
        const configPath = getConfigPath();
        const currentConfig = loadConfig();
        const newConfig = { ...currentConfig, ...config };
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        return true;
    } catch (error) {
        console.error('Error saving config:', error);
        return false;
    }
}

let mainWindow;
let kickWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'electron_app/preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
        },
        // Disfrazar Electron como Chrome normal para evitar bloqueos de Streamlabs
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    // Detectar si estamos en desarrollo o producción
    const isDev = !app.isPackaged;

    if (isDev) {
        // Modo desarrollo: cargar desde Vite dev server
        mainWindow.loadURL('http://localhost:5173');
        // DevTools can be opened manually with the 🛠️ button
        // mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        // Modo producción: cargar desde dist
        mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;

        // Cerrar ventana oculta si existe
        if (kickWindow) {
            kickWindow.destroy(); // Force close
            kickWindow = null;
        }

        // Forzar el cierre inmediato de todo el proceso
        app.exit(0);
    });
}

// Manejadores para Twitch Scraping
let twitchWindow = null;

// --- Chat Widget Server Implementation ---
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const ip = require('ip');

let serverApp = null;
let httpServer = null;
let io = null;
let serverPort = 3000;

function stopServer() {
    if (io) {
        io.close();
        io = null;
    }
    if (httpServer) {
        httpServer.close(() => {
            console.log('🛑 Server stopped');
        });
        httpServer = null;
    }
    serverApp = null;
}

function startServer(port) {
    stopServer(); // Ensure previous instance is closed
    serverPort = port || 3000;

    try {
        serverApp = express();
        httpServer = http.createServer(serverApp);
        io = new Server(httpServer, {
            cors: {
                origin: "*", // Allow access from anywhere (LAN)
                methods: ["GET", "POST"]
            }
        });

        // Serve static files (widget.html and assets)
        serverApp.use(express.static(path.join(__dirname, 'electron_app/public')));

        // Specific route for the widget
        serverApp.get('/widget', (req, res) => {
            res.sendFile(path.join(__dirname, 'electron_app/widget.html'));
        });

        io.on('connection', (socket) => {
            console.log('🔌 New widget client connected:', socket.id);

            // Send initial configuration if needed
            socket.emit('config', {
                // Any initial config
            });

            socket.on('disconnect', () => {
                console.log('❌ Widget client disconnected:', socket.id);
            });
        });

        httpServer.on('error', (e) => {
            console.error('❌ Server error:', e);
            if (e.code === 'EADDRINUSE') {
                console.error(`Port ${serverPort} is already in use.`);
                if (mainWindow) {
                    mainWindow.webContents.send('server-error', `Port ${serverPort} is already in use.`);
                }
            }
        });

        httpServer.listen(serverPort, '0.0.0.0', () => {
            const localIp = ip.address();
            console.log(`🚀 Server started running at http://${localIp}:${serverPort}/widget`);
            if (mainWindow) {
                mainWindow.webContents.send('server-status', {
                    running: true,
                    url: `http://${localIp}:${serverPort}/widget`,
                    port: serverPort
                });
            }
        });

        return true;
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        return false;
    }
}

// YouTube backend handlers
const youtubeBackend = require('./electron_app/youtube-backend.cjs');

app.whenReady().then(() => {
    createWindow();

    // Manejadores de cookies
    ipcMain.handle('get-cookies', async (event, url) => {
        try {
            const cookies = await session.defaultSession.cookies.get({ url });
            return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
        } catch (error) {
            console.error('Error getting cookies:', error);
            return null;
        }
    });

    ipcMain.handle('set-cookie', async (event, cookieDetails) => {
        try {
            await session.defaultSession.cookies.set(cookieDetails);
            return true;
        } catch (error) {
        }
        return true;
    });

    // Manejadores de Configuración
    ipcMain.handle('get-settings', () => {
        return loadConfig();
    });

    ipcMain.handle('save-settings', (event, settings) => {
        return saveConfig(settings);
    });

    // Manejadores para Kick Scraping
    ipcMain.handle('connect-kick', async (event, channel, showWindow = false) => {
        try {
            if (kickWindow) {
                kickWindow.close();
                kickWindow = null;
            }

            console.log('🔌 Connecting to Kick via hidden window:', channel);

            kickWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: showWindow,
                webPreferences: {
                    preload: path.join(__dirname, 'electron_app/kick-preload.cjs'),
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: false,
                },
            });

            const url = `https://kick.com/popout/${channel}/chat`;
            await kickWindow.loadURL(url);

            if (showWindow) {
                kickWindow.on('closed', () => {
                    kickWindow = null;
                });
            }

            return true;
        } catch (error) {
            console.error('Error connecting to Kick window:', error);
            return false;
        }
    });

    ipcMain.handle('show-kick-window', async () => {
        if (!kickWindow) {
            kickWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: true,
                webPreferences: {
                    preload: path.join(__dirname, 'electron_app/kick-preload.cjs'),
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: false,
                },
            });
            await kickWindow.loadURL('https://kick.com/login');
            kickWindow.on('closed', () => { kickWindow = null; });
        } else {
            kickWindow.show();
        }
        return true;
    });

    ipcMain.handle('show-twitch-login', async () => {
        if (twitchWindow) {
            twitchWindow.show();
            return true;
        }

        twitchWindow = new BrowserWindow({
            width: 500,
            height: 700,
            show: true,
            webPreferences: {
                preload: path.join(__dirname, 'electron_app/twitch-preload.cjs'),
                nodeIntegration: false,
                contextIsolation: true,
                webSecurity: false,
            },
        });

        await twitchWindow.loadURL('https://www.twitch.tv/login');

        twitchWindow.on('closed', () => {
            twitchWindow = null;
        });

        return true;
    });

    ipcMain.handle('connect-twitch-window', async (event, channel) => {
        if (!twitchWindow) {
            twitchWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: false,
                webPreferences: {
                    preload: path.join(__dirname, 'electron_app/twitch-preload.cjs'),
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: false,
                },
            });
        }

        const url = `https://www.twitch.tv/popout/${channel}/chat`;
        await twitchWindow.loadURL(url);
        return true;
    });

    ipcMain.handle('send-twitch-message', async (event, message) => {
        if (twitchWindow) {
            twitchWindow.webContents.send('send-twitch-message', message);
            return true;
        }
        return false;
    });

    ipcMain.handle('open-oauth-window', (event, url) => {
        // Deprecated but kept for compatibility
        return true;
    });

    ipcMain.handle('disconnect-kick', () => {
        if (kickWindow) {
            kickWindow.close();
            kickWindow = null;
        }
        return true;
    });

    ipcMain.on('kick-message-from-window', (event, data) => {
        if (mainWindow) {
            mainWindow.webContents.send('kick-message', data);
        }
    });

    ipcMain.on('kick-debug', (event, { msg, data }) => {
        console.log(`[Kick Window] ${msg}`, data);
    });

    ipcMain.handle('send-kick-message', async (event, message) => {
        if (kickWindow) {
            kickWindow.webContents.send('send-kick-message', message);
            return true;
        }
        return false;
    });

    // DevTools handler
    ipcMain.on('open-devtools', () => {
        if (mainWindow) {
            if (mainWindow.webContents.isDevToolsOpened()) {
                mainWindow.webContents.closeDevTools();
            } else {
                mainWindow.webContents.openDevTools({ mode: 'detach' });
            }
        }
    });

    ipcMain.handle('connect-youtube', async (event, channel, apiKey) => {
        try {
            // Si no se pasa apiKey explícita, intentar cargarla de la config
            let keyToUse = apiKey;
            if (!keyToUse) {
                const config = loadConfig();
                keyToUse = config.youtubeApiKey;
            }

            await youtubeBackend.connectYouTube(channel, mainWindow, keyToUse);
            return true;
        } catch (error) {
            return false;
        }
    });

    ipcMain.handle('disconnect-youtube', () => {
        youtubeBackend.disconnectYouTube();
        return true;
    });

    ipcMain.handle('send-youtube-message', async (event, message) => {
        return await youtubeBackend.sendMessageYouTube(message);
    });

    // Manejador para ventanas de widgets independientes
    ipcMain.handle('open-widget-window', async (event, config) => {
        try {
            const widgetWindow = new BrowserWindow({
                width: config.width || 800,
                height: config.height || 600,
                title: config.title || 'Widget',
                transparent: true,
                frame: false,
                resizable: true,
                alwaysOnTop: true,
                skipTaskbar: false,
                webPreferences: {
                    nodeIntegration: false,
                    contextIsolation: true,
                    webSecurity: false,
                },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            });

            // Cargar la página wrapper con el widget
            const wrapperPath = path.join(__dirname, 'electron_app/widget-wrapper.html');
            const wrapperUrl = `file://${wrapperPath}?url=${encodeURIComponent(config.url)}&title=${encodeURIComponent(config.title || 'Widget')}`;

            console.log('🪟 Opening widget window:', config.title);
            await widgetWindow.loadURL(wrapperUrl);

            widgetWindow.on('closed', () => {
                console.log('Widget window closed');
            });

            return true;
        } catch (error) {
            console.error('Error opening widget window:', error);
            return false;
        }
    });

    // IPC Handlers for Server
    ipcMain.handle('start-server', (event, port) => {
        return startServer(port);
    });

    ipcMain.handle('stop-server', () => {
        stopServer();
        return true;
    });

    ipcMain.handle('get-server-url', () => {
        if (httpServer && httpServer.listening) {
            const localIp = ip.address();
            return `http://${localIp}:${serverPort}/widget`;
        }
        return null;
    });

    ipcMain.on('broadcast-message', (event, message) => {
        if (io) {
            io.emit('chat-message', message);
        }
    });

    // Forward TTS commands to widget if needed (or just include in chat-message)
    ipcMain.on('broadcast-tts', (event, ttsData) => {
        if (io) {
            io.emit('tts-message', ttsData);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.exit(0);
    }
});
