import { useState, useRef, useEffect } from 'react';
import { sendMessageTwitch } from '../services/twitchService';
import { sendMessageYouTube } from '../services/youtubeService';
import { sendMessageKick } from '../services/kickService';
import { useChatStore } from '../store/chatStore';
import { Send, Twitch, Youtube, Zap, Music } from 'lucide-react';
import type { ChatMessage } from '../types';

interface UnifiedChatProps {
    messages: ChatMessage[];
}

const platformIcons = {
    twitch: <Twitch className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    kick: <Zap className="w-5 h-5" />,
    tiktok: <Music className="w-5 h-5" />,
};

const platformColors = {
    twitch: 'bg-purple-600/20 border-purple-500',
    youtube: 'bg-red-600/20 border-red-500',
    kick: 'bg-green-500/20 border-green-500',
    tiktok: 'bg-pink-500/20 border-pink-500',
};

const platformTextColors = {
    twitch: 'text-purple-400',
    youtube: 'text-red-400',
    kick: 'text-green-400',
    tiktok: 'text-pink-400',
};

export function UnifiedChat({ messages }: UnifiedChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState<'twitch' | 'youtube' | 'kick' | null>(null);
    const { connectedPlatforms } = useChatStore();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Auto-select platform if only one is connected
    useEffect(() => {
        const connected = Object.entries(connectedPlatforms).filter(([_, isConnected]) => isConnected);
        if (connected.length === 1) {
            const platform = connected[0][0] as 'twitch' | 'youtube' | 'kick';
            if (['twitch', 'youtube', 'kick'].includes(platform)) {
                setSelectedPlatform(platform);
            }
        }
    }, [connectedPlatforms]);

    // TTS Logic
    const lastReadMessageId = useRef<string | null>(null);
    const { ttsEnabled, ttsReadName, ttsVoice, ttsLanguage, ttsRate, ttsPitch, ttsVolume } = useChatStore();

    useEffect(() => {
        if (!ttsEnabled || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.id !== lastReadMessageId.current) {
            lastReadMessageId.current = lastMessage.id;

            const textToSpeak = ttsReadName
                ? `${lastMessage.username} dice: ${lastMessage.content}`
                : lastMessage.content;

            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = ttsLanguage || 'es-ES'; // Default to Spanish if no language filter
            utterance.rate = ttsRate;
            utterance.pitch = ttsPitch;
            utterance.volume = ttsVolume;

            // Set voice if specified
            if (ttsVoice) {
                const voices = window.speechSynthesis.getVoices();
                const selectedVoice = voices.find(v => v.voiceURI === ttsVoice);
                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }
            }

            window.speechSynthesis.speak(utterance);
        }
    }, [messages, ttsEnabled, ttsReadName, ttsVoice, ttsLanguage, ttsRate, ttsPitch, ttsVolume]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !selectedPlatform) return;

        let success = false;
        if (selectedPlatform === 'twitch') {
            success = await sendMessageTwitch(inputMessage);
        } else if (selectedPlatform === 'youtube') {
            success = await sendMessageYouTube(inputMessage);
        } else if (selectedPlatform === 'kick') {
            success = await sendMessageKick(inputMessage);
        }

        if (success) {
            setInputMessage('');
        } else {
            alert('Error al enviar mensaje. Verifica la conexión.');
        }
    };

    return (
        <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-black/40 backdrop-blur-sm border-white/10">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Chat Unificado - Todas las Plataformas</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-white/50 text-sm py-20">
                        <div className="text-6xl mb-4">💬</div>
                        <div className="text-lg font-semibold mb-2">No hay mensajes aún</div>
                        <div className="text-sm">Conecta a una plataforma para ver los chats en tiempo real</div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:bg-white/5 ${platformColors[msg.platform]}`}
                        >
                            {/* Platform Icon */}
                            <div className={`flex-shrink-0 mt-0.5 ${platformTextColors[msg.platform]}`}>
                                {platformIcons[msg.platform]}
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span
                                        className="font-bold text-sm"
                                        style={{ color: msg.color || '#ffffff' }}
                                    >
                                        {msg.username}
                                    </span>
                                    <span className={`text-[10px] uppercase font-semibold ${platformTextColors[msg.platform]}`}>
                                        {msg.platform}
                                    </span>
                                </div>
                                <div className="text-white/90 text-sm break-words">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Message Input Area */}
            <div className="p-3 bg-black/60 border-t border-white/10">
                <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                    {/* Platform Selector */}
                    <div className="flex gap-2">
                        {connectedPlatforms.twitch && (
                            <button
                                type="button"
                                onClick={() => setSelectedPlatform('twitch')}
                                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${selectedPlatform === 'twitch'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                                    }`}
                            >
                                <Twitch className="w-3 h-3" /> Twitch
                            </button>
                        )}
                        {connectedPlatforms.youtube && (
                            <button
                                type="button"
                                onClick={() => setSelectedPlatform('youtube')}
                                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${selectedPlatform === 'youtube'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                                    }`}
                            >
                                <Youtube className="w-3 h-3" /> YouTube
                            </button>
                        )}
                        {connectedPlatforms.kick && (
                            <button
                                type="button"
                                onClick={() => setSelectedPlatform('kick')}
                                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${selectedPlatform === 'kick'
                                    ? 'bg-green-600 text-white'
                                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                                    }`}
                            >
                                <Zap className="w-3 h-3" /> Kick
                            </button>
                        )}
                    </div>

                    {/* Input Field */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={selectedPlatform ? `Enviar a ${selectedPlatform}...` : "Selecciona una plataforma..."}
                            disabled={!selectedPlatform}
                            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim() || !selectedPlatform}
                            className="bg-purple-600 hover:bg-purple-700 disabled:bg-white/10 disabled:text-white/20 text-white p-2 rounded transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
