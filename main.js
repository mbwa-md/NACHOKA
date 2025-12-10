const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers, isJidGroup, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');

// Configuration
const config = {
    SESSION_NAME: 'sila-md',
    OWNER_NUMBER: '255612491554',
    NEWS_CHANNEL: 'https://whatsapp.com/channel/0029VbBG4gfISTkCpKxyMH02',
    NEWS_JID: '120363372349954132@g.us',
    HEROKU_APP_URL: 'https://nachoka.onrender.com',
    BOT_NAME: 'SILA MD MINI BOT'
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
    },
    autoviewstatus: true,
    autolikestatus: true,
    autobio: true,
    autojoin: true,
    autofollow: true,
    autoreaction: true
};

// Load or create settings
let settings = { ...defaultSettings };
const settingsPath = './settings.json';
if (fs.existsSync(settingsPath)) {
    try {
        settings = { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
    } catch (e) {}
}

// Save settings function
function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Bot Images for random selection
const botImages = [
    'https://i.imgur.com/xJYhO9n.jpg',
    'https://i.imgur.com/yJYhO9n.jpg',
    'https://i.imgur.com/zJYhO9n.jpg'
];

// Helper functions
function getRandomBotImage() {
    return botImages[Math.floor(Math.random() * botImages.length)];
}

function getRandomEmoji() {
    const emojis = ['🐢', '✨', '🌟', '💫', '🔥', '💎', '⚡', '❤️', '💚', '💙', '💜', '💛', '🧡', '🤍'];
    return emojis[Math.floor(Math.random() * emojis.length)];
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
                sourceUrl: config.NEWS_CHANNEL,
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

// Define fakevCard
const fakevCard = {
    key: {
        fromMe: false,
        participant: "0@s.whatsapp.net",
        remoteJid: "status@broadcast"
    },
    message: {
        contactMessage: {
            displayName: "© SILA AI 🎅",
            vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SILA AI CHRISTMAS\nORG:SILA AI;\nTEL;type=CELL;type=VOICE;waid=${config.OWNER_NUMBER}:+${config.OWNER_NUMBER}\nEND:VCARD`
        }
    }
};

// ALL COMMANDS IN ONE FILE
const commands = {
    // =========== AI COMMANDS ===========
    imagine: {
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
                        "*🎨 AI IMAGE GENERATOR*\n\nPlease provide a prompt for the image.\n\n*Example:* .imagine a beautiful sunset over mountains"
                    ), { quoted: msg });
                    return;
                }

                await socket.sendMessage(sender, silaMessage(
                    `*🔄 CREATING IMAGE...*\n\n*Prompt:* ${prompt}\n\nPlease wait while I generate your image...`
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
                        "*❌ IMAGE GENERATION FAILED*\n\nAll AI services are currently unavailable. Please try again later."
                    ), { quoted: msg });
                    await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
                    return;
                }

                await socket.sendMessage(sender, {
                    image: imageBuffer,
                    caption: `*🎨 AI IMAGE GENERATED*\n\n*Prompt:* ${prompt}\n*Model:* ${apiUsed}\n*Powered by:* SILA MD MINI s1`
                }, { quoted: msg });

                await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

            } catch (error) {
                console.error("Imagine command error:", error);
                await socket.sendMessage(sender, silaMessage(
                    `*❌ ERROR*\n\nFailed to generate image:\n${error.message || "Unknown error"}\n\nPlease try again with a different prompt.`
                ), { quoted: msg });
                await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
            }
        }
    },

    sora: {
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
    },

    openai: {
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
    },

    ai: {
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
    },

    deepseek: {
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
    },

    // =========== DOWNLOAD COMMANDS ===========
    song: {
        command: 'song',
        alias: ["play","mp3","audio","music","s","so","son","songs"],
        description: "Download YouTube song (Audio)",
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
    },

    video: {
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
                    "*MUJHE APKI VIDEO NAHI MIL RAHI SORRY 🥺❤️*"
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
                                await socket.sendMessage(senderID, silaMessage("*🥺 Sirf 1 ya 2 reply me bhejo!*"), { quoted: receivedMsg });
                        }
                    }
                });

                await socket.sendMessage(sender, { react: { text: "✅", key: msg.key } });

            } catch (error) {
                console.error("Video download error:", error);
                await socket.sendMessage(sender, silaMessage("*😔 Video download nahi hui!*"), { quoted: msg });
                await socket.sendMessage(sender, { react: { text: "❌", key: msg.key } });
            }
        }
    },

    fb: {
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
    },

    ig: {
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
    },

    tiktok: {
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
    },

    apk: {
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
    },

    // =========== CREATOR COMMANDS ===========
    textmaker: {
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
                        `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝚂𝚃𝚈𝙻𝙸𝚂𝙷 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴𝚂 ✨*\n\n*𝚄𝚂𝙰𝙶𝙴:*\n.textmaker <style> <text>\n\n*𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝚂𝚃𝚈𝙻𝙴𝚂:*\n• metallic - 3D Metal Text\n• ice - Ice Text Effect\n• snow - Snow 3D Text\n• impressive - Colorful Paint Text\n• matrix - Matrix Text Effect\n• light - Futuristic Light Text\n• neon - Colorful Neon Lights\n• devil - Neon Devil Wings\n• purple - Purple Text Effect\n• thunder - Thunder Text Effect\n• leaves - Green Brush Text\n• 1917 - 1917 Style Text\n• arena - Arena of Valor Cover\n• hacker - Anonymous Hacker\n• sand - Text on Sand\n• blackpink - Blackpink Style\n• glitch - Digital Glitch Text\n• fire - Flame Lettering\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n.textmaker metallic SILA\n.textmaker neon BOT\n.textmaker fire MD\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
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
    },

    sticker: {
        command: "sticker",
        alias: ["s", "stiker", "stik"],
        desc: "Create sticker from image/video",
        category: "creator",
        react: "🖼️",
        execute: async (socket, msg, args) => {
            try {
                const from = msg.key.remoteJid;
                const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

                if (!quoted) {
                    return await socket.sendMessage(from, silaMessage(
                        "*🖼️ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁 𝙼𝙰𝙺𝙴𝚁 🖼️*\n\n*𝚄𝚂𝙰𝙶𝙴:* Reply to an image/video with .sticker\n\n*𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂:*\n• Create sticker from image\n• Create sticker from video (7 seconds max)\n• Add custom caption\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*"
                    ), { quoted: msg });
                }

                await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });

                let type = Object.keys(quoted)[0];
                if (!["imageMessage", "videoMessage"].includes(type)) {
                    return await socket.sendMessage(from, silaMessage("*❌ 𝙿𝙻𝙴𝙰𝚂𝙴 𝚁𝙴𝙿𝙻𝚈 𝚃𝙾 𝙰𝙽 𝙸𝙼𝙰𝙶𝙴 𝙾𝚁 𝚅𝙸𝙳𝙴𝙾*"), { quoted: msg });
                }

                const stream = await downloadContentFromMessage(quoted[type], type.replace("Message", ""));
                let buffer = Buffer.from([]);
                for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

                await socket.sendMessage(from, {
                    sticker: buffer
                }, { quoted: msg });

                await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });

            } catch (error) {
                console.error("Sticker Error:", error);
                await socket.sendMessage(msg.key.remoteJid, silaMessage(
                    `*❌ 𝚂𝚃𝙸𝙲𝙺𝙴𝚁 𝙲𝚁𝙴𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n${error.message}`
                ), { quoted: msg });
                await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
            }
        }
    },

    // =========== GROUP COMMANDS ===========
    mute: {
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
    },

    unmute: {
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
    },

    kick: {
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
    },

    tagall: {
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
    },

    ginfo: {
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
    },

    add: {
        command: "add",
        alias: ["invite"],
        desc: "Add members to group",
        category: "group",
        react: "➕",
        groupOnly: true,
        adminOnly: true,
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const numbers = args.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
            
            if (numbers.length === 0) {
                await socket.sendMessage(from, silaMessage("*➕ 𝚄𝚂𝙰𝙶𝙴:* .add 255612491554 255712345678"), { quoted: msg });
                return;
            }
            
            try {
                await socket.groupParticipantsUpdate(from, numbers, 'add');
                await socket.sendMessage(from, silaMessage(`*➕ 𝙰𝙳𝙳𝙴𝙳:* ${numbers.map(jid => `@${jid.split('@')[0]}`).join(', ')}`), { 
                    mentions: numbers 
                }, { quoted: msg });
                await socket.sendMessage(from, { react: { text: "➕", key: msg.key } });
            } catch (error) {
                await socket.sendMessage(from, silaMessage("*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝙰𝙳𝙳 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*"), { quoted: msg });
            }
        }
    },

    // =========== GENERAL COMMANDS ===========
    pair: {
        command: "pair",
        desc: "Get pairing code for mini inconnu xd AI bot",
        use: ".pair 653078046968",
        react: "🔑",
        execute: async (socket, msg, args) => {
            const messages = {
                invalid: "*DO YOU WANT SILA MD MINI BOT PAIR CODE 🤔*\n*THEN WRITE LIKE THIS ☺️\n\n*PAIR +255612491554*\n\n*WHEN YOU WRITE LIKE THIS 😇 THEN YOU WILL GET SILA MD MINI BOT PAIR CODE 😃 YOU CAN LOGIN IN YOUR WHATSAPP 😍 YOUR MINI BOT WILL ACTIVATE 🥰*",
                failed: "*PLEASE TRY AGAIN AFTER SOME TIME 🥺❤️*",
                done: "*🐢 SILA MD MINI BOT 🐢*\n*PAIR CODE COMPLETED 😇❤️*",
                error: "*PAIR CODE IS NOT CONNECTING TO YOUR NUMBER ☹️*",
            };

            try {
                const senderId = msg.sender || msg.key?.participant || msg.key?.remoteJid || "";
                const phoneNumber = args.length > 0 ? args.join(" ").trim() : "";

                if (!phoneNumber) {
                    return socket.sendMessage(
                        msg.key?.remoteJid || senderId,
                        silaMessage(`*𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙵𝙾𝚁 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 ☺️*\n*𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇*\n\n *.𝙿𝙰𝙸𝚁 ❮+255612491554❯*\n\n *𝙸𝙽𝚂𝚃𝙴𝙰𝙳 𝙾𝙵 𝚃𝙷𝙸𝚂 𝙽𝚄𝙼𝙱𝙴𝚁 𝚆𝚁𝙸𝚃𝙴 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 𝙾𝙺 😊 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄 𝚆𝙸𝙻𝙻 𝙶𝙴𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 😃 𝚈𝙾𝚄 𝙲𝙰𝙽 𝙻𝙾𝙶𝙸𝙽 𝚆𝙸𝚃𝙷 𝚃𝙷𝙰𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 𝙸𝙽 𝚈𝙾𝚄𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 😌 𝚃𝙷𝙴𝙽 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝚆𝙸𝙻𝙻 𝙰𝙲𝚃𝙸𝚅𝙰𝚃𝙴 𝙾𝙽 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 😍*`),
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
    },

    tts: {
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
                        `*📢 Aap apna message likho jise voice me badalna hai!*\n\nExample:\n> .tts Hello World\n> .tts ur Assalamualaikum`
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
                    `❌ *Voice banate waqt error:* ${err.message}`
                ), { quoted: msg });
                await socket.sendMessage(jid, { react: { text: "❌", key: msg.key } });
            }
        }
    },

    vv: {
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
    },

    alive: {
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
    },

    list: {
        command: "list",
        alias: ["menu", "help", "commands"],
        desc: "Show all available commands",
        category: "general",
        react: "📋",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            
            // Group commands by category
            const categories = {};
            for (const cmdName in commands) {
                const cmd = commands[cmdName];
                if (!categories[cmd.category]) {
                    categories[cmd.category] = [];
                }
                categories[cmd.category].push(`• .${cmd.command} - ${cmd.desc || cmd.description}`);
            }
            
            let listMsg = `*📋 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂 𝙻𝙸𝚂𝚃 📋*\n\n`;
            
            for (const [category, cmdList] of Object.entries(categories)) {
                listMsg += `*${category.toUpperCase()}*\n`;
                listMsg += cmdList.join('\n') + '\n\n';
            }
            
            listMsg += `*📌 𝚃𝙾𝚃𝙰𝙻 𝙲𝙾𝙼𝙼𝙰𝙽𝙳𝚂:* ${Object.keys(commands).length}\n`;
            listMsg += `*👑 𝙾𝚆𝙽𝙴𝚁:* +${config.OWNER_NUMBER}\n`;
            listMsg += `*🔗 𝙱𝙾𝚃 𝙻𝙸𝙽𝙺:* ${config.HEROKU_APP_URL}\n`;
            listMsg += `*📢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻:* ${config.NEWS_CHANNEL}\n\n`;
            listMsg += `*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
            
            await socket.sendMessage(from, silaMessage(listMsg), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "📋", key: msg.key } });
        }
    },

    owner: {
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
    },

    broadcast: {
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
            
            await socket.sendMessage(from, silaMessage(
                `*📢 𝙱𝚁𝙾𝙰𝙳𝙲𝙰𝚂𝚃 𝚂𝙴𝙽𝚃*\n\n*𝙼𝚎𝚜𝚜𝚊𝚐𝚎:* ${message}\n\n*𝚃𝙾:* All registered chats`
            ), { quoted: msg });
            
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        }
    },

    settings: {
        command: "settings",
        alias: ["config", "setting"],
        desc: "View and change bot settings",
        category: "owner",
        react: "⚙️",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            
            if (!fromMe) {
                await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
                return;
            }
            
            if (args.length === 0) {
                // Show current settings
                let settingsMsg = `*⚙️ 𝙱𝙾𝚃 𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂 ⚙️*\n\n`;
                for (const [key, value] of Object.entries(settings)) {
                    settingsMsg += `*${key}:* ${value}\n`;
                }
                settingsMsg += `\n*𝚄𝚂𝙰𝙶𝙴:* .settings <key> <value>\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .settings autoread true`;
                
                await socket.sendMessage(from, silaMessage(settingsMsg), { quoted: msg });
                return;
            }
            
            if (args.length === 2) {
                const [key, value] = args;
                if (settings.hasOwnProperty(key)) {
                    // Convert string to appropriate type
                    let newValue;
                    if (value === 'true' || value === 'false') {
                        newValue = value === 'true';
                    } else if (!isNaN(value) && value !== '') {
                        newValue = Number(value);
                    } else {
                        newValue = value;
                    }
                    
                    settings[key] = newValue;
                    saveSettings();
                    
                    await socket.sendMessage(from, silaMessage(
                        `*⚙️ 𝚂𝙴𝚃𝚃𝙸𝙽𝙶 𝚄𝙿𝙳𝙰𝚃𝙴𝙳*\n\n*${key}:* ${newValue}`
                    ), { quoted: msg });
                    await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
                } else {
                    await socket.sendMessage(from, silaMessage(`*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚂𝙴𝚃𝚃𝙸𝙽𝙶:* ${key}`), { quoted: msg });
                }
            }
        }
    },

    joke: {
        command: "joke",
        alias: ["jokes", "fun", "funny"],
        desc: "Get random jokes",
        category: "fun",
        react: "😂",
        execute: async (socket, msg, args) => {
            try {
                const from = msg.key.remoteJid;
                
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything!",
                    "Why did the scarecrow win an award? Because he was outstanding in his field!",
                    "Why don't eggs tell jokes? They'd crack each other up!",
                    "What do you call fake spaghetti? An impasta!",
                    "Why did the math book look so sad? Because it had too many problems!",
                    "What do you call a bear with no teeth? A gummy bear!",
                    "Why don't skeletons fight each other? They don't have the guts!",
                    "What do you call a sleeping bull? A bulldozer!",
                    "Why did the tomato turn red? Because it saw the salad dressing!",
                    "What do you call a fish wearing a bowtie? Sofishticated!"
                ];
                
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                
                await socket.sendMessage(from, silaMessage(`*😂 𝙹𝙾𝙺𝙴 𝚃𝙸𝙼𝙴 😂*\n\n${randomJoke}`), { quoted: msg });
                await socket.sendMessage(from, { react: { text: "😂", key: msg.key } });
            } catch (error) {
                console.error("Joke Error:", error);
            }
        }
    },

    url: {
        command: "url",
        alias: ["short", "shorturl", "link"],
        desc: "Shorten URLs",
        category: "tools",
        react: "🔗",
        execute: async (socket, msg, args) => {
            try {
                const from = msg.key.remoteJid;
                const url = args[0];
                
                if (!url) {
                    await socket.sendMessage(from, silaMessage(
                        "*🔗 𝚄𝚁𝙻 𝚂𝙷𝙾𝚁𝚃𝙴𝙽𝙴𝚁 🔗*\n\n*𝚄𝚂𝙰𝙶𝙴:* .url <long-url>\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .url https://example.com/very-long-url"
                    ), { quoted: msg });
                    return;
                }
                
                await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
                
                // Using tinyurl API
                const shortUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
                const response = await axios.get(shortUrl);
                
                await socket.sendMessage(from, silaMessage(
                    `*🔗 𝚄𝚁𝙻 𝚂𝙷𝙾𝚁𝚃𝙴𝙽𝙴𝙳 🔗*\n\n*𝙾𝚁𝙸𝙶𝙸𝙽𝙰𝙻:* ${url}\n*𝚂𝙷𝙾𝚁𝚃:* ${response.data}`
                ), { quoted: msg });
                
                await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
            } catch (error) {
                console.error("URL Error:", error);
                await socket.sendMessage(msg.key.remoteJid, silaMessage(
                    `*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚂𝙷𝙾𝚁𝚃𝙴𝙽 𝚄𝚁𝙻*\n\n${error.message}`
                ), { quoted: msg });
                await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
            }
        }
    },

    repo: {
        command: "repo",
        alias: ["source", "github", "code"],
        desc: "Get bot repository link",
        category: "general",
        react: "📂",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            
            const repoMsg = `*📂 𝚂𝙸𝙻𝙰 𝙼𝙳 𝚁𝙴𝙿𝙾𝚂𝙸𝚃𝙾𝚁𝚈 📂*\n\n` +
                           `*🔗 𝙱𝙾𝚃 𝙻𝙸𝙽𝙺:* ${config.HEROKU_APP_URL}\n` +
                           `*👑 𝙳𝙴𝚅𝙴𝙻𝙾𝙿𝙴𝚁:* +${config.OWNER_NUMBER}\n` +
                           `*📢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻:* ${config.NEWS_CHANNEL}\n\n` +
                           `*✨ 𝚂𝙾𝚄𝚁𝙲𝙴 𝙲𝙾𝙳𝙴 𝙸𝚂 𝙿𝚁𝙸𝚅𝙰𝚃𝙴*`;
            
            await socket.sendMessage(from, silaMessage(repoMsg), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "📂", key: msg.key } });
        }
    },

    update: {
        command: "update",
        alias: ["upgrade", "checkupdate"],
        desc: "Check for bot updates",
        category: "owner",
        react: "🔄",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            
            const updateMsg = `*🔄 𝙱𝙾𝚃 𝚄𝙿𝙳𝙰𝚃𝙴𝚂 🔄*\n\n` +
                             `*📅 𝙻𝙰𝚂𝚃 𝚄𝙿𝙳𝙰𝚃𝙴:* Today\n` +
                             `*🆕 𝚅𝙴𝚁𝚂𝙸𝙾𝙽:* 2.0.1\n` +
                             `*✨ 𝙵𝙴𝙰𝚃𝚄𝚁𝙴𝚂:*\n` +
                             `• Added AI Image Generation\n` +
                             `• Added Video Downloader\n` +
                             `• Improved Stability\n` +
                             `• New Commands Added\n\n` +
                             `*👑 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
            
            await socket.sendMessage(from, silaMessage(updateMsg), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "🔄", key: msg.key } });
        }
    },

    uptime: {
        command: "uptime",
        alias: ["time", "runtime"],
        desc: "Check bot uptime",
        category: "general",
        react: "⏰",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const uptime = process.uptime();
            const days = Math.floor(uptime / 86400);
            const hours = Math.floor((uptime % 86400) / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            
            const uptimeMsg = `*⏰ 𝙱𝙾𝚃 𝚄𝙿𝚃𝙸𝙼𝙴 ⏰*\n\n` +
                              `*📅 𝙳𝙰𝚈𝚂:* ${days}\n` +
                              `*🕐 𝙷𝙾𝚄𝚁𝚂:* ${hours}\n` +
                              `*⏱️ 𝙼𝙸𝙽𝚄𝚃𝙴𝚂:* ${minutes}\n` +
                              `*⏲️ 𝚂𝙴𝙲𝙾𝙽𝙳𝚂:* ${seconds}\n\n` +
                              `*✨ 𝚂𝚃𝙰𝚃𝚄𝚂:* 𝚁𝚄𝙽𝙽𝙸𝙽𝙶 𝚂𝙼𝙾𝙾𝚃𝙷𝙻𝚈`;
            
            await socket.sendMessage(from, silaMessage(uptimeMsg), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "⏰", key: msg.key } });
        }
    },

    restart: {
        command: "restart",
        alias: ["reboot", "refresh"],
        desc: "Restart the bot (Owner only)",
        category: "owner",
        react: "🔄",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            
            if (!fromMe) {
                await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
                return;
            }
            
            await socket.sendMessage(from, silaMessage("*🔄 𝚁𝙴𝚂𝚃𝙰𝚁𝚃𝙸𝙽𝙶 𝙱𝙾𝚃...*"), { quoted: msg });
            
            setTimeout(() => {
                process.exit(0);
            }, 2000);
        }
    },

    "bot on": {
        command: "bot on",
        alias: ["on"],
        desc: "Turn bot on",
        category: "owner",
        react: "✅",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            
            if (!fromMe) {
                await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
                return;
            }
            
            settings.online = 'on';
            saveSettings();
            
            await socket.sendMessage(from, silaMessage("*✅ 𝙱𝙾𝚃 𝚃𝚄𝚁𝙽𝙴𝙳 𝙾𝙽*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
        }
    },

    "bot off": {
        command: "bot off",
        alias: ["off"],
        desc: "Turn bot off",
        category: "owner",
        react: "❌",
        execute: async (socket, msg, args) => {
            const from = msg.key.remoteJid;
            const fromMe = msg.key.fromMe;
            
            if (!fromMe) {
                await socket.sendMessage(from, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙾𝚆𝙽𝙴𝚁!*"), { quoted: msg });
                return;
            }
            
            settings.online = 'off';
            saveSettings();
            
            await socket.sendMessage(from, silaMessage("*❌ 𝙱𝙾𝚃 𝚃𝚄𝚁𝙽𝙴𝙳 𝙾𝙵𝙵*"), { quoted: msg });
            await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
        }
    },

    trt: {
        command: "trt",
        alias: ["translate", "trans"],
        desc: "Translate text",
        category: "tools",
        react: "🌐",
        execute: async (socket, msg, args) => {
            try {
                const from = msg.key.remoteJid;
                const [lang, ...textParts] = args;
                const text = textParts.join(" ");
                
                if (!lang || !text) {
                    await socket.sendMessage(from, silaMessage(
                        "*🌐 𝚃𝚁𝙰𝙽𝚂𝙻𝙰𝚃𝙸𝙾𝙽 🌐*\n\n*𝚄𝚂𝙰𝙶𝙴:* .trt <lang-code> <text>\n\n*𝙻𝙰𝙽𝙶𝚄𝙰𝙶𝙴 𝙲𝙾𝙳𝙴𝚂:*\n• en - English\n• es - Spanish\n• fr - French\n• de - German\n• it - Italian\n• pt - Portuguese\n• ru - Russian\n• ja - Japanese\n• ko - Korean\n• ar - Arabic\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴:* .trt en Hola mundo"
                    ), { quoted: msg });
                    return;
                }
                
                await socket.sendMessage(from, { react: { text: "⏳", key: msg.key } });
                
                const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`;
                const response = await axios.get(apiUrl);
                const translation = response.data.responseData.translatedText;
                
                await socket.sendMessage(from, silaMessage(
                    `*🌐 𝚃𝚁𝙰𝙽𝚂𝙻𝙰𝚃𝙸𝙾𝙽 🌐*\n\n*𝙾𝚁𝙸𝙶𝙸𝙽𝙰𝙻:* ${text}\n*𝚃𝚁𝙰𝙽𝚂𝙻𝙰𝚃𝙴𝙳:* ${translation}`
                ), { quoted: msg });
                
                await socket.sendMessage(from, { react: { text: "✅", key: msg.key } });
            } catch (error) {
                console.error("Translate Error:", error);
                await socket.sendMessage(msg.key.remoteJid, silaMessage(
                    `*❌ 𝙵𝙰𝙸𝙻𝙴𝙳 𝚃𝙾 𝚃𝚁𝙰𝙽𝚂𝙻𝙰𝚃𝙴*\n\n${error.message}`
                ), { quoted: msg });
                await socket.sendMessage(from, { react: { text: "❌", key: msg.key } });
            }
        }
    }
};

// Message handler
async function handleMessage(socket, msg) {
    try {
        if (!msg.message || msg.key.remoteJid === 'status@broadcast') return;

        const text = msg.message.conversation || 
                    msg.message.extendedTextMessage?.text || 
                    msg.message.imageMessage?.caption || '';

        if (!text.startsWith('.')) {
            // Auto-reply for non-command messages (if enabled)
            if (settings.autoai === "on") {
                const lowerText = text.toLowerCase();
                const autoReplies = {
                    'hi': 'Hello! How can I help you? 😊',
                    'hello': 'Hi there! 👋',
                    'bot': 'Yes, I am Sila MD Mini Bot! 🤖',
                    'thanks': 'You\'re welcome! 😊',
                    'thank you': 'Anytime! 😇',
                    'good morning': 'Good morning! 🌅',
                    'good night': 'Good night! 🌙',
                    'how are you': 'I\'m fine, thanks! How about you? 😊',
                    'who are you': 'I am Sila MD Mini Bot, your personal assistant! 🤖'
                };

                for (const [keyword, reply] of Object.entries(autoReplies)) {
                    if (lowerText.includes(keyword)) {
                        await socket.sendMessage(msg.key.remoteJid, silaMessage(reply), { quoted: msg });
                        break;
                    }
                }
            }
            return;
        }

        const args = text.slice(1).trim().split(/ +/);
        const command = args.shift().toLowerCase();

        // Find command (check both direct command and alias)
        let cmdObj = null;
        for (const cmdName in commands) {
            const cmd = commands[cmdName];
            if (cmd.command === command || (cmd.alias && cmd.alias.includes(command))) {
                cmdObj = cmd;
                break;
            }
        }

        if (!cmdObj) return;

        // Check if group only command is used in private chat
        if (cmdObj.groupOnly && !isJidGroup(msg.key.remoteJid)) {
            await socket.sendMessage(msg.key.remoteJid, silaMessage("*❌ 𝚃𝙷𝙸𝚂 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 𝙸𝚂 𝙾𝙽𝙻𝚈 𝙵𝙾𝚁 𝙶𝚁𝙾𝚄𝙿𝚂!*"), { quoted: msg });
            return;
        }

        // Check admin permissions for group commands
        if (cmdObj.adminOnly && isJidGroup(msg.key.remoteJid)) {
            try {
                const metadata = await socket.groupMetadata(msg.key.remoteJid);
                const participant = metadata.participants.find(p => p.id === msg.key.participant || p.id === msg.key.remoteJid);
                if (!participant || !participant.admin) {
                    await socket.sendMessage(msg.key.remoteJid, silaMessage("*❌ 𝚈𝙾𝚄 𝙽𝙴𝙴𝙳 𝙰𝙳𝙼𝙸𝙽 𝙿𝙴𝚁𝙼𝙸𝚂𝚂𝙸𝙾𝙽!*"), { quoted: msg });
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
            }
        }
    } catch (err) {
        console.error('Group event error:', err);
    }
}

// Status event handler (for autoview and autolike)
async function handleStatusUpdate(socket, update) {
    try {
        if (settings.autoviewstatus) {
            // Auto view status
            for (const status of update) {
                if (status.statusJidList) {
                    for (const jid of status.statusJidList) {
                        await socket.readMessages([{ remoteJid: jid, id: status.messages[0]?.key?.id }]);
                    }
                }
            }
        }

        if (settings.autolikestatus) {
            // Auto like status (if implemented in API)
            const randomEmoji = getRandomEmoji();
            // Note: Status liking might require additional implementation
        }
    } catch (error) {
        console.error("Status handler error:", error);
    }
}

// Main function
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
            if (shouldReconnect) {
                console.log('[🔄] Reconnecting...');
                startBot();
            }
        } else if (connection === 'open') {
            console.log('[✅] Bot connected successfully!');
            console.log(`[🤖] Bot Name: ${config.BOT_NAME}`);
            console.log(`[👑] Owner: ${config.OWNER_NUMBER}`);
            console.log(`[🔗] URL: ${config.HEROKU_APP_URL}`);
        }
    });

    socket.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        
        // Auto read messages if enabled
        if (settings.autoread) {
            await socket.readMessages([msg.key]);
        }
        
        await handleMessage(socket, msg);
    });

    socket.ev.on('group-participants.update', async (update) => {
        await handleGroupUpdate(socket, update);
    });

    socket.ev.on('status.update', async (update) => {
        await handleStatusUpdate(socket, update);
    });

    // Auto-typing and auto-recording (simulated)
    if (settings.autotype || settings.autorecord) {
        setInterval(() => {
            // This would be implemented with actual typing indicators
            // For now, it's just a placeholder
        }, 30000);
    }

    // Auto-bio updater
    if (settings.autobio) {
        setInterval(async () => {
            try {
                const bios = [
                    `🤖 ${config.BOT_NAME} | Online ✅`,
                    `✨ Powered by SILA MD`,
                    `🎯 Active on WhatsApp`,
                    `🚀 Fast & Reliable Bot`,
                    `💎 Premium Quality Service`
                ];
                const randomBio = bios[Math.floor(Math.random() * bios.length)];
                // Note: Setting bio requires additional implementation
            } catch (error) {
                console.error("Auto-bio error:", error);
            }
        }, 3600000); // Update every hour
    }
}

// Start the bot
startBot();

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n[⚠️] Bot shutting down...');
    saveSettings();
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    console.error('[❌] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[❌] Unhandled Rejection at:', promise, 'reason:', reason);
});
