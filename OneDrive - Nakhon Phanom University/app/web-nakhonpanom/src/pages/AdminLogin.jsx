import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock } from 'lucide-react';
import { login } from '../utils/auth';
import './AdminLogin.css';

export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        setError('');

        const result = login(username, password);
        if (result.success) {
            navigate('/admin/dashboard');
        } else {
            setError(result.message);
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
                    <span>L</span>
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
                                placeholder="ชื่อผู้ใช้งาน"
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

                    <button type="submit" className="login-button">
                        เข้าสู่ระบบ
                    </button>
                </form>

                <div className="login-footer">
                    <a href="/">กลับไปหน้าหลัก</a>
                </div>
            </div>
        </div>
    );
}
