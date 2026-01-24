console.log('????? Admin page loaded');

let products = [];
let editingProductId = null;

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
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
        const response = await fetch('/api/products');
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
                <button class="btn btn-secondary btn-small" onclick="editProduct(${product.id})">Redigera</button>
                <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">Ta bort</button>
            </div>
        </div>
    `).join('');
}

// Open modal for adding product
document.getElementById('add-product-btn').addEventListener('click', () => {
    editingProductId = null;
    document.getElementById('modal-title').textContent = 'Lagg till produkt';
    document.getElementById('product-form').reset();
    document.getElementById('product-modal').classList.add('show');
});

// Edit product
function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    editingProductId = id;
    document.getElementById('modal-title').textContent = 'Redigera produkt';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-stock').value = product.stock;
    document.getElementById('product-category').value = product.category || 'Dam Mode';
    document.getElementById('product-image').value = product.image;
    
    document.getElementById('product-modal').classList.add('show');
}

// Delete product
async function deleteProduct(id) {
    if (!confirm('Ar du saker pa att du vill ta bort denna produkt?')) return;
    
    try {
        const response = await fetch(`/api/products/${id}`, {
            method: 'DELETE'
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
        const url = editingProductId ? `/api/products/${editingProductId}` : '/api/products';
        const method = editingProductId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
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
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    document.getElementById('product-modal').classList.remove('show');
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
        const response = await fetch('/api/logout', { method: 'POST' });
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
    }
})();

console.log('? Admin page initialized');
