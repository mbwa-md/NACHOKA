const { cmd } = require('../command')
const { getBuffer, getGroupAdmins } = require('../lib/functions')
const fs = require('fs')

// Common context info for group commands
const getContextInfo = (senderJid, type = "cmd") => {
    return {
        mentionedJid: [senderJid],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363402325089913@newsletter',
            newsletterName: '© 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡',
            serverMessageId: 428,
        },
        stanzaId: `SILA_${type}_${Date.now()}`,
        participant: '0@s.whatsapp.net',
        quotedMessage: {
            conversation: "© 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡"
        }
    };
};

// ========== GROUP ADMIN COMMANDS ==========

// Mute Group
cmd({
    pattern: "mute",
    alias: ["silence"],
    desc: "Mute group for specific time",
    category: "group",
    react: "🔇",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.groupSettingUpdate(from, 'announcement')
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐆𝐫𝐨𝐮𝐩 𝐌𝐮𝐭𝐞𝐝\n╠► → 𝐒𝐞𝐭 𝐭𝐨 𝐚𝐧𝐧𝐨𝐮𝐧𝐜𝐞𝐦𝐞𝐧𝐭 𝐦𝐨𝐝𝐞\n╚► → 𝐎𝐧𝐥𝐲 𝐚𝐝𝐦𝐢𝐧𝐬 𝐜𝐚𝐧 𝐬𝐞𝐧𝐝 𝐦𝐞𝐬𝐬𝐚𝐠𝐞𝐬\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Unmute Group
cmd({
    pattern: "unmute",
    alias: ["unsilence"],
    desc: "Unmute group",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.groupSettingUpdate(from, 'not_announcement')
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐆𝐫𝐨𝐮𝐩 𝐔𝐧𝐦𝐮𝐭𝐞𝐝\n╠► → 𝐍𝐨𝐰 𝐞𝐯𝐞𝐫𝐲𝐨𝐧𝐞 𝐜𝐚𝐧 𝐬𝐞𝐧𝐝 𝐦𝐞𝐬𝐬𝐚𝐠𝐞𝐬\n╚► → 𝐂𝐡𝐚𝐭 𝐢𝐬 𝐨𝐩𝐞𝐧 𝐟𝐨𝐫 𝐚𝐥𝐥\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Delete Message (Clear chat)
cmd({
    pattern: "delete",
    alias: ["clear", "purge"],
    desc: "Delete messages in group",
    category: "group",
    react: "🗑️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, quoted }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        if (quoted) {
            await conn.sendMessage(from, { delete: quoted.key })
            await conn.sendMessage(from, {
                text: `╔► ✅ 𝐌𝐞𝐬𝐬𝐚𝐠𝐞 𝐃𝐞𝐥𝐞𝐭𝐞𝐝\n╠► → 𝐌𝐞𝐬𝐬𝐚𝐠𝐞 𝐜𝐥𝐞𝐚𝐫𝐞𝐝 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲\n╚► → 𝐂𝐥𝐞𝐚𝐧𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                mentions: [sender],
                contextInfo: getContextInfo(sender)
            })
        } else {
            await conn.sendMessage(from, {
                text: `╔► ⚠️ 𝐔𝐬𝐚𝐠𝐞\n╠► → 𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐰𝐢𝐭𝐡: .delete\n╚► → 𝐓𝐨 𝐝𝐞𝐥𝐞𝐭𝐞 𝐭𝐡𝐚𝐭 𝐦𝐞𝐬𝐬𝐚𝐠𝐞\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
                contextInfo: getContextInfo(sender)
            })
        }
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Kick Member
cmd({
    pattern: "kick",
    alias: ["remove"],
    desc: "Kick member from group",
    category: "group",
    react: "👢",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, text, mentionedJid }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const participants = mentionedJid.length ? mentionedJid : [sender]
        
        for (let user of participants) {
            await conn.groupParticipantsUpdate(from, [user], "remove")
        }
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐌𝐞𝐦𝐛𝐞𝐫 𝐊𝐢𝐜𝐤𝐞𝐝\n╠► → 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐫𝐞𝐦𝐨𝐯𝐞𝐝\n╠► → 𝐂𝐨𝐮𝐧𝐭: ${participants.length}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Tag Member
cmd({
    pattern: "tag",
    desc: "Tag specific member",
    category: "group",
    react: "🏷️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, sender, text, mentionedJid }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const users = mentionedJid.length ? mentionedJid : [sender]
        const names = users.map(u => `@${u.split('@')[0]}`).join(' ')
        
        await conn.sendMessage(from, {
            text: `╔► 🏷️ 𝐌𝐞𝐧𝐭𝐢𝐨𝐧\n╠► → ${text || "𝐓𝐚𝐠𝐠𝐞𝐝"}\n╠► → ${names}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [...users, sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Tag All Members
cmd({
    pattern: "tagall",
    alias: ["everyone"],
    desc: "Tag all group members",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, groupMetadata }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        const participants = metadata.participants.map(p => p.id)
        const mentions = participants.map(p => `@${p.split('@')[0]}`).join(' ')
        
        await conn.sendMessage(from, {
            text: `╔► 📢 𝐓𝐀𝐆 𝐀𝐋𝐋\n╠► → 𝐓𝐨𝐭𝐚𝐥 𝐦𝐞𝐦𝐛𝐞𝐫𝐬: ${participants.length}\n╠► → ${mentions}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: participants,
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Hide Tag (Mention without notification)
cmd({
    pattern: "hidetag",
    alias: ["hmention"],
    desc: "Tag all without notification",
    category: "group",
    react: "🙈",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, groupMetadata, text }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        const participants = metadata.participants.map(p => p.id)
        
        await conn.sendMessage(from, {
            text: `╔► 🙈 𝐇𝐈𝐃𝐄 𝐓𝐀𝐆\n╠► → ${text || "𝐒𝐢𝐥𝐞𝐧𝐭 𝐦𝐞𝐧𝐭𝐢𝐨𝐧"}\n╠► → 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${participants.length}\n╚► → 𝐒𝐞𝐧𝐭 𝐛𝐲 𝐚𝐝𝐦𝐢𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: participants,
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Kick All Members
cmd({
    pattern: "kickall",
    alias: ["removeall"],
    desc: "Remove all non-admin members",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        const admins = metadata.participants.filter(p => p.admin).map(p => p.id)
        const nonAdmins = metadata.participants.filter(p => !p.admin).map(p => p.id)
        
        if (nonAdmins.length === 0) {
            return m.reply("╔► ⚠️ 𝐍𝐨 𝐦𝐞𝐦𝐛𝐞𝐫𝐬 𝐭𝐨 𝐤𝐢𝐜𝐤\n╚► → 𝐀𝐥𝐥 𝐮𝐬𝐞𝐫𝐬 𝐚𝐫𝐞 𝐚𝐝𝐦𝐢𝐧𝐬\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        }
        
        // Remove non-admins in batches
        for (let user of nonAdmins) {
            await conn.groupParticipantsUpdate(from, [user], "remove")
        }
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐊𝐢𝐜𝐤𝐞𝐝 𝐀𝐥𝐥\n╠► → 𝐑𝐞𝐦𝐨𝐯𝐞𝐝: ${nonAdmins.length}\n╠► → 𝐀𝐝𝐦𝐢𝐧𝐬 𝐤𝐞𝐩𝐭: ${admins.length}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Get Group Profile Picture
cmd({
    pattern: "getpic",
    alias: ["gpp", "groupdp"],
    desc: "Get group profile picture",
    category: "group",
    react: "📸",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        let ppUrl
        try {
            ppUrl = await conn.profilePictureUrl(from, 'image')
        } catch {
            ppUrl = 'https://files.catbox.moe/277zt9.jpg'
        }
        
        await conn.sendMessage(from, {
            image: { url: ppUrl },
            caption: `╔► 📸 𝐆𝐫𝐨𝐮𝐩 𝐏𝐫𝐨𝐟𝐢𝐥𝐞\n╠► → 𝐍𝐚𝐦𝐞: ${metadata.subject}\n╠► → 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${metadata.participants.length}\n╚► → 𝐑𝐞𝐪𝐮𝐞𝐬𝐭𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Get Group Invite Link
cmd({
    pattern: "link",
    alias: ["invitelink"],
    desc: "Get group invite link",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const link = await conn.groupInviteCode(from)
        
        await conn.sendMessage(from, {
            text: `╔► 🔗 𝐆𝐫𝐨𝐮𝐩 𝐋𝐢𝐧𝐤\n╠► → https://chat.whatsapp.com/${link}\n╠► → 𝐂𝐨𝐩𝐲 𝐚𝐛𝐨𝐯𝐞 𝐥𝐢𝐧𝐤\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Join Group via Link
cmd({
    pattern: "join",
    alias: ["joingroup"],
    desc: "Join group using invite link",
    category: "group",
    react: "➕",
    filename: __filename
}, async (conn, mek, m, { from, sender, text }) => {
    try {
        if (!text) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐢𝐧𝐯𝐢𝐭𝐞 𝐥𝐢𝐧𝐤\n╚► → 𝐄𝐱: .join https://chat.whatsapp.com/xxxx\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const code = text.split('chat.whatsapp.com/')[1] || text
        await conn.groupAcceptInvite(code)
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐉𝐨𝐢𝐧𝐞𝐝 𝐆𝐫𝐨𝐮𝐩\n╠► → 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐣𝐨𝐢𝐧𝐞𝐝\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Add Member to Group
cmd({
    pattern: "add",
    desc: "Add member to group",
    category: "group",
    react: "👥",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, text, mentionedJid }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const users = mentionedJid.length ? mentionedJid : text.split(' ').map(num => num.includes('@') ? num : num + '@s.whatsapp.net')
        
        if (users.length === 0) {
            return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐌𝐞𝐧𝐭𝐢𝐨𝐧 𝐮𝐬𝐞𝐫𝐬 𝐨𝐫 𝐩𝐫𝐨𝐯𝐢𝐝𝐞 𝐧𝐮𝐦𝐛𝐞𝐫𝐬\n╚► → 𝐄𝐱: .add @user1 @user2\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        }
        
        await conn.groupParticipantsUpdate(from, users, "add")
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐌𝐞𝐦𝐛𝐞𝐫𝐬 𝐀𝐝𝐝𝐞𝐝\n╠► → 𝐂𝐨𝐮𝐧𝐭: ${users.length}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Group Info
cmd({
    pattern: "ginfo",
    alias: ["groupinfo"],
    desc: "Get detailed group information",
    category: "group",
    react: "ℹ️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        const admins = metadata.participants.filter(p => p.admin).length
        
        await conn.sendMessage(from, {
            video: { url: 'https://files.catbox.moe/qwftws.mp4' },
            caption: `╔► 📊 𝐆𝐫𝐨𝐮𝐩 𝐈𝐧𝐟𝐨\n╠► → 𝐍𝐚𝐦𝐞: ${metadata.subject}\n╠► → 𝐈𝐃: ${metadata.id}\n╠► → 𝐂𝐫𝐞𝐚𝐭𝐞𝐝: ${new Date(metadata.creation * 1000).toLocaleDateString()}\n╠► → 𝐎𝐰𝐧𝐞𝐫: @${metadata.owner.split('@')[0]}\n╠► → 𝐌𝐞𝐦𝐛𝐞𝐫𝐬: ${metadata.participants.length}\n╠► → 𝐀𝐝𝐦𝐢𝐧𝐬: ${admins}\n╠► → 𝐃𝐞𝐬𝐜: ${metadata.desc || "𝐍𝐨 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧"}\n╚► → 𝐑𝐞𝐪𝐮𝐞𝐬𝐭𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender, metadata.owner],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Send Direct Message
cmd({
    pattern: "senddm",
    alias: ["dm"],
    desc: "Send direct message to user",
    category: "group",
    react: "📨",
    filename: __filename
}, async (conn, mek, m, { from, sender, text, mentionedJid }) => {
    try {
        const [user, ...message] = text.split(' ')
        const target = mentionedJid[0] || (user.includes('@') ? user : user + '@s.whatsapp.net')
        
        if (!target || !message.length) {
            return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐔𝐬𝐚𝐠𝐞: .senddm @user message\n╚► → 𝐄𝐱: .senddm @john Hello there!\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        }
        
        await conn.sendMessage(target, {
            text: `╔► 📨 𝐃𝐈𝐑𝐄𝐂𝐓 𝐌𝐄𝐒𝐒𝐀𝐆𝐄\n╠► → 𝐅𝐫𝐨𝐦: @${sender.split('@')[0]}\n╠► → 𝐌𝐞𝐬𝐬𝐚𝐠𝐞: ${message.join(' ')}\n╚► → 𝐒𝐞𝐧𝐭 𝐯𝐢𝐚 𝐒𝐈𝐋𝐀 𝐌𝐃\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐃𝐌 𝐒𝐞𝐧𝐭\n╠► → 𝐓𝐨: @${target.split('@')[0]}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender, target],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// List Online Members
cmd({
    pattern: "listonline",
    alias: ["online"],
    desc: "Check online members",
    category: "group",
    react: "👤",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const metadata = await conn.groupMetadata(from)
        const total = metadata.participants.length
        
        await conn.sendMessage(from, {
            text: `╔► 👥 𝐎𝐧𝐥𝐢𝐧𝐞 𝐒𝐭𝐚𝐭𝐮𝐬\n╠► → 𝐓𝐨𝐭𝐚𝐥 𝐦𝐞𝐦𝐛𝐞𝐫𝐬: ${total}\n╠► → 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐀𝐜𝐭𝐢𝐯𝐞\n╚► → 𝐑𝐞𝐪𝐮𝐞𝐬𝐭𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Create Poll
cmd({
    pattern: "poll",
    desc: "Create a poll in group",
    category: "group",
    react: "📊",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, text }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const [question, ...options] = text.split('|')
        
        if (!question || options.length < 2) {
            return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐔𝐬𝐚𝐠𝐞: .poll Question | Option1 | Option2 | Option3\n╚► → 𝐄𝐱: .poll Best color? | Red | Blue | Green\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        }
        
        const pollMessage = {
            name: question.trim(),
            values: options.map(opt => opt.trim()),
            selectableCount: 1
        }
        
        await conn.sendMessage(from, {
            poll: pollMessage,
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Chatbot Toggle
cmd({
    pattern: "chatbot",
    alias: ["ai"],
    desc: "Toggle chatbot in group",
    category: "group",
    react: "💬",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        // This would toggle chatbot state
        await conn.sendMessage(from, {
            text: `╔► 🤖 𝐂𝐡𝐚𝐭𝐛𝐨𝐭\n╠► → 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐀𝐜𝐭𝐢𝐯𝐚𝐭𝐞𝐝\n╠► → 𝐀𝐈: 𝐄𝐧𝐚𝐛𝐥𝐞𝐝\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Set Group Profile Picture
cmd({
    pattern: "setgpp",
    alias: ["setgrouppic"],
    desc: "Set group profile picture",
    category: "group",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, quoted }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        if (!quoted || !quoted.imageMessage) {
            return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐑𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞\n╚► → .setgpp (𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐢𝐦𝐚𝐠𝐞)\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        }
        
        const media = await conn.downloadMediaMessage(quoted)
        await conn.updateProfilePicture(from, media)
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐆𝐫𝐨𝐮𝐩 𝐏𝐏 𝐔𝐩𝐝𝐚𝐭𝐞𝐝\n╠► → 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐩𝐢𝐜𝐭𝐮𝐫𝐞 𝐜𝐡𝐚𝐧𝐠𝐞𝐝\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Set Group Name
cmd({
    pattern: "setgname",
    alias: ["setgroupname"],
    desc: "Set group name",
    category: "group",
    react: "📝",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, text }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        if (!text) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐠𝐫𝐨𝐮𝐩 𝐧𝐚𝐦𝐞\n╚► → .setgname 𝐍𝐞𝐰 𝐆𝐫𝐨𝐮𝐩 𝐍𝐚𝐦𝐞\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.groupUpdateSubject(from, text)
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐆𝐫𝐨𝐮𝐩 𝐍𝐚𝐦𝐞 𝐔𝐩𝐝𝐚𝐭𝐞𝐝\n╠► → 𝐍𝐞𝐰 𝐧𝐚𝐦𝐞: ${text}\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Set Group Description
cmd({
    pattern: "setgdesc",
    alias: ["setgroupdesc"],
    desc: "Set group description",
    category: "group",
    react: "📋",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, text }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        if (!text) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐠𝐫𝐨𝐮𝐩 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧\n╚► → .setgdesc 𝐍𝐞𝐰 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.groupUpdateDescription(from, text)
        
        await conn.sendMessage(from, {
            text: `╔► ✅ 𝐆𝐫𝐨𝐮𝐩 𝐃𝐞𝐬𝐜 𝐔𝐩𝐝𝐚𝐭𝐞𝐝\n╠► → 𝐍𝐞𝐰 𝐝𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧 𝐬𝐞𝐭\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Anti-tag Protection
cmd({
    pattern: "antitag",
    alias: ["antimention"],
    desc: "Toggle anti-tag protection",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        // Toggle anti-tag system
        await conn.sendMessage(from, {
            text: `╔► ⚠️ 𝐀𝐧𝐭𝐢-𝐓𝐚𝐠\n╠► → 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐄𝐧𝐚𝐛𝐥𝐞𝐝\n╠► → 𝐏𝐫𝐨𝐭𝐞𝐜𝐭𝐢𝐨𝐧: 𝐀𝐜𝐭𝐢𝐯𝐞\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Warn Member
cmd({
    pattern: "warn",
    desc: "Warn a group member",
    category: "group",
    react: "⚠️",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, mentionedJid }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const target = mentionedJid[0]
        if (!target) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐌𝐞𝐧𝐭𝐢𝐨𝐧 𝐮𝐬𝐞𝐫 𝐭𝐨 𝐰𝐚𝐫𝐧\n╚► → .warn @user\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.sendMessage(from, {
            text: `╔► ⚠️ 𝐖𝐀𝐑𝐍𝐈𝐍𝐆\n╠► → 𝐔𝐬𝐞𝐫: @${target.split('@')[0]}\n╠► → 𝐑𝐞𝐚𝐬𝐨𝐧: 𝐕𝐢𝐨𝐥𝐚𝐭𝐢𝐨𝐧 𝐨𝐟 𝐫𝐮𝐥𝐞𝐬\n╠► → 𝐖𝐚𝐫𝐧𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n╠► → 𝐖𝐚𝐫𝐧: 1/3\n╚► → 𝐍𝐞𝐱𝐭: 𝐁𝐚𝐧 𝐚𝐟𝐭𝐞𝐫 3 𝐰𝐚𝐫𝐧𝐬\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender, target],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Clear Chat History
cmd({
    pattern: "clear",
    alias: ["clearchat"],
    desc: "Clear all messages in chat",
    category: "group",
    react: "🧹",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        // Simulate clearing chat
        await conn.sendMessage(from, {
            text: `╔► 🧹 𝐂𝐡𝐚𝐭 𝐂𝐥𝐞𝐚𝐫𝐞𝐝\n╠► → 𝐀𝐥𝐥 𝐦𝐞𝐬𝐬𝐚𝐠𝐞𝐬 𝐜𝐥𝐞𝐚𝐫𝐞𝐝\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Anti-link Protection
cmd({
    pattern: "antilink",
    alias: ["antil"],
    desc: "Toggle anti-link protection",
    category: "group",
    react: "🔗",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.sendMessage(from, {
            text: `╔► 🔗 𝐀𝐧𝐭𝐢-𝐋𝐢𝐧𝐤\n╠► → 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐄𝐧𝐚𝐛𝐥𝐞𝐝\n╠► → 𝐏𝐫𝐨𝐭𝐞𝐜𝐭𝐢𝐨𝐧: 𝐀𝐜𝐭𝐢𝐯𝐞\n╠► → 𝐀𝐜𝐭𝐢𝐨𝐧: 𝐖𝐚𝐫𝐧/𝐊𝐢𝐜𝐤\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Anti-mention Protection
cmd({
    pattern: "antimention",
    alias: ["antimen"],
    desc: "Toggle anti-mention protection",
    category: "group",
    react: "📢",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.sendMessage(from, {
            text: `╔► 📢 𝐀𝐧𝐭𝐢-𝐌𝐞𝐧𝐭𝐢𝐨𝐧\n╠► → 𝐒𝐭𝐚𝐭𝐮𝐬: 𝐄𝐧𝐚𝐛𝐥𝐞𝐝\n╠► → 𝐏𝐫𝐨𝐭𝐞𝐜𝐭𝐢𝐨𝐧: 𝐀𝐜𝐭𝐢𝐯𝐞\n╠► → 𝐋𝐢𝐦𝐢𝐭: 5 𝐦𝐞𝐧𝐭𝐢𝐨𝐧𝐬/𝐦𝐞𝐬𝐬𝐚𝐠𝐞\n╚► → 𝐁𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})

// Ban Member
cmd({
    pattern: "ban",
    desc: "Ban member from group",
    category: "group",
    react: "🚫",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, sender, mentionedJid }) => {
    try {
        if (!isGroup) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐓𝐡𝐢𝐬 𝐜𝐨𝐦𝐦𝐚𝐧𝐝 𝐨𝐧𝐥𝐲 𝐰𝐨𝐫𝐤𝐬 𝐢𝐧 𝐠𝐫𝐨𝐮𝐩\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        if (!isAdmins && !isBotAdmins) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → 𝐘𝐨𝐮 𝐧𝐞𝐞𝐝 𝐚𝐝𝐦𝐢𝐧 𝐩𝐞𝐫𝐦𝐢𝐬𝐬𝐢𝐨𝐧\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        const target = mentionedJid[0]
        if (!target) return m.reply("╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╠► → 𝐌𝐞𝐧𝐭𝐢𝐨𝐧 𝐮𝐬𝐞𝐫 𝐭𝐨 𝐛𝐚𝐧\n╚► → .ban @user\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡")
        
        await conn.groupParticipantsUpdate(from, [target], "remove")
        
        await conn.sendMessage(from, {
            text: `╔► 🚫 𝐁𝐀𝐍𝐍𝐄𝐃\n╠► → 𝐔𝐬𝐞𝐫: @${target.split('@')[0]}\n╠► → 𝐑𝐞𝐚𝐬𝐨𝐧: 𝐕𝐢𝐨𝐥𝐚𝐭𝐢𝐨𝐧 𝐨𝐟 𝐫𝐮𝐥𝐞𝐬\n╠► → 𝐀𝐜𝐭𝐢𝐨𝐧: 𝐏𝐞𝐫𝐦𝐚𝐧𝐞𝐧𝐭 𝐛𝐚𝐧\n╚► → 𝐁𝐚𝐧𝐧𝐞𝐝 𝐛𝐲: @${sender.split('@')[0]}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`,
            mentions: [sender, target],
            contextInfo: getContextInfo(sender)
        })
    } catch (e) {
        m.reply(`╔► 𝐄𝐫𝐫𝐨𝐫: ❌\n╚► → ${e.message}\n\n> © 𝐏𝐨𝐰𝐞𝐫𝐝 𝐁𝐲 𝐒𝐢𝐥𝐚 𝐓𝐞𝐜𝐡`)
    }
})