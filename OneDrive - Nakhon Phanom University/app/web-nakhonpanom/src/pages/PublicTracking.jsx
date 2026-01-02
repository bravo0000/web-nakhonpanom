import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import { Search, Calendar, FileText, Check, Clock, MapPin } from 'lucide-react';
import ThaiDatePicker from '../components/ThaiDatePicker';
import './PublicTracking.css';

// Mock Workflows (Should match WorkflowEditor)
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

// Mock Data
const MOCK_JOBS_DB = [
    {
        receptionNo: '123/2567',
        date: '2024-01-01',
        type: 'รังวัดสอบเขต',
        department: 'ฝ่ายรังวัด',
        owner: 'นายสมชาย ใจดี',
        currentStepIndex: 3,
        assignees: ['นายช่าง แม่นยำ']
    },
    {
        receptionNo: '555/2567',
        date: '2024-01-02',
        type: 'จดทะเบียนขายฝาก',
        department: 'ฝ่ายทะเบียน',
        owner: 'นางสาวมีนา รักดี',
        currentStepIndex: 1,
        assignees: ['นายทะเบียน ใจดี']
    },
    {
        receptionNo: '999/2567',
        date: '2024-01-03',
        type: 'หารือระเบียบ',
        department: 'กลุ่มงานวิชาการที่ดิน',
        owner: 'นายใจ กล้าหาญ',
        currentStepIndex: 4,
        assignees: []
    },
];

export default function PublicTracking() {
    const [receptionNo, setReceptionNo] = useState('');
    const [date, setDate] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatThaiDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleAutoSearch = (recNo) => {
        setLoading(true);
        setResult(null);
        setError('');

        setTimeout(() => {
            // Load jobs from LocalStorage (Sync with Admin Dashboard)
            let jobsDB = MOCK_JOBS_DB;
            let workflowsDB = MOCK_WORKFLOWS;

            try {
                const savedJobs = localStorage.getItem('land_jobs');
                if (savedJobs) jobsDB = JSON.parse(savedJobs);

                const savedWorkflows = localStorage.getItem('land_workflows');
                if (savedWorkflows) workflowsDB = JSON.parse(savedWorkflows);
            } catch (e) {
                console.error('Data load error', e);
            }

            const foundJob = jobsDB.find(job => job.receptionNo === recNo);
            if (foundJob) {
                // Generate timeline based on department workflow
                const workflow = workflowsDB[foundJob.department] || workflowsDB['ฝ่ายทะเบียน'];
                const timeline = workflow.map((step, index) => {
                    let status = 'pending';
                    // Allow job.step (string name) to override index logic if present
                    if (foundJob.step) {
                        const stepIndex = workflow.findIndex(s => s.name === foundJob.step);
                        if (index < stepIndex) status = 'completed';
                        else if (index === stepIndex) status = foundJob.status === 'completed' ? 'completed' : 'active';
                    } else if (foundJob.currentStepIndex !== undefined) {
                        // Fallback for legacy mock data
                        if (index < foundJob.currentStepIndex) status = 'completed';
                        else if (index === foundJob.currentStepIndex) status = 'active';
                    }

                    return {
                        id: step.id,
                        name: step.name,
                        date: status === 'pending' ? '-' : 'ดำเนินการแล้ว',
                        status
                    };
                });

                setResult({ ...foundJob, timeline });
            } else {
                setError('ไม่พบข้อมูลตามเลขที่ที่ระบุ กรุณาตรวจสอบอีกครั้ง');
            }
            setLoading(false);
        }, 800);
    }

    // Auto-search from URL params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const receptionNoParam = params.get('receptionNo');

        if (receptionNoParam) {
            setReceptionNo(receptionNoParam);
            // Trigger search automatically
            handleAutoSearch(receptionNoParam);
        }
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        handleAutoSearch(receptionNo);
    };



    return (
        <Layout>
            <div className="public-page-container">
                {/* Dynamic Background via Portal to escape container constraints */}
                {createPortal(
                    <div className="page-background">
                        <div className="gradient-blob blob-1" style={{ top: '10%', right: '-10%' }}></div>
                        <div className="gradient-blob blob-2" style={{ bottom: '10%', left: '-10%' }}></div>
                        <div className="gradient-blob blob-3" style={{ top: '40%', left: '20%', opacity: 0.4 }}></div>
                    </div>,
                    document.body
                )}

                <div className="tracking-wrapper">
                    <h1 className="tracking-title animate-fade-in-up">
                        ติดตามสถานะ<br />
                        <span className="text-gradient">คำขอสำนักงานที่ดิน</span>
                    </h1>
                    <p className="tracking-subtitle animate-fade-in-up delay-100">
                        กรอกเลขที่รับเรื่องและวันที่เพื่อดูความคืบหน้าแบบ Real-time
                    </p>

                    {/* Search Card */}
                    <div className="glass search-card">
                        <form onSubmit={handleSearch}>
                            <div className="form-group">
                                <label className="form-label">เลขที่รับเรื่อง</label>
                                <div className="input-wrapper">
                                    <FileText className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="เช่น 123/2567"
                                        className="form-input"
                                        value={receptionNo}
                                        onChange={(e) => setReceptionNo(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">วันที่รับเรื่อง</label>
                                <ThaiDatePicker
                                    value={date}
                                    onChange={setDate}
                                    placeholder="เลือกวันที่ (วว/ดด/ปปปป)"
                                />
                            </div>

                            {error && <div style={{ color: '#d32f2f', marginBottom: 12, fontSize: '0.9rem' }}>{error}</div>}

                            <button
                                type="submit"
                                className="search-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                                ) : (
                                    <>
                                        <Search className="w-5 h-5" />
                                        ค้นหาข้อมูล
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Results Timeline */}
                    {result && (
                        <div className="result-container">
                            <div className="job-header">
                                <h2>สถานะคำขอ: {result.type}</h2>
                                <div className="job-meta">
                                    <span style={{ marginRight: 8 }}>วันที่: {formatThaiDate(result.date)}</span>
                                    <span style={{ marginRight: 8 }}>|</span>
                                    <span style={{ marginRight: 8 }}>เลขที่: {result.receptionNo}</span>
                                    <span style={{ marginRight: 8 }}>|</span>
                                    <span style={{ marginRight: 8 }}>ผู้ยื่น: {result.owner}</span>
                                    <span style={{ marginRight: 8 }}>|</span>
                                    <span style={{
                                        background: '#e3f2fd', color: '#1565c0',
                                        padding: '2px 8px', borderRadius: 4, fontSize: '0.9em'
                                    }}>
                                        {result.department}
                                    </span>
                                </div>
                            </div>

                            <div className="timeline">
                                {result.timeline.map((step, index) => {
                                    const isCompleted = step.status === 'completed';
                                    const isActive = step.status === 'active';

                                    return (
                                        <div
                                            key={step.id}
                                            className="timeline-step animate-slide-in"
                                            style={{ '--delay': `${index * 0.15}s` }}
                                        >
                                            <div className={`step-icon ${step.status} ${isActive ? 'pulse' : ''}`}>
                                                {isCompleted ? <Check className="w-5 h-5" /> :
                                                    isActive ? <Clock className="w-5 h-5" /> :
                                                        <div className="w-3 h-3 bg-gray-300 rounded-full" />}
                                            </div>
                                            <div className="step-content hover-lift">
                                                <div className="step-title">{step.name}</div>
                                                <div className="step-date">{step.date}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Responsible Officer Footer */}
                            <div className="job-footer" style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: 4 }}>เจ้าหน้าที่ผู้รับผิดชอบ:</div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            {result.assignees && result.assignees.length > 0
                                                ? result.assignees[0]
                                                : 'เจ้าหน้าที่สำนักงานที่ดิน'}
                                        </div>
                                    </div>
                                    <ContactButton
                                        officerName={result.assignees?.[0]}
                                        department={result.department}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

// Helper Component for Contact Button
function ContactButton({ officerName, department }) {
    const [showPhone, setShowPhone] = useState(false);
    const [phone, setPhone] = useState('');

    useEffect(() => {
        // Load settings from localStorage to find phone number
        try {
            const saved = localStorage.getItem('deptSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                if (settings) {
                    const deptData = settings[department];
                    if (deptData && deptData.officers) {
                        // Find officer by name
                        const officer = deptData.officers.find(o => o.name === officerName);
                        if (officer && officer.phone) {
                            setPhone(officer.phone);
                        } else {
                            // Fallback to first officer or department default if we had one
                            setPhone(deptData.officers[0]?.phone || '042-511-200');
                        }
                    }
                }
            }
        } catch (e) {
            console.error('Error loading contact info', e);
        }
    }, [officerName, department]);

    if (showPhone) {
        return (
            <div style={{
                background: '#f0fdf4', color: '#166534',
                padding: '10px 20px', borderRadius: 8,
                fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8
            }}>
                <span>📞 โทร: {phone || 'ไม่พบเบอร์โทร'}</span>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowPhone(true)}
            style={{
                background: 'var(--accent-color)', color: 'white',
                padding: '10px 24px', borderRadius: 8,
                fontWeight: 500, transition: 'all 0.2s'
            }}
            className="hover:opacity-90"
        >
            ติดต่อเจ้าหน้าที่
        </button>
    );
}
