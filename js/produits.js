// produits.js - Catalogue produits avec toggles activation
// Utilise window.supabase

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

// Créer un élément produit avec toggle
function creerElementProduit(produit) {
    const template = document.getElementById('template-produit');
    const clone = template.content.cloneNode(true);
    const item = clone.querySelector('.produit-item');
    
    item.dataset.produitId = produit.id;
    item.dataset.actif = produit.actif !== false; // true par défaut
    
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
    
    return clone;
}

// Mettre à jour le champ actif dans Supabase
async function mettreAJourActif(produitId, actif) {
    try {
        const { error } = await window.supabase
            .from('produits')
            .update({ actif: actif })
            .eq('id', produitId);
        
        if (error) throw error;
        
        console.log(`✅ Produit ${produitId} ${actif ? 'activé' : 'désactivé'}`);
        
        // Afficher un petit toast
        showToast(actif ? '✅ Produit activé' : '⚫ Produit désactivé', 'success');
        
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        showToast('❌ Erreur lors de la mise à jour', 'error');
        
        // Revenir à l'état précédent
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

// Rafraîchir la liste
window.rafraichirCatalogue = chargerProduits;