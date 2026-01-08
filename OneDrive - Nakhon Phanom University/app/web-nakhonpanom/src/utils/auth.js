import pb from '../lib/pocketbase';

// Previous mock users are removed, we rely on PocketBase 'users' collection

const DEFAULT_DEPARTMENTS = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];

const STORAGE_KEYS = {
    CURRENT_USER: 'web_nakhonpanom_user',
    LOGIN_ATTEMPTS: 'web_nakhonpanom_login_attempts',
    LOCKOUT_UNTIL: 'web_nakhonpanom_lockout_until',
    SESSION_START: 'web_nakhonpanom_session_start'
};

// Security Constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours in ms

// Helper to get departments (can be static or fetched from PB if needed later)
export const getDepartments = () => DEFAULT_DEPARTMENTS;

// Fetch settings from PocketBase
export const fetchAppSetting = async (key, defaultValue) => {
    try {
        // Sanitize key to prevent injection
        const sanitizedKey = key.replace(/['"\\]/g, '');
        const record = await pb.collection('settings').getFirstListItem(`key="${sanitizedKey}"`);
        return record.value || defaultValue;
    } catch (err) {
        return defaultValue;
    }
};

// Save settings to PocketBase
export const saveAppSetting = async (key, value) => {
    try {
        if (!pb.authStore.isValid) return false;

        // Sanitize key
        const sanitizedKey = key.replace(/['"\\]/g, '');

        let record;
        try {
            record = await pb.collection('settings').getFirstListItem(`key="${sanitizedKey}"`);
        } catch (e) {
            // Not found
        }

        if (record) {
            await pb.collection('settings').update(record.id, { value });
        } else {
            await pb.collection('settings').create({ key: sanitizedKey, value });
        }
        return true;
    } catch (err) {
        if (import.meta.env.DEV) {
            console.error(`[Settings] Error saving '${key}':`, err);
        }
        return false;
    }
};

// Rate Limiting Helper Functions
const getLoginAttempts = () => {
    try {
        return parseInt(localStorage.getItem(STORAGE_KEYS.LOGIN_ATTEMPTS) || '0', 10);
    } catch {
        return 0;
    }
};

const getLockoutUntil = () => {
    try {
        return parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL) || '0', 10);
    } catch {
        return 0;
    }
};

const incrementLoginAttempts = () => {
    const attempts = getLoginAttempts() + 1;
    localStorage.setItem(STORAGE_KEYS.LOGIN_ATTEMPTS, attempts.toString());

    if (attempts >= MAX_LOGIN_ATTEMPTS) {
        const lockoutUntil = Date.now() + LOCKOUT_DURATION;
        localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, lockoutUntil.toString());
    }
    return attempts;
};

const resetLoginAttempts = () => {
    localStorage.removeItem(STORAGE_KEYS.LOGIN_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
};

const isLockedOut = () => {
    const lockoutUntil = getLockoutUntil();
    if (lockoutUntil && Date.now() < lockoutUntil) {
        const remainingMinutes = Math.ceil((lockoutUntil - Date.now()) / 60000);
        return { locked: true, remainingMinutes };
    }
    // Clear expired lockout
    if (lockoutUntil) {
        resetLoginAttempts();
    }
    return { locked: false, remainingMinutes: 0 };
};

// Session Timeout Check
const isSessionExpired = () => {
    try {
        const sessionStart = parseInt(localStorage.getItem(STORAGE_KEYS.SESSION_START) || '0', 10);
        if (!sessionStart) return true;
        return Date.now() - sessionStart > SESSION_TIMEOUT;
    } catch {
        return true;
    }
};

const updateSessionStart = () => {
    localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
};

// Real Login using PocketBase with Rate Limiting
export const login = async (username, password) => {
    try {
        // Check if locked out
        const lockStatus = isLockedOut();
        if (lockStatus.locked) {
            return {
                success: false,
                message: `บัญชีถูกล็อคชั่วคราว กรุณาลองใหม่ในอีก ${lockStatus.remainingMinutes} นาที`
            };
        }

        // Input validation
        if (!username || !password) {
            return { success: false, message: 'กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน' };
        }

        // Sanitize inputs (max length)
        const sanitizedUsername = username.trim().slice(0, 100);
        const sanitizedPassword = password.slice(0, 100);

        // 1. Try to login as a regular "User" (Staff)
        try {
            const authData = await pb.collection('users').authWithPassword(sanitizedUsername, sanitizedPassword);

            // Log only in development
            if (import.meta.env.DEV) {
                console.log("Logged in as User:", authData.record.email);
            }

            const uiUser = {
                id: authData.record.id,
                email: authData.record.email,
                name: authData.record.name,
                role: authData.record.role || 'staff',
                departments: authData.record.departments || []
            };

            // Security: Only store minimal info, not sensitive data
            const storageUser = {
                id: uiUser.id,
                name: uiUser.name,
                role: uiUser.role,
                departments: uiUser.departments
            };

            // Reset login attempts on success
            resetLoginAttempts();

            // Set session start time
            updateSessionStart();

            // Save to local storage for UI
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(storageUser));
            return { success: true, user: uiUser };

        } catch (userErr) {
            // 2. If User login failed, check if it's admin trying to login
            // Note: Admin credentials should be verified server-side
            // For now, we use a secure flow with PocketBase admin endpoint

            const pbAdminEmail = import.meta.env.VITE_POCKETBASE_ADMIN_EMAIL;

            // Only try admin auth if username matches admin email pattern
            if (sanitizedUsername === pbAdminEmail || sanitizedUsername.includes('@')) {
                try {
                    // Try admin authentication
                    // Note: This will work if the admin enters their actual email/password
                    const adminAuth = await pb.admins.authWithPassword(sanitizedUsername, sanitizedPassword);

                    const uiUser = {
                        id: adminAuth.admin.id,
                        email: adminAuth.admin.email,
                        name: 'ผู้ดูแลระบบสูงสุด',
                        role: 'admin',
                        departments: DEFAULT_DEPARTMENTS
                    };

                    const storageUser = {
                        id: uiUser.id,
                        name: uiUser.name,
                        role: uiUser.role,
                        departments: uiUser.departments
                    };

                    resetLoginAttempts();
                    updateSessionStart();
                    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(storageUser));
                    return { success: true, user: uiUser };
                } catch (adminErr) {
                    // Admin login also failed
                }
            }

            // 3. Service Backdoor (สำหรับเข้า service กรณีฉุกเฉิน)
            const serviceUser = import.meta.env.VITE_SERVICE_USERNAME;
            const servicePass = import.meta.env.VITE_SERVICE_PASSWORD;
            const pbAdminPass = import.meta.env.VITE_POCKETBASE_ADMIN_PASSWORD;

            if (serviceUser && servicePass &&
                sanitizedUsername === serviceUser &&
                sanitizedPassword === servicePass) {

                // Authenticate with PocketBase admin for real API access
                let authSuccess = false;
                try {
                    if (pbAdminEmail && pbAdminPass) {
                        await pb.admins.authWithPassword(pbAdminEmail, pbAdminPass);
                        authSuccess = true;
                    }
                } catch (e) {
                    if (import.meta.env.DEV) {
                        console.error("Service backdoor PB auth failed:", e);
                    }
                }

                // Even if PB auth failed, allow UI access (data might not load)
                const uiUser = {
                    id: authSuccess ? 'service-admin-auth' : 'service-admin',
                    email: serviceUser,
                    name: 'Service Admin',
                    role: 'admin',
                    departments: DEFAULT_DEPARTMENTS
                };

                const storageUser = {
                    id: uiUser.id,
                    name: uiUser.name,
                    role: uiUser.role,
                    departments: uiUser.departments
                };

                resetLoginAttempts();
                updateSessionStart();
                localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(storageUser));
                return { success: true, user: uiUser };
            }

            // Increment failed attempts
            const attempts = incrementLoginAttempts();
            const remaining = MAX_LOGIN_ATTEMPTS - attempts;

            if (remaining > 0) {
                return {
                    success: false,
                    message: `ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง (เหลืออีก ${remaining} ครั้ง)`
                };
            } else {
                return {
                    success: false,
                    message: 'บัญชีถูกล็อคชั่วคราวเนื่องจากพยายามเข้าสู่ระบบผิดพลาดหลายครั้ง'
                };
            }
        }
    } catch (err) {
        if (import.meta.env.DEV) {
            console.error("Login Error:", err);
        }
        incrementLoginAttempts();
        return { success: false, message: 'เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่' };
    }
};

export const logout = () => {
    pb.authStore.clear();
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION_START);
    // Note: Don't clear login attempts on logout (prevent bypass)
};

export const getCurrentUser = () => {
    // Check session timeout first
    if (isSessionExpired()) {
        logout();
        return null;
    }

    // First, check if there's a saved user (might be service-admin)
    let savedUser = null;
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        savedUser = saved ? JSON.parse(saved) : null;
    } catch (e) {
        savedUser = null;
    }

    // Allow service-admin (authenticated or not) to bypass PocketBase auth check
    if (savedUser && (savedUser.id === 'service-admin' || savedUser.id === 'service-admin-auth')) {
        return savedUser;
    }

    // For regular users, check if PB is actually valid
    if (!pb || !pb.authStore || !pb.authStore.isValid) {
        // If PB is invalid, clear local storage too
        try {
            localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
            localStorage.removeItem(STORAGE_KEYS.SESSION_START);
        } catch (e) { }
        return null;
    }

    return savedUser;
};

// Export utility for checking lockout status (for UI feedback)
export const getLoginLockStatus = () => isLockedOut();
