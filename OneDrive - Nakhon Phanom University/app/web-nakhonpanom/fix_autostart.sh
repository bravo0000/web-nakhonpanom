#!/bin/bash

# ฟังก์ชันสำหรับอัปเดตค่า Config (เขียนทับค่าเดิม)
update_config() {
    FILE=$1
    KEY=$2
    VALUE=$3

    if grep -q "^$KEY=" "$FILE"; then
        # ถ้ามีอยู่แล้ว ให้เปลี่ยนค่า (Replace)
        sed -i "s|^$KEY=.*|$KEY=$VALUE|" "$FILE"
        echo "✅ Updated $KEY to $VALUE in $FILE"
    else
        # ถ้ายังไม่มี ให้เพิ่มต่อท้ายบรรทัด [Service]
        sed -i "/\[Service\]/a $KEY=$VALUE" "$FILE"
        echo "➕ Added $KEY=$VALUE to $FILE"
    fi
}

echo "🛠️ Upgrading Service Auto-Restart Config..."

# ไฟล์ Service
CF_SERVICE="/etc/systemd/system/cloudflared.service"
PB_SERVICE="/etc/systemd/system/pocketbase.service"

# 1. Cloudflared
if [ -f "$CF_SERVICE" ]; then
    echo "Processing Cloudflared..."
    update_config "$CF_SERVICE" "Restart" "always"
    update_config "$CF_SERVICE" "RestartSec" "10s"
    update_config "$CF_SERVICE" "StartLimitIntervalSec" "0" # ป้องกันการหยุดทำงานถาวรหลังจาก Failed หลายรอบ
else
    echo "❌ Cloudflared Service not found!"
fi

# 2. PocketBase
if [ -f "$PB_SERVICE" ]; then
    echo "Processing PocketBase..."
    update_config "$PB_SERVICE" "Restart" "always"
    update_config "$PB_SERVICE" "RestartSec" "10s"
else
    echo "❌ PocketBase Service not found!"
fi

# Reload and Restart
echo "🔄 Reloading Systemd..."
systemctl daemon-reload

echo "♻️ Restarting services to apply changes..."
systemctl restart cloudflared pocketbase

echo "✅ Optimization Complete! All services are now set to Restart=always."
