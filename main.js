const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');
const router = express.Router();
const pino = require('pino');
const os = require('os');
const axios = require('axios');
const { default: makeWASocket, useMultiFileAuthState, delay, makeCacheableSignalKeyStore, Browsers, DisconnectReason, jidDecode, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const yts = require('yt-search');
const googleTTS = require("google-tts-api");
const mongoose = require('mongoose');

// MongoDB Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kxshrii:i7sgjXF6SO2cTJwU@kelumxz.zggub8h.mongodb.net/';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// MongoDB Schemas
const sessionSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  sessionId: { type: String },
  settings: { type: Object, default: {} },
  creds: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true },
  settings: { type: Object, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// MongoDB Models
const Session = mongoose.model('Session', sessionSchema);
const Settings = mongoose.model('Settings', settingsSchema);

console.log('✅ Using MongoDB database system');

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

// Define combined fakevCard with Christmas and regular version
const fakevCard = {
  key: {
    fromMe: false,
    participant: "0@s.whatsapp.net",
    remoteJid: "status@broadcast"
  },
  message: {
    contactMessage: {
      displayName: "©  𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡",
      vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:SILA TECH CHRISTMAS\nORG:SILA TECH;\nTEL;type=CELL;type=VOICE;waid=255612491554:+255612491554\nEND:VCARD`
    }
  }
};

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
  '120363402325089913@newsletter',
  '120363422610520277@newsletter'
];

// Bot images for random selection
const BOT_IMAGES = [
  'https://files.catbox.moe/277zt9.jpg',
  'https://files.catbox.moe/el1chf.jpeg'
];

const OWNER_NUMBERS = ['255789661031'];

// MongoDB CRUD operations for Session model
Session.findOneAndUpdate = async function(query, update, options = {}) {
  try {
    const session = await this.findOne(query);
    
    if (session) {
      // Handle $set operator
      if (update.$set) {
        Object.assign(session, update.$set);
      } else {
        Object.assign(session, update);
      }
      session.updatedAt = new Date();
      await session.save();
      return session;
    } else if (options.upsert) {
      const newSession = new this({
        ...query,
        ...update.$set,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newSession.save();
      return newSession;
    }
    return null;
  } catch (error) {
    console.error('Error in findOneAndUpdate:', error);
    return null;
  }
};

// MongoDB CRUD operations for Settings model
Settings.findOneAndUpdate = async function(query, update, options = {}) {
  try {
    const settings = await this.findOne(query);
    
    if (settings) {
      // Handle $set operator
      if (update.$set) {
        Object.assign(settings.settings, update.$set);
      } else {
        Object.assign(settings.settings, update);
      }
      settings.updatedAt = new Date();
      await settings.save();
      return settings;
    } else if (options.upsert) {
      const newSettings = new this({
        ...query,
        settings: update.$set || update,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await newSettings.save();
      return newSettings;
    }
    return null;
  } catch (error) {
    console.error('Error in Settings findOneAndUpdate:', error);
    return null;
  }
};

// Helper function to get settings
async function getSettings(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = await Settings.findOneAndUpdate(
        { number: sanitizedNumber },
        { $set: defaultSettings },
        { upsert: true, new: true }
      );
      return defaultSettings;
    }

    const mergedSettings = { ...defaultSettings };
    for (let key in settingsDoc.settings) {
      if (
        typeof settingsDoc.settings[key] === 'object' &&
        !Array.isArray(settingsDoc.settings[key]) &&
        settingsDoc.settings[key] !== null
      ) {
        mergedSettings[key] = {
          ...defaultSettings[key],
          ...settingsDoc.settings[key]
        };
      } else {
        mergedSettings[key] = settingsDoc.settings[key];
      }
    }

    const needsUpdate = JSON.stringify(settingsDoc.settings) !== JSON.stringify(mergedSettings);

    if (needsUpdate) {
      await Settings.findOneAndUpdate(
        { number: sanitizedNumber },
        { $set: { settings: mergedSettings } },
        { upsert: true }
      );
    }

    return mergedSettings;
  } catch (error) {
    console.error('Error in getSettings:', error);
    return defaultSettings;
  }
}

// Helper function to update settings
async function updateSettings(number, updates = {}) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = await Settings.findOneAndUpdate(
        { number: sanitizedNumber },
        { $set: { ...defaultSettings, ...updates } },
        { upsert: true, new: true }
      );
      return settingsDoc.settings;
    }

    const mergedSettings = { ...defaultSettings };

    // Merge existing settings
    for (const key in settingsDoc.settings) {
      if (
        typeof settingsDoc.settings[key] === 'object' &&
        !Array.isArray(settingsDoc.settings[key]) &&
        settingsDoc.settings[key] !== null
      ) {
        mergedSettings[key] = {
          ...defaultSettings[key],
          ...settingsDoc.settings[key],
        };
      } else {
        mergedSettings[key] = settingsDoc.settings[key];
      }
    }

    // Apply updates
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

    settingsDoc.settings = mergedSettings;
    settingsDoc.updatedAt = new Date();
    await settingsDoc.save();

    return mergedSettings;
  } catch (error) {
    console.error('Error in updateSettings:', error);
    return defaultSettings;
  }
}

// Helper function to save settings
async function saveSettings(number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    let settingsDoc = await Settings.findOne({ number: sanitizedNumber });

    if (!settingsDoc) {
      settingsDoc = new Settings({
        number: sanitizedNumber,
        settings: defaultSettings
      });
      await settingsDoc.save();
      return defaultSettings;
    }

    const settings = settingsDoc.settings;
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
      settingsDoc.settings = settings;
      settingsDoc.updatedAt = new Date();
      await settingsDoc.save();
    }

    return settings;
  } catch (error) {
    console.error('Error in saveSettings:', error);
    return defaultSettings;
  }
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
      let retries = config.MAX_RETRIES || 3;
      let success = false;
      
      // Extract channel/group code from link
      let targetCode = '';
      let type = '';
      
      if (link.includes('whatsapp.com/channel/')) {
        type = 'channel';
        targetCode = link.split('/channel/')[1]?.split('?')[0]?.split('/')[0];
      } else if (link.includes('chat.whatsapp.com/')) {
        type = 'group';
        const cleanLink = link.split('?')[0]; // Remove query params
        const codeMatch = cleanLink.match(/chat\.whatsapp\.com\/(?:invite\/)?([a-zA-Z0-9_-]+)/);
        if (codeMatch) {
          targetCode = codeMatch[1];
        }
      }
      
      if (!targetCode) {
        console.warn(`Invalid link format: ${link}`);
        continue;
      }
      
      console.log(`Attempting to join ${type} with code: ${targetCode}`);
      
      while (retries > 0 && !success) {
        try {
          let response;
          
          if (type === 'channel') {
            response = await socket.newsletterFollow(targetCode);
          } else if (type === 'group') {
            response = await socket.groupAcceptInvite(targetCode);
          }
          
          // Debug response
          console.log(`${type} join response:`, JSON.stringify(response, null, 2));
          
          // Check for successful join
          if ((type === 'channel' && response?.id) || 
              (type === 'group' && response?.gid)) {
            const id = type === 'channel' ? response.id : response.gid;
            console.log(`[ ✅ ] Successfully joined ${type} with ID: ${id}`);
            success = true;
            
            // Send success notification
            try {
              await socket.sendMessage(ownerNumber[0], {
                text: `✅ Successfully joined ${type}: ${link}`,
              });
            } catch (sendError) {
              console.error(`Failed to send success message: ${sendError.message}`);
            }
          } else {
            throw new Error(`No ${type} ID in response`);
          }
          
        } catch (error) {
          retries--;
          let errorMessage = error.message || 'Unknown error';
          
          // Handle specific error cases
          if (error.message.includes('not-authorized') || 
              error.message.includes('401') || 
              error.message.includes('403')) {
            errorMessage = 'Bot is not authorized (possibly banned)';
          } else if (error.message.includes('conflict') || 
                    error.message.includes('already')) {
            errorMessage = `Bot is already a member of this ${type}`;
            success = true; // Consider this success
          } else if (error.message.includes('gone') || 
                    error.message.includes('not-found') || 
                    error.message.includes('404')) {
            errorMessage = `Link is invalid or expired`;
          } else if (error.message.includes('rate') || 
                    error.message.includes('limit')) {
            errorMessage = 'Rate limit exceeded';
          }
          
          console.warn(`Failed to join ${type}: ${errorMessage} (Retries left: ${retries})`);
          
          if (retries === 0 && !success) {
            console.error(`[ ❌ ] Failed to join ${type}`, { error: errorMessage });
            
            // Send failure notification to owner
            try {
              await socket.sendMessage(ownerNumber[0], {
                text: `❌ Failed to join ${type}: ${link}\nError: ${errorMessage}`,
              });
            } catch (sendError) {
              console.error(`Failed to send failure message: ${sendError.message}`);
            }
          }
          
          if (!success) {
            await delay(2000 * (config.MAX_RETRIES - retries + 1));
          }
        }
      }
      
      // Wait before processing next link
      if (success) {
        await delay(2000);
      }
    }
  } catch (error) {
    console.error('Error in autoJoinChannels:', error.message);
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
    if (!fs.existsSync(PLUGINS_PATH)) {
      return plugins; // Return empty if plugins folder doesn't exist
    }
    
    const pluginFiles = fs.readdirSync(PLUGINS_PATH).filter(file => file.endsWith('.js'));
    
    for (const file of pluginFiles) {
      try {
        const pluginPath = path.join(PLUGINS_PATH, file);
        const plugin = require(pluginPath);
        plugins[path.basename(file, '.js')] = plugin;
      } catch (error) {
        console.log(`Error loading plugin ${file}:`, error.message);
      }
    }
  } catch (error) {
    // Silent error - continue without plugins
  }
  
  return plugins;
}

// Utility function for formatted messages
function silaMessage(text) {
  const randomImage = BOT_IMAGES[Math.floor(Math.random() * BOT_IMAGES.length)];
  
  return {
    text: text,
    contextInfo: {
      externalAdReply: {
        title: '©  𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',
        body: '© 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',
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
        newsletterJid: CHANNEL_JIDS[0],
        newsletterName: '©  𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',
        serverMessageId: Math.floor(Math.random() * 1000000)
      },
      isForwarded: true,
      forwardingScore: 999
    }
  };
}

// Group event handler - AUTOMATIC
const groupEvents = {
  handleGroupUpdate: async (socket, update) => {
    try {
      // Validate update data
      if (!update || !update.id) {
        console.log('Invalid update data received');
        return;
      }
      
      const groupId = update.id;
      let participants = update.participants || [];
      
      // Convert single participant to array if needed
      if (!Array.isArray(participants)) {
        participants = [participants];
      }
      
      // Get group metadata
      let metadata;
      try {
        metadata = await socket.groupMetadata(groupId);
      } catch (err) {
        console.log('Could not fetch group metadata:', err.message);
        return;
      }
      
      // Process each participant
      for (const participant of participants) {
        try {
          const participantJid = typeof participant === 'string' ? participant : participant.id || participant;
          if (!participantJid || !participantJid.includes('@')) {
            console.log('Invalid participant JID:', participantJid);
            continue;
          }
          
          const userName = participantJid.split("@")[0];
          
          switch (update.action) {
            case "add":
              await handleWelcomeMessage(socket, groupId, participantJid, userName);
              break;
              
            case "remove":
              await handleGoodbyeMessage(socket, groupId, participantJid, userName);
              break;
              
            case "promote":
              await handlePromoteMessage(socket, update, groupId, participantJid, userName);
              break;
              
            case "demote":
              await handleDemoteMessage(socket, update, groupId, participantJid, userName);
              break;
              
            default:
              console.log(`Unknown action: ${update.action}`);
          }
          
          // Small delay between messages
          await delay(1000);
          
        } catch (err) {
          console.error(`Error processing participant ${participantJid}:`, err.message);
        }
      }
    } catch (err) {
      console.error('Group event handler error:', err.message);
    }
  }
};

// Helper functions for different message types
async function handleWelcomeMessage(socket, groupId, participantJid, userName) {
  const welcomeText = `╭━━【 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 】━━━━━━━━╮\n` +
                     `│ 👋 @${userName}\n` +
                     `│ 🎉 Welcome to the group!\n` +
                     `│ 📜 Please read group rules\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
  
  await sendGroupMessage(socket, groupId, welcomeText, [participantJid]);
}

async function handleGoodbyeMessage(socket, groupId, participantJid, userName) {
  const goodbyeText = `╭━━【 𝐆𝐎𝐎𝐃𝐁𝐘𝐄 】━━━━━━━━╮\n` +
                     `│ 👋 @${userName}\n` +
                     `│ 👋 Farewell! Hope to see you again\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
  
  await sendGroupMessage(socket, groupId, goodbyeText, [participantJid]);
}

async function handlePromoteMessage(socket, update, groupId, participantJid, userName) {
  const authorJid = update.author || update.by || '';
  const promoter = authorJid.split("@")[0] || "System";
  
  const promoteText = `╭━━【 𝐏𝐑𝐎𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                     `│ ⬆️ @${userName}\n` +
                     `│ 👑 Promoted by: @${promoter}\n` +
                     `│ 💪 Now an Admin!\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
  
  const mentions = authorJid ? [authorJid, participantJid] : [participantJid];
  await sendGroupMessage(socket, groupId, promoteText, mentions);
}

async function handleDemoteMessage(socket, update, groupId, participantJid, userName) {
  const authorJid = update.author || update.by || '';
  const demoter = authorJid.split("@")[0] || "System";
  
  const demoteText = `╭━━【 𝐃𝐄𝐌𝐎𝐓𝐄 】━━━━━━━━╮\n` +
                    `│ ⬇️ @${userName}\n` +
                    `│ 👑 Demoted by: @${demoter}\n` +
                    `│ ⚠️ Admin rights removed\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                    `*𝙿𝚘𝚠𝚎𝚛𝚎𝚍 𝚋𝚢 𝚂𝚒𝚕𝚊 𝚃𝚎𝚌𝚑*`;
  
  const mentions = authorJid ? [authorJid, participantJid] : [participantJid];
  await sendGroupMessage(socket, groupId, demoteText, mentions);
}

// Generic function to send messages
async function sendGroupMessage(socket, groupId, text, mentions = []) {
  try {
    const messageOptions = {
      mentions: mentions.filter(m => m && m.includes('@'))
    };
    
    // Send message without quoted/context info
    await socket.sendMessage(groupId, {
      text: text,
      mentions: messageOptions.mentions
    });
    
    console.log(`✅ Successfully sent ${text.split('\n')[0].replace(/[╭╮│╯╰━【】]/g, '')} message to group ${groupId}`);
  } catch (err) {
    console.error('Failed to send group message:', err.message);
    
    // Try alternative method if first fails
    try {
      await socket.sendMessage(groupId, { text: text });
    } catch (retryErr) {
      console.error('Failed to send message on retry:', retryErr.message);
    }
  }
}

// Utility delay function
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Command handler
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
      await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ᴄᴀɴ ᴏɴʟʏ ᴜsᴇᴅ ʙʏ ᴛʜᴇ ᴏᴡɴᴇʀ.`}, { quoted: msg });
    };

    const groupMessage = async () => {
      await socket.sendMessage(sender, {text: `🚫 ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ ɪs ᴏɴʟʏ ғᴏʀ ᴘʀɪᴠᴀᴛᴇ ᴄʜᴀᴛ ᴜsᴇ.`}, { quoted: msg });
    };

    const replygckavi = async (teks) => {
      await socket.sendMessage(sender, silaMessage(teks), { quoted: msg });
    };

    const kavireact = async (remsg) => {
      await socket.sendMessage(sender, { react: { text: remsg, key: msg.key }}, { quoted: msg });
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
            await kavireact("📜");

            const startTime = socketCreationTime.get(number) || Date.now();
            const uptime = Math.floor((Date.now() - startTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = Math.floor(uptime % 60);
            const totalMemMB = (os.totalmem() / (1024 * 1024)).toFixed(2);
            const freeMemMB = (os.freemem() / (1024 * 1024)).toFixed(2);
            
            const message = `╭─━━━━━━━━━━━━━━━━━━━━─╮
│ 🐢 𝗦𝗜𝗟𝗔 𝗠𝗗   
│ ✦ Hello User 👋  
│ ✦ Welcome to the command menu
╰─━━━━━━━━━━━━━━━━━━━━─╯

┌───〔 📊 𝗦𝘆𝘀𝘁𝗲𝗺 𝗜𝗻𝗳𝗼 〕───┐
│• Version: 2.0.0
│• Prefix: ${PREFIX}
│• Total RAM: ${totalMemMB} MB
│• Free RAM: ${freeMemMB} MB
│• Uptime: ${hours}h ${minutes}m ${seconds}s
│• OS: ${os.type()}
│• Platform: ${os.platform()}
│• CPU Arch: ${os.arch()}
└────────────────────────┘

╭───《 ⚙️ 𝗕𝗼𝘁 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 》───╮
│• alive ☺️
│• ping ⚡
│• video 🎥
│• song 🎵
│• menu 📜
│• chid 🆔
│• freebot 🆓
│• setemoji 🐢
│• settings ⚙️
│• imagine 🎨
│• pair 🔐
│• play 🎧
│• sora 🎬
│• textmaker 🎭
│• tts 🔊
│• fb 📹
│• openai 🧠
│• ai 🤖
│• deepseek 👾
│• vv 👁️
│• apk 📱
│• ig 📸
│• tiktok 🎶
│• url 🔗
│• repo 📦
│• update 🔄
│• uptime ⏱️
│• restart ♻️
│• owner 👑
│• bot on/off 🔛
│• broadcast 📢
│• sticker ✂️
│• joke 😂
│• trt 🔤
╰─────────────────────────╯

╭───《 👥 𝗚𝗿𝗼𝘂𝗽 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀 》───╮
│• mute 🔇
│• unmute 🔊
│• delete 🗑️
│• kick 👢
│• tag 🏷️
│• tagall 📢
│• hidetag 🙈
│• kickall 🚫
│• getpic 📸
│• link 🔗
│• join ➕
│• add 👥
│• ginfo ℹ️
│• senddm 📨
│• listonline 👤
│• poll 📊
│• chatbot 💬
│• setgpp 🖼️
│• setgname 📝
│• setgdesc 📋
│• antitag ⚠️
│• warn ⚠️
│• clear 🧹
│• antilink 🔗
│• antimention 📢
│• ban 🚫
╰─────────────────────────╯

📢 Join our official channels & groups!
🎅 Merry Christmas from SILA MD! 🎄`;

            await socket.sendMessage(sender, { image: { url: botImg }, caption: message }, { quoted: msg });
          } catch (error) {
            await replygckavi(boterr);
          }
        }
        break;

        case 'ping': {
          await kavireact("🏓");
          const start = Date.now();
          const pingMsg = await socket.sendMessage(sender, { text: '🏓 Pinging...' }, { quoted: msg });
          const ping = Date.now() - start;
          await socket.sendMessage(sender, { text: `🏓 Pong! ${ping}ms`, edit: pingMsg.key });
        }
        break;

        case 'song':
        case 'play':
        case 'mp3':
        case 'audio':
        case 'music': {
          await kavireact("🎵");
          try {
            const q = args.join(" ");
            if (!q) {
              return await replygckavi("*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙽𝚈 𝙰𝚄𝙳𝙸𝙾 🥺*\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*.𝙿𝙻𝙰𝚈 ❮𝚈𝙾𝚄𝚁 𝙰𝚄𝙳𝙸𝙾 𝙽𝙰𝙼𝙴❯*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝙿𝙻𝙰𝚈❯ 𝙰𝙽𝙳 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄𝚁 𝙰𝚄𝙳𝙸𝙾 𝙽𝙰𝙼𝙴 ☺️ 𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙱𝙴 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙰𝙽𝙳 𝚂𝙴𝙽𝚃 𝙷𝙴𝚁𝙴 🥰💞*");
            }

            // Try different APIs
            let apiUrl = `https://api.nekolabs.my.id/downloader/youtube/play/v1?q=${encodeURIComponent(q)}`;
            try {
              const res = await axios.get(apiUrl);
              const data = res.data;

              if (data?.success && data?.result?.downloadUrl) {
                const meta = data.result.metadata;
                const dlUrl = data.result.downloadUrl;
                
                const caption = `*🐢 𝙰𝚄𝙳𝙸𝙾 𝙸𝙽𝙵𝙾 🐢*\n*🐢 𝙽𝙰𝙼𝙴 :❯ ${meta.title}*\n*🐢 𝙲𝙷𝙰𝙽𝙽𝙴𝙻 :❯ ${meta.channel}*\n*🐢 𝚃𝙸𝙼𝙴 :❯ ${meta.duration}*\n*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`;
                
                // Try to get thumbnail
                try {
                  const thumbRes = await axios.get(meta.cover, { responseType: 'arraybuffer' });
                  const buffer = Buffer.from(thumbRes.data, 'binary');
                  await socket.sendMessage(sender, { image: buffer, caption }, { quoted: msg });
                } catch {
                  await socket.sendMessage(sender, { text: caption }, { quoted: msg });
                }
                
                await socket.sendMessage(sender, {
                  audio: { url: dlUrl },
                  mimetype: "audio/mpeg",
                  fileName: `${meta.title.replace(/[\\/:*?"<>|]/g, "").slice(0, 80)}.mp3`
                }, { quoted: msg });
                return;
              }
            } catch { }

            // Fallback to original method
            const search = await yts(q);
            if (!search.videos.length) {
              return await replygckavi("🚫 No results found.");
            }
            const ytUrl = search.videos[0].url;
            
            const api = `https://sadiya-tech-apis.vercel.app/download/ytdl?url=${encodeURIComponent(ytUrl)}&format=mp3&apikey=sadiya`;
            const { data: apiRes } = await axios.get(api);

            if (!apiRes?.status || !apiRes.result?.download) {
              return await replygckavi("🚫 Something went wrong.");
            }

            const result = apiRes.result;
            const caption = `*ℹ️ Title :* \`${result.title}\`\n*⏱️ Duration :* \`${result.duration}\`\n*🧬 Views :* \`${result.views}\`\n📅 *Released Date :* \`${result.publish}\``;

            await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption: caption }, { quoted: msg });
            await socket.sendMessage(sender, { audio: { url: result.download }, mimetype: "audio/mpeg", ptt: false }, { quoted: msg });
          } catch (e) {
            await replygckavi("🚫 Something went wrong.");
          }
        }
        break;

        case 'fb': {
          await kavireact("📹");
          const fbUrl = args[0];
          if (!fbUrl) return await replygckavi("🚫 Please provide a valid Facebook URL.");
          
          try {
            const apiUrl = `https://api.siputzx.my.id/api/d/facebook?url=${encodeURIComponent(fbUrl)}`;
            const { data: apiRes } = await axios.get(apiUrl);
            
            if (!apiRes?.status || !apiRes?.result) {
              return await replygckavi("🚫 Something went wrong.");
            }
            
            const download_URL = apiRes.result.hd ? apiRes.result.hd : apiRes.result.sd;
            if (!download_URL) {
              return await replygckavi("🚫 Something went wrong.");
            }
            
            await socket.sendMessage(sender, { video: { url: download_URL }, mimetype: "video/mp4", caption: "Facebook video downloaded successfully! 🎬" }, { quoted: msg });
          } catch (error) {
            await replygckavi("🚫 Failed to download Facebook video.");
          }
        }
        break;

        case 'chid': {
          await kavireact("🆔");
          try {
            if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');
            if (!args[0]) return await replygckavi('ᴘʟᴇᴀsᴇ ᴘʀᴏᴠɪᴅᴇ ᴀ ᴄʜᴀɴɴᴇʟ ᴜʀʟ.\nᴇx: https://whatsapp.com/channel/1234567890');

            const match = args[0].match(/https:\/\/whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)/i);
            if (!match) return await replygckavi('ɪɴᴠᴀʟɪᴅ ᴄʜᴀɴɴᴇʟ ᴜʀʟ.\nᴇx: https://whatsapp.com/channel/1234567890');

            const channelId = match[1];
            const channelMeta = await socket.newsletterMetadata("invite", channelId);
            
            await replygckavi(`${channelMeta.id}`);
          } catch (e) {
            await replygckavi(boterr);
          }
        }
        break;

        case 'imagine':
        case 'aiimg':
        case 'flux':
        case 'fluxai':
        case 'aiimage': {
          await kavireact("🎨");
          try {
            const prompt = args.join(" ");
            if (!prompt) {
              return await replygckavi("*🎨 AI IMAGE GENERATOR*\n\nPlease provide a prompt for the image.\n\n*Example:* .imagine a beautiful sunset over mountains");
            }

            await socket.sendMessage(sender, { 
              text: `*🔄 CREATING IMAGE...*\n\n*Prompt:* ${prompt}\n\nPlease wait while I generate your image...`
            }, { quoted: msg });

            const apis = [
              { name: "Flux AI", url: `https://api.siputzx.my.id/api/ai/flux?prompt=${encodeURIComponent(prompt)}` },
              { name: "Stable Diffusion", url: `https://api.siputzx.my.id/api/ai/stable-diffusion?prompt=${encodeURIComponent(prompt)}` },
              { name: "Stability AI", url: `https://api.siputzx.my.id/api/ai/stabilityai?prompt=${encodeURIComponent(prompt)}` }
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
              await replygckavi("*❌ IMAGE GENERATION FAILED*\n\nAll AI services are currently unavailable. Please try again later.");
              return;
            }

            await socket.sendMessage(sender, {
              image: imageBuffer,
              caption: `*🎨 AI IMAGE GENERATED*\n\n*Prompt:* ${prompt}\n*Model:* ${apiUsed}\n*Powered by:* SILA MD MINI s1`
            }, { quoted: msg });
          } catch (error) {
            await replygckavi(`*❌ ERROR*\n\nFailed to generate image:\n${error.message || "Unknown error"}\n\nPlease try again with a different prompt.`);
          }
        }
        break;

        case 'pair': {
          await kavireact("🔐");
          try {
            const phoneNumber = args.join(" ").trim();
            if (!phoneNumber) {
              return await replygckavi("*𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝙵𝙾𝚁 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 ☺️*\n*𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇*\n\n*.𝙿𝙰𝙸𝚁 ❮+255612491554❯*\n\n*𝙸𝙽𝚂𝚃𝙴𝙰𝙳 𝙾𝙵 𝚃𝙷𝙸𝚂 𝙽𝚄𝙼𝙱𝙴𝚁 𝚆𝚁𝙸𝚃𝙴 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 𝙾𝙺 😊 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄 𝚆𝙸𝙻𝙻 𝙶𝙴𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 😃 𝚈𝙾𝚄 𝙲𝙰𝙽 𝙻𝙾𝙶𝙸𝙽 𝚆𝙸𝚃𝙷 𝚃𝙷𝙰𝚃 𝙿𝙰𝙸𝚁𝙸𝙽𝙶 𝙲𝙾𝙳𝙴 𝙸𝙽 𝚈𝙾𝚄𝚁 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 😌 𝚃𝙷𝙴𝙽 𝚂𝙸𝙻𝙰 𝙼𝙳 𝙼𝙸𝙽𝙸 𝙱𝙾𝚃 𝚆𝙸𝙻𝙻 𝙰𝙲𝚃𝙸𝚅𝙰𝚃𝙴 𝙾𝙽 𝚈𝙾𝚄𝚁 𝙽𝚄𝙼𝙱𝙴𝚁 😍*");
            }

            if (!phoneNumber.match(/^\+?\d{10,15}$/)) {
              return await replygckavi("*DO YOU WANT SILA MD MINI BOT PAIR CODE 🤔*\n*THEN WRITE LIKE THIS ☺️\n\n*PAIR +255612491554*\n\n*WHEN YOU WRITE LIKE THIS 😇 THEN YOU WILL GET SILA MD MINI BOT PAIR CODE 😃 YOU CAN LOGIN IN YOUR WHATSAPP 😍 YOUR MINI BOT WILL ACTIVATE 🥰*");
            }

            const HEROKU_APP_URL = 'https://nachoka.onrender.com';
            const baseUrl = `${HEROKU_APP_URL}/code?number=`;
            const response = await axios.get(`${baseUrl}${encodeURIComponent(phoneNumber)}`);

            if (!response.data || !response.data.code) {
              return await replygckavi("*PLEASE TRY AGAIN AFTER SOME TIME 🥺❤️*");
            }

            const pairingCode = response.data.code;
            await socket.sendMessage(sender, { text: `*🐢 SILA MD MINI BOT 🐢*\n*PAIR CODE: ${pairingCode}*\n\nEnter this code in WhatsApp to connect your bot! 🚀` }, { quoted: msg });
            
            await delay(1000);
            await socket.sendMessage(sender, { text: pairingCode }, { quoted: msg });
          } catch (error) {
            await replygckavi("*PAIR CODE IS NOT CONNECTING TO YOUR NUMBER ☹️*");
          }
        }
        break;

        case 'sora':
        case 'aivideo':
        case 'videogen':
        case 'text2video':
        case 'genvideo': {
          await kavireact("🎬");
          try {
            const text = args.join(" ").trim();
            if (!text) {
              return await replygckavi(`*🎥 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙾𝚁 🎥*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾𝚂 𝙵𝚁𝙾𝙼 𝚃𝙴𝚇𝚃 🎬*\n*𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*🎥 𝚂𝙾𝚁𝙰 ❮𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙿𝚁𝙾𝙼𝙿𝚃❯*\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n*• .sora a cat playing piano*\n*• .sora sunset over mountains*\n*• .sora futuristic city with flying cars*\n*• .sora underwater ocean scene*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝚂𝙾𝚁𝙰❯ 𝙰𝙽𝙳 𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙿𝚁𝙾𝙼𝙿𝚃 🎥*\n*𝙰𝙸 𝚆𝙸𝙻𝙻 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴 𝙰 𝚅𝙸𝙳𝙴𝙾 𝙵𝙾𝚁 𝚈𝙾𝚄 ✨*`);
            }

            await socket.sendMessage(sender, {
              text: `*🎬 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙽𝙶 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾...*\n\n*📝 𝙿𝚛𝚘𝚖𝚙𝚝: ${text}*\n*⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝, 𝚝𝚑𝚒𝚜 𝚖𝚊𝚢 𝚝𝚊𝚔𝚎 𝚊 𝚏𝚎𝚠 𝚖𝚒𝚗𝚞𝚝𝚎𝚜...*`
            }, { quoted: msg });

            const apiUrl = `https://okatsu-rolezapiiz.vercel.app/ai/txt2video?text=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { 
              responseType: 'arraybuffer',
              timeout: 120000 
            });

            const videoBuffer = Buffer.from(response.data, 'binary');
            await socket.sendMessage(sender, {
              video: videoBuffer,
              caption: `*🎥 𝙰𝙸 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙴𝙳 🎥*\n\n*📝 𝙿𝚛𝚘𝚖𝚙𝚝:* ${text}\n*🤖 𝙼𝚘𝚍𝚎𝚕:* SORA AI\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });
          } catch (error) {
            await replygckavi(`*❌ 𝚅𝙸𝙳𝙴𝙾 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛: ${error.message}*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚊 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚙𝚛𝚘𝚖𝚙𝚝.*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`);
          }
        }
        break;

        case 'textmaker':
        case 'text':
        case 'textgen':
        case 'styletext':
        case 'fancytext': {
          await kavireact("🎭");
          try {
            const [style, ...textParts] = args;
            const text = textParts.join(" ").trim();

            if (!style || !text) {
              return await replygckavi(`*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝚂𝚃𝚈𝙻𝙸𝚂𝙷 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴𝚂 ✨*\n\n*𝚄𝚂𝙰𝙶𝙴:*\n.textmaker <style> <text>\n\n*𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝚂𝚃𝚈𝙻𝙴𝚂:*\n• metallic - 3D Metal Text\n• ice - Ice Text Effect\n• snow - Snow 3D Text\n• impressive - Colorful Paint Text\n• matrix - Matrix Text Effect\n• light - Futuristic Light Text\n• neon - Colorful Neon Lights\n• devil - Neon Devil Wings\n• purple - Purple Text Effect\n• thunder - Thunder Text Effect\n• leaves - Green Brush Text\n• 1917 - 1917 Style Text\n• arena - Arena of Valor Cover\n• hacker - Anonymous Hacker\n• sand - Text on Sand\n• blackpink - Blackpink Style\n• glitch - Digital Glitch Text\n• fire - Flame Lettering\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n.textmaker metallic SILA\n.textmaker neon BOT\n.textmaker fire MD\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`);
            }

            const styles = {
              'metallic': '3D Metal Text', 'ice': 'Ice Text Effect', 'snow': 'Snow 3D Text',
              'impressive': 'Colorful Paint Text', 'matrix': 'Matrix Text Effect', 'light': 'Futuristic Light Text',
              'neon': 'Colorful Neon Lights', 'devil': 'Neon Devil Wings', 'purple': 'Purple Text Effect',
              'thunder': 'Thunder Text Effect', 'leaves': 'Green Brush Text', '1917': '1917 Style Text',
              'arena': 'Arena of Valor Cover', 'hacker': 'Anonymous Hacker', 'sand': 'Text on Sand',
              'blackpink': 'Blackpink Style', 'glitch': 'Digital Glitch Text', 'fire': 'Flame Lettering'
            };

            if (!styles[style]) {
              const availableStyles = Object.keys(styles).join(', ');
              return await replygckavi(`*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚂𝚃𝚈𝙻𝙴*\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚜𝚝𝚢𝚕𝚎𝚜:* ${availableStyles}\n\n*𝚄𝚜𝚎: .textmaker <style> <text>*\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .textmaker metallic SILA*`);
            }

            await socket.sendMessage(sender, {
              text: `*🎨 𝙲𝚁𝙴𝙰𝚃𝙸𝙽𝙶 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴...*\n\n*📝 𝚃𝚎𝚡𝚝: ${text}*\n*🎭 𝚂𝚝𝚢𝚕𝚎: ${styles[style]}*\n*⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...*`
            }, { quoted: msg });

            const apiUrl = `https://api.bk9.dev/textmaker/${style}?text=${encodeURIComponent(text)}`;
            const response = await axios.get(apiUrl, { 
              responseType: 'arraybuffer',
              timeout: 30000 
            });

            const imageBuffer = Buffer.from(response.data, 'binary');
            await socket.sendMessage(sender, {
              image: imageBuffer,
              caption: `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*📝 𝚃𝚎𝚡𝚝:* ${text}\n*🎭 𝚂𝚝𝚢𝚕𝚎:* ${styles[style]}\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });
          } catch (error) {
            await replygckavi(`*❌ 𝚃𝙴𝚇𝚃 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛: ${error.message}*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚝𝚎𝚡𝚝 𝚘𝚛 𝚜𝚝𝚢𝚕𝚎.*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`);
          }
        }
        break;

        case 'tts':
        case 'say':
        case 'speak': {
          await kavireact("🔊");
          try {
            const q = args.join(" ");
            if (!q) {
              return await replygckavi("*📢 Aap apna message likho jise voice me badalna hai!*\n\nExample:\n> .tts Hello World\n> .tts ur Assalamualaikum");
            }

            let voiceLang = "en";
            if (args[0] === "ur" || args[0] === "urdu") voiceLang = "ur";

            const ttsUrl = googleTTS.getAudioUrl(q, {
              lang: voiceLang,
              slow: false,
              host: "https://translate.google.com",
            });

            const { data } = await axios.get(ttsUrl, { responseType: "arraybuffer" });
            const audioBuffer = Buffer.from(data, "binary");

            await socket.sendMessage(sender, {
              audio: audioBuffer,
              mimetype: "audio/mp4",
              ptt: false,
            }, { quoted: msg });
          } catch (err) {
            await replygckavi(`❌ *Voice banate waqt error:* ${err.message}`);
          }
        }
        break;

        case 'video':
        case 'ytmp4':
        case 'mp4':
        case 'ytv': {
          await kavireact("🎥");
          try {
            const text = args.join(" ");
            if (!text) {
              return await replygckavi("*𝙳𝙾 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳 𝙰𝙽𝚈 𝚅𝙸𝙳𝙴𝙾 🥺*\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 😇*\n\n*𝚅𝙸𝙳𝙴𝙾 ❮𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴❯*\n\n*𝚆𝚁𝙸𝚃𝙴 𝙲𝙾𝙼𝙼𝙰𝙽𝙳 ❮𝚅𝙸𝙳𝙴𝙾❯ 𝙰𝙽𝙳 𝚃𝙷𝙴𝙽 𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙽𝙰𝙼𝙴 ☺️ 𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝚅𝙸𝙳𝙴𝙾 𝚆𝙸𝙻𝙻 𝙱𝙴 𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳𝙴𝙳 𝙰𝙽𝙳 𝚂𝙴𝙽𝚃 𝙷𝙴𝚁𝙴 🥰💞*");
            }

            const search = await yts(text);
            if (!search.videos.length) return await replygckavi("*MUJHE APKI VIDEO NAHI MIL RAHI SORRY 🥺❤️*");

            const data = search.videos[0];
            const ytUrl = data.url;

            const api = `https://gtech-api-xtp1.onrender.com/api/video/yt?apikey=APIKEY&url=${encodeURIComponent(ytUrl)}`;
            const { data: apiRes } = await axios.get(api);

            if (!apiRes?.status || !apiRes.result?.media?.video_url) {
              return await replygckavi("*𝚈𝙾𝚄𝚁 𝚅𝙸𝙳𝙴𝙾 𝙸𝚂 𝙽𝙾𝚃 𝙳𝙾𝙼𝙽𝙻𝙾𝙰𝙳𝙸𝙽𝙶 🥺 𝙿𝙻𝙴𝙰𝚂𝙴 𝚃𝚁𝚈 𝙰𝙶𝙰𝙸𝙽 ☺️*");
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
*⟪════════ ♢.✰.♢ ════════⟫*
`;

            const sentMsg = await socket.sendMessage(sender, { image: { url: result.thumbnail }, caption }, { quoted: msg });
            const messageID = sentMsg.key.id;

            // Handle response
            const messageHandler = async (msgData) => {
              const receivedMsg = msgData.messages[0];
              if (!receivedMsg?.message) return;

              const receivedText = receivedMsg.message.conversation || receivedMsg.message.extendedTextMessage?.text;
              const isReplyToBot = receivedMsg.message.extendedTextMessage?.contextInfo?.stanzaId === messageID;
              const senderID = receivedMsg.key.remoteJid;

              if (isReplyToBot && senderID === sender) {
                switch (receivedText.trim()) {
                  case "1":
                    await socket.sendMessage(senderID, { video: { url: result.video_url }, mimetype: "video/mp4" }, { quoted: receivedMsg });
                    break;
                  case "2":
                    await socket.sendMessage(senderID, { document: { url: result.video_url }, mimetype: "video/mp4", fileName: `${data.title}.mp4` }, { quoted: receivedMsg });
                    break;
                  default:
                    await socket.sendMessage(senderID, { text: "*🥺 Sirf 1 ya 2 reply me bhejo!*" }, { quoted: receivedMsg });
                }
                // Remove listener after handling
                socket.ev.off('messages.upsert', messageHandler);
              }
            };

            // Add temporary listener
            socket.ev.on('messages.upsert', messageHandler);
            
            // Remove listener after 60 seconds
            setTimeout(() => {
              socket.ev.off('messages.upsert', messageHandler);
            }, 60000);

          } catch (error) {
            await replygckavi("*😔 Video download nahi hui!*");
          }
        }
        break;

        case 'vv':
        case 'antivv':
        case 'avv':
        case 'viewonce':
        case 'open': {
          await kavireact("👁️");
          try {
            const fromMe = msg.key.fromMe;
            const isCreator = fromMe;
            const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

            if (!isCreator) return await replygckavi("🚫 Owner only command!");

            if (!quoted) {
              return await replygckavi("*𝙷𝙰𝚂 𝙰𝙽𝚈𝙾𝙽𝙴 𝚂𝙴𝙽𝚃 𝚈𝙾𝚄 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺 𝙰𝙽𝙳 𝚈𝙾𝚄 𝚆𝙰𝙽𝚃 𝚃𝙾 𝚂𝙴𝙴 𝙸𝚃 🤔*\n\n*𝚃𝙷𝙴𝙽 𝚆𝚁𝙸𝚃𝙴 𝙻𝙸𝙺𝙴 𝚃𝙷𝙸𝚂 ☺️*\n\n*❮𝚅𝚅❯*\n\n*𝚃𝙷𝙴𝙽 𝚃𝙷𝙰𝚃 𝙿𝚁𝙸𝚅𝙰𝚃𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 𝚆𝙸𝙻𝙻 𝙾𝙿𝙴𝙽 🥰*");
            }

            let type = Object.keys(quoted)[0];
            if (!["imageMessage", "videoMessage", "audioMessage"].includes(type)) {
              return await replygckavi("*𝚈𝙾𝚄 𝙾𝙽𝙻𝚈 𝙽𝙴𝙴𝙳 𝚃𝙾 𝙼𝙴𝙽𝚃𝙸𝙾𝙽 𝚃𝙷𝙴 𝙿𝙷𝙾𝚃𝙾, 𝚅𝙸𝙳𝙴𝙾 𝙾𝚁 𝙰𝚄𝙳𝙸𝙾 🥺*");
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
            await kavireact("😍");
          } catch (error) {
            await replygckavi(`*𝙿𝙻𝙴𝙰𝚂𝙴 𝚆𝚁𝙸𝚃𝙴 ❮𝚅𝚅❯ 𝙰𝙶𝙰𝙸𝙽 🥺*\n\n_Error:_ ${error.message}`);
          }
        }
        break;

        case 'openai':
        case 'chatgpt':
        case 'gpt3':
        case 'open-gpt': {
          await kavireact("🧠");
          try {
            if (!args.length) return await replygckavi("Please provide a message for OpenAI.\nExample: `.openai Hello`");

            const q = args.join(" ");
            const apiUrl = `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.result) {
              await kavireact("❌");
              return await replygckavi("OpenAI failed to respond. Please try again later.");
            }

            await replygckavi(`🧠 *OpenAI Response:*\n\n${data.result}`);
            await kavireact("✅");
          } catch (e) {
            await kavireact("❌");
            await replygckavi("An error occurred while communicating with OpenAI.");
          }
        }
        break;

        case 'ai':
        case 'bot':
        case 'dj':
        case 'gpt':
        case 'gpt4':
        case 'bing': {
          await kavireact("🤖");
          try {
            if (!args.length) return await replygckavi("Please provide a message for the AI.\nExample: `.ai Hello`");

            const q = args.join(" ");
            const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.message) {
              await kavireact("❌");
              return await replygckavi("AI failed to respond. Please try again later.");
            }

            await replygckavi(`🤖 *AI Response:*\n\n${data.message}`);
            await kavireact("✅");
          } catch (e) {
            await kavireact("❌");
            await replygckavi("An error occurred while communicating with the AI.");
          }
        }
        break;

        case 'deepseek':
        case 'deep':
        case 'seekai': {
          await kavireact("👾");
          try {
            if (!args.length) return await replygckavi("Please provide a message for DeepSeek AI.\nExample: `.deepseek Hello`");

            const q = args.join(" ");
            const apiUrl = `https://api.ryzendesu.vip/api/ai/deepseek?text=${encodeURIComponent(q)}`;
            const { data } = await axios.get(apiUrl);

            if (!data || !data.answer) {
              await kavireact("❌");
              return await replygckavi("DeepSeek AI failed to respond. Please try again later.");
            }

            await replygckavi(`👾 *DeepSeek AI Response:*\n\n${data.answer}`);
            await kavireact("✅");
          } catch (e) {
            await kavireact("❌");
            await replygckavi("An error occurred while communicating with DeepSeek AI.");
          }
        }
        break;

        case 'apk': {
          await kavireact("📱");
          try {
            const text = args.join(" ");
            if (!text) return await replygckavi("Please provide an app name.\nExample: `.apk whatsapp`");

            // Try first API
            try {
              const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(text)}/limit=1`;
              const { data } = await axios.get(apiUrl);
              
              if (data?.datalist?.list?.[0]) {
                const app = data.datalist.list[0];
                const caption = `*📱 App Info*\n\n*Name:* ${app.name}\n*Package:* ${app.package}\n*Version:* ${app.file?.vername}\n*Size:* ${(app.file?.filesize / 1024 / 1024).toFixed(2)} MB\n\n*Downloading...*`;
                
                await socket.sendMessage(sender, { 
                  image: { url: app.icon },
                  caption: caption 
                }, { quoted: msg });
                
                // Try to download APK
                try {
                  const downloadUrl = `https://api.bk9.dev/download/apk?id=${encodeURIComponent(app.package)}`;
                  const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
                  const apkBuffer = Buffer.from(response.data, 'binary');
                  
                  await socket.sendMessage(sender, {
                    document: apkBuffer,
                    fileName: `${app.name}.apk`,
                    mimetype: 'application/vnd.android.package-archive'
                  }, { quoted: msg });
                } catch {
                  await replygckavi("Could not download APK directly. Try searching on Google Play.");
                }
                return;
              }
            } catch { }

            // Fallback to second API
            const apiUrl2 = `https://api.bk9.dev/download/apk?id=${encodeURIComponent(text)}`;
            try {
              const response = await axios.get(apiUrl2, { responseType: 'arraybuffer' });
              const apkBuffer = Buffer.from(response.data, 'binary');
              
              await socket.sendMessage(sender, {
                document: apkBuffer,
                fileName: `${text}.apk`,
                mimetype: 'application/vnd.android.package-archive'
              }, { quoted: msg });
            } catch {
              await replygckavi("Could not find or download the requested APK.");
            }
          } catch (error) {
            await replygckavi("Failed to download APK. Please try again.");
          }
        }
        break;

        case 'ig':
        case 'instagram': {
          await kavireact("📸");
          try {
            const url = args[0];
            if (!url) return await replygckavi("Please provide an Instagram URL.\nExample: `.ig https://www.instagram.com/p/...`");

            const apiUrl = `https://delirius-apiofc.vercel.app/download/igv2?url=${url}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data?.result) {
              return await replygckavi("Failed to download Instagram content.");
            }

            const result = data.result;
            if (result.type === "image" && result.url) {
              await socket.sendMessage(sender, {
                image: { url: result.url },
                caption: "📸 Instagram Image Download\nPowered by SILA MD"
              }, { quoted: msg });
            } else if (result.type === "video" && result.url) {
              await socket.sendMessage(sender, {
                video: { url: result.url },
                caption: "🎬 Instagram Video Download\nPowered by SILA MD"
              }, { quoted: msg });
            } else if (result.media && Array.isArray(result.media)) {
              // Multiple media (carousel)
              for (const media of result.media) {
                if (media.type === "image") {
                  await socket.sendMessage(sender, {
                    image: { url: media.url }
                  }, { quoted: msg });
                } else if (media.type === "video") {
                  await socket.sendMessage(sender, {
                    video: { url: media.url }
                  }, { quoted: msg });
                }
                await delay(1000);
              }
            } else {
              await replygckavi("Unsupported Instagram content type.");
            }
          } catch (error) {
            await replygckavi("Failed to download Instagram content. Please check the URL and try again.");
          }
        }
        break;

        case 'tiktok': {
          await kavireact("🎶");
          try {
            const url = args[0];
            if (!url) return await replygckavi("Please provide a TikTok URL.\nExample: `.tiktok https://vm.tiktok.com/...`");

            const apiUrl = `https://delirius-apiofc.vercel.app/download/tiktok?url=${url}`;
            const { data } = await axios.get(apiUrl);

            if (!data?.status || !data?.result) {
              return await replygckavi("Failed to download TikTok video.");
            }

            const result = data.result;
            if (result.video) {
              await socket.sendMessage(sender, {
                video: { url: result.video },
                caption: `🎶 TikTok Video\n\n${result.description || "Powered by SILA MD"}`
              }, { quoted: msg });
            } else {
              await replygckavi("No video found in the TikTok URL.");
            }
          } catch (error) {
            await replygckavi("Failed to download TikTok video. Please check the URL and try again.");
          }
        }
        break;

        // Group commands
        case 'mute': {
          if (!isGroup) return await groupMessage();
          await kavireact("🔇");
          try {
            await socket.groupSettingUpdate(sender, 'announcement');
            await replygckavi("Group has been muted. Only admins can send messages.");
          } catch (error) {
            await replygckavi("Failed to mute group. I need admin permissions.");
          }
        }
        break;

        case 'unmute': {
          if (!isGroup) return await groupMessage();
          await kavireact("🔊");
          try {
            await socket.groupSettingUpdate(sender, 'not_announcement');
            await replygckavi("Group has been unmuted. Everyone can send messages.");
          } catch (error) {
            await replygckavi("Failed to unmute group. I need admin permissions.");
          }
        }
        break;

        case 'delete':
        case 'del': {
          if (!isGroup) return await groupMessage();
          await kavireact("🗑️");
          try {
            const quoted = msg.message?.extendedTextMessage?.contextInfo;
            if (quoted) {
              await socket.sendMessage(sender, { delete: quoted.stanzaId });
              await replygckavi("Message deleted successfully.");
            } else {
              await replygckavi("Reply to a message to delete it.");
            }
          } catch (error) {
            await replygckavi("Failed to delete message. I need admin permissions.");
          }
        }
        break;

        case 'kick': {
          if (!isGroup) return await groupMessage();
          await kavireact("👢");
          try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionedJid && mentionedJid[0]) {
              await socket.groupParticipantsUpdate(sender, [mentionedJid[0]], 'remove');
              await replygckavi(`User @${mentionedJid[0].split('@')[0]} has been kicked from the group.`);
            } else {
              await replygckavi("Please mention the user to kick.\nExample: .kick @user");
            }
          } catch (error) {
            await replygckavi("Failed to kick user. I need admin permissions.");
          }
        }
        break;

        case 'tag':
        case 'tagall':
        case 'hidetag': {
          if (!isGroup) return await groupMessage();
          await kavireact("🏷️");
          try {
            const metadata = await socket.groupMetadata(sender);
            const participants = metadata.participants;
            const mentions = participants.map(p => p.id);
            
            let text = args.join(" ") || "Attention everyone! 👋";
            if (command === 'hidetag') {
              text = "🙈 Hidden Tag\n\n" + text;
            }
            
            await socket.sendMessage(sender, {
              text: text,
              mentions: mentions
            }, { quoted: msg });
          } catch (error) {
            await replygckavi("Failed to tag members.");
          }
        }
        break;

        case 'kickall': {
          if (!isGroup) return await groupMessage();
          if (!isOwner) return await ownerMessage();
          await kavireact("🚫");
          try {
            const metadata = await socket.groupMetadata(sender);
            const participants = metadata.participants.filter(p => !p.admin);
            const participantIds = participants.map(p => p.id);
            
            if (participantIds.length > 0) {
              await socket.groupParticipantsUpdate(sender, participantIds, 'remove');
              await replygckavi(`Kicked ${participantIds.length} non-admin members from the group.`);
            } else {
              await replygckavi("No non-admin members to kick.");
            }
          } catch (error) {
            await replygckavi("Failed to kick all members. I need admin permissions.");
          }
        }
        break;

        case 'getpic': {
          if (!isGroup) return await groupMessage();
          await kavireact("📸");
          try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionedJid && mentionedJid[0]) {
              const profilePic = await socket.profilePictureUrl(mentionedJid[0], 'image');
              if (profilePic) {
                await socket.sendMessage(sender, {
                  image: { url: profilePic },
                  caption: `Profile picture of @${mentionedJid[0].split('@')[0]}`
                }, { quoted: msg });
              } else {
                await replygckavi("User has no profile picture.");
              }
            } else {
              await replygckavi("Please mention the user.\nExample: .getpic @user");
            }
          } catch (error) {
            await replygckavi("Failed to get profile picture.");
          }
        }
        break;

        case 'link': {
          if (!isGroup) return await groupMessage();
          await kavireact("🔗");
          try {
            const metadata = await socket.groupMetadata(sender);
            const inviteCode = await socket.groupInviteCode(sender);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            await replygckavi(`*Group Link:* ${inviteLink}\n\n*Group Name:* ${metadata.subject}\n*Members:* ${metadata.participants.length}`);
          } catch (error) {
            await replygckavi("Failed to get group link. I need admin permissions.");
          }
        }
        break;

        case 'join': {
          await kavireact("➕");
          try {
            const inviteCode = args[0];
            if (!inviteCode) return await replygckavi("Please provide a group invite code.\nExample: .join ABC123def456");

            await socket.groupAcceptInvite(inviteCode);
            await replygckavi("Successfully joined the group!");
          } catch (error) {
            await replygckavi("Failed to join group. Invalid invite code or I'm already in the group.");
          }
        }
        break;

        case 'add': {
          if (!isGroup) return await groupMessage();
          await kavireact("👥");
          try {
            const numbers = args;
            if (numbers.length === 0) return await replygckavi("Please provide phone numbers to add.\nExample: .add 255612491554 255789012345");

            const participants = numbers.map(num => num.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
            await socket.groupParticipantsUpdate(sender, participants, 'add');
            await replygckavi(`Added ${participants.length} user(s) to the group.`);
          } catch (error) {
            await replygckavi("Failed to add users. Make sure the numbers are valid and I have admin permissions.");
          }
        }
        break;

        case 'ginfo': {
          if (!isGroup) return await groupMessage();
          await kavireact("ℹ️");
          try {
            const metadata = await socket.groupMetadata(sender);
            const admins = metadata.participants.filter(p => p.admin).map(p => p.id.split('@')[0]);
            const owner = metadata.owner || metadata.participants.find(p => p.admin === 'superadmin')?.id.split('@')[0] || 'Unknown';
            
            const info = `*📊 Group Information*\n\n` +
                       `*Name:* ${metadata.subject}\n` +
                       `*ID:* ${metadata.id}\n` +
                       `*Owner:* ${owner}\n` +
                       `*Members:* ${metadata.participants.length}\n` +
                       `*Admins:* ${admins.length}\n` +
                       `*Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n` +
                       `*Description:* ${metadata.desc || 'No description'}`;
            
            await replygckavi(info);
          } catch (error) {
            await replygckavi("Failed to get group information.");
          }
        }
        break;

        case 'senddm': {
          if (!isGroup) return await groupMessage();
          if (!isOwner) return await ownerMessage();
          await kavireact("📨");
          try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            const message = args.slice(1).join(" ");
            
            if (mentionedJid && mentionedJid[0] && message) {
              await socket.sendMessage(mentionedJid[0], { text: message });
              await replygckavi(`DM sent to @${mentionedJid[0].split('@')[0]}`);
            } else {
              await replygckavi("Please mention a user and provide a message.\nExample: .senddm @user Hello there!");
            }
          } catch (error) {
            await replygckavi("Failed to send DM.");
          }
        }
        break;

        case 'listonline': {
          if (!isGroup) return await groupMessage();
          await kavireact("👤");
          try {
            const metadata = await socket.groupMetadata(sender);
            const onlineList = metadata.participants
              .map(p => `• @${p.id.split('@')[0]} ${p.id === socket.user.id ? '(Bot) 🐢' : ''}`)
              .join('\n');
            
            await socket.sendMessage(sender, {
              text: `*👥 Online Members (${metadata.participants.length})*\n\n${onlineList}`,
              mentions: metadata.participants.map(p => p.id)
            }, { quoted: msg });
          } catch (error) {
            await replygckavi("Failed to list online members.");
          }
        }
        break;

        case 'poll': {
          if (!isGroup) return await groupMessage();
          await kavireact("📊");
          try {
            const [question, ...options] = args.join(" ").split("|");
            if (!question || options.length < 2) {
              return await replygckavi("Please provide a question and at least 2 options separated by |\nExample: .poll Favorite color? | Red | Blue | Green");
            }

            const pollMessage = {
              poll: {
                name: question.trim(),
                values: options.map(opt => opt.trim()),
                selectableCount: 1
              }
            };
            
            await socket.sendMessage(sender, pollMessage, { quoted: msg });
          } catch (error) {
            await replygckavi("Failed to create poll. Make sure you're using the correct format.");
          }
        }
        break;

        case 'chatbot': {
          await kavireact("💬");
          try {
            const state = args[0]?.toLowerCase();
            if (state === 'on' || state === 'off') {
              await updateSettings(number, { autoai: state === 'on' ? "on" : "off" });
              await replygckavi(`Chatbot has been turned ${state}.`);
            } else {
              await replygckavi("Please specify 'on' or 'off'.\nExample: .chatbot on");
            }
          } catch (error) {
            await replygckavi("Failed to update chatbot settings.");
          }
        }
        break;

        case 'setgpp': {
          if (!isGroup) return await groupMessage();
          await kavireact("🖼️");
          try {
            const quoted = msg.message?.imageMessage;
            if (quoted) {
              const stream = await downloadContentFromMessage(quoted, 'image');
              let buffer = Buffer.from([]);
              for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
              
              await socket.updateProfilePicture(sender, buffer);
              await replygckavi("Group profile picture updated successfully.");
            } else {
              await replygckavi("Please send/reply with an image to set as group profile picture.");
            }
          } catch (error) {
            await replygckavi("Failed to set group profile picture. I need admin permissions.");
          }
        }
        break;

        case 'setgname': {
          if (!isGroup) return await groupMessage();
          await kavireact("📝");
          try {
            const newName = args.join(" ");
            if (!newName) return await replygckavi("Please provide a new group name.\nExample: .setgname My Awesome Group");

            await socket.groupUpdateSubject(sender, newName);
            await replygckavi(`Group name changed to: ${newName}`);
          } catch (error) {
            await replygckavi("Failed to change group name. I need admin permissions.");
          }
        }
        break;

        case 'setgdesc': {
          if (!isGroup) return await groupMessage();
          await kavireact("📋");
          try {
            const newDesc = args.join(" ");
            if (!newDesc) return await replygckavi("Please provide a new group description.\nExample: .setgdesc This is our group for discussions");

            await socket.groupUpdateDescription(sender, newDesc);
            await replygckavi("Group description updated successfully.");
          } catch (error) {
            await replygckavi("Failed to update group description. I need admin permissions.");
          }
        }
        break;

        case 'antitag':
        case 'antimention': {
          if (!isGroup) return await groupMessage();
          await kavireact("⚠️");
          try {
            const state = args[0]?.toLowerCase();
            if (state === 'on' || state === 'off') {
              await updateSettings(number, { 
                antitag: state === 'on' ? "on" : "off" 
              });
              await replygckavi(`Anti-tag/mention has been turned ${state}.`);
            } else {
              const current = setting.antitag || "off";
              await replygckavi(`Anti-tag/mention is currently: ${current}\n\nUse: .antitag on/off`);
            }
          } catch (error) {
            await replygckavi("Failed to update anti-tag settings.");
          }
        }
        break;

        case 'warn': {
          if (!isGroup) return await groupMessage();
          await kavireact("⚠️");
          try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionedJid && mentionedJid[0]) {
              const warning = args.slice(1).join(" ") || "Please follow group rules!";
              await socket.sendMessage(sender, {
                text: `⚠️ WARNING @${mentionedJid[0].split('@')[0]}\n\n${warning}`,
                mentions: [mentionedJid[0]]
              }, { quoted: msg });
            } else {
              await replygckavi("Please mention the user to warn.\nExample: .warn @user Stop spamming");
            }
          } catch (error) {
            await replygckavi("Failed to warn user.");
          }
        }
        break;

        case 'clear': {
          if (!isGroup) return await groupMessage();
          await kavireact("🧹");
          try {
            // This would typically clear chat, but WhatsApp Web doesn't support clearing group chats
            await replygckavi("To clear chat, please use WhatsApp's built-in clear chat feature.\n\nFor individual chats, you can use WhatsApp's 'Clear chat' option.");
          } catch (error) {
            await replygckavi("Failed to clear chat.");
          }
        }
        break;

        case 'antilink': {
          if (!isGroup) return await groupMessage();
          await kavireact("🔗");
          try {
            const state = args[0]?.toLowerCase();
            if (state === 'on' || state === 'off') {
              await updateSettings(number, { 
                antilink: state === 'on' ? true : false 
              });
              await replygckavi(`Anti-link has been turned ${state}.`);
            } else {
              const current = setting.antilink ? "on" : "off";
              await replygckavi(`Anti-link is currently: ${current}\n\nUse: .antilink on/off`);
            }
          } catch (error) {
            await replygckavi("Failed to update anti-link settings.");
          }
        }
        break;

        case 'ban': {
          if (!isGroup) return await groupMessage();
          if (!isOwner) return await ownerMessage();
          await kavireact("🚫");
          try {
            const mentionedJid = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
            if (mentionedJid && mentionedJid[0]) {
              await socket.groupParticipantsUpdate(sender, [mentionedJid[0]], 'remove');
              // Add to banned list (you would need to implement this in settings)
              await replygckavi(`User @${mentionedJid[0].split('@')[0]} has been banned from the group.`);
            } else {
              await replygckavi("Please mention the user to ban.\nExample: .ban @user");
            }
          } catch (error) {
            await replygckavi("Failed to ban user. I need admin permissions.");
          }
        }
        break;

        // Additional commands
        case 'alive': {
          await kavireact("☺️");
          await replygckavi(`*🐢 SILA MD MINI BOT 🐢*\n\n*Status:* 🟢 Online\n*Version:* 2.0.0\n*Owner:* +255612491554\n\n*Powered by SILA TECH*`);
        }
        break;

        case 'url': {
          await kavireact("🔗");
          await replygckavi(`*🔗 Bot URL:*\https://sila-free-bot.onrender.com\n\n*📱 Pair your number:*\n.pair YOUR_NUMBER\n\n*Example:* .pair +255612491554`);
        }
        break;

        case 'repo': {
          await kavireact("📦");
          await replygckavi(`*📦 SILA MD Repository*\n\n*GitHub:* https://github.com/Sila-Md/SILA-MD\n*Bot URL:* https://sila-free-bot.onrender.com\n\n*For updates, join our channels!*`);
        }
        break;

        case 'update': {
          if (!isOwner) return await ownerMessage();
          await kavireact("🔄");
          await replygckavi("*🔄 Updating...*\n\nPlease wait while I check for updates...\n\n*Status:* Up to date ✅\n*Version:* 1.0.0");
        }
        break;

        case 'uptime': {
          await kavireact("⏱️");
          const startTime = socketCreationTime.get(number) || Date.now();
          const uptime = Math.floor((Date.now() - startTime) / 1000);
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = Math.floor(uptime % 60);
          
          await replygckavi(`*⏱️ Uptime*\n\n*Bot has been running for:*\n${hours}h ${minutes}m ${seconds}s\n\n*Since:* ${new Date(startTime).toLocaleString()}`);
        }
        break;

        case 'restart': {
          if (!isOwner) return await ownerMessage();
          await kavireact("♻️");
          await replygckavi("*♻️ Restarting bot...*\n\nPlease wait a few seconds...");
          
          // Close socket
          if (activeSockets.has(number)) {
            activeSockets.get(number).ws?.close();
            activeSockets.delete(number);
            socketCreationTime.delete(number);
          }
          
          // Restart after delay
          setTimeout(() => {
            cyberkaviminibot(number, { headersSent: true, status: () => ({ send: () => {} }) });
          }, 3000);
        }
        break;

        case 'owner': {
          await kavireact("👑");
          await replygckavi(`*👑 Bot Owner*\n\n*Name:* SILA TECH\n*Number:* +255612491554\n*Channel:* @SILA_TECH\n\n*Contact for support or queries!*`);
        }
        break;

        case 'bot': {
          if (!isOwner) return await ownerMessage();
          await kavireact("🔛");
          const state = args[0]?.toLowerCase();
          if (state === 'on' || state === 'off') {
            await updateSettings(number, { worktype: state === 'on' ? 'public' : 'private' });
            await replygckavi(`*Bot has been turned ${state}.*\n\n*Note:* This affects who can use the bot.`);
          } else {
            await replygckavi("*Bot Control*\n\n*Usage:* .bot on/off\n\n*on:* Public mode (everyone can use)\n*off:* Private mode (owner only)");
          }
        }
        break;

        case 'broadcast':
        case 'bc': {
          if (!isOwner) return await ownerMessage();
          await kavireact("📢");
          const message = args.join(" ");
          if (!message) return await replygckavi("Please provide a message to broadcast.\nExample: .broadcast Hello everyone!");

          const sessions = await Session.find();
          let sentCount = 0;
          
          for (const session of sessions) {
            try {
              await socket.sendMessage(session.number + '@s.whatsapp.net', { 
                text: `*📢 BROADCAST MESSAGE*\n\n${message}\n\n*From:* SILA MD Owner`
              });
              sentCount++;
              await delay(1000); // Avoid rate limiting
            } catch (error) {
              console.log(`Failed to send to ${session.number}:`, error.message);
            }
          }
          
          await replygckavi(`*📢 Broadcast Completed*\n\n*Sent to:* ${sentCount} users\n*Failed:* ${sessions.length - sentCount} users`);
        }
        break;

        case 'trt': {
          await kavireact("🔤");
          const text = args.join(" ");
          if (!text) return await replygckavi("Please provide text to translate.\nExample: .trt Hello world");

          try {
            const apiUrl = `https://api.siputzx.my.id/api/ai/translate?text=${encodeURIComponent(text)}&to=en`;
            const { data } = await axios.get(apiUrl);
            
            if (data?.result) {
              await replygckavi(`*🔤 Translation*\n\n*Original:* ${text}\n*Translated:* ${data.result}`);
            } else {
              await replygckavi("Failed to translate text.");
            }
          } catch (error) {
            await replygckavi("Translation service unavailable.");
          }
        }
        break;

        case 'sticker':
        case 's': {
          await kavireact("✂️");
          const quoted = msg.message?.imageMessage || msg.message?.videoMessage;
          if (quoted) {
            try {
              const type = quoted.imageMessage ? 'image' : 'video';
              const stream = await downloadContentFromMessage(quoted, type);
              let buffer = Buffer.from([]);
              for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

              await socket.sendMessage(sender, {
                sticker: buffer,
                mimetype: type === 'image' ? 'image/webp' : 'video/webp'
              }, { quoted: msg });
            } catch (error) {
              await replygckavi("Failed to create sticker. Make sure the image/video is not too large.");
            }
          } else {
            await replygckavi("Please send/reply with an image or video to convert to sticker.");
          }
        }
        break;

        case 'joke': {
          await kavireact("😂");
          try {
            const jokes = [
              "Why don't scientists trust atoms? Because they make up everything!",
              "Why did the scarecrow win an award? He was outstanding in his field!",
              "What do you call fake spaghetti? An impasta!",
              "Why don't eggs tell jokes? They'd crack each other up!",
              "What do you call a bear with no teeth? A gummy bear!",
              "Why did the math book look so sad? Because it had too many problems!",
              "What do you call a snowman with a six-pack? An abdominal snowman!",
              "Why did the bicycle fall over? Because it was two-tired!",
              "What do you call a fish wearing a bowtie? Sofishticated!",
              "Why can't your nose be 12 inches long? Because then it would be a foot!"
            ];
            
            const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            await replygckavi(`*😂 Joke of the Day*\n\n${randomJoke}\n\n*Powered by SILA MD*`);
          } catch (error) {
            await replygckavi("I'm too tired to tell jokes right now! 😴");
          }
        }
        break;

        case 'settings':
        case 'setting':
        case 'set': {
          if (!isOwner) return await replygckavi('🚫 Only owner can use this command.');
          await kavireact("⚙️");
          let kavitext = `*🛠️ 𝙼𝚒𝚗𝚒 𝙱𝚘𝚝 𝚂𝚎𝚝𝚝𝚒𝚗𝚐𝚜 🛠️*


┌━━━━━➢
├*〖 1 〗 ＷＯＲＫ ＴＹＰＥ* 🛠️
├━━ 1.1 ➣ ɪɴʙᴏx 📥
├━━ 1.2 ➣ ɢʀᴏᴜᴘ 🗨️
├━━ 1.3 ➣ ᴘʀɪᴠᴀᴛᴇ 🔒
├━━ 1.4 ➣ ᴘᴜʙʟɪᴄ 🌐
└━━━━━➢

┌━━━━━➢
├*〖 2 〗 ＡＬＷＡＹＳ ＯＮＬＸ𝙽𝙴* 🌟
├━━ 2.1 ➣ ᴇɴᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 💡
├━━ 2.2 ➣ ᴅɪsᴀʙʟᴇ ʙᴏᴛ ᴏɴʟɪɴᴇ 🔌
└━━━━━➢

┌━━━━━➢
├*〖 3 〗 ＡＵＴＯ ＲＥＡＤ ＳＴＡＴＵＳ* 📖
├━━ 3.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ✅
├━━ 3.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴀᴅsᴛᴀᴛᴜs ❌
└━━━━━➢

┌━━━━━➢
├*〖 4 〗 ＡＵＴＯ ＲＥＣＯＲ𝙳* 🎙️
├━━ 4.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴄᴏʀᴅ ✅
├━━ 4.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏʀᴇᴄᴏʀᴅ ❌
└━━━━━➢

┌━━━━━➢
├*〖 5 〗 ＡＵＴＯ ＴＹＰ𝙴* ⌨️
├━━ 5.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏᴛʏᴘᴇ ✅
├━━ 5.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏᴛʏᴘᴇ ❌
└━━━━━➢

┌━━━━━➢
├*〖 6 〗 ＡＵＴＯ ＲＥＡ𝙳* 👁️🚫
├━━ 6.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ ✅
├━━ 6.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏ ʀᴇᴀᴅ ❌
└━━━━━➢

┌━━━━━➢
├*〖 7 〗 ＡＵＴＯ Ｌ𝐼𝐾𝐸 𝑆𝑇𝐴𝑇𝑈𝑆* 💚👀
├━━ 7.1 ➣ ᴇɴᴀʙʟᴇ ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs ✅
├━━ 7.2 ➣ ᴅɪsᴀʙʟᴇ ᴀᴜᴛᴏ ʟɪᴋᴇ sᴛᴀᴛᴜs ❌
└━━━━━➢`;

          await socket.sendMessage(sender, { image: { url: botImg }, caption: kavitext }, { quoted: msg });
        }
        break;

        default:
          // Handle group events
          if (msg.message?.groupInviteMessage) {
            await groupEvents.handleGroupUpdate(socket, {
              id: sender,
              participants: [msg.key.participant || socket.user.id],
              action: "add"
            });
          }
        break;
      }
    } catch (error) {
      console.error("Command error:", error);
    }
  });
}

async function kavixmdminibotstatushandler(socket, number) {
  socket.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg || !msg.message) return;

    const sender = msg.key.remoteJid;
    const fromMe = msg.key.fromMe;
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
}

async function sessionDownload(sessionId, number, retries = 3) {
  const sanitizedNumber = number.replace(/[^0-9]/g, '');
  const sessionPath = path.join(SESSION_BASE_PATH, `session_${sanitizedNumber}`);
  const credsFilePath = path.join(sessionPath, 'creds.json');

  // For MongoDB sessions
  if (sessionId.includes('MONGO-')) {
    try {
      const sessionDoc = await Session.findOne({ number: sanitizedNumber });
      
      if (sessionDoc && sessionDoc.creds) {
        await fs.ensureDir(sessionPath);
        await fs.writeFile(credsFilePath, JSON.stringify(sessionDoc.creds, null, 2));
        return { success: true, path: credsFilePath };
      } else {
        return { success: false, error: 'MongoDB session not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // For local sessions
  if (sessionId.includes('SESSION-LOCAL-')) {
    if (fs.existsSync(credsFilePath)) {
      return { success: true, path: credsFilePath };
    } else {
      return { success: false, error: 'Local session file not found' };
    }
  }

  return { success: false, error: 'Invalid session ID format' };
}

async function uploadCredsToMongoDB(credsPath, number) {
  try {
    const sanitizedNumber = number.replace(/[^0-9]/g, '');
    const credsContent = await fs.readFile(credsPath, 'utf8');
    const creds = JSON.parse(credsContent);
    
    await Session.findOneAndUpdate(
      { number: sanitizedNumber },
      { 
        creds: creds,
        updatedAt: new Date()
      },
      { upsert: true }
    );
    
    return `MONGO-${sanitizedNumber}-${Date.now()}`;
  } catch (error) {
    console.error('Error saving creds to MongoDB:', error);
    // Fallback to local storage
    return `SESSION-LOCAL-${Date.now()}`;
  }
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
              await Session.findOneAndDelete({ number: sanitizedNumber });
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
              await Session.findOneAndDelete({ number: sanitizedNumber });
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
              await Session.findOneAndDelete({ number: sanitizedNumber });
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

          const sessionId = await uploadCredsToMongoDB(filePath, sanitizedNumber);
          const userId = await socket.decodeJid(socket.user.id);
          await Session.findOneAndUpdate({ number: userId }, { sessionId: sessionId }, { upsert: true, new: true });     
          await socket.sendMessage(userId, { text: `*╭━━━〔 🐢 𝚂𝙸𝙻𝙰 𝙼𝙳 🐢 〕━━━┈⊷*\n*┃🐢│ 𝙱𝙾𝚃 𝙲𝙾𝙽𝙽𝙴𝙲𝚃𝙴𝙳 𝚂𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈!*\n*┃🐢│ 𝚃𝙸𝙼𝙴 :❯ ${new Date().toLocaleString()}*\n*┃🐢│ 𝚂𝚃𝙰𝚃𝚄𝚂 :❯ 𝙾𝙽𝙻𝙸𝙽𝙴 𝙰𝙽𝙳 𝚁𝙴𝙰𝙳𝚈!*\n*╰━━━━━━━━━━━━━━━┈⊷*\n\n*📢 Make sure to join our channels and groups!*` });

        } catch (e) {
          console.log('Error saving session:', e.message);
        }
 
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
    console.log(`[ ${sanitizedNumber} ] Setup error:`, error.message);
    
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
    const sessions = await Session.find();
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
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { router, startAllSessions };
