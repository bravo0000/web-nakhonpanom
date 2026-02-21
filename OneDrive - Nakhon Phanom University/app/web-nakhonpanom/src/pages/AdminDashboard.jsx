import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Check, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Config & Utils
import { PROVINCES, INITIAL_JOB_TYPES, INITIAL_WORKFLOWS, INITIAL_DEPT_SETTINGS } from '../config/constants';
import { mapRecordToJob } from '../utils/helpers';
import { getCurrentUser, logout, fetchAppSetting, saveAppSetting } from '../utils/auth';
import pb from '../lib/pocketbase';

// Components
import AdminSidebar from '../components/AdminSidebar';
import DashboardStats from '../components/DashboardStats';
import DashboardCharts from '../components/DashboardCharts';
import JobFilters from '../components/JobFilters';
import JobTable from '../components/JobTable';
import ScanTab from '../components/ScanTab';
import AddJobModal from '../components/AddJobModal';
import UpdateStatusModal from '../components/UpdateStatusModal';
import WorkflowEditor from '../components/WorkflowEditor';
import { AppointmentSlip } from '../components/AppointmentSlip';
import UserManagement from '../components/UserManagement';
import Reports from '../components/Reports';
import SmartDataManager from '../components/SmartDataManager';

import './AdminDashboard.css';

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

    // Tab State
    const [activeTab, setActiveTab] = useState('overview');

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
    const scanInputRef = React.useRef(null);

    // Data State
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [jobTypes, setJobTypes] = useState(INITIAL_JOB_TYPES);
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
    const [deptSettings, setDeptSettings] = useState(INITIAL_DEPT_SETTINGS);
    const [departments, setDepartments] = useState(['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ']);
    const [visitorCount, setVisitorCount] = useState(0);

    // Modals state
    const [isJobModalOpen, setIsJobModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusUpdateJob, setStatusUpdateJob] = useState(null);

    // Bulk selection state
    const [selectedJobIds, setSelectedJobIds] = useState([]);

    // Load Settings on Mount
    useEffect(() => {
        const loadSettings = async () => {
            const fetchedJobTypes = await fetchAppSetting('job_types', INITIAL_JOB_TYPES);
            setJobTypes(fetchedJobTypes);

            const fetchedWorkflows = await fetchAppSetting('workflows', INITIAL_WORKFLOWS);
            setWorkflows(fetchedWorkflows);

            const fetchedDeptSettings = await fetchAppSetting('dept_settings', INITIAL_DEPT_SETTINGS);
            setDeptSettings(fetchedDeptSettings);

            const defaultDepts = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];
            const fetchedDepts = await fetchAppSetting('departments', defaultDepts);
            setDepartments(fetchedDepts);

            // Fetch Visitor Count
            try {
                const visits = await pb.collection('page_visits').getList(1, 1);
                setVisitorCount(visits.totalItems);
            } catch (err) {
                console.log('Error fetching visitors:', err.message);
            }
        };
        loadSettings();
    }, []);

    // Wrappers to save to DB when updated
    const handleUpdateJobTypes = (newValOrFunc) => {
        setJobTypes(prev => {
            const newVal = typeof newValOrFunc === 'function' ? newValOrFunc(prev) : newValOrFunc;
            saveAppSetting('job_types', newVal);
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

    // Fetch Jobs from PocketBase
    useEffect(() => {
        const MAX_RECORDS = 500;
        let isMounted = true;

        const fetchJobs = async () => {
            try {
                const records = await pb.collection('jobs').getList(1, MAX_RECORDS, {
                    sort: '-created'
                });

                if (isMounted) {
                    setJobs(records.items.map(mapRecordToJob));
                    setLoading(false);

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

        // Real-time Subscription with Debounce
        let pendingUpdates = [];
        let debounceTimer = null;
        const DEBOUNCE_MS = 300;

        const processBatchUpdates = async (updates) => {
            const creates = updates.filter(u => u.action === 'create');
            const updateActions = updates.filter(u => u.action === 'update');
            const deletes = updates.filter(u => u.action === 'delete');

            if (deletes.length > 0) {
                const deleteIds = deletes.map(d => d.record.id);
                setJobs(prev => prev.filter(job => !deleteIds.includes(job.id)));
            }

            const idsToFetch = [
                ...creates.map(c => c.record.id),
                ...updateActions.map(u => u.record.id)
            ];

            if (idsToFetch.length > 0) {
                try {
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
                                newJobs[existingIndex] = mappedJob;
                            } else {
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
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (pendingUpdates.length > 0 && isMounted) {
                    processBatchUpdates([...pendingUpdates]);
                    pendingUpdates = [];
                }
            }, DEBOUNCE_MS);
        });

        return () => {
            isMounted = false;
            if (debounceTimer) clearTimeout(debounceTimer);
            pb.collection('jobs').unsubscribe();
        };
    }, []);

    // Auto-focus Scan Input
    useEffect(() => {
        if (activeTab === 'scan' && !isStatusModalOpen && !isJobModalOpen && !showPrintModal) {
            const timer = setTimeout(() => {
                if (scanInputRef.current) {
                    scanInputRef.current.focus();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activeTab, isStatusModalOpen, isJobModalOpen, showPrintModal]);

    // Stats Calculation
    const statsData = useMemo(() => {
        const targetJobs = filterOverviewDept === 'ทั้งหมด'
            ? jobs
            : jobs.filter(j => j.department === filterOverviewDept);

        const total = targetJobs.length;
        const active = targetJobs.filter(j => j.status === 'active').length;
        const pending = targetJobs.filter(j => j.status === 'pending').length;
        const completed = targetJobs.filter(j => j.status === 'completed').length;

        const pieData = [
            { name: 'กำลังดำเนินการ', value: active, color: '#FF9800' },
            { name: 'รอดำเนินการ', value: pending, color: '#F44336' },
            { name: 'เสร็จสิ้น', value: completed, color: '#4CAF50' }
        ].filter(d => d.value > 0);

        const barData = PROVINCES.slice(1).map(dept => {
            const deptJobs = targetJobs.filter(j => j.department === dept);
            return {
                name: dept,
                completed: deptJobs.filter(j => j.status === 'completed').length,
                ongoing: deptJobs.filter(j => j.status !== 'completed').length
            };
        });

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

    // Collect all unique officers for filter
    const allOfficers = useMemo(() => {
        const officers = new Set();
        let allowedDepts = [];
        if (currentUser?.role === 'admin') {
            allowedDepts = Object.keys(deptSettings);
        } else if (currentUser?.departments) {
            allowedDepts = currentUser.departments;
        }

        Object.entries(deptSettings).forEach(([deptName, deptData]) => {
            if (allowedDepts.includes(deptName) && deptData.officers) {
                deptData.officers.forEach(o => officers.add(o.name));
            }
        });
        return Array.from(officers).sort();
    }, [deptSettings, currentUser]);

    // Filter Logic
    const filteredJobs = useMemo(() => {
        const MAX_SEARCH_LENGTH = 100;
        const safeSearchTerm = searchTerm.slice(0, MAX_SEARCH_LENGTH).toLowerCase();

        return jobs.filter(job => {
            if (currentUser?.role !== 'admin') {
                const allowedDepts = currentUser?.departments || [];
                if (!allowedDepts.includes(job.department)) return false;
            }

            const matchesSearch =
                (job.receptionNo || '').toLowerCase().includes(safeSearchTerm) ||
                (job.owner || '').toLowerCase().includes(safeSearchTerm);
            const matchesDept = filterDept === 'ทั้งหมด' || job.department === filterDept;
            const matchesStatus = filterStatus === 'ทั้งหมด' || job.status === filterStatus;
            const matchesAssignee = filterAssignee === 'ทั้งหมด' ||
                (job.assignees && job.assignees.includes(filterAssignee));

            let matchesDate = true;
            if (filterStartDate || filterEndDate) {
                if (!job.date) {
                    matchesDate = false;
                } else {
                    const jobDate = new Date(job.date);
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

    const handleClearFilters = () => {
        setSearchTerm('');
        setFilterDept('ทั้งหมด');
        setFilterStatus('ทั้งหมด');
        setFilterAssignee('ทั้งหมด');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    // Print Handler
    const handlePrint = async (job, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const targetJob = job || jobToPrint;
        if (targetJob && targetJob.id) {
            try {
                await pb.collection('jobs').update(targetJob.id, {
                    printed_at: new Date().toISOString()
                });
                setJobs(prev => prev.map(j =>
                    j.id === targetJob.id
                        ? { ...j, printedAt: new Date().toISOString() }
                        : j
                ));
            } catch (err) {
                // Field might not exist yet
            }
        }

        setJobToPrint(targetJob);

        // Add printing-slip class before printing
        document.body.classList.add('printing-slip');

        setTimeout(() => {
            window.print();

            // Remove the class after the print dialog closes
            setTimeout(() => {
                document.body.classList.remove('printing-slip');
            }, 500);
        }, 100);
    };

    // Bulk Actions
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
        const MAX_BULK_DELETE = 50;
        const BATCH_SIZE = 10;

        if (selectedJobIds.length > MAX_BULK_DELETE) {
            alert(`สามารถลบได้สูงสุด ${MAX_BULK_DELETE} รายการต่อครั้ง กรุณาเลือกใหม่`);
            return;
        }

        if (window.confirm(`คุณต้องการลบงานที่เลือกจำนวน ${selectedJobIds.length} รายการใช่หรือไม่?`)) {
            try {
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

    // Job Modal Handlers
    const openAddJob = () => {
        setEditingJob(null);
        setIsJobModalOpen(true);
    };

    const openEditInfo = (job) => {
        const jobWithIds = {
            ...job,
            assignees: job.assigneesIds || []
        };
        setEditingJob(jobWithIds);
        setIsJobModalOpen(true);
    };

    const handleJobSubmit = async (formData) => {
        try {
            const deptWorkflow = workflows[formData.department] || [];
            const initialStep = deptWorkflow.length > 0 ? deptWorkflow[0].name : 'รับเรื่อง';

            const apiData = {
                reception_no: formData.receptionNo,
                date: formData.date,
                department: formData.department,
                job_type: formData.type || formData.job_type || '',
                owner: formData.owner,
                status: formData.status || 'active',
                step: formData.step || initialStep,
                assignees: formData.assignees || []
            };

            // Debug: log what we're sending
            if (import.meta.env.DEV) {
                console.log('Submitting job data:', apiData);
            }

            let newJobEntry;

            if (editingJob) {
                newJobEntry = await pb.collection('jobs').update(editingJob.id, apiData);
            } else {
                apiData.status = 'active';
                apiData.step = initialStep;
                newJobEntry = await pb.collection('jobs').create(apiData);
            }

            const expandedRec = await pb.collection('jobs').getOne(newJobEntry.id);
            const processedJob = mapRecordToJob(expandedRec);

            setIsJobModalOpen(false);
            setEditingJob(null);
            setJobToPrint(processedJob);
            setShowPrintModal(true);

        } catch (err) {
            console.error("Error saving job:", err);

            // Better error message extraction
            let errorMsg = 'เกิดข้อผิดพลาดในการบันทึก';
            if (err.data) {
                // PocketBase validation errors
                const fieldErrors = Object.entries(err.data)
                    .map(([field, details]) => `${field}: ${details.message || JSON.stringify(details)}`)
                    .join('\n');
                errorMsg = fieldErrors || JSON.stringify(err.data, null, 2);
            } else if (err.message) {
                errorMsg = err.message;
            }

            alert("Error: " + errorMsg);
        }
    };

    const openStatusUpdate = (job) => {
        setStatusUpdateJob(job);
        setIsStatusModalOpen(true);
    };

    const handleUpdateStatus = async (updatedJobOrJobs) => {
        try {
            if (Array.isArray(updatedJobOrJobs)) {
                const updatePromises = updatedJobOrJobs.map(job => {
                    const updateData = {
                        status: job.status,
                        step: job.step,
                        note: job.note
                    };
                    if (job.status === 'completed') {
                        updateData.completed_at = new Date().toISOString();
                    }
                    return pb.collection('jobs').update(job.id, updateData);
                });
                await Promise.all(updatePromises);
                setSelectedJobIds([]);
            } else {
                const updateData = {
                    status: updatedJobOrJobs.status,
                    step: updatedJobOrJobs.step,
                    note: updatedJobOrJobs.note
                };
                if (updatedJobOrJobs.status === 'completed') {
                    updateData.completed_at = new Date().toISOString();
                }
                await pb.collection('jobs').update(updatedJobOrJobs.id, updateData);
            }
            // Close modal after successful update
            setIsStatusModalOpen(false);
            setStatusUpdateJob(null);
        } catch (err) {
            console.error("Error updating status:", err);

            // Check if it's a 404 error (job doesn't exist anymore)
            const is404 = err.status === 404 || err.message?.includes('404');

            if (is404) {
                alert('งานนี้ถูกลบไปแล้ว หรือไม่มีอยู่ในระบบ\nกำลังโหลดข้อมูลใหม่...');
                // Remove this job from local state
                const jobId = Array.isArray(updatedJobOrJobs) ? null : updatedJobOrJobs.id;
                if (jobId) {
                    setJobs(prev => prev.filter(j => j.id !== jobId));
                }
                setIsStatusModalOpen(false);
                setStatusUpdateJob(null);
                // Optionally reload all jobs
                window.location.reload();
            } else {
                let errorMessage = 'เกิดข้อผิดพลาด';
                if (err.data) {
                    errorMessage = JSON.stringify(err.data, null, 2);
                } else if (err.message) {
                    errorMessage = err.message;
                }
                alert("Error: " + errorMessage);
            }
        }
    };

    // Scan Handler
    const handleScan = (query) => {
        const job = jobs.find(j => j.receptionNo.toLowerCase() === query.toLowerCase());
        if (job) {
            openStatusUpdate(job);
        } else {
            alert(`ไม่พบรายการงานเลขที่: ${query}`);
        }
    };

    // Not logged in
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

    return (
        <div className="admin-container">
            {/* Sidebar */}
            <AdminSidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                currentUser={currentUser}
                onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="admin-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="overview-container animate-fade-in-up">
                        <header className="dashboard-header" style={{ alignItems: 'center' }}>
                            <div>
                                <h1 className="page-title">ภาพรวมระบบ</h1>
                                <div className="date-display">{new Date().toLocaleDateString('th-TH', { dateStyle: 'long' })}</div>
                            </div>
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

                        {/* Top-level system stats row (new) */}
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <div className="stat-card" style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px' }}>
                                <div>
                                    <div className="stat-label">ยอดผู้เข้าใช้งานระบบค้นหาสถานะ</div>
                                    <div className="stat-value" style={{ color: '#0ea5e9', fontSize: '2rem' }}>{visitorCount.toLocaleString()}</div>
                                </div>
                                <div className="stat-icon-bg" style={{ background: '#e0f2fe', color: '#0ea5e9', margin: 0 }}>
                                    <Users size={24} />
                                </div>
                            </div>
                        </div>

                        <DashboardStats statsData={statsData} />
                        <DashboardCharts
                            pieData={statsData.pieData}
                            barData={statsData.barData}
                            assigneeData={statsData.assigneeData}
                        />
                    </div>
                )}

                {/* Jobs Tab */}
                {activeTab === 'jobs' && (
                    <div className="animate-fade-in-up">
                        <header className="dashboard-header">
                            <h1 className="page-title">รายการงานทั้งหมด</h1>
                            <button onClick={openAddJob} className="primary-button">
                                <Plus size={20} />
                                เพิ่มงานใหม่
                            </button>
                        </header>

                        <JobFilters
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                            filterDept={filterDept}
                            setFilterDept={setFilterDept}
                            filterStatus={filterStatus}
                            setFilterStatus={setFilterStatus}
                            filterAssignee={filterAssignee}
                            setFilterAssignee={setFilterAssignee}
                            filterStartDate={filterStartDate}
                            setFilterStartDate={setFilterStartDate}
                            filterEndDate={filterEndDate}
                            setFilterEndDate={setFilterEndDate}
                            onClearFilters={handleClearFilters}
                            allOfficers={allOfficers}
                            currentUser={currentUser}
                        />

                        <JobTable
                            jobs={filteredJobs}
                            selectedJobIds={selectedJobIds}
                            onSelectAll={handleSelectAll}
                            onSelectJob={handleSelectJob}
                            onPrint={handlePrint}
                            onEdit={openEditInfo}
                            onUpdateStatus={openStatusUpdate}
                            onBulkDelete={handleBulkDelete}
                            onBulkUpdateStatus={handleBulkUpdateStatus}
                            workflows={workflows}
                            deptSettings={deptSettings}
                        />
                    </div>
                )}

                {/* Scan Tab */}
                {activeTab === 'scan' && (
                    <ScanTab onScan={handleScan} inputRef={scanInputRef} />
                )}

                {/* Users Tab (Admin only) */}
                {activeTab === 'users' && currentUser?.role === 'admin' && (
                    <UserManagement />
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <WorkflowEditor
                        deptSettings={deptSettings}
                        onUpdateSettings={handleUpdateDeptSettings}
                        workflows={workflows}
                        onUpdateWorkflows={handleUpdateWorkflows}
                        jobTypes={jobTypes}
                        onUpdateJobTypes={handleUpdateJobTypes}
                        currentUser={currentUser}
                        departments={departments}
                    />
                )}

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                    <Reports
                        jobs={jobs}
                        deptSettings={deptSettings}
                        currentUser={currentUser}
                    />
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
                                onClick={() => handlePrint(jobToPrint)}
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
