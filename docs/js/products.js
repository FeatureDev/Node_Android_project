'use strict';

console.log('Hello world');

const API_URL = '/api/products';

// Global variables for products and cart
let allProducts = [];
let filteredProducts = [];
let cart = [];
let products = [];

// ===== FEATURED PRODUCTS (Home Page) =====
async function loadFeaturedProducts() {
    console.log('?? loadFeaturedProducts() called');
    try {
        console.log('?? Fetching from:', API_URL);
        const response = await fetch(API_URL);
        console.log('?? Response status:', response.status);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const productsData = await response.json();
        console.log('? Products loaded:', productsData.length);
        const featured = productsData.slice(0, 4); // Show 4 products to match skeleton
        console.log('? Featured products:', featured.length);
        
        displayFeaturedProducts(featured);
    } catch (error) {
        console.error('? Error loading products:', error);
        displayError('featured-products');
    }
}

function displayFeaturedProducts(products) {
    console.log('?? displayFeaturedProducts() called with', products.length, 'products');
    const container = document.getElementById('featured-products');
    
    if (!container) {
        console.error('? Container #featured-products not found!');
        return;
    }
    
    console.log('? Container found:', container);
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Inga produkter tillgängliga</p>';
        return;
    }
    
    const html = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'Ingen beskrivning tillgänglig'}</p>
                <div class="product-footer">
                    <span class="product-price">${product.price} kr</span>
                    <button class="add-to-cart" 
                            onclick="addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        Lägg till
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('?? HTML generated, length:', html.length);
    container.innerHTML = html;
    console.log('? Products displayed!');
}

// ===== ALL PRODUCTS (Products Page) =====
async function loadAllProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        displayProducts(filteredProducts);
        populateCategoryFilter();
    } catch (error) {
        console.error('Error loading products:', error);
        displayError('all-products');
    }
}

function displayProducts(products) {
    const container = document.getElementById('all-products');
    
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; grid-column: 1/-1; padding: 3rem;">Inga produkter hittades</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || 'Ingen beskrivning tillgänglig'}</p>
                ${product.category ? `<div style="margin-top: 0.5rem;"><span style="background: #f1f5f9; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; color: #64748b;">${product.category}</span></div>` : ''}
                <div class="product-footer">
                    <span class="product-price">${product.price} kr</span>
                    <button class="add-to-cart" 
                            onclick="addToCart(${product.id})" 
                            ${product.stock === 0 ? 'disabled' : ''}>
                        Lägg till
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function populateCategoryFilter() {
    const categories = [...new Set(allProducts.map(p => p.category).filter(c => c))];
    const select = document.getElementById('category-filter');
    
    if (!select) return;
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });
}

function filterProducts() {
    const categoryFilter = document.getElementById('category-filter').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    
    filteredProducts = allProducts.filter(product => {
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesSearch = !searchTerm || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm));
        
        return matchesCategory && matchesSearch;
    });
    
    displayProducts(filteredProducts);
}

// ===== CART FUNCTIONS =====
async function loadCart() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        products = await response.json();
        cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        displayCart();
        updateCartCount();
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

function displayCart() {
    const container = document.getElementById('cart-items');
    const summaryContainer = document.getElementById('cart-summary');
    
    if (!container) return;
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                <h3>Din varukorg ar tom</h3>
                <p>Lagg till nagra produkter for att fortsatta</p>
                <a href="products.html" class="btn btn-primary">Handla Nu</a>
            </div>
        `;
        if (summaryContainer) summaryContainer.style.display = 'none';
        return;
    }
    
    if (summaryContainer) summaryContainer.style.display = 'block';
    
    const cartItems = cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (!product) return null;
        
        return {
            ...product,
            quantity: cartItem.quantity,
            total: product.price * cartItem.quantity
        };
    }).filter(item => item !== null);
    
    container.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-info">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">${item.price} kr</p>
                <div class="cart-item-controls">
                    <div class="quantity-control">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity - 1})">-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, ${item.quantity + 1})" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">Ta bort</button>
                </div>
                <p style="margin-top: 0.5rem; font-weight: bold; color: #6366f1;">Totalt: ${item.total} kr</p>
            </div>
        </div>
    `).join('');
    
    updateSummary(cartItems);
}

function updateSummary(cartItems) {
    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * 0.25;
    const total = subtotal;
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(2)} kr`;
    if (taxEl) taxEl.textContent = `${tax.toFixed(2)} kr`;
    if (totalEl) totalEl.textContent = `${total.toFixed(2)} kr`;
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);
    
    if (newQuantity > product.stock) {
        showNotification('Inte tillrackligt med lager!');
        return;
    }
    
    if (cartItem) {
        cartItem.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount();
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCount();
    showNotification('Produkt borttagen fran varukorgen');
}

// ===== SHARED UTILITY FUNCTIONS =====
function displayError(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
            <p>Kunde inte ladda produkter. Var vanlig forson igen senare.</p>
        </div>
    `;
}

function getProductEmoji(category) {
    const emojiMap = {
        'Electronics': '??',
        'Clothing': '??',
        'Books': '??',
        'Food': '??',
        'Toys': '??',
        'Sports': '?',
        'Home': '??',
        'Garden': '??'
    };
    return emojiMap[category] || '??';
}

function getStockClass(stock) {
    if (stock === 0) return 'out-of-stock';
    if (stock < 10) return 'low-stock';
    return 'in-stock';
}

function getStockText(stock) {
    if (stock === 0) return 'Slutsald';
    if (stock < 10) return `Endast ${stock} kvar`;
    return 'I lager';
}

function addToCart(productId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    
    showNotification('Produkt tillagd i varukorgen!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const countElements = document.querySelectorAll('.cart-count');
    countElements.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    // Detect which page we're on and load appropriate content
    const featuredContainer = document.getElementById('featured-products');
    const allProductsContainer = document.getElementById('all-products');
    const cartContainer = document.getElementById('cart-items');
    
    // Home page - Featured products
    if (featuredContainer) {
        loadFeaturedProducts();
    }
    
    // Products page - All products with filters
    if (allProductsContainer) {
        loadAllProducts();
        
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('search-input');
        
        if (categoryFilter) categoryFilter.addEventListener('change', filterProducts);
        if (searchInput) searchInput.addEventListener('input', filterProducts);
    }
    
    // Cart page
    if (cartContainer) {
        loadCart();
    }
    
    // Update cart count on all pages
    updateCartCount();
    
    // Handle click button if it exists (for demo page)
    const button = document.getElementById('clickButton');
    const message = document.getElementById('message');
    
    if (button && message) {
        let clickCount = 0;
        button.addEventListener('click', function() {
            clickCount++;
            message.textContent = `Du har klickat ${clickCount} ${clickCount === 1 ? 'gång' : 'gånger'}!`;
            
            message.style.opacity = '0';
            setTimeout(() => {
                message.style.transition = 'opacity 0.3s';
                message.style.opacity = '1';
            }, 50);
        });
    }
    
    console.log('Sidan är laddad och redo!');
});
