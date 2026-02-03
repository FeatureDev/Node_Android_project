// API Configuration
// Change this to your ngrok URL when exposing backend to internet
export const CONFIG = {
    // Local development (when running npm start on PC)
    LOCAL_API: 'http://localhost:3000',
    
    // Phone backend on same WiFi (replace with your phone's IP address)
    PHONE_API: 'http://194.47.37.121:3000',
    
    // Ngrok tunnel (replace with your ngrok URL)
    // Example: https://abc123.ngrok-free.app
    NGROK_API: 'https://mogges-store.se',
    
    // Production domain API
    PRODUCTION_API: 'https://api.mogges-store.se',
    
    // Choose mode: 'local', 'phone', 'ngrok', or 'production'
    MODE: 'local'
};

// Get the active API URL based on mode
function getApiUrl() {
    switch(CONFIG.MODE) {
        case 'phone':
            return CONFIG.PHONE_API;
        case 'ngrok':
            return CONFIG.NGROK_API;
        case 'production':
            return CONFIG.PRODUCTION_API;
        case 'local':
        default:
            return CONFIG.LOCAL_API;
    }
}

export const API_BASE_URL = getApiUrl();

console.log('?? API Configuration:', {
    mode: CONFIG.MODE.toUpperCase(),
    url: API_BASE_URL
});

