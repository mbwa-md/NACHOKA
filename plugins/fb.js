// plugins/fb.js
const axios = require('axios');

module.exports = {
    commands: ['fb'],
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
        const fbUrl = args[0];
        if (!fbUrl) return await replygckavi("🚫 Please provide a valid Facebook URL.");

        const apiUrl = `https://sadiya-tech-apis.vercel.app/download/fbdl?url=${encodeURIComponent(fbUrl)}&apikey=sadiya`;
        const { data: apiRes } = await axios.get(apiUrl);

        if (!apiRes?.status || !apiRes?.result) {
            return await replygckavi("🚫 Something went wrong.");
        }

        const download_URL = apiRes.result.hd ? apiRes.result.hd : apiRes.result.sd;

        if (!download_URL) {
            return await replygckavi("🚫 Something went wrong.");
        }

        await socket.sendMessage(sender, { video: { url: download_URL }, mimetype: "video/mp4", caption: "Podda ayiya...." }, { quoted: msg });
    }
};
