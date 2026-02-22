// produits.js - Catalogue produits avec toggles activation et suppression
// Utilise window.supabase

// Configuration
const BUCKET_NAME = 'produits';

// État
let produits = [];

// Éléments DOM
const searchInput = document.getElementById('search-input');
const produitsListe = document.getElementById('produits-liste');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Catalogue produits chargé');
    chargerProduits();
    
    // Recherche en temps réel
    searchInput.addEventListener('input', filtrerProduits);
});

// Charger tous les produits depuis Supabase
async function chargerProduits() {
    try {
        produitsListe.innerHTML = '<div class="loading">Chargement...</div>';
        
        const { data, error } = await window.supabase
            .from('produits')
            .select('*')
            .order('categorie', { ascending: true })
            .order('nom', { ascending: true });
        
        if (error) throw error;
        
        produits = data || [];
        afficherProduits(produits);
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        produitsListe.innerHTML = '<div class="loading">Erreur de chargement</div>';
    }
}

// Afficher les produits
function afficherProduits(produitsAffiches) {
    if (produitsAffiches.length === 0) {
        produitsListe.innerHTML = '<div class="aucun-produit">Aucun produit trouvé</div>';
        return;
    }
    
    produitsListe.innerHTML = '';
    
    produitsAffiches.forEach(produit => {
        const item = creerElementProduit(produit);
        produitsListe.appendChild(item);
    });
}

// Créer un élément produit avec toggle et bouton supprimer
function creerElementProduit(produit) {
    const template = document.getElementById('template-produit');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.produit-item');
    
    item.dataset.produitId = produit.id;
    item.dataset.actif = produit.actif !== false;
    
    // Si inactif, ajouter classe
    if (produit.actif === false) {
        item.classList.add('inactif');
    }
    
    // Image
    const img = item.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    
    // Nom
    item.querySelector('.produit-nom').textContent = produit.nom;
    
    // Prix
    item.querySelector('.produit-prix').textContent = `${produit.prix} F/kg`;
    
    // Stock
    const stockElement = item.querySelector('.produit-stock');
    stockElement.textContent = `Stock: ${produit.stock || 0} kg`;
    
    // Catégorie
    item.querySelector('.produit-categorie').textContent = produit.categorie || 'Non catégorisé';
    
    // Toggle
    const toggle = item.querySelector('.toggle-actif');
    toggle.checked = produit.actif !== false;
    
    // Mise à jour du label
    const toggleLabel = item.querySelector('.toggle-label');
    toggleLabel.textContent = toggle.checked ? 'Actif' : 'Inactif';
    
    // Événement changement toggle
    toggle.addEventListener('change', async function() {
        const nouvelEtat = this.checked;
        
        // Mettre à jour le label
        toggleLabel.textContent = nouvelEtat ? 'Actif' : 'Inactif';
        
        // Mettre à jour la classe
        if (nouvelEtat) {
            item.classList.remove('inactif');
        } else {
            item.classList.add('inactif');
        }
        
        // Sauvegarder dans Supabase
        await mettreAJourActif(produit.id, nouvelEtat);
    });
    
    // AJOUT : Bouton supprimer
    const btnSupprimer = document.createElement('button');
    btnSupprimer.className = 'btn-supprimer-produit';
    btnSupprimer.innerHTML = '<i class="fas fa-trash"></i>';
    btnSupprimer.title = 'Supprimer définitivement';
    
    btnSupprimer.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmerSuppression(produit);
    });
    
    // Ajouter le bouton à côté du toggle
    const toggleContainer = item.querySelector('.produit-toggle');
    toggleContainer.appendChild(btnSupprimer);
    
    return clone;
}

// Confirmer la suppression
function confirmerSuppression(produit) {
    // Créer une modal de confirmation personnalisée
    const modal = document.createElement('div');
    modal.className = 'modal-confirmation';
    modal.innerHTML = `
        <div class="modal-confirmation-content">
            <div class="modal-confirmation-header">
                <h3><i class="fas fa-exclamation-triangle" style="color: #e74c3c;"></i> Confirmer la suppression</h3>
                <button class="modal-confirmation-close">&times;</button>
            </div>
            <div class="modal-confirmation-body">
                <p>Êtes-vous sûr de vouloir supprimer définitivement :</p>
                <p><strong>${produit.nom}</strong> ?</p>
                <p style="color: #e74c3c; margin-top: 15px; font-size: 0.9rem;">
                    <i class="fas fa-exclamation-circle"></i> 
                    Cette action est irréversible et supprimera également l'image.
                </p>
            </div>
            <div class="modal-confirmation-footer">
                <button class="btn-annuler" id="cancel-delete">Annuler</button>
                <button class="btn-confirmer" id="confirm-delete">
                    <i class="fas fa-trash"></i> Supprimer
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animation d'apparition
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Fermeture
    const fermer = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.modal-confirmation-close').addEventListener('click', fermer);
    modal.querySelector('#cancel-delete').addEventListener('click', fermer);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fermer();
    });
    
    // Confirmation suppression
    modal.querySelector('#confirm-delete').addEventListener('click', async () => {
        await supprimerProduit(produit);
        fermer();
    });
}

// Supprimer un produit
async function supprimerProduit(produit) {
    try {
        // 1. Supprimer l'image du storage
        if (produit.image_url) {
            const path = produit.image_url.split('/').pop();
            if (path) {
                await window.supabase.storage
                    .from(BUCKET_NAME)
                    .remove([`produits/${path}`]);
            }
        }
        
        // 2. Supprimer le produit de la table
        const { error } = await window.supabase
            .from('produits')
            .delete()
            .eq('id', produit.id);
        
        if (error) throw error;
        
        // 3. Notification et rechargement
        showToast(`🗑️ "${produit.nom}" supprimé définitivement`, 'success');
        await chargerProduits();
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        showToast('❌ Erreur lors de la suppression', 'error');
    }
}

// Mettre à jour le champ actif
async function mettreAJourActif(produitId, actif) {
    try {
        const { error } = await window.supabase
            .from('produits')
            .update({ actif: actif })
            .eq('id', produitId);
        
        if (error) throw error;
        
        console.log(`✅ Produit ${produitId} ${actif ? 'activé' : 'désactivé'}`);
        showToast(actif ? '✅ Produit activé' : '⚫ Produit désactivé', 'success');
        
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        showToast('❌ Erreur lors de la mise à jour', 'error');
        await chargerProduits();
    }
}

// Filtrer les produits par recherche
function filtrerProduits() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        afficherProduits(produits);
        return;
    }
    
    const filtered = produits.filter(p => 
        p.nom.toLowerCase().includes(searchTerm) || 
        (p.categorie && p.categorie.toLowerCase().includes(searchTerm)) ||
        (p.description && p.description.toLowerCase().includes(searchTerm))
    );
    
    afficherProduits(filtered);
}

// Toast notifications
function showToast(message, type = 'info') {
    let toast = document.getElementById('catalogue-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'catalogue-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 0.95rem;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: opacity 0.3s;
            opacity: 0;
            background-color: #27ae60;
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
    }, 2000);
}

// CSS pour la modal de confirmation (à ajouter dans produits.css)
const style = document.createElement('style');
style.textContent = `
    .modal-confirmation {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s;
    }
    
    .modal-confirmation.show {
        opacity: 1;
        visibility: visible;
    }
    
    .modal-confirmation-content {
        background: white;
        border-radius: 30px;
        max-width: 400px;
        width: 90%;
        transform: scale(0.9);
        transition: transform 0.3s;
    }
    
    .modal-confirmation.show .modal-confirmation-content {
        transform: scale(1);
    }
    
    .modal-confirmation-header {
        padding: 20px;
        border-bottom: 2px solid #f0f0f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-confirmation-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #7f8c8d;
    }
    
    .modal-confirmation-body {
        padding: 30px 20px;
        text-align: center;
    }
    
    .modal-confirmation-footer {
        padding: 20px;
        border-top: 2px solid #f0f0f0;
        display: flex;
        gap: 10px;
    }
    
    .btn-confirmer {
        flex: 1;
        padding: 14px;
        background: #e74c3c;
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
    }
    
    .btn-annuler {
        flex: 1;
        padding: 14px;
        background: #f8f9fa;
        color: #7f8c8d;
        border: none;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: bold;
        cursor: pointer;
    }
    
    .btn-supprimer-produit {
        background: #fee;
        border: none;
        color: #e74c3c;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 10px;
        transition: all 0.2s;
    }
    
    .btn-supprimer-produit:active {
        background: #fdd;
        transform: scale(0.9);
    }
    
    @media (prefers-color-scheme: dark) {
        .modal-confirmation-content {
            background: #2c3e50;
        }
        
        .modal-confirmation-header {
            border-bottom-color: #34495e;
        }
        
        .modal-confirmation-footer {
            border-top-color: #34495e;
        }
        
        .btn-annuler {
            background: #34495e;
            color: #bdc3c7;
        }
    }
`;
document.head.appendChild(style);

// Rafraîchir la liste
window.rafraichirCatalogue = chargerProduits;
