import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { hideToast } from '../../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';

// Icons
import { 
  CheckCircle, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  X
} from 'lucide-react';

const Toast = ({ open, message, type = 'info', duration = 3000 }) => {
  const dispatch = useDispatch();
  
  // Auto-hide toast after duration
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [open, duration, dispatch]);
  
  // Handle close
  const handleClose = () => {
    dispatch(hideToast());
  };
  
  // Get icon and color based on type
  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle size={20} />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={20} />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      case 'info':
      default:
        return {
          icon: <Info size={20} />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
    }
  };
  
  const { icon, bgColor, textColor, borderColor } = getToastStyles();
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50"
        >
          <div className={`flex items-center p-3 rounded-md shadow-md border ${bgColor} ${textColor} ${borderColor}`}>
            <div className="mr-3">
              {icon}
            </div>
            <div className="mr-8">
              {message}
            </div>
            <button 
              onClick={handleClose}
              className="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-20"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

Toast.propTypes = {
  open: PropTypes.bool.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  duration: PropTypes.number
};

export default Toast; 