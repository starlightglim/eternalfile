require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const socketio = require('./services/socketio');
const s3Service = require('./services/s3Service');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const boardRoutes = require('./routes/board');
const folderRoutes = require('./routes/folder');
const fileRoutes = require('./routes/file');
const aiRoutes = require('./routes/ai');

// Import socket handler
const setupSocketHandlers = require('./socket');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Create Express app
const app = express();
const server = http.createServer(app);

// Setup rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(express.json({ limit: '50mb' })); // Parse JSON request body
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3004',
  credentials: true
}));
app.use('/api', limiter); // Apply rate limiting to all API routes
app.use(mongoSanitize()); // Sanitize inputs against NoSQL query injection

// Setup socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3004',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize socket handlers
setupSocketHandlers(io);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Demo endpoint for quickly testing API connectivity
app.get('/api/demo', (req, res) => {
  res.status(200).json({
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Set port
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
const connectDB = async () => {
  try {
    // Only try to connect if MONGODB_URI is defined
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      logger.info('MongoDB connected');
    } else {
      logger.warn('MONGODB_URI not defined, skipping database connection');
    }
  } catch (error) {
    logger.error('MongoDB connection error:', error);
  }
};

// Start server function
const startServer = async () => {
  try {
    // Connect to MongoDB if URI is provided
    if (process.env.MONGODB_URI && process.env.MONGODB_URI !== 'skip') {
      await connectDB();
    } else {
      logger.info('Running in demo mode without MongoDB');
    }

    // Start the server
    server.listen(PORT, () => {
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed');
    // Close database connection if it's open
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close(false, () => {
        logger.info('MongoDB connection closed');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });

  // Force close if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000); // 10 seconds
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

// Start the server
startServer();

// Create temp directory if it doesn't exist
const fs = require('fs');
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Routes
app.use('/api/images', require('./routes/images'));
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

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

module.exports = { app, server }; 