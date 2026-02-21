 /**
 * Security Utilities
 * ฟังก์ชันสำหรับ validate และ sanitize input เพื่อป้องกัน XSS, SQL Injection
 */

// Maximum lengths for different input types
export const INPUT_LIMITS = {
    USERNAME: 100,
    PASSWORD: 100,
    RECEPTION_NO: 50,
    SEARCH_TERM: 100,
    NAME: 200,
    NOTE: 1000,
    URL: 500
};

/**
 * ลบ HTML tags ออกจาก text
 * ป้องกัน XSS attacks
 * @param {string} text - ข้อความที่ต้องการ sanitize
 * @param {number} maxLength - ความยาวสูงสุด
 * @returns {string}
 */
export function sanitizeText(text, maxLength = INPUT_LIMITS.NOTE) {
    if (!text) return '';
    return String(text)
        .replace(/<[^>]*>/g, '')  // Strip HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove inline event handlers
        .slice(0, maxLength)
        .trim();
}

/**
 * Sanitize input สำหรับ search queries
 * ลบ special characters ที่อาจใช้ใน SQL injection
 * @param {string} input 
 * @param {number} maxLength 
 * @returns {string}
 */
export function sanitizeSearchInput(input, maxLength = INPUT_LIMITS.SEARCH_TERM) {
    if (!input) return '';
    return String(input)
        .replace(/['"\\;=|&<>]/g, '') // Remove dangerous chars
        .slice(0, maxLength)
        .trim();
}

/**
 * Sanitize เลขที่รับเรื่อง
 * @param {string} receptionNo 
 * @returns {string}
 */
export function sanitizeReceptionNo(receptionNo) {
    if (!receptionNo) return '';
    return String(receptionNo)
        .replace(/['"\\;=|&<>]/g, '')
        .slice(0, INPUT_LIMITS.RECEPTION_NO)
        .trim();
}

/**
 * Escape string สำหรับใช้ใน PocketBase filter
 * @param {string} str 
 * @returns {string}
 */
export function escapePocketBaseFilter(str) {
    if (!str) return '';
    return str.replace(/"/g, '\\"');
}

/**
 * Validate email format
 * @param {string} email 
 * @returns {boolean}
 */
export function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 * @param {string} password 
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password) {
    if (!password) {
        return { valid: false, message: 'กรุณากรอกรหัสผ่าน' };
    }
    if (password.length < 8) {
        return { valid: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' };
    }
    if (password.length > INPUT_LIMITS.PASSWORD) {
        return { valid: false, message: `รหัสผ่านต้องไม่เกิน ${INPUT_LIMITS.PASSWORD} ตัวอักษร` };
    }
    // Check for at least one number and one letter
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
        return { valid: false, message: 'รหัสผ่านต้องมีทั้งตัวอักษรและตัวเลข' };
    }
    return { valid: true, message: '' };
}

/**
 * Validate reception number format
 * @param {string} receptionNo 
 * @returns {{ valid: boolean, message: string }}
 */
export function validateReceptionNo(receptionNo) {
    if (!receptionNo) {
        return { valid: false, message: 'กรุณากรอกเลขที่รับเรื่อง' };
    }
    // Pattern: PREFIX + NUMBER + / + YEAR (e.g., R123/2568)
    const pattern = /^[A-Za-z]?\d+\/\d{4}$/;
    if (!pattern.test(receptionNo)) {
        return { valid: false, message: 'รูปแบบเลขที่รับเรื่องไม่ถูกต้อง (ตัวอย่าง: R123/2568)' };
    }
    return { valid: true, message: '' };
}

/**
 * Validate Thai date format (วว/ดด/ปปปป)
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isValidThaiDate(dateStr) {
    if (!dateStr) return false;
    // ISO format from input type="date"
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(dateStr)) return true;
    // Thai format (dd/mm/yyyy)
    const thaiPattern = /^\d{2}\/\d{2}\/\d{4}$/;
    return thaiPattern.test(dateStr);
}

/**
 * Rate limiter class สำหรับป้องกัน brute force
 */
export class RateLimiter {
    constructor(maxAttempts, lockoutMinutes) {
        this.maxAttempts = maxAttempts;
        this.lockoutMs = lockoutMinutes * 60 * 1000;
        this.storageKey = 'rate_limiter';
    }

    getAttempts() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { count: 0, timestamp: 0 };
        } catch {
            return { count: 0, timestamp: 0 };
        }
    }

    increment() {
        const attempts = this.getAttempts();
        attempts.count += 1;
        attempts.timestamp = Date.now();
        localStorage.setItem(this.storageKey, JSON.stringify(attempts));
        return attempts.count;
    }

    reset() {
        localStorage.removeItem(this.storageKey);
    }

    isLocked() {
        const attempts = this.getAttempts();
        if (attempts.count >= this.maxAttempts) {
            const elapsed = Date.now() - attempts.timestamp;
            if (elapsed < this.lockoutMs) {
                const remainingMinutes = Math.ceil((this.lockoutMs - elapsed) / 60000);
                return { locked: true, remainingMinutes };
            }
            // Lockout expired, reset
            this.reset();
        }
        return { locked: false, remainingMinutes: 0 };
    }
}

// Default rate limiter instance (5 attempts, 15 min lockout)
export const loginRateLimiter = new RateLimiter(5, 15);
