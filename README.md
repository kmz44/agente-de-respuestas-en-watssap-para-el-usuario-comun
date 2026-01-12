# 🤖 AI Groq-WhatsApp Messenger: La Solución Definitiva de Mensajería Inteligente

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Node](https://img.shields.io/badge/node-v18%2B-green) ![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3-orange)

## 📖 Descripción General Ultra-Detallada

Bienvenido al sistema de mensajería híbrido más avanzado para WhatsApp. Este proyecto no es solo un simple bot; es una **suite completa de comunicación** que fusiona la potencia de la inteligencia artificial de última generación (Llama 3.3 Versatile en Groq LPU™) con una interfaz de usuario profesional y funcionalidades de automatización robustas.

### 🌟 ¿Qué hace este proyecto único?

Este sistema resuelve dos problemas fundamentales:
1. **Atención Automatizada**: Permite que tu número de WhatsApp responda automáticamente a clientes/amigos con inteligencia casi humana.
2. **Control Manual Superior**: Te ofrece una "Segunda Pantalla" (Web Dashboard) para gestionar tus chats sin depender del teléfono o la app oficial de WhatsApp Web.

---

## 🖥️ Arquitectura de Doble Interfaz (Híbrida)

El sistema está diseñado para funcionar de dos maneras simultáneas:

### 1. 🌐 La Interfaz Web Intuitiva (GUI)
Para el usuario que desea control visual, hemos desarrollado una aplicación web moderna (React + Vite) que actúa como centro de mando.

- **Tablero "Dashboard" (Monitoring)**:
    - **Logs en Tiempo Real**: Visualiza cada pensamiento de la IA, cada mensaje entrante y cada error del sistema en una terminal estilo "hacker" pero legible.
    - **Estado de Conexión**: Indicadores visuales (Semáforos) que te dicen si el sistema está `Escaneando QR`, `Conectado` o `Desconectado`.
    - **Configuración en Vivo**: Lee el prompt del sistema actual para saber cómo se está comportando su IA.

- **Tablero "Messenger" (Gestión)**:
    - **Experiencia Nativa**: Una interfaz completa con lista de contactos (con fotos de perfil reales), burbujas de chat, timestamps y estados de lectura.
    - **Envío Multimedia**: No solo texto; puedes adjuntar y enviar imágenes directamente desde tu PC al WhatsApp de tus contactos.
    - **Sincronización Total**: Todo lo que haces aquí se refleja en tu WhatsApp real al instante.

### 2. 🔌 Modo "Headless" (Sin Interfaz / Servidor Puro)
¿No necesitas la web? ¿Quieres correrlo en un servidor remoto (VPS) o una Raspberry Pi?
El sistema es **totalmente autónomo**.

- **Funciona en Segundo Plano**: Una vez escaneado el QR, no necesitas tener la página web abierta. El núcleo de Node.js (`src/index.ts`) mantendrá la sesión activa.
- **Autenticación por Consola**: Si no abres la web, el código QR se generará automáticamente en tu terminal de comandos (ASCII Art) para que puedas escanearlo sin necesidad de navegador.
- **Persistencia**: El sistema guarda la sesión en la carpeta `.wwebjs_auth`, por lo que si reinicias el servidor, se reconectará automáticamente sin pedir QR de nuevo.

---

## 🚀 Guía de Inicio Rápido (Paso a Paso)

### Prerrequisitos
*   **Node.js**: Versión 18 o superior.
*   **Cuenta de Groq**: Obtén tu API Key gratuita en [console.groq.com](https://console.groq.com).
*   **WhatsApp**: Un teléfono con WhatsApp activo (puede ser personal o Business).

### Instalación

1.  **Clonar el Repositorio**
    ```bash
    git clone https://github.com/kmz44/agente-de-respuestas-en-watssap-para-el-usuario-comun.git
    cd agente-de-respuestas-en-watssap-para-el-usuario-comun
    ```

2.  **Instalar Dependencias**
    El proyecto tiene dos partes (Servidor y Cliente), instala ambas:
    ```bash
    npm install             # Instala dependencias del servidor
    cd client && npm install # Instala dependencias de la interfaz web
    cd ..                   # Vuelve a la raíz
    ```

3.  **Configurar Variables de Entorno**
    Crea un archivo llamado `.env` en la carpeta raíz y pega esto:
    ```env
    GROQ_API_KEY=gsk_tu_clave_secreta_de_groq_aqui
    GROQ_MODEL=llama-3.3-70b-versatile
    PORT=3000
    ```

4.  **Iniciar el Sistema**
    Para la experiencia completa, abre dos terminales:
    
    *Terminal 1 (Servidor Inteligente):*
    ```bash
    npm start
    ```
    
    *Terminal 2 (Interfaz Web):*
    ```bash
    cd client
    npm run dev
    ```

5.  **Vincular WhatsApp**
    - Abre tu navegador en `http://localhost:5173`.
    - Verás un código QR.
    - En tu celular ve a WhatsApp > Ajustes > Dispositivos Vinculados > Vincular Dispositivo.
    - Escanea el QR.
    - **¡Listo!** Verás el mensaje "System Online" y tus contactos comenzarán a aparecer.

---

## ⚠️ Información Crítica de Seguridad y Uso

### Política de Uso de WhatsApp
Este proyecto utiliza la librería `whatsapp-web.js`, que automatiza un navegador Chrome/Chromium para simular ser un usuario real en WhatsApp Web.
*   **Riesgo**: WhatsApp monitorea la actividad automatizada. Si envías 100 mensajes en 1 minuto a desconocidos, serás bloqueado.
*   **Recomendación**: Úsalo para responder a clientes o amigos de forma natural. El sistema incluye "delays" artificiales para simular escritura humana.

### Privacidad de Datos
*   Tus chats **NUNCA** salen de tu ordenador hacia servidores de terceros (excepto el texto anonimizado que se envía a Groq para generar la respuesta).
*   Las credenciales de sesión se guardan localmente en tu máquina.

---

## 👨‍💻 Créditos y Licencia

Este proyecto ha sido desarrollado bajo la licencia **MIT**.
**Copyright (c) 2026 kmz44**

Eres libre de usar, modificar y distribuir este software para uso personal o comercial, siempre y cuando **mantengas la atribución al autor original (kmz44)** en cualquier copia o derivado.

---
*Documentación generada automáticamente para la versión 2.0 - Hybrid Core*
