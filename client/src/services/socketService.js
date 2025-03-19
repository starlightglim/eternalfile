import { io } from 'socket.io-client';
import { store } from '../store';
import {
  updateBoardLocally
} from '../store/slices/boardsSlice';
import {
  updateImagePositionLocally,
  setProcessingStatus
} from '../store/slices/imagesSlice';
import {
  addNotification,
  showToast
} from '../store/slices/uiSlice';

// Socket.io instance
let socket;

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Development mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Initialize Socket.io connection
export const initSocket = (token) => {
  // In development mode with mock auth, we can make socket connection optional
  if (DEV_MODE && token === 'mock-token') {
    console.log('Development mode: Using mock socket connection');
    return null;
  }
  
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(API_URL, {
    auth: { token },
    withCredentials: true,
    transports: ['websocket', 'polling']
  });
  
  // Connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });
  
  // Board events
  socket.on('board:update', (data) => {
    store.dispatch(updateBoardLocally({
      boardId: data.boardId,
      updates: data.updates
    }));
  });
  
  socket.on('board:delete', (data) => {
    store.dispatch(showToast({
      message: 'Board has been deleted',
      type: 'info'
    }));
  });
  
  socket.on('board:collaborator:add', (data) => {
    store.dispatch(showToast({
      message: 'New collaborator added to board',
      type: 'info'
    }));
  });
  
  socket.on('board:collaborator:remove', (data) => {
    store.dispatch(showToast({
      message: 'Collaborator removed from board',
      type: 'info'
    }));
  });
  
  // Image events
  socket.on('image:add', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: 'image-add',
      message: 'New image added to board',
      timestamp: new Date(),
      data
    }));
  });
  
  socket.on('image:update', (data) => {
    // Handle image update
  });
  
  socket.on('image:moved', (data) => {
    store.dispatch(updateImagePositionLocally({
      imageId: data.imageId,
      position: data.position
    }));
  });
  
  socket.on('image:delete', (data) => {
    // Handle image deletion
  });
  
  // Processing events
  socket.on('image:processing', (data) => {
    store.dispatch(setProcessingStatus({
      isProcessing: data.status !== 'completed' && data.status !== 'error',
      progress: data.progress,
      jobId: data.jobId,
      status: data.status,
      error: data.error
    }));
    
    if (data.status === 'completed') {
      store.dispatch(showToast({
        message: 'Image combination completed',
        type: 'success'
      }));
    } else if (data.status === 'error') {
      store.dispatch(showToast({
        message: 'Image combination failed',
        type: 'error'
      }));
    }
  });
  
  // Feed events
  socket.on('feed:update', (data) => {
    store.dispatch(addNotification({
      id: Date.now(),
      type: data.type,
      message: getFeedMessage(data),
      timestamp: new Date(),
      data
    }));
  });
  
  // User events
  socket.on('user:joined', (data) => {
    store.dispatch(showToast({
      message: `${data.username} joined the board`,
      type: 'info'
    }));
  });
  
  socket.on('user:left', (data) => {
    store.dispatch(showToast({
      message: `${data.username} left the board`,
      type: 'info'
    }));
  });
  
  return socket;
};

// Join a board room
export const joinBoard = (boardId) => {
  if (DEV_MODE && !socket) {
    console.log('Development mode: Mock joining board', boardId);
    return;
  }
  
  if (socket && socket.connected) {
    socket.emit('board:join', boardId);
  }
};

// Leave a board room
export const leaveBoard = (boardId) => {
  if (DEV_MODE && !socket) {
    console.log('Development mode: Mock leaving board', boardId);
    return;
  }
  
  if (socket && socket.connected) {
    socket.emit('board:leave', boardId);
  }
};

// Send image position update
export const sendImageMove = (boardId, imageId, position) => {
  if (DEV_MODE && !socket) {
    console.log('Development mode: Mock image move', { boardId, imageId, position });
    return;
  }
  
  if (socket && socket.connected) {
    socket.emit('image:move', {
      boardId,
      imageId,
      position
    });
  }
};

// Disconnect socket
export const disconnectSocket = () => {
  if (DEV_MODE && !socket) {
    console.log('Development mode: Mock socket disconnection');
    return;
  }
  
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Helper to get feed message
const getFeedMessage = (data) => {
  switch (data.type) {
    case 'new-board':
      return `${data.username} created a new board: ${data.boardTitle}`;
    case 'new-image':
      return `${data.username} added a new image to ${data.boardTitle}`;
    case 'new-ai-image':
      return `${data.username} created an AI-combined image in ${data.boardTitle}`;
    default:
      return 'New activity in your feed';
  }
};

const socketService = {
  initSocket,
  joinBoard,
  leaveBoard,
  sendImageMove,
  disconnectSocket
};

export default socketService; 