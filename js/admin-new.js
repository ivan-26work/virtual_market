// admin-new.js - Gestion produits avec Supabase
// Version avec champ actif

// Configuration
const BUCKET_NAME = 'produits';

// État
let produits = [];
let produitSelectionne = null;
let modeEdition = false;

// Éléments DOM
const modalAjout = document.getElementById('modal-produit');
const modalDetail = document.getElementById('modal-detail');
const modalTitre = document.getElementById('modal-titre');
const btnAjouter = document.getElementById('btn-ajouter');
const btnAnnuler = document.getElementById('annuler-produit');
const btnSauvegarder = document.getElementById('sauvegarder-produit');
const form = document.getElementById('form-produit');
const imageInput = document.getElementById('produit-image');
const imagePreview = document.getElementById('image-preview');
const grid = document.getElementById('produits-grid');
const detailBody = document.getElementById('detail-body');
const btnModifierDetail = document.getElementById('btn-modifier-produit');
const btnSupprimerDetail = document.getElementById('btn-supprimer-produit');

// Champs du formulaire
const inputNom = document.getElementById('produit-nom');
const inputCategorie = document.getElementById('produit-categorie');
const inputPrix = document.getElementById('produit-prix');
const inputStock = document.getElementById('produit-stock');
const inputDescription = document.getElementById('produit-description');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin produits chargé');
    chargerProduits();
    
    // Événements modals
    btnAjouter.addEventListener('click', ouvrirModalAjout);
    btnAnnuler.addEventListener('click', fermerModalAjout);
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', fermerModalAjout);
    });
    
    modalAjout.addEventListener('click', function(e) {
        if (e.target === modalAjout) fermerModalAjout();
    });
    
    // Preview image
    imageInput.addEventListener('change', previewImage);
    
    // Sauvegarde
    btnSauvegarder.addEventListener('click', sauvegarderProduit);
});

// Charger tous les produits
async function chargerProduits() {
    try {
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
        grid.innerHTML = '<div class="loading">Erreur de chargement</div>';
    }
}

// Afficher les produits en grille compacte
function afficherProduits() {
    if (produits.length === 0) {
        grid.innerHTML = '<div class="loading">Aucun produit</div>';
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
    const card = clone.querySelector('.produit-card-compact');
    
    card.dataset.produitId = produit.id;
    
    // Si inactif, ajouter classe grisée
    if (produit.actif === false) {
        card.classList.add('produit-inactif');
    }
    
    const img = card.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    
    card.querySelector('.produit-nom-compact').textContent = produit.nom;
    card.querySelector('.produit-prix-compact').textContent = `${produit.prix} F`;
    
    // Ajouter indicateur inactif
    if (produit.actif === false) {
        const badge = document.createElement('span');
        badge.className = 'badge-inactif';
        badge.textContent = 'INACTIF';
        card.querySelector('.produit-info-compact').appendChild(badge);
    }
    
    // Clic sur la carte → ouvrir en mode édition
    card.addEventListener('click', () => editerProduit(produit));
    
    return clone;
}

// Ouvrir un produit en mode édition
function editerProduit(produit) {
    modeEdition = true;
    produitSelectionne = produit;
    
    inputNom.value = produit.nom || '';
    inputCategorie.value = produit.categorie || '';
    inputPrix.value = produit.prix || 0;
    inputStock.value = produit.stock || 0;
    inputDescription.value = produit.description || '';
    
    if (produit.image_url) {
        imagePreview.innerHTML = `<img src="${produit.image_url}" alt="Aperçu">`;
        imagePreview.style.display = 'block';
    }
    
    imageInput.required = false;
    modalTitre.innerHTML = '<i class="fas fa-edit"></i> Modifier produit';
    btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Sauvegarder';
    btnSauvegarder.dataset.produitId = produit.id;
    
    modalAjout.classList.add('show');
}

// Ouvrir modal d'ajout
function ouvrirModalAjout() {
    modeEdition = false;
    produitSelectionne = null;
    
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    imageInput.required = true;
    
    modalTitre.innerHTML = '<i class="fas fa-box"></i> Nouveau produit';
    btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Créer produit';
    delete btnSauvegarder.dataset.produitId;
    
    modalAjout.classList.add('show');
}

// Fermer modal ajout
function fermerModalAjout() {
    modalAjout.classList.remove('show');
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    delete btnSauvegarder.dataset.produitId;
    modeEdition = false;
    produitSelectionne = null;
}

// Preview image
function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        imageInput.value = '';
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        alert('Image trop volumineuse (max 5MB)');
        imageInput.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" alt="Aperçu">`;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Sauvegarder (création ou modification)
async function sauvegarderProduit() {
    const nom = inputNom.value.trim();
    const categorie = inputCategorie.value;
    const prix = parseInt(inputPrix.value);
    const stock = parseInt(inputStock.value) || 0;
    const description = inputDescription.value.trim();
    const file = imageInput.files[0];
    const produitId = btnSauvegarder.dataset.produitId;
    
    if (!nom || !categorie || !prix) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    btnSauvegarder.disabled = true;
    btnSauvegarder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';
    
    try {
        let imageUrl = modeEdition ? produitSelectionne?.image_url : '';
        
        if (file) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
            const filePath = `produits/${fileName}`;
            
            const { error: uploadError } = await window.supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file);
            
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = window.supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);
            
            imageUrl = publicUrl;
            
            if (modeEdition && produitSelectionne?.image_url) {
                const oldPath = produitSelectionne.image_url.split('/').pop();
                await window.supabase.storage
                    .from(BUCKET_NAME)
                    .remove([`produits/${oldPath}`]);
            }
        }
        
        const produitData = {
            nom: nom,
            categorie: categorie,
            prix: prix,
            stock: stock,
            description: description
        };
        
        if (imageUrl) produitData.image_url = imageUrl;
        
        if (modeEdition && produitId) {
            // MODIFICATION
            const { error } = await window.supabase
                .from('produits')
                .update(produitData)
                .eq('id', produitId);
            
            if (error) throw error;
            alert('✅ Produit modifié !');
            
        } else {
            // CRÉATION
            if (!file) {
                alert('Image requise pour un nouveau produit');
                btnSauvegarder.disabled = false;
                btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Créer produit';
                return;
            }
            
            produitData.image_url = imageUrl;
            produitData.actif = true; // Par défaut actif
            produitData.created_at = new Date();
            
            const { error } = await window.supabase
                .from('produits')
                .insert([produitData]);
            
            if (error) throw error;
            alert('✅ Nouveau produit créé !');
        }
        
        await chargerProduits();
        fermerModalAjout();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur: ' + error.message);
    } finally {
        btnSauvegarder.disabled = false;
        btnSauvegarder.innerHTML = modeEdition ? 
            '<i class="fas fa-save"></i> Sauvegarder' : 
            '<i class="fas fa-save"></i> Créer produit';
    }
}