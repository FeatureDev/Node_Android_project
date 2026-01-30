const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database('moggesstore.db', (err) => {
    if (err) {
        console.error('? Error opening database:', err);
        process.exit(1);
    }
    console.log('? Connected to database');
});

// Create tables
db.serialize(async () => {
    // Drop existing tables
    db.run('DROP TABLE IF EXISTS Products');
    db.run('DROP TABLE IF EXISTS Users');
    
    // Create Products table
    db.run(`
        CREATE TABLE Products (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT NOT NULL,
            Description TEXT,
            Price REAL NOT NULL,
            Stock INTEGER NOT NULL DEFAULT 0,
            Category TEXT,
            Image TEXT
        )
    `, (err) => {
        if (err) {
            console.error('? Error creating Products table:', err);
            return;
        }
        console.log('? Products table created');
    });

    // Create Users table
    db.run(`
        CREATE TABLE Users (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Email TEXT UNIQUE NOT NULL,
            Password TEXT NOT NULL,
            Role TEXT NOT NULL DEFAULT 'user',
            CreatedAt TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('? Error creating Users table:', err);
            return;
        }
        console.log('? Users table created');
    });

    // Wait a bit for tables to be created
    await new Promise(resolve => setTimeout(resolve, 100));

    // Insert products
    const products = [
        {
            name: "Elegant Sommarklanning",
            description: "Latt och luftig klanning perfekt for varma sommardagar",
            price: 599,
            category: "Dam Mode",
            stock: 15,
            image: "picture/1.jpg"
        },
        {
            name: "Modern Herrjacka",
            description: "Stilren jacka for bade vardag och fest",
            price: 899,
            category: "Herr Mode",
            stock: 8,
            image: "picture/2.jpg"
        },
        {
            name: "Designervaska",
            description: "Exklusiv handvaska i akta lader",
            price: 1299,
            category: "Accessoarer",
            stock: 5,
            image: "picture/3.jpg"
        },
        {
            name: "Klassisk Blus",
            description: "Tidlos blus som passar till allt",
            price: 449,
            category: "Dam Mode",
            stock: 20,
            image: "picture/4.jpg"
        },
        {
            name: "Sport Sneakers",
            description: "Bekvama och moderna sneakers",
            price: 799,
            category: "Skor",
            stock: 12,
            image: "picture/5.jpg"
        },
        {
            name: "Vinterkappa Dam",
            description: "Varm och stilfull vinterkappa",
            price: 1599,
            category: "Dam Mode",
            stock: 6,
            image: "picture/1.jpg"
        },
        {
            name: "Herrskjorta Premium",
            description: "Hogkvalitativ bomullsskjorta",
            price: 549,
            category: "Herr Mode",
            stock: 18,
            image: "picture/2.jpg"
        },
        {
            name: "Solglasogon Designer",
            description: "Trendiga solglasogon med UV-skydd",
            price: 399,
            category: "Accessoarer",
            stock: 25,
            image: "picture/3.jpg"
        }
    ];

    const productStmt = db.prepare(`
        INSERT INTO Products (Name, Description, Price, Category, Stock, Image)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    products.forEach(product => {
        productStmt.run(
            product.name,
            product.description,
            product.price,
            product.category,
            product.stock,
            product.image
        );
    });

    productStmt.finalize();
    console.log('? Inserted', products.length, 'products');

    // Insert default admin user
    const adminEmail = 'admin@moggesstore.se';
    const adminPassword = 'admin123'; // Change this!
    
    bcrypt.hash(adminPassword, 10, (err, hash) => {
        if (err) {
            console.error('? Error hashing password:', err);
            return;
        }
        
        db.run(`
            INSERT INTO Users (Email, Password, Role, CreatedAt)
            VALUES (?, ?, ?, ?)
        `, [adminEmail, hash, 'admin', new Date().toISOString()], (err) => {
            if (err) {
                console.error('? Error creating admin user:', err);
                return;
            }
            console.log('? Admin user created');
            console.log('   Email:', adminEmail);
            console.log('   Password:', adminPassword);
            console.log('   ??  CHANGE THIS PASSWORD IN PRODUCTION!');
            
            // Verify data
            db.all('SELECT * FROM Products', (err, rows) => {
                if (err) {
                    console.error('? Error reading products:', err);
                    return;
                }
                console.log('\n?? Products in database:');
                rows.forEach(row => {
                    console.log(`  - ${row.Name} (${row.Price} kr) - ${row.Category}`);
                });
                console.log('\n? Database initialized successfully!\n');
                db.close();
            });
        });
    });
});
