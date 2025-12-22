const { ipcRenderer } = require('electron');

const log = (msg, data = null) => {
    console.log(msg, data || '');
    ipcRenderer.send('kick-debug', { msg, data });
};

log('✅ Kick Preload Loaded');

window.addEventListener('DOMContentLoaded', () => {
    log('✅ Kick DOM Loaded');

    const processedElements = new WeakSet();
    const processMessage = (element) => {
        if (processedElements.has(element)) return;
        processedElements.add(element);
        try {
            // Extraer usuario
            const usernameEl = element.querySelector('.font-bold') ||
                element.querySelector('[style*="color"]');

            const username = usernameEl ? usernameEl.textContent.trim() : 'Anonymous';

            // Extraer contenido
            const contentEl = element.querySelector('.chat-entry-content') ||
                element.querySelector('.message-content') ||
                element.querySelector('.break-words');

            let content = '';
            if (contentEl) {
                const clone = contentEl.cloneNode(true);

                // Eliminar timestamps
                const possibleTimestamps = clone.querySelectorAll('span');
                possibleTimestamps.forEach(span => {
                    if (span.textContent.match(/\d{2}:\d{2}/)) {
                        span.remove();
                    }
                });

                // Reemplazar emotes
                const images = clone.querySelectorAll('img');
                images.forEach(img => {
                    img.replaceWith(`[${img.alt || 'emote'}]`);
                });

                content = clone.textContent.trim();
            } else {
                if (usernameEl) {
                    const clone = element.cloneNode(true);
                    const userInClone = clone.querySelector('.font-bold') || clone.querySelector('[style*="color"]');
                    if (userInClone) userInClone.remove();

                    const spans = clone.querySelectorAll('span');
                    spans.forEach(span => {
                        if (span.textContent.match(/\d{2}:\d{2}/)) {
                            span.remove();
                        }
                    });

                    content = clone.textContent.trim();
                }
            }

            // Limpieza final
            content = content.replace(/^\d{2}:\d{2}\s*/, '');
            if (username && content.startsWith(username)) {
                content = content.substring(username.length).replace(/^[:\s]+/, '');
            }

            // Extraer color
            let color = '#53FC18';
            if (usernameEl) {
                const style = window.getComputedStyle(usernameEl);
                if (style.color && style.color !== 'rgb(255, 255, 255)') {
                    color = style.color;
                }
            }

            // Validar y enviar
            if (username && content && content.length > 0) {
                const messageData = {
                    id: Date.now().toString() + Math.random().toString(),
                    platform: 'kick',
                    username,
                    content,
                    timestamp: Date.now(),
                    color
                };

                log('📤 Sending message:', messageData);
                ipcRenderer.send('kick-message-from-window', messageData);
            }
        } catch (err) {
            log('❌ Error processing message:', err);
        }
    };

    // Función para observar el chat
    const observeChat = () => {
        const chatContainer = document.querySelector('#chatroom') ||
            document.querySelector('.chatroom') ||
            document.body;

        log('👀 Starting observer on:', chatContainer.tagName);

        const config = { childList: true, subtree: true };

        const callback = (mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            const element = node;

                            // Buscar por clases conocidas
                            if (element.matches && (element.matches('.chat-entry') || element.querySelector('.chat-entry-content'))) {
                                processMessage(element);
                                return;
                            }

                            // Heurística - Buscar estructura de mensaje
                            const possibleUser = element.querySelector('.font-bold') || element.querySelector('[style*="color"]');
                            const possibleContent = element.querySelector('.break-words') || element.querySelector('span:not(.font-bold)');

                            if (possibleUser && possibleContent) {
                                processMessage(element);
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

    // Esperar a que cargue el chat
    setTimeout(observeChat, 3000);

    // Escuchar peticiones para enviar mensajes
    ipcRenderer.on('send-kick-message', (event, message) => {
        log('📨 Request to send message:', message);

        try {
            const input = document.querySelector('#message-input') ||
                document.querySelector('[contenteditable="true"]') ||
                document.querySelector('textarea');

            if (!input) {
                log('❌ Could not find chat input');
                return;
            }

            // Insertar texto
            if (input.isContentEditable) {
                input.focus();
                document.execCommand('insertText', false, message);

                if (input.textContent !== message && !input.textContent.includes(message)) {
                    input.textContent = message;
                }
            } else {
                input.value = message;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Enviar
            setTimeout(() => {
                const sendButton = document.querySelector('button[type="submit"]') ||
                    document.querySelector('button[aria-label="Send message"]') ||
                    document.querySelector('.chat-input-area button');

                if (sendButton) {
                    log('🔘 Clicking send button');
                    sendButton.click();
                } else {
                    log('⌨️ Simulating Enter key');
                    const enterEvent = new KeyboardEvent('keydown', {
                        key: 'Enter',
                        code: 'Enter',
                        keyCode: 13,
                        which: 13,
                        bubbles: true,
                        cancelable: true
                    });
                    input.dispatchEvent(enterEvent);
                }
            }, 100);

        } catch (err) {
            log('❌ Error sending message:', err);
        }
    });
});
