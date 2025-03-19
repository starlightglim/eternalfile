import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

// Icons
import { 
  Folder, 
  MoreVertical, 
  Trash, 
  Edit, 
  Share2
} from 'lucide-react';

const FolderCard = ({ folder }) => {
  const navigate = useNavigate();
  
  // Handle click to navigate to folder
  const handleClick = () => {
    navigate(`/folders/${folder._id}`);
  };
  
  // Get folder color or default
  const folderColor = folder.color || '#CCCCCC';
  
  return (
    <div 
      className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      {/* Folder header with color */}
      <div 
        className="h-2" 
        style={{ backgroundColor: folderColor }}
      ></div>
      
      <div className="p-4">
        <div className="flex items-start">
          {/* Folder icon */}
          <div 
            className="p-2 rounded-md mr-3" 
            style={{ backgroundColor: `${folderColor}20` }} // 20% opacity version of the color
          >
            <Folder size={24} style={{ color: folderColor }} />
          </div>
          
          {/* Folder info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 truncate pr-2">
                {folder.name}
                {folder.isDefault && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Default</span>
                )}
              </h3>
              
              {/* Actions dropdown (stop propagation to prevent navigation) */}
              <div onClick={(e) => e.stopPropagation()}>
                <div className="relative group">
                  <button className="p-1 rounded-full hover:bg-gray-100">
                    <MoreVertical size={16} className="text-gray-600" />
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 hidden group-hover:block z-10">
                    <div className="py-1">
                      <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Edit size={14} className="mr-2" />
                        Edit
                      </button>
                      {!folder.isDefault && (
                        <button className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <Share2 size={14} className="mr-2" />
                          Share
                        </button>
                      )}
                      {!folder.isDefault && (
                        <button className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                          <Trash size={14} className="mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Folder description */}
            {folder.description && (
              <p className="text-sm text-gray-500 mt-1 truncate">
                {folder.description}
              </p>
            )}
            
            {/* Folder stats */}
            <div className="flex items-center mt-3 text-xs text-gray-500">
              <div className="flex items-center mr-4">
                <span className="font-medium">Boards:</span>
                <span className="ml-1">{folder.boards?.length || 0}</span>
              </div>
              <div className="flex items-center">
                <span className="font-medium">Images:</span>
                <span className="ml-1">{folder.images?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

FolderCard.propTypes = {
  folder: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    color: PropTypes.string,
    isDefault: PropTypes.bool,
    boards: PropTypes.array,
    images: PropTypes.array
  }).isRequired
};

export default FolderCard; 