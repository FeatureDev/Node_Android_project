import { API_BASE_URL } from './config.js';

console.log('?? Login page loaded');

// Use API_BASE_URL from config.js
const API_URL = API_BASE_URL;

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const loginButton = document.getElementById('login-button');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Clear previous error
    errorMessage.style.display = 'none';
    
    // Disable button and show loading
    loginButton.disabled = true;
    loginButton.classList.add('loading');
    loginButton.textContent = 'Loggar in';
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log('? Login successful:', data);
            
            // Show success message
            errorMessage.style.display = 'block';
            errorMessage.style.background = '#d1fae5';
            errorMessage.style.color = '#065f46';
            errorMessage.textContent = '? Inloggning lyckades! Omdirigerar...';
            
            // Redirect based on role
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = '/admin.html';
                } else {
                    window.location.href = '/index.html';
                }
            }, 1000);
        } else {
            // Show error
            console.error('? Login failed:', data.error);
            errorMessage.style.display = 'block';
            errorMessage.textContent = data.error === 'Invalid credentials' 
                ? '? Fel e-post eller losenord'
                : '? ' + data.error;
            
            // Re-enable button
            loginButton.disabled = false;
            loginButton.classList.remove('loading');
            loginButton.textContent = 'Logga in';
        }
    } catch (error) {
        console.error('? Network error:', error);
        errorMessage.style.display = 'block';
        errorMessage.textContent = '? Något gick fel. Forsok igen.';
        
        // Re-enable button
        loginButton.disabled = false;
        loginButton.classList.remove('loading');
        loginButton.textContent = 'Logga in';
    }
});

console.log('? Login page initialized');
