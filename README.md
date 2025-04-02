 # TEDxUC Registration App

Panduan ini berisi instruksi untuk menginstal, mengonfigurasi, dan menjalankan aplikasi TEDxUC Registration App.

## Instalasi dan Konfigurasi

1. **Clone repository atau ekstrak file ke folder pilihan Anda**
   ```bash
   git clone https://github.com/dickyalf/tedx-reg.git
   cd tedx-reg
   ```

2. **Instal dependensi**
   ```bash
   npm install
   ```

3. **Buat file .env berdasarkan template yang sudah disediakan**
   ```bash
   cp .env.example .env
   ```

4. **Sesuaikan konfigurasi di file .env**:
   ```
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/database_name
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   JWT_EXPIRE=30d

   # Midtrans configuration
   MIDTRANS_SERVER_KEY=your_midtrans_server_key
   MIDTRANS_CLIENT_KEY=your_midtrans_client_key
   MIDTRANS_API_URL=https://api.sandbox.midtrans.com
   MIDTRANS_APP_URL=https://app.sandbox.midtrans.com

   # Email configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_app_password
   EMAIL_FROM=noreply@yourdomain.com

   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000
   ```

5. **Pastikan MongoDB sudah berjalan di komputer Anda atau gunakan MongoDB Atlas**

## Menjalankan Aplikasi

### Mode Development
```bash
npm run dev
```

### Mode Production
```bash
npm start
```

## Konfigurasi Midtrans

1. Daftar akun di [Midtrans](https://midtrans.com/)
2. Masuk ke dashboard Midtrans
3. Dapatkan Server Key dan Client Key (gunakan Sandbox untuk testing)
4. Tambahkan konfigurasi di file .env
5. Setup Webhook URL di dashboard Midtrans:
   ```
   https://your-domain.com/api/payments/webhook
   ```

## Mengatur Email

1. Jika menggunakan Gmail, aktifkan "Less secure app access" atau buat App Password
2. Update konfigurasi email di file .env

## Endpoints API

### Events
- `GET /api/events` - Get semua event yang aktif
- `GET /api/events/:id` - Get event berdasarkan ID
- `POST /api/events` - Buat event baru (admin only)
- `PUT /api/events/:id` - Update event (admin only)
- `DELETE /api/events/:id` - Nonaktifkan event (admin only)

### Registrations
- `POST /api/registrations` - Daftar ke event
- `GET /api/registrations/:id` - Get registrasi berdasarkan ID
- `GET /api/registrations/number/:regNumber` - Get registrasi berdasarkan nomor registrasi
- `GET /api/registrations/event/:eventId` - Get semua registrasi berdasarkan event ID (admin only)
- `PUT /api/registrations/:id/attend` - Catat kehadiran (admin only)
- `POST /api/registrations/verify-qr` - Verifikasi QR Code (admin only)

### Payments
- `POST /api/payments` - Buat pembayaran baru
- `GET /api/payments/:id` - Get pembayaran berdasarkan ID
- `GET /api/payments/registration/:registrationId` - Get pembayaran berdasarkan registration ID
- `POST /api/payments/webhook` - Endpoint untuk webhook Midtrans

## Keamanan

- Pastikan untuk mengubah `JWT_SECRET` dengan nilai yang kompleks di production
- Gunakan HTTPS di production
- Batasi akses API dengan CORS yang sesuai
- Rate limiting sudah terpasang di semua endpoint API

# Panduan Autentikasi Admin

## Membuat Admin Pertama

Setelah menginstal dan mengkonfigurasi aplikasi, Anda perlu membuat user admin pertama dengan menjalankan script:

```bash
node scripts/createAdminUser.js
```

Script ini akan membuat akun admin dengan kredensial berikut:
- Email: admin@example.com
- Password: adminpassword123

**PENTING**: Segera ubah password default setelah login pertama kali!

## API Endpoints Autentikasi

### Registrasi User
```
POST /api/auth/register
```
Body:
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123"
}
```

### Login
```
POST /api/auth/login
```
Body:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Response akan menyertakan token JWT yang harus disertakan dalam header Authorization untuk akses ke endpoint yang dilindungi.

### Mendapatkan Profil User
```
GET /api/auth/me
```
Header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Mengubah Password
```
PUT /api/auth/changepassword
```
Header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```
Body:
```json
{
  "currentPassword": "password123",
  "newPassword": "newPassword123"
}
```

### Registrasi Admin Baru (Admin only)
```
POST /api/auth/register-admin
```
Header:
```
Authorization: Bearer ADMIN_JWT_TOKEN
```
Body:
```json
{
  "name": "Admin Name",
  "email": "admin2@example.com",
  "password": "adminPassword123",
  "role": "admin"
}
```

## Menggunakan Token JWT

Setelah login, Anda akan menerima token JWT. Gunakan token ini untuk mengakses endpoint yang memerlukan autentikasi dengan menyertakannya di header Authorization:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Token ini harus disertakan untuk semua endpoint admin, seperti:
- Membuat event baru
- Mengupdate event
- Menghapus event
- Melihat semua registrasi
- dll.

## Keamanan

- Token JWT akan kedaluwarsa setelah periode waktu tertentu (dikonfigurasi di JWT_EXPIRE pada file .env)
- Password disimpan dalam bentuk hash menggunakan bcrypt
- Validasi input diterapkan untuk mencegah injeksi dan data tidak valid
- Rate limiting diterapkan untuk mencegah brute force