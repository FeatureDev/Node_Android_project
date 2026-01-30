'use strict';

const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const db = new sqlite3.Database('moggesstore.db', (err) => {
    if (err) {
        console.error('? Error connecting to database:', err);
        process.exit(1);
    }
    console.log('? Connected to database');
});

// Session middleware
app.use(session({
    secret: 'mogges-store-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration for cross-origin requests (GitHub Pages -> Phone backend)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow all origins (or specify GitHub Pages URL)
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files from docs directory
app.use(express.static(path.join(__dirname, 'docs')));

// API Routes
app.get('/api/products', (req, res) => {
    db.all('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products', [], (err, rows) => {
        if (err) {
            console.error('? Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json(rows);
    });
});

app.get('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    db.get('SELECT Id as id, Name as name, Description as description, Price as price, Category as category, Stock as stock, Image as image FROM Products WHERE Id = ?', [id], (err, row) => {
        if (err) {
            console.error('? Error fetching product:', err);
            return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (row) {
            res.json(row);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    });
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
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }
    
    db.get('SELECT * FROM Users WHERE Email = ?', [email], async (err, user) => {
        if (err) {
            console.error('? Error fetching user:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        
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
    });
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
    
    db.run(`
        INSERT INTO Products (Name, Description, Price, Category, Stock, Image)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, price, category, stock || 0, image || 'picture/1.jpg'], function(err) {
        if (err) {
            console.error('? Error creating product:', err);
            return res.status(500).json({ error: 'Failed to create product' });
        }
        
        res.json({
            message: 'Product created',
            id: this.lastID
        });
    });
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { name, description, price, category, stock, image } = req.body;
    
    db.run(`
        UPDATE Products 
        SET Name = ?, Description = ?, Price = ?, Category = ?, Stock = ?, Image = ?
        WHERE Id = ?
    `, [name, description, price, category, stock, image, id], function(err) {
        if (err) {
            console.error('? Error updating product:', err);
            return res.status(500).json({ error: 'Failed to update product' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product updated' });
    });
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    
    db.run('DELETE FROM Products WHERE Id = ?', [id], function(err) {
        if (err) {
            console.error('? Error deleting product:', err);
            return res.status(500).json({ error: 'Failed to delete product' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted' });
    });
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

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`? Server is running on http://0.0.0.0:${PORT}`);
    console.log(`?? Access from network: http://<YOUR_PHONE_IP>:${PORT}`);
    console.log('?? Mogges Store - Fashion E-commerce');
    console.log('???  Using SQLite Database');
    console.log('?? CORS enabled for cross-origin requests');
    console.log('Press Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n?? Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('? Error closing database:', err);
        } else {
            console.log('? Database connection closed');
        }
        process.exit(0);
    });
});
