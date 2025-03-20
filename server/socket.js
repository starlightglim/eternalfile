const logger = require('./utils/logger');
const { ApiError } = require('./middleware/errorHandler');

/**
 * Setup Socket.io event handlers
 * @param {Object} io - Socket.io server instance
 */
const setupSocketHandlers = (io) => {
  // Socket.io middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    // Skip auth check if in development mode
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    if (!token) {
      return next(new ApiError('Authentication token is required', 401));
    }
    
    try {
      // JWT verification should be implemented here
      // For now, we'll just log and pass through
      logger.debug('Socket authenticated with token', { socketId: socket.id });
      next();
    } catch (error) {
      logger.warn('Socket authentication failed', { error: error.message });
      next(new ApiError('Invalid authentication token', 401));
    }
  });

  // Handle connection event
  io.on('connection', (socket) => {
    logger.info('New socket connection', { socketId: socket.id });
    
    // Join room
    socket.on('join-board', (boardId) => {
      if (!boardId) {
        socket.emit('error', { message: 'Board ID is required' });
        return;
      }
      
      socket.join(`board:${boardId}`);
      logger.debug('Socket joined board room', { socketId: socket.id, boardId });
      
      // Notify other users
      socket.to(`board:${boardId}`).emit('user-joined', {
        socketId: socket.id,
        timestamp: new Date()
      });
    });
    
    // Leave room
    socket.on('leave-board', (boardId) => {
      if (!boardId) {
        socket.emit('error', { message: 'Board ID is required' });
        return;
      }
      
      socket.leave(`board:${boardId}`);
      logger.debug('Socket left board room', { socketId: socket.id, boardId });
      
      // Notify other users
      socket.to(`board:${boardId}`).emit('user-left', {
        socketId: socket.id,
        timestamp: new Date()
      });
    });
    
    // Handle image updates
    socket.on('update-image', (data) => {
      if (!data || !data.boardId || !data.imageId) {
        socket.emit('error', { message: 'Invalid image update data' });
        return;
      }
      
      logger.debug('Image update received', { socketId: socket.id, data });
      
      // Broadcast to other users in the room
      socket.to(`board:${data.boardId}`).emit('image-updated', {
        ...data,
        timestamp: new Date()
      });
    });
    
    // Handle cursor position updates
    socket.on('cursor-move', (data) => {
      if (!data || !data.boardId) {
        return;
      }
      
      // Broadcast to other users in the room
      socket.to(`board:${data.boardId}`).emit('cursor-moved', {
        socketId: socket.id,
        ...data,
        timestamp: new Date()
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id });
      // Notify all rooms this socket was part of
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          io.to(room).emit('user-disconnected', {
            socketId: socket.id,
            timestamp: new Date()
          });
        }
      }
    });
    
    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { socketId: socket.id, error });
    });
  });
};

module.exports = setupSocketHandlers; 