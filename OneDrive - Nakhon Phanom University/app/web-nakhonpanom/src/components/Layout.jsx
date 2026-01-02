import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

export default function Layout({ children }) {
    return (
        <div className="layout-wrapper">
            {/* Navbar with Glassmorphism */}
            <nav className="navbar glass">
                <div className="container navbar-container">
                    <Link to="/" className="logo-section">
                        {/* Logo Icon */}
                        <div className="logo-icon">
                            <span>L</span>
                        </div>
                        <span className="logo-text">Land Tracking</span>
                    </Link>

                    <div className="nav-links">
                        <Link to="/admin" className="admin-link">
                            เจ้าหน้าที่
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    {children}
                </div>
            </main>

            {/* Simple Footer */}
            <footer className="footer">
                <p>© {new Date().getFullYear()} Nakhon Phanom Land Office. All rights reserved.</p>
            </footer>
        </div>
    );
}
