import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  sidebarOpen: true,
  currentView: 'boards', // 'boards', 'images', 'folders', 'settings'
  theme: localStorage.getItem('theme') || 'system',
  notifications: {
    list: [],
    unreadCount: 0
  },
  modals: {
    createBoard: false,
    createFolder: false,
    uploadImage: false,
    shareBoard: false,
    shareFolder: false,
    imageCombiner: false,
    settings: false,
    confirmDelete: {
      open: false,
      type: null, // 'board', 'folder', 'image'
      id: null,
      name: null
    }
  },
  imageBoard: {
    zoom: 1,
    pan: { x: 0, y: 0 },
    grid: {
      show: false,
      size: 20,
      snap: false
    }
  },
  toast: {
    open: false,
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    duration: 3000
  }
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setCurrentView: (state, action) => {
      state.currentView = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    addNotification: (state, action) => {
      state.notifications.list.unshift(action.payload);
      state.notifications.unreadCount += 1;
    },
    markNotificationsAsRead: (state) => {
      state.notifications.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications.list = [];
      state.notifications.unreadCount = 0;
    },
    openModal: (state, action) => {
      const { modal, data } = action.payload;
      
      if (modal === 'confirmDelete') {
        state.modals.confirmDelete = {
          open: true,
          ...data
        };
      } else {
        state.modals[modal] = true;
      }
    },
    closeModal: (state, action) => {
      const modal = action.payload;
      
      if (modal === 'confirmDelete') {
        state.modals.confirmDelete.open = false;
      } else {
        state.modals[modal] = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        if (key === 'confirmDelete') {
          state.modals[key].open = false;
        } else {
          state.modals[key] = false;
        }
      });
    },
    setZoom: (state, action) => {
      state.imageBoard.zoom = action.payload;
    },
    setPan: (state, action) => {
      state.imageBoard.pan = action.payload;
    },
    setGridSettings: (state, action) => {
      state.imageBoard.grid = {
        ...state.imageBoard.grid,
        ...action.payload
      };
    },
    showToast: (state, action) => {
      state.toast = {
        open: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
        duration: action.payload.duration || 3000
      };
    },
    hideToast: (state) => {
      state.toast.open = false;
    },
    resetUI: () => initialState
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setCurrentView,
  setTheme,
  addNotification,
  markNotificationsAsRead,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals,
  setZoom,
  setPan,
  setGridSettings,
  showToast,
  hideToast,
  resetUI
} = uiSlice.actions;

export default uiSlice.reducer; 