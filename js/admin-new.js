// admin-new.js - Gestion produits avec Supabase
// Version modification directe dans le modal

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
    
    // Plus de modal détail séparé - on utilise le même modal
    
    // Fermer modal en cliquant sur overlay
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
    
    const img = card.querySelector('.produit-image');
    img.src = produit.image_url;
    img.alt = produit.nom;
    
    card.querySelector('.produit-nom-compact').textContent = produit.nom;
    card.querySelector('.produit-prix-compact').textContent = `${produit.prix} F`;
    
    // Clic sur la carte → ouvrir en mode édition directe
    card.addEventListener('click', () => editerProduit(produit));
    
    return clone;
}

// Ouvrir un produit en mode édition directe
function editerProduit(produit) {
    console.log('Édition produit:', produit);
    
    modeEdition = true;
    produitSelectionne = produit;
    
    // Remplir le formulaire
    inputNom.value = produit.nom || '';
    inputCategorie.value = produit.categorie || '';
    inputPrix.value = produit.prix || 0;
    inputStock.value = produit.stock || 0;
    inputDescription.value = produit.description || '';
    
    // Afficher l'image existante
    if (produit.image_url) {
        imagePreview.innerHTML = `<img src="${produit.image_url}" alt="Aperçu">`;
        imagePreview.style.display = 'block';
    }
    
    // L'image n'est pas obligatoire en édition
    imageInput.required = false;
    
    // Changer le titre et le bouton
    modalTitre.innerHTML = '<i class="fas fa-edit"></i> Modifier produit';
    btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Sauvegarder les modifications';
    
    // Stocker l'ID
    btnSauvegarder.dataset.produitId = produit.id;
    
    // Ouvrir le modal
    modalAjout.classList.add('show');
}

// Ouvrir modal d'ajout (nouveau produit)
function ouvrirModalAjout() {
    console.log('Nouveau produit');
    
    modeEdition = false;
    produitSelectionne = null;
    
    // Reset formulaire
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    imageInput.required = true;
    
    // Changer le titre et le bouton
    modalTitre.innerHTML = '<i class="fas fa-box"></i> Nouveau produit';
    btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Créer produit';
    
    // Supprimer l'ID
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
    
    // Validations
    if (!nom || !categorie || !prix) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
    }
    
    btnSauvegarder.disabled = true;
    btnSauvegarder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';
    
    try {
        let imageUrl = modeEdition ? produitSelectionne?.image_url : '';
        
        // Si nouvelle image
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
            
            // Supprimer ancienne image si modification
            if (modeEdition && produitSelectionne?.image_url) {
                const oldPath = produitSelectionne.image_url.split('/').pop();
                await window.supabase.storage
                    .from(BUCKET_NAME)
                    .remove([`produits/${oldPath}`]);
            }
        }
        
        // Préparer les données
        const produitData = {
            nom: nom,
            categorie: categorie,
            prix: prix,
            stock: stock,
            description: description
        };
        
        if (imageUrl) {
            produitData.image_url = imageUrl;
        }
        
        if (modeEdition && produitId) {
            // MODIFICATION
            console.log('Modification ID:', produitId);
            
            const { error } = await window.supabase
                .from('produits')
                .update(produitData)
                .eq('id', produitId);
            
            if (error) throw error;
            
            alert('✅ Produit modifié avec succès !');
            
        } else {
            // CRÉATION
            if (!file) {
                alert('Une image est requise pour un nouveau produit');
                btnSauvegarder.disabled = false;
                btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Créer produit';
                return;
            }
            
            produitData.image_url = imageUrl;
            produitData.created_at = new Date();
            
            const { error } = await window.supabase
                .from('produits')
                .insert([produitData]);
            
            if (error) throw error;
            
            alert('✅ Nouveau produit créé !');
        }
        
        // Recharger et fermer
        await chargerProduits();
        fermerModalAjout();
        
    } catch (error) {
        console.error('Erreur:', error);
        alert('❌ Erreur: ' + error.message);
    } finally {
        btnSauvegarder.disabled = false;
        btnSauvegarder.innerHTML = modeEdition ? 
            '<i class="fas fa-save"></i> Sauvegarder les modifications' : 
            '<i class="fas fa-save"></i> Créer produit';
    }
}

// Supprimer un produit
async function supprimerProduit(id, imageUrl) {
    if (!confirm('Supprimer ce produit ?')) return;
    
    try {
        if (imageUrl) {
            const path = imageUrl.split('/').pop();
            if (path) {
                await window.supabase.storage
                    .from(BUCKET_NAME)
                    .remove([`produits/${path}`]);
            }
        }
        
        const { error } = await window.supabase
            .from('produits')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        await chargerProduits();
        alert('✅ Produit supprimé !');
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('❌ Erreur: ' + error.message);
    }
}

// Pour supprimer depuis la carte (si besoin)
window.supprimerProduit = supprimerProduit;