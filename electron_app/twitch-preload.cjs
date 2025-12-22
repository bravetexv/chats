const { ipcRenderer } = require('electron');

const log = (msg, data = null) => {
    console.log(msg, data || '');
    // ipcRenderer.send('twitch-debug', { msg, data });
};

log('✅ Twitch Preload Loaded');

window.addEventListener('DOMContentLoaded', () => {
    log('✅ Twitch DOM Loaded');

    const processedElements = new WeakSet();
    const processMessage = (element) => {
        if (processedElements.has(element)) return;
        processedElements.add(element);

        try {
            // Twitch Chat Selectors
            const usernameEl = element.querySelector('.chat-author__display-name') ||
                element.querySelector('[data-a-target="chat-message-username"]');

            const contentEl = element.querySelector('.message') ||
                element.querySelector('[data-a-target="chat-message-text"]');

            if (usernameEl && contentEl) {
                const username = usernameEl.textContent.trim();
                const content = contentEl.textContent.trim();

                // Extraer color
                let color = '#9147FF';
                const style = window.getComputedStyle(usernameEl);
                if (style.color) {
                    color = style.color;
                }

                const messageData = {
                    id: 'tw-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                    platform: 'twitch',
                    username,
                    content,
                    timestamp: Date.now(),
                    color
                };

                log('📤 Sending scraped message:', messageData);
                ipcRenderer.send('twitch-message-from-window', messageData);
            }
        } catch (err) {
            log('❌ Error processing message:', err);
        }
    };

    const observeChat = () => {
        const chatContainer = document.querySelector('.chat-scrollable-area__bundle') ||
            document.querySelector('[data-a-target="chat-log-scrollable"]') ||
            document.body;

        log('👀 Starting observer on:', chatContainer.tagName);

        const config = { childList: true, subtree: true };
        const callback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const element = node;
                            if (element.matches && (element.matches('.chat-line__message') || element.querySelector('.chat-line__message'))) {
                                const msgEl = element.classList.contains('chat-line__message') ? element : element.querySelector('.chat-line__message');
                                if (msgEl) processMessage(msgEl);
                            }
                        }
                    });
                }
            }
        };

        const observer = new MutationObserver(callback);
        observer.observe(chatContainer, config);
        log('✅ Observer started');
    };

    setTimeout(observeChat, 5000);

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
