import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks
export const fetchFolders = createAsyncThunk(
  'folders/fetchFolders',
  async (parentId, { rejectWithValue }) => {
    try {
      const url = parentId !== undefined
        ? `${API_URL}/folders?parentId=${parentId}`
        : `${API_URL}/folders`;
        
      const response = await axios.get(url, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch folders');
    }
  }
);

export const fetchFolderById = createAsyncThunk(
  'folders/fetchFolderById',
  async (folderId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/folders/${folderId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch folder');
    }
  }
);

export const createFolder = createAsyncThunk(
  'folders/createFolder',
  async (folderData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/folders`, folderData, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create folder');
    }
  }
);

export const updateFolder = createAsyncThunk(
  'folders/updateFolder',
  async ({ folderId, folderData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/folders/${folderId}`, folderData, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update folder');
    }
  }
);

export const deleteFolder = createAsyncThunk(
  'folders/deleteFolder',
  async (folderId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/folders/${folderId}`, {
        withCredentials: true
      });
      
      return folderId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete folder');
    }
  }
);

export const shareFolder = createAsyncThunk(
  'folders/shareFolder',
  async ({ folderId, userId, permission }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/folders/${folderId}/share`, {
        userId,
        permission
      }, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to share folder');
    }
  }
);

export const removeShare = createAsyncThunk(
  'folders/removeShare',
  async ({ folderId, userId }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(`${API_URL}/folders/${folderId}/share/${userId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove share');
    }
  }
);

// Initial state
const initialState = {
  folders: [],
  currentFolder: null,
  subfolders: [],
  folderPath: [],
  loading: false,
  error: null
};

// Folders slice
const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    clearFoldersError: (state) => {
      state.error = null;
    },
    clearCurrentFolder: (state) => {
      state.currentFolder = null;
      state.subfolders = [];
      state.folderPath = [];
    },
    setFolderPath: (state, action) => {
      state.folderPath = action.payload;
    },
    addToFolderPath: (state, action) => {
      state.folderPath.push(action.payload);
    },
    removeLastFromFolderPath: (state) => {
      state.folderPath.pop();
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch folders
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload.folders;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch folder by ID
      .addCase(fetchFolderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentFolder = action.payload.folder;
        state.subfolders = action.payload.subfolders;
      })
      .addCase(fetchFolderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create folder
      .addCase(createFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.folders.push(action.payload.folder);
        
        // If this is a subfolder of the current folder, add to subfolders
        if (state.currentFolder && 
            action.payload.folder.parentId === state.currentFolder._id) {
          state.subfolders.push(action.payload.folder);
        }
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update folder
      .addCase(updateFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFolder.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in folders array
        state.folders = state.folders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update in subfolders array
        state.subfolders = state.subfolders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update current folder if it's the same
        if (state.currentFolder && state.currentFolder._id === action.payload.folder._id) {
          state.currentFolder = action.payload.folder;
        }
      })
      .addCase(updateFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete folder
      .addCase(deleteFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = state.folders.filter(folder => folder._id !== action.payload);
        state.subfolders = state.subfolders.filter(folder => folder._id !== action.payload);
        
        // Clear current folder if it's the deleted one
        if (state.currentFolder && state.currentFolder._id === action.payload) {
          state.currentFolder = null;
        }
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Share folder
      .addCase(shareFolder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(shareFolder.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in folders array
        state.folders = state.folders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update in subfolders array
        state.subfolders = state.subfolders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update current folder if it's the same
        if (state.currentFolder && state.currentFolder._id === action.payload.folder._id) {
          state.currentFolder = action.payload.folder;
        }
      })
      .addCase(shareFolder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Remove share
      .addCase(removeShare.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeShare.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in folders array
        state.folders = state.folders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update in subfolders array
        state.subfolders = state.subfolders.map(folder => 
          folder._id === action.payload.folder._id
            ? action.payload.folder
            : folder
        );
        
        // Update current folder if it's the same
        if (state.currentFolder && state.currentFolder._id === action.payload.folder._id) {
          state.currentFolder = action.payload.folder;
        }
      })
      .addCase(removeShare.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearFoldersError,
  clearCurrentFolder,
  setFolderPath,
  addToFolderPath,
  removeLastFromFolderPath
} = foldersSlice.actions;

export default foldersSlice.reducer; 