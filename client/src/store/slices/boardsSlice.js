import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Development mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Mock data for development
const MOCK_BOARDS = [
  {
    _id: 'mock-board-1',
    title: 'Demo Board 1',
    description: 'This is a demo board for development',
    thumbnail: 'https://source.unsplash.com/random/300x200?abstract',
    isPublic: true,
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
    collaborators: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageCount: 5
  },
  {
    _id: 'mock-board-2',
    title: 'Demo Board 2',
    description: 'Another demo board with AI-generated images',
    thumbnail: 'https://source.unsplash.com/random/300x200?digital',
    isPublic: false,
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
    collaborators: [],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    imageCount: 8
  },
  {
    _id: 'mock-board-3',
    title: 'Inspiration Collection',
    description: 'A collection of inspiring images',
    thumbnail: 'https://source.unsplash.com/random/300x200?inspiration',
    isPublic: true,
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
    collaborators: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    imageCount: 12
  }
];

const MOCK_BOARD_DETAILS = {
  _id: 'mock-board-1',
  title: 'Demo Board 1',
  description: 'This is a demo board for development',
  thumbnail: 'https://source.unsplash.com/random/300x200?abstract',
  isPublic: true,
  owner: {
    _id: 'mock-user-id',
    username: '@demouser'
  },
  collaborators: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [
    {
      _id: 'mock-image-1',
      url: 'https://source.unsplash.com/random/800x600?nature',
      thumbnail: 'https://source.unsplash.com/random/300x200?nature',
      title: 'Nature Image',
      description: 'A beautiful nature scene',
      position: { x: 100, y: 100, z: 0 },
      dimensions: { width: 300, height: 200 },
      tags: ['nature', 'landscape'],
      createdAt: new Date().toISOString()
    },
    {
      _id: 'mock-image-2',
      url: 'https://source.unsplash.com/random/800x600?city',
      thumbnail: 'https://source.unsplash.com/random/300x200?city',
      title: 'City Skyline',
      description: 'Urban landscape at sunset',
      position: { x: 450, y: 100, z: 0 },
      dimensions: { width: 300, height: 200 },
      tags: ['city', 'urban', 'sunset'],
      createdAt: new Date().toISOString()
    },
    {
      _id: 'mock-image-3',
      url: 'https://source.unsplash.com/random/800x600?abstract',
      thumbnail: 'https://source.unsplash.com/random/300x200?abstract',
      title: 'Abstract Art',
      description: 'Digital abstract artwork',
      position: { x: 100, y: 350, z: 0 },
      dimensions: { width: 300, height: 200 },
      tags: ['abstract', 'digital', 'art'],
      createdAt: new Date().toISOString()
    },
    {
      _id: 'mock-image-4',
      url: 'https://source.unsplash.com/random/800x600?portrait',
      thumbnail: 'https://source.unsplash.com/random/300x200?portrait',
      title: 'Portrait',
      description: 'Artistic portrait photography',
      position: { x: 450, y: 350, z: 0 },
      dimensions: { width: 300, height: 200 },
      tags: ['portrait', 'photography'],
      createdAt: new Date().toISOString()
    },
    {
      _id: 'mock-image-5',
      url: 'https://source.unsplash.com/random/800x600?technology',
      thumbnail: 'https://source.unsplash.com/random/300x200?technology',
      title: 'Technology',
      description: 'Modern technology concept',
      position: { x: 275, y: 600, z: 0 },
      dimensions: { width: 300, height: 200 },
      tags: ['technology', 'modern'],
      createdAt: new Date().toISOString()
    }
  ]
};

// Async thunks
export const fetchBoards = createAsyncThunk(
  'boards/fetchBoards',
  async (folderId, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Using mock boards data');
      return { boards: MOCK_BOARDS };
    }
    
    try {
      const url = folderId 
        ? `${API_URL}/boards?folderId=${folderId}` 
        : `${API_URL}/boards`;
        
      const response = await axios.get(url, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch boards');
    }
  }
);

export const fetchPublicBoards = createAsyncThunk(
  'boards/fetchPublicBoards',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/boards/public?page=${page}&limit=${limit}`);
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public boards');
    }
  }
);

export const fetchBoardById = createAsyncThunk(
  'boards/fetchBoardById',
  async (boardId, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Using mock board details');
      // If the requested board ID matches one of our mock boards, return it
      if (boardId === 'mock-board-1') {
        return { board: MOCK_BOARD_DETAILS };
      }
      return { board: { ...MOCK_BOARD_DETAILS, _id: boardId, title: `Demo Board (${boardId})` } };
    }
    
    try {
      const response = await axios.get(`${API_URL}/boards/${boardId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch board');
    }
  }
);

export const createBoard = createAsyncThunk(
  'boards/createBoard',
  async (boardData, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Creating mock board');
      const newBoard = {
        _id: `mock-board-${Date.now()}`,
        title: boardData.title,
        description: boardData.description || 'Mock board description',
        thumbnail: 'https://source.unsplash.com/random/300x200?board',
        isPublic: boardData.isPublic || false,
        owner: {
          _id: 'mock-user-id',
          username: '@demouser'
        },
        collaborators: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageCount: 0
      };
      return { board: newBoard };
    }
    
    try {
      const response = await axios.post(`${API_URL}/boards`, boardData, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create board');
    }
  }
);

export const updateBoard = createAsyncThunk(
  'boards/updateBoard',
  async ({ boardId, boardData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/boards/${boardId}`, boardData, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update board');
    }
  }
);

export const deleteBoard = createAsyncThunk(
  'boards/deleteBoard',
  async (boardId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/boards/${boardId}`, {
        withCredentials: true
      });
      
      return boardId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete board');
    }
  }
);

export const addCollaborator = createAsyncThunk(
  'boards/addCollaborator',
  async ({ boardId, userId, role }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/boards/${boardId}/collaborators`, {
        userId,
        role
      }, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add collaborator');
    }
  }
);

export const removeCollaborator = createAsyncThunk(
  'boards/removeCollaborator',
  async ({ boardId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/boards/${boardId}/collaborators/${userId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove collaborator');
    }
  }
);

// Initial state
const initialState = {
  boards: [],
  publicBoards: [],
  currentBoard: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    pages: 1,
    currentPage: 1
  }
};

// Boards slice
const boardsSlice = createSlice({
  name: 'boards',
  initialState,
  reducers: {
    clearBoardsError: (state) => {
      state.error = null;
    },
    clearCurrentBoard: (state) => {
      state.currentBoard = null;
    },
    updateBoardLocally: (state, action) => {
      if (state.currentBoard && state.currentBoard._id === action.payload.boardId) {
        state.currentBoard = {
          ...state.currentBoard,
          ...action.payload.updates
        };
      }
      
      state.boards = state.boards.map(board => 
        board._id === action.payload.boardId
          ? { ...board, ...action.payload.updates }
          : board
      );
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch boards
      .addCase(fetchBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = action.payload.boards;
      })
      .addCase(fetchBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch public boards
      .addCase(fetchPublicBoards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicBoards.fulfilled, (state, action) => {
        state.loading = false;
        state.publicBoards = action.payload.boards;
        state.pagination = {
          total: action.payload.total,
          pages: action.payload.pages,
          currentPage: action.payload.currentPage
        };
      })
      .addCase(fetchPublicBoards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch board by ID
      .addCase(fetchBoardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBoardById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBoard = action.payload.board;
      })
      .addCase(fetchBoardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create board
      .addCase(createBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards.unshift(action.payload.board);
      })
      .addCase(createBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update board
      .addCase(updateBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBoard.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in boards array
        state.boards = state.boards.map(board => 
          board._id === action.payload.board._id
            ? action.payload.board
            : board
        );
        
        // Update current board if it's the same
        if (state.currentBoard && state.currentBoard._id === action.payload.board._id) {
          state.currentBoard = action.payload.board;
        }
      })
      .addCase(updateBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete board
      .addCase(deleteBoard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBoard.fulfilled, (state, action) => {
        state.loading = false;
        state.boards = state.boards.filter(board => board._id !== action.payload);
        
        // Clear current board if it's the deleted one
        if (state.currentBoard && state.currentBoard._id === action.payload) {
          state.currentBoard = null;
        }
      })
      .addCase(deleteBoard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add collaborator
      .addCase(addCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in boards array
        state.boards = state.boards.map(board => 
          board._id === action.payload.board._id
            ? action.payload.board
            : board
        );
        
        // Update current board if it's the same
        if (state.currentBoard && state.currentBoard._id === action.payload.board._id) {
          state.currentBoard = action.payload.board;
        }
      })
      .addCase(addCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove collaborator
      .addCase(removeCollaborator.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCollaborator.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in boards array
        state.boards = state.boards.map(board => 
          board._id === action.payload.board._id
            ? action.payload.board
            : board
        );
        
        // Update current board if it's the same
        if (state.currentBoard && state.currentBoard._id === action.payload.board._id) {
          state.currentBoard = action.payload.board;
        }
      })
      .addCase(removeCollaborator.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearBoardsError, clearCurrentBoard, updateBoardLocally } = boardsSlice.actions;

export default boardsSlice.reducer; 