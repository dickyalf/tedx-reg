# TEDxUC Registration System

Sistem Registrasi TEDxUC dengan Express.js dan MongoDB yang dilengkapi dengan fitur manajemen lengkap.

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

# Dokumentasi API Sistem Registrasi Event

## Daftar Isi
1. [Pengenalan](#pengenalan)
2. [Autentikasi](#autentikasi)
3. [Format Response](#format-response)
4. [Endpoint Event](#endpoint-event)
5. [Endpoint Registrasi](#endpoint-registrasi)
6. [Endpoint Pembayaran](#endpoint-pembayaran)
7. [Endpoint Admin](#endpoint-admin)
8. [Endpoint Export](#endpoint-export)
9. [Endpoint Email](#endpoint-email)
10. [Penanganan Event Gratis](#penanganan-event-gratis)
11. [Status Kode](#status-kode)
12. [Contoh Penggunaan](#contoh-penggunaan)

## Pengenalan

API Sistem Registrasi Event adalah REST API untuk mengelola event, registrasi peserta, dan pembayaran. API ini dibuat menggunakan Express.js dan MongoDB.

### Base URL
```
https://api.your-domain.com
```

Untuk development:
```
http://localhost:5000
```

## Autentikasi

Beberapa endpoint, terutama yang berhubungan dengan admin, memerlukan autentikasi menggunakan JWT (JSON Web Token).

### Login Admin

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Login berhasil",
  "data": {
    "user": {
      "id": "60d21b4667d0d8992e610c85",
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Endpoint Export

### 1. Export Registrasi ke CSV (Admin)
```
GET /api/admin/export/registrations
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- eventId: filter berdasarkan event (opsional)
- status: filter berdasarkan status (opsional)

**Response Success:**
File CSV yang berisi data registrasi.

### 2. Export Pembayaran ke CSV (Admin)
```
GET /api/admin/export/payments
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- status: filter berdasarkan status (opsional)
- startDate: tanggal mulai (format: YYYY-MM-DD)
- endDate: tanggal akhir (format: YYYY-MM-DD)

**Response Success:**
File CSV yang berisi data pembayaran.

### 3. Export Laporan Kehadiran ke CSV (Admin)
```
GET /api/admin/export/attendance
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- eventId: filter berdasarkan event (opsional)

**Response Success:**
File CSV yang berisi data kehadiran.

### 4. Generate QR Code Batch (Admin)
```
POST /api/admin/export/generate-qr-batch
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "eventId": "60d21b4667d0d8992e610c85"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "QR codes generated for 10 registrations",
  "data": {
    "total": 10,
    "successful": 10,
    "failed": 0,
    "results": [
      {
        "registrationId": "60d21b4667d0d8992e610c88",
        "registrationNumber": "ME-230920-1234",
        "success": true,
        "qrPath": "/qrcodes/ME-230920-1234_60d21b4667d0d8992e610c88.png"
      },
      // ...more registrations
    ]
  }
}
```

## Endpoint Email

### 1. Kirim Email Massal (Admin)
```
POST /api/admin/email/send-bulk
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "eventId": "60d21b4667d0d8992e610c85",
  "subject": "Pengumuman Penting TEDx Jakarta",
  "message": "<p>Halo peserta TEDx Jakarta,</p><p>Ini adalah informasi penting mengenai acara yang akan datang.</p>",
  "includeQR": true,
  "status": "paid"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Bulk email process completed",
  "data": {
    "total": 35,
    "sent": 35,
    "failed": 0,
    "failures": []
  }
}
```

### 2. Kirim Pengingat Pembayaran (Admin)
```
POST /api/admin/email/send-payment-reminders
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "eventId": "60d21b4667d0d8992e610c85",
  "customMessage": "Mohon segera selesaikan pembayaran Anda paling lambat 24 jam dari sekarang."
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Payment reminder process completed",
  "data": {
    "total": 10,
    "sent": 10,
    "failed": 0,
    "failures": []
  }
}
```

## Penanganan Event Gratis

Sistem mendukung event gratis (harga = 0) dengan penanganan khusus:

### 1. Registrasi Event Gratis

Ketika mendaftar ke event gratis:
- Status registrasi langsung menjadi "paid"
- QR code untuk absensi langsung digenerate
- Email konfirmasi langsung dikirim
- Tidak perlu melalui proses pembayaran Midtrans

### 2. Pembayaran Event Gratis

Jika mencoba melakukan pembayaran untuk event gratis:
- Sistem akan mendeteksi bahwa event memiliki harga 0
- Status registrasi langsung diubah menjadi "paid"
- QR code untuk absensi dibuat jika belum ada
- Email konfirmasi dikirim ke peserta

### 3. Catatan Data

- Record payment tetap dibuat dengan `paymentMethod: "free"` dan `status: "success"`
- TransactionId akan diformat sebagai `FREE-{timestamp}`

## Status Kode

API menggunakan status kode HTTP standar:

- 200: OK - Request berhasil
- 201: Created - Resource berhasil dibuat
- 400: Bad Request - Parameter input tidak valid
- 401: Unauthorized - Token tidak valid atau tidak ada
- 403: Forbidden - Tidak memiliki izin akses
- 404: Not Found - Resource tidak ditemukan
- 500: Internal Server Error - Kesalahan pada server

## Contoh Penggunaan

### 1. Alur Registrasi Event Berbayar

1. **Mendapatkan daftar event**
   ```
   GET /api/events
   ```

2. **Mendaftar ke event**
   ```
   POST /api/registrations
   {
     "fullName": "Budi Santoso",
     "email": "budi@example.com",
     "phoneNumber": "081234567890",
     "gender": "Laki-laki",
     "age": 25,
     "foodAllergy": "Kacang",
     "eventId": "60d21b4667d0d8992e610c85"
   }
   ```

3. **Membuat pembayaran**
   ```
   POST /api/payments
   {
     "registrationId": "60d21b4667d0d8992e610c88",
     "paymentMethod": "bca_va"
   }
   ```

4. **Menunggu notifikasi webhook dari Midtrans**
   Server akan menerima webhook dari Midtrans saat pembayaran selesai.

5. **Cek status pembayaran**
   ```
   GET /api/payments/registration/60d21b4667d0d8992e610c88
   ```

### 2. Alur Registrasi Event Gratis

1. **Mendapatkan daftar event**
   ```
   GET /api/events
   ```

2. **Mendaftar ke event gratis**
   ```
   POST /api/registrations
   {
     "fullName": "Dewi Anggraini",
     "email": "dewi@example.com",
     "phoneNumber": "081234567891",
     "gender": "Perempuan",
     "age": 28,
     "foodAllergy": "-",
     "eventId": "60d21b4667d0d8992e610c90"
   }
   ```

3. **Status langsung menjadi paid dan QR code langsung terkirim via email**

### 3. Alur Admin

1. **Login admin**
   ```
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

2. **Melihat dashboard**
   ```
   GET /api/admin/dashboard
   ```

3. **Mengelola registrasi**
   ```
   GET /api/admin/registrations
   PUT /api/admin/registrations/:id
   DELETE /api/admin/registrations/:id
   ```

4. **Mengelola pembayaran**
   ```
   GET /api/admin/payments
   PUT /api/admin/payments/:id/status
   ```

5. **Mendapatkan laporan**
   ```
   GET /api/admin/reports/attendance
   GET /api/admin/reports/financial
   ```

6. **Export data**
   ```
   GET /api/admin/export/registrations
   GET /api/admin/export/payments
   GET /api/admin/export/attendance
   POST /api/admin/export/generate-qr-batch
   ```

7. **Mengirim email massal**
   ```
   POST /api/admin/email/send-bulk
   POST /api/admin/email/send-payment-reminders
   ```
```

Setelah login berhasil, gunakan token JWT yang diterima dalam header Authorization dengan format:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Format Response

Semua response API menggunakan format yang konsisten:

### Success Response:
```json
{
  "status": "success",
  "message": "Pesan sukses",
  "data": { ... } // Optional, data yang dikembalikan
}
```

### Error Response:
```json
{
  "status": "error",
  "message": "Pesan error",
  "data": { ... } // Optional, detail error
}
```

## Endpoint Event

### 1. Mendapatkan Semua Event
```
GET /api/events
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data event berhasil diambil",
  "data": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "TEDx Jakarta",
      "type": "Main Event",
      "date": "2023-10-15T07:00:00.000Z",
      "quota": 100,
      "registeredCount": 45,
      "price": 150000,
      "description": "TEDx event di Jakarta",
      "requireFoodAllergy": true,
      "isActive": true,
      "createdAt": "2023-09-01T12:00:00.000Z",
      "updatedAt": "2023-09-15T08:30:00.000Z"
    },
    {
      "_id": "60d21b4667d0d8992e610c86",
      "name": "Pre Event Workshop",
      "type": "Pre Event Day 1",
      "date": "2023-10-01T09:00:00.000Z",
      "quota": 50,
      "registeredCount": 20,
      "price": 75000,
      "description": "Workshop persiapan TEDx",
      "requireFoodAllergy": false,
      "isActive": true,
      "createdAt": "2023-09-01T12:30:00.000Z",
      "updatedAt": "2023-09-10T14:00:00.000Z"
    }
  ]
}
```

### 2. Mendapatkan Event Berdasarkan ID
```
GET /api/events/:id
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data event berhasil diambil",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "TEDx Jakarta",
    "type": "Main Event",
    "date": "2023-10-15T07:00:00.000Z",
    "quota": 100,
    "registeredCount": 45,
    "price": 150000,
    "description": "TEDx event di Jakarta",
    "requireFoodAllergy": true,
    "isActive": true,
    "available": true,
    "remainingSlots": 55,
    "createdAt": "2023-09-01T12:00:00.000Z",
    "updatedAt": "2023-09-15T08:30:00.000Z"
  }
}
```

### 3. Membuat Event Baru (Admin)
```
POST /api/events
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "TEDx Networking Night",
  "type": "Pre Event Day 2",
  "date": "2023-10-10T18:00:00.000Z",
  "quota": 75,
  "price": 50000,
  "description": "Networking night untuk peserta TEDx",
  "requireFoodAllergy": false
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Event berhasil dibuat",
  "data": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "TEDx Networking Night",
    "type": "Pre Event Day 2",
    "date": "2023-10-10T18:00:00.000Z",
    "quota": 75,
    "registeredCount": 0,
    "price": 50000,
    "description": "Networking night untuk peserta TEDx",
    "requireFoodAllergy": false,
    "isActive": true,
    "createdAt": "2023-09-20T10:00:00.000Z",
    "updatedAt": "2023-09-20T10:00:00.000Z"
  }
}
```

### 4. Mengupdate Event (Admin)
```
PUT /api/events/:id
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "TEDx Networking Night Updated",
  "price": 75000,
  "quota": 100
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Event berhasil diupdate",
  "data": {
    "_id": "60d21b4667d0d8992e610c87",
    "name": "TEDx Networking Night Updated",
    "type": "Pre Event Day 2",
    "date": "2023-10-10T18:00:00.000Z",
    "quota": 100,
    "registeredCount": 0,
    "price": 75000,
    "description": "Networking night untuk peserta TEDx",
    "requireFoodAllergy": false,
    "isActive": true,
    "createdAt": "2023-09-20T10:00:00.000Z",
    "updatedAt": "2023-09-20T11:30:00.000Z"
  }
}
```

### 5. Menghapus Event (Admin)
```
DELETE /api/events/:id
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Event berhasil dinonaktifkan"
}
```

## Endpoint Registrasi

### 1. Mendaftar ke Event
```
POST /api/registrations
```

**Request Body:**
```json
{
  "fullName": "Budi Santoso",
  "email": "budi@example.com",
  "phoneNumber": "081234567890",
  "gender": "Laki-laki",
  "age": 25,
  "foodAllergy": "Kacang",
  "eventId": "60d21b4667d0d8992e610c85"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Registrasi berhasil dibuat",
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "fullName": "Budi Santoso",
    "email": "budi@example.com",
    "phoneNumber": "081234567890",
    "gender": "Laki-laki",
    "age": 25,
    "foodAllergy": "Kacang",
    "eventId": "60d21b4667d0d8992e610c85",
    "registrationNumber": "ME-230920-1234",
    "status": "pending",
    "attendanceStatus": "not_attended",
    "registrationDate": "2023-09-20T12:00:00.000Z",
    "createdAt": "2023-09-20T12:00:00.000Z",
    "updatedAt": "2023-09-20T12:00:00.000Z"
  }
}
```

**Catatan untuk Event Gratis:**
Jika event memiliki harga 0 (gratis), response akan berisi data tambahan:
```json
{
  "status": "success",
  "message": "Registrasi gratis berhasil",
  "data": {
    "registration": {
      "_id": "60d21b4667d0d8992e610c89",
      "fullName": "Dewi Anggraini",
      "email": "dewi@example.com",
      "phoneNumber": "081234567891",
      "gender": "Perempuan",
      "age": 28,
      "foodAllergy": "-",
      "eventId": "60d21b4667d0d8992e610c90",
      "registrationNumber": "PE1-230920-5678",
      "status": "paid",
      "qrCode": "/qrcodes/PE1-230920-5678_60d21b4667d0d8992e610c89.png",
      "attendanceStatus": "not_attended",
      "registrationDate": "2023-09-20T13:00:00.000Z",
      "createdAt": "2023-09-20T13:00:00.000Z",
      "updatedAt": "2023-09-20T13:00:00.000Z"
    },
    "payment": {
      "_id": "60d21b4667d0d8992e610c91",
      "registrationId": "60d21b4667d0d8992e610c89",
      "amount": 0,
      "paymentMethod": "free",
      "status": "success",
      "transactionId": "FREE-1632142800000",
      "paymentDate": "2023-09-20T13:00:00.000Z",
      "createdAt": "2023-09-20T13:00:00.000Z",
      "updatedAt": "2023-09-20T13:00:00.000Z"
    },
    "message": "Registrasi berhasil dan email konfirmasi telah dikirim"
  }
}
```

### 2. Mendapatkan Registrasi Berdasarkan ID
```
GET /api/registrations/:id
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data registrasi berhasil diambil",
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "fullName": "Budi Santoso",
    "email": "budi@example.com",
    "phoneNumber": "081234567890",
    "gender": "Laki-laki",
    "age": 25,
    "foodAllergy": "Kacang",
    "eventId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "TEDx Jakarta",
      "type": "Main Event",
      "date": "2023-10-15T07:00:00.000Z",
      "price": 150000
    },
    "registrationNumber": "ME-230920-1234",
    "status": "pending",
    "attendanceStatus": "not_attended",
    "registrationDate": "2023-09-20T12:00:00.000Z",
    "createdAt": "2023-09-20T12:00:00.000Z",
    "updatedAt": "2023-09-20T12:00:00.000Z"
  }
}
```

### 3. Mendapatkan Registrasi Berdasarkan Nomor Registrasi
```
GET /api/registrations/number/:regNumber
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data registrasi berhasil diambil",
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "fullName": "Budi Santoso",
    "email": "budi@example.com",
    "phoneNumber": "081234567890",
    "gender": "Laki-laki",
    "age": 25,
    "foodAllergy": "Kacang",
    "eventId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "TEDx Jakarta",
      "type": "Main Event",
      "date": "2023-10-15T07:00:00.000Z",
      "price": 150000
    },
    "registrationNumber": "ME-230920-1234",
    "status": "pending",
    "attendanceStatus": "not_attended",
    "registrationDate": "2023-09-20T12:00:00.000Z",
    "createdAt": "2023-09-20T12:00:00.000Z",
    "updatedAt": "2023-09-20T12:00:00.000Z"
  }
}
```

## Endpoint Pembayaran

### 1. Membuat Pembayaran
```
POST /api/payments
```

**Request Body:**
```json
{
  "registrationId": "60d21b4667d0d8992e610c88",
  "paymentMethod": "bca_va"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Pembayaran berhasil dibuat",
  "data": {
    "payment": {
      "_id": "60d21b4667d0d8992e610c92",
      "registrationId": "60d21b4667d0d8992e610c88",
      "amount": 150000,
      "paymentMethod": "bca_va",
      "status": "pending",
      "transactionId": "123456789",
      "midtransOrderId": "ORDER-123456789",
      "midtransTransactionId": "123456789",
      "expiredAt": "2023-09-21T14:00:00.000Z",
      "createdAt": "2023-09-20T14:00:00.000Z",
      "updatedAt": "2023-09-20T14:00:00.000Z"
    },
    "paymentInstructions": {
      "transaction_id": "123456789",
      "order_id": "ORDER-123456789",
      "gross_amount": "150000.00",
      "payment_type": "bank_transfer",
      "transaction_time": "2023-09-20 14:00:00",
      "transaction_status": "pending",
      "va_numbers": [
        {
          "bank": "bca",
          "va_number": "12345678901234"
        }
      ],
      "expiryTime": "2023-09-21T14:00:00.000Z"
    }
  }
}
```

**Response untuk Event Gratis:**
```json
{
  "status": "success",
  "message": "Registrasi gratis berhasil",
  "data": {
    "registration": {
      "_id": "60d21b4667d0d8992e610c89",
      "status": "paid",
      "qrCode": "/qrcodes/PE1-230920-5678_60d21b4667d0d8992e610c89.png",
      "updatedAt": "2023-09-20T14:00:00.000Z"
    },
    "payment": {
      "_id": "60d21b4667d0d8992e610c93",
      "registrationId": "60d21b4667d0d8992e610c89",
      "amount": 0,
      "paymentMethod": "free",
      "status": "success",
      "transactionId": "FREE-1632146400000",
      "paymentDate": "2023-09-20T14:00:00.000Z",
      "createdAt": "2023-09-20T14:00:00.000Z",
      "updatedAt": "2023-09-20T14:00:00.000Z"
    }
  }
}
```

### 2. Mendapatkan Pembayaran Berdasarkan ID
```
GET /api/payments/:id
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data pembayaran berhasil diambil",
  "data": {
    "_id": "60d21b4667d0d8992e610c92",
    "registrationId": {
      "_id": "60d21b4667d0d8992e610c88",
      "fullName": "Budi Santoso",
      "email": "budi@example.com",
      "registrationNumber": "ME-230920-1234",
      "eventId": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "TEDx Jakarta",
        "type": "Main Event",
        "date": "2023-10-15T07:00:00.000Z",
        "price": 150000
      }
    },
    "amount": 150000,
    "paymentMethod": "bca_va",
    "status": "pending",
    "transactionId": "123456789",
    "midtransOrderId": "ORDER-123456789",
    "midtransTransactionId": "123456789",
    "expiredAt": "2023-09-21T14:00:00.000Z",
    "createdAt": "2023-09-20T14:00:00.000Z",
    "updatedAt": "2023-09-20T14:00:00.000Z"
  }
}
```

### 3. Mendapatkan Pembayaran Berdasarkan ID Registrasi
```
GET /api/payments/registration/:registrationId
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Data pembayaran berhasil diambil",
  "data": {
    "_id": "60d21b4667d0d8992e610c92",
    "registrationId": {
      "_id": "60d21b4667d0d8992e610c88",
      "fullName": "Budi Santoso",
      "email": "budi@example.com",
      "registrationNumber": "ME-230920-1234",
      "eventId": {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "TEDx Jakarta",
        "type": "Main Event",
        "date": "2023-10-15T07:00:00.000Z",
        "price": 150000
      }
    },
    "amount": 150000,
    "paymentMethod": "bca_va",
    "status": "pending",
    "transactionId": "123456789",
    "midtransOrderId": "ORDER-123456789",
    "midtransTransactionId": "123456789",
    "expiredAt": "2023-09-21T14:00:00.000Z",
    "createdAt": "2023-09-20T14:00:00.000Z",
    "updatedAt": "2023-09-20T14:00:00.000Z"
  }
}
```

## Endpoint Admin

### 1. Dashboard Admin
```
GET /api/admin/dashboard
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Dashboard statistics retrieved",
  "data": {
    "totalEvents": 5,
    "activeEvents": 4,
    "totalRegistrations": 150,
    "paidRegistrations": 120,
    "pendingRegistrations": 30,
    "totalRevenue": 12750000,
    "attendedCount": 80,
    "attendanceRate": "66.67",
    "eventStats": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "name": "TEDx Jakarta",
        "type": "Main Event",
        "date": "2023-10-15T07:00:00.000Z",
        "quota": 100,
        "registeredCount": 45,
        "price": 150000,
        "totalRegistrations": 45,
        "paidRegistrations": 35
      },
      // ...more events
    ]
  }
}
```

### 2. Mendapatkan Semua Registrasi (Admin)
```
GET /api/admin/registrations
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- page: halaman (default: 1)
- limit: jumlah data per halaman (default: 10)
- sortBy: field untuk sorting (default: createdAt)
- sortOrder: urutan sorting (1 atau -1, default: -1)
- status: filter berdasarkan status
- eventId: filter berdasarkan event
- search: pencarian berdasarkan nama, email, atau nomor registrasi

**Response Success:**
```json
{
  "status": "success",
  "message": "Registrations retrieved successfully",
  "data": {
    "registrations": [
      {
        "_id": "60d21b4667d0d8992e610c88",
        "fullName": "Budi Santoso",
        "email": "budi@example.com",
        "phoneNumber": "081234567890",
        "gender": "Laki-laki",
        "age": 25,
        "foodAllergy": "Kacang",
        "eventId": {
          "_id": "60d21b4667d0d8992e610c85",
          "name": "TEDx Jakarta",
          "type": "Main Event",
          "date": "2023-10-15T07:00:00.000Z",
          "price": 150000
        },
        "registrationNumber": "ME-230920-1234",
        "status": "paid",
        "attendanceStatus": "not_attended",
        "registrationDate": "2023-09-20T12:00:00.000Z",
        "createdAt": "2023-09-20T12:00:00.000Z",
        "updatedAt": "2023-09-20T15:00:00.000Z"
      },
      // ...more registrations
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 10,
      "pages": 15
    }
  }
}
```

### 3. Mengupdate Registrasi (Admin)
```
PUT /api/admin/registrations/:id
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "fullName": "Budi Santoso Update",
  "email": "budi.update@example.com",
  "status": "paid",
  "attendanceStatus": "attended"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Registration updated successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c88",
    "fullName": "Budi Santoso Update",
    "email": "budi.update@example.com",
    "phoneNumber": "081234567890",
    "gender": "Laki-laki",
    "age": 25,
    "foodAllergy": "Kacang",
    "eventId": {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "TEDx Jakarta",
      "type": "Main Event",
      "date": "2023-10-15T07:00:00.000Z",
      "price": 150000
    },
    "registrationNumber": "ME-230920-1234",
    "status": "paid",
    "attendanceStatus": "attended",
    "registrationDate": "2023-09-20T12:00:00.000Z",
    "createdAt": "2023-09-20T12:00:00.000Z",
    "updatedAt": "2023-09-20T16:00:00.000Z"
  }
}
```

### 4. Menghapus Registrasi (Admin)
```
DELETE /api/admin/registrations/:id
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Registration deleted successfully"
}
```

### 5. Mendapatkan Semua Pembayaran (Admin)
```
GET /api/admin/payments
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- page: halaman (default: 1)
- limit: jumlah data per halaman (default: 10)
- sortBy: field untuk sorting (default: createdAt)
- sortOrder: urutan sorting (1 atau -1, default: -1)
- status: filter berdasarkan status
- paymentMethod: filter berdasarkan metode pembayaran
- registrationId: filter berdasarkan registrasi

**Response Success:**
```json
{
  "status": "success",
  "message": "Payments retrieved successfully",
  "data": {
    "payments": [
      {
        "_id": "60d21b4667d0d8992e610c92",
        "registrationId": {
          "_id": "60d21b4667d0d8992e610c88",
          "fullName": "Budi Santoso Update",
          "email": "budi.update@example.com",
          "registrationNumber": "ME-230920-1234",
          "eventId": {
            "_id": "60d21b4667d0d8992e610c85",
            "name": "TEDx Jakarta",
            "type": "Main Event",
            "date": "2023-10-15T07:00:00.000Z"
          }
        },
        "amount": 150000,
        "paymentMethod": "bca_va",
        "status": "success",
        "transactionId": "123456789",
        "paymentDate": "2023-09-20T15:00:00.000Z",
        "midtransOrderId": "ORDER-123456789",
        "midtransTransactionId": "123456789",
        "createdAt": "2023-09-20T14:00:00.000Z",
        "updatedAt": "2023-09-20T15:00:00.000Z"
      },
      // ...more payments
    ],
    "pagination": {
      "total": 120,
      "page": 1,
      "limit": 10,
      "pages": 12
    }
  }
}
```

### 6. Mengupdate Status Pembayaran (Admin)
```
PUT /api/admin/payments/:id/status
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "status": "success"
}
```

**Response Success:**
```json
{
  "status": "success",
  "message": "Payment status updated successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c94",
    "registrationId": {
      "_id": "60d21b4667d0d8992e610c95",
      "fullName": "Ana Wijaya",
      "email": "ana@example.com",
      "registrationNumber": "PE2-230920-9012",
      "status": "paid",
      "eventId": {
        "_id": "60d21b4667d0d8992e610c87",
        "name": "TEDx Networking Night Updated",
        "type": "Pre Event Day 2",
        "date": "2023-10-10T18:00:00.000Z"
      }
    },
    "amount": 75000,
    "paymentMethod": "qris",
    "status": "success",
    "transactionId": "987654321",
    "paymentDate": "2023-09-20T17:00:00.000Z",
    "midtransOrderId": "ORDER-987654321",
    "midtransTransactionId": "987654321",
    "createdAt": "2023-09-20T16:30:00.000Z",
    "updatedAt": "2023-09-20T17:00:00.000Z"
  }
}
```

### 7. Mendapatkan Laporan Kehadiran (Admin)
```
GET /api/admin/reports/attendance
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- eventId: filter berdasarkan event (opsional)

**Response Success:**
```json
{
  "status": "success",
  "message": "Attendance report generated successfully",
  "data": [
    {
      "eventName": "TEDx Jakarta",
      "eventDate": "2023-10-15T07:00:00.000Z",
      "attendees": [
        {
          "registrationNumber": "ME-230920-1234",
          "fullName": "Budi Santoso Update",
          "email": "budi.update@example.com",
          "phoneNumber": "081234567890",
          "gender": "Laki-laki",
          "age": 25,
          "foodAllergy": "Kacang",
          "attendanceStatus": "attended"
        },
        // ...more attendees
      ],
      "stats": {
        "totalRegistered": 45,
        "attended": 30,
        "notAttended": 15,
        "attendanceRate": "66.67"
      }
    },
    // ...more events
  ]
}
```

### 8. Mendapatkan Laporan Keuangan (Admin)
```
GET /api/admin/reports/financial
```

**Request Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- startDate: tanggal mulai (format: YYYY-MM-DD)
- endDate: tanggal akhir (format: YYYY-MM-DD)

**Response Success:**
```json
{
  "status": "success",
  "message": "Financial report generated successfully",
  "data": {
    "totalRevenue": 12750000,
    "eventBreakdown": [
      {
        "eventName": "TEDx Jakarta",
        "transactions": 35,
        "revenue": 5250000,
        "payments": [
          {
            "paymentId": "60d21b4667d0d8992e610c92",
            "amount": 150000,
            "paymentMethod": "bca_va",
            "paymentDate": "2023-09-20T15:00:00.000Z",
            "registrationNumber": "ME-230920-1234",
            "fullName": "Budi Santoso Update",
            "email": "budi.update@example.com"
          },
          // ...more payments
        ]
      },
      // ...more events
    ],
    "paymentMethodSummary": [
      {
        "method": "bca_va",
        "count": 70,
        "amount": 7500000
      },
      {
        "method": "qris",
        "count": 50,
        "amount": 5250000
      },
      {
        "method": "free",
        "count": 30,
        "amount": 0
      }
    ],
    "period": {
      "startDate": "2023-09-01",
      "endDate": "2023-09-30"
    }
  }
}
```

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