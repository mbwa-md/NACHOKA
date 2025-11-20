// plugins/song.js
const yts = require('yt-search');
const axios = require('axios');

module.exports = {
    commands: ['song', 'yta'],
    execute: async (socket, msg, {
        command,
        args,
        sender,
        number,
        isOwner,
        setting,
        replygckavi,
        kavireact
    }) => {
        try {
            const q = args.join(" ");
            if (!q) {
                return await replygckavi("🚫 Please provide a search query.");
            }

            let ytUrl;
            if (q.includes("youtube.com") || q.includes("youtu.be")) {
                ytUrl = q;
            } else {
                const search = await yts(q);

                if (!search.videos.length) {
                    return await replygckavi("🚫 No results found.");
                }
                ytUrl = search.videos[0].url;
            }

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
};
