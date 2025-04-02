const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();

connectDB();

const createAdminUser = async () => {
  try {
    console.log('Creating admin user...');

    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      console.log('Admin user already exists, skipping creation');
      process.exit(0);
    }

    const adminData = {
      name: 'Admin',
      email: 'admin@example.com',
      password: 'adminpassword123', 
      role: 'admin'
    };

    const admin = await User.create(adminData);

    console.log(`Admin user created with email: ${admin.email}`);
    console.log('Please change the default password immediately after login');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();