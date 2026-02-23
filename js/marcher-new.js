// marcher-new.js - Version avec badge = nombre de produits et cumul des quantités

let produits = [];
let userId = null;

// Éléments DOM
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories-container');
const panierCount = document.getElementById('panier-count');

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ Marché chargé');
    
    await verifierUtilisateur();
    await chargerProduits();
    await mettreAJourCompteur(); // ✅ Compteur mis à jour au chargement
    
    searchInput.addEventListener('input', filtrerProduits);
});

// Vérifier l'utilisateur connecté
async function verifierUtilisateur() {
    const { data: { session } } = await window.supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'auth.html';
        return;
    }
    
    userId = session.user.id;
    console.log('👤 Utilisateur:', userId);
}

// Charger les produits
async function chargerProduits() {
    try {
        categoriesContainer.innerHTML = '<div class="loading">Chargement...</div>';
        
        const { data, error } = await window.supabase
            .from('produits')
            .select('*')
            .eq('actif', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        produits = data || [];
        afficherProduitsParCategorie();
        
    } catch (error) {
        console.error('Erreur chargement:', error);
        categoriesContainer.innerHTML = '<div class="loading">Erreur de chargement</div>';
    }
}

// ✅ NOUVEAU : Mettre à jour le compteur (nombre de produits, pas kg)
async function mettreAJourCompteur() {
    try {
        const { data, error } = await window.supabase
            .from('panier')
            .select('produit_id', { count: 'exact', head: false })
            .eq('user_id', userId);
        
        if (error) throw error;
        
        // ✅ Compter le nombre de produits UNIQUES
        const nombreProduits = data?.length || 0;
        
        if (panierCount) {
            panierCount.textContent = nombreProduits;
            panierCount.style.display = nombreProduits > 0 ? 'flex' : 'none';
        }
        
        console.log('📊 Nombre de produits dans panier:', nombreProduits);
        
    } catch (error) {
        console.error('Erreur compteur:', error);
    }
}

// ✅ NOUVEAU : Ajouter au panier avec CUMUL des quantités
async function ajouterAuPanier(produit, montantSaisi) {
    if (!userId) {
        showToast('❌ Vous devez être connecté', 'error');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }
    
    if (produit.stock <= 0) {
        showToast('❌ Produit en rupture de stock', 'error');
        return;
    }
    
    const kg = montantSaisi / produit.prix;
    
    if (kg < 1) {
        showToast('❌ Minimum 1 kg', 'error');
        return;
    }
    
    if (kg > produit.stock) {
        showToast(`❌ Stock max: ${produit.stock} kg`, 'error');
        return;
    }
    
    try {
        // Animation
        const btn = event.target;
        btn.classList.add('add-animation');
        
        // ✅ 1. Vérifier si le produit existe déjà dans le panier
        const { data: existing } = await window.supabase
            .from('panier')
            .select('quantite_kg')
            .eq('user_id', userId)
            .eq('produit_id', produit.id)
            .maybeSingle();
        
        let nouvelleQuantite = kg;
        
        if (existing) {
            // ✅ 2. Si existe, on CUMULE (addition)
            nouvelleQuantite = existing.quantite_kg + kg;
            
            // ✅ 3. Vérifier que le total ne dépasse pas le stock
            if (nouvelleQuantite > produit.stock) {
                showToast(`❌ Stock max: ${produit.stock} kg (déjà ${existing.quantite_kg.toFixed(2)} kg dans panier)`, 'error');
                btn.classList.remove('add-animation');
                return;
            }
        }
        
        // ✅ 4. UPSERT avec la nouvelle quantité cumulée
        const { error } = await window.supabase
            .from('panier')
            .upsert({
                user_id: userId,
                produit_id: produit.id,
                quantite_kg: nouvelleQuantite
            }, {
                onConflict: 'user_id, produit_id'
            });
        
        if (error) throw error;
        
        // Message selon cumul ou nouvel ajout
        if (existing) {
            showToast(`✅ +${kg.toFixed(2)} kg (total: ${nouvelleQuantite.toFixed(2)} kg)`, 'success');
        } else {
            showToast(`✅ ${kg.toFixed(2)} kg ajoutés`, 'success');
        }
        
        // ✅ 5. Mettre à jour le compteur (nombre de produits)
        await mettreAJourCompteur();
        
        // Reset du champ
        const card = document.querySelector(`[data-produit-id="${produit.id}"]`);
        if (card) {
            const input = card.querySelector('.montant-input');
            input.value = produit.prix;
            const kgEl = card.querySelector('.kg-converti');
            kgEl.textContent = '1.00 kg';
        }
        
        setTimeout(() => btn.classList.remove('add-animation'), 300);
        
    } catch (error) {
        console.error('Erreur ajout panier:', error);
        showToast('❌ Erreur lors de l\'ajout', 'error');
    }
}

// Retirer une quantité spécifique (optionnel, pour bouton "retirer" si besoin)
async function retirerDuPanier(produitId, kgARetirer) {
    try {
        const { data: existing } = await window.supabase
            .from('panier')
            .select('quantite_kg')
            .eq('user_id', userId)
            .eq('produit_id', produitId)
            .single();
        
        if (!existing) {
            showToast('❌ Produit pas dans le panier', 'error');
            return;
        }
        
        const nouvelleQuantite = existing.quantite_kg - kgARetirer;
        
        if (nouvelleQuantite <= 0) {
            // Supprimer complètement
            await window.supabase
                .from('panier')
                .delete()
                .eq('user_id', userId)
                .eq('produit_id', produitId);
            
            showToast('🗑️ Produit retiré du panier', 'success');
        } else {
            // Mettre à jour
            await window.supabase
                .from('panier')
                .update({ quantite_kg: nouvelleQuantite })
                .eq('user_id', userId)
                .eq('produit_id', produitId);
            
            showToast(`✅ ${kgARetirer.toFixed(2)} kg retirés`, 'success');
        }
        
        await mettreAJourCompteur();
        
    } catch (error) {
        console.error('Erreur retrait:', error);
        showToast('❌ Erreur lors du retrait', 'error');
    }
}

// ========== Fonctions existantes (inchangées) ==========

// Afficher les produits groupés par catégorie
function afficherProduitsParCategorie() {
    if (produits.length === 0) {
        categoriesContainer.innerHTML = '<div class="aucun-resultat">Aucun produit disponible</div>';
        return;
    }
    
    const categories = {};
    produits.forEach(produit => {
        const cat = produit.categorie || 'Autres';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(produit);
    });
    
    categoriesContainer.innerHTML = '';
    
    for (const [categorie, produitsCat] of Object.entries(categories)) {
        const section = creerSectionCategorie(categorie, produitsCat);
        categoriesContainer.appendChild(section);
    }
}

// Créer une section de catégorie
function creerSectionCategorie(categorie, produitsCat) {
    const section = document.createElement('div');
    section.className = 'categorie-section';
    section.dataset.categorie = categorie;
    
    const titre = document.createElement('h2');
    titre.className = 'categorie-titre';
    titre.textContent = categorie;
    section.appendChild(titre);
    
    const scrollDiv = document.createElement('div');
    scrollDiv.className = 'produits-scroll';
    
    const produitsDiv = document.createElement('div');
    produitsDiv.className = 'produits-horizontal';
    
    produitsCat.forEach(produit => {
        const card = creerCarteProduit(produit);
        produitsDiv.appendChild(card);
    });
    
    scrollDiv.appendChild(produitsDiv);
    section.appendChild(scrollDiv);
    
    return section;
}

// Créer une carte produit
function creerCarteProduit(produit) {
    const template = document.getElementById('template-produit');
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector('.produit-card-horizontal');
    
    card.dataset.produitId = produit.id;
    card.dataset.prix = produit.prix;
    card.dataset.stock = produit.stock || 0;
    
    if (produit.stock <= 0) {
        card.classList.add('rupture-stock');
    } else if (produit.stock < 5) {
        card.classList.add('stock-faible');
    }
    
    const img = card.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        ouvrirPleinEcran(produit);
    });
    
    card.querySelector('.description-text').textContent = 
        produit.description || 'Aucune description';
    
    card.querySelector('.produit-nom').textContent = produit.nom;
    card.querySelector('.produit-prix').textContent = `${produit.prix} F/kg`;
    
    const montantInput = card.querySelector('.montant-input');
    const kgConverti = card.querySelector('.kg-converti');
    
    montantInput.value = produit.prix;
    updateKgFromMontant(montantInput, kgConverti, produit.prix);
    
    montantInput.addEventListener('input', () => {
        updateKgFromMontant(montantInput, kgConverti, produit.prix);
    });
    
    const resetBtn = card.querySelector('.btn-reset');
    resetBtn.addEventListener('click', () => {
        montantInput.value = produit.prix;
        updateKgFromMontant(montantInput, kgConverti, produit.prix);
    });
    
    const ajouterBtn = card.querySelector('.btn-ajouter-panier');
    ajouterBtn.addEventListener('click', () => {
        ajouterAuPanier(produit, parseFloat(montantInput.value));
    });
    
    return clone;
}

function updateKgFromMontant(montantInput, kgElement, prix) {
    const montant = parseFloat(montantInput.value) || 0;
    const kg = montant / prix;
    kgElement.textContent = kg.toFixed(2) + ' kg';
}

function ouvrirPleinEcran(produit) {
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
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const fermer = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    modal.querySelector('.modal-fermer').addEventListener('click', fermer);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) fermer();
    });
}

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