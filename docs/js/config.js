// config.js

const MODE = 'production';
// 'local' | 'production'

let API_BASE_URL;

switch (MODE) {
    case 'local':
        // Local dev (wrangler dev)
        API_BASE_URL = 'http://localhost:8787';
        break;

    case 'production':
        // Cloudflare Workers (LIVE)
        API_BASE_URL = 'https://api.mogges-store.se';
        break;

    default:
        throw new Error(`Unknown MODE: ${MODE}`);
}

export { API_BASE_URL };
