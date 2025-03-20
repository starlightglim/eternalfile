const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io instance
let io;

// Initialize Socket.io with the HTTP server
const initialize = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3004',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });
  
  // Connection event
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    
    // Join user's personal room for private messages
    socket.join(socket.user.id);
    
    // Handle joining board rooms
    socket.on('board:join', (boardId) => {
      socket.join(`board:${boardId}`);
      console.log(`${socket.user.username} joined board: ${boardId}`);
      
      // Notify others in the room
      socket.to(`board:${boardId}`).emit('user:joined', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Handle leaving board rooms
    socket.on('board:leave', (boardId) => {
      socket.leave(`board:${boardId}`);
      console.log(`${socket.user.username} left board: ${boardId}`);
      
      // Notify others in the room
      socket.to(`board:${boardId}`).emit('user:left', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });
    
    // Handle image position updates
    socket.on('image:move', (data) => {
      // Broadcast to all clients in the board room except sender
      socket.to(`board:${data.boardId}`).emit('image:moved', {
        imageId: data.imageId,
        position: data.position,
        userId: socket.user.id
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });
  
  return io;
};

// Get the io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  init: initialize,
  getIO
}; 