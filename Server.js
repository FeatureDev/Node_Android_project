'use strict';

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import * as database from './database.js';
import bcrypt from 'bcryptjs';
import session from 'express-session';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Generate a random session secret if not provided
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Database will be initialized at startup
let dbReady = false;

// Session middleware
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        sameSite: 'lax', // Changed from 'strict' to 'lax' for cross-site requests
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

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

// Body parser middleware
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// CORS configuration for cross-origin requests (GitHub Pages -> Phone backend)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    // Allow specific origins or localhost for development
    const allowedOrigins = [
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'https://mogges-store.se',
        'https://www.mogges-store.se'
    ];
    
    if (allowedOrigins.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, ngrok-skip-browser-warning');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));

// API endpoint to get available images
import fs from 'fs/promises';

app.get('/api/images', async (req, res) => {
    try {
        const pictureDir = path.join(__dirname, 'docs', 'picture');
        
        const files = await fs.readdir(pictureDir);
        
        // Filter image files
        const imageFiles = files.filter(file => 
            /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
        ).map(file => ({
            name: file,
            path: `picture/${file}`
        }));
        
        res.json(imageFiles);
    } catch (err) {
        console.error('Error loading images:', err);
        res.status(500).json({ error: 'Failed to load images' });
    }
});

// API Routes
app.get('/api/products', (req, res) => {
    try {
        const rows = database.all('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products');
        res.json(rows);
    } catch (err) {
        console.error('? Error fetching products:', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    try {
        const row = database.get('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products WHERE Id = ?', [id]);
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (err) {
        console.error('? Error fetching product:', err);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }
    next();
}

// Auth API Routes
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    try {
        const user = database.get('SELECT * FROM Users WHERE Email = ?', [email]);
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const match = await bcrypt.compare(password, user.Password);
        
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Set session
        req.session.user = {
            id: user.Id,
            email: user.Email,
            role: user.Role
        };
        
        console.log('? User logged in:', user.Email);
        res.json({
            message: 'Login successful',
            user: {
                email: user.Email,
                role: user.Role
            }
        });
    } catch (err) {
        console.error('? Error during login:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to logout' });
        }
        res.json({ message: 'Logout successful' });
    });
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({
            authenticated: true,
            user: req.session.user
        });
    } else {
        res.json({ authenticated: false });
    }
});

// Admin API Routes
app.post('/api/products', requireAdmin, (req, res) => {
    const { name, description, price, category, stock, image } = req.body;
    
    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }
    
    try {
        const result = database.run(`
            INSERT INTO Products (Name, Description, Price, Category, Stock, Image)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [name, description, price, category, stock || 0, image || 'picture/1.jpg']);
        
        res.json({
            message: 'Product created',
            id: result.lastID
        });
    } catch (err) {
        console.error('? Error creating product:', err);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, price, category, stock, image } = req.body;
    
    try {
        const result = database.run(`
            UPDATE Products 
            SET Name = ?, Description = ?, Price = ?, Category = ?, Stock = ?, Image = ?
            WHERE Id = ?
        `, [name, description, price, category, stock, image, id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product updated' });
    } catch (err) {
        console.error('? Error updating product:', err);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    try {
        const result = database.run('DELETE FROM Products WHERE Id = ?', [id]);
        
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted' });
    } catch (err) {
        console.error('? Error deleting product:', err);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Route for main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'index.html'));
});

// Routes for other pages
app.get('/products.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'products.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'about.html'));
});

app.get('/cart.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'cart.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'index.html'));
});

app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'checkout.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index', 'login.html'));
});

app.get('/admin.html', (req, res) => {
    // Check if user is admin
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.redirect('/login.html');
    }
    res.sendFile(path.join(__dirname, 'docs', 'index', 'admin.html'));
});

// Initialize database and start server
async function startServer() {
    try {
        await database.initDatabase();
        dbReady = true;
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`?? Server is running on http://0.0.0.0:${PORT}`);
            console.log(`?? Access from network: http://<YOUR_PHONE_IP>:${PORT}`);
            console.log('?? Mogges Store - Fashion E-commerce');
            console.log('?? Using SQLite Database (sql.js)');
            console.log('?? CORS enabled for cross-origin requests');
            console.log('Press Ctrl+C to stop the server');
        });
    } catch (err) {
        console.error('? Failed to start server:', err);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n?? Shutting down gracefully...');
    database.close();
    process.exit(0);
});

// Start the server
startServer();
