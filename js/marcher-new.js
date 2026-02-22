// marcher-new.js - Marché avec montant modifiable

// Configuration
let produits = [];
let panier = [];

// Éléments DOM
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories-container');
const panierCount = document.getElementById('panier-count');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Marché chargé');
    chargerProduits();
    chargerPanier();
    
    // Recherche en temps réel
    searchInput.addEventListener('input', filtrerProduits);
});

// Charger les produits depuis Supabase
async function chargerProduits() {
    try {
        categoriesContainer.innerHTML = '<div class="loading">Chargement...</div>';
        
        const { data, error } = await window.supabase
            .from('produits')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        produits = data || [];
        afficherProduitsParCategorie();
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        categoriesContainer.innerHTML = '<div class="loading">Erreur de chargement</div>';
    }
}

// Afficher les produits groupés par catégorie
function afficherProduitsParCategorie() {
    if (produits.length === 0) {
        categoriesContainer.innerHTML = '<div class="aucun-resultat">Aucun produit disponible</div>';
        return;
    }
    
    // Grouper par catégorie
    const categories = {};
    produits.forEach(produit => {
        const cat = produit.categorie || 'Autres';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(produit);
    });
    
    categoriesContainer.innerHTML = '';
    
    // Afficher chaque catégorie
    for (const [categorie, produitsCat] of Object.entries(categories)) {
        const section = creerSectionCategorie(categorie, produitsCat);
        categoriesContainer.appendChild(section);
    }
}

// Créer une section de catégorie avec scroll horizontal
function creerSectionCategorie(categorie, produitsCat) {
    const section = document.createElement('div');
    section.className = 'categorie-section';
    section.dataset.categorie = categorie;
    
    // Titre de catégorie
    const titre = document.createElement('h2');
    titre.className = 'categorie-titre';
    titre.textContent = categorie;
    section.appendChild(titre);
    
    // Conteneur scroll horizontal
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'produits-scroll';
    
    const produitsDiv = document.createElement('div');
    produitsDiv.className = 'produits-horizontal';
    
    // Ajouter chaque produit
    produitsCat.forEach(produit => {
        const card = creerCarteProduit(produit);
        produitsDiv.appendChild(card);
    });
    
    scrollDiv.appendChild(produitsDiv);
    section.appendChild(scrollDiv);
    
    return section;
}

// Créer une carte produit (version simplifiée)
function creerCarteProduit(produit) {
    const template = document.getElementById('template-produit');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.produit-card-horizontal');
    
    card.dataset.produitId = produit.id;
    card.dataset.prix = produit.prix;
    card.dataset.stock = produit.stock || 0;
    
    // Gestion rupture de stock
    if (produit.stock <= 0) {
        card.classList.add('rupture-stock');
    } else if (produit.stock < 5) {
        card.classList.add('stock-faible');
    }
    
    // Image + clic pour plein écran
    const img = card.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        ouvrirPleinEcran(produit);
    });
    
    // Description
    card.querySelector('.description-text').textContent = 
        produit.description || 'Aucune description';
    
    // Nom
    card.querySelector('.produit-nom').textContent = produit.nom;
    
    // Prix/kg
    card.querySelector('.produit-prix').textContent = `${produit.prix} F/kg`;
    
    // Montant input
    const montantInput = card.querySelector('.montant-input');
    const kgConverti = card.querySelector('.kg-converti');
    
    // Calcul initial
    updateKgFromMontant(montantInput, kgConverti, produit.prix);
    
    // Événement sur le montant
    montantInput.addEventListener('input', () => {
        updateKgFromMontant(montantInput, kgConverti, produit.prix);
    });
    
    // Bouton reset
    const resetBtn = card.querySelector('.btn-reset');
    resetBtn.addEventListener('click', () => {
        montantInput.value = produit.prix; // 1 kg par défaut
        updateKgFromMontant(montantInput, kgConverti, produit.prix);
    });
    
    // Bouton ajouter au panier
    const ajouterBtn = card.querySelector('.btn-ajouter-panier');
    ajouterBtn.addEventListener('click', () => {
        ajouterAuPanier(produit, montantInput.value);
    });
    
    return clone;
}

// Calculer kg à partir du montant
function updateKgFromMontant(montantInput, kgElement, prix) {
    const montant = parseFloat(montantInput.value) || 0;
    const kg = montant / prix;
    kgElement.textContent = kg.toFixed(2) + ' kg';
}

// Ouvrir modal plein écran (clic sur image)
function ouvrirPleinEcran(produit) {
    // Créer modal
    const modal = document.createElement('div');
    modal.className = 'modal-plein-ecran';
    
    modal.innerHTML = `
        <div class="modal-content-plein">
            <button class="modal-fermer">&times;</button>
            
            <img src="${produit.image_url}" alt="${produit.nom}" class="modal-image">
            
            <div class="modal-infos">
                <h2>${produit.nom}</h2>
                <p class="modal-categorie">${produit.categorie || 'Non catégorisé'}</p>
                <p class="modal-description">${produit.description || 'Aucune description'}</p>
                
                <div class="modal-details">
                    <div><strong>Prix:</strong> ${produit.prix} F/kg</div>
                    <div><strong>Stock:</strong> ${produit.stock || 0} kg</div>
                    <div><strong>Ajouté le:</strong> ${new Date(produit.created_at).toLocaleDateString('fr-FR')}</div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animation
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Fermeture
    const fermer = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.modal-fermer').addEventListener('click', fermer);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fermer();
    });
}

// Ajouter au panier
function ajouterAuPanier(produit, montantSaisi) {
    if (produit.stock <= 0) {
        showToast('❌ Produit en rupture de stock', 'error');
        return;
    }
    
    const montant = parseFloat(montantSaisi) || 0;
    const kg = montant / produit.prix;
    
    // Validation
    if (kg < 1) {
        showToast('❌ Montant insuffisant (minimum 1 kg)', 'error');
        // Reset à 1 kg
        const montantMin = produit.prix;
        const card = document.querySelector(`[data-produit-id="${produit.id}"]`);
        if (card) {
            const input = card.querySelector('.montant-input');
            input.value = montantMin;
            const kgEl = card.querySelector('.kg-converti');
            kgEl.textContent = '1.00 kg';
        }
        return;
    }
    
    if (kg > produit.stock) {
        showToast(`❌ Stock insuffisant (max ${produit.stock} kg)`, 'error');
        // Reset à stock max
        const montantMax = produit.prix * produit.stock;
        const card = document.querySelector(`[data-produit-id="${produit.id}"]`);
        if (card) {
            const input = card.querySelector('.montant-input');
            input.value = montantMax;
            const kgEl = card.querySelector('.kg-converti');
            kgEl.textContent = produit.stock.toFixed(2) + ' kg';
        }
        return;
    }
    
    // Ajouter au panier
    const existant = panier.find(item => item.id === produit.id);
    
    if (existant) {
        existant.kg += kg;
    } else {
        panier.push({
            id: produit.id,
            nom: produit.nom,
            prix: produit.prix,
            image: produit.image_url,
            kg: kg
        });
    }
    
    localStorage.setItem('vm_panier', JSON.stringify(panier));
    
    // Animation
    const btn = event.target;
    btn.classList.add('add-animation');
    setTimeout(() => btn.classList.remove('add-animation'), 300);
    
    showToast(`✅ ${kg.toFixed(2)} kg ajoutés au panier`, 'success');
    mettreAJourCompteur();
    
    // Reset du champ
    const card = document.querySelector(`[data-produit-id="${produit.id}"]`);
    if (card) {
        const input = card.querySelector('.montant-input');
        input.value = produit.prix;
        const kgEl = card.querySelector('.kg-converti');
        kgEl.textContent = '1.00 kg';
    }
}

// Charger panier
function chargerPanier() {
    const saved = localStorage.getItem('vm_panier');
    if (saved) {
        panier = JSON.parse(saved);
    }
    mettreAJourCompteur();
}

// Mettre à jour compteur panier
function mettreAJourCompteur() {
    const total = panier.reduce((acc, item) => acc + (item.kg || 1), 0);
    if (panierCount) {
        panierCount.textContent = total;
        panierCount.style.display = total > 0 ? 'flex' : 'none';
    }
}

// Filtrer les produits par recherche
function filtrerProduits() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (!searchTerm) {
        afficherProduitsParCategorie();
        return;
    }
    
    const filtered = produits.filter(p => 
        p.nom.toLowerCase().includes(searchTerm) || 
        (p.description && p.description.toLowerCase().includes(searchTerm)) ||
        (p.categorie && p.categorie.toLowerCase().includes(searchTerm))
    );
    
    if (filtered.length === 0) {
        categoriesContainer.innerHTML = '<div class="aucun-resultat">Aucun produit trouvé</div>';
        return;
    }
    
    // Afficher les résultats sans catégories
    const categories = {};
    filtered.forEach(produit => {
        const cat = produit.categorie || 'Résultats';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(produit);
    });
    
    categoriesContainer.innerHTML = '';
    
    for (const [categorie, produitsCat] of Object.entries(categories)) {
        const section = creerSectionCategorie(categorie, produitsCat);
        categoriesContainer.appendChild(section);
    }
}

// Toast notifications
function showToast(message, type = 'info') {
    let toast = document.getElementById('marcher-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'marcher-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 14px 28px;
            border-radius: 50px;
            font-size: 1rem;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            transition: opacity 0.3s;
            opacity: 0;
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
    toast.style.color = 'white';
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2000);
}