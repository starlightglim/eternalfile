import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

// Icons
import { 
  Eye, 
  Clock, 
  Lock, 
  Globe, 
  MoreVertical,
  Trash,
  Edit,
  Copy,
  Star
} from 'lucide-react';

const BoardCard = ({ board }) => {
  const navigate = useNavigate();
  
  // Format date
  const formattedDate = board.updatedAt 
    ? formatDistanceToNow(new Date(board.updatedAt), { addSuffix: true })
    : 'Unknown date';
  
  // Handle click to navigate to board
  const handleClick = () => {
    navigate(`/boards/${board._id}`);
  };
  
  return (
    <div 
      className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* Board preview */}
      <div className="h-36 bg-gray-100 relative">
        {/* If we have images, show them in a grid */}
        {board.images && board.images.length > 0 ? (
          <div className="grid grid-cols-2 grid-rows-2 h-full">
            {board.images.slice(0, 4).map((image, index) => (
              <div key={index} className="overflow-hidden">
                <img 
                  src={image.thumbnail || image.url} 
                  alt={`Board preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* Fill empty slots with gray boxes */}
            {Array.from({ length: Math.max(0, 4 - (board.images?.length || 0)) }).map((_, index) => (
              <div key={`empty-${index}`} className="bg-gray-200"></div>
            ))}
          </div>
        ) : (
          // No images, show placeholder
          <div className="flex items-center justify-center h-full bg-gray-200 text-gray-400">
            No images yet
          </div>
        )}
        
        {/* Privacy indicator */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-80 rounded-full p-1">
          {board.isPublic ? (
            <Globe size={16} className="text-green-600" />
          ) : (
            <Lock size={16} className="text-gray-600" />
          )}
        </div>
        
        {/* Actions dropdown (stop propagation to prevent navigation) */}
        <div className="absolute top-2 right-2">
          <div className="relative group" onClick={(e) => e.stopPropagation()}>
            <button className="bg-white bg-opacity-80 rounded-full p-1 hover:bg-opacity-100">
              <MoreVertical size={16} className="text-gray-600" />
            </button>
            
            {/* Dropdown menu */}
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
              <div className="py-1">
                <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Edit size={14} className="mr-2" />
                  Edit
                </button>
                <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Star size={14} className="mr-2" />
                  Favorite
                </button>
                <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Copy size={14} className="mr-2" />
                  Duplicate
                </button>
                <button className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                  <Trash size={14} className="mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Board info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate">{board.title}</h3>
        
        {/* Board metadata */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center">
            <Clock size={12} className="mr-1" />
            <span>{formattedDate}</span>
          </div>
          
          <div className="flex items-center">
            <Eye size={12} className="mr-1" />
            <span>{board.viewCount || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

BoardCard.propTypes = {
  board: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    isPublic: PropTypes.bool,
    viewCount: PropTypes.number,
    updatedAt: PropTypes.string,
    images: PropTypes.array
  }).isRequired
};

export default BoardCard; 