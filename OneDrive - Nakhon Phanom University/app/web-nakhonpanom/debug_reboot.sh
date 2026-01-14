#!/bin/bash

LOG_FILE="reboot_debug_log.txt"

{
    echo "================TIMESTAMP================"
    date
    
    echo -e "\n================SERVICE FAILURES================"
    systemctl --failed

    echo -e "\n================STATUS: CLOUDFLARED================"
    systemctl status cloudflared --no-pager

    echo -e "\n================STATUS: POCKETBASE================"
    systemctl status pocketbase --no-pager

    echo -e "\n================STATUS: NGINX================"
    systemctl status nginx --no-pager

    echo -e "\n================JOURNAL: CLOUDFLARED (LAST 50)================"
    journalctl -u cloudflared -n 50 --no-pager

} > "$LOG_FILE" 2>&1

echo "✅ Reboot debug info saved to $LOG_FILE"
echo "Please share the content of $LOG_FILE"
