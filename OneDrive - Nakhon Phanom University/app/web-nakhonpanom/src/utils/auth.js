// Initial users data (moved from UserManagement)
const DEPARTMENTS = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];

const INITIAL_USERS = [
    { id: 1, username: 'admin', password: 'password', name: 'ผู้ดูแลระบบสูงสุด', role: 'admin', departments: DEPARTMENTS },
    { id: 2, username: 'reg_staff', password: 'password', name: 'เจ้าหน้าที่ทะเบียน', role: 'staff', departments: ['ฝ่ายทะเบียน'] },
    { id: 3, username: 'survey_staff', password: 'password', name: 'เจ้าหน้าที่รังวัด', role: 'staff', departments: ['ฝ่ายรังวัด'] },
];

const STORAGE_KEYS = {
    USERS: 'land_users',
    CURRENT_USER: 'land_currentUser'
};

export const getDepartments = () => DEPARTMENTS;

export const getUsers = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.USERS);
        return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch (e) {
        console.error('Error loading users', e);
        return INITIAL_USERS;
    }
};

export const saveUsers = (users) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const login = (username, password) => {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Remove password from session storage for security (mock)
        const { password, ...safeUser } = user;
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
        return { success: true, user: safeUser };
    }
    return { success: false, message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง' };
};

export const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

export const getCurrentUser = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
};
