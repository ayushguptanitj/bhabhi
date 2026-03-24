const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @GET /api/users/reviewers  — List all reviewers (chair)
router.get('/reviewers', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const reviewers = await User.find({ role: 'reviewer', isActive: true })
      .select('name email affiliation expertise bio createdAt');
    res.json({ reviewers });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/authors  — List all authors (chair)
router.get('/authors', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const authors = await User.find({ role: 'author', isActive: true })
      .select('name email affiliation createdAt');
    res.json({ authors });
  } catch (err) {
    next(err);
  }
});

// @PUT /api/users/profile  — Update own profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, affiliation, bio, expertise } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (affiliation !== undefined) updates.affiliation = affiliation;
    if (bio !== undefined) updates.bio = bio;
    if (Array.isArray(expertise)) updates.expertise = expertise;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
});

// @GET /api/users/:id  — Get user profile (chair)
router.get('/:id', protect, authorize('chairperson'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
