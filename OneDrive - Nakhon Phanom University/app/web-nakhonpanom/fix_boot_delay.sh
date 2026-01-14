#!/bin/bash

# สคริปต์แก้ปัญหา Boot (เปิดเครื่องแล้ว 502)
# โดยการเพิ่ม "เวลาหน่วง" (Delay) ก่อนเริ่ม Cloudflare
# เพื่อให้มั่นใจว่าเน็ตมาเต็มแล้วค่อยต่อ

SERVICE_FILE="/etc/systemd/system/cloudflared.service"

echo "⏳ Adding Boot Delay to Cloudflared..."

if [ -f "$SERVICE_FILE" ]; then
    # 1. เพิ่ม Dependency ให้รอ Network Online
    if ! grep -q "After=network-online.target" "$SERVICE_FILE"; then
        sed -i '/\[Unit\]/a After=network-online.target\nWants=network-online.target' "$SERVICE_FILE"
        echo "✅ Added Network Dependency"
    fi

    # 2. เพิ่ม Delay 15 วินาที ก่อนเริ่มทำงาน (ExecStartPre)
    if ! grep -q "ExecStartPre=/bin/sleep" "$SERVICE_FILE"; then
        sed -i '/\[Service\]/a ExecStartPre=/bin/sleep 15' "$SERVICE_FILE"
        echo "✅ Added 15s Startup Delay"
    else
        echo "ℹ️ Startup Delay already exists."
    fi

    # 3. จัดลำดับการเริ่ม Nginx ให้รอ Cloudflare (Optional but good)
    # (ข้ามไปก่อน เดี๋ยวจะซับซ้อนเกินไป)

    echo "🔄 Reloading Systemd..."
    systemctl daemon-reload
    
    echo "✅ Boot Fix Applied!"
    echo "The service will now wait 15 seconds after network is ready."
    
else
    echo "❌ Service file not found!"
fi
