#!/bin/bash

# สคริปต์ปรับแต่ง Nginx ให้ทำงานร่วมกับ Cloudflare Tunnel ได้ดีขึ้น
# แก้ปัญหา 502 Bad Gateway ที่เกิดจาก Timeouts

NGINX_CONF="/etc/nginx/sites-available/default"

if [ -f "$NGINX_CONF" ]; then
    echo "🔧 Optimizing Nginx Config..."

    # 1. เพิ่ม Timeouts และ Config ที่จำเป็นใน block 'server {'
    # ใช้ sed เพื่อแทรก config หลังบรรทัด server_name _;
    
    # เช็คก่อนว่ามี config พวกนี้หรือยัง ถ้ายังให้เพิ่ม
    if ! grep -q "client_max_body_size" "$NGINX_CONF"; then
        sed -i '/server_name _;/a \
    \
    # Fix 502 Timeouts & Limits \
    client_max_body_size 0; \
    client_body_buffer_size 10M; \
    client_header_timeout 300s; \
    client_body_timeout 300s; \
    keepalive_timeout 300s; \
    ' "$NGINX_CONF"
        echo "✅ Added global request limits and timeouts"
    fi

    # 2. เพิ่ม Proxy Timeouts ใน location /api/ และ /_/
    # เพิ่มใน /api/
    sed -i '/proxy_read_timeout/d' "$NGINX_CONF" # ลบของเก่าออกก่อน (ถ้ามี)
    sed -i '/location \/api\/ {/a \
        proxy_read_timeout 300s; \
        proxy_connect_timeout 300s; \
        proxy_send_timeout 300s; \
    ' "$NGINX_CONF"

    # เพิ่มใน /_/
    sed -i '/location \/_\/ {/a \
        proxy_read_timeout 300s; \
        proxy_connect_timeout 300s; \
        proxy_send_timeout 300s; \
    ' "$NGINX_CONF"
    
    echo "✅ Added proxy timeouts"

    # ตรวจสอบ Config
    nginx -t
    
    if [ $? -eq 0 ]; then
        echo "🔄 Reloading Nginx..."
        systemctl reload nginx
        echo "🚀 Nginx optimized successfully!"
    else
        echo "❌ Nginx config test failed! Rolling back changes not implemented automatically. Please check file."
    fi

else
    echo "❌ Nginx config file not found!"
fi
