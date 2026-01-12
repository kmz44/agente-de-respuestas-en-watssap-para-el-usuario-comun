import process from "process";
import qrcode from "qrcode-terminal";
import { Client, MessageMedia, LocalAuth } from "whatsapp-web.js";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import fs from "fs";

// Environment variables
dotenv.config();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

// Groq Client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const prefixEnabled = process.env.PREFIX_ENABLED == "true";
const prefix_gpt = (process.env.PREFIX_GPT || "!gpt").trim();

// Config Loader
const getConfig = () => {
    try {
        const data = fs.readFileSync("./config.json", "utf8");
        return JSON.parse(data);
    } catch (e) {
        return {
            systemPrompt: "Eres un asistente amigable.",
            typingDelayMs: 1000
        };
    }
};

// Whatsapp Client
console.log("[System] Initializing WhatsApp Client...");
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

let qrCodeData: string | null = null;
let isClientReady = false;

// Socket.io connection
io.on("connection", (socket) => {
    console.log("Web Client connected");

    if (qrCodeData && !isClientReady) {
        socket.emit("qr", qrCodeData);
    }

    if (isClientReady) {
        socket.emit("ready");
    }

    // Send current config to web client
    socket.emit("config_update", getConfig());

    socket.on("logout", async () => {
        await client.logout();
        console.log("Logged out via web client");
    });

    socket.on("send_test_message", async (data: { prompt: string }) => {
        console.log("[Test Chat] Received test prompt:", data.prompt);
        // Create a mock message object that mimics the whatsapp-web.js message object
        const mockMessage = {
            from: "Web-Test-User",
            reply: (text: string) => {
                console.log("[Test Chat] Replying to web client:", text.substring(0, 50));
                socket.emit("bot_reply", { to: "Web-Test-User", body: text, timestamp: Date.now(), isTest: true });
            }
        };
        await handleMessageGPT(mockMessage, data.prompt);
    });

    socket.on("get_contacts", async () => {
        try {
            console.log("[System] Fetching contacts for dashboard...");
            const chats = await client.getChats();
            const contactList = await Promise.all(
                chats.slice(0, 50).map(async (chat) => {
                    let profilePicUrl = null;
                    try {
                        profilePicUrl = await chat.getContact().then(c => c.getProfilePicUrl());
                    } catch { /* No profile pic */ }
                    return {
                        id: chat.id._serialized,
                        name: chat.name || "Unknown",
                        unreadCount: chat.unreadCount,
                        timestamp: chat.timestamp,
                        profilePic: profilePicUrl
                    };
                })
            );
            socket.emit("contacts_list", contactList);
        } catch (e) {
            console.error("Error fetching contacts:", e);
        }
    });

    socket.on("get_chat_history", async (contactId: string) => {
        try {
            console.log(`[System] Fetching history for ${contactId}`);
            const chat = await client.getChatById(contactId);
            const messages = await chat.fetchMessages({ limit: 40 });
            const history = await Promise.all(
                messages.map(async (msg) => {
                    let mediaData = null;
                    if (msg.hasMedia) {
                        try {
                            const media = await msg.downloadMedia();
                            if (media) {
                                mediaData = `data:${media.mimetype};base64,${media.data}`;
                            }
                        } catch { /* Media download failed */ }
                    }
                    return {
                        id: msg.id.id,
                        from: msg.from,
                        fromMe: msg.fromMe,
                        body: msg.body,
                        timestamp: msg.timestamp * 1000,
                        hasMedia: msg.hasMedia,
                        mediaData
                    };
                })
            );
            socket.emit("chat_history", { contactId, history });
        } catch (e) {
            console.error("Error fetching history:", e);
        }
    });

    socket.on("send_message", async (data: { contactId: string, message: string }) => {
        try {
            console.log(`[System] Sending message to ${data.contactId}`);
            await client.sendMessage(data.contactId, data.message);
            socket.emit("message_sent", { success: true, contactId: data.contactId });
        } catch (e) {
            console.error("Error sending message:", e);
            socket.emit("message_sent", { success: false, error: String(e) });
        }
    });

    socket.on("send_image", async (data: { contactId: string, imageData: string, caption?: string }) => {
        try {
            console.log(`[System] Sending image to ${data.contactId}`);
            const { MessageMedia } = await import('whatsapp-web.js');
            const media = new MessageMedia(
                data.imageData.split(';')[0].split(':')[1],
                data.imageData.split(',')[1]
            );
            await client.sendMessage(data.contactId, media, { caption: data.caption || '' });
            socket.emit("message_sent", { success: true, contactId: data.contactId });
        } catch (e) {
            console.error("Error sending image:", e);
            socket.emit("message_sent", { success: false, error: String(e) });
        }
    });
});

// Whatsapp handlers
client.on("qr", (qr: string) => {
    console.log("[Whatsapp Groq] Scan this QR code in whatsapp to log in:");
    qrcode.generate(qr, { small: true });
    qrCodeData = qr;
    io.emit("qr", qr);
});

client.on("ready", () => {
    console.log("[Whatsapp Groq] Client is ready!");
    isClientReady = true;
    qrCodeData = null;
    io.emit("ready");
});

client.on("authenticated", () => {
    console.log("[Whatsapp Groq] Client authenticated!");
    io.emit("authenticated");
});

client.on("auth_failure", (msg) => {
    console.error("AUTHENTICATION FAILURE", msg);
    io.emit("auth_failure", msg);
});

client.on("disconnected", (reason) => {
    console.log("Client was disconnected", reason);
    isClientReady = false;
    io.emit("disconnected", reason);
    // client.initialize(); // Auto-restart? User might want manual control.
});

client.on("message", async (message: any) => {
    handleIncomingMessage(message, "message");
});

client.on("message_create", async (message: any) => {
    // message_create fires for ALL messages, including those sent by YOU.
    // We only want to process it if it's sent by you (to test) or if you want the bot to respond to your own commands.
    if (message.fromMe) {
        handleIncomingMessage(message, "message_create");
    }
});

const handleIncomingMessage = async (message: any, eventType: string) => {
    if (message.body.length == 0) return;
    if (message.from == "status@broadcast") return;

    // Prevent infinite loops: Don't respond to our OWN messages unless they start with the prefix
    if (message.fromMe) {
        if (message.body.startsWith(prefix_gpt)) {
            // It's from us AND has the prefix, handle it (manual command from user phone)
            console.log(`[System] Processing manual command from account holder`);
        } else {
            // It's from us but no prefix (likely a bot reply or normal chat)
            // We just log it for the UI and STOP processing it to avoid loops
            io.emit("message_log", { from: "You (Sent)", body: message.body, timestamp: Date.now(), event: eventType });
            return;
        }
    }

    const chat = await message.getChat();
    const isGroup = chat.isGroup;

    // Emit message to web client for log view
    io.emit("message_log", { from: message.from, body: message.body, timestamp: Date.now(), event: eventType });

    console.log(`[System] Processing message from ${message.from} (Group: ${isGroup}) via ${eventType}`);

    if (isGroup) {
        // In groups, prefix is mandatory if enabled
        if (prefixEnabled && message.body.startsWith(prefix_gpt)) {
            const prompt = message.body.substring(prefix_gpt.length).trim();
            await handleMessageGPT(message, prompt);
        } else if (!prefixEnabled) {
            await handleMessageGPT(message, message.body);
        } else {
            console.log("[System] Ignored group message (no prefix)");
        }
    } else {
        // In private chats, respond to everything if it's NOT from us, 
        // OR if it has the prefix
        let prompt = message.body;
        if (message.body.startsWith(prefix_gpt)) {
            prompt = message.body.substring(prefix_gpt.length).trim();
        }
        await handleMessageGPT(message, prompt);
    }

    // Notify Dashboard of new message
    io.emit("new_whatsapp_message", {
        id: message.id.id,
        from: message.from,
        fromMe: message.fromMe,
        body: message.body,
        timestamp: Date.now()
    });
};

const handleMessageGPT = async (message: any, prompt: string) => {
    try {
        const start = Date.now();
        console.log("[Whatsapp Groq] Received prompt from " + message.from + ": " + prompt);
        const config = getConfig();

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: config.systemPrompt },
                { role: "user", content: prompt }
            ],
            model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        });

        const text = completion.choices[0]?.message?.content || "No response generated.";

        console.log(`[Whatsapp Groq] Answer to ${message.from}: ${text.substring(0, 50)}...`);
        const end = Date.now() - start;
        console.log("[Whatsapp Groq] Took " + end + "ms");

        // Simulate typing delay for a more natural feel
        if (config.typingDelayMs > 0) {
            console.log(`[System] Simulating natural typing delay: ${config.typingDelayMs}ms`);
            await new Promise(resolve => setTimeout(resolve, config.typingDelayMs));
        }

        message.reply(text);

        // Log reply to web
        io.emit("bot_reply", { to: message.from, body: text, timestamp: Date.now() });

    } catch (error: any) {
        console.error("An error occured", error);
        message.reply("An error occured with Groq API. (" + error.message + ")");
    }
};

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    client.initialize();
});
