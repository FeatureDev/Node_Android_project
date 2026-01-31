import { API_BASE_URL } from './config.js';

console.log('?? Checkout page loaded');

const API_URL = `${API_BASE_URL}/api/products`;
let products = [];

// Update cart count in nav
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = cartCount;
        el.style.display = cartCount > 0 ? 'flex' : 'none';
    });
    console.log('? Cart count updated:', cartCount);
}

// Load products from API
async function loadProducts() {
    try {
        console.log('?? Loading products from API...');
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        products = await response.json();
        console.log('? Products loaded:', products.length);
        return products;
    } catch (error) {
        console.error('? Error loading products:', error);
        return [];
    }
}

// Load order items from cart
async function loadOrderItems() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('?? Loading cart items:', cart);
    
    const orderItemsContainer = document.getElementById('order-items');
    
    if (!orderItemsContainer) {
        console.error('? Order items container not found!');
        return;
    }
    
    if (cart.length === 0) {
        console.log('?? Cart is empty, redirecting to cart page');
        window.location.href = 'cart.html';
        return;
    }
    
    // Load products if not already loaded
    if (products.length === 0) {
        await loadProducts();
    }
    
    // Match cart items with product data
    const orderItems = cart.map(cartItem => {
        const product = products.find(p => p.id === cartItem.id);
        if (!product) {
            console.warn('?? Product not found for cart item:', cartItem);
            return null;
        }
        return {
            ...product,
            quantity: cartItem.quantity
        };
    }).filter(item => item !== null);
    
    console.log('? Rendering', orderItems.length, 'items');
    
    orderItemsContainer.innerHTML = orderItems.map(item => {
        console.log('Rendering item:', item.name, 'Price:', item.price, 'Quantity:', item.quantity);
        return `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" class="order-item-image" onerror="console.error('Failed to load image: ${item.image}'); this.src='picture/placeholder.png'">
            <div class="order-item-details">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-quantity">Antal: ${item.quantity}</div>
            </div>
            <div class="order-item-price">${(item.price * item.quantity).toFixed(0)} kr</div>
        </div>
    `;
    }).join('');
    
    calculateTotals(orderItems);
}

// Calculate all totals
function calculateTotals(orderItems) {
    const subtotal = orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const shippingCost = subtotal >= 500 ? 0 : 49; // Free shipping over 500 kr
    const vatRate = 0.25; // 25% VAT
    const subtotalBeforeVat = subtotal / (1 + vatRate);
    const vat = subtotal - subtotalBeforeVat;
    const total = subtotal + shippingCost;
    
    console.log('?? Calculations:', {
        subtotal: subtotal,
        shippingCost: shippingCost,
        vat: vat,
        total: total
    });
    
    // Update UI
    const subtotalEl = document.getElementById('subtotal');
    const shippingEl = document.getElementById('shipping');
    const vatEl = document.getElementById('vat');
    const totalEl = document.getElementById('total');
    const paymentAmountEl = document.getElementById('payment-amount');
    
    if (subtotalEl) subtotalEl.textContent = `${subtotal.toFixed(0)} kr`;
    if (shippingEl) shippingEl.textContent = shippingCost === 0 ? 'Gratis' : `${shippingCost} kr`;
    if (vatEl) vatEl.textContent = `${vat.toFixed(0)} kr`;
    if (totalEl) totalEl.textContent = `${total.toFixed(0)} kr`;
    if (paymentAmountEl) paymentAmountEl.textContent = `${total.toFixed(0)} kr`;
    
    console.log('? UI updated with totals');
}

// Confirm payment
const confirmButton = document.getElementById('confirm-payment');
if (confirmButton) {
    confirmButton.addEventListener('click', () => {
        console.log('?? Payment confirmation clicked');
        
        // Show loading
        const qrLoader = document.getElementById('qr-loader');
        const qrCode = document.getElementById('qr-code');
        
        if (qrLoader) qrLoader.style.display = 'flex';
        if (qrCode) qrCode.style.display = 'none';
        
        // Simulate payment processing
        setTimeout(() => {
            alert('Betalning bekräftad! \n\nDin order har skickats. \nTack för ditt köp!');
            
            // Clear cart
            localStorage.removeItem('cart');
            console.log('? Cart cleared');
            
            // Redirect to home
            window.location.href = 'index.html';
        }, 2000);
    });
} else {
    console.error('? Confirm payment button not found!');
}

// Initialize
console.log('?? Initializing checkout...');
updateCartCount();
loadOrderItems();

console.log('? Checkout initialized');

