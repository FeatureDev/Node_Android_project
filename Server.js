'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Disable caching for development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    // Only set text/html for HTML files
    if (req.path.endsWith('.html') || req.path === '/') {
        res.set('Content-Type', 'text/html; charset=utf-8');
    }
    next();
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));
app.use(express.json());

// Mock product data - Fashion/Clothing items
const products = [
    {
        id: 1,
        name: "Elegant Sommarklanning",
        description: "Latt och luftig klanning perfekt for varma sommardagar",
        price: 599,
        category: "Dam Mode",
        stock: 15,
        image: "picture/1.jpg"
    },
    {
        id: 2,
        name: "Modern Herrjacka",
        description: "Stilren jacka for bade vardag och fest",
        price: 899,
        category: "Herr Mode",
        stock: 8,
        image: "picture/2.jpg"
    },
    {
        id: 3,
        name: "Designervaska",
        description: "Exklusiv handvaska i akta lader",
        price: 1299,
        category: "Accessoarer",
        stock: 5,
        image: "picture/3.jpg"
    },
    {
        id: 4,
        name: "Klassisk Blus",
        description: "Tidlos blus som passar till allt",
        price: 449,
        category: "Dam Mode",
        stock: 20,
        image: "picture/4.jpg"
    },
    {
        id: 5,
        name: "Sport Sneakers",
        description: "Bekvama och moderna sneakers",
        price: 799,
        category: "Skor",
        stock: 12,
        image: "picture/5.jpg"
    },
    {
        id: 6,
        name: "Vinterkappa Dam",
        description: "Varm och stilfull vinterkappa",
        price: 1599,
        category: "Dam Mode",
        stock: 6,
        image: "picture/1.jpg"
    },
    {
        id: 7,
        name: "Herrskjorta Premium",
        description: "Hogkvalitativ bomullsskjorta",
        price: 549,
        category: "Herr Mode",
        stock: 18,
        image: "picture/2.jpg"
    },
    {
        id: 8,
        name: "Solglasogon Designer",
        description: "Trendiga solglasogon med UV-skydd",
        price: 399,
        category: "Accessoarer",
        stock: 25,
        image: "picture/3.jpg"
    }
];

// API Routes
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`? Server is running on http://localhost:3000`);
    console.log('?? Mogges Store - Fashion E-commerce');
    console.log('Press Ctrl+C to stop the server');
});
