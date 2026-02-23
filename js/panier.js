// panier.js - Version complète avec boutons, stock, alerte prix et plein écran

// État
let userId = null;
let userInfos = null;
let panierItems = [];
let produits = {};

// Éléments DOM
const panierCadre = document.getElementById('panier-cadre');
const footerTotal = document.getElementById('footer-total');
const btnCommander = document.getElementById('btn-commander');
const btnVider = document.getElementById('btn-vider');

// Modals
const modalPaiement = document.getElementById('modal-paiement');
const modalValidation = document.getElementById('modal-validation');
const modalPleinEcran = document.getElementById('modal-plein-ecran');

// Éléments Modal 2
const validationTotal = document.getElementById('validation-total');
const validationProduits = document.getElementById('validation-produits');
const validationCommune = document.getElementById('validation-commune');
const validationAdresse = document.getElementById('validation-adresse');
const validationMapsLink = document.getElementById('validation-maps-link');

// Éléments Modal Plein écran
const pleinBody = document.getElementById('plein-body');

// Templates
const templateArticle = document.getElementById('template-article');
const templateValidationLigne = document.getElementById('template-validation-ligne');

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Panier chargé');
    
    await verifierUtilisateur();
    await chargerPanier();
    
    // Événements
    btnCommander.addEventListener('click', ouvrirModalPaiement);
    btnVider.addEventListener('click', ouvrirModalVider);
    
    // Modal 1
    document.getElementById('close-paiement').addEventListener('click', fermerModals);
    document.getElementById('cancel-paiement').addEventListener('click', fermerModals);
    document.getElementById('suivant-paiement').addEventListener('click', () => {
        fermerModals();
        preparerModalValidation();
    });
    
    // Modal 2
    document.getElementById('close-validation').addEventListener('click', fermerModals);
    document.getElementById('cancel-validation').addEventListener('click', fermerModals);
    document.getElementById('confirm-commande').addEventListener('click', validerCommande);
    
    // Modal Plein écran
    document.getElementById('close-plein').addEventListener('click', fermerModals);
    
    // Fermeture par overlay
    [modalPaiement, modalValidation, modalPleinEcran].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) fermerModals();
        });
    });
});

// =========================================
// FONCTIONS PRINCIPALES
// =========================================

// Vérifier utilisateur connecté
async function verifierUtilisateur() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (!session) {
            window.location.href = 'auth.html';
            return;
        }
        
        userId = session.user.id;
        
        // Récupérer infos depuis table utilisateurs
        const { data, error } = await window.supabase
            .from('utilisateurs')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            userInfos = data;
        } else {
            // Fallback sur metadata
            userInfos = {
                nom: session.user.user_metadata?.full_name || 'Client',
                telephone: session.user.user_metadata?.phone || '',
                commune: session.user.user_metadata?.commune || 'Non définie'
            };
        }
        
        console.log('👤 Utilisateur:', userInfos);
        
    } catch (error) {
        console.error('Erreur session:', error);
        window.location.href = 'auth.html';
    }
}

// Charger le panier depuis Supabase
async function chargerPanier() {
    try {
        const { data, error } = await window.supabase
            .from('panier')
            .select(`
                id,
                produit_id,
                quantite_kg,
                produits (
                    id,
                    nom,
                    prix,
                    stock,
                    image_url,
                    actif
                )
            `)
            .eq('user_id', userId);
        
        if (error) throw error;
        
        panierItems = data || [];
        
        // Filtrer les produits inactifs
        await filtrerProduitsInactifs();
        
        if (panierItems.length === 0) {
            afficherPanierVide();
        } else {
            afficherPanier();
            mettreAJourTotal();
        }
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        panierCadre.innerHTML = '<div class="error">Erreur de chargement</div>';
    }
}

// Filtrer les produits inactifs
async function filtrerProduitsInactifs() {
    const aRetirer = [];
    
    panierItems.forEach(item => {
        if (!item.produits || item.produits.actif === false) {
            aRetirer.push(item.id);
        }
    });
    
    if (aRetirer.length > 0) {
        for (const id of aRetirer) {
            await window.supabase
                .from('panier')
                .delete()
                .eq('id', id);
        }
        
        // Recharger
        const { data } = await window.supabase
            .from('panier')
            .select(`
                id,
                produit_id,
                quantite_kg,
                produits (
                    id,
                    nom,
                    prix,
                    stock,
                    image_url,
                    actif
                )
            `)
            .eq('user_id', userId);
        
        panierItems = data || [];
        
        if (aRetirer.length === 1) {
            showToast('Un produit n\'est plus disponible et a été retiré', 'warning');
        } else if (aRetirer.length > 1) {
            showToast(`${aRetirer.length} produits indisponibles ont été retirés`, 'warning');
        }
    }
}

// Afficher panier vide
function afficherPanierVide() {
    panierCadre.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #7f8c8d;">
            <i class="fas fa-shopping-cart" style="font-size: 3rem; margin-bottom: 15px;"></i>
            <p>Votre panier est vide</p>
            <a href="marcher.html" style="color: #27ae60; text-decoration: none;">Aller au marché</a>
        </div>
    `;
    btnCommander.disabled = true;
    footerTotal.textContent = '0 F';
}

// Afficher les articles avec boutons
function afficherPanier() {
    panierCadre.innerHTML = '';
    
    panierItems.forEach(item => {
        if (!item.produits) return;
        
        const produit = item.produits;
        const clone = templateArticle.content.cloneNode(true);
        const card = clone.querySelector('.article-card');
        
        // Stocker les données
        card.dataset.panierId = item.id;
        card.dataset.produitId = produit.id;
        card.dataset.prix = produit.prix;
        card.dataset.stock = produit.stock;
        card.dataset.quantite = item.quantite_kg;
        card.dataset.prixOriginal = produit.prix; // Pour détecter changement
        
        // Image
        const img = card.querySelector('.article-image');
        img.src = produit.image_url;
        img.alt = produit.nom;
        img.addEventListener('click', () => ouvrirPleinEcran(produit, item.quantite_kg));
        
        // Nom
        card.querySelector('.article-nom').textContent = produit.nom;
        
        // Prix
        card.querySelector('.article-prix').textContent = `${produit.prix} F/kg`;
        
        // Stock
        const stockIndic = card.querySelector('.stock-indic');
        stockIndic.textContent = `Stock: ${produit.stock} kg`;
        if (produit.stock < 5) {
            stockIndic.style.background = '#fef5e7';
            stockIndic.style.color = '#e67e22';
        }
        
        // Quantité
        card.querySelector('.quantite-valeur').textContent = item.quantite_kg.toFixed(2);
        
        // Montant
        const montant = produit.prix * item.quantite_kg;
        card.querySelector('.article-montant').textContent = `${Math.round(montant).toLocaleString('fr-FR')} F`;
        
        // Vérifier si prix a changé
        verifierChangementPrix(produit.id, produit.prix, card);
        
        // Événements boutons
        const btnMoins = card.querySelector('.btn-moins');
        const btnPlus = card.querySelector('.btn-plus');
        const btnSupprimer = card.querySelector('.btn-supprimer');
        
        btnMoins.addEventListener('click', () => modifierQuantite(item.id, -0.1, produit.stock, card));
        btnPlus.addEventListener('click', () => modifierQuantite(item.id, 0.1, produit.stock, card));
        btnSupprimer.addEventListener('click', () => supprimerArticle(item.id, produit.nom));
        
        panierCadre.appendChild(clone);
    });
}

// =========================================
// FONCTIONNALITÉS 1, 2 et 3
// =========================================

// 1️⃣ Stock restant (déjà dans affichage)
// 2️⃣ Prix total en temps réel
function mettreAJourTotal() {
    let total = 0;
    panierItems.forEach(item => {
        if (item.produits) {
            total += item.produits.prix * item.quantite_kg;
        }
    });
    
    footerTotal.textContent = `${Math.round(total).toLocaleString('fr-FR')} F`;
    btnCommander.disabled = panierItems.length === 0;
}

// 3️⃣ Vérifier changement de prix
async function verifierChangementPrix(produitId, prixActuel, card) {
    try {
        const { data, error } = await window.supabase
            .from('produits')
            .select('prix')
            .eq('id', produitId)
            .single();
        
        if (error) throw error;
        
        if (data && data.prix !== prixActuel) {
            // Prix a changé !
            const alerte = card.querySelector('.prix-alerte');
            alerte.style.display = 'flex';
            
            // Mettre à jour l'affichage du prix
            const prixElement = card.querySelector('.article-prix');
            prixElement.innerHTML = `${data.prix} F/kg <small style="color:#e67e22;">(était ${prixActuel} F)</small>`;
            
            // Stocker le nouveau prix
            card.dataset.prix = data.prix;
        }
        
    } catch (error) {
        console.error('Erreur vérification prix:', error);
    }
}

// Modifier la quantité
async function modifierQuantite(panierId, delta, stockMax, card) {
    try {
        // Récupérer l'item
        const item = panierItems.find(i => i.id === panierId);
        if (!item) return;
        
        const nouvelleKg = Math.round((item.quantite_kg + delta) * 10) / 10;
        
        // Validations
        if (nouvelleKg < 0.1) {
            showToast('Minimum 0.1 kg', 'warning');
            return;
        }
        
        if (nouvelleKg > stockMax) {
            showToast(`Stock max: ${stockMax} kg`, 'warning');
            return;
        }
        
        // Mettre à jour dans Supabase
        const { error } = await window.supabase
            .from('panier')
            .update({ quantite_kg: nouvelleKg })
            .eq('id', panierId);
        
        if (error) throw error;
        
        // Mettre à jour l'état local
        item.quantite_kg = nouvelleKg;
        
        // Mettre à jour l'affichage
        card.querySelector('.quantite-valeur').textContent = nouvelleKg.toFixed(2);
        
        const prix = parseFloat(card.dataset.prix);
        const montant = prix * nouvelleKg;
        card.querySelector('.article-montant').textContent = `${Math.round(montant).toLocaleString('fr-FR')} F`;
        
        // Mettre à jour le total général
        mettreAJourTotal();
        
        showToast('✅ Quantité mise à jour', 'success');
        
    } catch (error) {
        console.error('Erreur modification:', error);
        showToast('❌ Erreur lors de la modification', 'error');
    }
}

// Supprimer un article
async function supprimerArticle(panierId, nomProduit) {
    try {
        const { error } = await window.supabase
            .from('panier')
            .delete()
            .eq('id', panierId);
        
        if (error) throw error;
        
        showToast(`🗑️ ${nomProduit} retiré`, 'success');
        
        // Recharger le panier
        await chargerPanier();
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

// Ouvrir plein écran
function ouvrirPleinEcran(produit, quantite) {
    const contenu = `
        <img src="${produit.image_url}" alt="${produit.nom}" class="plein-image">
        
        <div class="plein-infos">
            <h2 class="plein-nom">${produit.nom}</h2>
            <p class="plein-categorie">${produit.categorie || 'Non catégorisé'}</p>
            
            <div class="plein-details">
                <p><span>Prix:</span> <strong>${produit.prix} F/kg</strong></p>
                <p><span>Stock disponible:</span> <strong>${produit.stock} kg</strong></p>
            </div>
            
            <div class="plein-quantite">
                <i class="fas fa-shopping-cart"></i>
                Dans votre panier: ${quantite.toFixed(2)} kg
            </div>
            
            <p class="plein-description">${produit.description || 'Aucune description disponible.'}</p>
        </div>
    `;
    
    pleinBody.innerHTML = contenu;
    modalPleinEcran.classList.add('show');
}

// =========================================
// GESTION DES MODALS
// =========================================

// Ouvrir modal paiement
function ouvrirModalPaiement() {
    if (panierItems.length === 0) return;
    modalPaiement.classList.add('show');
}

// Ouvrir modal vider
function ouvrirModalVider() {
    if (panierItems.length === 0) return;
    
    if (confirm('Vider tout le panier ?')) {
        viderPanier();
    }
}

// Vider tout le panier
async function viderPanier() {
    try {
        const { error } = await window.supabase
            .from('panier')
            .delete()
            .eq('user_id', userId);
        
        if (error) throw error;
        
        showToast('🗑️ Panier vidé', 'success');
        await chargerPanier();
        
    } catch (error) {
        console.error('Erreur vidage:', error);
        showToast('❌ Erreur lors du vidage', 'error');
    }
}

// Préparer modal validation
async function preparerModalValidation() {
    try {
        const total = footerTotal.textContent;
        validationTotal.textContent = total;
        
        validationProduits.innerHTML = '';
        
        panierItems.forEach(item => {
            if (!item.produits) return;
            
            const produit = item.produits;
            const clone = templateValidationLigne.content.cloneNode(true);
            const ligne = clone.querySelector('.article-validation-ligne');
            
            const montant = produit.prix * item.quantite_kg;
            const montantFormate = Math.round(montant).toLocaleString('fr-FR');
            
            ligne.querySelector('.article-nom').textContent = produit.nom;
            ligne.querySelector('.article-kg').textContent = `${item.quantite_kg.toFixed(2)} kg`;
            ligne.querySelector('.article-montant').textContent = `${montantFormate} F`;
            
            validationProduits.appendChild(clone);
        });
        
        validationCommune.textContent = userInfos.commune || 'Non définie';
        await chargerAdresseLocale();
        
        modalValidation.classList.add('show');
        
    } catch (error) {
        console.error('Erreur préparation modal:', error);
        showToast('❌ Erreur lors de la préparation', 'error');
    }
}

// Charger adresse
async function chargerAdresseLocale() {
    try {
        const { data, error } = await window.supabase
            .from('adresses_locales')
            .select('adresse')
            .eq('commune', userInfos.commune)
            .maybeSingle();
        
        if (error) throw error;
        
        let adresse = 'Adresse non définie pour cette commune';
        if (data && data.adresse) {
            adresse = data.adresse;
        }
        
        validationAdresse.textContent = adresse;
        
        const recherche = `${adresse}, ${userInfos.commune}, Côte d'Ivoire`;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recherche)}`;
        validationMapsLink.href = mapsUrl;
        
    } catch (error) {
        console.error('Erreur chargement adresse:', error);
        validationAdresse.textContent = 'Adresse temporairement indisponible';
        const recherche = `${userInfos.commune}, Côte d'Ivoire`;
        validationMapsLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(recherche)}`;
    }
}

// Valider commande
async function validerCommande() {
    try {
        const confirmBtn = document.getElementById('confirm-commande');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        
        const itemsCommande = panierItems.map(item => {
            const produit = item.produits;
            return {
                id: produit.id,
                nom: produit.nom,
                prix: produit.prix,
                kg: item.quantite_kg,
                total: Math.round(produit.prix * item.quantite_kg),
                image: produit.image_url
            };
        });
        
        const totalCommande = itemsCommande.reduce((sum, item) => sum + item.total, 0);
        
        const date = new Date();
        const ref = `VM-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
        
        const { error: commandeError } = await window.supabase
            .from('commandes')
            .insert({
                reference: ref,
                user_id: userId,
                user_nom: userInfos.nom,
                user_telephone: userInfos.telephone,
                user_commune: userInfos.commune,
                items: itemsCommande,
                total: totalCommande,
                statut_admin: 'en_attente',
                statut_user: 'commande_effectuée',
                date_commande: new Date(),
                penalite_active: false
            });
        
        if (commandeError) throw commandeError;
        
        for (const item of panierItems) {
            const produit = item.produits;
            const nouveauStock = produit.stock - item.quantite_kg;
            
            const { error: stockError } = await window.supabase
                .from('produits')
                .update({ stock: nouveauStock })
                .eq('id', produit.id);
            
            if (stockError) throw stockError;
        }
        
        const { error: panierError } = await window.supabase
            .from('panier')
            .delete()
            .eq('user_id', userId);
        
        if (panierError) throw panierError;
        
        fermerModals();
        showToast('✅ Commande enregistrée !', 'success');
        
        setTimeout(() => {
            window.location.href = 'comm.html';
        }, 1500);
        
    } catch (error) {
        console.error('Erreur validation commande:', error);
        showToast('❌ Erreur lors de la commande', 'error');
        
        const confirmBtn = document.getElementById('confirm-commande');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="fas fa-check"></i> CONFIRMER';
    }
}

// Fermer modals
function fermerModals() {
    modalPaiement.classList.remove('show');
    modalValidation.classList.remove('show');
    modalPleinEcran.classList.remove('show');
}

// Toast
function showToast(message, type = 'info') {
    let toast = document.getElementById('panier-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'panier-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 0.95rem;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1100;
            transition: opacity 0.3s;
            opacity: 0;
            color: white;
        `;
        document.body.appendChild(toast);
    }
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    toast.style.backgroundColor = colors[type] || colors.info;
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

// Utilitaires
window.rafraichirPanier = chargerPanier;
window.debugPanier = () => console.log('Panier:', panierItems);