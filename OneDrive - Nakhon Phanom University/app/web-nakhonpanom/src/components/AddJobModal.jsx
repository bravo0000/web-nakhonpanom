import React, { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import ThaiDatePicker from './ThaiDatePicker';
import './AddJobModal.css';

const DEPTS = [
    'ฝ่ายทะเบียน',
    'ฝ่ายรังวัด',
    'กลุ่มงานวิชาการที่ดิน',
    'ฝ่ายอำนวยการ'
];

const PREFIXES = {
    'ฝ่ายทะเบียน': 'R',
    'ฝ่ายรังวัด': 'S',
    'กลุ่มงานวิชาการที่ดิน': 'L',
    'ฝ่ายอำนวยการ': 'A'
};

export default function AddJobModal({ isOpen, onClose, onSubmit, editJob = null, deptSettings, jobTypes = {}, jobs = [] }) {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        receptionNo: '',
        date: new Date().toISOString().split('T')[0],
        department: 'ฝ่ายรังวัด',
        type: '',
        owner: '',
        assignees: []
    });

    // Generate Next Reception Number Logic
    const generateNextReceptionNo = useCallback((dept) => {
        const prefix = PREFIXES[dept] || '';
        const thaiYear = new Date().getFullYear() + 543;

        // Filter jobs matching this department/prefix and current year (loose check on year)
        // Pattern: PREFIX + NUMBER + / + YEAR
        const pattern = new RegExp(`^${prefix}(\\d+)\/${thaiYear}$`);

        let maxNo = 0;

        jobs.forEach(job => {
            const match = job.receptionNo.match(pattern);
            if (match) {
                const no = parseInt(match[1], 10);
                if (no > maxNo) maxNo = no;
            }
        });

        return `${prefix}${maxNo + 1}/${thaiYear}`;
    }, [jobs]); // Depend on jobs

    // Populate form if editing or New
    useEffect(() => {
        if (!isOpen) return; // Only run when opening

        if (editJob) {
            setFormData({
                ...editJob,
                department: editJob.department || 'ฝ่ายรังวัด',
                type: editJob.type || '',
                assignees: editJob.assignees || []
            });
        } else {
            // Reset for new job with AUTO-GENERATED number
            const defaultDept = 'ฝ่ายรังวัด';
            setFormData({
                receptionNo: generateNextReceptionNo(defaultDept),
                date: new Date().toISOString().split('T')[0],
                department: defaultDept,
                type: (jobTypes[defaultDept] && jobTypes[defaultDept][0]) || '',
                owner: '',
                assignees: []
            });
        }
    }, [editJob, isOpen, generateNextReceptionNo, jobTypes]); // Removed generateNextReceptionNo to prevent re-runs on render, though useCallback helps too. But logically only need this on open.

    // Handle Department Change & Auto Prefix/Number
    const handleDeptChange = (newDept) => {
        // When changing department, ALWAYS re-calculate the next valid number for that department
        // This is better than trying to convert the old number which might cause conflicts
        const newReceptionNo = generateNextReceptionNo(newDept);

        setFormData(prev => ({
            ...prev,
            department: newDept,
            receptionNo: newReceptionNo,
            type: (jobTypes[newDept] && jobTypes[newDept][0]) || '',
            assignees: [] // Clear assignees when department changes
        }));
    };

    const handleCheckboxChange = (officerName) => {
        setFormData(prev => {
            const isSelected = prev.assignees?.includes(officerName);
            if (isSelected) {
                return { ...prev, assignees: prev.assignees.filter(a => a !== officerName) };
            } else {
                return { ...prev, assignees: [...(prev.assignees || []), officerName] };
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate Duplicate Reception No
        const isDuplicate = jobs.some(job =>
            job.receptionNo.toLowerCase() === formData.receptionNo.toLowerCase() &&
            job.id !== editJob?.id
        );

        if (isDuplicate) {
            alert(`เลขที่คำขอ "${formData.receptionNo}" มีอยู่ในระบบแล้ว กรุณาตรวจสอบ`);
            return;
        }

        onSubmit(formData);
        onClose();
    };

    const currentOfficers = deptSettings?.[formData.department]?.officers || [];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <header className="modal-header">
                    <h2 className="modal-title">
                        {editJob ? 'แก้ไขข้อมูลงาน' : 'เพิ่มงานใหม่'}
                    </h2>
                    <button onClick={onClose} className="close-button">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-grid">

                            {/* Row 1 */}
                            <div className="form-group full-width">
                                <label className="form-label">สังกัดฝ่าย</label>
                                <select
                                    className="form-input"
                                    value={formData.department}
                                    onChange={(e) => handleDeptChange(e.target.value)}
                                    disabled={!!editJob} // Disable dept change during edit to prevent workflow mismatch
                                    style={{ opacity: editJob ? 0.7 : 1 }}
                                >
                                    {DEPTS.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 2: Type (Dynamic) */}
                            <div className="form-group full-width">
                                <label className="form-label">ประเภทงาน (รายละเอียด)</label>
                                <select
                                    className="form-input"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    {(jobTypes[formData.department] || []).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                    {/* Fallback option if current type isn't in list */}
                                    {!jobTypes[formData.department]?.includes(formData.type) && formData.type && (
                                        <option value={formData.type}>{formData.type}</option>
                                    )}
                                </select>
                            </div>

                            {/* Row 3 */}
                            <div className="form-group">
                                <label className="form-label">เลขที่รับเรื่อง (Running อัตโนมัติ)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder={`เช่น ${PREFIXES[formData.department] || ''}101/${new Date().getFullYear() + 543}`}
                                    value={formData.receptionNo}
                                    onChange={(e) => setFormData({ ...formData, receptionNo: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">วันที่รับเรื่อง</label>
                                <ThaiDatePicker
                                    value={formData.date}
                                    onChange={(newDate) => setFormData({ ...formData, date: newDate })}
                                    placeholder="วว/ดด/ปปปป"
                                />
                            </div>

                            {/* Row 4 */}
                            <div className="form-group full-width">
                                <label className="form-label">ชื่อผู้ยื่นคำขอ</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="ชื่อ-นามสกุล"
                                    value={formData.owner}
                                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Row 5 */}
                            <div className="form-group full-width">
                                <label className="form-label">ผู้รับผิดชอบ</label>
                                <div className="checkbox-group">
                                    {currentOfficers.length === 0 ? (
                                        <div style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                            ไม่พบรายชื่อเจ้าหน้าที่ (กรุณาเพิ่มในหน้าตั้งค่า)
                                        </div>
                                    ) : (
                                        currentOfficers.map((officer) => (
                                            <label key={officer.id || officer.name} className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.assignees?.includes(officer.name)}
                                                    onChange={() => handleCheckboxChange(officer.name)}
                                                />
                                                <span className="checkbox-label">{officer.name}</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            ยกเลิก
                        </button>
                        <button type="submit" className="btn-submit">
                            {editJob ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
