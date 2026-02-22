// marcher-new.js - Affichage produits depuis Supabase

// Configuration
let produits = [];
let panier = [];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Marché chargé');
    chargerProduits();
    chargerPanier();
    mettreAJourCompteur();
});

// Charger les produits depuis Supabase
async function chargerProduits() {
    try {
        const grid = document.getElementById('produits-grid');
        grid.innerHTML = '<div class="loading">Chargement...</div>';
        
        const { data, error } = await window.supabase
            .from('produits')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        produits = data || [];
        afficherProduits();
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        document.getElementById('produits-grid').innerHTML = 
            '<div class="loading">Erreur de chargement</div>';
    }
}

// Afficher les produits
function afficherProduits() {
    const grid = document.getElementById('produits-grid');
    
    if (produits.length === 0) {
        grid.innerHTML = `
            <div class="aucun-produit">
                <i class="fas fa-box-open"></i>
                <p>Aucun produit disponible</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = '';
    
    produits.forEach(produit => {
        const card = creerCarteProduit(produit);
        grid.appendChild(card);
    });
}

// Créer une carte produit compacte
function creerCarteProduit(produit) {
    const template = document.getElementById('template-produit');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.produit-card');
    
    card.dataset.produitId = produit.id;
    
    const img = card.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    
    card.querySelector('.produit-nom').textContent = produit.nom;
    card.querySelector('.produit-prix').textContent = `${produit.prix} F.CFA`;
    
    // Bouton ajouter au panier
    card.querySelector('.btn-ajouter').addEventListener('click', (e) => {
        e.stopPropagation();
        ajouterAuPanier(produit);
    });
    
    // Optionnel: clic sur la carte pour voir détails
    card.addEventListener('click', () => {
        console.log('Détails produit:', produit);
        // Plus tard: page détail produit
    });
    
    return clone;
}

// Ajouter au panier
function ajouterAuPanier(produit) {
    // Vérifier si déjà dans panier
    const existant = panier.find(item => item.id === produit.id);
    
    if (existant) {
        existant.quantite = (existant.quantite || 1) + 1;
    } else {
        panier.push({
            id: produit.id,
            nom: produit.nom,
            prix: produit.prix,
            image_url: produit.image_url,
            quantite: 1
        });
    }
    
    // Sauvegarder dans localStorage pour l'instant
    localStorage.setItem('vm_panier', JSON.stringify(panier));
    
    // Animation feedback
    const btn = event.target.closest('.btn-ajouter');
    btn.style.background = '#e74c3c';
    setTimeout(() => {
        btn.style.background = '#27ae60';
    }, 200);
    
    mettreAJourCompteur();
}

// Charger panier depuis localStorage
function chargerPanier() {
    const saved = localStorage.getItem('vm_panier');
    if (saved) {
        panier = JSON.parse(saved);
    }
}

// Mettre à jour compteur panier
function mettreAJourCompteur() {
    const total = panier.reduce((acc, item) => acc + (item.quantite || 1), 0);
    const compteur = document.getElementById('panier-count');
    if (compteur) {
        compteur.textContent = total;
        compteur.style.display = total > 0 ? 'flex' : 'none';
    }
}

// Rafraîchir (si nouveau produit ajouté depuis admin)
window.rafraichirProduits = chargerProduits;