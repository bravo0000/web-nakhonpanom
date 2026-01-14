#!/bin/bash

# สคริปต์เก็บ Log เพื่อวิเคราะห์ปัญหา 502 แบบละเอียด
LOG_FILE="debug_log.txt"

{
    echo "================TIMESTAMP================"
    date
    
    echo -e "\n================SERVICE STATUS================"
    systemctl status cloudflared nginx pocketbase --no-pager

    echo -e "\n================NETSTAT (PORTS)================"
    # เช็คว่า port 80, 8090 เปิดอยู่ไหม
    ss -tulpn | grep -E '(:80|:8090)'

    echo -e "\n================CLOUDFLARED CONFIG================"
    cat /etc/cloudflared/config.yml

    echo -e "\n================NGINX CONFIG================"
    cat /etc/nginx/sites-enabled/default

    echo -e "\n================RECENT CLOUDFLARED LOGS================"
    journalctl -u cloudflared -n 30 --no-pager

    echo -e "\n================RECENT NGINX LOGS================"
    # ดู error log ของ nginx โดยเฉพาะ
    tail -n 30 /var/log/nginx/error.log

    echo -e "\n================RECENT POCKETBASE LOGS================"
    journalctl -u pocketbase -n 30 --no-pager

} > "$LOG_FILE" 2>&1

echo "✅ Diagnostic logs saved to $LOG_FILE"
echo "Please open $LOG_FILE and share the content."
