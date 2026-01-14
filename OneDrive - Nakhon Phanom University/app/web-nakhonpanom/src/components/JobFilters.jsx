import React from 'react';
import { Search, X } from 'lucide-react';
import { PROVINCES } from '../config/constants';

/**
 * JobFilters - ชุด Filter สำหรับหน้า Jobs
 */
export default function JobFilters({
    searchTerm,
    setSearchTerm,
    filterDept,
    setFilterDept,
    filterStatus,
    setFilterStatus,
    filterAssignee,
    setFilterAssignee,
    filterStartDate,
    setFilterStartDate,
    filterEndDate,
    setFilterEndDate,
    onClearFilters,
    allOfficers = [],
    currentUser
}) {
    // Filter departments based on user role
    const filteredDepts = PROVINCES.filter(dept => {
        if (dept === 'ทั้งหมด') return true;
        if (currentUser?.role === 'admin') return true;
        return currentUser?.departments?.includes(dept);
    });

    return (
        <div className="filter-bar">
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
                {/* Search Input */}
                <div className="search-input-wrapper" style={{ flex: '1 1 300px' }}>
                    <Search className="search-icon" size={18} />
                    <input
                        type="text"
                        className="search-input"
                        placeholder="ค้นหาตามเลขที่คำขอ หรือ ชื่อผู้ยื่น..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Department Filter */}
                <select
                    className="filter-select"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    style={{ flex: '0 1 auto' }}
                >
                    {filteredDepts.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>

                {/* Assignee Filter */}
                <select
                    className="filter-select"
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    style={{ flex: '0 1 auto' }}
                >
                    <option value="ทั้งหมด">ผู้รับผิดชอบทั้งหมด</option>
                    {allOfficers.map((officer, idx) => (
                        <option key={`${officer}-${idx}`} value={officer}>{officer}</option>
                    ))}
                </select>

                {/* Date Range Filter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                        type="date"
                        className="filter-select"
                        style={{ minWidth: 'auto' }}
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        title="วันที่เริ่มต้น"
                    />
                    <span style={{ color: '#64748b' }}>-</span>
                    <input
                        type="date"
                        className="filter-select"
                        style={{ minWidth: 'auto' }}
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        title="ถึงวันที่"
                    />
                </div>

                {/* Status Filter */}
                <select
                    className="filter-select"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ flex: '0 1 auto' }}
                >
                    <option value="ทั้งหมด">สถานะทั้งหมด</option>
                    <option value="active">กำลังดำเนินการ</option>
                    <option value="completed">เสร็จสิ้น</option>
                </select>

                {/* Clear Filters Button */}
                <button
                    onClick={onClearFilters}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 16px',
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        color: '#64748b',
                        fontWeight: 500,
                        fontSize: '0.95rem',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#475569'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}
                >
                    <X size={18} />
                    ล้างตัวกรอง
                </button>
            </div>
        </div>
    );
}
