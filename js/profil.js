// profil.js - Page de profil utilisateur
// Utilise window.supabase (défini dans supabase.js)

// État
let userSession = null;
let userData = {};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page profil chargée');
    chargerProfil();
    
    // Vérifier si nouveau profil (paramètre ?new=true)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        afficherMessageBienvenue();
    }
    
    // Bouton déconnexion
    document.getElementById('btn-deconnexion').addEventListener('click', ouvrirModal);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', fermerModal);
    document.getElementById('cancel-logout').addEventListener('click', fermerModal);
    document.getElementById('confirm-logout').addEventListener('click', deconnexion);
    
    // Fermer modal en cliquant sur l'overlay
    document.getElementById('logout-modal').addEventListener('click', function(e) {
        if (e.target === this) fermerModal();
    });
});

// Charger les informations du profil
async function chargerProfil() {
    try {
        // Récupérer la session
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session) {
            // Non connecté, rediriger vers accueil
            window.location.href = 'index.html';
            return;
        }
        
        userSession = session;
        userData = session.user.user_metadata || {};
        
        // Afficher les informations
        afficherInfosProfil(session.user);
        
    } catch (error) {
        console.error('Erreur chargement profil:', error);
        window.location.href = 'index.html';
    }
}

// Afficher les informations du profil
function afficherInfosProfil(user) {
    // Avatar (lettre)
    const lettre = userData.full_name ? 
        userData.full_name.charAt(0).toUpperCase() : 
        user.email.charAt(0).toUpperCase();
    
    document.getElementById('profil-avatar').textContent = lettre;
    
    // Nom
    document.getElementById('profil-nom').textContent = userData.full_name || 'Non renseigné';
    
    // Email
    document.getElementById('profil-email').textContent = user.email;
    
    // Téléphone
    const phone = userData.phone || '';
    if (phone) {
        // Formater pour affichage
        if (phone.startsWith('+225')) {
            document.getElementById('profil-telephone').textContent = 
                phone.replace(/(\+225)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        } else if (phone.startsWith('05')) {
            document.getElementById('profil-telephone').textContent = 
                phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        } else {
            document.getElementById('profil-telephone').textContent = phone;
        }
    } else {
        document.getElementById('profil-telephone').textContent = 'Non renseigné';
    }
    
    // Commune
    document.getElementById('profil-commune').textContent = userData.commune || 'Non renseignée';
    
    // Date d'inscription
    const createdAt = new Date(user.created_at);
    const dateFormatee = createdAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('profil-membre').textContent = dateFormatee;
}

// Afficher message de bienvenue
function afficherMessageBienvenue() {
    const welcomeMsg = document.getElementById('welcome-message');
    welcomeMsg.style.display = 'block';
    
    // Cacher après 5 secondes
    setTimeout(() => {
        welcomeMsg.style.opacity = '0';
        setTimeout(() => {
            welcomeMsg.style.display = 'none';
            welcomeMsg.style.opacity = '1';
        }, 500);
    }, 5000);
}

// Ouvrir modal de confirmation
function ouvrirModal() {
    document.getElementById('logout-modal').classList.add('show');
}

// Fermer modal
function fermerModal() {
    document.getElementById('logout-modal').classList.remove('show');
}

// Déconnexion
async function deconnexion() {
    try {
        await window.supabase.auth.signOut();
        
        // Nettoyer localStorage
        localStorage.removeItem('vm_user_email');
        localStorage.removeItem('vm_user_name');
        localStorage.removeItem('vm_user_phone');
        localStorage.removeItem('vm_user_commune');
        
        // Rediriger vers accueil
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        alert('Erreur lors de la déconnexion');
        fermerModal();
    }
}

// Rafraîchir les données (utile si mise à jour)
window.rafraichirProfil = chargerProfil;