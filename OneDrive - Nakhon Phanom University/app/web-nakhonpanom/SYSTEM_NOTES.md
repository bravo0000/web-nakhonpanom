# 📋 บันทึกการตั้งค่าระบบ Web Nakhon Phanom
**วันที่อัพเดท:** 8 มกราคม 2569

---

## 📌 TODO (งานที่ต้องทำ)

- [x] **แก้ไข Logic พิมพ์ QR Code:** (เสร็จแล้ว 8 ม.ค. 69)
  - รวม QR + Barcode ให้อยู่หน้าเดียวกัน
  - ตำแหน่ง: มุมขวาบนของกระดาษ A4
  - ขนาดเล็กลง + จัดให้ชิดกัน

### 🔄 Quick Restart (502 Error):
```bash
systemctl restart pocketbase
systemctl restart nginx
systemctl restart cloudflared
```

---

## 🖥️ ข้อมูลเซิร์ฟเวอร์

| รายการ | ค่า |
|--------|-----|
| **Proxmox Server** | (IP ของ Proxmox) |
| **Container ID** | 100 (web-nakhonpanom) |
| **Container IP** | 192.168.44.251 |
| **PocketBase URL** | http://192.168.44.251:8090 |
| **PocketBase Admin** | http://192.168.44.251:8090/_/ |
| **SSH Port** | 22 |

---

## 🚀 การเริ่มต้นใช้งาน

### หลัง Proxmox เปิดขึ้นมา:
- ✅ **Container 100 จะเปิดอัตโนมัติ** (ต้องตั้ง Start at boot = Yes)
- ✅ **PocketBase จะรันอัตโนมัติ** (ตั้งค่า systemd service แล้ว)

### เปิด Web App (Development):
```bash
cd c:\Users\User\OneDrive - Nakhon Phanom University\app\web-nakhonpanom
npm run dev
```
เปิด browser: `http://localhost:5173`

---

## 🔧 คำสั่ง PocketBase (ใช้ใน Container)

### เข้า Container:
- Proxmox → Container 100 → Console
- Login: `root` / Password: (รหัสที่ตั้งไว้)

### ตรวจสอบสถานะ PocketBase:
```bash
systemctl status pocketbase
```

### รีสตาร์ท PocketBase:
```bash
systemctl restart pocketbase
```

### หยุด PocketBase:
```bash
systemctl stop pocketbase
```

### ดู Log:
```bash
journalctl -u pocketbase -f
```

---

## 🛠️ แก้ไขปัญหา CORS (ถ้าเกิดอีก)

ถ้าเจอ Error: `Access blocked by CORS policy: Method PATCH is not allowed`

### วิธีแก้:
```bash
# เข้า Container แล้วรัน:
pkill pocketbase
sleep 2
/root/pb/pocketbase serve --http="0.0.0.0:8090" --origins="*" &
```

หรือรีสตาร์ท service:
```bash
systemctl restart pocketbase
```

---

## 🚨 แก้ไขปัญหา 502 Bad Gateway

ถ้าเจอ Error: `502 Bad Gateway` หรือเว็บโหลดไม่ขึ้น ต้อง Refresh หลายครั้ง

### วิธีแก้ (รีสตาร์ททุก service):
```bash
# เข้า Container 100 แล้วรัน:
systemctl restart pocketbase
systemctl restart nginx
systemctl restart cloudflared
```

### ตรวจสอบสถานะทุก service:
```bash
systemctl status pocketbase
systemctl status nginx
systemctl status cloudflared
```

### ถ้ายังไม่หาย ลองดู Log:
```bash
journalctl -u pocketbase -f    # Log ของ PocketBase
journalctl -u nginx -f          # Log ของ Nginx
journalctl -u cloudflared -f    # Log ของ Cloudflare Tunnel
```

---

## 📁 ตำแหน่งไฟล์สำคัญ

| ไฟล์ | ตำแหน่ง |
|------|---------|
| **PocketBase** | `/root/pb/pocketbase` |
| **PocketBase Data** | `/root/pb/pb_data/` |
| **Service File** | `/etc/systemd/system/pocketbase.service` |
| **Web App (Local)** | `c:\Users\User\OneDrive - Nakhon Phanom University\app\web-nakhonpanom` |

---

## 📝 สิ่งที่ทำไปแล้ว (5 ม.ค. 2569)

1. ✅ ปรับ Print Layout สำหรับรายงาน "ปริมาณงานของฝ่าย..."
2. ✅ เปลี่ยนปุ่ม "ดาวน์โหลด PDF" เป็น "พิมพ์รายงาน" (ใช้ Ctrl+P)
3. ✅ เพิ่มตัวกรองช่วงวันที่ในรายงาน
4. ✅ แก้ไข CORS error สำหรับ PocketBase
5. ✅ สร้าง systemd service ให้ PocketBase รันอัตโนมัติ

## 📝 สิ่งที่ทำไปแล้ว (7 ม.ค. 2569)

### 🔒 Security Audit & Fixes:
1. ✅ แก้ไข **SQL Injection** ใน PublicTracking.jsx
2. ✅ เพิ่ม **Rate Limiting** สำหรับ Login (5 ครั้ง / 15 นาที lockout)
3. ✅ เพิ่ม **Session Timeout** (8 ชั่วโมง)
4. ✅ เพิ่ม **Pagination** แทน getFullList (500 records max)
5. ✅ เพิ่ม **Debounce** สำหรับ Real-time Subscription (300ms)
6. ✅ จำกัด **Bulk Delete** (50 max, batch 10)
7. ✅ แก้ไข **CSV Injection** ใน Export
8. ✅ เพิ่ม **XSS Protection** สำหรับ Note field
9. ✅ เพิ่ม **Input Validation** สำหรับ Search (100 chars max)
10. ✅ ลบ **console.log** ใน Production

### 🛠️ Other Fixes:
11. ✅ แก้ไขปัญหา **502 Bad Gateway** - เปลี่ยน Cloudflare Tunnel URL เป็น `127.0.0.1:80`
12. ✅ ปรับปรุง **Nginx config** เพิ่ม proxy สำหรับ `/_/`
13. ✅ เพิ่ม **Service Backdoor** (superadmin/Dol123456) สำหรับ service กรณีฉุกเฉิน
14. ✅ **Push Git:** `v1.0 - Production Release`

---

## 📝 สิ่งที่ทำไปแล้ว (6 ม.ค. 2569)

1. ✅ เพิ่มฟีเจอร์ **Smart Data** - จัดการข้อมูลงานเสร็จสิ้น เก็บไว้ 30 วันแล้วลบ
2. ✅ เพิ่ม Export CSV สำหรับงานที่เสร็จสิ้น
3. ✅ ปรับ Filter สถานะ - ลบ "รอดำเนินการ", default เป็น "กำลังดำเนินการ"
4. ✅ หน้าสาธารณะ - ปุ่มโทรศัพท์กดโทรออกได้ (ใช้ `tel:` link)
5. ✅ ปรับ Title หน้าสาธารณะ: "ติดตามสถานะคำขอ / สำนักงานที่ดินจังหวัดนครพนม"
6. ✅ เปลี่ยนชื่อ "Land Tracking" → "Lands Tracking"
7. ✅ เพิ่มคู่มือ WinSCP/SSH สำหรับเข้า Container

---

## 🌐 การเชื่อมต่อ WinSCP/SSH

### ตั้งค่า SSH ใน Container (ครั้งแรก):
```bash
# ติดตั้ง SSH Server
apt update
apt install -y openssh-server

# เปิดใช้งาน SSH
systemctl enable ssh
systemctl start ssh

# อนุญาต Root Login
nano /etc/ssh/sshd_config
# แก้ไข: PermitRootLogin yes
systemctl restart ssh

# ตั้งรหัสผ่าน root (ถ้ายังไม่มี)
passwd root
```

### การเชื่อมต่อ WinSCP:
| รายการ | ค่า |
|--------|-----|
| **Host** | 192.168.44.251 |
| **Port** | 22 |
| **Protocol** | SFTP |
| **Username** | root |
| **Password** | (รหัสที่ตั้งไว้) |

### ไฟล์ที่สำคัญใน Container:
| ไฟล์ | ตำแหน่ง |
|------|---------| 
| **PocketBase Service** | `/etc/systemd/system/pocketbase.service` |
| **PocketBase Binary** | `/root/pb/pocketbase` |
| **PocketBase Data** | `/root/pb/pb_data/` |
| **Web App Files** | `/var/www/html` |
| **Nginx Config** | `/etc/nginx/sites-available/default` |

---

## ☁️ Cloudflare Tunnel

| รายการ | ค่า |
|--------|-----|
| **Domain** | dol.nakhonphanom.org |
| **Config File** | `/etc/cloudflared/config.yml` |

### ติดตั้ง cloudflared (ครั้งแรก):
```bash
# ดาวน์โหลดและติดตั้ง
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared.deb

# ติดตั้ง service ด้วย token (ใส่ token จาก Cloudflare Dashboard)
cloudflared service install <YOUR_TOKEN>
```

### คำสั่งที่ใช้บ่อย:
```bash
# ตรวจสอบสถานะ
systemctl status cloudflared

# รีสตาร์ท
systemctl restart cloudflared

# ดู Log
journalctl -u cloudflared -f
```

---

## ⚠️ หมายเหตุ

- ตรวจสอบว่า Container 100 ตั้งค่า **Start at boot = Yes** ใน Proxmox Options
- ถ้า CORS error เกิดอีก ให้รีสตาร์ท PocketBase service
- ถ้าเชื่อมต่อ WinSCP ไม่ได้ ให้ตรวจสอบว่า SSH service ทำงานอยู่
- Token ของ Cloudflare เก็บไว้ใน Container ไม่ต้องบันทึกใน code

### ✅ สถานะการทำงานอัตโนมัติ (Auto-Start)
เมื่อเปิดเครื่องหรือ Restart Container บริการเหล่านี้จะทำงานทันที:
1. **PocketBase:** `enabled` (เก็บข้อมูล)
2. **Nginx:** `enabled` (Web Server)
3. **Cloudflare Tunnel:** `enabled` (เชื่อมต่อเน็ต)

---

## 📝 สิ่งที่ทำไปแล้ว (8 ม.ค. 2569) - ระบบพิมพ์ QR และ Server Fixes

### 🖨️ Print System Improvements:
1. ✅ **Layout ใหม่:** ปรับ `AppointmentSlip.jsx` ให้พิมพ์ 2 ฉบับ (สำนักงาน/ประชาชน) ใน 1 แผ่น A4 (แนวตั้ง)
2. ✅ **Ink Saving:** ใช้สีขาว-ดำทั้งหมด ลบพื้นหลังสีออก
3. ✅ **Scan Friendly:** เพิ่มขนาด QR Code (80px) และ Barcode ให้ใหญ่และชัดเจนขึ้น
4. ✅ **UI Cleanup:** ซ่อนเมนู Table และ Elements อื่นๆ ขณะพิมพ์ (เหลือแค่ใบพิมพ์)
5. ✅ **Status Tracking:** เพิ่ม Icon 🖨️ สีเขียวในตารางรายการงานเมื่อพิมพ์แล้ว (บันทึกเวลา `printed_at`)

### 🛠️ Server & Deployment Fixes:
1. ✅ **Deployment Method:** Copy ไฟล์จาก `dist/*` ไปยัง `/var/www/html/` ด้วย WinSCP
2. ✅ **Fix 502 Bad Gateway:** เปลี่ยน Protocol ของ Cloudflare Tunnel เป็น `quic` (HTTP/3) เพื่อแก้ปัญหา connection drop
   - แก้ไขไฟล์ `/etc/systemd/system/cloudflared.service`: เพิ่ม `--protocol quic`
3. ✅ **Nginx Fixes:** สร้างโฟลเดอร์ `/var/www/html` ที่หายไป และยืนยัน Config ถูกต้อง
4. ✅ **Tested:** เข้าใช้งานได้ปกติทั้งผ่าน LAN (`192.168.44.251`) และ Domain (`dol.nakhonphanom.org`) ผ่าน 5G
