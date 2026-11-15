
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const pino = require("pino");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");
  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: false,
    browser: ["Fareeds MD", "Chrome", "1.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  if (!sock.authState.creds.registered) {
    const num = "923XXXXXXXXX";
    setTimeout(async () => {
      let code = await sock.requestPairingCode(num);
      console.log("PAIRING CODE:", code);
    }, 3000);
  }

  sock.ev.on("connection.update", (u) => {
    const { connection, lastDisconnect } = u;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log("Fareeds MD Connected!");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
    const from = msg.key.remoteJid;

    if (text === ".ping") {
      await sock.sendMessage(from, { text: "Pong! Fareeds MD Online 🔥" });
    }
    if (text === ".menu") {
      await sock.sendMessage(from, { text: "*FAREEDS MD MENU*\n\n.ping - Check Bot\n.menu - Show Menu\n.owner - Owner Info" });
    }
    if (text === ".owner") {
      await sock.sendMessage(from, { text: "Owner: Fareed 👑" });
    }
  });
}
startBot();
