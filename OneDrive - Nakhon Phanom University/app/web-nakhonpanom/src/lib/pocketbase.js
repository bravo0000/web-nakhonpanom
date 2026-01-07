import PocketBase from 'pocketbase';

// Connect to the PocketBase server
// Use relative path '/' to work with Cloudflare Tunnel (same domain)
// Or fallback to env/local IP for development
const url = import.meta.env.VITE_POCKETBASE_URL || '/';

let pb;
try {
    pb = new PocketBase(url);
    // Disable auto-cancellation to allow multiple requests
    pb.autoCancellation(false);
} catch (e) {
    console.error("Failed to initialize PocketBase client:", e);
    // Fallback mock object to prevent crash on import
    pb = {
        authStore: { isValid: false, clear: () => { } },
        collection: () => ({
            getFullList: async () => [],
            subscribe: () => { },
            unsubscribe: () => { }
        }),
        admins: { authWithPassword: async () => { throw new Error("PB Client Broken"); } }
    };
}

export default pb;
