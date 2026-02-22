// auth.js - Authentification Supabase avec téléphone et commune
// Utilise window.supabase (défini dans supabase.js)

// Éléments DOM
const tabs = {
    login: document.getElementById('tab-login'),
    register: document.getElementById('tab-register')
};

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form')
};

const messageDiv = document.getElementById('auth-message');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page auth chargée');
    verifierSessionExistante();
    
    tabs.login.addEventListener('click', () => activerOnglet('login'));
    tabs.register.addEventListener('click', () => activerOnglet('register'));
    
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);
    
    // Validation téléphone en temps réel
    const phoneInput = document.getElementById('register-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', validerTelephone);
    }
});

// Vérifier si déjà connecté
async function verifierSessionExistante() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            // Déjà connecté, rediriger vers accueil
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Erreur vérification session:', error);
    }
}

// Activer un onglet
function activerOnglet(onglet) {
    // Mettre à jour les classes des onglets
    tabs.login.classList.toggle('active', onglet === 'login');
    tabs.register.classList.toggle('active', onglet === 'register');
    
    // Afficher le formulaire correspondant
    forms.login.classList.toggle('active', onglet === 'login');
    forms.register.classList.toggle('active', onglet === 'register');
    
    // Cacher les messages
    messageDiv.style.display = 'none';
    messageDiv.className = 'auth-message';
}

// Afficher un message
function showMessage(message, type = 'error') {
    messageDiv.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.display = 'block';
    
    // Auto-cacher après 5 secondes pour les succès
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Valider le format du téléphone ivoirien
function validerTelephone(e) {
    let phone = e.target.value.replace(/\s+/g, '');
    
    // Format auto
    if (phone.length === 12 && phone.startsWith('+225')) {
        // +225 XX XX XX XX
        let formatted = phone.replace(/(\+225)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        e.target.value = formatted;
    } else if (phone.length === 10 && phone.startsWith('05')) {
        // 05 XX XX XX XX
        let formatted = phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        e.target.value = formatted;
    }
}

// Valider téléphone avant soumission
function estTelephoneValide(phone) {
    const phoneSansEspaces = phone.replace(/\s+/g, '');
    const regex225 = /^\+225\d{8}$/;
    const regex05 = /^05\d{8}$/;
    
    return regex225.test(phoneSansEspaces) || regex05.test(phoneSansEspaces);
}

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Désactiver le bouton pendant la requête
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    try {
        if (!email || !password) {
            showMessage('Veuillez remplir tous les champs');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            return;
        }
        
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Connexion réussie
        showMessage('Connexion réussie ! Redirection...', 'success');
        
        // Sauvegarder email pour affichage
        localStorage.setItem('vm_user_email', email);
        
        // Rediriger vers l'accueil après 1.5 secondes
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        showMessage(error.message || 'Erreur lors de la connexion');
        
        // Réactiver le bouton
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
}

// Gestion de l'inscription
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const commune = document.getElementById('register-commune').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    // Désactiver le bouton pendant la requête
    const registerBtn = document.getElementById('register-btn');
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
    
    try {
        // Validations
        if (!name || !email || !phone || !commune || !password || !confirm) {
            showMessage('Veuillez remplir tous les champs');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        if (!estTelephoneValide(phone)) {
            showMessage('Format de téléphone invalide. Utilisez +225 XX XX XX XX ou 05 XX XX XX XX');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        if (password !== confirm) {
            showMessage('Les mots de passe ne correspondent pas');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        if (password.length < 6) {
            showMessage('Le mot de passe doit contenir au moins 6 caractères');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        // Nettoyer le téléphone pour stockage
        const phoneClean = phone.replace(/\s+/g, '');
        
        // Inscription avec Supabase
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    phone: phoneClean,
                    commune: commune,
                    avatar_letter: email.charAt(0).toUpperCase()
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            // Inscription réussie - Création du profil automatique
            showMessage('Inscription réussie ! Création de votre profil...', 'success');
            
            // Connexion automatique
            const { error: loginError } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (!loginError) {
                localStorage.setItem('vm_user_email', email);
                localStorage.setItem('vm_user_name', name);
                localStorage.setItem('vm_user_phone', phoneClean);
                localStorage.setItem('vm_user_commune', commune);
                
                // Rediriger vers profil.html pour compléter
                setTimeout(() => {
                    window.location.href = 'profil.html?new=true';
                }, 2000);
            } else {
                // Si erreur connexion automatique, rediriger vers login
                setTimeout(() => {
                    activerOnglet('login');
                }, 2000);
            }
        }
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        showMessage(error.message || 'Erreur lors de l\'inscription');
        
        // Réactiver le bouton
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
    }
}

// Fonction utilitaire pour le débogage
window.getSession = async () => {
    try {
        const { data } = await window.supabase.auth.getSession();
        console.log('Session:', data);
        return data;
    } catch (error) {
        console.error('Erreur:', error);
    }
};

// Fonction de déconnexion (utile pour test)
window.logout = async () => {
    try {
        await window.supabase.auth.signOut();
        localStorage.removeItem('vm_user_email');
        localStorage.removeItem('vm_user_name');
        localStorage.removeItem('vm_user_phone');
        localStorage.removeItem('vm_user_commune');
        console.log('Déconnecté');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
};