// profil-admin.js - Profil administrateur
// Utilise window.supabase

// État
let userSession = null;
let userData = {};

// Identifiants admin (pour vérification)
const ADMIN_EMAIL = 'virtualbymeg@gmail.com';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Profil admin chargé');
    chargerProfilAdmin();
    
    // Bouton déconnexion
    document.getElementById('btn-deconnexion').addEventListener('click', ouvrirModal);
    
    // Modal
    document.querySelector('.modal-close').addEventListener('click', fermerModal);
    document.getElementById('cancel-logout').addEventListener('click', fermerModal);
    document.getElementById('confirm-logout').addEventListener('click', deconnexion);
    
    // Fermer modal en cliquant sur overlay
    document.getElementById('logout-modal').addEventListener('click', function(e) {
        if (e.target === this) fermerModal();
    });
    
    // Gestion de la navigation active
    gererNavigationActive();
});

// Charger les informations du profil admin
async function chargerProfilAdmin() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session) {
            console.log('Non connecté, redirection vers auth-admin');
            window.location.href = 'auth-admin.html';
            return;
        }
        
        const user = session.user;
        const email = user.email;
        
        // Vérifier que c'est bien l'admin
        if (email !== ADMIN_EMAIL) {
            console.log('Accès non autorisé');
            await window.supabase.auth.signOut();
            window.location.href = 'auth-admin.html';
            return;
        }
        
        userSession = session;
        userData = user.user_metadata || {};
        
        // Afficher les infos
        afficherInfosProfil(user);
        
    } catch (error) {
        console.error('Erreur chargement profil admin:', error);
        window.location.href = 'auth-admin.html';
    }
}

// Afficher les informations
function afficherInfosProfil(user) {
    // Email dans le header
    document.getElementById('admin-email').textContent = user.email;
    
    // Avatar (lettre)
    const lettre = userData.full_name ? 
        userData.full_name.charAt(0).toUpperCase() : 
        'A';
    document.getElementById('profil-avatar').textContent = lettre;
    
    // Nom
    document.getElementById('profil-nom').textContent = userData.full_name || 'Administrateur';
    
    // Email (déjà affiché mais on le met aussi)
    document.getElementById('profil-email').textContent = user.email;
    
    // Téléphone
    const phone = userData.phone || '';
    if (phone) {
        // Formater l'affichage
        if (phone.startsWith('05')) {
            document.getElementById('profil-telephone').textContent = 
                phone.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        } else {
            document.getElementById('profil-telephone').textContent = phone;
        }
    } else {
        document.getElementById('profil-telephone').textContent = 'Non renseigné';
    }
    
    // Date d'inscription
    const createdAt = new Date(user.created_at);
    const dateFormatee = createdAt.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    document.getElementById('profil-membre').textContent = dateFormatee;
}

// Gérer l'onglet actif dans la navigation
function gererNavigationActive() {
    const currentPage = window.location.pathname.split('/').pop() || 'profil-admin.html';
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href === currentPage) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
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
        localStorage.removeItem('vm_admin_email');
        
        // Rediriger vers accueil
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        alert('Erreur lors de la déconnexion');
        fermerModal();
    }
}

// Rafraîchir les données
window.rafraichirProfilAdmin = chargerProfilAdmin;

// Vérification périodique de la session (toutes les 5 minutes)
setInterval(async () => {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        if (!session || session.user.email !== ADMIN_EMAIL) {
            console.log('Session admin expirée');
            window.location.href = 'auth-admin.html';
        }
    } catch (error) {
        console.error('Erreur vérification session:', error);
    }
}, 300000); // 5 minutes