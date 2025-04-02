const { check } = require('express-validator');

const registrationValidators = [
  check('fullName')
    .trim()
    .notEmpty().withMessage('Nama lengkap harus diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama lengkap harus antara 2 dan 100 karakter'),
  
  check('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  check('phoneNumber')
    .trim()
    .notEmpty().withMessage('Nomor HP harus diisi')
    .matches(/^(\+\d{1,3}[- ]?)?\d{10,14}$/).withMessage('Nomor HP tidak valid'),
  
  check('gender')
    .trim()
    .notEmpty().withMessage('Gender harus diisi')
    .isIn(['Laki-laki', 'Perempuan']).withMessage('Gender harus Laki-laki atau Perempuan'),
  
  check('age')
    .notEmpty().withMessage('Usia harus diisi')
    .isInt({ min: 0 }).withMessage('Usia tidak valid'),
  
  check('eventId')
    .notEmpty().withMessage('Event ID harus diisi')
    .isMongoId().withMessage('Format Event ID tidak valid'),
  
  check('foodAllergy')
    .optional()
    .trim()
    .isString().withMessage('Format alergi makanan tidak valid')
];

const eventValidators = [
  check('name')
    .trim()
    .notEmpty().withMessage('Nama event harus diisi')
    .isLength({ min: 2, max: 100 }).withMessage('Nama event harus antara 2 dan 100 karakter'),
  
  check('type')
    .trim()
    .notEmpty().withMessage('Tipe event harus diisi')
    .isIn(['Pre Event Day 1', 'Pre Event Day 2', 'Main Event']).withMessage('Tipe event tidak valid'),
  
  check('date')
    .notEmpty().withMessage('Tanggal event harus diisi')
    .isISO8601().withMessage('Format tanggal tidak valid'),
  
  check('quota')
    .notEmpty().withMessage('Kuota peserta harus diisi')
    .isInt({ min: 1 }).withMessage('Kuota minimal 1 peserta'),
  
  check('price')
    .notEmpty().withMessage('Harga tiket harus diisi')
    .isFloat({ min: 0 }).withMessage('Harga tidak boleh negatif'),
  
  check('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Deskripsi maksimal 1000 karakter'),
  
  check('requireFoodAllergy')
    .optional()
    .isBoolean().withMessage('Format requireFoodAllergy tidak valid')
];

const paymentValidators = [
  check('registrationId')
    .notEmpty().withMessage('Registration ID harus diisi')
    .isMongoId().withMessage('Format Registration ID tidak valid'),
  
  check('paymentMethod')
    .trim()
    .notEmpty().withMessage('Metode pembayaran harus diisi')
    .isIn(['bca_va', 'qris']).withMessage('Metode pembayaran tidak valid')
];

const authValidators = {
  register: [
    check('name')
      .trim()
      .notEmpty().withMessage('Nama harus diisi')
      .isLength({ min: 2, max: 50 }).withMessage('Nama harus antara 2 dan 50 karakter'),
    
    check('email')
      .trim()
      .notEmpty().withMessage('Email harus diisi')
      .isEmail().withMessage('Format email tidak valid')
      .normalizeEmail(),
    
    check('password')
      .notEmpty().withMessage('Password harus diisi')
      .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    
    check('role')
      .optional()
      .isIn(['user', 'admin']).withMessage('Role tidak valid')
  ],
  
  login: [
    check('email')
      .trim()
      .notEmpty().withMessage('Email harus diisi')
      .isEmail().withMessage('Format email tidak valid'),
    
    check('password')
      .notEmpty().withMessage('Password harus diisi')
  ],
  
  changePassword: [
    check('currentPassword')
      .notEmpty().withMessage('Password lama harus diisi'),
    
    check('newPassword')
      .notEmpty().withMessage('Password baru harus diisi')
      .isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter')
  ]
};

module.exports = {
  registrationValidators,
  eventValidators,
  paymentValidators,
  authValidators
};