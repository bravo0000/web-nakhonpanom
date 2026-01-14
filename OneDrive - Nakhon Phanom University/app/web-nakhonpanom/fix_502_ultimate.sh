#!/bin/bash

# สคริปต์แก้ไขขั้นสุดท้าย (Ultimate Fix)
# 1. เช็คเน็ตออกนอก (WAN Check)
# 2. เปลี่ยน Protocol เป็น http1.1 (ช้ากว่านิดหน่อย แต่เน้นชัวร์ 100%)

SERVICE_FILE="/etc/systemd/system/cloudflared.service"

echo "🩺 Performing Connectivity Check..."
if ping -c 3 1.1.1.1 > /dev/null; then
    echo "✅ Internet Connection is OK."
else
    echo "❌ ERROR: No Internet Connection! Tunnel cannot start."
    echo "   Please check your Gateway/DNS settings in Proxmox."
    # พยายามแก้ DNS ชั่วคราว
    echo "nameserver 1.1.1.1" > /etc/resolv.conf
fi

echo "🔧 Switching Protocol to HTTP/1.1 (Safe Mode)..."

if [ -f "$SERVICE_FILE" ]; then
    # เปลี่ยน http2 หรือ quic -> http1.1
    sed -i 's/--protocol http2/--protocol http1.1/g' "$SERVICE_FILE"
    sed -i 's/--protocol quic/--protocol http1.1/g' "$SERVICE_FILE"
    
    # ถ้ายังไม่มี protocol ให้เพิ่มเข้าไป
    # (ใช้ grep เช็คอีกทีเพื่อความชัวร์)
    if ! grep -q "protocol http1.1" "$SERVICE_FILE"; then
         sed -i 's/tunnel run/tunnel run --protocol http1.1/g' "$SERVICE_FILE"
    fi

    echo "🔄 Full Restarting Cloudflared..."
    systemctl daemon-reload
    systemctl stop cloudflared
    sleep 3
    systemctl start cloudflared
    
    # รอสัก 5 วินาทีให้ Connect
    echo "⏳ Waiting for tunnel connection..."
    sleep 5
    
    # เช็คสถานะ
    if systemctl is-active --quiet cloudflared; then
        echo "✅ Cloudflared is RUNNING with HTTP/1.1"
        journalctl -u cloudflared -n 10 --no-pager
    else
        echo "❌ Cloudflared failed to start!"
        systemctl status cloudflared --no-pager
    fi
else
    echo "❌ Service file not found!"
fi
