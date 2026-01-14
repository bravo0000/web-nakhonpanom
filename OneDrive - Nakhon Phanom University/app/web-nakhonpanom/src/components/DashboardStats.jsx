import React from 'react';
import { FileText, Clock, LogOut, Check } from 'lucide-react';

/**
 * DashboardStats - แสดงการ์ดสถิติบน Overview tab
 */
export default function DashboardStats({ statsData }) {
    const cards = [
        {
            key: 'total',
            className: 'total',
            icon: FileText,
            title: 'งานทั้งหมด',
            value: statsData.total
        },
        {
            key: 'active',
            className: 'active',
            icon: Clock,
            title: 'กำลังดำเนินการ',
            value: statsData.active
        },
        {
            key: 'pending',
            className: 'pending',
            icon: LogOut,
            title: 'รอดำเนินการ',
            value: statsData.pending
        },
        {
            key: 'completed',
            className: 'completed',
            icon: Check,
            title: 'เสร็จสิ้น',
            value: statsData.completed
        }
    ];

    return (
        <div className="stats-grid">
            {cards.map(card => (
                <div key={card.key} className={`stat-card ${card.className}`}>
                    <div className="stat-icon-bg">
                        <card.icon size={24} />
                    </div>
                    <div className="stat-info">
                        <h3>{card.title}</h3>
                        <div className="stat-value">{card.value}</div>
                        <span className="stat-label">รายการ</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
