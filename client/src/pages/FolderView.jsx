import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFolderById } from '../store/slices/foldersSlice';
import { openModal } from '../store/slices/uiSlice';

// Components
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import BoardCard from '../components/boards/BoardCard';
import FolderCard from '../components/folders/FolderCard';

// Icons
import { 
  ChevronRight, 
  Folder, 
  FolderPlus, 
  Plus, 
  Edit, 
  Share2,
  ArrowLeft
} from 'lucide-react';

const FolderView = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { 
    currentFolder, 
    subfolders, 
    loading, 
    error 
  } = useSelector(state => state.folders);
  
  // Fetch folder data
  useEffect(() => {
    if (folderId) {
      dispatch(fetchFolderById(folderId));
    }
  }, [folderId, dispatch]);
  
  // Handle creating a new board
  const handleCreateBoard = () => {
    dispatch(openModal({ 
      modal: 'createBoard',
      data: { folderId }
    }));
  };
  
  // Handle creating a new subfolder
  const handleCreateSubfolder = () => {
    dispatch(openModal({ 
      modal: 'createFolder',
      data: { parentId: folderId }
    }));
  };
  
  // Handle going back
  const handleGoBack = () => {
    if (currentFolder?.parentId) {
      navigate(`/folders/${currentFolder.parentId}`);
    } else {
      navigate('/dashboard');
    }
  };
  
  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Error state
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // No folder found
  if (!currentFolder) {
    return <ErrorMessage message="Folder not found" />;
  }
  
  return (
    <div className="h-full">
      {/* Folder header */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            {/* Breadcrumb navigation */}
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <button 
                onClick={handleGoBack}
                className="flex items-center hover:text-blue-600"
              >
                <ArrowLeft size={14} className="mr-1" />
                Back
              </button>
              
              <ChevronRight size={14} className="mx-2" />
              
              <div className="flex items-center">
                <Folder 
                  size={14} 
                  className="mr-1" 
                  style={{ color: currentFolder.color || '#CCCCCC' }} 
                />
                <span>{currentFolder.name}</span>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold">{currentFolder.name}</h1>
            {currentFolder.description && (
              <p className="text-gray-500 mt-1">{currentFolder.description}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 text-sm">
              <Edit size={16} className="mr-1.5" />
              Edit
            </button>
            
            {!currentFolder.isDefault && (
              <button className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 text-sm">
                <Share2 size={16} className="mr-1.5" />
                Share
              </button>
            )}
            
            <button
              onClick={handleCreateSubfolder}
              className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 text-sm"
            >
              <FolderPlus size={16} className="mr-1.5" />
              New Folder
            </button>
            
            <button
              onClick={handleCreateBoard}
              className="flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm"
            >
              <Plus size={16} className="mr-1.5" />
              New Board
            </button>
          </div>
        </div>
      </div>
      
      {/* Folder content */}
      <div>
        {/* Subfolders section */}
        {subfolders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Subfolders</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {subfolders.map(folder => (
                <FolderCard key={folder._id} folder={folder} />
              ))}
            </div>
          </div>
        )}
        
        {/* Boards section */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Boards</h2>
          {currentFolder.boards && currentFolder.boards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentFolder.boards.map(board => (
                <BoardCard key={board._id} board={board} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-md p-8 text-center">
              <p className="text-gray-500 mb-4">No boards in this folder yet</p>
              <button
                onClick={handleCreateBoard}
                className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2"
              >
                Create Board
              </button>
            </div>
          )}
        </div>
        
        {/* Images section (if any) */}
        {currentFolder.images && currentFolder.images.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Images</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {currentFolder.images.map(image => (
                <div 
                  key={image._id} 
                  className="aspect-square bg-gray-100 rounded-md overflow-hidden border border-gray-200"
                >
                  <img 
                    src={image.thumbnail || image.url} 
                    alt={image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderView; 