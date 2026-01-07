import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { login } from '../utils/auth';
import './AdminLogin.css';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await login(username, password);
            if (result.success) {
                navigate('/admin/dashboard');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Decoration */}
            <div className="page-background">
                <div className="gradient-blob blob-1" style={{ top: '-20%', right: '-20%', left: 'auto' }}></div>
                <div className="gradient-blob blob-3" style={{ bottom: '-20%', left: '-20%', top: 'auto' }}></div>
            </div>

            <div className="login-card">
                <div className="login-logo">
                    <img src="/dol_logo.png" alt="DOL Logo" />
                </div>
                <h1 className="login-title">เจ้าหน้าที่</h1>
                <p className="login-subtitle">ลงชื่อเข้าใช้เพื่อจัดการระบบ</p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <div className="input-wrapper">
                            <User className="input-icon" />
                            <input
                                type="text"
                                placeholder="ชื่อผู้ใช้งาน/อีเมล"
                                className="form-input"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-wrapper">
                            <Lock className="input-icon" />
                            <input
                                type="password"
                                placeholder="รหัสผ่าน"
                                className="form-input"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        disabled={isLoading}
                        style={{ opacity: isLoading ? 0.7 : 1, cursor: isLoading ? 'wait' : 'pointer' }}
                    >
                        {isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                    </button>
                </form>

                <div className="login-footer">
                    <a href="/">กลับไปหน้าหลัก</a>
                </div>
            </div>
        </div>
    );
}
