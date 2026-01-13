const axios = require('axios');

module.exports = {
    command: "textmaker",
    alias: ["text", "textgen", "styletext", "fancytext"],
    desc: "Generate stylish text images",
    category: "creator",
    react: "🎨",
    filename: __filename,

    execute: async (sock, msg, args) => {
        try {
            const from = msg.key.remoteJid;
            const [style, ...textParts] = args;
            const text = textParts.join(" ").trim();

            if (!style || !text) {
                return await sock.sendMessage(from, {
                    text: `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*𝙲𝚁𝙴𝙰𝚃𝙴 𝚂𝚃𝚈𝙻𝙸𝚂𝙷 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴𝚂 ✨*\n\n*𝚄𝚂𝙰𝙶𝙴:*\n.textmaker <style> <text>\n\n*𝙰𝚅𝙰𝙸𝙻𝙰𝙱𝙻𝙴 𝚂𝚃𝚈𝙻𝙴𝚂:*\n• metallic - 3D Metal Text\n• ice - Ice Text Effect\n• snow - Snow 3D Text\n• impressive - Colorful Paint Text\n• matrix - Matrix Text Effect\n• light - Futuristic Light Text\n• neon - Colorful Neon Lights\n• devil - Neon Devil Wings\n• purple - Purple Text Effect\n• thunder - Thunder Text Effect\n• leaves - Green Brush Text\n• 1917 - 1917 Style Text\n• arena - Arena of Valor Cover\n• hacker - Anonymous Hacker\n• sand - Text on Sand\n• blackpink - Blackpink Style\n• glitch - Digital Glitch Text\n• fire - Flame Lettering\n\n*𝙴𝚇𝙰𝙼𝙿𝙻𝙴𝚂:*\n.textmaker metallic SILA\n.textmaker neon BOT\n.textmaker fire MD\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
                }, { quoted: msg });
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
                return await sock.sendMessage(from, {
                    text: `*❌ 𝙸𝙽𝚅𝙰𝙻𝙸𝙳 𝚂𝚃𝚈𝙻𝙴*\n\n*𝙰𝚟𝚊𝚒𝚕𝚊𝚋𝚕𝚎 𝚜𝚝𝚢𝚕𝚎𝚜:* ${availableStyles}\n\n*𝚄𝚜𝚎: .textmaker <style> <text>*\n*𝙴𝚡𝚊𝚖𝚙𝚕𝚎: .textmaker metallic SILA*`
                }, { quoted: msg });
            }

            await sock.sendMessage(from, {
                text: `*🎨 𝙲𝚁𝙴𝙰𝚃𝙸𝙽𝙶 𝚃𝙴𝚇𝚃 𝙸𝙼𝙰𝙶𝙴...*\n\n*📝 𝚃𝚎𝚡𝚝: ${text}*\n*🎭 𝚂𝚝𝚢𝚕𝚎: ${styles[style]}*\n*⏳ 𝙿𝚕𝚎𝚊𝚜𝚎 𝚠𝚊𝚒𝚝...*`
            }, { quoted: msg });

            // Using a generic text maker API
            const apiUrl = `https://api.bk9.dev/textmaker/${style}?text=${encodeURIComponent(text)}`;
            
            const response = await axios.get(apiUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000 
            });

            const imageBuffer = Buffer.from(response.data, 'binary');

            await sock.sendMessage(from, {
                image: imageBuffer,
                caption: `*🎨 𝚃𝙴𝚇𝚃 𝙼𝙰𝙺𝙴𝚁 🎨*\n\n*📝 𝚃𝚎𝚡𝚝:* ${text}\n*🎭 𝚂𝚝𝚢𝚕𝚎:* ${styles[style]}\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });

        } catch (error) {
            console.error('TextMaker Error:', error);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `*❌ 𝚃𝙴𝚇𝚃 𝙶𝙴𝙽𝙴𝚁𝙰𝚃𝙸𝙾𝙽 𝙵𝙰𝙸𝙻𝙴𝙳*\n\n*𝙴𝚛𝚛𝚘𝚛: ${error.message}*\n*𝚃𝚛𝚢 𝚊𝚐𝚊𝚒𝚗 𝚠𝚒𝚝𝚑 𝚍𝚒𝚏𝚏𝚎𝚛𝚎𝚗𝚝 𝚝𝚎𝚡𝚝 𝚘𝚛 𝚜𝚝𝚢𝚕𝚎.*\n\n*✨ 𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 𝚂𝙸𝙻𝙰 𝙼𝙳*`
            }, { quoted: msg });
        }
    }
};
