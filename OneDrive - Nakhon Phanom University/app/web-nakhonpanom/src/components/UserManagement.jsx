import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Check, Shield, User, Eye, EyeOff } from 'lucide-react';
import { getDepartments, fetchAppSetting } from '../utils/auth';
import pb from '../lib/pocketbase';
import './AddJobModal.css'; // Reuse modal styles

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState(getDepartments()); // Initial fallback
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [showPassword, setShowPassword] = useState(false); // New state

    // ... (keep fetch logic) ...

    // Fetch Departments from DB
    useEffect(() => {
        const loadDepartments = async () => {
            const depts = await fetchAppSetting('departments', getDepartments());
            if (Array.isArray(depts)) {
                setDepartments(depts);
            }
        };
        loadDepartments();
    }, []);

    // Fetch users from PocketBase (actually 'users' collection)
    // Note: Standard PB 'users' collection might not have all our custom fields like 'role' or 'departments'
    // unless defined in schema. We will assume schema exists or we use a separate collection if needed.
    // For now, let's try reading the 'users' collection.
    const fetchUsers = async () => {
        try {
            // We need full list
            const records = await pb.collection('users').getFullList({
                sort: '-created',
            });

            // Map to UI model
            const mappedUsers = records.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                name: u.name,
                phone: u.phone || '', // Added phone
                role: u.role || 'staff', // Fallback
                departments: u.departments || [], // Fallback
                is_superuser: u.isSuperuser // if available
            }));
            setUsers(mappedUsers);
        } catch (err) {
            console.error("Error fetching users:", err);
            // Fallback to empty if initial setup
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        name: '',
        phone: '', // Added phone
        role: 'staff',
        departments: []
    });

    const openAddUser = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            email: '',
            name: '',
            phone: '', // Added phone
            role: 'staff',
            departments: []
        });
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            ...user,
            password: '', // Don't show existing
            email: user.email || ''
        });
        setShowPassword(false);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) {
            try {
                await pb.collection('users').delete(id);
                // Update UI locally or re-fetch
                setUsers(users.filter(u => u.id !== id));
            } catch (err) {
                console.error("Error deleting user:", err);
                alert("ไม่สามารถลบผู้ใช้งานได้: " + err.message);
            }
        }
    };

    const handleToggleDept = (dept) => {
        setFormData(prev => {
            const currentDepts = prev.departments || [];
            if (currentDepts.includes(dept)) {
                return { ...prev, departments: currentDepts.filter(d => d !== dept) };
            } else {
                return { ...prev, departments: [...currentDepts, dept] };
            }
        });
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        try {
            // Validation
            if (!formData.username) return alert("กรุณากรอกชื่อผู้ใช้งาน");
            // if (!formData.email) return alert("กรุณากรอกอีเมล (จำเป็นสำหรับระบบ)");
            if (!formData.name) return alert("กรุณากรอกชื่อ-นามสกุล");
            if (!editingUser && !formData.password) return alert("กรุณากรอกรหัสผ่าน");
            if (formData.password && formData.password.length < 5) return alert("รหัสผ่านต้องมีความยาวอย่างน้อย 5 ตัวอักษร");

            const data = {
                username: formData.username,
                email: formData.email,
                emailVisibility: true,
                name: formData.name,
                phone: formData.phone, // Added phone
                role: formData.role,
                departments: formData.departments,
            };

            if (formData.password) {
                data.password = formData.password;
                data.passwordConfirm = formData.password;
            }

            console.log("Sending data to PB:", data);

            if (editingUser) {
                await pb.collection('users').update(editingUser.id, data);
            } else {
                await pb.collection('users').create(data);
            }

            // Refresh list
            await fetchUsers();
            setIsModalOpen(false);
            alert("บันทึกข้อมูลสำเร็จ");

        } catch (err) {
            console.error("Error saving user:", err);
            // Handle PB specifics
            if (err.data && err.data.data) {
                const fields = err.data.data;
                let msg = "บันทึกไม่สำเร็จ:\n";
                if (fields.email) msg += `- อีเมล: ${fields.email.message}\n`;
                if (fields.username) msg += `- ชื่อผู้ใช้งาน: ${fields.username.message}\n`;
                if (fields.password) msg += `- รหัสผ่าน: ${fields.password.message}\n`;
                alert(msg);
            } else if (err.message) {
                alert("บันทึกไม่สำเร็จ: " + err.message);
            } else {
                alert("บันทึกไม่สำเร็จ (Unknown Error)");
            }
        }
    };

    if (loading) {
        return <div style={{ padding: 40, textAlign: 'center' }}>Loading users...</div>;
    }

    return (
        <div className="user-management animate-fade-in-up">
            <header className="dashboard-header">
                <h1 className="page-title">จัดการผู้ใช้งาน</h1>
                <button onClick={openAddUser} className="primary-button">
                    <Plus size={20} />
                    เพิ่มผู้ใช้งาน
                </button>
            </header>

            <div className="table-card">
                <table className="table-wrapper">
                    <thead>
                        <tr>
                            <th>ชื่อผู้ใช้งาน</th>
                            <th>ชื่อ-นามสกุล</th>
                            <th>เบอร์โทรศัพท์</th>
                            <th>บทบาท</th>
                            <th>สิทธิ์การเข้าถึง (ฝ่าย)</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', background: '#f5f5f7',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666'
                                        }}>
                                            <User size={16} />
                                        </div>
                                        <div>
                                            <div>{user.username}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 400 }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{user.name}</td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                    <span className={`status-badge ${user.role === 'admin' ? 'completed' : 'pending'}`}>
                                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                        {user.departments && user.departments.length > 0 ? (
                                            user.departments.map(dept => (
                                                <span key={dept} style={{
                                                    fontSize: '0.75rem', padding: '2px 8px',
                                                    background: '#f5f5f7', borderRadius: 4, color: '#555'
                                                }}>
                                                    {dept}
                                                </span>
                                            ))
                                        ) : (
                                            <span style={{ color: '#999', fontSize: '0.8rem' }}>- ไม่มีสิทธิ์ -</span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="action-button" onClick={() => openEditUser(user)} title="แก้ไข">
                                            <Edit2 size={18} />
                                        </button>
                                        <button className="action-button" onClick={() => handleDeleteUser(user.id)} title="ลบ">
                                            <Trash2 size={18} style={{ color: '#ff3b30' }} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Modal - Portaled to Body for correct centering */}
            {isModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <header className="modal-header">
                            <h2 className="modal-title">{editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={(e) => e.preventDefault()}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">ชื่อผู้ใช้งาน (Username)</label>
                                    <input
                                        type="text" className="form-input"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        disabled={!!editingUser}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">อีเมล (ไม่บังคับ)</label>
                                    <input
                                        type="email" className="form-input"
                                        value={formData.email || ''}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        รหัสผ่าน {editingUser && <span style={{ fontWeight: 400, color: '#888' }}>(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-input"
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="ตั้งรหัสผ่าน (ขั้นต่ำ 5 ตัวอักษร)..."
                                            style={{ paddingRight: 40 }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                                position: 'absolute',
                                                right: 10,
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'none',
                                                border: 'none',
                                                color: '#666',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            tabIndex="-1"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ชื่อ-นามสกุล</label>
                                    <input
                                        type="text" className="form-input"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">เบอร์โทรศัพท์</label>
                                    <input
                                        type="text" className="form-input"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="เช่น 08x-xxx-xxxx"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">บทบาท</label>
                                    <select
                                        className="form-input"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="staff">เจ้าหน้าที่ทั่วไป (Staff)</option>
                                        <option value="admin">ผู้ดูแลระบบ (Admin)</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">สิทธิ์การเข้าถึงข้อมูล (เลือกฝ่าย)</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                                        {departments.map(dept => (
                                            <label key={dept} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.departments.includes(dept)}
                                                    onChange={() => handleToggleDept(dept)}
                                                    style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                                                />
                                                <span style={{ fontSize: '0.95rem' }}>{dept}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <footer className="modal-footer">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">ยกเลิก</button>
                                <button type="button" onClick={handleSubmit} className="btn-submit">บันทึก</button>
                            </footer>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
