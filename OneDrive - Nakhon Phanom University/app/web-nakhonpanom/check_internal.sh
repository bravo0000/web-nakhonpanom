#!/bin/bash

# สคริปต์ตรวจสอบการเชื่อมต่อภายใน (Internal Health Check)

echo "🔍 Checking Internal Connectivity..."

echo -e "\n1. Testing PocketBase Direct (127.0.0.1:8090)..."
if curl -s -I http://127.0.0.1:8090/_/ | grep "200 OK"; then
    echo "✅ PocketBase is responding."
else
    echo "❌ PocketBase FAILED!"
    curl -v http://127.0.0.1:8090/_/
fi

echo -e "\n2. Testing Nginx Direct (127.0.0.1:80)..."
if curl -s -I http://127.0.0.1:80 | grep "200 OK"; then
    echo "✅ Nginx is responding."
else
    echo "❌ Nginx FAILED!"
    curl -v http://127.0.0.1:80
fi

echo -e "\n3. Testing Nginx via LAN IP (192.168.44.251)..."
if curl -s -I http://192.168.44.251 | grep "200 OK"; then
    echo "✅ LAN Access is OK."
else
    echo "❌ LAN Access FAILED!"
fi

echo -e "\n============================================="
echo "ถ้าทุกอัน ✅ หมด แสดงว่าปัญหาอยู่ที่ Cloudflare Tunnel เชื่อมมาหา Nginx ไม่ได้"
echo "ถ้ามีอันไหน ❌ แจ้งผมได้เลยครับ"
