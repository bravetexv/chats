# Configuración de Twitch OAuth

Para habilitar el envío de mensajes en Twitch, necesitas:

## 1. Crear una App en Twitch Developer Console

1. Ve a https://dev.twitch.tv/console/apps
2. Haz clic en "Register Your Application"
3. Llena los datos:
   - **Name**: Multi-Platform Chat Manager
   - **OAuth Redirect URLs**: `http://localhost:3000/auth/callback`
   - **Category**: Chat Bot

4. Guarda el **Client ID** y **Client Secret**

## 2. Agregar las credenciales

Abre el archivo `.env` (créalo si no existe) y agrega:

```
VITE_TWITCH_CLIENT_ID=tu_client_id_aqui
VITE_TWITCH_CLIENT_SECRET=tu_client_secret_aqui
```

## 3. Reinicia la aplicación

```bash
npm run dev:electron
```

## 4. Usa el botón "Iniciar Sesión en Twitch"

En la configuración, verás un nuevo botón para autenticarte con Twitch.
