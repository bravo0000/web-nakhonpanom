import React, { useState, useMemo } from 'react';
import { Trash2, Download, Clock, AlertTriangle, Archive, CheckCircle } from 'lucide-react';
import pb from '../lib/pocketbase';
import './SmartDataManager.css';

const RETENTION_DAYS = 30;

export default function SmartDataManager({ jobs, onJobsDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate completed jobs with days remaining
    const completedJobs = useMemo(() => {
        const now = new Date();
        return jobs
            .filter(job => job.status === 'completed' && job.completedAt)
            .map(job => {
                const completedDate = new Date(job.completedAt);
                const deletionDate = new Date(completedDate.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
                const daysRemaining = Math.ceil((deletionDate - now) / (1000 * 60 * 60 * 24));
                return {
                    ...job,
                    completedDate,
                    deletionDate,
                    daysRemaining: Math.max(0, daysRemaining),
                    isExpired: daysRemaining <= 0
                };
            })
            .sort((a, b) => a.daysRemaining - b.daysRemaining);
    }, [jobs]);

    // Jobs that should be deleted (expired)
    const expiredJobs = completedJobs.filter(job => job.isExpired);

    // Jobs expiring soon (within 7 days)
    const expiringSoonJobs = completedJobs.filter(job => job.daysRemaining > 0 && job.daysRemaining <= 7);

    // Stats
    const stats = {
        total: completedJobs.length,
        expired: expiredJobs.length,
        expiringSoon: expiringSoonJobs.length,
        safe: completedJobs.length - expiredJobs.length - expiringSoonJobs.length
    };

    // Export to CSV
    const handleExport = (jobsToExport) => {
        setIsExporting(true);
        try {
            const headers = ['เลขรับ', 'วันที่รับ', 'ฝ่าย', 'ประเภทงาน', 'ผู้ขอ', 'สถานะ', 'ขั้นตอน', 'ผู้รับผิดชอบ', 'หมายเหตุ', 'วันที่เสร็จ'];
            const rows = jobsToExport.map(job => [
                job.receptionNo,
                job.date,
                job.department,
                job.type,
                job.owner,
                job.status === 'completed' ? 'เสร็จสิ้น' : job.status,
                job.step,
                Array.isArray(job.assignees) ? job.assignees.join(', ') : '',
                job.note || '',
                job.completedAt || ''
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            ].join('\n');

            // Add BOM for Excel UTF-8 compatibility
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `archived_jobs_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export error:', err);
            alert('เกิดข้อผิดพลาดในการ Export: ' + err.message);
        } finally {
            setIsExporting(false);
        }
    };

    // Delete expired jobs
    const handleDeleteExpired = async () => {
        if (expiredJobs.length === 0) {
            alert('ไม่มีงานที่หมดอายุให้ลบ');
            return;
        }

        if (!window.confirm(`คุณต้องการลบงานที่หมดอายุจำนวน ${expiredJobs.length} รายการใช่หรือไม่?\n\nแนะนำ: กรุณา Export ข้อมูลก่อนลบ`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await Promise.all(expiredJobs.map(job => pb.collection('jobs').delete(job.id)));
            onJobsDeleted && onJobsDeleted(expiredJobs.map(j => j.id));
            alert(`ลบงานสำเร็จ ${expiredJobs.length} รายการ`);
        } catch (err) {
            console.error('Delete error:', err);
            alert('เกิดข้อผิดพลาดในการลบ: ' + err.message);
        } finally {
            setIsDeleting(false);
        }
    };

    // Format Thai date
    const formatThaiDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="smart-data-container">
            <header className="smart-data-header">
                <div>
                    <h1 className="page-title">
                        <Archive size={28} style={{ marginRight: 12 }} />
                        Smart Data
                    </h1>
                    <p className="subtitle">จัดการข้อมูลงานที่เสร็จสิ้นแล้ว (เก็บไว้ {RETENTION_DAYS} วัน)</p>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="smart-data-stats">
                <div className="stat-card total">
                    <CheckCircle size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">งานเสร็จสิ้นทั้งหมด</span>
                    </div>
                </div>
                <div className="stat-card expired">
                    <Trash2 size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.expired}</span>
                        <span className="stat-label">หมดอายุ (พร้อมลบ)</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <AlertTriangle size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.expiringSoon}</span>
                        <span className="stat-label">ใกล้หมดอายุ (≤7 วัน)</span>
                    </div>
                </div>
                <div className="stat-card safe">
                    <Clock size={24} />
                    <div className="stat-info">
                        <span className="stat-value">{stats.safe}</span>
                        <span className="stat-label">ยังไม่หมดอายุ</span>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="smart-data-actions">
                <button
                    className="action-btn export"
                    onClick={() => handleExport(completedJobs)}
                    disabled={isExporting || completedJobs.length === 0}
                >
                    <Download size={18} />
                    {isExporting ? 'กำลัง Export...' : `Export ทั้งหมด (${completedJobs.length})`}
                </button>
                <button
                    className="action-btn delete"
                    onClick={handleDeleteExpired}
                    disabled={isDeleting || expiredJobs.length === 0}
                >
                    <Trash2 size={18} />
                    {isDeleting ? 'กำลังลบ...' : `ลบงานหมดอายุ (${expiredJobs.length})`}
                </button>
            </div>

            {/* Job List */}
            <div className="smart-data-list">
                <h2 className="list-title">รายการงานที่เสร็จสิ้น</h2>

                {completedJobs.length === 0 ? (
                    <div className="empty-state">
                        <Archive size={48} />
                        <p>ยังไม่มีงานที่เสร็จสิ้น</p>
                    </div>
                ) : (
                    <div className="job-table-container">
                        <table className="job-table">
                            <thead>
                                <tr>
                                    <th>เลขรับ</th>
                                    <th>ฝ่าย</th>
                                    <th>ประเภทงาน</th>
                                    <th>ผู้ขอ</th>
                                    <th>วันที่เสร็จ</th>
                                    <th>เหลือเวลา</th>
                                    <th>สถานะ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedJobs.map(job => (
                                    <tr key={job.id} className={job.isExpired ? 'expired-row' : job.daysRemaining <= 7 ? 'warning-row' : ''}>
                                        <td className="reception-no">{job.receptionNo}</td>
                                        <td>{job.department}</td>
                                        <td>{job.type}</td>
                                        <td>{job.owner}</td>
                                        <td>{formatThaiDate(job.completedAt)}</td>
                                        <td className="days-remaining">
                                            {job.isExpired ? (
                                                <span className="badge expired">หมดอายุ</span>
                                            ) : (
                                                <span className={`badge ${job.daysRemaining <= 7 ? 'warning' : 'safe'}`}>
                                                    {job.daysRemaining} วัน
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <button
                                                className="mini-export-btn"
                                                onClick={() => handleExport([job])}
                                                title="Export รายการนี้"
                                            >
                                                <Download size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
