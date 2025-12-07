import { useState, useRef } from 'react';
import { Send, Save, Plus, Trash2, Settings, X } from 'lucide-react';
import { useSavedMessagesStore } from '../store/savedMessagesStore';
import { useThemeStore, predefinedThemes } from '../store/themeStore';
import { useConnectedChannelsStore } from '../store/connectedChannelsStore';

export function ControlPanel() {
    const [input, setInput] = useState('');
    const [showSavedMessages, setShowSavedMessages] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const { twitchChannel, youtubeChannel, kickChannel } = useConnectedChannelsStore();

    // Helper to check if any platform is connected
    const anyPlatformConnected = Boolean(twitchChannel || youtubeChannel || kickChannel);

    const handleSend = async () => {
        if (!input.trim()) return;

        const message = input.trim();
        let sentCount = 0;
        const errors: string[] = [];

        // Enviar a Twitch si está conectado
        if (twitchChannel) {
            try {
                const { sendMessageTwitch } = await import('../services/twitchService');
                const success = await sendMessageTwitch(message);
                if (success) sentCount++;
                else errors.push('Twitch: No conectado o error al enviar');
            } catch (error) {
                errors.push('Twitch: Error al enviar');
            }
        }

        // Enviar a Kick si está conectado

        // Enviar a YouTube si está conectado
        if (youtubeChannel) {
            try {
                const { sendMessageYouTube } = await import('../services/youtubeService');
                const success = await sendMessageYouTube(message);
                if (success) sentCount++;
                else errors.push('YouTube: No conectado o error al enviar');
            } catch (error) {
                errors.push('YouTube: Error al enviar');
            }
        }

        // Enviar a Kick si está conectado
        if (kickChannel) {
            try {
                const { sendMessageKick } = await import('../services/kickService');
                const success = await sendMessageKick(message);
                if (success) sentCount++;
                else errors.push('Kick: No conectado o error al enviar');
            } catch (error) {
                errors.push('Kick: Error al enviar');
            }
        }

        if (sentCount > 0) {
            setInput('');
            console.log(`✅ Mensaje enviado a ${sentCount} plataforma(s)`);
        }

        if (errors.length > 0) {
            console.warn('⚠️ Advertencias:', errors.join(', '));
            // Mostrar solo si no se envió a ninguna plataforma
            if (sentCount === 0) {
                alert('No se pudo enviar:\n' + errors.join('\n'));
            }
        }
    };

    return (
        <div className="bg-black/40 backdrop-blur-md border-t border-white/10 relative z-20">
            <div className="px-4 py-2 border-b border-white/5 flex gap-2 items-center">
                <span className="text-white/50 text-sm mr-2">Enviar a plataformas conectadas</span>
                <div className="ml-auto flex items-center text-xs text-white/50">
                    {anyPlatformConnected ? (
                        <span className="px-2 py-1 bg-white/10 rounded">Conectadas</span>
                    ) : (
                        <span className="px-2 py-1 bg-white/5 rounded">Ninguna conectada</span>
                    )}
                </div>
            </div>

            <div className="p-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje o comando..."
                    className="flex-1 bg-white/10 text-white placeholder-white/30 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 border border-white/10"
                />
                <button
                    onClick={handleSend}
                    disabled={!input.trim() || !anyPlatformConnected}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-5 h-5" />
                    Enviar
                </button>
                <button
                    onClick={() => setShowSavedMessages(!showSavedMessages)}
                    className="bg-white/10 text-white px-6 py-3 rounded-lg hover:bg-white/20 flex items-center gap-2 transition-all"
                >
                    <Save className="w-5 h-5" />
                    Guardados
                </button>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="bg-white/10 text-white px-4 py-3 rounded-lg hover:bg-white/20 transition-all"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {showSavedMessages && <SavedMessagesPanel onClose={() => setShowSavedMessages(false)} onSelectMessage={setInput} />}
            {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
        </div>
    );
}

function SavedMessagesPanel({ onClose, onSelectMessage }: { onClose: () => void, onSelectMessage: (msg: string) => void }) {
    const { savedMessages, addSavedMessage, removeSavedMessage } = useSavedMessagesStore();
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    const handleAdd = () => {
        if (newTitle.trim() && newContent.trim()) {
            addSavedMessage(newTitle, newContent);
            setNewTitle('');
            setNewContent('');
        }
    };

    return (
        <div className="border-t border-white/10 bg-black/60 p-4 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">Mensajes Guardados</h3>
                <button onClick={onClose} className="text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="grid gap-2 mb-3">
                {savedMessages.map((msg) => (
                    <div key={msg.id} className="bg-white/10 rounded-lg p-3 flex justify-between items-start">
                        <div className="flex-1 cursor-pointer" onClick={() => onSelectMessage(msg.content)}>
                            <div className="text-white font-medium text-sm">{msg.title}</div>
                            <div className="text-white/60 text-xs mt-1">{msg.content}</div>
                        </div>
                        <button
                            onClick={() => removeSavedMessage(msg.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/10 pt-3 space-y-2">
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Título..."
                    className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <input
                    type="text"
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Mensaje..."
                    className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <button
                    onClick={handleAdd}
                    className="w-full bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Agregar Mensaje
                </button>
            </div>
        </div>
    );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
    const [twitchChannel, setTwitchChannel] = useState('');
    const [youtubeChannel, setYoutubeChannel] = useState('');
    const [kickChannel, setKickChannel] = useState('');
    const [activeTab, setActiveTab] = useState<'connections' | 'themes'>('connections');
    const { currentTheme, setTheme, setCustomBackground, setBackgroundBlur, setBackgroundOpacity } = useThemeStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { setTwitchChannel: storeTwitchChannel, setYoutubeChannel: storeYoutubeChannel, setKickChannel: storeKickChannel } = useConnectedChannelsStore();

    const handleConnectTwitch = async () => {
        if (twitchChannel.trim()) {
            const { connectTwitch } = await import('../services/twitchService');
            connectTwitch(twitchChannel);
            storeTwitchChannel(twitchChannel);
        }
    };

    const handleConnectYouTube = async () => {
        if (youtubeChannel.trim()) {
            try {
                const { connectYouTube } = await import('../services/youtubeService');
                await connectYouTube(youtubeChannel);
                storeYoutubeChannel(youtubeChannel);
            } catch (error: any) {
                console.error('Failed to connect to YouTube:', error);
                alert(`Error al conectar a YouTube:\n${error.message || 'Verifica el nombre del canal o que esté en vivo.'}`);
            }
        }
    };

    const handleConnectKick = async () => {
        if (kickChannel.trim()) {
            try {
                const { connectKick } = await import('../services/kickService');
                await connectKick(kickChannel);
                storeKickChannel(kickChannel);
            } catch (error: any) {
                console.error('Failed to connect to Kick:', error);
                alert(error.message || 'Error al conectar a Kick. Verifica el nombre del canal.');
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

    const handleRemoveBackground = () => {
        setCustomBackground(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="border-t border-white/10 bg-black/60 p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-white font-semibold">Configuración</h3>
                <button onClick={onClose} className="text-white/50 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex gap-2 mb-4 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('connections')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'connections'
                        ? 'text-purple-400 border-b-2 border-purple-400'
                        : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Conexiones
                </button>
                <button
                    onClick={() => setActiveTab('themes')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'themes'
                        ? 'text-purple-400 border-b-2 border-purple-400'
                        : 'text-white/50 hover:text-white/70'
                        }`}
                >
                    Temas y Fondo
                </button>
            </div>

            {activeTab === 'connections' && (
                <div className="space-y-4">
                    <div>
                        <label className="text-white/70 text-sm mb-1 block font-semibold flex items-center gap-2">
                            <span className="text-purple-400">🟣</span> Canal de Twitch
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={twitchChannel}
                                onChange={(e) => setTwitchChannel(e.target.value)}
                                placeholder="nombre_del_canal"
                                className="flex-1 bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                            <button
                                onClick={handleConnectTwitch}
                                className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                            >
                                Conectar
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="text-white/70 text-sm mb-1 block font-semibold flex items-center gap-2">
                            <span className="text-red-400">🔴</span> Canal de YouTube
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={youtubeChannel}
                                onChange={(e) => setYoutubeChannel(e.target.value)}
                                placeholder="@username o link del canal"
                                className="flex-1 bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                            />
                            <button
                                onClick={handleConnectYouTube}
                                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                            >
                                Conectar
                            </button>
                        </div>
                        <p className="text-white/40 text-xs mt-1">Solo funciona si el canal está en vivo</p>
                    </div>

                    <div>
                        <label className="text-white/70 text-sm mb-1 block font-semibold flex items-center gap-2">
                            <span className="text-green-400">🟢</span> Canal de Kick
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={kickChannel}
                                onChange={(e) => setKickChannel(e.target.value)}
                                placeholder="username o https://kick.com/usuario"
                                className="flex-1 bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <button
                                onClick={handleConnectKick}
                                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                            >
                                Conectar
                            </button>
                        </div>
                    </div>


                </div>
            )}

            {activeTab === 'themes' && (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    <div>
                        <label className="text-white/70 text-sm mb-2 block font-semibold">Temas Predefinidos</label>
                        <div className="grid grid-cols-3 gap-2">
                            {predefinedThemes.map((theme) => (
                                <button
                                    key={theme.name}
                                    onClick={() => setTheme(theme)}
                                    className={`p-3 rounded-lg text-xs font-medium transition-all ${currentTheme.name === theme.name
                                        ? 'ring-2 ring-purple-500 bg-white/20'
                                        : 'bg-white/10 hover:bg-white/15'
                                        }`}
                                >
                                    <div className={`h-8 rounded mb-2 bg-gradient-to-r ${theme.gradient}`}></div>
                                    <div className="text-white">{theme.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-white/70 text-sm mb-2 block font-semibold">Imagen de Fondo Personalizada</label>
                        <div className="space-y-2">
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
                                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 cursor-pointer text-center"
                                >
                                    📁 Subir Imagen
                                </label>
                                {currentTheme.backgroundImage && (
                                    <button
                                        onClick={handleRemoveBackground}
                                        className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                                    >
                                        🗑️ Quitar
                                    </button>
                                )}
                            </div>

                            {currentTheme.backgroundImage && (
                                <div className="space-y-3 bg-white/5 p-3 rounded-lg">
                                    <div className="relative h-24 rounded overflow-hidden">
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
            )}
        </div>
    );
}
