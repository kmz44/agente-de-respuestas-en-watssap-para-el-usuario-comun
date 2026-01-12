# 🤖 Groq Assistant - WhatsApp Messenger & Chatbot

Este proyecto es una plataforma avanzada de integración entre WhatsApp y la inteligencia artificial de **Groq (Llama 3.3 Versatile)**. Ofrece una interfaz web moderna para monitorear, configurar y chatear directamente a través de una cuenta de WhatsApp vinculada.

## 🚀 Funcionalidades Principales

- **Chatbot Inteligente**: Automatización de respuestas usando el modelo Llama 3.3 de Groq con un carácter amigable y eficiente.
- **Messenger Dual**: Una interfaz completa tipo "WhatsApp Web" para leer y enviar mensajes (texto e imágenes) manualmente.
- **Tablero de Control (Dashboard)**: Monitoreo en tiempo real de logs, estado de conexión y configuración del sistema.
- **Modo Bypass (Test)**: Probador directo de la IA desde la web sin necesidad de enviar mensajes por WhatsApp.
- **Gestión de Configuración**: Personalización del "System Prompt" y simulación de delay de escritura para un comportamiento humano.
- **Diseño Premium**: Interfaz moderna con Glassmorphism, animaciones suaves y modo oscuro.
- **Totalmente Responsivo**: Funciona perfectamente en computadoras, tablets y teléfonos móviles.

## 🛠️ Herramientas y Tecnologías

### Backend
- **Node.js & TypeScript**: Lenguaje base para robustez y velocidad.
- **whatsapp-web.js**: Librería para control de WhatsApp vía protocolo Web.
- **Groq SDK**: Integración con las LPU™ de Groq para respuestas casi instantáneas.
- **Socket.io**: Comunicación bidireccional en tiempo real entre servidor y cliente.
- **Express**: Servidor de APIs y gestión de archivos.

### Frontend
- **React & Vite**: Framework de UI rápido y moderno.
- **Lucide Icons**: Set de iconos premium.
- **Vanilla CSS**: Estilos personalizados con variables, glassmorphism y diseño responsivo.
- **Socket.io Client**: Sincronización continua de mensajes y logs.

## ⚠️ Riesgos y Advertencias (IMPORTANTE)

El uso de este proyecto implica ciertos riesgos que el usuario debe conocer:

1. **Términos de Servicio de WhatsApp**: `whatsapp-web.js` es una librería no oficial. WhatsApp prohíbe el uso de software de terceros para automatización.
2. **Riesgo de Bloqueo (Baneo)**: El uso intensivo de automatización, spam o comportamiento no humano puede resultar en el bloqueo permanente de tu cuenta de WhatsApp. 
   - *Sugerencia*: Usa retardos de escritura razonables (incluidos en este proyecto) y evita enviar mensajes masivos a desconocidos.
3. **Privacidad de API Keys**: Tu `GROQ_API_KEY` es privada. No compartas tu archivo `.env`.
4. **Seguridad**: La interfaz web actualmente no tiene login de acceso. Asegúrate de correrla solo en entornos seguros o añadir autenticación si se expone a internet.

## ⚙️ Configuración y Uso

### Requisitos
- Node.js (v18+)
- Una cuenta de WhatsApp activa.
- Groq API Key (Gratis en [console.groq.com](https://console.groq.com)).

### Instalación
1. Clona el repositorio.
2. Ejecuta `npm install` en la raíz y en la carpeta `/client`.
3. Crea un archivo `.env` en la raíz con:
   ```env
   GROQ_API_KEY=tu_api_key_aqui
   GROQ_MODEL=llama-3.3-70b-versatile
   PORT=3000
   ```
4. Configura el prompt inicial en `config.json`.

### Ejecución
- **Servidor**: `npm start`
- **Cliente**: `cd client && npm run dev`

Escanea el código QR que aparecerá en la web para comenzar.

---
**Desarrollado con ❤️ para máxima productividad.**
