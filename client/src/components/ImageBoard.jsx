import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { X, User, Upload, Search, Grid, ChevronDown, ImagePlus } from 'lucide-react';
import { updateImagePositionLocally, selectImage, deselectImage, toggleImageSelection, clearImageSelection } from '../store/slices/imagesSlice';
import socketService from '../services/socketService';

const MacOSImageBoard = ({ images = [], boardId, isOwner, isCollaborator, selectedImages = [] }) => {
  const dispatch = useDispatch();
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMergePanel, setShowMergePanel] = useState(false);
  
  // Use local state for image positions during dragging
  const [localImages, setLocalImages] = useState([]);
  
  // Update local images when props change
  useEffect(() => {
    setLocalImages(images.map(img => ({
      ...img,
      id: img._id,
      src: img.url || img.thumbnail,
      x: img.position?.x || 100,
      y: img.position?.y || 100,
      width: img.dimensions?.width || 300,
      height: img.dimensions?.height || 200,
      title: img.title || 'Untitled'
    })));
  }, [images]);
  
  const handleMouseDown = (e, id) => {
    const image = localImages.find(img => img.id === id);
    if (!image) return;
    
    setDragging(id);
    setDragOffset({
      x: e.clientX - (image.x || 0),
      y: e.clientY - (image.y || 0)
    });
    
    if (!selectedImages.includes(id)) {
      dispatch(selectImage(id));
    }
    
    e.preventDefault();
  };
  
  const handleMouseMove = (e) => {
    if (dragging) {
      const updatedImages = localImages.map(img => {
        if (img.id === dragging) {
          return {
            ...img,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
          };
        }
        return img;
      });
      setLocalImages(updatedImages);
    }
  };
  
  const handleMouseUp = () => {
    if (dragging) {
      const draggedImage = localImages.find(img => img.id === dragging);
      if (draggedImage) {
        // Update position in Redux store
        dispatch(updateImagePositionLocally({
          imageId: dragging,
          position: { x: draggedImage.x, y: draggedImage.y }
        }));
        
        // Send position update to server via socket
        socketService.sendImageMove(boardId, dragging, { 
          x: draggedImage.x, 
          y: draggedImage.y 
        });
      }
    }
    setDragging(null);
  };
  
  const handleImageSelect = (id, e) => {
    if (e.ctrlKey || e.metaKey) {
      dispatch(toggleImageSelection(id));
    } else {
      dispatch(clearImageSelection());
      dispatch(selectImage(id));
    }
  };
  
  const handleMergeImages = () => {
    if (selectedImages.length >= 2) {
      setShowMergePanel(true);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Toolbar */}
      <div className="flex items-center bg-gray-200 border-b border-gray-300 p-2">
        <button className="flex items-center bg-gray-300 hover:bg-gray-400 rounded px-2 py-1 text-sm mr-2">
          <Upload size={16} className="mr-1" /> Upload
        </button>
        <button 
          className={`flex items-center ${selectedImages.length >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300 opacity-50'} rounded px-2 py-1 text-sm mr-2`}
          onClick={handleMergeImages}
          disabled={selectedImages.length < 2}
        >
          <ImagePlus size={16} className="mr-1" /> Merge Selected
        </button>
        <div className="flex items-center bg-white rounded border border-gray-400 px-2 py-1 ml-auto">
          <Search size={16} className="text-gray-500 mr-1" />
          <input type="text" placeholder="Search" className="bg-transparent outline-none text-sm w-40" />
        </div>
        <div className="flex items-center ml-2">
          <button className="bg-gray-300 hover:bg-gray-400 p-1 rounded">
            <Grid size={16} />
          </button>
        </div>
      </div>
      
      {/* Canvas Area */}
      <div 
        className="flex-1 bg-white relative overflow-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {localImages.map((image) => (
          <div
            key={image.id}
            className={`absolute cursor-move shadow-md rounded border-2 ${selectedImages.includes(image.id) ? 'border-blue-500' : 'border-transparent'}`}
            style={{
              left: `${image.x}px`,
              top: `${image.y}px`,
              width: `${image.width}px`,
              height: `${image.height}px`,
            }}
            onMouseDown={(e) => handleMouseDown(e, image.id)}
            onClick={(e) => handleImageSelect(image.id, e)}
          >
            <img 
              src={image.src} 
              alt={image.title}
              className="w-full h-full object-cover rounded"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-1 text-xs">
              {image.title}
            </div>
          </div>
        ))}
        
        {localImages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="mb-2">No images in this board yet</p>
              {(isOwner || isCollaborator) && (
                <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                  Upload an image
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Merge Panel */}
      {showMergePanel && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="bg-gray-200 rounded-lg w-1/2 border border-gray-400 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-300 p-2">
              <h3 className="font-bold">AI Image Merge</h3>
              <button onClick={() => setShowMergePanel(false)} className="p-1 hover:bg-gray-300 rounded">
                <X size={16} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex justify-center space-x-4 mb-4">
                {selectedImages.map(id => {
                  const img = localImages.find(i => i.id === id);
                  return img ? (
                    <div key={id} className="border border-gray-400 rounded">
                      <img 
                        src={img.src} 
                        alt={img.title} 
                        className="w-32 h-32 object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                        }}
                      />
                    </div>
                  ) : null;
                })}
              </div>
              
              <div className="text-center mb-4">
                <div className="font-bold mb-2">Result Preview</div>
                <div className="border-2 border-dashed border-gray-400 rounded h-64 flex items-center justify-center bg-gray-100">
                  <div className="text-gray-500">AI-generated result will appear here</div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <button 
                  className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
                  onClick={() => setShowMergePanel(false)}
                >
                  Cancel
                </button>
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                  Generate & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacOSImageBoard; 