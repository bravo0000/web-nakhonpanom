import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, Plus, Search, Edit, Edit2, Trash2, Users, Clock, Check, Printer } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../utils/auth';
import AddJobModal from '../components/AddJobModal';
import UpdateStatusModal from '../components/UpdateStatusModal';
import WorkflowEditor from '../components/WorkflowEditor';
import { AppointmentSlip } from '../components/AppointmentSlip';
import UserManagement from '../components/UserManagement';
import './AdminDashboard.css';

// Mock Data
const INITIAL_JOBS = [
    { id: 1, receptionNo: '123/2567', date: '2024-01-01', department: 'ฝ่ายรังวัด', type: 'รังวัดสอบเขต', owner: 'นายสมชาย ใจดี', status: 'active', step: 'ดำเนินการรังวัด', assignees: ['นายสมศักดิ์ ช่างรังวัด'] },
    { id: 2, receptionNo: '555/2567', date: '2024-01-02', department: 'ฝ่ายทะเบียน', type: 'จดทะเบียนขายฝาก', owner: 'นางสาวมีนา รักดี', status: 'pending', step: 'ตรวจสอบหลักทรัพย์', assignees: ['นางสาวณีรนุช ธุรการ'] },
    { id: 3, receptionNo: '999/2567', date: '2024-01-03', department: 'กลุ่มงานวิชาการที่ดิน', type: 'หารือระเบียบ', owner: 'นายใจ กล้าหาญ', status: 'completed', step: 'แจ้งผลการพิจารณา', assignees: ['นางสมพร หัวหน้างาน'] },
];

const PROVINCES = ['ทั้งหมด', 'ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];

// Job types per department (Lifted from AddJobModal)
const INITIAL_JOB_TYPES = {
    'ฝ่ายรังวัด': [
        'รังวัดสอบเขต',
        'รังวัดแบ่งแยก',
        'รังวัดรวมโฉนด',
        'รังวัดออกโฉนด',
        'รังวัดตรวจสอบเนื้อที่',
        'รังวัดทำแผนที่ลงระวาง'
    ],
    'ฝ่ายทะเบียน': [
        'จดทะเบียนขายฝาก',
        'จดทะเบียนจำนอง',
        'จดทะเบียนโอนมรดก',
        'จดทะเบียนให้',
        'จดทะเบียนลงชื่อคู่สมรส'
    ],
    'กลุ่มงานวิชาการที่ดิน': [
        'หารือระเบียบ',
        'ตรวจสอบข้อเท็จจริง',
        'ร้องเรียนการปฏิบัติหน้าที่',
        'ขอทราบราคาประเมิน'
    ],
    'ฝ่ายอำนวยการ': [
        'งานสารบรรณ',
        'งานการเจ้าหน้าที่',
        'งานพัสดุ',
        'งานการเงินและบัญชี'
    ]
};

// Initial Workflows (Lifted from WorkflowEditor)
const INITIAL_WORKFLOWS = {
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

const INITIAL_DEPT_SETTINGS = {
    'ฝ่ายทะเบียน': {
        warning: 3,
        critical: 7,
        officers: [
            { id: 1, name: 'นายทะเบียน ใจดี', phone: '042-511-123' },
            { id: 2, name: 'นางสาวคล่องแคล่ว ว่องไว', phone: '081-234-5678' }
        ]
    },
    'ฝ่ายรังวัด': {
        warning: 30,
        critical: 60,
        officers: [
            { id: 1, name: 'นายช่าง แม่นยำ', phone: '089-999-9999' }
        ]
    },
    'กลุ่มงานวิชาการที่ดิน': {
        warning: 15,
        critical: 30,
        officers: []
    },
    'ฝ่ายอำนวยการ': {
        warning: 5,
        critical: 10,
        officers: [
            { id: 1, name: 'นางอำนวย สะดวก', phone: '042-511-200' }
        ]
    }
};

export default function AdminDashboard() {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('ทั้งหมด');
    const [filterStatus, setFilterStatus] = useState('ทั้งหมด');
    const [filterOverviewDept, setFilterOverviewDept] = useState('ทั้งหมด');

    // Print State
    const [jobToPrint, setJobToPrint] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const componentRef = React.useRef();

    const handlePrint = () => {
        window.print();
    };


    // Initialize Jobs
    const [jobs, setJobs] = useState(() => {
        try {
            const saved = localStorage.getItem('land_jobs');
            return saved ? JSON.parse(saved) : INITIAL_JOBS;
        } catch (e) {
            console.error('Failed to parse jobs from localStorage', e);
            return INITIAL_JOBS;
        }
    });

    // Initialize Job Types
    const [jobTypes, setJobTypes] = useState(() => {
        try {
            const saved = localStorage.getItem('land_job_types');
            return saved ? JSON.parse(saved) : INITIAL_JOB_TYPES;
        } catch (e) {
            console.error('Failed to parse job types', e);
            return INITIAL_JOB_TYPES;
        }
    });

    // Initialize Workflows
    const [workflows, setWorkflows] = useState(() => {
        try {
            const saved = localStorage.getItem('land_workflows');
            return saved ? JSON.parse(saved) : INITIAL_WORKFLOWS;
        } catch (e) {
            console.error('Failed to parse workflows', e);
            return INITIAL_WORKFLOWS;
        }
    });

    // Initialize Dept Settings
    const [deptSettings, setDeptSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('deptSettings');
            if (!saved) return INITIAL_DEPT_SETTINGS;
            const parsed = JSON.parse(saved);
            return parsed || INITIAL_DEPT_SETTINGS;
        } catch (e) {
            console.error('Failed to parse deptSettings', e);
            return INITIAL_DEPT_SETTINGS;
        }
    });

    // Access Control & Data Preparation
    const accessibleJobs = useMemo(() => {
        if (!currentUser) return [];
        // Admin sees all, Staff sees only their department(s)
        if (currentUser.role === 'admin') return jobs;
        return jobs.filter(j => currentUser.departments.includes(j.department));
    }, [jobs, currentUser]);

    // Stats Calculation (Based on accessibleJobs + Overview Filter)
    const statsData = useMemo(() => {
        // Filter by Overview Dept Filter First
        const filtered = accessibleJobs.filter(j =>
            filterOverviewDept === 'ทั้งหมด' || j.department === filterOverviewDept
        );

        const total = filtered.length;
        const active = filtered.filter(j => j.status === 'active').length;
        const pending = filtered.filter(j => j.status === 'pending').length;
        const completed = filtered.filter(j => j.status === 'completed').length;

        // Pie Chart Data
        const pieData = [
            { name: 'รอดำเนินการ', value: pending, color: '#ef6c00' },
            { name: 'กำลังดำเนินการ', value: active, color: '#2e7d32' },
            { name: 'เสร็จสิ้น', value: completed, color: '#1565c0' },
        ].filter(d => d.value > 0);

        // Bar Chart Data (Dept Workload - Split by Status)
        const deptCounts = filtered.reduce((acc, job) => {
            if (!acc[job.department]) {
                acc[job.department] = { name: job.department, completed: 0, ongoing: 0 };
            }
            if (job.status === 'completed') {
                acc[job.department].completed += 1;
            } else {
                acc[job.department].ongoing += 1;
            }
            return acc;
        }, {});
        const barData = Object.values(deptCounts);

        // Assignee Workload Data (Split by Status)
        const assigneeCounts = filtered.reduce((acc, job) => {
            const assignees = (job.assignees && job.assignees.length > 0) ? job.assignees : ['ไม่ระบุ'];

            assignees.forEach(assignee => {
                if (!acc[assignee]) {
                    acc[assignee] = { name: assignee, completed: 0, ongoing: 0, total: 0 };
                }
                if (job.status === 'completed') {
                    acc[assignee].completed += 1;
                } else {
                    acc[assignee].ongoing += 1;
                }
                acc[assignee].total += 1;
            });
            return acc;
        }, {});

        const assigneeData = Object.values(assigneeCounts)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10); // Top 10

        return { total, active, pending, completed, pieData, barData, assigneeData };
    }, [accessibleJobs, filterOverviewDept]);

    // Auth Check
    useEffect(() => {
        const user = getCurrentUser();
        if (!user) {
            navigate('/admin');
        } else {
            setCurrentUser(user);
        }
    }, [navigate]);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    // Effects for saving data
    useEffect(() => { localStorage.setItem('land_jobs', JSON.stringify(jobs)); }, [jobs]);
    useEffect(() => { localStorage.setItem('land_job_types', JSON.stringify(jobTypes)); }, [jobTypes]);
    useEffect(() => { localStorage.setItem('land_workflows', JSON.stringify(workflows)); }, [workflows]);
    useEffect(() => {
        if (deptSettings) localStorage.setItem('deptSettings', JSON.stringify(deptSettings));
    }, [deptSettings]);

    // Modals state
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusUpdateJob, setStatusUpdateJob] = useState(null);

    // Bulk selection state
    const [selectedJobIds, setSelectedJobIds] = useState([]);

    // Filter Logic
    const filteredJobs = useMemo(() => {
        return jobs.filter(job => {
            const matchesSearch =
                job.receptionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.owner.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesDept = filterDept === 'ทั้งหมด' || job.department === filterDept;
            const matchesStatus = filterStatus === 'ทั้งหมด' || job.status === filterStatus;

            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [jobs, searchTerm, filterDept, filterStatus]);

    // If not logged in, render nothing while redirecting
    if (!currentUser) return null;

    // Thai Date Helper
    const formatThaiDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Duration Calculation Helper
    const calculateDuration = (dateStr, dept) => {
        const start = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now - start);
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        const settings = deptSettings[dept] || { warning: 7, critical: 30 };
        let colorClass = 'text-gray-500';

        if (days > settings.critical) colorClass = 'text-red-500 font-bold';
        else if (days > settings.warning) colorClass = 'text-orange-500 font-medium';

        return { days, colorClass };
    };

    // Bulk Actions Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedJobIds(filteredJobs.map(job => job.id));
        } else {
            setSelectedJobIds([]);
        }
    };

    const handleSelectJob = (id) => {
        if (selectedJobIds.includes(id)) {
            setSelectedJobIds(selectedJobIds.filter(selectedId => selectedId !== id));
        } else {
            setSelectedJobIds([...selectedJobIds, id]);
        }
    };

    const handleBulkDelete = () => {
        if (window.confirm(`คุณต้องการลบงานที่เลือกจำนวน ${selectedJobIds.length} รายการใช่หรือไม่?`)) {
            setJobs(jobs.filter(job => !selectedJobIds.includes(job.id)));
            setSelectedJobIds([]);
        }
    };

    const handleBulkUpdateStatus = () => {
        const selectedJobs = jobs.filter(job => selectedJobIds.includes(job.id));
        if (selectedJobs.length === 0) return;

        setStatusUpdateJob({ _bulk: true, jobs: selectedJobs });
        setIsStatusModalOpen(true);
    };

    // Open "Add New"
    const openAddJob = () => {
        setEditingJob(null);
        setIsJobModalOpen(true);
    };

    // Open "Edit Info"
    const openEditInfo = (job) => {
        setEditingJob(job);
        setIsJobModalOpen(true);
    };

    // Handle Add or Edit Submit
    const handleJobSubmit = (formData) => {
        let newJobData;
        if (editingJob) {
            // Update existing
            newJobData = { ...editingJob, ...formData };
            setJobs(jobs.map(j => j.id === editingJob.id ? newJobData : j));
        } else {
            // Create new
            const deptWorkflow = workflows[formData.department] || [];
            const initialStep = deptWorkflow.length > 0 ? deptWorkflow[0].name : 'รับเรื่อง';

            newJobData = {
                ...formData,
                id: jobs.length + 1,
                status: 'pending',
                step: initialStep
            };
            setJobs([newJobData, ...jobs]);
        }
        setIsJobModalOpen(false); // Ensure modal closes
        setEditingJob(null);

        // Open Print Modal for Success
        setJobToPrint(newJobData);
        setShowPrintModal(true);
    };

    // ... (rest of the file)

    const handleAddJob = (data) => handleJobSubmit(data);
    const handleEditJob = (data) => handleJobSubmit(data);

    const openStatusUpdate = (job) => {
        setStatusUpdateJob(job);
        setIsStatusModalOpen(true);
    };

    // Updated handleUpdateStatus to support bulk
    const handleUpdateStatus = (updatedJobOrJobs) => {
        if (Array.isArray(updatedJobOrJobs)) {
            // Bulk update
            const updatedIds = updatedJobOrJobs.map(j => j.id);
            setJobs(jobs.map(j => {
                const updated = updatedJobOrJobs.find(u => u.id === j.id);
                return updated ? updated : j;
            }));
            setSelectedJobIds([]); // Clear selection after update
        } else {
            // Single update
            setJobs(jobs.map(j => j.id === updatedJobOrJobs.id ? updatedJobOrJobs : j));
        }
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-box">L</div>
                    <span className="sidebar-title">Admin Panel</span>
                </div>

                <nav className="nav-menu">
                    <div
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <LayoutDashboard size={20} />
                        <span>ภาพรวม</span>
                    </div>

                    <div
                        className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
                        onClick={() => setActiveTab('jobs')}
                    >
                        <FileText size={20} />
                        <span>รายการงาน</span>
                    </div>

                    <div
                        className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}
                    >
                        <Users size={20} />
                        <span>ผู้ใช้งาน</span>
                    </div>

                    <div
                        className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={20} />
                        <span>ตั้งค่า</span>
                    </div>
                </nav>

                <div className="logout-section">
                    <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
                        <LogOut size={20} />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-content">
                {activeTab === 'overview' && (
                    <div className="overview-container animate-fade-in-up">
                        <header className="dashboard-header" style={{ alignItems: 'center' }}>
                            <div>
                                <h1 className="page-title">ภาพรวมระบบ</h1>
                                <div className="date-display">{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</div>
                            </div>

                            {/* Department Filter for Overview */}
                            <select
                                className="filter-select"
                                style={{ width: '200px' }}
                                value={filterOverviewDept}
                                onChange={(e) => setFilterOverviewDept(e.target.value)}
                            >
                                <option value="ทั้งหมด">ทุกฝ่าย</option>
                                {currentUser?.departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </header>

                        {/* Stats Grid */}
                        <div className="stats-grid">
                            <div className="stat-card total">
                                <div className="stat-icon-bg"><FileText size={24} /></div>
                                <div className="stat-info">
                                    <h3>งานทั้งหมด</h3>
                                    <div className="stat-value">{statsData.total}</div>
                                    <span className="stat-label">รายการ</span>
                                </div>
                            </div>
                            <div className="stat-card active">
                                <div className="stat-icon-bg"><Clock size={24} /></div>
                                <div className="stat-info">
                                    <h3>กำลังดำเนินการ</h3>
                                    <div className="stat-value">{statsData.active}</div>
                                    <span className="stat-label">รายการ</span>
                                </div>
                            </div>
                            <div className="stat-card pending">
                                <div className="stat-icon-bg"><LogOut size={24} /></div>
                                <div className="stat-info">
                                    <h3>รอดำเนินการ</h3>
                                    <div className="stat-value">{statsData.pending}</div>
                                    <span className="stat-label">รายการ</span>
                                </div>
                            </div>
                            <div className="stat-card completed">
                                <div className="stat-icon-bg"><Check size={24} /></div>
                                <div className="stat-info">
                                    <h3>เสร็จสิ้น</h3>
                                    <div className="stat-value">{statsData.completed}</div>
                                    <span className="stat-label">รายการ</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
                            {/* Status Distribution */}
                            <div className="chart-card glass" style={{ padding: '24px', borderRadius: '20px', background: 'white' }}>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>สัดส่วนสถานะงาน</h3>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={statsData.pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {statsData.pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Department Workload */}
                            <div className="chart-card glass" style={{ padding: '24px', borderRadius: '20px', background: 'white' }}>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>ปริมาณงานแยกตามฝ่าย (เสร็จ vs คงค้าง)</h3>
                                <div style={{ height: '300px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData.barData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                            <YAxis />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Legend />
                                            <Bar dataKey="completed" name="เสร็จสิ้น" fill="#1565c0" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Bar dataKey="ongoing" name="คงค้าง" fill="#ef6c00" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Assignee Workload (Full Width) */}
                            <div className="chart-card glass" style={{ gridColumn: '1 / -1', padding: '24px', borderRadius: '20px', background: 'white' }}>
                                <h3 style={{ marginBottom: '20px', fontSize: '1.1rem', fontWeight: 600, color: '#334155' }}>ปริมาณงานรายบุคคล (เสร็จ vs คงค้าง)</h3>
                                <div style={{ height: '350px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData.assigneeData} layout="vertical" margin={{ left: 50 }}>
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                            <XAxis type="number" />
                                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                                            <Tooltip cursor={{ fill: 'transparent' }} />
                                            <Legend />
                                            <Bar dataKey="completed" name="เสร็จสิ้น" stackId="a" fill="#1565c0" radius={[0, 0, 0, 0]} barSize={20} />
                                            <Bar dataKey="ongoing" name="คงค้าง" stackId="a" fill="#ef6c00" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'jobs' && (
                    <div className="animate-fade-in-up">
                        {/* ... (Header and Filters omitted - no changes needed here) ... */}
                        <header className="dashboard-header">
                            <h1 className="page-title">รายการงานทั้งหมด</h1>
                            <button onClick={openAddJob} className="primary-button">
                                <Plus size={20} />
                                เพิ่มงานใหม่
                            </button>
                        </header>

                        {/* Filters */}
                        <div className="filter-bar">
                            <div className="search-input-wrapper">
                                <Search className="search-icon" size={18} />
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="ค้นหาตามเลขที่คำขอ หรือ ชื่อผู้ยื่น..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <select
                                className="filter-select"
                                value={filterDept}
                                onChange={(e) => setFilterDept(e.target.value)}
                            >
                                {PROVINCES.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <select
                                className="filter-select"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="ทั้งหมด">สถานะทั้งหมด</option>
                                <option value="active">กำลังดำเนินการ</option>
                                <option value="pending">รอดำเนินการ</option>
                                <option value="completed">เสร็จสิ้น</option>
                            </select>
                        </div>

                        {/* Bulk Action Bar */}
                        {selectedJobIds.length > 0 && (
                            <div className="bulk-action-bar">
                                <span className="bulk-count">{selectedJobIds.length} รายการที่เลือก</span>
                                <div className="bulk-actions">
                                    <button className="bulk-button delete" onClick={handleBulkDelete}>
                                        <Trash2 size={18} />
                                        ลบที่เลือก
                                    </button>
                                    <button className="bulk-button update" onClick={handleBulkUpdateStatus}>
                                        <Edit size={18} />
                                        อัปเดตสถานะ
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="table-card">
                            <table className="table-wrapper">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className="row-checkbox"
                                                checked={filteredJobs.length > 0 && selectedJobIds.length === filteredJobs.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th>สถานะ</th>
                                        <th>เลขที่/วันที่</th>
                                        <th>รายละเอียด</th>
                                        <th>ผู้ยื่น/ผู้รับผิดชอบ</th>
                                        <th>ขั้นตอนปัจจุบัน</th>
                                        <th>จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                                                ไม่พบข้อมูลที่ตรงกับเงื่อนไข
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredJobs.map((job) => (
                                            <tr key={job.id} className={selectedJobIds.includes(job.id) ? 'row-selected' : ''}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        className="row-checkbox"
                                                        checked={selectedJobIds.includes(job.id)}
                                                        onChange={() => handleSelectJob(job.id)}
                                                    />
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    <span className={`status-badge ${job.status}`}>
                                                        {job.status === 'active' ? 'กำลังดำเนินการ' :
                                                            job.status === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น'}
                                                    </span>
                                                </td>
                                                <td style={{ verticalAlign: 'top' }}>
                                                    <div style={{ fontWeight: 500 }}>{job.receptionNo}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#888' }}>{formatThaiDate(job.date)}</div>
                                                    {(() => {
                                                        // Check if job is completed AND at the last step
                                                        const deptWorkflows = workflows[job.department];
                                                        const lastStep = deptWorkflows && deptWorkflows.length > 0
                                                            ? deptWorkflows[deptWorkflows.length - 1].name
                                                            : null;

                                                        const isFinished = job.status === 'completed' && job.step === lastStep;

                                                        if (isFinished) return null;

                                                        const { days, colorClass } = calculateDuration(job.date, job.department);
                                                        return (
                                                            <div style={{ fontSize: '0.75rem', marginTop: 2 }} className={colorClass}>
                                                                ผ่านมาแล้ว {days} วัน
                                                            </div>
                                                        );
                                                    })()}
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
                                                            onClick={() => {
                                                                setJobToPrint(job);
                                                                handlePrint(); // Or setShowPrintModal(true) if you prefer the confirmation
                                                                // Usually direct print is faster for on-demand
                                                                setTimeout(() => window.print(), 100);
                                                            }}
                                                            title="พิมพ์ใบนัด"
                                                        >
                                                            <Printer size={18} />
                                                        </button>
                                                        <button
                                                            className="action-button"
                                                            onClick={() => openEditInfo(job)}
                                                            title="แก้ไขข้อมูล"
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button
                                                            className="action-button"
                                                            onClick={() => openStatusUpdate(job)}
                                                            title="อัปเดตสถานะ"
                                                        >
                                                            <Edit size={18} style={{ color: 'var(--accent-color)' }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <UserManagement />
                )}

                {activeTab === 'settings' && (
                    <WorkflowEditor
                        deptSettings={deptSettings}
                        onUpdateSettings={setDeptSettings}
                        workflows={workflows}
                        onUpdateWorkflows={setWorkflows}
                        // New Props for Job Types
                        jobTypes={jobTypes}
                        onUpdateJobTypes={setJobTypes}
                        currentUser={currentUser}
                    />
                )}
            </main>

            {/* Add/Edit Job Modal */}
            <AddJobModal
                isOpen={isJobModalOpen}
                onClose={() => setIsJobModalOpen(false)}
                onSubmit={handleJobSubmit}
                editJob={editingJob}
                deptSettings={deptSettings}
                jobTypes={jobTypes}
                jobs={jobs}
            />

            {/* Status Update Modal */}
            <UpdateStatusModal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                onUpdate={handleUpdateStatus}
                job={statusUpdateJob}
                workflows={workflows}
            />

            {/* Print Component (Hidden on screen) */}
            <AppointmentSlip
                ref={componentRef}
                job={jobToPrint}
                deptSettings={deptSettings}
            />

            {/* Success/Print Modal */}
            {showPrintModal && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: 400, textAlign: 'center', padding: 32 }}>
                        <div style={{ margin: '0 auto 16px', width: 60, height: 60, background: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <Check size={32} />
                        </div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: 8 }}>บันทึกข้อมูลเรียบร้อย</h2>
                        <p style={{ color: '#666', marginBottom: 24 }}>
                            ข้อมูลถูกบันทึกเข้าระบบแล้ว ท่านต้องการพิมพ์ใบนัดพร้อม QR Code หรือไม่?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button
                                onClick={handlePrint}
                                className="primary-button"
                                style={{ justifyContent: 'center', height: 48, fontSize: '1rem', width: '100%' }}
                            >
                                <FileText size={20} />
                                พิมพ์ใบนัด (A4)
                            </button>
                            <button
                                onClick={() => setShowPrintModal(false)}
                                style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 8 }}
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
