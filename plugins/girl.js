module.exports = {
  command: "girl",
  alias: ["gurl", "randomgirl"],
  desc: "Tuma video random ya girl (18+)",
  react: "🔥",
  category: "download",

  execute: async (sock, msg) => {
    try {
      const from = msg.key.remoteJid;
      const pushname = msg.pushName || "User";

      // Presence: typing
      await sock.sendPresenceUpdate("composing", from);

      // List yako ya video (19 links)
      const girlVideos = [
        "https://telegra.ph/file/26e4dff45a31ee8225dd3.mp4",
        "https://telegra.ph/file/cbec7f1fb107e3a6ad22d.mp4",
        "https://telegra.ph/file/ba0aaf03ebca2093f69fe.mp4",
        "https://telegra.ph/file/a11bcb3cfc79b41d0cec7.mp4",
        "https://telegra.ph/file/d70b16f3d6bc1e27ea165.mp4",
        "https://telegra.ph/file/1390e9e192bb7e464f64d.mp4",
        "https://telegra.ph/file/94836946afaff5cda50b5.mp4",
        "https://telegra.ph/file/064258e8efeb464549b5b.mp4",
        "https://telegra.ph/file/ccbb0ca9f95f6a4443217.mp4",
        "https://telegra.ph/file/ad88681101c0cf868805b.mp4",
        "https://telegra.ph/file/0f01359df3d7607aed4cf.mp4",
        "https://telegra.ph/file/288614816d53ac8eae38f.mp4",
        "https://telegra.ph/file/09e2f3d9c01b2305784fa.mp4",
        "https://l.top4top.io/m_196632pm21.mp4",
        "https://k.top4top.io/m_196696fby1.mp4",
        "https://i.top4top.io/m_19665qrmn1.mp4",
        "https://j.top4top.io/m_19660pebi1.mp4",
        "https://d.top4top.io/m_1966zo5kt1.mp4",
        "https://h.top4top.io/m_19662lgzi1.mp4"
      ];

      // Chagua random
      const randomVideo = girlVideos[Math.floor(Math.random() * girlVideos.length)];

      const caption = `
🔥 *RANDOM GIRL VIDEO* 🔥
╭────────────────⭓
│ 👤 Requested by: ${pushname}
│ 🎥 Content: Premium Girl Clip
│ 🔢 Total clips: 19
│ ⚡ Powered by: Sila free Bot
╰────────────────⭓`;

      // Send video moja kwa moja
      await sock.sendMessage(from, {
        video: { url: randomVideo },
        caption: caption,
        mimetype: "video/mp4"
      }, { quoted: msg });

      // React baada ya kutuma
      await sock.sendReact(from, { text: "✅", key: msg.key });

    } catch (err) {
      console.error("Girl command error:", err);
      await sock.sendMessage(from, {
        text: `❌ Hitilafu: ${err.message || "Video haikupatikana"}`
      }, { quoted: msg });
    }
  }
};
