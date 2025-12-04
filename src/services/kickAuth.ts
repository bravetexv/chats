// Utilidades para manejar cookies de Kick en Electron

export const getKickCookies = async (): Promise<string | null> => {
    try {
        // Verificar si estamos en Electron
        if (typeof window !== 'undefined' && (window as any).electron) {
            // Si tienes acceso a cookies de Electron
            const cookies = await (window as any).electron.getCookies('https://kick.com');
            return cookies;
        }

        // Fallback: intentar leer cookies del localStorage
        const storedAuth = localStorage.getItem('kick_auth');
        return storedAuth;
    } catch (error) {
        console.error('Error getting Kick cookies:', error);
        return null;
    }
};

export const setKickAuth = (authToken: string) => {
    try {
        localStorage.setItem('kick_auth', authToken);
        return true;
    } catch (error) {
        console.error('Error setting Kick auth:', error);
        return false;
    }
};

export const clearKickAuth = () => {
    try {
        localStorage.removeItem('kick_auth');
        return true;
    } catch (error) {
        console.error('Error clearing Kick auth:', error);
        return false;
    }
};
