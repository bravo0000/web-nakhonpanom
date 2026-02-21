import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import Layout from '../components/Layout';
import { Search, FileText, Check, Clock, MapPin, Phone } from 'lucide-react';
import { fetchAppSetting } from '../utils/auth';
import { useWorkflows } from '../utils/useAppSettings';
import { INITIAL_WORKFLOWS } from '../config/constants';
import pb from '../lib/pocketbase';
import './PublicTracking.css';
import QuickLinks from '../components/QuickLinks';

export default function PublicTracking() {
    const [receptionNo, setReceptionNo] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Security: Sanitize text to prevent XSS (strip HTML tags)
    const sanitizeText = (text, maxLength = 1000) => {
        if (!text) return '';
        // Remove HTML tags and limit length
        return String(text)
            .replace(/<[^>]*>/g, '')  // Strip HTML tags
            .slice(0, maxLength);
    };

    const formatThaiDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleAutoSearch = async (recNo) => {
        setLoading(true);
        setResult(null);
        setError('');

        try {
            // Security: Sanitize and validate input
            const MAX_INPUT_LENGTH = 50;
            let sanitizedRecNo = recNo.trim().slice(0, MAX_INPUT_LENGTH);

            // Remove potentially dangerous characters (SQL injection prevention)
            sanitizedRecNo = sanitizedRecNo.replace(/['"\\;=|&<>]/g, '');

            if (!sanitizedRecNo) {
                setError('กรุณากรอกเลขที่รับเรื่อง');
                setLoading(false);
                return;
            }

            // 1. Fetch Job from PocketBase (Case-Insensitive search)
            // Use escaped string to prevent injection
            const escapedRecNo = sanitizedRecNo.replace(/"/g, '\\"');
            const filter = `reception_no~"${escapedRecNo}"`;
            const record = await pb.collection('jobs').getFirstListItem(filter);

            if (!record) {
                setError('ไม่พบข้อมูลตามเลขที่ที่ระบุ กรุณาตรวจสอบอีกครั้ง');
                setLoading(false);
                return;
            }

            // 2. Map record to UI Job model
            const foundJob = {
                id: record.id,
                receptionNo: record.reception_no,
                date: record.date,
                department: record.department,
                type: record.job_type,
                owner: record.owner,
                status: record.status,
                step: record.step,
                note: record.note || '', // Added note field
                assignees: Array.isArray(record.assignees) ? record.assignees : [] // JSON array of strings
            };

            // 3. Load Active Workflows from settings (fallback to constants)
            const workflowsDB = await fetchAppSetting('workflows', INITIAL_WORKFLOWS);

            // 4. Generate timeline based on department workflow
            const workflow = workflowsDB[foundJob.department] || workflowsDB['ฝ่ายทะเบียน'];
            const timeline = workflow.map((step, index) => {
                let status = 'pending';

                // ถ้างานเสร็จสิ้นแล้ว ให้ทุก step เป็น completed
                if (foundJob.status === 'completed') {
                    status = 'completed';
                } else if (foundJob.step) {
                    // หา step ปัจจุบัน
                    const stepIndex = workflow.findIndex(s => s.name === foundJob.step);
                    if (stepIndex >= 0) {
                        if (index < stepIndex) status = 'completed';
                        else if (index === stepIndex) status = 'active';
                    }
                }

                return {
                    id: step.id,
                    name: step.name,
                    date: status === 'pending' ? '-' : 'ดำเนินการแล้ว',
                    status
                };
            });

            setResult({ ...foundJob, timeline });

        } catch (err) {
            console.error('Data load error', err);
            if (err.status === 404) {
                setError('ไม่พบข้อมูลตามเลขที่ที่ระบุ กรุณาตรวจสอบอีกครั้ง');
            } else if (err.status === 403 || err.status === 400) {
                setError('ระบบไม่อนุญาตให้เข้าถึงข้อมูล (กรุณาตรวจสอบ API Rules ใน PocketBase)');
            } else {
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + (err.message || 'โปรดตรวจสอบ Server หรือ Internet'));
            }
        } finally {
            setLoading(false);
        }
    };

    // 0. Use useSearchParams hook
    const [searchParams] = useSearchParams();

    // Widget mode check (e.g. ?min=1)
    const isWidget = searchParams.get('min') === '1';

    // Auto-search from URL params
    useEffect(() => {
        const receptionNoParam = searchParams.get('receptionNo');

        if (receptionNoParam) {
            setReceptionNo(receptionNoParam);
            // Trigger search automatically
            handleAutoSearch(receptionNoParam);
        }
    }, [searchParams]);

    // Visitor Counter Tracking
    useEffect(() => {
        const trackVisit = async () => {
            try {
                // Check if already counted in this session to prevent spam on reload
                if (!sessionStorage.getItem('visited_public_page')) {
                    await pb.collection('page_visits').create({
                        path: window.location.pathname,
                        userAgent: navigator.userAgent
                    });
                    sessionStorage.setItem('visited_public_page', 'true');
                }
            } catch (err) {
                // Silently ignore tracking errors so they don't impact UX
                console.log('Visitor tracking error:', err.message);
            }
        };

        trackVisit();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        handleAutoSearch(receptionNo);
    };



    return (
        <Layout>
            <div className="public-page-container">
                {/* Dynamic Background via Portal to escape container constraints */}
                {!isWidget && createPortal(
                    <div className="page-background">
                        <div className="gradient-blob blob-1" style={{ top: '10%', right: '-10%' }}></div>
                        <div className="gradient-blob blob-2" style={{ bottom: '10%', left: '-10%' }}></div>
                        <div className="gradient-blob blob-3" style={{ top: '40%', left: '20%', opacity: 0.4 }}></div>
                    </div>,
                    document.body
                )}

                <div className="tracking-wrapper">
                    {!isWidget && (
                        <>
                            <h1 className="tracking-title animate-fade-in-up">
                                <span style={{ fontSize: '0.85em', fontWeight: 500, display: 'block', marginBottom: 8 }}>ติดตามสถานะคำขอ</span>
                                <span className="text-gradient">สำนักงานที่ดินจังหวัดนครพนม</span>
                            </h1>
                            <p className="tracking-subtitle animate-fade-in-up delay-100">
                                กรอกเลขที่รับเรื่องและวันที่เพื่อดูความคืบหน้าแบบ Real-time
                            </p>
                        </>
                    )}

                    {/* Search Card */}
                    <div className="glass search-card" style={isWidget ? { marginTop: 0 } : {}}>
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

                            {/* Date Field Removed as per request */}

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

                    {/* Quick Services Links - Show only when not searching or result is empty */}
                    {!result && !isWidget && (
                        <div className="animate-fade-in-up delay-200">
                            <QuickLinks />
                        </div>
                    )}

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

                                {/* แสดง badge เสร็จสิ้น ถ้างานเสร็จแล้ว */}
                                {result.status === 'completed' && (
                                    <div
                                        className="timeline-step animate-slide-in"
                                        style={{ '--delay': `${result.timeline.length * 0.15}s` }}
                                    >
                                        <div className="step-icon completed" style={{
                                            backgroundColor: '#10b981',
                                            borderColor: '#10b981',
                                            boxShadow: '0 0 0 4px rgba(16, 185, 129, 0.2)'
                                        }}>
                                            <Check className="w-5 h-5" style={{ color: 'white' }} />
                                        </div>
                                        <div className="step-content hover-lift" style={{
                                            borderLeft: '4px solid #10b981',
                                            background: '#ffffff'
                                        }}>
                                            <div className="step-title" style={{
                                                color: '#059669',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <span>🎉</span> ดำเนินการเสร็จสิ้น
                                            </div>
                                            <div className="step-date">
                                                งานนี้ได้รับการดำเนินการเรียบร้อยแล้ว
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Note Section */}
                            {result.note && (
                                <div className="note-card animate-fade-in-up delay-200" style={{ marginTop: 20, padding: 16, background: '#fff3e0', borderRadius: 12, borderLeft: '4px solid #ff9800' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ color: '#f57c00' }}><FileText size={20} /></div>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#e65100', marginBottom: 4 }}>หมายเหตุ / แจ้งเตือน:</div>
                                            <div style={{ color: '#5d4037', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{sanitizeText(result.note)}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

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
        const loadPhone = async () => {
            try {
                // Fetch settings via auth utility (cached)
                const settings = await fetchAppSetting('dept_settings', {});

                if (settings) {
                    const deptData = settings[department];
                    if (deptData && deptData.officers) {
                        // Find officer by name
                        const officer = deptData.officers.find(o => o.name === officerName);
                        if (officer && officer.phone) {
                            setPhone(officer.phone);
                        } else {
                            // Fallback to first officer phone or default
                            setPhone(deptData.officers[0]?.phone || '042-511-200');
                        }
                    }
                }
            } catch (e) {
                console.error('Error loading contact info', e);
            }
        };

        loadPhone();
    }, [officerName, department]);

    if (showPhone) {
        return (
            <a
                href={phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : '#'}
                style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: '#10b981', color: 'white',
                    padding: '12px 20px', borderRadius: 12,
                    fontWeight: 600, textDecoration: 'none',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.2s'
                }}
            >
                <Phone size={20} />
                <span>{phone || 'ไม่พบเบอร์โทร'}</span>
            </a>
        );
    }

    return (
        <button
            onClick={() => setShowPhone(true)}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--accent-color)', color: 'white',
                padding: '12px 24px', borderRadius: 12,
                fontWeight: 500, transition: 'all 0.2s',
                border: 'none', cursor: 'pointer'
            }}
        >
            <Phone size={18} />
            ติดต่อเจ้าหน้าที่
        </button>
    );
}
