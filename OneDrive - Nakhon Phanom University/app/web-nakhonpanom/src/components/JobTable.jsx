import React from 'react';
import { Edit, Edit2, Trash2, Printer } from 'lucide-react';
import { formatThaiDate, calculateDuration, getStatusText, getStatusBadgeStyle } from '../utils/helpers';

/**
 * JobTable - ตารางแสดงรายการงาน
 */
export default function JobTable({
    jobs,
    selectedJobIds,
    onSelectAll,
    onSelectJob,
    onPrint,
    onEdit,
    onUpdateStatus,
    onBulkDelete,
    onBulkUpdateStatus,
    workflows,
    deptSettings
}) {
    const hasSelection = selectedJobIds.length > 0;

    return (
        <>
            {/* Bulk Action Bar */}
            {hasSelection && (
                <div className="bulk-action-bar">
                    <span className="bulk-count">{selectedJobIds.length} รายการที่เลือก</span>
                    <div className="bulk-actions">
                        <button className="bulk-button delete" onClick={onBulkDelete}>
                            <Trash2 size={18} />
                            ลบที่เลือก
                        </button>
                        <button className="bulk-button update" onClick={onBulkUpdateStatus}>
                            <Edit size={18} />
                            อัปเดตสถานะ
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="table-card">
                <table className="table-wrapper">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    className="row-checkbox"
                                    checked={jobs.length > 0 && selectedJobIds.length === jobs.length}
                                    onChange={onSelectAll}
                                />
                            </th>
                            <th>สถานะ</th>
                            <th>เลขที่/วันที่</th>
                            <th>รายละเอียด</th>
                            <th>ผู้ยื่น/ผู้รับผิดชอบ</th>
                            <th>ขั้นตอน</th>
                            <th>จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                                    ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job) => {
                                const statusStyle = getStatusBadgeStyle(job.status);
                                const deptWorkflows = workflows[job.department];
                                const lastStep = deptWorkflows && deptWorkflows.length > 0
                                    ? deptWorkflows[deptWorkflows.length - 1].name
                                    : null;
                                const isFinished = job.status === 'completed' && job.step === lastStep;
                                const duration = !isFinished ? calculateDuration(job.date, job.department, deptSettings) : null;

                                return (
                                    <tr key={job.id} className={selectedJobIds.includes(job.id) ? 'row-selected' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                className="row-checkbox"
                                                checked={selectedJobIds.includes(job.id)}
                                                onChange={() => onSelectJob(job.id)}
                                            />
                                        </td>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <span
                                                className={`status-badge ${job.status}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 600,
                                                    lineHeight: 1.2,
                                                    whiteSpace: 'nowrap',
                                                    ...statusStyle
                                                }}
                                            >
                                                {getStatusText(job.status)}
                                            </span>
                                        </td>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {job.receptionNo}
                                                {job.printedAt && (
                                                    <span title={`พิมพ์เมื่อ ${new Date(job.printedAt).toLocaleString('th-TH')}`} style={{ color: '#10b981', fontSize: '0.85rem' }}>
                                                        <Printer size={14} />
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#888' }}>{formatThaiDate(job.date)}</div>
                                            {duration && (
                                                <div style={{ fontSize: '0.75rem', marginTop: 2 }} className={duration.colorClass}>
                                                    ผ่านมาแล้ว {duration.days} วัน
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500 }}>{job.type}</div>
                                            <span style={{
                                                display: 'inline-block',
                                                marginTop: 4,
                                                padding: '2px 8px',
                                                background: '#f5f5f7',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                color: '#555'
                                            }}>
                                                {job.department}
                                            </span>
                                        </td>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div style={{ fontWeight: 500 }}>{job.owner}</div>
                                            {job.assignees && job.assignees.length > 0 && (
                                                <div style={{ fontSize: '0.8rem', color: '#666', marginTop: 4 }}>
                                                    ดูแลโดย: {job.assignees[0]} {job.assignees.length > 1 ? `+${job.assignees.length - 1}` : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ verticalAlign: 'top' }}>{job.step}</td>
                                        <td style={{ verticalAlign: 'top' }}>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="action-button"
                                                    onClick={(e) => onPrint(job, e)}
                                                    title="พิมพ์ใบนัด"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <button
                                                    className="action-button"
                                                    onClick={() => onEdit(job)}
                                                    title="แก้ไขข้อมูล"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="action-button"
                                                    onClick={() => onUpdateStatus(job)}
                                                    title="อัปเดตสถานะ"
                                                >
                                                    <Edit size={18} style={{ color: 'var(--accent-color)' }} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
