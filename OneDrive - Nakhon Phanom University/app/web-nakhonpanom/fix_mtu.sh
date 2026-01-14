#!/bin/bash

# สคริปต์แก้ปัญหา MTU (Packet Fragmentation)
# อาการ: Ping ได้ (เพราะแพ็คเกจเล็ก) แต่เข้าเว็บไม่ได้ (เพราะแพ็คเกจใหญ่แตกกลางทาง)

INTERFACE=$(ip route | grep default | awk '{print $5}' | head -n1)
CURRENT_MTU=$(cat /sys/class/net/$INTERFACE/mtu)

echo "🛠️ Fixing MTU on interface: $INTERFACE"
echo "Current MTU: $CURRENT_MTU"

# ปรับ MTU ลงเหลือ 1420 (ปลอดภัยสำหรับ Tunnel)
NEW_MTU="1420"

if [ "$CURRENT_MTU" != "$NEW_MTU" ]; then
    echo "📉 Lowering MTU to $NEW_MTU..."
    ip link set dev $INTERFACE mtu $NEW_MTU
    
    # ทำให้ค่าคงที่หลัง Reboot (ถ้าใช้ systemd-networkd หรือ interfaces)
    # วิธีบ้านๆ: ใส่ใน crontab @reboot
    if ! crontab -l | grep -q "mtu $NEW_MTU"; then
        (crontab -l 2>/dev/null; echo "@reboot /usr/sbin/ip link set dev $INTERFACE mtu $NEW_MTU") | crontab -
    fi
    
    echo "✅ MTU Updated!"
else
    echo "ℹ️ MTU is already optimized."
fi

echo "🔄 Restarting Cloudflared to apply changes..."
systemctl restart cloudflared

echo "🚀 Try accessing the website now!"
