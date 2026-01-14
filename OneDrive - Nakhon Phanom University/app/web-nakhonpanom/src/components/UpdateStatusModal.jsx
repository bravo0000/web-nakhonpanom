import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import './AddJobModal.css'; // Reuse styles
import { INITIAL_WORKFLOWS } from '../config/constants';

export default function UpdateStatusModal({ isOpen, onClose, job, onUpdate, workflows }) {
    if (!isOpen || !job) return null;

    const isBulk = !!job._bulk;
    const targetJobs = isBulk ? job.jobs : [job];

    // Check if all jobs are in same department
    const firstDept = targetJobs[0]?.department;
    const isSameDept = targetJobs.every(j => j.department === firstDept);

    // If same dept, use that dept's workflow. If mixed, no workflow steps available.
    // Use passed workflows prop if available (from DB), otherwise fallback to initial
    const sourceWorkflows = workflows || INITIAL_WORKFLOWS;
    const currentWorkflow = isSameDept ? (sourceWorkflows[firstDept] || []) : [];

    // State for step selection (step name OR 'COMPLETED')
    const [selectedOption, setSelectedOption] = useState('');
    const [note, setNote] = useState('');

    // Reset state when job changes
    useEffect(() => {
        if (job) {
            if (isBulk) {
                setSelectedOption('');
                setNote('');
            } else {
                if (job.status === 'completed') {
                    setSelectedOption('COMPLETED');
                } else {
                    setSelectedOption(job.step);
                }
                setNote(job.note || '');
            }
        }
    }, [job, isBulk]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Helper to determine status/step/note
        const deriveState = (option, currentJob) => {
            if (option === 'COMPLETED') {
                return {
                    status: 'completed',
                    step: 'ดำเนินการเสร็จสิ้น',
                    note: note
                };
            }
            return {
                status: 'active',
                step: option,
                note: note
            };
        };

        if (isBulk) {
            const updatedJobs = targetJobs.map(j => {
                // If user selected an option (Global change), use it. Or else keep original.
                const effectiveOption = (selectedOption && isSameDept) ? selectedOption : (j.status === 'completed' ? 'COMPLETED' : j.step);

                if (!selectedOption && !note) return j; // No change

                const base = deriveState(effectiveOption, j);

                // If option was explicitly picked, use derived status/step.
                // If not picked, keep original status/step.
                const finalStatus = selectedOption ? base.status : j.status;
                const finalStep = selectedOption ? base.step : j.step;
                const finalNote = note ? note : j.note;

                return {
                    ...j,
                    status: finalStatus,
                    step: finalStep,
                    note: finalNote
                };
            });
            onUpdate(updatedJobs);
        } else {
            const result = deriveState(selectedOption, job);
            onUpdate({
                ...job,
                status: result.status,
                step: result.step,
                note: result.note
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
                                                border: selectedOption === step.name ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: selectedOption === step.name ? '#f0f9ff' : 'white'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="step"
                                                value={step.name}
                                                checked={selectedOption === step.name}
                                                onChange={(e) => setSelectedOption(e.target.value)}
                                                style={{ width: 18, height: 18, accentColor: 'var(--accent-color)' }}
                                            />
                                            <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>{step.name}</span>
                                        </label>
                                    ))}

                                    {/* Explicit COMPLETED Option */}
                                    <div style={{ marginTop: 8 }}>
                                        <label
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '12px',
                                                border: selectedOption === 'COMPLETED' ? '2px solid #4CAF50' : '1px solid var(--border-color)',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                background: selectedOption === 'COMPLETED' ? '#e8f5e9' : 'white'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="step"
                                                value="COMPLETED"
                                                checked={selectedOption === 'COMPLETED'}
                                                onChange={(e) => setSelectedOption(e.target.value)}
                                                style={{ width: 18, height: 18, accentColor: '#4CAF50' }}
                                            />
                                            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2e7d32' }}>เสร็จสิ้น</span>
                                        </label>

                                    </div>

                                    {/* Note Input (Always Visible) */}
                                    <div className="animate-fade-in-up" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #eee' }}>
                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, color: '#333', marginBottom: 6 }}>
                                            หมายเหตุ (แจ้งประชาชน / รายละเอียดเพิ่มเติม):
                                        </label>
                                        <textarea
                                            className="form-input"
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            placeholder="ระบุข้อความที่ต้องการแจ้งให้ทราบ..."
                                            rows={3}
                                            style={{ width: '100%', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status Select Removed - Auto-calculated based on Step */}
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
