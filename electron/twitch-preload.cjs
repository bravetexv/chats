const { ipcRenderer } = require('electron');

const log = (msg, data = null) => {
    console.log(msg, data || '');
    // ipcRenderer.send('twitch-debug', { msg, data });
};

log('✅ Twitch Preload Loaded');

window.addEventListener('DOMContentLoaded', () => {
    log('✅ Twitch DOM Loaded');

    // Escuchar peticiones para enviar mensajes
    ipcRenderer.on('send-twitch-message', (event, message) => {
        log('📨 Request to send message:', message);

        try {
            // Twitch usa un textarea o div contenteditable
            // Selector común: [data-a-target="chat-input"]
            const input = document.querySelector('[data-a-target="chat-input"]');

            if (!input) {
                log('❌ Could not find chat input');
                return;
            }

            // React native input value setter
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            nativeInputValueSetter.call(input, message);

            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));

            // Buscar botón de enviar
            setTimeout(() => {
                const sendButton = document.querySelector('[data-a-target="chat-send-button"]');
                if (sendButton) {
                    if (!sendButton.disabled) {
                        sendButton.click();
                        log('✅ Message sent via click');
                    } else {
                        log('❌ Send button is disabled');
                    }
                } else {
                    log('❌ Could not find send button');
                }
            }, 100);

        } catch (err) {
            log('❌ Error sending message:', err);
        }
    });
});
