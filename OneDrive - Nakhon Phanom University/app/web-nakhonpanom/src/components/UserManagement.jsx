import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Shield, User } from 'lucide-react';
import { getUsers, saveUsers, getDepartments } from '../utils/auth';
import './AddJobModal.css'; // Reuse modal styles

const DEPARTMENTS = getDepartments();

export default function UserManagement() {
    const [users, setUsers] = useState(getUsers());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Sync to localStorage
    useEffect(() => {
        saveUsers(users);
    }, [users]);

    // Form State
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        role: 'staff',
        departments: []
    });

    const openAddUser = () => {
        setEditingUser(null);
        setFormData({
            username: '',
            password: '',
            name: '',
            role: 'staff',
            departments: []
        });
        setIsModalOpen(true);
    };

    const openEditUser = (user) => {
        setEditingUser(user);
        setFormData({
            ...user,
            password: '' // Don't show existing password
        });
        setIsModalOpen(true);
    };

    const handleDeleteUser = (id) => {
        if (window.confirm('คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?')) {
            setUsers(users.filter(u => u.id !== id));
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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (editingUser) {
            setUsers(users.map(u => u.id === editingUser.id ? {
                ...u,
                ...formData,
                // Keep old password if not changed (mock logic)
                password: formData.password || u.password
            } : u));
        } else {
            const newUser = {
                ...formData,
                id: users.length + 1
            };
            setUsers([...users, newUser]);
        }
        setIsModalOpen(false);
    };

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
                                        {user.username}
                                    </div>
                                </td>
                                <td>{user.name}</td>
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
                                        {user.id !== 1 && ( // Prevent delete admin
                                            <button className="action-button" onClick={() => handleDeleteUser(user.id)} title="ลบ">
                                                <Trash2 size={18} style={{ color: '#ff3b30' }} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* User Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 500 }}>
                        <header className="modal-header">
                            <h2 className="modal-title">{editingUser ? 'แก้ไขผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">
                                <X size={20} />
                            </button>
                        </header>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">ชื่อผู้ใช้งาน (Username)</label>
                                    <input
                                        type="text" className="form-input" required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        disabled={!!editingUser} // Disable username edit
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        รหัสผ่าน {editingUser && <span style={{ fontWeight: 400, color: '#888' }}>(เว้นว่างถ้าไม่ต้องการเปลี่ยน)</span>}
                                    </label>
                                    <input
                                        type="password" className="form-input"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="ตั้งรหัสผ่าน..."
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">ชื่อ-นามสกุล</label>
                                    <input
                                        type="text" className="form-input" required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                                        {DEPARTMENTS.map(dept => (
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
                                <button type="submit" className="btn-submit">บันทึก</button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
