const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const logger = require('../utils/logger');

/**
 * @desc    Register admin (hanya admin yang bisa membuat admin baru)
 * @route   POST /api/auth/register-admin
 * @access  Private/Admin
 */
const registerAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json(
        errorResponse('Email sudah terdaftar')
      );
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    return res.status(201).json(
      successResponse('Admin berhasil didaftarkan', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    );
  } catch (error) {
    logger.error(`Error in registerAdmin: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json(
        errorResponse('Mohon masukkan email dan password')
      );
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    if (user.role !== 'admin') {
      return res.status(403).json(
        errorResponse('Akses tidak diizinkan')
      );
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json(
        errorResponse('Email atau password salah')
      );
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = user.getSignedJwtToken();

    return res.status(200).json(
      successResponse('Login berhasil', {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      })
    );
  } catch (error) {
    logger.error(`Error in login: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Get current logged in admin
 * @route   GET /api/auth/me
 * @access  Private/Admin
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    return res.status(200).json(
      successResponse('Data admin berhasil diambil', {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      })
    );
  } catch (error) {
    logger.error(`Error in getMe: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/auth/changepassword
 * @access  Private/Admin
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json(
        errorResponse('Mohon masukkan password lama dan baru')
      );
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json(
        errorResponse('User tidak ditemukan')
      );
    }

    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json(
        errorResponse('Password lama salah')
      );
    }

    if (newPassword.length < 6) {
      return res.status(400).json(
        errorResponse('Password baru minimal 6 karakter')
      );
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json(
      successResponse('Password berhasil diubah')
    );
  } catch (error) {
    logger.error(`Error in changePassword: ${error.message}`);
    return res.status(500).json(
      errorResponse('Server error')
    );
  }
};

module.exports = {
  registerAdmin,
  login,
  getMe,
  changePassword
};