import { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { io, Socket } from 'socket.io-client';
import { WifiOff, Terminal, LogOut, Smartphone, MessageSquare, CheckCircle2, Send, Play, Settings, Users, MessageCircle, LayoutDashboard, ImagePlus } from 'lucide-react';
import './App.css';

interface LogMessage {
  id: string;
  type: 'info' | 'message' | 'bot';
  text: string;
  timestamp: string;
}

interface Contact {
  id: string;
  name: string;
  unreadCount: number;
  timestamp: number;
  profilePic?: string | null;
}

interface WhatsAppMsg {
  id: string;
  from: string;
  fromMe: boolean;
  body: string;
  timestamp: number;
  hasMedia?: boolean;
  mediaData?: string | null;
}

// Connect to backend (assuming localhost:3000 for now, logic to be adjusted for prod)
const socket: Socket = io('http://localhost:3000');

const translations = {
  es: {
    systemOnline: 'Sistema en Línea',
    waitingAuth: 'Esperando Autenticación',
    disconnected: 'Desconectado',
    disconnect: 'Desconectar',
    deviceConn: 'Conexión del Dispositivo',
    openWpp: 'Abre WhatsApp > Dispositivos vinculados > Vincular un dispositivo',
    devConnected: 'Dispositivo Conectado',
    readyMsg: 'Listo para procesar mensajes',
    waitingSignal: 'Esperando señal del servidor...',
    model: 'Modelo',
    engine: 'Motor',
    sysConfig: 'Configuración (Solo Lectura)',
    sysPrompt: 'Prompt del Sistema',
    natDelay: 'Retraso Natural',
    editHint: 'Edita en config.json para cambiar.',
    bypassTest: 'Prueba Directa (API)',
    testDesc: 'Prueba la IA directamente para verificar tu API.',
    askSomething: 'Pregunta algo a la IA...',
    liveFeed: 'Actividad en vivo',
    clear: 'Limpiar',
    noActivity: 'Sin actividad todavía. Los registros aparecerán aquí.',
    loading: 'Cargando...',
    youSent: 'Tú (Enviado)',
    reply: 'Respuesta',
    dashboard: 'Panel de Mensajería',
    contacts: 'Contactos',
    messages: 'Mensajes',
    selectChat: 'Selecciona un chat para ver los mensajes',
    noMessages: 'No hay mensajes en este chat.',
    typeMessage: 'Escribe un mensaje...',
    sendImage: 'Enviar imagen'
  },
  en: {
    systemOnline: 'System Online',
    waitingAuth: 'Waiting for Auth',
    disconnected: 'Disconnected',
    disconnect: 'Disconnect',
    deviceConn: 'Device Connection',
    openWpp: 'Open WhatsApp > Linked Devices > Link a Device',
    devConnected: 'Device Connected',
    readyMsg: 'Ready to process messages',
    waitingSignal: 'Waiting for server signal...',
    model: 'Model',
    engine: 'Engine',
    sysConfig: 'System Config (Read Only)',
    sysPrompt: 'System Prompt',
    natDelay: 'Natural Delay',
    editHint: 'Edit in config.json on server to change.',
    bypassTest: 'Bypass Test (Direct API)',
    testDesc: 'Test the AI directly to verify your API key is working.',
    askSomething: 'Ask something to the AI...',
    liveFeed: 'Live Activity Feed',
    clear: 'Clear',
    noActivity: 'No activity yet. Logs will appear here.',
    loading: 'Loading...',
    youSent: 'You (Sent)',
    reply: 'Reply',
    dashboard: 'Messaging Dashboard',
    contacts: 'Contacts',
    messages: 'Messages',
    selectChat: 'Select a chat to view messages',
    noMessages: 'No messages in this chat.',
    typeMessage: 'Type a message...',
    sendImage: 'Send image'
  }
};

function App() {
  const [status, setStatus] = useState<'disconnected' | 'scan_qr' | 'ready'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'messenger'>('dashboard');
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [config, setConfig] = useState({ systemPrompt: '', typingDelayMs: 0 });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<WhatsAppMsg[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const t = translations[lang];

  const addLog = (type: LogMessage['type'], text: string) => {
    setLogs(prev => [...prev.slice(-99), {
      id: Math.random().toString(36).substr(2, 9),
      type,
      text,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  useEffect(() => {
    const onConnect = () => {
      setStatus(prev => prev === 'ready' ? 'ready' : 'disconnected'); // Keep ready if already ready
      addLog('info', 'Connected to backend server');
    };

    const onDisconnect = () => {
      setStatus('disconnected');
      addLog('error' as any, 'Disconnected from backend server');
    };

    const onQr = (qr: string) => {
      setQrCode(qr);
      setStatus('scan_qr');
      addLog('info', 'QR Code received. Waiting for scan...');
    };

    const onReady = () => {
      setStatus('ready');
      setQrCode(null);
      addLog('info', 'WhatsApp Client is READY!');
    };

    const onAuthenticated = () => {
      addLog('info', 'WhatsApp Client authenticated successfully.');
    };

    const onAuthFailure = (msg: string) => {
      addLog('error' as any, `Auth failure: ${msg}`);
      setStatus('disconnected');
    };

    const onMessageLog = (data: { from: string, body: string }) => {
      const displayFrom = data.from === 'You (Sent)' ? t.youSent : data.from;
      addLog('message', `[${displayFrom}] ${data.body}`);
    };

    const onBotReply = (data: { to: string, body: string }) => {
      addLog('bot', `[${t.reply}] ${data.body}`);
    };

    const onConfigUpdate = (data: { systemPrompt: string, typingDelayMs: number }) => {
      setConfig(data);
    };

    const onContactsList = (data: Contact[]) => {
      setContacts(data);
    };

    const onChatHistory = (data: { contactId: string, history: WhatsAppMsg[] }) => {
      setChatMessages(data.history);
    };

    const onNewWAMessage = (data: WhatsAppMsg) => {
      // If the message belongs to the current active chat, add it
      if (activeChat && (data.from === activeChat || (data.fromMe && activeChat))) {
        // Re-fetch history or just append for simplicity in this case
        socket.emit('get_chat_history', activeChat);
      }
      // Update contacts list to show new activity
      socket.emit('get_contacts');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('qr', onQr);
    socket.on('ready', onReady);
    socket.on('authenticated', onAuthenticated);
    socket.on('auth_failure', onAuthFailure);
    socket.on('message_log', onMessageLog);
    socket.on('bot_reply', onBotReply);
    socket.on('config_update', onConfigUpdate);
    socket.on('contacts_list', onContactsList);
    socket.on('chat_history', onChatHistory);
    socket.on('new_whatsapp_message', onNewWAMessage);

    // Initial fetch if ready
    if (status === 'ready') {
      socket.emit('get_contacts');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('qr', onQr);
      socket.off('ready', onReady);
      socket.off('authenticated', onAuthenticated);
      socket.off('auth_failure', onAuthFailure);
      socket.off('message_log', onMessageLog);
      socket.off('bot_reply', onBotReply);
      socket.off('config_update', onConfigUpdate);
      socket.off('contacts_list', onContactsList);
      socket.off('chat_history', onChatHistory);
      socket.off('new_whatsapp_message', onNewWAMessage);
    };
  }, [status, activeChat, t]);

  // Auto-scroll chat history
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleLogout = () => {
    socket.emit("logout");
    setStatus('disconnected');
    setTimeout(() => window.location.reload(), 1000);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const selectContact = (id: string) => {
    setActiveChat(id);
    setMessageInput('');
    socket.emit('get_chat_history', id);
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat || isSending) return;
    setIsSending(true);
    socket.emit('send_message', { contactId: activeChat, message: messageInput });
    setMessageInput('');
    // Re-fetch after small delay
    setTimeout(() => {
      socket.emit('get_chat_history', activeChat);
      setIsSending(false);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      setIsSending(true);
      socket.emit('send_image', { contactId: activeChat, imageData });
      setTimeout(() => {
        socket.emit('get_chat_history', activeChat);
        setIsSending(false);
      }, 2000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTestChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPrompt.trim() || isTestLoading) return;

    setIsTestLoading(true);
    addLog('message', `[Direct Test] ${testPrompt}`);
    socket.emit('send_test_message', { prompt: testPrompt });
    setTestPrompt('');

    // Fallback timer if no response received
    const timer = setTimeout(() => setIsTestLoading(false), 8000);

    // One-time listener for the reply to stop loading
    socket.once('bot_reply', () => {
      setIsTestLoading(false);
      clearTimeout(timer);
    });
  };

  return (
    <div className="app-container">

      {/* Header */}
      <header className="main-header glass">
        <div className="header-brand">
          <div className="icon-wrapper">
            {view === 'dashboard' ? <LayoutDashboard className="icon" size={24} /> : <MessageCircle className="icon" size={24} />}
          </div>
          <div>
            <h1>{view === 'dashboard' ? 'Groq Assistant' : t.dashboard}</h1>
            <div className="status-badge">
              <span className={`status-dot ${status}`}></span>
              {status === 'ready' ? t.systemOnline : status === 'scan_qr' ? t.waitingAuth : t.disconnected}
            </div>
          </div>
        </div>

        <div className="header-nav">
          <button
            className={`nav-btn ${view === 'dashboard' ? 'active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-btn ${view === 'messenger' ? 'active' : ''}`}
            onClick={() => setView('messenger')}
            disabled={status !== 'ready'}
          >
            <MessageSquare size={18} />
            <span>Messenger</span>
          </button>
        </div>

        <div className="header-right">
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
            >
              ES
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>

          {status === 'ready' && (
            <button
              onClick={handleLogout}
              className="btn-logout-header"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Content Switcher */}
      <main className="main-content">
        {view === 'dashboard' ? (
          <div className="content-grid fade-in">
            {/* Left Column: Status/Actions */}
            <div className="column left-col">
              {/* Status Card */}
              <div className="card status-card glass">
                <div className="glow-effect"></div>
                <h2 className="card-title">
                  <Smartphone className="icon-orange" />
                  {t.deviceConn}
                </h2>
                <div className="qr-container">
                  {status === 'scan_qr' && qrCode ? (
                    <div className="qr-content fade-in">
                      <div className="qr-wrapper">
                        <QRCodeSVG value={qrCode} size={220} />
                      </div>
                      <p className="instruction-text">{t.openWpp}</p>
                    </div>
                  ) : status === 'ready' ? (
                    <div className="ready-content fade-in">
                      <div className="success-icon-wrapper">
                        <CheckCircle2 className="icon-success" size={48} />
                      </div>
                      <div>
                        <h3>{t.devConnected}</h3>
                        <p className="success-text">{t.readyMsg}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="disconnected-content pulse">
                      <WifiOff className="icon-disconnected" size={48} />
                      <p>{t.waitingSignal}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats / Info */}
              <div className="card stats-card glass">
                <div className="stat-item">
                  <div className="stat-label">{t.model}</div>
                  <div className="stat-value orange">Llama 3.3 Versatile</div>
                </div>
                <div className="divider"></div>
                <div className="stat-item">
                  <div className="stat-label">{t.engine}</div>
                  <div className="stat-value">Groq LPU™</div>
                </div>
              </div>

              {/* Config Display Card */}
              <div className="card config-card glass">
                <h2 className="card-title">
                  <Settings className="icon-orange" size={20} />
                  {t.sysConfig}
                </h2>
                <div className="config-content">
                  <div className="config-item">
                    <label>{t.sysPrompt}</label>
                    <div className="prompt-viewer custom-scrollbar">
                      {config.systemPrompt || t.loading}
                    </div>
                  </div>
                  <div className="config-item">
                    <label>{t.natDelay}</label>
                    <div className="delay-value">
                      {config.typingDelayMs} ms
                    </div>
                  </div>
                </div>
                <p className="hint-text">{t.editHint}</p>
              </div>

              {/* New Test Chat Card */}
              <div className="card test-chat-card glass animate-in slide-in-from-bottom-4 duration-500">
                <h2 className="card-title">
                  <Play className="icon-orange" size={20} />
                  {t.bypassTest}
                </h2>
                <p className="description-text">{t.testDesc}</p>
                <form onSubmit={handleTestChat} className="test-chat-form">
                  <input
                    type="text"
                    placeholder={t.askSomething}
                    value={testPrompt}
                    onChange={(e) => setTestPrompt(e.target.value)}
                    disabled={isTestLoading}
                    className="chat-input"
                  />
                  <button type="submit" className="btn-send" disabled={isTestLoading || !testPrompt.trim()}>
                    {isTestLoading ? <div className="spinner"></div> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Terminal / Logs */}
            <div className="card terminal-card glass">
              <div className="terminal-header">
                <div className="terminal-title">
                  <Terminal className="icon-small" size={16} />
                  <span>{t.liveFeed}</span>
                </div>
                <div className="terminal-actions">
                  <button onClick={clearLogs} className="btn-clear">{t.clear}</button>
                  <div className="window-controls">
                    <div className="control red"></div>
                    <div className="control yellow"></div>
                    <div className="control green"></div>
                  </div>
                </div>
              </div>
              <div className="terminal-body custom-scrollbar">
                {logs.length === 0 && (
                  <div className="empty-logs">{t.noActivity}</div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className={`log-entry ${log.type}`}>
                    <span className="timestamp">[{log.timestamp}]</span>
                    <span className="log-text">{log.type === 'bot' && '🤖 '}{log.text}</span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        ) : (
          /* FULL MESSENGER VIEW */
          <div className="messenger-view glass fade-in">
            <div className="messenger-sidebar custom-scrollbar">
              <div className="sidebar-header">
                <h3>{t.contacts}</h3>
                <Users size={18} />
              </div>
              <div className="contacts-list">
                {contacts.length === 0 && <div className="p-8 text-center text-sm text-gray-500">{t.loading}</div>}
                {contacts.map(contact => (
                  <div
                    key={contact.id}
                    className={`contact-item-full ${activeChat === contact.id ? 'active' : ''}`}
                    onClick={() => selectContact(contact.id)}
                  >
                    {contact.profilePic ? (
                      <img src={contact.profilePic} alt={contact.name} className="contact-avatar-full" />
                    ) : (
                      <div className="contact-avatar-full">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                    <div className="contact-details">
                      <div className="contact-top">
                        <span className="name">{contact.name}</span>
                        <span className="time">{contact.timestamp ? new Date(contact.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div className="contact-bottom">
                        <span className="id">{contact.id.split('@')[0]}</span>
                        {contact.unreadCount > 0 && <span className="unread-badge">{contact.unreadCount}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="messenger-chat">
              {!activeChat ? (
                <div className="chat-welcome">
                  <div className="welcome-icon">
                    <MessageCircle size={80} strokeWidth={1} />
                  </div>
                  <h2>WhatsApp Web Sync</h2>
                  <p>{t.selectChat}</p>
                </div>
              ) : (
                <>
                  <div className="messenger-chat-header">
                    {(() => {
                      const contact = contacts.find(c => c.id === activeChat);
                      return contact?.profilePic ? (
                        <img src={contact.profilePic} alt={contact.name} className="active-contact-avatar" />
                      ) : (
                        <div className="active-contact-avatar">
                          {contact?.name.charAt(0)}
                        </div>
                      );
                    })()}
                    <div className="active-contact-info">
                      <h4>{contacts.find(c => c.id === activeChat)?.name}</h4>
                      <span>online</span>
                    </div>
                  </div>
                  <div className="messenger-chat-messages custom-scrollbar">
                    {chatMessages.length === 0 && <div className="text-center p-20 text-gray-500">{t.noMessages}</div>}
                    {chatMessages.map(msg => (
                      <div key={msg.id} className={`msg-row ${msg.fromMe ? 'sent' : 'received'}`}>
                        <div className="msg-bubble">
                          {msg.hasMedia && msg.mediaData && (
                            <img src={msg.mediaData} alt="Media" className="msg-media" />
                          )}
                          {msg.body && <p>{msg.body}</p>}
                          <span className="msg-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  <form className="messenger-input-area" onSubmit={sendMessage}>
                    <input
                      type="file"
                      accept="image/*"
                      ref={imageInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button type="button" className="btn-attach" onClick={() => imageInputRef.current?.click()}>
                      <ImagePlus size={20} />
                    </button>
                    <input
                      type="text"
                      placeholder={t.typeMessage}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      disabled={isSending}
                      className="message-input"
                    />
                    <button type="submit" className="btn-send-msg" disabled={isSending || !messageInput.trim()}>
                      {isSending ? <div className="spinner-small"></div> : <Send size={20} />}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;
