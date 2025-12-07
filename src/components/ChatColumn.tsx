import { useEffect, useRef } from 'react';
import type { ChatMessage, Platform } from '../types';
import { cn } from '../lib/utils';
import { MessageSquare } from 'lucide-react';

interface ChatColumnProps {
    platform: Platform | 'unified';
    messages: ChatMessage[];
    className?: string;
}

const platformColors: Record<Platform | 'unified', string> = {
    twitch: 'bg-purple-600',
    youtube: 'bg-red-600',
    kick: 'bg-green-500',
    unified: 'bg-blue-600',
};

export function ChatColumn({ platform, messages, className }: ChatColumnProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className={cn("flex flex-col h-full border rounded-lg overflow-hidden bg-card", className)}>
            <div className={cn("p-3 font-bold text-white flex items-center gap-2", platformColors[platform])}>
                <MessageSquare className="w-4 h-4" />
                <span className="capitalize">{platform} Chat</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-10">
                        No messages yet...
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className="text-sm break-words">
                            <span className="font-bold mr-2" style={{ color: msg.color || 'inherit' }}>
                                {msg.username}:
                            </span>
                            <span className="text-foreground">{msg.content}</span>
                            {platform === 'unified' && (
                                <span className="ml-2 text-[10px] text-muted-foreground uppercase opacity-50">
                                    {msg.platform}
                                </span>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
