import { create } from 'zustand';

export interface Widget {
    id: string;
    type: 'viewer-count' | 'recent-messages' | 'live-chat' | 'stats' | 'alerts' | 'web-iframe';
    position: { x: number; y: number };
    size: { width: number; height: number };
    dockPosition: 'left' | 'right' | null; // null means floating
    settings: Record<string, any>;
    visible: boolean;
}

interface WidgetState {
    widgets: Widget[];
    addWidget: (widget: Omit<Widget, 'id'>) => void;
    removeWidget: (id: string) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
    toggleWidgetVisibility: (id: string) => void;
}

export const useWidgetStore = create<WidgetState>((set) => ({
    widgets: [],
    addWidget: (widget) =>
        set((state) => ({
            widgets: [
                ...state.widgets,
                { ...widget, id: `widget-${Date.now()}-${Math.random()}` },
            ],
        })),
    removeWidget: (id) =>
        set((state) => ({
            widgets: state.widgets.filter((w) => w.id !== id),
        })),
    updateWidget: (id, updates) =>
        set((state) => ({
            widgets: state.widgets.map((w) =>
                w.id === id ? { ...w, ...updates } : w
            ),
        })),
    toggleWidgetVisibility: (id) =>
        set((state) => ({
            widgets: state.widgets.map((w) =>
                w.id === id ? { ...w, visible: !w.visible } : w
            ),
        })),
}));
