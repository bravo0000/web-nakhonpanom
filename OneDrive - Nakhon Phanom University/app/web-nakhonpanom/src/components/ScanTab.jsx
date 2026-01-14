import React, { useState } from 'react';
import { ScanBarcode } from 'lucide-react';

/**
 * ScanTab - หน้าสแกน QR Code / Barcode
 */
export default function ScanTab({ onScan, inputRef }) {
    const [scanInput, setScanInput] = useState('');

    const handleSubmit = (e) => {
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

        onScan(query);
        setScanInput('');
    };

    return (
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

            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
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
    );
}
