import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown, Shield, Clock, FileText, Users, User, LayoutDashboard } from 'lucide-react';
import './WorkflowEditor.css';

const DEPARTMENTS = ['ฝ่ายทะเบียน', 'ฝ่ายรังวัด', 'กลุ่มงานวิชาการที่ดิน', 'ฝ่ายอำนวยการ'];

export default function WorkflowEditor({
    deptSettings,
    onUpdateSettings,
    workflows,
    onUpdateWorkflows,
    jobTypes,
    onUpdateJobTypes,
    currentUser
}) {
    const [activeDept, setActiveDept] = useState(DEPARTMENTS[0]);
    const [newStepName, setNewStepName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // Job Type State
    const [newJobType, setNewJobType] = useState('');

    // Officer Editing State
    const [editingOfficerId, setEditingOfficerId] = useState(null);
    const [editOfficerName, setEditOfficerName] = useState('');
    const [editOfficerPhone, setEditOfficerPhone] = useState('');

    const currentSteps = workflows[activeDept] || [];
    const currentJobTypes = jobTypes ? (jobTypes[activeDept] || []) : [];
    const currentSettings = deptSettings ? (deptSettings[activeDept] || { warning: 7, critical: 30 }) : { warning: 7, critical: 30 };

    // Permission Check
    const canEdit = currentUser && (
        currentUser.role === 'admin' ||
        (currentUser.departments && currentUser.departments.includes(activeDept))
    );

    const handleAddStep = (e) => {
        e.preventDefault();
        if (!newStepName.trim()) return;

        const newStep = {
            id: Date.now(),
            name: newStepName
        };

        const updatedWorkflows = {
            ...workflows,
            [activeDept]: [...(workflows[activeDept] || []), newStep]
        };

        onUpdateWorkflows(updatedWorkflows);
        setNewStepName('');
    };

    const handleDeleteStep = (id) => {
        const updatedWorkflows = {
            ...workflows,
            [activeDept]: workflows[activeDept].filter(step => step.id !== id)
        };
        onUpdateWorkflows(updatedWorkflows);
    };

    const startEdit = (step) => {
        setEditingId(step.id);
        setEditName(step.name);
    };

    const saveEdit = () => {
        const updatedWorkflows = {
            ...workflows,
            [activeDept]: workflows[activeDept].map(step =>
                step.id === editingId ? { ...step, name: editName } : step
            )
        };
        onUpdateWorkflows(updatedWorkflows);
        setEditingId(null);
    };

    const moveStep = (index, direction) => {
        const newSteps = [...currentSteps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex >= 0 && targetIndex < newSteps.length) {
            [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
            const updatedWorkflows = {
                ...workflows,
                [activeDept]: newSteps
            };
            onUpdateWorkflows(updatedWorkflows);
        }
    };

    // Job Type Handlers
    const handleAddJobType = (e) => {
        e.preventDefault();
        if (!newJobType.trim()) return;

        const updatedJobTypes = {
            ...jobTypes,
            [activeDept]: [...currentJobTypes, newJobType.trim()]
        };
        onUpdateJobTypes(updatedJobTypes);
        setNewJobType('');
    };

    const handleDeleteJobType = (typeToDelete) => {
        if (window.confirm(`คุณต้องการลบประเภทงาน "${typeToDelete}" ใช่หรือไม่?`)) {
            const updatedJobTypes = {
                ...jobTypes,
                [activeDept]: currentJobTypes.filter(t => t !== typeToDelete)
            };
            onUpdateJobTypes(updatedJobTypes);
        }
    };

    const handleSettingChange = (field, value) => {
        if (!onUpdateSettings) return;

        // Fix: Only parse integers for numeric fields, preserve objects/strings for others
        let val = value;
        if (field === 'warning' || field === 'critical') {
            val = parseInt(value) || 0;
        }

        onUpdateSettings(prev => ({
            ...prev,
            [activeDept]: {
                ...prev[activeDept],
                [field]: val
            }
        }));
    };

    // Officer Management Handlers
    const startEditOfficer = (officer) => {
        setEditingOfficerId(officer.id);
        setEditOfficerName(officer.name);
        setEditOfficerPhone(officer.phone);
    };

    const saveOfficer = (index) => {
        const newOfficers = [...(currentSettings.officers || [])];
        newOfficers[index] = {
            ...newOfficers[index],
            name: editOfficerName,
            phone: editOfficerPhone
        };
        handleSettingChange('officers', newOfficers);
        setEditingOfficerId(null);
    };

    return (
        <div className="workflow-container animate-fade-in-up">
            <header className="dashboard-header">
                <div>
                    <h1 className="page-title">ตั้งค่าข้อมูลระบบ</h1>
                    <p style={{ color: '#64748b', marginTop: 8 }}>จัดการขั้นตอนการทำงาน ข้อมูลเจ้าหน้าที่ และประเภทงาน</p>
                </div>
            </header>

            {/* API Tabs */}
            <div className="filter-bar" style={{ marginBottom: 32, padding: 8, gap: 8, background: '#f1f5f9', border: 'none' }}>
                {DEPARTMENTS.map(dept => (
                    <button
                        key={dept}
                        className={`filter-select ${activeDept === dept ? 'active' : ''}`}
                        onClick={() => setActiveDept(dept)}
                        style={{
                            flex: 1,
                            textAlign: 'center',
                            background: activeDept === dept ? 'white' : 'transparent',
                            color: activeDept === dept ? '#2563eb' : '#64748b',
                            boxShadow: activeDept === dept ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                            border: activeDept === dept ? '1px solid #e2e8f0' : 'none',
                            fontWeight: activeDept === dept ? 600 : 500,
                            padding: '12px',
                            minWidth: 'auto'
                        }}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {!canEdit ? (
                <div style={{
                    padding: 40, textAlign: 'center', color: '#64748b',
                    background: 'white', borderRadius: 20, marginTop: 24,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{
                        width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                        color: '#94a3b8'
                    }}>
                        <Shield size={32} />
                    </div>
                    <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>
                        ไม่ได้รับอนุญาต
                    </span>
                    คุณไม่มีสิทธิ์แก้ไขข้อมูลของ {activeDept}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 24 }}>
                    {/* Duration Settings */}
                    {onUpdateSettings && (
                        <div className="stat-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                                <div className="stat-icon-bg" style={{ background: '#fff7ed', color: '#ea580c', marginBottom: 0, width: 40, height: 40 }}>
                                    <Clock size={20} />
                                </div>
                                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>ตั้งค่าการแจ้งเตือนล่าช้า</h3>
                            </div>

                            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 500 }}>เตือน (สีส้ม) เมื่อเกิน:</span>
                                    <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="number"
                                            className="search-input"
                                            style={{ width: '80px', padding: '8px 12px', paddingLeft: 12 }}
                                            value={currentSettings.warning}
                                            onChange={(e) => handleSettingChange('warning', e.target.value)}
                                        />
                                        <span style={{ color: '#64748b' }}>วัน</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: '0.95rem', color: '#475569', fontWeight: 500 }}>วิกฤต (สีแดง) เมื่อเกิน:</span>
                                    <div className="input-with-suffix" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input
                                            type="number"
                                            className="search-input"
                                            style={{ width: '80px', padding: '8px 12px', paddingLeft: 12, borderColor: '#fca5a5' }}
                                            value={currentSettings.critical}
                                            onChange={(e) => handleSettingChange('critical', e.target.value)}
                                        />
                                        <span style={{ color: '#64748b' }}>วัน</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Job Type Management */}
                    {onUpdateJobTypes && (
                        <div className="stat-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="stat-icon-bg" style={{ background: '#f0fdf4', color: '#16a34a', marginBottom: 0, width: 40, height: 40 }}>
                                        <FileText size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>ประเภทงาน (Job Types)</h3>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                                {currentJobTypes.length === 0 ? (
                                    <div style={{ padding: 20, width: '100%', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 12, color: '#94a3b8' }}>
                                        ยังไม่มีประเภทงาน
                                    </div>
                                ) : (
                                    currentJobTypes.map((type, index) => (
                                        <div key={index} style={{
                                            background: '#f1f5f9',
                                            padding: '8px 16px',
                                            borderRadius: 99,
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            color: '#334155',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            border: '1px solid #e2e8f0'
                                        }}>
                                            {type}
                                            <button
                                                onClick={() => handleDeleteJobType(type)}
                                                style={{ border: 'none', background: '#e2e8f0', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', color: '#64748b', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="ลบ"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            <form onSubmit={handleAddJobType} style={{ display: 'flex', gap: 12 }}>
                                <input
                                    type="text"
                                    className="search-input"
                                    placeholder="เพิ่มประเภทงานใหม่..."
                                    style={{ paddingLeft: 16 }} // Override search icon padding
                                    value={newJobType}
                                    onChange={(e) => setNewJobType(e.target.value)}
                                />
                                <button type="submit" className="primary-button" style={{ whiteSpace: 'nowrap' }}>
                                    <Plus size={20} />
                                    เพิ่ม
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Officer Management */}
                    {onUpdateSettings && (
                        <div className="stat-card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="stat-icon-bg" style={{ background: '#eff6ff', color: '#2563eb', marginBottom: 0, width: 40, height: 40 }}>
                                        <Users size={20} />
                                    </div>
                                    <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>เจ้าหน้าที่รับผิดชอบ</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        const newId = Date.now();
                                        const newOfficers = [...(currentSettings.officers || []), { id: newId, name: 'เจ้าหน้าที่ใหม่', phone: '' }];
                                        handleSettingChange('officers', newOfficers);
                                        setEditingOfficerId(newId);
                                        setEditOfficerName('เจ้าหน้าที่ใหม่');
                                        setEditOfficerPhone('');
                                    }}
                                    className="action-button"
                                    style={{ width: 'auto', padding: '8px 16px', gap: 8, color: '#2563eb', background: '#eff6ff', border: 'none' }}
                                >
                                    <Plus size={18} />
                                    <span>เพิ่มเจ้าหน้าที่</span>
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                                {(currentSettings.officers || []).map((officer, index) => (
                                    <div key={officer.id || index} style={{
                                        display: 'flex', gap: 12, alignItems: 'center',
                                        padding: 16, border: '1px solid #e2e8f0', borderRadius: 16, background: '#f8fafc',
                                        transition: 'all 0.2s'
                                    }}>
                                        <div style={{
                                            width: 40, height: 40, background: 'white', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: '#64748b', border: '1px solid #e2e8f0'
                                        }}>
                                            <User size={20} />
                                        </div>

                                        {editingOfficerId === officer.id ? (
                                            <>
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <input
                                                        type="text"
                                                        placeholder="ชื่อ-นามสกุล"
                                                        className="search-input"
                                                        style={{ padding: '8px 12px', paddingLeft: 12, fontSize: '0.9rem' }}
                                                        value={editOfficerName}
                                                        onChange={(e) => setEditOfficerName(e.target.value)}
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="เบอร์โทรศัพท์"
                                                        className="search-input"
                                                        style={{ padding: '8px 12px', paddingLeft: 12, fontSize: '0.9rem' }}
                                                        value={editOfficerPhone}
                                                        onChange={(e) => setEditOfficerPhone(e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <button onClick={() => saveOfficer(index)} className="action-button" style={{ color: '#16a34a', background: '#dcfce7' }}>
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingOfficerId(null)} className="action-button" style={{ color: '#dc2626', background: '#fee2e2' }}>
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: '#334155' }}>{officer.name || 'ไม่ระบุชื่อ'}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 2 }}>{officer.phone || '-'}</div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    <button onClick={() => startEditOfficer(officer)} className="action-button">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('ยืนยันลบรายชื่อนี้?')) {
                                                                const newOfficers = (currentSettings.officers || []).filter((_, i) => i !== index);
                                                                handleSettingChange('officers', newOfficers);
                                                            }
                                                        }}
                                                        className="action-button"
                                                        style={{ color: '#ef4444' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Workflow Steps */}
                    <div className="stat-card" style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                            <div className="stat-icon-bg" style={{ background: '#fef3c7', color: '#d97706', marginBottom: 0, width: 40, height: 40 }}>
                                <LayoutDashboard size={20} />
                            </div>
                            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>ลำดับขั้นตอนการทำงาน</h3>
                        </div>

                        <form onSubmit={handleAddStep} style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                            <input
                                type="text"
                                className="search-input"
                                placeholder={`เพิ่มขั้นตอนสำหรับ ${activeDept}...`}
                                style={{ paddingLeft: 16 }}
                                value={newStepName}
                                onChange={(e) => setNewStepName(e.target.value)}
                            />
                            <button type="submit" className="primary-button" style={{ whiteSpace: 'nowrap' }}>
                                <Plus size={20} />
                                เพิ่ม
                            </button>
                        </form>

                        <div className="steps-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {currentSteps.length === 0 ? (
                                <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 16, border: '2px dashed #e2e8f0', color: '#94a3b8' }}>
                                    ยังไม่มีขั้นตอนการทำงาน
                                </div>
                            ) : (
                                currentSteps.map((step, index) => (
                                    <div key={step.id} style={{
                                        display: 'flex', alignItems: 'center', gap: 16,
                                        padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                    }}>
                                        <div style={{
                                            width: 32, height: 32, background: '#f1f5f9', borderRadius: 8,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 600, color: '#64748b', flexShrink: 0
                                        }}>
                                            {index + 1}
                                        </div>

                                        {editingId === step.id ? (
                                            <>
                                                <input
                                                    type="text"
                                                    className="search-input"
                                                    style={{ padding: '8px 12px', paddingLeft: 12 }}
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    autoFocus
                                                />
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button onClick={saveEdit} className="action-button" style={{ color: '#16a34a', background: '#dcfce7' }}>
                                                        <Check size={18} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="action-button" style={{ color: '#dc2626', background: '#fee2e2' }}>
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ flex: 1, fontWeight: 500, color: '#334155' }}>{step.name}</div>
                                                <div style={{ display: 'flex', gap: 4 }}>
                                                    <button
                                                        onClick={() => moveStep(index, 'up')}
                                                        className="action-button"
                                                        disabled={index === 0}
                                                        style={{ opacity: index === 0 ? 0.3 : 1 }}
                                                    >
                                                        <ArrowUp size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveStep(index, 'down')}
                                                        className="action-button"
                                                        disabled={index === currentSteps.length - 1}
                                                        style={{ opacity: index === currentSteps.length - 1 ? 0.3 : 1 }}
                                                    >
                                                        <ArrowDown size={18} />
                                                    </button>
                                                    <div style={{ width: 1, background: '#e2e8f0', margin: '0 4px' }} />
                                                    <button onClick={() => startEdit(step)} className="action-button">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDeleteStep(step.id)} className="action-button" style={{ color: '#ef4444' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
