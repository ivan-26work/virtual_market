// auth-admin.js - Authentification admin avec règles strictes
// Utilise window.supabase

// Identifiants admin autorisés (seuls ceux-ci fonctionnent)
const ADMIN_EMAIL = 'virtualbymeg@gmail.com';
const ADMIN_PHONES = ['0503588336', '0799843487'];

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
    console.log('✅ Page auth admin chargée');
    verifierSessionExistante();
    
    tabs.login.addEventListener('click', () => activerOnglet('login'));
    tabs.register.addEventListener('click', () => activerOnglet('register'));
    
    forms.login.addEventListener('submit', handleLogin);
    forms.register.addEventListener('submit', handleRegister);
});

// Vérifier si déjà connecté
async function verifierSessionExistante() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            // Vérifier si c'est bien l'admin
            const email = session.user.email;
            const phone = session.user.user_metadata?.phone;
            
            if (email === ADMIN_EMAIL && ADMIN_PHONES.includes(phone)) {
                window.location.href = 'profil-admin.html';
            } else {
                // Pas admin, déconnexion
                await window.supabase.auth.signOut();
            }
        }
    } catch (error) {
        console.error('Erreur vérification session:', error);
    }
}

// Activer un onglet
function activerOnglet(onglet) {
    tabs.login.classList.toggle('active', onglet === 'login');
    tabs.register.classList.toggle('active', onglet === 'register');
    
    forms.login.classList.toggle('active', onglet === 'login');
    forms.register.classList.toggle('active', onglet === 'register');
    
    messageDiv.style.display = 'none';
    messageDiv.className = 'auth-message';
}

// Afficher un message
function showMessage(message, type = 'error') {
    messageDiv.innerHTML = `<i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${message}`;
    messageDiv.className = `auth-message ${type}`;
    messageDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Nettoyer le téléphone (enlever espaces)
function cleanPhone(phone) {
    return phone.replace(/\s+/g, '');
}

// Valider les identifiants admin
function estAdminValide(email, phone) {
    const phoneClean = cleanPhone(phone);
    return email === ADMIN_EMAIL && ADMIN_PHONES.includes(phoneClean);
}

// Gestion de la connexion admin
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const phone = document.getElementById('login-phone').value.trim();
    const password = document.getElementById('login-password').value;
    
    const loginBtn = document.getElementById('login-btn');
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
    
    try {
        // Vérifier d'abord les identifiants admin
        if (!estAdminValide(email, phone)) {
            showMessage('Accès non autorisé');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            return;
        }
        
        // Tentative de connexion
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Mettre à jour les métadonnées avec le téléphone
        await window.supabase.auth.updateUser({
            data: { phone: cleanPhone(phone), role: 'admin' }
        });
        
        showMessage('Connexion admin réussie !', 'success');
        
        setTimeout(() => {
            window.location.href = 'profil-admin.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erreur connexion admin:', error);
        showMessage('Email ou mot de passe incorrect');
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
}

// Gestion de l'inscription admin
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
    const registerBtn = document.getElementById('register-btn');
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription...';
    
    try {
        // Validations strictes
        if (!name || !email || !phone || !password || !confirm) {
            showMessage('Tous les champs sont requis');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        // Vérifier identifiants admin
        if (!estAdminValide(email, phone)) {
            showMessage('Inscription non autorisée');
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
            showMessage('Mot de passe trop court (6 caractères minimum)');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
            return;
        }
        
        // Inscription
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    phone: cleanPhone(phone),
                    role: 'admin',
                    avatar_letter: name.charAt(0).toUpperCase()
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            showMessage('Inscription admin réussie ! Connexion...', 'success');
            
            // Connexion automatique
            const { error: loginError } = await window.supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (!loginError) {
                setTimeout(() => {
                    window.location.href = 'profil-admin.html';
                }, 1500);
            }
        }
        
    } catch (error) {
        console.error('Erreur inscription admin:', error);
        showMessage(error.message || 'Erreur lors de l\'inscription');
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
    }
}

// Déconnexion admin
window.logoutAdmin = async () => {
    await window.supabase.auth.signOut();
    window.location.href = 'index.html';
};