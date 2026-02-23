// auth.js - Version complète avec villes et insertion table utilisateurs

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
    
    // Remplir la liste des villes (communes + Jacqueville, Bonoua)
    remplirListeVilles();
});

// Remplir le select des villes
function remplirListeVilles() {
    const select = document.getElementById('register-commune');
    if (!select) return;
    
    const villes = [
        // Communes d'Abidjan
        { value: 'Abobo', label: 'Abobo' },
        { value: 'Adjamé', label: 'Adjamé' },
        { value: 'Attécoubé', label: 'Attécoubé' },
        { value: 'Cocody', label: 'Cocody' },
        { value: 'Koumassi', label: 'Koumassi' },
        { value: 'Marcory', label: 'Marcory' },
        { value: 'Plateau', label: 'Plateau' },
        { value: 'Port-Bouët', label: 'Port-Bouët' },
        { value: 'Treichville', label: 'Treichville' },
        { value: 'Yopougon', label: 'Yopougon' },
        { value: 'Bingerville', label: 'Bingerville' },
        
        // ✅ NOUVELLES VILLES AJOUTÉES
        { value: 'Jacqueville', label: 'Jacqueville' },
        { value: 'Bonoua', label: 'Bonoua' },
        
        // Autres villes (optionnel)
        { value: 'Grand-Bassam', label: 'Grand-Bassam' },
        { value: 'Anyama', label: 'Anyama' },
        { value: 'Dabou', label: 'Dabou' }
    ];
    
    // Trier par ordre alphabétique
    villes.sort((a, b) => a.label.localeCompare(b.label));
    
    select.innerHTML = '<option value="" disabled selected>Choisissez votre localité</option>';
    villes.forEach(ville => {
        const option = document.createElement('option');
        option.value = ville.value;
        option.textContent = ville.label;
        select.appendChild(option);
    });
}

// Vérifier si déjà connecté
async function verifierSessionExistante() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (session) {
            window.location.href = 'index.html';
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

// Valider et formater le numéro ivoirien
function validerTelephone(e) {
    let phone = e.target.value.replace(/\s+/g, '');
    
    if (phone.length === 14 && phone.startsWith('+225')) {
        let formatted = phone.replace(/(\+225)(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6');
        e.target.value = formatted;
    }
}

// Vérifier que le numéro est valide
function estTelephoneValide(phone) {
    const phoneSansEspaces = phone.replace(/\s+/g, '');
    const regexIvoirien = /^\+225\d{10}$/;
    return regexIvoirien.test(phoneSansEspaces);
}

// Gestion de la connexion
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
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
        
        showMessage('Connexion réussie ! Redirection...', 'success');
        
        localStorage.setItem('vm_user_email', email);
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        showMessage(error.message || 'Erreur lors de la connexion');
        
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
    }
}

// Gestion de l'inscription (MISE À JOUR COMPLÈTE)
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const commune = document.getElementById('register-commune').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    
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
            showMessage('Numéro invalide. Format: +225 suivi de 10 chiffres');
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
        
        const phoneClean = phone.replace(/\s+/g, '');
        
        // Étape 1: Inscription Auth
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    phone: phoneClean,
                    commune: commune,
                    avatar_letter: name.charAt(0).toUpperCase()
                }
            }
        });
        
        if (error) throw error;
        
        if (data.user) {
            // Étape 2: ✅ CRÉATION DANS TABLE utilisateurs
            const { error: profilError } = await window.supabase
                .from('utilisateurs')
                .insert({
                    id: data.user.id,
                    nom: name,
                    telephone: phoneClean,
                    commune: commune,
                    commandes_annulees: 0,
                    created_at: new Date()
                });
            
            if (profilError) {
                console.error('⚠️ Erreur création profil:', profilError);
                // Optionnel: notifier mais on continue
                showMessage('Inscription réussie mais profil incomplet', 'warning');
            }
            
            showMessage('Inscription réussie ! Connexion...', 'success');
            
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
                
                // Rediriger vers profil avec message bienvenue
                setTimeout(() => {
                    window.location.href = 'profil.html?new=true';
                }, 2000);
            } else {
                setTimeout(() => {
                    activerOnglet('login');
                }, 2000);
            }
        }
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        showMessage(error.message || 'Erreur lors de l\'inscription');
        
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
    }
}

// Fonctions utilitaires
window.getSession = async () => {
    try {
        const { data } = await window.supabase.auth.getSession();
        console.log('Session:', data);
        return data;
    } catch (error) {
        console.error('Erreur:', error);
    }
};

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