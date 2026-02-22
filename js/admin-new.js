// admin-new.js - Gestion produits avec Supabase
// Utilise window.supabase

// Configuration
const BUCKET_NAME = 'produits';

// État
let produits = [];

// Éléments DOM
const modal = document.getElementById('modal-produit');
const btnAjouter = document.getElementById('btn-ajouter');
const btnAnnuler = document.getElementById('annuler-produit');
const btnSauvegarder = document.getElementById('sauvegarder-produit');
const form = document.getElementById('form-produit');
const imageInput = document.getElementById('produit-image');
const imagePreview = document.getElementById('image-preview');
const grid = document.getElementById('produits-grid');

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin produits chargé');
    chargerProduits();
    
    // Événements
    btnAjouter.addEventListener('click', ouvrirModal);
    btnAnnuler.addEventListener('click', fermerModal);
    document.querySelector('.modal-close').addEventListener('click', fermerModal);
    
    // Fermer modal en cliquant sur overlay
    modal.addEventListener('click', function(e) {
        if (e.target === modal) fermerModal();
    });
    
    // Preview image
    imageInput.addEventListener('change', previewImage);
    
    // Sauvegarde
    btnSauvegarder.addEventListener('click', creerProduit);
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

// Afficher les produits
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

// Créer une carte produit
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
    
    // Bouton supprimer
    card.querySelector('.btn-supprimer').addEventListener('click', () => {
        supprimerProduit(produit.id, produit.image_url);
    });
    
    return clone;
}

// Ouvrir modal
function ouvrirModal() {
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.innerHTML = '';
    modal.classList.add('show');
}

// Fermer modal
function fermerModal() {
    modal.classList.remove('show');
}

// Preview image
function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier type
    if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image');
        imageInput.value = '';
        return;
    }
    
    // Vérifier taille (max 5MB)
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

// Créer un produit
async function creerProduit() {
    const nom = document.getElementById('produit-nom').value.trim();
    const prix = parseInt(document.getElementById('produit-prix').value);
    const file = imageInput.files[0];
    
    if (!nom || !prix || !file) {
        alert('Tous les champs sont requis');
        return;
    }
    
    btnSauvegarder.disabled = true;
    btnSauvegarder.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';
    
    try {
        // 1. Upload image vers Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `produits/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await window.supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Obtenir l'URL publique de l'image
        const { data: { publicUrl } } = window.supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filePath);
        
        // 3. Créer l'entrée dans la table produits
        const { data, error } = await window.supabase
            .from('produits')
            .insert([
                {
                    nom: nom,
                    prix: prix,
                    image_url: publicUrl
                }
            ])
            .select();
        
        if (error) throw error;
        
        // 4. Recharger la liste
        await chargerProduits();
        fermerModal();
        
    } catch (error) {
        console.error('Erreur création:', error);
        alert('Erreur lors de la création du produit');
    } finally {
        btnSauvegarder.disabled = false;
        btnSauvegarder.innerHTML = '<i class="fas fa-save"></i> Créer produit';
    }
}

// Supprimer un produit
async function supprimerProduit(id, imageUrl) {
    if (!confirm('Supprimer ce produit ?')) return;
    
    try {
        // Extraire le chemin de l'image depuis l'URL
        const path = imageUrl.split('/').pop();
        
        // 1. Supprimer l'image du storage
        if (path) {
            await window.supabase.storage
                .from(BUCKET_NAME)
                .remove([`produits/${path}`]);
        }
        
        // 2. Supprimer l'entrée de la table
        const { error } = await window.supabase
            .from('produits')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        // 3. Recharger la liste
        await chargerProduits();
        
    } catch (error) {
        console.error('Erreur suppression:', error);
        alert('Erreur lors de la suppression');
    }
}