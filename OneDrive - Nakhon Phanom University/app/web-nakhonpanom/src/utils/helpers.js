/**
 * Shared Helper Functions
 * ย้ายจาก AdminDashboard.jsx เพื่อให้ใช้ร่วมกันได้
 */

/**
 * แปลงวันที่เป็นรูปแบบไทย
 * @param {string} dateString - วันที่ในรูปแบบ ISO
 * @returns {string} วันที่ในรูปแบบไทย เช่น "1 มกราคม 2567"
 */
export const formatThaiDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

/**
 * คำนวณระยะเวลาตั้งแต่วันที่รับเรื่อง
 * @param {string} dateStr - วันที่รับเรื่อง
 * @param {string} dept - ชื่อฝ่าย
 * @param {object} deptSettings - ค่าตั้งค่าระยะเวลาเตือนของแต่ละฝ่าย
 * @returns {{days: number, colorClass: string}}
 */
export const calculateDuration = (dateStr, dept, deptSettings = {}) => {
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

/**
 * แปลง PocketBase record เป็น Job object สำหรับ UI
 * @param {object} record - PocketBase record
 * @returns {object} Job object
 */
export const mapRecordToJob = (record) => {
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
        completedAt: record.completed_at || null,
        printedAt: record.printed_at || null,
        assignees: Array.isArray(record.assignees) ? record.assignees : [],
        assigneesIds: []
    };
};

/**
 * แปลงสถานะเป็นข้อความภาษาไทย
 * @param {string} status - สถานะ (active, pending, completed)
 * @returns {string} ข้อความภาษาไทย
 */
export const getStatusText = (status) => {
    switch (status) {
        case 'active': return 'กำลังดำเนินการ';
        case 'pending': return 'รอดำเนินการ';
        case 'completed': return 'เสร็จสิ้น';
        default: return status;
    }
};

/**
 * สร้าง CSS class สำหรับ status badge
 * @param {string} status - สถานะ
 * @returns {{backgroundColor: string, color: string, border: string}}
 */
export const getStatusBadgeStyle = (status) => {
    const styles = {
        active: {
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            border: '1px solid #bfdbfe'
        },
        pending: {
            backgroundColor: '#ffedd5',
            color: '#9a3412',
            border: '1px solid #fed7aa'
        },
        completed: {
            backgroundColor: '#dcfce7',
            color: '#166534',
            border: '1px solid #bbf7d0'
        }
    };
    return styles[status] || styles.active;
};
