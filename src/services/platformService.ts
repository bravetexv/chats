import { Capacitor } from '@capacitor/core';

export const isElectron = () => {
    return typeof window !== 'undefined' && (window as any).electron !== undefined;
};

export const isAndroid = () => {
    return Capacitor.getPlatform() === 'android';
};

export const isIOS = () => {
    return Capacitor.getPlatform() === 'ios';
};

export const isMobile = () => {
    return isAndroid() || isIOS();
};

export const getPlatform = () => {
    if (isElectron()) return 'electron';
    return Capacitor.getPlatform();
};
