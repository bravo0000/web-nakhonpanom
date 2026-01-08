import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, FileText, Settings, LogOut, Plus, Search, Edit, Edit2, Trash2, Users, Clock, Check, Printer, X, ScanBarcode, BarChart2, Archive } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, fetchAppSetting, saveAppSetting } from '../utils/auth';
import AddJobModal from '../components/AddJobModal';
import UpdateStatusModal from '../components/UpdateStatusModal';
import WorkflowEditor from '../components/WorkflowEditor';
import { AppointmentSlip } from '../components/AppointmentSlip';
import UserManagement from '../components/UserManagement';
import Reports from '../components/Reports';
import SmartDataManager from '../components/SmartDataManager';
import pb from '../lib/pocketbase';
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

    const [currentUser, setCurrentUser] = useState(getCurrentUser());

    useEffect(() => {
        if (!currentUser) {
            navigate('/admin');
        }
    }, [currentUser, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };
    const [activeTab, setActiveTab] = useState('overview');
    const [scanInput, setScanInput] = useState('');

    const handleScanSubmit = (e) => {
        e.preventDefault();
        const input = scanInput.trim();
        if (!input) return;

        // Extract Reception No if it's a URL
        let query = input;
        try {
            const url = new URL(input);
            const recParam = url.searchParams.get('receptionNo');
            if (recParam) query = recParam;
        } catch (err) {
            // Not a URL, use as is
        }

        // Find Job: Case-insensitive check
        const job = jobs.find(j => j.receptionNo.toLowerCase() === query.toLowerCase());

        if (job) {
            setScanInput(''); // Clear input
            openStatusUpdate(job); // Open Status Update Modal
        } else {
            alert(`ไม่พบรายการงานเลขที่: ${query}`);
            setScanInput('');
        }
    };

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('ทั้งหมด');
    const [filterStatus, setFilterStatus] = useState('active');
    const [filterAssignee, setFilterAssignee] = useState('ทั้งหมด');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterOverviewDept, setFilterOverviewDept] = useState('ทั้งหมด');

    // Print State
    const [jobToPrint, setJobToPrint] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);
    const componentRef = React.useRef();

    // Scan Ref
    const scanInputRef = React.useRef(null);

    // Auto-focus logic for Scan Input
    useEffect(() => {
        // If on Scan tab and no modals are open, focus the input
        // (Assuming isJobModalOpen is clear too, though irrelevant for scan tab usually)
        if (activeTab === 'scan' && !showPrintModal) {
            // We need access to OTHER modal states. 
            // Since they are defined further down, we might need to move this effect or check specific variables if available in scope.
            // Wait, 'isStatusModalOpen' is defined below?
            // Checking file structure... state defs are usually at top.
            // Let's check where 'isStatusModalOpen' is defined.
            // It seems I need to check line numbers.
            // Let's first just define the ref here.

            // Actually, useEffect should be placed AFTER all state definitions to capture them.
            // I'll place the ref here, and the useEffect LATER.
        }
    }, [activeTab, showPrintModal]); // Placeholder, will implement full logic below state defs.

    const handlePrint = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // บันทึก printed_at ก่อนพิมพ์ (ถ้า field มีอยู่ใน database)
        if (jobToPrint && jobToPrint.id) {
            try {
                await pb.collection('jobs').update(jobToPrint.id, {
                    printed_at: new Date().toISOString()
                });
                // อัพเดท local state
                setJobs(prev => prev.map(j =>
                    j.id === jobToPrint.id
                        ? { ...j, printedAt: new Date().toISOString() }
                        : j
                ));
            } catch (err) {
                // ถ้า field ยังไม่มีใน database ให้ข้ามไป ไม่ block การพิมพ์
                // Field 'printed_at' ต้องเพิ่มใน PocketBase Admin Panel
            }
        }

        setTimeout(() => {
            window.print();
        }, 100);
    };


    // Data State
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initialize Job Types
    const [jobTypes, setJobTypes] = useState(INITIAL_JOB_TYPES);

    // Initialize Workflows
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);

    // Initialize Dept Settings
    const [deptSettings, setDeptSettings] = useState(INITIAL_DEPT_SETTINGS);

    // Load Settings on Mount
    useEffect(() => {
        const loadSettings = async () => {
            // 1. Job Types
            const fetchedJobTypes = await fetchAppSetting('job_types', INITIAL_JOB_TYPES);
            setJobTypes(fetchedJobTypes);

            // 2. Workflows
            const fetchedWorkflows = await fetchAppSetting('workflows', INITIAL_WORKFLOWS);
            setWorkflows(fetchedWorkflows);

            // 3. Dept Settings (Officers, Warnings)
            const fetchedDeptSettings = await fetchAppSetting('dept_settings', INITIAL_DEPT_SETTINGS);
            setDeptSettings(fetchedDeptSettings);

            // 4. Departments List (Dynamic!)
            // We need to import getDepartments or define default.
            // Importing getDepartments from auth.js which returns the default array.
            const defaultDepts = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];
            const fetchedDepts = await fetchAppSetting('departments', defaultDepts);
            // We need a state for departments in AdminDashboard to pass it down
            setDepartments(fetchedDepts);
        };
        loadSettings();
    }, []);

    // New State for Departments
    const [departments, setDepartments] = useState(['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ']);

    // Wrappers to save to DB when updated
    const handleUpdateJobTypes = (newValOrFunc) => {
        setJobTypes(prev => {
            const newVal = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            saveAppSetting('job_types', newVal); // Fire and forget
            return newVal;
        });
    };

    const handleUpdateWorkflows = (newValOrFunc) => {
        setWorkflows(prev => {
            const newVal = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            saveAppSetting('workflows', newVal);
            return newVal;
        });
    };

    const handleUpdateDeptSettings = (newValOrFunc) => {
        setDeptSettings(prev => {
            const newVal = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            saveAppSetting('dept_settings', newVal);
            return newVal;
        });
    };



    // Helper to map DB record to UI model
    const mapRecordToJob = (record) => {
        return {
            id: record.id,
            receptionNo: record.reception_no,
            date: record.date,
            department: record.department,
            type: record.job_type,
            owner: record.owner,
            status: record.status,
            step: record.step || '-',
            note: record.note || '',
            completedAt: record.completed_at || null, // Smart Data: track completion date
            printedAt: record.printed_at || null, // Track print status
            assignees: Array.isArray(record.assignees) ? record.assignees : [],
            assigneesIds: []
        };
    };

    // Fetch Jobs from PocketBase with Pagination (Security: Limit data load)
    useEffect(() => {
        const MAX_RECORDS = 500; // Limit to prevent memory issues
        let isMounted = true;

        const fetchJobs = async () => {
            try {
                // Use getList with pagination instead of getFullList
                const records = await pb.collection('jobs').getList(1, MAX_RECORDS, {
                    sort: '-created'
                });

                if (isMounted) {
                    setJobs(records.items.map(mapRecordToJob));
                    setLoading(false);

                    // Warn if there are more records
                    if (records.totalItems > MAX_RECORDS && import.meta.env.DEV) {
                        console.warn(`Warning: ${records.totalItems} total jobs, only loaded ${MAX_RECORDS}`);
                    }
                }
            } catch (err) {
                if (import.meta.env.DEV) {
                    console.error("Error fetching jobs:", err);
                }
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchJobs();

        // Real-time Subscription with Debounce (Security: Prevent request storm)
        let pendingUpdates = [];
        let debounceTimer = null;
        const DEBOUNCE_MS = 300;

        const processBatchUpdates = async (updates) => {
            // Group by action
            const creates = updates.filter(u => u.action === 'create');
            const updateActions = updates.filter(u => u.action === 'update');
            const deletes = updates.filter(u => u.action === 'delete');

            // Process deletes first (just filter)
            if (deletes.length > 0) {
                const deleteIds = deletes.map(d => d.record.id);
                setJobs(prev => prev.filter(job => !deleteIds.includes(job.id)));
            }

            // Process creates and updates (fetch fresh data)
            const idsToFetch = [
                ...creates.map(c => c.record.id),
                ...updateActions.map(u => u.record.id)
            ];

            if (idsToFetch.length > 0) {
                try {
                    // Limit batch size to prevent overload
                    const limitedIds = idsToFetch.slice(0, 20);
                    const fetchPromises = limitedIds.map(id =>
                        pb.collection('jobs').getOne(id).catch(() => null)
                    );
                    const fetchedRecords = await Promise.all(fetchPromises);
                    const validRecords = fetchedRecords.filter(r => r !== null);

                    setJobs(prev => {
                        let newJobs = [...prev];

                        validRecords.forEach(record => {
                            const mappedJob = mapRecordToJob(record);
                            const existingIndex = newJobs.findIndex(j => j.id === record.id);

                            if (existingIndex >= 0) {
                                // Update existing
                                newJobs[existingIndex] = mappedJob;
                            } else {
                                // Add new (at start)
                                newJobs = [mappedJob, ...newJobs];
                            }
                        });

                        return newJobs;
                    });
                } catch (err) {
                    if (import.meta.env.DEV) {
                        console.error("Error processing batch updates:", err);
                    }
                }
            }
        };

        pb.collection('jobs').subscribe('*', (e) => {
            pendingUpdates.push(e);

            // Clear existing timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }

            // Set new debounce timer
            debounceTimer = setTimeout(() => {
                if (pendingUpdates.length > 0 && isMounted) {
                    processBatchUpdates([...pendingUpdates]);
                    pendingUpdates = [];
                }
            }, DEBOUNCE_MS);
        });

        return () => {
            isMounted = false;
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            pb.collection('jobs').unsubscribe();
        };
    }, []);

    // Stats Calculation
    const statsData = useMemo(() => {
        const targetJobs = filterOverviewDept === 'ทั้งหมด'
            ? jobs
            : jobs.filter(j => j.department === filterOverviewDept);

        const total = targetJobs.length;
        const active = targetJobs.filter(j => j.status === 'active').length;
        const pending = targetJobs.filter(j => j.status === 'pending').length;
        const completed = targetJobs.filter(j => j.status === 'completed').length;

        // Pie Data
        const pieData = [
            { name: 'กำลังดำเนินการ', value: active, color: '#FF9800' },
            { name: 'รอดำเนินการ', value: pending, color: '#F44336' },
            { name: 'เสร็จสิ้น', value: completed, color: '#4CAF50' }
        ].filter(d => d.value > 0);

        // Bar Data (Department Workload)
        const barData = PROVINCES.slice(1).map(dept => {
            // Note: Filter against all jobs or targetJobs? 
            // If filterOverviewDept is selected, bar chart might show only that dept or all.
            // Usually dashboard overview charts show breakdown. If I filter by dept, 
            // showing other depts with 0 might be weird, or maybe valid.
            // Let's stick to 'targetJobs' usage for consistency with the filter.
            // If 'All' is selected, targetJobs is all jobs.
            // If specific dept selected, targetJobs is only that dept's jobs.
            // So bar chart will show only one bar with data if filtered.
            const deptJobs = targetJobs.filter(j => j.department === dept);
            return {
                name: dept,
                completed: deptJobs.filter(j => j.status === 'completed').length,
                ongoing: deptJobs.filter(j => j.status !== 'completed').length
            };
        });

        // Assignee Data
        const assigneeStats = {};
        targetJobs.forEach(job => {
            if (job.assignees && Array.isArray(job.assignees)) {
                job.assignees.forEach(assigneeName => {
                    if (!assigneeStats[assigneeName]) {
                        assigneeStats[assigneeName] = { name: assigneeName, completed: 0, ongoing: 0 };
                    }
                    if (job.status === 'completed') {
                        assigneeStats[assigneeName].completed++;
                    } else {
                        assigneeStats[assigneeName].ongoing++;
                    }
                });
            }
        });
        const assigneeData = Object.values(assigneeStats)
            .sort((a, b) => (b.completed + b.ongoing) - (a.completed + a.ongoing))
            .slice(0, 10);

        return { total, active, pending, completed, pieData, barData, assigneeData };
    }, [jobs, filterOverviewDept]);

    // Modals state
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusUpdateJob, setStatusUpdateJob] = useState(null);

    // Bulk selection state
    const [selectedJobIds, setSelectedJobIds] = useState([]);

    // EFFECT: Auto-focus Scan Input when active and no modals are open
    useEffect(() => {
        if (activeTab === 'scan' && !isStatusModalOpen && !isJobModalOpen && !showPrintModal) {
            // Tiny timeout to ensure DOM is ready or modal is fully gone
            // Using requestAnimationFrame or small timeout
            const timer = setTimeout(() => {
                if (scanInputRef.current) {
                    scanInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, isStatusModalOpen, isJobModalOpen, showPrintModal]);

    // Collect all unique officers for filter
    const allOfficers = useMemo(() => {
        const officers = new Set();

        // Determine allowed departments
        let allowedDepts = [];
        if (currentUser?.role === 'admin') {
            allowedDepts = Object.keys(deptSettings);
        } else if (currentUser?.departments) {
            allowedDepts = currentUser.departments;
        }

        Object.entries(deptSettings).forEach(([deptName, deptData]) => {
            // Only include officers from allowed departments
            if (allowedDepts.includes(deptName) && deptData.officers) {
                deptData.officers.forEach(o => officers.add(o.name));
            }
        });
        return Array.from(officers).sort();
    }, [deptSettings, currentUser]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterDept('ทั้งหมด');
        setFilterStatus('ทั้งหมด');
        setFilterAssignee('ทั้งหมด');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    // Filter Logic with Input Validation
    const filteredJobs = useMemo(() => {
        // Security: Limit search term length to prevent memory issues
        const MAX_SEARCH_LENGTH = 100;
        const safeSearchTerm = searchTerm.slice(0, MAX_SEARCH_LENGTH).toLowerCase();

        return jobs.filter(job => {
            // Permission Filter: Check if user is allowed to see this department
            if (currentUser?.role !== 'admin') {
                const allowedDepts = currentUser?.departments || [];
                if (!allowedDepts.includes(job.department)) {
                    return false; // Hide if not in allowed departments
                }
            }

            const matchesSearch =
                (job.receptionNo || '').toLowerCase().includes(safeSearchTerm) ||
                (job.owner || '').toLowerCase().includes(safeSearchTerm);

            const matchesDept = filterDept === 'ทั้งหมด' || job.department === filterDept;
            const matchesStatus = filterStatus === 'ทั้งหมด' || job.status === filterStatus;

            // Assignee Filter
            const matchesAssignee = filterAssignee === 'ทั้งหมด' ||
                (job.assignees && job.assignees.includes(filterAssignee));

            // Date Range Filter
            let matchesDate = true;
            if (filterStartDate || filterEndDate) {
                if (!job.date) {
                    matchesDate = false;
                } else {
                    const jobDate = new Date(job.date);
                    // Reset time for accurate comparison
                    jobDate.setHours(0, 0, 0, 0);

                    if (filterStartDate) {
                        const start = new Date(filterStartDate);
                        start.setHours(0, 0, 0, 0);
                        if (jobDate < start) matchesDate = false;
                    }
                    if (filterEndDate) {
                        const end = new Date(filterEndDate);
                        end.setHours(0, 0, 0, 0);
                        if (jobDate > end) matchesDate = false;
                    }
                }
            }

            return matchesSearch && matchesDept && matchesStatus && matchesAssignee && matchesDate;
        });
    }, [jobs, searchTerm, filterDept, filterStatus, filterAssignee, filterStartDate, filterEndDate, currentUser]);

    // If not logged in, show debug or redirecting message
    if (!currentUser) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2>กำลังตรวจสอบสิทธิ์...</h2>
                <p>หากหน้านี้ค้างอยู่นาน กรุณากดปุ่มด้านล่างเพื่อเข้าสู่ระบบใหม่</p>
                <button
                    onClick={() => navigate('/admin')}
                    style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: 20 }}
                >
                    เข้าสู่ระบบใหม่
                </button>
            </div>
        );
    }

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

    const handleBulkDelete = async () => {
        // Security: Limit bulk delete to prevent server overload
        const MAX_BULK_DELETE = 50;
        const BATCH_SIZE = 10;

        if (selectedJobIds.length > MAX_BULK_DELETE) {
            alert(`สามารถลบได้สูงสุด ${MAX_BULK_DELETE} รายการต่อครั้ง กรุณาเลือกใหม่`);
            return;
        }

        if (window.confirm(`คุณต้องการลบงานที่เลือกจำนวน ${selectedJobIds.length} รายการใช่หรือไม่?`)) {
            try {
                // Process in batches to prevent overload
                for (let i = 0; i < selectedJobIds.length; i += BATCH_SIZE) {
                    const batch = selectedJobIds.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(id => pb.collection('jobs').delete(id)));
                }
                setSelectedJobIds([]);
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการลบ: ' + (err.message || 'Unknown error'));
            }
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
        // We need to pass IDs to the modal for checkboxes to work
        const jobWithIds = {
            ...job,
            assignees: job.assigneesIds || [] // Use stored IDs
        };
        setEditingJob(jobWithIds);
        setIsJobModalOpen(true);
    };

    // Handle Add or Edit Submit
    const handleJobSubmit = async (formData) => {
        try {
            // Note: assignees in formData usually comes as an array of names or IDs depending on AddJobModal implementation.
            // Since we haven't updated AddJobModal fully to return IDs, we might need adjustments there.
            // Assumption: AddJobModal will return 'assignees' array. We need to handle mapping if they are objects.

            // Map keys to API schema (snake_case)
            const apiData = {
                reception_no: formData.receptionNo,
                date: formData.date,
                department: formData.department,
                job_type: formData.type || formData.job_type,
                owner: formData.owner,
                status: formData.status || 'active',
                step: formData.step,
                assignees: formData.assignees || [] // Send IDs directly
            };

            let newJobEntry;

            if (editingJob) {
                // Update
                newJobEntry = await pb.collection('jobs').update(editingJob.id, apiData);
            } else {
                // Create
                const deptWorkflow = workflows[formData.department] || [];
                const initialStep = deptWorkflow.length > 0 ? deptWorkflow[0].name : 'รับเรื่อง';

                apiData.status = 'active';
                apiData.step = initialStep;

                newJobEntry = await pb.collection('jobs').create(apiData);
            }

            // We need the expanded version for our UI state (though subscription handles it too, nice to have immeditae feedback)
            const expandedRec = await pb.collection('jobs').getOne(newJobEntry.id);
            const processedJob = mapRecordToJob(expandedRec);

            setIsJobModalOpen(false);
            setEditingJob(null);

            // Open Print Modal for Success
            setJobToPrint(processedJob);
            setShowPrintModal(true);

        } catch (err) {
            console.error("Error saving job:", err);
            // Show detailed error from PocketBase if available
            const details = err.data ? JSON.stringify(err.data, null, 2) : err.message;
            alert("Error saving: " + details);
        }
    };

    const handleAddJob = (data) => handleJobSubmit(data);
    const handleEditJob = (data) => handleJobSubmit(data);

    const openStatusUpdate = (job) => {
        setStatusUpdateJob(job);
        setIsStatusModalOpen(true);
    };

    // Updated handleUpdateStatus to support bulk
    const handleUpdateStatus = async (updatedJobOrJobs) => {
        try {
            if (Array.isArray(updatedJobOrJobs)) {
                // Bulk update
                // 'updatedJobOrJobs' here comes from UpdateStatusModal which likely returns the modified local objects.
                // We need to extract what changed (status/step) and call API.
                // Assuming UpdateStatusModal returns fully updated objects.

                // Caveat: UpdateStatusModal logic needs check.
                // If it passes full objects, we iterate and update.
                const updatePromises = updatedJobOrJobs.map(job => {
                    const updateData = {
                        status: job.status,
                        step: job.step,
                        note: job.note
                    };
                    // Smart Data: Set completed_at when status becomes 'completed'
                    if (job.status === 'completed') {
                        updateData.completed_at = new Date().toISOString();
                    }
                    return pb.collection('jobs').update(job.id, updateData);
                });
                await Promise.all(updatePromises);
                setSelectedJobIds([]);
            } else {
                // Single update
                const updateData = {
                    status: updatedJobOrJobs.status,
                    step: updatedJobOrJobs.step,
                    note: updatedJobOrJobs.note
                };
                // Smart Data: Set completed_at when status becomes 'completed'
                if (updatedJobOrJobs.status === 'completed') {
                    updateData.completed_at = new Date().toISOString();
                }
                await pb.collection('jobs').update(updatedJobOrJobs.id, updateData);
            }
        } catch (err) {
            console.error("Error updating status:", err);
            console.error("Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err)));

            // PocketBase errors can be in different formats
            let errorMessage = 'Unknown error';

            if (err.response?.data) {
                // PocketBase ClientResponseError
                errorMessage = JSON.stringify(err.response.data, null, 2);
            } else if (err.data) {
                errorMessage = JSON.stringify(err.data, null, 2);
            } else if (err.message) {
                errorMessage = err.message;
            } else if (err.originalError) {
                errorMessage = err.originalError.message || JSON.stringify(err.originalError);
            } else if (typeof err === 'object') {
                errorMessage = JSON.stringify(err, null, 2);
            }

            alert("Error updating status: " + errorMessage);
        }
    };

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div className="logo-box-img">
                        <img src="/dol_logo.png" alt="DOL Logo" />
                    </div>
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
                        className={`nav-item ${activeTab === 'scan' ? 'active' : ''}`}
                        onClick={() => setActiveTab('scan')}
                    >
                        <ScanBarcode size={20} />
                        <span>สแกนบาร์โค้ด</span>
                    </div>

                    <div
                        className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reports')}
                    >
                        <BarChart2 size={20} />
                        <span>รายงาน</span>
                    </div>

                    {currentUser?.role === 'admin' && (
                        <div
                            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <Users size={20} />
                            <span>ผู้ใช้งาน</span>
                        </div>
                    )}

                    {currentUser?.role === 'admin' && (
                        <div
                            className={`nav-item ${activeTab === 'smartdata' ? 'active' : ''}`}
                            onClick={() => setActiveTab('smartdata')}
                        >
                            <Archive size={20} />
                            <span>Smart Data</span>
                        </div>
                    )}

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
                                {currentUser?.departments?.map(dept => (
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
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
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

                                <select
                                    className="filter-select"
                                    value={filterDept}
                                    onChange={(e) => setFilterDept(e.target.value)}
                                    style={{ flex: '0 1 auto' }}
                                >
                                    {PROVINCES.filter(dept => {
                                        if (dept === 'ทั้งหมด') return true; // Always show "All" option if present (Wait, PROVINCES usually doesn't have 'ทั้งหมด')
                                        // Actually PROVINCES is just the list of depts. 
                                        // We should add an "All" option manually or check if PROVINCES has it.
                                        // Checking previous code, PROVINCES is imported. Let's assume it's just names.

                                        if (currentUser?.role === 'admin') return true;
                                        return currentUser?.departments?.includes(dept);
                                    }).map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>

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

                                <button
                                    onClick={handleClearFilters}
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
                                        <th>ขั้นตอน</th>
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
                                                            backgroundColor: job.status === 'active' ? '#dbeafe' : job.status === 'pending' ? '#ffedd5' : '#dcfce7',
                                                            color: job.status === 'active' ? '#1e40af' : job.status === 'pending' ? '#9a3412' : '#166534',
                                                            border: `1px solid ${job.status === 'active' ? '#bfdbfe' : job.status === 'pending' ? '#fed7aa' : '#bbf7d0'}`
                                                        }}
                                                    >
                                                        {job.status === 'active' ? 'กำลังดำเนินการ' :
                                                            job.status === 'pending' ? 'รอดำเนินการ' : 'เสร็จสิ้น'}
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
                                                            onClick={(e) => {
                                                                setJobToPrint(job);
                                                                handlePrint(e);
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

                {activeTab === 'users' && currentUser?.role === 'admin' && (
                    <UserManagement />
                )}

                {activeTab === 'settings' && (
                    <WorkflowEditor
                        deptSettings={deptSettings}
                        onUpdateSettings={handleUpdateDeptSettings}
                        workflows={workflows}
                        onUpdateWorkflows={handleUpdateWorkflows}
                        // New Props for Job Types
                        jobTypes={jobTypes}
                        onUpdateJobTypes={handleUpdateJobTypes}
                        currentUser={currentUser}
                        departments={departments}

                    />
                )}

                {activeTab === 'reports' && (
                    <Reports
                        jobs={jobs}
                        deptSettings={deptSettings}
                        currentUser={currentUser}
                    />
                )}

                {activeTab === 'scan' && (
                    <div className="animate-fade-in-up" style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
                        <div style={{ marginBottom: 32 }}>
                            <div style={{
                                width: 80, height: 80, background: 'var(--primary-color)',
                                borderRadius: '50%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', color: 'white', margin: '0 auto 16px'
                            }}>
                                <ScanBarcode size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>สแกน QR Code / Barcode</h2>
                            <p style={{ color: '#666' }}>ยิงบาร์โค้ดที่ใบนัดเพื่อ **อัปเดตสถานะงาน**</p>
                        </div>

                        <form onSubmit={handleScanSubmit}>
                            <input
                                ref={scanInputRef}
                                autoFocus
                                type="text"
                                className="form-input"
                                value={scanInput}
                                onChange={(e) => setScanInput(e.target.value)}
                                placeholder="รอรับข้อมูลจากเครื่องสแกน..."
                                style={{
                                    height: 60,
                                    fontSize: '1.5rem',
                                    textAlign: 'center',
                                    marginBottom: 24,
                                    border: '2px solid var(--primary-color)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                            <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                (คลิกที่ช่องว่างแล้วยิงบาร์โค้ด หรือพิมพ์เลขที่คำขอแล้วกด Enter)
                            </div>
                        </form>
                    </div>
                )}

                {/* Smart Data Tab */}
                {activeTab === 'smartdata' && (
                    <SmartDataManager
                        jobs={jobs}
                        onJobsDeleted={(deletedIds) => {
                            setJobs(prev => prev.filter(j => !deletedIds.includes(j.id)));
                        }}
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
                currentUser={currentUser}
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
