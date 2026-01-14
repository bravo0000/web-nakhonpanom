#!/bin/bash

# สคริปต์กู้คืน Service (Recovery)
# เนื่องจาก http1.1 อาจจะไม่ valid สำหรับเวอร์ชันนี้
# เราจะลบ flag protocol ออกเพื่อให้มันเลือก auto ที่ดีที่สุดเอง

SERVICE_FILE="/etc/systemd/system/cloudflared.service"

echo "🚑 Recovering Cloudflared Service..."

if [ -f "$SERVICE_FILE" ]; then
    # ลบ --protocol ... ออกทั้งหมด
    sed -i 's/--protocol http1.1//g' "$SERVICE_FILE"
    sed -i 's/--protocol http2//g' "$SERVICE_FILE"
    sed -i 's/--protocol quic//g' "$SERVICE_FILE"
    
    # ลบช่องว่างส่วนเกินที่อาจเกิดขึ้น
    sed -i 's/  / /g' "$SERVICE_FILE"

    echo "🔄 Restarting Service (Auto Protocol)..."
    systemctl daemon-reload
    systemctl restart cloudflared
    
    # รอผล
    sleep 5
    
    if systemctl is-active --quiet cloudflared; then
        echo "✅ Cloudflared is BACK ONLINE!"
        echo "📊 Current Status:"
        systemctl status cloudflared --no-pager
    else
        echo "❌ Still failed to start. Showing logs:"
        journalctl -u cloudflared -n 20 --no-pager
    fi
else
    echo "❌ Service file not found!"
fi
