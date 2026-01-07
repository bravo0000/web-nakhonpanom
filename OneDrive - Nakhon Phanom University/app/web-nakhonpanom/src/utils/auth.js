import pb from '../lib/pocketbase';

// Previous mock users are removed, we rely on PocketBase 'users' collection

const DEFAULT_DEPARTMENTS = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];

const STORAGE_KEYS = {
    CURRENT_USER: 'web_nakhonpanom_user'
};

// Helper to get departments (can be static or fetched from PB if needed later)
export const getDepartments = () => DEFAULT_DEPARTMENTS;

// Fetch settings from PocketBase
export const fetchAppSetting = async (key, defaultValue) => {
    try {
        const record = await pb.collection('settings').getFirstListItem(`key="${key}"`);
        return record.value || defaultValue;
    } catch (err) {
        // console.warn(`[Settings] Fetch failed for '${key}' (using default):`, err.message);
        return defaultValue;
    }
};

// Save settings to PocketBase
export const saveAppSetting = async (key, value) => {
    try {
        if (!pb.authStore.isValid) return false;

        let record;
        try {
            record = await pb.collection('settings').getFirstListItem(`key="${key}"`);
        } catch (e) {
            // Not found
        }

        if (record) {
            await pb.collection('settings').update(record.id, { value });
        } else {
            await pb.collection('settings').create({ key, value });
        }
        return true;
    } catch (err) {
        console.error(`[Settings] Error saving '${key}':`, err);
        return false;
    }
};

// Replaces the old mock login
// Replaces the old mock login
// Real Login using PocketBase
export const login = async (username, password) => {
    try {
        // 1. Try to login as a regular "User" (Staff)
        try {
            const authData = await pb.collection('users').authWithPassword(username, password);
            console.log("Logged in as User:", authData.record);

            const uiUser = {
                id: authData.record.id,
                email: authData.record.email,
                name: authData.record.name,
                role: authData.record.role || 'staff',
                departments: authData.record.departments || []
            };

            // Save to local storage for UI
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(uiUser));
            return { success: true, user: uiUser };

        } catch (userErr) {
            // 2. If User login failed, try as System Admin (Fallback)
            // Note: Admin login requires EMAIL, but we might have getting 'admin' username in form.
            // We check against .env only if username matches specific admin user, or just try.

            const pbAdminEmail = import.meta.env.VITE_POCKETBASE_ADMIN_EMAIL;
            const pbAdminPass = import.meta.env.VITE_POCKETBASE_ADMIN_PASSWORD;

            // Only try admin auth if inputs match .env (simulating the old "Super Admin" gate)
            // OR if the user typed the actual admin email.
            const webUser = import.meta.env.VITE_WEB_USERNAME || 'admin';
            const webPass = import.meta.env.VITE_WEB_PASSWORD || 'admin123';

            // Check if user is trying to login as the "Web Admin"
            if ((username === webUser && password === webPass) || (username === pbAdminEmail && password === pbAdminPass)) {
                const adminAuth = await pb.admins.authWithPassword(pbAdminEmail, pbAdminPass);
                const uiUser = {
                    id: adminAuth.admin.id,
                    email: adminAuth.admin.email,
                    name: 'ผู้ดูแลระบบสูงสุด',
                    role: 'admin',
                    departments: DEFAULT_DEPARTMENTS
                };
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(uiUser));
                return { success: true, user: uiUser };
            }

            throw userErr; // Throw original error if not admin
        }
    } catch (err) {
        console.error("Login Error:", err);
        return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
    }
};

export const logout = () => {
    pb.authStore.clear();
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = () => {
    // Return the Enhanced UI User from local storage if available
    // Check if PB is actually valid first to prevent stale UI state
    // Check if PB is actually valid first to prevent stale UI state
    // But for "Split Auth", we might just trust local storage if verified by the logic above
    // However, it's safer to check PB auth store validity too.
    // Check if PB is actually valid first to prevent stale UI state
    if (!pb || !pb.authStore || !pb.authStore.isValid) {
        // If PB is invalid, clear local storage too just in case
        try { localStorage.removeItem(STORAGE_KEYS.CURRENT_USER); } catch (e) { }
        return null;
    }

    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null; // Fallback
    }
};
