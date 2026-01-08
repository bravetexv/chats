import React, { useState, useRef } from 'react';
import { Twitch, Youtube, Zap, Settings, X, Info, Copy, Globe, Server, Gift, CreditCard, Wallet, DollarSign, Save } from 'lucide-react';

import { useChatStore } from './store/chatStore';
import { useThemeStore, predefinedThemes } from './store/themeStore';
import { connectTwitch, startTwitchOAuth } from './services/twitchService';
import { connectYouTube } from './services/youtubeService';
import { connectKick } from './services/kickService';
import { WidgetsSidebar } from './components/WidgetsSidebar';
import { UnifiedChat } from './components/UnifiedChat';
import { useConnectedChannelsStore } from './store/connectedChannelsStore';
import { isElectron } from './services/platformService';

// Notification Component
function Notification({ message, type, onClose }: { message: string, type: 'error' | 'info' | 'success', onClose: () => void }) {
  if (!message) return null;

  const bgColor = type === 'error' ? 'bg-red-700/90' : type === 'success' ? 'bg-green-700/90' : 'bg-blue-700/90';

  return (
    <div className={`fixed top-4 right-4 z-[9999] p-4 ${bgColor} text-white rounded-lg shadow-xl flex items-center gap-3 animate-slideIn`}>
      <Info className="w-5 h-5" />
      <span>{message}</span>
      <button onClick={onClose} className="ml-4 text-white/70 hover:text-white">
        <X className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

function ConnectionStatus({ platform, icon, connected }: { platform: string, icon: React.ReactNode, connected: boolean }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
      <span className="text-white/70 capitalize flex items-center gap-1">
        {icon}
        {platform}
      </span>
    </div>
  );
}

function ServerSettings({ showNotification }: { showNotification: (msg: string, type: 'error' | 'info' | 'success') => void }) {
  const { serverEnabled, serverPort, serverUrl, setServerEnabled, setServerPort, setServerUrl } = useChatStore();
  const [localPort, setLocalPort] = useState(serverPort);

  React.useEffect(() => {
    if ((window as any).electron) {
      // Listen for status updates
      (window as any).electron.onServerStatus((status: any) => {
        if (status.running) {
          setServerUrl(status.url);
          setServerEnabled(true);
        }
      });

      (window as any).electron.onServerError((error: string) => {
        showNotification(error, 'error');
        setServerEnabled(false);
      });

      // Check initial status if needed or just rely on store
    }
  }, []);

  const toggleServer = async () => {
    if (!serverEnabled) {
      if ((window as any).electron) {
        const success = await (window as any).electron.invoke('start-server', localPort);
        if (success) {
          showNotification(`Servidor iniciado en puerto ${localPort}`, 'success');
          setServerEnabled(true);
          setServerPort(localPort);
        } else {
          showNotification('Error al iniciar el servidor', 'error');
        }
      }
    } else {
      if ((window as any).electron) {
        await (window as any).electron.invoke('stop-server');
        showNotification('Servidor detenido', 'info');
        setServerEnabled(false);
        setServerUrl('');
      }
    }
  };

  const copyUrl = () => {
    if (serverUrl) {
      navigator.clipboard.writeText(serverUrl);
      showNotification('URL copiada al portapapeles', 'success');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-white/70 text-sm mb-3 block font-semibold flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          Servidor de Widget (OBS / Red Local)
        </label>
        <div className="space-y-4 bg-white/5 p-4 rounded-lg">

          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Habilitar Servidor Local</div>
              <div className="text-white/50 text-xs">Permite conectar widgets desde otras PCs o OBS</div>
            </div>
            <button
              onClick={toggleServer}
              className={`w-12 h-6 rounded-full transition-colors relative ${serverEnabled ? 'bg-blue-600' : 'bg-white/20'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${serverEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Port Configuration */}
          <div>
            <label className="text-white font-medium mb-2 block">Puerto del Servidor</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={localPort}
                onChange={(e) => setLocalPort(Number(e.target.value))}
                disabled={serverEnabled}
                className={`flex-1 bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${serverEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
            </div>
            <p className="text-xs text-white/40 mt-1">Puerto por defecto: 3000. Cambia si hay conflictos.</p>
          </div>

          {/* URL Display */}
          {serverEnabled && serverUrl && (
            <div className="animate-fadeIn">
              <label className="text-white font-medium mb-2 block">URL del Widget</label>
              <div className="flex gap-2 items-center bg-black/30 p-2 rounded-lg border border-white/10">
                <Globe className="w-4 h-4 text-blue-400 ml-2" />
                <code className="flex-1 text-blue-300 font-mono text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
                  {serverUrl}
                </code>
                <button
                  onClick={copyUrl}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  title="Copiar URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                💡 Copia esta URL y pégala en OBS (Browser Source) o en el navegador de otra PC en la misma red.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingsContent({ showNotification }: { showNotification: (msg: string, type: 'error' | 'info' | 'success') => void }) {
  const [activeTab, setActiveTab] = useState('connections');

  const [twitchChannel, setTwitchChannel] = useState('');
  const [youtubeChannel, setYoutubeChannel] = useState('');
  const [kickChannel, setKickChannel] = useState('');

  const { currentTheme, setTheme, setCustomBackground, setBackgroundBlur, setBackgroundOpacity } = useThemeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { setYoutubeApiKey: storeYoutubeApiKey, youtubeApiKey: savedApiKey } = useConnectedChannelsStore();
  const [apiKey, setApiKey] = useState(savedApiKey || '');

  // Cargar configuración al montar
  React.useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      (window as any).electron.invoke('get-settings').then((settings: any) => {
        if (settings && settings.youtubeApiKey) {
          setApiKey(settings.youtubeApiKey);
          storeYoutubeApiKey(settings.youtubeApiKey);
        }
      });
    }
  }, []);

  const handleSaveApiKey = async () => {
    if (typeof window !== 'undefined' && (window as any).electron) {
      await (window as any).electron.invoke('save-settings', { youtubeApiKey: apiKey });
      storeYoutubeApiKey(apiKey);
      showNotification('API Key guardada correctamente', 'success');
    }
  };

  // TTS State
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const { ttsEnabled, ttsReadName, ttsVoice, ttsLanguage, ttsRate, ttsPitch, ttsVolume, setTtsEnabled, setTtsReadName, setTtsVoice, setTtsLanguage, setTtsRate, setTtsPitch, setTtsVolume } = useChatStore();

  // Load voices
  React.useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const handleConnectTwitch = async () => {
    if (twitchChannel) {
      try {
        await connectTwitch(twitchChannel);
        showNotification(`Conectado a Twitch: ${twitchChannel}`, 'success');
      } catch (error) {
        showNotification('Error al conectar a Twitch', 'error');
      }
    }
  };

  const handleConnectYouTube = async () => {
    if (youtubeChannel) {
      try {
        await connectYouTube(youtubeChannel);
        showNotification(`Conectado a YouTube: ${youtubeChannel}`, 'success');
      } catch (error) {
        showNotification('Error al conectar a YouTube', 'error');
      }
    }
  };

  const handleConnectKick = async () => {
    if (kickChannel) {
      try {
        await connectKick(kickChannel);
        showNotification(`Conectado a Kick: ${kickChannel}`, 'success');
      } catch (error) {
        showNotification('Error al conectar a Kick', 'error');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setCustomBackground(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('connections')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'connections'
            ? 'text-purple-400 border-b-2 border-purple-400'
            : 'text-white/50 hover:text-white/70'
            }`}
        >
          Conexiones
        </button>
        <button
          onClick={() => setActiveTab('themes')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'themes'
            ? 'text-purple-400 border-b-2 border-purple-400'
            : 'text-white/50 hover:text-white/70'
            }`}
        >
          Temas y Fondo
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'accessibility'
            ? 'text-purple-400 border-b-2 border-purple-400'
            : 'text-white/50 hover:text-white/70'
            }`}
        >
          Accesibilidad
        </button>
        {isElectron() && (
          <button
            onClick={() => setActiveTab('server')}
            className={`px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'server'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-white/50 hover:text-white/70'
              }`}
          >
            Servidor Widget
          </button>
        )}
      </div>

      {/* Conexiones Tab */}
      {
        activeTab === 'connections' && (
          <div className="space-y-6">
            {/* Twitch */}
            <div>
              <label className="text-white/70 text-sm mb-2 block font-semibold flex items-center gap-2">
                <span className="text-purple-400">🟣</span> Canal de Twitch
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={twitchChannel}
                  onChange={(e) => setTwitchChannel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectTwitch()}
                  placeholder="nombre_del_canal"
                  className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={handleConnectTwitch}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Conectar
                </button>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  startTwitchOAuth();
                  showNotification('Ventana de Twitch abierta. Inicia sesión si es necesario, luego cierra la ventana y usa el botón "Conectar" arriba.', 'info');
                }}
                className="mt-2 w-full bg-purple-600/50 text-white px-4 py-2 rounded-lg hover:bg-purple-600 text-sm transition-colors"
              >
                🔐 Iniciar Sesión en Twitch (si es necesario)
              </button>
              <p className="text-white/40 text-xs mt-1">
                <strong>Paso 1:</strong> Si no estás logueado, haz clic arriba para iniciar sesión.
                <br />
                <strong>Paso 2:</strong> Luego cierra la ventana de login y usa el botón "Conectar" de arriba con el nombre del canal.
                <br />
                💡 La aplicación usará tu sesión automáticamente.
              </p>
            </div>

            {/* YouTube */}
            <div>
              <label className="text-white/70 text-sm mb-2 block font-semibold flex items-center gap-2">
                <span className="text-red-400">🔴</span> Canal de YouTube
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={youtubeChannel}
                  onChange={(e) => setYoutubeChannel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectYouTube()}
                  placeholder="@username o link del canal"
                  className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  onClick={handleConnectYouTube}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Conectar
                </button>
              </div>

              <div className="mt-4 bg-white/5 p-3 rounded-lg border border-white/10">
                <label className="text-white/70 text-xs mb-2 block font-semibold flex items-center gap-2">
                  🔑 Google API Key (Opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                  />
                  <button
                    onClick={handleSaveApiKey}
                    className="bg-white/10 text-white px-4 py-2 rounded hover:bg-white/20 text-sm flex items-center gap-2 transition-colors"
                    title="Guardar API Key"
                  >
                    <Save className="w-4 h-4" />
                    Guardar
                  </button>
                </div>
                <p className="text-white/30 text-[10px] mt-2">
                  Si tienes problemas de conexión o límites, usa tu propia API Key de Google Cloud Console (YouTube Data API v3).
                </p>
              </div>

              <div className="mt-2 text-white/40 text-xs space-y-1">
                <p>✅ La API está configurada y funcional</p>
                <p>⚠️ Solo funciona si el canal está en vivo</p>
                <p>💡 El envío de mensajes requiere que seas el dueño del canal</p>
              </div>
            </div>

            {/* Kick */}
            <div>
              <label className="text-white/70 text-sm mb-2 block font-semibold flex items-center gap-2">
                <span className="text-green-400">🟢</span> Canal de Kick
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kickChannel}
                  onChange={(e) => setKickChannel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleConnectKick()}
                  placeholder="username"
                  className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={handleConnectKick}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Conectar
                </button>
              </div>
              {isElectron() && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    if ((window as any).electron) {
                      await (window as any).electron.showKickWindow();
                      showNotification('Ventana de Kick abierta. Inicia sesión si es necesario, luego cierra la ventana y usa el botón "Conectar" arriba.', 'info');
                    } else {
                      showNotification('Esta función solo está disponible en la versión de escritorio', 'error');
                    }
                  }}
                  className="mt-2 w-full bg-green-600/50 text-white px-4 py-2 rounded-lg hover:bg-green-600 text-sm transition-colors"
                >
                  🔐 Iniciar Sesión en Kick (si es necesario)
                </button>
              )}
              <p className="text-white/40 text-xs mt-1">
                <strong>Paso 1:</strong> Si no estás logueado, haz clic arriba para iniciar sesión.
                <br />
                <strong>Paso 2:</strong> Luego cierra la ventana de login y usa el botón "Conectar" de arriba con el nombre del canal.
                <br />
                💡 La aplicación usará tu sesión automáticamente.
              </p>
            </div>


          </div>
        )
      }

      {/* Temas Tab */}
      {
        activeTab === 'themes' && (
          <div className="space-y-6">
            {/* Temas Predefinidos */}
            <div>
              <label className="text-white/70 text-sm mb-3 block font-semibold">Temas Predefinidos</label>
              <div className="grid grid-cols-2 gap-3">
                {predefinedThemes.map((theme) => (
                  <button
                    key={theme.name}
                    onClick={() => setTheme(theme)}
                    className={`p-4 rounded-lg text-sm font-medium transition-all ${currentTheme.name === theme.name
                      ? 'ring-2 ring-purple-500 bg-white/20'
                      : 'bg-white/10 hover:bg-white/15'
                      }`}
                  >
                    <div className={`h-12 rounded mb-2 bg-gradient-to-r ${theme.gradient}`}></div>
                    <div className="text-white">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Imagen de Fondo Personalizada */}
            <div>
              <label className="text-white/70 text-sm mb-3 block font-semibold">Imagen de Fondo Personalizada</label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="background-upload"
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="background-upload"
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer text-center text-sm font-medium transition-colors"
                  >
                    📁 Subir Imagen
                  </label>
                  {currentTheme.backgroundImage && (
                    <button
                      onClick={() => setCustomBackground(null)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      🗑️ Quitar
                    </button>
                  )}
                </div>

                {currentTheme.backgroundImage && (
                  <div className="space-y-3 bg-white/5 p-4 rounded-lg">
                    <div className="relative h-32 rounded overflow-hidden">
                      <img
                        src={currentTheme.backgroundImage}
                        alt="Background preview"
                        className="w-full h-full object-cover"
                        style={{
                          filter: `blur(${currentTheme.backgroundBlur}px)`,
                          opacity: currentTheme.backgroundOpacity / 100,
                        }}
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-xs mb-1 block">
                        Desenfoque: {currentTheme.backgroundBlur}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="20"
                        value={currentTheme.backgroundBlur}
                        onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>

                    <div>
                      <label className="text-white/70 text-xs mb-1 block">
                        Opacidad: {currentTheme.backgroundOpacity}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={currentTheme.backgroundOpacity}
                        onChange={(e) => setBackgroundOpacity(Number(e.target.value))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      {/* Accesibilidad Tab */}
      {
        activeTab === 'accessibility' && (
          <div className="space-y-6">
            {/* ... existing accessibility content ... */}
            <div>
              <label className="text-white/70 text-sm mb-3 block font-semibold">Text-to-Speech (Voz)</label>
              <div className="space-y-4 bg-white/5 p-4 rounded-lg">
                {/* Enable TTS */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Leer mensajes por voz</div>
                    <div className="text-white/50 text-xs">Lee automáticamente los mensajes nuevos</div>
                  </div>
                  <button
                    onClick={() => setTtsEnabled(!ttsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${ttsEnabled ? 'bg-purple-600' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Read Name */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-medium">Leer nombre del usuario</div>
                    <div className="text-white/50 text-xs">Incluye el nombre del remitente antes del mensaje</div>
                  </div>
                  <button
                    onClick={() => setTtsReadName(!ttsReadName)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${ttsReadName ? 'bg-purple-600' : 'bg-white/20'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${ttsReadName ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>

                {/* Language Selection */}
                <div>
                  <label className="text-white font-medium mb-2 block">Filtrar voces por idioma</label>
                  <select
                    value={ttsLanguage}
                    onChange={(e) => {
                      setTtsLanguage(e.target.value);
                      setTtsVoice(''); // Reset voice when language changes
                    }}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" style={{ backgroundColor: '#1f2937', color: 'white' }}>🌍 Todos los idiomas</option>
                    <option value="es" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇪🇸 Español</option>
                    <option value="en" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇺🇸 Inglés</option>
                    <option value="pt" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇧🇷 Portugués</option>
                    <option value="fr" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇫🇷 Francés</option>
                    <option value="de" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇩🇪 Alemán</option>
                    <option value="it" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇮🇹 Italiano</option>
                    <option value="ja" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇯🇵 Japonés</option>
                    <option value="ko" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇰🇷 Coreano</option>
                    <option value="zh" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇨🇳 Chino</option>
                    <option value="ru" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇷🇺 Ruso</option>
                    <option value="ar" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇸🇦 Árabe</option>
                    <option value="hi" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇮🇳 Hindi</option>
                    <option value="nl" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇳🇱 Holandés</option>
                    <option value="pl" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇵🇱 Polaco</option>
                    <option value="tr" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇹🇷 Turco</option>
                    <option value="sv" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇸🇪 Sueco</option>
                    <option value="da" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇩🇰 Danés</option>
                    <option value="no" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇳🇴 Noruego</option>
                    <option value="fi" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇫🇮 Finlandés</option>
                    <option value="el" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇬🇷 Griego</option>
                    <option value="he" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇮🇱 Hebreo</option>
                    <option value="th" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇹🇭 Tailandés</option>
                    <option value="vi" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇻🇳 Vietnamita</option>
                    <option value="id" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇮🇩 Indonesio</option>
                    <option value="cs" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇨🇿 Checo</option>
                    <option value="hu" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇭🇺 Húngaro</option>
                    <option value="ro" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇷🇴 Rumano</option>
                    <option value="uk" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇺🇦 Ucraniano</option>
                    <option value="ca" style={{ backgroundColor: '#1f2937', color: 'white' }}>🇪🇸 Catalán</option>
                  </select>
                  <p className="text-xs text-white/40 mt-1">Filtra las voces por idioma</p>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="text-white font-medium mb-2 block">Voz ({ttsLanguage ? `Idioma: ${ttsLanguage}` : 'Todas'})</label>
                  <select
                    value={ttsVoice}
                    onChange={(e) => setTtsVoice(e.target.value)}
                    className="w-full bg-white/10 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" style={{ backgroundColor: '#1f2937', color: 'white' }}>Voz por defecto del sistema</option>
                    {availableVoices
                      .filter(voice => !ttsLanguage || voice.lang.startsWith(ttsLanguage))
                      .map((voice) => (
                        <option key={voice.voiceURI} value={voice.voiceURI} style={{ backgroundColor: '#1f2937', color: 'white' }}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                  </select>
                  {ttsLanguage && availableVoices.filter(voice => voice.lang.startsWith(ttsLanguage)).length === 0 && (
                    <p className="text-xs text-red-400 mt-1">⚠️ No hay voces disponibles para este idioma</p>
                  )}
                </div>

                {/* Rate Control */}
                <div>
                  <label className="text-white font-medium mb-1 block">
                    Velocidad: {ttsRate.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsRate}
                    onChange={(e) => setTtsRate(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Lento</span>
                    <span>Rápido</span>
                  </div>
                </div>

                {/* Pitch Control */}
                <div>
                  <label className="text-white font-medium mb-1 block">
                    Tono: {ttsPitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={ttsPitch}
                    onChange={(e) => setTtsPitch(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Grave</span>
                    <span>Agudo</span>
                  </div>
                </div>

                {/* Volume Control */}
                <div>
                  <label className="text-white font-medium mb-1 block">
                    Volumen: {Math.round(ttsVolume * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={ttsVolume}
                    onChange={(e) => setTtsVolume(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>Silencio</span>
                    <span>Máximo</span>
                  </div>
                </div>

                {/* Test Button */}
                <button
                  onClick={() => {
                    const testText = ttsReadName ? "Usuario de ejemplo dice: Este es un mensaje de prueba" : "Este es un mensaje de prueba";
                    const utterance = new SpeechSynthesisUtterance(testText);
                    utterance.lang = ttsLanguage || 'es-ES';
                    utterance.rate = ttsRate;
                    utterance.pitch = ttsPitch;
                    utterance.volume = ttsVolume;
                    if (ttsVoice) {
                      const voices = window.speechSynthesis.getVoices();
                      const selectedVoice = voices.find(v => v.voiceURI === ttsVoice);
                      if (selectedVoice) utterance.voice = selectedVoice;
                    }
                    window.speechSynthesis.speak(utterance);
                  }}
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  🔊 Probar Voz
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Widget Server Tab */}
      {
        activeTab === 'server' && isElectron() && (
          <ServerSettings showNotification={showNotification} />
        )
      }



    </div >
  );
}

function DonationModal() {
  // CONFIGURACIÓN DE LINKS DE DONACIÓN
  // paypal correo: lautaro.04db@gmail.com
  // AstroPay CVU: ...

  // Voy a modificar la estructura de datos para permitir copiar valores (como el CVU) en lugar de solo abrir links.

  // Re-reading request: "paypal correo: lautaro.04db@gmail.com"
  // AstroPay CVU: ...

  // Voy a modificar la estructura de datos para permitir copiar valores (como el CVU) en lugar de solo abrir links.

  const donationLinks = [
    {
      name: 'PayPal',
      icon: <DollarSign className="w-6 h-6 text-blue-400" />,
      value: 'lautaro.04db@gmail.com',
      type: 'copy', // Nuevo tipo para copiar
      color: 'bg-blue-600 hover:bg-blue-700',
      actionLabel: 'Copiar Correo'
    },
    {
      name: 'Mercado Pago',
      icon: <CreditCard className="w-6 h-6 text-blue-300" />,
      url: 'https://link.mercadopago.com.ar/bravoxv',
      type: 'link',
      color: 'bg-sky-500 hover:bg-sky-600',
      actionLabel: 'Ir a Pagar'
    },
    {
      name: 'AstroPay',
      icon: <Wallet className="w-6 h-6 text-red-400" />,
      url: 'https://onetouch.astropay.com/payment?external_reference_id=yQiEgcp2RSzCgFAkyjJiXyEY4fdbNyh1',
      type: 'link',
      color: 'bg-red-600 hover:bg-red-700',
      actionLabel: 'Ir a Pagar'
    }
  ];

  const handleAction = (link: any) => {
    if (link.type === 'link') {
      window.open(link.url, '_blank');
    } else if (link.type === 'copy') {
      navigator.clipboard.writeText(link.value);
      alert(`${link.name} copiado al portapapeles: ${link.value}`);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-white/70 text-sm mb-4">
        Apoya el canal a través de cualquiera de estas plataformas. ¡Muchas gracias!
      </p>
      <div className="grid gap-3">
        {donationLinks.map((link) => (
          <button
            key={link.name}
            onClick={() => handleAction(link)}
            className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all transform hover:scale-105 ${link.color} text-white shadow-lg group text-left`}
          >
            <div className="bg-white/20 p-2 rounded-lg group-hover:bg-white/30 transition-colors">
              {link.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-lg">{link.name}</div>
              {link.type === 'copy' && <div className="text-xs opacity-80 font-mono">{link.value}</div>}
            </div>
            <div className="text-xs bg-black/20 px-2 py-1 rounded">
              {link.actionLabel}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {


  const { connectedPlatforms } = useChatStore();
  const { currentTheme } = useThemeStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showDonations, setShowDonations] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'error' | 'info' | 'success' }>({ message: '', type: 'info' });

  const showNotification = (message: string, type: 'error' | 'info' | 'success' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: 'info' }), 5000);
  };

  const backgroundStyle = currentTheme.backgroundImage
    ? {
      backgroundImage: `url(${currentTheme.backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }
    : {};

  return (
    <div className={`h-screen flex flex-col bg-gradient-to-br ${currentTheme.gradient} relative overflow-hidden font-sans`}>
      <Notification message={notification.message} type={notification.type} onClose={() => setNotification({ message: '', type: 'info' })} />

      {/* Background Image with Blur */}
      {currentTheme.backgroundImage && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            ...backgroundStyle,
            filter: `blur(${currentTheme.backgroundBlur}px)`,
            opacity: currentTheme.backgroundOpacity / 100,
          }}
        />
      )}

      {/* Header */}
      <header className="bg-black/40 backdrop-blur-md border-b border-white/10 p-4 relative z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg shadow-lg">
              <Zap className="w-6 h-6" />
            </div>
            Multi-Platform Chat Manager
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if ((window as any).electron) {
                  (window as any).electron.openDevTools();
                }
              }}
              className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
              title="Abrir Consola de Desarrollo"
            >
              🛠️
            </button>
            <button
              onClick={() => setShowDonations(true)}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center gap-2 shadow-md hover:shadow-lg mr-2"
            >
              <Gift className="w-5 h-5" />
              Donar
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2 shadow-md hover:shadow-lg"
            >
              <Settings className="w-5 h-5" />
              Configuración
            </button>
          </div>
        </div>
        <div className="flex gap-4 mt-3">
          <ConnectionStatus platform="Twitch" icon={<Twitch className="w-4 h-4" />} connected={connectedPlatforms.twitch} />
          <ConnectionStatus platform="YouTube" icon={<Youtube className="w-4 h-4" />} connected={connectedPlatforms.youtube} />
          <ConnectionStatus platform="Kick" icon={<Zap className="w-4 h-4" />} connected={connectedPlatforms.kick} />
        </div>
      </header>

      {/* Donation Modal */}
      {showDonations && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/20 w-full max-w-md shadow-2xl animate-fadeIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Gift className="w-6 h-6 text-yellow-500" />
                  Donaciones
                </h2>
                <button
                  onClick={() => setShowDonations(false)}
                  className="p-2 text-white/50 hover:text-white bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DonationModal />
            </div>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
              .animate-fadeIn {
                animation: fadeIn 0.2s ease-out forwards;
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-white/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-extrabold text-white">Configuración del Gestor</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-white/50 hover:text-white bg-white/5 rounded-full transition-colors"
                  aria-label="Cerrar Configuración"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SettingsContent showNotification={showNotification} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Widgets and Chat */}
      <div className="flex-1 overflow-hidden relative z-10 flex">
        {/* Widgets Sidebar */}
        <WidgetsSidebar />

        {/* Center Chat Area */}
        <div className="flex-1 p-4 overflow-hidden relative">
          <UnifiedChat messages={useChatStore().messages} />
        </div>
      </div>
    </div>
  );
}

export default App;
