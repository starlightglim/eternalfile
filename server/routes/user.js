const express = require('express');
const router = express.Router();

// Get user by ID
router.get('/:id', (req, res) => {
  res.status(200).json({ user: { id: req.params.id, name: 'Demo User' } });
});

// Update user profile
router.put('/:id', (req, res) => {
  res.status(200).json({ message: 'User profile updated', user: { id: req.params.id } });
});

module.exports = router; 