import js from '@eslint/js';
import globals from 'globals';

export default [
    // Rekommenderade ESLint-regler
    js.configs.recommended,
    
    // Globala inställningar
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            // Varningar för vanliga problem
            'no-unused-vars': ['warn', { 
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^(updateQuantity|getProductEmoji|getStockClass|getStockText|addToCart|editProduct|deleteProduct|loadFeaturedProducts|requireAuth|exec)$'
            }],
            'no-console': 'off', // Tillåt console.log för utveckling
            'no-undef': 'error',
            
            // Kodkvalitet
            'eqeqeq': ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'prefer-arrow-callback': 'warn',
            
            // Säkerhet
            'no-eval': 'error',
            'no-implied-eval': 'error',
        }
    },
    
    // Node.js backend-filer
    {
        files: ['Server.js', 'init-db.js', '*.config.js'],
        languageOptions: {
            globals: {
                ...globals.node,
            }
        }
    },
    
    // Browser frontend-filer
    {
        files: ['docs/**/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                API_BASE_URL: 'readonly', // Definierad i config.js
                CONFIG: 'readonly',        // Definierad i config.js
            }
        }
    },
    
    // Ignorera filer
    {
        ignores: [
            'node_modules/**',
            '.vs/**',
            'docs/css/**',
            'docs/picture/**',
            'docs/manifest.json',
            '*.min.js',
            'package-lock.json'
        ]
    }
];
