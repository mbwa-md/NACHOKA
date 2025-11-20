const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const { Storage, File } = require('megajs');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode } = require('@whiskeysockets/baileys');
const yts = require('yt-search');

const MONGODB_URI = 'mongodb+srv://silamd22:sssstttt22@cluster0.wowhpe8.mongodb.net/sila-bot';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('❌ MongoDB connection error:', err.message);
});

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    number: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);

const settingsSchema = new mongoose.Schema({
    number: { type: String, required: true, unique: true },
    settings: {
        online: { type: String, default: false },
        autoread: { type: Boolean, default: false },
        autoswview: { type: Boolean, default: false },
        autoswlike: { type: Boolean, default: false },
        autoreact: { type: Boolean, default: false },
        autorecord: { type: Boolean, default: false },
        autotype: { type: Boolean, default: false },
        worktype: { type: String, default: 'public' },
        antidelete: { type: String, default: 'off' },
        autoai: { type: String, default: 'off' },
        autosticker: { type: String, default: 'off' },
        autovoice: { type: String, default: 'off' },
        anticall: { type: Boolean, default: false },
        stemoji: { type: String, default: '🐢' },
        onlyworkgroup_links: {
            whitelist: { type: [String], default: [] }
        }
    }
});

const Settings = mongoose.model('Settings', settingsSchema);

const activeSockets = new Map();
const socketCreationTime = new Map();
const SESSION_BASE_PATH = './session';

if (!fs.existsSync(SESSION_BASE_PATH)) {
    fs.mkdirSync(SESSION_BASE_PATH, { recursive: true });
}

// Create plugins directory
const PLUGINS_PATH = './plugins';
if (!fs.existsSync(PLUGINS_PATH)) {
    fs.mkdirSync(PLUGINS_PATH, { recursive: true });
}

const defaultSettings = {
    online: 'off',
    autoread: false,
    autoswview: false,
    autoswlike: false,
    autoreact: false,
    autorecord: false,
    autotype: false,
    worktype: 'public',
    antidelete: 'off',
    autoai: "off",
    autosticker: "off",
    autovoice: "off",
    anticall: false,
    stemoji: "🐢",
    onlyworkgroup_links: {
        whitelist: []
    }
};

// Auto-reply messages
const autoReplies = {
    'hi': '𝙷𝚎𝚕𝚕𝚘! 👋 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞 𝚝𝚘𝚍𝚊𝚢?',
    'mambo': '𝙿𝚘𝚊 𝚜𝚊𝚗𝚊! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'hey': '𝙷𝚎𝚢 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'vip': '𝙷𝚎𝚕𝚕𝚘 𝚅𝙸𝙿! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'mkuu': '𝙷𝚎𝚢 𝚖𝚔𝚞𝚞! 👋 𝙽𝚒𝚔𝚞𝚜𝚊𝚒𝚍𝚒𝚎 𝙺𝚞𝚑𝚞𝚜𝚞?',
    'boss': '𝚈𝚎𝚜 𝚋𝚘𝚜𝚜! 👑 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚑𝚎𝚕𝚙 𝚢𝚘𝚞?',
    'habari': '𝙽𝚣𝚞𝚛𝚒 𝚜𝚊𝚗𝚊! 👋 𝙷𝚊𝚋𝚊𝚛𝚒 𝚢𝚊𝚔𝚘?',
    'hello': '𝙷𝚒 𝚝𝚑𝚎𝚛𝚎! 😊 𝚄𝚜𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.',
    'bot': '𝚈𝚎𝚜, 𝙸 𝚊𝚖 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 s1! 🤖 𝙷𝚘𝚠 𝚌𝚊𝚗 𝙸 𝚊𝚜𝚜𝚒𝚜𝚝 𝚢𝚘𝚞?',
    'menu': '𝚃𝚢𝚙𝚎 .𝚖𝚎𝚗𝚞 𝚝𝚘 𝚜𝚎𝚎 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜! 📜',
    'owner': '𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛 𝚞𝚜𝚒𝚗𝚐 .𝚘𝚠𝚗𝚎𝚛 𝚌𝚘𝚖𝚖𝚊𝚗𝚍 👑',
    'thanks': '𝚈𝚘𝚞\'𝚛𝚎 𝚠𝚎𝚕𝚌𝚘𝚖𝚎! 😊',
    'thank you': '𝙰𝚗𝚢𝚝𝚒𝚖𝚎! 𝙻𝚎𝚝 𝚖𝚎 𝚔𝚗𝚘𝚠 𝚒𝚏 𝚢𝚘𝚞 𝚗𝚎𝚎𝚍 𝚑𝚎𝚕𝚙 🤖'
};

// Channels and groups to auto-join
const AUTO_JOIN_LINKS = [
    'https://whatsapp.com/channel/0029VbBPxQTJUM2WCZLB6j28', // MAIN
    'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02', // STB
    'https://whatsapp.com/channel/0029VbBmFT430LKO7Ch9C80X', // LOGO
    'https://chat.whatsapp.com/IdGNaKt80DEBqirc2ek4ks', // BOT.USER
    'https://chat.whatsapp.com/C03aOCLQeRUH821jWqRPC6' // SILATECH
];

// Channel JIDs for auto-reaction
const CHANNEL_JIDS = [
    '120363422610520277@newsletter',
    '120363402325089913@newsletter'
];

// Bot images for random selection
const BOT_IMAGES = [
    'https://files.catbox.moe/jwmx1j.jpg',
    'https://files.catbox.moe/dlvrav.jpg'
];

const OWNER_NUMBERS = ['255612491554'];

async function getSettings(number) {
    let session = await Settings.findOne({ number });

    if (!session) {
        session = await Settings.create({ number, settings: defaultSettings });
        return session.settings;
    }

    const mergedSettings = { ...defaultSettings };
    for (let key in session.settings) {
        if (
            typeof session.settings[key] === 'object' &&
            !Array.isArray(session.settings[key]) &&
            session.settings[key] !== null
        ) {
            mergedSettings[key] = {
                ...defaultSettings[key],
                ...session.settings[key]
            };
        } else {
            mergedSettings[key] = session.settings[key];
        }
    }

    const needsUpdate = JSON.stringify(session.settings) !== JSON.stringify(mergedSettings);

    if (needsUpdate) {
        session.settings = mergedSettings;
        await session.save();
    }

    return session.settings;
}

async function updateSettings(number, updates = {}) {
    let session = await Settings.findOne({ number });

    if (!session) {
        session = await Settings.create({ number, settings: { ...defaultSettings, ...updates } });
    } else {
        const mergedSettings = { ...defaultSettings };

        for (const key in session.settings) {
            if (
                typeof session.settings[key] === 'object' &&
                !Array.isArray(session.settings[key]) &&
                session.settings[key] !== null
            ) {
                mergedSettings[key] = {
                    ...defaultSettings[key],
                    ...session.settings[key],
                };
            } else {
                mergedSettings[key] = session.settings[key];
            }
        }

        for (const key in updates) {
            if (
                typeof updates[key] === 'object' &&
                !Array.isArray(updates[key]) &&
                updates[key] !== null
            ) {
                mergedSettings[key] = {
                    ...mergedSettings[key],
                    ...updates[key],
                };
            } else {
                mergedSettings[key] = updates[key];
            }
        }

        session.settings = mergedSettings;
        await session.save();
    }

    return session.settings;
}

async function saveSettings(number) {
    const session = await Settings.findOne({ number });

    if (!session) return await Settings.create({ number, settings: defaultSettings });

    const settings = session.settings;
    let updated = false;

    for (const key in defaultSettings) {
        if (!(key in settings)) {
            settings[key] = defaultSettings[key];
            updated = true;
        } else if (
            typeof defaultSettings[key] === 'object' &&
            defaultSettings[key] !== null &&
            !Array.isArray(defaultSettings[key])
        ) {
            for (const subKey in defaultSettings[key]) {
                if (!(subKey in settings[key])) {
                    settings[key][subKey] = defaultSettings[key][subKey];
                    updated = true;
                }
            }
        }
    }

    if (updated) {
        session.settings = settings;
        await session.save();
    }

    return settings;
}

function isBotOwner(jid, number, socket) {
    try {
        const cleanNumber = (number || '').replace(/\D/g, '');
        const cleanJid = (jid || '').replace(/\D/g, '');
        const bot = jidDecode(socket.user.id).user;

        if (bot === number) return true;
        
        return OWNER_NUMBERS.some(owner => cleanNumber.endsWith(owner) || cleanJid.endsWith(owner));
    } catch (err) {
        return false;
    }
}

function getQuotedText(quotedMessage) {
    if (!quotedMessage) return '';

    if (quotedMessage.conversation) return quotedMessage.conversation;
    if (quotedMessage.extendedTextMessage?.text) return quotedMessage.extendedTextMessage.text;
    if (quotedMessage.imageMessage?.caption) return quotedMessage.imageMessage.caption;
    if (quotedMessage.videoMessage?.caption) return quotedMessage.videoMessage.caption;
    if (quotedMessage.buttonsMessage?.contentText) return quotedMessage.buttonsMessage.contentText;
    if (quotedMessage.listMessage?.description) return quotedMessage.listMessage.description;
    if (quotedMessage.listMessage?.title) return quotedMessage.listMessage.title;
    if (quotedMessage.listResponseMessage?.singleSelectReply?.selectedRowId) return quotedMessage.listResponseMessage.singleSelectReply.selectedRowId;
    if (quotedMessage.templateButtonReplyMessage?.selectedId) return quotedMessage.templateButtonReplyMessage.selectedId;
    if (quotedMessage.reactionMessage?.text) return quotedMessage.reactionMessage.text;

    if (quotedMessage.viewOnceMessage) {
        const inner = quotedMessage.viewOnceMessage.message;
        if (inner?.imageMessage?.caption) return inner.imageMessage.caption;
        if (inner?.videoMessage?.caption) return inner.videoMessage.caption;
        if (inner?.imageMessage) return '[view once image]';
        if (inner?.videoMessage) return '[view once video]';
    }

    if (quotedMessage.stickerMessage) return '[sticker]';
    if (quotedMessage.audioMessage) return '[audio]';
    if (quotedMessage.documentMessage?.fileName) return quotedMessage.documentMessage.fileName;
    if (quotedMessage.contactMessage?.displayName) return quotedMessage.contactMessage.displayName;

    return '';
}

// Auto Bio Function
async function setupAutoBio(socket) {
    setInterval(async () => {
        try {
            const bios = [
                "🐢 SILA-MD-MINI | By SILA",
                "🤖 WhatsApp Bot | SILA TECH",
                "🚀 Powerful Features | SILA MD",
                "💫 Always Online | SILA BOT",
                "🎯 Fast & Reliable | SILA-MINI"
            ];
            const randomBio = bios[Math.floor(Math.random() * bios.length)];
            await socket.updateProfileStatus(randomBio);
        } catch (error) {
            // Silent error handling
        }
    }, 30000); // Change bio every 30 seconds
}

// Auto Join Channels/Groups
async function autoJoinChannels(socket) {
    try {
        for (const link of AUTO_JOIN_LINKS) {
            try {
                if (link.includes('whatsapp.com/channel/')) {
                    const channelId = link.split('/channel/')[1];
                    await socket.newsletterFollow(channelId);
                } else if (link.includes('chat.whatsapp.com/')) {
                    const groupCode = link.split('chat.whatsapp.com/')[1];
                    await socket.groupAcceptInvite(groupCode);
                }
                await delay(2000); // Wait 2 seconds between joins
            } catch (error) {
                // Silent error handling for already joined channels/groups
            }
        }
    } catch (error) {
        // Silent error handling
    }
}

// Auto Reaction for Channels
async function setupChannelAutoReaction(socket) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid) return;

        const remoteJid = msg.key.remoteJid;
        
        // Check if message is from a channel we want to auto-react to
        if (CHANNEL_JIDS.includes(remoteJid)) {
            try {
                const emojis = ['🐢', '❤️', '🔥', '⭐', '💫', '🚀'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                await socket.sendMessage(remoteJid, { 
                    react: { 
                        text: randomEmoji, 
                        key: msg.key 
                    }
                });
            } catch (error) {
                // Silent error handling
            }
        }
    });
}

// Load Plugins
function loadPlugins() {
    const plugins = {};
    try {
        const pluginFiles = fs.readdirSync(PLUGINS_PATH).filter(file => file.endsWith('.js'));
        
        for (const file of pluginFiles) {
            try {
                const plugin = require(path.join(PLUGINS_PATH, file));
                plugins[path.basename(file, '.js')] = plugin;
            } catch (error) {
                console.error(`Error loading plugin ${file}:`, error);
            }
        }
    } catch (error) {
        // If plugins directory doesn't exist, continue without plugins
    }
    
    return plugins;
}

async function kavixmdminibotmessagehandler(socket, number) {
    const plugins = loadPlugins();
    
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const setting = await getSettings(number);
        const remoteJid = msg.key.remoteJid;
        const jidNumber = remoteJid.split('@')[0];
        const isGroup = remoteJid.endsWith('@g.us');
        const isOwner = isBotOwner(msg.key.remoteJid, number, socket);
        const owners = [];
        const msgContent = msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || "";
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

        // Handle auto-replies for inbox messages
        if (!isGroup && !isOwner && setting.worktype === 'inbox') {
            const lowerText = text.toLowerCase().trim();
            if (autoReplies[lowerText]) {
                await socket.sendMessage(remoteJid, { text: autoReplies[lowerText] });
                return;
            }
        }

        if (owners.includes(jidNumber) || isOwner) {} else {
            switch (setting.worktype) {
                case 'private':
                    if (jidNumber !== number) return;
                    break;

                case 'group':
                    if (!isGroup) return;
                    break;

                case 'inbox':
                    if (isGroup || jidNumber === number) return;
                    break;

                case 'public': default:
                    break;
            }
        }

        let command = null;
        let args = [];
        let sender = msg.key.remoteJid;
        let PREFIX = ".";
        let botImg = BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)];
        let devTeam = "";
        let botcap = "";
        let boterr = "🐢 An error has occurred, Please try again.";
        let botNumber = await socket.decodeJid(socket.user.id);
        let body = msgContent.trim();
        let isCommand = body.startsWith(PREFIX);

        if (isCommand) {
            const parts = body.slice(PREFIX.length).trim().split(/ +/);
            command = parts.shift().toLowerCase();
            args = parts;
        }

        const ownerMessage = async () => {
            await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ʙᴇ ᴜsᴇᴅ ʙʏ ᴛʜᴇ ᴏᴡɴᴇʀ.`}, { quoted: msg });
        };

        const groupMessage = async () => {
            await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴏɴʟʏ ғᴏʀ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ ᴜsᴇ.`}, { quoted: msg });
        };

        const replygckavi = async (teks) => {
            await socket.sendMessage(sender, {
                text: teks,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 99999999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: 'newsletter@newsletter',
                        newsletterName: 'WhatsApp Bot',
                        serverMessageId: 1
                    }
                }
            }, { quoted: msg });
        }

        const kavireact = async (remsg) => {
            await socket.sendMessage(sender, { react: { text: remsg, key: msg.key, }}, { quoted: msg });
        };

        // Quoted(Settings) Handler
        try {
            if (msg.message.extendedTextMessage && msg.message.extendedTextMessage.contextInfo?.quotedMessage) {
                const quoted = msg.message.extendedTextMessage.contextInfo;
                const quotedText = getQuotedText(quoted.quotedMessage);

                if (quotedText.includes("🛠️ 𝙼𝚒𝚗𝚒 𝙱𝚘𝚝 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜 🛠️")) {
                    if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');

                    const settingsMap = {
                        '1.1': ['worktype', 'inbox'],
                        '1.2': ['worktype', 'group'],
                        '1.3': ['worktype', 'private'],
                        '1.4': ['worktype', 'public'],
                        '2.1': ['online', true],
                        '2.2': ['online', false],
                        '3.1': ['autoswview', true],
                        '3.2': ['autoswview', false],
                        '4.1': ['autorecord', true],
                        '4.2': ['autorecord', false],
                        '5.1': ['autotype', true],
                        '5.2': ['autotype', false],
                        '6.1': ['autoread', true],
                        '6.2': ['autoread', false],
                        '7.1': ['autoswlike', true],
                        '7.2': ['autoswlike', false]
                    };

                    const [key, value] = settingsMap[text] || [];
                    if (key && value !== undefined) {
                        const current = setting[key];
                        if (current === value) {
                            await replygckavi(`📍 ${key}: ᴀʟʀᴇᴀᴅʏ ᴄʜᴀɴɢᴇᴅ ᴛᴏ ${value}`);
                        } else {
                            const result = await updateSettings(number, { [key]: value });
                            await replygckavi(result ? "✅ Your action was completed successfully." : "❌ There was an issue completing your action.");
                        }
                    }
                }
            }
        } catch (error) {}

        // Execute plugin commands
        try {
            for (const pluginName in plugins) {
                const plugin = plugins[pluginName];
                if (plugin.commands && plugin.commands.includes(command)) {
                    await plugin.execute(socket, msg, {
                        command,
                        args,
                        sender,
                        number,
                        isOwner,
                        setting,
                        replygckavi,
                        kavireact
                    });
                    return;
                }
            }
        } catch (error) {}

        // Built-in commands handler
        try {
            switch (command) {
                case 'menu': {
                    try {
                        await socket.sendMessage(sender, { react: { text: "📜", key: msg.key, }}, { quoted: msg });

                        const startTime = socketCreationTime.get(number) || Date.now();
                        const uptime = Math.floor((Date.now() - startTime) / 1000);
                        const hours = Math.floor(uptime / 3600);
                        const minutes = Math.floor((uptime % 3600) / 60);
                        const seconds = Math.floor(uptime % 60);
                        const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(2);
                        const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(2);
                        
                        const message = `*╭━━━〔 🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 🐢 〕━━━┈⊷*
*┃🐢│ 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈!*
*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${new Date().toLocaleString()}*
*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙾𝙽𝙻𝙸𝙽𝙴 𝙰𝙽𝙳 𝚁𝙴𝙰𝙳𝚈!*
*╰━━━━━━━━━━━━━━━┈⊷*

『 👋 Hello 』
                    
> WhatsApp Bot Menu

┏━━━━━━━━━━━━━━━➢
┠➥ *ᴠᴇʀsɪᴏɴ: 1.0.0*
┠➥ *ᴘʀᴇғɪx: ${PREFIX}*
┠➥ *ᴛᴏᴛᴀʟ ᴍᴇᴍᴏʀʏ: ${totalMemMB} MB*
┠➥ *ғʀᴇᴇ ᴍᴇᴍᴏʀʏ: ${freeMemMB} MB*
┠➥ *ᴜᴘᴛɪᴍᴇ: ${hours}h ${minutes}m ${seconds}s*
┠➥ *ᴏᴘᴇʀᴀᴛɪɴɢ sʏsᴛᴇᴍ: ${os.type()}*
┠➥ *ᴘʟᴀᴛғᴏʀᴍ: ${os.platform()}*
┠➥ *ᴀʀᴄʜɪᴛᴇᴄᴛᴜʀᴇ: ${os.arch()}*
┗━━━━━━━━━━━━━━━➢

*\`《━━━Bot Commands━━━》\`*

> ➥ ᴀʟɪᴠᴇ
> ➥ ᴍᴇɴᴜ
> ➥ ᴘɪɴɢ
> ➥ sᴏɴɢ
> ➥ ᴠɪᴅᴇᴏ
> ➥ sᴇᴛᴛɪɴɢs
> ➥ ᴄʜɪᴅ
> ➥ ғʀᴇᴇʙᴏᴛ
> ➥ sᴇᴛᴇᴍᴏᴊɪ

*📢 Make sure to join our channels and groups!*`;

                        await socket.sendMessage(sender, { image: { url: botImg }, caption: message }, { quoted: msg });
                    } catch (error) {
                        await socket.sendMessage(sender, { text: boterr }, { quoted: msg });
                    }
                }
                break;

                case 'ping': {
                    const start = Date.now();
                    const pingMsg = await socket.sendMessage(sender, { text: '🏓 Pinging...' }, { quoted: msg });
                    const ping = Date.now() - start;
                    await socket.sendMessage(sender, { text: `🏓 Pong! ${ping}ms`, edit: pingMsg.key });
                }
                break;

                case 'settings': case "setting": case "set": {
                    if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');
                    let kavitext = `🛠️ 𝙼𝚒𝚗𝚒 𝙱𝚘𝚝 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜 🛠️


┌━━━━━➢
├*〖 1 〗 ＷＯＲＫ ＴＹＰＥ* 🛠️
├━━ 1.1 ➣ ɪɴʙᴏx 📥
├━━ 1.2 ➣ ɢʀᴏᴜᴘ 🗨️
├━━ 1.3 ➣ ᴘʀɪᴠᴀᴛᴇ 🔒
├━━ 1.4 ➣ ᴘᴜʙʟɪᴄ 🌐
└━━━━━➢

┌━━━━━➢
├*〖 2 〗 ＡＬＷＡＹＳ ＯＮＬＩＮＥ* 🌟
├━━ 2.1 ➣ ᴇɴᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 💡
├━━ 2.2 ➣ ᴅɪsᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 🔌
└━━━━━➢

┌━━━━━➢
├*〖 3 〗 ＡＵＴＯ ＲＥＡＤ ＳＴＡＴＵＳ* 📖
├━━ 3.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ✅
├━━ 3.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ❌
└━━━━━➢

┌━━━━━➢
├*〖 4 〗 ＡＵＴＯ ＲＥＣＯＲＤ* 🎙️
├━━ 4.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴄᴏʀᴅ ✅
├━━ 4.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴄᴏʀᴅ ❌
└━━━━━➢

┌━━━━━➢
├*〖 5 〗 ＡＵＴＯ ＴＹＰＥ* ⌨️
├━━ 5.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏᴛʏᴘᴇ ✅
├━━ 5.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏᴛʏᴘᴇ ❌
└━━━━━➢

┌━━━━━➢
├*〖 6 〗 ＡＵＴＯ ＲＥＡＤ* 👁️🚫
├━━ 6.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ ✅
├━━ 6.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ ❌
└━━━━━➢

┌━━━━━➢
├*〖 7 〗 ＡＵＴＯ ＬＩＫＥ ＳＴＡＴＵＳ* 💚👀
├━━ 7.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs ✅
├━━ 7.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs ❌
└━━━━━➢`;

                    await socket.sendMessage(sender, { image: { url: botImg }, caption: kavitext }, { quoted: msg })
                }
                break;
            }

        } catch (error) {}
    });
}

async function kavixmdminibotstatushandler(socket, number) {
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg || !msg.message) return;
        const { remoteJid, participant, id, server_id } = msg.key;

        const sender = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const isChannel = sender.endsWith('@newsletter');
        const settings = await getSettings(number);
        const isStatus = sender === 'status@broadcast';
        if (!settings) return;

        if (isStatus) {
            if (settings.autoswview) {
                try {
                    await socket.readMessages([msg.key]);
                } catch (e) {}
            }

            if (settings.autoswlike) {
                try {
                    const emojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'];
                    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                    await socket.sendMessage(msg.key.remoteJid, { react: { key: msg.key, text: randomEmoji } }, { statusJidList: [msg.key.participant, socket.user.id] });
                } catch (e) {}
            }
        }

        if (!isStatus) {
            if (settings.autoread) {
                await socket.readMessages([msg.key]);
            }

            if (settings.online) {
                await socket.sendPresenceUpdate("available", sender);
            } else {
                await socket.sendPresenceUpdate("unavailable", sender);
            }
        }
    });
};

async function sessionDownload(sessionId, number, retries = 3) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
    const credsFilePath = path.join(sessionPath, 'creds.json');

    if (!sessionId.startsWith('SESSION-ID~')) {
        return { success: false, error: 'Invalid session ID format' };
    }

    const fileCode = sessionId.split('SESSION-ID~')[1];
    const megaUrl = `https://mega.nz/file/${fileCode}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await fs.ensureDir(sessionPath);
            const file = await File.fromURL(megaUrl);
            await new Promise((resolve, reject) => {
                file.loadAttributes(err => {
                    if (err) return reject(new Error('Failed to load MEGA attributes'));

                    const writeStream = fs.createWriteStream(credsFilePath);
                    const downloadStream = file.download();

                    downloadStream.pipe(writeStream)
                        .on('finish', resolve)
                        .on('error', reject);
                });
            });

            return { success: true, path: credsFilePath };

        } catch (err) {
            if (attempt < retries) await new Promise(res => setTimeout(res, 2000));
            else return { success: false, error: err.message };
        }
    }
}

function randomMegaId(length = 6, numberLength = 4) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const number = Math.floor(Math.random() * Math.pow(10, numberLength));
    return `${result}${number}`;
}

async function uploadCredsToMega(credsPath) {
    const storage = await new Storage({
        email: '1234ranawakagevijitha@gmail.com',
        password: 'sandesH@1234'
    }).ready;

    if (!fs.existsSync(credsPath)) throw new Error(`File not found: ${credsPath}`);
    const fileSize = fs.statSync(credsPath).size;

    const uploadResult = await storage.upload({
        name: `${randomMegaId()}.json`,
        size: fileSize
    }, fs.createReadStream(credsPath)).complete;

    const fileNode = storage.files[uploadResult.nodeId];
    return await fileNode.link();
}

async function cyberkaviminibot(number, res) {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);

    try {
        await saveSettings(sanitizedNumber);
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const logger = pino({ level: 'silent' });

        const socket = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, logger),
            },
            printQRInTerminal: false,
            logger,
            browser: Browsers.macOS('Safari'),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
            syncFullHistory: false,
            defaultQueryTimeoutMs: 60000
        });

        socket.decodeJid = (jid) => {
            if (!jid) return jid
            if (/:\d+@/gi.test(jid)) {
                const decoded = jidDecode(jid) || {}
                return (decoded.user && decoded.server) ? decoded.user + '@' + decoded.server : jid
            } else return jid
        }

        socketCreationTime.set(sanitizedNumber, Date.now());

        // Setup all auto features
        await setupAutoBio(socket);
        await autoJoinChannels(socket);
        await setupChannelAutoReaction(socket);
        
        await kavixmdminibotmessagehandler(socket, sanitizedNumber);
        await kavixmdminibotstatushandler(socket, sanitizedNumber);

        let responseStatus = {
            codeSent: false,
            connected: false,
            error: null
        };

        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
            } catch (error) {}
        });

        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                
                switch (statusCode) {
                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Bad session detected, clearing session data...`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Session data cleared successfully`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Bad session detected. Session cleared, please try pairing again.';
                    break;

                    case DisconnectReason.connectionClosed:
                        console.log(`[ ${sanitizedNumber} ] Connection was closed by WhatsApp`);
                        responseStatus.error = 'Connection was closed by WhatsApp. Please try again.';
                    break;

                    case DisconnectReason.connectionLost:
                        console.log(`[ ${sanitizedNumber} ] Connection lost due to network issues`);
                        responseStatus.error = 'Network connection lost. Please check your internet and try again.';
                    break;

                    case DisconnectReason.connectionReplaced:
                        console.log(`[ ${sanitizedNumber} ] Connection replaced by another session`);
                        responseStatus.error = 'Connection replaced by another session. Only one session per number is allowed.';
                    break;

                    case DisconnectReason.loggedOut:
                        console.log(`[ ${sanitizedNumber} ] Logged out from WhatsApp`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Session data cleared after logout`);
                        } catch (error) {
                            console.log(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Logged out from WhatsApp. Please pair again.';
                    break;

                    case DisconnectReason.restartRequired:
                        console.log(`[ ${sanitizedNumber} ] Restart required by WhatsApp`);
                        responseStatus.error = 'WhatsApp requires restart. Please try connecting again.';

                        activeSockets.delete(sanitizedNumber);
                        socketCreationTime.delete(sanitizedNumber);

                        try {
                            socket.ws?.close();
                        } catch (err) {
                            console.log(`[ ${sanitizedNumber} ] Error closing socket during restart.`);
                        }

                        setTimeout(() => {
                            cyberkaviminibot(sanitizedNumber, res);
                        }, 2000); 
                    break;

                    case DisconnectReason.timedOut:
                        console.log(`[ ${sanitizedNumber} ] Connection timed out`);
                        responseStatus.error = 'Connection timed out. Please check your internet connection and try again.';
                    break;

                    case DisconnectReason.forbidden:
                        console.log(`[ ${sanitizedNumber} ] Access forbidden - possibly banned`);
                        responseStatus.error = 'Access forbidden. Your number might be temporarily banned from WhatsApp.';
                    break;

                    case DisconnectReason.badSession:
                        console.log(`[ ${sanitizedNumber} ] Invalid session data`);
                        try {
                            fs.removeSync(sessionPath);
                            console.log(`[ ${sanitizedNumber} ] Invalid session data cleared`);
                        } catch (error) {
                            console.error(`[ ${sanitizedNumber} ] Failed to clear session data:`, error);
                        }
                        responseStatus.error = 'Invalid session data. Session cleared, please pair again.';
                    break;

                    case DisconnectReason.multideviceMismatch:
                        console.log(`[ ${sanitizedNumber} ] Multi-device mismatch`);
                        responseStatus.error = 'Multi-device configuration mismatch. Please try pairing again.';
                    break;

                    case DisconnectReason.unavailable:
                        console.log(`[ ${sanitizedNumber} ] Service unavailable`);
                        responseStatus.error = 'WhatsApp service is temporarily unavailable. Please try again later.';
                    break;

                    default:
                        console.log(`[ ${sanitizedNumber} ] Unknown disconnection reason:`, statusCode);
                        responseStatus.error = shouldReconnect 
                            ? 'Unexpected disconnection. Attempting to reconnect...' 
                            : 'Connection terminated. Please try pairing again.';
                    break;
                }
                
                activeSockets.delete(sanitizedNumber);
                socketCreationTime.delete(sanitizedNumber);
                
                if (!res.headersSent && responseStatus.error) {
                    res.status(500).send({ 
                        status: 'error', 
                        message: `[ ${sanitizedNumber} ] ${responseStatus.error}` 
                    });
                }
                
            } else if (connection === 'connecting') {
                console.log(`[ ${sanitizedNumber} ] Connecting...`);
                
            } else if (connection === 'open') {
                console.log(`[ ${sanitizedNumber} ] Connected successfully!`);

                activeSockets.set(sanitizedNumber, socket);
                responseStatus.connected = true;

                try {
                    const filePath = path.join(sessionPath, 'creds.json');

                    if (!fs.existsSync(filePath)) {
                        console.error("File not found");
                        res.status(500).send({
                            status: 'error',
                            message: "File not found"
                        })
                        return;
                    }

                    const megaUrl = await uploadCredsToMega(filePath);
                    const sid = megaUrl.includes("https://mega.nz/file/") ? 'SESSION-ID~' + megaUrl.split("https://mega.nz/file/")[1] : 'Error: Invalid URL';
                    const userId = await socket.decodeJid(socket.user.id);
                    await Session.findOneAndUpdate({ number: userId }, { sessionId: sid }, { upsert: true, new: true });     
                    await socket.sendMessage(userId, { text: `*╭━━━〔 🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 🐢 〕━━━┈⊷*\n*┃🐢│ 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈!*\n*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${new Date().toLocaleString()}*\n*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙾𝙽𝙻𝙸𝙽𝙴 𝙰𝙽𝙳 𝚁𝙴𝙰𝙳𝚈!*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n*📢 Make sure to join our channels and groups!*` });

                } catch (e) {}
 
                if (!res.headersSent) {
                    res.status(200).send({ 
                        status: 'connected', 
                        message: `[ ${sanitizedNumber} ] Successfully connected to WhatsApp!` 
                    });
                }
            }
        });

        if (!socket.authState.creds.registered) {
            let retries = 3;
            let code = null;
            
            while (retries > 0 && !code) {
                try {
                    await delay(1500);
                    code = await socket.requestPairingCode(sanitizedNumber);
                    
                    if (code) {
                        console.log(`[ ${sanitizedNumber} ] Pairing code generated: ${code}`);
                        responseStatus.codeSent = true;

                        if (!res.headersSent) {
                            res.status(200).send({ 
                                status: 'pairing_code_sent', 
                                code: code,
                                message: `[ ${sanitizedNumber} ] Enter this code in WhatsApp: ${code}` 
                            });
                        }
                        break;
                    }
                } catch (error) {
                    retries--;
                    console.log(`[ ${sanitizedNumber} ] Failed to request, retries left: ${retries}.`);
                    
                    if (retries > 0) {
                        await delay(300 * (4 - retries));
                    }
                }
            }
            
            if (!code && !res.headersSent) {
                res.status(500).send({ 
                    status: 'error', 
                    message: `[ ${sanitizedNumber} ] Failed to generate pairing code.` 
                });
            }
        } else {
            console.log(`[ ${sanitizedNumber} ] Already registered, connecting...`);
        }

        setTimeout(() => {
            if (!responseStatus.connected && !res.headersSent) {
                res.status(408).send({ 
                    status: 'timeout', 
                    message: `[ ${sanitizedNumber} ] Connection timeout. Please try again.` 
                });

                if (activeSockets.has(sanitizedNumber)) {
                    activeSockets.get(sanitizedNumber).ws?.close();
                    activeSockets.delete(sanitizedNumber);
                }

                socketCreationTime.delete(sanitizedNumber);
            }
        }, 60000);

    } catch (error) {
        console.log(`[ ${sanitizedNumber} ] Setup error.`);
        
        if (!res.headersSent) {
            res.status(500).send({ 
                status: 'error', 
                message: `[ ${sanitizedNumber} ] Failed to initialize connection.` 
            });
        }
    }
}

async function startAllSessions() {
    try {
        const sessions = await Session.find({});
        console.log(`🔄 Found ${sessions.length} sessions to reconnect.`);

        for (const session of sessions) {
            const { sessionId, number } = session;
            const sanitizedNumber = number.replace(/[^0-9]/g, '');

            if (activeSockets.has(sanitizedNumber)) {
                console.log(`[ ${sanitizedNumber} ] Already connected. Skipping...`);
                continue;
            }

            try {
                await sessionDownload(sessionId, sanitizedNumber);
                await cyberkaviminibot(sanitizedNumber, { headersSent: true, status: () => ({ send: () => {} }) });
            } catch (err) {
                console.log(`Error reconnecting ${sanitizedNumber}:`, err.message);
            }
        }

        console.log('✅ Auto-reconnect process completed.');
    } catch (err) {
        console.log('Auto-reconnect error:', err.message);
    }
}

router.get('/', async (req, res) => {
    const { number } = req.query;
    
    if (!number) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Number parameter is required' 
        });
    }

    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    
    if (!sanitizedNumber || sanitizedNumber.length < 10) {
        return res.status(400).send({ 
            status: 'error',
            message: 'Invalid phone number format' 
        });
    }

    if (activeSockets.has(sanitizedNumber)) {
        return res.status(200).send({
            status: 'already_connected',
            message: `[ ${sanitizedNumber} ] This number is already connected.`
        });
    }

    await cyberkaviminibot(number, res);
});

process.on('exit', async () => {
    activeSockets.forEach((socket, number) => {
        try {
            socket.ws?.close();
        } catch (error) {
            console.error(`[ ${number} ] Failed to close connection.`);
        }
        activeSockets.delete(number);
        socketCreationTime.delete(number);
    });
    await mongoose.connection.close();
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    exec(`pm2 restart ${process.env.PM2_NAME || 'BOT-session'}`);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { router, startAllSessions };
