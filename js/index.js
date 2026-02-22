// index.js - Page d'accueil Virtual Market
// Utilise window.supabase

// État de connexion
let estConnecte = false;
let userEmail = '';
let userData = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page d\'accueil chargée');
    
    // UNIQUEMENT le lien sur le logo pour l'admin
    ajouterLienLogo();
    
    verifierConnexion();
});

// UNIQUEMENT cette fonction ajoutée
function ajouterLienLogo() {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'auth-admin.html';
        });
    }
}

// Vérifier connexion avec Supabase (inchangé)
async function verifierConnexion() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (session) {
            console.log('👤 Utilisateur connecté:', session.user.email);
            estConnecte = true;
            userEmail = session.user.email;
            userData = session.user.user_metadata || {};
        } else {
            console.log('👤 Aucun utilisateur connecté');
            estConnecte = false;
        }
        
        afficherProfil();
        gererCartes();
        
    } catch (error) {
        console.error('Erreur vérification session:', error);
        estConnecte = false;
        afficherProfil();
    }
}

// Afficher le profil (COMPORTEMENT NORMAL - inchangé)
function afficherProfil() {
    const container = document.getElementById('user-profile');
    if (!container) return;
    
    if (estConnecte) {
        // Comportement normal pour tous les utilisateurs
        const lettre = userData.full_name ? 
            userData.full_name.charAt(0).toUpperCase() : 
            userEmail.charAt(0).toUpperCase();
        
        container.innerHTML = `
            <a href="profil.html" class="profile-button" id="profileBtn" title="Mon profil">
                ${lettre}
            </a>
        `;
        
        // Activer les cartes
        activerCartes(true);
        
    } else {
        // Bouton connexion
        container.innerHTML = `
            <a href="auth.html" class="profile-button guest" id="loginBtn">
                <i class="fas fa-user"></i> Se connecter
            </a>
        `;
        
        // Désactiver les cartes
        activerCartes(false);
    }
}

// Activer ou désactiver les cartes (inchangé)
function activerCartes(actif) {
    const cartes = document.querySelectorAll('.feature-card');
    cartes.forEach(carte => {
        if (actif) {
            carte.classList.remove('disabled');
        } else {
            carte.classList.add('disabled');
        }
    });
}

// Gérer les clics sur les cartes (inchangé)
function gererCartes() {
    const cardMarcher = document.getElementById('card-marcher');
    const cardPanier = document.getElementById('card-panier');
    const cardCommandes = document.getElementById('card-commandes');
    
    if (cardMarcher) {
        cardMarcher.addEventListener('click', () => {
            if (estConnecte) window.location.href = 'marcher.html';
        });
    }
    
    if (cardPanier) {
        cardPanier.addEventListener('click', () => {
            if (estConnecte) window.location.href = 'panier.html';
        });
    }
    
    if (cardCommandes) {
        cardCommandes.addEventListener('click', () => {
            if (estConnecte) window.location.href = 'mescommandes.html';
        });
    }
}