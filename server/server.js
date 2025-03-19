const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const helmet = require('helmet');
const socketio = require('./services/socketio');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
socketio.init(server);

// Connect to MongoDB (with error handling)
const connectDB = async () => {
  try {
    // For development, we'll make MongoDB connection optional
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/spatial-image-board';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.log('Continuing without MongoDB for demo purposes...');
  }
};

connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3004',
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Create temp directory if it doesn't exist
const fs = require('fs');
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/images', require('./routes/images'));
app.use('/api/folders', require('./routes/folders'));
app.use('/api/combine', require('./services/imageCombineService'));

// API placeholder route for testing
app.get('/api/placeholder/:width/:height', (req, res) => {
  const { width, height } = req.params;
  const colors = ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  res.set('Content-Type', 'image/svg+xml');
  res.send(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" />
      <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle" dominant-baseline="middle">
        ${width}x${height}
      </text>
    </svg>
  `);
});

// Demo API route
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'API is working!',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }
  
  res.status(500).json({
    message: err.message || 'Something went wrong on the server'
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

module.exports = { app, server }; 