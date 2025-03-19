import { useState } from 'react';

// useDraggable.js
export const useDraggable = (initialPosition, onPositionChange) => {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  
  // Mouse event handlers
  // Real-time position updates
  
  return {
    position,
    handleMouseDown,
    isDragging
  };
}; 