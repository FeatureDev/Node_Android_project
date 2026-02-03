import { API_BASE_URL } from './config.js';

console.log('????? Admin page loaded');

// Use API_BASE_URL from config.js
const API_URL = API_BASE_URL;

let products = [];
let editingProductId = null;
let availableImages = [];

// Create image picker modal dynamically
function createImagePickerModal() {
    const modal = document.createElement('div');
    modal.id = 'image-picker-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px;">
            <div class="modal-header">
                <h2>Valj Bild</h2>
                <span class="close" id="close-image-picker">&times;</span>
            </div>
            <div class="image-gallery" id="image-gallery">
                <div class="loading">Laddar bilder...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close button
    document.getElementById('close-image-picker').addEventListener('click', () => {
        modal.classList.remove('show');
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target.id === 'image-picker-modal') {
            modal.classList.remove('show');
        }
    });
}

// Load available images
async function loadImages() {
    try {
        const response = await fetch(`${API_URL}/api/images`, {
            credentials: 'include'
        });
        availableImages = await response.json();
        return availableImages;
    } catch (error) {
        console.error('Error loading images:', error);
        return [];
    }
}

// Display image gallery
function displayImageGallery() {
    const gallery = document.getElementById('image-gallery');
    
    if (availableImages.length === 0) {
        gallery.innerHTML = '<div class="loading">Inga bilder hittades</div>';
        return;
    }
    
    gallery.innerHTML = availableImages.map(img => `
        <div class="image-item" data-path="${img.path}">
            <img src="../${img.path}" alt="${img.name}" onerror="this.src='../picture/1.jpg'">
            <div class="image-name">${img.name}</div>
        </div>
    `).join('');
    
    // Add click handlers to images
    document.querySelectorAll('.image-item').forEach(item => {
        item.addEventListener('click', () => {
            const imagePath = item.dataset.path;
            selectImage(imagePath);
        });
    });
}

// Select an image
function selectImage(imagePath) {
    document.getElementById('product-image').value = imagePath;
    
    // Show preview
    const preview = document.getElementById('current-image-preview');
    const img = document.getElementById('current-image');
    if (preview && img) {
        img.src = '../' + imagePath;
        preview.style.display = 'block';
    }
    
    // Close image picker modal
    document.getElementById('image-picker-modal').classList.remove('show');
}



// Predefined product names per category (professional Swedish names)
const productNamesByCategory = {
    'Dam Mode': [
        'Elegant Aftonklänning',
        'Klassisk Blus',
        'Modern Kavaj',
        'Sommarklänning',
        'Vinterkappa',
        'Businesskjol',
        'Stickad Tröja',
        'Bomullsskjorta',
        'Festklänning',
        'Lång Cardigan'
    ],
    'Herr Mode': [
        'Kostymbyxa',
        'Businessskjorta',
        'Kavaj',
        'Polotröja',
        'Stickad Tröja',
        'Chinos',
        'Jeans',
        'Vinterjacka',
        'Hoodie',
        'Skjorta Premium'
    ],
    'Accessoarer': [
        'Läderväska',
        'Plånbok',
        'Bälte',
        'Halsduk',
        'Mössa',
        'Handskar',
        'Solglasögon',
        'Armband',
        'Halsband',
        'Örhängen'
    ],
    'Skor': [
        'Läderskor',
        'Sneakers',
        'Stövlar',
        'Sandaletter',
        'Loafers',
        'Pumps',
        'Boots',
        'Träningsskor',
        'Vardagsskor',
        'Festskor'
    ]
};

// Update product name dropdown based on selected category
function updateProductNameOptions(selectedCategory) {
    const productNameSelect = document.getElementById('product-name');
    const names = productNamesByCategory[selectedCategory] || [];
    
    if (!selectedCategory) {
        productNameSelect.innerHTML = '<option value="">Valj kategori forst...</option>';
        productNameSelect.disabled = true;
        return;
    }
    
    productNameSelect.disabled = false;
    productNameSelect.innerHTML = '<option value="">Valj produktnamn...</option>' +
        names.map(name => `<option value="${name}">${name}</option>`).join('');
}

// Category change listener
document.getElementById('product-category').addEventListener('change', (e) => {
    updateProductNameOptions(e.target.value);
});

// Check authentication
async function checkAuth() {
try {
    const response = await fetch(`${API_URL}/api/check-auth`, {
        credentials: 'include'
    });
    const data = await response.json();
        
        if (!data.authenticated || data.user.role !== 'admin') {
            window.location.href = '/login.html';
            return false;
        }
        
        document.getElementById('user-email').textContent = data.user.email;
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Load products
async function loadProducts() {
try {
    const response = await fetch(`${API_URL}/api/products`, {
        credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch products');
        
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-grid').innerHTML = `
            <div class="loading">Kunde inte ladda produkter</div>
        `;
    }
}

// Display products
function displayProducts() {
    const grid = document.getElementById('products-grid');
    
    if (products.length === 0) {
        grid.innerHTML = '<div class="loading">Inga produkter hittades</div>';
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="../${product.image}" alt="${product.name}" class="product-card-image" onerror="this.src='../picture/1.jpg'">
            <div class="product-card-name">${product.name}</div>
            <div class="product-card-description">${product.description || 'Ingen beskrivning'}</div>
            <div class="product-card-info">
                <div class="product-card-price">${product.price} kr</div>
                <div class="product-card-stock">Lager: ${product.stock}</div>
            </div>
            <div class="product-card-info">
                <div class="product-card-stock">${product.category || 'Ingen kategori'}</div>
            </div>
            <div class="product-card-actions">
                <button class="btn btn-secondary btn-small" onclick="window.editProduct(${product.id})">Redigera</button>
                <button class="btn btn-danger btn-small" onclick="window.deleteProduct(${product.id})">Ta bort</button>
            </div>
        </div>
    `).join('');
}

// Open modal for adding product
document.getElementById('add-product-btn').addEventListener('click', () => {
    editingProductId = null;
    document.getElementById('modal-title').textContent = 'Lagg till produkt';
    document.getElementById('product-form').reset();
    
    // Reset category dropdown and name dropdown
    document.getElementById('product-category').value = '';
    document.getElementById('product-name').innerHTML = '<option value="">Valj kategori forst...</option>';
    document.getElementById('product-name').disabled = true;
    
    document.getElementById('product-modal').classList.add('show');
});

// Edit product
window.editProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modal-title').textContent = 'Redigera produkt';
    document.getElementById('product-id').value = product.id;
    
    // Set category first to populate name options
    document.getElementById('product-category').value = product.category || 'Dam Mode';
    updateProductNameOptions(product.category || 'Dam Mode');
    
    // Set name (either from predefined list or custom)
    const productNameSelect = document.getElementById('product-name');
    const nameExists = Array.from(productNameSelect.options).some(opt => opt.value === product.name);
    
    if (nameExists) {
        productNameSelect.value = product.name;
    } else {
        // Add custom name as option if not in predefined list
        const customOption = document.createElement('option');
        customOption.value = product.name;
        customOption.textContent = product.name + ' (anpassat)';
        productNameSelect.appendChild(customOption);
        productNameSelect.value = product.name;
    }
    
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-image').value = product.image;
    
    // Show image preview
    const preview = document.getElementById('current-image-preview');
    const img = document.getElementById('current-image');
    if (preview && img && product.image) {
        img.src = '../' + product.image;
        preview.style.display = 'block';
    }
    
    document.getElementById('product-modal').classList.add('show');
}

// Delete product
window.deleteProduct = async function(id) {
    if (!confirm('Ar du saker pa att du vill ta bort denna produkt?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/products/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        console.log('? Product deleted');
        alert('Produkt borttagen!');
        loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Kunde inte ta bort produkt: ' + error.message);
    }
}

// Save product (add or edit)
document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('product-name').value,
        description: document.getElementById('product-description').value,
        price: parseFloat(document.getElementById('product-price').value),
        stock: parseInt(document.getElementById('product-stock').value),
        category: document.getElementById('product-category').value,
        image: document.getElementById('product-image').value || 'picture/1.jpg'
    };
    
    try {
        const url = editingProductId ? `${API_URL}/api/products/${editingProductId}` : `${API_URL}/api/products`;
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }
        
        console.log('? Product saved');
        alert(editingProductId ? 'Produkt uppdaterad!' : 'Produkt tillagd!');
        
        // Close modal and reload
        document.getElementById('product-modal').classList.remove('show');
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Kunde inte spara produkt: ' + error.message);
    }
});

// Close modal
document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('show');
    // Hide image preview
    const preview = document.getElementById('current-image-preview');
    if (preview) preview.style.display = 'none';
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('show');
    // Hide image preview
    const preview = document.getElementById('current-image-preview');
    if (preview) preview.style.display = 'none';
});

// Click outside modal to close
document.getElementById('product-modal').addEventListener('click', (e) => {
    if (e.target.id === 'product-modal') {
        document.getElementById('product-modal').classList.remove('show');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
try {
    const response = await fetch(`${API_URL}/api/logout`, { 
        method: 'POST',
        credentials: 'include'
    });
        if (response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

// Initialize
(async () => {
    const isAuth = await checkAuth();
    if (isAuth) {
        loadProducts();
        await loadImages();
        createImagePickerModal();
        
        // Setup browse images button
        const productModal = document.getElementById('product-modal');
        if (!document.getElementById('browse-images-btn')) {
            // Create button dynamically if not in HTML
            const imageInput = document.getElementById('product-image');
            imageInput.readOnly = true;
            
            const browseBtn = document.createElement('button');
            browseBtn.type = 'button';
            browseBtn.className = 'btn btn-secondary';
            browseBtn.id = 'browse-images-btn';
            browseBtn.textContent = '?? Valj Bild';
            browseBtn.style.marginTop = '8px';
            
            imageInput.parentElement.insertBefore(browseBtn, imageInput.nextSibling);
            
            // Add preview container
            const previewDiv = document.createElement('div');
            previewDiv.id = 'current-image-preview';
            previewDiv.style.cssText = 'margin-top: 10px; display: none;';
            previewDiv.innerHTML = '<img id="current-image" src="" alt="Preview" style="max-width: 200px; max-height: 200px; border: 2px solid #e5e7eb; border-radius: 8px;">';
            browseBtn.parentElement.appendChild(previewDiv);
        }
        
        // Browse images button click
        document.getElementById('browse-images-btn').addEventListener('click', async () => {
            await loadImages();
            displayImageGallery();
            document.getElementById('image-picker-modal').classList.add('show');
        });
    }
})();

console.log('? Admin page initialized');
