#!/bin/bash

# สคริปต์ดู Log แบบ Real-time เพื่อจับผู้ร้าย
# จะแสดง Log ของ Cloudflared และ Nginx พร้อมกัน

echo "🕵️‍♂️ Starting Traffic Monitor..."
echo "กรุณาเปิดหน้าเว็บแล้วกด Refresh (F5) รัวๆ สัก 2-3 ครั้งครับ"
echo "แล้วดูว่ามีข้อความอะไรขึ้นมาบ้าง..."
echo "-------------------------------------------------------"

# ใช้ tail -f ดู log พร้อมกัน (กด Ctrl+C เพื่อออก)
# เราจะกรองเอาเฉพาะ Error หรือ Access ที่สำคัญ

# สร้าง function เพื่อรัน tail background
tail -f -n 0 /var/log/nginx/access.log | sed --unbuffered 's/^/🟢 [Nginx Access]: /' &
PID1=$!

tail -f -n 0 /var/log/nginx/error.log | sed --unbuffered 's/^/🔴 [Nginx Error]: /' &
PID2=$!

journalctl -u cloudflared -f -n 0 | sed --unbuffered 's/^/☁️ [Cloudflare]: /' &
PID3=$!

# รอรับปุ่ม Ctrl+C เพื่อปิด process
trap "kill $PID1 $PID2 $PID3; exit" INT

echo "Waiting for traffic... (Press Ctrl+C to stop)"
wait
