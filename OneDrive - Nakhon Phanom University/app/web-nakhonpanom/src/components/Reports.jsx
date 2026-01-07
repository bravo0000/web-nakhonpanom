import React, { useState, useMemo } from 'react';
import { Printer, FileText, Clock, AlertTriangle, CheckCircle, Users, Filter, Calendar } from 'lucide-react';
import './Reports.css';

export default function Reports({ jobs, deptSettings, currentUser }) {
    // 1. Determine Access Rights and Initial Department
    const allowedDepts = useMemo(() => {
        if (!currentUser) return [];
        if (currentUser.role === 'admin') {
            return Object.keys(deptSettings); // Admin sees all
        }
        return currentUser.departments || []; // Staff sees specific
    }, [currentUser, deptSettings]);

    const [selectedDept, setSelectedDept] = useState(allowedDepts[0] || '');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 2. Logic to calculate stats based on selected department
    const reportData = useMemo(() => {
        if (!selectedDept) return null;

        const settings = deptSettings[selectedDept] || { critical: 30 };
        const criticalLimit = settings.critical;
        const now = new Date(); // Current time for calc

        // Filter jobs for this department AND date range
        let deptJobs = jobs.filter(j => j.department === selectedDept);

        // Apply date range filter
        if (startDate || endDate) {
            deptJobs = deptJobs.filter(job => {
                if (!job.date) return false;
                const jobDate = new Date(job.date);
                jobDate.setHours(0, 0, 0, 0);

                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    if (jobDate < start) return false;
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(0, 0, 0, 0);
                    if (jobDate > end) return false;
                }
                return true;
            });
        }

        // -- Global Stats for Dept --
        let totalJobs = 0;
        let inHand = 0;   // Active + Pending
        let overdue = 0;  // Subset of In Hand
        let completed = 0;

        // -- Per Person Stats --
        // Map: "Name" -> { total, inHand, overdue, completed }
        const personStats = {};

        deptJobs.forEach(job => {
            totalJobs++;

            // Calc Overdue Status
            let isJobOverdue = false;
            if (job.status !== 'completed' && job.date) {
                const jobDate = new Date(job.date);
                const diffTime = now - jobDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > criticalLimit) {
                    isJobOverdue = true;
                }
            }

            // Update Dept Global Counts
            if (job.status === 'completed') {
                completed++;
            } else {
                inHand++; // Active or Pending = In Hand
                if (isJobOverdue) overdue++;
            }

            // Update Person Counts
            const assignees = job.assignees || [];
            if (assignees.length === 0) {
                // Unassigned
                const name = "(ยังไม่ระบุผู้รับผิดชอบ)";
                if (!personStats[name]) personStats[name] = { name, total: 0, inHand: 0, overdue: 0, completed: 0 };

                personStats[name].total++;
                if (job.status === 'completed') {
                    personStats[name].completed++;
                } else {
                    personStats[name].inHand++;
                    if (isJobOverdue) personStats[name].overdue++;
                }
            } else {
                assignees.forEach(rawName => {
                    // Cleanup name (remove phone if present for grouping)
                    const name = rawName.split(' (')[0];
                    if (!personStats[name]) personStats[name] = { name, total: 0, inHand: 0, overdue: 0, completed: 0 };

                    personStats[name].total++;
                    if (job.status === 'completed') {
                        personStats[name].completed++;
                    } else {
                        personStats[name].inHand++;
                        if (isJobOverdue) personStats[name].overdue++;
                    }
                });
            }
        });

        // Convert Map to Array and Sort (by In Hand desc)
        const personnelList = Object.values(personStats).sort((a, b) => b.inHand - a.inHand);

        return {
            totalJobs,
            inHand,
            overdue,
            completed,
            personnelList,
            limit: criticalLimit
        };

    }, [jobs, selectedDept, deptSettings, startDate, endDate]);

    const handlePrint = () => {
        window.print();
    };

    if (allowedDepts.length === 0) {
        return <div className="p-8 text-center text-gray-500">คุณไม่มีสิทธิ์เข้าถึงรายงานข้อมูล</div>;
    }

    return (
        <div className="reports-container">
            {/* Header / Filter */}
            <header className="reports-header no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <h1 className="report-title">รายงานสรุปงาน</h1>
                    <div className="filter-wrapper">
                        <Filter size={16} className="text-gray-500" />
                        <select
                            value={selectedDept}
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="dept-select"
                        >
                            {allowedDepts.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-wrapper">
                        <Calendar size={16} className="text-gray-500" />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="date-input"
                            placeholder="วันที่เริ่มต้น"
                        />
                        <span style={{ color: '#64748b' }}>ถึง</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="date-input"
                        />
                    </div>
                </div>
                <button onClick={handlePrint} className="primary-button screen-only">
                    <Printer size={20} />
                    พิมพ์รายงาน
                </button>
            </header>

            {/* PDF Content */}
            <div>
                {/* Print Only Header */}
                <div className="print-only print-header">
                    <h1>ปริมาณงานของฝ่าย{selectedDept}</h1>
                    <p className="print-date">
                        {startDate || endDate ? (
                            <>ช่วงวันที่ {startDate ? new Date(startDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'} ถึง {endDate ? new Date(endDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' }) : '...'}</>
                        ) : (
                            <>ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</>
                        )}
                    </p>
                </div>

                {reportData && (
                    <>
                        {/* Department Overview Cards */}
                        <div className="stat-grid">
                            <div className="stat-card-report">
                                <div className="icon-wrapper bg-blue-100 text-blue-600">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <div className="stat-value">{reportData.totalJobs}</div>
                                    <div className="stat-label">งานทั้งหมด</div>
                                </div>
                            </div>

                            <div className="stat-card-report">
                                <div className="icon-wrapper bg-orange-100 text-orange-600">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <div className="stat-value text-orange-600">{reportData.inHand}</div>
                                    <div className="stat-label">ค้างในมือ (In Hand)</div>
                                </div>
                            </div>

                            <div className="stat-card-report">
                                <div className="icon-wrapper bg-red-100 text-red-600">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <div className="stat-value text-red-600">{reportData.overdue}</div>
                                    <div className="stat-label">ล่าช้าเกิน {reportData.limit} วัน</div>
                                </div>
                            </div>

                            <div className="stat-card-report">
                                <div className="icon-wrapper bg-green-100 text-green-600">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <div className="stat-value text-green-600">{reportData.completed}</div>
                                    <div className="stat-label">เสร็จสิ้น</div>
                                </div>
                            </div>
                        </div>

                        {/* Personnel Table */}
                        <div className="data-table-section">
                            <h3 className="section-title screen-only">
                                <Users size={20} />
                                ผลงานรายบุคคล (Personnel Performance)
                            </h3>
                            <table className="report-table">
                                <thead>
                                    <tr>
                                        <th className="text-center print-col-no">ลำดับที่</th>
                                        <th>ชื่อเจ้าหน้าที่</th>
                                        <th className="text-center">งานทั้งหมด</th>
                                        <th className="text-center">งานระหว่าง<br />ดำเนินการ</th>
                                        <th className="text-center text-green-600">งานที่<br />เสร็จแล้ว</th>
                                        <th className="text-center text-red-600">งานที่ช้าเกิน<br />มาตรฐาน</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.personnelList.length > 0 ? (
                                        <>
                                            {reportData.personnelList.map((person, index) => (
                                                <tr key={index}>
                                                    <td className="text-center">{index + 1}</td>
                                                    <td style={{ fontWeight: 500 }}>{person.name}</td>
                                                    <td className="text-center font-bold">{person.total}</td>
                                                    <td className="text-center" style={{ color: person.inHand > 0 ? '#d97706' : '#94a3b8', fontWeight: person.inHand > 0 ? 'bold' : 'normal' }}>
                                                        {person.inHand}
                                                    </td>
                                                    <td className="text-center text-green-700 font-medium">
                                                        {person.completed}
                                                    </td>
                                                    <td className="text-center" style={{ color: person.overdue > 0 ? '#dc2626' : '#94a3b8', fontWeight: person.overdue > 0 ? 'bold' : 'normal', backgroundColor: person.overdue > 0 ? '#fef2f2' : 'transparent' }}>
                                                        {person.overdue}
                                                    </td>
                                                </tr>
                                            ))}
                                            {/* Summary Row */}
                                            <tr className="summary-row">
                                                <td colSpan="2" className="text-center font-bold">สรุปรวม</td>
                                                <td className="text-center font-bold">{reportData.totalJobs}</td>
                                                <td className="text-center font-bold" style={{ color: '#d97706' }}>{reportData.inHand}</td>
                                                <td className="text-center font-bold" style={{ color: '#16a34a' }}>{reportData.completed}</td>
                                                <td className="text-center font-bold" style={{ color: '#dc2626' }}>{reportData.overdue}</td>
                                            </tr>
                                        </>
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center text-gray-500 py-8">
                                                ยังไม่มีข้อมูลงานในฝ่ายนี้
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
