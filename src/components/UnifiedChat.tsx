import { useRef, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { Twitch, Youtube, Zap } from 'lucide-react';
import type { ChatMessage } from '../types';

interface UnifiedChatProps {
    messages: ChatMessage[];
}

const platformIcons = {
    twitch: <Twitch className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    kick: <Zap className="w-5 h-5" />,
};

const platformColors = {
    twitch: 'bg-purple-600/20 border-purple-500',
    youtube: 'bg-red-600/20 border-red-500',
    kick: 'bg-green-500/20 border-green-500',
};

const platformTextColors = {
    twitch: 'text-purple-400',
    youtube: 'text-red-400',
    kick: 'text-green-400',
};

export function UnifiedChat({ messages }: UnifiedChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // TTS Logic
    const lastReadMessageId = useRef<string | null>(null);
    const { ttsEnabled, ttsReadName, ttsVoice, ttsLanguage, ttsRate, ttsPitch, ttsVolume } = useChatStore();

    // Cancelar TTS cuando se desactiva
    useEffect(() => {
        if (!ttsEnabled) {
            // Cancelar cualquier lectura en curso
            window.speechSynthesis.cancel();
            // Resetear el ID del último mensaje leído para evitar leer historial al reactivar
            lastReadMessageId.current = null;
            console.log('🔇 TTS desactivado - cancelando lecturas pendientes y reseteando historial');
        }
    }, [ttsEnabled]);

    useEffect(() => {
        if (!ttsEnabled || messages.length === 0) return;

        const lastMessage = messages[messages.length - 1];
        if (lastMessage.id !== lastReadMessageId.current) {
            lastReadMessageId.current = lastMessage.id;

            // Verificación adicional: asegurarse que TTS sigue activado antes de hablar
            if (!ttsEnabled) {
                console.log('🔇 TTS desactivado durante procesamiento - cancelando');
                return;
            }

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

            // Verificación final antes de hablar
            if (ttsEnabled) {
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [messages, ttsEnabled, ttsReadName, ttsVoice, ttsLanguage, ttsRate, ttsPitch, ttsVolume]);

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
        </div>
    );
}
