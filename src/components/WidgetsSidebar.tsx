import React, { useState } from 'react';
import { Plus, Globe } from 'lucide-react';
import { useWidgetStore } from '../store/widgetStore';

export function WidgetsSidebar() {
    const { addWidget, widgets } = useWidgetStore();
    const [widgetUrl, setWidgetUrl] = useState('');
    const [widgetName, setWidgetName] = useState('');

    const handleAddWidget = async () => {
        if (!widgetUrl.trim()) {
            alert('Por favor ingresa una URL válida');
            return;
        }

        // Verificar si estamos en Electron
        if (!(window as any).electron) {
            alert('Esta función solo está disponible en la versión de escritorio');
            return;
        }

        try {
            const widgetConfig = {
                url: widgetUrl.trim(),
                title: widgetName.trim() || 'Widget',
                width: 800,
                height: 600,
            };

            // Abrir el widget en una nueva ventana de Electron
            await (window as any).electron.openWidgetWindow(widgetConfig);

            // Agregar al store solo para llevar registro (NO se renderiza en la app principal)
            const newWidget = {
                type: 'web-iframe' as const,
                position: { x: 0, y: 0 },
                size: { width: 800, height: 600 },
                dockPosition: null,
                settings: {
                    url: widgetConfig.url,
                    name: widgetConfig.title
                },
                visible: true,
            };

            addWidget(newWidget);
            setWidgetUrl('');
            setWidgetName('');

            console.log('✅ Widget window opened:', widgetConfig.title);
        } catch (error) {
            console.error('Error al abrir widget:', error);
            alert('Error al abrir el widget. Asegúrate de haber reiniciado la aplicación de Electron.');
        }
    };

    return (
        <div className="w-80 bg-black/40 backdrop-blur-md border-r border-white/10 p-4 overflow-y-auto">
            <div className="mb-4">
                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Widgets
                </h2>

                <div className="bg-white/10 p-4 rounded-lg space-y-3">
                    <div>
                        <label className="text-white/70 text-xs mb-2 block font-semibold">
                            Nombre del Widget (Opcional)
                        </label>
                        <input
                            type="text"
                            value={widgetName}
                            onChange={(e) => setWidgetName(e.target.value)}
                            placeholder="Ej: Alertas de Streamlabs"
                            className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="text-white/70 text-xs mb-2 block font-semibold">
                            URL del Widget
                        </label>
                        <input
                            type="text"
                            value={widgetUrl}
                            onChange={(e) => setWidgetUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWidget()}
                            placeholder="https://streamlabs.com/widgets/..."
                            className="w-full bg-white/10 text-white placeholder-white/30 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <button
                        onClick={handleAddWidget}
                        className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Abrir Widget en Nueva Ventana
                    </button>
                </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg space-y-2 text-xs text-white/70">
                <div className="font-semibold text-blue-300 text-sm mb-2">💡 Ejemplos de uso:</div>
                <div className="space-y-1">
                    <p><strong className="text-white/90">Streamlabs:</strong></p>
                    <p className="text-white/50 text-[10px] break-all">
                        streamlabs.com/widgets/alertbox/...
                    </p>
                    <p className="mt-2"><strong className="text-white/90">StreamElements:</strong></p>
                    <p className="text-white/50 text-[10px] break-all">
                        streamelements.com/overlay/...
                    </p>
                </div>
            </div>

            <div className="mt-4 text-white/50 text-xs space-y-2 bg-white/5 p-3 rounded-lg">
                <p>🪟 Los widgets se abren en ventanas separadas</p>
                <p>👁️ Las ventanas son transparentes (estilo OBS)</p>
                <p>👆 Puedes mover y redimensionar cada ventana</p>
            </div>

            {widgets.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-white/70 text-xs font-semibold mb-2">
                        Widgets Activos ({widgets.length})
                    </h3>
                    <div className="space-y-1">
                        {widgets.map((widget, idx) => (
                            <div key={widget.id} className="text-white/50 text-xs bg-white/5 px-2 py-1 rounded">
                                {widget.settings.name || `Widget ${idx + 1}`}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
