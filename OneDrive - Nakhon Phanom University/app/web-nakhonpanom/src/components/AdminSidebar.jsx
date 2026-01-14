import React from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, Users, ScanBarcode, BarChart2, Archive } from 'lucide-react';

/**
 * AdminSidebar - แถบเมนูซ้ายสำหรับ Admin Dashboard
 */
export default function AdminSidebar({ activeTab, setActiveTab, currentUser, onLogout }) {
    const navItems = [
        { id: 'overview', label: 'ภาพรวม', icon: LayoutDashboard },
        { id: 'jobs', label: 'รายการงาน', icon: FileText },
        { id: 'scan', label: 'สแกนบาร์โค้ด', icon: ScanBarcode },
        { id: 'reports', label: 'รายงาน', icon: BarChart2 },
    ];

    // Admin-only items
    const adminItems = [
        { id: 'users', label: 'ผู้ใช้งาน', icon: Users },
        { id: 'smartdata', label: 'Smart Data', icon: Archive },
    ];

    const settingsItem = { id: 'settings', label: 'ตั้งค่า', icon: Settings };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-box-img">
                    <img src="/dol_logo.png" alt="DOL Logo" />
                </div>
                <span className="sidebar-title">Admin Panel</span>
            </div>

            <nav className="nav-menu">
                {navItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}

                {/* Admin-only menu items */}
                {currentUser?.role === 'admin' && adminItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(item.id)}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </div>
                ))}

                {/* Settings - always visible */}
                <div
                    className={`nav-item ${activeTab === settingsItem.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(settingsItem.id)}
                >
                    <settingsItem.icon size={20} />
                    <span>{settingsItem.label}</span>
                </div>
            </nav>

            <div className="logout-section">
                <button
                    onClick={onLogout}
                    className="nav-item"
                    style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}
                >
                    <LogOut size={20} />
                    <span>ออกจากระบบ</span>
                </button>
            </div>
        </aside>
    );
}
