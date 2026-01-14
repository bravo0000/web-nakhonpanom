#!/bin/bash

# สคริปต์จูน Network Kernel (OS Level)
# แก้ปัญหา Buffer เต็ม และ Connection หลุดบ่อย

SYSCTL_FILE="/etc/sysctl.conf"

echo "🛠️ Tuning Linux Network Stack..."

# ฟังก์ชันเติมค่า config
add_sysctl() {
    KEY=$1
    VALUE=$2
    if grep -q "^$KEY" "$SYSCTL_FILE"; then
        sed -i "s/^$KEY.*/$KEY = $VALUE/" "$SYSCTL_FILE"
    else
        echo "$KEY = $VALUE" >> "$SYSCTL_FILE"
    fi
}

# 1. เพิ่มขนาด Buffer รับ-ส่งข้อมูล (แก้ปัญหาคอขวด)
add_sysctl "net.core.rmem_max" "2500000"
add_sysctl "net.core.wmem_max" "2500000"
add_sysctl "net.core.rmem_default" "2500000"
add_sysctl "net.core.wmem_default" "2500000"

# 2. ปรับ TCP Keepalive ให้เช็คบ่อยขึ้น (แก้ Zombie connection)
# เช็คทุก 60 วิ (เดิม 2 ชม.)
add_sysctl "net.ipv4.tcp_keepalive_time" "60"
add_sysctl "net.ipv4.tcp_keepalive_intvl" "10"
add_sysctl "net.ipv4.tcp_keepalive_probes" "6"

# 3. เปิด TCP Window Scaling (ช่วยเรื่องความเร็ว)
add_sysctl "net.ipv4.tcp_window_scaling" "1"

# 4. เพิ่ม UDP Buffer (เผื่อ Cloudflare กลับมาใช้ QUIC)
add_sysctl "net.core.optmem_max" "25165824"

# Apply changes
echo "🔄 Applying changes..."
sysctl -p

echo "✅ Network Stack Optimized!"
echo "Please restart Cloudflared one last time."
systemctl restart cloudflared
