require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eternalfile')
  .then(async () => {
    console.log('MongoDB connected');
    
    try {
      // Check if admin user already exists
      const existingAdmin = await User.findOne({ email: 'admin@example.com' });
      
      if (existingAdmin) {
        console.log('Admin user already exists');
      } else {
        // Create admin user
        const admin = new User({
          username: 'admin',
          email: 'admin@example.com',
          passwordHash: 'admin123', // This will be hashed by the pre-save hook
          role: 'admin',
          isVerified: true
        });
        
        await admin.save();
        console.log('Admin user created:');
        console.log({
          username: admin.username,
          email: admin.email,
          password: 'admin123'
        });
      }
      
      // Create demo user if it doesn't exist
      const existingDemo = await User.findOne({ email: 'demo@example.com' });
      
      if (existingDemo) {
        console.log('Demo user already exists');
      } else {
        // Create demo user
        const demo = new User({
          username: 'demo',
          email: 'demo@example.com',
          passwordHash: 'demo123', // This will be hashed by the pre-save hook
          role: 'user',
          isVerified: true
        });
        
        await demo.save();
        console.log('Demo user created:');
        console.log({
          username: demo.username,
          email: demo.email,
          password: 'demo123'
        });
      }
    } catch (error) {
      console.error('Error creating users:', error);
    } finally {
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 