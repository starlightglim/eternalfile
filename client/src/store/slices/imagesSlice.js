import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Development mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

// Mock data for development
const MOCK_IMAGES = [
  {
    _id: 'mock-image-1',
    url: 'https://source.unsplash.com/random/800x600?nature',
    thumbnail: 'https://source.unsplash.com/random/300x200?nature',
    title: 'Nature Image',
    description: 'A beautiful nature scene',
    position: { x: 100, y: 100, z: 0 },
    dimensions: { width: 300, height: 200 },
    tags: ['nature', 'landscape'],
    boardId: 'mock-board-1',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
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
    boardId: 'mock-board-1',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
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
    boardId: 'mock-board-1',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
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
    boardId: 'mock-board-1',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
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
    boardId: 'mock-board-1',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
    createdAt: new Date().toISOString()
  }
];

const MOCK_AI_IMAGES = [
  {
    _id: 'mock-ai-image-1',
    url: 'https://source.unsplash.com/random/800x600?ai',
    thumbnail: 'https://source.unsplash.com/random/300x200?ai',
    title: 'AI Generated Landscape',
    description: 'A landscape created with AI',
    position: { x: 100, y: 100, z: 0 },
    dimensions: { width: 300, height: 200 },
    tags: ['ai', 'landscape', 'generated'],
    boardId: 'mock-board-2',
    owner: {
      _id: 'mock-user-id',
      username: '@demouser'
    },
    isAIGenerated: true,
    sourceImages: ['mock-image-1', 'mock-image-2'],
    createdAt: new Date().toISOString()
  }
];

// Async thunks
export const fetchImages = createAsyncThunk(
  'images/fetchImages',
  async (boardId, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Using mock images data');
      // Filter images by boardId if provided
      const images = boardId 
        ? MOCK_IMAGES.filter(img => img.boardId === boardId)
        : MOCK_IMAGES;
      return { images };
    }
    
    try {
      const response = await axios.get(`${API_URL}/images?boardId=${boardId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch images');
    }
  }
);

export const fetchImageById = createAsyncThunk(
  'images/fetchImageById',
  async (imageId, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Using mock image data');
      const image = [...MOCK_IMAGES, ...MOCK_AI_IMAGES].find(img => img._id === imageId);
      if (image) {
        return { image };
      }
      return rejectWithValue('Image not found');
    }
    
    try {
      const response = await axios.get(`${API_URL}/images/${imageId}`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch image');
    }
  }
);

export const uploadImage = createAsyncThunk(
  'images/uploadImage',
  async ({ formData, onProgress }, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Creating mock image');
      
      // Simulate upload progress
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 10;
          onProgress(progress);
          if (progress >= 100) {
            clearInterval(interval);
          }
        }, 200);
      }
      
      // Create a mock image
      const newImage = {
        _id: `mock-image-${Date.now()}`,
        url: 'https://source.unsplash.com/random/800x600?uploaded',
        thumbnail: 'https://source.unsplash.com/random/300x200?uploaded',
        title: formData.get('title') || 'Uploaded Image',
        description: formData.get('description') || 'A newly uploaded image',
        position: { 
          x: Math.floor(Math.random() * 500), 
          y: Math.floor(Math.random() * 500), 
          z: 0 
        },
        dimensions: { width: 300, height: 200 },
        tags: formData.get('tags') ? formData.get('tags').split(',') : ['uploaded'],
        boardId: formData.get('boardId'),
        owner: {
          _id: 'mock-user-id',
          username: '@demouser'
        },
        createdAt: new Date().toISOString()
      };
      
      // Wait a bit to simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { image: newImage };
    }
    
    try {
      const response = await axios.post(`${API_URL}/images/upload`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload image');
    }
  }
);

export const updateImage = createAsyncThunk(
  'images/updateImage',
  async ({ imageId, imageData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/images/${imageId}`, imageData, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update image');
    }
  }
);

export const updateImagePosition = createAsyncThunk(
  'images/updateImagePosition',
  async ({ imageId, position }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/images/${imageId}/position`, position, {
        withCredentials: true
      });
      
      return {
        imageId,
        position: response.data.position
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update image position');
    }
  }
);

export const deleteImage = createAsyncThunk(
  'images/deleteImage',
  async (imageId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_URL}/images/${imageId}`, {
        withCredentials: true
      });
      
      return imageId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete image');
    }
  }
);

export const combineImages = createAsyncThunk(
  'images/combineImages',
  async ({ imageIds, boardId, position, title }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/combine/merge`, {
        imageIds,
        boardId,
        position,
        title
      }, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to combine images');
    }
  }
);

export const fetchAIGeneratedImages = createAsyncThunk(
  'images/fetchAIGeneratedImages',
  async (_, { rejectWithValue }) => {
    // In development mode with mock auth, return mock data
    if (DEV_MODE && localStorage.getItem('token') === 'mock-token') {
      console.log('Development mode: Using mock AI-generated images data');
      return { images: MOCK_AI_IMAGES };
    }
    
    try {
      const response = await axios.get(`${API_URL}/combine/ai-generated`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch AI-generated images');
    }
  }
);

export const fetchImageHistory = createAsyncThunk(
  'images/fetchImageHistory',
  async (imageId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/combine/${imageId}/history`, {
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch image history');
    }
  }
);

// Initial state
const initialState = {
  images: [],
  aiGeneratedImages: [],
  currentImage: null,
  imageHistory: null,
  selectedImages: [],
  loading: false,
  error: null,
  processingStatus: {
    isProcessing: false,
    progress: 0,
    jobId: null,
    status: null,
    error: null
  }
};

// Images slice
const imagesSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    clearImagesError: (state) => {
      state.error = null;
    },
    clearCurrentImage: (state) => {
      state.currentImage = null;
    },
    selectImage: (state, action) => {
      const imageId = action.payload;
      
      // If not already selected, add to selection
      if (!state.selectedImages.includes(imageId)) {
        state.selectedImages.push(imageId);
      }
    },
    deselectImage: (state, action) => {
      const imageId = action.payload;
      state.selectedImages = state.selectedImages.filter(id => id !== imageId);
    },
    toggleImageSelection: (state, action) => {
      const imageId = action.payload;
      
      if (state.selectedImages.includes(imageId)) {
        state.selectedImages = state.selectedImages.filter(id => id !== imageId);
      } else {
        state.selectedImages.push(imageId);
      }
    },
    clearImageSelection: (state) => {
      state.selectedImages = [];
    },
    updateImagePositionLocally: (state, action) => {
      const { imageId, position } = action.payload;
      
      state.images = state.images.map(image => 
        image._id === imageId
          ? { ...image, position: { ...image.position, ...position } }
          : image
      );
      
      if (state.currentImage && state.currentImage._id === imageId) {
        state.currentImage = {
          ...state.currentImage,
          position: { ...state.currentImage.position, ...position }
        };
      }
    },
    setProcessingStatus: (state, action) => {
      state.processingStatus = {
        ...state.processingStatus,
        ...action.payload
      };
    },
    resetProcessingStatus: (state) => {
      state.processingStatus = {
        isProcessing: false,
        progress: 0,
        jobId: null,
        status: null,
        error: null
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch images
      .addCase(fetchImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImages.fulfilled, (state, action) => {
        state.loading = false;
        state.images = action.payload.images;
      })
      .addCase(fetchImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch image by ID
      .addCase(fetchImageById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImageById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentImage = action.payload.image;
      })
      .addCase(fetchImageById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Upload image
      .addCase(uploadImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        state.loading = false;
        state.images.push(action.payload.image);
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update image
      .addCase(updateImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateImage.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update in images array
        state.images = state.images.map(image => 
          image._id === action.payload.image._id
            ? action.payload.image
            : image
        );
        
        // Update current image if it's the same
        if (state.currentImage && state.currentImage._id === action.payload.image._id) {
          state.currentImage = action.payload.image;
        }
      })
      .addCase(updateImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update image position
      .addCase(updateImagePosition.fulfilled, (state, action) => {
        const { imageId, position } = action.payload;
        
        // Update in images array
        state.images = state.images.map(image => 
          image._id === imageId
            ? { ...image, position }
            : image
        );
        
        // Update current image if it's the same
        if (state.currentImage && state.currentImage._id === imageId) {
          state.currentImage = {
            ...state.currentImage,
            position
          };
        }
      })
      
      // Delete image
      .addCase(deleteImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.loading = false;
        state.images = state.images.filter(image => image._id !== action.payload);
        
        // Remove from selected images
        state.selectedImages = state.selectedImages.filter(id => id !== action.payload);
        
        // Clear current image if it's the deleted one
        if (state.currentImage && state.currentImage._id === action.payload) {
          state.currentImage = null;
        }
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Combine images
      .addCase(combineImages.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.processingStatus.isProcessing = true;
        state.processingStatus.status = 'started';
      })
      .addCase(combineImages.fulfilled, (state, action) => {
        state.loading = false;
        state.images.push(action.payload);
        state.processingStatus.isProcessing = false;
        state.processingStatus.status = 'completed';
        state.processingStatus.progress = 100;
      })
      .addCase(combineImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.processingStatus.isProcessing = false;
        state.processingStatus.status = 'error';
        state.processingStatus.error = action.payload;
      })
      
      // Fetch AI-generated images
      .addCase(fetchAIGeneratedImages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAIGeneratedImages.fulfilled, (state, action) => {
        state.loading = false;
        state.aiGeneratedImages = action.payload.images;
      })
      .addCase(fetchAIGeneratedImages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch image history
      .addCase(fetchImageHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchImageHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.imageHistory = action.payload;
      })
      .addCase(fetchImageHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearImagesError,
  clearCurrentImage,
  selectImage,
  deselectImage,
  toggleImageSelection,
  clearImageSelection,
  updateImagePositionLocally,
  setProcessingStatus,
  resetProcessingStatus
} = imagesSlice.actions;

export default imagesSlice.reducer; 