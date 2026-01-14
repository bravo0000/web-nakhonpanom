#!/bin/bash

# สคริปต์บังคับเปลี่ยนไปใช้ HTTP2 (TCP)
# เพื่อแก้ปัญหา QUIC (UDP) ที่มักโดนบล็อกหรือ Buffer เต็ม

SERVICE_FILE="/etc/systemd/system/cloudflared.service"

echo "🔧 Forcing HTTP2 Protocol..."

if [ -f "$SERVICE_FILE" ]; then
    # 1. ล้างค่าเก่าออกก่อน (เพื่อความสะอาด)
    sed -i 's/--protocol quic//g' "$SERVICE_FILE"
    sed -i 's/--protocol http1.1//g' "$SERVICE_FILE"
    sed -i 's/--protocol http2//g' "$SERVICE_FILE"
    
    # ลบช่องว่างซ้ำซ้อน
    sed -i 's/  / /g' "$SERVICE_FILE"

    # 2. เพิ่ม --protocol http2 เข้าไปใหม่
    sed -i 's/tunnel run/tunnel run --protocol http2/g' "$SERVICE_FILE"

    echo "🔄 Restarting Cloudflared..."
    systemctl daemon-reload
    systemctl restart cloudflared
    
    # 3. ตรวจสอบผล
    sleep 5
    if systemctl is-active --quiet cloudflared; then
        echo "✅ Cloudflared is RUNNING with HTTP2"
        # เช็ค Log ว่ามันใช้ http2 จริงไหม
        journalctl -u cloudflared -n 5 --no-pager | grep "protocol"
    else
        echo "❌ Failed to start. Checking logs..."
        journalctl -u cloudflared -n 20 --no-pager
    fi
else
    echo "❌ Service file not found!"
fi
