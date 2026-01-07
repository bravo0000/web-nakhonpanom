import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';
import './AppointmentSlip.css';

export const AppointmentSlip = React.forwardRef(({ job }, ref) => {
    if (!job) return null;

    // Generate tracking URL
    const trackingUrl = `${window.location.origin}/tracking?receptionNo=${encodeURIComponent(job.receptionNo)}`;

    return (
        <div className="print-container" ref={ref}>
            <div className="mini-slip">
                <div className="qr-box">
                    <QRCodeCanvas
                        value={trackingUrl}
                        size={100}
                        level={"H"}
                        includeMargin={false}
                    />
                    <div className="qr-explain">สแกนเพื่อติดตามสถานะ</div>
                </div>
                <div className="info-box">
                    <div className="rx-no">เลขที่: <strong>{job.receptionNo}</strong></div>
                    <div className="rx-date">วันที่: {new Date(job.date).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'short',
                        year: '2-digit'
                    })}</div>
                </div>
                <div className="barcode-box" style={{ marginTop: 8 }}>
                    <Barcode
                        value={job.receptionNo}
                        height={40}
                        fontSize={12}
                        width={1.5}
                        displayValue={true}
                    />
                </div>
            </div>
        </div>
    );
});

AppointmentSlip.displayName = 'AppointmentSlip';
