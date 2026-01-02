import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import './AddJobModal.css'; // Reuse styles

// Mock Workflows (Should match WorkflowEditor/PublicTracking)
// In a real app, this would be passed as a prop or context
const MOCK_WORKFLOWS = {
    'ฝ่ายทะเบียน': [
        { id: 1, name: 'รับเรื่อง / ตรวจสอบเอกสาร' },
        { id: 2, name: 'ตรวจสอบหลักทรัพย์' },
        { id: 3, name: 'เสนอเจ้าพนักงานที่ดิน' },
        { id: 4, name: 'ชำระค่าธรรมเนียม / จดทะเบียน' },
        { id: 5, name: 'แจกหนังสือสำคัญ' }
    ],
    'ฝ่ายรังวัด': [
        { id: 1, name: 'รับเรื่อง / นัดรังวัด' },
        { id: 2, name: 'วางเงินมัดจำรังวัด' },
        { id: 3, name: 'ช่างออกไปทำการรังวัด' },
        { id: 4, name: 'คำนวณ / เขียนแผนที่' },
        { id: 5, name: 'ตรวจรูปแผนที่ / สารบบ' },
        { id: 6, name: 'ส่งฝ่ายทะเบียนดำเนินการต่อ' }
    ],
    'กลุ่มงานวิชาการที่ดิน': [
        { id: 1, name: 'รับเรื่องร้องเรียน / หารือ' },
        { id: 2, name: 'ตรวจสอบข้อเท็จจริง / ข้อกฎหมาย' },
        { id: 3, name: 'สรุปเรื่องเสนอความเห็น' },
        { id: 4, name: 'เจ้าพนักงานที่ดินพิจารณา' },
        { id: 5, name: 'แจ้งผลการพิจารณา' }
    ],
    'ฝ่ายอำนวยการ': [
        { id: 1, name: 'รับหนังสือเข้า' },
        { id: 2, name: 'เสนอหัวหน้าฝ่ายอำนวยการ' },
        { id: 3, name: 'เจ้าหน้าที่ดำเนินการ / พิมพ์หนังสือ' },
        { id: 4, name: 'เสนอลงนาม' },
        { id: 5, name: 'ออกเลขหนังสือส่ง / ส่งไปรษณีย์' }
    ]
};

export default function UpdateStatusModal({ isOpen, onClose, job, onUpdate }) {
    if (!isOpen || !job) return null;

    const isBulk = !!job._bulk;
    const targetJobs = isBulk ? job.jobs : [job];

    // Check if all jobs are in same department
    const firstDept = targetJobs[0]?.department;
    const isSameDept = targetJobs.every(j => j.department === firstDept);

    // If same dept, use that dept's workflow. If mixed, no workflow steps available.
    const currentWorkflow = isSameDept ? (MOCK_WORKFLOWS[firstDept] || []) : [];

    const [selectedStep, setSelectedStep] = useState(isBulk ? '' : job.step);
    const [status, setStatus] = useState(isBulk ? 'active' : job.status);

    // Reset state when job changes
    useEffect(() => {
        if (job) {
            if (isBulk) {
                // For bulk, default to empty step (no change) unless we want to force select
                // But if same dept, maybe pre-select if all have same step? logic can be complex
                // Let's keep it simple: Default no step selected implies "Don't Change Step"
                setSelectedStep('');
                setStatus('active');
            } else {
                setSelectedStep(job.step);
                setStatus(job.status || 'active');
            }
        }
    }, [job, isBulk]);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (isBulk) {
            // Map all jobs to new state
            const updatedJobs = targetJobs.map(j => ({
                ...j,
                // Only update step if selectedStep is provided (and allowed)
                ...(selectedStep && isSameDept ? { step: selectedStep } : {}),
                status: status
            }));
            onUpdate(updatedJobs);
        } else {
            onUpdate({
                ...job,
                step: selectedStep,
                status: status
            });
        }
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 480 }}>
                <header className="modal-header">
                    <div>
                        <h2 className="modal-title">
                            {isBulk ? `อัปเดต ${targetJobs.length} รายการ` : 'อัปเดตสถานะงาน'}
                        </h2>
                        <p className="workflow-subtitle" style={{ marginBottom: 0, marginTop: 4 }}>
                            {isBulk
                                ? (isSameDept ? `สังกัด: ${firstDept}` : 'รวมหลายแผนก (เปลี่ยนได้เฉพาะสถานะ)')
                                : `เลขที่ ${job.receptionNo} (${job.department})`
                            }
                        </p>
                    </div>
                    <button onClick={onClose} className="close-button">
                        <X size={20} />
                    </button>
                </header>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {isSameDept && (
                            <div className="form-group">
                                <label className="form-label">
                                    ขั้นตอน {isBulk && <span style={{ fontWeight: 400, color: '#888' }}>(เลือกเพื่อเปลี่ยนทั้งหมด)</span>}
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {currentWorkflow.map((step) => (
                                        <label
                                            key={step.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px',
                                                border: selectedStep === step.name ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: selectedStep === step.name ? '#f0f9ff' : 'white'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="step"
                                                value={step.name}
                                                checked={selectedStep === step.name}
                                                onChange={(e) => setSelectedStep(e.target.value)}
                                                style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                                            />
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{step.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="form-group" style={{ marginTop: 24 }}>
                            <label className="form-label">สถานะ</label>
                            <select
                                className="form-input"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="active">กำลังดำเนินการ (Active)</option>
                                <option value="pending">รอดำเนินการ (Pending)</option>
                                <option value="completed">เสร็จสิ้น (Completed)</option>
                            </select>
                        </div>
                    </div>

                    <footer className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-cancel">
                            ยกเลิก
                        </button>
                        <button type="submit" className="btn-submit">
                            บันทึก
                        </button>
                    </footer>
                </form>
            </div>
        </div>
    );
}
