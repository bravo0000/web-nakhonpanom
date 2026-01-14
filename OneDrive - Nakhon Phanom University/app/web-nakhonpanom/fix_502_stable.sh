#!/bin/bash

# สคริปต์แก้ปัญหา 502 Intermittent (ติดบ้าง ดับบ้าง)
# โดยการเปลี่ยน Protocol จาก QUIC (UDP) -> HTTP2 (TCP)
# ซึ่งเสถียรกว่าในบาง Network

SERVICE_FILE="/etc/systemd/system/cloudflared.service"

if [ -f "$SERVICE_FILE" ]; then
    echo "🔧 Checking Cloudflare Protocol..."
    
    # 1. เช็คว่ามี QUIC ไหม ถ้ามีให้เปลี่ยนเป็น HTTP2
    if grep -q "protocol quic" "$SERVICE_FILE"; then
        echo "Found QUIC protocol. Switching to HTTP2..."
        sed -i 's/--protocol quic/--protocol http2/g' "$SERVICE_FILE"
    
    # 2. ถ้าไม่มีการระบุ Protocol เลย ให้เพิ่ม --protocol http2 เข้าไป
    elif ! grep -q "protocol " "$SERVICE_FILE"; then
        echo "No protocol specified. Adding HTTP2..."
        sed -i 's/tunnel run/tunnel run --protocol http2/g' "$SERVICE_FILE"
        
    # 3. ถ้าเป็น http2 อยู่แล้ว
    elif grep -q "protocol http2" "$SERVICE_FILE"; then
        echo "✅ Already using HTTP2 protocol."
    else
        echo "ℹ️ Current protocol config: $(grep "protocol" "$SERVICE_FILE")"
    fi

    # รีสตาร์ท Service
    echo "🔄 Restarting Cloudflared..."
    systemctl daemon-reload
    systemctl restart cloudflared
    
    echo "✅ Done! Connection should be more stable now."
else
    echo "❌ Service file not found at $SERVICE_FILE"
fi
