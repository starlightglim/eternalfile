import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoardById } from '../store/slices/boardsSlice';
import { fetchImages, clearImageSelection } from '../store/slices/imagesSlice';
import socketService from '../services/socketService';

// Components
import MacOSImageBoard from '../components/ImageBoard';
import ImageCombiner from '../components/ImageCombiner';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

// Icons
import { Share2, Settings, Users, Lock, Globe } from 'lucide-react';

// Development mode flag
const DEV_MODE = process.env.NODE_ENV === 'development';

const BoardView = () => {
  const { boardId } = useParams();
  const dispatch = useDispatch();
  
  const [showImageCombiner, setShowImageCombiner] = useState(false);
  
  const { currentBoard, loading: boardLoading, error: boardError } = useSelector(state => state.boards);
  const { images, selectedImages, loading: imagesLoading, error: imagesError } = useSelector(state => state.images);
  const { user } = useSelector(state => state.auth);
  
  // Fetch board and images data
  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(boardId));
      dispatch(fetchImages(boardId));
      dispatch(clearImageSelection());
      
      // Join socket room for this board
      socketService.joinBoard(boardId);
      
      // Leave socket room when unmounting
      return () => {
        socketService.leaveBoard(boardId);
      };
    }
  }, [boardId, dispatch]);
  
  // Check if user is the owner of the board
  const isOwner = currentBoard && user && (
    // Handle both real data and mock data structures
    (currentBoard.userId && currentBoard.userId._id === user.id) || 
    (currentBoard.owner && currentBoard.owner._id === user.id)
  );
  
  // Check if user is a collaborator
  const isCollaborator = currentBoard && user && 
    Array.isArray(currentBoard.collaborators) && 
    currentBoard.collaborators.some(
      collab => {
        // Handle both real data and mock data structures
        const collaboratorId = collab.userId || collab._id;
        return collaboratorId === user.id;
      }
    );
  
  // Handle opening image combiner
  const handleOpenImageCombiner = () => {
    if (selectedImages.length >= 2) {
      setShowImageCombiner(true);
    }
  };
  
  // Handle closing image combiner
  const handleCloseImageCombiner = () => {
    setShowImageCombiner(false);
  };
  
  // Loading state
  if (boardLoading || imagesLoading) {
    return <LoadingSpinner />;
  }
  
  // Error state
  if (boardError || imagesError) {
    return <ErrorMessage message={boardError || imagesError} />;
  }
  
  // No board found
  if (!currentBoard) {
    return <ErrorMessage message="Board not found" />;
  }
  
  // Get collaborator count safely
  const collaboratorCount = Array.isArray(currentBoard.collaborators) 
    ? currentBoard.collaborators.length + 1 
    : 1;
  
  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="bg-white rounded-md shadow-sm p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{currentBoard.title}</h1>
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <span className="flex items-center">
                {currentBoard.isPublic ? (
                  <Globe size={14} className="mr-1" />
                ) : (
                  <Lock size={14} className="mr-1" />
                )}
                {currentBoard.isPublic ? 'Public' : 'Private'}
              </span>
              <span className="mx-2">•</span>
              <span className="flex items-center">
                <Users size={14} className="mr-1" />
                {collaboratorCount} {collaboratorCount === 1 ? 'User' : 'Users'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {isOwner && (
              <>
                <button className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 text-sm">
                  <Settings size={16} className="mr-1.5" />
                  Settings
                </button>
                <button className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-1.5 text-sm">
                  <Share2 size={16} className="mr-1.5" />
                  Share
                </button>
              </>
            )}
            {selectedImages.length >= 2 && (
              <button 
                onClick={handleOpenImageCombiner}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-3 py-1.5 text-sm"
              >
                Combine Selected ({selectedImages.length})
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Image board */}
      <div className="flex-1 bg-white rounded-md shadow-sm overflow-hidden">
        <MacOSImageBoard 
          images={images}
          boardId={boardId}
          isOwner={isOwner}
          isCollaborator={isCollaborator}
          selectedImages={selectedImages}
        />
      </div>
      
      {/* Image combiner modal */}
      {showImageCombiner && (
        <ImageCombiner 
          onClose={handleCloseImageCombiner}
          boardId={boardId}
        />
      )}
    </div>
  );
};

export default BoardView; 