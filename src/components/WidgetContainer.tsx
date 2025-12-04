import React, { useState } from 'react';
import { Move, X, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { useWidgetStore, type Widget } from '../store/widgetStore';
import { useChatStore } from '../store/chatStore';

interface WidgetContainerProps {
    widget: Widget;
}

export function WidgetContainer({ widget }: WidgetContainerProps) {
    const { updateWidget, removeWidget } = useWidgetStore();
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Check if we are in a detached window
    const isDetached = new URLSearchParams(window.location.search).get('mode') === 'widget';

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isDetached) return; // Let Electron handle drag via CSS

        // Si se hace clic en un botón, no iniciar el arrastre
        if ((e.target as HTMLElement).closest('button')) return;

        if ((e.target as HTMLElement).closest('.widget-header')) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - widget.position.x,
                y: e.clientY - widget.position.y,
            });
        }
    };

    React.useEffect(() => {
        if (isDetached) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                updateWidget(widget.id, {
                    position: {
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y,
                    },
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, widget.id, updateWidget, isDetached]);

    if (!widget.visible) return null;

    // Forzar siempre flotante
    const isTransparent = widget.type === 'web-iframe';

    const containerStyle: React.CSSProperties = isDetached ? {
        width: '100vw',
        height: '100vh',
        position: 'relative', // Fill the window
    } : {
        position: 'absolute',
        left: `${widget.position.x}px`,
        top: `${widget.position.y}px`,
        width: `${widget.size.width}px`,
        height: `${widget.size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: 1000,
    };

    // Clases dinámicas para el estilo OBS (transparente por defecto, visible al hover)
    const containerClasses = `
        flex flex-col rounded-lg transition-all duration-300 group
        ${isTransparent
            ? `border ${isDragging ? 'bg-black/60 border-white/20' : 'bg-transparent border-transparent hover:bg-black/60 hover:border-white/20'}`
            : 'bg-black/80 backdrop-blur-md border border-white/20 shadow-2xl'}
        ${isDetached ? 'h-full w-full' : ''}
    `;

    const headerClasses = `
        widget-header flex items-center justify-between p-2 border-b border-white/10 select-none 
        ${!isDetached ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isTransparent ? `transition-opacity duration-300 ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}` : ''}
    `;

    // Estilo para permitir arrastrar la ventana en modo detached
    const headerStyle: React.CSSProperties = isDetached ? {
        // @ts-ignore - Electron specific property
        WebkitAppRegion: 'drag'
    } : {};

    return (
        <div
            className={containerClasses}
            style={containerStyle}
            onMouseDown={handleMouseDown}
        >
            {/* Drag Overlay - Protects against iframe stealing mouse events */}
            {isDragging && (
                <div className="absolute inset-0 z-50 bg-transparent cursor-grabbing" />
            )}

            {/* Widget Header */}
            <div className={headerClasses} style={headerStyle}>
                <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-white/50" />
                    <span className="text-xs font-semibold text-white/70">
                        {getWidgetTitle(widget.type)}
                    </span>
                </div>
                <div className="flex items-center gap-1" style={isDetached ? { WebkitAppRegion: 'no-drag' } as any : {}}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (isDetached) {
                                window.close();
                            } else {
                                removeWidget(widget.id);
                            }
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors ml-1"
                        title="Cerrar Widget"
                    >
                        <X className="w-3 h-3 text-white/70" />
                    </button>
                </div>
            </div>

            {/* Widget Content */}
            <div className={`p-3 overflow-auto flex-1 ${isDragging ? 'pointer-events-none' : ''}`}>
                <WidgetContent widget={widget} />
            </div>
        </div>
    );
}

function WidgetContent({ widget }: { widget: Widget }) {
    const { viewerCounts, messages } = useChatStore();

    switch (widget.type) {
        case 'viewer-count':
            return <ViewerCountWidget viewerCounts={viewerCounts} />;
        case 'recent-messages':
            return <RecentMessagesWidget messages={messages.slice(-5)} />;
        case 'live-chat':
            return <LiveChatWidget messages={messages.slice(-10)} />;
        case 'stats':
            return <StatsWidget messages={messages} viewerCounts={viewerCounts} />;
        case 'alerts':
            return <AlertsWidget />;
        case 'web-iframe':
            return <WebIframeWidget url={widget.settings.url || ''} />;
        default:
            return <div className="text-white/50 text-xs">Widget desconocido</div>;
    }
}

function WebIframeWidget({ url }: { url: string }) {
    if (!url) {
        return (
            <div className="text-white/50 text-xs text-center py-4">
                <div className="text-2xl mb-2">🌐</div>
                <div>URL no configurada</div>
            </div>
        );
    }

    // Nota: 'webview' es un elemento exclusivo de Electron.
    // TypeScript puede quejarse, por lo que usamos 'any' o ignoramos el error si es necesario.
    // @ts-ignore
    return (
        <webview
            src={url}
            className="w-full h-full border-0 rounded bg-transparent"
            // @ts-ignore
            allowpopups="true"
            webpreferences="contextIsolation=no, nodeIntegration=no"
            style={{ width: '100%', height: '100%', background: 'transparent' }}
        />
    );
}

function ViewerCountWidget({ viewerCounts }: { viewerCounts: Record<string, number> }) {
    const total = Object.values(viewerCounts).reduce((a, b) => a + b, 0);
    return (
        <div className="space-y-2">
            <div className="text-2xl font-bold text-white">👁️ {total.toLocaleString()}</div>
            <div className="text-xs text-white/50">Total Viewers</div>
            <div className="space-y-1 text-xs">
                {Object.entries(viewerCounts).map(([platform, count]) =>
                    count > 0 ? (
                        <div key={platform} className="flex justify-between text-white/70">
                            <span className="capitalize">{platform}:</span>
                            <span>{count.toLocaleString()}</span>
                        </div>
                    ) : null
                )}
            </div>
        </div>
    );
}

function RecentMessagesWidget({ messages }: { messages: any[] }) {
    return (
        <div className="space-y-2">
            {messages.length === 0 ? (
                <div className="text-white/30 text-xs">No hay mensajes recientes</div>
            ) : (
                messages.map((msg) => (
                    <div key={msg.id} className="text-xs border-b border-white/5 pb-2">
                        <div className="font-bold text-white/80" style={{ color: msg.color }}>
                            {msg.username}
                        </div>
                        <div className="text-white/60 line-clamp-2">{msg.content}</div>
                    </div>
                ))
            )}
        </div>
    );
}

function LiveChatWidget({ messages }: { messages: any[] }) {
    return (
        <div className="space-y-1 text-xs">
            {messages.map((msg) => (
                <div key={msg.id} className="flex gap-2">
                    <span className="font-bold" style={{ color: msg.color }}>
                        {msg.username}:
                    </span>
                    <span className="text-white/70">{msg.content}</span>
                </div>
            ))}
        </div>
    );
}

function StatsWidget({ messages, viewerCounts }: { messages: any[]; viewerCounts: Record<string, number> }) {
    const totalViewers = Object.values(viewerCounts).reduce((a, b) => a + b, 0);
    const messagesByPlatform = messages.reduce((acc, msg) => {
        acc[msg.platform] = (acc[msg.platform] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="space-y-3 text-xs">
            <div>
                <div className="text-white/50 mb-1">Total Viewers</div>
                <div className="text-xl font-bold text-white">{totalViewers.toLocaleString()}</div>
            </div>
            <div>
                <div className="text-white/50 mb-1">Total Messages</div>
                <div className="text-xl font-bold text-white">{messages.length}</div>
            </div>
            <div>
                <div className="text-white/50 mb-1">Por Plataforma</div>
                {Object.entries(messagesByPlatform).map(([platform, count]) => (
                    <div key={platform} className="flex justify-between text-white/70">
                        <span className="capitalize">{platform}:</span>
                        <span>{count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function AlertsWidget() {
    return (
        <div className="text-white/50 text-xs text-center py-4">
            <div className="text-2xl mb-2">🔔</div>
            <div>Sistema de alertas</div>
            <div className="text-[10px] mt-1">(Próximamente)</div>
        </div>
    );
}

function getWidgetTitle(type: string): string {
    const titles: Record<string, string> = {
        'viewer-count': 'Viewers',
        'recent-messages': 'Mensajes Recientes',
        'live-chat': 'Chat en Vivo',
        'stats': 'Estadísticas',
        'alerts': 'Alertas',
        'web-iframe': 'Página Web',
    };
    return titles[type] || 'Widget';
}
