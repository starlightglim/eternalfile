const express = require('express');
const router = express.Router();

// Generate combined image
router.post('/combine', (req, res) => {
  setTimeout(() => {
    res.status(200).json({ 
      message: 'Images combined successfully', 
      resultImage: '/api/placeholder/800/600'
    });
  }, 1500); // Simulate processing time
});

// Image suggestion
router.post('/suggest', (req, res) => {
  setTimeout(() => {
    res.status(200).json({
      suggestions: [
        '/api/placeholder/400/300',
        '/api/placeholder/400/400',
        '/api/placeholder/300/400'
      ]
    });
  }, 1000); // Simulate processing time
});

module.exports = router; 