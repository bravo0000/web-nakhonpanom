import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import './AppointmentSlip.css';

export const AppointmentSlip = React.forwardRef(({ job }, ref) => {
    if (!job) return null;

    // Generate tracking URL
    const trackingUrl = `${window.location.origin}/tracking?receptionNo=${encodeURIComponent(job.receptionNo)}`;

    // Format date in Thai
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Get assignee names
    const getAssigneeName = () => {
        if (job.assignees && job.assignees.length > 0) {
            return job.assignees.join(', ');
        }
        if (job.expand?.assignees && job.expand.assignees.length > 0) {
            return job.expand.assignees.map(a => a.name).join(', ');
        }
        return '-';
    };

    return (
        <div className="print-container" ref={ref}>
            {/* ฉบับสำนักงาน - ด้านบน */}
            <div className="slip-card">
                <div className="slip-badge office">ฉบับสำนักงาน</div>
                <div className="slip-header">
                    <div className="slip-title">ระบบติดตามสถานะคำขอ</div>
                    <div className="slip-subtitle">สำนักงานที่ดินจังหวัดนครพนม</div>
                </div>
                <div className="slip-content">
                    <div className="slip-codes">
                        <QRCodeCanvas
                            value={trackingUrl}
                            size={80}
                            level={"H"}
                            includeMargin={true}
                        />
                        <div className="barcode-wrapper">
                            <Barcode
                                value={job.receptionNo}
                                height={25}
                                fontSize={9}
                                width={1}
                                displayValue={true}
                                margin={0}
                            />
                        </div>
                    </div>
                    <div className="slip-info">
                        <div className="info-row">
                            <span className="info-label">เลขที่คำขอ:</span>
                            <span className="info-value">{job.receptionNo}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">วันที่:</span>
                            <span className="info-value">{formatDate(job.date)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ชื่อผู้ขอ:</span>
                            <span className="info-value">{job.owner || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">เจ้าหน้าที่:</span>
                            <span className="info-value">{getAssigneeName()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* เส้นประตัดกระดาษ */}
            <div className="cut-line">
                <span className="scissors">✂</span>
            </div>

            {/* ฉบับประชาชน - ด้านล่าง */}
            <div className="slip-card">
                <div className="slip-badge public">ฉบับประชาชน</div>
                <div className="slip-header">
                    <div className="slip-title">ระบบติดตามสถานะคำขอ</div>
                    <div className="slip-subtitle">สำนักงานที่ดินจังหวัดนครพนม</div>
                </div>
                <div className="slip-content">
                    <div className="slip-codes">
                        <QRCodeCanvas
                            value={trackingUrl}
                            size={80}
                            level={"H"}
                            includeMargin={true}
                        />
                        <div className="barcode-wrapper">
                            <Barcode
                                value={job.receptionNo}
                                height={25}
                                fontSize={9}
                                width={1}
                                displayValue={true}
                                margin={0}
                            />
                        </div>
                    </div>
                    <div className="slip-info">
                        <div className="info-row">
                            <span className="info-label">เลขที่คำขอ:</span>
                            <span className="info-value">{job.receptionNo}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">วันที่:</span>
                            <span className="info-value">{formatDate(job.date)}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">ชื่อผู้ขอ:</span>
                            <span className="info-value">{job.owner || '-'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">เจ้าหน้าที่:</span>
                            <span className="info-value">{getAssigneeName()}</span>
                        </div>
                        <div className="scan-hint">สแกน QR เพื่อติดตามสถานะ</div>
                    </div>
                </div>
            </div>
        </div>
    );
});

AppointmentSlip.displayName = 'AppointmentSlip';
