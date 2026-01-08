/**
 * @file TwitchChatService.js
 * Este módulo se encarga de la conexión con el chat de Twitch a través de TMI.js.
 * Se conecta a un canal específico y emite eventos para nuevos mensajes.
 */

// Para que esto funcione, necesitarás incluir la librería TMI.js en tu proyecto.
// Puedes descargarla o usarla desde un CDN en tu index.html, por ejemplo:
// <script src="https://unpkg.com/tmi.js/client.js"></script>

class TwitchChatService {
  constructor() {
    this.client = null;
    this.onMessageCallback = null;
  }

  /**
   * Se conecta a un canal de Twitch.
   * @param {string} channel - El nombre del canal de Twitch.
   * @param {string} [username] - Opcional: El nombre de usuario si se conecta de forma anónima.
   * @param {string} [oauth] - Opcional: El token OAuth si se conecta con una cuenta.
   */
  connect(channel, username, oauth) {
    if (this.client && this.client.readyState() === 'OPEN') {
      console.log('Ya hay una conexión activa de Twitch.');
      return;
    }

    const options = {
      connection: {
        secure: true,
        reconnect: true,
      },
      identity: username && oauth ? { username, password: `oauth:${oauth}` } : undefined,
      channels: [channel],
    };

    this.client = new tmi.Client(options);

    this.client.on('message', (channel, tags, message, self) => {
      if (self) return; // Ignorar mensajes del propio bot/cliente

      if (this.onMessageCallback) {
        // Creamos un objeto de mensaje unificado
        const chatMessage = {
          platform: 'twitch',
          id: tags['id'],
          author: {
            name: tags['display-name'],
            color: tags['color'],
            isMod: tags.mod,
            isSubscriber: tags.subscriber,
            badges: tags.badges,
          },
          message: message,
          timestamp: new Date(parseInt(tags['tmi-sent-ts'], 10)),
        };
        this.onMessageCallback(chatMessage);
      }
    });

    this.client.connect().catch(console.error);

    this.client.on('connected', (address, port) => {
        console.log(`Conectado al chat de Twitch: ${address}:${port}`);
    });
  }

  /**
   * Se desconecta del chat de Twitch.
   */
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
      console.log('Desconectado del chat de Twitch.');
    }
  }

  /**
   * Registra una función callback para ser llamada en cada nuevo mensaje.
   * @param {function} callback - La función que manejará el nuevo mensaje.
   */
  onMessage(callback) {
    this.onMessageCallback = callback;
  }
}

// Exportamos una única instancia del servicio (patrón Singleton)
const twitchChatService = new TwitchChatService();
// Hacemos que sea accesible globalmente o lo exportamos si usamos un sistema de módulos.
window.twitchChatService = twitchChatService;