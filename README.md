# Event Registration System

Sistem Registrasi Event dengan Express.js dan MongoDB yang dilengkapi dengan fitur manajemen lengkap.

## Fitur Utama

- **Manajemen Event**
  - Tiga jenis event: Pre Event Day 1, Pre Event Day 2, dan Main Event
  - Kuota, harga, dan deskripsi per event
  - Persyaratan alergi makanan khusus untuk Main Event

- **Registrasi Peserta**
  - Form registrasi dengan validasi data lengkap
  - Pengecekan kuota dan duplikasi email
  - Penghasilan nomor registrasi unik

- **Pembayaran**
  - Integrasi dengan Midtrans (BCA Virtual Account dan QRIS)
  - Penanganan webhook otomatis
  - Expiry time untuk pembayaran

- **Email dan QR Code**
  - Pengiriman email konfirmasi
  - QR code untuk absensi
  - Pengiriman email bulk ke peserta

- **Dashboard Admin**
  - Statistik lengkap
  - Manajemen registrasi
  - Manajemen pembayaran
  - Laporan dan ekspor data

## Teknologi yang Digunakan

- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Payment Gateway:** Midtrans
- **Email:** Nodemailer
- **Authentication:** JWT
- **QR Code:** QRCode

## Instalasi

### Prasyarat
- Node.js (v14+)
- MongoDB
- Akun Midtrans (untuk payment gateway)
- SMTP Server (untuk email)

### Langkah Instalasi

1. **Clone repository**
```bash
git clone https://github.com/yourusername/event-registration.git
cd event-registration
```

2. **Instal dependensi**
```bash
npm install
```

3. **Konfigurasi Environment**
- Buat file `.env` berdasarkan contoh di `.env.example`
```bash
cp .env.example .env
```
- Isi data konfigurasi yang diperlukan

4. **Buat Admin Pertama**
```bash
node scripts/createAdminUser.js
```

5. **Jalankan Server**
- Untuk development
```bash
npm run dev
```
- Untuk production
```bash
npm start
```

## Struktur Proyek

```
event-registration/
├── config/              # Konfigurasi (db, midtrans, email)
├── controllers/         # Logic untuk routes
├── middleware/          # Middleware (auth, validation, error handling)
├── models/              # Model data Mongoose
├── routes/              # API routes
├── services/            # Business logic (email, payment, QR)
├── utils/               # Utility functions
├── public/              # File statis (QR codes)
├── scripts/             # Script utilities (create admin, etc)
├── logs/                # Log files
├── .env                 # Environment variables
├── .gitignore           # Git ignore files
├── app.js               # Entry point aplikasi
└── package.json         # Dependency management
```

## API Endpoints

### Public API

#### 1. Events
- `GET /api/events` - Get semua event aktif
- `GET /api/events/:id` - Get detail event

#### 2. Registrasi
- `POST /api/registrations` - Daftar untuk event
- `GET /api/registrations/:id` - Get detail registrasi
- `GET /api/registrations/number/:regNumber` - Get registrasi berdasarkan nomor

#### 3. Pembayaran
- `POST /api/payments` - Buat pembayaran baru
- `GET /api/payments/:id` - Get detail pembayaran
- `GET /api/payments/registration/:registrationId` - Get pembayaran berdasarkan registrasi
- `POST /api/payments/webhook` - Webhook untuk Midtrans

### Admin API

#### 1. Autentikasi
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get profil admin
- `PUT /api/auth/changepassword` - Ubah password
- `POST /api/auth/register-admin` - Daftar admin baru (admin only)

#### 2. Dashboard & Manajemen
- `GET /api/admin/dashboard` - Statistik dashboard
- `GET /api/admin/registrations` - List semua registrasi
- `PUT /api/admin/registrations/:id` - Update registrasi
- `DELETE /api/admin/registrations/:id` - Hapus registrasi
- `GET /api/admin/payments` - List semua pembayaran
- `PUT /api/admin/payments/:id/status` - Update status pembayaran

#### 3. Laporan
- `GET /api/admin/reports/attendance` - Laporan kehadiran
- `GET /api/admin/reports/financial` - Laporan keuangan

#### 4. Ekspor Data
- `GET /api/admin/export/registrations` - Ekspor registrasi ke CSV
- `GET /api/admin/export/payments` - Ekspor pembayaran ke CSV
- `GET /api/admin/export/attendance` - Ekspor laporan kehadiran ke CSV
- `POST /api/admin/export/generate-qr-batch` - Generate QR code batch

#### 5. Email
- `POST /api/admin/email/send-bulk` - Kirim email massal
- `POST /api/admin/email/send-payment-reminders` - Kirim reminder pembayaran

## Contoh Penggunaan API

### Registrasi Event

**Request:**
```http
POST /api/registrations
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "081234567890",
  "gender": "Laki-laki",
  "age": 25,
  "foodAllergy": "Seafood",
  "eventId": "60d21b4667d0d8992e610c85"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Registrasi berhasil dibuat",
  "data": {
    "_id": "60d21c1267d0d8992e610c86",
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "081234567890",
    "gender": "Laki-laki",
    "age": 25,
    "foodAllergy": "Seafood",
    "eventId": "60d21b4667d0d8992e610c85",
    "status": "pending",
    "registrationNumber": "ME-210625-0001",
    "createdAt": "2021-06-23T08:22:58.545Z",
    "updatedAt": "2021-06-23T08:22:58.545Z"
  }
}
```

### Pembayaran

**Request:**
```http
POST /api/payments
Content-Type: application/json

{
  "registrationId": "60d21c1267d0d8992e610c86",
  "paymentMethod": "bca_va"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Pembayaran berhasil dibuat",
  "data": {
    "payment": {
      "_id": "60d21c4a67d0d8992e610c87",
      "registrationId": "60d21c1267d0d8992e610c86",
      "amount": 150000,
      "paymentMethod": "bca_va",
      "status": "pending",
      "transactionId": "ORDER-123456789",
      "midtransOrderId": "ORDER-123456789",
      "expiredAt": "2021-06-24T08:22:58.545Z",
      "createdAt": "2021-06-23T08:23:38.123Z",
      "updatedAt": "2021-06-23T08:23:38.123Z"
    },
    "paymentInstructions": {
      "transaction_id": "ORDER-123456789",
      "order_id": "ORDER-123456789",
      "gross_amount": "150000.00",
      "payment_type": "bank_transfer",
      "transaction_time": "2021-06-23 08:23:38",
      "transaction_status": "pending",
      "va_numbers": [
        {
          "bank": "bca",
          "va_number": "12345678901234"
        }
      ],
      "expiry_time": "2021-06-24 08:23:38"
    }
  }
}
```

### Login Admin

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "adminpassword123"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "60d21a9b67d0d8992e610c84",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDIxYTliNjdkMGQ4OTkyZTYxMGM4NCIsIm5hbWUiOiJBZG1pbiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2MjQzNTQyMTgsImV4cCI6MTYyNjk0NjIxOH0.7JXEMxCX5yg5QzvQWG3WV8VdkJIBcIMxCAzMEPwxZW4"
  }
}
```

### Dashboard Admin

**Request:**
```http
GET /api/admin/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "status": "success",
  "message": "Dashboard statistics retrieved",
  "data": {
    "totalEvents": 3,
    "activeEvents": 3,
    "totalRegistrations": 150,
    "paidRegistrations": 120,
    "pendingRegistrations": 30,
    "totalRevenue": 18000000,
    "attendedCount": 95,
    "attendanceRate": "79.17",
    "eventStats": [
      {
        "_id": "60d21b1267d0d8992e610c84",
        "name": "Workshop Design Thinking",
        "type": "Pre Event Day 1",
        "date": "2021-07-10T00:00:00.000Z",
        "quota": 50,
        "registeredCount": 48,
        "price": 100000,
        "totalRegistrations": 48,
        "paidRegistrations": 42
      },
      {
        "_id": "60d21b2867d0d8992e610c85",
        "name": "Workshop Public Speaking",
        "type": "Pre Event Day 2",
        "date": "2021-07-17T00:00:00.000Z",
        "quota": 50,
        "registeredCount": 45,
        "price": 100000,
        "totalRegistrations": 45,
        "paidRegistrations": 38
      },
      {
        "_id": "60d21b4667d0d8992e610c86",
        "name": "TEDx Conference",
        "type": "Main Event",
        "date": "2021-07-24T00:00:00.000Z",
        "quota": 100,
        "registeredCount": 57,
        "price": 150000,
        "totalRegistrations": 57,
        "paidRegistrations": 40
      }
    ]
  }
}
```

### Export Registrasi

**Request:**
```http
GET /api/admin/export/registrations?eventId=60d21b4667d0d8992e610c86
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
File CSV yang berisi data registrasi.

## Integrasi Midtrans

### Konfigurasi Midtrans

1. Daftar akun di [Midtrans](https://midtrans.com/)
2. Dapatkan Server Key dan Client Key
3. Konfigurasi Webhook URL di dashboard Midtrans:
   ```
   https://yourdomain.com/api/payments/webhook
   ```

### Contoh Webhook Midtrans

```json
{
  "transaction_time": "2021-06-23 15:30:25",
  "transaction_status": "settlement",
  "transaction_id": "9aed5972-5b6a-401e-9c27-ac7b52be0a83",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "fe5f725ea770c451d79f0d8349579d8950e1e4ed42495926b49c42ea6657cfed1b...",
  "payment_type": "bank_transfer",
  "order_id": "ORDER-123456789",
  "merchant_id": "G12345678",
  "gross_amount": "150000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
```

## Konfigurasi Email

### SMTP Setting

Contoh konfigurasi SMTP untuk Gmail:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

**Catatan:** Untuk Gmail, Anda perlu mengaktifkan "Less secure app access" atau menggunakan App Password.

### Template Email

Template email dapat dikustomisasi di `services/emailService.js`. Contoh template:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
  <h2 style="color: #333; text-align: center;">Pendaftaran Event Berhasil</h2>
  <p>Halo <strong>{{name}}</strong>,</p>
  <p>Terima kasih telah mendaftar untuk acara <strong>{{eventName}}</strong>.</p>
  
  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Detail Registrasi:</h3>
    <p><strong>Nomor Registrasi:</strong> {{regNumber}}</p>
    <p><strong>Tanggal Event:</strong> {{eventDate}}</p>
    <p><strong>Status Pembayaran:</strong> <span style="color: green; font-weight: bold;">SUKSES</span></p>
  </div>
  
  <div style="text-align: center; margin: 30px 0;">
    <p><strong>QR Code untuk Absensi:</strong></p>
    <p>Tunjukkan QR code di bawah ini saat registrasi di lokasi acara.</p>
    <img src="cid:qrcode" alt="QR Code" style="max-width: 200px; height: auto;" />
  </div>
</div>
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Periksa konfigurasi MONGO_URI di .env
   - Pastikan MongoDB server berjalan

2. **Midtrans Integration Issues**
   - Periksa Server Key dan Client Key
   - Pastikan Webhook URL sudah dikonfigurasi
   - Periksa log untuk melihat error spesifik

3. **Email Sending Failure**
   - Verifikasi konfigurasi SMTP
   - Periksa firewall atau keamanan jaringan
   - Coba dengan provider email yang berbeda

### Logs

Log disimpan di direktori `logs/`:
- `logs/all.log` - Semua log
- `logs/error.log` - Error log saja

## Security Best Practices

1. **Environment Variables**
   - Simpan semua secret dan kredensial di `.env`
   - Jangan pernah commit file `.env` ke repository

2. **JWT Authentication**
   - Token memiliki expiration time
   - Secret key yang kompleks

3. **Input Validation**
   - Validasi semua input pengguna
   - Sanitasi data sebelum disimpan ke database

4. **Rate Limiting**
   - Diterapkan pada API endpoints
   - Mencegah brute force dan DDoS

5. **CORS Protection**
   - Konfigurasi origins yang diizinkan


## Kontributor

- Dicky Al F - [GitHub](https://github.com/dickyalf)

## Catatan Penting

- Sistem ini didesain untuk pengelolaan event skala menengah
- Fitur keamanan dan validation sudah diterapkan
- Didukung oleh Midtrans untuk pembayaran
- Gunakan di production dengan mempertimbangkan keamanan tambahan