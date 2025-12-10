const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, isJidGroup } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const config = {
    SESSION_NAME: 'sila-md',
    OWNER_NUMBER: '255612491554',
    NEWS_CHANNEL: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
    NEWS_JID: '120363402325089913@newsletter',
    HEROKU_APP_URL: 'https://nachoka.onrender.com',
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_REPO: 'your-repo/sessions'
};

// Default Settings
const defaultSettings = {
    online: 'off',
    autoread: false,
    autoswview: true,
    autoswlike: true,
    autoreact: false,
    autorecord: true,
    autotype: true,
    worktype: 'public',
    antidelete: 'on',
    autoai: "on",
    autosticker: "off",
    autovoice: "off",
    anticall: false,
    stemoji: "🐢",
    onlyworkgroup_links: {
        whitelist: []
    }
};

// Bot Images for random selection
const botImages = [
    'https://files.catbox.moe/jwmx1j.jpg',
    'https://files.catbox.moe/dlvrav.jpg',
    'https://files.catbox.moe/qi3kij.jpg'
];

// Helper functions
function getRandomBotImage() {
    return botImages[Math.floor(Math.random() * botImages.length)];
}

function silaMessage(text) {
    const randomImage = getRandomBotImage();
    
    return {
        text: text,
        contextInfo: {
            externalAdReply: {
                title: 'SILA AI',
                body: 'WhatsApp ‧ Verified',
                thumbnailUrl: randomImage,
                thumbnailWidth: 64,
                thumbnailHeight: 64,
                sourceUrl: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
                mediaUrl: randomImage,
                showAdAttribution: true,
                renderLargerThumbnail: false,
                previewType: 'PHOTO',
                mediaType: 1
            },
            forwardedNewsletterMessageInfo: {
                newsletterJid: config.NEWS_JID,
                newsletterName: 'SILA AI OFFICIAL',
                serverMessageId: Math.floor(Math.random() * 1000000)
            },
            isForwarded: true,
            forwardingScore: 999
        }
    };
}

// Define fakevCard with Christmas and regular version
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© SILA AI 🎅",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SILA AI CHRISTMAS\nORG:SILA AI;\nTEL;type=CELL;type=VOICE;waid=255612491554:+255612491554\nEND:VCARD`
        }
    }
};

// Store for bot state
const botState = {
    settings: { ...defaultSettings },
    sessions: {},
    groupLinks: [],
    channelLinks: [],
    autoJoinEnabled: true,
    followEnabled: true,
    autoBioEnabled: true
};

// Auto Bio Handler
async function updateAutoBio(socket) {
    if (!botState.autoBioEnabled) return;
    
    const bios = [
        "🤖 SILA MD | Powered by Sila Tech",
        "🎅 SILA AI Christmas Edition",
        "✨ SILA MD Mini Bot | Always Online",
        "🚀 Advanced WhatsApp Bot",
        "💫 SILA AI | Your AI Assistant"
    ];
    
    const randomBio = bios[Math.floor(Math.random() * bios.length)];
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    const bio = `${randomBio} | Uptime: ${hours}h ${minutes}m`;
    
    try {
        await socket.updateProfileStatus(bio);
        console.log(`[BIO] Updated: ${bio}`);
    } catch (error) {
        console.error('[BIO] Update failed:', error.message);
    }
}

// Auto Join Handler
async function handleAutoJoin(socket, msg) {
    if (!botState.autoJoinEnabled) return;
    
    if (msg.message?.groupInviteMessage) {
        const inviteCode = msg.message.groupInviteMessage.inviteCode;
        const inviteExpiration = msg.message.groupInviteMessage.inviteExpiration;
        
        try {
            await socket.groupAcceptInvite(inviteCode);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                "*✅ 𝙹𝙾𝙸𝙽𝙴𝙳 𝙶𝚁𝙾𝚄𝙿 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈!*\n\n*𝚃𝚑𝚊𝚗𝚔 𝚢𝚘𝚞 𝚏𝚘𝚛 𝚝𝚑𝚎 𝚒𝚗𝚟𝚒𝚝𝚎! 𝙸'𝚖 𝚗𝚘𝚠 𝚊𝚌𝚝𝚒𝚟𝚎 𝚒𝚗 𝚝𝚑𝚒𝚜 𝚐𝚛𝚘𝚞𝚙.*"
            ), { quoted: msg });
            
            botState.groupLinks.push({
                code: inviteCode,
                jid: msg.key.remoteJid,
                timestamp: Date.now()
            });
        } catch (error) {
            console.error('Auto join failed:', error);
        }
    }
}

// Auto Follow Handler
async function handleAutoFollow(socket, msg) {
    if (!botState.followEnabled) return;
    
    if (msg.message?.contactMessage?.vcard) {
        try {
            const vcard = msg.message.contactMessage.vcard;
            const phoneMatch = vcard.match(/TEL[^:]*:([^\r\n]+)/i);
            
            if (phoneMatch) {
                const phone = phoneMatch[1].replace(/[^\d]/g, '');
                if (phone) {
                    await socket.sendMessage(msg.key.remoteJid, silaMessage(
                        `*👥 𝙵𝙾𝙻𝙻𝙾𝚆𝙸𝙽𝙶 ${phone}*\n\n*𝙰𝚞𝚝𝚘 𝚏𝚘𝚕𝚕𝚘𝚠 𝚏𝚎𝚊𝚝𝚞𝚛𝚎 𝚒𝚜 𝚎𝚗𝚊𝚋𝚕𝚎𝚍!*`
                    ), { quoted: msg });
                }
            }
        } catch (error) {
            console.error('Auto follow failed:', error);
        }
    }
}

// Auto Reaction for Channels
async function handleChannelReaction(socket, msg) {
    if (!botState.settings.autoreact) return;
    
    if (msg.key?.remoteJid?.endsWith('@newsletter')) {
        try {
            await socket.sendMessage(msg.key.remoteJid, {
                react: {
                    text: botState.settings.stemoji,
                    key: msg.key
                }
            });
        } catch (error) {
            console.error('Channel reaction failed:', error);
        }
    }
}

// Auto Sticker Reply
async function handleAutoSticker(socket, msg) {
    if (botState.settings.autosticker !== "on") return;
    
    const text = msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || '';
    const lowerText = text.toLowerCase();
    
    const stickerMap = {
        'hi': 'hello',
        'hello': 'hello',
        'bye': 'bye',
        'thanks': 'thanks',
        'thank you': 'thanks',
        'good morning': 'morning',
        'good night': 'night'
    };
    
    for (const [word, sticker] of Object.entries(stickerMap)) {
        if (lowerText.includes(word)) {
            try {
                const stickerBuffer = fs.readFileSync(`./assets/stickers/${sticker}.webp`);
                await socket.sendMessage(msg.key.remoteJid, { 
                    sticker: stickerBuffer 
                }, { quoted: fakevCard });
                return true;
            } catch (error) {
                console.error('Auto sticker error:', error);
            }
            break;
        }
    }
    return false;
}

// Auto Voice Reply
async function handleAutoVoice(socket, msg) {
    if (botState.settings.autovoice !== "on") return;
    
    const text = msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || '';
    
    const voiceMap = {
        'hi': 'Hello! How can I help you?',
        'hello': 'Hi there! Nice to meet you.',
        'how are you': 'I am fine, thank you!',
        'what is your name': 'My name is SILA MD Mini Bot'
    };
    
    for (const [phrase, response] of Object.entries(voiceMap)) {
        if (text.toLowerCase().includes(phrase)) {
            try {
                const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(response)}&tl=en&client=tw-ob`;
                const { data } = await axios.get(ttsUrl, { responseType: "arraybuffer" });
                const audioBuffer = Buffer.from(data, "binary");
                
                await socket.sendMessage(msg.key.remoteJid, {
                    audio: audioBuffer,
                    mimetype: "audio/mpeg",
                    ptt: true
                }, { quoted: msg });
                return true;
            } catch (error) {
                console.error('Auto voice error:', error);
            }
            break;
        }
    }
    return false;
}

// Auto AI Reply
async function handleAutoAI(socket, msg) {
    if (botState.settings.autoai !== "on") return;
    
    const text = msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || '';
    
    if (text.length > 3 && !text.startsWith('.') && !msg.key.fromMe) {
        try {
            const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(text)}`;
            const { data } = await axios.get(apiUrl, { timeout: 10000 });
            
            if (data?.result) {
                await socket.sendMessage(msg.key.remoteJid, silaMessage(
                    `*🤖 𝙰𝚄𝚃𝙾 𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴:*\n\n${data.result}`
                ), { quoted: msg });
                return true;
            }
        } catch (error) {
            console.error('Auto AI error:', error);
        }
    }
    return false;
}

// Auto Read Messages
async function handleAutoRead(socket, msg) {
    if (botState.settings.autoread) {
        try {
            await socket.readMessages([msg.key]);
        } catch (error) {
            console.error('Auto read error:', error);
        }
    }
}

// Anti Delete
async function handleAntiDelete(socket, msg) {
    if (botState.settings.antidelete === "on" && msg.message?.protocolMessage?.type === 0) {
        const deletedMsgKey = msg.message.protocolMessage.key;
        
        try {
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                "*⚠️ 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝙳𝙴𝙻𝙴𝚃𝙴𝙳*\n\n*𝚂𝚘𝚖𝚎𝚘𝚗𝚎 𝚍𝚎𝚕𝚎𝚝𝚎𝚍 𝚊 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚒𝚗 𝚝𝚑𝚒𝚜 𝚌𝚑𝚊𝚝.*"
            ), { quoted: fakevCard });
        } catch (error) {
            console.error('Anti delete error:', error);
        }
    }
}

// Auto Reply System
const autoReplies = {
    'hi': 'Hello! How can I help you? 😊',
    'hello': 'Hi there! 👋',
    'bot': 'Yes, I am SILA MD Mini Bot! 🤖',
    'thanks': 'You\'re welcome! 😊',
    'thank you': 'Anytime! 😇',
    'good morning': 'Good morning! 🌅',
    'good night': 'Good night! 🌙',
    'how are you': 'I\'m fine, thank you! How about you? 😊',
    'what can you do': 'I can download videos, generate AI images, chat with AI, and much more! Type .list to see all commands.',
    'who made you': 'I was created by Sila Tech! 👑',
    'what is your name': 'My name is SILA MD Mini Bot! 🤖'
};

async function handleAutoReply(socket, msg) {
    const text = msg.message?.conversation || 
                msg.message?.extendedTextMessage?.text || '';
    const lowerText = text.toLowerCase();
    
    // Check if message is a reply to bot
    const isReplyToBot = msg.message?.extendedTextMessage?.contextInfo?.participant?.endsWith('@s.whatsapp.net');
    
    for (const [keyword, reply] of Object.entries(autoReplies)) {
        if (lowerText.includes(keyword) && !msg.key.fromMe && (isReplyToBot || !text.startsWith('.'))) {
            try {
                await socket.sendMessage(msg.key.remoteJid, silaMessage(reply), { quoted: msg });
                return true;
            } catch (error) {
                console.error('Auto reply error:', error);
            }
            break;
        }
    }
    return false;
}

// ==================== COMMANDS START HERE ====================

// IMAGINE COMMAND
const imagine = {
    command: "imagine",
    alias: ["aiimg", "flux", "fluxai", "aiimage"],
    description: "Generate AI images using multiple providers",
    category: "ai",
    react: "🎨",
    usage: ".imagine [prompt]",
    execute: async (socket, msg, args) => {
        const sender = msg.key.remoteJid;
        const prompt = args.join(" ");

        try {
            await socket.sendMessage(sender, { react: { text: "⏳", key: msg.key } });

            if (!prompt) {
                await socket.sendMessage(sender, silaMessage(
                    "*🎨 𝙰𝙸 𝙸𝙼𝙰𝙶𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙾𝚁 🎨*\n\n*𝚄𝚂𝙰𝙶𝙴:* .imagine [prompt]\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .imagine a beautiful sunset over mountains"
                ), { quoted: msg });
                return;
            }

            await socket.sendMessage(sender, silaMessage(
                `*🔄 𝙲𝚁𝙴𝙰𝚃𝙸𝙽𝙶 𝙸𝙼𝙰𝙶𝙴...*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* ${prompt}\n\n*𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝 𝚠𝚑𝚒𝚕𝚎 𝙸 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝚢𝚘𝚞𝚛 𝚒𝚖𝚊𝚐𝚎...*`
            ), { quoted: msg });

            const apis = [
                {
                    name: "Flux AI",
                    url: `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}`
                },
                {
                    name: "Stable Diffusion", 
                    url: `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(prompt)}`
                },
                {
                    name: "Stability AI",
                    url: `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(prompt)}`
                }
            ];

            let imageBuffer = null;
            let apiUsed = "";

            for (const api of apis) {
                try {
                    const response = await axios.get(api.url, { 
                        responseType: "arraybuffer",
                        timeout: 30000
                    });

                    if (response.data && response.data.length > 1000) {
                        imageBuffer = Buffer.from(response.data, "binary");
                        apiUsed = api.name;
                        break;
                    }
                } catch (apiError) {
                    continue;
                }
            }

            if (!imageBuffer) {
                await socket.sendMessage(sender, silaMessage(
                    "*❌ 𝙸𝙼𝙰𝙶𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙰𝚕𝚕 𝙰𝙸 𝚜𝚎𝚛𝚟𝚒𝚌𝚎𝚜 𝚊𝚛𝚎 𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚞𝚗𝚊𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*"
                ), { quoted: msg });
                await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
                return;
            }

            await socket.sendMessage(sender, {
                image: imageBuffer,
                caption: `*🎨 𝙰𝙸 𝙸𝙼𝙰𝙶𝙴 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳 🎨*\n\n*𝙿𝚛𝚘𝚖𝚙𝚝:* ${prompt}\n*𝙼𝚘𝚍𝚎𝚕:* ${apiUsed}\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝚜𝟷*`
            }, { quoted: msg });

            await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("Imagine command error:", error);
            await socket.sendMessage(sender, silaMessage(
                `*❌ 𝙴𝚁𝚁𝙾𝚁*\n\n*𝙵𝚊𝚒𝚕𝚎𝚍 𝚝𝚘 𝚐𝚎𝚗𝚎𝚛𝚊𝚝𝚎 𝚒𝚖𝚊𝚐𝚎:*\n${error.message || "Unknown error"}\n\n*𝙿𝚕𝚎𝚊𝚜𝚎 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚊 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚙𝚛𝚘𝚖𝚙𝚝.*`
            ), { quoted: msg });
            await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
};

// PAIR COMMAND
const pair = {
    command: "pair",
    desc: "Get pairing code for mini inconnu xd AI bot",
    use: ".pair 653078046968",
    react: "🔑",
    execute: async (socket, msg, args) => {
        const messages = {
            invalid: "*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴 🤔*\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*𝙿𝙰𝙸𝚁 +255612491554*\n\n*𝚆𝙷𝙴𝙽 𝚈𝙾𝚄 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄 𝚆𝙸𝙻𝙻 𝙶𝙴𝚃 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴 😃 𝚈𝙾𝚄 𝙲𝙰𝙽 𝙻𝙾𝙶𝙸𝙽 𝙸𝙽 𝚈𝙾𝚄𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 😍 𝚈𝙾𝚄𝚁 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝚆𝙸𝙻𝙻 𝙰𝙲𝚃𝙸𝚅𝙰𝚃𝙴 🥰*",
            failed: "*𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽 𝙰𝙵𝚃𝙴𝚁 𝚂𝙾𝙼𝙴 𝚃𝙸𝙼𝙴 🥺❤️*",
            done: "*🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 🐢*\n*𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴 𝙲𝙾𝙼𝙿𝙻𝙴𝚃𝙴𝙳 😇❤️*",
            error: "*𝙿𝙰𝙸𝚁 𝙲𝙾𝙳𝙴 𝙸𝚂 𝙽𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙸𝙽𝙶 𝚃𝙾 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 ☹️*",
        };

        try {
            const senderId = msg.sender || msg.key?.participant || msg.key?.remoteJid || "";
            const phoneNumber = args.length > 0 ? args.join(" ").trim() : "";

            if (!phoneNumber) {
                return socket.sendMessage(
                    msg.key?.remoteJid || senderId,
                    silaMessage(`*𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙵𝙾𝚁 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 ☺️*\n*𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇*\n\n*.𝙿𝙰𝙸𝚁 ❮+255612491554❯*\n\n*𝙸𝙽𝚂𝚃𝙴𝙰𝙳 𝙾𝙵 𝚃𝙷𝙸𝚂 𝙽𝚄𝙼𝙱𝙴𝚁 𝚆𝚁𝙸𝚃𝙴 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 𝙾𝙺 😊 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄 𝚆𝙸𝙻𝙻 𝙶𝙴𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 😃 𝚈𝙾𝚄 𝙲𝙰𝙽 𝙻𝙾𝙶𝙸𝙽 𝚆𝙸𝚃𝙷 𝚃𝙷𝙰𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 𝙸𝙽 𝚈𝙾𝚄𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 😌 𝚃𝙷𝙴𝙽 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝚆𝙸𝙻𝙻 𝙰𝙲𝚃𝙸𝚅𝙰𝚃𝙴 𝙾𝙽 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 😍*`),
                    { quoted: msg }
                );
            }

            if (!phoneNumber.match(/^\+?\d{10,15}$/)) {
                return await socket.sendMessage(
                    msg.key?.remoteJid || senderId,
                    silaMessage(messages.invalid),
                    { quoted: msg }
                );
            }

            const baseUrl = `${config.HEROKU_APP_URL}/code?number=`;
            const response = await axios.get(`${baseUrl}${encodeURIComponent(phoneNumber)}`);

            if (!response.data || !response.data.code) {
                return await socket.sendMessage(
                    msg.key?.remoteJid || senderId,
                    silaMessage(messages.failed),
                    { quoted: msg }
                );
            }

            const pairingCode = response.data.code;

            await socket.sendMessage(senderId, silaMessage(pairingCode), { quoted: msg });
            await socket.sendMessage(senderId, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("Pair command error:", error);
            await socket.sendMessage(
                msg.key?.remoteJid,
                silaMessage(messages.error),
                { quoted: msg }
            );
            await socket.sendMessage(senderId, { react: { text: "❌", key: msg.key } });
        }
    }
};

// SONG COMMAND
const song = {
    command: 'song',
    alias: ["play","mp3","audio","music","s","so","son","songs"],
    description: "Download YouTube song (Audio) via Nekolabs API",
    category: "download",
    react: "🎵",
    usage: ".song <song name>",
    execute: async (socket, msg, args) => {
        const sender = msg.key.remoteJid;
        const text = args.join(" ");

        if (!text) {
            return await socket.sendMessage(sender, silaMessage(
                "*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙽𝚈 𝙰𝚄𝙳𝙸𝙾 🥺*\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*𝙿𝙻𝙰𝚈 ❮𝚈𝙾𝚄𝚁 𝙰𝚄𝙳𝙸𝙾 𝙽𝙰𝙼𝙴❯*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝙿𝙻𝙰𝚈❯ 𝙰𝙽𝙳 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄𝚁 𝙰𝚄𝙳𝙸𝙾 𝙽𝙰𝙼𝙴 ☺️ 𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙱𝙴 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙰𝙽𝙳 𝚂𝙴𝙽𝚃 𝙷𝙴𝚁𝙴 🥰💞*"
            ), { quoted: msg });
        }

        try {
            await socket.sendMessage(sender, { react: { text: "⏳", key: msg.key } });
            
            const apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(text)}`;
            const res = await axios.get(apiUrl);
            const data = res.data;

            if (!data?.success || !data?.result?.downloadUrl) {
                return await socket.sendMessage(sender, silaMessage(
                    "*𝚈𝙾𝚄𝚁 𝙰𝚄𝙳𝙸𝙾 𝙲𝙾𝚄𝙻𝙳 𝙽𝙾𝚃 𝙱𝙴 𝙵𝙾𝚄𝙽𝙳 🥺❤️*"
                ), { quoted: msg });
            }

            const meta = data.result.metadata;
            const dlUrl = data.result.downloadUrl;

            const caption = `*🐢 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 🐢*\n*🐢 𝙽𝙰𝙼𝙴 :❯ ${meta.title}*\n*🐢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻 :❯ ${meta.channel}*\n*🐢 𝚃𝙸𝙼𝙴 :❯ ${meta.duration}*\n*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;

            await socket.sendMessage(sender, silaMessage(caption), { quoted: msg });

            await socket.sendMessage(sender, {
                audio: { url: dlUrl },
                mimetype: "audio/mpeg",
                fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
            }, { quoted: msg });

            await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("Audio download error:", err);
            await socket.sendMessage(sender, silaMessage("*😔 𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽!*"), { quoted: msg });
            await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
};

// SORA COMMAND
const sora = {
    command: "sora",
    alias: ["aivideo", "videogen", "text2video", "genvideo"],
    desc: "Generate AI videos from text prompts",
    category: "ai",
    react: "🎥",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const text = args.join(" ").trim();

            if (!text) {
                return await socket.sendMessage(from, silaMessage(
                    `*🎥 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙾𝚁 🎥*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾𝚂 𝙵𝚁𝙾𝙼 𝚃𝙴𝚇𝚃 🎬*\n*𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*🎥 𝚂𝙾𝚁𝙰 ❮𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙿𝚁𝙾𝙼𝙿𝚃❯*\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n*• .sora a cat playing piano*\n*• .sora sunset over mountains*\n*• .sora futuristic city with flying cars*\n*• .sora underwater ocean scene*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝚂𝙾𝚁𝙰❯ 𝙰𝙽𝙳 𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙿𝚁𝙾𝙼𝙿𝚃 🎥*\n*𝙰𝙸 𝚆𝙸𝙻𝙻 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴 𝙰 𝚅𝙸𝙳𝙴𝙾 𝙵𝙾𝚁 𝚈𝙾𝚄 ✨*`
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            await socket.sendMessage(from, silaMessage(
                `*🎬 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾...*\n\n*📝 𝙿𝚛𝚘𝚖𝚙𝚝: ${text}*\n*⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝, 𝚝𝚑𝚒𝚜 𝚖𝚊𝚢 𝚝𝚊𝚔𝚎 𝚊 𝚏𝚎𝚠 𝚖𝚒𝚗𝚞𝚝𝚎𝚜...*`
            ), { quoted: msg });

            const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(text)}`;
            
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer',
                timeout: 120000 
            });

            const videoBuffer = Buffer.from(response.data, 'binary');

            await socket.sendMessage(from, {
                video: videoBuffer,
                caption: `*🎥 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳 🎥*\n\n*📝 𝙿𝚛𝚘𝚖𝚙𝚝:* ${text}\n*🤖 𝙼𝚘𝚍𝚎𝚕:* SORA AI\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error('SORA Error:', error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛: ${error.message}*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚊 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚙𝚛𝚘𝚖𝚙𝚝.*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// TEXTMAKER COMMAND
const textmaker = {
    command: "textmaker",
    alias: ["text", "textgen", "styletext", "fancytext"],
    desc: "Generate stylish text images",
    category: "creator",
    react: "🎨",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const [style, ...textParts] = args;
            const text = textParts.join(" ").trim();

            if (!style || !text) {
                return await socket.sendMessage(from, silaMessage(
                    `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝚂𝚃𝚈𝙻𝙸𝚂𝙷 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴𝚂 ✨*\n\n*𝚄𝚂𝙰𝙶𝙴:* .textmaker <style> <text>\n\n*𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝚂𝚃𝚈𝙻𝙴𝚂:*\n• metallic - 3D Metal Text\n• ice - Ice Text Effect\n• snow - Snow 3D Text\n• impressive - Colorful Paint Text\n• matrix - Matrix Text Effect\n• light - Futuristic Light Text\n• neon - Colorful Neon Lights\n• devil - Neon Devil Wings\n• purple - Purple Text Effect\n• thunder - Thunder Text Effect\n• leaves - Green Brush Text\n• 1917 - 1917 Style Text\n• arena - Arena of Valor Cover\n• hacker - Anonymous Hacker\n• sand - Text on Sand\n• blackpink - Blackpink Style\n• glitch - Digital Glitch Text\n• fire - Flame Lettering\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n.textmaker metallic SILA\n.textmaker neon BOT\n.textmaker fire MD\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
                ), { quoted: msg });
            }

            const styles = {
                'metallic': '3D Metal Text',
                'ice': 'Ice Text Effect', 
                'snow': 'Snow 3D Text',
                'impressive': 'Colorful Paint Text',
                'matrix': 'Matrix Text Effect',
                'light': 'Futuristic Light Text',
                'neon': 'Colorful Neon Lights',
                'devil': 'Neon Devil Wings',
                'purple': 'Purple Text Effect',
                'thunder': 'Thunder Text Effect',
                'leaves': 'Green Brush Text',
                '1917': '1917 Style Text',
                'arena': 'Arena of Valor Cover',
                'hacker': 'Anonymous Hacker',
                'sand': 'Text on Sand',
                'blackpink': 'Blackpink Style',
                'glitch': 'Digital Glitch Text',
                'fire': 'Flame Lettering'
            };

            if (!styles[style]) {
                const availableStyles = Object.keys(styles).join(', ');
                return await socket.sendMessage(from, silaMessage(
                    `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚂𝚃𝚈𝙻𝙴*\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚜𝚝𝚢𝚕𝚎𝚜:* ${availableStyles}\n\n*𝚄𝚜𝚎: .textmaker <style> <text>*\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .textmaker metallic SILA*`
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            await socket.sendMessage(from, silaMessage(
                `*🎨 𝙲𝚁𝙴𝙰𝚃𝙸𝙽𝙶 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴...*\n\n*📝 𝚃𝚎𝚡𝚝: ${text}*\n*🎭 𝚂𝚝𝚢𝚕𝚎: ${styles[style]}*\n*⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...*`
            ), { quoted: msg });

            const apiUrl = `https://api.bk9.dev/textmaker/${style}?text=${encodeURIComponent(text)}`;
            
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000 
            });

            const imageBuffer = Buffer.from(response.data, 'binary');

            await socket.sendMessage(from, {
                image: imageBuffer,
                caption: `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*📝 𝚃𝚎𝚡𝚝:* ${text}\n*🎭 𝚂𝚝𝚢𝚕𝚎:* ${styles[style]}\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error('TextMaker Error:', error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝚃𝙴𝚇𝚃 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛: ${error.message}*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚝𝚎𝚡𝚝 𝚘𝚛 𝚜𝚝𝚢𝚕𝚎.*\n\n*✨ 𝙿𝙾𝚆𝙴𝚛𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// TTS COMMAND
const tts = {
    command: "tts",
    alias: ["say", "speak"],
    desc: "Convert text into voice (Text-To-Speech).",
    category: "fun",
    react: "🗣️",
    async execute(socket, msg, args) {
        try {
            const jid = msg.key.remoteJid;
            const q = args.join(" ");

            if (!q) {
                await socket.sendMessage(jid, silaMessage(
                    `*📢 𝙰𝚊𝚙 𝚊𝚙𝚗𝚊 𝚖𝚎𝚜𝚜𝚊𝚐𝚎 𝚕𝚒𝚔𝚑𝚘 𝚓𝚒𝚜𝚎 𝚟𝚘𝚒𝚌𝚎 𝚖𝚎 𝚋𝚊𝚍𝚊𝚕𝚗𝚊 𝚑𝚊𝚒!*\n\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎:*\n> .tts Hello World\n> .tts ur Assalamualaikum`
                ), { quoted: msg });
                return;
            }

            await socket.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

            let voiceLang = "en";
            if (args[0] === "ur" || args[0] === "urdu") voiceLang = "ur";

            const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=${voiceLang}&client=tw-ob`;
            
            const { data } = await axios.get(ttsUrl, { responseType: "arraybuffer" });
            const audioBuffer = Buffer.from(data, "binary");

            await socket.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: "audio/mpeg",
                ptt: false,
            }, { quoted: msg });

            await socket.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error("TTS Error:", err);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝚅𝚘𝚒𝚌𝚎 𝚋𝚊𝚗𝚊𝚝𝚎 𝚠𝚊𝚚𝚝 𝚎𝚛𝚛𝚘𝚛:* ${err.message}`
            ), { quoted: msg });
            await socket.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};

// VIDEO COMMAND
const video = {
    command: 'video',
    alias: ["ytmp4","mp4","ytv","vi","v","vid","vide","videos","ytvi","ytvid","ytvide","ytvideos","searchyt","download","get","need","search"],
    description: "Download YouTube MP4",
    category: "download",
    react: "🎬",
    usage: ".video <video name>",
    execute: async (socket, msg, args) => {
        const sender = msg.key.remoteJid;
        const text = args.join(" ");

        if (!text) {
            return await socket.sendMessage(sender, silaMessage(
                "*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙽𝚈 𝚅𝙸𝙳𝙴𝙾 🥺*\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇*\n\n*𝚅𝙸𝙳𝙴𝙾 ❮𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴❯*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝚅𝙸𝙳𝙴𝙾❯ 𝙰𝙽𝙳 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴 ☺️ 𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝚅𝙸𝙳𝙴𝙾 𝚆𝙸𝙻𝙻 𝙱𝙴 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙰𝙽𝙳 𝚂𝙴𝙽𝚃 𝙷𝙴𝚁𝙴 🥰💞*"
            ), { quoted: msg });
        }

        try {
            await socket.sendMessage(sender, { react: { text: "⏳", key: msg.key } });

            const search = await yts(text);
            if (!search.videos.length) return await socket.sendMessage(sender, silaMessage(
                "*𝙼𝚄𝙹𝙷𝙴 𝙰𝙿𝙺𝙸 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙷𝙸 𝙼𝙸𝙻 𝚁𝙰𝙷𝙸 𝚂𝙾𝚁𝚁𝚈 🥺❤️*"
            ), { quoted: msg });

            const data = search.videos[0];
            const ytUrl = data.url;

            const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
            const { data: apiRes } = await axios.get(api);

            if (!apiRes?.status || !apiRes.result?.media?.video_url) {
                return await socket.sendMessage(sender, silaMessage(
                    "*𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙸𝚂 𝙽𝙾𝚃 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 🥺 𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽 ☺️*"
                ), { quoted: msg });
            }

            const result = apiRes.result.media;

            const caption = `*⟪════════ ♢.✰.♢ ════════⟫*
*🐢 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴 🐢*
*${data.title}*

*🐢 𝙻𝙸𝙽𝙺 :❯ ${data.url}*
*🐢 𝚅𝙸𝙴𝚆𝚂 :❯ ${data.views}*
*🐢 𝚃𝙸𝙼𝙴 :❯ ${data.timestamp}*

*🐢 𝙸𝙼𝙿𝙾𝚁𝚃𝙰𝙽𝚃 𝚃𝙾𝙿𝙸𝙲 🐢*
*𝙵𝙸𝚁𝚂𝚃 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝙼𝚈 𝙼𝙴𝚂𝚂𝙰𝙶𝙴 𝙸𝚃'𝚂 𝙲𝙾𝙼𝙿𝚄𝙻𝚂𝙾𝚁𝚈 😫 𝙸𝙵 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚂𝙸𝙼𝙿𝙻𝙴 𝚅𝙸𝙳𝙴𝙾 𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 ❮1❯ ☺️ 𝙸𝙵 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚅𝙸𝙳𝙴𝙾 𝙸𝙽 𝙵𝙸𝙻𝙴 𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙽𝚄𝙼𝙱𝙴𝚁 ❮2❯ 😇*

*❮1❯ 𝚂𝙸𝙼𝙿𝙻𝙴 𝚅𝙸𝙳𝙴𝙾*
*❮2❯ 𝙵𝙸𝙻𝙴 𝚅𝙸𝙳𝙴𝙾*
*⟪════════ ♢.✰.♢ ════════⟫*`;

            const sentMsg = await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption: silaMessage(caption).text }, { quoted: msg });
            const messageID = sentMsg.key.id;

            socket.ev.on("messages.upsert", async (msgData) => {
                const receivedMsg = msgData.messages[0];
                if (!receivedMsg?.message) return;

                const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
                const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
                const senderID = receivedMsg.key.remoteJid;

                if (isReplyToBot) {
                    switch (receivedText.trim()) {
                        case "1":
                            await socket.sendMessage(senderID, { video: { url: result.video_url }, mimetype: "video/mp4" }, { quoted: receivedMsg });
                            break;

                        case "2":
                            await socket.sendMessage(senderID, { document: { url: result.video_url }, mimetype: "video/mp4", fileName: `${data.title}.mp4` }, { quoted: receivedMsg });
                            break;

                        default:
                            await socket.sendMessage(senderID, silaMessage("*🥺 𝚂𝚒𝚛𝚏 𝟷 𝚢𝚊 𝟸 𝚛𝚎𝚙𝚕𝚢 𝚖𝚎 𝚋𝚑𝚎𝚓𝚘!*"), { quoted: receivedMsg });
                    }
                }
            });

            await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("Video download error:", error);
            await socket.sendMessage(sender, silaMessage("*😔 𝚅𝚒𝚍𝚎𝚘 𝚍𝚘𝚠𝚗𝚕𝚘𝚊𝚍 𝚗𝚊𝚑𝚒 𝚑𝚞𝚒!*"), { quoted: msg });
            await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
};

// VV COMMAND (View Once)
const vv = {
    command: "vv",
    alias: ["antivv", "avv", "viewonce", "open", "openphoto", "openvideo", "vvphoto"],
    description: "Owner Only - retrieve quoted media (photo, video, audio)",
    category: "owner",
    react: "👁️",
    usage: ".vv (reply on media)",
    execute: async (socket, msg, args) => {
        const sender = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const isCreator = fromMe;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        try {
            await socket.sendMessage(sender, { react: { text: "👁️", key: msg.key } });

            if (!isCreator) {
                await socket.sendMessage(sender, silaMessage(
                    "*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"
                ), { quoted: msg });
                return;
            }

            if (!quoted) {
                return await socket.sendMessage(sender, silaMessage(
                    "*𝙷𝙰𝚂 𝙰𝙽𝚈𝙾𝙽𝙴 𝚂𝙴𝙽𝚃 𝚈𝙾𝚄 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺 𝙰𝙽𝙳 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝚂𝙴𝙴 𝙸𝚃 🤔*\n\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*❮𝚅𝚅❯*\n\n*𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙾𝙿𝙴𝙽 🥰*"
                ), { quoted: msg });
            }

            let type = Object.keys(quoted)[0];
            if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
                await socket.sendMessage(sender, { react: { text: "❓", key: msg.key } });
                return await socket.sendMessage(sender, silaMessage(
                    "*𝚈𝙾𝚄 𝙾𝙽𝙻𝚈 𝙽𝙴𝙴𝙳 𝚃𝙾 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝚃𝙷𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺*"
                ), { quoted: msg });
            }

            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            let sendContent = {};
            if (type === "imageMessage") {
                sendContent = {
                    image: buffer,
                    caption: quoted[type]?.caption || "",
                    mimetype: quoted[type]?.mimetype || "image/jpeg"
                };
            } else if (type === "videoMessage") {
                sendContent = {
                    video: buffer,
                    caption: quoted[type]?.caption || "",
                    mimetype: quoted[type]?.mimetype || "video/mp4"
                };
            } else if (type === "audioMessage") {
                sendContent = {
                    audio: buffer,
                    mimetype: quoted[type]?.mimetype || "audio/mp4",
                    ptt: quoted[type]?.ptt || false
                };
            }

            await socket.sendMessage(sender, sendContent, { quoted: msg });
            await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("VV Error:", error);
            await socket.sendMessage(sender, silaMessage(
                `*𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝚁𝙸𝚃𝙴 ❮𝚅𝚅❯ 𝙰𝙶𝙰𝙸𝙽 🥺*\n\n_Error:_ ${error.message}`
            ), { quoted: msg });
            await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
        }
    }
};

// FB DOWNLOAD COMMAND
const fb = {
    command: "fb",
    alias: ["facebook", "fbdl", "fbvideo"],
    desc: "Download Facebook videos",
    category: "download",
    react: "📥",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const url = args[0];

            if (!url) {
                return await socket.sendMessage(from, silaMessage(
                    "*📥 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝚃𝙾𝙾𝙻 📥*\n\n*𝚄𝚂𝙰𝙶𝙴:* .fb <facebook-video-url>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .fb https://fb.watch/xxxxx\n\n*𝚆𝙾𝚁𝙺𝚂 𝙾𝙽:* Facebook videos, reels, stories"
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.status || !data.result) {
                throw new Error("Video not found or private");
            }

            const videoUrl = data.result.hd || data.result.sd;
            const caption = data.result.title || "Facebook Video";

            await socket.sendMessage(from, {
                video: { url: videoUrl },
                caption: `*📥 𝙵𝙰𝙲𝙴𝙱𝙾𝙾𝙺 𝚅𝙸𝙳𝙴𝙾 📥*\n\n*${caption}*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`,
                mimetype: "video/mp4"
            }, { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("FB Download Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛:* ${error.message}\n*𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚑𝚎𝚌𝚔 𝚝𝚑𝚎 𝚞𝚛𝚕 𝚊𝚗𝚍 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// APK DOWNLOAD COMMAND
const apk = {
    command: "apk",
    alias: ["apkdownload", "modapk", "androidapp"],
    desc: "Download Android APK files",
    category: "download",
    react: "📱",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const text = args.join(" ");

            if (!text) {
                return await socket.sendMessage(from, silaMessage(
                    "*📱 𝙰𝙽𝙳𝚁𝙾𝙸𝙳 𝙰𝙿𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 📱*\n\n*𝚄𝚂𝙰𝙶𝙴:* .apk <app-name>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n• .apk whatsapp\n• .apk facebook\n• .apk instagram\n\n*𝙵𝙸𝙽𝙳 𝙰𝙽𝙳 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙽𝚈 𝙰𝙽𝙳𝚁𝙾𝙸𝙳 𝙰𝙿𝙿*"
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            // Search for app
            const searchUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(text)}/limit=1`;
            const searchRes = await axios.get(searchUrl);
            const apps = searchRes.data?.datasets?.all?.data?.list;

            if (!apps || apps.length === 0) {
                throw new Error("App not found");
            }

            const app = apps[0];
            const appId = app.package_name;

            // Download APK
            const downloadUrl = `https://api.bk9.dev/download/apk?id=${encodeURIComponent(appId)}`;
            const downloadRes = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            const apkBuffer = Buffer.from(downloadRes.data, 'binary');

            const caption = `*📱 𝙰𝙽𝙳𝚁𝙾𝙸𝙳 𝙰𝙿𝙺 📱*\n\n*𝙽𝙰𝙼𝙴:* ${app.name}\n*𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* ${app.file?.vername || 'Latest'}\n*𝚂𝙸𝚉𝙴:* ${(app.file?.filesize / 1024 / 1024).toFixed(2)} MB\n*𝚁𝙰𝚃𝙸𝙽𝙶:* ${app.stats?.rating?.avg || 'N/A'}/5\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;

            await socket.sendMessage(from, {
                document: apkBuffer,
                fileName: `${app.name}.apk`,
                mimetype: "application/vnd.android.package-archive",
                caption: caption
            }, { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("APK Download Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙰𝙿𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛:* ${error.message}\n*𝚃𝚛𝚢 𝚊 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚊𝚙𝚙 𝚗𝚊𝚖𝚎.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// OPENAI COMMAND
const openai = {
    command: "openai",
    alias: ["chatgpt", "gpt3", "open-gpt"],
    desc: "Chat with OpenAI",
    category: "ai",
    react: "🧠",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const q = args.join(" ");

            if (!q) {
                await socket.sendMessage(from, silaMessage(
                    "*🧠 𝙾𝙿𝙴𝙽𝙰𝙸 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 🧠*\n\n*𝚄𝚂𝙰𝙶𝙴:* .openai <your-question>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .openai Explain quantum physics in simple terms"
                ), { quoted: msg });
                return;
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.result) {
                throw new Error("No response from OpenAI");
            }

            await socket.sendMessage(from, silaMessage(
                `*🧠 𝙾𝙿𝙴𝙽𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴:*\n\n${data.result}`
            ), { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("OpenAI Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙾𝙿𝙴𝙽𝙰𝙸 𝙴𝚁𝚁𝙾𝚁*\n\n${error.message}\n\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// AI COMMAND
const ai = {
    command: "ai",
    alias: ["bot", "dj", "gpt", "gpt4", "bing"],
    desc: "Chat with an AI model",
    category: "ai",
    react: "🤖",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const q = args.join(" ");

            if (!q) {
                await socket.sendMessage(from, silaMessage(
                    "*🤖 𝙰𝙸 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 🤖*\n\n*𝚄𝚂𝙰𝙶𝙴:* .ai <your-message>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .ai Write a poem about the ocean"
                ), { quoted: msg });
                return;
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.message) {
                throw new Error("No response from AI");
            }

            await socket.sendMessage(from, silaMessage(
                `*🤖 𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴:*\n\n${data.message}`
            ), { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("AI Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙰𝙸 𝙴𝚁𝚁𝙾𝚁*\n\n${error.message}\n\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// DEEPSEEK COMMAND
const deepseek = {
    command: "deepseek",
    alias: ["deep", "seekai"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "👾",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const q = args.join(" ");

            if (!q) {
                await socket.sendMessage(from, silaMessage(
                    "*👾 𝙳𝙴𝙴𝙿𝚂𝙴𝙴𝙺 𝙰𝙸 👾*\n\n*𝚄𝚂𝙰𝙶𝙴:* .deepseek <your-question>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .deepseek Explain machine learning"
                ), { quoted: msg });
                return;
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.answer) {
                throw new Error("No response from DeepSeek");
            }

            await socket.sendMessage(from, silaMessage(
                `*👾 𝙳𝙴𝙴𝙿𝚂𝙴𝙴𝙺 𝙰𝙸 𝚁𝙴𝚂𝙿𝙾𝙽𝚂𝙴:*\n\n${data.answer}`
            ), { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("DeepSeek Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙳𝙴𝙴𝙿𝚂𝙴𝙴𝙺 𝙴𝚁𝚁𝙾𝚁*\n\n${error.message}\n\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚕𝚊𝚝𝚎𝚛.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// INSTAGRAM COMMAND
const ig = {
    command: "ig",
    alias: ["instagram", "igdl", "igvideo"],
    desc: "Download Instagram videos/photos",
    category: "download",
    react: "📸",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const url = args[0];

            if (!url) {
                return await socket.sendMessage(from, silaMessage(
                    "*📸 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 📸*\n\n*𝚄𝚂𝙰𝙶𝙴:* .ig <instagram-url>\n\n*𝚆𝙾𝚁𝙺𝚂 𝙾𝙽:* Posts, Reels, Stories, IGTV\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .ig https://www.instagram.com/p/xxxxx"
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://delirius-apiofc.vercel.app/download/igv2?url=${url}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.status || !data.result) {
                throw new Error("Content not found or private");
            }

            const mediaUrls = data.result;
            const caption = `*📸 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙲𝙾𝙽𝚃𝙴𝙽𝚃 📸*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;

            // Send all media items
            for (const media of mediaUrls) {
                if (media.type === "image") {
                    await socket.sendMessage(from, {
                        image: { url: media.url },
                        caption: caption
                    }, { quoted: msg });
                } else if (media.type === "video") {
                    await socket.sendMessage(from, {
                        video: { url: media.url },
                        caption: caption,
                        mimetype: "video/mp4"
                    }, { quoted: msg });
                }
            }

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("Instagram Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙸𝙽𝚂𝚃𝙰𝙶𝚁𝙰𝙼 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛:* ${error.message}\n*𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚑𝚎𝚌𝚔 𝚝𝚑𝚎 𝚞𝚛𝚕 𝚊𝚗𝚍 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// TIKTOK COMMAND
const tiktok = {
    command: "tiktok",
    alias: ["tt", "ttdl", "tiktokvideo"],
    desc: "Download TikTok videos",
    category: "download",
    react: "🎵",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const url = args[0];

            if (!url) {
                return await socket.sendMessage(from, silaMessage(
                    "*🎵 𝚃𝙸𝙺𝚃𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 🎵*\n\n*𝚄𝚂𝙰𝙶𝙴:* .tiktok <tiktok-url>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .tiktok https://www.tiktok.com/@user/video/123456\n\n*𝚆𝙾𝚁𝙺𝚂 𝙾𝙽:* All public TikTok videos"
                ), { quoted: msg });
            }

            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${url}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data.status || !data.result) {
                throw new Error("Video not found or private");
            }

            const videoUrl = data.result.video || data.result.nowm;
            const caption = `*🎵 𝚃𝙸𝙺𝚃𝙾𝙺 𝚅𝙸𝙳𝙴𝙾 🎵*\n\n*𝙰𝚄𝚃𝙷𝙾𝚁:* ${data.result.author || 'Unknown'}\n*𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽:* ${data.result.description || 'No description'}\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;

            await socket.sendMessage(from, {
                video: { url: videoUrl },
                caption: caption,
                mimetype: "video/mp4"
            }, { quoted: msg });

            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error("TikTok Error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝚃𝙸𝙺𝚃𝙾𝙺 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛:* ${error.message}\n*𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚑𝚎𝚌𝚔 𝚝𝚑𝚎 𝚞𝚛𝚕 𝚊𝚗𝚍 𝚝𝚛𝚢 𝚊𝚐𝚊𝚒𝚗.*`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// ALIVE COMMAND
const alive = {
    command: "alive",
    alias: ["ping", "bot", "status"],
    desc: "Check if bot is alive",
    category: "general",
    react: "💚",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const uptime = process.uptime();
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const aliveMsg = `*🤖 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 🤖*\n\n` +
                       `*🟢 𝚂𝚃𝙰𝚃𝚄𝚂:* 𝙰𝙻𝙸𝚅𝙴 & 𝚁𝚄𝙽𝙽𝙸𝙽𝙶\n` +
                       `*⏰ 𝚄𝙿𝚃𝙸𝙼𝙴:* ${hours}h ${minutes}m ${seconds}s\n` +
                       `*👑 𝙾𝚆𝙽𝙴𝚁:* +${config.OWNER_NUMBER}\n` +
                       `*🔗 𝙻𝙸𝙽𝙺:* ${config.HEROKU_APP_URL}\n` +
                       `*📢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻:* ${config.NEWS_CHANNEL}\n\n` +
                       `*✨ 𝚃𝚈𝙿𝙴 .𝚕𝚒𝚜𝚝 𝚏𝚘𝚛 𝚊𝚕𝚕 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜*`;
        
        await socket.sendMessage(from, silaMessage(aliveMsg), { quoted: msg });
        await socket.sendMessage(from, { react: { text: "💚", key: msg.key } });
    }
};

// LIST COMMAND
const list = {
    command: "list",
    alias: ["menu", "help", "commands"],
    desc: "Show all available commands",
    category: "general",
    react: "📋",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        
        // Group commands by category
        const categories = {};
        const allCmds = {
            imagine, pair, song, sora, textmaker, tts, video, vv, 
            fb, apk, openai, ai, deepseek, ig, tiktok, alive, list,
            owner, broadcast, sticker, joke, url, settings, update,
            uptime, restart, bot, repo, mute, unmute, delete: del, 
            kick, tag, tagall, hidetag, kickall, getpic, link, join, 
            add, ginfo, senddm, listonline, poll, chatbot, setgpp, 
            setgname, setgdesc, antitag, warn, clear, antilink, 
            antimantion, ban
        };
        
        for (const cmdName in allCmds) {
            const cmd = allCmds[cmdName];
            if (cmd && cmd.category) {
                if (!categories[cmd.category]) {
                    categories[cmd.category] = [];
                }
                categories[cmd.category].push(`• .${cmd.command} - ${cmd.desc || cmd.description}`);
            }
        }
        
        let listMsg = `*📋 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 𝙻𝙸𝚂𝚃 📋*\n\n`;
        
        for (const [category, cmdList] of Object.entries(categories)) {
            listMsg += `*${category.toUpperCase()}*\n`;
            listMsg += cmdList.join('\n') + '\n\n';
        }
        
        listMsg += `*📌 𝚃𝙾𝚃𝙰𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:* ${Object.keys(allCmds).length}\n`;
        listMsg += `*👑 𝙾𝚆𝙽𝙴𝚁:* +${config.OWNER_NUMBER}\n`;
        listMsg += `*🔗 𝙱𝙾𝚃 𝙻𝙸𝙽𝙺:* ${config.HEROKU_APP_URL}\n`;
        listMsg += `*📢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻:* ${config.NEWS_CHANNEL}\n\n`;
        listMsg += `*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
        
        await socket.sendMessage(from, silaMessage(listMsg), { quoted: msg });
        await socket.sendMessage(from, { react: { text: "📋", key: msg.key } });
    }
};

// OWNER COMMAND
const owner = {
    command: "owner",
    alias: ["dev", "creator"],
    desc: "Contact bot owner",
    category: "general",
    react: "👑",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const ownerMsg = `*👑 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙾𝚆𝙽𝙴𝚁 👑*\n\n` +
                       `*📱 𝙽𝚄𝙼𝙱𝙴𝚁:* +${config.OWNER_NUMBER}\n` +
                       `*📧 𝙲𝙾𝙽𝚃𝙰𝙲𝚃:* Direct WhatsApp\n` +
                       `*🔗 𝙻𝙸𝙽𝙺:* ${config.HEROKU_APP_URL}\n\n` +
                       `*📢 𝙵𝙾𝚁 𝙱𝚄𝚂𝙸𝙽𝙴𝚂𝚂 𝙸𝙽𝚀𝚄𝙸𝚁𝙸𝙴𝚂:*\n` +
                       `• 𝙱𝚘𝚝 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚖𝚎𝚗𝚝\n` +
                       `• 𝙰𝙿𝙸 𝚂𝚎𝚛𝚟𝚒𝚌𝚎𝚜\n` +
                       `• 𝚆𝚎𝚋𝚜𝚒𝚝𝚎 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚖𝚎𝚗𝚝\n\n` +
                       `*✨ 𝚃𝙷𝙰𝙽𝙺𝚂 𝙵𝙾𝚁 𝚄𝚂𝙸𝙽𝙶 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
        
        await socket.sendMessage(from, silaMessage(ownerMsg), { quoted: msg });
        await socket.sendMessage(from, { react: { text: "👑", key: msg.key } });
    }
};

// BROADCAST COMMAND (Owner only)
const broadcast = {
    command: "broadcast",
    alias: ["bc"],
    desc: "Broadcast message to all chats (Owner only)",
    category: "owner",
    react: "📢",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        const message = args.join(" ");
        if (!message) {
            await socket.sendMessage(from, silaMessage("*📢 𝚄𝚂𝙰𝙶𝙴:* .broadcast <message>"), { quoted: msg });
            return;
        }
        
        await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        
        // This would need access to all chat IDs - implement as needed
        await socket.sendMessage(from, silaMessage(
            `*📢 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 𝚂𝙴𝙽𝚃*\n\n*𝙼𝚎𝚜𝚜𝚊𝚐𝚎:* ${message}\n\n*𝚃𝙾:* All registered chats`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
    }
};

// STICKER COMMAND
const sticker = {
    command: "sticker",
    alias: ["s", "stiker", "stick"],
    desc: "Create sticker from image/video",
    category: "creator",
    react: "🖼️",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted || (!quoted.imageMessage && !quoted.videoMessage)) {
            await socket.sendMessage(from, silaMessage(
                "*🖼️ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁 𝙼𝙰𝙺𝙴𝚁 🖼️*\n\n*𝚄𝚂𝙰𝙶𝙴:* .sticker (reply to image/video)\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* Reply .sticker to any image or video"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const type = quoted.imageMessage ? "image" : "video";
            const stream = await downloadContentFromMessage(quoted[type + "Message"], type);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            await socket.sendMessage(from, { 
                sticker: buffer 
            }, { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            console.error("Sticker error:", error);
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙲𝚁𝙴𝙰𝚃𝙴 𝚂𝚃𝙸𝙲𝙺𝙴𝚁*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// JOKE COMMAND
const joke = {
    command: "joke",
    alias: ["jokes", "funny"],
    desc: "Get random jokes",
    category: "fun",
    react: "😄",
    execute: async (socket, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything!",
                "Why did the scarecrow win an award? He was outstanding in his field!",
                "What do you call a fake noodle? An impasta!",
                "Why did the math book look so sad? Because it had too many problems!",
                "What do you call a bear with no teeth? A gummy bear!",
                "Why don't eggs tell jokes? They'd crack each other up!",
                "What do you call a sleeping bull? A bulldozer!",
                "Why did the bicycle fall over? Because it was two-tired!",
                "What do you call a fish wearing a bowtie? Sofishticated!",
                "Why don't skeletons fight each other? They don't have the guts!"
            ];
            
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            
            await socket.sendMessage(from, silaMessage(
                `*😄 𝙹𝙾𝙺𝙴 𝚃𝙸𝙼𝙴 😄*\n\n${randomJoke}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "😄", key: msg.key } });
        } catch (error) {
            console.error("Joke error:", error);
            await socket.sendMessage(msg.key.remoteJid, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙶𝙴𝚃 𝙹𝙾𝙺𝙴*"), { quoted: msg });
        }
    }
};

// URL COMMAND
const url = {
    command: "url",
    alias: ["shorturl", "shorten"],
    desc: "Shorten URL",
    category: "tools",
    react: "🔗",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const url = args[0];
        
        if (!url) {
            await socket.sendMessage(from, silaMessage(
                "*🔗 𝚄𝚁𝙻 𝚂𝙷𝙾𝚁𝚃𝙴𝙽𝙴𝚁 🔗*\n\n*𝚄𝚂𝙰𝙶𝙴:* .url <long-url>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .url https://example.com/very-long-url"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const apiUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`;
            const response = await axios.get(apiUrl);
            const shortUrl = response.data;
            
            await socket.sendMessage(from, silaMessage(
                `*🔗 𝚄𝚁𝙻 𝚂𝙷𝙾𝚁𝚃𝙴𝙽𝙴𝙳 🔗*\n\n*𝙾𝚛𝚒𝚐𝚒𝚗𝚊𝚕:* ${url}\n*𝚂𝚑𝚘𝚛𝚝:* ${shortUrl}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            console.error("URL shorten error:", error);
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙷𝙾𝚁𝚃𝙴𝙽 𝚄𝚁𝙻*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// SETTINGS COMMAND
const settings = {
    command: "settings",
    alias: ["config", "set"],
    desc: "Configure bot settings",
    category: "owner",
    react: "⚙️",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        const [action, key, value] = args;
        
        if (!action) {
            let settingsMsg = `*⚙️ 𝙱𝙾𝚃 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂 ⚙️*\n\n`;
            
            for (const [k, v] of Object.entries(botState.settings)) {
                settingsMsg += `*${k}:* ${v}\n`;
            }
            
            settingsMsg += `\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n.settings set autoread true\n.settings set autosticker on`;
            
            await socket.sendMessage(from, silaMessage(settingsMsg), { quoted: msg });
            return;
        }
        
        if (action === "set" && key && value !== undefined) {
            if (key in botState.settings) {
                // Convert string to appropriate type
                let finalValue = value;
                if (value === 'true') finalValue = true;
                if (value === 'false') finalValue = false;
                if (value === 'on') finalValue = "on";
                if (value === 'off') finalValue = "off";
                
                botState.settings[key] = finalValue;
                await socket.sendMessage(from, silaMessage(
                    `*✅ 𝚂𝙴𝚃𝚃𝙸𝙽𝙶 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*\n\n*${key}:* ${finalValue}`
                ), { quoted: msg });
            } else {
                await socket.sendMessage(from, silaMessage(`*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚂𝙴𝚃𝚃𝙸𝙽𝙶: ${key}*`), { quoted: msg });
            }
        } else {
            await socket.sendMessage(from, silaMessage("*⚙️ 𝚄𝚂𝙰𝙶𝙴:* .settings set <key> <value>"), { quoted: msg });
        }
        
        await socket.sendMessage(from, { react: { text: "⚙️", key: msg.key } });
    }
};

// UPDATE COMMAND
const update = {
    command: "update",
    alias: ["upgrade", "gitpull"],
    desc: "Update bot from GitHub",
    category: "owner",
    react: "🔄",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            await socket.sendMessage(from, silaMessage("*🔄 𝚄𝙿𝙳𝙰𝚃𝙸𝙽𝙶 𝙱𝙾𝚃 𝙵𝚁𝙾𝙼 𝙶𝙸𝚃𝙷𝚄𝙱...*"), { quoted: msg });
            
            const { stdout, stderr } = await execAsync('git pull');
            
            if (stderr && !stderr.includes('Already up to date')) {
                throw new Error(stderr);
            }
            
            await socket.sendMessage(from, silaMessage(
                `*✅ 𝚄𝙿𝙳𝙰𝚃𝙴 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻*\n\n${stdout || "Already up to date"}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            console.error("Update error:", error);
            await socket.sendMessage(from, silaMessage(
                `*❌ 𝚄𝙿𝙳𝙰𝚃𝙴 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n${error.message}`
            ), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// UPTIME COMMAND
const uptime = {
    command: "uptime",
    alias: ["runtime", "up"],
    desc: "Check bot uptime",
    category: "general",
    react: "⏱️",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const uptimeMsg = `*⏱️ 𝙱𝙾𝚃 𝚄𝙿𝚃𝙸𝙼𝙴 ⏱️*\n\n` +
                         `*📅 𝙳𝚊𝚢𝚜:* ${days}\n` +
                         `*⏰ 𝙷𝚘𝚞𝚛𝚜:* ${hours}\n` +
                         `*🕒 𝙼𝚒𝚗𝚞𝚝𝚎𝚜:* ${minutes}\n` +
                         `*⏲️ 𝚂𝚎𝚌𝚘𝚗𝚍𝚜:* ${seconds}\n\n` +
                         `*✨ 𝚂𝚃𝙰𝚁𝚃𝙴𝙳:* ${new Date(Date.now() - (uptime * 1000)).toLocaleString()}`;
        
        await socket.sendMessage(from, silaMessage(uptimeMsg), { quoted: msg });
        await socket.sendMessage(from, { react: { text: "⏱️", key: msg.key } });
    }
};

// RESTART COMMAND
const restart = {
    command: "restart",
    alias: ["reboot", "refresh"],
    desc: "Restart the bot",
    category: "owner",
    react: "🔄",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            await socket.sendMessage(from, silaMessage("*🔄 𝚁𝙴𝚂𝚃𝙰𝚁𝚃𝙸𝙽𝙶 𝙱𝙾𝚃...*"), { quoted: msg });
            
            setTimeout(() => {
                process.exit(0);
            }, 2000);
            
        } catch (error) {
            console.error("Restart error:", error);
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚁𝙴𝚂𝚃𝙰𝚁𝚃*"), { quoted: msg });
        }
    }
};

// BOT COMMAND (on/off)
const bot = {
    command: "bot",
    alias: ["botstatus"],
    desc: "Turn bot on/off",
    category: "owner",
    react: "🤖",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        const action = args[0]?.toLowerCase();
        
        if (!action || !["on", "off"].includes(action)) {
            await socket.sendMessage(from, silaMessage(
                "*🤖 𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂 🤖*\n\n*𝚄𝚂𝙰𝙶𝙴:* .bot on/off\n\n*𝙲𝚄𝚁𝚁𝙴𝙽𝚃 𝚂𝚃𝙰𝚃𝚄𝚂:* " + (botState.settings.online === 'on' ? 'ONLINE' : 'OFFLINE')
            ), { quoted: msg });
            return;
        }
        
        botState.settings.online = action;
        
        await socket.sendMessage(from, silaMessage(
            `*✅ 𝙱𝙾𝚃 ${action.toUpperCase()}*\n\n*𝙱𝚘𝚝 𝚒𝚜 𝚗𝚘𝚠 ${action === 'on' ? 'ONLINE' : 'OFFLINE'}*`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: action === 'on' ? "✅" : "❌", key: msg.key } });
    }
};

// REPO COMMAND
const repo = {
    command: "repo",
    alias: ["source", "github"],
    desc: "Get bot source code",
    category: "general",
    react: "📂",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        
        const repoMsg = `*📂 𝚂𝙸𝙻𝙰 𝙼𝙳 𝚁𝙴𝙿𝙾𝚂𝙸𝚃𝙾𝚁𝚈 📂*\n\n` +
                       `*🔗 𝙶𝙸𝚃𝙷𝚄𝙱:* https://github.com/sila-tech/sila-md\n` +
                       `*👑 𝙾𝚆𝙽𝙴𝚁:* Sila Tech\n` +
                       `*🌟 𝚂𝚃𝙰𝚁𝚂:* ⭐⭐⭐⭐⭐\n\n` +
                       `*📄 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽:*\n` +
                       `SILA MD - Advanced WhatsApp Bot with AI features, download tools, and much more!\n\n` +
                       `*✨ 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂:*\n` +
                       `• AI Image Generation\n` +
                       `• Video/MP3 Download\n` +
                       `• Facebook/Instagram/TikTok Download\n` +
                       `• ChatGPT & DeepSeek AI\n` +
                       `• Sticker Maker\n` +
                       `• Group Management\n` +
                       `• And many more...\n\n` +
                       `*🚀 𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝚃𝙴𝙲𝙷*`;
        
        await socket.sendMessage(from, silaMessage(repoMsg), { quoted: msg });
        await socket.sendMessage(from, { react: { text: "📂", key: msg.key } });
    }
};

// ==================== GROUP COMMANDS ====================

// MUTE COMMAND
const mute = {
    command: "mute",
    alias: ["silence"],
    desc: "Mute the group",
    category: "group",
    react: "🔇",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            await socket.groupSettingUpdate(from, 'announcement');
            await socket.sendMessage(from, silaMessage("*🔇 𝙶𝚁𝙾𝚄𝙿 𝙷𝙰𝚂 𝙱𝙴𝙴𝙽 𝙼𝚄𝚃𝙴𝙳*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "🔇", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙼𝚄𝚃𝙴 𝙶𝚁𝙾𝚄𝙿*"), { quoted: msg });
        }
    }
};

// UNMUTE COMMAND
const unmute = {
    command: "unmute",
    alias: ["unsilence"],
    desc: "Unmute the group",
    category: "group",
    react: "🔊",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            await socket.groupSettingUpdate(from, 'not_announcement');
            await socket.sendMessage(from, silaMessage("*🔊 𝙶𝚁𝙾𝚄𝙿 𝙷𝙰𝚂 𝙱𝙴𝙴𝙽 𝚄𝙽𝙼𝚄𝚃𝙴𝙳*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "🔊", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚄𝙽𝙼𝚄𝚃𝙴 𝙶𝚁𝙾𝚄𝙿*"), { quoted: msg });
        }
    }
};

// DELETE COMMAND
const del = {
    command: "delete",
    alias: ["del"],
    desc: "Delete bot's message",
    category: "group",
    react: "🗑️",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted) {
            await socket.sendMessage(from, silaMessage("*🗑️ 𝚄𝚂𝙰𝙶𝙴:* .delete (reply to bot's message)"), { quoted: msg });
            return;
        }
        
        try {
            const quotedKey = {
                remoteJid: from,
                id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                participant: msg.message.extendedTextMessage.contextInfo.participant
            };
            
            await socket.sendMessage(from, { delete: quotedKey });
            await socket.sendMessage(from, { react: { text: "🗑️", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙳𝙴𝙻𝙴𝚃𝙴*"), { quoted: msg });
        }
    }
};

// KICK COMMAND
const kick = {
    command: "kick",
    alias: ["remove"],
    desc: "Remove a member from group",
    category: "group",
    react: "👢",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        
        if (mentioned.length === 0) {
            await socket.sendMessage(from, silaMessage("*👢 𝚄𝚂𝙰𝙶𝙴:* .kick @mention"), { quoted: msg });
            return;
        }
        
        try {
            await socket.groupParticipantsUpdate(from, mentioned, 'remove');
            await socket.sendMessage(from, silaMessage(`*👢 𝚁𝙴𝙼𝙾𝚅𝙴𝙳:* ${mentioned.map(jid => `@${jid.split('@')[0]}`).join(', ')}`), { 
                mentions: mentioned 
            }, { quoted: msg });
            await socket.sendMessage(from, { react: { text: "👢", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚁𝙴𝙼𝙾𝚅𝙴*"), { quoted: msg });
        }
    }
};

// TAG COMMAND
const tag = {
    command: "tag",
    alias: ["mention"],
    desc: "Tag specific members",
    category: "group",
    react: "🏷️",
    groupOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const text = args.join(" ") || "📢";
        
        if (mentioned.length === 0) {
            await socket.sendMessage(from, silaMessage("*🏷️ 𝚄𝚂𝙰𝙶𝙴:* .tag @mention [message]"), { quoted: msg });
            return;
        }
        
        await socket.sendMessage(from, {
            text: `${text}\n\n${mentioned.map(jid => `@${jid.split('@')[0]}`).join(' ')}`,
            mentions: mentioned
        }, { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🏷️", key: msg.key } });
    }
};

// TAGALL COMMAND
const tagall = {
    command: "tagall",
    alias: ["mentionall", "everyone"],
    desc: "Tag all group members",
    category: "group",
    react: "🏷️",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            const metadata = await socket.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const text = args.join(" ") || "📢 𝙰𝚃𝚃𝙴𝙽𝚃𝙸𝙾𝙽 𝙰𝙻𝙻!";
            
            await socket.sendMessage(from, {
                text: `${text}\n\n${participants.map(jid => `@${jid.split('@')[0]}`).join('\n')}`,
                mentions: participants
            }, { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "🏷️", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚃𝙰𝙶 𝙰𝙻𝙻*"), { quoted: msg });
        }
    }
};

// HIDETAG COMMAND
const hidetag = {
    command: "hidetag",
    alias: ["htag", "hidemention"],
    desc: "Tag all members without showing tags",
    category: "group",
    react: "👁️",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            const metadata = await socket.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const text = args.join(" ") || "📢";
            
            // Send with mentions but text doesn't show tags
            await socket.sendMessage(from, {
                text: text,
                mentions: participants
            }, { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "👁️", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙷𝙸𝙳𝙴𝚃𝙰𝙶*"), { quoted: msg });
        }
    }
};

// KICKALL COMMAND
const kickall = {
    command: "kickall",
    alias: ["removeall"],
    desc: "Remove all members from group",
    category: "group",
    react: "👢👢",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        try {
            const metadata = await socket.groupMetadata(from);
            const participants = metadata.participants
                .filter(p => !p.admin)
                .map(p => p.id);
            
            if (participants.length === 0) {
                await socket.sendMessage(from, silaMessage("*ℹ️ 𝙽𝙾 𝙽𝙾𝙽-𝙰𝙳𝙼𝙸𝙽 𝙼𝙴𝙼𝙱𝙴𝚁𝚂 𝚃𝙾 𝚁𝙴𝙼𝙾𝚅𝙴*"), { quoted: msg });
                return;
            }
            
            // Remove in batches to avoid rate limiting
            for (let i = 0; i < participants.length; i += 10) {
                const batch = participants.slice(i, i + 10);
                await socket.groupParticipantsUpdate(from, batch, 'remove');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await socket.sendMessage(from, silaMessage(
                `*👢 𝚁𝙴𝙼𝙾𝚅𝙴𝙳 𝙰𝙻𝙻 ${participants.length} 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "👢", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚁𝙴𝙼𝙾𝚅𝙴 𝙰𝙻𝙻*"), { quoted: msg });
        }
    }
};

// GETPIC COMMAND
const getpic = {
    command: "getpic",
    alias: ["profilepic", "pp"],
    desc: "Get user profile picture",
    category: "group",
    react: "🖼️",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned[0] || msg.key.participant || msg.key.remoteJid;
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const profilePic = await socket.profilePictureUrl(target, 'image');
            
            if (profilePic) {
                await socket.sendMessage(from, {
                    image: { url: profilePic },
                    caption: `*🖼️ 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*\n\n*𝚄𝚜𝚎𝚛:* @${target.split('@')[0]}`,
                    mentions: [target]
                }, { quoted: msg });
            } else {
                await socket.sendMessage(from, silaMessage(
                    `*❌ 𝙽𝙾 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴 𝙵𝙾𝚄𝙽𝙳*\n\n*𝚄𝚜𝚎𝚛:* @${target.split('@')[0]}`
                ), { quoted: msg, mentions: [target] });
            }
            
            await socket.sendMessage(from, { react: { text: "🖼️", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙶𝙴𝚃 𝙿𝚁𝙾𝙵𝙸𝙻𝙴 𝙿𝙸𝙲𝚃𝚄𝚁𝙴*"), { quoted: msg });
        }
    }
};

// LINK COMMAND
const link = {
    command: "link",
    alias: ["gclink", "groupinvite"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            const code = await socket.groupInviteCode(from);
            const link = `https://chat.whatsapp.com/${code}`;
            
            await socket.sendMessage(from, silaMessage(
                `*🔗 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝚅𝙸𝚃𝙴 𝙻𝙸𝙽𝙺 🔗*\n\n${link}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "🔗", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙶𝙴𝚃 𝙻𝙸𝙽𝙺*"), { quoted: msg });
        }
    }
};

// JOIN COMMAND
const join = {
    command: "join",
    alias: ["joingroup"],
    desc: "Join group via invite link",
    category: "group",
    react: "➕",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const link = args[0];
        
        if (!link) {
            await socket.sendMessage(from, silaMessage(
                "*➕ 𝚄𝚂𝙰𝙶𝙴:* .join <whatsapp-group-link>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .join https://chat.whatsapp.com/abc123"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const code = link.split('/').pop();
            await socket.groupAcceptInvite(code);
            
            await socket.sendMessage(from, silaMessage(
                "*✅ 𝙹𝙾𝙸𝙽𝙴𝙳 𝙶𝚁𝙾𝚄𝙿 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈!*"
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙹𝙾𝙸𝙽 𝙶𝚁𝙾𝚄𝙿*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    }
};

// ADD COMMAND
const add = {
    command: "add",
    alias: ["adduser"],
    desc: "Add user to group",
    category: "group",
    react: "👥",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const numbers = args.map(num => num.includes('@') ? num : num + '@s.whatsapp.net');
        
        if (numbers.length === 0) {
            await socket.sendMessage(from, silaMessage(
                "*👥 𝚄𝚂𝙰𝙶𝙴:* .add <phone-number>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .add 255612491554"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.groupParticipantsUpdate(from, numbers, 'add');
            await socket.sendMessage(from, silaMessage(
                `*✅ 𝙰𝙳𝙳𝙴𝙳:* ${numbers.map(num => `@${num.split('@')[0]}`).join(', ')}`
            ), { mentions: numbers }, { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙰𝙳𝙳 𝚄𝚂𝙴𝚁𝚂*"), { quoted: msg });
        }
    }
};

// GINFO COMMAND
const ginfo = {
    command: "ginfo",
    alias: ["groupinfo", "info"],
    desc: "Get group information",
    category: "group",
    react: "ℹ️",
    groupOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        try {
            const metadata = await socket.groupMetadata(from);
            const admins = metadata.participants.filter(p => p.admin).map(p => p.id);
            
            const infoMsg = `*ℹ️ 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾𝚁𝙼𝙰𝚃𝙸𝙾𝙽 ℹ️*\n\n` +
                           `*📛 𝙽𝙰𝙼𝙴:* ${metadata.subject}\n` +
                           `*👥 𝙼𝙴𝙼𝙱𝙴𝚁𝚂:* ${metadata.participants.length}\n` +
                           `*👑 𝙰𝙳𝙼𝙸𝙽𝚂:* ${admins.length}\n` +
                           `*📅 𝙲𝚁𝙴𝙰𝚃𝙴𝙳:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n` +
                           `*🔗 𝙸𝙳:* ${metadata.id}\n\n` +
                           `*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
            
            await socket.sendMessage(from, silaMessage(infoMsg), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "ℹ️", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙶𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙸𝙽𝙵𝙾*"), { quoted: msg });
        }
    }
};

// SENDDM COMMAND
const senddm = {
    command: "senddm",
    alias: ["dm", "direct"],
    desc: "Send direct message to user",
    category: "owner",
    react: "📩",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        const [number, ...messageParts] = args;
        const message = messageParts.join(" ");
        
        if (!number || !message) {
            await socket.sendMessage(from, silaMessage(
                "*📩 𝚄𝚂𝙰𝙶𝙴:* .senddm <phone-number> <message>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .senddm 255612491554 Hello there!"
            ), { quoted: msg });
            return;
        }
        
        try {
            const target = number.includes('@') ? number : number + '@s.whatsapp.net';
            await socket.sendMessage(target, silaMessage(message));
            
            await socket.sendMessage(from, silaMessage(
                `*✅ 𝙳𝙼 𝚂𝙴𝙽𝚃*\n\n*𝚃𝚘:* ${number}\n*𝙼𝚎𝚜𝚜𝚊𝚐𝚎:* ${message}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage(
                `*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙴𝙽𝙳 𝙳𝙼*\n\n${error.message}`
            ), { quoted: msg });
        }
    }
};

// LISTONLINE COMMAND
const listonline = {
    command: "listonline",
    alias: ["online", "whosonline"],
    desc: "List online members in group",
    category: "group",
    react: "🟢",
    groupOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        
        await socket.sendMessage(from, silaMessage(
            "*🟢 𝙾𝙽𝙻𝙸𝙽𝙴 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*\n\n*𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗...*"
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🟢", key: msg.key } });
    }
};

// POLL COMMAND
const poll = {
    command: "poll",
    alias: ["vote", "survey"],
    desc: "Create a poll in group",
    category: "group",
    react: "📊",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const [question, ...options] = args.join(" ").split("|");
        
        if (!question || options.length < 2) {
            await socket.sendMessage(from, silaMessage(
                "*📊 𝙿𝙾𝙻𝙻 𝙲𝚁𝙴𝙰𝚃𝙾𝚁 📊*\n\n*𝚄𝚂𝙰𝙶𝙴:* .poll <question> | <option1> | <option2> | ...\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .poll Best color? | Red | Blue | Green"
            ), { quoted: msg });
            return;
        }
        
        try {
            const pollMsg = {
                name: question.trim(),
                values: options.map(opt => opt.trim()),
                selectableCount: 1
            };
            
            await socket.sendMessage(from, { poll: pollMsg }, { quoted: msg });
            await socket.sendMessage(from, { react: { text: "📊", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙲𝚁𝙴𝙰𝚃𝙴 𝙿𝙾𝙻𝙻*"), { quoted: msg });
        }
    }
};

// CHATBOT COMMAND
const chatbot = {
    command: "chatbot",
    alias: ["autoreply", "automsg"],
    desc: "Enable/disable chatbot in group",
    category: "group",
    react: "🤖",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();
        
        if (!action || !["on", "off"].includes(action)) {
            await socket.sendMessage(from, silaMessage(
                "*🤖 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 𝚂𝚃𝙰𝚃𝚄𝚂*\n\n*𝚄𝚂𝙰𝙶𝙴:* .chatbot on/off\n\n*𝙲𝚄𝚁𝚁𝙴𝙽𝚃:* " + (botState.settings.autoai === 'on' ? 'ON' : 'OFF')
            ), { quoted: msg });
            return;
        }
        
        botState.settings.autoai = action;
        
        await socket.sendMessage(from, silaMessage(
            `*✅ 𝙲𝙷𝙰𝚃𝙱𝙾𝚃 ${action.toUpperCase()}*\n\n*𝙲𝚑𝚊𝚝𝚋𝚘𝚝 𝚒𝚜 𝚗𝚘𝚠 ${action === 'on' ? 'ENABLED' : 'DISABLED'} 𝚒𝚗 𝚝𝚑𝚒𝚜 𝚐𝚛𝚘𝚞𝚙*`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: action === 'on' ? "✅" : "❌", key: msg.key } });
    }
};

// SETGPP COMMAND
const setgpp = {
    command: "setgpp",
    alias: ["setgrouppic", "setgrouppp"],
    desc: "Set group profile picture",
    category: "group",
    react: "🖼️",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quoted?.imageMessage) {
            await socket.sendMessage(from, silaMessage(
                "*🖼️ 𝚄𝚂𝙰𝙶𝙴:* .setgpp (reply to image)"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
            
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            
            await socket.updateProfilePicture(from, buffer);
            await socket.sendMessage(from, silaMessage("*✅ 𝙶𝚁𝙾𝚄𝙿 𝙿𝙿 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*"), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙿𝙿*"), { quoted: msg });
        }
    }
};

// SETGNAME COMMAND
const setgname = {
    command: "setgname",
    alias: ["setgroupname"],
    desc: "Set group name",
    category: "group",
    react: "📛",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const name = args.join(" ");
        
        if (!name) {
            await socket.sendMessage(from, silaMessage(
                "*📛 𝚄𝚂𝙰𝙶𝙴:* .setgname <new-group-name>"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.groupUpdateSubject(from, name);
            await socket.sendMessage(from, silaMessage(
                `*✅ 𝙶𝚁𝙾𝚄𝙿 𝙽𝙰𝙼𝙴 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*\n\n*𝙽𝚎𝚠 𝙽𝚊𝚖𝚎:* ${name}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙽𝙰𝙼𝙴*"), { quoted: msg });
        }
    }
};

// SETGDESC COMMAND
const setgdesc = {
    command: "setgdesc",
    alias: ["setgroupdesc"],
    desc: "Set group description",
    category: "group",
    react: "📝",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const desc = args.join(" ");
        
        if (!desc) {
            await socket.sendMessage(from, silaMessage(
                "*📝 𝚄𝚂𝙰𝙶𝙴:* .setgdesc <new-group-description>"
            ), { quoted: msg });
            return;
        }
        
        try {
            await socket.groupUpdateDescription(from, desc);
            await socket.sendMessage(from, silaMessage(
                `*✅ 𝙶𝚁𝙾𝚄𝙿 𝙳𝙴𝚂𝙲𝚁𝙸𝙿𝚃𝙸𝙾𝙽 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*\n\n*𝙽𝚎𝚠 𝙳𝚎𝚜𝚌:* ${desc}`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        } catch (error) {
            await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙴𝚃 𝙶𝚁𝙾𝚄𝙿 𝙳𝙴𝚂𝙲*"), { quoted: msg });
        }
    }
};

// ANTITAG COMMAND
const antitag = {
    command: "antitag",
    alias: ["antimention"],
    desc: "Enable/disable anti tag protection",
    category: "group",
    react: "🚫",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();
        
        await socket.sendMessage(from, silaMessage(
            `*🚫 𝙰𝙽𝚃𝙸𝚃𝙰𝙶 ${action === 'on' ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳'}*\n\n*𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗...*`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🚫", key: msg.key } });
    }
};

// WARN COMMAND
const warn = {
    command: "warn",
    alias: ["warning"],
    desc: "Warn a group member",
    category: "group",
    react: "⚠️",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const reason = args.slice(mentioned.length).join(" ") || "No reason provided";
        
        if (mentioned.length === 0) {
            await socket.sendMessage(from, silaMessage(
                "*⚠️ 𝚄𝚂𝙰𝙶𝙴:* .warn @mention [reason]"
            ), { quoted: msg });
            return;
        }
        
        const warnMsg = `*⚠️ 𝚆𝙰𝚁𝙽𝙸𝙽𝙶 ⚠️*\n\n` +
                       `*𝚄𝚜𝚎𝚛:* @${mentioned[0].split('@')[0]}\n` +
                       `*𝚁𝚎𝚊𝚜𝚘𝚗:* ${reason}\n` +
                       `*𝙱𝚢:* @${(msg.key.participant || msg.key.remoteJid).split('@')[0]}\n\n` +
                       `*𝚃𝚑𝚒𝚜 𝚒𝚜 𝚢𝚘𝚞𝚛 𝚠𝚊𝚛𝚗𝚒𝚗𝚐. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚏𝚘𝚕𝚕𝚘𝚠 𝚐𝚛𝚘𝚞𝚙 𝚛𝚞𝚕𝚎𝚜.*`;
        
        await socket.sendMessage(from, {
            text: warnMsg,
            mentions: [...mentioned, msg.key.participant || msg.key.remoteJid]
        }, { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "⚠️", key: msg.key } });
    }
};

// CLEAR COMMAND
const clear = {
    command: "clear",
    alias: ["clearchat"],
    desc: "Clear all bot messages in chat",
    category: "group",
    react: "🧹",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        
        await socket.sendMessage(from, silaMessage(
            "*🧹 𝙲𝙻𝙴𝙰𝚁 𝙲𝙷𝙰𝚃*\n\n*𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗...*"
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🧹", key: msg.key } });
    }
};

// ANTILINK COMMAND
const antilink = {
    command: "antilink",
    alias: ["antilinks"],
    desc: "Enable/disable anti link protection",
    category: "group",
    react: "🔗🚫",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();
        
        await socket.sendMessage(from, silaMessage(
            `*🔗🚫 𝙰𝙽𝚃𝙸𝙻𝙸𝙽𝙺 ${action === 'on' ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳'}*\n\n*𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗...*`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🔗", key: msg.key } });
    }
};

// ANTIMENTION COMMAND
const antimantion = {
    command: "antimantion",
    alias: ["antimentions"],
    desc: "Enable/disable anti mention protection",
    category: "group",
    react: "@🚫",
    groupOnly: true,
    adminOnly: true,
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const action = args[0]?.toLowerCase();
        
        await socket.sendMessage(from, silaMessage(
            `*@🚫 𝙰𝙽𝚃𝙸𝙼𝙴𝙽𝚃𝙸𝙾𝙽 ${action === 'on' ? '𝙴𝙽𝙰𝙱𝙻𝙴𝙳' : '𝙳𝙸𝚂𝙰𝙱𝙻𝙴𝙳'}*\n\n*𝙵𝚎𝚊𝚝𝚞𝚛𝚎 𝚌𝚘𝚖𝚒𝚗𝚐 𝚜𝚘𝚘𝚗...*`
        ), { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "@", key: msg.key } });
    }
};

// BAN COMMAND
const ban = {
    command: "ban",
    alias: ["banuser"],
    desc: "Ban user from using bot",
    category: "owner",
    react: "🔨",
    execute: async (socket, msg, args) => {
        const from = msg.key.remoteJid;
        const fromMe = msg.key.fromMe;
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned[0] || args[0];
        
        if (!fromMe) {
            await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
            return;
        }
        
        if (!target) {
            await socket.sendMessage(from, silaMessage(
                "*🔨 𝚄𝚂𝙰𝙶𝙴:* .ban @mention OR .ban <phone-number>"
            ), { quoted: msg });
            return;
        }
        
        const userId = target.includes('@') ? target : target + '@s.whatsapp.net';
        
        await socket.sendMessage(from, silaMessage(
            `*🔨 𝚄𝚂𝙴𝚁 𝙱𝙰𝙽𝙽𝙴𝙳*\n\n*𝚄𝚜𝚎𝚛:* @${userId.split('@')[0]}\n*𝙽𝚘𝚠 𝚌𝚊𝚗𝚗𝚘𝚝 𝚞𝚜𝚎 𝚋𝚘𝚝 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜*`
        ), { mentions: [userId] }, { quoted: msg });
        
        await socket.sendMessage(from, { react: { text: "🔨", key: msg.key } });
    }
};

// ==================== COMMAND HANDLER ====================

// Combine all commands
const allCommands = {
    imagine, pair, song, sora, textmaker, tts, video, vv,
    fb, apk, openai, ai, deepseek, ig, tiktok, alive, list,
    owner, broadcast, sticker, joke, url, settings, update,
    uptime, restart, bot, repo, mute, unmute, delete: del,
    kick, tag, tagall, hidetag, kickall, getpic, link, join,
    add, ginfo, senddm, listonline, poll, chatbot, setgpp,
    setgname, setgdesc, antitag, warn, clear, antilink,
    antimantion, ban
};

// Message handler
async function handleMessage(socket, msg) {
    try {
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;
        
        // Handle auto features first
        await handleAutoRead(socket, msg);
        await handleAntiDelete(socket, msg);
        await handleChannelReaction(socket, msg);
        await handleAutoJoin(socket, msg);
        await handleAutoFollow(socket, msg);
        
        // Handle auto replies if not a command
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    msg.message.imageMessage?.caption || '';
        
        if (!text.startsWith('.') && !msg.key.fromMe) {
            // Try auto features in order
            if (await handleAutoSticker(socket, msg)) return;
            if (await handleAutoVoice(socket, msg)) return;
            if (await handleAutoAI(socket, msg)) return;
            if (await handleAutoReply(socket, msg)) return;
        }
        
        if (!text.startsWith('.')) return;
        
        const args = text.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        
        // Find command
        let cmdObj = null;
        for (const cmdName in allCommands) {
            const cmd = allCommands[cmdName];
            if (cmd.command === command || (cmd.alias && cmd.alias.includes(command))) {
                cmdObj = cmd;
                break;
            }
        }
        
        if (!cmdObj) return;
        
        // Check if bot is online
        if (botState.settings.online === 'off' && !msg.key.fromMe) {
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                "*🤖 𝙱𝙾𝚃 𝙸𝚂 𝙾𝙵𝙵𝙻𝙸𝙽𝙴*\n\n*𝚃𝚑𝚎 𝚋𝚘𝚝 𝚒𝚜 𝚌𝚞𝚛𝚛𝚎𝚗𝚝𝚕𝚢 𝚘𝚏𝚏𝚕𝚒𝚗𝚎. 𝙿𝚕𝚎𝚊𝚜𝚎 𝚌𝚘𝚗𝚝𝚊𝚌𝚝 𝚘𝚠𝚗𝚎𝚛.*"
            ), { quoted: msg });
            return;
        }
        
        // Check if group only command is used in private chat
        if (cmdObj.groupOnly && !isJidGroup(msg.key.remoteJid)) {
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                "*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙶𝚁𝙾𝚄𝙿𝚂!*"
            ), { quoted: msg });
            return;
        }
        
        // Check admin permissions for group commands
        if (cmdObj.adminOnly && isJidGroup(msg.key.remoteJid)) {
            try {
                const metadata = await socket.groupMetadata(msg.key.remoteJid);
                const participant = metadata.participants.find(p => p.id === msg.key.participant || p.id === msg.key.remoteJid);
                if (!participant || !participant.admin) {
                    await socket.sendMessage(msg.key.remoteJid, silaMessage(
                        "*❌ 𝚈𝙾𝚄 𝙽𝙴𝙴𝙳 𝙰𝙳𝙼𝙸𝙽 𝙿𝙴𝚁𝙼𝙸𝚂𝚂𝙸𝙾𝙽!*"
                    ), { quoted: msg });
                    return;
                }
            } catch (error) {
                console.error("Admin check error:", error);
            }
        }
        
        // Execute command
        await cmdObj.execute(socket, msg, args);
        
    } catch (error) {
        console.error("Message handler error:", error);
        try {
            await socket.sendMessage(msg.key.remoteJid, silaMessage(
                `*❌ 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙴𝚁𝚁𝙾𝚁*\n\n${error.message || "Unknown error"}`
            ), { quoted: msg });
        } catch (sendError) {
            console.error("Failed to send error message:", sendError);
        }
    }
}

// Group event handler
async function handleGroupUpdate(socket, update) {
    try {
        if (!update || !update.id || !update.participants) return;
        
        const isGroup = isJidGroup(update.id);
        if (!isGroup) return;
        
        const metadata = await socket.groupMetadata(update.id);
        const participants = update.participants;
        
        for (const num of participants) {
            const userName = num.split("@")[0];
            
            if (update.action === "add") {
                const welcomeText = `╭━━【 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 】━━━━━━━━╮\n` +
                                   `│ 👋 @${userName}\n` +
                                   `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                   `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                
                await socket.sendMessage(update.id, {
                    text: welcomeText,
                    mentions: [num]
                }, { quoted: fakevCard });
                
            } else if (update.action === "remove") {
                const goodbyeText = `╭━━【 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 】━━━━━━━━╮\n` +
                                   `│ 👋 @${userName}\n` +
                                   `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                   `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                
                await socket.sendMessage(update.id, {
                    text: goodbyeText,
                    mentions: [num]
                }, { quoted: fakevCard });
                
            } else if (update.action === "promote") {
                const promoter = update.author?.split("@")[0] || "System";
                const promoteText = `╭━━【 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                                   `│ ⬆️ @${userName}\n` +
                                   `│ 👑 By: @${promoter}\n` +
                                   `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                   `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                
                const mentions = update.author ? [update.author, num] : [num];
                await socket.sendMessage(update.id, {
                    text: promoteText,
                    mentions: mentions
                }, { quoted: fakevCard });
                
            } else if (update.action === "demote") {
                const demoter = update.author?.split("@")[0] || "System";
                const demoteText = `╭━━【 𝐃𝐄𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                                  `│ ⬇️ @${userName}\n` +
                                  `│ 👑 By: @${demoter}\n` +
                                  `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                  `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
                
                const mentions = update.author ? [update.author, num] : [num];
                await socket.sendMessage(update.id, {
                    text: demoteText,
                    mentions: mentions
                }, { quoted: fakevCard });
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
}

// ==================== MAIN BOT FUNCTION ====================

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./sessions');
    const { version } = await fetchLatestBaileysVersion();
    
    const socket = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
    });
    
    socket.ev.on('creds.update', saveCreds);
    
    socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('[⚠️] Connection closed, reconnecting...');
            if (shouldReconnect) {
                setTimeout(() => {
                    startBot();
                }, 5000);
            }
        } else if (connection === 'open') {
            console.log('[✅] Bot connected successfully!');
            
            // Start auto bio updater
            setInterval(() => updateAutoBio(socket), 600000); // Update every 10 minutes
            
            // Initial bio update
            setTimeout(() => updateAutoBio(socket), 5000);
        }
    });
    
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        await handleMessage(socket, msg);
    });
    
    socket.ev.on('group-participants.update', async (update) => {
        await handleGroupUpdate(socket, update);
    });
    
    // Auto-reply for specific keywords
    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || '';
        
        if (text && !text.startsWith('.') && !msg.key.fromMe) {
            const lowerText = text.toLowerCase();
            const autoReplies = {
                'hi': 'Hello! How can I help you? 😊',
                'hello': 'Hi there! 👋',
                'bot': 'Yes, I am Sila MD Mini Bot! 🤖',
                'thanks': 'You\'re welcome! 😊',
                'thank you': 'Anytime! 😇'
            };
            
            for (const [keyword, reply] of Object.entries(autoReplies)) {
                if (lowerText.includes(keyword)) {
                    try {
                        await socket.sendMessage(msg.key.remoteJid, silaMessage(reply), { quoted: msg });
                    } catch (error) {
                        console.error('Auto reply error:', error);
                    }
                    break;
                }
            }
        }
    });
    
    // Handle calls
    socket.ev.on('call', async (call) => {
        if (botState.settings.anticall) {
            try {
                await socket.rejectCall(call.id, call.from);
            } catch (error) {
                console.error('Call reject error:', error);
            }
        }
    });
}

// Start the bot
startBot();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n[⚠️] Bot shutting down...');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('[❌] Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('[❌] Unhandled Rejection:', error);
});
