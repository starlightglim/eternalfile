const express = require('express');
const router = express.Router();

// Upload file
router.post('/upload', (req, res) => {
  res.status(201).json({ 
    message: 'File uploaded successfully', 
    file: { id: '1', url: '/api/placeholder/500/400' }
  });
});

// Get file by ID
router.get('/:id', (req, res) => {
  res.status(200).json({ 
    file: { id: req.params.id, url: '/api/placeholder/500/400' }
  });
});

// Delete file
router.delete('/:id', (req, res) => {
  res.status(200).json({ message: 'File deleted' });
});

module.exports = router; 